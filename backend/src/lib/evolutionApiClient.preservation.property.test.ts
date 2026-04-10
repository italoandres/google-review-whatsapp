/**
 * Preservation Property Tests
 * Feature: qr-code-not-available-fix
 * 
 * **Property 2: Preservation** - Valid QR Code Flow Unchanged
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests observe behavior on UNFIXED code for valid QR code responses
 * They must PASS on unfixed code to establish baseline behavior to preserve
 * 
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { EvolutionAPIClient } from './evolutionApiClient';
import * as fc from 'fast-check';

// Mock fetch globally
global.fetch = jest.fn();

describe('Preservation Property Tests: Valid QR Code Flow', () => {
  let client: EvolutionAPIClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set required environment variables
    process.env.EVOLUTION_API_URL = 'https://api.example.com';
    process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    process.env.BACKEND_URL = 'https://backend.example.com';
    process.env.WEBHOOK_SECRET = 'test-secret';
    
    client = new EvolutionAPIClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property: For all responses with valid base64 field, getQRCode returns the base64 string
   * 
   * This property tests that when Evolution API returns a valid QR code with base64 data,
   * the system correctly extracts and returns it. This behavior must be preserved after the fix.
   */
  it('should return base64 string for all valid responses with base64 field', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid base64 strings (non-empty, non-null)
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (validBase64) => {
          const mockFetch = global.fetch as jest.Mock;
          mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ base64: validBase64 }),
          });

          const result = await client.getQRCode('test-instance');
          
          // Property: Result should equal the base64 string from response
          expect(result).toBe(validBase64);
        }
      ),
      { numRuns: 50 } // Run 50 test cases for strong guarantees
    );
  });

  /**
   * Property: For all responses with valid qrcode.base64 field, getQRCode returns the base64 string
   * 
   * This property tests the alternative response format where base64 is nested under qrcode object.
   * This behavior must be preserved after the fix.
   */
  it('should return base64 string for all valid responses with qrcode.base64 field', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid base64 strings (non-empty, non-null)
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (validBase64) => {
          const mockFetch = global.fetch as jest.Mock;
          mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ qrcode: { base64: validBase64 } }),
          });

          const result = await client.getQRCode('test-instance');
          
          // Property: Result should equal the base64 string from response
          expect(result).toBe(validBase64);
        }
      ),
      { numRuns: 50 } // Run 50 test cases for strong guarantees
    );
  });

  /**
   * Property: For all responses with both base64 and qrcode.base64, getQRCode prefers base64
   * 
   * This property tests the precedence when both formats are present.
   * The current implementation uses `data.base64 || data.qrcode?.base64`, so base64 takes precedence.
   * This behavior must be preserved after the fix.
   */
  it('should prefer base64 over qrcode.base64 when both are present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (base64Value, qrcodeBase64Value) => {
          const mockFetch = global.fetch as jest.Mock;
          mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
              base64: base64Value,
              qrcode: { base64: qrcodeBase64Value },
            }),
          });

          const result = await client.getQRCode('test-instance');
          
          // Property: Result should equal base64 (not qrcode.base64)
          expect(result).toBe(base64Value);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: For all valid instance names, getQRCode calls correct endpoint
   * 
   * This property tests that the endpoint construction is correct for any valid instance name.
   * This behavior must be preserved after the fix.
   */
  it('should call correct endpoint for all valid instance names', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid instance names (alphanumeric with hyphens and underscores)
        fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/),
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (instanceName, validBase64) => {
          const mockFetch = global.fetch as jest.Mock;
          mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ base64: validBase64 }),
          });

          await client.getQRCode(instanceName);
          
          // Property: Should call correct endpoint with instance name
          expect(mockFetch).toHaveBeenCalledWith(
            `https://api.example.com/instance/connect/${instanceName}`,
            expect.any(Object)
          );
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: For all valid responses, getQRCode includes correct headers
   * 
   * This property tests that authentication headers are always included.
   * This behavior must be preserved after the fix.
   */
  it('should include apikey header for all requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (validBase64) => {
          const mockFetch = global.fetch as jest.Mock;
          mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ base64: validBase64 }),
          });

          await client.getQRCode('test-instance');
          
          // Property: Should include apikey header
          expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: expect.objectContaining({
                'apikey': 'test-global-key',
              }),
            })
          );
        }
      ),
      { numRuns: 30 }
    );
  });
});
