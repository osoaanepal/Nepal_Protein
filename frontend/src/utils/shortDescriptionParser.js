/**
 * Nepal Protein — Universal Product Short Description Auto-Formatter
 *
 * Centralized, extensible parser and normalizer for product short descriptions.
 * Automatically accepts and transforms product specifications pasted from:
 * - Amazon (including single-line tabbed and single-line concatenated formats)
 * - Excel, Google Sheets, TSV, CSV
 * - HTML tables copied from websites
 * - Markdown tables
 * - Bullet lists, numbered lists, and delimited key-value lines
 * - Alternating line pairs (label on line 1, value on line 2)
 * - Multi-space column separated text
 * - Plain prose descriptions (Whey Protein, Creatine summaries — preserved as paragraphs)
 */

// ============================================================================
// 1. Centralized Extensible Specification Dictionary
// ============================================================================

export const KNOWN_ATTRIBUTE_LABELS = [
  // Dimensions & Packaging
  'Item dimensions L x W x H',
  'Item Dimensions (L x W x H)',
  'Item Dimensions L x W x H',
  'Package Dimensions (L x W x H)',
  'Package Dimensions L x W x H',
  'Dimensions (L x W x H)',
  'Dimensions L x W x H',
  'Product Dimensions',
  'Item Dimensions',
  'Package Dimensions',
  'Dimensions',
  'Container Type',
  'Package Type',
  'Packaging',
  'Item Package Quantity',

  // Supplement & Product Identity
  'Primary Supplement Type',
  'Secondary Supplement Type',
  'Supplement Type',
  'Product Type',
  'Item Type Name',
  'Item Type',
  'Dosage Form',
  'Item Form',
  'Product Form',
  'Formulation',
  'Form',

  // Quantities, Weights & Servings
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
  'Volume',
  'Number of Items',
  'Package Quantity',
  'Servings Per Container',
  'Serving Size',
  'Total Servings',
  'Pack of',

  // Brand, Manufacturer & Origin
  'Brand Name',
  'Brand',
  'Manufacturer',
  'Marketed By',
  'Distributed By',
  'Imported By',
  'Country/Region Of Origin',
  'Country of Origin',
  'Country Of Origin',
  'Origin',

  // Taste, Flavors & Ingredients
  'Flavour Name',
  'Flavor Name',
  'Flavour',
  'Flavor',
  'Taste',
  'Scent',
  'Fragrance',
  'Special Ingredients',
  'Active Ingredients',
  'Key Ingredients',
  'Ingredients',
  'Material Feature',
  'Allergen Information',
  'Allergen Info',
  'Material Type Free',
  'Free From',

  // Diet, Nutrition & Lifestyle
  'Diet Type',
  'Dietary Preference',
  'Specialty',
  'Vegetarian / Non-Vegetarian',
  'Vegetarian',
  'Organic',
  'Non-GMO',
  'Gluten Free',

  // Benefits & Usage
  'Product Benefits',
  'Key Benefits',
  'Health Benefits',
  'Benefits',
  'Specific Uses For Product',
  'Recommended Uses For Product',
  'Target Uses',
  'Directions For Use',
  'Suggested Use',
  'Usage Instructions',
  'How to Use',
  'Directions',
  'Dosage',

  // Demographics & Target
  'Age Range (Description)',
  'Age Range',
  'Target Audience',
  'Target Gender',
  'Gender',
  'Suitable For',

  // Safety, Storage & Standards
  'Safety Information',
  'Safety Warning',
  'Storage Instructions',
  'Storage',
  'Warnings',
  'Best Before',
  'Shelf Life',
  'Expiry Date',
  'FSSAI License',
  'FSSAI Number',
  'DFTQC Status',
  'DFTQC License',
  'Certification',
  'Quality Standard',

  // Hardware / Model Specs
  'Colour',
  'Color',
  'Material',
  'Model Name',
  'Model Number',
  'Part Number',
  'Item Part Number',
  'Style',
];

// Sort labels descending by length so longer, specific multi-word labels match before shorter sub-labels
const SORTED_LABELS = [...KNOWN_ATTRIBUTE_LABELS].sort((a, b) => b.length - a.length);

// Canonical display map for clean, uniform presentation
export const CANONICAL_LABEL_MAP = {
  'item dimensions l x w x h': 'Dimensions (L x W x H)',
  'item dimensions (l x w x h)': 'Dimensions (L x W x H)',
  'dimensions (l x w x h)': 'Dimensions (L x W x H)',
  'dimensions l x w x h': 'Dimensions (L x W x H)',
  'package dimensions (l x w x h)': 'Package Dimensions',
  'package dimensions': 'Package Dimensions',
  'product dimensions': 'Dimensions',
  'item dimensions': 'Dimensions',
  'primary supplement type': 'Primary Supplement Type',
  'secondary supplement type': 'Secondary Supplement Type',
  'supplement type': 'Supplement Type',
  'product type': 'Product Type',
  'item form': 'Item Form',
  'dosage form': 'Dosage Form',
  'net quantity': 'Net Quantity',
  'net content': 'Net Content',
  'net weight': 'Net Weight',
  'item weight': 'Item Weight',
  'unit count': 'Unit Count',
  'serving size': 'Serving Size',
  'servings per container': 'Servings Per Container',
  'total servings': 'Total Servings',
  'diet type': 'Diet Type',
  'dietary preference': 'Dietary Preference',
  'product benefits': 'Product Benefits',
  'key benefits': 'Key Benefits',
  'age range (description)': 'Age Range',
  'age range': 'Age Range',
  'flavour name': 'Flavour',
  'flavor name': 'Flavor',
  'flavour': 'Flavour',
  'flavor': 'Flavor',
  'brand name': 'Brand',
  'brand': 'Brand',
  'manufacturer': 'Manufacturer',
  'country of origin': 'Country of Origin',
  'country/region of origin': 'Country of Origin',
  'special ingredients': 'Special Ingredients',
  'active ingredients': 'Active Ingredients',
  'material feature': 'Material Feature',
  'allergen information': 'Allergen Information',
  'directions for use': 'Directions For Use',
  'storage instructions': 'Storage Instructions',
};

// ============================================================================
// 2. Normalization & Helper Utilities
// ============================================================================

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Decodes common HTML entities and clipboard artifacts
 */
export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&bull;/gi, '•')
    .replace(/&trade;/gi, '™')
    .replace(/&reg;/gi, '®')
    .replace(/&deg;/gi, '°')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Normalizes raw input text by stripping clipboard artifacts, unicode spaces,
 * and normalizing newlines while preserving intentional tabs and structure.
 */
export function normalizeInputText(rawText) {
  if (typeof rawText !== 'string') return '';
  let text = decodeHtmlEntities(rawText);

  // Convert non-standard unicode whitespace (no-break space, thin space, etc.) to standard space
  text = text.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
  // Strip zero-width non-printing characters
  text = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
  // Normalize line breaks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip wrapping outer quotes commonly added by spreadsheet copy/paste
  const trimmed = text.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) {
    // Only strip outer quotes if they don't contain inner quotes that break syntax
    const inner = trimmed.slice(1, -1);
    if (!inner.startsWith('"')) {
      text = inner.replace(/""/g, '"');
    }
  }

  return text;
}

/**
 * Returns canonical display label for any attribute string.
 */
export function getCanonicalLabel(rawLabel) {
  if (!rawLabel) return '';
  const clean = rawLabel
    .trim()
    .replace(/^[-•*–—\d.)\]\s]+/, '')
    .replace(/[:–—-]+$/, '')
    .trim();
  const lower = clean.toLowerCase();
  if (CANONICAL_LABEL_MAP[lower]) {
    return CANONICAL_LABEL_MAP[lower];
  }
  // Title-case fallback for custom / unknown labels
  return clean
    .split(/\s+/)
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

/**
 * Checks if a row looks like a generic table header (e.g. "Attribute" / "Value")
 */
function isTableHeaderRow(label, value) {
  if (!label || !value) return false;
  const l = label.trim().toLowerCase();
  const v = value.trim().toLowerCase();
  const headerLabels = ['attribute', 'specification', 'specifications', 'feature', 'property', 'item', 'key', 'name', 'field'];
  const headerValues = ['value', 'detail', 'details', 'description', 'specification', 'specifications'];
  return headerLabels.includes(l) && headerValues.includes(v);
}

/**
 * Checks if a string looks like a valid specification attribute label.
 */
function isAttributeLabelLike(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim().replace(/[:–—-]+$/, '').trim();
  if (!clean || clean.length < 2 || clean.length > 50) return false;

  const lower = clean.toLowerCase();
  const nonAttributePrefixes = ['note', 'please note', 'disclaimer', 'warning', 'caution', 'notice', 'important', 'nb', 'p.s.'];
  if (nonAttributePrefixes.includes(lower)) {
    return false;
  }

  if (SORTED_LABELS.some((l) => l.toLowerCase() === lower)) {
    return true;
  }

  // Must start with an uppercase letter or number (e.g. "2nd Supplement Type")
  if (!/^[A-Z0-9]/.test(clean)) return false;

  // Cannot end with sentence punctuation (. ! ?)
  if (/[.!?]$/.test(clean)) return false;

  // Max 6 words
  const words = clean.split(/\s+/);
  if (words.length > 6) return false;

  // Check character set: letters, digits, spaces, parentheses, slashes, hyphens, ampersands
  return /^[A-Za-z0-9\s()/\-&.,#]+$/.test(clean);
}

/**
 * Normalizes existing structured attributes from MongoDB (object or array).
 */
export function normalizeStructuredAttributes(attributes) {
  if (!attributes) return [];

  // Array format: [{ label/name/key: '...', value: '...' }]
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

  // Object format: { Brand: 'OSOAA', 'Diet Type': 'Vegetarian' }
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

// ============================================================================
// 3. Specialized Format Parsers
// ============================================================================

/**
 * Strategy 1: HTML Table Extractor
 * Extracts attributes from pasted HTML tables copied directly from web pages.
 */
function parseHtmlTables(html) {
  if (!html || !(/<table[\s>]/i.test(html) || /<tr[\s>]/i.test(html))) {
    return null;
  }

  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/gi);
  if (!trMatches || trMatches.length === 0) return null;

  const attributes = [];

  for (const tr of trMatches) {
    const cells = [];
    const cellMatches = tr.match(/<(th|td)[\s\S]*?<\/\1>/gi);
    if (cellMatches) {
      for (const cell of cellMatches) {
        // Strip inner HTML tags
        const cellText = cell.replace(/<[\s\S]*?>/g, ' ').trim();
        const clean = cellText.replace(/\s+/g, ' ').trim();
        if (clean) cells.push(clean);
      }
    }

    if (cells.length >= 2) {
      const rawLabel = cells[0];
      const value = cells.slice(1).join(' - ');
      if (rawLabel && value && !isTableHeaderRow(rawLabel, value)) {
        attributes.push({
          label: getCanonicalLabel(rawLabel),
          rawLabel,
          value,
        });
      }
    } else if (cells.length === 1) {
      const parsed = parseDelimitedLine(cells[0]);
      if (parsed) attributes.push(parsed);
    }
  }

  return attributes.length >= 2 ? attributes : null;
}

/**
 * Strategy 2: Markdown Table Extractor
 * Extracts attributes from markdown table lines (| Attribute | Value |)
 */
function parseMarkdownTables(text) {
  if (!text || !text.includes('|')) return null;

  const lines = text.split('\n');
  const attributes = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('|')) continue;
    // Skip table divider rows: |---|---| or |:---|:---|
    if (/^\|?[\s:-]+\|[\s:-]+[|\s:-]*$/.test(trimmed)) continue;

    const parts = trimmed
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((p) => p.trim());

    if (parts.length >= 2) {
      const rawLabel = parts[0];
      const value = parts.slice(1).join(' - ');
      if (rawLabel && value && !isTableHeaderRow(rawLabel, value)) {
        attributes.push({
          label: getCanonicalLabel(rawLabel),
          rawLabel,
          value,
        });
      }
    }
  }

  return attributes.length >= 2 ? attributes : null;
}

/**
 * Checks if a single line matches "Label: Value" or "Label - Value" or "Label – Value"
 */
function parseDelimitedLine(line) {
  if (!line || typeof line !== 'string') return null;
  const trimmed = line.replace(/^[-•*–—\d.)\]\s]+/, '').trim();
  if (!trimmed) return null;

  // Match: "Label: Value" or "Label – Value" or "Label - Value" (spaced hyphen only) or "Label = Value"
  const match = trimmed.match(/^([^:–—=]+?)\s*(?::\s*|[–—]\s*|\s+-\s+|=\s*|->\s*)(.+)$/);
  if (match) {
    const rawLabel = match[1].trim();
    const value = match[2].trim().replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '');

    if (isAttributeLabelLike(rawLabel) && value.length > 0) {
      return {
        label: getCanonicalLabel(rawLabel),
        rawLabel,
        value,
      };
    }
  }

  return null;
}

/**
 * Finds a matching known attribute label at the very end of a string.
 * Example: for "170 Grams Item dimensions L x W x H", returns "Item dimensions L x W x H"
 */
function findKnownLabelAtEnd(str) {
  if (!str) return null;
  const trimmed = str.trim();
  const lower = trimmed.toLowerCase();

  for (const label of SORTED_LABELS) {
    const labelLower = label.toLowerCase();
    if (lower === labelLower) {
      return { label, length: trimmed.length };
    }
    if (lower.endsWith(' ' + labelLower)) {
      return { label, length: label.length };
    }
  }

  // Fallback for unknown attribute: check if the end has 1 to 4 Title-Cased words (e.g. "Custom Spec")
  const words = trimmed.split(/\s+/);
  for (let count = Math.min(words.length, 4); count >= 1; count--) {
    const candidateWords = words.slice(-count);
    const isTitleCased = candidateWords.every((w) => /^[A-Z0-9]/.test(w) && !/[.!?]$/.test(w));
    if (isTitleCased) {
      const candidateStr = candidateWords.join(' ');
      if (isAttributeLabelLike(candidateStr) && words.length > count) {
        return { label: candidateStr, length: candidateStr.length };
      }
    }
  }

  return null;
}

/**
 * Strategy 3: Tab-Separated Data Parser
 * Seamlessly handles:
 * A) Multi-line TSV copied from Excel/Sheets (each line: "Label\tValue")
 * B) Single-line tabbed copy from Amazon / suppliers:
 *    "Brand\tOSOAA Flavour\tAshwagandha Primary Supplement Type\tAshwagandha..."
 * C) Alternating tab cells on a single line: "Brand\tOSOAA\tFlavour\tAshwagandha"
 */
function parseTabSeparatedData(text) {
  if (!text || !text.includes('\t')) return null;

  const lines = text.split('\n');

  // Case A: Multi-line TSV (Excel / Google Sheets)
  if (lines.length > 1) {
    const attributes = [];
    const proseLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.includes('\t')) {
        const parts = trimmed.split('\t').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const rawLabel = parts[0];
          const value = parts.slice(1).join(' - ');
          if (!isTableHeaderRow(rawLabel, value)) {
            attributes.push({
              label: getCanonicalLabel(rawLabel),
              rawLabel,
              value,
            });
            continue;
          }
        }
      }

      // If line does not have tabs, check if it's a delimited line or intro prose
      const delimited = parseDelimitedLine(trimmed);
      if (delimited) {
        attributes.push(delimited);
      } else {
        proseLines.push(trimmed);
      }
    }

    if (attributes.length >= 2) {
      return {
        introText: proseLines.length > 0 ? proseLines.join('\n\n') : null,
        attributes,
        fallbackText: null,
      };
    }
  }

  // Case B: Single line (or few lines) containing tabs between attributes and values
  // e.g. Amazon copied table: Brand\tOSOAA Flavour\tAshwagandha...
  const tokens = text.split('\t').map((t) => t.trim());
  if (tokens.length < 2) return null;

  // Check sub-case B1: Alternating cells [Label, Value, Label, Value]
  if (tokens.length >= 4 && tokens.length % 2 === 0) {
    const isAlternating =
      isAttributeLabelLike(tokens[0]) &&
      isAttributeLabelLike(tokens[2]) &&
      !tokens[1].includes('\n') &&
      !tokens[3].includes('\n');

    if (isAlternating) {
      const attributes = [];
      for (let i = 0; i < tokens.length; i += 2) {
        const rawLabel = tokens[i];
        const value = tokens[i + 1];
        if (rawLabel && value && !isTableHeaderRow(rawLabel, value)) {
          attributes.push({
            label: getCanonicalLabel(rawLabel),
            rawLabel,
            value,
          });
        }
      }
      if (attributes.length >= 2) {
        return { introText: null, attributes, fallbackText: null };
      }
    }
  }

  // Sub-case B2: Amazon table single-line format:
  // Token 0 is First Label (with optional intro text before it)
  // Tokens 1 to N-1 end with the Next Label, preceded by the Value of the previous label
  // Token N is the Last Value
  let firstToken = tokens[0];
  let introText = null;
  let currentLabel = firstToken;

  // Check if first token contains intro text before a known label
  for (const label of SORTED_LABELS) {
    const labelIdx = firstToken.toLowerCase().lastIndexOf(label.toLowerCase());
    if (labelIdx !== -1 && (labelIdx === 0 || /[\s\n.:;]/.test(firstToken[labelIdx - 1]))) {
      if (labelIdx > 0) {
        introText = firstToken.slice(0, labelIdx).trim() || null;
      }
      currentLabel = firstToken.slice(labelIdx).trim();
      break;
    }
  }

  const attributes = [];

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    if (i === tokens.length - 1) {
      // Last token is the final value
      const finalValue = token.replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '').trim();
      if (currentLabel && finalValue) {
        attributes.push({
          label: getCanonicalLabel(currentLabel),
          rawLabel: currentLabel,
          value: finalValue,
        });
      }
      break;
    }

    // Token i contains [Previous Value] followed by [Next Label]
    const labelMatch = findKnownLabelAtEnd(token);

    if (labelMatch) {
      const prevValue = token
        .slice(0, token.length - labelMatch.length)
        .trim()
        .replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '');

      if (currentLabel && prevValue) {
        attributes.push({
          label: getCanonicalLabel(currentLabel),
          rawLabel: currentLabel,
          value: prevValue,
        });
      }
      currentLabel = labelMatch.label;
    } else {
      // If no label matched at the end, append to current value
      currentLabel = token;
    }
  }

  if (attributes.length >= 2) {
    return {
      introText,
      attributes,
      fallbackText: null,
    };
  }

  return null;
}

/**
 * Strategy 4: Alternating Lines Parser (Format copied from mobile tables)
 * Line 2k is a known label, Line 2k+1 is its value
 */
function parseAlternatingLines(lines) {
  if (!lines || lines.length < 4) return null;

  const validLines = lines.map((l) => l.trim()).filter(Boolean);
  if (validLines.length < 4 || validLines.length % 2 !== 0) return null;

  // If lines already contain colons, tabs, or multiple consecutive spaces, they are not alternating single-cell lines
  if (validLines.some((l) => /[:\t]|\s{3,}/.test(l))) {
    return null;
  }

  let knownLabelCount = 0;
  for (let i = 0; i < validLines.length; i += 2) {
    const line = validLines[i];
    const lower = line.toLowerCase();
    const isKnown = SORTED_LABELS.some((l) => l.toLowerCase() === lower);
    if (isKnown || (isAttributeLabelLike(line) && line.split(/\s+/).length <= 4)) {
      knownLabelCount++;
    }
  }

  // At least 70% of even lines must look like valid attribute labels
  if (knownLabelCount / (validLines.length / 2) >= 0.7) {
    const attributes = [];
    for (let i = 0; i < validLines.length; i += 2) {
      const rawLabel = validLines[i];
      const value = validLines[i + 1];
      if (rawLabel && value && !isTableHeaderRow(rawLabel, value)) {
        attributes.push({
          label: getCanonicalLabel(rawLabel),
          rawLabel,
          value,
        });
      }
    }
    if (attributes.length >= 2) {
      return attributes;
    }
  }

  return null;
}

/**
 * Strategy 5: Concatenated String Without Tabs
 * For single continuous text where all line breaks and tabs were removed.
 * Matches known attribute labels using word boundary regex.
 */
const LABEL_REGEX_SOURCE = SORTED_LABELS.map(escapeRegExp).join('|');

function parseConcatenatedAttributes(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Regex matching any known label preceded by start-of-string, whitespace, or punctuation
  const regex = new RegExp(`(?:^|[\\s|;\n])(${LABEL_REGEX_SOURCE})(?:\\s*[:\\-–—=]\\s*|\\s+)`, 'gi');

  const matches = [];
  let match;

  while ((match = regex.exec(trimmed)) !== null) {
    const matchedLabel = match[1];
    // Start index of the label itself (excluding leading separator whitespace)
    const labelStartIndex = match.index + match[0].indexOf(matchedLabel);
    const matchEnd = regex.lastIndex;

    // Reject false positive matches where the label is in lowercase inside normal prose
    const isCapitalized = /^[A-Z0-9]/.test(matchedLabel);
    const isAtStartOrPunctuation =
      labelStartIndex === 0 ||
      /[\n.!?|;]\s*$/.test(trimmed.slice(0, labelStartIndex)) ||
      isCapitalized;

    if (isAtStartOrPunctuation) {
      matches.push({
        label: matchedLabel,
        startIndex: labelStartIndex,
        matchEnd,
      });
    }
  }

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

  if (attributes.length >= 2) {
    return {
      introText,
      attributes,
      fallbackText: null,
    };
  }

  return null;
}

// ============================================================================
// 4. Main Universal Parsing & Normalization Orchestrator
// ============================================================================

/**
 * Universal Parser: Accepts any pasted product short-description or specification format,
 * normalizes clipboard formatting artifacts, extracts attributes, and preserves prose.
 *
 * @param {string} rawText - The raw pasted or stored short description
 * @param {Array|Object|null} existingAttributes - Optional structured attributes from database
 * @returns {Object} { isStructured, introText, attributes, paragraphs, fallbackText }
 */
export function parseShortDescription(rawText, existingAttributes = null) {
  // 1. Check if structured attributes are already present in MongoDB / API payload
  const structuredFromDb = normalizeStructuredAttributes(existingAttributes);
  const normalizedText = normalizeInputText(rawText);

  if (structuredFromDb.length > 0) {
    let introText = null;
    if (normalizedText) {
      const isConcatenatedDuplicate = parseConcatenatedAttributes(normalizedText);
      if (isConcatenatedDuplicate && isConcatenatedDuplicate.attributes.length >= 2) {
        introText = isConcatenatedDuplicate.introText;
      } else {
        introText = normalizedText;
      }
    }

    return {
      isStructured: true,
      introText,
      attributes: structuredFromDb,
      paragraphs: introText ? [introText] : [],
      fallbackText: null,
    };
  }

  if (!normalizedText) {
    return {
      isStructured: false,
      introText: null,
      attributes: [],
      paragraphs: [],
      fallbackText: null,
    };
  }

  // 2. Strategy 1: HTML Tables (copied from web browsers)
  const htmlResult = parseHtmlTables(normalizedText);
  if (htmlResult && htmlResult.length >= 2) {
    const textWithoutHtml = normalizedText.replace(/<table[\s\S]*?<\/table>/gi, '').trim();
    return {
      isStructured: true,
      introText: textWithoutHtml || null,
      attributes: htmlResult,
      paragraphs: textWithoutHtml ? [textWithoutHtml] : [],
      fallbackText: null,
    };
  }

  // 3. Strategy 2: Markdown Tables
  const markdownResult = parseMarkdownTables(normalizedText);
  if (markdownResult && markdownResult.length >= 2) {
    return {
      isStructured: true,
      introText: null,
      attributes: markdownResult,
      paragraphs: [],
      fallbackText: null,
    };
  }

  // 4. Strategy 3: Tab-Separated Data (handles single-line Amazon format & multi-line TSV)
  if (normalizedText.includes('\t')) {
    const tabResult = parseTabSeparatedData(normalizedText);
    if (tabResult && tabResult.attributes.length >= 2) {
      return {
        isStructured: true,
        introText: tabResult.introText,
        attributes: tabResult.attributes,
        paragraphs: tabResult.introText ? [tabResult.introText] : [],
        fallbackText: tabResult.fallbackText,
      };
    }
  }

  // 5. Strategy 4: Multi-line Delimited, Bullets, Multiple Spaces, or Alternating Lines
  if (normalizedText.includes('\n') || normalizedText.includes('|') || normalizedText.includes(';')) {
    const rawLines = normalizedText.split('\n');

    // Check alternating lines first
    const alternatingResult = parseAlternatingLines(rawLines);
    if (alternatingResult && alternatingResult.length >= 2) {
      return {
        isStructured: true,
        introText: null,
        attributes: alternatingResult,
        paragraphs: [],
        fallbackText: null,
      };
    }

    // Process line-by-line or delimiter-by-delimiter
    const segments = normalizedText.includes('\n')
      ? rawLines
      : normalizedText.split(/[|;]/);

    const attributes = [];
    const introLines = [];
    const trailingLines = [];
    let foundFirstAttribute = false;

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;

      // Handle pipe-separated pairs within a line
      if (trimmed.includes('|') && !trimmed.startsWith('|')) {
        const subParts = trimmed.split('|');
        for (const sub of subParts) {
          const parsed = parseDelimitedLine(sub);
          if (parsed) {
            foundFirstAttribute = true;
            attributes.push(parsed);
          } else if (sub.trim()) {
            if (!foundFirstAttribute) introLines.push(sub.trim());
            else trailingLines.push(sub.trim());
          }
        }
        continue;
      }

      // Check for multi-space separation (e.g. "Brand   OSOAA")
      if (/\s{3,}/.test(trimmed)) {
        const parts = trimmed.split(/\s{3,}/).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2 && isAttributeLabelLike(parts[0])) {
          foundFirstAttribute = true;
          attributes.push({
            label: getCanonicalLabel(parts[0]),
            rawLabel: parts[0],
            value: parts.slice(1).join(' - '),
          });
          continue;
        }
      }

      // Check standard delimited line (colon, hyphen, bullet)
      const parsedLine = parseDelimitedLine(trimmed);
      if (parsedLine) {
        foundFirstAttribute = true;
        attributes.push(parsedLine);
      } else {
        // Check if the line itself is an un-delimited concatenated string
        const subConcatenated = parseConcatenatedAttributes(trimmed);
        if (subConcatenated && subConcatenated.attributes.length >= 2) {
          foundFirstAttribute = true;
          if (subConcatenated.introText) introLines.push(subConcatenated.introText);
          attributes.push(...subConcatenated.attributes);
        } else {
          if (!foundFirstAttribute) {
            introLines.push(trimmed);
          } else {
            trailingLines.push(trimmed);
          }
        }
      }
    }

    if (attributes.length >= 2 || (attributes.length === 1 && introLines.length === 0)) {
      return {
        isStructured: true,
        introText: introLines.join('\n\n') || null,
        attributes,
        paragraphs: introLines,
        fallbackText: trailingLines.join('\n\n') || null,
      };
    }

    // If fewer than 2 attributes found across lines, treat as natural prose paragraphs
    return {
      isStructured: false,
      introText: null,
      attributes: [],
      paragraphs: rawLines.filter((l) => l.trim().length > 0),
      fallbackText: null,
    };
  }

  // 6. Strategy 5: Single-Line Concatenated Text (Amazon copy without line breaks or tabs)
  const concatenatedResult = parseConcatenatedAttributes(normalizedText);
  if (concatenatedResult && concatenatedResult.attributes.length >= 2) {
    return {
      isStructured: true,
      introText: concatenatedResult.introText,
      attributes: concatenatedResult.attributes,
      paragraphs: concatenatedResult.introText ? [concatenatedResult.introText] : [],
      fallbackText: null,
    };
  }

  // 7. Strategy 6: Pure Prose (Whey Protein, Creatine, Brand story summaries)
  return {
    isStructured: false,
    introText: null,
    attributes: [],
    paragraphs: [normalizedText],
    fallbackText: null,
  };
}

/**
 * Formats short description for SEO meta tag / schema markup.
 * Produces a clean, human-readable summary without raw unparsed blobs.
 */
export function formatShortDescriptionForSeo(rawText, existingAttributes = null) {
  const parsed = parseShortDescription(rawText, existingAttributes);
  if (!parsed) return '';

  if (!parsed.isStructured) {
    return (parsed.paragraphs || []).join(' ').slice(0, 300);
  }

  const parts = [];
  if (parsed.introText) {
    parts.push(parsed.introText);
  }

  if (parsed.attributes && parsed.attributes.length > 0) {
    const attrSummary = parsed.attributes
      .slice(0, 5)
      .map((a) => `${a.label}: ${a.value}`)
      .join(' | ');
    parts.push(attrSummary);
  }

  return parts.join(' - ').slice(0, 300);
}
