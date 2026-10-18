import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Image, Upload, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import api from '../../services/api';

export const AdminBannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const initialFormState = {
    title: '',
    subtitle: '',
    badge: 'DFTQC Quality Standards',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    displayOrder: 0,
    isActive: true,
  };

  const [form, setForm] = useState(initialFormState);
  const [desktopImage, setDesktopImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/banners?includeInactive=true');
      setBanners(res.data.data || []);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (showModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showModal]);

  // Keyboard accessibility: Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal && !saving) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, saving]);

  const openCreateModal = () => {
    setEditingBanner(null);
    setForm(initialFormState);
    setDesktopImage(null);
    setImagePreview(null);
    setErrorMessage('');
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
      ctaText: banner.ctaText || 'Shop Now',
      ctaLink: banner.ctaLink || '/shop',
      displayOrder: banner.displayOrder ?? 0,
      isActive: banner.isActive ?? true,
    });
    setDesktopImage(null);
    setImagePreview(banner.desktopImage?.url || null);
    setErrorMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setDesktopImage(null);
    setImagePreview(null);
    setErrorMessage('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrorMessage('Headline title is required');
      return;
    }

    if (!editingBanner && !desktopImage) {
      setErrorMessage('Hero banner image is required for new slides');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('subtitle', form.subtitle.trim());
      formData.append('badge', form.badge.trim());
      formData.append('ctaText', form.ctaText.trim() || 'Shop Now');
      formData.append('ctaLink', form.ctaLink.trim() || '/shop');
      formData.append('displayOrder', String(form.displayOrder));
      formData.append('isActive', String(form.isActive));

      if (desktopImage) {
        formData.append('desktopImage', desktopImage);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingBanner) {
        await api.put(`/banners/${editingBanner._id}`, formData, config);
        setToastMessage('Hero banner updated successfully!');
      } else {
        await api.post('/banners', formData, config);
        setToastMessage('Hero banner created successfully!');
      }

      closeModal();
      await fetchBanners();

      setTimeout(() => {
        setToastMessage('');
      }, 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.customMessage || 'Failed to save hero banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hero banner slide?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b._id !== id));
      setToastMessage('Banner deleted successfully');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.customMessage || 'Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Hero Banners</h1>
          <p className="text-xs text-slate-400 mt-1">Manage homepage carousel images, promotional badges, and action links</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Slide</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3">Loading hero banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <Image className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Hero Banners Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create your first homepage slide to feature best-selling supplements and promotional campaigns.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Banner</span>
          </button>
        </div>
      ) : (
        /* Banners Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((ban) => (
            <div key={ban._id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition">
              
              {/* Image Preview Container with Actions */}
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 relative group">
                <img
                  src={ban.desktopImage?.url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80'}
                  alt={ban.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                
                {/* Status Overlay Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md backdrop-blur-md ${
                    ban.isActive ? 'bg-emerald-500/90 text-white' : 'bg-slate-800/90 text-slate-300'
                  }`}>
                    {ban.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {ban.displayOrder > 0 && (
                    <span className="px-2 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold rounded-full">
                      Order: {ban.displayOrder}
                    </span>
                  )}
                </div>

                {/* Top Right Action Buttons: Edit & Delete */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(ban)}
                    className="p-2 rounded-xl bg-orange-500/90 hover:bg-orange-500 text-white shadow-lg transition backdrop-blur-md active:scale-95"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ban._id)}
                    className="p-2 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white shadow-lg transition backdrop-blur-md active:scale-95"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Banner Details */}
              <div>
                <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 font-bold text-[10px] rounded-full">
                  {ban.badge || 'Hero Slide'}
                </span>
                <h3 className="font-bold text-white text-base mt-1 line-clamp-1">{ban.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{ban.subtitle || 'No subtitle provided'}</p>
              </div>

              {/* Footer Meta & CTA */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span>CTA:</span>
                  <strong className="text-white">{ban.ctaText || 'Shop Now'}</strong>
                  <span>&rarr;</span>
                  <span className="text-orange-400 font-mono text-[11px] truncate">{ban.ctaLink || '/shop'}</span>
                </div>
                <button
                  onClick={() => openEditModal(ban)}
                  className="shrink-0 text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <span>Edit Slide</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create & Edit Hero Slide */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) closeModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-modal-title"
        >
          <div
            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] max-h-[90dvh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header (Pinned at top) */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 shrink-0 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                {editingBanner ? (
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
                    <Edit2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 id="banner-modal-title" className="text-sm sm:text-base font-bold text-white truncate">
                    {editingBanner ? 'Edit Hero Slide' : 'Create Hero Slide'}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate hidden xs:block">
                    {editingBanner ? 'Update slide text, links, status, and artwork' : 'Add a new promotional banner for the homepage'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition shrink-0 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form wrapping body and footer */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5 space-y-4">

                {/* Error in modal */}
                {errorMessage && (
                  <div className="p-3 sm:p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="break-words leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">Headline Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fuel Your Potential with 100% Authentic Nutrition"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">Subtitle / Supporting Statement</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Ultra-pure whey protein isolate, micronized creatine, pre-workout tested under DFTQC standards."
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition resize-y min-h-[60px]"
                  />
                </div>

                {/* Badge & Display Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">Promotional Badge</label>
                    <input
                      type="text"
                      placeholder="e.g. DFTQC Quality Standards"
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">Display Order #</label>
                    <input
                      type="number"
                      min="0"
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:border-orange-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* CTA Button Text & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">CTA Button Text</label>
                    <input
                      type="text"
                      placeholder="Shop Now"
                      value={form.ctaText}
                      onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">CTA Destination Link</label>
                    <input
                      type="text"
                      placeholder="/shop or /shop?category=protein"
                      value={form.ctaLink}
                      onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:border-orange-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Image Upload & Current Preview */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white block">
                    Hero Image {editingBanner ? '(Leave empty to keep existing image)' : '*'}
                  </label>
                  
                  {imagePreview && (
                    <div className="relative aspect-video max-h-44 sm:max-h-52 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img
                        src={imagePreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-white shadow-md">
                        {desktopImage ? 'New Selected Artwork' : 'Current Artwork'}
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-400 file:mr-3 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer transition max-w-full"
                  />
                </div>

                {/* Active Toggle */}
                <div className="pt-1">
                  <label className="flex items-start sm:items-center gap-2.5 cursor-pointer text-xs text-white select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="mt-0.5 sm:mt-0 rounded border-slate-700 text-orange-500 focus:ring-orange-500 w-4 h-4 shrink-0"
                    />
                    <span className="font-semibold leading-tight">Slide Active (Visible on public storefront)</span>
                  </label>
                </div>

              </div>

              {/* Pinned Modal Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Save Changes' : 'Create Banner'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
