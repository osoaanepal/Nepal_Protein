import React, { useMemo } from 'react';
import { sanitizeHtml } from '../../utils/blogUtils';

/**
 * Checks whether a given string contains genuine HTML tags.
 * Ensures symbols like '< 200mg' or 'Strength < Power' are not mistaken for HTML.
 */
const isHtmlContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /<\/?(p|ul|ol|li|strong|b|em|i|h[1-6]|div|span|br|table|thead|tbody|tr|th|td|blockquote|a)\b[^>]*>/i.test(text);
};

/**
 * Parses inline markdown tokens like **bold** and *italic* into React elements.
 * Renders as native React nodes to completely prevent any XSS vulnerability.
 */
export const renderInlineFormattedText = (text) => {
  if (!text || typeof text !== 'string') return null;

  // Split on **bold** or *italic*
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

/**
 * Parses an individual list item's content to extract label and description.
 * Examples:
 * - "High-Quality Whey Protein – Delivers 24g..." -> label: "High-Quality Whey Protein", text: "Delivers 24g..."
 * - "**Key Benefits:** Contains 3g..." -> label: "Key Benefits", text: "Contains 3g..."
 * - "Ultra pure formulation..." -> label: null, text: "Ultra pure formulation..."
 */
const parseListItemContent = (rawContent) => {
  const content = rawContent.trim();

  // Pattern 1: Markdown bold label at start: **Title:** Details or **Title** – Details
  const boldPrefixMatch = content.match(/^\*\*([^*]+)\*\*[:\s–—-]*(.*)$/);
  if (boldPrefixMatch) {
    return {
      label: boldPrefixMatch[1].replace(/[:–—-]+$/, '').trim(),
      text: boldPrefixMatch[2].trim(),
    };
  }

  // Pattern 2: Separator like en-dash '–', em-dash '—', colon ':', or spaced hyphen ' - '
  // Keep label length reasonable (< 60 chars) so whole sentences aren't mistaken for labels
  const dashMatch = content.match(/^([^–—:]+?)\s*(?:[–—]|:\s+|\s+-\s+)(.+)$/);
  if (dashMatch && dashMatch[1].length < 60 && !dashMatch[1].includes('http')) {
    return {
      label: dashMatch[1].replace(/[:–—-]+$/, '').trim(),
      text: dashMatch[2].trim(),
    };
  }

  return {
    label: null,
    text: content,
  };
};

/**
 * Pre-processes and tokenizes plain text/markdown descriptions into structured AST blocks:
 * headings, bullet/numbered lists, and paragraphs.
 *
 * Handles legacy database entries where multiple hyphen points were entered without line breaks:
 * e.g. "-High-Quality Whey... -Enhanced Strength... -NABL-Tested..."
 * while preserving compound words like "High-Quality", "post-workout", and "NABL-Tested".
 */
export const parseDescriptionBlocks = (raw) => {
  if (!raw || typeof raw !== 'string') return [];
  const text = raw.trim();
  if (!text) return [];

  // If text is already formatted as rich HTML
  if (isHtmlContent(text)) {
    return [{ type: 'html', content: text }];
  }

  // Normalize line breaks (\r\n -> \n)
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Handle leading hyphen/bullet without trailing space: e.g. "-High-Quality" -> "- High-Quality"
  normalized = normalized.replace(/^[-•*](?=[A-Za-z0-9\u0900-\u097F])/, '$& ');

  // Split clumped bullet points on a single line when preceded by whitespace or sentence ending:
  // e.g. "recovery. -Enhanced" or "intensity. -NABL-Tested"
  // Whitespace check ensures words like "High-Quality" or "ultra-filtered" are untouched.
  normalized = normalized.replace(/([.!?]|\s)\s*([•*]|-)\s*(?=[A-Za-z0-9\u0900-\u097F])/g, '$1\n$2 ');

  const rawLines = normalized.split('\n');
  const blocks = [];
  let currentList = null;
  let currentParagraphLines = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const pText = currentParagraphLines.join('\n').trim();
      if (pText) {
        blocks.push({ type: 'paragraph', text: pText });
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // Blank line indicates block break
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    // Markdown Heading: # H1, ## H2, ### H3, #### H4
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: Math.min(Math.max(headingMatch[1].length, 2), 4),
        text: headingMatch[2].trim(),
      });
      continue;
    }

    // Bold-only line acting as a section heading: e.g. **Key Benefits** or **Key Benefits:**
    const boldHeadingMatch = line.match(/^\*\*([^*]+)\*\*[:]?$/);
    if (boldHeadingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: 3,
        text: boldHeadingMatch[1].trim(),
      });
      continue;
    }

    // Short line ending with a colon acting as a section header: e.g. "Key Benefits:" or "Why Choose Nepal Protein:"
    if (line.endsWith(':') && line.length <= 45 && !line.startsWith('-') && !line.startsWith('•') && !line.startsWith('*')) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: 3,
        text: line.slice(0, -1).trim(),
      });
      continue;
    }

    // List item: starts with -, *, •, –, or numbered "1."
    const bulletMatch = line.match(/^([-•*–]|\d+\.)\s*(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      const marker = bulletMatch[1];
      const isOrdered = /^\d+\./.test(marker);
      const rawItemContent = bulletMatch[2].trim();

      const parsedItem = parseListItemContent(rawItemContent);

      if (!currentList || currentList.ordered !== isOrdered) {
        flushList();
        currentList = {
          type: 'list',
          ordered: isOrdered,
          items: [],
        };
      }
      currentList.items.push(parsedItem);
      continue;
    }

    // Ordinary narrative line
    flushList();
    currentParagraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
};

/**
 * Public Product Description Renderer Component
 */
export const ProductDescription = ({ description, className = '' }) => {
  const blocks = useMemo(() => {
    return parseDescriptionBlocks(description);
  }, [description]);

  if (!description || !description.trim() || blocks.length === 0) {
    return (
      <div className={`p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl ${className}`}>
        <p className="text-xs sm:text-sm text-slate-500 italic">No detailed product description available.</p>
      </div>
    );
  }

  return (
    <div className={`product-description-container space-y-4 max-w-none ${className}`}>
      {blocks.map((block, bIdx) => {
        // Render Heading Block
        if (block.type === 'heading') {
          return (
            <div key={bIdx} className="pt-3 pb-1 first:pt-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block flex-shrink-0" />
                <span>{renderInlineFormattedText(block.text)}</span>
              </h3>
            </div>
          );
        }

        // Render List Block (Unordered or Ordered)
        if (block.type === 'list') {
          if (block.ordered) {
            return (
              <ol key={bIdx} className="space-y-2.5 my-3 pl-0.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-50 text-orange-600 font-bold text-xs flex items-center justify-center mt-0.5 border border-orange-200">
                      {itemIdx + 1}
                    </span>
                    <div className="flex-1">
                      {item.label && (
                        <strong className="font-bold text-slate-900 mr-1.5">
                          {renderInlineFormattedText(item.label)}:
                        </strong>
                      )}
                      <span>{renderInlineFormattedText(item.text)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            );
          }

          return (
            <ul key={bIdx} className="space-y-2.5 my-3 pl-0.5">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    {item.label && (
                      <strong className="font-bold text-slate-900 mr-1.5">
                        {renderInlineFormattedText(item.label)}:
                      </strong>
                    )}
                    <span>{renderInlineFormattedText(item.text)}</span>
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        // Render Paragraph Block
        if (block.type === 'paragraph') {
          return (
            <p key={bIdx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {block.text.split('\n').map((line, lIdx, arr) => (
                <React.Fragment key={lIdx}>
                  {renderInlineFormattedText(line)}
                  {lIdx < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        }

        // Render Sanitized HTML Block
        if (block.type === 'html') {
          return (
            <div
              key={bIdx}
              className="product-description-content text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
            />
          );
        }

        return null;
      })}
    </div>
  );
};

export default ProductDescription;
