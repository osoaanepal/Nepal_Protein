import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { authService } from '../services/auth.service.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

console.log('====================================================');
console.log('Nepal Protein Production Authentication Regression Validation');
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

async function runRegressionTests() {
  // Mock users
  const adminId = '609b1a5a8f1b2c001f3e4a11';
  const customerId = '609b1a5a8f1b2c001f3e4a22';
  const deactivatedId = '609b1a5a8f1b2c001f3e4a33';

  const mockUsers = {
    [adminId]: {
      _id: adminId,
      name: 'Admin Test User',
      email: 'admin@nepalprotein.com',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      changedPasswordAfter: () => false,
    },
    [customerId]: {
      _id: customerId,
      name: 'Customer Test User',
      email: 'customer@nepalprotein.com',
      role: 'customer',
      isActive: true,
      emailVerified: true,
      changedPasswordAfter: () => false,
    },
    [deactivatedId]: {
      _id: deactivatedId,
      name: 'Deactivated User',
      email: 'deactivated@nepalprotein.com',
      role: 'customer',
      isActive: false,
      emailVerified: true,
      changedPasswordAfter: () => false,
    },
  };

  // Mock User.findById
  const originalFindById = User.findById;
  User.findById = (id) => ({
    select: () => User.findById(id),
    exec: async () => mockUsers[id] || null,
    then: (resolve) => Promise.resolve(mockUsers[id] || null).then(resolve),
    catch: (reject) => Promise.resolve(mockUsers[id] || null).catch(reject),
  });

  // Setup test Express app with exact middleware configuration
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Test endpoints replicating production routes
  app.post('/api/auth/login', (req, res) => {
    const { email, password, isProduction = true } = req.body;
    let user;
    if (email === 'admin@nepalprotein.com' && password === 'AdminPass123!') {
      user = mockUsers[adminId];
    } else if (email === 'customer@nepalprotein.com' && password === 'CustPass123!') {
      user = mockUsers[customerId];
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = authService.generateToken(user);
    const cookieOpts = authService.getCookieOptions(isProduction ? 'production' : 'development');
    res.cookie('token', token, cookieOpts);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  app.get('/api/auth/me', protect, (req, res) => {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  });

  app.get('/api/admin/analytics/dashboard', protect, adminOnly, (req, res) => {
    return res.status(200).json({
      success: true,
      analytics: {
        totalRevenue: 250000,
        totalOrders: 120,
        totalProducts: 45,
      },
    });
  });

  app.post('/api/products', protect, adminOnly, (req, res) => {
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: { _id: 'prod123', name: req.body.name || 'Sample Product' },
    });
  });

  app.get('/api/wishlist', protect, (req, res) => {
    return res.status(200).json({
      success: true,
      wishlist: ['prod123', 'prod456'],
    });
  });

  app.post('/api/wishlist/toggle', protect, (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
    });
  });

  // Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // ====================================================
    // TEST 1: Cookie Configuration & Production Attributes
    // ====================================================
    console.log('\n--- 1. Production & Development Cookie Attributes ---');

    const prodOptions = authService.getCookieOptions('production');
    assert(prodOptions.httpOnly === true, 'Production cookie has httpOnly enabled');
    assert(prodOptions.secure === true, 'Production cookie has secure enabled');
    assert(prodOptions.sameSite === 'none', 'Production cookie has sameSite="none" for cross-site transmission');
    assert(prodOptions.partitioned === true, 'Production cookie has partitioned=true for modern browser CHIPS support');
    assert(prodOptions.path === '/', 'Production cookie path is sitewide ("/")');
    assert(typeof prodOptions.maxAge === 'number' && prodOptions.maxAge > 0, 'Production cookie maxAge is positive');

    const devOptions = authService.getCookieOptions('development');
    assert(devOptions.httpOnly === true, 'Development cookie has httpOnly enabled');
    assert(devOptions.secure === false, 'Development cookie has secure=false for HTTP localhost');
    assert(devOptions.sameSite === 'lax', 'Development cookie has sameSite="lax"');

    // ====================================================
    // TEST 2: Successful Login & Set-Cookie Header
    // ====================================================
    console.log('\n--- 2. Login Flow & Set-Cookie Inspection ---');

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nepalprotein.com', password: 'AdminPass123!' }),
    });

    assert(adminLoginRes.status === 200, 'Admin login endpoint returns 200 OK');
    const adminLoginBody = await adminLoginRes.json();
    assert(adminLoginBody.success === true, 'Login body contains success: true');
    assert(adminLoginBody.user?.role === 'admin', 'Login body returns user with admin role');

    const rawSetCookie = adminLoginRes.headers.get('set-cookie');
    assert(Boolean(rawSetCookie), 'Server responds with Set-Cookie header');
    assert(rawSetCookie.includes('token='), 'Set-Cookie contains token cookie');
    assert(rawSetCookie.toLowerCase().includes('httponly'), 'Set-Cookie header contains HttpOnly flag');
    assert(rawSetCookie.toLowerCase().includes('secure'), 'Set-Cookie header contains Secure flag');
    assert(rawSetCookie.toLowerCase().includes('samesite=none'), 'Set-Cookie header contains SameSite=None');
    assert(rawSetCookie.toLowerCase().includes('partitioned'), 'Set-Cookie header contains Partitioned attribute');

    // Extract cookie token for subsequent requests
    const cookieToken = rawSetCookie.split(';')[0]; // token=eyJhbGciOi...

    // ====================================================
    // TEST 3: Authenticated /api/auth/me Returns Logged-In User
    // ====================================================
    console.log('\n--- 3. Authenticated Session Retrieval (/api/auth/me) ---');

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: cookieToken },
    });

    assert(meRes.status === 200, 'Authenticated GET /api/auth/me returns 200 OK');
    const meBody = await meRes.json();
    assert(meBody.success === true, 'GET /api/auth/me body has success: true');
    assert(meBody.user?.email === 'admin@nepalprotein.com', 'GET /api/auth/me returns correct user email');
    assert(meBody.user?.role === 'admin', 'GET /api/auth/me returns correct user role');

    // ====================================================
    // TEST 4: Authentication Persists Across Page Refreshes
    // ====================================================
    console.log('\n--- 4. Session Persistence Across Page Refreshes ---');

    // Simulating page refresh: browser fires another /api/auth/me with credentials
    const refreshRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: cookieToken },
    });

    assert(refreshRes.status === 200, 'Subsequent /api/auth/me call on page refresh succeeds with 200 OK');
    const refreshBody = await refreshRes.json();
    assert(refreshBody.user?._id === adminId, 'Session persists with identical user ID after reload');

    // ====================================================
    // TEST 5: Admin Session Access to Protected Admin APIs
    // ====================================================
    console.log('\n--- 5. Admin Authorization (Analytics & Product Creation) ---');

    const analyticsRes = await fetch(`${baseUrl}/api/admin/analytics/dashboard`, {
      method: 'GET',
      headers: { Cookie: cookieToken },
    });

    assert(analyticsRes.status === 200, 'Admin can access /api/admin/analytics/dashboard (200 OK)');
    const analyticsBody = await analyticsRes.json();
    assert(Boolean(analyticsBody.analytics?.totalRevenue), 'Analytics data returned successfully');

    const createProductRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieToken,
      },
      body: JSON.stringify({ name: 'Nepal Protein Gold Whey' }),
    });

    assert(createProductRes.status === 201, 'Admin can create products via POST /api/products (201 Created)');
    const productBody = await createProductRes.json();
    assert(productBody.product?.name === 'Nepal Protein Gold Whey', 'Product creation returned created product');

    // ====================================================
    // TEST 6: User Session Access to Wishlist Endpoints
    // ====================================================
    console.log('\n--- 6. Customer Session Access to Wishlist Endpoints ---');

    const customerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@nepalprotein.com', password: 'CustPass123!' }),
    });
    const customerCookie = customerLoginRes.headers.get('set-cookie').split(';')[0];

    const wishlistGetRes = await fetch(`${baseUrl}/api/wishlist`, {
      method: 'GET',
      headers: { Cookie: customerCookie },
    });
    assert(wishlistGetRes.status === 200, 'Customer can access GET /api/wishlist (200 OK)');

    const wishlistToggleRes = await fetch(`${baseUrl}/api/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: JSON.stringify({ productId: 'prod123' }),
    });
    assert(wishlistToggleRes.status === 200, 'Customer can toggle wishlist item via POST /api/wishlist/toggle (200 OK)');

    // ====================================================
    // TEST 7: Missing and Invalid Cookies Are Strictly Rejected (401)
    // ====================================================
    console.log('\n--- 7. Rejection of Missing and Invalid Credentials ---');

    // Missing cookie
    const noCookieMeRes = await fetch(`${baseUrl}/api/auth/me`, { method: 'GET' });
    assert(noCookieMeRes.status === 401, 'Missing cookie on /api/auth/me returns 401 Unauthorized');
    const noCookieMeBody = await noCookieMeRes.json();
    assert(noCookieMeBody.message === 'Authentication required. Please log in to continue.', 'Expected 401 missing cookie message');

    const noCookieProductRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Product' }),
    });
    assert(noCookieProductRes.status === 401, 'Missing cookie on POST /api/products returns 401 Unauthorized');

    const noCookieWishlistRes = await fetch(`${baseUrl}/api/wishlist`, { method: 'GET' });
    assert(noCookieWishlistRes.status === 401, 'Missing cookie on GET /api/wishlist returns 401 Unauthorized');

    const noCookieAnalyticsRes = await fetch(`${baseUrl}/api/admin/analytics/dashboard`, { method: 'GET' });
    assert(noCookieAnalyticsRes.status === 401, 'Missing cookie on GET /api/admin/analytics/dashboard returns 401 Unauthorized');

    // Tampered / invalid token
    const invalidCookieRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: 'token=invalid.tampered.token123' },
    });
    assert(invalidCookieRes.status === 401, 'Tampered cookie returns 401 Unauthorized');

    // Expired token
    const expiredToken = jwt.sign(
      { id: customerId, role: 'customer' },
      ENV.JWT_SECRET,
      { expiresIn: '-1s' } // Expired 1 second ago
    );
    const expiredCookieRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: `token=${expiredToken}` },
    });
    assert(expiredCookieRes.status === 401, 'Expired token returns 401 Unauthorized');

    // ====================================================
    // TEST 8: Unauthorized Users Cannot Access Admin Endpoints (403)
    // ====================================================
    console.log('\n--- 8. Non-Admin Users Denied Admin-Only Access (403) ---');

    const nonAdminAnalyticsRes = await fetch(`${baseUrl}/api/admin/analytics/dashboard`, {
      method: 'GET',
      headers: { Cookie: customerCookie },
    });
    assert(nonAdminAnalyticsRes.status === 403, 'Customer role blocked from admin analytics with 403 Forbidden');
    const nonAdminAnalyticsBody = await nonAdminAnalyticsRes.json();
    assert(nonAdminAnalyticsBody.message.includes('Access denied'), '403 body includes Access denied message');

    const nonAdminProductRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: JSON.stringify({ name: 'Customer Attempted Product' }),
    });
    assert(nonAdminProductRes.status === 403, 'Customer role blocked from product creation with 403 Forbidden');

  } finally {
    // Restore User.findById and close server
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('\n====================================================');
  console.log(`Regression Test Summary: ${passedTests} / ${totalTests} Passed.`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRegressionTests().catch((err) => {
  console.error('Fatal error running regression tests:', err);
  process.exit(1);
});
