import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight, Award, Check } from 'lucide-react';
import api from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { SEO } from '../../components/seo/SEO';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filters state from URL query params
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const keywordParam = searchParams.get('keyword') || '';
  const sortByParam = searchParams.get('sortBy') || 'newest';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const inStockParam = searchParams.get('inStock') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Load Categories and Brands
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Products on filter changes
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        const res = await api.get(`/products?${params.toString()}`);
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter modification
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const activeCategory = categories.find((c) => c.slug === categoryParam);
  const activeBrand = brands.find((b) => b.slug === brandParam);

  // Dynamic SEO metadata
  let pageTitle = 'Shop Authentic Nutrition & Fitness Supplements | Nepal Protein';
  if (activeBrand && activeCategory) {
    pageTitle = `${activeBrand.name} ${activeCategory.name} Supplements | Nepal Protein`;
  } else if (activeBrand) {
    pageTitle = `${activeBrand.name} Supplements in Nepal | Nepal Protein`;
  } else if (activeCategory) {
    pageTitle = `${activeCategory.name} Supplements in Nepal | Nepal Protein`;
  } else if (keywordParam) {
    pageTitle = `Search: "${keywordParam}" | Nepal Protein`;
  }

  const pageDescription = activeBrand?.description
    ? activeBrand.description
    : activeCategory?.description
    ? activeCategory.description
    : activeBrand
    ? `Shop authentic ${activeBrand.name} fitness supplements at Nepal Protein with guaranteed authenticity and nationwide delivery across Nepal.`
    : activeCategory
    ? `Buy genuine ${activeCategory.name} in Nepal. Batch-tested quality standards, 100% genuine products, and fast nationwide delivery at Nepal Protein.`
    : "Browse Nepal's premier collection of genuine whey protein, micronized creatine, pre-workouts, and multi-brand sports nutrition supplements at Nepal Protein.";

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Shop', item: '/shop' },
    ...(activeBrand ? [{ name: activeBrand.name, item: `/brands/${encodeURIComponent(activeBrand.slug)}` }] : []),
    ...(activeCategory ? [{ name: activeCategory.name, item: `/shop?category=${encodeURIComponent(activeCategory.slug)}` }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white min-h-[75vh]">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={
          brandParam
            ? `/shop?brand=${encodeURIComponent(brandParam)}`
            : categoryParam
            ? `/shop?category=${encodeURIComponent(categoryParam)}`
            : '/shop'
        }
        noindex={Boolean(keywordParam)}
        breadcrumbs={breadcrumbs}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {activeBrand && activeCategory
              ? `${activeBrand.name} — ${activeCategory.name}`
              : activeBrand
              ? `${activeBrand.name} Products`
              : activeCategory
              ? `Category: ${activeCategory.name}`
              : keywordParam
              ? `Search: "${keywordParam}"`
              : 'All Products'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {products.length} of {pagination.total} genuine wellness &amp; sports supplements at Nepal Protein
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-500" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortByParam}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white">Newest Arrivals</option>
              <option value="popular" className="bg-white">Most Popular</option>
              <option value="price-asc" className="bg-white">Price: Low to High</option>
              <option value="price-desc" className="bg-white">Price: High to Low</option>
              <option value="rating" className="bg-white">Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(brandParam || categoryParam || inStockParam || keywordParam) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Active filters:</span>
          {activeBrand && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-full">
              <span>Brand: {activeBrand.name}</span>
              <button onClick={() => handleFilterChange('brand', '')} className="hover:text-orange-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {activeCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-full">
              <span>Category: {activeCategory.name}</span>
              <button onClick={() => handleFilterChange('category', '')} className="hover:text-black">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {inStockParam === 'true' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-full">
              <span>In Stock Only</span>
              <button onClick={() => handleFilterChange('inStock', '')} className="hover:text-black">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-xs text-orange-600 hover:underline font-bold ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" />
                <span>Filters</span>
              </h2>
              {(brandParam || categoryParam || keywordParam || minPriceParam || maxPriceParam || inStockParam) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-orange-600 hover:underline font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Brands Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-orange-500" />
                <span>Brands</span>
              </h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2">
                <button
                  onClick={() => handleFilterChange('brand', '')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    !brandParam ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b._id}
                    onClick={() => handleFilterChange('brand', b.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                      brandParam === b.slug ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{b.name}</span>
                    {b.productCount !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${brandParam === b.slug ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {b.productCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories Filter */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categories</h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2">
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    !categoryParam ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => handleFilterChange('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                      categoryParam === cat.slug ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Availability Toggle */}
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockParam === 'true'}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked ? 'true' : '')}
                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-slate-700">In Stock Items Only</span>
              </label>
            </div>

          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-pulse">
                  <div className="aspect-square bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 sm:p-16 text-center rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-black">No matching supplements found</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                We couldn't find any products matching your current brand or filter combination. Try clearing some filters or exploring our other authentic brands.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(pagination.pages)].map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition shadow-sm ${
                      pagination.page === pageNumber
                        ? 'bg-black text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>

      </div>

      {/* Mobile Filters Slide-over Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white p-6 space-y-6 flex flex-col justify-between shadow-2xl">

              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="text-base font-black text-black">Filter Catalog</h3>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Brands */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-orange-500" />
                    <span>Brands</span>
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { handleFilterChange('brand', ''); setIsMobileFiltersOpen(false); }}
                      className={`w-full text-left text-xs py-2 px-3 rounded-lg font-semibold ${
                        !brandParam ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b._id}
                        onClick={() => { handleFilterChange('brand', b.slug); setIsMobileFiltersOpen(false); }}
                        className={`w-full text-left text-xs py-2 px-3 rounded-lg font-semibold flex items-center justify-between ${
                          brandParam === b.slug ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{b.name}</span>
                        {b.productCount !== undefined && (
                          <span className="text-[10px] opacity-80">{b.productCount}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Categories</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { handleFilterChange('category', ''); setIsMobileFiltersOpen(false); }}
                      className={`w-full text-left text-xs py-2 px-3 rounded-lg font-semibold ${
                        !categoryParam ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => { handleFilterChange('category', cat.slug); setIsMobileFiltersOpen(false); }}
                        className={`w-full text-left text-xs py-2 px-3 rounded-lg font-semibold ${
                          categoryParam === cat.slug ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Toggle */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockParam === 'true'}
                      onChange={(e) => {
                        handleFilterChange('inStock', e.target.checked ? 'true' : '');
                        setIsMobileFiltersOpen(false);
                      }}
                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-xs font-bold text-slate-700">In Stock Items Only</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => { handleClearFilters(); setIsMobileFiltersOpen(false); }}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm"
                >
                  Apply Filters
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
