import express from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { upload, validateImageFileSignatures } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin Category Routes
router.post('/', protect, adminOnly, upload.single('image'), validateImageFileSignatures, createCategory);
router.put('/:id', protect, adminOnly, upload.single('image'), validateImageFileSignatures, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;
