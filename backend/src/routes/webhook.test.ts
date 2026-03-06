/**
 * Webhook Routes Tests
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Unit tests for webhook endpoint receiving Evolution API events.
 * Tests signature validation, rate limiting, and event processing.
 * 
 * Validates: Requirements 5.6, 19.1, 19.2, 19.6, 20.3, 20.4
 */

import request from 'supertest';
import express from 'express';
import crypto from 'crypto';

// Mock dependencies before importing
const mockValidateSignature = jest.fn();
const mockParseEvent = jest.fn();
const mockHandleEvent = jest.fn();
const mockInsertWebhookLog = jest.fn();
const mockIsRateLimited = jest.fn();
const mockGetRetryAfter = jest.fn();

jest.mock('../services/webhookHandler', () => ({
  WebhookHandler: jest.fn().mockImplementation(() => ({
    validateSignature: mockValidateSignature,
    parseEvent: mockParseEvent,
    handleEvent: mockHandleEvent,
  })),
}));

jest.mock('../models/webhookLog', () => ({
  insertWebhookLog: mockInsertWebhookLog,
}));

jest.mock('../utils/rateLimiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    isRateLimited: mockIsRateLimited,
    getRetryAfter: mockGetRetryAfter,
  })),
  createRateLimitKey: jest.fn((instanceName: string, endpoint?: string) => 
    endpoint ? `${instanceName}:${endpoint}` : instanceName
  ),
  RateLimitConfigs: {
    WEBHOOK_EVENTS: {
      maxRequests: 100,
      windowMs: 60000,
    },
  },
}));

jest.mock('../config/environment', () => ({
  getConfig: jest.fn(() => ({
    security: {
      webhookSecret: 'test-webhook-secret',
    },
  })),
}));

// Import after mocks
import webhookRoutes from './webhook';

describe('Webhook Routes', () => {
  let app: express.Application;
  const mockInstanceName = 'user-test-123';
  const mockWebhookSecret = 'test-webhook-secret';

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/webhooks', webhookRoutes);

    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    mockIsRateLimited.mockReturnValue(false);
    mockInsertWebhookLog.mockResolvedValue(undefined);
  });

  /**
   * Helper function to generate valid HMAC-SHA256 signature
   */
  function generateSignature(payload: any): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', mockWebhookSecret);
    hmac.update(payloadString);
    return hmac.digest('hex');
  }

  describe('POST /api/webhooks/evolution', () => {
    const validPayload = {
      event: 'connection.update',
      instance: mockInstanceName,
      data: {
        state: 'open',
      },
      date_time: new Date().toISOString(),
    };

    describe('Signature validation', () => {
      it('should return 401 when signature header is missing', async () => {
        const response = await request(app)
          .post('/api/webhooks/evolution')
          .send(validPayload)
          .expect(401);

        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(response.body.error.message).toBe('Missing webhook signature');
        
        // Should log the attempt
        expect(mockInsertWebhookLog).toHaveBeenCalledWith(
          expect.objectContaining({
            instanceName: 'unknown',
            eventType: 'signature_missing',
            signatureValid: false,
            errorMessage: 'Missing x-evolution-signature header',
          })
        );
      });

      it('should return 401 when signature is invalid', async () => {
        mockValidateSignature.mockReturnValue(false);

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'invalid-signature')
          .send(validPayload)
          .expect(401);

        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(response.body.error.message).toBe('Invalid webhook signature');
        
        // Should validate signature
        expect(mockValidateSignature).toHaveBeenCalledWith(
          JSON.stringify(validPayload),
          'invalid-signature',
          mockWebhookSecret
        );
        
        // Should log the attempt
        expect(mockInsertWebhookLog).toHaveBeenCalledWith(
          expect.objectContaining({
            instanceName: mockInstanceName,
            signature: 'invalid-signature',
            signatureValid: false,
            errorMessage: 'Invalid webhook signature',
          })
        );
      });

      it('should accept valid signature', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockHandleEvent.mockResolvedValue({
          success: true,
          message: 'Event processed',
        });

        const validSignature = generateSignature(validPayload);

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', validSignature)
          .send(validPayload)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockValidateSignature).toHaveBeenCalledWith(
          JSON.stringify(validPayload),
          validSignature,
          mockWebhookSecret
        );
      });
    });

    describe('Payload validation', () => {
      it('should return 400 when payload is invalid JSON', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockImplementation(() => {
          throw new Error('Invalid JSON payload');
        });

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Invalid JSON payload');
        
        // Should log the error
        expect(mockInsertWebhookLog).toHaveBeenCalledWith(
          expect.objectContaining({
            signatureValid: true,
            processed: false,
            errorMessage: 'Invalid JSON payload',
          })
        );
      });

      it('should return 400 when required fields are missing', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockImplementation(() => {
          throw new Error('Missing or invalid "event" field');
        });

        const invalidPayload = {
          instance: mockInstanceName,
          data: {},
        };

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(invalidPayload)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toContain('event');
      });
    });

    describe('Rate limiting', () => {
      it('should return 429 when rate limit exceeded', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockIsRateLimited.mockReturnValue(true);
        mockGetRetryAfter.mockReturnValue(30);

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(429);

        expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(response.body.error.details.retryAfter).toBe(30);
        expect(response.body.error.details.limit).toBe(100);
        expect(response.body.error.details.window).toBe('1 minute');
        expect(response.headers['retry-after']).toBe('30');
        
        // Should check rate limit with correct key
        expect(mockIsRateLimited).toHaveBeenCalledWith(
          `${mockInstanceName}:webhook`,
          100,
          60000
        );
        
        // Should log the rate limit violation
        expect(mockInsertWebhookLog).toHaveBeenCalledWith(
          expect.objectContaining({
            instanceName: mockInstanceName,
            signatureValid: true,
            processed: false,
            errorMessage: 'Rate limit exceeded',
          })
        );
      });

      it('should apply rate limiting per instance', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockHandleEvent.mockResolvedValue({
          success: true,
          message: 'Event processed',
        });

        await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(200);

        // Should use instance name as rate limit key
        expect(mockIsRateLimited).toHaveBeenCalledWith(
          `${mockInstanceName}:webhook`,
          100,
          60000
        );
      });
    });

    describe('Event processing', () => {
      it('should process connection.update event successfully', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockHandleEvent.mockResolvedValue({
          success: true,
          message: 'Connection status updated to connected',
        });

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Connection status updated to connected',
        });

        expect(mockHandleEvent).toHaveBeenCalledWith(
          validPayload,
          'valid-signature',
          true
        );
      });

      it('should process messages.upsert event successfully', async () => {
        const messagePayload = {
          event: 'messages.upsert',
          instance: mockInstanceName,
          data: {
            key: {
              remoteJid: '5511999999999@s.whatsapp.net',
              fromMe: false,
            },
            pushName: 'Test User',
            message: {
              conversation: 'Hello',
            },
          },
          date_time: new Date().toISOString(),
        };

        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(messagePayload);
        mockHandleEvent.mockResolvedValue({
          success: true,
          message: 'Message processed',
          clientId: '5511999999999@s.whatsapp.net',
        });

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(messagePayload)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Message processed');
      });

      it('should return 500 when event processing fails', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockHandleEvent.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(500);

        expect(response.body.error.code).toBe('INTERNAL_ERROR');
        expect(response.body.error.message).toBe('Failed to process webhook event');
      });
    });

    describe('Logging', () => {
      it('should log successful webhook processing', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockHandleEvent.mockResolvedValue({
          success: true,
          message: 'Event processed',
        });

        // Spy on console.info
        const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

        await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(200);

        expect(consoleInfoSpy).toHaveBeenCalledWith(
          'Webhook event processed',
          expect.objectContaining({
            instanceName: mockInstanceName,
            eventType: 'connection.update',
            success: true,
          })
        );

        consoleInfoSpy.mockRestore();
      });

      it('should log invalid signature attempts', async () => {
        mockValidateSignature.mockReturnValue(false);

        // Spy on console.warn
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'invalid-signature')
          .send(validPayload)
          .expect(401);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Invalid webhook signature attempt',
          expect.objectContaining({
            instanceName: mockInstanceName,
          })
        );

        consoleWarnSpy.mockRestore();
      });

      it('should log processing errors', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockHandleEvent.mockRejectedValue(new Error('Processing error'));

        // Spy on console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(500);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Webhook processing error',
          expect.objectContaining({
            instanceName: mockInstanceName,
            error: 'Processing error',
          })
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe('Error response format', () => {
      it('should return consistent error format', async () => {
        const response = await request(app)
          .post('/api/webhooks/evolution')
          .send(validPayload)
          .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error).toHaveProperty('timestamp');
      });

      it('should include timestamp in all error responses', async () => {
        mockValidateSignature.mockReturnValue(false);

        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'invalid')
          .send(validPayload)
          .expect(401);

        expect(response.body.error.timestamp).toBeDefined();
        expect(new Date(response.body.error.timestamp).getTime()).not.toBeNaN();
      });
    });

    describe('Performance', () => {
      it('should include processing duration in logs', async () => {
        mockValidateSignature.mockReturnValue(true);
        mockParseEvent.mockReturnValue(validPayload);
        mockHandleEvent.mockResolvedValue({
          success: true,
          message: 'Event processed',
        });

        const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

        await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(validPayload)
          .expect(200);

        expect(consoleInfoSpy).toHaveBeenCalledWith(
          'Webhook event processed',
          expect.objectContaining({
            duration: expect.stringMatching(/\d+ms/),
          })
        );

        consoleInfoSpy.mockRestore();
      });
    });
  });
});
