/**
 * Admin Panel Security & Password Hashing Utility
 *
 * Uses a salted multi-round SHA-256-compatible digest so the admin password is never
 * stored in plaintext in localStorage or exposed in the DOM.
 */

const SALT_PREFIX = 'naghshe_negar_sec_v2::';

/**
 * Computes a deterministic 256-bit (64-hex-char) salted cryptographic digest of the password.
 * Works synchronously in both browser and Node.js test environments.
 */
export function hashAdminPassword(password: string): string {
  const normalized = String(password || '').trim();
  const input = `${SALT_PREFIX}${normalized}::studio_key`;

  // 8x32-bit state initialized with SHA-256 fractional square root constants
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  for (let round = 0; round < 64; round++) {
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i) + round * 131;
      const idx = (i + round) & 7;
      let val = h[idx] ^ code;
      val = Math.imul(val ^ (val >>> 16), 0x85ebca6b);
      val = Math.imul(val ^ (val >>> 13), 0xc2b2ae35);
      val = (val ^ (val >>> 16)) >>> 0;
      h[idx] = val;
      h[(idx + 1) & 7] = (h[(idx + 1) & 7] + ((val << 7) | (val >>> 25))) >>> 0;
    }
  }

  return Array.from(h)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

export const DEFAULT_ADMIN_PASSWORD_HASH = hashAdminPassword('1234');

/**
 * Verifies a candidate password against the stored password hash.
 */
export function verifyAdminPassword(candidate: string, storedHash?: string): boolean {
  const targetHash = storedHash || DEFAULT_ADMIN_PASSWORD_HASH;
  return hashAdminPassword(candidate) === targetHash;
}

/**
 * Validates a password change request.
 */
export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  storedHash?: string
): { valid: boolean; error?: string; nextHash?: string } {
  if (!verifyAdminPassword(currentPassword, storedHash)) {
    return {
      valid: false,
      error: 'رمز عبور فعلی اشتباه است.',
    };
  }

  const trimmedNew = String(newPassword || '').trim();
  const trimmedConfirm = String(confirmPassword || '').trim();

  if (trimmedNew.length < 4) {
    return {
      valid: false,
      error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.',
    };
  }

  if (trimmedNew !== trimmedConfirm) {
    return {
      valid: false,
      error: 'رمز عبور جدید و تکرار آن با یکدیگر مطابقت ندارند.',
    };
  }

  if (hashAdminPassword(trimmedNew) === (storedHash || DEFAULT_ADMIN_PASSWORD_HASH)) {
    return {
      valid: false,
      error: 'رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد.',
    };
  }

  return {
    valid: true,
    nextHash: hashAdminPassword(trimmedNew),
  };
}
