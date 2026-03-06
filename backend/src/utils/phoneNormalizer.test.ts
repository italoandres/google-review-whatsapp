import { normalizePhone } from './phoneNormalizer';

describe('phoneNormalizer', () => {
  describe('Brazilian phone numbers', () => {
    it('should normalize Brazilian mobile with formatting', () => {
      expect(normalizePhone('(11) 99999-9999')).toBe('+5511999999999');
      expect(normalizePhone('11 99999-9999')).toBe('+5511999999999');
      expect(normalizePhone('11-99999-9999')).toBe('+5511999999999');
    });

    it('should normalize Brazilian mobile without formatting', () => {
      expect(normalizePhone('11999999999')).toBe('+5511999999999');
    });

    it('should normalize Brazilian landline (10 digits)', () => {
      expect(normalizePhone('1133334444')).toBe('+551133334444');
      expect(normalizePhone('(11) 3333-4444')).toBe('+551133334444');
    });

    it('should normalize Brazilian number with country code', () => {
      expect(normalizePhone('5511999999999')).toBe('+5511999999999');
      expect(normalizePhone('+5511999999999')).toBe('+5511999999999');
      expect(normalizePhone('55 11 99999-9999')).toBe('+5511999999999');
    });
  });

  describe('International phone numbers', () => {
    it('should normalize international numbers with country codes', () => {
      expect(normalizePhone('+12025551234')).toBe('+12025551234');
      expect(normalizePhone('+442071234567')).toBe('+442071234567');
      expect(normalizePhone('+33123456789')).toBe('+33123456789');
    });

    it('should handle 11-digit international numbers with explicit country code', () => {
      // 11-digit numbers without country code are assumed to be Brazilian
      // International numbers must have country code prefix
      expect(normalizePhone('12025551234')).toBe('+5512025551234'); // Treated as Brazilian
      expect(normalizePhone('+12025551234')).toBe('+12025551234'); // Explicit US
    });

    it('should normalize UK phone numbers with country code', () => {
      expect(normalizePhone('+442071234567')).toBe('+442071234567');
      expect(normalizePhone('442071234567')).toBe('+442071234567');
    });

    it('should normalize numbers with various country codes', () => {
      expect(normalizePhone('+33123456789')).toBe('+33123456789');
      expect(normalizePhone('+81312345678')).toBe('+81312345678');
      expect(normalizePhone('+861012345678')).toBe('+861012345678');
    });
  });

  describe('Various formatting', () => {
    it('should remove spaces', () => {
      expect(normalizePhone('11 9 9999 9999')).toBe('+5511999999999');
      expect(normalizePhone('55 11 99999 9999')).toBe('+5511999999999');
    });

    it('should remove dashes', () => {
      expect(normalizePhone('11-99999-9999')).toBe('+5511999999999');
      expect(normalizePhone('55-11-99999-9999')).toBe('+5511999999999');
    });

    it('should remove parentheses', () => {
      expect(normalizePhone('(11) 99999-9999')).toBe('+5511999999999');
      expect(normalizePhone('(55) (11) 99999-9999')).toBe('+5511999999999');
    });

    it('should remove mixed formatting', () => {
      expect(normalizePhone('+55 (11) 9 9999-9999')).toBe('+5511999999999');
      expect(normalizePhone('55 (11) 99999-9999')).toBe('+5511999999999');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(normalizePhone('')).toBe('');
    });

    it('should handle null/undefined gracefully', () => {
      expect(normalizePhone(null as any)).toBe('');
      expect(normalizePhone(undefined as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(normalizePhone(123 as any)).toBe('');
    });

    it('should handle string with only non-digit characters', () => {
      expect(normalizePhone('---')).toBe('');
      expect(normalizePhone('()')).toBe('');
      expect(normalizePhone('   ')).toBe('');
    });

    it('should handle very short numbers', () => {
      expect(normalizePhone('123')).toBe('+123');
      expect(normalizePhone('12345')).toBe('+12345');
    });

    it('should handle very long numbers', () => {
      expect(normalizePhone('123456789012345')).toBe('+123456789012345');
    });
  });

  describe('Duplicate detection scenarios', () => {
    it('should normalize equivalent Brazilian numbers to same format', () => {
      const formats = [
        '11999999999',
        '(11) 99999-9999',
        '11 99999-9999',
        '11-99999-9999',
        '+5511999999999',
        '5511999999999',
        '55 11 99999-9999'
      ];

      const normalized = formats.map(normalizePhone);
      const expected = '+5511999999999';

      normalized.forEach(result => {
        expect(result).toBe(expected);
      });
    });

    it('should differentiate numbers with different country codes', () => {
      const br = normalizePhone('11999999999'); // Brazil
      const us = normalizePhone('11999999999'); // Would be Brazil without explicit country code
      
      expect(br).toBe('+5511999999999');
      
      // US number needs explicit country code
      const usExplicit = normalizePhone('111999999999'); // 1 + 11999999999
      expect(usExplicit).toBe('+111999999999');
      expect(usExplicit).not.toBe(br);
    });
  });

  describe('WhatsApp format (from Evolution API)', () => {
    it('should normalize phone from remoteJid format', () => {
      // Evolution API sends phone as: 5511999999999@s.whatsapp.net
      // After removing @s.whatsapp.net suffix, we get: 5511999999999
      const phoneFromWhatsApp = '5511999999999';
      expect(normalizePhone(phoneFromWhatsApp)).toBe('+5511999999999');
    });

    it('should handle international WhatsApp numbers with country code', () => {
      // Evolution API always includes country code (12+ digits)
      const usPhone = '12025551234'; // 11 digits - treated as Brazilian without + prefix
      const usPhoneExplicit = '+12025551234'; // With + prefix - treated as US
      
      expect(normalizePhone(usPhone)).toBe('+5512025551234'); // Assumed Brazilian
      expect(normalizePhone(usPhoneExplicit)).toBe('+12025551234'); // Explicit US
      
      // Longer international numbers (12+ digits) are recognized
      const ukPhone = '442071234567'; // 12 digits
      expect(normalizePhone(ukPhone)).toBe('+442071234567');
    });
  });
});
