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
import { upload, validateImageFileSignatures } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellerProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/:slug', getProductBySlug);

// Admin Product Routes
router.post('/', protect, adminOnly, upload.array('images', 8), validateImageFileSignatures, createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 8), validateImageFileSignatures, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
