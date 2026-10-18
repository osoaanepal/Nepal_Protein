import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name slug price compareAtPrice images stock subCategory category ratingAverage ratingCount isBestSeller isNewArrival status variants',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Filter out any null products in case a referenced product was deleted from DB
    const validProducts = (wishlist.products || []).filter(Boolean);

    res.status(200).json({ success: true, count: validProducts.length, data: validProducts });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.findIndex(
      (p) => (p?._id ? p._id.toString() : p?.toString()) === productId.toString()
    );

    let action = '';

    if (index > -1) {
      wishlist.products.splice(index, 1);
      action = 'removed';
    } else {
      wishlist.products.push(productId);
      action = 'added';
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: `Product ${action} ${action === 'added' ? 'to' : 'from'} wishlist.`,
      action,
      products: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (p) => (p?._id ? p._id.toString() : p?.toString()) !== productId.toString()
      );
      await wishlist.save();
    }
    res.status(200).json({ success: true, message: 'Product removed from wishlist.' });
  } catch (error) {
    next(error);
  }
};
