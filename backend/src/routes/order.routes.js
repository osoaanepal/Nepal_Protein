import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  trackOrderByNumber,
} from '../controllers/order.controller.js';
import { protect, requireVerified } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/track', trackOrderByNumber);
router.post('/checkout', protect, requireVerified, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.post('/:id/cancel', protect, cancelMyOrder);

export default router;
