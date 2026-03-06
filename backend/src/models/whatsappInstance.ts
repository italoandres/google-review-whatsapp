import { supabase } from '../lib/supabase';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';

export interface WhatsAppInstance {
  id: string;
  userId: string;
  instanceName: string;
  status: 'disconnected' | 'connecting' | 'connected';
  encryptedApiKey?: string;
  phoneNumber?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhatsAppInstanceInput {
  userId: string;
  instanceName: string;
  apiKey?: string;
  status?: 'disconnected' | 'connecting' | 'connected';
}

export interface UpdateWhatsAppInstanceInput {
  status?: 'disconnected' | 'connecting' | 'connected';
  apiKey?: string;
  phoneNumber?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  lastActivityAt?: string;
}

/**
 * Create a new WhatsApp instance
 */
export async function createWhatsAppInstance(
  input: CreateWhatsAppInstanceInput
): Promise<WhatsAppInstance> {
  const encryptedApiKey = input.apiKey ? encryptApiKey(input.apiKey) : undefined;

  const { data, error } = await supabase
    .from('whatsapp_instances')
    .insert({
      user_id: input.userId,
      instance_name: input.instanceName,
      encrypted_api_key: encryptedApiKey,
      status: input.status || 'disconnected',
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create WhatsApp instance: ${error.message}`);
  }

  return mapToWhatsAppInstance(data);
}

/**
 * Get WhatsApp instance by user ID
 */
export async function getWhatsAppInstanceByUserId(
  userId: string
): Promise<WhatsAppInstance | null> {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get WhatsApp instance: ${error.message}`);
  }

  return mapToWhatsAppInstance(data);
}

/**
 * Get WhatsApp instance by instance name
 */
export async function getWhatsAppInstanceByName(
  instanceName: string
): Promise<WhatsAppInstance | null> {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('instance_name', instanceName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get WhatsApp instance: ${error.message}`);
  }

  return mapToWhatsAppInstance(data);
}

/**
 * Update WhatsApp instance
 */
export async function updateWhatsAppInstance(
  userId: string,
  updates: UpdateWhatsAppInstanceInput
): Promise<WhatsAppInstance> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  if (updates.apiKey !== undefined) {
    updateData.encrypted_api_key = encryptApiKey(updates.apiKey);
  }

  if (updates.phoneNumber !== undefined) {
    updateData.phone_number = updates.phoneNumber;
  }

  if (updates.connectedAt !== undefined) {
    updateData.connected_at = updates.connectedAt;
  }

  if (updates.disconnectedAt !== undefined) {
    updateData.disconnected_at = updates.disconnectedAt;
  }

  if (updates.lastActivityAt !== undefined) {
    updateData.last_activity_at = updates.lastActivityAt;
  }

  const { data, error } = await supabase
    .from('whatsapp_instances')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update WhatsApp instance: ${error.message}`);
  }

  return mapToWhatsAppInstance(data);
}

/**
 * Delete WhatsApp instance
 */
export async function deleteWhatsAppInstance(userId: string): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete WhatsApp instance: ${error.message}`);
  }
}

/**
 * Get decrypted API key for an instance
 */
export async function getDecryptedApiKey(userId: string): Promise<string | null> {
  const instance = await getWhatsAppInstanceByUserId(userId);
  
  if (!instance || !instance.encryptedApiKey) {
    return null;
  }

  return decryptApiKey(instance.encryptedApiKey);
}

/**
 * Update last activity timestamp
 */
export async function updateLastActivity(userId: string): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_instances')
    .update({
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update last activity: ${error.message}`);
  }
}

/**
 * Map database row to WhatsAppInstance interface
 */
function mapToWhatsAppInstance(data: any): WhatsAppInstance {
  return {
    id: data.id,
    userId: data.user_id,
    instanceName: data.instance_name,
    status: data.status,
    encryptedApiKey: data.encrypted_api_key,
    phoneNumber: data.phone_number,
    connectedAt: data.connected_at,
    disconnectedAt: data.disconnected_at,
    lastActivityAt: data.last_activity_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
