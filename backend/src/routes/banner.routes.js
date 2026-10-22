import express from 'express';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/banner.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { upload, validateImageFileSignatures } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', getBanners);

// Admin Banner Routes
router.post(
  '/',
  protect,
  adminOnly,
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 },
  ]),
  validateImageFileSignatures,
  createBanner
);
router.put(
  '/:id',
  protect,
  adminOnly,
  upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 },
  ]),
  validateImageFileSignatures,
  updateBanner
);
router.delete('/:id', protect, adminOnly, deleteBanner);

export default router;
