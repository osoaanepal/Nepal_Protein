import express from 'express';
import {
  getPublicSettings,
  updateBusinessSettings,
  getDeliveryCharges,
  updateDeliveryCharges,
} from '../controllers/settings.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/public', getPublicSettings);
router.get('/delivery-charges', getDeliveryCharges);
router.put('/delivery-charges', protect, adminOnly, updateDeliveryCharges);
router.put('/', protect, adminOnly, upload.single('logo'), updateBusinessSettings);

export default router;
