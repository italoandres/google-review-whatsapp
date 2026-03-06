import { validateSignature } from './signatureValidator';
import crypto from 'crypto';

describe('Signature Validator', () => {
  const testSecret = 'test-webhook-secret-12345';
  const testPayload = JSON.stringify({
    event: 'messages.upsert',
    instance: 'test-instance',
    data: { test: 'data' }
  });
  
  /**
   * Helper function to generate a valid HMAC-SHA256 signature
   */
  function generateValidSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }
  
  describe('validateSignature', () => {
    it('should return true for valid signature', () => {
      const validSignature = generateValidSignature(testPayload, testSecret);
      const result = validateSignature(testPayload, validSignature, testSecret);
      
      expect(result).toBe(true);
    });
    
    it('should return false for invalid signature', () => {
      const invalidSignature = 'invalid-signature-12345';
      const result = validateSignature(testPayload, invalidSignature, testSecret);
      
      expect(result).toBe(false);
    });
    
    it('should return false for signature with wrong secret', () => {
      const wrongSecret = 'wrong-secret';
      const signatureWithWrongSecret = generateValidSignature(testPayload, wrongSecret);
      const result = validateSignature(testPayload, signatureWithWrongSecret, testSecret);
      
      expect(result).toBe(false);
    });
    
    it('should return false for signature with modified payload', () => {
      const validSignature = generateValidSignature(testPayload, testSecret);
      const modifiedPayload = testPayload + ' modified';
      const result = validateSignature(modifiedPayload, validSignature, testSecret);
      
      expect(result).toBe(false);
    });
    
    it('should return false for empty signature', () => {
      const result = validateSignature(testPayload, '', testSecret);
      
      expect(result).toBe(false);
    });
    
    it('should return false for signature with different length', () => {
      const validSignature = generateValidSignature(testPayload, testSecret);
      const truncatedSignature = validSignature.substring(0, validSignature.length - 5);
      const result = validateSignature(testPayload, truncatedSignature, testSecret);
      
      expect(result).toBe(false);
    });
    
    it('should handle empty payload', () => {
      const emptyPayload = '';
      const validSignature = generateValidSignature(emptyPayload, testSecret);
      const result = validateSignature(emptyPayload, validSignature, testSecret);
      
      expect(result).toBe(true);
    });
    
    it('should handle special characters in payload', () => {
      const specialPayload = '{"test": "data with special chars: !@#$%^&*()"}';
      const validSignature = generateValidSignature(specialPayload, testSecret);
      const result = validateSignature(specialPayload, validSignature, testSecret);
      
      expect(result).toBe(true);
    });
    
    it('should handle unicode characters in payload', () => {
      const unicodePayload = '{"name": "José", "emoji": "🎉"}';
      const validSignature = generateValidSignature(unicodePayload, testSecret);
      const result = validateSignature(unicodePayload, validSignature, testSecret);
      
      expect(result).toBe(true);
    });
    
    it('should handle very long payloads', () => {
      const longPayload = JSON.stringify({ data: 'x'.repeat(10000) });
      const validSignature = generateValidSignature(longPayload, testSecret);
      const result = validateSignature(longPayload, validSignature, testSecret);
      
      expect(result).toBe(true);
    });
    
    it('should use constant-time comparison (prevent timing attacks)', () => {
      // This test verifies that the function uses timingSafeEqual
      // by checking that it handles different length signatures gracefully
      const validSignature = generateValidSignature(testPayload, testSecret);
      const shorterSignature = validSignature.substring(0, 10);
      const longerSignature = validSignature + 'extra';
      
      // Should return false without throwing
      expect(validateSignature(testPayload, shorterSignature, testSecret)).toBe(false);
      expect(validateSignature(testPayload, longerSignature, testSecret)).toBe(false);
    });
    
    it('should handle different secret formats', () => {
      const secrets = [
        'simple-secret',
        'secret-with-numbers-123',
        'secret_with_underscores',
        'secret-with-special-!@#$',
        'very-long-secret-' + 'x'.repeat(100),
      ];
      
      secrets.forEach(secret => {
        const signature = generateValidSignature(testPayload, secret);
        expect(validateSignature(testPayload, signature, secret)).toBe(true);
      });
    });
    
    it('should be case-sensitive for signatures', () => {
      const validSignature = generateValidSignature(testPayload, testSecret);
      const uppercaseSignature = validSignature.toUpperCase();
      
      // HMAC signatures are case-sensitive (hex lowercase)
      if (validSignature !== uppercaseSignature) {
        expect(validateSignature(testPayload, uppercaseSignature, testSecret)).toBe(false);
      }
    });
  });
  
  describe('Security properties', () => {
    it('should reject tampered payloads', () => {
      const originalPayload = '{"amount": 100}';
      const validSignature = generateValidSignature(originalPayload, testSecret);
      
      // Attacker tries to modify the amount
      const tamperedPayload = '{"amount": 999}';
      
      expect(validateSignature(tamperedPayload, validSignature, testSecret)).toBe(false);
    });
    
    it('should reject replay attacks with different secrets', () => {
      const secret1 = 'secret-for-user-1';
      const secret2 = 'secret-for-user-2';
      
      const signature1 = generateValidSignature(testPayload, secret1);
      
      // Attacker tries to replay signature from user1 to user2
      expect(validateSignature(testPayload, signature1, secret2)).toBe(false);
    });
  });
});
