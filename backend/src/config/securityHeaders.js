import { ENV } from './env.js';

/**
 * NP-SEC-18: Content Security Policy & Security Header Configuration
 *
 * Configured specifically to support:
 * 1. eSewa Payment Gateway form actions (https://rc-epay.esewa.com.np & https://epay.esewa.com.np)
 * 2. Cloudinary image CDN assets (https://res.cloudinary.com)
 * 3. Google Fonts stylesheets and webfonts (fonts.googleapis.com, fonts.gstatic.com)
 * 4. Safe YouTube / Vimeo rich media embeds in blog content
 * 5. Report-Only mode toggle for staging validation (CSP_REPORT_ONLY=true)
 * 6. Cross-Origin-Resource-Policy (CORP) configured for seamless API integration
 */
export const getSecurityHeaderOptions = (nodeEnv = ENV.NODE_ENV, clientUrl = ENV.CLIENT_URL) => {
  const isProd = nodeEnv === 'production';
  const isReportOnly = process.env.CSP_REPORT_ONLY === 'true';

  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (!isProd) {
    scriptSrc.push("'unsafe-eval'");
  }

  const connectSrc = [
    "'self'",
    'https://rc-epay.esewa.com.np',
    'https://epay.esewa.com.np',
    'https://res.cloudinary.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  if (clientUrl) {
    try {
      const origin = new URL(clientUrl).origin;
      if (!connectSrc.includes(origin)) {
        connectSrc.push(origin);
      }
    } catch {}
  }

  if (ENV.SITE_URL) {
    try {
      const origin = new URL(ENV.SITE_URL).origin;
      if (!connectSrc.includes(origin)) {
        connectSrc.push(origin);
      }
    } catch {}
  }

  if (!isProd) {
    connectSrc.push('http://localhost:*', 'ws://localhost:*', 'http://127.0.0.1:*', 'ws://127.0.0.1:*');
  }

  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc,
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://res.cloudinary.com',
      'https://images.unsplash.com',
      'https://fonts.gstatic.com',
    ],
    connectSrc,
    frameSrc: [
      "'self'",
      'https://www.youtube-nocookie.com',
      'https://www.youtube.com',
      'https://player.vimeo.com',
    ],
    formAction: [
      "'self'",
      'https://rc-epay.esewa.com.np',
      'https://epay.esewa.com.np',
    ],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'self'"],
  };

  if (isProd) {
    directives.upgradeInsecureRequests = [];
  }

  return {
    contentSecurityPolicy: {
      directives,
      reportOnly: isReportOnly,
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  };
};
