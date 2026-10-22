import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  province: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  municipality: { type: String, required: true, trim: true },
  ward: { type: String, required: true, trim: true },
  streetAddress: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true, default: '' },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email address'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide your 10-digit mobile number'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a secure password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  avatar: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  emailVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  emailVerifiedAt: {
    type: Date,
    default: null,
  },
  addresses: [addressSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  // NP-SEC-14: Track password change timestamp for session revocation
  passwordChangedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true
});

// Hash password before saving if modified & update passwordChangedAt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // NP-SEC-14: Update passwordChangedAt timestamp on password change (exclude initial user creation)
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

// Match password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// NP-SEC-14: Check if password was changed after token issuance
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt && jwtTimestamp) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

export const User = mongoose.model('User', userSchema);
