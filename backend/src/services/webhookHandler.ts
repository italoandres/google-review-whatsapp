import { validateSignature } from '../utils/signatureValidator';
import { insertWebhookLog } from '../models/webhookLog';
import { 
  getWhatsAppInstanceByName, 
  updateWhatsAppInstance 
} from '../models/whatsappInstance';
import { insertConnectionHistory } from '../models/connectionHistory';

/**
 * Webhook event payload structure from Evolution API
 */
export interface WebhookPayload {
  event: string;
  instance: string;
  data: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
    };
    pushName?: string;
    message?: any;
    state?: string; // For connection.update events
    [key: string]: any; // Allow additional fields
  };
  destination?: string;
  date_time?: string;
  sender?: string;
  server_url?: string;
  apikey?: string;
  [key: string]: any; // Allow additional fields at root level
}

/**
 * Result of webhook processing
 */
export interface WebhookResult {
  success: boolean;
  message: string;
  clientId?: string;
}

/**
 * WebhookHandler service for processing Evolution API webhook events
 */
export class WebhookHandler {
  /**
   * Validate webhook signature using HMAC-SHA256
   * 
   * @param payload - Raw payload string
   * @param signature - Signature from webhook header
   * @param secret - Webhook secret for validation
   * @returns true if signature is valid
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    return validateSignature(payload, signature, secret);
  }

  /**
   * Parse and validate webhook event JSON
   * 
   * @param rawPayload - Raw JSON string
   * @returns Parsed webhook payload
   * @throws Error if JSON is invalid or schema validation fails
   */
  parseEvent(rawPayload: string): WebhookPayload {
    try {
      const payload = JSON.parse(rawPayload);
      
      // Validate required fields
      if (!payload.event || typeof payload.event !== 'string') {
        throw new Error('Missing or invalid "event" field');
      }
      
      if (!payload.instance || typeof payload.instance !== 'string') {
        throw new Error('Missing or invalid "instance" field');
      }
      
      if (!payload.data || typeof payload.data !== 'object') {
        throw new Error('Missing or invalid "data" field');
      }
      
      return payload as WebhookPayload;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON payload');
      }
      throw error;
    }
  }

  /**
   * Process webhook event
   * 
   * @param payload - Parsed webhook payload
   * @param signature - Signature for logging
   * @param signatureValid - Whether signature was valid
   * @returns Processing result
   */
  async handleEvent(
    payload: WebhookPayload,
    signature?: string,
    signatureValid?: boolean
  ): Promise<WebhookResult> {
    // Log the webhook event
    await insertWebhookLog({
      instanceName: payload.instance,
      eventType: payload.event,
      payload: payload as any,
      signature,
      signatureValid,
      processed: false,
    });

    try {
      // Route to appropriate handler based on event type
      switch (payload.event) {
        case 'connection.update':
          return await this.handleConnectionUpdate(payload);
        
        case 'messages.upsert':
          return await this.handleMessageUpsert(payload);
        
        default:
          // Log unknown event types but don't fail
          console.warn(`Unknown webhook event type: ${payload.event}`);
          return {
            success: true,
            message: `Event type ${payload.event} logged but not processed`,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update webhook log with error
      await insertWebhookLog({
        instanceName: payload.instance,
        eventType: payload.event,
        payload: payload as any,
        signature,
        signatureValid,
        processed: true,
        errorMessage,
      });
      
      throw error;
    }
  }

  /**
   * Handle connection.update event
   * Updates instance status in database
   * 
   * @param payload - Webhook payload
   * @returns Processing result
   */
  private async handleConnectionUpdate(payload: WebhookPayload): Promise<WebhookResult> {
    const instanceName = payload.instance;
    const state = payload.data.state;
    
    // Get instance from database
    const instance = await getWhatsAppInstanceByName(instanceName);
    
    if (!instance) {
      throw new Error(`Instance ${instanceName} not found in database`);
    }
    
    // Map Evolution API state to our status
    let status: 'disconnected' | 'connecting' | 'connected';
    let eventType: 'connected' | 'disconnected';
    
    switch (state) {
      case 'open':
        status = 'connected';
        eventType = 'connected';
        break;
      case 'connecting':
        status = 'connecting';
        eventType = 'connected'; // Still considered a connection event
        break;
      case 'close':
      default:
        status = 'disconnected';
        eventType = 'disconnected';
        break;
    }
    
    // Update instance status
    const updateData: any = {
      status,
      lastActivityAt: new Date().toISOString(),
    };
    
    if (status === 'connected') {
      updateData.connectedAt = new Date().toISOString();
    } else if (status === 'disconnected') {
      updateData.disconnectedAt = new Date().toISOString();
    }
    
    await updateWhatsAppInstance(instance.userId, updateData);
    
    // Record in connection history
    await insertConnectionHistory({
      userId: instance.userId,
      instanceName,
      eventType,
      status,
      details: {
        state,
        timestamp: payload.date_time || new Date().toISOString(),
      },
    });
    
    return {
      success: true,
      message: `Connection status updated to ${status}`,
    };
  }

  /**
   * Handle messages.upsert event
   * Logs message received event
   * 
   * @param payload - Webhook payload
   * @returns Processing result
   */
  private async handleMessageUpsert(payload: WebhookPayload): Promise<WebhookResult> {
    const instanceName = payload.instance;
    const messageData = payload.data;
    
    // Get instance from database
    const instance = await getWhatsAppInstanceByName(instanceName);
    
    if (!instance) {
      throw new Error(`Instance ${instanceName} not found in database`);
    }
    
    // Update last activity
    await updateWhatsAppInstance(instance.userId, {
      lastActivityAt: new Date().toISOString(),
    });
    
    // Extract client ID from message
    const clientId = messageData.key?.remoteJid;
    
    // Log message processing (webhook_logs table already has the full payload)
    console.info('Message received', {
      instanceName,
      clientId,
      fromMe: messageData.key?.fromMe,
      pushName: messageData.pushName,
    });
    
    return {
      success: true,
      message: 'Message processed',
      clientId,
    };
  }
}

/**
 * Pretty printer for webhook events
 * Formats events for logging with sensitive data omission and truncation
 */
export class WebhookPrettyPrinter {
  private static readonly SENSITIVE_FIELDS = [
    'apikey',
    'token',
    'key',
    'password',
    'secret',
    'authorization',
    'auth',
  ];
  
  private static readonly MAX_PAYLOAD_SIZE = 1024; // 1KB
  
  /**
   * Format webhook event for logging
   * 
   * @param event - Webhook event payload
   * @returns Formatted string for logging
   */
  static format(event: WebhookPayload): string {
    // Create a copy to avoid mutating original
    const sanitized = this.omitSensitiveData(event);
    
    // Convert to JSON with indentation
    let formatted = JSON.stringify(sanitized, null, 2);
    
    // Truncate if too large
    if (formatted.length > this.MAX_PAYLOAD_SIZE) {
      formatted = formatted.substring(0, this.MAX_PAYLOAD_SIZE) + '\n... [truncated]';
    }
    
    return formatted;
  }
  
  /**
   * Omit sensitive fields from event
   * 
   * @param obj - Object to sanitize
   * @returns Sanitized object
   */
  private static omitSensitiveData(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.omitSensitiveData(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Check if field name contains sensitive keywords
        const isSensitive = this.SENSITIVE_FIELDS.some(
          field => key.toLowerCase().includes(field.toLowerCase())
        );
        
        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.omitSensitiveData(value);
        }
      }
      
      return sanitized;
    }
    
    return obj;
  }
}
