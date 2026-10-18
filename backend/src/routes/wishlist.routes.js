import express from 'express';
import {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getWishlist);
router.post('/toggle', protect, toggleWishlist);
router.delete('/:productId', protect, removeFromWishlist);

export default router;
