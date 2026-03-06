import { extractContact, EvolutionWebhookPayload, ExtractedContact } from './contactExtractor';

describe('contactExtractor', () => {
  describe('Valid payload processing', () => {
    it('should extract phone and name from valid payload', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: 'John Doe',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '5511999999999',
        name: 'John Doe'
      });
    });

    it('should extract phone and name from international number', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '12025551234@s.whatsapp.net',
            fromMe: false,
            id: 'DEF456'
          },
          pushName: 'Jane Smith',
          message: { conversation: 'Hi there' }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '12025551234',
        name: 'Jane Smith'
      });
    });

    it('should handle UK phone numbers', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '442071234567@s.whatsapp.net',
            fromMe: false,
            id: 'GHI789'
          },
          pushName: 'Bob Johnson',
          message: { conversation: 'Good morning' }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '442071234567',
        name: 'Bob Johnson'
      });
    });
  });

  describe('Missing pushName handling', () => {
    it('should use phone as fallback when pushName is missing', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '5511999999999',
        name: '5511999999999'
      });
    });

    it('should use phone as fallback when pushName is undefined', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511888888888@s.whatsapp.net',
            fromMe: false,
            id: 'XYZ999'
          },
          pushName: undefined,
          message: { conversation: 'Test' }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '5511888888888',
        name: '5511888888888'
      });
    });

    it('should use phone as fallback when pushName is empty string', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511777777777@s.whatsapp.net',
            fromMe: false,
            id: 'LMN456'
          },
          pushName: '',
          message: { conversation: 'Empty name' }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '5511777777777',
        name: '5511777777777'
      });
    });
  });

  describe('fromMe filtering', () => {
    it('should return null when fromMe is true', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: true,  // Message sent by user
            id: 'ABC123'
          },
          pushName: 'John Doe',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      expect(result).toBeNull();
    });

    it('should process message when fromMe is false', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,  // Message received from contact
            id: 'ABC123'
          },
          pushName: 'John Doe',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      expect(result).not.toBeNull();
      expect(result?.phone).toBe('5511999999999');
    });
  });

  describe('Invalid payload handling', () => {
    it('should return null for null payload', () => {
      const result = extractContact(null as any);
      expect(result).toBeNull();
    });

    it('should return null for undefined payload', () => {
      const result = extractContact(undefined as any);
      expect(result).toBeNull();
    });

    it('should return null for payload without data', () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'my-instance'
      } as any;

      const result = extractContact(payload);
      expect(result).toBeNull();
    });

    it('should return null for payload without data.key', () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          message: { conversation: 'Hello' }
        }
      } as any;

      const result = extractContact(payload);
      expect(result).toBeNull();
    });

    it('should return null for payload without remoteJid', () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            fromMe: false,
            id: 'ABC123'
          },
          message: { conversation: 'Hello' }
        }
      } as any;

      const result = extractContact(payload);
      expect(result).toBeNull();
    });

    it('should return null for payload with non-string remoteJid', () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: 123456789,
            fromMe: false,
            id: 'ABC123'
          },
          message: { conversation: 'Hello' }
        }
      } as any;

      const result = extractContact(payload);
      expect(result).toBeNull();
    });

    it('should return null for payload with empty remoteJid', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '',
            fromMe: false,
            id: 'ABC123'
          },
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);
      expect(result).toBeNull();
    });

    it('should return null when remoteJid is only @s.whatsapp.net', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);
      expect(result).toBeNull();
    });
  });

  describe('remoteJid format variations', () => {
    it('should handle remoteJid without @s.whatsapp.net suffix', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: 'John Doe',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '5511999999999',
        name: 'John Doe'
      });
    });

    it('should handle remoteJid with multiple @ symbols', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net@extra',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: 'John Doe',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      // Should only remove first occurrence of @s.whatsapp.net
      expect(result?.phone).toBe('5511999999999@extra');
    });

    it('should handle group chat remoteJid format', () => {
      // Group chats have different format: 123456789-1234567890@g.us
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '123456789-1234567890@g.us',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: 'Group Name',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      // Should not remove @s.whatsapp.net since it's not present
      expect(result?.phone).toBe('123456789-1234567890@g.us');
    });
  });

  describe('Name handling edge cases', () => {
    it('should handle pushName with special characters', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: 'José da Silva 🎉',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      expect(result?.name).toBe('José da Silva 🎉');
    });

    it('should handle pushName with whitespace', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: '  John Doe  ',
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      // Should preserve whitespace as-is (trimming is not the responsibility of this function)
      expect(result?.name).toBe('  John Doe  ');
    });

    it('should handle very long pushName', () => {
      const longName = 'A'.repeat(500);
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'my-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123'
          },
          pushName: longName,
          message: { conversation: 'Hello' }
        }
      };

      const result = extractContact(payload);

      expect(result?.name).toBe(longName);
    });
  });

  describe('Real-world Evolution API payload examples', () => {
    it('should handle typical Brazilian WhatsApp message', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'business-instance',
        data: {
          key: {
            remoteJid: '5511987654321@s.whatsapp.net',
            fromMe: false,
            id: '3EB0C8F5E8A1234567890'
          },
          pushName: 'Maria Santos',
          message: {
            conversation: 'Olá, gostaria de mais informações'
          }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '5511987654321',
        name: 'Maria Santos'
      });
    });

    it('should handle message from contact without saved name', () => {
      const payload: EvolutionWebhookPayload = {
        event: 'messages.upsert',
        instance: 'business-instance',
        data: {
          key: {
            remoteJid: '5521912345678@s.whatsapp.net',
            fromMe: false,
            id: '3EB0C8F5E8A1234567891'
          },
          message: {
            conversation: 'Oi'
          }
        }
      };

      const result = extractContact(payload);

      expect(result).toEqual({
        phone: '5521912345678',
        name: '5521912345678'
      });
    });
  });
});
