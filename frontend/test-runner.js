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

await vite.close();
