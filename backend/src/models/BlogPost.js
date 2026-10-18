import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  item: { type: String, required: true, trim: true },
  quantity: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true },
}, { _id: false });

const instructionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  title: { type: String, default: '', trim: true },
  description: { type: String, required: true, trim: true },
}, { _id: false });

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['nepali-blog', 'english-blog', 'recipes'],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },
    contentType: {
      type: String,
      required: [true, 'Content type is required'],
      enum: {
        values: ['article', 'written-recipe', 'video-recipe'],
        message: '{VALUE} is not a valid content type',
      },
      default: 'article',
    },
    featuredImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    videoThumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    videoDuration: {
      type: String,
      default: '',
      trim: true,
    },
    author: {
      name: { type: String, default: 'OSOAA Nutrition Team', trim: true },
      role: { type: String, default: 'Wellness & Fitness Editorial', trim: true },
      avatar: { type: String, default: '' },
    },
    tags: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    readingTime: {
      type: Number,
      default: 3, // minutes
      min: [1, 'Reading time must be at least 1 minute'],
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'SEO title cannot exceed 100 characters'],
      default: '',
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'SEO description cannot exceed 200 characters'],
      default: '',
    },
    seoKeywords: [{
      type: String,
      trim: true,
    }],
    
    // Recipe specific fields
    preparationTime: {
      type: String,
      default: '',
      trim: true,
    },
    cookingTime: {
      type: String,
      default: '',
      trim: true,
    },
    servings: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Easy',
    },
    ingredients: [ingredientSchema],
    instructions: [instructionSchema],
    nutritionInformation: {
      calories: { type: String, default: '', trim: true },
      protein: { type: String, default: '', trim: true },
      carbohydrates: { type: String, default: '', trim: true },
      fats: { type: String, default: '', trim: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });
blogPostSchema.index({ status: 1, category: 1, publishedAt: -1 });
blogPostSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
