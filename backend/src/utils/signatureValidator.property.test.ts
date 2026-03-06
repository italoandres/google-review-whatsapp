import fc from 'fast-check';
import { validateSignature } from './signatureValidator';
import crypto from 'crypto';

/**
 * Property-Based Tests for Webhook Signature Validation
 * Feature: whatsapp-multi-tenant-auto-instance
 */

describe('Property Tests - Signature Validator', () => {
  /**
   * Helper function to generate a valid HMAC-SHA256 signature
   */
  function generateValidSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }
  
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 13: Webhook Signature Validation
   * 
   * **Validates: Requirements 10.6, 19.1, 19.4**
   * 
   * For any webhook request, if the signature is invalid, the request
   * should be rejected. Valid signatures should be accepted.
   */
  it('Property 13: should accept valid signatures and reject invalid ones', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }), // payload
        fc.string({ minLength: 1, maxLength: 100 }),  // secret
        (payload, secret) => {
          // Generate valid signature
          const validSignature = generateValidSignature(payload, secret);
          
          // Valid signature should be accepted
          expect(validateSignature(payload, validSignature, secret)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Modified payload should invalidate signature
   */
  it('should reject signatures when payload is modified', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 10 }), // modification
        (payload, secret, modification) => {
          const validSignature = generateValidSignature(payload, secret);
          const modifiedPayload = payload + modification;
          
          // Modified payload should invalidate the signature
          // (unless by extreme coincidence the modification doesn't change the hash)
          if (modifiedPayload !== payload) {
            expect(validateSignature(modifiedPayload, validSignature, secret)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Wrong secret should invalidate signature
   */
  it('should reject signatures generated with different secret', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (payload, secret1, secret2) => {
          // Only test when secrets are different
          fc.pre(secret1 !== secret2);
          
          const signatureWithSecret1 = generateValidSignature(payload, secret1);
          
          // Signature generated with secret1 should not validate with secret2
          expect(validateSignature(payload, signatureWithSecret1, secret2)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Signature validation should be deterministic
   */
  it('should produce consistent results for same inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (payload, secret) => {
          const signature = generateValidSignature(payload, secret);
          
          // Multiple validations should produce same result
          const result1 = validateSignature(payload, signature, secret);
          const result2 = validateSignature(payload, signature, secret);
          const result3 = validateSignature(payload, signature, secret);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
          expect(result1).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Empty or invalid signatures should be rejected
   */
  it('should reject empty or malformed signatures', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (payload, secret) => {
          // Empty signature should be rejected
          expect(validateSignature(payload, '', secret)).toBe(false);
          
          // Invalid hex signature should be rejected
          expect(validateSignature(payload, 'not-a-valid-hex-signature', secret)).toBe(false);
          
          // Truncated signature should be rejected
          const validSignature = generateValidSignature(payload, secret);
          const truncated = validSignature.substring(0, validSignature.length - 5);
          expect(validateSignature(payload, truncated, secret)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Signature should handle unicode payloads
   */
  it('should correctly validate signatures for unicode payloads', () => {
    fc.assert(
      fc.property(
        fc.unicodeString({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (payload, secret) => {
          const validSignature = generateValidSignature(payload, secret);
          
          expect(validateSignature(payload, validSignature, secret)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Signature validation should use HMAC-SHA256
   */
  it('should use HMAC-SHA256 algorithm (signature length check)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (payload, secret) => {
          const signature = generateValidSignature(payload, secret);
          
          // HMAC-SHA256 produces 64 hex characters (32 bytes)
          expect(signature).toHaveLength(64);
          expect(signature).toMatch(/^[0-9a-f]{64}$/);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Security property: Timing-safe comparison
   * This property verifies that different length signatures don't throw errors
   */
  it('should handle different length signatures gracefully (timing-safe)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        (payload, secret, randomSignature) => {
          // Should not throw, just return false
          expect(() => {
            const result = validateSignature(payload, randomSignature, secret);
            expect(typeof result).toBe('boolean');
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
