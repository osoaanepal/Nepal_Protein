import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.data || []);
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center bg-white">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-black">You haven't placed any orders yet.</h2>
        <p className="text-xs text-slate-500">All your completed orders and real-time tracking will appear here.</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order._id}
          className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-sm hover:border-slate-300 transition"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 font-mono">Order Ref</span>
              <h3 className="text-base font-black text-brand-navy font-mono">#{order.orderNumber}</h3>
              <p className="text-[11px] text-slate-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  order.orderStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                {order.orderStatus}
              </span>
              <span className="text-sm font-black text-brand-navy">
                {formatNpr(order.pricing?.grandTotal)}
              </span>
            </div>
          </div>

          {/* Items Preview */}
          <div className="space-y-2">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <img src={item.image} alt="" className="w-8 h-8 object-cover rounded-lg bg-white border border-slate-200" />
                  <span>{item.name} {item.variantName ? `(${item.variantName})` : ''} x {item.quantity}</span>
                </div>
                <span className="font-bold text-slate-900">{formatNpr(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Payment: <strong>{order.paymentInfo?.status}</strong> via <strong>{order.paymentInfo?.method}</strong>
            </span>
            <Link
              to={`/account/orders/${order._id}`}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View Details & Tracking</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      ))}
    </div>
  );
};
