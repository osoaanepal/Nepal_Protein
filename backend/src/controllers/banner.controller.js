import { Banner } from '../models/Banner.js';
import { cloudinaryService } from '../services/cloudinary.service.js';

export const getBanners = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const banners = await Banner.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: banners.length, data: banners });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, ctaText, ctaLink, badge, displayOrder, isActive } = req.body;

    let desktopImage = { url: '', publicId: '' };
    let mobileImage = { url: '', publicId: '' };

    if (req.files?.desktopImage) {
      desktopImage = await cloudinaryService.uploadImage(req.files.desktopImage[0].buffer, 'banners');
    }
    if (req.files?.mobileImage) {
      mobileImage = await cloudinaryService.uploadImage(req.files.mobileImage[0].buffer, 'banners');
    } else if (desktopImage.url) {
      mobileImage = desktopImage;
    }

    const banner = await Banner.create({
      title,
      subtitle: subtitle || '',
      ctaText: ctaText || 'Shop Now',
      ctaLink: ctaLink || '/shop',
      badge: badge || '',
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      desktopImage,
      mobileImage,
    });

    res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });

    const { title, subtitle, ctaText, ctaLink, badge, displayOrder, isActive } = req.body;

    if (title) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (ctaText !== undefined) banner.ctaText = ctaText;
    if (ctaLink !== undefined) banner.ctaLink = ctaLink;
    if (badge !== undefined) banner.badge = badge;
    if (displayOrder !== undefined) banner.displayOrder = parseInt(displayOrder, 10);
    if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

    if (req.files?.desktopImage) {
      if (banner.desktopImage?.publicId) {
        await cloudinaryService.deleteImage(banner.desktopImage.publicId);
      }
      banner.desktopImage = await cloudinaryService.uploadImage(req.files.desktopImage[0].buffer, 'banners');
    }

    if (req.files?.mobileImage) {
      if (banner.mobileImage?.publicId && banner.mobileImage.publicId !== banner.desktopImage?.publicId) {
        await cloudinaryService.deleteImage(banner.mobileImage.publicId);
      }
      banner.mobileImage = await cloudinaryService.uploadImage(req.files.mobileImage[0].buffer, 'banners');
    }

    await banner.save();
    res.status(200).json({ success: true, message: 'Banner updated successfully', data: banner });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });

    if (banner.desktopImage?.publicId) {
      await cloudinaryService.deleteImage(banner.desktopImage.publicId);
    }
    if (banner.mobileImage?.publicId && banner.mobileImage.publicId !== banner.desktopImage?.publicId) {
      await cloudinaryService.deleteImage(banner.mobileImage.publicId);
    }

    await Banner.deleteOne({ _id: banner._id });
    res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};
