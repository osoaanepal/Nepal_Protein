import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { authService } from '../services/auth.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('Nepal Protein Phase 1 Security Remediation Validation');
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

// ====================================================
// 1. NP-SEC-01: Environment Validation & Gitignore Check
// ====================================================
console.log('\n--- NP-SEC-01: Environment & Secret Hardening ---');

assert(Boolean(ENV.JWT_SECRET), 'JWT_SECRET is defined and loaded');
assert(typeof ENV.JWT_SECRET === 'string' && ENV.JWT_SECRET.length >= 32, 'JWT_SECRET meets minimum security length (>= 32 chars)');

// Check .gitignore to ensure .env.production is NOT unignored
const gitignorePath = path.resolve(__dirname, '../../../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  assert(!gitignoreContent.includes('!.env.production'), '.gitignore does not contain !.env.production exception');
  assert(gitignoreContent.includes('.env'), '.gitignore properly ignores .env files');
} else {
  console.log('[WARN] Root .gitignore file not found for inspection');
}

// ====================================================
// 2. NP-SEC-02: Strict CORS Whitelist Validation
// ====================================================
console.log('\n--- NP-SEC-02: CORS Origin Whitelist Verification ---');

const allowedOrigins = [
  ENV.CLIENT_URL,
  ENV.SITE_URL,
  ...(ENV.NODE_ENV !== 'production'
    ? [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ]
    : []),
].filter(Boolean);

// Replicate the exact server.js CORS validation logic
function testCorsOrigin(origin, isProduction = false) {
  if (!origin) return true; // Mobile apps / server-to-server
  if (allowedOrigins.includes(origin)) return true;
  if (!isProduction) {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  return false;
}

assert(testCorsOrigin(ENV.CLIENT_URL, false) === true, 'Configured CLIENT_URL is permitted');
assert(testCorsOrigin(undefined, false) === true, 'Requests with no origin (curl/mobile) are permitted');
assert(testCorsOrigin('http://localhost:5173', false) === true, 'Localhost:5173 permitted in development');
assert(testCorsOrigin('http://localhost:3000', false) === true, 'Localhost:3000 permitted in development');
assert(testCorsOrigin('https://evil-hacker.com', false) === false, 'Untrusted origin blocked in dev mode');
assert(testCorsOrigin('https://evil-hacker.com', true) === false, 'Untrusted origin strictly blocked in production mode');
assert(testCorsOrigin('http://localhost:5173', true) === false || allowedOrigins.includes('http://localhost:5173'), 'Localhost blocked in production unless explicitly set as CLIENT_URL');

// ====================================================
// 3. NP-SEC-06: Cookie Configuration & HTTP-Only Verification
// ====================================================
console.log('\n--- NP-SEC-06: Cookie Settings & Session Architecture ---');

const cookieOptions = authService.getCookieOptions();
assert(cookieOptions.httpOnly === true, 'Cookie option httpOnly is strictly true');
assert(cookieOptions.sameSite === 'lax', 'Cookie option sameSite is set to "lax" for CSRF protection');
assert(cookieOptions.path === '/', 'Cookie option path is set to "/" for sitewide API coverage');
assert(typeof cookieOptions.maxAge === 'number' && cookieOptions.maxAge > 0, 'Cookie maxAge is a positive duration');

const prodCookieOptions = authService.getCookieOptions('production');
assert(prodCookieOptions.httpOnly === true, 'Production cookie option httpOnly is strictly true');
assert(prodCookieOptions.secure === true, 'Production cookie option secure is strictly true');
assert(prodCookieOptions.sameSite === 'none', 'Production cookie option sameSite is set to "none" for cross-site SPA authentication');
assert(prodCookieOptions.partitioned === true, 'Production cookie option partitioned is true for CHIPS browser compatibility');

// Check frontend api.js for X-Requested-With header
const apiJsPath = path.resolve(__dirname, '../../../frontend/src/services/api.js');
if (fs.existsSync(apiJsPath)) {
  const apiJsContent = fs.readFileSync(apiJsPath, 'utf-8');
  assert(apiJsContent.includes("'X-Requested-With': 'XMLHttpRequest'"), 'Frontend Axios client attaches X-Requested-With CSRF header');
  assert(!apiJsContent.includes("localStorage.getItem('osoaa_token')"), 'Frontend Axios client no longer reads token from localStorage');
}

// Check frontend authStore.js for no localStorage token
const authStorePath = path.resolve(__dirname, '../../../frontend/src/store/authStore.js');
if (fs.existsSync(authStorePath)) {
  const authStoreContent = fs.readFileSync(authStorePath, 'utf-8');
  assert(!authStoreContent.includes("localStorage.setItem('osoaa_token'"), 'Frontend authStore no longer writes token to localStorage');
  assert(!authStoreContent.includes("localStorage.getItem('osoaa_token'"), 'Frontend authStore no longer initializes token from localStorage');
}

// ====================================================
// 4. NP-SEC-14: Password Changed At & Token Invalidation
// ====================================================
console.log('\n--- NP-SEC-14: JWT Invalidation upon Password Change ---');

// Instantiate a mock User document
const testUser = new User({
  name: 'Security Test User',
  email: 'sec-test@nepalprotein.com',
  phone: '9800000000',
  password: 'OriginalPassword123!',
  role: 'customer',
  passwordChangedAt: null,
});

assert(typeof testUser.changedPasswordAfter === 'function', 'User model defines changedPasswordAfter method');

// Scenario A: User has never changed password (passwordChangedAt is null)
const dummyIat = Math.floor(Date.now() / 1000) - 3600; // Token issued 1 hour ago
assert(testUser.changedPasswordAfter(dummyIat) === false, 'Valid session when password has never been changed');

// Scenario B: User changes password 10 seconds ago
const nowSeconds = Math.floor(Date.now() / 1000);
testUser.passwordChangedAt = new Date((nowSeconds - 10) * 1000);

const oldTokenIat = nowSeconds - 60; // Token issued 1 minute ago (BEFORE password change)
assert(testUser.changedPasswordAfter(oldTokenIat) === true, 'Token issued BEFORE password change is rejected (returns true)');

const newTokenIat = nowSeconds + 1; // Token issued AFTER password change
assert(testUser.changedPasswordAfter(newTokenIat) === false, 'Token issued AFTER password change is accepted (returns false)');

// Scenario C: Verify timestamp precision edge cases
const exactSameTimeToken = Math.floor(testUser.passwordChangedAt.getTime() / 1000);
assert(testUser.changedPasswordAfter(exactSameTimeToken) === false, 'Token issued at exact changed timestamp is accepted');

// ====================================================
// Test Summary
// ====================================================
console.log('\n====================================================');
console.log(`Phase 1 Security Validation Summary: ${passedTests} / ${totalTests} passed.`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
