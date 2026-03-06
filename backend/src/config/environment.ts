/**
 * Environment Configuration and Validation
 * Feature: whatsapp-multi-tenant-auto-instance
 * 
 * Validates required environment variables on startup
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */

interface EnvironmentConfig {
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  
  // App
  app: {
    port: number;
    nodeEnv: string;
  };
  
  // Security
  security: {
    encryptionKey: string;
    webhookSecret: string;
  };
  
  // Evolution API
  evolutionApi: {
    url: string;
    globalKey: string;
  };
  
  // Backend
  backend: {
    url: string;
  };
  
  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  
  // QR Code Settings
  qrCode: {
    expirySeconds: number;
    maxPollingAttempts: number;
    pollingIntervalMs: number;
  };
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validates that a URL is properly formatted
 */
function validateUrl(url: string, name: string): void {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol || !parsed.hostname) {
      throw new Error(`Invalid URL format for ${name}`);
    }
  } catch (error) {
    throw new ConfigurationError(
      `${name} must be a valid URL (e.g., https://example.com). Got: ${url}`
    );
  }
}

/**
 * Validates that encryption key is 32 bytes (64 hex characters)
 */
function validateEncryptionKey(key: string): void {
  if (!key || key.length !== 64) {
    throw new ConfigurationError(
      'ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new ConfigurationError(
      'ENCRYPTION_KEY must contain only hexadecimal characters (0-9, a-f)'
    );
  }
}

/**
 * Gets required environment variable or throws error
 */
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  
  if (!value || value.trim() === '') {
    throw new ConfigurationError(
      `Missing required environment variable: ${name}\n` +
      `Please set ${name} in your .env file. See .env.example for reference.`
    );
  }
  
  return value.trim();
}

/**
 * Gets optional environment variable with default value
 */
function getOptionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

/**
 * Gets optional numeric environment variable with default value
 */
function getOptionalNumericEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new ConfigurationError(
      `${name} must be a valid number. Got: ${value}`
    );
  }
  
  return parsed;
}

/**
 * Validates and loads environment configuration
 * Throws ConfigurationError if validation fails
 */
export function loadAndValidateConfig(): EnvironmentConfig {
  try {
    // Required variables
    const supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY');
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_KEY');
    const encryptionKey = getRequiredEnv('ENCRYPTION_KEY');
    const evolutionApiUrl = getRequiredEnv('EVOLUTION_API_URL');
    const evolutionApiGlobalKey = getRequiredEnv('EVOLUTION_API_GLOBAL_KEY');
    const backendUrl = getRequiredEnv('BACKEND_URL');
    const webhookSecret = getRequiredEnv('WEBHOOK_SECRET');
    
    // Validate URLs
    validateUrl(supabaseUrl, 'SUPABASE_URL');
    validateUrl(evolutionApiUrl, 'EVOLUTION_API_URL');
    validateUrl(backendUrl, 'BACKEND_URL');
    
    // Validate encryption key
    validateEncryptionKey(encryptionKey);
    
    // Optional variables with defaults
    const port = getOptionalNumericEnv('PORT', 3000);
    const nodeEnv = getOptionalEnv('NODE_ENV', 'development');
    const rateLimitWindowMs = getOptionalNumericEnv('RATE_LIMIT_WINDOW_MS', 600000);
    const rateLimitMaxRequests = getOptionalNumericEnv('RATE_LIMIT_MAX_REQUESTS', 3);
    const qrCodeExpirySeconds = getOptionalNumericEnv('QR_CODE_EXPIRY_SECONDS', 60);
    const maxPollingAttempts = getOptionalNumericEnv('MAX_POLLING_ATTEMPTS', 60);
    const pollingIntervalMs = getOptionalNumericEnv('POLLING_INTERVAL_MS', 3000);
    
    return {
      supabase: {
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        serviceKey: supabaseServiceKey,
      },
      app: {
        port,
        nodeEnv,
      },
      security: {
        encryptionKey,
        webhookSecret,
      },
      evolutionApi: {
        url: evolutionApiUrl,
        globalKey: evolutionApiGlobalKey,
      },
      backend: {
        url: backendUrl,
      },
      rateLimit: {
        windowMs: rateLimitWindowMs,
        maxRequests: rateLimitMaxRequests,
      },
      qrCode: {
        expirySeconds: qrCodeExpirySeconds,
        maxPollingAttempts,
        pollingIntervalMs,
      },
    };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    
    throw new ConfigurationError(
      `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validates configuration on startup
 * Exits process if validation fails
 */
export function validateConfigOnStartup(): EnvironmentConfig {
  try {
    const config = loadAndValidateConfig();
    
    console.log('✅ Configuration validated successfully');
    console.log(`📍 Backend URL: ${config.backend.url}`);
    console.log(`🔗 Evolution API: ${config.evolutionApi.url}`);
    console.log(`🗄️  Supabase: ${config.supabase.url}`);
    console.log(`⚙️  Environment: ${config.app.nodeEnv}`);
    
    return config;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('\n❌ Configuration Error:\n');
      console.error(error.message);
      console.error('\nPlease fix the configuration and restart the server.\n');
      process.exit(1);
    }
    
    throw error;
  }
}

// Export singleton instance
let configInstance: EnvironmentConfig | null = null;

export function getConfig(): EnvironmentConfig {
  if (!configInstance) {
    configInstance = loadAndValidateConfig();
  }
  return configInstance;
}

export { ConfigurationError };
export type { EnvironmentConfig };
