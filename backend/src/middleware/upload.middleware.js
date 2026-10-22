import multer from 'multer';
import path from 'path';
import { isValidImageBuffer } from '../utils/security.js';

// Use memory storage so we can stream buffer directly to Cloudinary or process in memory
const storage = multer.memoryStorage();

// NP-SEC-08: Strictly allow JPEG, PNG, and WebP. Block SVG and other executable/scriptable formats.
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new Error('Unsupported file format. Only authentic JPG, PNG, and WebP images are allowed. SVG and other file types are strictly prohibited.'),
      false
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per image
  },
  fileFilter,
});

/**
 * NP-SEC-08: Middleware to inspect actual file buffers and verify authentic image magic numbers
 */
export const validateImageFileSignatures = (req, res, next) => {
  const filesToCheck = [];

  if (req.file) {
    filesToCheck.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      filesToCheck.push(...req.files);
    } else if (typeof req.files === 'object') {
      Object.values(req.files).forEach((f) => {
        if (Array.isArray(f)) {
          filesToCheck.push(...f);
        } else if (f) {
          filesToCheck.push(f);
        }
      });
    }
  }

  for (const file of filesToCheck) {
    if (!file.buffer || !isValidImageBuffer(file.buffer)) {
      return res.status(400).json({
        success: false,
        message: `File '${file.originalname || 'upload'}' does not contain a valid JPEG, PNG, or WebP image signature.`,
      });
    }
  }

  next();
};
