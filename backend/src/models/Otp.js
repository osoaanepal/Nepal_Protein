import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  resendAvailableAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index: auto-deletes document when current time exceeds expiresAt
  }
}, {
  timestamps: true
});

export const Otp = mongoose.model('Otp', otpSchema);
