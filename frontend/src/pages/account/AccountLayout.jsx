import React from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Package, User, Heart, MapPin, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SEO } from '../../components/seo/SEO';

export const AccountLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center bg-white">
        <SEO title="My Account" noindex={true} />
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'My Orders', path: '/account/orders', icon: Package },
    { name: 'My Wishlist', path: '/account/wishlist', icon: Heart },
    { name: 'Profile Settings', path: '/account/profile', icon: User },
    { name: 'Saved Addresses', path: '/account/addresses', icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white min-h-[75vh]">
      <SEO title="My Account" noindex={true} />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-black">My Account</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Welcome back, <strong className="text-black">{user.name}</strong> ({user.email})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Account Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-2 bg-slate-50 border border-slate-200 rounded-3xl p-4 shadow-sm">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${isActive
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white hover:text-orange-600 shadow-none'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition pt-3 border-t border-slate-200 mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Content Outlet */}
        <main className="lg:col-span-9">
          <Outlet />
        </main>

      </div>

    </div>
  );
};
