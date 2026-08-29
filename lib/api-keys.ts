import crypto from 'crypto';

/**
 * Generate a secure API key
 * Format: wis_live_<32 random hex chars>
 * Returns both the plaintext key (shown once to user) and hashed version (stored in DB)
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32);
  const key = `wis_live_${randomBytes.toString('hex')}`;
  const hash = hashApiKey(key);
  const prefix = key.substring(0, 16); // wis_live_xxxxxx for identification

  return { key, hash, prefix };
}

/**
 * Hash an API key using SHA-256
 * Only hashes are stored in the database
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^wis_live_[a-f0-9]{64}$/.test(key);
}

/**
 * Extract prefix from API key for logging/display
 */
export function getApiKeyPrefix(key: string): string {
  return key.substring(0, 16);
}
