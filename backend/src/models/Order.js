import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  variantName: { type: String, default: '' },
  sku: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  items: [orderItemSchema],
  pricing: {
    itemsSubtotal: { type: Number, required: true, min: 0 },
    couponDiscount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
  },
  couponApplied: {
    code: { type: String, default: '' },
    discountType: { type: String, default: '' },
    discountValue: { type: Number, default: 0 },
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    municipality: { type: String, required: true },
    ward: { type: String, required: true },
    streetAddress: { type: String, required: true },
    landmark: { type: String, default: '' },
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['COD', 'ESEWA'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    transactionId: { type: String, default: '' },
    transactionUuid: { type: String, default: '', index: true },
    paidAt: { type: Date, default: null },
  },
  orderStatus: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'],
    default: 'PENDING',
    index: true,
  },
  orderTimeline: [orderTimelineSchema],
  customerNote: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
}, {
  timestamps: true,
});

export const Order = mongoose.model('Order', orderSchema);
