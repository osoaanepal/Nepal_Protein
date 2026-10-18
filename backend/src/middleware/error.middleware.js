import { ENV } from '../config/env.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid ID: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for '${field}'. Please provide a unique value.`;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {}).map((val) => val.message).join(', ');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Common authentication / permission message mapping
  if (message === 'Invalid email or password.') {
    statusCode = 401;
  } else if (message.includes('Authentication required')) {
    statusCode = 401;
  } else if (message.includes('deactivated') || message.includes('Access denied')) {
    statusCode = 403;
  }

  if (ENV.NODE_ENV === 'development' && statusCode === 500) {
    console.error(`[Server Error 500 on ${req.method} ${req.originalUrl}]:`, err);
  }

  const response = {
    success: false,
    message,
    ...(err.code ? { code: err.code } : {}),
    ...(err.email ? { email: err.email } : {}),
    ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(response);
};
