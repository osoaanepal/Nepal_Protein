import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  variantName: { type: String, required: true }, // e.g. "Chocolate / 2 lbs"
  flavor: { type: String, default: '' },
  size: { type: String, default: '' },
  weight: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  sku: { type: String, default: '' }
}, { _id: true });

const nutritionItemSchema = new mongoose.Schema({
  nutrient: { type: String, required: true },
  amountPerServing: { type: String, required: true },
  percentageDV: { type: String, default: '' }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  sku: {
    type: String,
    required: [true, 'Please provide unique SKU'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product must belong to a category'],
    index: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    index: true,
  },
  subCategory: {
    type: String,
    default: '',
    trim: true,
  },
  shortDescription: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide detailed product description'],
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  price: {
    type: Number,
    required: [true, 'Please provide base product price in NPR'],
    min: 0,
  },
  compareAtPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  stock: {
    type: Number,
    required: [true, 'Please provide available stock count'],
    default: 0,
    min: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0,
  },
  variants: [variantSchema],
  ingredients: [{ type: String, trim: true }],
  nutritionInformation: [nutritionItemSchema],
  usageInstructions: {
    type: String,
    default: '',
  },
  weight: {
    type: String,
    default: '',
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
    index: true,
  },
  isNewArrival: {
    type: Boolean,
    default: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  ratingAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate discount percentage virtual
productSchema.virtual('discountPercentage').get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Text indexing for fast search
productSchema.index({
  name: 'text',
  shortDescription: 'text',
  description: 'text',
  tags: 'text'
});

export const Product = mongoose.model('Product', productSchema);
