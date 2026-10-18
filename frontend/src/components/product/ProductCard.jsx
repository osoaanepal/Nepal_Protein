import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag } from 'lucide-react';
import { formatNpr } from '../../utils/currency';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';

export const ProductCard = ({ product }) => {
    const { addItem } = useCartStore();
    const { toggleWishlist, isInWishlist } = useWishlistStore();
    const { user } = useAuthStore();

    const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&auto=format&fit=crop&q=80';
    const discountPercentage = product.compareAtPrice > product.price
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;

    const inWishlist = isInWishlist(product._id);
    const isOutOfStock = product.stock <= 0;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOutOfStock) return;

        // If product has variants, add default first variant or base
        const defaultVariant = product.variants?.length > 0 ? product.variants[0] : null;
        addItem(product, defaultVariant, 1);
    };

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            window.location.href = '/login';
            return;
        }
        await toggleWishlist(product._id);
    };

    return (
        <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-orange-600 hover:shadow-orange-sm hover:shadow-brand transition-all duration-300 flex flex-col justify-between">

            {/* Top Media & Badges */}
            <div className="relative aspect-square overflow-hidden bg-slate-50">
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                    <img
                        src={primaryImage}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                </Link>

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {discountPercentage > 0 && (
                        <span className="px-2.5 py-1 bg-orange-500 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-md shadow-sm">
                            -{discountPercentage}% OFF
                        </span>
                    )}
                    {product.isBestSeller && (
                        <span className="px-2.5 py-1 bg-black text-white font-bold text-[10px] tracking-wider uppercase rounded-md shadow-sm">
                            Best Seller
                        </span>
                    )}
                    {product.isNewArrival && !product.isBestSeller && (
                        <span className="px-2.5 py-1 bg-orange-500 text-white font-bold text-[10px] tracking-wider uppercase rounded-md shadow-sm">
                            New
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistToggle}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 shadow-sm ${inWishlist
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/80 text-slate-600 hover:text-rose-500 hover:bg-white'
                        }`}
                    aria-label="Toggle Wishlist"
                >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                </button>

                {/* Stock Status Alert Overlay if Out of Stock */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3 py-1.5 bg-white text-rose-600 font-bold text-xs rounded-lg uppercase tracking-wider shadow-md">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Product Information Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                    {/* Brand & Category */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 gap-2">
                        <span className="text-orange-600 font-bold uppercase tracking-wider truncate">
                            {product.brand?.name || product.subCategory || 'OSOAA'}
                        </span>
                        <span className="truncate shrink-0 text-slate-500">{product.category?.name || 'Supplements'}</span>
                    </div>

                    {/* Product Title */}
                    <Link to={`/product/${product.slug}`} className="block">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-500 line-clamp-2 transition leading-snug">
                            {product.name}
                        </h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                            {product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : '5.0'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                            ({product.ratingCount || 12} reviews)
                        </span>
                    </div>
                </div>

                {/* Pricing & Add to Cart Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                        <div className="text-base font-black text-black">
                            {formatNpr(product.price)}
                        </div>
                        {product.compareAtPrice > product.price && (
                            <div className="text-[11px] text-slate-400 line-through">
                                {formatNpr(product.compareAtPrice)}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 shadow-sm ${isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95 shadow-orange-sm'
                            }`}
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
