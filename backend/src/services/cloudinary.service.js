import cloudinary from '../config/cloudinary.js';
import { ENV } from '../config/env.js';

export const cloudinaryService = {
  /**
   * Upload buffer directly to Cloudinary
   */
  uploadImage: async (fileBuffer, folder = 'osoaa_products') => {
    // If credentials are configured, use Cloudinary
    if (ENV.CLOUDINARY.CLOUD_NAME && ENV.CLOUDINARY.API_KEY && ENV.CLOUDINARY.API_SECRET) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `osoaa/${folder}`,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        );
        uploadStream.end(fileBuffer);
      });
    }

    // Local / Dev Fallback: Create base64 Data URI if Cloudinary is not configured yet
    const base64Data = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    return {
      url: base64Data,
      publicId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };
  },

  /**
   * Delete image from Cloudinary by public ID
   */
  deleteImage: async (publicId) => {
    if (!publicId || publicId.startsWith('local_')) return { result: 'ok' };
    if (ENV.CLOUDINARY.CLOUD_NAME && ENV.CLOUDINARY.API_KEY) {
      return await cloudinary.uploader.destroy(publicId);
    }
    return { result: 'ok' };
  },
};
