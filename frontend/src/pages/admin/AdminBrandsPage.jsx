import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Award, 
  Upload, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Package, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import api from '../../services/api';

export const AdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    isActive: true,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brands?includeInactive=true');
      setBrands(res.data.data || []);
    } catch (err) {
      console.error('Failed to load brands:', err);
      setErrorMessage(err.customMessage || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenModal = (brand = null) => {
    setEditingBrand(brand);
    setErrorMessage('');
    if (brand) {
      setForm({
        name: brand.name || '',
        slug: brand.slug || '',
        description: brand.description || '',
        website: brand.website || '',
        isActive: brand.isActive !== undefined ? brand.isActive : true,
        isFeatured: Boolean(brand.isFeatured),
        seoTitle: brand.seoTitle || '',
        seoDescription: brand.seoDescription || '',
      });
      setLogoPreview(brand.logo?.url || '');
    } else {
      setForm({
        name: '',
        slug: '',
        description: '',
        website: '',
        isActive: true,
        isFeatured: false,
        seoTitle: '',
        seoDescription: '',
      });
      setLogoPreview('');
    }
    setLogoFile(null);
    setShowModal(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (form.slug) formData.append('slug', form.slug);
      formData.append('description', form.description);
      formData.append('website', form.website);
      formData.append('isActive', form.isActive);
      formData.append('isFeatured', form.isFeatured);
      formData.append('seoTitle', form.seoTitle);
      formData.append('seoDescription', form.seoDescription);

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingBrand) {
        await api.put(`/brands/${editingBrand._id}`, formData, config);
        setSuccessMessage(`Brand "${form.name}" updated successfully.`);
      } else {
        await api.post('/brands', formData, config);
        setSuccessMessage(`Brand "${form.name}" created successfully.`);
      }

      setShowModal(false);
      fetchBrands();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.customMessage || err.response?.data?.message || 'Failed to save brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    try {
      await api.patch(`/brands/${id}/toggle-status`);
      setBrands((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isActive: !currentStatus } : b))
      );
      setSuccessMessage(`Brand "${name}" is now ${!currentStatus ? 'Active' : 'Inactive'}.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.customMessage || 'Failed to toggle brand status');
    }
  };

  const handleDelete = async (brand) => {
    if (brand.productCount > 0) {
      alert(
        `Cannot delete brand "${brand.name}" because it currently has ${brand.productCount} associated product(s). Please reassign or delete these products first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete brand "${brand.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/brands/${brand._id}`);
      setBrands((prev) => prev.filter((b) => b._id !== brand._id));
      setSuccessMessage(`Brand "${brand.name}" deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.customMessage || err.response?.data?.message || 'Failed to delete brand');
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Brands Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-xs">
              Multi-Brand Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage authentic manufacturer brands sold on the Nepal Protein store (OSOAA, ON, etc.)
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && !showModal && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search brands by name or URL slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Brands Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950 text-white uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Brand</th>
                <th className="p-4">Slug & Route</th>
                <th className="p-4">Products</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Loading brand catalog...
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No brands found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {b.logo?.url ? (
                          <img
                            src={b.logo.url}
                            alt={b.name}
                            className="w-10 h-10 object-contain rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-orange-400 shrink-0">
                            {b.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white block">{b.name}</span>
                            {b.name.toUpperCase() === 'OSOAA' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                Primary Brand
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {b.description || 'No description added'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <a
                        href={`/brands/${b.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-orange-400 hover:text-orange-300 transition"
                      >
                        <span>/brands/{b.slug}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-[11px]">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        {b.productCount || 0}
                      </span>
                    </td>

                    <td className="p-4">
                      {b.isFeatured ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          Featured
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(b._id, b.isActive, b.name)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${
                          b.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                        title="Click to toggle status"
                      >
                        {b.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenModal(b)}
                          className="p-2 bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-400 rounded-xl transition"
                          title="Edit Brand"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white">
                  {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Register New Brand'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OSOAA, Optimum Nutrition"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white block mb-1">URL Slug</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank (e.g. osoaa)"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">Official Website URL</label>
                <input
                  type="url"
                  placeholder="https://brandwebsite.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">Description / Story</label>
                <textarea
                  rows={3}
                  placeholder="Authentic description, manufacturing standards, quality commitments..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">Brand Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-14 h-14 object-contain rounded-xl bg-slate-950 p-1.5 border border-slate-800"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                      <Award className="w-6 h-6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="flex-1 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="text-xs font-bold text-white">Active (Visible in Store)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="text-xs font-bold text-white">Feature in Storefront</span>
                </label>
              </div>

              {/* SEO details */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  SEO Customization (Optional)
                </span>
                <input
                  type="text"
                  placeholder="Custom SEO Title"
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Custom SEO Meta Description"
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-98"
                >
                  {submitting ? 'Saving Brand...' : editingBrand ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
