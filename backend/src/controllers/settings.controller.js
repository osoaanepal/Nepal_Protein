import { BusinessSettings } from '../models/BusinessSettings.js';
import { cloudinaryService } from '../services/cloudinary.service.js';

export const getPublicSettings = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }

    // Safe normalization for legacy documents
    if (settings.nablCertification && !settings.dftqcCertification) {
      settings.dftqcCertification = settings.nablCertification;
    }
    if (settings.dftqcCertification && !settings.nablCertification) {
      settings.nablCertification = settings.dftqcCertification;
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryCharges = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }
    const charges = settings.deliverySettings?.districtCharges instanceof Map
      ? Object.fromEntries(settings.deliverySettings.districtCharges)
      : (settings.deliverySettings?.districtCharges || {});
    res.status(200).json({ success: true, data: charges });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryCharges = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }

    const { districtCharges } = req.body;
    if (!districtCharges || typeof districtCharges !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid district charges format. Expected an object of district name to fee mappings.',
      });
    }

    const sanitizedCharges = {};
    for (const [dist, fee] of Object.entries(districtCharges)) {
      if (fee !== '' && fee !== null && fee !== undefined) {
        const numFee = Number(fee);
        if (!isNaN(numFee) && numFee >= 0) {
          sanitizedCharges[dist.trim()] = numFee;
        }
      }
    }

    if (!settings.deliverySettings) {
      settings.deliverySettings = {};
    }
    settings.deliverySettings.districtCharges = sanitizedCharges;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'District delivery charges saved successfully',
      data: sanitizedCharges,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBusinessSettings = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }

    const updates = req.body;

    if (updates.businessName) settings.businessName = updates.businessName;
    if (updates.category) settings.category = updates.category;
    if (updates.tagline) settings.tagline = updates.tagline;

    if (updates.contact) {
      settings.contact = {
        ...settings.contact,
        ...(typeof updates.contact === 'string' ? JSON.parse(updates.contact) : updates.contact)
      };
    }

    if (updates.socialLinks) {
      settings.socialLinks = {
        ...settings.socialLinks,
        ...(typeof updates.socialLinks === 'string' ? JSON.parse(updates.socialLinks) : updates.socialLinks)
      };
    }

    if (updates.deliverySettings) {
      const delivery = typeof updates.deliverySettings === 'string' ? JSON.parse(updates.deliverySettings) : updates.deliverySettings;
      if (!settings.deliverySettings) {
        settings.deliverySettings = {};
      }
      if (delivery.estimatedDays) {
        settings.deliverySettings.estimatedDays = delivery.estimatedDays;
      }
      if (delivery.districtCharges !== undefined) {
        const rawCharges = typeof delivery.districtCharges === 'string'
          ? JSON.parse(delivery.districtCharges)
          : delivery.districtCharges;

        const sanitized = {};
        for (const [dist, fee] of Object.entries(rawCharges || {})) {
          if (fee !== '' && fee !== null && fee !== undefined) {
            const numFee = Number(fee);
            if (!isNaN(numFee) && numFee >= 0) {
              sanitized[dist.trim()] = numFee;
            }
          }
        }
        settings.deliverySettings.districtCharges = sanitized;
      }
    }

    if (updates.paymentSettings) {
      const payment = typeof updates.paymentSettings === 'string' ? JSON.parse(updates.paymentSettings) : updates.paymentSettings;
      settings.paymentSettings = {
        codEnabled: payment.codEnabled ?? settings.paymentSettings.codEnabled,
        esewaEnabled: payment.esewaEnabled ?? settings.paymentSettings.esewaEnabled,
      };
    }

    if (updates.dftqcCertification || updates.nablCertification) {
      const certData = updates.dftqcCertification || updates.nablCertification;
      const certObj = typeof certData === 'string' ? JSON.parse(certData) : certData;
      settings.dftqcCertification = {
        ...settings.dftqcCertification,
        ...certObj,
      };
      settings.nablCertification = {
        ...settings.nablCertification,
        ...certObj,
      };
    }

    if (updates.announcementBar) {
      const ann = typeof updates.announcementBar === 'string' ? JSON.parse(updates.announcementBar) : updates.announcementBar;
      settings.announcementBar = {
        ...settings.announcementBar,
        ...ann,
      };
    }

    // Handle logo upload if provided
    if (req.file) {
      if (settings.logo?.publicId) {
        await cloudinaryService.deleteImage(settings.logo.publicId);
      }
      settings.logo = await cloudinaryService.uploadImage(req.file.buffer, 'brand');
    }

    await settings.save();
    res.status(200).json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    next(error);
  }
};
