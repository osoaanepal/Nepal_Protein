import slugify from 'slugify';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { cloudinaryService } from './cloudinary.service.js';

export const brandService = {
  /**
   * Get all brands with optional search, filtering, and associated product counts
   */
  getBrands: async (queryParams = {}) => {
    const {
      includeInactive = false,
      search,
      isFeatured,
      limit,
      page = 1,
      sortBy = 'name-asc',
    } = queryParams;

    const query = {};

    if (!includeInactive || includeInactive === 'false') {
      query.isActive = true;
    }

    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    let sortOptions = { name: 1 };
    if (sortBy === 'newest') sortOptions = { createdAt: -1 };
    else if (sortBy === 'name-desc') sortOptions = { name: -1 };

    let brandDocs;
    let total = 0;

    if (limit) {
      const limitNum = parseInt(limit, 10) || 20;
      const pageNum = parseInt(page, 10) || 1;
      const skip = (pageNum - 1) * limitNum;

      [brandDocs, total] = await Promise.all([
        Brand.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
        Brand.countDocuments(query),
      ]);
    } else {
      brandDocs = await Brand.find(query).sort(sortOptions).lean();
      total = brandDocs.length;
    }

    // Attach product counts to each brand efficiently in a single aggregation
    const brandIds = brandDocs.map((b) => b._id);
    const productCounts = await Product.aggregate([
      { $match: { brand: { $in: brandIds } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    productCounts.forEach((pc) => {
      countMap.set(pc._id.toString(), pc.count);
    });

    const brandsWithCounts = brandDocs.map((b) => ({
      ...b,
      productCount: countMap.get(b._id.toString()) || 0,
    }));

    return {
      brands: brandsWithCounts,
      total,
    };
  },

  /**
   * Get single brand by slug or ID
   */
  getBrandBySlugOrId: async (identifier, includeInactive = false) => {
    const isId = identifier && identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: identifier } : { slug: identifier.toLowerCase().trim() };

    if (!includeInactive) {
      query.isActive = true;
    }

    const brand = await Brand.findOne(query).lean();
    if (!brand) return null;

    const productCount = await Product.countDocuments({ brand: brand._id });
    return { ...brand, productCount };
  },

  /**
   * Create a new Brand
   */
  createBrand: async (brandData, logoFile = null) => {
    const trimmedName = (brandData.name || '').trim();
    if (!trimmedName) {
      const err = new Error('Brand name is required');
      err.statusCode = 400;
      throw err;
    }

    // Check duplicate name (case-insensitive)
    const existingName = await Brand.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });
    if (existingName) {
      const err = new Error(`A brand with the name "${trimmedName}" already exists`);
      err.statusCode = 400;
      throw err;
    }

    // Generate unique slug
    let baseSlug = brandData.slug ? slugify(brandData.slug, { lower: true, strict: true }) : slugify(trimmedName, { lower: true, strict: true });
    if (!baseSlug) baseSlug = 'brand';
    let slug = baseSlug;
    let counter = 1;
    while (await Brand.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Upload logo if provided
    let logo = { url: '', publicId: '' };
    if (logoFile && logoFile.buffer) {
      const uploaded = await cloudinaryService.uploadImage(logoFile.buffer, 'brands');
      logo = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
    } else if (brandData.logoUrl) {
      logo = { url: brandData.logoUrl, publicId: '' };
    }

    const brand = await Brand.create({
      name: trimmedName,
      slug,
      logo,
      description: (brandData.description || '').trim(),
      website: (brandData.website || '').trim(),
      isActive: brandData.isActive !== undefined ? (brandData.isActive === 'true' || brandData.isActive === true) : true,
      isFeatured: brandData.isFeatured === 'true' || brandData.isFeatured === true,
      seoTitle: (brandData.seoTitle || '').trim(),
      seoDescription: (brandData.seoDescription || '').trim(),
    });

    return brand;
  },

  /**
   * Update an existing Brand
   */
  updateBrand: async (id, updateData, logoFile = null) => {
    const brand = await Brand.findById(id);
    if (!brand) {
      const err = new Error('Brand not found');
      err.statusCode = 404;
      throw err;
    }

    if (updateData.name && updateData.name.trim() !== brand.name) {
      const trimmedName = updateData.name.trim();
      const existingName = await Brand.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });
      if (existingName) {
        const err = new Error(`Another brand with the name "${trimmedName}" already exists`);
        err.statusCode = 400;
        throw err;
      }
      brand.name = trimmedName;

      // Update slug if user did not provide a custom one
      if (!updateData.slug) {
        let baseSlug = slugify(trimmedName, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        while (await Brand.findOne({ slug, _id: { $ne: id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        brand.slug = slug;
      }
    }

    if (updateData.slug) {
      const cleanSlug = slugify(updateData.slug, { lower: true, strict: true });
      const existingSlug = await Brand.findOne({ slug: cleanSlug, _id: { $ne: id } });
      if (existingSlug) {
        const err = new Error(`The slug "${cleanSlug}" is already in use by another brand`);
        err.statusCode = 400;
        throw err;
      }
      brand.slug = cleanSlug;
    }

    if (logoFile && logoFile.buffer) {
      if (brand.logo?.publicId) {
        try {
          await cloudinaryService.deleteImage(brand.logo.publicId);
        } catch (err) {
          console.warn('[Brand Logo Update] Old logo deletion skipped:', err.message);
        }
      }
      const uploaded = await cloudinaryService.uploadImage(logoFile.buffer, 'brands');
      brand.logo = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
    } else if (updateData.logoUrl !== undefined) {
      brand.logo = { url: updateData.logoUrl, publicId: brand.logo?.publicId || '' };
    }

    if (updateData.description !== undefined) brand.description = updateData.description.trim();
    if (updateData.website !== undefined) brand.website = updateData.website.trim();
    if (updateData.isActive !== undefined) {
      brand.isActive = updateData.isActive === 'true' || updateData.isActive === true;
    }
    if (updateData.isFeatured !== undefined) {
      brand.isFeatured = updateData.isFeatured === 'true' || updateData.isFeatured === true;
    }
    if (updateData.seoTitle !== undefined) brand.seoTitle = updateData.seoTitle.trim();
    if (updateData.seoDescription !== undefined) brand.seoDescription = updateData.seoDescription.trim();

    await brand.save();
    return brand;
  },

  /**
   * Delete brand with strict safeguards against orphaning products
   */
  deleteBrand: async (id) => {
    const brand = await Brand.findById(id);
    if (!brand) {
      const err = new Error('Brand not found');
      err.statusCode = 404;
      throw err;
    }

    const associatedProductsCount = await Product.countDocuments({ brand: id });
    if (associatedProductsCount > 0) {
      const err = new Error(
        `Cannot permanently delete brand "${brand.name}". It is associated with ${associatedProductsCount} products. Please reassign those products first, or deactivate the brand.`
      );
      err.statusCode = 400;
      throw err;
    }

    if (brand.logo?.publicId) {
      try {
        await cloudinaryService.deleteImage(brand.logo.publicId);
      } catch (err) {
        console.warn('[Brand Delete] Logo deletion skipped:', err.message);
      }
    }

    await Brand.deleteOne({ _id: id });
    return true;
  },

  /**
   * Toggle Brand active status
   */
  toggleBrandStatus: async (id) => {
    const brand = await Brand.findById(id);
    if (!brand) throw new Error('Brand not found');

    brand.isActive = !brand.isActive;
    await brand.save();
    return brand;
  },
};
