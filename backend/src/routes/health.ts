/**
 * Health Check Routes
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Endpoints for monitoring system health and dependencies.
 * 
 * Validates: Requirements 12.1, 12.2
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { EvolutionAPIClient } from '../lib/evolutionApiClient';
import { getConfig } from '../config/environment';

const router = Router();

/**
 * GET /health
 * Basic health check - returns 200 if server is running
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /health/database
 * Check database connectivity
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    // Simple query to test database connection
    const { data, error } = await supabase
      .from('business')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/evolution
 * Check Evolution API connectivity
 */
router.get('/evolution', async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    const evolutionClient = new EvolutionAPIClient();

    // Try to fetch instance info (will fail if API is down)
    // Using a dummy instance name just to test connectivity
    try {
      await evolutionClient.getConnectionState('health-check-test');
    } catch (error: any) {
      // 404 is expected (instance doesn't exist), but means API is reachable
      if (error.response?.status === 404) {
        res.json({
          status: 'ok',
          evolutionApi: 'connected',
          url: config.evolutionApi.url,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      throw error;
    }

    // If we get here, API responded successfully
    res.json({
      status: 'ok',
      evolutionApi: 'connected',
      url: config.evolutionApi.url,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const config = getConfig();
    
    res.status(503).json({
      status: 'error',
      evolutionApi: 'disconnected',
      url: config.evolutionApi.url,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/all
 * Comprehensive health check - tests all dependencies
 */
router.get('/all', async (req: Request, res: Response) => {
  const results: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      server: { status: 'ok' },
      database: { status: 'unknown' },
      evolutionApi: { status: 'unknown' },
    },
  };

  // Check database
  try {
    const { error } = await supabase
      .from('business')
      .select('id')
      .limit(1);

    if (error) throw error;
    results.checks.database = { status: 'ok' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.checks.database = { status: 'error', message: errorMessage };
    results.status = 'degraded';
  }

  // Check Evolution API
  try {
    const evolutionClient = new EvolutionAPIClient();

    try {
      await evolutionClient.getConnectionState('health-check-test');
    } catch (error: any) {
      if (error.response?.status === 404) {
        results.checks.evolutionApi = { status: 'ok' };
      } else {
        throw error;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.checks.evolutionApi = { status: 'error', message: errorMessage };
    results.status = 'degraded';
  }

  const statusCode = results.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(results);
});

export default router;
