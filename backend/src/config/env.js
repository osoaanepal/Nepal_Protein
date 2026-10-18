import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory or cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SITE_URL: process.env.SITE_URL || '',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/osoaa_db',
  JWT_SECRET: process.env.JWT_SECRET || 'osoaa_production_ready_jwt_secret_token_2026_fitness_wellness',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_EXPIRES_IN_DAYS: parseInt(process.env.COOKIE_EXPIRES_IN_DAYS || '7', 10),
  
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.EMAIL_FROM || '"Nepal Protein" <osoaanepal@gmail.com>',
  },
  
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  },
  
  ESEWA: {
    PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
    SECRET_KEY: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    PAYMENT_URL: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    VERIFY_URL: process.env.ESEWA_VERIFY_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/',
  },

  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || '',
    PASSWORD: process.env.ADMIN_PASSWORD || '',
    NAME: process.env.ADMIN_NAME || 'Nepal Protein Administrator',
    PHONE: process.env.ADMIN_PHONE || '+977-9801234567',
  }
};
