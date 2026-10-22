import express from 'express';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon.controller.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.middleware.js';
import { couponRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// NP-SEC-11: Dedicated rate limiter and optional authentication for coupon validation
router.post('/validate', couponRateLimiter, optionalAuth, validateCoupon);

// Admin Coupon Routes
router.get('/', protect, adminOnly, getCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

export default router;
