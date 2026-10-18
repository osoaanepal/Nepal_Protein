import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    required: [true, 'Please provide rating between 1 and 5'],
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    required: [true, 'Please provide a review title'],
    trim: true,
  },
  comment: {
    type: String,
    required: [true, 'Please provide your review comment'],
    trim: true,
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED', // Default approved, admin can moderate/reject
    index: true,
  }
}, {
  timestamps: true,
});

// Ensure a customer can only review a product once
reviewSchema.index({ customer: 1, product: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
