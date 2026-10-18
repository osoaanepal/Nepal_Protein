import express from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.post('/resend-otp', otpRateLimiter, resendOtp);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', otpRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

export default router;
