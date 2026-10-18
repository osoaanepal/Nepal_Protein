import { Coupon } from '../models/Coupon.js';

export const couponService = {
  /**
   * Validate coupon code against subtotal and user
   */
  validateCoupon: async ({ code, subtotal, userId }) => {
    if (!code) throw new Error('Please enter a coupon code.');

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      throw new Error('Invalid or expired coupon code.');
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      throw new Error('This coupon is not active yet.');
    }

    if (coupon.endDate && coupon.endDate < now) {
      throw new Error('This coupon code has expired.');
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('This coupon code has reached its maximum usage limit.');
    }

    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount of Rs. ${coupon.minOrderAmount} required for this coupon.`);
    }

    if (userId && coupon.perUserLimit > 0) {
      const userUsage = coupon.usedBy.filter(u => u.user && u.user.toString() === userId.toString()).length;
      if (userUsage >= coupon.perUserLimit) {
        throw new Error('You have already redeemed this coupon the maximum allowed times.');
      }
    }

    // Calculate discount amount in NPR
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      isValid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      couponId: coupon._id,
    };
  },

  /**
   * Record coupon redemption
   */
  recordUsage: async (couponId, userId) => {
    if (!couponId) return;
    await Coupon.findByIdAndUpdate(couponId, {
      $inc: { usedCount: 1 },
      $push: { usedBy: { user: userId, usedAt: new Date() } }
    });
  }
};
