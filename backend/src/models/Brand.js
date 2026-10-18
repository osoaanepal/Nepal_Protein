import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide brand name'],
    trim: true,
    unique: true,
    index: true,
  },
  slug: {
    type: String,
    required: [true, 'Please provide brand slug'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  logo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  website: {
    type: String,
    default: '',
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  seoTitle: {
    type: String,
    default: '',
    trim: true,
  },
  seoDescription: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

export const Brand = mongoose.model('Brand', brandSchema);
