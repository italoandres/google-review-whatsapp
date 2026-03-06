import fc from 'fast-check';
import { WebhookHandler, WebhookPayload, WebhookPrettyPrinter } from './webhookHandler';

// Mock Supabase first
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock dependencies
jest.mock('../models/webhookLog');
jest.mock('../models/whatsappInstance');
jest.mock('../models/connectionHistory');

/**
 * Custom generator for webhook event payloads
 */
function webhookPayloadGenerator(): fc.Arbitrary<WebhookPayload> {
  return fc.record({
    event: fc.constantFrom('connection.update', 'messages.upsert', 'custom.event'),
    instance: fc.string({ minLength: 5, maxLength: 50 }),
    data: fc.record({
      key: fc.option(fc.record({
        remoteJid: fc.string({ minLength: 5, maxLength: 50 }),
        fromMe: fc.boolean(),
      })),
      pushName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      message: fc.option(fc.object()),
      state: fc.option(fc.constantFrom('open', 'close', 'connecting')),
    }),
    destination: fc.option(fc.string()),
    date_time: fc.option(fc.date().map(d => d.toISOString())),
    sender: fc.option(fc.string()),
    server_url: fc.option(fc.webUrl()),
    apikey: fc.option(fc.string()),
  });
}

describe('WebhookHandler Property Tests', () => {
  let handler: WebhookHandler;
  
  beforeEach(() => {
    handler = new WebhookHandler();
  });
  
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 21: Webhook Event Parsing Round-Trip
   * 
   * **Validates: Requirements 20.6**
   * 
   * For any valid webhook event, parsing the JSON and then serializing it back
   * should produce an equivalent structure.
   */
  describe('Property 21: Webhook Event Parsing Round-Trip', () => {
    it('should preserve structure when parsing and serializing webhook events', () => {
      fc.assert(
        fc.property(
          webhookPayloadGenerator(),
          (originalPayload) => {
            // Serialize to JSON
            const jsonString = JSON.stringify(originalPayload);
            
            // Parse back
            const parsed = handler.parseEvent(jsonString);
            
            // Serialize again
            const reSerialized = JSON.parse(JSON.stringify(parsed));
            
            // Normalize both for comparison (JSON.stringify converts undefined to null)
            const normalizedOriginal = JSON.parse(JSON.stringify(originalPayload));
            
            // Should be equivalent to original (after normalization)
            expect(reSerialized).toEqual(normalizedOriginal);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should handle edge cases in round-trip parsing', () => {
      fc.assert(
        fc.property(
          webhookPayloadGenerator(),
          (payload) => {
            const jsonString = JSON.stringify(payload);
            
            // Should not throw
            expect(() => handler.parseEvent(jsonString)).not.toThrow();
            
            // Parsed result should have required fields
            const parsed = handler.parseEvent(jsonString);
            expect(parsed.event).toBeDefined();
            expect(parsed.instance).toBeDefined();
            expect(parsed.data).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should maintain data types through round-trip', () => {
      fc.assert(
        fc.property(
          webhookPayloadGenerator(),
          (payload) => {
            const jsonString = JSON.stringify(payload);
            const parsed = handler.parseEvent(jsonString);
            
            // Check types are preserved
            expect(typeof parsed.event).toBe('string');
            expect(typeof parsed.instance).toBe('string');
            expect(typeof parsed.data).toBe('object');
            
            if (parsed.data.key) {
              expect(typeof parsed.data.key).toBe('object');
              if (parsed.data.key.fromMe !== undefined) {
                expect(typeof parsed.data.key.fromMe).toBe('boolean');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('WebhookPrettyPrinter Property Tests', () => {
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 31: Pretty Printer Structure Preservation
   * 
   * **Validates: Requirements 21.6**
   * 
   * For any webhook event, formatting with pretty printer and then parsing
   * should preserve the original structure (after accounting for redactions).
   */
  describe('Property 31: Pretty Printer Structure Preservation', () => {
    it('should preserve non-sensitive structure when formatting', () => {
      fc.assert(
        fc.property(
          fc.record({
            event: fc.string({ minLength: 1, maxLength: 50 }),
            instance: fc.string({ minLength: 1, maxLength: 50 }),
            data: fc.record({
              message: fc.option(fc.string()),
              state: fc.option(fc.string()),
            }),
          }),
          (payload) => {
            const formatted = WebhookPrettyPrinter.format(payload as WebhookPayload);
            
            // Should be valid JSON (unless truncated)
            if (!formatted.includes('[truncated]')) {
              const parsed = JSON.parse(formatted);
              
              // Non-sensitive fields should be preserved
              expect(parsed.event).toBe(payload.event);
              expect(parsed.instance).toBe(payload.instance);
              expect(parsed.data.message).toBe(payload.data.message);
              expect(parsed.data.state).toBe(payload.data.state);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 32: Pretty Printer Sensitive Data Omission
   * 
   * **Validates: Requirements 21.3**
   * 
   * For any webhook event containing sensitive fields (tokens, keys, passwords),
   * the pretty printer should omit these fields from the output.
   */
  describe('Property 32: Pretty Printer Sensitive Data Omission', () => {
    it('should redact all sensitive fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            event: fc.string({ maxLength: 20 }),
            instance: fc.string({ maxLength: 20 }),
            data: fc.record({
              message: fc.string({ maxLength: 50 }),
            }),
            apikey: fc.string({ minLength: 10, maxLength: 30 }).filter(s => s.trim().length >= 10),
            token: fc.string({ minLength: 10, maxLength: 30 }).filter(s => s.trim().length >= 10),
          }),
          (payload) => {
            const formatted = WebhookPrettyPrinter.format(payload as any);
            
            // Sensitive values should not appear in output
            const trimmedApikey = payload.apikey.trim();
            const trimmedToken = payload.token.trim();
            
            if (trimmedApikey.length > 0) {
              expect(formatted).not.toContain(trimmedApikey);
            }
            if (trimmedToken.length > 0) {
              expect(formatted).not.toContain(trimmedToken);
            }
            
            // Should contain redaction marker (unless truncated before it)
            // Check if the sensitive fields are in the output at all
            if (formatted.includes('"apikey"') || formatted.includes('"token"')) {
              expect(formatted).toContain('[REDACTED]');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should redact nested sensitive fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            event: fc.string(),
            instance: fc.string(),
            data: fc.record({
              userToken: fc.string({ minLength: 10 }).filter(s => s.trim().length >= 10),
              apiKey: fc.string({ minLength: 10 }).filter(s => s.trim().length >= 10),
              message: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            }),
          }),
          (payload) => {
            const formatted = WebhookPrettyPrinter.format(payload as any);
            
            // Sensitive nested values should not appear
            const trimmedToken = payload.data.userToken.trim();
            const trimmedKey = payload.data.apiKey.trim();
            
            if (trimmedToken.length > 0) {
              expect(formatted).not.toContain(trimmedToken);
            }
            if (trimmedKey.length > 0) {
              expect(formatted).not.toContain(trimmedKey);
            }
            
            // Non-sensitive data should be preserved (check in JSON, not raw string due to escaping)
            const parsed = JSON.parse(formatted.replace(/\[truncated\]$/, ''));
            expect(parsed.data.message).toBe(payload.data.message);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should handle various sensitive field name patterns', () => {
      const sensitiveFieldNames = [
        'apikey', 'token', 'key', 'password', 'secret', 
        'authorization', 'auth', 'apiKey', 'accessToken',
        'userPassword', 'secretKey'
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...sensitiveFieldNames),
          fc.string({ minLength: 10 }),
          (fieldName, secretValue) => {
            const payload: any = {
              event: 'test',
              instance: 'test-instance',
              data: {},
            };
            payload[fieldName] = secretValue;
            
            const formatted = WebhookPrettyPrinter.format(payload);
            
            // Secret value should not appear
            expect(formatted).not.toContain(secretValue);
            expect(formatted).toContain('[REDACTED]');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  /**
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 33: Pretty Printer Payload Truncation
   * 
   * **Validates: Requirements 21.5**
   * 
   * For any webhook payload larger than 1KB, the pretty printer should
   * truncate it with an indicator.
   */
  describe('Property 33: Pretty Printer Payload Truncation', () => {
    it('should truncate large payloads', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1500, max: 5000 }),
          (size) => {
            const largeData = 'x'.repeat(size);
            const payload: WebhookPayload = {
              event: 'test.event',
              instance: 'test-instance',
              data: { large: largeData },
            };
            
            const formatted = WebhookPrettyPrinter.format(payload);
            
            // Should be truncated
            expect(formatted.length).toBeLessThanOrEqual(1024 + 50); // 1KB + some margin for truncation message
            expect(formatted).toContain('[truncated]');
          }
        ),
        { numRuns: 50 } // Fewer runs for performance
      );
    });
    
    it('should not truncate small payloads', () => {
      fc.assert(
        fc.property(
          fc.record({
            event: fc.string({ minLength: 1, maxLength: 20 }),
            instance: fc.string({ minLength: 1, maxLength: 20 }),
            data: fc.record({
              message: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          (payload) => {
            const formatted = WebhookPrettyPrinter.format(payload as WebhookPayload);
            
            // Small payloads should not be truncated
            expect(formatted).not.toContain('[truncated]');
            
            // Should be valid JSON
            expect(() => JSON.parse(formatted)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should always include truncation indicator for large payloads', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2000, max: 10000 }),
          (size) => {
            const payload: WebhookPayload = {
              event: 'test',
              instance: 'test',
              data: { content: 'x'.repeat(size) },
            };
            
            const formatted = WebhookPrettyPrinter.format(payload);
            
            // If truncated, must have indicator
            if (formatted.length <= 1074) { // 1KB + truncation message
              expect(formatted).toContain('[truncated]');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
