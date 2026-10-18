import express from 'express';
import { submitContactMessage } from '../controllers/contact.controller.js';
import { contactRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

router.post('/', contactRateLimiter, submitContactMessage);

export default router;
