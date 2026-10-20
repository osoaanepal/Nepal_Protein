/**
 * Utility for parsing and formatting Nepal Protein product short descriptions.
 *
 * Supports:
 * 1. Plain text concatenated attribute strings (e.g. copied from specifications tables)
 * 2. Delimited attributes (line breaks, bullets, colons, pipes, semicolons)
 * 3. Mixed introductory prose followed by attributes
 * 4. Normal prose descriptions (paragraphs, bullet lists)
 * 5. Structured MongoDB attributes (reused if already present)
 */

export const KNOWN_ATTRIBUTE_LABELS = [
  // Dimensions & Packaging
  'Item dimensions L x W x H',
  'Item Dimensions (L x W x H)',
  'Item Dimensions L x W x H',
  'Dimensions (L x W x H)',
  'Dimensions L x W x H',
  'Item Dimensions',
  'Package Dimensions',
  'Dimensions',
  'Container Type',
  'Package Type',

  // Supplement & Product Identity
  'Primary Supplement Type',
  'Secondary Supplement Type',
  'Supplement Type',
  'Product Type',
  'Item Type',
  'Dosage Form',
  'Item Form',
  'Product Form',
  'Formulation',
  'Form',

  // Quantities & Counts
  'Net Quantity',
  'Net Content',
  'Net Weight',
  'Net Volume',
  'Unit Count Type',
  'Unit Count',
  'Item Weight',
  'Serving Weight',
  'Package Weight',
  'Gross Weight',
  'Weight',
  'Quantity',
  'Number of Items',
  'Package Quantity',
  'Servings Per Container',
  'Serving Size',

  // Brand & Origin
  'Brand',
  'Manufacturer',
  'Marketed By',
  'Distributed By',
  'Country/Region Of Origin',
  'Country of Origin',
  'Origin',

  // Taste & Ingredients
  'Flavour Name',
  'Flavor Name',
  'Flavour',
  'Flavor',
  'Taste',
  'Special Ingredients',
  'Active Ingredients',
  'Material Feature',
  'Allergen Information',
  'Allergen Info',
  'Material Type Free',
  'Free From',

  // Diet & Lifestyle
  'Diet Type',
  'Dietary Preference',
  'Specialty',

  // Benefits & Usage
  'Product Benefits',
  'Key Benefits',
  'Benefits',
  'Specific Uses For Product',
  'Recommended Uses For Product',
  'Target Uses',
  'Directions For Use',

  // Demographics
  'Age Range (Description)',
  'Age Range',
  'Target Audience',
  'Target Gender',
  'Gender',

  // Standards & Warnings
  'Safety Information',
  'Safety Warning',
  'Storage Instructions',
  'FSSAI License',
  'DFTQC Status',
  'Certification',
];

// Sort labels descending by character length so specific multi-word labels match before shorter prefixes
const SORTED_LABELS = [...KNOWN_ATTRIBUTE_LABELS].sort((a, b) => b.length - a.length);

// Canonical display map for clean, professional presentation
const CANONICAL_LABEL_MAP = {
  'item dimensions l x w x h': 'Dimensions (L x W x H)',
  'item dimensions (l x w x h)': 'Dimensions (L x W x H)',
  'dimensions l x w x h': 'Dimensions (L x W x H)',
  'item dimensions': 'Dimensions',
  'package dimensions': 'Package Dimensions',
  'primary supplement type': 'Primary Supplement Type',
  'secondary supplement type': 'Secondary Supplement Type',
  'supplement type': 'Supplement Type',
  'item form': 'Item Form',
  'dosage form': 'Dosage Form',
  'net quantity': 'Net Quantity',
  'net content': 'Net Content',
  'net weight': 'Net Weight',
  'item weight': 'Item Weight',
  'diet type': 'Diet Type',
  'product benefits': 'Product Benefits',
  'key benefits': 'Key Benefits',
  'age range (description)': 'Age Range',
  'age range': 'Age Range',
  'flavour name': 'Flavour',
  'flavor name': 'Flavor',
  'flavour': 'Flavour',
  'flavor': 'Flavor',
  'brand': 'Brand',
  'manufacturer': 'Manufacturer',
  'country of origin': 'Country of Origin',
  'country/region of origin': 'Country of Origin',
  'serving size': 'Serving Size',
  'servings per container': 'Servings Per Container',
  'special ingredients': 'Special Ingredients',
  'material feature': 'Material Feature',
  'unit count': 'Unit Count',
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalizes label to a clean, canonical label format for display.
 */
export function getCanonicalLabel(rawLabel) {
  if (!rawLabel) return '';
  const clean = rawLabel.trim().replace(/[:–—-]+$/, '').trim();
  const lower = clean.toLowerCase();
  if (CANONICAL_LABEL_MAP[lower]) {
    return CANONICAL_LABEL_MAP[lower];
  }
  // Title-case fallback
  return clean
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

/**
 * Normalizes existing structured attributes from MongoDB (object or array).
 */
export function normalizeStructuredAttributes(attributes) {
  if (!attributes) return [];

  // If array of objects: [{ name/label: '...', value: '...' }]
  if (Array.isArray(attributes)) {
    return attributes
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const rawLabel = item.label || item.name || item.key;
        const val = item.value || item.val || item.text;
        if (!rawLabel || val === undefined || val === null) return null;
        const valueStr = String(val).trim();
        if (!valueStr) return null;
        return {
          label: getCanonicalLabel(rawLabel),
          rawLabel: String(rawLabel).trim(),
          value: valueStr,
        };
      })
      .filter(Boolean);
  }

  // If key-value object: { Brand: 'OSOAA', 'Diet Type': 'Vegetarian' }
  if (typeof attributes === 'object') {
    return Object.entries(attributes)
      .map(([rawLabel, val]) => {
        if (val === undefined || val === null) return null;
        const valueStr = String(val).trim();
        if (!valueStr) return null;
        return {
          label: getCanonicalLabel(rawLabel),
          rawLabel: String(rawLabel).trim(),
          value: valueStr,
        };
      })
      .filter(Boolean);
  }

  return [];
}

/**
 * Checks whether a line matches a "Label: Value" or "Label - Value" structure.
 * Requires colon (':') or spaced hyphen (' - ') or dash ('–', '—')
 * so hyphenated compound words like "Ultra-pure" or "fast-acting" are never split.
 */
function parseDelimitedLine(line) {
  const trimmed = line.replace(/^[-•*–\d.]+\s*/, '').trim();
  if (!trimmed) return null;

  // Match: "Label: Value" or "Label – Value" or "Label - Value" (spaced hyphen only)
  const delimiterMatch = trimmed.match(/^([^:–—]+?)\s*(?::\s*|[–—]\s*|\s+-\s+)(.+)$/);
  if (delimiterMatch) {
    const rawLabel = delimiterMatch[1].trim();
    const value = delimiterMatch[2].trim();

    // Verify label is reasonable length (< 45 chars) and value is non-empty
    if (rawLabel.length > 0 && rawLabel.length <= 45 && value.length > 0) {
      const lower = rawLabel.toLowerCase();
      // Check if it's a known label OR looks like a valid title-cased attribute key (e.g. "Serving Size", "Net Wt")
      const isKnown = SORTED_LABELS.some((l) => l.toLowerCase() === lower);
      const isAttributeLike = /^[A-Z][A-Za-z0-9\s()\/]{1,40}$/.test(rawLabel);

      if (isKnown || isAttributeLike) {
        return {
          label: getCanonicalLabel(rawLabel),
          rawLabel,
          value,
        };
      }
    }
  }

  return null;
}

/**
 * Regex matching any known attribute label as a word boundary.
 * In un-delimited text, we require the label to be capitalized or preceded by punctuation/delimiter
 * to prevent accidental matches on lowercase words inside normal prose.
 */
const LABEL_REGEX_SOURCE = SORTED_LABELS.map(escapeRegExp).join('|');

/**
 * Parses un-delimited / concatenated string containing multiple known attribute labels.
 * Example:
 * "Brand OSOAA Flavour Ashwagandha Primary Supplement Type Ashwagandha Net Quantity 120.00 Count..."
 */
function parseConcatenatedAttributes(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Create regex to locate all known labels.
  // We match word boundary \b followed by one of the known labels,
  // followed by an optional separator (: - – —) or whitespace.
  const regex = new RegExp(`\\b(${LABEL_REGEX_SOURCE})(?:\\s*[:\\-–—]\\s*|\\s+)`, 'gi');

  const matches = [];
  let match;

  while ((match = regex.exec(trimmed)) !== null) {
    const matchedLabel = match[1];
    const startIndex = match.index;
    const matchEnd = regex.lastIndex;

    // Check if the label match is capitalized (e.g. "Brand", "Flavour", "Item dimensions")
    // or starts at start of string or after sentence ending / delimiter.
    // This is crucial to avoid false positives on words like "brand" or "benefits" inside prose.
    const isCapitalized = /^[A-Z]/.test(matchedLabel);
    const isAtStartOrPunctuation =
      startIndex === 0 ||
      /[\n.!?|;]\s*$/.test(trimmed.slice(0, startIndex)) ||
      isCapitalized;

    if (isAtStartOrPunctuation) {
      matches.push({
        label: matchedLabel,
        startIndex,
        matchEnd,
      });
    }
  }

  // To be recognized as an un-delimited attribute block, we require at least 2 distinct attribute matches
  if (matches.length < 2) {
    return null;
  }

  const attributes = [];
  const introText = trimmed.slice(0, matches[0].startIndex).trim() || null;

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].startIndex : trimmed.length;
    const value = trimmed
      .slice(current.matchEnd, nextStart)
      .trim()
      .replace(/^[:\-–—\s]+|[:\-–—;|,\s]+$/g, '')
      .trim();

    if (value) {
      attributes.push({
        label: getCanonicalLabel(current.label),
        rawLabel: current.label,
        value,
      });
    }
  }

  // Must have successfully extracted at least 2 attributes with non-empty values
  if (attributes.length < 2) {
    return null;
  }

  return {
    introText,
    attributes,
  };
}

/**
 * Main parser function: takes raw shortDescription string and optional structured attributes,
 * and returns a normalized representation ready for rendering.
 */
export function parseShortDescription(rawText, existingAttributes = null) {
  // Check if structured attributes are already present in MongoDB / API
  const structuredFromMongo = normalizeStructuredAttributes(existingAttributes);
  const text = typeof rawText === 'string' ? rawText.trim() : '';

  if (structuredFromMongo.length > 0) {
    // If we have structured attributes from MongoDB, reuse them!
    // Check if rawText contains genuine prose (not just the concatenated attributes repeated)
    let introText = null;
    if (text) {
      // Check if text is just a concatenation of the same attributes
      const isConcatenatedDuplicate = parseConcatenatedAttributes(text);
      if (isConcatenatedDuplicate && isConcatenatedDuplicate.attributes.length >= 2) {
        introText = isConcatenatedDuplicate.introText;
      } else {
        introText = text;
      }
    }

    return {
      isStructured: true,
      introText,
      attributes: structuredFromMongo,
      paragraphs: introText ? [introText] : [],
    };
  }

  // If no raw text provided and no structured attributes
  if (!text) {
    return {
      isStructured: false,
      introText: null,
      attributes: [],
      paragraphs: [],
    };
  }

  // Case 1: Text contains explicit newlines (\n) or pipe separators (|) or semicolons (;)
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const hasLineBreaks = normalized.includes('\n');
  const hasPipes = normalized.includes('|');

  if (hasLineBreaks || hasPipes) {
    // Split segments: if pipes exist on a single line, split by pipes; otherwise split by lines
    const rawSegments = hasLineBreaks
      ? normalized.split('\n')
      : normalized.split('|');

    const attributes = [];
    const proseLines = [];

    for (const segment of rawSegments) {
      const trimmedSegment = segment.trim();
      if (!trimmedSegment) continue;

      // Check if this segment contains multiple pipe-separated or comma-separated pairs
      if (trimmedSegment.includes('|')) {
        const subParts = trimmedSegment.split('|');
        for (const sub of subParts) {
          const parsed = parseDelimitedLine(sub);
          if (parsed) attributes.push(parsed);
          else if (sub.trim()) proseLines.push(sub.trim());
        }
        continue;
      }

      const parsedLine = parseDelimitedLine(trimmedSegment);
      if (parsedLine) {
        attributes.push(parsedLine);
      } else {
        // Check if the line itself is an un-delimited concatenated string
        const subConcatenated = parseConcatenatedAttributes(trimmedSegment);
        if (subConcatenated && subConcatenated.attributes.length >= 2) {
          if (subConcatenated.introText) proseLines.push(subConcatenated.introText);
          attributes.push(...subConcatenated.attributes);
        } else {
          proseLines.push(trimmedSegment);
        }
      }
    }

    // If we found 2 or more attributes, format as structured layout
    if (attributes.length >= 2 || (attributes.length === 1 && proseLines.length === 0)) {
      return {
        isStructured: true,
        introText: proseLines.join('\n\n') || null,
        attributes,
        paragraphs: proseLines,
      };
    }

    // Otherwise, treat as normal prose paragraphs
    return {
      isStructured: false,
      introText: null,
      attributes: [],
      paragraphs: rawSegments.filter((s) => s.trim().length > 0),
    };
  }

  // Case 2: Single-line concatenated text (the Ashwagandha prompt issue)
  const concatenated = parseConcatenatedAttributes(normalized);
  if (concatenated && concatenated.attributes.length >= 2) {
    return {
      isStructured: true,
      introText: concatenated.introText,
      attributes: concatenated.attributes,
      paragraphs: concatenated.introText ? [concatenated.introText] : [],
    };
  }

  // Case 3: Pure normal prose (whey protein, creatine, etc.)
  return {
    isStructured: false,
    introText: null,
    attributes: [],
    paragraphs: [normalized],
  };
}

/**
 * Formats short description for SEO meta tag / schema markup.
 * Produces a clean, readable string without raw concatenated blobs.
 */
export function formatShortDescriptionForSeo(rawText, existingAttributes = null) {
  const parsed = parseShortDescription(rawText, existingAttributes);
  if (!parsed) return '';

  if (!parsed.isStructured) {
    return parsed.paragraphs.join(' ').slice(0, 300);
  }

  const parts = [];
  if (parsed.introText) {
    parts.push(parsed.introText);
  }

  if (parsed.attributes.length > 0) {
    const attrSummary = parsed.attributes
      .slice(0, 5)
      .map((a) => `${a.label}: ${a.value}`)
      .join(' | ');
    parts.push(attrSummary);
  }

  return parts.join(' - ').slice(0, 300);
}
