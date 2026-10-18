import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles, 
  Eye, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ChefHat, 
  Video, 
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { blogService } from '../../services/blogService';
import { formatBlogDate, getCategoryMeta } from '../../utils/blogUtils';

export const AdminBlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedCount: 0,
    draftCount: 0,
    nepaliCount: 0,
    englishCount: 0,
    recipesCount: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAdminPosts = async () => {
    setLoading(true);
    try {
      const res = await blogService.adminGetPosts({
        keyword: keyword.trim(),
        category: categoryFilter,
        status: statusFilter,
        page,
        limit: 12,
      });
      setPosts(res.posts || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load admin blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPosts();
  }, [page, categoryFilter, statusFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAdminPosts();
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(id);
      await blogService.adminDeletePost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      setStats((prev) => ({ ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) }));
    } catch (err) {
      alert(err.customMessage || 'Failed to delete post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublish = async (post) => {
    try {
      setActionLoading(post._id);
      if (post.status === 'published') {
        const res = await blogService.adminUnpublishPost(post._id);
        setPosts((prev) => prev.map((p) => (p._id === post._id ? res.data : p)));
      } else {
        const res = await blogService.adminPublishPost(post._id);
        setPosts((prev) => prev.map((p) => (p._id === post._id ? res.data : p)));
      }
    } catch (err) {
      alert(err.customMessage || 'Failed to update publish status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      setActionLoading(id);
      const res = await blogService.adminToggleFeatured(id);
      setPosts((prev) => prev.map((p) => (p._id === id ? res.data : p)));
    } catch (err) {
      alert(err.customMessage || 'Failed to toggle featured status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            Blog & Content Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish educational wellness guides in Nepali, English articles, and healthy fitness recipes
          </p>
        </div>

        <Link
          to="/admin/blog/new"
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Post</span>
        </Link>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Content</span>
            <BookOpen className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.totalPosts || pagination.total}</p>
          <p className="text-[11px] text-slate-500 mt-1">{stats.recipesCount || 0} recipes included</p>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Published Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{stats.publishedCount || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Visible on website</p>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Drafts & Scheduled</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{stats.draftCount || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pending publication</p>
        </div>

        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Read Views</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2">{stats.totalViews?.toLocaleString() || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Reader engagements</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="w-full md:w-80 flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by title, tags, or slug..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Categories</option>
            <option value="nepali-blog">Nepali Blog (नेपाली ब्लग)</option>
            <option value="english-blog">English Blog (Wellness)</option>
            <option value="recipes">Healthy Recipes (रेसिपी)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>

      </div>

      {/* Posts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-950 text-white uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Post & Excerpt</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Views</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading blog catalog...</td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No blog posts found</p>
                    <p className="text-[11px] text-slate-500 mt-1">Create your first wellness article or recipe to get started.</p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const catMeta = getCategoryMeta(post.category);
                  const isPublished = post.status === 'published';

                  return (
                    <tr key={post._id} className="hover:bg-slate-800/40 transition">
                      
                      {/* Title & Image */}
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          {post.featuredImage?.url ? (
                            <img
                              src={post.featuredImage.url}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700 bg-slate-800"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-500 font-bold text-xs">
                              IMG
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[220px]" title={post.title}>
                              {post.title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                              /blog/{post.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${catMeta.badgeClass}`}>
                          {catMeta.label}
                        </span>
                      </td>

                      {/* Content Type */}
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          {post.contentType === 'video-recipe' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-orange-400" />
                              <span>Video Recipe</span>
                            </>
                          ) : post.contentType === 'written-recipe' ? (
                            <>
                              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                              <span>Recipe</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span>Article</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublish(post)}
                          disabled={actionLoading === post._id}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                            isPublished
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                          title={`Click to ${isPublished ? 'unpublish' : 'publish'}`}
                        >
                          {isPublished ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Featured Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFeature(post._id)}
                          disabled={actionLoading === post._id}
                          className={`p-1.5 rounded-lg border transition ${
                            post.isFeatured
                              ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                              : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
                          }`}
                          title={post.isFeatured ? 'Featured on home/blog hero' : 'Mark as featured'}
                        >
                          <Star className={`w-4 h-4 ${post.isFeatured ? 'fill-orange-400' : ''}`} />
                        </button>
                      </td>

                      {/* Views */}
                      <td className="p-4 font-mono text-slate-300">
                        {post.views || 0}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-400">
                        {formatBlogDate(post.publishedAt || post.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPublished && (
                            <Link
                              to={`/blog/${post.slug}`}
                              target="_blank"
                              className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition"
                              title="View on Live Storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <Link
                            to={`/admin/blog/edit/${post._id}`}
                            className="p-2 text-orange-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-orange-500 hover:border-orange-500 transition"
                            title="Edit Content"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDelete(post._id, post.title)}
                            disabled={actionLoading === post._id}
                            className="p-2 text-rose-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-rose-500 hover:border-rose-500 transition"
                            title="Delete"
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} posts)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-white px-2">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
