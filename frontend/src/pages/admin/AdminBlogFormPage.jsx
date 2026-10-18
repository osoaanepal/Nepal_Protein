import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  Image as ImageIcon, 
  ChefHat, 
  Plus, 
  Trash2, 
  Sparkles, 
  Search, 
  Video, 
  FileText, 
  Tag, 
  Check, 
  Globe, 
  X,
  AlertCircle
} from 'lucide-react';
import { blogService } from '../../services/blogService';
import { RichContentEditor } from '../../components/admin/RichContentEditor';
import { RichTextContent } from '../../components/blog/RichTextContent';
import { RecipeDetailsView } from '../../components/blog/RecipeDetailsView';

export const AdminBlogFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'content' | 'recipe' | 'seo'
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'nepali-blog',
    contentType: 'article',
    status: 'draft',
    isFeatured: false,
    publishedAt: new Date().toISOString().split('T')[0],
    readingTime: 3,
    authorName: 'OSOAA Nutrition Team',
    authorRole: 'Editorial Team',
    tags: '',
    videoUrl: '',
    videoDuration: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    // Recipe fields
    preparationTime: '',
    cookingTime: '',
    servings: '',
    difficulty: 'Easy',
    calories: '',
    protein: '',
    carbohydrates: '',
    fats: '',
  });

  const [ingredients, setIngredients] = useState([
    { item: '', quantity: '', notes: '' },
  ]);

  const [instructions, setInstructions] = useState([
    { step: 1, title: '', description: '' },
  ]);

  // Image Upload State
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  // Load existing post if in edit mode
  useEffect(() => {
    if (isEditing) {
      const fetchPost = async () => {
        setInitialLoading(true);
        try {
          const res = await blogService.adminGetPostById(id);
          const p = res.data;
          setFormData({
            title: p.title || '',
            slug: p.slug || '',
            excerpt: p.excerpt || '',
            content: p.content || '',
            category: p.category || 'nepali-blog',
            contentType: p.contentType || 'article',
            status: p.status || 'draft',
            isFeatured: Boolean(p.isFeatured),
            publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : '',
            readingTime: p.readingTime || 3,
            authorName: p.author?.name || 'OSOAA Nutrition Team',
            authorRole: p.author?.role || 'Editorial Team',
            tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
            videoUrl: p.videoUrl || '',
            videoDuration: p.videoDuration || '',
            seoTitle: p.seoTitle || '',
            seoDescription: p.seoDescription || '',
            seoKeywords: Array.isArray(p.seoKeywords) ? p.seoKeywords.join(', ') : '',
            preparationTime: p.preparationTime || '',
            cookingTime: p.cookingTime || '',
            servings: p.servings || '',
            difficulty: p.difficulty || 'Easy',
            calories: p.nutritionInformation?.calories || '',
            protein: p.nutritionInformation?.protein || '',
            carbohydrates: p.nutritionInformation?.carbohydrates || '',
            fats: p.nutritionInformation?.fats || '',
          });

          if (p.featuredImage?.url) {
            setExistingImageUrl(p.featuredImage.url);
          }

          if (Array.isArray(p.ingredients) && p.ingredients.length > 0) {
            setIngredients(p.ingredients);
          }

          if (Array.isArray(p.instructions) && p.instructions.length > 0) {
            setInstructions(p.instructions);
          }
        } catch (err) {
          console.error('Failed to load post for editing:', err);
          alert(err.customMessage || 'Could not load article');
          navigate('/admin/blog');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, isEditing, navigate]);

  // Auto-generate slug when title changes (if not edited manually)
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updates = { ...prev, title: val };
      if (!isEditing || !prev.slug) {
        updates.slug = val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
      }
      return updates;
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImageFile(file);
      setFeaturedImagePreview(URL.createObjectURL(file));
    }
  };

  // Recipe helpers
  const handleAddIngredient = () => {
    setIngredients([...ingredients, { item: '', quantity: '', notes: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const next = [...ingredients];
    next[index][field] = value;
    setIngredients(next);
  };

  const handleAddInstruction = () => {
    setInstructions([
      ...instructions,
      { step: instructions.length + 1, title: '', description: '' },
    ]);
  };

  const handleRemoveInstruction = (index) => {
    const filtered = instructions.filter((_, idx) => idx !== index);
    const renumbered = filtered.map((inst, idx) => ({ ...inst, step: idx + 1 }));
    setInstructions(renumbered);
  };

  const handleInstructionChange = (index, field, value) => {
    const next = [...instructions];
    next[index][field] = value;
    setInstructions(next);
  };

  const handleSubmit = async (e, forcedStatus = null) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('Please provide a title for the blog post.');
      setActiveTab('details');
      return;
    }

    setLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append('title', formData.title.trim());
      dataToSend.append('slug', formData.slug.trim());
      dataToSend.append('excerpt', formData.excerpt.trim());
      dataToSend.append('content', formData.content || '');
      dataToSend.append('category', formData.category);
      dataToSend.append('contentType', formData.contentType);
      dataToSend.append('status', forcedStatus || formData.status);
      dataToSend.append('isFeatured', formData.isFeatured.toString());
      if (formData.publishedAt) {
        dataToSend.append('publishedAt', formData.publishedAt);
      }
      dataToSend.append('readingTime', formData.readingTime.toString());

      dataToSend.append(
        'author',
        JSON.stringify({
          name: formData.authorName || 'OSOAA Nutrition Team',
          role: formData.authorRole || 'Editorial Team',
        })
      );

      const parsedTags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      dataToSend.append('tags', JSON.stringify(parsedTags));

      dataToSend.append('videoUrl', formData.videoUrl.trim());
      dataToSend.append('videoDuration', formData.videoDuration.trim());

      dataToSend.append('seoTitle', formData.seoTitle.trim() || formData.title.trim());
      dataToSend.append('seoDescription', formData.seoDescription.trim() || formData.excerpt.trim());
      
      const parsedKeywords = formData.seoKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      dataToSend.append('seoKeywords', JSON.stringify(parsedKeywords));

      // Recipe fields
      if (formData.category === 'recipes' || formData.contentType.includes('recipe')) {
        dataToSend.append('preparationTime', formData.preparationTime.trim());
        dataToSend.append('cookingTime', formData.cookingTime.trim());
        dataToSend.append('servings', formData.servings.trim());
        dataToSend.append('difficulty', formData.difficulty);

        const validIngredients = ingredients.filter((ing) => ing.item && ing.item.trim());
        dataToSend.append('ingredients', JSON.stringify(validIngredients));

        const validInstructions = instructions.filter((inst) => inst.description && inst.description.trim());
        dataToSend.append('instructions', JSON.stringify(validInstructions));

        dataToSend.append(
          'nutritionInformation',
          JSON.stringify({
            calories: formData.calories.trim(),
            protein: formData.protein.trim(),
            carbohydrates: formData.carbohydrates.trim(),
            fats: formData.fats.trim(),
          })
        );
      }

      // Featured Image
      if (featuredImageFile) {
        dataToSend.append('featuredImage', featuredImageFile);
      }

      if (isEditing) {
        await blogService.adminUpdatePost(id, dataToSend);
      } else {
        await blogService.adminCreatePost(dataToSend);
      }

      navigate('/admin/blog');
    } catch (err) {
      console.error('Failed to save post:', err);
      setErrorMessage(err.customMessage || err.message || 'Failed to save blog post');
    } finally {
      setLoading(false);
    }
  };

  const isRecipeType = formData.category === 'recipes' || formData.contentType.includes('recipe');

  if (initialLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-8 pb-20">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/blog"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-display">
              {isEditing ? 'Edit Blog Post' : 'Create New Article / Recipe'}
            </h1>
            <p className="text-xs text-slate-400">
              {isEditing ? `Editing: ${formData.title || 'Untitled'}` : 'Compose educational fitness or culinary content'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4 text-orange-400" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition disabled:opacity-50"
          >
            Draft
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'details'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Post Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'content'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>2. Content & Media</span>
        </button>

        {isRecipeType && (
          <button
            type="button"
            onClick={() => setActiveTab('recipe')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'recipe'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-orange-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>3. Recipe Details</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'seo'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{isRecipeType ? '4. SEO & Meta' : '3. SEO & Meta'}</span>
        </button>
      </div>

      {/* TAB 1: Core Post Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Article / Recipe Title *
              </label>
              <input
                type="text"
                placeholder="e.g. 5 Signs of Whey Protein Deficiency & How to Recover"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                URL Slug
              </label>
              <div className="flex items-center px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
                <span>/blog/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="custom-article-slug"
                  className="w-full bg-transparent text-orange-400 font-mono focus:outline-none ml-1"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Short Excerpt / Summary
                </label>
                <span>{formData.excerpt.length}/500</span>
              </div>
              <textarea
                rows="4"
                placeholder="A compelling brief summary shown on blog cards and search results..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                maxLength={500}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed"
              />
            </div>

            {/* Author Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Author Name
                </label>
                <input
                  type="text"
                  placeholder="OSOAA Nutrition Team"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Author Role / Title
                </label>
                <input
                  type="text"
                  placeholder="Certified Nutritionist / Editorial"
                  value={formData.authorRole}
                  onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Article Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="whey protein, creatine, muscle growth, nepal fitness, nutrition"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

          </div>

          {/* Right Column: Taxonomy & Publishing Meta */}
          <div className="lg:col-span-4 space-y-6 bg-slate-900 p-6 rounded-3xl border border-slate-800 h-fit">
            
            <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3">
              Taxonomy & Settings
            </h3>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  setFormData({
                    ...formData,
                    category: cat,
                    contentType: cat === 'recipes' ? 'written-recipe' : 'article',
                  });
                }}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
              >
                <option value="nepali-blog">Nepali Blog (नेपाली ब्लग)</option>
                <option value="english-blog">English Blog (Nutrition & Wellness)</option>
                <option value="recipes">Healthy Recipes (रेसिपी)</option>
              </select>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Content Type *
              </label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
              >
                <option value="article">Educational Article</option>
                <option value="written-recipe">Written Recipe</option>
                <option value="video-recipe">Video Recipe</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Publication Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
              >
                <option value="draft">Draft (Visible only in admin)</option>
                <option value="published">Published (Live to public)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Publish Date */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Publish Date
              </label>
              <input
                type="date"
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Estimated Reading Time */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Reading Time (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.readingTime}
                onChange={(e) => setFormData({ ...formData, readingTime: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Featured Post Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Feature on Hero</span>
                <span className="text-[10px] text-slate-400">Showcase in top spotlight carousel</span>
              </div>
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
              />
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: Content & Media */}
      {activeTab === 'content' && (
        <div className="space-y-8">
          
          {/* Media Header: Featured Image & Video URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            
            {/* Featured Image Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Featured Cover Image
              </label>

              <div className="relative aspect-[16/10] bg-slate-950 border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4 transition group">
                {featuredImagePreview || existingImageUrl ? (
                  <>
                    <img
                      src={featuredImagePreview || existingImageUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <label className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer transition">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer space-y-2 text-center">
                    <div className="p-3 rounded-2xl bg-slate-900 text-orange-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Upload High-Res Cover Image</p>
                      <p className="text-[10px] text-slate-500">JPG, PNG, WEBP up to 5MB (Cloudinary optimized)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Video Media Options */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  External Video URL (Optional)
                </label>
                <div className="flex items-center px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <Video className="w-4 h-4 text-orange-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... or Vimeo"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full bg-transparent text-white focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Embeds high quality YouTube / Vimeo player on the article page without autoplay.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Video Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8:45"
                  value={formData.videoDuration}
                  onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

          </div>

          {/* Main Rich Content Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Article Body Content
              </label>
              <span className="text-xs text-slate-400">Headings, Lists, Quotes, Tables supported</span>
            </div>
            
            <RichContentEditor
              value={formData.content}
              onChange={(val) => setFormData({ ...formData, content: val })}
              placeholder="Write detailed nutrition facts, scientific insights, or step-by-step guides..."
            />
          </div>

        </div>
      )}

      {/* TAB 3: Recipe Details (Dynamic Ingredients & Instructions) */}
      {activeTab === 'recipe' && isRecipeType && (
        <div className="space-y-8">
          
          {/* Quick Recipe Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Prep Time</label>
              <input
                type="text"
                placeholder="15 mins"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Cook Time</label>
              <input
                type="text"
                placeholder="20 mins"
                value={formData.cookingTime}
                onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Servings</label>
              <input
                type="text"
                placeholder="2 portions"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          {/* Nutrition Macros */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Nutritional Macros (Per Serving)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Calories (kcal)</label>
                <input
                  type="text"
                  placeholder="350"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Protein (g)</label>
                <input
                  type="text"
                  placeholder="32g"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono text-orange-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Carbs (g)</label>
                <input
                  type="text"
                  placeholder="24g"
                  value={formData.carbohydrates}
                  onChange={(e) => setFormData({ ...formData, carbohydrates: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Fats (g)</label>
                <input
                  type="text"
                  placeholder="6g"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Ingredients Builder */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ingredients List
                </h3>
                <p className="text-[11px] text-slate-400">Add measured ingredients required for this recipe</p>
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-mono text-slate-500 px-1 shrink-0">{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Ingredient name (e.g. OSOAA 100% Whey Protein)"
                      value={ing.item}
                      onChange={(e) => handleIngredientChange(idx, 'item', e.target.value)}
                      className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Quantity (e.g. 1 scoop / 33g)"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                      className="w-full sm:w-44 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      disabled={ingredients.length === 1}
                      className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Instructions Builder */}
          <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Step-by-Step Instructions
                </h3>
                <p className="text-[11px] text-slate-400">Stepwise cooking & mixing guide for readers</p>
              </div>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-4">
              {instructions.map((inst, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {inst.step}
                      </span>
                      <input
                        type="text"
                        placeholder="Step Title (e.g. Blend and Mix)"
                        value={inst.title}
                        onChange={(e) => handleInstructionChange(idx, 'title', e.target.value)}
                        className="bg-transparent text-xs font-bold text-white placeholder-slate-500 focus:outline-none w-full min-w-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      disabled={instructions.length === 1}
                      className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows="2"
                    placeholder="Describe how to execute this step..."
                    value={inst.description}
                    onChange={(e) => handleInstructionChange(idx, 'description', e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: SEO & SERP Preview */}
      {activeTab === 'seo' && (
        <div className="space-y-8">
          
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
            <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3">
              Search Engine Optimization (SEO) Metadata
            </h3>

            {/* SEO Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Custom SEO Title Tag
                </label>
                <span>{(formData.seoTitle || formData.title).length}/60 recommended</span>
              </div>
              <input
                type="text"
                placeholder={formData.title || 'SEO Title displayed on Google search results'}
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* SEO Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="font-bold uppercase tracking-wider text-slate-300">
                  Meta Description
                </label>
                <span>{(formData.seoDescription || formData.excerpt).length}/160 recommended</span>
              </div>
              <textarea
                rows="3"
                placeholder={formData.excerpt || 'Brief meta description for search engine ranking and snippets...'}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Target SEO Keywords (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="whey protein nepal, gym supplements kathmandu, bodybuilding diet"
                value={formData.seoKeywords}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Google Search SERP Snippet Preview */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-400" />
              <span>Google Search Result Snippet Preview</span>
            </h3>

            <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm max-w-2xl space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>https://osoaa.com.np › blog › {formData.slug || 'article-slug'}</span>
              </div>
              <h4 className="text-base sm:text-lg font-medium text-blue-800 hover:underline cursor-pointer truncate">
                {formData.seoTitle || formData.title || 'Your Article Title | OSOAA Wellness'}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {formData.seoDescription || formData.excerpt || 'Explore authentic wellness guides, nutrition tips, and fitness recipes from OSOAA Nepal.'}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Full Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between z-20">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Live Storefront Article Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-10 space-y-6">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                {formData.category}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black font-display text-brand-navy">
                {formData.title || 'Untitled Post'}
              </h1>

              {formData.excerpt && (
                <p className="text-base text-slate-600 leading-relaxed font-medium">
                  {formData.excerpt}
                </p>
              )}

              {(featuredImagePreview || existingImageUrl) && (
                <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md">
                  <img
                    src={featuredImagePreview || existingImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {isRecipeType && (
                <RecipeDetailsView
                  post={{
                    ...formData,
                    ingredients,
                    instructions,
                    nutritionInformation: {
                      calories: formData.calories,
                      protein: formData.protein,
                      carbohydrates: formData.carbohydrates,
                      fats: formData.fats,
                    },
                  }}
                />
              )}

              <RichTextContent content={formData.content} />
            </div>
          </div>
        </div>
      )}

    </form>
  );
};
