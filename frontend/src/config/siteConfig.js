/**
 * Centralized SEO & Site Configuration for Nepal Protein.
 * 
 * Production canonical domain is https://nepalprotein.com
 * In non-production environments, VITE_SITE_URL can override this.
 */

export const PRODUCTION_SITE_URL = 'https://nepalprotein.com';

// Resolve configured site URL, defaulting to production domain in production builds
const rawSiteUrl = import.meta.env.VITE_SITE_URL || (import.meta.env.PROD ? PRODUCTION_SITE_URL : '');

// Clean trailing slash if present
let cleanSiteUrl = rawSiteUrl ? rawSiteUrl.trim().replace(/\/+$/, '') : '';

// Ensure HTTP is upgraded to HTTPS for nepalprotein.com
if (cleanSiteUrl.startsWith('http://nepalprotein.com')) {
  cleanSiteUrl = cleanSiteUrl.replace(/^http:\/\//i, 'https://');
}

export const SITE_URL = cleanSiteUrl;

export const siteConfig = {
  name: 'Nepal Protein',
  tagline: 'Authentic Sports Nutrition & Fitness Supplements',
  defaultTitle: 'Nepal Protein | Whey Protein & Sports Nutrition Supplements in Nepal',
  titleTemplate: '%s | Nepal Protein',
  defaultDescription:
    'Nepal\'s trusted sports nutrition store. Shop authentic whey protein isolate, micronized creatine, pre-workout, and fitness supplements from top brands including OSOAA with fast nationwide delivery.',
  defaultKeywords:
    'Nepal Protein, OSOAA Nepal, whey protein Nepal, protein powder Kathmandu, buy whey protein Nepal, sports nutrition Nepal, creatine Nepal, gym supplements Kathmandu, authentic supplements Nepal',
  locale: 'en_NP',
  currency: 'NPR',
  social: {
    facebook: 'https://facebook.com/osoaa.nepal',
    instagram: 'https://instagram.com/osoaa.nepal',
    tiktok: 'https://tiktok.com/@osoaa.nepal',
    youtube: 'https://youtube.com/@osoaanepal',
  },
  contact: {
    email: 'osoaanepal@gmail.com',
    phone: '+977-9802949872',
    address: 'Birgunj 10 Ashokbatika, Parsa, Nepal',
    serviceArea: 'Nationwide Delivery across all 7 provinces of Nepal',
  },
};

/**
 * Build a canonical URL for any route.
 * 
 * Rules:
 * - Homepage ('/' or '') always resolves with trailing slash: https://nepalprotein.com/
 * - Other public routes resolve without trailing slash: https://nepalprotein.com/shop
 * - Absolute URLs with http://nepalprotein.com are upgraded to HTTPS.
 */
export const getCanonicalUrl = (path = '') => {
  // If already an absolute URL, normalize protocol if nepalprotein.com
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
    if (path.startsWith('http://nepalprotein.com')) {
      return path.replace(/^http:\/\//i, 'https://');
    }
    return path;
  }

  // Ensure path starts with a leading slash and remove trailing slash (except root '/')
  let clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  // Base URL resolution
  let base = SITE_URL;
  if (!base && typeof window !== 'undefined' && window.location?.origin) {
    base = window.location.origin.replace(/\/+$/, '');
  }

  // Enforce HTTPS for nepalprotein.com
  if (base && base.startsWith('http://nepalprotein.com')) {
    base = base.replace(/^http:\/\//i, 'https://');
  }

  if (base) {
    return clean === '/' ? `${base}/` : `${base}${clean}`;
  }

  return clean;
};
