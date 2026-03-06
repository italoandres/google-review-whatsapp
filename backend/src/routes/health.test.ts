/**
 * Health Check Routes Tests
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Unit tests for health check endpoints.
 * 
 * Validates: Requirements 12.1, 12.2
 */

import request from 'supertest';
import express from 'express';

// Mock dependencies
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseLimit = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: mockSupabaseFrom,
  },
}));

const mockGetConnectionState = jest.fn();

jest.mock('../lib/evolutionApiClient', () => ({
  EvolutionAPIClient: jest.fn().mockImplementation(() => ({
    getConnectionState: mockGetConnectionState,
  })),
}));

jest.mock('../config/environment', () => ({
  getConfig: jest.fn(() => ({
    evolutionApi: {
      url: 'https://test-evolution-api.com',
      globalApiKey: 'test-key',
    },
  })),
}));

// Import after mocks
import healthRoutes from './health';

describe('Health Check Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/health', healthRoutes);
    jest.clearAllMocks();

    // Setup default mock chain
    mockSupabaseLimit.mockResolvedValue({ data: [], error: null });
    mockSupabaseSelect.mockReturnValue({ limit: mockSupabaseLimit });
    mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect });
  });

  describe('GET /health', () => {
    it('should return 200 with ok status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it('should include uptime in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health/database', () => {
    it('should return 200 when database is connected', async () => {
      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
      expect(mockSupabaseFrom).toHaveBeenCalledWith('business');
    });

    it('should return 503 when database connection fails', async () => {
      mockSupabaseLimit.mockResolvedValue({
        data: null,
        error: new Error('Connection failed'),
      });

      const response = await request(app)
        .get('/health/database')
        .expect(503);

      expect(response.body.status).toBe('error');
      expect(response.body.database).toBe('disconnected');
      expect(response.body.error).toBe('Connection failed');
    });
  });

  describe('GET /health/evolution', () => {
    it('should return 200 when Evolution API is reachable (404 response)', async () => {
      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockGetConnectionState.mockRejectedValue(error);

      const response = await request(app)
        .get('/health/evolution')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.evolutionApi).toBe('connected');
      expect(response.body.url).toBe('https://test-evolution-api.com');
    });

    it('should return 200 when Evolution API responds successfully', async () => {
      mockGetConnectionState.mockResolvedValue({ state: 'open' });

      const response = await request(app)
        .get('/health/evolution')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.evolutionApi).toBe('connected');
    });

    it('should return 503 when Evolution API is unreachable', async () => {
      mockGetConnectionState.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .get('/health/evolution')
        .expect(503);

      expect(response.body.status).toBe('error');
      expect(response.body.evolutionApi).toBe('disconnected');
      expect(response.body.error).toBe('Network error');
    });
  });

  describe('GET /health/all', () => {
    it('should return 200 when all services are healthy', async () => {
      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockGetConnectionState.mockRejectedValue(error);

      const response = await request(app)
        .get('/health/all')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.checks.server.status).toBe('ok');
      expect(response.body.checks.database.status).toBe('ok');
      expect(response.body.checks.evolutionApi.status).toBe('ok');
    });

    it('should return 503 when database is down', async () => {
      mockSupabaseLimit.mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      });

      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockGetConnectionState.mockRejectedValue(error);

      const response = await request(app)
        .get('/health/all')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.database.status).toBe('error');
      expect(response.body.checks.evolutionApi.status).toBe('ok');
    });

    it('should return 503 when Evolution API is down', async () => {
      mockGetConnectionState.mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .get('/health/all')
        .expect(503);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.database.status).toBe('ok');
      expect(response.body.checks.evolutionApi.status).toBe('error');
    });

    it('should include uptime and timestamp', async () => {
      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockGetConnectionState.mockRejectedValue(error);

      const response = await request(app)
        .get('/health/all')
        .expect(200);

      expect(response.body.uptime).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
    });
  });
});
