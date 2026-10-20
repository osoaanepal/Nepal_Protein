import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { formatNpr } from '../../utils/currency';
import { AdminPagination } from '../../components/admin/AdminPagination';

export const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?status=all&keyword=${encodeURIComponent(keyword)}&page=${page}&limit=15`);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, keyword]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      if (products.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      alert(err.customMessage || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Product Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">Manage supplements, inventory stock levels, and variants</p>
        </div>

        <Link
          to="/admin/products/new"
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search Filter Box */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by product name, SKU, or tags..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-950 text-white uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price (NPR)</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading catalog items...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">No products found.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.stock <= p.lowStockThreshold;
                  return (
                    <tr key={p._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg bg-slate-950 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-white block line-clamp-1">{p.name}</span>
                            {p.subCategory && <span className="text-[10px] text-orange-400">{p.subCategory}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">{p.sku}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-orange-400 border border-slate-700">
                          {p.brand?.name || 'OSOAA'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-200">{p.category?.name || '-'}</td>
                      <td className="p-4 font-bold text-white">{formatNpr(p.price)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          isLowStock ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {isLowStock && <AlertTriangle className="w-3 h-3" />}
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/edit/${p._id}`}
                            className="p-1.5 bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-400 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <AdminPagination
          currentPage={pagination.page || page}
          totalPages={pagination.pages || 1}
          totalItems={pagination.total}
          itemsPerPage={15}
          unitLabel="products"
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

    </div>
  );
};
