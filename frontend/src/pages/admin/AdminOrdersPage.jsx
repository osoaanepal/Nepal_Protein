import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders?status=${statusFilter}&search=${encodeURIComponent(search)}&page=${page}&limit=15`);
      setOrders(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search, page]);

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-black text-white">Orders & Fulfillment</h1>
        <p className="text-xs text-slate-400 mt-1">Manage processing, dispatch, eSewa payments, and delivery fulfillment</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Order #, customer name, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-950 text-white uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total (NPR)</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Order Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">No orders matching criteria.</td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-white">#{ord.orderNumber}</td>
                    <td className="p-4">
                      <span className="font-bold text-white block">{ord.shippingAddress?.fullName}</span>
                      <span className="text-[11px] text-slate-400">{ord.shippingAddress?.phone}</span>
                    </td>
                    <td className="p-4 text-slate-300">{new Date(ord.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-white">{formatNpr(ord.pricing?.grandTotal)}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        ord.paymentInfo?.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {ord.paymentInfo?.method} ({ord.paymentInfo?.status})
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        ord.orderStatus === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400' :
                        ord.orderStatus === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/orders/${ord._id}`}
                        className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
