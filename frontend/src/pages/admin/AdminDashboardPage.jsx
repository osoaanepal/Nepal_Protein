import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Users, 
  Package, 
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const { summary, recentOrders, revenueTrends, ordersByStatus } = data || {};

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Live metrics, sales revenue, and inventory alerts for OSOAA Nepal</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Revenue</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatNpr(summary?.totalRevenue || 0)}
          </div>
          <p className="text-[11px] text-orange-400 font-semibold">Verified Completed & COD</p>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {summary?.totalOrders || 0}
          </div>
          <p className="text-[11px] text-slate-400">Pending: <strong className="text-amber-400">{summary?.pendingOrders || 0}</strong></p>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {summary?.lowStockProducts || 0}
          </div>
          <Link to="/admin/products?inStock=low" className="text-[11px] text-rose-400 hover:underline font-semibold block">
            Review Stock Items &rarr;
          </Link>
        </div>

        {/* Registered Customers */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Customers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {summary?.totalCustomers || 0}
          </div>
          <p className="text-[11px] text-slate-400">Products: <strong className="text-white">{summary?.totalProducts || 0}</strong></p>
        </div>

      </div>

      {/* Recent Orders & Orders Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Recent Customer Orders</h2>
            <Link to="/admin/orders" className="text-xs text-orange-400 hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recentOrders?.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 text-center">No orders recorded yet.</p>
            ) : (
              recentOrders?.map((ord) => (
                <div key={ord._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <span className="font-bold text-white font-mono">#{ord.orderNumber}</span>
                    <p className="text-slate-400 text-[11px] truncate max-w-[140px]">{ord.customer?.name || 'Customer'}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ord.orderStatus === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400' :
                      ord.orderStatus === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {ord.orderStatus}
                    </span>
                    <span className="font-bold text-white font-mono">{formatNpr(ord.pricing?.grandTotal)}</span>
                    <Link to={`/admin/orders/${ord._id}`} className="text-orange-400 hover:text-orange-300 hover:underline font-semibold px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                      Manage
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="lg:col-span-4 p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider pb-4 border-b border-slate-800">
            Status Breakdown
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            {Object.entries(ordersByStatus || {}).map(([st, count]) => (
              <div key={st} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="font-semibold">{st}</span>
                <span className="font-mono font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
