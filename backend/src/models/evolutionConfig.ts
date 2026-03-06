import { supabase } from '../lib/supabase';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';

export interface EvolutionConfig {
  id: string;
  userId: string;
  apiUrl: string;
  encryptedApiKey: string;
  instanceName: string;
  webhookSecret: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvolutionConfigInput {
  apiUrl: string;
  apiKey: string; // Plain text (will be encrypted before storage)
  instanceName: string;
  webhookSecret: string;
}

/**
 * Maps database row to EvolutionConfig interface
 */
function mapConfigFromDB(data: any): EvolutionConfig {
  return {
    id: data.id,
    userId: data.user_id,
    apiUrl: data.api_url,
    encryptedApiKey: data.encrypted_api_key,
    instanceName: data.instance_name,
    webhookSecret: data.webhook_secret,
    isEnabled: data.is_enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Get Evolution API configuration for a user
 * @param userId - The user ID
 * @returns The configuration or null if not found
 */
export async function getConfig(userId: string): Promise<EvolutionConfig | null> {
  const { data, error } = await supabase
    .from('evolution_api_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found
      return null;
    }
    console.error('Error fetching Evolution API config:', error);
    throw new Error('Error fetching Evolution API configuration');
  }

  return mapConfigFromDB(data);
}

/**
 * Save Evolution API configuration for a user
 * Encrypts the API key before storage
 * @param userId - The user ID
 * @param input - The configuration input with plain text API key
 * @returns The saved configuration
 */
export async function saveConfig(
  userId: string,
  input: EvolutionConfigInput
): Promise<EvolutionConfig> {
  // Encrypt the API key before storage
  const encryptedApiKey = encryptApiKey(input.apiKey);

  // Check if config already exists
  const existingConfig = await getConfig(userId);

  if (existingConfig) {
    // Update existing config
    const { data, error } = await supabase
      .from('evolution_api_config')
      .update({
        api_url: input.apiUrl,
        encrypted_api_key: encryptedApiKey,
        instance_name: input.instanceName,
        webhook_secret: input.webhookSecret,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating Evolution API config:', error);
      throw new Error('Error updating Evolution API configuration');
    }

    return mapConfigFromDB(data);
  } else {
    // Insert new config
    const { data, error } = await supabase
      .from('evolution_api_config')
      .insert({
        user_id: userId,
        api_url: input.apiUrl,
        encrypted_api_key: encryptedApiKey,
        instance_name: input.instanceName,
        webhook_secret: input.webhookSecret,
        is_enabled: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Evolution API config:', error);
      throw new Error('Error creating Evolution API configuration');
    }

    return mapConfigFromDB(data);
  }
}

/**
 * Toggle the enabled status of Evolution API auto-import
 * @param userId - The user ID
 * @param enabled - Whether to enable or disable auto-import
 */
export async function toggleEnabled(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('evolution_api_config')
    .update({
      is_enabled: enabled,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error toggling Evolution API enabled status:', error);
    throw new Error('Error toggling Evolution API enabled status');
  }
}

/**
 * Get the decrypted API key for a user
 * @param userId - The user ID
 * @returns The decrypted API key or null if config not found
 */
export async function getDecryptedApiKey(userId: string): Promise<string | null> {
  const config = await getConfig(userId);
  
  if (!config) {
    return null;
  }

  return decryptApiKey(config.encryptedApiKey);
}

/**
 * Test connection to Evolution API
 * Makes a GET request to the connectionState endpoint to verify credentials
 * @param config - The configuration input with plain text API key
 * @returns True if connection is successful, false otherwise
 */
export async function testConnection(config: EvolutionConfigInput): Promise<boolean> {
  try {
    // Construct the connection state endpoint URL
    const url = `${config.apiUrl}/instance/connectionState/${config.instanceName}`;
    
    // Make GET request with API key in header
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Check if response is successful
    if (!response.ok) {
      console.error(`Evolution API connection test failed: HTTP ${response.status}`);
      return false;
    }

    // Parse response body
    const data = await response.json() as { state?: string };
    
    // Check if connection state is "open"
    if (data.state === 'open') {
      return true;
    }

    console.error(`Evolution API connection state is not open: ${data.state}`);
    return false;
  } catch (error) {
    console.error('Error testing Evolution API connection:', error);
    return false;
  }
}
