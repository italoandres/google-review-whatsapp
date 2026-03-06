import request from 'supertest';
import express from 'express';
import evolutionRoutes from './evolution';
import * as evolutionConfig from '../models/evolutionConfig';
import * as signatureValidator from '../utils/signatureValidator';
import * as contactExtractor from '../utils/contactExtractor';
import * as phoneNormalizer from '../utils/phoneNormalizer';
import * as clientModel from '../models/client';

// Mock dependencies
jest.mock('../models/evolutionConfig');
jest.mock('../utils/signatureValidator');
jest.mock('../utils/contactExtractor');
jest.mock('../utils/phoneNormalizer');
jest.mock('../models/client');
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('Evolution Webhook Endpoint', () => {
  let app: express.Application;
  let supabaseMock: any;

  beforeEach(() => {
    // Reset modules to clear rate limiter
    jest.resetModules();
    
    // Create fresh Supabase mock
    supabaseMock = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    };

    // Mock Supabase module
    jest.doMock('../lib/supabase', () => ({
      supabase: supabaseMock
    }));

    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Re-import the routes to get a fresh instance with new mocks
    const freshEvolutionRoutes = require('./evolution').default;
    app.use('/api', freshEvolutionRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/webhooks/evolution - Valid webhook processing', () => {
    it('should successfully process valid webhook and create client', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: 'John Doe',
          message: { conversation: 'Hello' }
        }
      };

      // Configure Supabase mock to return config
      supabaseMock.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      // Mock signature validation
      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(true);

      // Mock contact extraction
      (contactExtractor.extractContact as jest.Mock).mockReturnValue({
        phone: '5511999999999',
        name: 'John Doe'
      });

      // Mock phone normalization
      (phoneNormalizer.normalizePhone as jest.Mock).mockReturnValue('+5511999999999');

      // Mock duplicate check
      (clientModel.checkPhoneExists as jest.Mock).mockResolvedValue(false);

      // Mock client creation
      (clientModel.createAutoImportedClient as jest.Mock).mockResolvedValue({
        id: 'client-123',
        userId: 'user-123',
        phone: '+5511999999999',
        name: 'John Doe',
        importSource: 'auto-imported'
      });

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'valid-signature')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        clientId: 'client-123'
      });

      expect(signatureValidator.validateSignature).toHaveBeenCalledWith(
        JSON.stringify(payload),
        'valid-signature',
        'test-secret'
      );
      expect(contactExtractor.extractContact).toHaveBeenCalledWith(payload);
      expect(phoneNormalizer.normalizePhone).toHaveBeenCalledWith('5511999999999');
      expect(clientModel.checkPhoneExists).toHaveBeenCalledWith('user-123', '+5511999999999');
      expect(clientModel.createAutoImportedClient).toHaveBeenCalledWith({
        userId: 'user-123',
        phone: '+5511999999999',
        name: 'John Doe'
      });
    });
  });

  describe('POST /api/webhooks/evolution - Invalid signature rejection', () => {
    it('should reject webhook with invalid signature', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          }
        }
      };

      // Mock Supabase query to return config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      // Mock signature validation to fail
      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(false);

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'invalid-signature')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'INVALID_SIGNATURE',
        message: 'Webhook signature validation failed'
      });

      // Should not proceed to client creation
      expect(contactExtractor.extractContact).not.toHaveBeenCalled();
      expect(clientModel.createAutoImportedClient).not.toHaveBeenCalled();
    });

    it('should reject webhook with missing signature', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {}
      };

      // Mock Supabase query to return config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'MISSING_SIGNATURE',
        message: 'Webhook signature is required'
      });
    });
  });

  describe('POST /api/webhooks/evolution - Missing fields handling', () => {
    it('should reject webhook with missing instance', async () => {
      const payload = {
        event: 'messages.upsert',
        data: {}
      };

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'signature')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'MISSING_FIELDS',
        message: 'Webhook payload missing required fields'
      });
    });

    it('should reject webhook with empty payload', async () => {
      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'signature')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'MISSING_FIELDS',
        message: 'Webhook payload missing required fields'
      });
    });
  });

  describe('POST /api/webhooks/evolution - Duplicate phone handling', () => {
    it('should skip client creation for duplicate phone', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: 'John Doe'
        }
      };

      // Mock Supabase query to return config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(true);
      (contactExtractor.extractContact as jest.Mock).mockReturnValue({
        phone: '5511999999999',
        name: 'John Doe'
      });
      (phoneNormalizer.normalizePhone as jest.Mock).mockReturnValue('+5511999999999');
      
      // Mock duplicate check to return true
      (clientModel.checkPhoneExists as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'valid-signature')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Client already exists'
      });

      // Should not create client
      expect(clientModel.createAutoImportedClient).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/webhooks/evolution - Rate limiting', () => {
    it('should enforce rate limiting after 100 requests', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          }
        }
      };

      // Mock Supabase query to return config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(true);
      (contactExtractor.extractContact as jest.Mock).mockReturnValue({
        phone: '5511999999999',
        name: 'John Doe'
      });
      (phoneNormalizer.normalizePhone as jest.Mock).mockReturnValue('+5511999999999');
      (clientModel.checkPhoneExists as jest.Mock).mockResolvedValue(false);
      (clientModel.createAutoImportedClient as jest.Mock).mockResolvedValue({
        id: 'client-123'
      });

      // Make 100 requests (should all succeed)
      for (let i = 0; i < 100; i++) {
        const response = await request(app)
          .post('/api/webhooks/evolution')
          .set('x-evolution-signature', 'valid-signature')
          .send(payload);
        
        expect(response.status).toBe(200);
      }

      // 101st request should be rate limited
      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'valid-signature')
        .send(payload);

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      });
      expect(response.headers['retry-after']).toBe('60');
    });
  });

  describe('POST /api/webhooks/evolution - Invalid instance', () => {
    it('should reject webhook for non-existent instance', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'non-existent-instance',
        data: {}
      };

      // Mock Supabase query to return no config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'signature')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'INVALID_INSTANCE',
        message: 'No enabled configuration found for this instance'
      });
    });

    it('should reject webhook for disabled instance', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'disabled-instance',
        data: {}
      };

      // Mock Supabase query to return disabled config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],  // No enabled configs
              error: null
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'signature')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'INVALID_INSTANCE',
        message: 'No enabled configuration found for this instance'
      });
    });
  });

  describe('POST /api/webhooks/evolution - Contact extraction edge cases', () => {
    it('should acknowledge but not process when contact extraction returns null', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: true,  // Message sent by user
            id: 'ABC123'
          }
        }
      };

      // Mock Supabase query to return config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(true);
      
      // Mock contact extraction to return null (fromMe: true)
      (contactExtractor.extractContact as jest.Mock).mockReturnValue(null);

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'valid-signature')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Event acknowledged but not processed'
      });

      // Should not proceed to phone normalization or client creation
      expect(phoneNormalizer.normalizePhone).not.toHaveBeenCalled();
      expect(clientModel.createAutoImportedClient).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/webhooks/evolution - Phone normalization failures', () => {
    it('should reject webhook when phone normalization fails', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: 'invalid@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          }
        }
      };

      // Mock Supabase query to return config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(true);
      (contactExtractor.extractContact as jest.Mock).mockReturnValue({
        phone: 'invalid',
        name: 'Test'
      });
      
      // Mock phone normalization to return empty string
      (phoneNormalizer.normalizePhone as jest.Mock).mockReturnValue('');

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'valid-signature')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'INVALID_PHONE',
        message: 'Failed to normalize phone number'
      });

      expect(clientModel.createAutoImportedClient).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/webhooks/evolution - Error handling', () => {
    it('should return 500 when client creation fails', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          }
        }
      };

      // Mock Supabase query to return config
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                user_id: 'user-123',
                webhook_secret: 'test-secret',
                instance_name: 'test-instance',
                is_enabled: true
              }],
              error: null
            })
          })
        })
      });

      (signatureValidator.validateSignature as jest.Mock).mockReturnValue(true);
      (contactExtractor.extractContact as jest.Mock).mockReturnValue({
        phone: '5511999999999',
        name: 'Test'
      });
      (phoneNormalizer.normalizePhone as jest.Mock).mockReturnValue('+5511999999999');
      (clientModel.checkPhoneExists as jest.Mock).mockResolvedValue(false);
      
      // Mock client creation to throw error
      (clientModel.createAutoImportedClient as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/webhooks/evolution')
        .set('x-evolution-signature', 'valid-signature')
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'PROCESSING_ERROR',
        message: 'Error processing webhook event'
      });
    });
  });
});
