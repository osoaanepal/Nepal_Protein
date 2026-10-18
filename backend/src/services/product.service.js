import slugify from 'slugify';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { cloudinaryService } from '../services/cloudinary.service.js';

export const productService = {
  /**
   * Search and filter products with pagination and aggregation
   */
  getProducts: async (queryParams) => {
    const {
      page = 1,
      limit = 12,
      keyword,
      category,
      brand,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      inStock,
      isFeatured,
      isBestSeller,
      isNewArrival,
      isNew,
      status = 'published',
      tag,
    } = queryParams;

    const query = {};

    if (status !== 'all') {
      query.status = status;
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { shortDescription: { $regex: keyword, $options: 'i' } },
        { sku: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }

    if (category) {
      const catDoc = await Category.findOne({ $or: [{ slug: category }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }] });
      if (catDoc) query.category = catDoc._id;
    }

    if (brand) {
      const brandIdentifiers = brand.split(',').map(b => b.trim()).filter(Boolean);
      const orConditions = brandIdentifiers.map(b => ({
        $or: [
          { slug: b },
          { _id: b.match(/^[0-9a-fA-F]{24}$/) ? b : null }
        ]
      }));
      const brandDocs = await Brand.find({ $or: orConditions });
      if (brandDocs.length > 0) {
        query.brand = { $in: brandDocs.map(b => b._id) };
      }
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    if (isFeatured === 'true') query.isFeatured = true;
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isNewArrival === 'true' || isNew === 'true') query.isNewArrival = true;
    if (tag) query.tags = tag.toLowerCase();

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'price-asc') sortOptions = { price: 1 };
    else if (sortBy === 'price-desc') sortOptions = { price: -1 };
    else if (sortBy === 'rating') sortOptions = { ratingAverage: -1, ratingCount: -1 };
    else if (sortBy === 'popular') sortOptions = { soldCount: -1 };
    else if (sortBy === 'name-asc') sortOptions = { name: 1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo isActive description')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  },

  /**
   * Get single product by slug or ID
   */
  getProductBySlugOrId: async (identifier) => {
    const isId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: identifier } : { slug: identifier };

    const product = await Product.findOne(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo isActive description');

    return product;
  },

  /**
   * Create new product
   */
  createProduct: async (productData, imageFiles = []) => {
    let slug = slugify(productData.name, { lower: true, strict: true });
    let existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Upload images
    const images = [];
    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const uploaded = await cloudinaryService.uploadImage(imageFiles[i].buffer, 'products');
        images.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          isPrimary: i === 0,
        });
      }
    }

    // Parse JSON fields if stringified from multipart form
    const parsedVariants = typeof productData.variants === 'string' ? JSON.parse(productData.variants) : (productData.variants || []);
    const parsedIngredients = typeof productData.ingredients === 'string' ? JSON.parse(productData.ingredients) : (productData.ingredients || []);
    const parsedNutrition = typeof productData.nutritionInformation === 'string' ? JSON.parse(productData.nutritionInformation) : (productData.nutritionInformation || []);
    const parsedTags = typeof productData.tags === 'string' ? JSON.parse(productData.tags) : (productData.tags || []);

    // Resolve brand if slug provided
    let brandId = productData.brand || null;
    if (brandId && typeof brandId === 'string' && !brandId.match(/^[0-9a-fA-F]{24}$/)) {
      const bDoc = await Brand.findOne({ slug: brandId });
      if (bDoc) brandId = bDoc._id;
    }

    const product = await Product.create({
      ...productData,
      brand: brandId,
      slug,
      images,
      variants: parsedVariants,
      ingredients: parsedIngredients,
      nutritionInformation: parsedNutrition,
      tags: parsedTags.map(t => t.toLowerCase().trim()),
    });

    return product;
  },

  /**
   * Update existing product
   */
  updateProduct: async (id, updateData, newImageFiles = []) => {
    const product = await Product.findById(id);
    if (!product) throw new Error('Product not found');

    if (updateData.name && updateData.name !== product.name) {
      let slug = slugify(updateData.name, { lower: true, strict: true });
      const existingSlug = await Product.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) slug = `${slug}-${Date.now().toString().slice(-4)}`;
      product.name = updateData.name;
      product.slug = slug;
    }

    // Handle uploaded new images
    if (newImageFiles && newImageFiles.length > 0) {
      for (const file of newImageFiles) {
        const uploaded = await cloudinaryService.uploadImage(file.buffer, 'products');
        product.images.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          isPrimary: product.images.length === 0,
        });
      }
    }

    // Handle existing images / deleted images if provided
    if (updateData.existingImages) {
      const retainedImages = typeof updateData.existingImages === 'string' ? JSON.parse(updateData.existingImages) : updateData.existingImages;
      product.images = retainedImages;
    }

    if (updateData.sku) product.sku = updateData.sku;
    if (updateData.category) product.category = updateData.category;
    if (updateData.brand !== undefined) {
      if (updateData.brand && typeof updateData.brand === 'string' && !updateData.brand.match(/^[0-9a-fA-F]{24}$/)) {
        const bDoc = await Brand.findOne({ slug: updateData.brand });
        product.brand = bDoc ? bDoc._id : null;
      } else {
        product.brand = updateData.brand || null;
      }
    }
    if (updateData.subCategory !== undefined) product.subCategory = updateData.subCategory;
    if (updateData.shortDescription !== undefined) product.shortDescription = updateData.shortDescription;
    if (updateData.description !== undefined) product.description = updateData.description;
    if (updateData.price !== undefined) product.price = Number(updateData.price);
    if (updateData.compareAtPrice !== undefined) product.compareAtPrice = Number(updateData.compareAtPrice);
    if (updateData.stock !== undefined) product.stock = Number(updateData.stock);
    if (updateData.lowStockThreshold !== undefined) product.lowStockThreshold = Number(updateData.lowStockThreshold);
    if (updateData.usageInstructions !== undefined) product.usageInstructions = updateData.usageInstructions;
    if (updateData.weight !== undefined) product.weight = updateData.weight;
    if (updateData.status !== undefined) product.status = updateData.status;
    if (updateData.isFeatured !== undefined) product.isFeatured = updateData.isFeatured === 'true' || updateData.isFeatured === true;
    if (updateData.isBestSeller !== undefined) product.isBestSeller = updateData.isBestSeller === 'true' || updateData.isBestSeller === true;
    if (updateData.isNewArrival !== undefined || updateData.isNew !== undefined) {
      const val = updateData.isNewArrival !== undefined ? updateData.isNewArrival : updateData.isNew;
      product.isNewArrival = val === 'true' || val === true;
    }

    if (updateData.variants !== undefined) {
      product.variants = typeof updateData.variants === 'string' ? JSON.parse(updateData.variants) : updateData.variants;
    }
    if (updateData.ingredients !== undefined) {
      product.ingredients = typeof updateData.ingredients === 'string' ? JSON.parse(updateData.ingredients) : updateData.ingredients;
    }
    if (updateData.nutritionInformation !== undefined) {
      product.nutritionInformation = typeof updateData.nutritionInformation === 'string' ? JSON.parse(updateData.nutritionInformation) : updateData.nutritionInformation;
    }
    if (updateData.tags !== undefined) {
      const tags = typeof updateData.tags === 'string' ? JSON.parse(updateData.tags) : updateData.tags;
      product.tags = tags.map(t => t.toLowerCase().trim());
    }

    await product.save();
    return product;
  },

  /**
   * Delete product
   */
  deleteProduct: async (id) => {
    const product = await Product.findById(id);
    if (!product) throw new Error('Product not found');

    // Clean up images from Cloudinary
    for (const img of product.images) {
      if (img.publicId) {
        await cloudinaryService.deleteImage(img.publicId);
      }
    }

    await Product.deleteOne({ _id: id });
    return true;
  }
};
