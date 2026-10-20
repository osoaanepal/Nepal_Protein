import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseShortDescription,
  formatShortDescriptionForSeo,
  getCanonicalLabel,
  normalizeStructuredAttributes,
} from './shortDescriptionParser.js';

test('Test 1: Ashwagandha concatenated attribute string from user prompt', () => {
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

test('Test 2: Whey protein normal prose is NOT converted into attributes', () => {
  const input =
    'Ultra-pure whey protein isolate with 27g protein per scoop, 0g added sugar, and fast digestive enzymes.';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.introText, null);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs.length, 1);
  assert.equal(result.paragraphs[0], input);
});

test('Test 3: Creatine monohydrate prose is preserved as paragraph', () => {
  const input =
    '100% Ultra-micronized 200-mesh Creatine Monohydrate for explosive power, ATP resynthesis, and muscle cell volumization.';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs[0], input);
});

test('Test 4: Prose with a natural occurrence of the word "brand" stays prose', () => {
  const input =
    'Our brand of whey is crafted for elite athletes and fitness enthusiasts across Nepal.';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs[0], input);
});

test('Test 5: Multi-line normal prose descriptions preserve paragraphs', () => {
  const input =
    'Ultra-pure whey protein isolate with 27g protein per scoop.\n\nFormulated with fast-acting digestive enzymes for maximum absorption.\n\nBatch-tested for DFTQC compliance in Nepal.';

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, false);
  assert.equal(result.attributes.length, 0);
  assert.equal(result.paragraphs.length, 3);
  assert.equal(result.paragraphs[0], 'Ultra-pure whey protein isolate with 27g protein per scoop.');
  assert.equal(result.paragraphs[1], 'Formulated with fast-acting digestive enzymes for maximum absorption.');
  assert.equal(result.paragraphs[2], 'Batch-tested for DFTQC compliance in Nepal.');
});

test('Test 6: Line-break separated attributes with colons', () => {
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

test('Test 7: Bullet-separated attributes with hyphens', () => {
  const input = [
    '- Brand: OSOAA',
    '- Flavour: Vanilla Cream',
    '- Item Weight: 1 kg',
    '- Net Quantity: 30 Servings',
  ].join('\n');

  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 4);

  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavour'], 'Vanilla Cream');
});

test('Test 8: Pipe-delimited attributes on a single line', () => {
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

test('Test 9: Introductory prose followed by concatenated attributes', () => {
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

test('Test 10: Reusing existing structured attributes from MongoDB (Requirement 8)', () => {
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

test('Test 11: SEO formatting helper produces clean summary', () => {
  const input =
    'Brand OSOAA Flavour Ashwagandha Primary Supplement Type Ashwagandha Net Quantity 120.00 Count Item Form Tablet Item Weight 170 Grams';

  const seo = formatShortDescriptionForSeo(input);
  assert.ok(seo.includes('Brand: OSOAA'));
  assert.ok(seo.includes('Flavour: Ashwagandha'));
  assert.ok(!seo.includes('Brand OSOAA Flavour Ashwagandha')); // Unspaced blob removed
});

test('Test 12: Semicolon delimited attributes with multiple pairs', () => {
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

test('Test 13: Asterisk and bullet list attributes', () => {
  const input = '* Brand: OSOAA\n* Flavor: Chocolate Fudge\n* Serving Size: 30g';
  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  assert.equal(result.attributes.length, 3);
  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  assert.equal(map['Brand'], 'OSOAA');
  assert.equal(map['Flavor'], 'Chocolate Fudge');
  assert.equal(map['Serving Size'], '30g');
});

test('Test 14: Does not modify or invent product claims', () => {
  const input =
    'Brand OSOAA Product Benefits Boosts Energy, Better Sleep, Anxiety & Stress Relief Diet Type 100% Vegetarian';
  const result = parseShortDescription(input);

  assert.equal(result.isStructured, true);
  const map = Object.fromEntries(result.attributes.map((a) => [a.label, a.value]));
  // Exact user claim string preserved without modification or truncation
  assert.equal(map['Product Benefits'], 'Boosts Energy, Better Sleep, Anxiety & Stress Relief');
  assert.equal(map['Diet Type'], '100% Vegetarian');
});

