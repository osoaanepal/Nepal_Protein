import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/admin/all');
      setReviews(res.data.data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/reviews/admin/${id}/status`, { status });
      setReviews(reviews.map((r) => r._id === id ? { ...r, status } : r));
    } catch (err) {
      alert(err.customMessage || 'Failed to update review status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer review permanently?')) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      setReviews(reviews.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.customMessage || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Review Moderation</h1>
        <p className="text-xs text-slate-400 mt-1">Approve, reject, or moderate customer ratings and verified buyer feedback</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[680px]">
            <thead className="bg-slate-950 text-white uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Rating & Review</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading reviews...</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No customer reviews yet.</td></tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <span className="font-bold text-white block">{rev.product?.name || 'Product'}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white block">{rev.customer?.name}</span>
                      <span className="text-[10px] text-slate-400">{rev.customer?.email}</span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-slate-700'}`} />
                        ))}
                      </div>
                      <p className="font-bold text-white">{rev.title}</p>
                      <p className="text-slate-300 text-[11px] line-clamp-2">{rev.comment}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        rev.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                        rev.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {rev.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleStatusUpdate(rev._id, 'APPROVED')}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {rev.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleStatusUpdate(rev._id, 'REJECTED')}
                            className="p-1.5 bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-400 rounded-lg transition"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rev._id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
