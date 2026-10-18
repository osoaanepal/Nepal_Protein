import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

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
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

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
          setExistingImages(p.images || []);
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

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImageFiles([...imageFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, idx) => idx !== index));
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
      formData.append('existingImages', JSON.stringify(existingImages));

      imageFiles.forEach((file) => {
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
              <label className="text-xs font-bold text-white block mb-1">Short Description</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-white block mb-1">Full Detailed Description *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-orange-500 focus:outline-none"
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
          <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">3. Images (Cloudinary)</h2>

          {existingImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {existingImages.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block p-5 sm:p-6 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl text-center cursor-pointer transition">
              <Upload className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-white">Click to upload images</span>
              <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP up to 5MB each</p>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {imageFiles.length > 0 && (
              <p className="text-xs text-orange-400 mt-2">{imageFiles.length} new image(s) selected for upload</p>
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
