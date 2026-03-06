/**
 * Property-Based Tests for Evolution API Client
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Tests retry logic with exponential backoff using property-based testing.
 */

import fc from 'fast-check';
import { EvolutionAPIClient, EvolutionAPIError } from './evolutionApiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('Property Tests - Evolution API Client', () => {
  let client: EvolutionAPIClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set required environment variables
    process.env.EVOLUTION_API_URL = 'https://api.example.com';
    process.env.EVOLUTION_API_GLOBAL_KEY = 'test-key';
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
   * Feature: whatsapp-multi-tenant-auto-instance
   * Property 19: Retry with Exponential Backoff
   * 
   * **Validates: Requirements 12.5, 12.6**
   * 
   * For any failed Evolution API request, the backend should retry up to 3 times
   * with exponential backoff before returning error.
   */
  describe('Property 19: Retry with Exponential Backoff', () => {
    it('should retry up to 3 times for 5xx errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(500, 502, 503, 504), // Server errors
          fc.string({ minLength: 5, maxLength: 20 }), // Instance name
          async (statusCode, instanceName) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            // Mock fetch to always fail with server error
            const mockFetch = global.fetch as jest.Mock;
            mockFetch.mockResolvedValue({
              ok: false,
              status: statusCode,
              statusText: 'Server Error',
              json: async () => ({}),
            });

            // Attempt operation and expect it to fail
            await expect(
              client.getConnectionState(instanceName)
            ).rejects.toThrow(EvolutionAPIError);

            // Should have been called 3 times (initial + 2 retries)
            expect(mockFetch).toHaveBeenCalledTimes(3);
          }
        ),
        { numRuns: 10, timeout: 30000 } // Reduced runs and increased timeout
      );
    }, 35000);

    it('should NOT retry on 4xx client errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(400, 401, 403, 404, 422), // Client errors
          fc.string({ minLength: 5, maxLength: 20 }), // Instance name
          async (statusCode, instanceName) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            // Mock fetch to fail with client error
            const mockFetch = global.fetch as jest.Mock;
            mockFetch.mockResolvedValue({
              ok: false,
              status: statusCode,
              statusText: 'Client Error',
              json: async () => ({}),
            });

            // Attempt operation and expect it to fail
            await expect(
              client.getConnectionState(instanceName)
            ).rejects.toThrow(EvolutionAPIError);

            // Should have been called only once (no retries for 4xx)
            expect(mockFetch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should succeed on first successful response without retrying', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }), // Instance name
          async (instanceName) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            // Mock successful response
            const mockFetch = global.fetch as jest.Mock;
            mockFetch.mockResolvedValue({
              ok: true,
              status: 200,
              json: async () => ({
                instance: instanceName,
                state: 'open',
              }),
            });

            const result = await client.getConnectionState(instanceName);

            // Should succeed
            expect(result.instance).toBe(instanceName);
            expect(result.state).toBe('open');

            // Should have been called only once (no retries needed)
            expect(mockFetch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should succeed if retry eventually succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }), // Instance name
          fc.integer({ min: 1, max: 2 }), // Number of failures before success
          async (instanceName, failureCount) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();
            
            // Mock fetch to fail N times then succeed
            const mockFetch = global.fetch as jest.Mock;
            let callCount = 0;

            mockFetch.mockImplementation(() => {
              callCount++;
              if (callCount <= failureCount) {
                return Promise.resolve({
                  ok: false,
                  status: 503,
                  statusText: 'Service Unavailable',
                  json: async () => ({}),
                });
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                json: async () => ({
                  instance: instanceName,
                  state: 'open',
                }),
              });
            });

            const result = await client.getConnectionState(instanceName);

            // Should eventually succeed
            expect(result.instance).toBe(instanceName);
            expect(result.state).toBe('open');

            // Should have been called failureCount + 1 times
            expect(mockFetch).toHaveBeenCalledTimes(failureCount + 1);
          }
        ),
        { numRuns: 10, timeout: 30000 }
      );
    }, 35000);

    it('should use exponential backoff delays between retries', async () => {
      const instanceName = 'test-instance';
      const startTime = Date.now();

      // Clear mocks
      jest.clearAllMocks();

      // Mock fetch to always fail with server error
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({}),
      });

      // Attempt operation and expect it to fail
      await expect(
        client.getConnectionState(instanceName)
      ).rejects.toThrow(EvolutionAPIError);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // With exponential backoff: 1s + 2s = 3s minimum
      // (first attempt immediate, then 1s delay, then 2s delay, then fail)
      // Allow some margin for execution time
      expect(totalTime).toBeGreaterThanOrEqual(2900); // ~3 seconds
      expect(totalTime).toBeLessThan(5000); // Should not take too long

      // Should have been called 3 times
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * Property 27: API Key Header Presence
   * 
   * **Validates: Requirements 9.5**
   * 
   * For any request to Evolution API, the "apikey" header should be present
   * with the configured EVOLUTION_API_GLOBAL_KEY value.
   */
  describe('Property 27: API Key Header Presence', () => {
    it('should include apikey header in all requests', async () => {
      // Use the default test client with test-key
      const apiKey = 'test-key';
      
      // Clear mocks
      jest.clearAllMocks();

      // Mock successful response
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          instance: 'test-instance',
          state: 'open',
        }),
      });

      await client.getConnectionState('test-instance');

      // Verify apikey header was included
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[1].headers.apikey).toBe(apiKey);
    });
  });

  /**
   * Property 18: Timeout Handling
   * 
   * **Validates: Requirements 12.1, 12.2**
   * 
   * For any Evolution API request that doesn't respond within 10 seconds,
   * the backend should consider it a timeout and return appropriate error.
   */
  describe('Property 18: Timeout Handling', () => {
    it('should timeout requests that take longer than 10 seconds', async () => {
      const instanceName = 'test-instance';

      // Clear mocks
      jest.clearAllMocks();

      // Mock fetch to simulate timeout
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100); // Simulate abort after 100ms
        });
      });

      // Attempt operation and expect timeout error
      await expect(
        client.getConnectionState(instanceName)
      ).rejects.toThrow('Request timeout');

      // Should have attempted 3 times (with retries)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
