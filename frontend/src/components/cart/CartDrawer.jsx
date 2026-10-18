import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatNpr } from '../../utils/currency';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const { settings } = useSettingsStore();

  if (!isDrawerOpen) return null;

  const subtotal = getSubtotal();

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-black text-black">Your Shopping Cart</h2>
              <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button 
              onClick={closeDrawer}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Note */}
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>Delivery fee is calculated at checkout based on your district in Nepal.</span>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Looks like you haven't added any premium supplements or fitness gear yet.
                  </p>
                </div>
                <button
                  onClick={() => { closeDrawer(); navigate('/shop'); }}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm transition"
                >
                  Explore Supplements
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.key}
                  className="flex gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl"
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-xl bg-white border border-slate-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link 
                          to={`/product/${item.slug}`} 
                          onClick={closeDrawer}
                          className="text-xs font-bold text-slate-900 hover:text-orange-600 line-clamp-1 transition"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="text-slate-400 hover:text-rose-500 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variantName && (
                        <p className="text-[11px] text-black mt-0.5 truncate font-semibold">
                          {item.variantName}
                        </p>
                      )}

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-black text-black">
                          {formatNpr(item.price)}
                        </span>
                        {item.compareAtPrice > item.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatNpr(item.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 px-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 px-2">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 px-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-800">
                        {formatNpr(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="text-lg font-black text-black">
                  {formatNpr(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Taxes, delivery fee, and coupons are calculated during checkout.
              </p>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-orange-md flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => { closeDrawer(); navigate('/cart'); }}
                className="w-full py-2 bg-transparent hover:bg-slate-200/60 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                View Full Cart
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
