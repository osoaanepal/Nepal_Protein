import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, MapPin, Clock, Package } from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';

export const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form State
  const [orderStatus, setOrderStatus] = useState('PENDING');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [adminNotes, setAdminNotes] = useState('');
  const [timelineNote, setTimelineNote] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const ord = res.data.data;
        setOrder(ord);
        setOrderStatus(ord.orderStatus);
        setPaymentStatus(ord.paymentInfo?.status || 'PENDING');
        setAdminNotes(ord.adminNotes || '');
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await api.put(`/admin/orders/${id}/status`, {
        orderStatus,
        paymentStatus,
        adminNotes,
        note: timelineNote || `Status updated to ${orderStatus} by Admin`,
      });

      setOrder(res.data.data);
      setMessage('Order updated successfully!');
      setTimelineNote('');
    } catch (err) {
      alert(err.customMessage || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-white space-y-2">
        <p>Order not found</p>
        <Link to="/admin/orders" className="text-xs text-orange-400 underline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/admin/orders" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white font-mono">Order #{order.orderNumber}</h1>
            <p className="text-xs text-slate-400">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Ordered Items & Shipping Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Items */}
          <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Ordered Products</h2>
            <div className="divide-y divide-slate-800 overflow-hidden">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-slate-950 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.name}</p>
                      {item.variantName && <p className="text-[10px] text-orange-400 truncate">{item.variantName}</p>}
                      <p className="text-[10px] text-slate-400">Qty: {item.quantity} × {formatNpr(item.price)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-white self-end sm:self-auto shrink-0">{formatNpr(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Grand Total:</span>
              <span>{formatNpr(order.pricing?.grandTotal)}</span>
            </div>
          </div>

          {/* Customer & Shipping */}
          <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 text-xs">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Delivery & Customer Info</h2>
            <p className="font-bold text-white text-sm">{order.shippingAddress?.fullName}</p>
            <p className="text-slate-300">Phone: <strong className="text-white">{order.shippingAddress?.phone}</strong></p>
            <p className="text-slate-300">
              Address: {order.shippingAddress?.streetAddress}, Ward {order.shippingAddress?.ward}, {order.shippingAddress?.municipality}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
            </p>
            {order.shippingAddress?.landmark && (
              <p className="text-slate-400">Landmark: {order.shippingAddress?.landmark}</p>
            )}
            {order.customerNote && (
              <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 mt-2">
                Customer Note: "{order.customerNote}"
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Status & Fulfillment Actions */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveChanges} className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Fulfillment Actions</h2>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Order Status</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED (Restores Stock)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Timeline Update Note</label>
              <input
                type="text"
                placeholder="e.g. Dispatched via Pathao Express Courier"
                value={timelineNote}
                onChange={(e) => setTimelineNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Internal Admin Notes (Private)</label>
              <textarea
                rows={3}
                placeholder="Private notes visible only to store managers"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Order Changes'}</span>
            </button>
          </form>

          {/* Timeline History */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 text-xs">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Status History</h3>
            <div className="space-y-2">
              {order.orderTimeline?.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex justify-between font-bold text-white">
                    <span>{item.status}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{new Date(item.updatedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
