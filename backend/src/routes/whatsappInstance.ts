/**
 * WhatsApp Instance Management Routes
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * REST API endpoints for managing WhatsApp instances.
 * Provides instance creation, QR code retrieval, connection status,
 * and disconnect/reconnect functionality.
 * 
 * Validates: Requirements 1.6, 2.1-2.5, 3.1-3.6, 4.1-4.6, 8.2-8.5, 11.2-11.3
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  InstanceManagerService,
  InstanceCreationError,
  QRCodeNotAvailableError,
  RateLimitError,
} from '../services/instanceManager';
import { getWhatsAppInstanceByUserId } from '../models/whatsappInstance';
import { 
  incrementRateLimit, 
  isRateLimited as checkRateLimit 
} from '../models/rateLimitRecord';

const router = Router();
const instanceManager = new InstanceManagerService();

/**
 * POST /api/evolution/create-instance
 * Creates a new WhatsApp instance for the authenticated user
 * 
 * Authentication: Required (Bearer token)
 * Rate Limit: 3 requests / 10 minutes per user
 * 
 * Response:
 * - 201: New instance created
 * - 200: Existing instance returned
 * - 401: Unauthorized
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 * 
 * Validates: Requirements 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 11.2, 11.3
 */
router.post('/create-instance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Create or retrieve instance
    const instance = await instanceManager.createInstance(userId);

    // Determine if this is a new instance or existing one
    const isNewInstance = instance.status === 'created';
    const statusCode = isNewInstance ? 201 : 200;

    res.status(statusCode).json({
      instanceName: instance.instanceName,
      status: instance.status,
      createdAt: instance.createdAt,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(429)
        .set('Retry-After', error.retryAfter.toString())
        .json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message,
            details: {
              retryAfter: error.retryAfter,
              limit: 3,
              window: '10 minutes',
            },
            timestamp: new Date().toISOString(),
          },
        });
      return;
    }

    if (error instanceof InstanceCreationError) {
      console.error('Instance creation failed:', {
        userId: req.user?.userId,
        error: error.message,
        originalError: error.originalError,
      });

      res.status(500).json({
        error: {
          code: 'INSTANCE_CREATION_FAILED',
          message: 'Failed to create WhatsApp instance. Please try again later.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Unexpected error
    console.error('Unexpected error in create-instance:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/evolution/qrcode
 * Retrieves QR code for the user's WhatsApp instance
 * 
 * Authentication: Required (Bearer token)
 * Rate Limit: 1 request / minute per user
 * 
 * Response:
 * - 200: QR code returned
 * - 401: Unauthorized
 * - 404: QR code not available
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6
 */
router.get('/qrcode', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get QR code
    const qrCode = await instanceManager.getQRCode(userId);

    res.json({
      qrCode,
      expiresIn: 60, // QR codes typically expire in 60 seconds
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(429)
        .set('Retry-After', error.retryAfter.toString())
        .json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message,
            details: {
              retryAfter: error.retryAfter,
              limit: 1,
              window: '1 minute',
            },
            timestamp: new Date().toISOString(),
          },
        });
      return;
    }

    if (error instanceof QRCodeNotAvailableError) {
      res.status(404).json({
        error: {
          code: 'QR_CODE_NOT_AVAILABLE',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Unexpected error
    console.error('Unexpected error in qrcode:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/evolution/connection-status
 * Retrieves connection status of the user's WhatsApp instance
 * 
 * Authentication: Required (Bearer token)
 * 
 * Response:
 * - 200: Connection status returned
 * - 401: Unauthorized
 * - 500: Internal server error
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6
 */
router.get('/connection-status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Get connection status
    const status = await instanceManager.getConnectionStatus(userId);

    // Get instance details from database
    const instance = await getWhatsAppInstanceByUserId(userId);

    res.json({
      status,
      instanceName: instance?.instanceName || null,
      connectedAt: instance?.connectedAt || null,
    });
  } catch (error) {
    // Unexpected error
    console.error('Unexpected error in connection-status:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/evolution/disconnect
 * Disconnects the user's WhatsApp instance
 * 
 * Authentication: Required (Bearer token)
 * 
 * Response:
 * - 200: Instance disconnected successfully
 * - 401: Unauthorized
 * - 500: Internal server error
 * 
 * Validates: Requirements 8.2, 8.3, 8.4, 8.5
 */
router.post('/disconnect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Disconnect instance
    await instanceManager.disconnectInstance(userId);

    res.json({
      success: true,
      message: 'WhatsApp instance disconnected successfully',
    });
  } catch (error) {
    // Unexpected error
    console.error('Unexpected error in disconnect:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/evolution/reconnect
 * Reconnects the user's WhatsApp instance
 * Generates a new QR code for connection
 * 
 * Authentication: Required (Bearer token)
 * 
 * Response:
 * - 200: New QR code generated
 * - 401: Unauthorized
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 * 
 * Validates: Requirements 8.2, 8.3, 8.4, 8.5
 */
router.post('/reconnect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Reconnect instance (generates new QR code)
    const qrCode = await instanceManager.reconnectInstance(userId);

    res.json({
      qrCode,
      message: 'Instance reconnected. Please scan the QR code.',
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      res.status(429)
        .set('Retry-After', error.retryAfter.toString())
        .json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message,
            details: {
              retryAfter: error.retryAfter,
            },
            timestamp: new Date().toISOString(),
          },
        });
      return;
    }

    // Unexpected error
    console.error('Unexpected error in reconnect:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/evolution/force-reconnect
 * Forces reconnection of the user's WhatsApp instance
 * Uses logout and restart to regenerate QR code when instance is stuck
 * 
 * Authentication: Required (Bearer token)
 * Rate Limit: 3 requests / minute per user
 * 
 * Response:
 * - 200: New QR code generated
 * - 401: Unauthorized
 * - 404: Instance not found
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 * 
 * Validates: Requirements 2.4, 2.5
 */
router.post('/force-reconnect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check rate limit (3 requests per minute)
    const rateLimitCheck = await checkRateLimit(
      userId,
      'force-reconnect',
      3 // max 3 requests
    );

    if (rateLimitCheck.limited) {
      const resetTime = new Date(rateLimitCheck.resetTime!);
      const now = new Date();
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
      
      res.status(429)
        .set('Retry-After', retryAfter.toString())
        .json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many force reconnect requests. Please wait before trying again.',
            details: {
              retryAfter,
              limit: 3,
              window: '1 minute',
            },
            timestamp: new Date().toISOString(),
          },
        });
      return;
    }

    // Increment rate limit counter
    await incrementRateLimit({
      userId,
      endpoint: 'force-reconnect',
      windowDurationMs: 60000, // 1 minute
    });

    // Force reconnect instance
    const qrCode = await instanceManager.forceReconnect(userId);

    res.json({
      qrCode,
      message: 'Instance force reconnected. Please scan the new QR code.',
    });
  } catch (error) {
    if (error instanceof QRCodeNotAvailableError) {
      res.status(404).json({
        error: {
          code: 'QR_CODE_NOT_AVAILABLE',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Unexpected error
    console.error('Unexpected error in force-reconnect:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
