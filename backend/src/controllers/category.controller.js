import slugify from 'slugify';
import { Category } from '../models/Category.js';
import { cloudinaryService } from '../services/cloudinary.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, displayOrder, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists' });
    }

    let image = { url: '', publicId: '' };
    if (req.file) {
      image = await cloudinaryService.uploadImage(req.file.buffer, 'categories');
    }

    const category = await Category.create({
      name,
      slug,
      description: description || '',
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      image,
    });

    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, displayOrder, isActive } = req.body;

    if (name && name !== category.name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }

    if (description !== undefined) category.description = description;
    if (displayOrder !== undefined) category.displayOrder = parseInt(displayOrder, 10);
    if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      if (category.image?.publicId) {
        await cloudinaryService.deleteImage(category.image.publicId);
      }
      category.image = await cloudinaryService.uploadImage(req.file.buffer, 'categories');
    }

    await category.save();
    res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.image?.publicId) {
      await cloudinaryService.deleteImage(category.image.publicId);
    }

    await Category.deleteOne({ _id: category._id });
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
