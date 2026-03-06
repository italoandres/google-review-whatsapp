import { supabase } from '../lib/supabase';

export interface ConnectionHistoryEntry {
  id: string;
  userId: string;
  instanceName: string;
  eventType: 'connected' | 'disconnected' | 'created' | 'deleted' | 'error';
  status: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface CreateConnectionHistoryInput {
  userId: string;
  instanceName: string;
  eventType: 'connected' | 'disconnected' | 'created' | 'deleted' | 'error';
  status: string;
  details?: Record<string, any>;
}

export interface GetConnectionHistoryOptions {
  limit?: number;
  offset?: number;
}

/**
 * Insert a connection history event
 */
export async function insertConnectionHistory(
  input: CreateConnectionHistoryInput
): Promise<ConnectionHistoryEntry> {
  const { data, error } = await supabase
    .from('whatsapp_connection_history')
    .insert({
      user_id: input.userId,
      instance_name: input.instanceName,
      event_type: input.eventType,
      status: input.status,
      details: input.details || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert connection history: ${error.message}`);
  }

  return mapToConnectionHistoryEntry(data);
}

/**
 * Get connection history for a user with pagination
 */
export async function getConnectionHistoryByUserId(
  userId: string,
  options: GetConnectionHistoryOptions = {}
): Promise<ConnectionHistoryEntry[]> {
  const limit = options.limit || 10;
  const offset = options.offset || 0;

  const { data, error } = await supabase
    .from('whatsapp_connection_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get connection history: ${error.message}`);
  }

  return data.map(mapToConnectionHistoryEntry);
}

/**
 * Get connection history for an instance
 */
export async function getConnectionHistoryByInstanceName(
  instanceName: string,
  options: GetConnectionHistoryOptions = {}
): Promise<ConnectionHistoryEntry[]> {
  const limit = options.limit || 10;
  const offset = options.offset || 0;

  const { data, error } = await supabase
    .from('whatsapp_connection_history')
    .select('*')
    .eq('instance_name', instanceName)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get connection history: ${error.message}`);
  }

  return data.map(mapToConnectionHistoryEntry);
}

/**
 * Get total count of history entries for a user
 */
export async function getConnectionHistoryCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('whatsapp_connection_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get connection history count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Delete old connection history entries (cleanup)
 */
export async function deleteOldConnectionHistory(daysOld: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('whatsapp_connection_history')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to delete old connection history: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Map database row to ConnectionHistoryEntry interface
 */
function mapToConnectionHistoryEntry(data: any): ConnectionHistoryEntry {
  return {
    id: data.id,
    userId: data.user_id,
    instanceName: data.instance_name,
    eventType: data.event_type,
    status: data.status,
    details: data.details,
    createdAt: data.created_at,
  };
}
