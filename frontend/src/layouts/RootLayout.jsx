import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/cart/CartDrawer';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useWishlistStore } from '../store/wishlistStore';

export const RootLayout = () => {
  const { user } = useAuthStore();
  const { fetchPublicSettings } = useSettingsStore();
  const { fetchWishlist, clearWishlist } = useWishlistStore();

  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      clearWishlist();
    }
  }, [user, fetchWishlist, clearWishlist]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 antialiased font-sans selection:bg-orange-500 selection:text-white">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};
