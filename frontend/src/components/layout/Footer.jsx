import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  RefreshCw,
  Lock,
  Facebook,
  Instagram,
  Youtube,
  Building2,
  Globe,
  PackageCheck
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export const Footer = () => {
  const { settings } = useSettingsStore();

  const brandName = settings?.businessName || 'Nepal Protein';
  const tagline = settings?.tagline || 'Authentic Sports Nutrition';
  const phone = settings?.contact?.phone || '';
  const email = settings?.contact?.email || '';
  const address = settings?.contact?.address || '';

  return (
    <footer className="bg-[#E5E7EB] text-black pt-16 pb-12 border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white text-orange-500 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-black">DFTQC Standards</h4>
              <p className="text-xs text-gray-700">Quality tested standards</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white text-orange-500 shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-black">Nationwide Delivery</h4>
              <p className="text-xs text-gray-700">Across Nepal in 2-4 days</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white text-orange-500 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-black">Secure eSewa & COD</h4>
              <p className="text-xs text-gray-700">100% safe transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white text-orange-500 shadow-sm">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-black">100% Authentic</h4>
              <p className="text-xs text-gray-700">Genuine sealed batches</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12">

          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-3xl tracking-wider text-black">
                {brandName}
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
            </div>
            <p className="text-xs text-orange-600 font-bold tracking-widest uppercase">
              {tagline}
            </p>
            <p className="text-xs text-gray-800 leading-relaxed max-w-sm">
              Nepal's trusted sports nutrition &amp; fitness supplements store. Delivering ultra-pure whey protein, micronized creatine, pre-workout, and fitness supplements from authentic brands including OSOAA with fast nationwide delivery.
            </p>

          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-black tracking-widest uppercase">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/shop?category=protein" className="text-gray-700 hover:text-orange-600 transition">Whey Protein</Link></li>
              <li><Link to="/shop?category=creatine" className="text-gray-700 hover:text-orange-600 transition">Creatine Monohydrate</Link></li>
              <li><Link to="/shop?category=pre-workout" className="text-gray-700 hover:text-orange-600 transition">Pre-Workout</Link></li>
              <li><Link to="/shop?category=mass-gainer" className="text-gray-700 hover:text-orange-600 transition">Mass Gainer</Link></li>
              <li><Link to="/shop?category=amino-acids-bcaa" className="text-gray-700 hover:text-orange-600 transition">Amino Acids & BCAA</Link></li>
              <li><Link to="/shop?category=gym-accessories-shakers" className="text-gray-700 hover:text-orange-600 transition">Gym Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-black tracking-widest uppercase">Customer Service</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/blog" className="text-orange-600 hover:text-orange-700 font-semibold transition">Blog & Wellness Hub</Link></li>
              <li><Link to="/blog?category=nepali-blog" className="text-gray-700 hover:text-orange-600 transition">नेपाली स्वास्थ्य ब्लग (Nepali)</Link></li>
              <li><Link to="/blog?category=recipes" className="text-gray-700 hover:text-orange-600 transition">Healthy Protein Recipes</Link></li>
              <li><Link to="/order-tracking" className="text-gray-700 hover:text-orange-600 transition">Track Your Order</Link></li>
              <li><Link to="/brands" className="text-gray-700 hover:text-orange-600 transition">Our Brands</Link></li>
              <li><Link to="/about" className="text-gray-700 hover:text-orange-600 transition">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-700 hover:text-orange-600 transition">Contact Us</Link></li>
              <li><Link to="/faq" className="text-gray-700 hover:text-orange-600 transition">Frequently Asked Questions</Link></li>
              <li><Link to="/shipping-policy" className="text-gray-700 hover:text-orange-600 transition">Shipping Policy</Link></li>
              <li><Link to="/return-policy" className="text-gray-700 hover:text-orange-600 transition">Return & Refund Policy</Link></li>
              <li><Link to="/privacy-policy" className="text-gray-700 hover:text-orange-600 transition">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="text-gray-700 hover:text-orange-600 transition">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-black tracking-widest uppercase">Contact Us</h4>
            <ul className="space-y-3 text-xs text-gray-800">
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{phone}</span>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-orange-600 transition">{email}</a>
                </li>
              )}
            </ul>

            <div className="pt-3 border-t border-gray-300">
              <p className="text-[11px] text-gray-700 mb-1.5">Official Payment Methods:</p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-gray-300 text-black rounded-lg text-[11px] font-bold">
                  eSewa
                </span>
                <span className="px-2.5 py-1 bg-gray-300 text-black rounded-lg text-[11px] font-medium">
                  Cash on Delivery (COD)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Transparency & Product Sourcing */}
        <div className="py-8 sm:py-10 border-t border-gray-300">
          <div className="max-w-3xl mb-7">
            <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-wider">
              Business Transparency &amp; Product Sourcing
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed max-w-2xl">
              Learn how our business, online brand, and distribution network work
              together to bring products to customers across Nepal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Registered Business */}
            <div className="min-w-0 flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-300 shadow-sm transition-colors">
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-600">
                <Building2 className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-black leading-snug">
                  Arushi International
                </h4>
                <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                  Registered business · PAN/VAT
                </p>
              </div>
            </div>

            {/* Public-Facing Brand */}
            <div className="min-w-0 flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-300 shadow-sm transition-colors">
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-600">
                <Globe className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-black leading-snug">
                  Nepal Protein
                </h4>
                <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                  Public-facing brand and e-commerce website
                </p>
              </div>
            </div>

            {/* Distribution Network */}
            <div className="min-w-0 flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-300 shadow-sm transition-colors sm:col-span-2 lg:col-span-1">
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-600">
                <PackageCheck className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-black leading-snug">
                  Nepali distributors
                </h4>
                <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                  Source genuine products and retain purchase invoices
                </p>
              </div>
            </div>

          </div>
        </div>


        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 border-t border-gray-300 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <p className="text-center md:text-right">
            Pricing displayed in Nepalese Rupees (NPR). All supplements laboratory batch-tested.
          </p>
        </div>

      </div>
    </footer>
  );
};
