import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  MapPin,
  AlertCircle,
  Lock,
  Truck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatNpr } from '../../utils/currency';
import { NEPAL_PROVINCES, NEPAL_DISTRICTS_BY_PROVINCE } from '../../constants/nepalAddresses';
import api from '../../services/api';
import { SEO } from '../../components/seo/SEO';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getSubtotal, coupon, clearCart } = useCartStore();
  const { settings, fetchPublicSettings } = useSettingsStore();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    province: 'Bagmati',
    district: 'Kathmandu',
    municipality: '',
    ward: '',
    streetAddress: '',
    landmark: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prefill default address from user profile if available
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setShippingAddress({
        fullName: defaultAddr.fullName || user.name || '',
        phone: defaultAddr.phone || user.phone || '',
        province: defaultAddr.province || 'Bagmati',
        district: defaultAddr.district || 'Kathmandu',
        municipality: defaultAddr.municipality || '',
        ward: defaultAddr.ward || '',
        streetAddress: defaultAddr.streetAddress || '',
        landmark: defaultAddr.landmark || '',
      });
    }
  }, [user]);

  // Ensure settings are loaded
  useEffect(() => {
    if (!settings?.deliverySettings?.districtCharges) {
      fetchPublicSettings();
    }
  }, [settings, fetchPublicSettings]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const subtotal = getSubtotal();
  const couponDiscount = coupon?.discountAmount || 0;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  // Dynamic district delivery fee calculation
  const districtCharges = settings?.deliverySettings?.districtCharges || {};
  const selectedDistrict = shippingAddress.district?.trim();
  const rawFee = selectedDistrict ? districtCharges[selectedDistrict] : undefined;

  const isFeeConfigured =
    rawFee !== undefined &&
    rawFee !== null &&
    rawFee !== '' &&
    !isNaN(Number(rawFee)) &&
    Number(rawFee) >= 0;

  const deliveryFee = isFeeConfigured ? Number(rawFee) : null;
  // Delivery fee is charged strictly ONCE per order
  const grandTotal = isFeeConfigured ? (discountedSubtotal + deliveryFee) : discountedSubtotal;

  const availableDistricts = NEPAL_DISTRICTS_BY_PROVINCE[shippingAddress.province] || [];

  const handleProvinceChange = (e) => {
    const newProv = e.target.value;
    const firstDistrict = NEPAL_DISTRICTS_BY_PROVINCE[newProv]?.[0] || '';
    setShippingAddress({
      ...shippingAddress,
      province: newProv,
      district: firstDistrict,
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.municipality || !shippingAddress.ward || !shippingAddress.streetAddress) {
      setErrorMessage('Please fill in all required shipping address fields.');
      return;
    }

    if (!isFeeConfigured) {
      setErrorMessage(`Delivery is currently unavailable for ${selectedDistrict}. No delivery fee has been configured for this district.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod,
        couponCode: coupon?.code || '',
        customerNote,
      };

      const res = await api.post('/orders/checkout', orderPayload);
      const { order, paymentPayload } = res.data.data;

      // If eSewa, submit dynamic payment form to eSewa gateway
      if (paymentMethod === 'ESEWA' && paymentPayload) {
        clearCart();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentPayload.paymentUrl;

        for (const [key, value] of Object.entries(paymentPayload.formData)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // If COD, clear cart and redirect to success page
      clearCart();
      navigate(`/order-success?orderNumber=${order.orderNumber}&orderId=${order._id}`);
    } catch (err) {
      setErrorMessage(err.customMessage || 'Failed to place order. Please check item stock.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white min-h-[80vh]">
      <SEO title="Secure Checkout" noindex={true} />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">Checkout</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Complete your delivery address and payment details</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Unable to place order:</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {!isFeeConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Delivery Fee Not Configured</p>
            <p>
              Delivery is currently unavailable for <strong>{selectedDistrict}</strong> (no delivery fee configured). Please select a different delivery district or contact support.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Shipping & Payment Options */}
        <div className="lg:col-span-8 space-y-8">

          {/* Step 1: Delivery Address Form */}
          <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-black text-brand-navy uppercase tracking-wider">
                1. Nepalese Shipping Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Recipient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Shrestha"
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Mobile Phone (Nepal) *</label>
                <input
                  type="tel"
                  required
                  placeholder="98XXXXXXXX"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Province *</label>
                <select
                  value={shippingAddress.province}
                  onChange={handleProvinceChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  {NEPAL_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov} Province</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  District * {isFeeConfigured && <span className="text-emerald-600 font-normal">({formatNpr(deliveryFee)} delivery)</span>}
                </label>
                <select
                  value={shippingAddress.district}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  {availableDistricts.map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Municipality / Rural Municipality *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kathmandu Metropolitan / Pokhara"
                  value={shippingAddress.municipality}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, municipality: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Ward No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03"
                  value={shippingAddress.ward}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, ward: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Street Address / Tole / Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lazimpat, House 14, Near Radisson Hotel"
                  value={shippingAddress.streetAddress}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, streetAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Standard Chartered Bank ATM"
                  value={shippingAddress.landmark}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-black text-brand-navy uppercase tracking-wider">
                2. Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* COD Option */}
              <label
                className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-3 transition ${paymentMethod === 'COD'
                    ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Pay with cash when your parcel is delivered to your doorstep.
                </p>
              </label>

              {/* eSewa Option */}
              <label
                className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-3 transition ${paymentMethod === 'ESEWA'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800">eSewa Mobile Wallet</span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ESEWA"
                    checked={paymentMethod === 'ESEWA'}
                    onChange={() => setPaymentMethod('ESEWA')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Instant, secure digital payment verified server-to-server.
                </p>
              </label>

            </div>

            {/* Customer Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Delivery Notes / Instructions</label>
              <textarea
                rows={2}
                placeholder="e.g. Please deliver after 2 PM or call before arriving."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

          </div>

        </div>

        {/* Right Column: Order Items Summary & Submit Button */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 shadow-sm sticky top-24">
            <h2 className="text-base font-black text-brand-navy uppercase tracking-wider">Your Order Items</h2>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-white border border-slate-200 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      {item.variantName && <p className="text-[10px] text-brand-navy font-semibold">{item.variantName}</p>}
                      <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {formatNpr(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-3 pt-4 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatNpr(subtotal)}</span>
              </div>

              {coupon && (
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>Discount ({coupon.code})</span>
                  <span className="font-bold">-{formatNpr(coupon.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-500" />
                  <span>Delivery ({selectedDistrict})</span>
                </span>
                <span>
                  {isFeeConfigured ? (
                    <strong className="text-slate-900 font-mono">{formatNpr(deliveryFee)}</strong>
                  ) : (
                    <span className="text-rose-600 font-bold">Unavailable</span>
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Grand Total (NPR)</span>
                <span className="text-2xl font-black text-brand-navy">{formatNpr(grandTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFeeConfigured}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-orange-md flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : !isFeeConfigured ? (
                <span>Delivery Unavailable for {selectedDistrict}</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Place Order ({formatNpr(grandTotal)})</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              🔒 256-bit encrypted checkout. Certified genuine products.
            </p>

          </div>
        </div>

      </form>

    </div>
  );
};
