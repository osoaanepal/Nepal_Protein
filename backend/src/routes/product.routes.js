import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getBestSellerProducts,
  getNewArrivals,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellerProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/:slug', getProductBySlug);

// Admin Product Routes
router.post('/', protect, adminOnly, upload.array('images', 8), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 8), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
