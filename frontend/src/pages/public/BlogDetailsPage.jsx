import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Share2, 
  Copy, 
  Check, 
  Tag, 
  Eye, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  Facebook,
  Twitter,
  MessageCircle
} from 'lucide-react';
import { blogService } from '../../services/blogService';
import { formatBlogDate, getCategoryMeta } from '../../utils/blogUtils';
import { RichTextContent } from '../../components/blog/RichTextContent';
import { RecipeDetailsView } from '../../components/blog/RecipeDetailsView';
import { BlogCard } from '../../components/blog/BlogCard';
import { SEO } from '../../components/seo/SEO';
import { buildArticleSchema, buildRecipeSchema } from '../../utils/seoSchemas';

export const BlogDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPostDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await blogService.getPostBySlug(slug);
        setPost(res.data);
        setRelatedPosts(res.relatedPosts || []);

        // Dynamic Document Title & Meta Tags
        if (res.data) {
          document.title = `${res.data.seoTitle || res.data.title} | OSOAA Wellness & Nutrition`;
        }
      } catch (err) {
        console.error('Error fetching blog detail:', err);
        setError(err.customMessage || 'Article not found or is no longer available.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostDetails();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSocialShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post?.title || 'Check out this article on OSOAA');

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-pulse space-y-6">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-10 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="aspect-[16/9] bg-slate-200 rounded-3xl w-full mt-6" />
          <div className="space-y-3 pt-6">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <SEO
          title="Article Not Found"
          description="The requested article or recipe could not be found."
          noindex={true}
        />
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black font-display text-black">Article Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'The requested article or recipe could not be found.'}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  const categoryMeta = getCategoryMeta(post.category);
  const isRecipe = post.category === 'recipes' || post.contentType?.includes('recipe');

  const structuredSchema = isRecipe ? buildRecipeSchema(post) : buildArticleSchema(post);

  const breadcrumbs = [
    { name: 'Home', item: '/' },
    { name: 'Blog', item: '/blog' },
    { name: categoryMeta.label, item: `/blog?category=${encodeURIComponent(post.category)}` },
    { name: post.title, item: `/blog/${encodeURIComponent(post.slug)}` },
  ];

  const keywordsString = Array.isArray(post.seoKeywords) && post.seoKeywords.length > 0
    ? post.seoKeywords.join(', ')
    : undefined;

  return (
    <article className="min-h-screen bg-white text-slate-800 pb-20">
      <SEO
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt}
        keywords={keywordsString}
        canonical={`/blog/${post.slug}`}
        ogImage={post.featuredImage?.url}
        ogType="article"
        breadcrumbs={breadcrumbs}
        jsonLd={structuredSchema}
        articleMeta={{
          publishedTime: post.publishedAt || post.createdAt,
          modifiedTime: post.updatedAt,
          section: categoryMeta.label,
          author: post.author?.name || 'OSOAA Nutrition Team',
        }}
      />

      {/* Breadcrumb & Navigation Bar */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 truncate">
            <Link to="/" className="hover:text-orange-500 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link to="/blog" className="hover:text-orange-500 transition">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link to={`/blog?category=${post.category}`} className="hover:text-orange-500 font-semibold text-slate-700 truncate">
              {categoryMeta.label}
            </Link>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 font-bold text-orange-600 hover:text-orange-700 transition shrink-0 ml-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Articles</span>
          </Link>
        </div>
      </div>

      {/* Article Header Section */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-6 space-y-6">
        
        {/* Category & Status Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3.5 py-1 rounded-full text-xs font-bold border shadow-sm ${categoryMeta.badgeClass}`}>
            {categoryMeta.label}
          </span>
          {post.isFeatured && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Featured Post</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display text-black leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            {post.excerpt}
          </p>
        )}

        {/* Author & Publishing Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'O'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {post.author?.name || 'OSOAA Nutrition Team'}
              </p>
              <p className="text-xs text-slate-500">
                {post.author?.role || 'Wellness Editorial Team'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {formatBlogDate(post.publishedAt || post.createdAt)}
            </span>
            {post.readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {post.readingTime} min read
              </span>
            )}
            {post.views > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-400" />
                {post.views} views
              </span>
            )}
          </div>
        </div>

      </header>

      {/* Main Featured Image */}
      {post.featuredImage?.url && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-lg border border-slate-200">
            <img
              src={post.featuredImage.url}
              alt={post.title}
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* If Recipe, render full recipe structure (Timings, Nutrients, Ingredients, Instructions, Video) */}
        {isRecipe && (
          <RecipeDetailsView post={post} />
        )}

        {/* Written Article Rich Content Body */}
        {post.content && (
          <div className="pt-4">
            <RichTextContent content={post.content} />
          </div>
        )}

        {/* Tags Section */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-10 mt-12 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              <span>Related Topics & Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-orange-500 hover:text-white transition shadow-sm"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Social Share Box */}
        <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-black">Share this guide</h4>
            <p className="text-xs text-slate-500">Help friends and fellow athletes learn science-backed wellness</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-sm"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSocialShare('facebook')}
              className="p-2.5 rounded-xl bg-gray-200 text-black hover:bg-orange-500 hover:text-white transition shadow-sm"
              title="Share on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSocialShare('twitter')}
              className="p-2.5 rounded-xl bg-gray-200 text-black hover:bg-orange-500 hover:text-white transition shadow-sm"
              title="Share on Twitter"
            >
              <Twitter className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Related Content Recommendations */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-16 border-t border-slate-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black font-display text-black">
                  Related Articles & Recipes
                </h3>
                <p className="text-xs text-slate-500">
                  More wellness wisdom and high-protein creations from OSOAA
                </p>
              </div>
              <Link
                to={`/blog?category=${post.category}`}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
              >
                <span>View More</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relPost) => (
                <BlogCard key={relPost._id} post={relPost} />
              ))}
            </div>
          </div>
        </section>
      )}

    </article>
  );
};
