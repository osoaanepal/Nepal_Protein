import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseShortDescription,
  formatShortDescriptionForSeo,
  getCanonicalLabel,
  normalizeStructuredAttributes,
  KNOWN_ATTRIBUTE_LABELS,
} from './shortDescriptionParser.js';

// ============================================================================
// Group 1: Exact Prompt Examples (Amazon single-line with tabs & without tabs)
// ============================================================================

test('Test 1: Exact Amazon tabbed single-line input from prompt', () => {
  const input =
    'Brand\tOSOAA Flavour\tAshwagandha Primary Supplement Type\tAshwagandha Net Quantity\t120.00 Count Item Form\tTablet Item Weight\t170 Grams Item dimensions L x W x H\t44 x 44 x 90 Millimeters Diet Type\tVegetarian Product Benefits\tBoosts Energy, Better Sleep, Anxiety & Stress Relief Age Range (Description)\tAdult';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.introText, null);
  assert.equal(result.attributes.length, 10);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));

  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Ashwagandha');
  assert.equal(map['Primary Supplement Type'], 'Ashwagandha');
  assert.equal(map['Net Quantity'], '120.00 Count');
  assert.equal(map['Item Form'], 'Tablet');
  assert.equal(map['Item Weight'], '170 Grams');
  assert.equal(map['Dimensions (L x W x H)'], '44 x 44 x 90 Millimeters');
  assert.equal(map['Diet Type'], 'Vegetarian');
  assert.equal(map['Product Benefits'], 'Boosts Energy, Better Sleep, Anxiety & Stress Relief');
  assert.equal(map['Age Range'], 'Adult');
});

test('Test 2: Same prompt content with tabs removed (pure space-separated single line)', () => {
  const input =
    'Brand OSOAA Flavour Ashwagandha Primary Supplement Type Ashwagandha Net Quantity 120.00 Count Item Form Tablet Item Weight 170 Grams Item dimensions L x W x H 44 x 44 x 90 Millimeters Diet Type Vegetarian Product Benefits Boosts Energy, Better Sleep, Anxiety & Stress Relief Age Range (Description) Adult';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.introText, null);
  assert.equal(result.attributes.length, 10);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));

  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Ashwagandha');
  assert.equal(map['Primary Supplement Type'], 'Ashwagandha');
  assert.equal(map['Net Quantity'], '120.00 Count');
  assert.equal(map['Item Form'], 'Tablet');
  assert.equal(map['Item Weight'], '170 Grams');
  assert.equal(map['Dimensions (L x W x H)'], '44 x 44 x 90 Millimeters');
  assert.equal(map['Diet Type'], 'Vegetarian');
  assert.equal(map['Product Benefits'], 'Boosts Energy, Better Sleep, Anxiety & Stress Relief');
  assert.equal(map['Age Range'], 'Adult');
});

// ============================================================================
// Group 2: Tab-Separated Data (Multi-line TSV from Excel / Google Sheets)
// ============================================================================

test('Test 3: Multi-line tab-separated specifications from Excel or Google Sheets', () => {
  const input = [
    'Brand\tOSOAA',
    'Flavour\tRich Chocolate',
    'Item Form\tPowder',
    'Net Weight\t2 kg',
    'Diet Type\tVegetarian',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 5);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Rich Chocolate');
  assert.equal(map['Item Form'], 'Powder');
  assert.equal(map['Net Weight'], '2 kg');
  assert.equal(map['Diet Type'], 'Vegetarian');
});

test('Test 4: Tab-separated data with table header row (Specification | Value)', () => {
  const input = [
    'Specification\tValue',
    'Brand\tOSOAA',
    'Flavour\tStrawberry Cream',
    'Net Quantity\t60 Servings',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 3);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Strawberry Cream');
  assert.equal(map['Net Quantity'], '60 Servings');
});

test('Test 5: Single-line alternating tab tokens [Label, Value, Label, Value]', () => {
  const input = 'Brand\tOSOAA\tFlavour\tVanilla\tItem Form\tPowder\tNet Weight\t1 kg';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Vanilla');
  assert.equal(map['Item Form'], 'Powder');
  assert.equal(map['Net Weight'], '1 kg');
});

// ============================================================================
// Group 3: HTML & Markdown Tables
// ============================================================================

test('Test 6: HTML table copied from website with tr/td elements', () => {
  const input = `
    <table class="specs-table">
      <tbody>
        <tr><th>Brand</th><td>OSOAA</td></tr>
        <tr><th>Flavour</th><td>Belgian Chocolate</td></tr>
        <tr><th>Item Weight</th><td>1000 Grams</td></tr>
        <tr><th>Diet Type</th><td>Vegetarian</td></tr>
      </tbody>
    </table>
  `;

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Belgian Chocolate');
  assert.equal(map['Item Weight'], '1000 Grams');
  assert.equal(map['Diet Type'], 'Vegetarian');
});

test('Test 7: HTML table with messy spans, classes, and &nbsp; entities', () => {
  const input = `
    <table>
      <tr><td><span class="a-text-bold">Brand&nbsp;Name</span></td><td><span>OSOAA</span></td></tr>
      <tr><td><span>Diet&nbsp;Type</span></td><td><span>Vegetarian</span></td></tr>
      <tr><td><span>Net&nbsp;Quantity</span></td><td><span>120&nbsp;Count</span></td></tr>
    </table>
  `;

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 3);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Diet Type'], 'Vegetarian');
  assert.equal(map['Net Quantity'], '120 Count');
});

test('Test 8: Markdown table with column dividers and header row', () => {
  const input = `
    | Attribute | Value |
    | :--- | :--- |
    | Brand | OSOAA |
    | Flavour | Unflavoured |
    | Primary Supplement Type | Creatine Monohydrate |
    | Net Quantity | 250 Grams |
  `;

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Unflavoured');
  assert.equal(map['Primary Supplement Type'], 'Creatine Monohydrate');
  assert.equal(map['Net Quantity'], '250 Grams');
});

test('Test 9: Markdown table without header dividers', () => {
  const input = `
    | Brand | OSOAA |
    | Item Form | Tablet |
    | Servings Per Container | 60 |
  `;

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 3);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Item Form'], 'Tablet');
  assert.equal(map['Servings Per Container'], '60');
});

// ============================================================================
// Group 4: Line-Break, Bullet Lists & Delimited Formats
// ============================================================================

test('Test 10: Standard Line-break separated attributes with colons', () => {
  const input = [
    'Brand: OSOAA',
    'Flavour: Rich Belgian Chocolate',
    'Item Form: Powder',
    'Item Weight: 2 kg',
    'Diet Type: Vegetarian',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 5);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Rich Belgian Chocolate');
  assert.equal(map['Item Form'], 'Powder');
  assert.equal(map['Item Weight'], '2 kg');
  assert.equal(map['Diet Type'], 'Vegetarian');
});

test('Test 11: Bullet list with dashes and en-dashes', () => {
  const input = [
    '- Brand - OSOAA',
    '• Flavour – Vanilla Cream',
    '* Item Weight — 1 kg',
    '– Net Quantity: 30 Servings',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Vanilla Cream');
  assert.equal(map['Item Weight'], '1 kg');
  assert.equal(map['Net Quantity'], '30 Servings');
});

test('Test 12: Numbered specification list', () => {
  const input = [
    '1. Brand: OSOAA',
    '2. Flavour: Cafe Mocha',
    '3. Net Weight: 1 kg',
    '4. Packaging: Jar',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Cafe Mocha');
  assert.equal(map['Net Weight'], '1 kg');
  assert.equal(map['Packaging'], 'Jar');
});

test('Test 13: Pipe-delimited attributes on a single line', () => {
  const input = 'Brand: OSOAA | Flavour: Ashwagandha | Item Form: Tablet | Net Quantity: 120 Count';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Ashwagandha');
  assert.equal(map['Item Form'], 'Tablet');
  assert.equal(map['Net Quantity'], '120 Count');
});

test('Test 14: Semicolon delimited attributes on a single line', () => {
  const input = 'Brand: OSOAA; Item Form: Tablet; Net Quantity: 60 Count; Diet Type: Vegetarian';
  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Item Form'], 'Tablet');
  assert.equal(map['Net Quantity'], '60 Count');
  assert.equal(map['Diet Type'], 'Vegetarian');
});

// ============================================================================
// Group 5: Alternating Lines & Multi-Space Column Alignment
// ============================================================================

test('Test 15: Alternating lines where line 2k is label and line 2k+1 is value', () => {
  const input = [
    'Brand',
    'OSOAA',
    'Flavour',
    'Kulfi',
    'Item Form',
    'Powder',
    'Diet Type',
    'Vegetarian',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Kulfi');
  assert.equal(map['Item Form'], 'Powder');
  assert.equal(map['Diet Type'], 'Vegetarian');
});

test('Test 16: Multi-space column alignment (e.g. from PDF copy)', () => {
  const input = [
    'Brand    OSOAA',
    'Flavour    Banana Cream',
    'Item Form    Powder',
    'Net Weight    1 kg',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Banana Cream');
  assert.equal(map['Item Form'], 'Powder');
  assert.equal(map['Net Weight'], '1 kg');
});

// ============================================================================
// Group 6: Unknown Specification Labels & Complex Values
// ============================================================================

test('Test 17: Unknown specification labels in delimited line format', () => {
  const input = [
    'Custom Extraction Method: Supercritical CO2',
    'Quality Grade: 99.8% HPLC Certified',
    'Batch Code: NP-BATCH-2026-09',
    'Certificate Authority: DFTQC Aligned',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Custom Extraction Method'], 'Supercritical CO2');
  assert.equal(map['Quality Grade'], '99.8% HPLC Certified');
  assert.equal(map['Batch Code'], 'NP-BATCH-2026-09');
  assert.equal(map['Certificate Authority'], 'DFTQC Aligned');
});

test('Test 18: Unknown specification labels in tab-separated format', () => {
  const input = [
    'Lab Purity Metric\t99.9%',
    'Testing Standard\tISO-17025',
    'Country of Assembly\tNepal',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 3);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Lab Purity Metric'], '99.9%');
  assert.equal(map['Testing Standard'], 'ISO-17025');
  assert.equal(map['Country Of Assembly'], 'Nepal');
});

test('Test 19: Values containing commas, measurements, parentheses, units, and numbers', () => {
  const input = [
    'Item dimensions L x W x H: 44 x 44 x 90 Millimeters',
    'Product Benefits: Boosts Energy, Better Sleep, Anxiety & Stress Relief',
    'Net Quantity: 120.00 Count (Pack of 1)',
    'Serving Size: 1 Scoop (30g)',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Dimensions (L x W x H)'], '44 x 44 x 90 Millimeters');
  assert.equal(map['Product Benefits'], 'Boosts Energy, Better Sleep, Anxiety & Stress Relief');
  assert.equal(map['Net Quantity'], '120.00 Count (Pack of 1)');
  assert.equal(map['Serving Size'], '1 Scoop (30g)');
});

// ============================================================================
// Group 7: Mixed Content (Introductory Prose + Specs + Trailing Notes)
// ============================================================================

test('Test 20: Introductory prose followed by concatenated attributes', () => {
  const input =
    'Authentic Ayurvedic KSM-66 formula designed for daily stress relief and restful sleep. Brand OSOAA Flavour Ashwagandha Item Form Tablet Net Quantity 120 Count Diet Type Vegetarian';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.introText, 'Authentic Ayurvedic KSM-66 formula designed for daily stress relief and restful sleep.');
  assert.equal(result.attributes.length, 5);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Ashwagandha');
  assert.equal(map['Item Form'], 'Tablet');
  assert.equal(map['Net Quantity'], '120 Count');
  assert.equal(map['Diet Type'], 'Vegetarian');
});

test('Test 21: Delimited specifications with trailing notes/disclaimer', () => {
  const input = [
    'Premium sports nutrition engineered for athletes.',
    '',
    'Brand: OSOAA',
    'Flavour: Chocolate',
    'Item Form: Powder',
    '',
    'Note: Store in a cool, dry place. Keep out of reach of children.',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.introText, 'Premium sports nutrition engineered for athletes.');
  assert.equal(result.attributes.length, 3);
  assert.equal(result.fallbackText, 'Note: Store in a cool, dry place. Keep out of reach of children.');
});

// ============================================================================
// Group 8: Ordinary Prose Descriptions (MUST NOT be forced into spec tables)
// ============================================================================

test('Test 22: Whey protein normal prose is NOT converted into attributes', () => {
  const input =
    'Ultra-pure whey protein isolate with 27g protein per scoop, 0g added sugar, and fast digestive enzymes.';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.introText, null);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs.length, 1);
  assert.equal(result.paragraphs[0], input);
});

test('Test 23: Creatine monohydrate prose is preserved as paragraph', () => {
  const input =
    '100% Ultra-micronized 200-mesh Creatine Monohydrate for explosive power, ATP resynthesis, and muscle cell volumization.';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs[0], input);
});

test('Test 24: Prose with a natural occurrence of the word "brand" stays prose', () => {
  const input =
    'Our brand of whey is crafted for elite athletes and fitness enthusiasts across Nepal.';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs[0], input);
});

test('Test 25: Multi-line normal prose descriptions preserve paragraphs', () => {
  const input = [
    'Ultra-pure whey protein isolate with 27g protein per scoop.',
    '',
    'Formulated with fast-acting digestive enzymes for maximum absorption.',
    '',
    'Batch-tested for DFTQC compliance in Nepal.',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs.length, 3);
  assert.equal(result.paragraphs[0], 'Ultra-pure whey protein isolate with 27g protein per scoop.');
  assert.equal(result.paragraphs[1], 'Formulated with fast-acting digestive enzymes for maximum absorption.');
  assert.equal(result.paragraphs[2], 'Batch-tested for DFTQC compliance in Nepal.');
});

// ============================================================================
// Group 9: Edge Cases, MongoDB Re-use & SEO Helpers
// ============================================================================

test('Test 26: Empty, null, undefined, or whitespace-only inputs handle gracefully', () => {
  assert.equal(parseShortDescription(null).isStructured, false);
  assert.equal(parseShortDescription(undefined).isStructured, false);
  assert.equal(parseShortDescription('').isStructured, false);
  assert.equal(parseShortDescription('   \n  \t  ').isStructured, false);
});

test('Test 27: Reusing existing structured attributes from MongoDB (array format)', () => {
  const mongoAttributes = [
    { label: 'Brand', value: 'OSOAA' },
    { label: 'Diet Type', value: 'Vegetarian' },
    { label: 'Item Form', value: 'Tablet' },
  ];
  const shortDescription = 'Premium Ayurvedic formula for daily wellness.';

  const result = parseShortDescription(shortDescription, mongoAttributes);

  assert.equal(result.isStructured, true);
  assert.equal(result.introText, 'Premium Ayurvedic formula for daily wellness.');
  assert.equal(result.attributes.length, 3);
  assert.equal(result.attributes[0].label, 'Brand');
  assert.equal(result.attributes[0].value, 'OSOAA');
});

test('Test 28: Reusing existing structured attributes from MongoDB (object format)', () => {
  const mongoAttributes = {
    Brand: 'OSOAA',
    'Item Form': 'Powder',
    'Net Weight': '1 kg',
  };

  const result = parseShortDescription('', mongoAttributes);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 3);
});

test('Test 29: SEO formatting helper produces clean summary', () => {
  const input =
    'Brand OSOAA Flavour Ashwagandha Primary Supplement Type Ashwagandha Net Quantity 120.00 Count Item Form Tablet Item Weight 170 Grams';

  const seo = formatShortDescriptionForSeo(input);
  assert.ok(seo.includes('Brand: OSOAA'));
  assert.ok(seo.includes('Flavour: Ashwagandha'));
  assert.ok(!seo.includes('Brand OSOAA Flavour Ashwagandha'));
});

test('Test 30: Does not modify or invent product claims', () => {
  const input =
    'Brand OSOAA Product Benefits Boosts Energy, Better Sleep, Anxiety & Stress Relief Diet Type 100% Vegetarian';
  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Product Benefits'], 'Boosts Energy, Better Sleep, Anxiety & Stress Relief');
  assert.equal(map['Diet Type'], '100% Vegetarian');
});
