/**
 * Security utilities for input sanitization, regex escaping, buffer validation, and PII masking.
 */

/**
 * NP-SEC-07: Escape all user-controlled values inserted into HTML emails and templates
 */
export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * NP-SEC-10: Escape untrusted search strings before passing into RegExp or $regex queries
 * Prevents ReDoS and syntax errors from characters like .*+?^${}()|[]\
 */
export const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * NP-SEC-08: Validate image buffer magic numbers (signatures)
 * Strictly allows JPEG, PNG, and WebP only. Disallows SVG, executable code, scripts, etc.
 */
export const isValidImageBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 3) {
    return false;
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A (needs at least 8 bytes)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WebP: RIFF at 0..3 and WEBP at 8..11 (needs at least 12 bytes)
  if (buffer.length >= 12) {
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    if (isRiff && isWebp) {
      return true;
    }
  }

  return false;
};

/**
 * NP-SEC-12: Mask customer full name (e.g. "Ram Bahadur Shrestha" -> "R*m B*****r S******a")
 */
export const maskName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return part;
      if (part.length === 2) return part[0] + '*';
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    })
    .join(' ');
};

/**
 * NP-SEC-12: Mask phone number (e.g. "9801234567" -> "980*****67")
 */
export const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  if (clean.length < 7) return clean.slice(0, 1) + '*'.repeat(clean.length - 2) + clean.slice(-1);
  return clean.slice(0, 3) + '*'.repeat(clean.length - 5) + clean.slice(-2);
};

/**
 * NP-SEC-17: Mask email address for safe diagnostic logging (e.g. "customer@osoaa.com" -> "c******r@osoaa.com")
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const clean = email.trim();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 0) return '****';

  const user = clean.slice(0, atIdx);
  const domain = clean.slice(atIdx + 1);

  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}${'*'.repeat(Math.max(user.length - 2, 2))}${user[user.length - 1]}@${domain}`;
};

/**
 * NP-SEC-17: Redact sensitive secrets (OTPs, passwords, tokens, reset links, JWTs) from diagnostic strings
 */
export const redactSensitiveData = (text) => {
  if (text === null || text === undefined) return '';
  let str = String(text);

  // Redact JWT tokens
  str = str.replace(/\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, '[REDACTED_JWT]');

  // Redact 6-digit numeric OTP codes
  str = str.replace(/\b\d{6}\b/g, '[REDACTED_OTP]');

  // Redact key-value secrets in JSON / query / headers
  str = str.replace(
    /("(?:password|newPassword|otp|token|secret|rawOtp|mpin)"\s*:\s*)"([^"]+)"/gi,
    '$1"[REDACTED]"'
  );

  // Redact reset links with query tokens
  str = str.replace(/([?&](?:token|code|otp)=)[^&\s"']+/gi, '$1[REDACTED]');

  return str;
};
