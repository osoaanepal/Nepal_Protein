import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory or cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isTestEnv = nodeEnv === 'test' || Boolean(process.env.JEST_WORKER_ID) || Boolean(process.env.TEST_SUITE);

// NP-SEC-01: Validate JWT_SECRET safely without hardcoded fallback secrets
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isTestEnv) {
    // Safe mock secret solely for isolated test suites that intentionally mock authentication
    jwtSecret = 'mock_test_jwt_secret_key_minimum_32_characters_long_for_tests';
  } else {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing.\n' +
      'You must configure a strong secret (at least 32 characters) in your environment.\n' +
      'Hardcoded fallback secrets have been removed for security.'
    );
  }
} else if (nodeEnv === 'production' && jwtSecret.length < 32) {
  throw new Error(
    'FATAL CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters long in production mode.'
  );
}

// NP-SEC-01 / NP-SEC-03: Validate eSewa Secret Key in production
let esewaSecretKey = process.env.ESEWA_SECRET_KEY;
if (!esewaSecretKey) {
  if (nodeEnv === 'production') {
    throw new Error('FATAL CONFIGURATION ERROR: ESEWA_SECRET_KEY must be configured in production environment.');
  }
  // Sandbox test key permitted only in non-production environments
  esewaSecretKey = '8gBm/:&EnhH.1/q';
}

export const ENV = {
  NODE_ENV: nodeEnv,
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SITE_URL: process.env.SITE_URL || '',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/osoaa_db',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_EXPIRES_IN_DAYS: parseInt(process.env.COOKIE_EXPIRES_IN_DAYS || '7', 10),
  
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  RESEND_FROM: process.env.RESEND_FROM || 'Nepal Protein <onboarding@resend.dev>',

  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '465', 10),
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
    SECRET_KEY: esewaSecretKey,
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
