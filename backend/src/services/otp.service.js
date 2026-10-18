import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Otp } from '../models/Otp.js';

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;

export const otpService = {
  /**
   * Generate a cryptographically secure 6-digit numeric OTP
   */
  generateNumericOtp: () => {
    // Generate secure random 6-digit number (100000 - 999999)
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    const otp = (100000 + (num % 900000)).toString();
    return otp;
  },

  /**
   * Create and store hashed OTP with expiry and cooldown
   */
  createOtp: async ({ email, purpose }) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if an existing OTP has an active resend cooldown
    const existingOtp = await Otp.findOne({ email: normalizedEmail, purpose });
    if (existingOtp && existingOtp.resendAvailableAt > new Date()) {
      const waitSeconds = Math.ceil((existingOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    // Delete existing OTP record for this purpose if any
    await Otp.deleteMany({ email: normalizedEmail, purpose });

    const rawOtp = otpService.generateNumericOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendAvailableAt = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

    await Otp.create({
      email: normalizedEmail,
      otpHash,
      purpose,
      attempts: 0,
      resendAvailableAt,
      expiresAt,
    });

    return { rawOtp, expiresAt, resendAvailableAt };
  },

  /**
   * Verify an entered OTP against the stored hash
   */
  verifyOtp: async ({ email, otp, purpose }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({ email: normalizedEmail, purpose });
    if (!otpRecord) {
      throw new Error('Verification code has expired or was not requested. Please request a new code.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new Error('Verification code has expired. Please request a new code.');
    }

    if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        await Otp.deleteOne({ _id: otpRecord._id });
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
      }
      await otpRecord.save();
      const remaining = MAX_VERIFICATION_ATTEMPTS - otpRecord.attempts;
      throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Single-use guarantee: Invalidate OTP on successful verification
    await Otp.deleteOne({ _id: otpRecord._id });
    return true;
  }
};
