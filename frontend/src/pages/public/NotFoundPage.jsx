import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { SEO } from '../../components/seo/SEO';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center bg-white">
      <SEO
        title="404 - Page Not Found"
        description="The requested page could not be found on OSOAA Nepal."
        noindex={true}
      />
      <div className="max-w-md space-y-6">
        <div className="text-8xl font-black text-black font-display">404</div>
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            to="/"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-orange-sm flex items-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl transition"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};
