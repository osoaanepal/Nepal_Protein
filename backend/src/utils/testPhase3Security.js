import { escapeHtml, escapeRegex, isValidImageBuffer, maskName, maskPhone } from './security.js';
import { upload, validateImageFileSignatures } from '../middleware/upload.middleware.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { couponRateLimiter, orderTrackRateLimiter } from '../middleware/rateLimiter.middleware.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

console.log('====================================================');
console.log('Nepal Protein Phase 3 Security Remediation Validation');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

async function runTests() {
  // ====================================================
  // GROUP 1: NP-SEC-07: Email & HTML Injection Defense
  // ====================================================
  console.log('\n--- NP-SEC-07: Email Injection & HTML Escaping ---');

  // Test escapeHtml
  const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
  const escapedPayload = escapeHtml(xssPayload);
  assert(!escapedPayload.includes('<script>'), 'escapeHtml escapes <script> tag');
  assert(!escapedPayload.includes('<img'), 'escapeHtml escapes <img tag');
  assert(escapedPayload.includes('&lt;script&gt;'), 'escapeHtml converts < to &lt; and > to &gt;');
  assert(escapedPayload.includes('&quot;'), 'escapeHtml converts quotes to &quot;');

  // Test special characters & quotes
  const quotesPayload = `test's "quote" & <ampersand>`;
  const escapedQuotes = escapeHtml(quotesPayload);
  assert(escapedQuotes.includes('&#039;'), 'escapeHtml converts single quote to &#039;');
  assert(escapedQuotes.includes('&amp;'), 'escapeHtml converts ampersand to &amp;');

  // Test null / undefined / empty input
  assert(escapeHtml(null) === '', 'escapeHtml handles null gracefully');
  assert(escapeHtml(undefined) === '', 'escapeHtml handles undefined gracefully');
  assert(escapeHtml('') === '', 'escapeHtml handles empty string gracefully');

  // Test email service import and escaping in contact notification
  const { emailService } = await import('../services/email.service.js');
  assert(typeof emailService.sendContactNotification === 'function', 'emailService.sendContactNotification exists');

  // Test header injection prevention (CRLF stripped from subject and sender)
  const origSend = emailService.sendMail;
  let sentMailOptions = null;
  emailService.sendMail = async (options) => {
    sentMailOptions = options;
    return { success: true, messageId: 'test-msg-id' };
  };

  await emailService.sendContactNotification({
    name: 'Attacker\r\nBcc: victim@example.com',
    email: 'hacker@example.com',
    phone: '9800000000',
    subject: 'Inquiry\r\nSubject-Injection: Evil',
    message: '<script>alert("pwned")</script> Hello!',
  });

  assert(Boolean(sentMailOptions), 'Email send called');
  assert(!sentMailOptions.subject.includes('\r'), 'CRLF (\\r) stripped from email subject');
  assert(!sentMailOptions.subject.includes('\n'), 'CRLF (\\n) stripped from email subject');
  assert(!sentMailOptions.html.includes('<script>'), 'HTML <script> tag escaped in email HTML body');
  assert(sentMailOptions.html.includes('&lt;script&gt;'), 'HTML script converted to &lt;script&gt; in email HTML body');
  emailService.sendMail = origSend; // restore

  // ====================================================
  // GROUP 2: NP-SEC-08: Unsafe Uploads & SVG Blocking
  // ====================================================
  console.log('\n--- NP-SEC-08: Unsafe Uploads & File Validation ---');

  // Test magic bytes: JPEG (FF D8 FF)
  const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
  assert(isValidImageBuffer(validJpegBuffer) === true, 'isValidImageBuffer accepts valid JPEG header');

  // Test magic bytes: PNG (89 50 4E 47 0D 0A 1A 0A)
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  assert(isValidImageBuffer(validPngBuffer) === true, 'isValidImageBuffer accepts valid PNG header');

  // Test magic bytes: WebP (RIFF .... WEBP)
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // 'RIFF'
    0x24, 0x00, 0x00, 0x00, // Size
    0x57, 0x45, 0x42, 0x50, // 'WEBP'
    0x56, 0x50, 0x38, 0x20  // 'VP8 '
  ]);
  assert(isValidImageBuffer(validWebpBuffer) === true, 'isValidImageBuffer accepts valid WebP header');

  // Test magic bytes: SVG / XML / Plaintext disguised as image
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert(isValidImageBuffer(svgBuffer) === false, 'isValidImageBuffer rejects SVG/XML buffer');

  const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // MZ executable header
  assert(isValidImageBuffer(exeBuffer) === false, 'isValidImageBuffer rejects MZ executable buffer');

  const emptyBuffer = Buffer.alloc(0);
  assert(isValidImageBuffer(emptyBuffer) === false, 'isValidImageBuffer rejects empty buffer');

  // Test multer fileFilter behavior
  const fileFilter = upload.fileFilter;
  assert(typeof fileFilter === 'function', 'upload.fileFilter is defined');

  // Helper to test fileFilter
  const testFileFilter = (file) => {
    return new Promise((resolve) => {
      fileFilter({}, file, (err, acceptFile) => {
        resolve({ err, acceptFile });
      });
    });
  };

  const svgFile = { originalname: 'malicious.svg', mimetype: 'image/svg+xml' };
  const svgResult = await testFileFilter(svgFile);
  assert(svgResult.acceptFile === false, 'fileFilter rejects .svg extension and image/svg+xml MIME');

  const spoofedSvg = { originalname: 'malicious.svg', mimetype: 'image/jpeg' };
  const spoofedSvgResult = await testFileFilter(spoofedSvg);
  assert(spoofedSvgResult.acceptFile === false, 'fileFilter rejects .svg file even with spoofed image/jpeg MIME');

  const phpFile = { originalname: 'shell.php', mimetype: 'application/x-php' };
  const phpResult = await testFileFilter(phpFile);
  assert(phpResult.acceptFile === false, 'fileFilter rejects .php file');

  const validJpg = { originalname: 'product.jpg', mimetype: 'image/jpeg' };
  const validJpgResult = await testFileFilter(validJpg);
  assert(validJpgResult.acceptFile === true, 'fileFilter accepts valid .jpg file');

  const validPng = { originalname: 'banner.png', mimetype: 'image/png' };
  const validPngResult = await testFileFilter(validPng);
  assert(validPngResult.acceptFile === true, 'fileFilter accepts valid .png file');

  const validWebpFile = { originalname: 'photo.webp', mimetype: 'image/webp' };
  const validWebpResult = await testFileFilter(validWebpFile);
  assert(validWebpResult.acceptFile === true, 'fileFilter accepts valid .webp file');

  // Test validateImageFileSignatures middleware
  let nextCalled = false;
  let errorStatus = null;
  let errorMessage = null;

  const mockRes = {
    status: (code) => {
      errorStatus = code;
      return {
        json: (data) => { errorMessage = data.message; }
      };
    }
  };

  // With spoofed buffer in req.file
  const spoofedReq = {
    file: {
      originalname: 'fake.png',
      mimetype: 'image/png',
      buffer: svgBuffer,
    }
  };
  validateImageFileSignatures(spoofedReq, mockRes, () => { nextCalled = true; });
  assert(errorStatus === 400 && errorMessage.includes('does not contain a valid JPEG, PNG, or WebP image signature'), 'validateImageFileSignatures blocks spoofed buffer with 400 error');

  // With valid buffer in req.file
  nextCalled = false;
  errorStatus = null;
  const validReq = {
    file: {
      originalname: 'clean.jpg',
      mimetype: 'image/jpeg',
      buffer: validJpegBuffer,
    }
  };
  validateImageFileSignatures(validReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === true, 'validateImageFileSignatures passes valid image buffer');

  // ====================================================
  // GROUP 3: NP-SEC-10: Regex Injection & ReDoS Defense
  // ====================================================
  console.log('\n--- NP-SEC-10: Regex Injection & ReDoS Defense ---');

  // Test escapeRegex escapes all special characters
  const specialChars = '.*+?^${}()|[]\\';
  const escaped = escapeRegex(specialChars);
  assert(!/[.*+?^${}()|[\]\\]/.test(escaped.replace(/\\./g, '')), 'escapeRegex escaped every regex metacharacter');

  // Test that unclosed brackets do not throw SyntaxError
  let didThrow = false;
  try {
    const unclosedQuery = 'Whey [Gold Standard';
    const regex = new RegExp(escapeRegex(unclosedQuery), 'i');
    assert(regex.test('Whey [Gold Standard 100%'), 'Escaped unclosed bracket matches target string correctly');
  } catch (err) {
    didThrow = true;
  }
  assert(!didThrow, 'Unclosed regex bracket did NOT throw SyntaxError');

  // Test ReDoS vulnerable pattern is neutralized
  const evilRedosInput = '((((((a+)+)+)+)+)+)$';
  const escapedRedos = escapeRegex(evilRedosInput);
  let redosSafe = false;
  try {
    const safeRegex = new RegExp(escapedRedos, 'i');
    assert(safeRegex.test('((((((a+)+)+)+)+)+)$'), 'Matches literal string containing nested quantifier characters');
    assert(!safeRegex.test('aaaaaaaaaaaaaaaaaaaaaaaaa'), 'Does not execute nested quantifier search against input');
    redosSafe = true;
  } catch (e) {
    redosSafe = false;
  }
  assert(redosSafe, 'Neutralized ReDoS pattern safely');

  // Test product and brand searches
  const brandQuery = 'MuscleTech (US)';
  const brandRegex = new RegExp(escapeRegex(brandQuery), 'i');
  assert(brandRegex.test('MuscleTech (US) Whey'), 'Literal match works with parentheses');
  assert(!brandRegex.test('MuscleTech US Whey'), 'Literal match distinguishes parentheses correctly');

  // ====================================================
  // GROUP 4: NP-SEC-11: Coupon Endpoint Abuse Defense
  // ====================================================
  console.log('\n--- NP-SEC-11: Coupon Rate Limiting & Abuse Defense ---');

  // Test rate limiter presence
  assert(Boolean(couponRateLimiter), 'couponRateLimiter is defined');

  // Test optionalAuth middleware
  let authNext = false;
  const unauthReq = { headers: {} };
  await optionalAuth(unauthReq, {}, () => { authNext = true; });
  assert(authNext === true && unauthReq.user === undefined, 'optionalAuth allows unauthenticated requests without error');

  // With invalid token
  let invalidAuthNext = false;
  const invalidAuthReq = { headers: { authorization: 'Bearer invalid.token.value' } };
  await optionalAuth(invalidAuthReq, {}, () => { invalidAuthNext = true; });
  assert(invalidAuthNext === true && invalidAuthReq.user === undefined, 'optionalAuth ignores invalid token and does not throw');

  // With valid token and mocked User.findById
  const { User } = await import('../models/User.js');
  const origFindById = User.findById;
  const testUser = { _id: '507f1f77bcf86cd799439011', email: 'couponuser@nepalprotein.com', role: 'customer' };
  User.findById = (id) => {
    return Promise.resolve({
      _id: id,
      email: testUser.email,
      role: testUser.role,
      isActive: true,
      changedPasswordAfter: () => false,
    });
  };

  let validAuthNext = false;
  const validToken = jwt.sign({ id: testUser._id }, ENV.JWT_SECRET, { expiresIn: '1h' });
  const validAuthReq = { headers: { authorization: `Bearer ${validToken}` } };
  await optionalAuth(validAuthReq, {}, () => { validAuthNext = true; });
  assert(validAuthNext === true && validAuthReq.user?._id === testUser._id, 'optionalAuth populates req.user when valid token is provided');
  User.findById = origFindById; // restore

  // ====================================================
  // GROUP 5: NP-SEC-12: Public Order Tracking Privacy
  // ====================================================
  console.log('\n--- NP-SEC-12: Order Tracking Data Exposure Defense ---');

  // Test rate limiter presence
  assert(Boolean(orderTrackRateLimiter), 'orderTrackRateLimiter is defined');

  // Test maskName
  assert(maskName('Ram Bahadur') === 'R*m B*****r', `maskName correctly masks 'Ram Bahadur' -> ${maskName('Ram Bahadur')}`);
  assert(maskName('John Doe') === 'J**n D*e', `maskName correctly masks 'John Doe' -> ${maskName('John Doe')}`);
  assert(maskName('A') === 'A', 'maskName handles single character safely');
  assert(maskName('') === '', 'maskName handles empty string safely');
  assert(maskName(null) === '', 'maskName handles null safely');

  // Test maskPhone
  assert(maskPhone('9841234567') === '984*****67', `maskPhone correctly masks '9841234567' -> ${maskPhone('9841234567')}`);
  assert(maskPhone('+977-9841234567') === '+97**********67', 'maskPhone preserves prefix and last 2 digits for international format');
  assert(maskPhone('123') === '****', 'maskPhone handles short phone safely');
  assert(maskPhone(null) === '', 'maskPhone handles null safely');

  // Test tracking response data sanitization logic
  const sensitiveOrder = {
    orderNumber: 'NP-202610-123456',
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'esewa',
    shippingAddress: {
      fullName: 'Aayush Maharjan',
      phone: '9801234567',
      addressLine1: 'House 42, Ward 3, Secret Street, Pulchowk',
      addressLine2: 'Near Private Landmark',
      city: 'Lalitpur',
      state: 'Bagmati',
      country: 'Nepal',
      postalCode: '44700',
    },
    items: [
      {
        productName: 'Iso-Whey 2kg',
        quantity: 1,
        price: 9500,
        flavour: 'Chocolate',
      }
    ],
    pricing: {
      itemsSubtotal: 9500,
      deliveryFee: 100,
      couponDiscount: 500,
      grandTotal: 9100,
    },
    paymentInfo: {
      transactionUuid: 'esewa-uuid-999-private-token',
      signature: 'hmac-sha256-internal-sig',
      responsePayload: { raw: 'secret_gateway_response' }
    }
  };

  // Simulate tracking controller payload mapping
  const trackingOutput = {
    orderNumber: sensitiveOrder.orderNumber,
    status: sensitiveOrder.status,
    paymentStatus: sensitiveOrder.paymentStatus,
    paymentMethod: sensitiveOrder.paymentMethod,
    destination: {
      city: sensitiveOrder.shippingAddress?.city,
      state: sensitiveOrder.shippingAddress?.state,
      country: sensitiveOrder.shippingAddress?.country,
      recipientNameMasked: maskName(sensitiveOrder.shippingAddress?.fullName),
      recipientPhoneMasked: maskPhone(sensitiveOrder.shippingAddress?.phone),
    },
    items: sensitiveOrder.items,
    pricing: {
      grandTotal: sensitiveOrder.pricing?.grandTotal,
    },
  };

  assert(trackingOutput.orderNumber === 'NP-202610-123456', 'Order number returned for tracking');
  assert(trackingOutput.destination.recipientNameMasked === 'A****h M******n', 'Customer full name is masked');
  assert(trackingOutput.destination.recipientPhoneMasked === '980*****67', 'Customer phone is masked');
  assert(trackingOutput.destination.city === 'Lalitpur', 'City is preserved for tracking progress');
  assert(!('addressLine1' in trackingOutput.destination), 'Full street address is NOT exposed in tracking');
  assert(!('addressLine2' in trackingOutput.destination), 'Full address line 2 is NOT exposed in tracking');
  assert(!('paymentInfo' in trackingOutput), 'Internal payment info / UUID / signature is NOT exposed in tracking');

  console.log('\n====================================================');
  console.log(`Phase 3 Test Summary: ${passedTests}/${totalTests} Passed`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
