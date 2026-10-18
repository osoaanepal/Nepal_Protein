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

/**
 * Safe HTML Sanitizer (DOM-based)
 * Strips script, iframe (unless safe video), object, embed, event handlers, and dangerous attributes
 */
export const sanitizeHtml = (dirtyHtml) => {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  if (typeof window === 'undefined') {
    // Basic server/non-DOM fallback
    return dirtyHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  const allowedTags = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'figure', 'figcaption',
  ]);

  const allowedAttributes = {
    a: ['href', 'title', 'target', 'rel', 'class'],
    img: ['src', 'alt', 'title', 'width', 'height', 'class', 'loading'],
    th: ['colspan', 'rowspan', 'class', 'scope'],
    td: ['colspan', 'rowspan', 'class'],
    div: ['class'],
    span: ['class'],
    p: ['class'],
    h1: ['class'],
    h2: ['class'],
    h3: ['class'],
    h4: ['class'],
    ul: ['class'],
    ol: ['class'],
    li: ['class'],
    blockquote: ['class'],
    code: ['class'],
    pre: ['class'],
  };

  const sanitizeNode = (node) => {
    // If element node
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // If tag is not allowed, replace with its text content or unwrap
      if (!allowedTags.has(tagName)) {
        const textNode = doc.createTextNode(node.textContent);
        node.parentNode?.replaceChild(textNode, node);
        return;
      }

      // Filter attributes
      const allowedAttrsForTag = allowedAttributes[tagName] || ['class'];
      const attributes = Array.from(node.attributes);

      for (const attr of attributes) {
        const attrName = attr.name.toLowerCase();

        // Strip inline JavaScript handlers like onclick, onload, onerror
        if (attrName.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')) {
          node.removeAttribute(attr.name);
          continue;
        }

        if (!allowedAttrsForTag.includes(attrName)) {
          node.removeAttribute(attr.name);
        }
      }

      // If link tag, enforce secure external link attributes
      if (tagName === 'a') {
        const href = node.getAttribute('href') || '';
        if (href.startsWith('http://') || href.startsWith('https://')) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }

      // If img tag, ensure lazy loading and secure URLs
      if (tagName === 'img') {
        node.setAttribute('loading', 'lazy');
      }

      // Recursively sanitize children
      const children = Array.from(node.childNodes);
      for (const child of children) {
        sanitizeNode(child);
      }
    }
  };

  const bodyChildren = Array.from(doc.body.childNodes);
  for (const child of bodyChildren) {
    sanitizeNode(child);
  }

  return doc.body.innerHTML;
};
