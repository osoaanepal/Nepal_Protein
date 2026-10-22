import React, { useMemo } from 'react';
import { sanitizeHtml } from '../../utils/blogUtils';

/**
 * Checks whether a given string contains genuine HTML tags.
 * Ensures symbols like '< 200mg' or 'Strength < Power' are not mistaken for HTML.
 */
export const isHtmlContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /<\/?(p|ul|ol|li|strong|b|em|i|h[1-6]|div|span|br|table|thead|tbody|tr|th|td|blockquote|a)\b[^>]*>/i.test(text);
};

/**
 * Strips all leading bullet and numbered markers, including duplicate/nested markers:
 * e.g. "• - Point" -> "Point"
 *      "1. • Point" -> "Point"
 *      "- - Point" -> "Point"
 *      "1) Point" -> "Point"
 * Avoids touching words like "High-Quality" or "Non-GMO".
 */
export const cleanLeadingMarkers = (line) => {
  if (!line || typeof line !== 'string') return '';
  let cleaned = line.trim();

  let modified = true;
  while (modified && cleaned.length > 0) {
    modified = false;

    // 1. Strip leading numbered markers: e.g. "1.", "1)", "(1)", "[1]", "1 -", "1.1.", "a.", "a)", "i.", "i)"
    const numMatch = cleaned.match(/^(\(?\d+(?:\.\d+)*[.)\]]|\(\d+\)|\[\d+\]|\d+\s*[-–—]|[a-zA-Z][.)]|[ivxIVX]+[.)])\s*/);
    if (numMatch) {
      cleaned = cleaned.slice(numMatch[0].length).trim();
      modified = true;
      continue;
    }

    // 2. Strip leading bullet characters: e.g. •, -, *, +, –, —, ▪, ▫, ◦, ‣, ⁃, ∙, ✓, ✔, ►, ▸, →, ◆, ✦, ★, >, ~
    const bulletMatch = cleaned.match(/^([-*+•–—▪▫◦‣⁃∙✓✔►▸→◆✦★>~]+)\s*/);
    if (bulletMatch) {
      cleaned = cleaned.slice(bulletMatch[0].length).trim();
      modified = true;
      continue;
    }
  }

  return cleaned;
};

/**
 * Checks if a line starts with a list marker (bullet or numbered).
 */
export const hasLeadingMarker = (line) => {
  if (!line || typeof line !== 'string') return false;
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Numbered markers: 1., 1), (1), [1], 1 -, a., a), i., i)
  if (/^(\(?\d+(?:\.\d+)*[.)\]]|\(\d+\)|\[\d+\]|\d+\s*[-–—]|[a-zA-Z][.)]|[ivxIVX]+[.)])(?:\s+|$|[A-Za-z0-9])/.test(trimmed)) {
    return true;
  }

  // Bullet characters: •, -, *, +, –, —, ▪, ▫, ◦, ‣, ⁃, ∙, ✓, ✔, ►, ▸, →, ◆, ✦, ★, >, ~
  if (/^[-*+•–—▪▫◦‣⁃∙✓✔►▸→◆✦★>~]+(?:\s+|$|[A-Za-z0-9])/.test(trimmed)) {
    return true;
  }

  return false;
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
 * - "High-Potency Vitamin C: Each tablet provides..." -> label: "High-Potency Vitamin C", text: "Each tablet provides..."
 * - "**Key Benefits:** Contains 3g..." -> label: "Key Benefits", text: "Contains 3g..."
 * - "Enhanced Strength – Delivers 3g..." -> label: "Enhanced Strength", text: "Delivers 3g..."
 * - "Ultra pure formulation..." -> label: null, text: "Ultra pure formulation..."
 */
export const parseListItemContent = (rawContent) => {
  if (!rawContent || typeof rawContent !== 'string') {
    return { label: null, text: '' };
  }
  const content = rawContent.trim();
  if (!content) {
    return { label: null, text: '' };
  }

  // Pattern 1: Markdown bold label at start: **Title:** Details or **Title**: Details or **Title** – Details
  const boldPrefixMatch = content.match(/^\*\*([^*]+)\*\*[:\s–—-]*(.*)$/);
  if (boldPrefixMatch) {
    const rawLabel = boldPrefixMatch[1].replace(/[:–—-]+$/, '').trim();
    const rawText = boldPrefixMatch[2].trim();
    if (rawLabel) {
      return {
        label: rawLabel,
        text: rawText,
      };
    }
  }

  // Pattern 2: Markdown italic label at start: *Title:* Details
  const italicPrefixMatch = content.match(/^\*([^*]+)\*[:\s–—-]*(.*)$/);
  if (italicPrefixMatch) {
    const rawLabel = italicPrefixMatch[1].replace(/[:–—-]+$/, '').trim();
    const rawText = italicPrefixMatch[2].trim();
    if (rawLabel) {
      return {
        label: rawLabel,
        text: rawText,
      };
    }
  }

  // Pattern 3: Heading followed by colon: "Heading: Details" or "Heading:Details"
  // Keep label reasonable in length (2-80 chars), not a URL protocol (http:, https:, ftp:, mailto:),
  // and ensure label doesn't contain multiple sentence endings (avoid matching mid-sentence colons in a long paragraph)
  const colonMatch = content.match(/^([^:\n\r]{2,80}):\s*(.*)$/);
  if (colonMatch) {
    const candidateLabel = colonMatch[1].trim();
    const candidateText = colonMatch[2].trim();
    const isUrl = /^(https?|ftp|mailto|tel)$/i.test(candidateLabel);
    const hasMultipleSentences = /[.!?]\s+[A-Z]/.test(candidateLabel);

    if (!isUrl && !hasMultipleSentences && candidateText.length > 0) {
      return {
        label: candidateLabel.replace(/[:–—-]+$/, '').trim(),
        text: candidateText,
      };
    }
  }

  // Pattern 4: Heading followed by en-dash '–', em-dash '—', or spaced hyphen ' - '
  // e.g. "High-Quality Whey Protein – Delivers 24g..."
  const dashMatch = content.match(/^([^–—\n\r]{2,80}?)\s*(?:[–—]|\s+-\s+)(.+)$/);
  if (dashMatch) {
    const candidateLabel = dashMatch[1].replace(/[:–—-]+$/, '').trim();
    const candidateText = dashMatch[2].trim();
    const isUrl = candidateLabel.includes('http') || candidateLabel.includes('://');
    const hasMultipleSentences = /[.!?]\s+[A-Z]/.test(candidateLabel);

    if (!isUrl && !hasMultipleSentences && candidateText.length > 0) {
      return {
        label: candidateLabel,
        text: candidateText,
      };
    }
  }

  return {
    label: null,
    text: content,
  };
};

/**
 * Pre-processes and tokenizes plain text/markdown descriptions into structured AST blocks:
 * headings, bullet lists, and paragraphs.
 *
 * Automatically converts list-like items (newlines, paragraphs, bullets, numbers, heading-colon points)
 * into semantic unordered lists with Nepal Protein styling, while preserving plain prose paragraphs.
 */
export const parseDescriptionBlocks = (raw) => {
  if (!raw || typeof raw !== 'string') return [];
  const text = raw.trim();
  if (!text) return [];

  // If text is already formatted as rich HTML
  if (isHtmlContent(text)) {
    return [{ type: 'html', content: text }];
  }

  // 1. Normalize line breaks (\r\n -> \n, \r -> \n)
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Insert space after leading bullet or number marker at line start if missing:
  // e.g. "-High-Quality" -> "- High-Quality", "•High-Potency" -> "• High-Potency", "1.High" -> "1. High", "1)High" -> "1) High"
  normalized = normalized.replace(/(^|\n)\s*([-*+•–—▪▫◦‣⁃∙✓✔►▸→◆✦★>]|\d+[.)]|\(\d+\))(?=[A-Za-z0-9\u0900-\u097F])/g, '$1$2 ');

  // 3. Split clumped bullet points on a single line when preceded by punctuation or whitespace:
  // e.g. "recovery. -Enhanced" or "intensity. • NABL-Tested" or "system. 1) Enhanced"
  normalized = normalized.replace(/([.!?;\n]|\s)\s*([•▪▫◦‣⁃∙✓✔►▸→◆✦★])\s*(?=[A-Za-z0-9\u0900-\u097F])/g, '$1\n$2 ');
  normalized = normalized.replace(/([.!?]\s+|\s+)-\s+(?=[A-Za-z0-9\u0900-\u097F])/g, '$1\n- ');
  normalized = normalized.replace(/([.!?]\s+)\s*(\d+[.)]|\d+\)|\(\d+\))\s+(?=[A-Za-z0-9\u0900-\u097F])/g, '$1\n$2 ');

  // 4. Split text into paragraph-level chunks by double line-breaks
  const rawParagraphs = normalized.split(/\n\s*\n+/);
  const blocks = [];

  const addListItem = (item) => {
    if (!item || (!item.label && !item.text)) return;
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock && lastBlock.type === 'list') {
      lastBlock.items.push(item);
    } else {
      blocks.push({
        type: 'list',
        items: [item],
      });
    }
  };

  const addParagraph = (pText) => {
    const trimmed = pText.trim();
    if (trimmed) {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  };

  const addHeading = (level, hText) => {
    const trimmed = hText.trim();
    if (trimmed) {
      blocks.push({ type: 'heading', level, text: trimmed });
    }
  };

  let inListSection = false;

  for (const rawParagraph of rawParagraphs) {
    const para = rawParagraph.trim();
    if (!para) continue;

    // Check 1: Markdown Heading (# Title, ## Title, ### Title)
    const headingMatch = para.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      inListSection = false;
      addHeading(
        Math.min(Math.max(headingMatch[1].length, 2), 4),
        headingMatch[2]
      );
      continue;
    }

    // Check 2: Bold-only line acting as section heading (**Key Benefits** or **Key Benefits:**)
    const boldHeadingMatch = para.match(/^\*\*([^*]+)\*\*[:]?$/);
    if (boldHeadingMatch) {
      inListSection = true;
      addHeading(3, boldHeadingMatch[1]);
      continue;
    }

    // Check 3: Short line ending with a colon acting as a section header
    // e.g. "Key Benefits:" or "Why Choose Nepal Protein:" (length <= 50, does not start with bullet)
    if (para.endsWith(':') && para.length <= 50 && !hasLeadingMarker(para)) {
      inListSection = true;
      addHeading(3, para.slice(0, -1));
      continue;
    }

    // Check 4: Process lines within this paragraph chunk
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);

    // If chunk is a single line:
    if (lines.length === 1) {
      const line = lines[0];

      // Check if line is a list item:
      // a) Has leading bullet or number marker
      // b) Starts with a heading followed by a colon (e.g. "High-Potency Vitamin C: Each tablet...")
      // c) We are currently in a list section (e.g. under "Key Benefits:")
      const hasMarker = hasLeadingMarker(line);
      const cleaned = cleanLeadingMarkers(line);
      const parsed = parseListItemContent(cleaned);

      if (hasMarker || parsed.label !== null || inListSection) {
        if (parsed.label !== null || parsed.text) {
          addListItem(parsed);
          continue;
        }
      }

      // Otherwise, it's a single paragraph of plain prose
      inListSection = false;
      addParagraph(line);
      continue;
    }

    // If chunk contains multiple lines (lines.length >= 2):
    // Analyze whether these lines are separate list items or wrapped narrative prose.
    const anyHasMarker = lines.some((l) => hasLeadingMarker(l));
    const anyHasColonLabel = lines.some((l) => parseListItemContent(cleanLeadingMarkers(l)).label !== null);
    const anyLowercaseContinuation = lines.slice(1).some((l) => /^[a-z]/.test(l));

    const isListChunk =
      inListSection ||
      anyHasMarker ||
      anyHasColonLabel ||
      (!anyLowercaseContinuation && lines.length >= 2);

    if (isListChunk) {
      // Process each line in this list chunk
      let pendingIntroLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line is an embedded section header: e.g. "Key Benefits:"
        if (line.endsWith(':') && line.length <= 50 && !hasLeadingMarker(line)) {
          if (pendingIntroLines.length > 0) {
            addParagraph(pendingIntroLines.join(' '));
            pendingIntroLines = [];
          }
          inListSection = true;
          addHeading(3, line.slice(0, -1));
          continue;
        }

        const hasMarker = hasLeadingMarker(line);
        const cleaned = cleanLeadingMarkers(line);
        const parsed = parseListItemContent(cleaned);

        // If line 0 is an intro line before list items begin:
        // (e.g. "Nepal Protein Vitamin C is a dietary supplement designed for health.")
        // followed by items with colons or bullets
        if (
          i === 0 &&
          !hasMarker &&
          parsed.label === null &&
          (anyHasMarker || anyHasColonLabel)
        ) {
          pendingIntroLines.push(line);
          continue;
        }

        if (pendingIntroLines.length > 0) {
          addParagraph(pendingIntroLines.join(' '));
          pendingIntroLines = [];
        }

        if (parsed.label !== null || parsed.text) {
          addListItem(parsed);
        }
      }

      if (pendingIntroLines.length > 0) {
        addParagraph(pendingIntroLines.join(' '));
      }
      continue;
    }

    // Otherwise, multi-line wrapped narrative prose
    inListSection = false;
    addParagraph(lines.join(' '));
  }

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

        // Render List Block (Unordered)
        if (block.type === 'list') {
          return (
            <ul key={bIdx} className="space-y-2.5 my-3 pl-0.5">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    {item.label ? (
                      <>
                        <strong className="font-bold text-slate-900 mr-1.5">
                          {renderInlineFormattedText(item.label)}:
                        </strong>
                        {item.text ? (
                          <span>{renderInlineFormattedText(item.text)}</span>
                        ) : null}
                      </>
                    ) : (
                      <span>{renderInlineFormattedText(item.text)}</span>
                    )}
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
