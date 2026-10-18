import express from 'express';
import {
  getDashboardAnalytics,
  getAdminOrders,
  updateOrderStatusAdmin,
  getAdminCustomers,
  toggleCustomerActive,
} from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/analytics/dashboard', getDashboardAnalytics);
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatusAdmin);
router.get('/customers', getAdminCustomers);
router.put('/customers/:id/toggle-active', toggleCustomerActive);

export default router;
