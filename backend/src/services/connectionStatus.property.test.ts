/**
 * Property-Based Tests for Connection Status
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Tests that connection status always returns valid values.
 * 
 * **Validates: Requirements 4.3**
 */

import fc from 'fast-check';
import { InstanceManagerService, ConnectionStatus } from './instanceManager';
import { EvolutionAPIClient, EvolutionAPIError } from '../lib/evolutionApiClient';
import {
  getWhatsAppInstanceByUserId,
  updateWhatsAppInstance,
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

describe('Property Tests - Connection Status', () => {
  let service: InstanceManagerService;
  let mockEvolutionClient: jest.Mocked<EvolutionAPIClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstanceManagerService();
    mockEvolutionClient = (service as any).evolutionClient;
  });

  /**
   * Property 9: Connection Status Valid Values
   * 
   * For any connection status query, the response should contain
   * one of exactly three valid values: "disconnected", "connecting", or "connected".
   * 
   * **Validates: Requirements 4.3**
   */
  describe('Property 9: Connection Status Valid Values', () => {
    it('should always return valid connection status values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('close', 'connecting', 'open'),
          async (userId, evolutionState) => {
            const instanceName = `user-${userId}`;
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

            // Mock Evolution API connection state
            mockEvolutionClient.getConnectionState = jest.fn().mockResolvedValue({
              instance: instanceName,
              state: evolutionState,
            });

            // Get connection status
            const status = await service.getConnectionStatus(userId);

            // Verify status is one of the valid values
            const validStatuses: ConnectionStatus[] = ['disconnected', 'connecting', 'connected'];
            expect(validStatuses).toContain(status);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return disconnected when no instance exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Mock no instance exists
            (getWhatsAppInstanceByUserId as jest.Mock).mockResolvedValue(null);

            // Get connection status
            const status = await service.getConnectionStatus(userId);

            // Should return disconnected
            expect(status).toBe('disconnected');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return disconnected when Evolution API is offline', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const instanceName = `user-${userId}`;
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

            // Mock Evolution API error (offline)
            mockEvolutionClient.getConnectionState = jest.fn().mockRejectedValue(
              new EvolutionAPIError('Service unavailable', 503)
            );

            // Get connection status
            const status = await service.getConnectionStatus(userId);

            // Should return disconnected when API is offline
            expect(status).toBe('disconnected');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly map all Evolution API states to valid status values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            const instanceName = `user-${userId}`;
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

            // Test all possible Evolution API states
            const stateMapping: Array<['close' | 'connecting' | 'open', ConnectionStatus]> = [
              ['close', 'disconnected'],
              ['connecting', 'connecting'],
              ['open', 'connected'],
            ];

            for (const [evolutionState, expectedStatus] of stateMapping) {
              mockEvolutionClient.getConnectionState = jest.fn().mockResolvedValue({
                instance: instanceName,
                state: evolutionState,
              });

              const status = await service.getConnectionStatus(userId);
              expect(status).toBe(expectedStatus);
            }
          }
        ),
        { numRuns: 50 } // Reduced runs due to loop
      );
    });
  });
});
