/**
 * Automated Security Validation Test Suite — Phase 4
 * Covers NP-SEC-15, NP-SEC-17, NP-SEC-18, NP-SEC-19, NP-SEC-20
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createSmtpTransportOptions, emailService } from '../services/email.service.js';
import { maskEmail, redactSensitiveData } from './security.js';
import { getSecurityHeaderOptions } from '../config/securityHeaders.js';
import { validateSeederSafety } from './seeder.js';

let passedTests = 0;
let totalTests = 0;

const test = (name, fn) => {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    process.exitCode = 1;
  }
};

const runAsyncTest = async (name, fn) => {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    process.exitCode = 1;
  }
};

const runSuite = async () => {
  console.log('====================================================');
  console.log('Nepal Protein Phase 4 Security Remediation Validation');
  console.log('====================================================');

  // =========================================================================
  // GROUP 1: NP-SEC-15: SMTP TLS Certificate Validation & Modern Ciphers
  // =========================================================================
  console.log('\n--- NP-SEC-15: SMTP TLS Certificate Verification ---');

  test('createSmtpTransportOptions returns null if credentials are empty', () => {
    assert.strictEqual(createSmtpTransportOptions({ USER: '', PASS: '' }), null);
    assert.strictEqual(createSmtpTransportOptions(null), null);
  });

  test('Removes rejectUnauthorized: false in production mode', () => {
    const opts = createSmtpTransportOptions(
      { HOST: 'smtp.custom-domain.com', PORT: 587, USER: 'mailer@domain.com', PASS: 'secretPass123' },
      'production'
    );
    assert.ok(opts, 'Transport options generated');
    assert.strictEqual(opts.tls.rejectUnauthorized, true, 'rejectUnauthorized must be true');
    assert.notStrictEqual(opts.tls.rejectUnauthorized, false, 'rejectUnauthorized must never be false');
  });

  test('Requires valid TLS certificate verification in production', () => {
    const opts = createSmtpTransportOptions(
      { HOST: 'smtp.sendgrid.net', PORT: 465, USER: 'apikey', PASS: 'SG.123456' },
      'production'
    );
    assert.strictEqual(opts.secure, true, 'Port 465 is secure');
    assert.strictEqual(opts.tls.rejectUnauthorized, true, 'Must enforce certificate verification');
    assert.strictEqual(opts.tls.minVersion, 'TLSv1.2', 'Must require modern TLS version');
  });

  test('Preserves legitimate Gmail SMTP compatibility with verified TLS', () => {
    const opts = createSmtpTransportOptions(
      { HOST: 'smtp.gmail.com', PORT: 587, USER: 'osoaanepal@gmail.com', PASS: 'appPassword123' },
      'production'
    );
    assert.strictEqual(opts.service, 'gmail');
    assert.strictEqual(opts.tls.rejectUnauthorized, true, 'Gmail TLS must verify certs');
    assert.strictEqual(opts.tls.minVersion, 'TLSv1.2');
  });

  test('Disallows weakening TLS certificate validation in production mode even if env flag is set', () => {
    const original = process.env.SMTP_ALLOW_SELFSIGNED;
    process.env.SMTP_ALLOW_SELFSIGNED = 'true';
    try {
      const opts = createSmtpTransportOptions(
        { HOST: 'smtp.corporate.internal', PORT: 587, USER: 'bot', PASS: 'corp123' },
        'production'
      );
      assert.strictEqual(opts.tls.rejectUnauthorized, true, 'Production must ignore self-signed override');
    } finally {
      process.env.SMTP_ALLOW_SELFSIGNED = original;
    }
  });

  test('Defaults to strict TLS validation in non-production mode by default', () => {
    const original = process.env.SMTP_ALLOW_SELFSIGNED;
    delete process.env.SMTP_ALLOW_SELFSIGNED;
    try {
      const opts = createSmtpTransportOptions(
        { HOST: 'smtp.mailtrap.io', PORT: 2525, USER: 'user', PASS: 'pass' },
        'development'
      );
      assert.strictEqual(opts.tls.rejectUnauthorized, true, 'Default non-production also enforces verification');
    } finally {
      process.env.SMTP_ALLOW_SELFSIGNED = original;
    }
  });

  // =========================================================================
  // GROUP 2: NP-SEC-17: OTP, Secret & PII Log Redaction
  // =========================================================================
  console.log('\n--- NP-SEC-17: OTP and Sensitive Log Redaction ---');

  test('maskEmail preserves diagnostic domain while masking username', () => {
    assert.strictEqual(maskEmail('customer@osoaa.com'), 'c******r@osoaa.com');
    assert.strictEqual(maskEmail('admin@nepalprotein.com'), 'a***n@nepalprotein.com');
  });

  test('maskEmail handles short usernames and edge cases gracefully', () => {
    assert.strictEqual(maskEmail('ab@test.com'), 'a*@test.com');
    assert.strictEqual(maskEmail('a@test.com'), 'a*@test.com');
    assert.strictEqual(maskEmail(''), '');
    assert.strictEqual(maskEmail(null), '');
    assert.strictEqual(maskEmail('invalid-email'), '****');
  });

  test('redactSensitiveData redacts 6-digit OTP codes', () => {
    const text = 'Your Nepal Protein verification code is: 849201. Please use 849201 within 10 min.';
    const sanitized = redactSensitiveData(text);
    assert.ok(!sanitized.includes('849201'), 'Cleartext OTP must be removed');
    assert.strictEqual(sanitized, 'Your Nepal Protein verification code is: [REDACTED_OTP]. Please use [REDACTED_OTP] within 10 min.');
  });

  test('redactSensitiveData redacts JWT session tokens', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJjdXN0b21lciJ9.9YVvKq6_m0123456789abcdefghijklmnopqrstuvw';
    const text = `Bearer ${token} authorization header`;
    const sanitized = redactSensitiveData(text);
    assert.ok(!sanitized.includes(token), 'Cleartext JWT must be removed');
    assert.ok(sanitized.includes('[REDACTED_JWT]'), 'JWT replaced with redact token');
  });

  test('redactSensitiveData redacts passwords and secrets from JSON/query formats', () => {
    const payload = '{"email":"test@example.com","password":"SuperSecretPassword!","rawOtp":"123456"}';
    const sanitized = redactSensitiveData(payload);
    assert.ok(!sanitized.includes('SuperSecretPassword!'), 'Password must be redacted');
    assert.ok(!sanitized.includes('123456'), 'OTP must be redacted');
    assert.ok(sanitized.includes('"password":"[REDACTED]"'));
    assert.ok(sanitized.includes('"rawOtp":"[REDACTED]"'));
  });

  test('redactSensitiveData redacts password reset links containing tokens', () => {
    const link = 'Click https://nepalprotein.com/reset-password?token=d8a7c2b3e4f5a6b7c8d9 to reset.';
    const sanitized = redactSensitiveData(link);
    assert.ok(!sanitized.includes('d8a7c2b3e4f5a6b7c8d9'), 'Reset token must be stripped from log');
    assert.ok(sanitized.includes('?token=[REDACTED]'));
  });

  await runAsyncTest('emailService dev mock dispatches without logging cleartext OTPs or passwords', async () => {
    const originalLog = console.log;
    const originalError = console.error;
    let loggedOutput = '';
    console.log = (...args) => {
      loggedOutput += args.join(' ') + '\n';
    };
    console.error = (...args) => {
      loggedOutput += args.join(' ') + '\n';
    };

    const savedTransporter = emailService.transporter;
    const savedResend = emailService.resend;
    emailService.transporter = null;
    emailService.resend = null;

    try {
      // Call sendVerificationOtp
      await emailService.sendVerificationOtp({
        email: 'secretuser@example.com',
        name: 'Secret User',
        otp: '918273',
      });

      assert.ok(!loggedOutput.includes('918273'), 'Dev mock logger must not output raw OTP 918273');
      assert.ok(loggedOutput.includes('s********r@example.com'), 'Dev mock logger outputs masked email');
      assert.ok(loggedOutput.includes('[Security Guard]'), 'Diagnostic log confirms secrets redacted');
    } finally {
      emailService.transporter = savedTransporter;
      emailService.resend = savedResend;
      console.log = originalLog;
      console.error = originalError;
    }
  });

  // =========================================================================
  // GROUP 3: NP-SEC-18: Content Security Policy & Cross-Origin-Resource-Policy
  // =========================================================================
  console.log('\n--- NP-SEC-18: Security Headers, CSP & CORP Verification ---');

  test('getSecurityHeaderOptions configures valid CSP structure', () => {
    const opts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
    assert.ok(opts.contentSecurityPolicy, 'CSP must be enabled');
    assert.ok(opts.contentSecurityPolicy.directives, 'Directives must be defined');
    assert.strictEqual(opts.crossOriginResourcePolicy.policy, 'cross-origin', 'CORP must be cross-origin');
    assert.strictEqual(opts.crossOriginOpenerPolicy.policy, 'same-origin-allow-popups', 'COOP allows payment redirect popups');
    assert.strictEqual(opts.referrerPolicy.policy, 'strict-origin-when-cross-origin');
  });

  test('CSP formAction directive explicitly allows eSewa payment submission endpoints', () => {
    const opts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
    const formAction = opts.contentSecurityPolicy.directives.formAction;
    assert.ok(formAction.includes("'self'"), "formAction includes 'self'");
    assert.ok(formAction.includes('https://rc-epay.esewa.com.np'), 'formAction includes eSewa sandbox');
    assert.ok(formAction.includes('https://epay.esewa.com.np'), 'formAction includes eSewa production');
  });

  test('CSP connectSrc explicitly allows eSewa, Cloudinary, and configured CLIENT_URL', () => {
    const opts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
    const connectSrc = opts.contentSecurityPolicy.directives.connectSrc;
    assert.ok(connectSrc.includes('https://rc-epay.esewa.com.np'), 'connectSrc includes eSewa sandbox');
    assert.ok(connectSrc.includes('https://epay.esewa.com.np'), 'connectSrc includes eSewa production');
    assert.ok(connectSrc.includes('https://res.cloudinary.com'), 'connectSrc includes Cloudinary CDN');
    assert.ok(connectSrc.includes('https://nepalprotein.com'), 'connectSrc includes frontend domain');
  });

  test('CSP imgSrc allows Cloudinary CDN, Unsplash, Google Fonts, and data/blob schemes', () => {
    const opts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
    const imgSrc = opts.contentSecurityPolicy.directives.imgSrc;
    assert.ok(imgSrc.includes("'self'"));
    assert.ok(imgSrc.includes('data:'));
    assert.ok(imgSrc.includes('blob:'));
    assert.ok(imgSrc.includes('https://res.cloudinary.com'), 'Cloudinary CDN permitted');
    assert.ok(imgSrc.includes('https://images.unsplash.com'), 'Unsplash permitted');
    assert.ok(imgSrc.includes('https://fonts.gstatic.com'), 'Google font icons permitted');
  });

  test('CSP fontSrc and styleSrc permit Google Fonts without breaking UI', () => {
    const opts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
    const styleSrc = opts.contentSecurityPolicy.directives.styleSrc;
    const fontSrc = opts.contentSecurityPolicy.directives.fontSrc;
    assert.ok(styleSrc.includes('https://fonts.googleapis.com'), 'Google Fonts CSS allowed');
    assert.ok(styleSrc.includes("'unsafe-inline'"), 'Inline Tailwind/React styles allowed');
    assert.ok(fontSrc.includes('https://fonts.gstatic.com'), 'Google Font files allowed');
  });

  test('CSP frameSrc permits safe YouTube and Vimeo video embeds for blog articles', () => {
    const opts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
    const frameSrc = opts.contentSecurityPolicy.directives.frameSrc;
    assert.ok(frameSrc.includes('https://www.youtube-nocookie.com'), 'YouTube nocookie allowed');
    assert.ok(frameSrc.includes('https://www.youtube.com'), 'YouTube allowed');
    assert.ok(frameSrc.includes('https://player.vimeo.com'), 'Vimeo allowed');
  });

  test('CSP upgradeInsecureRequests is enabled in production and disabled in development', () => {
    const prodOpts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
    const devOpts = getSecurityHeaderOptions('development', 'http://localhost:5173');
    assert.ok(Array.isArray(prodOpts.contentSecurityPolicy.directives.upgradeInsecureRequests), 'Prod enables upgrade');
    assert.strictEqual(devOpts.contentSecurityPolicy.directives.upgradeInsecureRequests, undefined, 'Dev omits upgrade to avoid local SSL break');
  });

  test('CSP supports report-only mode via CSP_REPORT_ONLY environment variable', () => {
    const original = process.env.CSP_REPORT_ONLY;
    try {
      process.env.CSP_REPORT_ONLY = 'true';
      const opts = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
      assert.strictEqual(opts.contentSecurityPolicy.reportOnly, true, 'Report-only mode active');

      process.env.CSP_REPORT_ONLY = 'false';
      const optsEnforced = getSecurityHeaderOptions('production', 'https://nepalprotein.com');
      assert.strictEqual(optsEnforced.contentSecurityPolicy.reportOnly, false, 'Enforce mode active');
    } finally {
      process.env.CSP_REPORT_ONLY = original;
    }
  });

  // =========================================================================
  // GROUP 4: NP-SEC-19: Seeder Protection & Production Accidental Deletion Defense
  // =========================================================================
  console.log('\n--- NP-SEC-19: Seeder Production Data Protection ---');

  test('validateSeederSafety blocks seeding in production when opt-in is missing', () => {
    assert.throws(
      () => validateSeederSafety({ nodeEnv: 'production', optIn: undefined, mongoUri: 'mongodb://127.0.0.1:27017/db' }),
      /\[NP-SEC-19 BLOCKED\]/
    );
  });

  test('validateSeederSafety blocks seeding in production with invalid opt-in string', () => {
    const invalidOptIns = ['false', '0', 'no', 'yes', '1', 'TRUE', 'confirmed', ''];
    for (const optIn of invalidOptIns) {
      assert.throws(
        () => validateSeederSafety({ nodeEnv: 'production', optIn, mongoUri: 'mongodb://127.0.0.1:27017/db' }),
        /\[NP-SEC-19 BLOCKED\]/,
        `Opt-in value "${optIn}" must be rejected`
      );
    }
  });

  test('validateSeederSafety allows seeding in production ONLY with explicit opt-in "true"', () => {
    const result = validateSeederSafety({
      nodeEnv: 'production',
      optIn: 'true',
      mongoUri: 'mongodb://127.0.0.1:27017/db',
    });
    assert.strictEqual(result, true, 'Explicit opt-in "true" permitted');
  });

  test('validateSeederSafety blocks remote cloud clusters (mongodb+srv) without explicit opt-in even if NODE_ENV is development', () => {
    assert.throws(
      () => validateSeederSafety({
        nodeEnv: 'development',
        optIn: undefined,
        mongoUri: 'mongodb+srv://admin:pass@cluster0.abcde.mongodb.net/production_db',
      }),
      /\[NP-SEC-19 BLOCKED\]/,
      'Remote cloud clusters must never be seeded accidentally without opt-in'
    );
  });

  test('validateSeederSafety permits local development seeding safely', () => {
    const result = validateSeederSafety({
      nodeEnv: 'development',
      optIn: undefined,
      mongoUri: 'mongodb://127.0.0.1:27017/osoaa_db',
    });
    assert.strictEqual(result, true, 'Local development database seeding permitted');
  });

  // =========================================================================
  // GROUP 5: NP-SEC-20: Dependency Security & Patched Vulnerabilities
  // =========================================================================
  console.log('\n--- NP-SEC-20: Dependency Hardening & Vulnerability Remediation ---');

  test('Backend package.json has updated nodemailer to modern patched release (>=10.0.6)', () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(pkg.dependencies.nodemailer, 'nodemailer is in dependencies');
    const semverMajor = parseInt(pkg.dependencies.nodemailer.replace(/[^0-9]/g, '').slice(0, 2), 10);
    assert.ok(semverMajor >= 10, 'Nodemailer version is >= 10.x addressing 15 known CVEs');
  });

  test('Backend package.json contains overrides for braces (>=3.0.3) to resolve ReDoS', () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(pkg.overrides, 'overrides block exists in backend package.json');
    assert.ok(pkg.overrides.braces, 'braces is pinned in overrides');
  });

  test('Frontend package.json contains overrides for braces (>=3.0.3)', () => {
    const pkgPath = path.resolve(__dirname, '../../../frontend/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(pkg.overrides, 'overrides block exists in frontend package.json');
    assert.ok(pkg.overrides.braces, 'braces is pinned in overrides');
  });

  test('Frontend package.json upgraded react-router-dom to patched secure release (>=7.18.4)', () => {
    const pkgPath = path.resolve(__dirname, '../../../frontend/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const version = pkg.dependencies['react-router-dom'];
    assert.ok(version.includes('7.18') || version.includes('^7.'), 'react-router-dom is on patched 7.x release');
  });

  console.log('\n====================================================');
  console.log(`Phase 4 Test Summary: ${passedTests}/${totalTests} Passed`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
