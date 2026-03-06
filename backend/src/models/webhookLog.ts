import { supabase } from '../lib/supabase';

export interface WebhookLog {
  id: string;
  instanceName: string;
  eventType: string;
  payload: Record<string, any>;
  signature?: string;
  signatureValid?: boolean;
  processed: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface CreateWebhookLogInput {
  instanceName: string;
  eventType: string;
  payload: Record<string, any>;
  signature?: string;
  signatureValid?: boolean;
  processed?: boolean;
  errorMessage?: string;
}

export interface GetWebhookLogsOptions {
  limit?: number;
  offset?: number;
  processed?: boolean;
  eventType?: string;
}

/**
 * Insert a webhook log entry
 */
export async function insertWebhookLog(
  input: CreateWebhookLogInput
): Promise<WebhookLog> {
  const { data, error } = await supabase
    .from('whatsapp_webhook_logs')
    .insert({
      instance_name: input.instanceName,
      event_type: input.eventType,
      payload: input.payload,
      signature: input.signature || null,
      signature_valid: input.signatureValid ?? null,
      processed: input.processed ?? false,
      error_message: input.errorMessage || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert webhook log: ${error.message}`);
  }

  return mapToWebhookLog(data);
}

/**
 * Get webhook logs for an instance with pagination and filters
 */
export async function getWebhookLogsByInstanceName(
  instanceName: string,
  options: GetWebhookLogsOptions = {}
): Promise<WebhookLog[]> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  let query = supabase
    .from('whatsapp_webhook_logs')
    .select('*')
    .eq('instance_name', instanceName);

  if (options.processed !== undefined) {
    query = query.eq('processed', options.processed);
  }

  if (options.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get webhook logs: ${error.message}`);
  }

  return data.map(mapToWebhookLog);
}

/**
 * Get all unprocessed webhook logs
 */
export async function getUnprocessedWebhookLogs(
  limit: number = 100
): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('whatsapp_webhook_logs')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get unprocessed webhook logs: ${error.message}`);
  }

  return data.map(mapToWebhookLog);
}

/**
 * Mark webhook log as processed
 */
export async function markWebhookLogAsProcessed(
  id: string,
  errorMessage?: string
): Promise<WebhookLog> {
  const { data, error } = await supabase
    .from('whatsapp_webhook_logs')
    .update({
      processed: true,
      error_message: errorMessage || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark webhook log as processed: ${error.message}`);
  }

  return mapToWebhookLog(data);
}

/**
 * Get webhook logs with invalid signatures
 */
export async function getInvalidSignatureLogs(
  limit: number = 50
): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('whatsapp_webhook_logs')
    .select('*')
    .eq('signature_valid', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get invalid signature logs: ${error.message}`);
  }

  return data.map(mapToWebhookLog);
}

/**
 * Delete old webhook logs (cleanup)
 */
export async function deleteOldWebhookLogs(daysOld: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('whatsapp_webhook_logs')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to delete old webhook logs: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Get webhook log statistics for an instance
 */
export async function getWebhookLogStats(instanceName: string): Promise<{
  total: number;
  processed: number;
  unprocessed: number;
  invalidSignatures: number;
  errors: number;
}> {
  const { data: allLogs, error: allError } = await supabase
    .from('whatsapp_webhook_logs')
    .select('processed, signature_valid, error_message', { count: 'exact' })
    .eq('instance_name', instanceName);

  if (allError) {
    throw new Error(`Failed to get webhook log stats: ${allError.message}`);
  }

  const total = allLogs?.length || 0;
  const processed = allLogs?.filter(log => log.processed).length || 0;
  const unprocessed = total - processed;
  const invalidSignatures = allLogs?.filter(log => log.signature_valid === false).length || 0;
  const errors = allLogs?.filter(log => log.error_message !== null).length || 0;

  return {
    total,
    processed,
    unprocessed,
    invalidSignatures,
    errors,
  };
}

/**
 * Map database row to WebhookLog interface
 */
function mapToWebhookLog(data: any): WebhookLog {
  return {
    id: data.id,
    instanceName: data.instance_name,
    eventType: data.event_type,
    payload: data.payload,
    signature: data.signature,
    signatureValid: data.signature_valid,
    processed: data.processed,
    errorMessage: data.error_message,
    createdAt: data.created_at,
  };
}
