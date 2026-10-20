import React, { useMemo } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { parseShortDescription } from '../../utils/shortDescriptionParser';
import { renderInlineFormattedText } from './ProductDescription';

/**
 * ProductShortDescription Component
 *
 * Renders short descriptions intelligently:
 * - If the content contains attribute-value pairs (either plain concatenated string,
 *   separated lines, delimiters, or MongoDB structured attributes), it renders
 *   a responsive, high-end Key Specifications card.
 * - If the content contains normal prose (like Whey Protein or Creatine product summaries),
 *   it preserves them as clean, well-spaced readable paragraphs.
 * - If an introductory sentence is followed by attributes, both are displayed harmoniously.
 */
export const ProductShortDescription = ({
  shortDescription = '',
  attributes = null,
  product = null,
  className = '',
}) => {
  const parsed = useMemo(() => {
    return parseShortDescription(shortDescription, attributes);
  }, [shortDescription, attributes]);

  if (!parsed) return null;

  const hasAttributes = parsed.isStructured && parsed.attributes && parsed.attributes.length > 0;
  const hasParagraphs = parsed.paragraphs && parsed.paragraphs.length > 0;

  if (!hasAttributes && !hasParagraphs) {
    return null;
  }

  // Case 1: Pure Prose (e.g. Whey Protein, Creatine Monohydrate single/multi-line paragraphs)
  if (!hasAttributes) {
    return (
      <div className={`product-short-description prose-mode space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed ${className}`}>
        {parsed.paragraphs.map((paragraph, idx) => (
          <p key={idx} className="text-slate-600 leading-relaxed font-normal">
            {renderInlineFormattedText(paragraph)}
          </p>
        ))}
      </div>
    );
  }

  // Case 2: Structured Specifications (e.g. Ashwagandha attributes, specs table)
  return (
    <div className={`product-short-description structured-mode space-y-3 ${className}`}>
      {/* Optional Introductory Prose Paragraph */}
      {parsed.introText && (
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          {renderInlineFormattedText(parsed.introText)}
        </p>
      )}

      {/* Key Specifications Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-slate-50/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
              Key Specifications
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/60 shadow-2xs">
            Authentic Details
          </span>
        </div>

        {/* Responsive Attribute Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
          {parsed.attributes.map((attr, idx) => {
            const isFullWidth =
              attr.value.length > 35 ||
              attr.label === 'Product Benefits' ||
              attr.label === 'Key Benefits' ||
              attr.label === 'Special Ingredients' ||
              attr.label === 'Safety Information' ||
              attr.label === 'Directions For Use';

            const isBrand = attr.label === 'Brand';
            const isDietType = attr.label === 'Diet Type';
            const isBenefits = attr.label === 'Product Benefits' || attr.label === 'Key Benefits';

            // Split comma-separated benefits into clean pills if multiple
            const benefitList = isBenefits && attr.value.includes(',')
              ? attr.value.split(',').map((b) => b.trim()).filter(Boolean)
              : null;

            return (
              <div
                key={idx}
                className={`p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs transition-all hover:border-slate-300 ${
                  isFullWidth ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>{attr.label}</span>
                </div>

                {isBrand ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-orange-50 text-orange-600 border border-orange-200/70">
                      <Tag className="w-3 h-3 text-orange-500" />
                      {attr.value}
                    </span>
                  </div>
                ) : isDietType ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {/veg/i.test(attr.value) && !/non/i.test(attr.value) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {attr.value}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-900">
                        {attr.value}
                      </span>
                    )}
                  </div>
                ) : benefitList && benefitList.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {benefitList.map((benefit, bIdx) => (
                      <span
                        key={bIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-50/60 text-slate-800 border border-orange-200/50"
                      >
                        <CheckCircle2 className="w-3 h-3 text-orange-500 shrink-0" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                    {renderInlineFormattedText(attr.value)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductShortDescription;
