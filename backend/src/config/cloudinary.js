import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';

if (ENV.CLOUDINARY.CLOUD_NAME && ENV.CLOUDINARY.API_KEY && ENV.CLOUDINARY.API_SECRET) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY.CLOUD_NAME,
    api_key: ENV.CLOUDINARY.API_KEY,
    api_secret: ENV.CLOUDINARY.API_SECRET,
    secure: true,
  });
}

export default cloudinary;
