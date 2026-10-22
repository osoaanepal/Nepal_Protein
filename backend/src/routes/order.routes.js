import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  trackOrderByNumber,
} from '../controllers/order.controller.js';
import { protect, requireVerified } from '../middleware/auth.middleware.js';
import { orderTrackRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// NP-SEC-12: Rate-limit public order tracking endpoint
router.get('/track', orderTrackRateLimiter, trackOrderByNumber);
router.post('/checkout', protect, requireVerified, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.post('/:id/cancel', protect, cancelMyOrder);

export default router;
