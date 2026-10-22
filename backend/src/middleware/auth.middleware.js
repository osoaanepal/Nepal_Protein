import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';

/**
 * Protect routes: verify JWT from cookie or Authorization Bearer header
 */
export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    // NP-SEC-14: Invalidate token if password was changed after token issuance
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        code: 'PASSWORD_CHANGED',
        message: 'Password was recently changed. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

/**
 * Restrict to specific roles (e.g. admin)
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to perform this action.',
      });
    }
    next();
  };
};

/**
 * Convenience helper for admin only
 */
export const adminOnly = restrictTo('admin');

/**
 * Require verified email
 */
export const requireVerified = (req, res, next) => {
  if (!req.user.emailVerified && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address to access this feature.',
    });
  }
  next();
};

/**
 * Optional authentication: attaches req.user if a valid token/session exists,
 * but allows unauthenticated guest requests to proceed as guests without error.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next();
    }
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
    }
    next();
  } catch (err) {
    // If token is invalid or expired, continue as guest
    next();
  }
};
