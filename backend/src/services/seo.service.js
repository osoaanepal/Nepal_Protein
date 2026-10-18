import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { BlogPost } from '../models/BlogPost.js';
import { ENV } from '../config/env.js';

// XML entity escaping helper
const escapeXml = (unsafe = '') => {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

// Format date to ISO YYYY-MM-DD
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

export const seoService = {
  /**
   * Determine resolved base URL for SEO endpoints.
   * Prioritizes ENV.SITE_URL, with optional fallback for local testing.
   */
  resolveBaseUrl: (req) => {
    if (ENV.SITE_URL && ENV.SITE_URL.trim() !== '') {
      return ENV.SITE_URL.trim().replace(/\/+$/, '');
    }
    if (req) {
      const forwardedProto = req.headers?.['x-forwarded-proto'];
      const protocol = forwardedProto || req.protocol || 'http';
      const host = req.headers?.['x-forwarded-host'] || (typeof req.get === 'function' ? req.get('host') : req.headers?.host) || 'localhost:5000';
      return `${protocol}://${host}`.replace(/\/+$/, '');
    }
    return 'http://localhost:5173';
  },

  /**
   * Dynamically generate sitemap XML from MongoDB content
   */
  generateSitemapXml: async (baseUrl) => {
    const isDevUrl = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

    // 1. Static public routes with their update frequency & priority
    const staticRoutes = [
      { path: '/', lastmod: null, changefreq: 'daily', priority: '1.0' },
      { path: '/shop', lastmod: null, changefreq: 'daily', priority: '0.9' },
      { path: '/blog', lastmod: null, changefreq: 'daily', priority: '0.8' },
      { path: '/about', lastmod: null, changefreq: 'monthly', priority: '0.6' },
      { path: '/contact', lastmod: null, changefreq: 'monthly', priority: '0.6' },
      { path: '/faq', lastmod: null, changefreq: 'monthly', priority: '0.6' },
      { path: '/shipping-policy', lastmod: null, changefreq: 'monthly', priority: '0.4' },
      { path: '/return-policy', lastmod: null, changefreq: 'monthly', priority: '0.4' },
      { path: '/privacy-policy', lastmod: null, changefreq: 'monthly', priority: '0.4' },
      { path: '/terms-conditions', lastmod: null, changefreq: 'monthly', priority: '0.4' },
    ];

    // 2. Fetch published categories and brands
    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
      Brand.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    // 3. Fetch published products (strictly published, excluding drafts & archived)
    const products = await Product.find({
      $and: [
        { status: { $ne: 'draft' } },
        { status: { $ne: 'archived' } },
      ],
    })
      .select('slug updatedAt')
      .lean();

    // 4. Fetch published blog posts and recipes
    const blogPosts = await BlogPost.find({
      status: 'published',
      publishedAt: { $lte: new Date() },
    })
      .select('slug updatedAt publishedAt')
      .lean();

    // Build URL list with deduplication
    const seenUrls = new Set();
    const urlEntries = [];

    const addEntry = (path, lastmod, changefreq = 'weekly', priority = '0.7') => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const loc = `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`;
      if (seenUrls.has(loc)) return;
      seenUrls.add(loc);

      const formattedLastMod = formatDate(lastmod);
      urlEntries.push({ loc, lastmod: formattedLastMod, changefreq, priority });
    };

    // Add static routes
    staticRoutes.forEach((r) => addEntry(r.path, r.lastmod, r.changefreq, r.priority));

    // Add categories
    categories.forEach((c) => {
      if (c.slug) {
        addEntry(`/shop?category=${encodeURIComponent(c.slug)}`, c.updatedAt, 'weekly', '0.8');
      }
    });

    // Add brands
    brands.forEach((b) => {
      if (b.slug) {
        addEntry(`/brands/${encodeURIComponent(b.slug)}`, b.updatedAt, 'weekly', '0.8');
      }
    });

    // Add products
    products.forEach((p) => {
      if (p.slug) {
        addEntry(`/product/${encodeURIComponent(p.slug)}`, p.updatedAt, 'weekly', '0.8');
      }
    });

    // Add blog posts
    blogPosts.forEach((b) => {
      if (b.slug) {
        addEntry(`/blog/${encodeURIComponent(b.slug)}`, b.updatedAt || b.publishedAt, 'monthly', '0.7');
      }
    });

    // Build XML string
    const xmlItems = urlEntries
      .map((entry) => {
        let xml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n`;
        if (entry.lastmod) {
          xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
        }
        if (entry.changefreq) {
          xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
        }
        if (entry.priority) {
          xml += `    <priority>${entry.priority}</priority>\n`;
        }
        xml += `  </url>`;
        return xml;
      })
      .join('\n');

    let noticeComment = '';
    if (isDevUrl) {
      noticeComment = `<!-- NOTE: Development Base URL (${baseUrl}). Set SITE_URL in backend .env to your live production domain before public deployment. -->\n`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n${noticeComment}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}\n</urlset>`;
  },

  /**
   * Dynamically generate robots.txt content
   */
  generateRobotsTxt: (baseUrl) => {
    return [
      '# Nepal Protein - Robots.txt',
      'User-agent: *',
      'Allow: /',
      'Allow: /shop',
      'Allow: /brands/',
      'Allow: /brand/',
      'Allow: /product/',
      'Allow: /blog/',
      'Allow: /about',
      'Allow: /contact',
      'Allow: /faq',
      'Allow: /shipping-policy',
      'Allow: /return-policy',
      'Allow: /privacy-policy',
      'Allow: /terms-conditions',
      '',
      '# Sensitive customer accounts, cart, checkout, admin portal & internal API',
      'Disallow: /admin/',
      'Disallow: /account/',
      'Disallow: /cart',
      'Disallow: /checkout',
      'Disallow: /checkout/',
      'Disallow: /order-success',
      'Disallow: /order-tracking',
      'Disallow: /api/',
      'Disallow: /login',
      'Disallow: /register',
      'Disallow: /verify-otp',
      'Disallow: /forgot-password',
      'Disallow: /reset-password',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      '',
    ].join('\n');
  },
};
