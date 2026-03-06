/**
 * Unit Tests for Instance Manager Service
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Tests specific examples and edge cases for disconnect/reconnect functionality.
 * 
 * **Validates: Requirements 8.3, 8.5**
 */

import { InstanceManagerService, QRCodeNotAvailableError, RateLimitError } from './instanceManager';
import { EvolutionAPIClient, EvolutionAPIError } from '../lib/evolutionApiClient';
import {
  getWhatsAppInstanceByUserId,
  updateWhatsAppInstance,
  createWhatsAppInstance,
} from '../models/whatsappInstance';

// Mock dependencies
jest.mock('../lib/evolutionApiClient');
jest.mock('../models/whatsappInstance');
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock('../config/environment', () => ({
  getConfig: () => ({
    evolutionApi: {
      url: 'https://test-api.com',
      globalKey: 'test-key',
    },
    backend: {
      url: 'https://test-backend.com',
    },
  }),
}));

describe('Unit Tests - Instance Manager Service', () => {
  let service: InstanceManagerService;
  let mockEvolutionClient: jest.Mocked<EvolutionAPIClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstanceManagerService();
    mockEvolutionClient = (service as any).evolutionClient;
    // Reset rate limiter between tests
    (service as any).rateLimiter.resetAll();
  });

  describe('disconnectInstance', () => {
    /**
     * Test: Disconnect with success
     * **Validates: Requirements 8.3**
     */
    it('should successfully disconnect instance', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const instance = {
        id: 'test-id',
        userId,
        instanceName,
        status: 'connected' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(instance);
      (updateWhatsAppInstance as jest.Mock).mockResolvedValue({
        ...instance,
        status: 'disconnected',
      });

      // Mock Evolution API delete
      mockEvolutionClient.deleteInstance = jest.fn().mockResolvedValue(undefined);

      // Disconnect instance
      await service.disconnectInstance(userId);

      // Verify Evolution API was called
      expect(mockEvolutionClient.deleteInstance).toHaveBeenCalledWith(instanceName);

      // Verify database was updated
      expect(updateWhatsAppInstance).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          status: 'disconnected',
          disconnectedAt: expect.any(String),
          lastActivityAt: expect.any(String),
        })
      );
    });

    /**
     * Test: Disconnect when no instance exists
     * **Validates: Requirements 8.3**
     */
    it('should handle disconnect when no instance exists', async () => {
      const userId = 'test-user-123';

      // Mock no instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);

      // Should not throw error
      await expect(service.disconnectInstance(userId)).resolves.not.toThrow();

      // Verify Evolution API was not called
      expect(mockEvolutionClient.deleteInstance).not.toHaveBeenCalled();

      // Verify database was not updated
      expect(updateWhatsAppInstance).not.toHaveBeenCalled();
    });

    /**
     * Test: Disconnect updates status in database even if Evolution API fails
     * **Validates: Requirements 8.3**
     */
    it('should update database status even if Evolution API delete fails', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const instance = {
        id: 'test-id',
        userId,
        instanceName,
        status: 'connected' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(instance);
      (updateWhatsAppInstance as jest.Mock).mockResolvedValue({
        ...instance,
        status: 'disconnected',
      });

      // Mock Evolution API delete failure
      mockEvolutionClient.deleteInstance = jest.fn().mockRejectedValue(
        new EvolutionAPIError('Service unavailable', 503)
      );

      // Should not throw error
      await expect(service.disconnectInstance(userId)).resolves.not.toThrow();

      // Verify database was still updated
      expect(updateWhatsAppInstance).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          status: 'disconnected',
        })
      );
    });
  });

  describe('reconnectInstance', () => {
    /**
     * Test: Reconnect generates new QR code
     * **Validates: Requirements 8.5**
     */
    it('should generate new QR code when reconnecting', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const qrCode = 'data:image/png;base64,test-qr-code';
      const instance = {
        id: 'test-id',
        userId,
        instanceName,
        status: 'disconnected' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(instance);
      (updateWhatsAppInstance as jest.Mock).mockResolvedValue({
        ...instance,
        status: 'connecting',
      });

      // Mock Evolution API QR code
      mockEvolutionClient.getQRCode = jest.fn().mockResolvedValue(qrCode);

      // Reconnect instance
      const result = await service.reconnectInstance(userId);

      // Verify QR code was returned
      expect(result).toBe(qrCode);

      // Verify status was updated to connecting
      expect(updateWhatsAppInstance).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          status: 'connecting',
          lastActivityAt: expect.any(String),
        })
      );

      // Verify QR code was requested
      expect(mockEvolutionClient.getQRCode).toHaveBeenCalledWith(instanceName);
    });

    /**
     * Test: Reconnect creates new instance if none exists
     * **Validates: Requirements 8.5**
     */
    it('should create new instance if none exists when reconnecting', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const qrCode = 'data:image/png;base64,test-qr-code';

      // Mock no instance exists initially, then exists after creation
      (getWhatsAppInstanceByUserId as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null) // Second call during createInstance
        .mockResolvedValue({
          id: 'test-id',
          userId,
          instanceName,
          status: 'connecting' as const,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        });

      // Mock Evolution API
      mockEvolutionClient.createInstance = jest.fn().mockResolvedValue({
        instance: {
          instanceName,
          status: 'created',
        },
        hash: {
          apikey: 'test-api-key',
        },
      });

      mockEvolutionClient.setWebhook = jest.fn().mockResolvedValue(undefined);
      mockEvolutionClient.getQRCode = jest.fn().mockResolvedValue(qrCode);

      (createWhatsAppInstance as jest.Mock).mockResolvedValue({
        id: 'test-id',
        userId,
        instanceName,
        status: 'connecting',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      (updateWhatsAppInstance as jest.Mock).mockResolvedValue({
        id: 'test-id',
        userId,
        instanceName,
        status: 'connecting',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      // Reconnect instance
      const result = await service.reconnectInstance(userId);

      // Verify QR code was returned
      expect(result).toBe(qrCode);

      // Verify instance was created
      expect(createWhatsAppInstance).toHaveBeenCalled();
    });

    /**
     * Test: Reconnect respects rate limiting
     * **Validates: Requirements 14.6**
     */
    it('should respect rate limiting for QR code generation', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const instance = {
        id: 'test-id',
        userId,
        instanceName,
        status: 'disconnected' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(instance);
      (updateWhatsAppInstance as jest.Mock).mockResolvedValue({
        ...instance,
        status: 'connecting',
      });

      // Mock Evolution API QR code
      mockEvolutionClient.getQRCode = jest.fn().mockResolvedValue('qr-code');

      // First reconnect should succeed
      await service.reconnectInstance(userId);

      // Second reconnect immediately should fail due to rate limit
      await expect(service.reconnectInstance(userId)).rejects.toThrow(RateLimitError);
    });
  });

  describe('getQRCode', () => {
    /**
     * Test: Get QR code throws error when no instance exists
     * **Validates: Requirements 3.2**
     */
    it('should throw QRCodeNotAvailableError when no instance exists', async () => {
      const userId = 'test-user-no-instance-123'; // Use different userId to avoid rate limit

      // Mock no instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);

      // Should throw error
      await expect(service.getQRCode(userId)).rejects.toThrow(QRCodeNotAvailableError);
    });

    /**
     * Test: Get QR code updates last activity
     * **Validates: Requirements 3.2**
     */
    it('should update last activity when getting QR code', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const qrCode = 'data:image/png;base64,test-qr-code';
      const instance = {
        id: 'test-id',
        userId,
        instanceName,
        status: 'connecting' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(instance);
      (updateWhatsAppInstance as jest.Mock).mockResolvedValue(instance);

      // Mock Evolution API QR code
      mockEvolutionClient.getQRCode = jest.fn().mockResolvedValue(qrCode);

      // Get QR code
      await service.getQRCode(userId);

      // Verify last activity was updated
      expect(updateWhatsAppInstance).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          lastActivityAt: expect.any(String),
        })
      );
    });
  });

  describe('getConnectionStatus', () => {
    /**
     * Test: Get connection status updates database when status changes
     * **Validates: Requirements 4.2**
     */
    it('should update database when connection status changes', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const instance = {
        id: 'test-id',
        userId,
        instanceName,
        status: 'connecting' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(instance);
      (updateWhatsAppInstance as jest.Mock).mockResolvedValue({
        ...instance,
        status: 'connected',
      });

      // Mock Evolution API connection state (changed to connected)
      mockEvolutionClient.getConnectionState = jest.fn().mockResolvedValue({
        instance: instanceName,
        state: 'open',
      });

      // Get connection status
      const status = await service.getConnectionStatus(userId);

      // Verify status is connected
      expect(status).toBe('connected');

      // Verify database was updated
      expect(updateWhatsAppInstance).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          status: 'connected',
          connectedAt: expect.any(String),
          lastActivityAt: expect.any(String),
        })
      );
    });

    /**
     * Test: Get connection status does not update database when status unchanged
     * **Validates: Requirements 4.2**
     */
    it('should not update database when connection status is unchanged', async () => {
      const userId = 'test-user-123';
      const instanceName = 'user-test-user-123';
      const instance = {
        id: 'test-id',
        userId,
        instanceName,
        status: 'connected' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock instance exists
      (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(instance);

      // Mock Evolution API connection state (same as database)
      mockEvolutionClient.getConnectionState = jest.fn().mockResolvedValue({
        instance: instanceName,
        state: 'open',
      });

      // Get connection status
      const status = await service.getConnectionStatus(userId);

      // Verify status is connected
      expect(status).toBe('connected');

      // Verify database was NOT updated (status unchanged)
      expect(updateWhatsAppInstance).not.toHaveBeenCalled();
    });
  });
});
