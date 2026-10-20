import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Sparkles, 
  Flame, 
  RotateCcw,
  ChefHat,
  HeartPulse,
  Tag
} from 'lucide-react';
import { blogService } from '../../services/blogService';
import { BlogCard } from '../../components/blog/BlogCard';
import { FeaturedBlogSection } from '../../components/blog/FeaturedBlogSection';
import { BLOG_CATEGORIES } from '../../utils/blogUtils';
import { Pagination } from '../../components/common/Pagination';
import { SEO } from '../../components/seo/SEO';

export const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentKeyword = searchParams.get('keyword') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentTag = searchParams.get('tag') || '';

  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(currentKeyword);

  // Sync search input when query param changes
  useEffect(() => {
    setSearchInput(currentKeyword);
  }, [currentKeyword]);

  // Fetch Featured Posts once on mount or category change
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await blogService.getFeaturedPosts(3);
        setFeaturedPosts(res.data || []);
      } catch (err) {
        console.error('Failed to load featured blogs:', err);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch main posts list based on active filters
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 9,
        sort: 'newest',
      };

      if (currentCategory && currentCategory !== 'all') {
        params.category = currentCategory;
      }
      if (currentKeyword) {
        params.keyword = currentKeyword;
      }
      if (currentTag) {
        params.tag = currentTag;
      }

      const res = await blogService.getPosts(params);
      setPosts(res.posts || []);
      setPagination(res.pagination || { page: 1, limit: 9, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch blog posts:', err);
      setError(err.customMessage || 'Could not load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentCategory, currentKeyword, currentTag, currentPage]);

  const handleCategoryChange = (categorySlug) => {
    const params = new URLSearchParams(searchParams);
    if (categorySlug === 'all') {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('keyword', searchInput.trim());
    } else {
      params.delete('keyword');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }
    setSearchParams(params);
  };

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Blog', item: '/blog' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <SEO
        title="Fitness, Nutrition & Healthy Recipes Hub"
        description="Explore science-backed fitness tips, nutrition advice, workout guidelines, and delicious high-protein recipes crafted for Nepal."
        canonical="/blog"
        noindex={Boolean(currentKeyword)}
        breadcrumbs={breadcrumbs}
      />
      
      {/* Hero Header */}
      <section className="bg-[#E5E7EB] text-black pt-14 pb-16 relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute inset-0 bg-[radial-gradient(#F97316_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-300 text-orange-600 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OSOAA Wellness & Nutrition Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-black leading-tight">
              Science-Backed Nutrition, Fitness & Healthy Recipes
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">
              Explore authentic guides in Nepali & English, protein kitchen recipes, workout nutrition, and wellness wisdom curated for your fitness journey.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search nutrition tips, whey recipes, creatine guides, Nepali articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xl border border-gray-300"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
              <button
                type="submit"
                className="absolute right-2 top-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        
        {/* Category Navigation Pills */}
        <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-md border border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {BLOG_CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.slug === 'recipes' && <ChefHat className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-orange-500'}`} />}
                {cat.slug === 'nepali-blog' && <BookOpen className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-black'}`} />}
                {cat.slug === 'english-blog' && <HeartPulse className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-black'}`} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Indicators */}
        {(currentKeyword || currentTag) && (
          <div className="flex items-center gap-3 pt-6 text-xs text-slate-600">
            <span>Showing results for:</span>
            {currentKeyword && (
              <span className="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-full font-bold flex items-center gap-1.5">
                Keyword: "{currentKeyword}"
              </span>
            )}
            {currentTag && (
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-full font-bold flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-orange-500" /> #{currentTag}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-orange-600 font-bold hover:underline ml-2 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}

        {/* Featured Section (Displayed when on page 1 and no search query) */}
        {!currentKeyword && !currentTag && currentPage === 1 && currentCategory === 'all' && featuredPosts.length > 0 && (
          <div className="pt-10">
            <FeaturedBlogSection featuredPosts={featuredPosts} />
          </div>
        )}

        {/* Main Content Listing */}
        <div className="pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-black">
              {currentCategory === 'recipes' 
                ? 'All Healthy Recipes' 
                : currentCategory === 'nepali-blog' 
                ? 'नेपाली स्वास्थ्य तथा पोषण लेखहरू' 
                : currentCategory === 'english-blog' 
                ? 'Nutrition & Fitness Articles' 
                : 'Latest Articles & Recipes'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {pagination.total} {pagination.total === 1 ? 'post' : 'posts'} found
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse">
                  <div className="aspect-[16/10] bg-slate-200 rounded-2xl w-full" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-10 bg-slate-100 rounded-xl w-full pt-4" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-white rounded-3xl border border-rose-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Unable to load posts</h3>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                onClick={fetchPosts}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="font-bold font-display text-black text-xl">
                No Content Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {currentKeyword || currentCategory !== 'all' || currentTag
                  ? 'No published articles match your current search or category criteria.'
                  : 'Check back soon! Our nutritionists and fitness experts are preparing new guides and recipes.'}
              </p>
              {(currentKeyword || currentCategory !== 'all' || currentTag) && (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition"
                >
                  View All Posts
                </button>
              )}
            </div>
          )}

          {/* Posts Grid */}
          {!loading && !error && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && (
            <Pagination
              currentPage={pagination.page || currentPage || 1}
              totalPages={pagination.pages || 1}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit || 9}
              onPageChange={handlePageChange}
              activeColor="orange"
            />
          )}

        </div>

      </div>
    </div>
  );
};
