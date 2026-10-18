import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BlogCard } from './BlogCard';

export const FeaturedBlogSection = ({ featuredPosts }) => {
  if (!featuredPosts || featuredPosts.length === 0) return null;

  const [leadPost, ...secondaryPosts] = featuredPosts;

  return (
    <section className="mb-14 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black font-display">
              Featured Stories & Highlights
            </h2>
            <p className="text-xs text-slate-500">
              Handpicked nutrition guides, fitness science, and delicious recipes
            </p>
          </div>
        </div>
      </div>

      {/* Main Lead Feature Card */}
      <BlogCard post={leadPost} featured={true} />

      {/* Secondary Featured Grid if more than 1 featured post */}
      {secondaryPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {secondaryPosts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
};
