import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, AlertCircle, CheckCircle2, Image as ImageIcon, RefreshCw, X, Sparkles, GripVertical, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import api from '../../services/api';
import { ProductDescriptionEditor } from '../../components/admin/ProductDescriptionEditor';
import { ProductShortDescription } from '../../components/product/ProductShortDescription';

export const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    sku: '',
    brand: '',
    category: '',
    subCategory: '',
    shortDescription: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    lowStockThreshold: 5,
    usageInstructions: '',
    weight: '',
    status: 'published',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    tags: '',
    ingredients: '',
  });

  const [variants, setVariants] = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [brokenImages, setBrokenImages] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const activeUrlsRef = useRef(new Set());

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands?includeInactive=true')
        ]);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);

        if (isEdit) {
          const prodRes = await api.get(`/products/${id}`);
          const p = prodRes.data.data;
          setForm({
            name: p.name || '',
            sku: p.sku || '',
            brand: p.brand?._id || p.brand || '',
            category: p.category?._id || p.category || '',
            subCategory: p.subCategory || '',
            shortDescription: p.shortDescription || '',
            description: p.description || '',
            price: p.price || '',
            compareAtPrice: p.compareAtPrice || '',
            stock: p.stock || '',
            lowStockThreshold: p.lowStockThreshold || 5,
            usageInstructions: p.usageInstructions || '',
            weight: p.weight || '',
            status: p.status || 'published',
            isFeatured: p.isFeatured || false,
            isBestSeller: p.isBestSeller || false,
            isNewArrival: p.isNewArrival || false,
            tags: p.tags?.join(', ') || '',
            ingredients: p.ingredients?.join('\n') || '',
          });
          setVariants(p.variants || []);
          setNutrition(p.nutritionInformation || []);
          if (p.images && Array.isArray(p.images)) {
            setGalleryImages(
              p.images.map((img, idx) => ({
                id: `existing-${idx}-${img.publicId || Math.random().toString(36).substring(2, 7)}`,
                type: 'existing',
                url: img.url,
                publicId: img.publicId || '',
                isPrimary: idx === 0,
                hasError: false,
              }))
            );
          } else {
            setGalleryImages([]);
          }
        }
      } catch (err) {
        setError('Failed to fetch product data');
      } finally {
        setFetching(false);
      }
    };
    fetchMetadata();
  }, [id, isEdit]);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { variantName: '', flavor: '', size: '', weight: '', price: form.price || 0, compareAtPrice: form.compareAtPrice || 0, stock: 10, sku: '' }
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleAddNutrition = () => {
    setNutrition([...nutrition, { nutrient: '', amountPerServing: '', percentageDV: '' }]);
  };

  const handleRemoveNutrition = (index) => {
    setNutrition(nutrition.filter((_, idx) => idx !== index));
  };

  const handleNutritionChange = (index, field, value) => {
    const updated = [...nutrition];
    updated[index][field] = value;
    setNutrition(updated);
  };

  const createPreviewUrl = (file) => {
    const url = URL.createObjectURL(file);
    activeUrlsRef.current.add(url);
    return url;
  };

  const revokePreviewUrl = (url) => {
    if (url && activeUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      activeUrlsRef.current.delete(url);
    }
  };

  // Cleanup all temporary object URLs on unmount to prevent memory leaks
  useEffect(() => {
    const urls = activeUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const validateAndProcessFiles = (files) => {
    setImageError('');
    const validFiles = [];
    const errors = [];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (!file.type || !file.type.startsWith('image/')) {
        errors.push(`"${file.name}" is not a valid image file. Only image formats (JPG, PNG, WEBP) are supported.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        errors.push(`"${file.name}" exceeds the 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      setImageError(errors.join(' '));
    }

    return validFiles;
  };

  const addFilesToGallery = (files) => {
    if (!files || files.length === 0) return;
    const validFiles = validateAndProcessFiles(files);
    if (validFiles.length > 0) {
      const newItems = validFiles.map((file) => ({
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'new',
        file,
        url: createPreviewUrl(file),
        name: file.name,
        size: file.size,
        hasError: false,
      }));
      setGalleryImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleImageChange = (e) => {
    addFilesToGallery(e.target.files);
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setGalleryImages((prev) => {
      const itemToRemove = prev[index];
      if (itemToRemove?.type === 'new' && itemToRemove?.url) {
        revokePreviewUrl(itemToRemove.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleReplaceImage = (index, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const validFiles = validateAndProcessFiles([file]);
    if (validFiles.length > 0) {
      const validFile = validFiles[0];
      setGalleryImages((prev) => {
        const oldItem = prev[index];
        if (oldItem?.type === 'new' && oldItem?.url) {
          revokePreviewUrl(oldItem.url);
        }
        const newUrl = createPreviewUrl(validFile);
        return prev.map((item, idx) =>
          idx === index
            ? {
                id: `replaced-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                type: 'new',
                file: validFile,
                url: newUrl,
                name: validFile.name,
                size: validFile.size,
                hasError: false,
              }
            : item
        );
      });
    }
    e.target.value = '';
  };

  const handleMoveImage = (fromIndex, toIndex) => {
    if (
      fromIndex < 0 ||
      fromIndex >= galleryImages.length ||
      toIndex < 0 ||
      toIndex >= galleryImages.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    setGalleryImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleMakePrimary = (index) => {
    if (index === 0) return;
    handleMoveImage(index, 0);
  };

  const handleDragStart = (e, index) => {
    if (e.target.closest('button, label, input')) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch (_) {}
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === undefined || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setGalleryImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePreviewError = (id) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') {
          const tagArray = v.split(',').map((t) => t.trim()).filter(Boolean);
          formData.append('tags', JSON.stringify(tagArray));
        } else if (k === 'ingredients') {
          const ingArray = v.split('\n').map((i) => i.trim()).filter(Boolean);
          formData.append('ingredients', JSON.stringify(ingArray));
        } else {
          formData.append(k, v);
        }
      });

      formData.append('variants', JSON.stringify(variants));
      formData.append('nutritionInformation', JSON.stringify(nutrition));

      // Build structured images manifest preserving exact user-defined order
      const imagesManifest = [];
      const newFilesToUpload = [];

      galleryImages.forEach((img) => {
        if (img.type === 'existing') {
          imagesManifest.push({
            type: 'existing',
            url: img.url,
            publicId: img.publicId || '',
          });
        } else if (img.type === 'new') {
          const fileIndex = newFilesToUpload.length;
          newFilesToUpload.push(img.file);
          imagesManifest.push({
            type: 'new',
            fileIndex,
            tempId: img.id,
            name: img.name || img.file?.name,
          });
        }
      });

      formData.append('imagesManifest', JSON.stringify(imagesManifest));

      // Backward compatibility: provide legacy existingImages
      const legacyExisting = galleryImages
        .filter((img) => img.type === 'existing')
        .map((img) => ({
          url: img.url,
          publicId: img.publicId || '',
          isPrimary: false,
        }));
      formData.append('existingImages', JSON.stringify(legacyExisting));

      // Append staged files in the exact order indexed in imagesManifest
      newFilesToUpload.forEach((file) => {
        formData.append('images', file);
      });

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEdit) {
        await api.put(`/products/${id}`, formData, config);
      } else {
        await api.post('/products', formData, config);
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err.customMessage || 'Failed to save product');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="text-xs text-slate-400">Configure catalog details, pricing, variants, and images</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Info */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">1. General Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-white block mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Unique SKU *</label>
              <input
                type="text"
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">
                Manufacturer Brand <span className="text-orange-400 font-normal">(Multi-Brand System)</span>
              </label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Default Brand (OSOAA)</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}{!b.isActive ? ' (Inactive)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Assign to OSOAA or another authentic partner brand.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Category *</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Subcategory</label>
              <input
                type="text"
                value={form.subCategory}
                onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-white block">Short Description / Key Specifications</label>
                {form.shortDescription && (
                  <span className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-orange-400" />
                    Auto-formatted live preview active
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="Paste specifications directly from Amazon, Excel, supplier sheets, HTML tables, or enter summary prose..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none resize-y leading-relaxed font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Paste directly from Amazon, Excel, supplier tables, bullet lists, or text. The system automatically converts specifications into Key Specifications cards on the live store.
              </p>

              {form.shortDescription.trim() && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Live Customer View Preview:
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      (Rendered automatically from pasted text)
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <ProductShortDescription shortDescription={form.shortDescription} />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-white block mb-1.5">
                Full Detailed Description *
              </label>
              <ProductDescriptionEditor
                required
                value={form.description}
                onChange={(val) => setForm({ ...form, description: val })}
                placeholder="Enter detailed product description, key benefits (- **Feature:** Details), and usage directions..."
              />
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">2. Pricing & Stock (NPR)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-white block mb-1">Base Price (NPR) *</label>
              <input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Compare MRP (NPR)</label>
              <input
                type="number"
                min={0}
                value={form.compareAtPrice}
                onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Stock Count *</label>
              <input
                type="number"
                required
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white block mb-1">Low Stock Warning</label>
              <input
                type="number"
                min={0}
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Product Images (Cloudinary) */}
        <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">3. Product Images & Gallery Order</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drag cards to reorder or use ◀ ▶ buttons. Image #1 is automatically used as the primary cover photo.
              </p>
            </div>
            {galleryImages.length > 0 && (
              <span className="text-[11px] font-medium text-slate-400 self-start sm:self-auto">
                {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''} total
              </span>
            )}
          </div>

          {imageError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{imageError}</span>
              </div>
              <button
                type="button"
                onClick={() => setImageError('')}
                className="text-rose-400 hover:text-white p-1 rounded-lg transition"
                title="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sensible placeholder when no images are present */}
          {galleryImages.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2.5">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-200">No product image selected</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Select or drag one or more images from your device. You can freely reorder them after selection.
              </p>
            </div>
          )}

          {/* Unified Draggable Image Previews Gallery */}
          {galleryImages.length > 0 && (
            <div className="flex flex-wrap gap-3.5 pt-1">
              {galleryImages.map((item, idx) => {
                const isPrimary = idx === 0;
                const isBroken = Boolean(brokenImages[item.id]);
                const isBeingDragged = draggedIndex === idx;
                const isDropTarget = dragOverIndex === idx && draggedIndex !== idx;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative w-36 h-40 sm:w-40 sm:h-44 rounded-2xl overflow-hidden bg-slate-950 border shrink-0 group transition-all duration-150 select-none ${
                      isBeingDragged
                        ? 'opacity-30 scale-95 border-dashed border-orange-500 ring-2 ring-orange-500/50'
                        : isDropTarget
                        ? 'border-orange-500 ring-2 ring-orange-500 shadow-xl shadow-orange-500/30 scale-105 z-20'
                        : isPrimary
                        ? 'border-orange-500/80 ring-1 ring-orange-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Background Preview */}
                    {isBroken ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-rose-400">
                        <AlertCircle className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-semibold">Preview Failed</span>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.name || `Product image ${idx + 1}`}
                        onError={() => handlePreviewError(item.id)}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    )}

                    {/* Gradient overlays for readability */}
                    <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none" />

                    {/* Top Left: Primary badge or numeric index */}
                    {isPrimary ? (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-orange-500 text-white shadow flex items-center gap-1 z-10">
                        <Star className="w-2.5 h-2.5 fill-current" /> Cover
                      </span>
                    ) : (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/90 text-slate-300 border border-slate-700/60 backdrop-blur-sm z-10">
                        #{idx + 1}
                      </span>
                    )}

                    {/* Top Right: Drag Handle, Replace, and Delete */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                      <div
                        title="Drag to reorder"
                        className="cursor-grab active:cursor-grabbing p-1.5 bg-slate-900/90 hover:bg-orange-500 text-slate-300 hover:text-white rounded-lg transition shadow-lg backdrop-blur-sm"
                      >
                        <GripVertical className="w-3 h-3" />
                      </div>
                      <label
                        className="p-1.5 bg-slate-900/90 hover:bg-orange-500 text-slate-300 hover:text-white rounded-lg transition cursor-pointer shadow-lg backdrop-blur-sm"
                        title="Replace this image"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleReplaceImage(idx, e)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-slate-900/90 hover:bg-rose-500 text-slate-300 hover:text-white rounded-lg transition shadow-lg backdrop-blur-sm"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Bottom Left: Status badge */}
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 z-10">
                      {item.type === 'existing' ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/90 text-slate-300 border border-slate-700/60 backdrop-blur-sm">
                          Saved
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/90 text-orange-400 border border-orange-500/30 backdrop-blur-sm">
                          New
                        </span>
                      )}
                      {item.size && (
                        <span className="hidden sm:inline-block px-1 py-0.5 rounded text-[8px] font-mono font-medium bg-slate-900/80 text-slate-400 backdrop-blur-sm">
                          {(item.size / 1024).toFixed(0)}K
                        </span>
                      )}
                    </div>

                    {/* Bottom Right: Accessible Reorder Nudge Controls */}
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-slate-900/95 border border-slate-700/60 rounded-lg p-0.5 shadow-lg backdrop-blur-sm z-10">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, idx - 1)}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition"
                        title="Move left (earlier in gallery)"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(idx)}
                          className="p-1 rounded text-amber-400 hover:text-white hover:bg-orange-500 transition"
                          title="Make primary cover"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={idx === galleryImages.length - 1}
                        onClick={() => handleMoveImage(idx, idx + 1)}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition"
                        title="Move right (later in gallery)"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Dropzone (Supports File Drag & Drop) */}
          <div>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  addFilesToGallery(e.dataTransfer.files);
                }
              }}
              className={`block p-5 sm:p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
                isDraggingFile
                  ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
                  : 'border-slate-700 hover:border-orange-500 bg-slate-950/30'
              }`}
            >
              <Upload className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-white">
                {galleryImages.length > 0
                  ? 'Click or drag files here to add additional images'
                  : 'Click or drag product images here to upload'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP up to 5MB each (multiple files supported)</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {galleryImages.some((img) => img.type === 'new') && (
              <div className="flex items-center gap-2 text-xs text-orange-400 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {galleryImages.filter((img) => img.type === 'new').length} new image
                  {galleryImages.filter((img) => img.type === 'new').length !== 1 ? 's' : ''} staged for upload
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Variants Manager */}
        <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">4. Product Variants (Flavors / Sizes)</h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="px-3.5 py-1.5 bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant</span>
            </button>
          </div>

          {variants.map((v, idx) => (
            <div key={idx} className="p-3.5 sm:p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
              <input
                type="text"
                placeholder="Variant Name (e.g. Belgian Chocolate / 2kg)"
                value={v.variantName}
                onChange={(e) => handleVariantChange(idx, 'variantName', e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white sm:col-span-2 focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Price (NPR)"
                value={v.price}
                onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none font-mono"
              />
              <input
                type="number"
                placeholder="Stock"
                value={v.stock}
                onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none font-mono"
              />
              <input
                type="text"
                placeholder="Variant SKU"
                value={v.sku}
                onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveVariant(idx)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs flex justify-center items-center gap-1 transition sm:col-span-2 lg:col-span-1"
              >
                <Trash2 className="w-4 h-4" />
                <span className="lg:hidden text-xs">Remove Variant</span>
              </button>
            </div>
          ))}
        </div>

        {/* Nutritional Facts Table Builder */}
        <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">5. Nutrition Facts Table</h2>
            <button
              type="button"
              onClick={handleAddNutrition}
              className="px-3.5 py-1.5 bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Nutrient Row</span>
            </button>
          </div>

          {nutrition.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              <input
                type="text"
                placeholder="Nutrient (e.g. Protein)"
                value={item.nutrient}
                onChange={(e) => handleNutritionChange(idx, 'nutrient', e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Amount (e.g. 27 g)"
                value={item.amountPerServing}
                onChange={(e) => handleNutritionChange(idx, 'amountPerServing', e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="% DV (e.g. 54%)"
                value={item.percentageDV}
                onChange={(e) => handleNutritionChange(idx, 'percentageDV', e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveNutrition(idx)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs flex justify-center items-center gap-1 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sm:hidden text-xs">Remove Row</span>
              </button>
            </div>
          ))}
        </div>

        {/* Form Flags & Status */}
        <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">6. Badges & Publishing Status</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-white font-medium">Featured Product</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <input
                type="checkbox"
                checked={form.isBestSeller}
                onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-white font-medium">Best Seller Badge</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-white font-medium">New Arrival Badge</span>
            </label>

            <div>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? 'Saving Product...' : isEdit ? 'Update Product Details' : 'Publish New Product'}
        </button>

      </form>

    </div>
  );
};
