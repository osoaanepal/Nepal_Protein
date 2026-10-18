import express from 'express';
import {
  getProductReviews,
  createProductReview,
  getAllReviewsAdmin,
  updateReviewStatus,
  deleteReview,
} from '../controllers/review.controller.js';
import { protect, adminOnly, requireVerified } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', protect, requireVerified, createProductReview);

// Admin review management
router.get('/admin/all', protect, adminOnly, getAllReviewsAdmin);
router.put('/admin/:id/status', protect, adminOnly, updateReviewStatus);
router.delete('/admin/:id', protect, adminOnly, deleteReview);

export default router;
