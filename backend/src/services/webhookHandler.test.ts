import { WebhookHandler, WebhookPrettyPrinter, WebhookPayload } from './webhookHandler';
import * as signatureValidator from '../utils/signatureValidator';
import * as webhookLogModel from '../models/webhookLog';
import * as whatsappInstanceModel from '../models/whatsappInstance';
import * as connectionHistoryModel from '../models/connectionHistory';
import crypto from 'crypto';

// Mock Supabase first
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock dependencies
jest.mock('../utils/signatureValidator');
jest.mock('../models/webhookLog');
jest.mock('../models/whatsappInstance');
jest.mock('../models/connectionHistory');

describe('WebhookHandler', () => {
  let handler: WebhookHandler;
  const testSecret = 'test-webhook-secret';
  
  beforeEach(() => {
    handler = new WebhookHandler();
    jest.clearAllMocks();
  });
  
  describe('validateSignature', () => {
    it('should call signatureValidator with correct parameters', () => {
      const payload = '{"test": "data"}';
      const signature = 'test-signature';
      
      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(true);
      
      const result = handler.validateSignature(payload, signature, testSecret);
      
      expect(signatureValidator.validateSignature).toHaveBeenCalledWith(
        payload,
        signature,
        testSecret
      );
      expect(result).toBe(true);
    });
    
    it('should return false for invalid signature', () => {
      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(false);
      
      const result = handler.validateSignature('payload', 'bad-sig', testSecret);
      
      expect(result).toBe(false);
    });
  });
  
  describe('parseEvent', () => {
    it('should parse valid JSON payload', () => {
      const rawPayload = JSON.stringify({
        event: 'messages.upsert',
        instance: 'test-instance',
        data: { test: 'data' },
      });
      
      const result = handler.parseEvent(rawPayload);
      
      expect(result.event).toBe('messages.upsert');
      expect(result.instance).toBe('test-instance');
      expect(result.data).toEqual({ test: 'data' });
    });
    
    it('should throw error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => handler.parseEvent(invalidJson)).toThrow('Invalid JSON payload');
    });
    
    it('should throw error for missing event field', () => {
      const payload = JSON.stringify({
        instance: 'test-instance',
        data: {},
      });
      
      expect(() => handler.parseEvent(payload)).toThrow('Missing or invalid "event" field');
    });
    
    it('should throw error for missing instance field', () => {
      const payload = JSON.stringify({
        event: 'test.event',
        data: {},
      });
      
      expect(() => handler.parseEvent(payload)).toThrow('Missing or invalid "instance" field');
    });
    
    it('should throw error for missing data field', () => {
      const payload = JSON.stringify({
        event: 'test.event',
        instance: 'test-instance',
      });
      
      expect(() => handler.parseEvent(payload)).toThrow('Missing or invalid "data" field');
    });
    
    it('should accept payload with optional fields', () => {
      const payload = JSON.stringify({
        event: 'messages.upsert',
        instance: 'test-instance',
        data: { message: 'hello' },
        destination: 'dest',
        date_time: '2024-01-01T00:00:00Z',
        sender: 'sender@example.com',
      });
      
      const result = handler.parseEvent(payload);
      
      expect(result.destination).toBe('dest');
      expect(result.date_time).toBe('2024-01-01T00:00:00Z');
      expect(result.sender).toBe('sender@example.com');
    });
  });
  
  describe('handleEvent', () => {
    const mockPayload: WebhookPayload = {
      event: 'connection.update',
      instance: 'user-123',
      data: { state: 'open' },
    };
    
    beforeEach(() => {
      (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({
        id: 'log-123',
        instanceName: 'user-123',
        eventType: 'connection.update',
        payload: mockPayload,
        processed: false,
        createdAt: new Date().toISOString(),
      });
      
      (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
        id: 'instance-123',
        userId: 'user-123',
        instanceName: 'user-123',
        status: 'connecting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
      (connectionHistoryModel.insertConnectionHistory as jest.Mock).mockResolvedValue({});
    });
    
    it('should log webhook event', async () => {
      await handler.handleEvent(mockPayload, 'sig-123', true);
      
      expect(webhookLogModel.insertWebhookLog).toHaveBeenCalledWith({
        instanceName: 'user-123',
        eventType: 'connection.update',
        payload: mockPayload,
        signature: 'sig-123',
        signatureValid: true,
        processed: false,
      });
    });
    
    it('should handle connection.update event', async () => {
      const result = await handler.handleEvent(mockPayload);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Connection status updated');
    });
    
    it('should handle messages.upsert event', async () => {
      const messagePayload: WebhookPayload = {
        event: 'messages.upsert',
        instance: 'user-123',
        data: {
          key: { remoteJid: 'client@example.com', fromMe: false },
          pushName: 'Test User',
          message: { conversation: 'Hello' },
        },
      };
      
      const result = await handler.handleEvent(messagePayload);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Message processed');
      expect(result.clientId).toBe('client@example.com');
    });
    
    it('should handle unknown event types gracefully', async () => {
      const unknownPayload: WebhookPayload = {
        event: 'unknown.event',
        instance: 'user-123',
        data: {},
      };
      
      const result = await handler.handleEvent(unknownPayload);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('logged but not processed');
    });
    
    it('should throw error if instance not found', async () => {
      (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue(null);
      
      await expect(handler.handleEvent(mockPayload)).rejects.toThrow(
        'Instance user-123 not found in database'
      );
    });
  });
  
  describe('handleConnectionUpdate', () => {
    beforeEach(() => {
      (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
        id: 'instance-123',
        userId: 'user-123',
        instanceName: 'user-123',
        status: 'connecting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
      (connectionHistoryModel.insertConnectionHistory as jest.Mock).mockResolvedValue({});
      (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({});
    });
    
    it('should update status to connected for "open" state', async () => {
      const payload: WebhookPayload = {
        event: 'connection.update',
        instance: 'user-123',
        data: { state: 'open' },
      };
      
      await handler.handleEvent(payload);
      
      expect(whatsappInstanceModel.updateWhatsAppInstance).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          status: 'connected',
          connectedAt: expect.any(String),
          lastActivityAt: expect.any(String),
        })
      );
    });
    
    it('should update status to connecting for "connecting" state', async () => {
      const payload: WebhookPayload = {
        event: 'connection.update',
        instance: 'user-123',
        data: { state: 'connecting' },
      };
      
      await handler.handleEvent(payload);
      
      expect(whatsappInstanceModel.updateWhatsAppInstance).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          status: 'connecting',
        })
      );
    });
    
    it('should update status to disconnected for "close" state', async () => {
      const payload: WebhookPayload = {
        event: 'connection.update',
        instance: 'user-123',
        data: { state: 'close' },
      };
      
      await handler.handleEvent(payload);
      
      expect(whatsappInstanceModel.updateWhatsAppInstance).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          status: 'disconnected',
          disconnectedAt: expect.any(String),
        })
      );
    });
    
    it('should record connection event in history', async () => {
      const payload: WebhookPayload = {
        event: 'connection.update',
        instance: 'user-123',
        data: { state: 'open' },
        date_time: '2024-01-01T00:00:00Z',
      };
      
      await handler.handleEvent(payload);
      
      expect(connectionHistoryModel.insertConnectionHistory).toHaveBeenCalledWith({
        userId: 'user-123',
        instanceName: 'user-123',
        eventType: 'connected',
        status: 'connected',
        details: {
          state: 'open',
          timestamp: '2024-01-01T00:00:00Z',
        },
      });
    });
  });
  
  describe('handleMessageUpsert', () => {
    beforeEach(() => {
      (whatsappInstanceModel.getWhatsAppInstanceByName as jest.Mock).mockResolvedValue({
        id: 'instance-123',
        userId: 'user-123',
        instanceName: 'user-123',
        status: 'connected',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      (whatsappInstanceModel.updateWhatsAppInstance as jest.Mock).mockResolvedValue({});
      (webhookLogModel.insertWebhookLog as jest.Mock).mockResolvedValue({});
    });
    
    it('should update last activity timestamp', async () => {
      const payload: WebhookPayload = {
        event: 'messages.upsert',
        instance: 'user-123',
        data: {
          key: { remoteJid: 'client@example.com' },
          message: { conversation: 'Hello' },
        },
      };
      
      await handler.handleEvent(payload);
      
      expect(whatsappInstanceModel.updateWhatsAppInstance).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          lastActivityAt: expect.any(String),
        })
      );
    });
    
    it('should extract client ID from message', async () => {
      const payload: WebhookPayload = {
        event: 'messages.upsert',
        instance: 'user-123',
        data: {
          key: { remoteJid: 'client@example.com', fromMe: false },
          pushName: 'Test User',
        },
      };
      
      const result = await handler.handleEvent(payload);
      
      expect(result.clientId).toBe('client@example.com');
    });
    
    it('should handle messages without client ID', async () => {
      const payload: WebhookPayload = {
        event: 'messages.upsert',
        instance: 'user-123',
        data: {
          message: { conversation: 'Hello' },
        },
      };
      
      const result = await handler.handleEvent(payload);
      
      expect(result.success).toBe(true);
      expect(result.clientId).toBeUndefined();
    });
  });
});

describe('WebhookPrettyPrinter', () => {
  describe('format', () => {
    it('should format event as indented JSON', () => {
      const event: WebhookPayload = {
        event: 'messages.upsert',
        instance: 'user-123',
        data: { message: 'hello' },
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).toContain('"event": "messages.upsert"');
      expect(formatted).toContain('"instance": "user-123"');
      expect(formatted).toContain('  '); // Check for indentation
    });
    
    it('should omit sensitive fields', () => {
      const event: WebhookPayload = {
        event: 'test.event',
        instance: 'user-123',
        data: {},
        apikey: 'secret-api-key',
        server_url: 'https://example.com',
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).toContain('[REDACTED]');
      expect(formatted).not.toContain('secret-api-key');
    });
    
    it('should omit nested sensitive fields', () => {
      const event: WebhookPayload = {
        event: 'test.event',
        instance: 'user-123',
        data: {
          token: 'secret-token',
          message: 'hello',
        },
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).toContain('[REDACTED]');
      expect(formatted).not.toContain('secret-token');
      expect(formatted).toContain('hello'); // Non-sensitive data preserved
    });
    
    it('should truncate large payloads', () => {
      const largeData = 'x'.repeat(2000);
      const event: WebhookPayload = {
        event: 'test.event',
        instance: 'user-123',
        data: { large: largeData },
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted.length).toBeLessThanOrEqual(1024 + 20); // 1KB + truncation message
      expect(formatted).toContain('[truncated]');
    });
    
    it('should preserve structure for small payloads', () => {
      const event: WebhookPayload = {
        event: 'test.event',
        instance: 'user-123',
        data: {
          remoteJid: 'test@example.com', // Changed from nested key
          message: 'hello',
        },
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).not.toContain('[truncated]');
      expect(formatted).toContain('test@example.com');
      expect(formatted).toContain('hello');
    });
    
    it('should handle arrays in payload', () => {
      const event: WebhookPayload = {
        event: 'test.event',
        instance: 'user-123',
        data: {
          items: [
            { id: 1, token: 'secret1' },
            { id: 2, token: 'secret2' },
          ],
        },
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).toContain('[REDACTED]');
      expect(formatted).not.toContain('secret1');
      expect(formatted).not.toContain('secret2');
      expect(formatted).toContain('"id": 1');
      expect(formatted).toContain('"id": 2');
    });
    
    it('should handle null and undefined values', () => {
      const event: WebhookPayload = {
        event: 'test.event',
        instance: 'user-123',
        data: {
          nullValue: null,
          undefinedValue: undefined,
        },
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).toContain('null');
    });
    
    it('should redact fields with "password" in name', () => {
      const event: any = {
        event: 'test.event',
        instance: 'user-123',
        data: {
          userPassword: 'secret123',
          message: 'hello',
        },
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).toContain('[REDACTED]');
      expect(formatted).not.toContain('secret123');
    });
    
    it('should redact fields with "authorization" in name', () => {
      const event: any = {
        event: 'test.event',
        instance: 'user-123',
        data: {},
        authorization: 'Bearer token123',
      };
      
      const formatted = WebhookPrettyPrinter.format(event);
      
      expect(formatted).toContain('[REDACTED]');
      expect(formatted).not.toContain('token123');
    });
  });
});
