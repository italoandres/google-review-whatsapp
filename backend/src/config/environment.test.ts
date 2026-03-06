/**
 * Unit Tests for Environment Configuration
 * Feature: whatsapp-multi-tenant-auto-instance
 */

import { loadAndValidateConfig, ConfigurationError } from './environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadAndValidateConfig', () => {
    it('should load valid configuration successfully', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';

      const config = loadAndValidateConfig();

      expect(config.supabase.url).toBe('https://test.supabase.co');
      expect(config.evolutionApi.url).toBe('https://evolution-api.example.com');
      expect(config.backend.url).toBe('https://backend.example.com');
      expect(config.security.encryptionKey).toBe('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    });

    it('should throw ConfigurationError when EVOLUTION_API_URL is missing', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      // EVOLUTION_API_URL missing
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/EVOLUTION_API_URL/);
    });

    it('should throw ConfigurationError when EVOLUTION_API_GLOBAL_KEY is missing', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      // EVOLUTION_API_GLOBAL_KEY missing
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/EVOLUTION_API_GLOBAL_KEY/);
    });

    it('should throw ConfigurationError when BACKEND_URL is missing', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      // BACKEND_URL missing
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/BACKEND_URL/);
    });

    it('should throw ConfigurationError when WEBHOOK_SECRET is missing', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      // WEBHOOK_SECRET missing

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/WEBHOOK_SECRET/);
    });

    it('should throw ConfigurationError when EVOLUTION_API_URL is invalid', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'not-a-valid-url';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/valid URL/);
    });

    it('should throw ConfigurationError when ENCRYPTION_KEY is too short', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = 'too-short';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/64 hex characters/);
    });

    it('should throw ConfigurationError when ENCRYPTION_KEY contains non-hex characters', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/hexadecimal characters/);
    });

    it('should use default values for optional configuration', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';
      // Optional variables not set

      const config = loadAndValidateConfig();

      expect(config.app.port).toBe(3000);
      expect(config.rateLimit.windowMs).toBe(600000);
      expect(config.rateLimit.maxRequests).toBe(3);
      expect(config.qrCode.expirySeconds).toBe(60);
      expect(config.qrCode.maxPollingAttempts).toBe(60);
      expect(config.qrCode.pollingIntervalMs).toBe(3000);
    });

    it('should use custom values for optional configuration when provided', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';
      process.env.PORT = '4000';
      process.env.RATE_LIMIT_WINDOW_MS = '300000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '5';
      process.env.QR_CODE_EXPIRY_SECONDS = '120';

      const config = loadAndValidateConfig();

      expect(config.app.port).toBe(4000);
      expect(config.rateLimit.windowMs).toBe(300000);
      expect(config.rateLimit.maxRequests).toBe(5);
      expect(config.qrCode.expirySeconds).toBe(120);
    });

    it('should throw ConfigurationError when numeric env var is not a number', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.EVOLUTION_API_URL = 'https://evolution-api.example.com';
      process.env.EVOLUTION_API_GLOBAL_KEY = 'test-global-key';
      process.env.BACKEND_URL = 'https://backend.example.com';
      process.env.WEBHOOK_SECRET = 'test-webhook-secret';
      process.env.PORT = 'not-a-number';

      expect(() => loadAndValidateConfig()).toThrow(ConfigurationError);
      expect(() => loadAndValidateConfig()).toThrow(/must be a valid number/);
    });

    it('should trim whitespace from environment variables', () => {
      process.env.SUPABASE_URL = '  https://test.supabase.co  ';
      process.env.SUPABASE_ANON_KEY = '  test-anon-key  ';
      process.env.SUPABASE_SERVICE_KEY = '  test-service-key  ';
      process.env.ENCRYPTION_KEY = '  0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef  ';
      process.env.EVOLUTION_API_URL = '  https://evolution-api.example.com  ';
      process.env.EVOLUTION_API_GLOBAL_KEY = '  test-global-key  ';
      process.env.BACKEND_URL = '  https://backend.example.com  ';
      process.env.WEBHOOK_SECRET = '  test-webhook-secret  ';

      const config = loadAndValidateConfig();

      expect(config.supabase.url).toBe('https://test.supabase.co');
      expect(config.evolutionApi.globalKey).toBe('test-global-key');
      expect(config.security.webhookSecret).toBe('test-webhook-secret');
    });
  });
});
