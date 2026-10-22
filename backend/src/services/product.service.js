import slugify from 'slugify';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { getPaginationParams, buildPaginationMetadata } from '../utils/pagination.js';
import { escapeRegex } from '../utils/security.js';

/**
 * Safely resolves and orders product images according to an optional manifest,
 * uploaded files, and previously retained images.
 * Guarantees that the first image (index 0) has isPrimary: true, and all others have isPrimary: false.
 * Cleans up newly uploaded images if an error occurs.
 */
async function resolveProductGalleryImages({
  imagesManifestRaw,
  existingImagesRaw,
  newImageFiles = [],
  currentProductImages = [],
}) {
  const newlyUploaded = [];

  try {
    // 1. Upload any new image files received in this request
    const uploadedByFileIndex = [];
    if (newImageFiles && newImageFiles.length > 0) {
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i];
        const uploaded = await cloudinaryService.uploadImage(file.buffer, 'products');
        uploadedByFileIndex.push(uploaded);
        newlyUploaded.push(uploaded);
      }
    }

    let finalImages = [];

    // 2. Parse imagesManifest if provided
    let manifest = null;
    if (imagesManifestRaw !== undefined && imagesManifestRaw !== null && imagesManifestRaw !== '') {
      manifest = typeof imagesManifestRaw === 'string'
        ? JSON.parse(imagesManifestRaw)
        : imagesManifestRaw;

      if (!Array.isArray(manifest)) {
        throw new Error('imagesManifest must be a valid JSON array');
      }
    }

    if (manifest && manifest.length > 0) {
      // Validate manifest entries and map according to specified order
      let autoNewIndex = 0;
      for (let i = 0; i < manifest.length; i++) {
        const entry = manifest[i];
        if (!entry || typeof entry !== 'object') {
          throw new Error(`Invalid manifest item at index ${i}`);
        }

        if (entry.type === 'existing') {
          if (!entry.url || typeof entry.url !== 'string') {
            throw new Error(`Existing image in manifest at index ${i} is missing a valid URL`);
          }
          finalImages.push({
            url: entry.url,
            publicId: entry.publicId || '',
            isPrimary: i === 0,
          });
        } else if (entry.type === 'new') {
          const targetIndex = entry.fileIndex !== undefined ? Number(entry.fileIndex) : autoNewIndex++;
          if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= uploadedByFileIndex.length) {
            throw new Error(`Manifest references invalid image fileIndex ${entry.fileIndex}`);
          }
          const uploaded = uploadedByFileIndex[targetIndex];
          if (!uploaded) {
            throw new Error(`Missing uploaded file for manifest entry at index ${i}`);
          }
          finalImages.push({
            url: uploaded.url,
            publicId: uploaded.publicId || '',
            isPrimary: i === 0,
          });
        } else {
          throw new Error(`Unknown image type "${entry.type}" in manifest at index ${i}`);
        }
      }
    } else {
      // Fallback / legacy path:
      let retained = [];
      if (existingImagesRaw !== undefined) {
        retained = typeof existingImagesRaw === 'string'
          ? JSON.parse(existingImagesRaw)
          : existingImagesRaw;
        if (!Array.isArray(retained)) {
          retained = [];
        }
      } else {
        retained = currentProductImages || [];
      }

      finalImages = [
        ...retained.map((img) => ({
          url: img.url,
          publicId: img.publicId || '',
          isPrimary: false,
        })),
        ...newlyUploaded.map((img) => ({
          url: img.url,
          publicId: img.publicId || '',
          isPrimary: false,
        })),
      ];
    }

    // Ensure isPrimary is strictly true ONLY for index 0 (if images exist)
    finalImages = finalImages.map((img, idx) => ({
      url: img.url,
      publicId: img.publicId || '',
      isPrimary: idx === 0,
    }));

    return {
      finalImages,
      newlyUploaded,
    };
  } catch (err) {
    // Cleanup any newly uploaded Cloudinary images to prevent orphans on failure
    for (const up of newlyUploaded) {
      if (up.publicId) {
        await cloudinaryService.deleteImage(up.publicId).catch(() => {});
      }
    }
    throw err;
  }
}

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
      const safeKeyword = escapeRegex(keyword.trim());
      query.$or = [
        { name: { $regex: safeKeyword, $options: 'i' } },
        { shortDescription: { $regex: safeKeyword, $options: 'i' } },
        { sku: { $regex: safeKeyword, $options: 'i' } },
        { tags: { $in: [new RegExp(safeKeyword, 'i')] } },
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

    const { page: pageNum, limit: limitNum, skip } = getPaginationParams(queryParams, {
      defaultLimit: 12,
      maxLimit: 100,
    });

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
      pagination: buildPaginationMetadata(total, pageNum, limitNum),
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

    // Resolve images safely with manifest and upload handling
    const { finalImages, newlyUploaded } = await resolveProductGalleryImages({
      imagesManifestRaw: productData.imagesManifest,
      existingImagesRaw: productData.existingImages,
      newImageFiles: imageFiles,
      currentProductImages: [],
    });

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

    try {
      const product = await Product.create({
        ...productData,
        brand: brandId,
        slug,
        images: finalImages,
        variants: parsedVariants,
        ingredients: parsedIngredients,
        nutritionInformation: parsedNutrition,
        tags: parsedTags.map(t => t.toLowerCase().trim()),
      });

      return product;
    } catch (saveErr) {
      for (const up of newlyUploaded) {
        if (up.publicId) {
          await cloudinaryService.deleteImage(up.publicId).catch(() => {});
        }
      }
      throw saveErr;
    }
  },

  /**
   * Update existing product
   */
  updateProduct: async (id, updateData, newImageFiles = []) => {
    const product = await Product.findById(id);
    if (!product) throw new Error('Product not found');

    const originalImages = [...(product.images || []).map((img) => ({
      url: img.url,
      publicId: img.publicId || '',
    }))];

    if (updateData.name && updateData.name !== product.name) {
      let slug = slugify(updateData.name, { lower: true, strict: true });
      const existingSlug = await Product.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) slug = `${slug}-${Date.now().toString().slice(-4)}`;
      product.name = updateData.name;
      product.slug = slug;
    }

    // Resolve gallery images
    let newlyUploaded = [];
    const hasImageUpdates =
      updateData.imagesManifest !== undefined ||
      updateData.existingImages !== undefined ||
      (newImageFiles && newImageFiles.length > 0);

    if (hasImageUpdates) {
      const resolved = await resolveProductGalleryImages({
        imagesManifestRaw: updateData.imagesManifest,
        existingImagesRaw: updateData.existingImages,
        newImageFiles,
        currentProductImages: product.images,
      });
      product.images = resolved.finalImages;
      newlyUploaded = resolved.newlyUploaded;
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
    if (updateData.attributes !== undefined) product.attributes = updateData.attributes;
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

    try {
      await product.save();
    } catch (saveErr) {
      // Rollback newly uploaded images from Cloudinary
      for (const up of newlyUploaded) {
        if (up.publicId) {
          await cloudinaryService.deleteImage(up.publicId).catch(() => {});
        }
      }
      throw saveErr;
    }

    // If save succeeded and images were updated, delete only images that were genuinely removed
    if (hasImageUpdates) {
      const retainedPublicIds = new Set(
        product.images.map((img) => img.publicId).filter(Boolean)
      );
      const retainedUrls = new Set(
        product.images.map((img) => img.url).filter(Boolean)
      );

      for (const oldImg of originalImages) {
        const isRetained =
          (oldImg.publicId && retainedPublicIds.has(oldImg.publicId)) ||
          (oldImg.url && retainedUrls.has(oldImg.url));

        if (!isRetained && oldImg.publicId) {
          try {
            await cloudinaryService.deleteImage(oldImg.publicId);
          } catch (delErr) {
            console.warn(`[Cloudinary Cleanup] Failed to delete removed image ${oldImg.publicId}:`, delErr.message);
          }
        }
      }
    }

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
