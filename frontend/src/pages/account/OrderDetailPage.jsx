import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft, CheckCircle2, Clock, MapPin, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        setError(err.customMessage || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await api.post(`/orders/${id}/cancel`, {
        reason: cancelReason || 'Cancelled by customer',
      });
      setOrder(res.data.data);
      setShowCancelPrompt(false);
    } catch (err) {
      alert(err.customMessage || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900">Order not found.</p>
        <Link to="/account/orders" className="text-xs text-orange-600 underline font-bold">Back to My Orders</Link>
      </div>
    );
  }

  const isCancellable = ['PENDING', 'CONFIRMED'].includes(order.orderStatus);

  return (
    <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-8 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link to="/account/orders" className="text-xs text-orange-600 hover:underline font-bold flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders List</span>
          </Link>
          <h2 className="text-xl font-black text-brand-navy font-mono">Order #{order.orderNumber}</h2>
          <p className="text-xs text-slate-500">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            order.orderStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            order.orderStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            'bg-orange-50 text-orange-700 border border-orange-200'
          }`}>
            {order.orderStatus}
          </span>
          {isCancellable && (
            <button
              onClick={() => setShowCancelPrompt(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-full text-xs font-bold transition"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancel Prompt Modal */}
      {showCancelPrompt && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">Confirm Order Cancellation</h4>
          <p className="text-xs text-slate-600">Are you sure you want to cancel this order? Stock will be immediately restored.</p>
          <input
            type="text"
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancelPrompt(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
            </button>
          </div>
        </div>
      )}

      {/* Ordered Items Table */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordered Products</h3>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          {order.items?.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  {item.variantName && <p className="text-[11px] text-brand-navy font-semibold">{item.variantName}</p>}
                  <p className="text-[10px] text-slate-500">Qty: {item.quantity} × {formatNpr(item.price)}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-brand-navy">{formatNpr(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Pricing Breakdown */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs text-slate-600 max-w-sm ml-auto">
        <div className="flex justify-between">
          <span>Items Subtotal:</span>
          <span className="font-bold text-slate-900">{formatNpr(order.pricing?.itemsSubtotal)}</span>
        </div>
        {order.pricing?.couponDiscount > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>Coupon Discount:</span>
            <span className="font-bold">-{formatNpr(order.pricing.couponDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery Fee:</span>
          <span className="font-bold text-slate-900">
            {order.pricing?.deliveryFee === 0 ? 'FREE' : formatNpr(order.pricing?.deliveryFee)}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
          <span>Grand Total:</span>
          <span className="text-lg font-black text-brand-navy">{formatNpr(order.pricing?.grandTotal)}</span>
        </div>
      </div>

      {/* Shipping Address & Payment Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-xs">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-brand-navy font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>Shipping Address</span>
          </div>
          <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
          <p className="text-slate-600">Phone: {order.shippingAddress?.phone}</p>
          <p className="text-slate-600">
            {order.shippingAddress?.streetAddress}, Ward {order.shippingAddress?.ward}, {order.shippingAddress?.municipality}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
          </p>
          {order.shippingAddress?.landmark && (
            <p className="text-slate-500">Landmark: {order.shippingAddress?.landmark}</p>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-brand-navy font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Payment Summary</span>
          </div>
          <p className="text-slate-600">Payment Gateway: <strong className="text-brand-navy">{order.paymentInfo?.method}</strong></p>
          <p className="text-slate-600">Payment Status: <strong className="text-emerald-700">{order.paymentInfo?.status}</strong></p>
          {order.paymentInfo?.transactionId && (
            <p className="text-slate-500 font-mono text-[11px]">Transaction Ref: {order.paymentInfo.transactionId}</p>
          )}
        </div>
      </div>

    </div>
  );
};
