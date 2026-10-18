import slugify from 'slugify';
import { BlogPost } from '../models/BlogPost.js';
import { cloudinaryService } from './cloudinary.service.js';

// Helper to calculate reading time from text/content
const calculateReadingTime = (text = '') => {
  const plainText = text.replace(/<[^>]*>?/gm, '');
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / 180);
  return Math.max(1, minutes);
};

// Generate unique slug
const generateUniqueSlug = async (title, currentId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  if (!baseSlug) {
    baseSlug = `post-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (currentId) {
      query._id = { $ne: currentId };
    }
    const existing = await BlogPost.findOne(query);
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

export const blogService = {
  /**
   * Get public blog posts with filtering, searching, and pagination
   */
  getPublicPosts: async (queryParams = {}) => {
    const {
      category,
      contentType,
      tag,
      search,
      keyword,
      page = 1,
      limit = 9,
      sort = 'newest',
    } = queryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
    const skip = (pageNum - 1) * limitNum;

    // Base filter: Only published posts with publishedAt in the past/present
    const filter = {
      status: 'published',
      publishedAt: { $lte: new Date() },
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (contentType && contentType !== 'all') {
      filter.contentType = contentType;
    }

    if (tag) {
      filter.tags = tag;
    }

    const searchTerm = search || keyword;
    if (searchTerm && searchTerm.trim()) {
      const regex = new RegExp(searchTerm.trim(), 'i');
      filter.$or = [
        { title: regex },
        { excerpt: regex },
        { content: regex },
        { tags: regex },
      ];
    }

    // Sort order
    let sortOptions = { publishedAt: -1, createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { publishedAt: 1, createdAt: 1 };
    } else if (sort === 'popular' || sort === 'views') {
      sortOptions = { views: -1, publishedAt: -1 };
    } else if (sort === 'readingTime') {
      sortOptions = { readingTime: 1 };
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .select('-content') // Light payload for listing
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BlogPost.countDocuments(filter),
    ]);

    return {
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Get featured posts for public hero/highlight section
   */
  getFeaturedPosts: async (limit = 4) => {
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 4));
    const filter = {
      status: 'published',
      isFeatured: true,
      publishedAt: { $lte: new Date() },
    };

    const posts = await BlogPost.find(filter)
      .select('-content')
      .sort({ publishedAt: -1 })
      .limit(limitNum)
      .lean();

    return posts;
  },

  /**
   * Get single public post by slug and fetch related posts
   */
  getPublicPostBySlug: async (slug) => {
    const post = await BlogPost.findOne({
      slug,
      status: 'published',
      publishedAt: { $lte: new Date() },
    });

    if (!post) {
      return null;
    }

    // Atomic increment of view count
    await BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } });

    // Find related posts (same category or common tags, excluding current post)
    const relatedFilter = {
      _id: { $ne: post._id },
      status: 'published',
      publishedAt: { $lte: new Date() },
      $or: [
        { category: post.category },
        ...(post.tags && post.tags.length > 0 ? [{ tags: { $in: post.tags } }] : []),
      ],
    };

    const relatedPosts = await BlogPost.find(relatedFilter)
      .select('title slug excerpt category contentType featuredImage publishedAt readingTime difficulty preparationTime cookingTime')
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    return {
      post,
      relatedPosts,
    };
  },

  /**
   * Admin: Get all posts with full filters and pagination
   */
  getAdminPosts: async (queryParams = {}) => {
    const {
      category,
      status,
      contentType,
      isFeatured,
      keyword,
      search,
      page = 1,
      limit = 15,
      sort = 'newest',
    } = queryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (contentType && contentType !== 'all') {
      filter.contentType = contentType;
    }

    if (isFeatured !== undefined && isFeatured !== 'all') {
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    const searchTerm = search || keyword;
    if (searchTerm && searchTerm.trim()) {
      const regex = new RegExp(searchTerm.trim(), 'i');
      filter.$or = [
        { title: regex },
        { excerpt: regex },
        { slug: regex },
        { tags: regex },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    else if (sort === 'popular') sortOptions = { views: -1 };
    else if (sort === 'publishedAt') sortOptions = { publishedAt: -1 };

    const [posts, total, stats] = await Promise.all([
      BlogPost.find(filter)
        .select('-content')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BlogPost.countDocuments(filter),
      BlogPost.aggregate([
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            publishedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] },
            },
            draftCount: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
            },
            nepaliCount: {
              $sum: { $cond: [{ $eq: ['$category', 'nepali-blog'] }, 1, 0] },
            },
            englishCount: {
              $sum: { $cond: [{ $eq: ['$category', 'english-blog'] }, 1, 0] },
            },
            recipesCount: {
              $sum: { $cond: [{ $eq: ['$category', 'recipes'] }, 1, 0] },
            },
            totalViews: { $sum: '$views' },
          },
        },
      ]),
    ]);

    return {
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      stats: stats[0] || {
        totalPosts: 0,
        publishedCount: 0,
        draftCount: 0,
        nepaliCount: 0,
        englishCount: 0,
        recipesCount: 0,
        totalViews: 0,
      },
    };
  },

  /**
   * Admin: Get single post by ID
   */
  getPostById: async (id) => {
    return await BlogPost.findById(id);
  },

  /**
   * Admin: Create new blog post
   */
  createPost: async (postData, files) => {
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category,
      contentType,
      videoUrl,
      videoDuration,
      author,
      tags,
      status,
      isFeatured,
      publishedAt,
      readingTime,
      seoTitle,
      seoDescription,
      seoKeywords,
      preparationTime,
      cookingTime,
      servings,
      difficulty,
      ingredients,
      instructions,
      nutritionInformation,
    } = postData;

    if (!title || !title.trim()) {
      throw new Error('Title is required');
    }

    if (!category || !['nepali-blog', 'english-blog', 'recipes'].includes(category)) {
      throw new Error('Valid category is required (nepali-blog, english-blog, recipes)');
    }

    // Generate or format unique slug
    const generatedSlug = customSlug && customSlug.trim()
      ? await generateUniqueSlug(customSlug)
      : await generateUniqueSlug(title);

    // Handle featured image upload
    let featuredImage = { url: '', publicId: '' };
    if (files?.featuredImage && files.featuredImage[0]) {
      featuredImage = await cloudinaryService.uploadImage(
        files.featuredImage[0].buffer,
        'blogs'
      );
    } else if (postData.featuredImageUrl) {
      featuredImage = {
        url: postData.featuredImageUrl,
        publicId: postData.featuredImagePublicId || '',
      };
    }

    // Video Thumbnail upload if provided
    let videoThumbnail = { url: '', publicId: '' };
    if (files?.videoThumbnail && files.videoThumbnail[0]) {
      videoThumbnail = await cloudinaryService.uploadImage(
        files.videoThumbnail[0].buffer,
        'blogs/video_thumbs'
      );
    }

    // Parse JSON fields if received as string (multipart form data)
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    let parsedSeoKeywords = seoKeywords;
    if (typeof seoKeywords === 'string') {
      try {
        parsedSeoKeywords = JSON.parse(seoKeywords);
      } catch {
        parsedSeoKeywords = seoKeywords.split(',').map((k) => k.trim()).filter(Boolean);
      }
    }

    let parsedAuthor = author;
    if (typeof author === 'string') {
      try {
        parsedAuthor = JSON.parse(author);
      } catch {
        parsedAuthor = { name: author, role: 'Editorial Team', avatar: '' };
      }
    }

    let parsedIngredients = ingredients;
    if (typeof ingredients === 'string') {
      try {
        parsedIngredients = JSON.parse(ingredients);
      } catch {
        parsedIngredients = [];
      }
    }

    let parsedInstructions = instructions;
    if (typeof instructions === 'string') {
      try {
        parsedInstructions = JSON.parse(instructions);
      } catch {
        parsedInstructions = [];
      }
    }

    let parsedNutrition = nutritionInformation;
    if (typeof nutritionInformation === 'string') {
      try {
        parsedNutrition = JSON.parse(nutritionInformation);
      } catch {
        parsedNutrition = {};
      }
    }

    const calculatedReadingTime = readingTime
      ? parseInt(readingTime, 10)
      : calculateReadingTime(content);

    const newPost = await BlogPost.create({
      title: title.trim(),
      slug: generatedSlug,
      excerpt: excerpt ? excerpt.trim() : '',
      content: content || '',
      category,
      contentType: contentType || 'article',
      featuredImage,
      videoUrl: videoUrl || '',
      videoThumbnail,
      videoDuration: videoDuration || '',
      author: parsedAuthor || { name: 'OSOAA Nutrition Team', role: 'Editorial Team' },
      tags: parsedTags || [],
      status: status || 'draft',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      publishedAt: publishedAt ? new Date(publishedAt) : (status === 'published' ? new Date() : undefined),
      readingTime: calculatedReadingTime,
      seoTitle: seoTitle || title.trim(),
      seoDescription: seoDescription || (excerpt ? excerpt.trim() : ''),
      seoKeywords: parsedSeoKeywords || [],
      preparationTime: preparationTime || '',
      cookingTime: cookingTime || '',
      servings: servings || '',
      difficulty: difficulty || 'Easy',
      ingredients: parsedIngredients || [],
      instructions: parsedInstructions || [],
      nutritionInformation: parsedNutrition || {},
    });

    return newPost;
  },

  /**
   * Admin: Update existing blog post
   */
  updatePost: async (id, postData, files) => {
    const post = await BlogPost.findById(id);
    if (!post) {
      throw new Error('Blog post not found');
    }

    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      category,
      contentType,
      videoUrl,
      videoDuration,
      author,
      tags,
      status,
      isFeatured,
      publishedAt,
      readingTime,
      seoTitle,
      seoDescription,
      seoKeywords,
      preparationTime,
      cookingTime,
      servings,
      difficulty,
      ingredients,
      instructions,
      nutritionInformation,
    } = postData;

    if (title && title.trim()) {
      post.title = title.trim();
    }

    if (customSlug && customSlug.trim() && customSlug.trim() !== post.slug) {
      post.slug = await generateUniqueSlug(customSlug.trim(), post._id);
    }

    if (excerpt !== undefined) post.excerpt = excerpt.trim();
    if (content !== undefined) post.content = content;
    if (category) post.category = category;
    if (contentType) post.contentType = contentType;
    if (videoUrl !== undefined) post.videoUrl = videoUrl;
    if (videoDuration !== undefined) post.videoDuration = videoDuration;
    if (status) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }
    if (isFeatured !== undefined) {
      post.isFeatured = isFeatured === 'true' || isFeatured === true;
    }
    if (publishedAt) {
      post.publishedAt = new Date(publishedAt);
    }
    if (readingTime) {
      post.readingTime = parseInt(readingTime, 10);
    } else if (content) {
      post.readingTime = calculateReadingTime(content);
    }

    if (seoTitle !== undefined) post.seoTitle = seoTitle;
    if (seoDescription !== undefined) post.seoDescription = seoDescription;
    if (preparationTime !== undefined) post.preparationTime = preparationTime;
    if (cookingTime !== undefined) post.cookingTime = cookingTime;
    if (servings !== undefined) post.servings = servings;
    if (difficulty !== undefined) post.difficulty = difficulty;

    // Handle files upload
    if (files?.featuredImage && files.featuredImage[0]) {
      if (post.featuredImage?.publicId) {
        await cloudinaryService.deleteImage(post.featuredImage.publicId);
      }
      post.featuredImage = await cloudinaryService.uploadImage(
        files.featuredImage[0].buffer,
        'blogs'
      );
    } else if (postData.featuredImageUrl !== undefined) {
      post.featuredImage = {
        url: postData.featuredImageUrl,
        publicId: postData.featuredImagePublicId || '',
      };
    }

    if (files?.videoThumbnail && files.videoThumbnail[0]) {
      if (post.videoThumbnail?.publicId) {
        await cloudinaryService.deleteImage(post.videoThumbnail.publicId);
      }
      post.videoThumbnail = await cloudinaryService.uploadImage(
        files.videoThumbnail[0].buffer,
        'blogs/video_thumbs'
      );
    }

    // Parse JSON arrays/objects
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        try {
          post.tags = JSON.parse(tags);
        } catch {
          post.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      } else {
        post.tags = tags;
      }
    }

    if (seoKeywords !== undefined) {
      if (typeof seoKeywords === 'string') {
        try {
          post.seoKeywords = JSON.parse(seoKeywords);
        } catch {
          post.seoKeywords = seoKeywords.split(',').map((k) => k.trim()).filter(Boolean);
        }
      } else {
        post.seoKeywords = seoKeywords;
      }
    }

    if (author !== undefined) {
      if (typeof author === 'string') {
        try {
          post.author = JSON.parse(author);
        } catch {
          post.author = { name: author, role: 'Editorial Team', avatar: '' };
        }
      } else {
        post.author = author;
      }
    }

    if (ingredients !== undefined) {
      if (typeof ingredients === 'string') {
        try {
          post.ingredients = JSON.parse(ingredients);
        } catch {
          post.ingredients = [];
        }
      } else {
        post.ingredients = ingredients;
      }
    }

    if (instructions !== undefined) {
      if (typeof instructions === 'string') {
        try {
          post.instructions = JSON.parse(instructions);
        } catch {
          post.instructions = [];
        }
      } else {
        post.instructions = instructions;
      }
    }

    if (nutritionInformation !== undefined) {
      if (typeof nutritionInformation === 'string') {
        try {
          post.nutritionInformation = JSON.parse(nutritionInformation);
        } catch {
          post.nutritionInformation = {};
        }
      } else {
        post.nutritionInformation = nutritionInformation;
      }
    }

    await post.save();
    return post;
  },

  /**
   * Admin: Delete blog post
   */
  deletePost: async (id) => {
    const post = await BlogPost.findById(id);
    if (!post) {
      throw new Error('Blog post not found');
    }

    // Clean up images from Cloudinary
    if (post.featuredImage?.publicId) {
      await cloudinaryService.deleteImage(post.featuredImage.publicId);
    }
    if (post.videoThumbnail?.publicId) {
      await cloudinaryService.deleteImage(post.videoThumbnail.publicId);
    }

    await BlogPost.deleteOne({ _id: id });
    return { success: true };
  },

  /**
   * Admin: Toggle or set publish status
   */
  setPublishStatus: async (id, status) => {
    const post = await BlogPost.findById(id);
    if (!post) {
      throw new Error('Blog post not found');
    }

    post.status = status;
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }
    await post.save();
    return post;
  },

  /**
   * Admin: Toggle featured status
   */
  toggleFeatured: async (id) => {
    const post = await BlogPost.findById(id);
    if (!post) {
      throw new Error('Blog post not found');
    }

    post.isFeatured = !post.isFeatured;
    await post.save();
    return post;
  },
};
