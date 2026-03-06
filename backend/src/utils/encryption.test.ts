import { encryptApiKey, decryptApiKey } from './encryption';
import crypto from 'crypto';

describe('Encryption Utilities', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  
  beforeAll(() => {
    // Set a test encryption key (32 bytes = 64 hex characters)
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  });
  
  afterAll(() => {
    // Restore original environment
    process.env.ENCRYPTION_KEY = originalEnv;
  });
  
  describe('encryptApiKey', () => {
    it('should encrypt an API key', () => {
      const apiKey = 'test-api-key-12345';
      const encrypted = encryptApiKey(apiKey);
      
      // Should return a string with IV and encrypted data separated by colon
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
      
      // Should not contain the original API key
      expect(encrypted).not.toContain(apiKey);
    });
    
    it('should produce different encrypted values for the same input (due to random IV)', () => {
      const apiKey = 'test-api-key-12345';
      const encrypted1 = encryptApiKey(apiKey);
      const encrypted2 = encryptApiKey(apiKey);
      
      // Different IVs should produce different encrypted values
      expect(encrypted1).not.toBe(encrypted2);
    });
    
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const tempKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => encryptApiKey('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
      
      process.env.ENCRYPTION_KEY = tempKey;
    });
    
    it('should throw error if ENCRYPTION_KEY is invalid length', () => {
      const tempKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'short-key';
      
      expect(() => encryptApiKey('test')).toThrow('ENCRYPTION_KEY must be a 64-character hex string');
      
      process.env.ENCRYPTION_KEY = tempKey;
    });
  });
  
  describe('decryptApiKey', () => {
    it('should decrypt an encrypted API key', () => {
      const apiKey = 'test-api-key-12345';
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toBe(apiKey);
    });
    
    it('should handle special characters in API key', () => {
      const apiKey = 'test-key-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toBe(apiKey);
    });
    
    it('should handle long API keys', () => {
      const apiKey = 'a'.repeat(200);
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toBe(apiKey);
    });
    
    it('should throw error for invalid encrypted data format', () => {
      expect(() => decryptApiKey('invalid-format')).toThrow('Invalid encrypted data format');
    });
    
    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const tempKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => decryptApiKey('abc:def')).toThrow('ENCRYPTION_KEY environment variable is not set');
      
      process.env.ENCRYPTION_KEY = tempKey;
    });
  });
  
  describe('Round-trip encryption', () => {
    it('should successfully encrypt and decrypt various API keys', () => {
      const testKeys = [
        'simple-key',
        'key-with-numbers-123456',
        'key_with_underscores',
        'key-with-special-chars-!@#$%',
        'very-long-key-' + 'x'.repeat(100),
        'short',
        '',
      ];
      
      testKeys.forEach(apiKey => {
        const encrypted = encryptApiKey(apiKey);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(apiKey);
      });
    });
  });
});
