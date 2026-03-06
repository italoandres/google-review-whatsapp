import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getConfig, saveConfig, testConnection, toggleEnabled, getDecryptedApiKey } from '../models/evolutionConfig';
import { validateSignature } from '../utils/signatureValidator';
import { extractContact } from '../utils/contactExtractor';
import { normalizePhone } from '../utils/phoneNormalizer';
import { checkPhoneExists, createAutoImportedClient } from '../models/client';
import { supabase } from '../lib/supabase';

const router = Router();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100;

// In-memory rate limiting store (instance-based)
// Key: instance name, Value: { count, resetTime }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if request should be rate limited
 * @param instanceName - The Evolution API instance name
 * @returns true if rate limit exceeded, false otherwise
 */
function isRateLimited(instanceName: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(instanceName);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(instanceName, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Increment count
  record.count++;
  return false;
}

/**
 * POST /api/webhooks/evolution
 * Receive and process Evolution API webhook events
 * 
 * This endpoint:
 * 1. Validates webhook signature
 * 2. Extracts contact information
 * 3. Normalizes phone number
 * 4. Checks for duplicates
 * 5. Creates new client if not exists
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5
 */
router.post('/webhooks/evolution', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-evolution-signature'] as string;

    // Validate required fields
    if (!payload || !payload.instance) {
      console.error('[Webhook] Validation failure: Webhook payload missing required fields');
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Webhook payload missing required fields'
      });
      return;
    }

    const instanceName = payload.instance;

    // Check rate limiting
    if (isRateLimited(instanceName)) {
      console.error(`[Webhook] Rate limit exceeded for instance: ${instanceName}`);
      res.status(429).set('Retry-After', '60').json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      });
      return;
    }

    // Find user configuration by instance name
    // Note: We need to query all configs to find the matching instance
    // This is a limitation of the current design - ideally we'd have instance-to-user mapping
    const { data: configs, error: configError } = await supabase
      .from('evolution_api_config')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('is_enabled', true);

    if (configError || !configs || configs.length === 0) {
      console.error(`[Webhook] Connection failure: No enabled configuration found for instance: ${instanceName}`);
      res.status(401).json({
        error: 'INVALID_INSTANCE',
        message: 'No enabled configuration found for this instance'
      });
      return;
    }

    // Use the first matching config (should be only one per instance)
    const config = configs[0];
    const userId = config.user_id;
    const webhookSecret = config.webhook_secret;

    // Validate signature
    if (!signature) {
      console.error(`[Webhook] Validation failure: Webhook signature missing for instance: ${instanceName}`);
      res.status(401).json({
        error: 'MISSING_SIGNATURE',
        message: 'Webhook signature is required'
      });
      return;
    }

    const payloadString = JSON.stringify(payload);
    const isValidSignature = validateSignature(payloadString, signature, webhookSecret);

    if (!isValidSignature) {
      console.error(`[Webhook] Validation failure: Webhook signature validation failed for instance: ${instanceName}`);
      res.status(401).json({
        error: 'INVALID_SIGNATURE',
        message: 'Webhook signature validation failed'
      });
      return;
    }

    // Extract contact information
    const contact = extractContact(payload);

    if (!contact) {
      // Not an incoming message or invalid payload - acknowledge but don't process
      res.json({ success: true, message: 'Event acknowledged but not processed' });
      return;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(contact.phone);

    if (!normalizedPhone) {
      console.error(`[Webhook] Processing failure: Failed to normalize phone number for instance: ${instanceName}`);
      res.status(400).json({
        error: 'INVALID_PHONE',
        message: 'Failed to normalize phone number'
      });
      return;
    }

    // Check if phone already exists
    const phoneExists = await checkPhoneExists(userId, normalizedPhone);

    if (phoneExists) {
      // Duplicate - skip creation but acknowledge receipt
      console.log(`[Webhook] Skipped duplicate client registration for phone: ${normalizedPhone}, instance: ${instanceName}`);
      res.json({ success: true, message: 'Client already exists' });
      return;
    }

    // Create new auto-imported client
    try {
      const client = await createAutoImportedClient({
        userId,
        phone: normalizedPhone,
        name: contact.name
      });

      console.log(`[Webhook] Successful registration: Client ${client.id} auto-imported from phone: ${normalizedPhone}, instance: ${instanceName}`);

      res.json({
        success: true,
        clientId: client.id
      });
    } catch (clientError) {
      console.error(`[Webhook] Registration failure: Failed to create client for phone: ${normalizedPhone}, instance: ${instanceName}`, clientError instanceof Error ? clientError.message : 'Unknown error');
      res.status(500).json({
        error: 'REGISTRATION_ERROR',
        message: 'Error creating client record'
      });
    }
  } catch (error) {
    const instanceName = req.body?.instance || 'unknown';
    console.error(`[Webhook] Processing failure: Error processing webhook event for instance: ${instanceName}`, error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      error: 'PROCESSING_ERROR',
      message: 'Error processing webhook event'
    });
  }
});

/**
 * GET /api/evolution/config
 * Get current Evolution API configuration (API key masked)
 * 
 * Requirements: 4.7
 */
router.get('/evolution/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    const config = await getConfig(userId);

    if (!config) {
      res.json({ configured: false });
      return;
    }

    // Mask API key for security (show only last 4 characters)
    const maskedApiKey = '***' + config.encryptedApiKey.slice(-4);

    res.json({
      configured: true,
      apiUrl: config.apiUrl,
      apiKey: maskedApiKey,
      instanceName: config.instanceName,
      isEnabled: config.isEnabled
    });
  } catch (error) {
    console.error('Error fetching Evolution API config:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error fetching configuration'
    });
  }
});

/**
 * POST /api/evolution/config
 * Save Evolution API configuration
 * 
 * Requirements: 1.2
 */
router.post('/evolution/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    const { apiUrl, apiKey, instanceName, webhookSecret } = req.body;

    // Validate required fields
    if (!apiUrl || !apiKey || !instanceName || !webhookSecret) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: apiUrl, apiKey, instanceName, webhookSecret'
      });
      return;
    }

    // Save configuration (API key will be encrypted)
    const config = await saveConfig(userId, {
      apiUrl,
      apiKey,
      instanceName,
      webhookSecret
    });

    res.json({
      success: true,
      config: {
        id: config.id,
        apiUrl: config.apiUrl,
        instanceName: config.instanceName,
        isEnabled: config.isEnabled
      }
    });
  } catch (error) {
    console.error('Error saving Evolution API config:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error saving configuration'
    });
  }
});

/**
 * POST /api/evolution/test-connection
 * Test Evolution API connection
 * 
 * Requirements: 1.1, 1.3
 */
router.post('/evolution/test-connection', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    const { apiUrl, apiKey, instanceName } = req.body;

    // Validate required fields
    if (!apiUrl || !apiKey || !instanceName) {
      res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: apiUrl, apiKey, instanceName'
      });
      return;
    }

    // Test connection
    const isConnected = await testConnection({
      apiUrl,
      apiKey,
      instanceName,
      webhookSecret: '' // Not needed for connection test
    });

    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error testing Evolution API connection:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error testing connection'
    });
  }
});

/**
 * POST /api/evolution/toggle
 * Enable/disable auto-import
 * 
 * Requirements: 4.4
 */
router.post('/evolution/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    const { enabled } = req.body;

    // Validate enabled field
    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Field "enabled" must be a boolean'
      });
      return;
    }

    // Toggle enabled status
    await toggleEnabled(userId, enabled);

    res.json({ success: true, enabled });
  } catch (error) {
    console.error('Error toggling Evolution API enabled status:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error toggling auto-import'
    });
  }
});

/**
 * GET /api/health/evolution
 * Check Evolution API connectivity
 * 
 * Requirements: 8.4, 8.5
 */
router.get('/health/evolution', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      return;
    }

    const config = await getConfig(userId);

    if (!config) {
      res.status(503).json({
        status: 'not_configured',
        message: 'Evolution API not configured'
      });
      return;
    }

    // Get decrypted API key for connection test
    const apiKey = await getDecryptedApiKey(userId);

    if (!apiKey) {
      res.status(503).json({
        status: 'error',
        message: 'Failed to decrypt API key'
      });
      return;
    }

    // Test connection
    const isConnected = await testConnection({
      apiUrl: config.apiUrl,
      apiKey,
      instanceName: config.instanceName,
      webhookSecret: config.webhookSecret
    });

    if (!isConnected) {
      res.status(503).json({
        status: 'disconnected',
        message: 'Evolution API connection failed'
      });
      return;
    }

    res.json({
      status: 'connected',
      instance: config.instanceName
    });
  } catch (error) {
    console.error('Error checking Evolution API health:', error);
    res.status(503).json({
      status: 'error',
      message: 'Error checking Evolution API health'
    });
  }
});

export default router;
