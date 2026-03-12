/**
 * Evolution API Client
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Client for communicating with Evolution API to manage WhatsApp instances.
 * Implements retry logic with exponential backoff and timeout handling.
 * 
 * Validates: Requirements 1.2, 3.2, 4.2, 5.1, 8.3, 9.5, 12.1, 12.2, 12.5, 12.6
 */

import { getConfig } from '../config/environment';

export interface EvolutionInstance {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
}

export interface ConnectionState {
  instance: {
    instanceName: string;
    state: 'close' | 'connecting' | 'open';
  };
}

export interface WebhookConfig {
  webhook: {
    enabled: boolean;
    url: string;
    webhook_by_events: boolean;
    webhook_base64: boolean;
    events: string[];
  };
}

export class EvolutionAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: any
  ) {
    super(message);
    this.name = 'EvolutionAPIError';
  }
}

export class EvolutionAPIClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number = 10000; // 10 seconds
  private readonly maxRetries: number = 3;
  private readonly baseDelay: number = 1000; // 1 second

  constructor() {
    const config = getConfig();
    this.baseUrl = config.evolutionApi.url;
    this.apiKey = config.evolutionApi.globalKey;
  }

  /**
   * Creates a new WhatsApp instance in Evolution API
   * @param instanceName - Unique name for the instance
   * @param webhookUrl - URL for webhook events
   * @returns Created instance data
   */
  async createInstance(
    instanceName: string,
    webhookUrl: string
  ): Promise<EvolutionInstance> {
    return this.executeWithRetry<EvolutionInstance>(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/instance/create`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        }
      );

      if (!response.ok) {
        throw new EvolutionAPIError(
          `Failed to create instance: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as EvolutionInstance;
      return data;
    });
  }

  /**
   * Gets QR code for WhatsApp connection
   * @param instanceName - Name of the instance
   * @returns QR code in base64 format
   */
  async getQRCode(instanceName: string): Promise<string> {
    return this.executeWithRetry<string>(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/instance/connect/${instanceName}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new EvolutionAPIError(
            'QR Code not available',
            404
          );
        }
        throw new EvolutionAPIError(
          `Failed to get QR code: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as any;
      return data.base64 || data.qrcode?.base64;
    });
  }

  /**
   * Gets connection state of an instance
   * @param instanceName - Name of the instance
   * @returns Connection state
   */
  async getConnectionState(instanceName: string): Promise<ConnectionState> {
    return this.executeWithRetry<ConnectionState>(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/instance/connectionState/${instanceName}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.error('❌ [getConnectionState] Failed', {
          instanceName,
          status: response.status,
          statusText: response.statusText,
        });
        throw new EvolutionAPIError(
          `Failed to get connection state: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as ConnectionState;
      
      console.log('📡 [getConnectionState] Response', {
        instanceName,
        state: data.instance.state,
        fullResponse: data,
      });

      return data;
    });
  }

  /**
   * Deletes an instance from Evolution API
   * @param instanceName - Name of the instance to delete
   */
  async deleteInstance(instanceName: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/instance/delete/${instanceName}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new EvolutionAPIError(
          `Failed to delete instance: ${response.statusText}`,
          response.status
        );
      }
    });
  }

  /**
   * Configures webhook for an instance
   * @param instanceName - Name of the instance
   * @param webhookConfig - Webhook configuration
   */
  async setWebhook(
    instanceName: string,
    webhookConfig: WebhookConfig
  ): Promise<void> {
    return this.executeWithRetry(async () => {
      const url = `${this.baseUrl}/webhook/set/${instanceName}`;
      const body = JSON.stringify(webhookConfig);
      
      console.log('🔧 [setWebhook] Attempting to configure webhook', {
        instanceName,
        url,
        webhookConfig,
        bodyLength: body.length,
      });

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body,
      });

      console.log('📡 [setWebhook] Response received', {
        instanceName,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.error('❌ [setWebhook] Failed - Response body:', {
            instanceName,
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
          });
        } catch (e) {
          console.error('❌ [setWebhook] Failed - Could not read response body', {
            instanceName,
            status: response.status,
            statusText: response.statusText,
          });
        }

        throw new EvolutionAPIError(
          `Failed to set webhook: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`,
          response.status
        );
      }

      console.log('✅ [setWebhook] Webhook configured successfully', {
        instanceName,
      });
    });
  }

  /**
   * Executes a request with retry logic and exponential backoff
   * Does not retry on 4xx errors (client errors) except timeouts
   * @param operation - Async operation to execute
   * @returns Result of the operation
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except timeout (408)
        if (error instanceof EvolutionAPIError) {
          if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 408) {
            throw error;
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === this.maxRetries - 1) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw new EvolutionAPIError(
      `Operation failed after ${this.maxRetries} attempts: ${lastError!.message}`,
      500,
      lastError
    );
  }

  /**
   * Fetch with timeout handling
   * @param url - URL to fetch
   * @param options - Fetch options
   * @returns Response
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new EvolutionAPIError(
          'Request timeout - Evolution API did not respond within 10 seconds',
          408
        );
      }
      throw new EvolutionAPIError(
        `Network error: ${error.message}`,
        500,
        error
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Gets headers for Evolution API requests
   * Includes apikey header as required
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
