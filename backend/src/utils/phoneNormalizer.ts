/**
 * Phone Normalizer Utility
 * 
 * Converts phone numbers from various formats to E.164 format for consistent storage
 * and duplicate detection.
 * 
 * E.164 format: +[country code][number]
 * Example: +5511999999999
 */

/**
 * Normalizes a phone number to E.164 format
 * 
 * Handles:
 * - Various formatting (spaces, dashes, parentheses)
 * - Brazilian numbers (with or without country code)
 * - International numbers
 * 
 * @param phone - Phone number in any format
 * @returns Phone number in E.164 format (+[country][number])
 * 
 * @example
 * normalizePhone("(11) 99999-9999") // "+5511999999999"
 * normalizePhone("11 99999-9999")   // "+5511999999999"
 * normalizePhone("5511999999999")   // "+5511999999999"
 * normalizePhone("+1234567890")     // "+1234567890"
 */
export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Check if the original phone had a + prefix (indicates explicit country code)
  const hasExplicitCountryCode = phone.trim().startsWith('+');

  // Remove all non-digit characters (spaces, dashes, parentheses, etc.)
  const digits = phone.replace(/\D/g, '');

  // If empty after cleaning, return empty string
  if (!digits) {
    return '';
  }

  // If the original had a + prefix, it already has a country code
  if (hasExplicitCountryCode) {
    return `+${digits}`;
  }

  // For 10-11 digit numbers without explicit country code, assume Brazil (+55)
  // 10 digits: DDD (2) + number (8) - old landline format
  // 11 digits: DDD (2) + 9 + number (8) - mobile format
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  // For 12-13 digit numbers starting with 55, it's Brazilian with country code
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `+${digits}`;
  }

  // For other numbers with 12+ digits, assume they already have country code
  if (digits.length >= 12) {
    return `+${digits}`;
  }

  // For shorter numbers (less than 10 digits), cannot reliably normalize
  // Return with + prefix to maintain E.164-like format
  return `+${digits}`;
}
