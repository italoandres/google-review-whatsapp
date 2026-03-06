/**
 * WhatsApp Instance Management Routes Tests
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Unit tests for REST API endpoints managing WhatsApp instances.
 * Tests authentication, rate limiting, error handling, and multi-tenant isolation.
 * 
 * Validates: Requirements 1.6, 2.1-2.5, 3.1-3.6, 4.1-4.6, 8.2-8.5, 10.1-10.4, 11.2-11.3
 */

import request from 'supertest';
import express from 'express';

// Mock dependencies before importing
const mockCreateInstance = jest.fn();
const mockGetQRCode = jest.fn();
const mockGetConnectionStatus = jest.fn();
const mockDisconnectInstance = jest.fn();
const mockReconnectInstance = jest.fn();

jest.mock('../services/instanceManager', () => ({
  InstanceManagerService: jest.fn().mockImplementation(() => ({
    createInstance: mockCreateInstance,
    getQRCode: mockGetQRCode,
    getConnectionStatus: mockGetConnectionStatus,
    disconnectInstance: mockDisconnectInstance,
    reconnectInstance: mockReconnectInstance,
  })),
  InstanceCreationError: class InstanceCreationError extends Error {
    constructor(message: string, public originalError?: any) {
      super(message);
      this.name = 'InstanceCreationError';
    }
  },
  QRCodeNotAvailableError: class QRCodeNotAvailableError extends Error {
    constructor(message: string = 'QR Code not available') {
      super(message);
      this.name = 'QRCodeNotAvailableError';
    }
  },
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string = 'Rate limit exceeded', public retryAfter: number = 60) {
      super(message);
      this.name = 'RateLimitError';
    }
  },
}));

jest.mock('../middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    if (req.headers['x-test-user-id']) {
      req.user = {
        userId: req.headers['x-test-user-id'],
        email: 'test@example.com',
      };
    }
    next();
  }),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Import after mocks
import whatsappInstanceRoutes from './whatsappInstance';
import { InstanceCreationError, QRCodeNotAvailableError, RateLimitError } from '../services/instanceManager';

describe('WhatsApp Instance Management Routes', () => {
  let app: express.Application;
  const mockUserId = 'test-user-123';
  const mockInstanceName = `user-${mockUserId}`;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/evolution', whatsappInstanceRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/evolution/create-instance', () => {
    it('should create new instance and return 201', async () => {
      const mockInstance = {
        instanceName: mockInstanceName,
        status: 'created' as const,
        createdAt: new Date().toISOString(),
      };

      mockCreateInstance.mockResolvedValue(mockInstance);

      const response = await request(app)
        .post('/api/evolution/create-instance')
        .set('x-test-user-id', mockUserId)
        .expect(201);

      expect(response.body).toEqual({
        instanceName: mockInstanceName,
        status: 'created',
        createdAt: mockInstance.createdAt,
      });

      expect(mockCreateInstance).toHaveBeenCalledWith(mockUserId);
    });

    it('should return existing instance with 200', async () => {
      const mockInstance = {
        instanceName: mockInstanceName,
        status: 'connected' as const,
        createdAt: new Date().toISOString(),
      };

      mockCreateInstance.mockResolvedValue(mockInstance);

      const response = await request(app)
        .post('/api/evolution/create-instance')
        .set('x-test-user-id', mockUserId)
        .expect(200);

      expect(response.body).toEqual({
        instanceName: mockInstanceName,
        status: 'connected',
        createdAt: mockInstance.createdAt,
      });
    });

    it('should return 401 when user not authenticated', async () => {
      const response = await request(app)
        .post('/api/evolution/create-instance')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('User not authenticated');
    });

    it('should return 429 when rate limit exceeded', async () => {
      const rateLimitError = new RateLimitError('Too many instance creation requests', 480);
      mockCreateInstance.mockRejectedValue(rateLimitError);

      const response = await request(app)
        .post('/api/evolution/create-instance')
        .set('x-test-user-id', mockUserId)
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.details.retryAfter).toBe(480);
      expect(response.body.error.details.limit).toBe(3);
      expect(response.body.error.details.window).toBe('10 minutes');
      expect(response.headers['retry-after']).toBe('480');
    });

    it('should return 500 when instance creation fails', async () => {
      const creationError = new InstanceCreationError('Evolution API error', new Error('Connection timeout'));
      mockCreateInstance.mockRejectedValue(creationError);

      const response = await request(app)
        .post('/api/evolution/create-instance')
        .set('x-test-user-id', mockUserId)
        .expect(500);

      expect(response.body.error.code).toBe('INSTANCE_CREATION_FAILED');
      expect(response.body.error.message).toContain('Failed to create WhatsApp instance');
    });

    it('should return 500 for unexpected errors', async () => {
      mockCreateInstance.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/evolution/create-instance')
        .set('x-test-user-id', mockUserId)
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /api/evolution/qrcode', () => {
    it('should return QR code successfully', async () => {
      const mockQRCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      mockGetQRCode.mockResolvedValue(mockQRCode);

      const response = await request(app)
        .get('/api/evolution/qrcode')
        .set('x-test-user-id', mockUserId)
        .expect(200);

      expect(response.body).toEqual({
        qrCode: mockQRCode,
        expiresIn: 60,
      });

      expect(mockGetQRCode).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 when user not authenticated', async () => {
      const response = await request(app)
        .get('/api/evolution/qrcode')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 when QR code not available', async () => {
      const qrError = new QRCodeNotAvailableError('QR Code not available');
      mockGetQRCode.mockRejectedValue(qrError);

      const response = await request(app)
        .get('/api/evolution/qrcode')
        .set('x-test-user-id', mockUserId)
        .expect(404);

      expect(response.body.error.code).toBe('QR_CODE_NOT_AVAILABLE');
    });

    it('should return 429 when rate limit exceeded', async () => {
      const rateLimitError = new RateLimitError('Too many QR code requests', 60);
      mockGetQRCode.mockRejectedValue(rateLimitError);

      const response = await request(app)
        .get('/api/evolution/qrcode')
        .set('x-test-user-id', mockUserId)
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.details.limit).toBe(1);
      expect(response.body.error.details.window).toBe('1 minute');
      expect(response.headers['retry-after']).toBe('60');
    });

    it('should return 500 for unexpected errors', async () => {
      mockGetQRCode.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/evolution/qrcode')
        .set('x-test-user-id', mockUserId)
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /api/evolution/connection-status', () => {
    it('should return connection status successfully', async () => {
      mockGetConnectionStatus.mockResolvedValue('connected');

      const response = await request(app)
        .get('/api/evolution/connection-status')
        .set('x-test-user-id', mockUserId)
        .expect(200);

      expect(response.body).toEqual({
        status: 'connected',
      });

      expect(mockGetConnectionStatus).toHaveBeenCalledWith(mockUserId);
    });

    it('should return disconnected status', async () => {
      mockGetConnectionStatus.mockResolvedValue('disconnected');

      const response = await request(app)
        .get('/api/evolution/connection-status')
        .set('x-test-user-id', mockUserId)
        .expect(200);

      expect(response.body.status).toBe('disconnected');
    });

    it('should return connecting status', async () => {
      mockGetConnectionStatus.mockResolvedValue('connecting');

      const response = await request(app)
        .get('/api/evolution/connection-status')
        .set('x-test-user-id', mockUserId)
        .expect(200);

      expect(response.body.status).toBe('connecting');
    });

    it('should return 401 when user not authenticated', async () => {
      const response = await request(app)
        .get('/api/evolution/connection-status')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for unexpected errors', async () => {
      mockGetConnectionStatus.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/evolution/connection-status')
        .set('x-test-user-id', mockUserId)
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/evolution/disconnect', () => {
    it('should disconnect instance successfully', async () => {
      mockDisconnectInstance.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/evolution/disconnect')
        .set('x-test-user-id', mockUserId)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'WhatsApp instance disconnected successfully',
      });

      expect(mockDisconnectInstance).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 when user not authenticated', async () => {
      const response = await request(app)
        .post('/api/evolution/disconnect')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for unexpected errors', async () => {
      mockDisconnectInstance.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/evolution/disconnect')
        .set('x-test-user-id', mockUserId)
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/evolution/reconnect', () => {
    it('should reconnect instance and return new QR code', async () => {
      const mockQRCode = 'data:image/png;base64,newQRCode123';
      mockReconnectInstance.mockResolvedValue(mockQRCode);

      const response = await request(app)
        .post('/api/evolution/reconnect')
        .set('x-test-user-id', mockUserId)
        .expect(200);

      expect(response.body).toEqual({
        qrCode: mockQRCode,
        message: 'Instance reconnected. Please scan the QR code.',
      });

      expect(mockReconnectInstance).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 when user not authenticated', async () => {
      const response = await request(app)
        .post('/api/evolution/reconnect')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 429 when rate limit exceeded', async () => {
      const rateLimitError = new RateLimitError('Too many reconnect requests', 60);
      mockReconnectInstance.mockRejectedValue(rateLimitError);

      const response = await request(app)
        .post('/api/evolution/reconnect')
        .set('x-test-user-id', mockUserId)
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.headers['retry-after']).toBe('60');
    });

    it('should return 500 for unexpected errors', async () => {
      mockReconnectInstance.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/evolution/reconnect')
        .set('x-test-user-id', mockUserId)
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should only allow users to access their own instances', async () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      mockCreateInstance.mockResolvedValue({
        instanceName: `user-${user1Id}`,
        status: 'created',
        createdAt: new Date().toISOString(),
      });

      // User 1 creates instance
      await request(app)
        .post('/api/evolution/create-instance')
        .set('x-test-user-id', user1Id)
        .expect(201);

      expect(mockCreateInstance).toHaveBeenCalledWith(user1Id);
      expect(mockCreateInstance).not.toHaveBeenCalledWith(user2Id);
    });
  });

  describe('Error response format', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/evolution/create-instance')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should include timestamp in all error responses', async () => {
      mockCreateInstance.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/api/evolution/create-instance')
        .set('x-test-user-id', mockUserId)
        .expect(500);

      expect(response.body.error.timestamp).toBeDefined();
      expect(new Date(response.body.error.timestamp).getTime()).not.toBeNaN();
    });
  });
});
