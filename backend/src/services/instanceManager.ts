/**
 * Instance Manager Service
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Core business logic layer for managing WhatsApp instances.
 * Orchestrates instance lifecycle, QR code management, and connection status.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5, 3.2, 3.4, 4.2, 4.3, 4.4, 8.3, 8.5, 14.1, 14.6
 */

import { EvolutionAPIClient, EvolutionAPIError } from '../lib/evolutionApiClient';
import {
  createWhatsAppInstance,
  getWhatsAppInstanceByUserId,
  updateWhatsAppInstance,
  deleteWhatsAppInstance,
  WhatsAppInstance,
} from '../models/whatsappInstance';
import { RateLimiter, createRateLimitKey, RateLimitConfigs } from '../utils/rateLimiter';
import { getConfig } from '../config/environment';

export interface InstanceData {
  instanceName: string;
  status: 'created' | 'connecting' | 'connected' | 'disconnected';
  createdAt: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export class InstanceCreationError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'InstanceCreationError';
  }
}

export class QRCodeNotAvailableError extends Error {
  constructor(message: string = 'QR Code not available') {
    super(message);
    this.name = 'QRCodeNotAvailableError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded. Please try again later.',
    public retryAfter: number = 60
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class InstanceManagerService {
  private evolutionClient: EvolutionAPIClient;
  private rateLimiter: RateLimiter;
  private backendUrl: string;

  constructor() {
    this.evolutionClient = new EvolutionAPIClient();
    this.rateLimiter = new RateLimiter();
    const config = getConfig();
    this.backendUrl = config.backend.url;
  }

  /**
   * Creates a new WhatsApp instance for the user
   * Implements idempotency - reuses existing instance if found
   * 
   * @param userId - ID of the authenticated user
   * @returns Instance data
   * @throws InstanceCreationError if creation fails
   * @throws RateLimitError if rate limit exceeded
   * 
   * Validates: Requirements 1.1, 1.2, 1.3, 1.5
   */
  async createInstance(userId: string): Promise<InstanceData> {
    // Check rate limit
    const rateLimitKey = createRateLimitKey(userId, 'create-instance');
    if (this.rateLimiter.isRateLimited(
      rateLimitKey,
      RateLimitConfigs.INSTANCE_CREATION.maxRequests,
      RateLimitConfigs.INSTANCE_CREATION.windowMs
    )) {
      const retryAfter = this.rateLimiter.getRetryAfter(
        rateLimitKey,
        RateLimitConfigs.INSTANCE_CREATION.windowMs
      );
      throw new RateLimitError(
        'Too many instance creation requests. Please try again later.',
        retryAfter
      );
    }

    // Generate instance name in format "user-{userId}"
    const instanceName = this.generateInstanceName(userId);

    // Check if instance already exists in database
    const existingInstance = await getWhatsAppInstanceByUserId(userId);
    
    if (existingInstance) {
      // Instance exists in database - verify it exists in Evolution API
      try {
        const connectionState = await this.evolutionClient.getConnectionState(instanceName);
        
        // Instance exists in both places - return existing instance
        return {
          instanceName: existingInstance.instanceName,
          status: this.mapConnectionStateToStatus(connectionState.state),
          createdAt: existingInstance.createdAt,
        };
      } catch (error) {
        // Instance doesn't exist in Evolution API - create new one
        if (error instanceof EvolutionAPIError && error.statusCode === 404) {
          // Continue to create new instance
        } else {
          throw error;
        }
      }
    }

    // Create instance in Evolution API
    try {
      const webhookUrl = `${this.backendUrl}/api/webhooks/evolution`;
      const evolutionInstance = await this.evolutionClient.createInstance(
        instanceName,
        webhookUrl
      );

      // Configure webhook (non-blocking - failure doesn't fail instance creation)
      try {
        await this.evolutionClient.setWebhook(instanceName, {
          url: webhookUrl,
          webhook_by_events: true,
          webhook_base64: false,
          events: [
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
          ],
        });
      } catch (webhookError) {
        console.warn('Webhook configuration failed, but instance was created', {
          userId,
          instanceName,
          error: webhookError instanceof Error ? webhookError.message : 'Unknown error',
        });
      }

      // Save configuration to database
      const savedInstance = existingInstance
        ? await updateWhatsAppInstance(userId, {
            status: 'connecting',
            apiKey: evolutionInstance.hash.apikey,
            lastActivityAt: new Date().toISOString(),
          })
        : await createWhatsAppInstance({
            userId,
            instanceName,
            apiKey: evolutionInstance.hash.apikey,
            status: 'connecting',
          });

      return {
        instanceName: savedInstance.instanceName,
        status: 'created',
        createdAt: savedInstance.createdAt,
      };
    } catch (error) {
      if (error instanceof EvolutionAPIError) {
        throw new InstanceCreationError(
          `Failed to create WhatsApp instance: ${error.message}`,
          error
        );
      }
      throw new InstanceCreationError(
        'Failed to create WhatsApp instance',
        error
      );
    }
  }

  /**
   * Gets QR code for the user's instance
   * Automatically refreshes expired QR codes
   * 
   * @param userId - ID of the authenticated user
   * @returns QR code in base64 format
   * @throws QRCodeNotAvailableError if QR code is not available
   * @throws RateLimitError if rate limit exceeded
   * 
   * Validates: Requirements 3.2, 3.4, 14.1, 14.6
   */
  async getQRCode(userId: string): Promise<string> {
    // Check rate limit (1 per minute)
    const rateLimitKey = createRateLimitKey(userId, 'qr-code');
    if (this.rateLimiter.isRateLimited(
      rateLimitKey,
      RateLimitConfigs.QR_CODE_GENERATION.maxRequests,
      RateLimitConfigs.QR_CODE_GENERATION.windowMs
    )) {
      const retryAfter = this.rateLimiter.getRetryAfter(
        rateLimitKey,
        RateLimitConfigs.QR_CODE_GENERATION.windowMs
      );
      throw new RateLimitError(
        'Too many QR code requests. Please wait before requesting again.',
        retryAfter
      );
    }

    // Get instance from database
    const instance = await getWhatsAppInstanceByUserId(userId);
    if (!instance) {
      throw new QRCodeNotAvailableError('No instance found for user');
    }

    // Get QR code from Evolution API
    try {
      const qrCode = await this.evolutionClient.getQRCode(instance.instanceName);
      
      // Update last activity
      await updateWhatsAppInstance(userId, {
        lastActivityAt: new Date().toISOString(),
      });

      return qrCode;
    } catch (error) {
      if (error instanceof EvolutionAPIError) {
        if (error.statusCode === 404) {
          throw new QRCodeNotAvailableError('QR Code not available');
        }
        throw new QRCodeNotAvailableError(
          `Failed to get QR code: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Gets connection status of the user's instance
   * Maps Evolution API states to valid status values
   * 
   * @param userId - ID of the authenticated user
   * @returns Connection status
   * 
   * Validates: Requirements 4.2, 4.3, 4.4
   */
  async getConnectionStatus(userId: string): Promise<ConnectionStatus> {
    // Get instance from database
    const instance = await getWhatsAppInstanceByUserId(userId);
    if (!instance) {
      return 'disconnected';
    }

    // Get connection state from Evolution API
    try {
      const connectionState = await this.evolutionClient.getConnectionState(
        instance.instanceName
      );

      const status = this.mapConnectionStateToStatus(connectionState.state);

      // Update status in database if changed
      if (status !== instance.status) {
        await updateWhatsAppInstance(userId, {
          status,
          lastActivityAt: new Date().toISOString(),
          ...(status === 'connected' && { connectedAt: new Date().toISOString() }),
          ...(status === 'disconnected' && { disconnectedAt: new Date().toISOString() }),
        });
      }

      return status;
    } catch (error) {
      // If Evolution API is offline or instance not found, return disconnected
      if (error instanceof EvolutionAPIError) {
        console.warn('Failed to get connection status from Evolution API', {
          userId,
          instanceName: instance.instanceName,
          error: error.message,
        });
        return 'disconnected';
      }
      throw error;
    }
  }

  /**
   * Disconnects the user's WhatsApp instance
   * Removes instance from Evolution API and updates database
   * 
   * @param userId - ID of the authenticated user
   * 
   * Validates: Requirements 8.3, 8.5
   */
  async disconnectInstance(userId: string): Promise<void> {
    // Get instance from database
    const instance = await getWhatsAppInstanceByUserId(userId);
    if (!instance) {
      return; // Nothing to disconnect
    }

    // Delete instance from Evolution API
    try {
      await this.evolutionClient.deleteInstance(instance.instanceName);
    } catch (error) {
      // Log error but continue to update database
      console.warn('Failed to delete instance from Evolution API', {
        userId,
        instanceName: instance.instanceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Update status in database
    await updateWhatsAppInstance(userId, {
      status: 'disconnected',
      disconnectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    });
  }

  /**
   * Reconnects the user's WhatsApp instance
   * Generates new QR code for connection
   * 
   * @param userId - ID of the authenticated user
   * @returns New QR code in base64 format
   * 
   * Validates: Requirements 8.3, 8.5
   */
  async reconnectInstance(userId: string): Promise<string> {
    // Get instance from database
    const instance = await getWhatsAppInstanceByUserId(userId);
    
    if (!instance) {
      // No instance exists - create new one
      await this.createInstance(userId);
    } else {
      // Update status to connecting
      await updateWhatsAppInstance(userId, {
        status: 'connecting',
        lastActivityAt: new Date().toISOString(),
      });
    }

    // Get new QR code
    return this.getQRCode(userId);
  }

  /**
   * Generates instance name in format "user-{userId}"
   * 
   * @param userId - User ID
   * @returns Instance name
   * 
   * Validates: Requirement 1.1
   */
  private generateInstanceName(userId: string): string {
    return `user-${userId}`;
  }

  /**
   * Maps Evolution API connection state to our status values
   * 
   * @param state - Evolution API state
   * @returns Mapped status
   */
  private mapConnectionStateToStatus(
    state: 'close' | 'connecting' | 'open'
  ): ConnectionStatus {
    switch (state) {
      case 'open':
        return 'connected';
      case 'connecting':
        return 'connecting';
      case 'close':
      default:
        return 'disconnected';
    }
  }
}
