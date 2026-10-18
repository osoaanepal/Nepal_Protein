import express from 'express';
import {
  getBrands,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus,
} from '../controllers/brand.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:slug', getBrandBySlug);

// Admin brand management routes
router.post('/', protect, adminOnly, upload.single('logo'), createBrand);
router.put('/:id', protect, adminOnly, upload.single('logo'), updateBrand);
router.patch('/:id/toggle-status', protect, adminOnly, toggleBrandStatus);
router.delete('/:id', protect, adminOnly, deleteBrand);

export default router;
