import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import api from '../../services/api';
import { SEO } from '../../components/seo/SEO';

export const OrderTrackingPage = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);

    try {
      const res = await api.get(`/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.customMessage || 'No matching order found with the provided details.');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStepIdx = order ? statusSteps.indexOf(order.orderStatus) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-white min-h-[75vh]">
      <SEO title="Track Your Order" noindex={true} />

      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2">
          <Truck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-brand-navy">Track Your Order</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your unique Nepal Protein Order Number and 10-digit mobile number to check real-time fulfillment and delivery status.
        </p>
      </div>

      {/* Tracking Search Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Order Number</label>
              <input
                type="text"
                required
                placeholder="e.g. OSO-202609-1234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Mobile Phone</label>
              <input
                type="tel"
                required
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-orange-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? 'Searching Order...' : 'Track Live Status'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Status Result */}
      {order && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-8 animate-in fade-in shadow-sm">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">Order Ref</span>
              <h2 className="text-xl font-black text-brand-navy font-mono">#{order.orderNumber}</h2>
              <p className="text-xs text-slate-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-brand-navy text-white font-bold text-xs rounded-full shadow-sm">
                {order.orderStatus}
              </span>
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-full">
                Payment: {order.paymentInfo?.status} ({order.paymentInfo?.method})
              </span>
            </div>
          </div>

          {/* Stepper Progress Visualizer */}
          {order.orderStatus !== 'CANCELLED' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {statusSteps.map((step, idx) => {
                  const isCompleted = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div key={step} className="space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition ${isCompleted ? 'bg-orange-500 text-white font-black shadow-sm' : 'bg-slate-200 text-slate-500'
                        }`}>
                        {idx + 1}
                      </div>
                      <span className={`block text-[10px] sm:text-xs font-bold uppercase truncate ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold text-center">
              This order was CANCELLED.
            </div>
          )}

          {/* Timeline Events */}
          {order.orderTimeline?.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Timeline History</h3>
              <div className="space-y-2">
                {order.orderTimeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">{item.status}: {item.note}</p>
                      <span className="text-[10px] text-slate-400">{new Date(item.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Address Snapshot */}
          <div className="pt-6 border-t border-slate-200 text-xs text-slate-700 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Delivery Destination:</span>
              <p>{order.shippingAddress.fullName} — {order.shippingAddress.streetAddress}, Ward {order.shippingAddress.ward}, {order.shippingAddress.municipality}, {order.shippingAddress.district}, {order.shippingAddress.province}</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
