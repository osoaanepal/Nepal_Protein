import express from 'express';
import {
  getAdminPosts,
  getAdminPostById,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  toggleFeaturedPost,
} from '../controllers/blog.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Require authenticated admin for all admin blog endpoints
router.use(protect, adminOnly);

router.get('/', getAdminPosts);
router.get('/:id', getAdminPostById);

router.post(
  '/',
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'videoThumbnail', maxCount: 1 },
  ]),
  createPost
);

router.put(
  '/:id',
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'videoThumbnail', maxCount: 1 },
  ]),
  updatePost
);

router.delete('/:id', deletePost);

router.patch('/:id/publish', publishPost);
router.patch('/:id/unpublish', unpublishPost);
router.patch('/:id/feature', toggleFeaturedPost);

export default router;
