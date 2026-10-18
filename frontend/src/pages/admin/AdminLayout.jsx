import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { SEO } from '../../components/seo/SEO';

export const AdminLayout = () => {
  const location = useLocation();
  const { user, isLoading, checkAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route navigation
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Ensure auth check is executed for admin routes
  React.useEffect(() => {
    if (isLoading) {
      checkAuth();
    }
  }, [isLoading, checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <SEO title="Admin Portal" noindex={true} />
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strict role enforcement
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-white antialiased font-sans overflow-x-hidden">
      <SEO title="Admin Portal" noindex={true} />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
