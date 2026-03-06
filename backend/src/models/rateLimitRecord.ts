import { supabase } from '../lib/supabase';

export interface RateLimitRecord {
  id: string;
  userId: string;
  endpoint: string;
  requestCount: number;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateLimitRecordInput {
  userId: string;
  endpoint: string;
  windowDurationMs: number;
}

export interface IncrementRateLimitInput {
  userId: string;
  endpoint: string;
  windowDurationMs: number;
}

/**
 * Create or increment rate limit record
 * Returns the current count after increment
 */
export async function incrementRateLimit(
  input: IncrementRateLimitInput
): Promise<{ count: number; resetTime: string }> {
  const now = new Date();
  const windowStart = now.toISOString();
  const windowEnd = new Date(now.getTime() + input.windowDurationMs).toISOString();

  // Try to find existing record within current window
  const { data: existing, error: findError } = await supabase
    .from('rate_limit_records')
    .select('*')
    .eq('user_id', input.userId)
    .eq('endpoint', input.endpoint)
    .gt('window_end', now.toISOString())
    .order('window_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to check rate limit: ${findError.message}`);
  }

  if (existing) {
    // Increment existing record
    const { data: updated, error: updateError } = await supabase
      .from('rate_limit_records')
      .update({
        request_count: existing.request_count + 1,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to increment rate limit: ${updateError.message}`);
    }

    return {
      count: updated.request_count,
      resetTime: updated.window_end,
    };
  } else {
    // Create new record
    const { data: created, error: createError } = await supabase
      .from('rate_limit_records')
      .insert({
        user_id: input.userId,
        endpoint: input.endpoint,
        request_count: 1,
        window_start: windowStart,
        window_end: windowEnd,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create rate limit record: ${createError.message}`);
    }

    return {
      count: created.request_count,
      resetTime: created.window_end,
    };
  }
}

/**
 * Get current rate limit status for a user and endpoint
 */
export async function getRateLimitStatus(
  userId: string,
  endpoint: string
): Promise<{ count: number; resetTime: string } | null> {
  const now = new Date();

  const { data, error } = await supabase
    .from('rate_limit_records')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gt('window_end', now.toISOString())
    .order('window_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get rate limit status: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    count: data.request_count,
    resetTime: data.window_end,
  };
}

/**
 * Check if user is rate limited for an endpoint
 */
export async function isRateLimited(
  userId: string,
  endpoint: string,
  maxRequests: number
): Promise<{ limited: boolean; resetTime?: string; currentCount?: number }> {
  const status = await getRateLimitStatus(userId, endpoint);

  if (!status) {
    return { limited: false };
  }

  if (status.count >= maxRequests) {
    return {
      limited: true,
      resetTime: status.resetTime,
      currentCount: status.count,
    };
  }

  return {
    limited: false,
    currentCount: status.count,
  };
}

/**
 * Reset rate limit for a user and endpoint
 */
export async function resetRateLimit(
  userId: string,
  endpoint: string
): Promise<void> {
  const { error } = await supabase
    .from('rate_limit_records')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  if (error) {
    throw new Error(`Failed to reset rate limit: ${error.message}`);
  }
}

/**
 * Cleanup expired rate limit records
 * Returns the number of records deleted
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = new Date();

  const { data, error } = await supabase
    .from('rate_limit_records')
    .delete()
    .lt('window_end', now.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to cleanup expired rate limits: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Get all active rate limits for a user
 */
export async function getActiveRateLimits(
  userId: string
): Promise<RateLimitRecord[]> {
  const now = new Date();

  const { data, error } = await supabase
    .from('rate_limit_records')
    .select('*')
    .eq('user_id', userId)
    .gt('window_end', now.toISOString())
    .order('window_end', { ascending: true });

  if (error) {
    throw new Error(`Failed to get active rate limits: ${error.message}`);
  }

  return data.map(mapToRateLimitRecord);
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(): Promise<{
  totalActive: number;
  totalExpired: number;
  byEndpoint: Record<string, number>;
}> {
  const now = new Date();

  // Get all records
  const { data: allRecords, error: allError } = await supabase
    .from('rate_limit_records')
    .select('endpoint, window_end');

  if (allError) {
    throw new Error(`Failed to get rate limit stats: ${allError.message}`);
  }

  const totalActive = allRecords?.filter(
    r => new Date(r.window_end) > now
  ).length || 0;

  const totalExpired = allRecords?.filter(
    r => new Date(r.window_end) <= now
  ).length || 0;

  const byEndpoint: Record<string, number> = {};
  allRecords?.forEach(record => {
    if (new Date(record.window_end) > now) {
      byEndpoint[record.endpoint] = (byEndpoint[record.endpoint] || 0) + 1;
    }
  });

  return {
    totalActive,
    totalExpired,
    byEndpoint,
  };
}

/**
 * Map database row to RateLimitRecord interface
 */
function mapToRateLimitRecord(data: any): RateLimitRecord {
  return {
    id: data.id,
    userId: data.user_id,
    endpoint: data.endpoint,
    requestCount: data.request_count,
    windowStart: data.window_start,
    windowEnd: data.window_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
