/**
 * Property-Based Tests for Instance Manager Service
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Tests universal properties that should hold for all inputs.
 * 
 * **Validates: Requirements 1.1, 1.3, 1.5, 5.1, 5.2, 5.3, 5.4**
 */

import fc from 'fast-check';
import { InstanceManagerService } from './instanceManager';
import { EvolutionAPIClient } from '../lib/evolutionApiClient';
import {
  createWhatsAppInstance,
  getWhatsAppInstanceByUserId,
  deleteWhatsAppInstance,
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

describe('Property Tests - Instance Manager Service', () => {
  let service: InstanceManagerService;
  let mockEvolutionClient: jest.Mocked<EvolutionAPIClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstanceManagerService();
    mockEvolutionClient = (service as any).evolutionClient;
  });

  /**
   * Property 1: Instance Name Generation Format
   * 
   * For any userId, when generating an instance name,
   * the result should match the format "user-{userId}".
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: Instance Name Generation Format', () => {
    it('should generate instance names in correct format for any userId', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Mock no existing instance
            (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);
            
            // Mock Evolution API responses
            mockEvolutionClient.createInstance = jest.fn().mockResolvedValue({
              instance: {
                instanceName: `user-${userId}`,
                status: 'created',
              },
              hash: {
                apikey: 'test-api-key',
              },
            });
            
            mockEvolutionClient.setWebhook = jest.fn().mockResolvedValue(undefined);
            
            (createWhatsAppInstance as jest.Mock).mockResolvedValue({
              id: 'test-id',
              userId,
              instanceName: `user-${userId}`,
              status: 'connecting',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            const result = await service.createInstance(userId);

            // Verify instance name format
            expect(result.instanceName).toBe(`user-${userId}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Instance Creation Idempotency
   * 
   * For any user, creating an instance multiple times should result
   * in the same instance being returned (idempotent operation).
   * 
   * **Validates: Requirements 1.5, 1.3**
   */
  describe('Property 2: Instance Creation Idempotency', () => {
    it('should return same instance when created multiple times', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const instanceName = `user-${userId}`;
            const existingInstance = {
              id: 'test-id',
              userId,
              instanceName,
              status: 'connected' as const,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            };

            // First call - no existing instance
            (getWhatsAppInstanceByUserId as jest.Mock)
              .mockResolvedValueOnce(null)
              .mockResolvedValue(existingInstance);

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
            mockEvolutionClient.getConnectionState = jest.fn().mockResolvedValue({
              instance: instanceName,
              state: 'open',
            });

            (createWhatsAppInstance as jest.Mock).mockResolvedValue(existingInstance);

            // Create instance first time
            const result1 = await service.createInstance(userId);

            // Reset rate limiter for second call
            (service as any).rateLimiter.reset(`${userId}:create-instance`);

            // Create instance second time
            const result2 = await service.createInstance(userId);

            // Both should return the same instance name
            expect(result1.instanceName).toBe(result2.instanceName);
            expect(result1.instanceName).toBe(instanceName);
          }
        ),
        { numRuns: 50 } // Reduced runs due to complexity
      );
    });
  });

  /**
   * Property 3: Instance Persistence After Creation
   * 
   * For any successful instance creation, the instance configuration
   * should be persisted in the database and retrievable.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: Instance Persistence After Creation', () => {
    it('should persist instance data after successful creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const instanceName = `user-${userId}`;

            // Mock no existing instance
            (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);

            // Mock Evolution API responses
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

            const savedInstance = {
              id: 'test-id',
              userId,
              instanceName,
              status: 'connecting' as const,
              encryptedApiKey: 'encrypted-key',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            (createWhatsAppInstance as jest.Mock).mockResolvedValue(savedInstance);

            // Create instance
            await service.createInstance(userId);

            // Verify createWhatsAppInstance was called with correct data
            expect(createWhatsAppInstance).toHaveBeenCalledWith(
              expect.objectContaining({
                userId,
                instanceName,
                apiKey: 'test-api-key',
                status: 'connecting',
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Webhook Auto-Configuration
   * 
   * For any successfully created instance, a webhook should be automatically
   * configured pointing to {BACKEND_URL}/api/webhooks/evolution.
   * 
   * **Validates: Requirements 5.1, 5.2**
   */
  describe('Property 10: Webhook Auto-Configuration', () => {
    it('should automatically configure webhook with correct URL for any instance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const instanceName = `user-${userId}`;

            // Mock no existing instance
            (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);

            // Mock Evolution API responses
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

            (createWhatsAppInstance as jest.Mock).mockResolvedValue({
              id: 'test-id',
              userId,
              instanceName,
              status: 'connecting' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Create instance
            await service.createInstance(userId);

            // Verify setWebhook was called with correct URL
            expect(mockEvolutionClient.setWebhook).toHaveBeenCalledWith(
              instanceName,
              expect.objectContaining({
                url: 'https://test-backend.com/api/webhooks/evolution',
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Webhook Events Enabled
   * 
   * For any configured webhook, message received events should be enabled.
   * 
   * **Validates: Requirements 5.3**
   */
  describe('Property 11: Webhook Events Enabled', () => {
    it('should enable required webhook events for any instance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const instanceName = `user-${userId}`;

            // Mock no existing instance
            (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);

            // Mock Evolution API responses
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

            (createWhatsAppInstance as jest.Mock).mockResolvedValue({
              id: 'test-id',
              userId,
              instanceName,
              status: 'connecting' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Create instance
            await service.createInstance(userId);

            // Verify setWebhook was called with required events
            expect(mockEvolutionClient.setWebhook).toHaveBeenCalledWith(
              instanceName,
              expect.objectContaining({
                webhook_by_events: true,
                events: expect.arrayContaining([
                  'QRCODE_UPDATED',
                  'CONNECTION_UPDATE',
                  'MESSAGES_UPSERT',
                ]),
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Webhook Failure Non-Blocking
   * 
   * For any instance creation, if webhook configuration fails,
   * the instance creation should still succeed (webhook failure is non-blocking).
   * 
   * **Validates: Requirements 5.4**
   */
  describe('Property 12: Webhook Failure Non-Blocking', () => {
    it('should succeed instance creation even when webhook configuration fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const instanceName = `user-${userId}`;

            // Mock no existing instance
            (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);

            // Mock Evolution API responses
            mockEvolutionClient.createInstance = jest.fn().mockResolvedValue({
              instance: {
                instanceName,
                status: 'created',
              },
              hash: {
                apikey: 'test-api-key',
              },
            });

            // Mock webhook configuration failure
            mockEvolutionClient.setWebhook = jest.fn().mockRejectedValue(
              new Error('Webhook configuration failed')
            );

            (createWhatsAppInstance as jest.Mock).mockResolvedValue({
              id: 'test-id',
              userId,
              instanceName,
              status: 'connecting' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Create instance - should NOT throw despite webhook failure
            const result = await service.createInstance(userId);

            // Verify instance was created successfully
            expect(result.instanceName).toBe(instanceName);
            expect(result.status).toBe('created');

            // Verify createWhatsAppInstance was still called
            expect(createWhatsAppInstance).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
