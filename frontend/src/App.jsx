import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import { RootLayout } from './layouts/RootLayout';
import { AccountLayout } from './pages/account/AccountLayout';
import { AdminLayout } from './pages/admin/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ShopPage } from './pages/public/ShopPage';
import { BrandsPage } from './pages/public/BrandsPage';
import { BrandDetailPage } from './pages/public/BrandDetailPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { FaqPage } from './pages/public/FaqPage';
import { PoliciesPage } from './pages/public/PoliciesPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { BlogPage } from './pages/public/BlogPage';
import { BlogDetailsPage } from './pages/public/BlogDetailsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Checkout Pages
import { CartPage } from './pages/checkout/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { OrderSuccessPage } from './pages/checkout/OrderSuccessPage';
import { OrderTrackingPage } from './pages/checkout/OrderTrackingPage';
import { EsewaCallbackPage } from './pages/checkout/EsewaCallbackPage';

// Customer Account Pages
import { ProfilePage } from './pages/account/ProfilePage';
import { OrdersPage } from './pages/account/OrdersPage';
import { OrderDetailPage } from './pages/account/OrderDetailPage';
import { WishlistPage } from './pages/account/WishlistPage';
import { AddressesPage } from './pages/account/AddressesPage';

// Admin Dashboard Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminBrandsPage } from './pages/admin/AdminBrandsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminBlogPage } from './pages/admin/AdminBlogPage';
import { AdminBlogFormPage } from './pages/admin/AdminBlogFormPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Customer & Public Routes (Wrapped with RootLayout) */}
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="brands/:slug" element={<BrandDetailPage />} />
        <Route path="brand/:slug" element={<BrandDetailPage />} />
        <Route path="product/:slug" element={<ProductDetailPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogDetailsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="faq" element={<FaqPage />} />
        
        {/* Policies */}
        <Route path="shipping-policy" element={<PoliciesPage />} />
        <Route path="return-policy" element={<PoliciesPage />} />
        <Route path="privacy-policy" element={<PoliciesPage />} />
        <Route path="terms-conditions" element={<PoliciesPage />} />
        <Route path="terms-and-conditions" element={<PoliciesPage />} />

        {/* Auth */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Checkout & Tracking */}
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-success" element={<OrderSuccessPage />} />
        <Route path="order-tracking" element={<OrderTrackingPage />} />
        <Route path="checkout/payment/esewa-callback" element={<EsewaCallbackPage />} />

        {/* Customer Account Sub-routes */}
        <Route path="account" element={<AccountLayout />}>
          <Route index element={<OrdersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="addresses" element={<AddressesPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin Protected Dashboard Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage />} />
        <Route path="products/edit/:id" element={<AdminProductFormPage />} />
        <Route path="blog" element={<AdminBlogPage />} />
        <Route path="blog/new" element={<AdminBlogFormPage />} />
        <Route path="blog/edit/:id" element={<AdminBlogFormPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="brands" element={<AdminBrandsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
