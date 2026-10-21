import { siteConfig, getCanonicalUrl } from '../config/siteConfig';
import { formatShortDescriptionForSeo } from './shortDescriptionParser';

/**
 * Build Schema.org Organization structured data
 */
export const buildOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    alternateName: 'Nepal Protein Sports Nutrition & Supplements',
    url: getCanonicalUrl('/'),
    logo: getCanonicalUrl('/favicon.svg'),
    description: siteConfig.defaultDescription,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Birgunj 10 Ashokbatika',
      addressLocality: 'Birgunj',
      addressRegion: 'Parsa, Madhesh Province',
      postalCode: '44300',
      addressCountry: 'NP',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.contact.phone,
        contactType: 'customer support',
        areaServed: 'NP',
        availableLanguage: ['en', 'ne'],
      },
    ],
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.tiktok,
      siteConfig.social.youtube,
    ].filter(Boolean),
  };
};

/**
 * Build Schema.org WebSite structured data with Sitelinks Searchbox
 */
export const buildWebSiteSchema = () => {
  const siteUrl = getCanonicalUrl('/');
  const searchUrl = getCanonicalUrl('/shop');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?keyword={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * Build Schema.org Product structured data for a single product page
 */
export const buildProductSchema = (product, selectedVariant = null) => {
  if (!product) return null;

  const currentPrice = selectedVariant?.price || product.price || 0;
  const inStock = (selectedVariant ? selectedVariant.stock : product.stock) > 0;
  const canonicalUrl = getCanonicalUrl(`/product/${product.slug}`);

  // Gather product images
  const images = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img) => {
      if (img?.url) images.push(img.url);
    });
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images.length > 0 ? images : undefined,
    description: formatShortDescriptionForSeo(product.shortDescription, product.attributes) || product.description?.replace(/<[^>]+>/g, '').slice(0, 300) || '',
    sku: selectedVariant?.sku || product.sku || product._id,
    mpn: product.sku || product._id,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'OSOAA',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'NPR',
      price: currentPrice,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
  };

  // Add category if populated
  if (product.category?.name) {
    schema.category = product.category.name;
  }

  // Aggregate rating if reviews exist
  if (product.ratingCount && product.ratingCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number((product.ratingAverage || 5).toFixed(1)),
      reviewCount: product.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
};

/**
 * Build Schema.org BlogPosting / Article structured data
 */
export const buildArticleSchema = (post) => {
  if (!post) return null;

  const canonicalUrl = getCanonicalUrl(`/blog/${post.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.featuredImage?.url ? [post.featuredImage.url] : undefined,
    datePublished: post.publishedAt || post.createdAt || new Date().toISOString(),
    dateModified: post.updatedAt || post.publishedAt || new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Nepal Protein Editorial Team',
      jobTitle: post.author?.role || 'Wellness & Fitness Editorial',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: getCanonicalUrl('/favicon.svg'),
      },
    },
    articleSection: post.category || 'Fitness & Nutrition',
    keywords: Array.isArray(post.seoKeywords) ? post.seoKeywords.join(', ') : undefined,
  };
};

/**
 * Build Schema.org Recipe structured data for healthy fitness recipes
 */
export const buildRecipeSchema = (post) => {
  if (!post) return null;

  const canonicalUrl = getCanonicalUrl(`/blog/${post.slug}`);
  const ingredients = Array.isArray(post.recipeIngredients)
    ? post.recipeIngredients.map((i) => `${i.quantity || ''} ${i.item || ''}`.trim())
    : [];

  const instructions = Array.isArray(post.recipeInstructions)
    ? post.recipeInstructions.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: step.title || `Step ${step.step || idx + 1}`,
        text: step.description,
      }))
    : [];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: post.title,
    description: post.excerpt || post.title,
    image: post.featuredImage?.url ? [post.featuredImage.url] : undefined,
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    datePublished: post.publishedAt || post.createdAt || new Date().toISOString(),
    prepTime: post.preparationTime ? `PT${parseInt(post.preparationTime, 10) || 15}M` : undefined,
    cookTime: post.cookingTime ? `PT${parseInt(post.cookingTime, 10) || 10}M` : undefined,
    recipeYield: post.servings || '2 servings',
    recipeCategory: 'Fitness Nutrition',
    recipeCuisine: 'Healthy',
    recipeIngredient: ingredients.length > 0 ? ingredients : undefined,
    recipeInstructions: instructions.length > 0 ? instructions : undefined,
    url: canonicalUrl,
  };

  if (post.nutritionFacts?.calories || post.nutritionFacts?.protein) {
    schema.nutrition = {
      '@type': 'NutritionInformation',
      calories: post.nutritionFacts.calories ? `${post.nutritionFacts.calories} calories` : undefined,
      proteinContent: post.nutritionFacts.protein ? `${post.nutritionFacts.protein}g` : undefined,
      carbohydrateContent: post.nutritionFacts.carbs ? `${post.nutritionFacts.carbs}g` : undefined,
      fatContent: post.nutritionFacts.fat ? `${post.nutritionFacts.fat}g` : undefined,
    };
  }

  return schema;
};

/**
 * Build Schema.org FAQPage structured data
 */
export const buildFaqSchema = (faqs = []) => {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q || faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a || faq.answer,
      },
    })),
  };
};

/**
 * Build Schema.org LocalBusiness / Store structured data
 */
export const buildStoreSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: siteConfig.name,
    image: getCanonicalUrl('/favicon.svg'),
    url: getCanonicalUrl('/'),
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: 'NPR 1,500 - 15,000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Birgunj 10 Ashokbatika',
      addressLocality: 'Birgunj',
      addressRegion: 'Parsa, Madhesh Province',
      postalCode: '44300',
      addressCountry: 'NP',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '27.0135',
      longitude: '84.8773',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Sunday'],
        opens: '09:00',
        closes: '19:00',
      },
    ],
  };
};

/**
 * Build Schema.org Brand structured data for individual brand pages
 */
export const buildBrandSchema = (brand) => {
  if (!brand) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    description: brand.description || '',
    url: getCanonicalUrl(`/brands/${brand.slug}`),
    logo: brand.logo?.url || undefined,
  };
};
