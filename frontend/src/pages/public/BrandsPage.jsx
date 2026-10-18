import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ArrowRight, ShieldCheck, Sparkles, Package } from 'lucide-react';
import api from '../../services/api';
import { SEO } from '../../components/seo/SEO';

export const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get('/brands');
        setBrands(res.data.data || []);
      } catch (err) {
        console.error('Failed to load brands:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Brands', item: '/brands' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 bg-white min-h-[75vh]">
      <SEO
        title="Our Authentic Brands | Nepal Protein"
        description="Explore 100% genuine sports nutrition and wellness supplement brands sold at Nepal Protein, including OSOAA and world-renowned manufacturers."
        canonical="/brands"
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Guaranteed Authentic Sourcing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight">
          Browse by Brand
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          At Nepal Protein, we partner directly with certified supplement manufacturers and verified importers. Explore our curated multi-brand catalog with zero counterfeit risk.
        </p>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 animate-pulse space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
          <p className="text-sm font-semibold text-slate-700">No active brands currently listed.</p>
          <Link to="/shop" className="text-xs text-orange-600 font-bold hover:underline">
            View All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand._id}
              to={`/brands/${brand.slug}`}
              className="group p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 hover:border-orange-500 hover:shadow-brand transition-all duration-300 flex flex-col justify-between space-y-5 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2.5 overflow-hidden group-hover:scale-105 transition">
                    {brand.logo?.url ? (
                      <img src={brand.logo.url} alt={brand.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="font-display font-black text-xl text-black">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Brand</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black text-black group-hover:text-orange-600 transition">
                    {brand.name}
                  </h2>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {brand.description || 'Authentic performance sports nutrition and fitness supplements.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Package className="w-3.5 h-3.5 text-orange-500" />
                  <span>{brand.productCount || 0} Products</span>
                </span>
                <span className="text-orange-600 group-hover:translate-x-1 transition flex items-center gap-1">
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
