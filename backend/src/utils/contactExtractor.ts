/**
 * Contact Extractor Utility
 * 
 * Extracts contact information (phone number and name) from Evolution API webhook payloads.
 * Filters out messages sent by the user (fromMe: true) and only processes incoming messages.
 */

/**
 * Evolution API webhook payload structure
 */
export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;  // Phone number with @s.whatsapp.net suffix
      fromMe: boolean;    // true if message sent by user, false if received
      id: string;
    };
    pushName?: string;    // Contact name (optional)
    message: any;         // Message content (not used)
  };
}

/**
 * Extracted contact information
 */
export interface ExtractedContact {
  phone: string;  // Phone number without @s.whatsapp.net suffix
  name: string;   // Contact name or phone as fallback
}

/**
 * Extracts contact information from Evolution API webhook payload
 * 
 * Rules:
 * - Only processes incoming messages (fromMe: false)
 * - Extracts phone from remoteJid by removing @s.whatsapp.net suffix
 * - Uses pushName as contact name, or phone as fallback if not available
 * - Returns null for messages sent by the user (fromMe: true)
 * 
 * @param payload - Evolution API webhook payload
 * @returns Extracted contact information or null if message should be filtered
 * 
 * @example
 * const payload = {
 *   event: "messages.upsert",
 *   instance: "my-instance",
 *   data: {
 *     key: {
 *       remoteJid: "5511999999999@s.whatsapp.net",
 *       fromMe: false,
 *       id: "ABC123"
 *     },
 *     pushName: "John Doe",
 *     message: { conversation: "Hello" }
 *   }
 * };
 * 
 * extractContact(payload) // { phone: "5511999999999", name: "John Doe" }
 */
export function extractContact(payload: EvolutionWebhookPayload): ExtractedContact | null {
  // Validate payload structure
  if (!payload || !payload.data || !payload.data.key) {
    return null;
  }

  // Filter out messages sent by the user (fromMe: true)
  if (payload.data.key.fromMe) {
    return null;
  }

  // Extract phone number from remoteJid
  const remoteJid = payload.data.key.remoteJid;
  if (!remoteJid || typeof remoteJid !== 'string') {
    return null;
  }

  // Remove @s.whatsapp.net suffix to get the phone number
  const phone = remoteJid.replace('@s.whatsapp.net', '');

  // If phone is empty after extraction, return null
  if (!phone) {
    return null;
  }

  // Extract name from pushName, use phone as fallback
  const name = payload.data.pushName || phone;

  return {
    phone,
    name
  };
}
