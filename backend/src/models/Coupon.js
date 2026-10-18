import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide a coupon code'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, 'Please provide discount value'],
    min: 1,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    default: 0, // 0 = no cap
    min: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide expiration date'],
  },
  usageLimit: {
    type: Number,
    default: 0, // 0 = unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  perUserLimit: {
    type: Number,
    default: 1,
  },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  }
}, {
  timestamps: true,
});

export const Coupon = mongoose.model('Coupon', couponSchema);
