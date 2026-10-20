import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { getPaginationParams, buildPaginationMetadata } from '../utils/pagination.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, limit, skip } = getPaginationParams(req.query, {
      defaultLimit: 10,
      maxLimit: 50,
    });

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId, status: 'APPROVED' })
        .populate('customer', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: productId, status: 'APPROVED' })
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: buildPaginationMetadata(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const createProductReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user._id;

    if (!rating || !title || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating, title, and comment.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if user has already reviewed
    const existing = await Review.findOne({ customer: userId, product: productId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this product.' });
    }

    // Check if verified purchase
    const hasPurchased = await Order.findOne({
      customer: userId,
      'items.product': productId,
      orderStatus: 'DELIVERED',
    });

    const review = await Review.create({
      customer: userId,
      product: productId,
      rating: Number(rating),
      title,
      comment,
      isVerifiedPurchase: !!hasPurchased,
      status: 'APPROVED',
    });

    // Update Product average rating
    const allProductReviews = await Review.find({ product: productId, status: 'APPROVED' });
    const avgRating = allProductReviews.reduce((acc, item) => item.rating + acc, 0) / allProductReviews.length;

    product.ratingAverage = Number(avgRating.toFixed(1));
    product.ratingCount = allProductReviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = getPaginationParams(req.query, {
      defaultLimit: 20,
      maxLimit: 100,
    });
    const filter = (status && status !== 'ALL') ? { status } : {};

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('customer', 'name email')
        .populate('product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: buildPaginationMetadata(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Recalculate product rating
    const allApproved = await Review.find({ product: review.product, status: 'APPROVED' });
    const avgRating = allApproved.length ? allApproved.reduce((acc, item) => item.rating + acc, 0) / allApproved.length : 0;
    await Product.findByIdAndUpdate(review.product, {
      ratingAverage: Number(avgRating.toFixed(1)),
      ratingCount: allApproved.length,
    });

    res.status(200).json({ success: true, message: 'Review status updated', data: review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Recalculate product rating
    const allApproved = await Review.find({ product: review.product, status: 'APPROVED' });
    const avgRating = allApproved.length ? allApproved.reduce((acc, item) => item.rating + acc, 0) / allApproved.length : 0;
    await Product.findByIdAndUpdate(review.product, {
      ratingAverage: Number(avgRating.toFixed(1)),
      ratingCount: allApproved.length,
    });

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
