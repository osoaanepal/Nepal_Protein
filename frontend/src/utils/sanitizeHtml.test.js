import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// Initialize DOM environment for Node testing
const dom = new JSDOM('', { url: 'https://nepalprotein.com' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;

const { sanitizeHtml, isAllowedImageUrl } = await import('./blogUtils.js');

// ====================================================
// GROUP 1: Script & SVG-based XSS Payloads
// ====================================================
test('NP-SEC-13: Strips standard <script> tags and executable payloads', () => {
  const dirty = 'Hello <b>World</b><script>alert("XSS")</script>';
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('<script>'), 'Should not contain script tags');
  assert.ok(!clean.includes('alert("XSS")'), 'Should not contain script content');
  assert.ok(clean.includes('Hello <b>World</b>'), 'Should preserve safe bold text');
});

test('NP-SEC-13: Strips external <script src="..."> tags', () => {
  const dirty = '<p>Article text</p><script src="https://evil.com/malicious.js"></script>';
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('<script'), 'Should strip external script tag');
  assert.ok(!clean.includes('evil.com'), 'Should strip malicious script src');
});

test('NP-SEC-13: Strips CDATA and obfuscated script payloads', () => {
  const dirty = '<script type="text/javascript">/*<![CDATA[*/alert(1);/*]]>*/</script>';
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('alert(1)'), 'Should strip script within CDATA blocks');
  assert.ok(!clean.includes('<script'), 'Should strip CDATA script tag');
});

test('NP-SEC-13: Strips SVG-based XSS payloads (onload, animatetransform, script)', () => {
  const payloads = [
    '<svg onload="alert(1)"></svg>',
    '<svg><script>alert(2)</script></svg>',
    '<svg><circle cx="50" cy="50" r="40" onload="alert(3)" /></svg>',
    '<svg><animatetransform onbegin="alert(4)" attributeName="transform"></animatetransform></svg>',
    '<svg><a href="javascript:alert(5)"><text y="20">Click</text></a></svg>',
  ];

  for (const payload of payloads) {
    const clean = sanitizeHtml(payload);
    assert.ok(!clean.includes('<svg'), `Should strip <svg> tag from: ${payload}`);
    assert.ok(!clean.includes('alert('), `Should strip executable alert from: ${payload}`);
  }
});

test('NP-SEC-13: Strips MathML <math> script execution vectors', () => {
  const dirty = '<math><mtext><script>alert(1)</script></mtext></math>';
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('<math'), 'Should strip <math> tag');
  assert.ok(!clean.includes('alert(1)'), 'Should strip alert in MathML');
});

// ====================================================
// GROUP 2: Inline Event Handlers
// ====================================================
test('NP-SEC-13: Strips inline event handlers (onerror, onload, onclick, onmouseover, etc.)', () => {
  const dirty = `
    <p onmouseover="alert('hover')" onclick="alert('click')" onfocus="alert('focus')">Hover me</p>
    <img src="https://res.cloudinary.com/pic.jpg" onerror="alert('error')" onload="alert('load')">
    <div onanimationstart="alert('anim')">Animated</div>
  `;
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('onmouseover'), 'Should strip onmouseover');
  assert.ok(!clean.includes('onclick'), 'Should strip onclick');
  assert.ok(!clean.includes('onfocus'), 'Should strip onfocus');
  assert.ok(!clean.includes('onerror'), 'Should strip onerror');
  assert.ok(!clean.includes('onload'), 'Should strip onload');
  assert.ok(!clean.includes('onanimationstart'), 'Should strip onanimationstart');
  assert.ok(!clean.includes('alert('), 'Should strip all alert invocations');
  assert.ok(clean.includes('Hover me'), 'Should retain paragraph text');
});

// ====================================================
// GROUP 3: Unsafe URL Schemes (javascript:, vbscript:, data:, blob:, //)
// ====================================================
test('NP-SEC-13: Strips javascript: URI schemes in links (case, entity, whitespace variations)', () => {
  const variations = [
    '<a href="javascript:alert(1)">Link 1</a>',
    '<a href="JAVASCRIPT:alert(2)">Link 2</a>',
    '<a href="  javascript:alert(3)  ">Link 3</a>',
    '<a href="jav&#x09;ascript:alert(4)">Link 4</a>',
    '<a href="java&#x0A;script:alert(5)">Link 5</a>',
  ];

  for (const v of variations) {
    const clean = sanitizeHtml(v);
    assert.ok(!clean.includes('javascript:'), `Should strip javascript URI from: ${v}`);
    assert.ok(!clean.includes('alert('), `Should strip alert payload from: ${v}`);
  }
});

test('NP-SEC-13: Strips vbscript:, data:, blob:, and protocol-relative (//) link URLs', () => {
  const dirty = `
    <a href="vbscript:msgbox(1)">VBScript Link</a>
    <a href="data:text/html,<script>alert(1)</script>">Data URI Link</a>
    <a href="blob:https://nepalprotein.com/uuid">Blob URI Link</a>
    <a href="//evil-phishing.com/login">Protocol Relative Link</a>
  `;
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('href="vbscript:'), 'Should strip vbscript: href');
  assert.ok(!clean.includes('href="data:'), 'Should strip data: href');
  assert.ok(!clean.includes('href="blob:'), 'Should strip blob: href');
  assert.ok(!clean.includes('href="//evil-phishing.com'), 'Should strip protocol-relative // href');
  assert.ok(!clean.includes('<script>'), 'Should not permit script within data href');
});

// ====================================================
// GROUP 4: Malformed and Nested HTML
// ====================================================
test('NP-SEC-13: Neutralizes malformed and nested mutation payloads', () => {
  const malformed = [
    '<<SCRIPT>alert("XSS");//<</SCRIPT>',
    '<img src="https://res.cloudinary.com/pic.jpg" alt="""><script>alert(1)</script>">',
    '<p>Unclosed paragraph <b>and bold text',
    '<a href="https://example.com"">Double quote malformed link</a>',
  ];

  for (const m of malformed) {
    const clean = sanitizeHtml(m);
    assert.ok(!clean.includes('<script'), `Should strip script in malformed: ${m}`);
    assert.ok(!clean.includes('alert('), `Should strip alert in malformed: ${m}`);
  }
});

// ====================================================
// GROUP 5: Forbidden Elements (iframe, object, embed, form, style)
// ====================================================
test('NP-SEC-13: Strips forbidden tags (iframe, object, embed, form, style, input, button)', () => {
  const dirty = `
    <iframe src="https://evil.com"></iframe>
    <object data="evil.swf"></object>
    <embed src="evil.swf">
    <form action="/login"><input type="password" value="secret"><button type="submit">Login</button></form>
    <style>body { display: none; } p { color: red; }</style>
  `;
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('<iframe'), 'Should strip iframe');
  assert.ok(!clean.includes('<object'), 'Should strip object');
  assert.ok(!clean.includes('<embed'), 'Should strip embed');
  assert.ok(!clean.includes('<form'), 'Should strip form');
  assert.ok(!clean.includes('<input'), 'Should strip input');
  assert.ok(!clean.includes('<button'), 'Should strip button');
  assert.ok(!clean.includes('<style'), 'Should strip style');
});

// ====================================================
// GROUP 6: DOM-Clobbering Defense
// ====================================================
test('NP-SEC-13: Prevents DOM-clobbering attacks via id and name attributes', () => {
  const clobbering = `
    <a id="location" href="https://res.cloudinary.com">Link with ID</a>
    <img id="body" name="clobbered" src="https://res.cloudinary.com/pic.jpg">
    <form id="test"><input name="id"></form>
  `;
  const clean = sanitizeHtml(clobbering);
  assert.ok(!clean.includes('id="location"'), 'Should strip id attribute on anchor');
  assert.ok(!clean.includes('id="body"'), 'Should strip id attribute on img');
  assert.ok(!clean.includes('name="clobbered"'), 'Should strip name attribute');
  assert.ok(!clean.includes('<form'), 'Should strip form element');
});

test('NP-SEC-13: Entity-encoded text is safely displayed and not executed', () => {
  const encodedText = '&lt;script&gt;alert(1)&lt;/script&gt;';
  const clean = sanitizeHtml(encodedText);
  assert.ok(!clean.includes('<script>'), 'Entity encoded script should not be converted to executable HTML element');
});

// ====================================================
// GROUP 7: External and Internal Links
// ====================================================
test('NP-SEC-13: Enforces target="_blank" and rel="noopener noreferrer" on external links', () => {
  const linkHtml = '<a href="https://example.com/info">External Link</a>';
  const clean = sanitizeHtml(linkHtml);
  assert.ok(clean.includes('target="_blank"'), 'Should add target="_blank"');
  assert.ok(clean.includes('rel="noopener noreferrer"'), 'Should add rel="noopener noreferrer"');
});

test('NP-SEC-13: Overrides malicious or conflicting rel/target on external links', () => {
  const maliciousLink = '<a href="https://example.com" target="_self" rel="opener">Attacker Link</a>';
  const clean = sanitizeHtml(maliciousLink);
  assert.ok(clean.includes('target="_blank"'), 'Should force target="_blank"');
  assert.ok(clean.includes('rel="noopener noreferrer"'), 'Should force rel="noopener noreferrer"');
  assert.ok(!clean.includes('rel="opener"'), 'Should override unsafe opener rel');
});

test('NP-SEC-13: Preserves safe internal and hash links without forcing target="_blank"', () => {
  const internalLink = '<a href="/shop">Shop All Products</a><a href="#benefits">View Benefits</a>';
  const clean = sanitizeHtml(internalLink);
  assert.ok(clean.includes('href="/shop"'), 'Should retain internal relative path');
  assert.ok(clean.includes('href="#benefits"'), 'Should retain internal hash link');
  assert.ok(!clean.includes('target="_blank"'), 'Internal links should not force target="_blank"');
});

// ====================================================
// GROUP 8: Image URL Policy & Hook Validation
// ====================================================
test('NP-SEC-13: isAllowedImageUrl validates approved hosts and rejects dangerous schemes', () => {
  // Approved hosts
  assert.strictEqual(isAllowedImageUrl('https://res.cloudinary.com/nepalprotein/image/upload/sample.jpg'), true, 'Cloudinary HTTPS accepted');
  assert.strictEqual(isAllowedImageUrl('https://images.unsplash.com/photo-1593095948071?w=800'), true, 'Unsplash HTTPS accepted');
  assert.strictEqual(isAllowedImageUrl('https://nepalprotein.com/logo.png'), true, 'Own domain accepted');
  assert.strictEqual(isAllowedImageUrl('https://osoaa.com/banner.webp'), true, 'OSOAA domain accepted');
  assert.strictEqual(isAllowedImageUrl('/assets/products/isolate.png'), true, 'Relative path accepted');
  assert.strictEqual(isAllowedImageUrl('http://localhost:5173/test.jpg'), true, 'Localhost dev accepted');

  // Disallowed & Dangerous
  assert.strictEqual(isAllowedImageUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='), false, 'data: URI rejected');
  assert.strictEqual(isAllowedImageUrl('javascript:alert(1)'), false, 'javascript: URI rejected');
  assert.strictEqual(isAllowedImageUrl('vbscript:msgbox(1)'), false, 'vbscript: URI rejected');
  assert.strictEqual(isAllowedImageUrl('blob:https://nepalprotein.com/uuid'), false, 'blob: URI rejected');
  assert.strictEqual(isAllowedImageUrl('//evil.com/tracker.png'), false, 'Protocol-relative URL rejected');
  assert.strictEqual(isAllowedImageUrl('https://untrusted-attacker.com/cookie-steal.png'), false, 'Arbitrary external host rejected');
  assert.strictEqual(isAllowedImageUrl('http://res.cloudinary.com/pic.jpg'), false, 'Insecure HTTP for external host rejected');
  assert.strictEqual(isAllowedImageUrl('https://[invalid-url'), false, 'Malformed URL rejected');
  assert.strictEqual(isAllowedImageUrl(''), false, 'Empty string rejected');
  assert.strictEqual(isAllowedImageUrl(null), false, 'Null rejected');
});

test('NP-SEC-13: Approved images retain src and receive loading="lazy"', () => {
  const validImg = '<img src="https://res.cloudinary.com/nepalprotein/image/upload/v1/whey.webp" alt="Whey Protein">';
  const clean = sanitizeHtml(validImg);
  assert.ok(clean.includes('src="https://res.cloudinary.com/nepalprotein/image/upload/v1/whey.webp"'), 'Should retain approved Cloudinary src');
  assert.ok(clean.includes('loading="lazy"'), 'Should add loading="lazy"');
  assert.ok(clean.includes('alt="Whey Protein"'), 'Should retain alt text');
});

test('NP-SEC-13: Unapproved or dangerous image sources have src stripped', () => {
  const rejectedImages = [
    '<img src="https://untrusted-external-site.com/tracking.png" alt="Tracker">',
    '<img src="//attacker.com/pixel.gif" alt="Pixel">',
    '<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" alt="Data SVG">',
    '<img src="javascript:alert(1)" alt="XSS">',
  ];

  for (const img of rejectedImages) {
    const clean = sanitizeHtml(img);
    assert.ok(!clean.includes('src='), `Should strip unapproved src from: ${img}`);
  }
});

// ====================================================
// GROUP 9: Null, Undefined, and Edge-Case Inputs
// ====================================================
test('NP-SEC-13: Handles null, undefined, empty string, and non-string inputs safely', () => {
  assert.strictEqual(sanitizeHtml(''), '');
  assert.strictEqual(sanitizeHtml(null), '');
  assert.strictEqual(sanitizeHtml(undefined), '');
  assert.strictEqual(sanitizeHtml(12345), '');
  assert.strictEqual(sanitizeHtml(true), '');
  assert.strictEqual(sanitizeHtml({}), '');
  assert.strictEqual(sanitizeHtml([]), '');
});

// ====================================================
// GROUP 10: Legitimate Rich Content Preservation
// ====================================================
test('NP-SEC-13: Preserves legitimate rich content tags, tables, headings, and lists', () => {
  const safeContent = `
    <h1>Complete Guide to Whey Isolate</h1>
    <h2>Nutritional Profile</h2>
    <h3>Key Benefits</h3>
    <p>This is a paragraph with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, and <code>console.log()</code>.</p>
    <ul><li>27g Pure Protein</li><li>0g Added Sugar</li></ul>
    <ol><li>Step 1: Scoop</li><li>Step 2: Shake</li></ol>
    <table>
      <thead><tr><th colspan="2">Nutrition Facts</th></tr></thead>
      <tbody><tr><td>Protein</td><td>27g</td></tr></tbody>
    </table>
    <blockquote>Authentic Himalayan Fitness Nutrition</blockquote>
    <pre><code>Batch Tested DFTQC Compliant</code></pre>
    <figure><figcaption>Product Specification Chart</figcaption></figure>
  `;
  const clean = sanitizeHtml(safeContent);
  assert.ok(clean.includes('<h1>Complete Guide to Whey Isolate</h1>'), 'Should retain h1');
  assert.ok(clean.includes('<h2>Nutritional Profile</h2>'), 'Should retain h2');
  assert.ok(clean.includes('<h3>Key Benefits</h3>'), 'Should retain h3');
  assert.ok(clean.includes('<strong>bold</strong>'), 'Should retain strong');
  assert.ok(clean.includes('<em>italic</em>'), 'Should retain em');
  assert.ok(clean.includes('<u>underline</u>'), 'Should retain u');
  assert.ok(clean.includes('<s>strikethrough</s>'), 'Should retain s');
  assert.ok(clean.includes('<code>console.log()</code>'), 'Should retain inline code');
  assert.ok(clean.includes('<ul><li>27g Pure Protein</li>'), 'Should retain ul list');
  assert.ok(clean.includes('<ol><li>Step 1: Scoop</li>'), 'Should retain ol list');
  assert.ok(clean.includes('<table>'), 'Should retain table');
  assert.ok(clean.includes('colspan="2"'), 'Should retain table colspan attribute');
  assert.ok(clean.includes('<blockquote>Authentic Himalayan Fitness Nutrition</blockquote>'), 'Should retain blockquote');
  assert.ok(clean.includes('<pre><code>Batch Tested DFTQC Compliant</code></pre>'), 'Should retain pre and code blocks');
  assert.ok(clean.includes('<figcaption>Product Specification Chart</figcaption>'), 'Should retain figcaption');
});
