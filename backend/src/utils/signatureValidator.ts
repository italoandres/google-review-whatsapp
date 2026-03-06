import crypto from 'crypto';

/**
 * Validate webhook signature using HMAC-SHA256
 * Uses constant-time comparison to prevent timing attacks
 * 
 * @param payload - The raw webhook payload as a string
 * @param signature - The signature from the webhook header
 * @param secret - The webhook secret used to generate the signature
 * @returns true if signature is valid, false otherwise
 */
export function validateSignature(payload: string, signature: string, secret: string): boolean {
  // Generate expected signature using HMAC-SHA256
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  // Use constant-time comparison to prevent timing attacks
  // Both buffers must be the same length for timingSafeEqual
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    // timingSafeEqual throws if buffers have different lengths
    return false;
  }
}
