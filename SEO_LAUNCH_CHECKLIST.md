# OSOAA NEPAL — PRE-DEPLOYMENT SEO IMPLEMENTATION & LAUNCH CHECKLIST

> **Status:** Production-Ready Pre-Deployment  
> **Brand:** OSOAA Nepal ("A Journey of Wellness")  
> **Target Market:** Nepal (Kathmandu Valley & Nationwide across Provinces 1–7)  
> **Currency:** Nepalese Rupee (`NPR` / `Rs.`)  
> **Architecture:** Decoupled Full-Stack (React 18 + Vite Frontend | Node.js + Express Backend | MongoDB)  
> **Date:** October 2026

---

## 1. Executive Implementation Summary

The pre-deployment SEO architecture for **OSOAA Nepal** has been completely implemented in a **strictly hosting-independent manner**. No fictitious production domains or unverified indexing promises have been hardcoded. All dynamic endpoints, canonical URL builders, and Open Graph tags dynamically resolve from the deployment environment or incoming HTTP headers.

---

## 2. 17-Phase Implementation Matrix

| Phase | Category | Description | Status | Verification Reference |
| :--- | :--- | :--- | :---: | :--- |
| **01** | **Domain & Environment** | Centralized URL resolution via `VITE_SITE_URL` / `SITE_URL` with dynamic header fallback | **COMPLETED** | `frontend/src/config/siteConfig.js`, `backend/src/config/env.js` |
| **02** | **Head Management** | Universal `react-helmet-async` provider and `<SEO />` wrapper for React SPA | **COMPLETED** | `frontend/src/components/seo/SEO.jsx`, `frontend/src/main.jsx` |
| **03** | **Dynamic XML Sitemap** | Automated `/sitemap.xml` streaming MongoDB collections (static, categories, products, blogs) | **COMPLETED** | `backend/src/services/seo.service.js`, `backend/src/controllers/seo.controller.js` |
| **04** | **Robots.txt Directives** | Disallow sensitive paths (`/admin`, `/account`, `/checkout`, `/cart`, `/api/`, auth) & link to sitemap | **COMPLETED** | `backend/src/controllers/seo.controller.js`, `frontend/public/robots.txt` |
| **05** | **Homepage SEO** | Meta tags, OpenGraph, Organization & WebSite JSON-LD with Sitelinks Searchbox | **COMPLETED** | `frontend/src/pages/public/HomePage.jsx` |
| **06** | **Catalog & Category SEO** | Dynamic titles, category descriptions, collection breadcrumbs, query noindex for search | **COMPLETED** | `frontend/src/pages/public/ShopPage.jsx` |
| **07** | **Product Detail SEO** | Schema.org `Product` JSON-LD (Name, SKU, Brand, Offer in NPR, Stock status, Ratings) | **COMPLETED** | `frontend/src/pages/public/ProductDetailPage.jsx`, `seoSchemas.js` |
| **08** | **Blog & Recipe SEO** | Schema.org `BlogPosting` and `Recipe` JSON-LD (prep time, cook time, nutrition, steps) | **COMPLETED** | `frontend/src/pages/public/BlogDetailsPage.jsx`, `frontend/src/pages/public/BlogPage.jsx` |
| **09** | **Informational Pages** | Dedicated metadata for About, Contact, and Policy pages (Shipping, Return, Privacy, Terms) | **COMPLETED** | `AboutPage.jsx`, `ContactPage.jsx`, `PoliciesPage.jsx` |
| **10** | **FAQ Rich Snippets** | Schema.org `FAQPage` JSON-LD accordion markup with questions and verified answers | **COMPLETED** | `frontend/src/pages/public/FaqPage.jsx` |
| **11** | **Crawl Budget & Noindex** | Global `noindex, nofollow` protection on private routes (Cart, Checkout, Account, Admin, Auth) | **COMPLETED** | Layouts & Auth/Checkout pages |
| **12** | **404 Handling** | Custom `NotFoundPage` with `noindex` directive, proper status handling, and navigation CTAs | **COMPLETED** | `frontend/src/pages/public/NotFoundPage.jsx` |
| **13** | **Structured Data Library** | Modular, sanitizing JSON-LD builders in `seoSchemas.js` with XSS safety escaping | **COMPLETED** | `frontend/src/utils/seoSchemas.js` |
| **14** | **Semantic HTML & Media** | Single `<h1>` per page, hierarchical `<h2>`/`<h3>`, descriptive image `alt` tags, lazy loading | **COMPLETED** | Public page templates & components |
| **15** | **Internal Link Graph** | Search-engine indexable `<Link>` and `<nav>` anchors in Navbar, Footer, and Breadcrumbs | **COMPLETED** | `Navbar.jsx`, `Footer.jsx`, `ProductDetailPage.jsx` |
| **16** | **Performance & Web Vitals** | Preconnect font tags, `display=swap`, WebP image fallbacks, `loading="lazy"` on thumbnails | **COMPLETED** | `frontend/index.html`, `ProductCard.jsx`, `BlogCard.jsx` |
| **17** | **Security & Deployment** | Express Helmet, Cache-Control headers on SEO endpoints, proxy config & pre-launch checklist | **COMPLETED** | `backend/src/server.js`, `SEO_LAUNCH_CHECKLIST.md` |

---

## 3. Environment Variable Configuration Guide

Before launching to any hosting platform (e.g. AWS, DigitalOcean, Render, Vercel, Railway, cPanel), populate the real production domain in your environment files:

### Frontend Environment (`frontend/.env` or Host Environment Variables)
```env
# Full live canonical base URL of your website WITHOUT trailing slash:
VITE_SITE_URL=https://your-production-domain.com.np
```

### Backend Environment (`backend/.env` or Host Environment Variables)
```env
# Matches the canonical public website URL for sitemap & robots links:
SITE_URL=https://your-production-domain.com.np

# Frontend client URL for CORS headers:
CLIENT_URL=https://your-production-domain.com.np
```

> **Note on Local Development & Staging:**  
> If `VITE_SITE_URL` and `SITE_URL` are not defined, the system automatically uses dynamic browser `window.location.origin` (frontend) and dynamic request headers (`x-forwarded-host` / `req.get('host')`) so development tunneling and preview builds work without broken canonical links.

---

## 4. Endpoints & Route Indexing Strategy

### Indexable Public URLs (Included in XML Sitemap & Search Engines)
- `GET /` — Homepage (Daily, Priority 1.0)
- `GET /shop` — Main Catalog (Daily, Priority 0.9)
- `GET /shop?category=:slug` — Category Filter Pages (Weekly, Priority 0.8)
- `GET /product/:slug` — Individual Product Pages (Weekly, Priority 0.8)
- `GET /blog` — Blog Hub (Daily, Priority 0.8)
- `GET /blog/:slug` — Individual Blog & Recipe Posts (Monthly, Priority 0.7)
- `GET /about` — Brand Story & DFTQC Standards (Monthly, Priority 0.6)
- `GET /contact` — Customer Service & Store Info (Monthly, Priority 0.6)
- `GET /faq` — Frequently Asked Questions (Monthly, Priority 0.6)
- `GET /shipping-policy` — Shipping & Delivery Timelines (Monthly, Priority 0.4)
- `GET /return-policy` — Sealed Supplement Return Policy (Monthly, Priority 0.4)
- `GET /privacy-policy` — Data Privacy (Monthly, Priority 0.4)
- `GET /terms-conditions` — Terms of Service (Monthly, Priority 0.4)

### Excluded / Disallowed URLs (`noindex, nofollow` + `robots.txt` Disallow)
- `/admin/*` — Private administration dashboard
- `/account/*` — Customer orders, profile, wishlist, and saved addresses
- `/cart` — Dynamic checkout cart
- `/checkout/*` — Payment processing and order placement
- `/order-success` — Order confirmation screen with order numbers
- `/order-tracking` — Real-time courier dispatch tracker
- `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` — Authentication
- `/api/*` — Backend RESTful API endpoints

---

## 5. Structured Data (Schema.org) Verification

The following Schema.org types are generated and rendered into `<script type="application/ld+json">`:

1. **`Organization`**: Brand name, logo, contact telephone (`+977-9802949872`), email, Birgunj address, customer service language (`en`, `ne`), and verified social links.
2. **`WebSite`**: Site name, canonical URL, and Sitelinks Searchbox `SearchAction` (`/shop?keyword={search_term_string}`).
3. **`Product`**: Product name, high-resolution images, clean description, SKU, MPN, Brand (`OSOAA`), Offer (`priceCurrency: "NPR"`, price, availability `InStock`/`OutOfStock`), and `AggregateRating` (when user reviews exist).
4. **`BlogPosting`**: Headline, excerpt, author name, publisher, published/updated dates, and canonical URL.
5. **`Recipe`**: Recipe name, preparation time (`prepTime`), cooking time (`cookTime`), servings (`recipeYield`), ingredients (`recipeIngredient`), and step-by-step instructions (`recipeInstructions`).
6. **`FAQPage`**: 5 core customer questions and verified answers regarding product authenticity, DFTQC testing, and delivery in Nepal.
7. **`HealthAndBeautyBusiness` / Local Store**: Contact telephone, Birgunj address, operating hours, price range in NPR.
8. **`BreadcrumbList`**: Hierarchical position tracking for category, product, and blog pages.

---

## 6. Pre-Launch Verification Commands

Run these automated checks before any deployment:

```bash
# 1. Run Backend Automated SEO Test Suite (14 unit tests)
cd backend
npm run test:seo

# 2. Verify Backend Server Code Syntax
node -c src/server.js

# 3. Test Production Frontend Bundle Build
cd ../frontend
npm run build
```

---

## 7. Post-Deployment Manual Actions (Day 1 of Launch)

Once the production domain and SSL certificate (HTTPS) are active:

1. **Test Sitemap Endpoint:**  
   Navigate to `https://your-domain/sitemap.xml`. Verify that the XML tree renders valid `<loc>`, `<lastmod>`, `<changefreq>`, and `<priority>` tags for all products, categories, and blogs.
2. **Test Robots.txt:**  
   Navigate to `https://your-domain/robots.txt`. Verify that it outputs clean plain text disallowing `/admin/`, `/account/`, etc., and points to `https://your-domain/sitemap.xml`.
3. **Google Search Console (GSC):**
   - Add property via Domain Verification (DNS TXT record).
   - Go to **Sitemaps** > Enter `sitemap.xml` > Submit.
   - Run **URL Inspection** on `https://your-domain/` and request indexing.
4. **Bing Webmaster Tools:**
   - Import verification directly from Google Search Console.
   - Verify sitemap submission.
5. **Schema Markup Validator:**
   - Test a product page URL using [Schema.org Validator](https://validator.schema.org/) or [Google Rich Results Test](https://search.google.com/test/rich-results).
   - Verify that `Product`, `Offer`, `BreadcrumbList`, and `FAQPage` return 0 errors.
6. **Social Media Card Debuggers:**
   - Test URLs on [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and [Twitter Card Validator](https://cards-dev.twitter.com/validator).
   - Confirm OpenGraph titles, descriptions, and high-resolution images load crisply.
