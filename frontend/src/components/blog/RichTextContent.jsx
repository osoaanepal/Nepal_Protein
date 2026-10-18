import React, { useMemo } from 'react';
import { sanitizeHtml } from '../../utils/blogUtils';

export const RichTextContent = ({ content }) => {
  const cleanHtml = useMemo(() => {
    return sanitizeHtml(content || '');
  }, [content]);

  if (!cleanHtml) {
    return null;
  }

  return (
    <div
      className="prose prose-slate max-w-none 
        prose-headings:font-display prose-headings:font-bold prose-headings:text-black prose-headings:tracking-tight
        prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
        prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2
        prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6
        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-base prose-p:mb-5
        prose-strong:text-slate-900 prose-strong:font-bold
        prose-a:text-orange-500 prose-a:font-semibold prose-a:underline hover:prose-a:text-orange-600
        prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-slate-700
        prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:my-5 prose-ul:text-slate-700
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2 prose-ol:my-5 prose-ol:text-slate-700
        prose-li:text-slate-700
        prose-img:rounded-3xl prose-img:shadow-lg prose-img:my-8 prose-img:w-full prose-img:object-cover
        prose-table:w-full prose-table:border-collapse prose-table:my-6
        prose-th:bg-slate-100 prose-th:text-black prose-th:font-bold prose-th:p-3 prose-th:border prose-th:border-slate-200 prose-th:text-left
        prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-td:text-slate-700
        prose-code:bg-slate-100 prose-code:text-orange-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono
        prose-pre:bg-slate-900 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-2xl prose-pre:overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};
