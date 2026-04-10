/**
 * Unit Tests for Evolution API Client
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Tests specific examples and edge cases for Evolution API Client.
 */

import { EvolutionAPIClient, EvolutionAPIError } from './evolutionApiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('Evolution API Client - Unit Tests', () => {
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

  describe('createInstance', () => {
    it('should create instance successfully', async () => {
      const mockResponse = {
        instance: {
          instanceName: 'user-123',
          status: 'created',
        },
        hash: {
          apikey: 'instance-api-key',
        },
      };

      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await client.createInstance('user-123', 'https://webhook.example.com');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/instance/create',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'apikey': 'test-global-key',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('user-123'),
        })
      );
    });

    it('should throw error when instance creation fails', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(
        client.createInstance('user-123', 'https://webhook.example.com')
      ).rejects.toThrow(EvolutionAPIError);
    });

    it('should include correct request body', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          instance: { instanceName: 'test', status: 'created' },
          hash: { apikey: 'key' },
        }),
      });

      await client.createInstance('test-instance', 'https://webhook.example.com');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toEqual({
        instanceName: 'test-instance',
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });
    });
  });

  describe('getQRCode', () => {
    it('should get QR code successfully', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          base64: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        }),
      });

      const result = await client.getQRCode('user-123');

      expect(result).toBe('data:image/png;base64,iVBORw0KGgoAAAANS...');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/instance/connect/user-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'apikey': 'test-global-key',
          }),
        })
      );
    });

    it('should handle alternative qrcode.base64 format', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          qrcode: {
            base64: 'data:image/png;base64,alternative...',
          },
        }),
      });

      const result = await client.getQRCode('user-123');

      expect(result).toBe('data:image/png;base64,alternative...');
    });

    it('should throw 404 error when QR code not available', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      await expect(
        client.getQRCode('user-123')
      ).rejects.toThrow('QR Code not available');
    });
  });

  describe('getConnectionState', () => {
    it('should get connection state successfully', async () => {
      const mockResponse = {
        instance: 'user-123',
        state: 'open',
      };

      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.getConnectionState('user-123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/instance/connectionState/user-123',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle all connection states', async () => {
      const states: Array<'close' | 'connecting' | 'open'> = ['close', 'connecting', 'open'];

      for (const state of states) {
        const mockFetch = global.fetch as jest.Mock;
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            instance: {
              instanceName: 'user-123',
              state,
            },
          }),
        });

        const result = await client.getConnectionState('user-123');
        expect(result.instance.state).toBe(state);

        jest.clearAllMocks();
      }
    });
  });

  describe('deleteInstance', () => {
    it('should delete instance successfully', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await expect(
        client.deleteInstance('user-123')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/instance/delete/user-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should not throw error when instance not found (404)', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      // Should not throw - 404 is acceptable for delete
      await expect(
        client.deleteInstance('user-123')
      ).resolves.not.toThrow();
    });

    it('should throw error for other failures', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(
        client.deleteInstance('user-123')
      ).rejects.toThrow(EvolutionAPIError);
    });
  });

  describe('setWebhook', () => {
    it('should set webhook successfully', async () => {
      const webhookConfig = {
        webhook: {
          url: 'https://backend.example.com/api/webhooks/evolution',
          webhook_by_events: true,
          webhook_base64: false,
          events: ['messages.upsert', 'connection.update'],
        },
      };

      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await expect(
        client.setWebhook('user-123', webhookConfig)
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/webhook/set/user-123',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(webhookConfig),
        })
      );
    });

    it('should throw error when webhook configuration fails', async () => {
      const webhookConfig = {
        webhook: {
          url: 'https://backend.example.com/api/webhooks/evolution',
          webhook_by_events: true,
          webhook_base64: false,
          events: ['messages.upsert'],
        },
      };

      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(
        client.setWebhook('user-123', webhookConfig)
      ).rejects.toThrow(EvolutionAPIError);
    });
  });

  describe('Error Handling', () => {
    it('should include status code in error', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({}),
      });

      try {
        await client.getConnectionState('user-123');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(EvolutionAPIError);
        expect((error as EvolutionAPIError).statusCode).toBe(503);
      }
    });

    it('should handle network errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        client.getConnectionState('user-123')
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });

      await expect(
        client.getConnectionState('user-123')
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Headers', () => {
    it('should include Content-Type header', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          instance: { instanceName: 'test', status: 'created' },
          hash: { apikey: 'key' },
        }),
      });

      await client.createInstance('test', 'https://webhook.example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include apikey header in all requests', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ instance: 'test', state: 'open' }),
      });

      await client.getConnectionState('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'apikey': 'test-global-key',
          }),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty instance name', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ instance: '', state: 'close' }),
      });

      const result = await client.getConnectionState('');
      expect(result.instance).toBe('');
    });

    it('should handle special characters in instance name', async () => {
      const specialName = 'user-123-test_special.name';
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ instance: specialName, state: 'open' }),
      });

      const result = await client.getConnectionState(specialName);
      expect(result.instance).toBe(specialName);
    });

    it('should handle very long instance names', async () => {
      const longName = 'user-' + 'a'.repeat(100);
      
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ instance: longName, state: 'open' }),
      });

      const result = await client.getConnectionState(longName);
      expect(result.instance).toBe(longName);
    });
  });
});
