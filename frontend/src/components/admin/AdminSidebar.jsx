import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Layers, 
  Award, 
  MessageSquare, 
  Tag, 
  Image, 
  Settings, 
  ArrowLeft,
  ShieldCheck,
  BookOpen,
  X
} from 'lucide-react';

export const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Products Catalog', path: '/admin/products', icon: Package },
    { name: 'Blog & Content Hub', path: '/admin/blog', icon: BookOpen },
    { name: 'Orders & Fulfillment', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers & Users', path: '/admin/customers', icon: Users },
    { name: 'Categories', path: '/admin/categories', icon: Layers },
    { name: 'Brands Management', path: '/admin/brands', icon: Award },
    { name: 'Customer Reviews', path: '/admin/reviews', icon: MessageSquare },
    { name: 'Discount Coupons', path: '/admin/coupons', icon: Tag },
    { name: 'Hero Banners', path: '/admin/banners', icon: Image },
    { name: 'Business & DFTQC Settings', path: '/admin/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-5 overflow-y-auto">
      <div className="space-y-6">
        
        {/* Admin Brand Pill */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500 text-white font-black font-display text-sm shadow-md shadow-orange-500/30">
              NP
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Nepal Protein Admin</h2>
              <p className="text-[10px] text-orange-400 font-mono font-medium">Production Portal</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>

      {/* Footer Return Link */}
      <div className="pt-6 border-t border-slate-800 mt-6">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Storefront</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen shrink-0 hidden lg:block sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 z-10 shadow-2xl transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};
