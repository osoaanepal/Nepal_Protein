/**
 * Format date string nicely for blog publication display
 */
export const formatBlogDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Category metadata helper
 */
export const BLOG_CATEGORIES = [
  { id: 'all', label: 'All Articles & Recipes', slug: 'all' },
  { id: 'nepali-blog', label: 'नेपाली ब्लग (Nepali Blog)', slug: 'nepali-blog' },
  { id: 'english-blog', label: 'Nutrition & Wellness (English)', slug: 'english-blog' },
  { id: 'recipes', label: 'Healthy Recipes (स्वस्थ रेसिपी)', slug: 'recipes' },
];

export const getCategoryMeta = (category) => {
  switch (category) {
    case 'nepali-blog':
      return {
        label: 'नेपाली ब्लग',
        subLabel: 'Nepali Blog',
        badgeClass: 'bg-slate-100 text-black border-slate-200',
        accentColor: 'slate',
      };
    case 'english-blog':
      return {
        label: 'Nutrition & Fitness',
        subLabel: 'English Article',
        badgeClass: 'bg-slate-100 text-black border-slate-200',
        accentColor: 'slate',
      };
    case 'recipes':
      return {
        label: 'Healthy Recipes',
        subLabel: 'स्वस्थ रेसिपी',
        badgeClass: 'bg-orange-50 text-orange-600 border-orange-200',
        accentColor: 'orange',
      };
    default:
      return {
        label: 'Blog Post',
        subLabel: 'Article',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        accentColor: 'slate',
      };
  }
};

/**
 * Content type metadata helper
 */
export const getContentTypeMeta = (contentType) => {
  switch (contentType) {
    case 'written-recipe':
      return { label: 'Written Recipe', icon: 'BookOpen' };
    case 'video-recipe':
      return { label: 'Video Recipe', icon: 'Video' };
    case 'article':
    default:
      return { label: 'Educational Article', icon: 'FileText' };
  }
};

/**
 * Convert standard video URLs (YouTube, Vimeo) to safe embed URLs without autoplay
 */
export const getEmbedVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // YouTube watch format: https://www.youtube.com/watch?v=VIDEO_ID
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytWatchMatch && ytWatchMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytWatchMatch[1]}?autoplay=0&rel=0&modestbranding=1`;
  }

  // YouTube Shorts format: https://www.youtube.com/shorts/VIDEO_ID
  const ytShortsMatch = trimmed.match(/youtube\.com\/shorts\/([^"&?\/\s]+)/i);
  if (ytShortsMatch && ytShortsMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytShortsMatch[1]}?autoplay=0&rel=0&modestbranding=1`;
  }

  // Vimeo format: https://vimeo.com/VIDEO_ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=0`;
  }

  // If already an embed URL
  if (trimmed.includes('youtube.com/embed') || trimmed.includes('player.vimeo.com')) {
    return trimmed;
  }

  return null;
};

import DOMPurifyFactory from 'dompurify';

/**
 * Approved hosts for images in rich text content (Cloudinary, seed/demo CDN, own domain, local dev)
 */
export const APPROVED_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'images.unsplash.com',
  'nepalprotein.com',
  'www.nepalprotein.com',
  'osoaa.com',
  'www.osoaa.com',
  'localhost',
  '127.0.0.1',
]);

/**
 * Validates image URL against strict protocol, host, and path security policy.
 * Blocks data:, javascript:, vbscript:, blob:, protocol-relative (//), and unapproved hosts.
 */
export const isAllowedImageUrl = (src) => {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed) return false;

  // Reject protocol-relative URLs (e.g. '//evil.com/pic.jpg')
  if (trimmed.startsWith('//')) {
    return false;
  }

  // Reject dangerous schemes
  if (/^(?:data|javascript|vbscript|blob):/i.test(trimmed)) {
    return false;
  }

  // Allow relative URLs starting with a single '/'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow http (local dev only) and https
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    // In non-localhost environments, require https
    if (parsed.protocol === 'http:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (APPROVED_IMAGE_HOSTS.has(hostname) || hostname.endsWith('.cloudinary.com')) {
      return true;
    }

    return false;
  } catch {
    // Malformed or unparseable URL
    return false;
  }
};

let purifyInstance = null;

const getDOMPurify = () => {
  if (purifyInstance) return purifyInstance;

  let activeWindow = null;
  if (typeof window !== 'undefined') {
    activeWindow = window;
  } else if (typeof globalThis.window !== 'undefined') {
    activeWindow = globalThis.window;
  }

  if (!activeWindow) {
    return null;
  }

  const purify = typeof DOMPurifyFactory.sanitize === 'function'
    ? DOMPurifyFactory
    : DOMPurifyFactory(activeWindow);

  // Clear any existing hooks to guarantee idempotent configuration
  purify.removeAllHooks();

  // Hook to enforce link and image security policies
  purify.addHook('afterSanitizeAttributes', (node) => {
    // Enforce link security
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      const trimmed = href.trim();

      // Reject dangerous URI schemes and protocol-relative URLs
      if (
        trimmed.startsWith('//') ||
        /^(?:javascript|vbscript|data|blob):/i.test(trimmed)
      ) {
        node.removeAttribute('href');
      } else if (/^https?:\/\//i.test(trimmed)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }

    // Enforce image security and URL whitelist
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (!isAllowedImageUrl(src)) {
        // Strip unapproved, dangerous, or malformed image sources
        node.removeAttribute('src');
      } else {
        node.setAttribute('loading', 'lazy');
      }
    }
  });

  purifyInstance = purify;
  return purifyInstance;
};

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'figure', 'figcaption',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'class',
    'src', 'alt', 'width', 'height', 'loading',
    'colspan', 'rowspan', 'scope',
  ],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button', 'style', 'svg', 'math'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style', 'id', 'name'],
  ALLOW_DATA_ATTR: false,
  SANITIZE_DOM: true,
};

/**
 * Safe HTML Sanitizer using DOMPurify
 * Strips script, iframe, object, embed, forms, styles, event handlers, and dangerous attributes
 */
export const sanitizeHtml = (dirtyHtml) => {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  const purify = getDOMPurify();
  if (purify) {
    return purify.sanitize(dirtyHtml, DOMPURIFY_CONFIG);
  }

  // Safe fallback for SSR / non-DOM environments: strip all HTML tags
  return dirtyHtml.replace(/<[^>]*>/g, '');
};
