import React, { useEffect, useState } from 'react';
import { Search, UserCheck, UserX, ShieldCheck, Mail, Phone } from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';

export const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/customers?search=${encodeURIComponent(search)}&page=${page}&limit=15`);
      setCustomers(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const toggleActive = async (id) => {
    try {
      const res = await api.put(`/admin/customers/${id}/toggle-active`);
      setCustomers(customers.map((c) => c._id === id ? { ...c, isActive: res.data.data.isActive } : c));
    } catch (err) {
      alert(err.customMessage || 'Failed to update customer status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Customers & Users</h1>
        <p className="text-xs text-slate-400 mt-1">Manage registered buyers, email verification, and order lifetime value</p>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name, email, or mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-950 text-white uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Email Status</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No registered customers found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <span className="font-bold text-white block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">Joined {new Date(c.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="text-slate-200 flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" />{c.email}</p>
                      <p className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{c.phone}</p>
                    </td>
                    <td className="p-4">
                      {c.emailVerified ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full text-[10px]">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-white">{c.orderCount || 0}</td>
                    <td className="p-4 font-bold text-white font-mono">{formatNpr(c.totalSpend || 0)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {c.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleActive(c._id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                          c.isActive ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
