/**
 * Centralized SEO & Site Configuration for Nepal Protein.
 * 
 * Production URL must be provided via the VITE_SITE_URL environment variable
 * without a trailing slash (e.g. VITE_SITE_URL=https://your-domain.com).
 * 
 * Never hardcodes an assumed production domain.
 */

const rawSiteUrl = import.meta.env.VITE_SITE_URL || '';
// Clean trailing slash if present
export const SITE_URL = rawSiteUrl ? rawSiteUrl.replace(/\/+$/, '') : '';

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
 * If VITE_SITE_URL is set, returns absolute URL: https://example.com/path
 * If VITE_SITE_URL is not set:
 *   - In browser environments, falls back to window.location.origin + path (for testing / dev)
 *   - Otherwise returns the relative clean path
 */
export const getCanonicalUrl = (path = '') => {
  // Ensure path starts with a leading slash and remove trailing slash (except root '/')
  let clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  if (SITE_URL) {
    return `${SITE_URL}${clean === '/' ? '' : clean}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${clean === '/' ? '' : clean}`;
  }

  return clean;
};
