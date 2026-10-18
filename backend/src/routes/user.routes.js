import express from 'express';
import {
  updatePassword,
  updateProfile,
  getProfile,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// Require authentication for all user endpoints
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', authRateLimiter, updatePassword);

export default router;
