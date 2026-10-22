import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
});

const { ProductShortDescription } = await vite.ssrLoadModule('./src/components/product/ProductShortDescription.jsx');
const {
  ProductDescription,
  parseDescriptionBlocks,
  cleanLeadingMarkers,
  hasLeadingMarker,
  parseListItemContent,
} = await vite.ssrLoadModule('./src/components/product/ProductDescription.jsx');

test('ProductShortDescription Component: Renders Ashwagandha concatenated string as structured Key Specifications card', () => {
  const ashwagandhaConcatenated =
    'Brand OSOAA Flavour Ashwagandha Primary Supplement Type Ashwagandha Net Quantity 120.00 Count Item Form Tablet Item Weight 170 Grams Item dimensions L x W x H 44 x 44 x 90 Millimeters Diet Type Vegetarian Product Benefits Boosts Energy, Better Sleep, Anxiety & Stress Relief Age Range (Description) Adult';

  const html = renderToStaticMarkup(
    React.createElement(ProductShortDescription, { shortDescription: ashwagandhaConcatenated })
  );

  assert.ok(html.includes('structured-mode'), 'Should have structured-mode class');
  assert.ok(html.includes('Key Specifications'), 'Should have Key Specifications header');
  assert.ok(html.includes('Authentic Details'), 'Should have Authentic Details badge');

  assert.ok(html.includes('Brand'), 'Should render Brand label');
  assert.ok(html.includes('OSOAA'), 'Should render OSOAA value');
  assert.ok(html.includes('Flavour'), 'Should render Flavour label');
  assert.ok(html.includes('Ashwagandha'), 'Should render Ashwagandha value');
  assert.ok(html.includes('Primary Supplement Type'), 'Should render Supplement Type');
  assert.ok(html.includes('Net Quantity'), 'Should render Net Quantity');
  assert.ok(html.includes('120.00 Count'), 'Should render 120.00 Count');
  assert.ok(html.includes('Item Form'), 'Should render Item Form');
  assert.ok(html.includes('Tablet'), 'Should render Tablet');
  assert.ok(html.includes('Item Weight'), 'Should render Item Weight');
  assert.ok(html.includes('170 Grams'), 'Should render 170 Grams');
  assert.ok(html.includes('Dimensions (L x W x H)'), 'Should render Dimensions label');
  assert.ok(html.includes('44 x 44 x 90 Millimeters'), 'Should render Dimensions value');
  assert.ok(html.includes('Diet Type'), 'Should render Diet Type');
  assert.ok(html.includes('Vegetarian'), 'Should render Vegetarian value');
  assert.ok(html.includes('Product Benefits'), 'Should render Product Benefits');
  assert.ok(html.includes('Boosts Energy'), 'Should render Boosts Energy benefit');
  assert.ok(html.includes('Better Sleep'), 'Should render Better Sleep benefit');
  assert.ok(html.includes('Anxiety &amp; Stress Relief') || html.includes('Anxiety & Stress Relief'), 'Should render stress relief benefit');
  assert.ok(html.includes('Age Range'), 'Should render Age Range');
  assert.ok(html.includes('Adult'), 'Should render Adult value');

  assert.ok(html.includes('bg-orange-50'), 'Brand should have orange badge');
  assert.ok(html.includes('text-emerald-700'), 'Vegetarian should have emerald badge');
});

test('ProductShortDescription Component: Renders exact Amazon tabbed single-line string as Key Specifications card', () => {
  const amazonTabbed =
    'Brand\tOSOAA Flavour\tAshwagandha Primary Supplement Type\tAshwagandha Net Quantity\t120.00 Count Item Form\tTablet Item Weight\t170 Grams Item dimensions L x W x H\t44 x 44 x 90 Millimeters Diet Type\tVegetarian Product Benefits\tBoosts Energy, Better Sleep, Anxiety & Stress Relief Age Range (Description)\tAdult';

  const html = renderToStaticMarkup(
    React.createElement(ProductShortDescription, { shortDescription: amazonTabbed })
  );

  assert.ok(html.includes('structured-mode'), 'Should have structured-mode class');
  assert.ok(html.includes('Key Specifications'), 'Should have Key Specifications header');
  assert.ok(html.includes('Brand'), 'Should render Brand label');
  assert.ok(html.includes('OSOAA'), 'Should render OSOAA value');
  assert.ok(html.includes('120.00 Count'), 'Should render Net Quantity');
  assert.ok(html.includes('44 x 44 x 90 Millimeters'), 'Should render Dimensions value');
  assert.ok(html.includes('Vegetarian'), 'Should render Vegetarian value');
  assert.ok(html.includes('Adult'), 'Should render Adult value');
});

test('ProductShortDescription Component: Renders Ashwagandha written as normal prose', () => {
  const ashwagandhaProse =
    'Our authentic Himalayan Ashwagandha tablets provide standardized full-spectrum root extract to support healthy cortisol levels, deeper sleep, and natural stress relief.';

  const html = renderToStaticMarkup(
    React.createElement(ProductShortDescription, { shortDescription: ashwagandhaProse })
  );

  assert.ok(html.includes('prose-mode'), 'Should have prose-mode class');
  assert.ok(!html.includes('Key Specifications'), 'Should NOT render Key Specifications card');
  assert.ok(html.includes(ashwagandhaProse), 'Should render full prose paragraph');
});

test('ProductShortDescription Component: Renders Whey Protein written as normal prose', () => {
  const wheyProse =
    'Ultra-pure whey protein isolate with 27g protein per scoop, 0g added sugar, and fast digestive enzymes.';

  const html = renderToStaticMarkup(
    React.createElement(ProductShortDescription, { shortDescription: wheyProse })
  );

  assert.ok(html.includes('prose-mode'), 'Should have prose-mode class');
  assert.ok(!html.includes('Key Specifications'), 'Should NOT have Key Specifications header');
  assert.ok(html.includes(wheyProse), 'Should render the whey prose text');
});

test('ProductShortDescription Component: Renders Whey Protein multi-paragraph prose', () => {
  const wheyMulti = [
    'Ultra-pure whey protein isolate with 27g protein per scoop.',
    'Formulated with fast-acting digestive enzymes for maximum absorption.',
    'Batch-tested for DFTQC compliance in Nepal.',
  ].join('\n\n');

  const html = renderToStaticMarkup(
    React.createElement(ProductShortDescription, { shortDescription: wheyMulti })
  );

  assert.ok(html.includes('prose-mode'), 'Should have prose-mode class');
  assert.ok(!html.includes('Key Specifications'), 'Should NOT have Key Specifications header');
  assert.ok(html.includes('Ultra-pure whey protein isolate'), 'Should render paragraph 1');
  assert.ok(html.includes('Formulated with fast-acting digestive enzymes'), 'Should render paragraph 2');
  assert.ok(html.includes('Batch-tested for DFTQC compliance'), 'Should render paragraph 3');
});

test('ProductShortDescription Component: Renders Ashwagandha with intro prose AND attributes', () => {
  const mixed =
    'Standardized to 5% withanolides for deep restorative sleep. Brand OSOAA Flavour Ashwagandha Item Form Tablet Net Quantity 120 Count Diet Type Vegetarian';

  const html = renderToStaticMarkup(
    React.createElement(ProductShortDescription, { shortDescription: mixed })
  );

  assert.ok(html.includes('structured-mode'), 'Should be in structured mode');
  assert.ok(html.includes('Standardized to 5% withanolides for deep restorative sleep.'), 'Should render intro prose');
  assert.ok(html.includes('Key Specifications'), 'Should render Key Specifications card');
  assert.ok(html.includes('Brand'), 'Should render Brand');
  assert.ok(html.includes('OSOAA'), 'Should render OSOAA');
  assert.ok(html.includes('Tablet'), 'Should render Tablet');
  assert.ok(html.includes('120 Count'), 'Should render 120 Count');
});

test('ProductShortDescription Component: Handles structured attributes from MongoDB (Requirement 8)', () => {
  const mongoAttributes = [
    { label: 'Brand', value: 'OSOAA' },
    { label: 'Diet Type', value: 'Vegetarian' },
    { label: 'Item Form', value: 'Tablet' },
  ];
  const shortDescription = 'Premium Ayurvedic formula for daily wellness.';

  const html = renderToStaticMarkup(
    React.createElement(ProductShortDescription, { shortDescription, attributes: mongoAttributes })
  );

  assert.ok(html.includes('structured-mode'), 'Should be in structured mode');
  assert.ok(html.includes('Premium Ayurvedic formula for daily wellness.'), 'Should render intro prose');
  assert.ok(html.includes('Key Specifications'), 'Should render Key Specifications card');
  assert.ok(html.includes('Brand'), 'Should render Brand');
  assert.ok(html.includes('OSOAA'), 'Should render OSOAA');
});

// ====================================================
// ProductDescription Component & Parser Tests
// ====================================================

const vitaminCPoints = [
  'High-Potency Vitamin C: Each tablet provides 1000mg of Vitamin C to support immune defense.',
  'Antioxidant Protection: Helps protect cells against free radical damage and oxidative stress.',
  'Collagen Synthesis: Essential for healthy skin, cartilage, joints, and blood vessels.',
  'Enhanced Bioavailability: Fortified with citrus bioflavonoids for superior absorption.',
  'Pure & Tested: 100% vegetarian, non-GMO, gluten-free, and tested for quality.',
];

test('ProductDescription Component: Vitamin C with five points on separate lines (\\n)', () => {
  const rawText = vitaminCPoints.join('\n');
  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: rawText }));

  assert.ok(html.includes('<ul'), 'Must render semantic unordered list (ul)');
  assert.ok(html.includes('<li'), 'Must render list items (li)');
  // Count <li> tags
  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 5, 'Must render exactly 5 list items');

  // Verify orange bullet styling
  assert.ok(html.includes('bg-orange-500'), 'Must render Nepal Protein branded orange bullet');

  // Verify emphasized bold headings
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Must emphasize High-Potency Vitamin C label');
  assert.ok(html.includes('Antioxidant Protection:'), 'Must emphasize Antioxidant Protection label');
  assert.ok(html.includes('Collagen Synthesis:'), 'Must emphasize Collagen Synthesis label');
  assert.ok(html.includes('Enhanced Bioavailability:'), 'Must emphasize Enhanced Bioavailability label');
  assert.ok(html.includes('Pure &amp; Tested:') || html.includes('Pure & Tested:'), 'Must emphasize Pure & Tested label');

  // Verify full descriptive text preserved
  assert.ok(html.includes('Each tablet provides 1000mg of Vitamin C'), 'Must preserve point 1 description');
  assert.ok(html.includes('Helps protect cells against free radical damage'), 'Must preserve point 2 description');
  assert.ok(html.includes('Essential for healthy skin, cartilage'), 'Must preserve point 3 description');
  assert.ok(html.includes('Fortified with citrus bioflavonoids'), 'Must preserve point 4 description');
  assert.ok(html.includes('100% vegetarian, non-GMO'), 'Must preserve point 5 description');
});

test('ProductDescription Component: Vitamin C with Windows newlines (\\r\\n)', () => {
  const rawText = vitaminCPoints.join('\r\n');
  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: rawText }));

  assert.ok(html.includes('<ul'), 'Must render semantic unordered list (ul)');
  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 5, 'Must render exactly 5 list items with CRLF');
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Must emphasize High-Potency Vitamin C label');
});

test('ProductDescription Component: Vitamin C pasted as multiple paragraphs (\\n\\n)', () => {
  const rawText = vitaminCPoints.join('\n\n');
  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: rawText }));

  // Must merge paragraphs into a single <ul> list rather than creating 5 separate lists
  const ulCount = (html.match(/<ul\b/g) || []).length;
  assert.equal(ulCount, 1, 'Must merge into a single semantic ul list');

  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 5, 'Must render all 5 list items');
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Must emphasize High-Potency Vitamin C label');
});

test('ProductDescription Component: Vitamin C with bullet characters (•, -, *)', () => {
  const bulletRaw = [
    `• ${vitaminCPoints[0]}`,
    `- ${vitaminCPoints[1]}`,
    `* ${vitaminCPoints[2]}`,
    `– ${vitaminCPoints[3]}`,
    `• ${vitaminCPoints[4]}`,
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: bulletRaw }));

  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 5, 'Must render exactly 5 list items');
  // Check that bullet characters are NOT rendered inside the text
  assert.ok(!html.includes('>•'), 'Leading bullet character • must be stripped');
  assert.ok(!html.includes('>- '), 'Leading dash marker must be stripped');
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Must emphasize label');
});

test('ProductDescription Component: Vitamin C with numbered points (1., 2., 3., 4., 5.)', () => {
  const numberedRaw = vitaminCPoints.map((pt, idx) => `${idx + 1}. ${pt}`).join('\n');
  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: numberedRaw }));

  assert.ok(html.includes('<ul'), 'Numbered points converted to bullet list must use ul');
  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 5, 'Must render exactly 5 list items');
  // Verify leading numbers stripped
  assert.ok(!html.includes('>1. <'), 'Leading 1. must be stripped');
  assert.ok(!html.includes('>2. <'), 'Leading 2. must be stripped');
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Label must be emphasized');
});

test('ProductDescription Component: Vitamin C with numbered points using parenthesis (1), 2), 3), 4), 5))', () => {
  const numberedParenRaw = vitaminCPoints.map((pt, idx) => `${idx + 1}) ${pt}`).join('\n');
  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: numberedParenRaw }));

  assert.ok(html.includes('<ul'), 'Numbered paren points converted to bullet list must use ul');
  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 5, 'Must render exactly 5 list items');
  assert.ok(!html.includes('>1) <'), 'Leading 1) must be stripped');
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Label must be emphasized');
});

test('ProductDescription Component: Removes duplicate and nested bullet characters', () => {
  const dirtyRaw = [
    `• - ${vitaminCPoints[0]}`,
    `- • ${vitaminCPoints[1]}`,
    `1. • ${vitaminCPoints[2]}`,
    `* - ${vitaminCPoints[3]}`,
    `• 1) ${vitaminCPoints[4]}`,
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: dirtyRaw }));

  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 5, 'Must render exactly 5 list items');
  assert.ok(!html.includes('• -'), 'Nested markers must be cleanly stripped');
  assert.ok(!html.includes('- •'), 'Nested markers must be cleanly stripped');
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Must extract label correctly');
  assert.ok(html.includes('Antioxidant Protection:'), 'Must extract label correctly');
});

test('ProductDescription Component: Markdown bold label formatting (- **High-Potency Vitamin C:**)', () => {
  const markdownBoldRaw = [
    `- **High-Potency Vitamin C:** Each tablet provides 1000mg of Vitamin C to support immune defense.`,
    `- **Antioxidant Protection:** Helps protect cells against free radical damage and oxidative stress.`,
    `- **Collagen Synthesis:** Essential for healthy skin, cartilage, joints, and blood vessels.`,
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: markdownBoldRaw }));

  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 3, 'Must render exactly 3 list items');
  assert.ok(html.includes('High-Potency Vitamin C:'), 'Must extract bold label cleanly');
  assert.ok(html.includes('Antioxidant Protection:'), 'Must extract bold label cleanly');
});

test('ProductDescription Component: Plain prose single paragraph (Requirement 7)', () => {
  const plainProse =
    'OSOAA 100% Pure Whey Isolate delivers ultra-filtered, premium whey protein designed for athletes, fitness enthusiasts, and individuals aiming for clean lean muscle definition. Each serving provides 27 grams of fast-acting protein with virtually zero fat and carbs. Batch-tested for quality and authenticity.';

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: plainProse }));

  assert.ok(!html.includes('<ul'), 'Plain prose must NOT generate an unordered list');
  assert.ok(!html.includes('<li'), 'Plain prose must NOT generate list items');
  assert.ok(html.includes('<p'), 'Plain prose must be wrapped in a paragraph (p)');
  assert.ok(html.includes(plainProse), 'Original text must be fully preserved without arbitrary sentence splits');
});

test('ProductDescription Component: Plain prose multi-paragraph (Requirement 7)', () => {
  const multiProse = [
    'OSOAA 100% Pure Whey Isolate delivers ultra-filtered, premium whey protein designed for athletes, fitness enthusiasts, and individuals aiming for clean lean muscle definition. Each serving provides 27 grams of fast-acting protein with virtually zero fat and carbs. Batch-tested for quality and authenticity.',
    'Our micro-filtration process removes virtually all fats, lactose, and impurities while retaining critical bioactive whey protein fractions. Enjoy rapid absorption and effortless mixing for optimal post-workout recovery.',
  ].join('\n\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: multiProse }));

  assert.ok(!html.includes('<ul'), 'Multi-paragraph plain prose must NOT generate an unordered list');
  const pCount = (html.match(/<p\b/g) || []).length;
  assert.equal(pCount, 2, 'Must render exactly 2 paragraphs for 2 prose blocks');
});

test('ProductDescription Component: Intro prose paragraph followed by bullet points', () => {
  const mixed = [
    'Nepal Protein Vitamin C 1000mg is an advanced daily dietary supplement designed to boost immunity and promote collagen production.',
    '',
    'High-Potency Vitamin C: Each tablet provides 1000mg of Vitamin C to support immune defense.',
    'Antioxidant Protection: Helps protect cells against free radical damage and oxidative stress.',
    'Collagen Synthesis: Essential for healthy skin, cartilage, joints, and blood vessels.',
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: mixed }));

  assert.ok(html.includes('<p'), 'Must render intro paragraph in p tag');
  assert.ok(html.includes('Nepal Protein Vitamin C 1000mg is an advanced daily dietary supplement'), 'Intro text preserved');
  assert.ok(html.includes('<ul'), 'Must render subsequent points in ul tag');
  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 3, 'Must render 3 bullet items');
});

test('ProductDescription Component: Section header (Key Benefits:) followed by points', () => {
  const sectionContent = [
    'Key Benefits:',
    '1) High-Potency Vitamin C: Each tablet provides 1000mg of Vitamin C to support immune defense.',
    '2) Antioxidant Protection: Helps protect cells against free radical damage and oxidative stress.',
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: sectionContent }));

  assert.ok(html.includes('<h3'), 'Must render section heading');
  assert.ok(html.includes('Key Benefits'), 'Heading text must be Key Benefits');
  assert.ok(html.includes('<ul'), 'Must render ul list');
  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 2, 'Must render 2 bullet items under heading');
});

test('ProductDescription Component: HTML-sensitive text and XSS safety', () => {
  const htmlSensitive = [
    '- High-Potency Vitamin C: Contains < 50mg sodium & > 1000mg Vitamin C per tablet.',
    '- Safety Tested: <script>alert("xss")</script><img src=x onerror=alert(1)> Non-toxic guaranteed.',
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: htmlSensitive }));

  assert.ok(html.includes('&lt; 50mg sodium &amp; &gt; 1000mg Vitamin C') || (html.includes('&lt; 50mg') && html.includes('&gt; 1000mg')), 'Must safely escape < and >');
  assert.ok(!html.includes('<script>'), 'Must NOT inject unsanitized <script> HTML tags');
  assert.ok(!html.includes('<img'), 'Must NOT inject unsanitized <img> HTML tags');
  assert.ok(html.includes('&lt;script&gt;'), 'Must safely render escaped script text');
  assert.ok(html.includes('&lt;img'), 'Must safely render escaped img text');
});

test('ProductDescription Component: Discards empty bullets and lone bullet markers (Requirement 6)', () => {
  const emptyBulletRaw = [
    '- High-Potency Vitamin C: 1000mg per serving.',
    '-',
    '•',
    '- Antioxidant Protection: Helps protect cells.',
    '1.',
    '• 100% Vegetarian.',
  ].join('\n');

  const html = renderToStaticMarkup(React.createElement(ProductDescription, { description: emptyBulletRaw }));

  const liCount = (html.match(/<li\b/g) || []).length;
  assert.equal(liCount, 3, 'Must render exactly 3 valid items and discard 3 empty bullet markers');
});

test('ProductDescription Component: Empty, null, undefined, or whitespace description', () => {
  const emptyHtml = renderToStaticMarkup(React.createElement(ProductDescription, { description: '' }));
  assert.ok(emptyHtml.includes('No detailed product description available.'), 'Must show graceful empty state');

  const nullHtml = renderToStaticMarkup(React.createElement(ProductDescription, { description: null }));
  assert.ok(nullHtml.includes('No detailed product description available.'), 'Must show graceful empty state for null');

  const whitespaceHtml = renderToStaticMarkup(React.createElement(ProductDescription, { description: '   \n   ' }));
  assert.ok(whitespaceHtml.includes('No detailed product description available.'), 'Must show graceful empty state for whitespace');
});

await vite.close();
