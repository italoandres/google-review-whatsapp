/**
 * Webhook Routes
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * REST API endpoint for receiving Evolution API webhook events.
 * Validates webhook signatures and processes events.
 * 
 * Validates: Requirements 5.6, 19.1, 19.2, 19.6
 */

import { Router, Request, Response } from 'express';
import { WebhookHandler } from '../services/webhookHandler';
import { getConfig } from '../config/environment';
import { RateLimiter, createRateLimitKey, RateLimitConfigs } from '../utils/rateLimiter';
import { insertWebhookLog } from '../models/webhookLog';

const router = Router();
const webhookHandler = new WebhookHandler();
const rateLimiter = new RateLimiter();

// Middleware para logar TUDO que chega no webhook
router.use((req: Request, res: Response, next) => {
  console.log('🚨 [Webhook Middleware] Request received', {
    method: req.method,
    path: req.path,
    url: req.url,
    headers: req.headers,
    bodyType: typeof req.body,
    bodyIsEmpty: !req.body || Object.keys(req.body).length === 0,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    rawBody: req.body ? JSON.stringify(req.body).substring(0, 500) : 'NO BODY',
  });
  next();
});

/**
 * POST /api/webhooks/evolution
 * Receives webhook events from Evolution API
 * 
 * Authentication: Signature validation (x-evolution-signature header)
 * Rate Limit: 100 events / minute per instance
 * 
 * Headers:
 * - x-evolution-signature: HMAC-SHA256 signature of the payload
 * 
 * Response:
 * - 200: Event processed successfully
 * - 400: Invalid payload or JSON parsing error
 * - 401: Invalid signature
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 * 
 * Validates: Requirements 5.6, 19.1, 19.2, 19.6
 */
router.post('/evolution', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let instanceName: string | undefined;
  
  console.log('📨 [Webhook] Received webhook request', {
    method: req.method,
    path: req.path,
    headers: {
      'content-type': req.headers['content-type'],
      'x-evolution-signature': req.headers['x-evolution-signature'] ? 'present' : 'missing',
    },
    bodyKeys: req.body ? Object.keys(req.body) : [],
    timestamp: new Date().toISOString(),
  });
  
  try {
    // Get signature from header
    const signature = req.headers['x-evolution-signature'] as string;
    
    // TEMPORARY: Skip signature validation in development
    // Evolution API may not send signature in some configurations
    const skipSignatureValidation = process.env.NODE_ENV === 'development';
    
    if (!signature && !skipSignatureValidation) {
      // Log attempt with missing signature
      await insertWebhookLog({
        instanceName: 'unknown',
        eventType: 'signature_missing',
        payload: req.body,
        signature: undefined,
        signatureValid: false,
        processed: false,
        errorMessage: 'Missing x-evolution-signature header',
      });
      
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing webhook signature',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    // Validate signature if present
    let isValidSignature = true;
    if (signature && !skipSignatureValidation) {
      // Get webhook secret from config
      const config = getConfig();
      const webhookSecret = config.security.webhookSecret;
      
      // Get raw payload as string for signature validation
      const rawPayload = JSON.stringify(req.body);
      
      // Validate signature
      isValidSignature = webhookHandler.validateSignature(
        rawPayload,
        signature,
        webhookSecret
      );
      
      if (!isValidSignature) {
        // Log attempt with invalid signature
        await insertWebhookLog({
          instanceName: req.body?.instance || 'unknown',
          eventType: req.body?.event || 'unknown',
          payload: req.body,
          signature,
          signatureValid: false,
          processed: false,
          errorMessage: 'Invalid webhook signature',
        });
        
        console.warn('Invalid webhook signature attempt', {
          instanceName: req.body?.instance,
          signature: signature.substring(0, 10) + '...',
          timestamp: new Date().toISOString(),
        });
        
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid webhook signature',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }
    }
    
    if (skipSignatureValidation) {
      console.warn('⚠️ [Webhook] Signature validation SKIPPED (development mode)', {
        hasSignature: !!signature,
        instanceName: req.body?.instance,
      });
    }
    
    console.log('🔍 [Webhook] About to log full payload...');
    
    // Log full payload for debugging
    console.log('🔍 [Webhook] Full payload received:', {
      event: req.body?.event,
      instance: req.body?.instance,
      dataKeys: req.body?.data ? Object.keys(req.body.data) : [],
      fullPayload: JSON.stringify(req.body, null, 2).substring(0, 1000),
    });
    
    console.log('🔍 [Webhook] About to parse event...');
    
    // Parse and validate event payload
    let payload;
    try {
      console.log('🔍 [Webhook] Parsing event with body:', {
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        bodyString: JSON.stringify(req.body).substring(0, 200),
      });
      
      const rawPayload = JSON.stringify(req.body);
      payload = webhookHandler.parseEvent(rawPayload);
      instanceName = payload.instance;
      
      console.log('✅ [Webhook] Payload parsed successfully', {
        event: payload.event,
        instance: payload.instance,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid payload';
      
      console.error('❌ [Webhook] Failed to parse payload', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      await insertWebhookLog({
        instanceName: req.body?.instance || 'unknown',
        eventType: req.body?.event || 'unknown',
        payload: req.body,
        signature,
        signatureValid: isValidSignature,
        processed: false,
        errorMessage,
      });
      
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    // Apply rate limiting per instance
    const rateLimitKey = createRateLimitKey(instanceName, 'webhook');
    const isRateLimited = rateLimiter.isRateLimited(
      rateLimitKey,
      RateLimitConfigs.WEBHOOK_EVENTS.maxRequests,
      RateLimitConfigs.WEBHOOK_EVENTS.windowMs
    );
    
    if (isRateLimited) {
      const retryAfter = rateLimiter.getRetryAfter(
        rateLimitKey,
        RateLimitConfigs.WEBHOOK_EVENTS.windowMs
      );
      
      await insertWebhookLog({
        instanceName,
        eventType: payload.event,
        payload: payload as any,
        signature,
        signatureValid: true,
        processed: false,
        errorMessage: 'Rate limit exceeded',
      });
      
      res.status(429)
        .set('Retry-After', retryAfter.toString())
        .json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many webhook events. Please try again later.',
            details: {
              retryAfter,
              limit: RateLimitConfigs.WEBHOOK_EVENTS.maxRequests,
              window: '1 minute',
            },
            timestamp: new Date().toISOString(),
          },
        });
      return;
    }
    
    // Process the webhook event
    const result = await webhookHandler.handleEvent(payload, signature, isValidSignature);
    
    const duration = Date.now() - startTime;
    
    console.info('Webhook event processed', {
      instanceName,
      eventType: payload.event,
      success: result.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ [Webhook] Webhook processing error', {
      instanceName,
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process webhook event',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
