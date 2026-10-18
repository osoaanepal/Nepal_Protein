import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Home } from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';
import { SEO } from '../../components/seo/SEO';

export const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const orderId = searchParams.get('orderId') || '';

  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      api.get(`/orders/${orderId}`)
        .then((res) => setOrder(res.data.data))
        .catch(() => {});
    }
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 bg-white">
      <SEO title="Order Confirmed" noindex={true} />
      
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200 space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Order Confirmed</span>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">Thank You for Your Order!</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            We've received your order and our team is preparing your authentic supplements for dispatch across Nepal.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 text-left space-y-3 text-xs text-slate-700 shadow-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Order Number:</span>
            <span className="font-bold text-slate-900 font-mono">{orderNumber || order?.orderNumber}</span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-bold text-brand-navy">{order?.paymentInfo?.method || 'Cash on Delivery (COD)'}</span>
          </div>

          {order?.pricing && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-bold text-slate-900">{formatNpr(order.pricing.grandTotal)}</span>
            </div>
          )}

          {order?.shippingAddress && (
            <div className="flex justify-between">
              <span className="text-slate-500">Deliver To:</span>
              <span className="font-semibold text-slate-800 text-right">
                {order.shippingAddress.fullName} ({order.shippingAddress.streetAddress}, {order.shippingAddress.district})
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/account/orders"
            className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-orange-sm flex items-center justify-center gap-2 transition"
          >
            <Package className="w-4 h-4" />
            <span>View My Orders</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-navy hover:bg-navy-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

      </div>

    </div>
  );
};
