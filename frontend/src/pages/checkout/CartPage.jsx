import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, Sparkles, Tag, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatNpr } from '../../utils/currency';
import api from '../../services/api';
import { SEO } from '../../components/seo/SEO';

export const CartPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getSubtotal, 
    coupon, 
    setCoupon, 
    removeCoupon,
    getGrandTotal 
  } = useCartStore();
  const { settings } = useSettingsStore();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getSubtotal();
  const couponDiscount = coupon?.discountAmount || 0;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await api.post('/coupons/validate', {
        code: couponCodeInput.trim(),
        subtotal,
      });

      setCoupon(res.data.data);
      setCouponCodeInput('');
    } catch (err) {
      setCouponError(err.customMessage || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6 bg-white min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <SEO title="Shopping Cart" noindex={true} />
        <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">Your Cart is Currently Empty</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Explore our authentic range of whey proteins, micronized creatine, pre-workouts, and fitness accessories.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-orange-sm transition"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white min-h-[75vh]">
      <SEO title="Shopping Cart" noindex={true} />
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Review your selected items before checkout</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-bold"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Delivery Info Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-xs text-slate-700">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            <span>🚚 Delivery fee is determined once per order based on your delivery district across Nepal.</span>
          </div>

          {/* Items Table / Cards */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-xl bg-slate-50 border border-slate-200 shrink-0"
                  />
                  <div>
                    <Link
                      to={`/product/${item.slug}`}
                      className="text-sm font-bold text-slate-900 hover:text-orange-600 line-clamp-1 transition"
                    >
                      {item.name}
                    </Link>
                    {item.variantName && (
                      <p className="text-xs text-brand-navy font-semibold mt-0.5">{item.variantName}</p>
                    )}
                    <p className="text-xs text-slate-400 font-mono text-[11px] mt-0.5">SKU: {item.sku}</p>
                    <div className="text-sm font-black text-brand-navy mt-1">
                      {formatNpr(item.price)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-brand-navy">{formatNpr(item.price * item.quantity)}</p>
                  </div>

                  <button
                    onClick={() => removeItem(item.key)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 shadow-sm">
            <h2 className="text-base font-black text-brand-navy uppercase tracking-wider">Order Summary</h2>

            {/* Coupon Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-orange-500" />
                <span>Promo Code / Coupon</span>
              </label>

              {coupon ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-orange-600 font-mono">{coupon.code}</span>
                    <span className="text-slate-700 ml-2">(-{formatNpr(coupon.discountAmount)})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-rose-600 hover:underline font-bold text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs uppercase font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCodeInput.trim()}
                    className="px-4 py-2.5 bg-brand-navy hover:bg-navy-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-40"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatNpr(subtotal)}</span>
              </div>

              {coupon && (
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>Coupon Discount ({coupon.code})</span>
                  <span className="font-bold">-{formatNpr(coupon.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Nationwide Delivery</span>
                <span className="text-slate-500 font-medium text-[11px]">Calculated at checkout (by district)</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Total Subtotal (NPR)</span>
                <span className="text-2xl font-black text-brand-navy">{formatNpr(discountedSubtotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-orange-md flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>Proceed to Secure Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};
