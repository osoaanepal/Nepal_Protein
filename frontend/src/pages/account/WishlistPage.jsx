import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { formatNpr } from '../../utils/currency';

export const WishlistPage = () => {
  const { items, fetchWishlist, toggleWishlist, removeFromWishlist, isLoading } = useWishlistStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Heart className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-black font-display">Your wishlist is empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Save high-purity whey protein, creatine, and fitness supplements you're interested in to purchase later.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm transition"
        >
          <span>Explore Supplements</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-brand-navy uppercase tracking-wider">
          Saved Wishlist Items ({items.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((product) => {
          if (!product) return null;
          const imageSrc = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

          return (
            <div
              key={product._id}
              className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-orange-600 hover:shadow-orange-sm transition"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 relative border border-slate-100">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                    OSOAA
                  </div>
                )}
                <button
                  onClick={() => removeFromWishlist(product._id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-500 hover:bg-rose-500 hover:text-white transition shadow-sm"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span className="text-brand-navy font-bold uppercase">{product.subCategory || 'OSOAA'}</span>
                  <span>{product.category?.name || 'Supplements'}</span>
                </div>
                <Link to={`/product/${product.slug}`} className="text-xs font-bold text-slate-900 hover:text-orange-600 line-clamp-1 transition">
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-black text-brand-navy">{formatNpr(product.price)}</p>
                  {product.compareAtPrice > product.price && (
                    <p className="text-[11px] text-slate-400 line-through">{formatNpr(product.compareAtPrice)}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => addItem(product, product.variants?.[0] || null, 1)}
                disabled={product.stock <= 0}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-orange-sm transition active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{product.stock <= 0 ? 'Out of Stock' : 'Move to Cart'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
