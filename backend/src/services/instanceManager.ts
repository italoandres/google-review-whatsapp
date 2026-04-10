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
import { RateLimitConfigs } from '../utils/rateLimiter';
import { 
  incrementRateLimit, 
  isRateLimited as checkRateLimit 
} from '../models/rateLimitRecord';
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
  private backendUrl: string;

  constructor() {
    this.evolutionClient = new EvolutionAPIClient();
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
    // Check rate limit using Supabase
    const rateLimitCheck = await checkRateLimit(
      userId,
      'create-instance',
      RateLimitConfigs.INSTANCE_CREATION.maxRequests
    );

    if (rateLimitCheck.limited) {
      const resetTime = new Date(rateLimitCheck.resetTime!);
      const now = new Date();
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      
      throw new RateLimitError(
        'Too many instance creation requests. Please try again later.',
        retryAfter
      );
    }

    // Increment rate limit counter
    await incrementRateLimit({
      userId,
      endpoint: 'create-instance',
      windowDurationMs: RateLimitConfigs.INSTANCE_CREATION.windowMs,
    });

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
          status: this.mapConnectionStateToStatus(connectionState.instance.state),
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
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhook_by_events: true,
            webhook_base64: false,
            events: [
              'QRCODE_UPDATED',
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
            ],
          },
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
    // Check rate limit using Supabase
    const rateLimitCheck = await checkRateLimit(
      userId,
      'qr-code',
      RateLimitConfigs.QR_CODE_GENERATION.maxRequests
    );

    if (rateLimitCheck.limited) {
      const resetTime = new Date(rateLimitCheck.resetTime!);
      const now = new Date();
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      
      throw new RateLimitError(
        'Too many QR code requests. Please wait before requesting again.',
        retryAfter
      );
    }

    // Increment rate limit counter
    await incrementRateLimit({
      userId,
      endpoint: 'qr-code',
      windowDurationMs: RateLimitConfigs.QR_CODE_GENERATION.windowMs,
    });

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
   * Implements retry logic for robustness
   * 
   * @param userId - ID of the authenticated user
   * @param retries - Number of retry attempts (default: 3)
   * @returns Connection status
   * 
   * Validates: Requirements 4.2, 4.3, 4.4
   */
  async getConnectionStatus(userId: string, retries: number = 3): Promise<ConnectionStatus> {
    // Get instance from database
    const instance = await getWhatsAppInstanceByUserId(userId);
    
    console.log('🔍 [getConnectionStatus] Checking status', {
      userId,
      instanceName: instance?.instanceName,
      currentStatusInDB: instance?.status,
      hasInstance: !!instance,
    });

    if (!instance) {
      console.log('❌ [getConnectionStatus] No instance found');
      return 'disconnected';
    }

    // Get connection state from Evolution API with retry logic
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const connectionState = await this.evolutionClient.getConnectionState(
          instance.instanceName
        );

        const status = this.mapConnectionStateToStatus(connectionState.instance.state);

        console.log('🔄 [getConnectionStatus] Mapped status', {
          instanceName: instance.instanceName,
          evolutionState: connectionState.instance.state,
          mappedStatus: status,
          currentDBStatus: instance.status,
          willUpdate: status !== instance.status,
          attempt: attempt + 1,
        });

        // Update status in database if changed
        if (status !== instance.status) {
          await updateWhatsAppInstance(userId, {
            status,
            lastActivityAt: new Date().toISOString(),
            ...(status === 'connected' && { connectedAt: new Date().toISOString() }),
            ...(status === 'disconnected' && { disconnectedAt: new Date().toISOString() }),
          });
          
          console.log('✅ [getConnectionStatus] Status updated in DB', {
            instanceName: instance.instanceName,
            oldStatus: instance.status,
            newStatus: status,
          });
        }

        return status;
      } catch (error) {
        const isLastAttempt = attempt === retries - 1;
        
        // If Evolution API is offline or instance not found
        if (error instanceof EvolutionAPIError) {
          if (isLastAttempt) {
            console.warn('⚠️ [getConnectionStatus] Failed after retries', {
              userId,
              instanceName: instance.instanceName,
              error: error.message,
              attempts: retries,
            });
            return 'disconnected';
          }
          
          // Wait before retry (exponential backoff: 500ms, 1000ms, 1500ms)
          await this.sleep(500 * (attempt + 1));
          continue;
        }
        
        // Unexpected error - throw immediately
        console.error('❌ [getConnectionStatus] Unexpected error', {
          userId,
          instanceName: instance.instanceName,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }
    }

    // Fallback (should never reach here)
    console.warn('⚠️ [getConnectionStatus] Fallback to disconnected');
    return 'disconnected';
  }

  /**
   * Sleep utility for retry delays
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
   * Forces reconnection of WhatsApp instance by logging out and restarting
   * This is useful when QR code is not available or instance is stuck
   * 
   * @param userId - ID of the authenticated user
   * @returns New QR code in base64 format
   * @throws QRCodeNotAvailableError if QR code cannot be generated
   * 
   * Validates: Requirements 1.4, 2.4, 2.5
   */
  async forceReconnect(userId: string): Promise<string> {
    // Get instance from database
    const instance = await getWhatsAppInstanceByUserId(userId);
    
    if (!instance) {
      throw new QRCodeNotAvailableError('No instance found for user');
    }

    console.log('🔄 [forceReconnect] Starting force reconnect', {
      userId,
      instanceName: instance.instanceName,
      currentStatus: instance.status,
    });

    try {
      // Step 1: Force logout to clear any stuck state
      console.log('🔄 [forceReconnect] Step 1: Forcing logout', {
        instanceName: instance.instanceName,
      });
      
      await this.evolutionClient.logoutInstance(instance.instanceName);
      
      console.log('✅ [forceReconnect] Logout successful', {
        instanceName: instance.instanceName,
      });
    } catch (error) {
      // Log error but continue - logout might fail if instance is already disconnected
      console.warn('⚠️ [forceReconnect] Logout failed (continuing anyway)', {
        instanceName: instance.instanceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Step 2: Wait 2 seconds for Evolution API to process logout
    console.log('⏳ [forceReconnect] Step 2: Waiting 2 seconds', {
      instanceName: instance.instanceName,
    });
    
    await this.sleep(2000);

    // Step 3: Update status to connecting
    await updateWhatsAppInstance(userId, {
      status: 'connecting',
      lastActivityAt: new Date().toISOString(),
    });

    // Step 4: Try to get new QR code
    console.log('🔄 [forceReconnect] Step 3: Attempting to get new QR code', {
      instanceName: instance.instanceName,
    });

    try {
      const qrCode = await this.getQRCode(userId);
      
      console.log('✅ [forceReconnect] QR code obtained successfully', {
        instanceName: instance.instanceName,
      });
      
      return qrCode;
    } catch (error) {
      // If getQRCode fails, try restarting the instance as fallback
      console.warn('⚠️ [forceReconnect] QR code fetch failed, trying restart', {
        instanceName: instance.instanceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      try {
        console.log('🔄 [forceReconnect] Step 4 (fallback): Restarting instance', {
          instanceName: instance.instanceName,
        });
        
        await this.evolutionClient.restartInstance(instance.instanceName);
        
        console.log('✅ [forceReconnect] Restart successful', {
          instanceName: instance.instanceName,
        });

        // Wait 2 seconds after restart
        await this.sleep(2000);

        // Try to get QR code again
        const qrCode = await this.getQRCode(userId);
        
        console.log('✅ [forceReconnect] QR code obtained after restart', {
          instanceName: instance.instanceName,
        });
        
        return qrCode;
      } catch (restartError) {
        console.error('❌ [forceReconnect] Force reconnect failed completely', {
          instanceName: instance.instanceName,
          error: restartError instanceof Error ? restartError.message : 'Unknown error',
        });
        
        throw new QRCodeNotAvailableError(
          'Failed to force reconnect and generate QR code. Please try again later.'
        );
      }
    }
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
