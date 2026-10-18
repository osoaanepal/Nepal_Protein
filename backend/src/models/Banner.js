import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    default: '',
    trim: true,
  },
  ctaText: {
    type: String,
    default: 'Shop Now',
  },
  ctaLink: {
    type: String,
    default: '/shop',
  },
  desktopImage: {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  mobileImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  badge: {
    type: String,
    default: '',
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

export const Banner = mongoose.model('Banner', bannerSchema);
