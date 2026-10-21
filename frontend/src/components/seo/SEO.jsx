import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { siteConfig, getCanonicalUrl } from '../../config/siteConfig';

/**
 * Universal SEO Component for Nepal protein.
 * Injects titles, meta tags, canonical links, Open Graph, Twitter Cards,
 * and Schema.org JSON-LD structured data into the document head.
 */
export const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd = null,
  breadcrumbs = null,
  articleMeta = null,
  productMeta = null,
}) => {
  const location = useLocation();

  // Determine final page title
  const finalTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.defaultTitle;

  const finalDescription = (description || siteConfig.defaultDescription).slice(0, 320);
  const finalKeywords = keywords || siteConfig.defaultKeywords;

  // Determine canonical URL
  const canonicalPath = canonical || location.pathname;
  const canonicalUrl = getCanonicalUrl(canonicalPath);

  // Fallback OG Image & HTTPS Normalization
  const resolveOgImage = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=1200&auto=format&fit=crop&q=80';
    if (typeof img === 'string') {
      if (img.startsWith('http://nepalprotein.com')) {
        return img.replace(/^http:\/\//i, 'https://');
      }
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      return getCanonicalUrl(img);
    }
    return img;
  };
  const finalOgImage = resolveOgImage(ogImage);

  // Build JSON-LD schemas
  const schemas = [];

  // 1. Breadcrumbs schema if provided
  if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => {
        let itemUrl = crumb.item || '';
        if (typeof itemUrl === 'string' && itemUrl.startsWith('http://nepalprotein.com')) {
          itemUrl = itemUrl.replace(/^http:\/\//i, 'https://');
        } else if (typeof itemUrl === 'string' && !itemUrl.startsWith('http://') && !itemUrl.startsWith('https://')) {
          itemUrl = getCanonicalUrl(itemUrl);
        }
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: itemUrl,
        };
      }),
    });
  }

  // 2. Custom page JSON-LD (single object or array)
  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      schemas.push(...jsonLd.filter(Boolean));
    } else {
      schemas.push(jsonLd);
    }
  }

  // Helper to safely serialize JSON-LD
  const serializeJsonLd = (data) => {
    try {
      return JSON.stringify(data).replace(/</g, '\\u003c');
    } catch {
      return '';
    }
  };

  return (
    <Helmet>
      {/* Document Language */}
      <html lang="en" />

      {/* Standard Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}

      {/* Robots Directive */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical Link */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:locale" content={siteConfig.locale} />

      {/* Article Open Graph Metadata */}
      {ogType === 'article' && articleMeta && (
        <>
          {articleMeta.publishedTime && (
            <meta property="article:published_time" content={articleMeta.publishedTime} />
          )}
          {articleMeta.modifiedTime && (
            <meta property="article:modified_time" content={articleMeta.modifiedTime} />
          )}
          {articleMeta.section && (
            <meta property="article:section" content={articleMeta.section} />
          )}
          {articleMeta.author && (
            <meta property="article:author" content={articleMeta.author} />
          )}
        </>
      )}

      {/* Product Open Graph Metadata */}
      {ogType === 'product' && productMeta && (
        <>
          {productMeta.price && (
            <meta property="product:price:amount" content={String(productMeta.price)} />
          )}
          <meta property="product:price:currency" content="NPR" />
          {productMeta.availability && (
            <meta property="product:availability" content={productMeta.availability} />
          )}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Structured Data Scripts */}
      {schemas.map((schema, idx) => (
        <script key={`jsonld-${idx}`} type="application/ld+json">
          {serializeJsonLd(schema)}
        </script>
      ))}
    </Helmet>
  );
};
