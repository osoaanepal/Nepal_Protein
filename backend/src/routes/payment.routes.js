import express from 'express';
import { initiateEsewa, verifyEsewa, switchToCod } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/esewa/initiate', protect, initiateEsewa);
router.post('/esewa/verify', verifyEsewa);
router.post('/switch-to-cod', protect, switchToCod);

export default router;
