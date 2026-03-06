import fc from 'fast-check';
import { encryptApiKey, decryptApiKey } from './encryption';
import crypto from 'crypto';

/**
 * Property-Based Tests for Encryption Module
 * Feature: whatsapp-multi-tenant-auto-instance
 */

describe('Property Tests - Encryption', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  
  beforeAll(() => {
    // Set a test encryption key (32 bytes = 64 hex characters)
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  });
  
  afterAll(() => {
    // Restore original environment
    process.env.ENCRYPTION_KEY = originalEnv;
  });
  
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 24: Credential Encryption Round-Trip
   * 
   * **Validates: Requirements 10.5**
   * 
   * For any sensitive credential, encrypting and then decrypting
   * should produce the original value.
   */
  it('Property 24: should decrypt to original value after encryption (round-trip)', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary strings as API keys
        fc.string({ minLength: 0, maxLength: 500 }),
        (apiKey) => {
          const encrypted = encryptApiKey(apiKey);
          const decrypted = decryptApiKey(encrypted);
          
          // Round-trip property: decrypt(encrypt(x)) === x
          expect(decrypted).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Encryption should produce different outputs
   * for the same input (due to random IV)
   */
  it('should produce different encrypted values for same input (non-deterministic)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (apiKey) => {
          const encrypted1 = encryptApiKey(apiKey);
          const encrypted2 = encryptApiKey(apiKey);
          
          // Different IVs should produce different ciphertexts
          expect(encrypted1).not.toBe(encrypted2);
          
          // But both should decrypt to the same value
          expect(decryptApiKey(encrypted1)).toBe(apiKey);
          expect(decryptApiKey(encrypted2)).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Encrypted output should have correct format
   */
  it('should always produce valid format (iv:encryptedData)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (apiKey) => {
          const encrypted = encryptApiKey(apiKey);
          
          // Should match format: hexstring:hexstring
          expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
          
          // Should have exactly one colon separator
          const parts = encrypted.split(':');
          expect(parts).toHaveLength(2);
          
          // IV should be 32 hex characters (16 bytes)
          expect(parts[0]).toHaveLength(32);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Encrypted data should not contain original plaintext
   */
  it('should not contain plaintext in encrypted output', () => {
    fc.assert(
      fc.property(
        // Only test with non-empty strings that are long enough to be meaningful
        fc.string({ minLength: 5, maxLength: 100 }),
        (apiKey) => {
          const encrypted = encryptApiKey(apiKey);
          
          // Encrypted output should not contain the original API key
          expect(encrypted.toLowerCase()).not.toContain(apiKey.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Encryption should handle special characters
   */
  it('should handle strings with special characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (apiKey) => {
          const encrypted = encryptApiKey(apiKey);
          const decrypted = decryptApiKey(encrypted);
          
          expect(decrypted).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Encryption should handle unicode characters
   */
  it('should handle unicode characters correctly', () => {
    fc.assert(
      fc.property(
        fc.unicodeString({ minLength: 0, maxLength: 200 }),
        (apiKey) => {
          const encrypted = encryptApiKey(apiKey);
          const decrypted = decryptApiKey(encrypted);
          
          expect(decrypted).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });
});
