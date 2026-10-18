import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, ShieldCheck, ChevronRight, Filter, ChevronLeft, ExternalLink, Package, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { SEO } from '../../components/seo/SEO';
import { buildBrandSchema } from '../../utils/seoSchemas';

export const BrandDetailPage = () => {
  const { slug } = useParams();

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load Brand information
  useEffect(() => {
    const fetchBrand = async () => {
      setIsLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/brands/${slug}`);
        setBrand(res.data.data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrand();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Load Products for this brand
  useEffect(() => {
    if (!brand) return;

    const fetchBrandProducts = async () => {
      try {
        const res = await api.get(`/products?brand=${encodeURIComponent(brand.slug)}&page=${page}&limit=12&sortBy=${sortBy}`);
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        console.error('Failed to load brand products:', err);
      }
    };

    fetchBrandProducts();
  }, [brand, page, sortBy]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4 min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading brand catalog...</p>
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6 min-h-[70vh]">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Award className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-black">Brand Not Found</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            The brand you are looking for is currently unavailable, inactive, or may have been renamed.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/brands"
            className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Browse All Brands
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm transition"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Brands', item: '/brands' },
    { name: brand.name, item: `/brands/${brand.slug}` },
  ];

  const brandSchema = buildBrandSchema(brand);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-white min-h-[75vh]">
      <SEO
        title={brand.seoTitle || `${brand.name} Supplements in Nepal | Buy Authentic | Nepal Protein`}
        description={
          brand.seoDescription ||
          brand.description ||
          `Shop 100% authentic ${brand.name} sports nutrition, protein powder, and supplements in Nepal at Nepal Protein with guaranteed authenticity.`
        }
        canonical={`/brands/${brand.slug}`}
        breadcrumbs={breadcrumbs}
        ogImage={brand.logo?.url}
        jsonLd={brandSchema}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-orange-600 font-medium">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/brands" className="hover:text-orange-600 font-medium">Brands</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">{brand.name}</span>
      </nav>

      {/* Brand Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5 min-w-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-3 shadow-sm shrink-0">
            {brand.logo?.url ? (
              <img src={brand.logo.url} alt={brand.name} className="w-full h-full object-contain" />
            ) : (
              <div className="font-display font-black text-2xl sm:text-3xl text-black">
                {brand.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                {brand.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>100% Genuine</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {brand.description || 'Authentic performance nutrition and laboratory-certified supplements available at Nepal Protein.'}
            </p>

            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-orange-600 font-bold hover:underline pt-1"
              >
                <span>Official Brand Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Brand Summary Pill */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4 shrink-0 self-stretch md:self-auto justify-between md:justify-start">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Catalog Available</p>
            <p className="text-lg font-black text-black">{pagination.total} Products</p>
          </div>
          <Link
            to={`/shop?brand=${encodeURIComponent(brand.slug)}`}
            className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm transition shrink-0"
          >
            Filter in Shop
          </Link>
        </div>
      </div>

      {/* Catalog Controls (Sort & Product Counter) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-black">
            {brand.name} Products in Nepal
          </h2>
          <p className="text-xs text-slate-500">
            Showing {products.length} of {pagination.total} products
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs self-start sm:self-auto">
          <span className="text-slate-500 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="popular">Most Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-black">No products currently available for {brand.name}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Products from this brand are being replenished or updated. Please check back shortly or browse other brands.
          </p>
          <Link
            to="/shop"
            className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm transition"
          >
            View All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[...Array(pagination.pages)].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition shadow-sm ${
                  page === pageNum
                    ? 'bg-black text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
