import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  ChefHat, 
  Flame, 
  Video, 
  BookOpen, 
  Sparkles,
  User
} from 'lucide-react';
import { formatBlogDate, getCategoryMeta } from '../../utils/blogUtils';

export const BlogCard = ({ post, featured = false }) => {
  if (!post) return null;

  const categoryMeta = getCategoryMeta(post.category);
  const isRecipe = post.category === 'recipes' || post.contentType?.includes('recipe');
  const hasVideo = post.contentType === 'video-recipe' || !!post.videoUrl;

  return (
    <article 
      className={`group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 flex flex-col ${
        featured ? 'md:grid md:grid-cols-12 md:gap-6' : ''
      }`}
    >
      {/* Featured Image Area */}
      <Link 
        to={`/blog/${post.slug}`} 
        className={`relative overflow-hidden block bg-slate-100 ${
          featured ? 'md:col-span-6 aspect-[16/10] md:aspect-auto min-h-[260px]' : 'aspect-[16/10]'
        }`}
      >
        {post.featuredImage?.url ? (
          <img
            src={post.featuredImage.url}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-6 text-center">
            <div className="space-y-2">
              <span className="font-display font-black text-2xl text-white/30 tracking-wider">OSOAA</span>
              <p className="text-xs text-orange-400 font-semibold tracking-wider uppercase">{categoryMeta.label}</p>
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${categoryMeta.badgeClass}`}>
            {categoryMeta.label}
          </span>
          {hasVideo && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/75 text-white backdrop-blur-md flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-orange-400" />
              <span>Video</span>
            </span>
          )}
          {post.isFeatured && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Featured</span>
            </span>
          )}
        </div>

        {/* Quick Recipe Info Overlay on Image if recipe */}
        {isRecipe && (post.preparationTime || post.cookingTime || post.difficulty) && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md rounded-xl p-2.5 text-white flex items-center justify-between text-[11px] font-semibold border border-white/10">
            {post.preparationTime && (
              <span className="flex items-center gap-1 text-slate-200">
                <Clock className="w-3 h-3 text-orange-400" /> Prep: {post.preparationTime}
              </span>
            )}
            {post.difficulty && (
              <span className="flex items-center gap-1 text-orange-300">
                <Flame className="w-3 h-3 text-orange-400" /> {post.difficulty}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Card Content Area */}
      <div className={`p-6 flex flex-col justify-between flex-1 ${featured ? 'md:col-span-6 md:p-8 md:pl-2' : ''}`}>
        <div className="space-y-3">
          
          {/* Metadata Row: Date & Reading Time */}
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatBlogDate(post.publishedAt || post.createdAt)}
            </span>
            {post.readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {post.readingTime} min read
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/blog/${post.slug}`} className="block group-hover:text-orange-600 transition">
            <h3 className={`font-bold text-slate-900 leading-snug ${
              featured ? 'text-xl sm:text-2xl md:text-3xl' : 'text-lg line-clamp-2'
            }`}>
              {post.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {post.excerpt && (
            <p className={`text-slate-600 text-xs sm:text-sm leading-relaxed ${
              featured ? 'line-clamp-3' : 'line-clamp-2'
            }`}>
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Author & Action Button */}
        <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-black font-bold flex items-center justify-center text-xs">
              {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'O'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                {post.author?.name || 'OSOAA Team'}
              </p>
              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                {post.author?.role || 'Nutrition Team'}
              </p>
            </div>
          </div>

          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-orange-500 group-hover:text-white text-slate-700 font-bold text-xs transition duration-200"
          >
            <span>{isRecipe ? 'View Recipe' : 'Read Article'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>
    </article>
  );
};
