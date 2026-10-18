import { blogService } from '../services/blog.service.js';

// ==========================================
// PUBLIC CONTROLLERS
// ==========================================

export const getPublicPosts = async (req, res, next) => {
  try {
    const result = await blogService.getPublicPosts(req.query);
    res.status(200).json({
      success: true,
      count: result.posts.length,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedPosts = async (req, res, next) => {
  try {
    const limit = req.query.limit || 4;
    const posts = await blogService.getFeaturedPosts(limit);
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

export const getPostsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const result = await blogService.getPublicPosts({
      ...req.query,
      category,
    });
    res.status(200).json({
      success: true,
      category,
      count: result.posts.length,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchPosts = async (req, res, next) => {
  try {
    const { q, query, keyword } = req.query;
    const searchTerm = q || query || keyword || '';
    const result = await blogService.getPublicPosts({
      ...req.query,
      search: searchTerm,
    });
    res.status(200).json({
      success: true,
      searchTerm,
      count: result.posts.length,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPostBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await blogService.getPublicPostBySlug(slug);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found or is not currently published',
      });
    }

    res.status(200).json({
      success: true,
      data: result.post,
      relatedPosts: result.relatedPosts,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

export const getAdminPosts = async (req, res, next) => {
  try {
    const result = await blogService.getAdminPosts(req.query);
    res.status(200).json({
      success: true,
      count: result.posts.length,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPostById = async (req, res, next) => {
  try {
    const post = await blogService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }
    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const post = await blogService.createPost(req.body, req.files);
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const post = await blogService.updatePost(req.params.id, req.body, req.files);
    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    await blogService.deletePost(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const publishPost = async (req, res, next) => {
  try {
    const post = await blogService.setPublishStatus(req.params.id, 'published');
    res.status(200).json({
      success: true,
      message: 'Blog post published successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const unpublishPost = async (req, res, next) => {
  try {
    const post = await blogService.setPublishStatus(req.params.id, 'draft');
    res.status(200).json({
      success: true,
      message: 'Blog post moved to drafts',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleFeaturedPost = async (req, res, next) => {
  try {
    const post = await blogService.toggleFeatured(req.params.id);
    res.status(200).json({
      success: true,
      message: `Post ${post.isFeatured ? 'marked as featured' : 'unfeatured'} successfully`,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};
