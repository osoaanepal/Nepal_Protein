import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Flame,
  Truck
} from 'lucide-react';
import api from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { DftqcTrustSection } from '../../components/trust/DftqcTrustSection';
import { useSettingsStore } from '../../store/settingsStore';
import { SEO } from '../../components/seo/SEO';
import { buildOrganizationSchema, buildWebSiteSchema } from '../../utils/seoSchemas';

export const HomePage = () => {
  const { settings } = useSettingsStore();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [featRes, bestRes, catRes, brandRes, banRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/products/best-sellers'),
          api.get('/categories'),
          api.get('/brands'),
          api.get('/banners'),
        ]);

        setFeaturedProducts(featRes.data.data || []);
        setBestSellers(bestRes.data.data || []);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
        setBanners(banRes.data.data || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const heroBanner = banners.length > 0 ? banners[0] : null;

  const homepageSchemas = React.useMemo(() => {
    return [buildOrganizationSchema(), buildWebSiteSchema()];
  }, []);

  return (
    <div className="space-y-16 lg:space-y-24 pb-20 bg-white">
      <SEO
        title="100% Authentic Whey Protein & Fitness Supplements in Nepal | Nepal Protein"
        description="Shop authentic sports nutrition, whey protein isolate, micronized creatine monohydrate, pre-workout, and fitness supplements in Nepal from verified brands including OSOAA at Nepal Protein. Fast nationwide delivery."
        canonical="/"
        ogImage={heroBanner?.desktopImage?.url}
        jsonLd={homepageSchemas}
      />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[75vh] flex items-center justify-center overflow-hidden bg-gray-900">

        {/* Background Image with Neutral Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBanner?.desktopImage?.url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1800&auto=format&fit=crop&q=80'}
            alt="Nepal Protein Hero"
            className="w-full h-full object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/80 to-gray-900/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/90 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24 w-full">
          <div className="max-w-2xl space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">



            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] break-words">
              {heroBanner?.title ? (
                heroBanner.title
              ) : (
                <>
                  Fuel Your Potential with{' '}
                  <span className="text-orange-400">
                    100% Authentic
                  </span>{' '}
                  Nutrition.
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-gray-200 leading-relaxed max-w-xl">
              {heroBanner?.subtitle || 'Ultra-pure whey protein isolate, micronized creatine, pre-workout and performance supplements tested under DFTQC quality testing standards.'}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <Link
                to={heroBanner?.ctaLink || '/shop'}
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-orange-md flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
              >
                <span>{heroBanner?.ctaText || 'Shop Best Sellers'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              <Link
                to="/shop?category=protein"
                className="px-6 sm:px-7 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold text-xs sm:text-sm rounded-xl backdrop-blur-md transition-all text-center"
              >
                Explore Whey Protein
              </Link>
            </div>

            {/* Trust Highlights under Hero */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-700/80 text-xs text-gray-300">
              <div>
                <p className="text-xs sm:text-base font-extrabold text-white">DFTQC</p>
                <p className="text-[10px] sm:text-[11px] leading-tight text-gray-400">Quality Standards Aligned</p>
              </div>
              <div>
                <p className="text-xs sm:text-base font-extrabold text-white">100% Purity</p>
                <p className="text-[10px] sm:text-[11px] leading-tight text-gray-400">Zero Banned Substances</p>
              </div>
              <div>
                <p className="text-xs sm:text-base font-extrabold text-white">Fast Delivery</p>
                <p className="text-[10px] sm:text-[11px] leading-tight text-gray-400">Across all 7 Provinces</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:mb-8 sm:pb-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
              Shop By Goal & Category
            </h2>
          </div>


        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/shop?category=${cat.slug}`}
              className="group rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-lg flex flex-col items-center text-center overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              {/* Larger Category Image */}
              <div className="w-full aspect-square bg-slate-50 overflow-hidden">
                <img
                  src={
                    cat.image?.url ||
                    'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80'
                  }
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Category Name */}
              <div className="w-full min-h-[64px] px-2 py-4 flex items-center justify-center">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2.5 FEATURED BRANDS SECTION */}
      {brands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:mb-8 sm:pb-5">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
                Shop By Brand
              </h2>

            </div>

            <Link
              to="/brands"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-orange-600 transition-colors hover:text-orange-700 sm:text-sm"
            >
              <span>View All</span>

            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {brands.map((b) => (
              <Link
                key={b._id}
                to={`/brands/${b.slug}`}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-brand flex flex-col items-center text-center space-y-2.5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform overflow-hidden">
                  {b.logo?.url ? (
                    <img src={b.logo.url} alt={b.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="font-display font-black text-base text-slate-800">{b.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition truncate max-w-full">
                  {b.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. BEST SELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:mb-8 sm:pb-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
              Best Selling Supplements
            </h2>
          </div>

          <Link
            to="/shop?sortBy=popular"
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-orange-600 transition-colors hover:text-orange-700 sm:text-sm"
          >
            <span>Explore All</span>

          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. DFTQC QUALITY STANDARDS TRUST SECTION */}
      <DftqcTrustSection />

      {/* 5. FEATURED / NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:mb-8 sm:pb-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
              Featured Performance Products
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. WHY CHOOSE NEPAL PROTEIN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-black">Why Athletes & Fitness Enthusiasts Choose Nepal Protein</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              We eliminate counterfeit risks with multi-brand direct sourcing, certified manufacturer partnerships, and transparent nutritional profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black">100% Sealed & Authentic</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct manufacturing and verified distribution ensures you never receive diluted or counterfeit products.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black">Optimal Bioavailability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Formulated with premium isolates and micronized particles for rapid absorption, minimal bloating, and maximum recovery.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black">Fast Nationwide Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Delivering straight to your doorstep across Kathmandu Valley and all major cities in Nepal in 2-4 business days.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
