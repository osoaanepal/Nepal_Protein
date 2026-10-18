import express from 'express';
import {
  getPublicPosts,
  getFeaturedPosts,
  getPostsByCategory,
  searchPosts,
  getPostBySlug,
} from '../controllers/blog.controller.js';

const router = express.Router();

// Specific routes before generic slug route
router.get('/featured', getFeaturedPosts);
router.get('/search', searchPosts);
router.get('/category/:category', getPostsByCategory);
router.get('/', getPublicPosts);
router.get('/:slug', getPostBySlug);

export default router;
