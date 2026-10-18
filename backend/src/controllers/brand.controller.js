import { brandService } from '../services/brand.service.js';

export const getBrands = async (req, res, next) => {
  try {
    const result = await brandService.getBrands(req.query);
    res.status(200).json({ success: true, data: result.brands, total: result.total });
  } catch (error) {
    next(error);
  }
};

export const getBrandBySlug = async (req, res, next) => {
  try {
    const includeInactive = req.user && req.user.role === 'admin';
    const brand = await brandService.getBrandBySlugOrId(req.params.slug, includeInactive);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const brand = await brandService.createBrand(req.body, req.file);
    res.status(201).json({ success: true, message: 'Brand created successfully', data: brand });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body, req.file);
    res.status(200).json({ success: true, message: 'Brand updated successfully', data: brand });
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    await brandService.deleteBrand(req.params.id);
    res.status(200).json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleBrandStatus = async (req, res, next) => {
  try {
    const brand = await brandService.toggleBrandStatus(req.params.id);
    res.status(200).json({
      success: true,
      message: `Brand ${brand.isActive ? 'activated' : 'deactivated'} successfully`,
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};
