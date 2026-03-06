import { 
  createClient, 
  createAutoImportedClient, 
  checkPhoneExists,
  type ClientInput,
  type AutoImportClientInput
} from './client';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock phoneNormalizer
jest.mock('../utils/phoneNormalizer', () => ({
  normalizePhone: (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }
    return `+${digits}`;
  }
}));

describe('Client Model - Auto-Import Extensions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAutoImportedClient', () => {
    it('should create client with auto-imported source', async () => {
      const mockClient = {
        id: '123',
        user_id: 'user-1',
        name: 'John Doe',
        phone: '+5511999999999',
        satisfied: false,
        complained: false,
        review_status: 'NOT_SENT',
        import_source: 'auto-imported',
        attendance_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        sent_at: null,
        reviewed_at: null
      };

      const mockSupabaseChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const input: AutoImportClientInput = {
        userId: 'user-1',
        phone: '11999999999',
        name: 'John Doe'
      };

      const result = await createAutoImportedClient(input);

      expect(result.importSource).toBe('auto-imported');
      expect(result.satisfied).toBe(false);
      expect(result.complained).toBe(false);
      expect(result.reviewStatus).toBe('NOT_SENT');
      expect(result.phone).toBe('+5511999999999');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          import_source: 'auto-imported',
          phone: '+5511999999999',
          satisfied: false,
          complained: false,
          review_status: 'NOT_SENT'
        })
      );
    });

    it('should normalize phone number before storing', async () => {
      const mockClient = {
        id: '123',
        user_id: 'user-1',
        name: 'Jane Doe',
        phone: '+5511988888888',
        satisfied: false,
        complained: false,
        review_status: 'NOT_SENT',
        import_source: 'auto-imported',
        attendance_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        sent_at: null,
        reviewed_at: null
      };

      const mockSupabaseChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const input: AutoImportClientInput = {
        userId: 'user-1',
        phone: '(11) 98888-8888',
        name: 'Jane Doe'
      };

      await createAutoImportedClient(input);

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+5511988888888'
        })
      );
    });
  });

  describe('createClient', () => {
    it('should create client with manual source', async () => {
      const mockClient = {
        id: '456',
        user_id: 'user-2',
        name: 'Manual Client',
        phone: '+5511977777777',
        satisfied: true,
        complained: false,
        review_status: 'NOT_SENT',
        import_source: 'manual',
        attendance_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        sent_at: null,
        reviewed_at: null
      };

      const mockSupabaseChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const input: ClientInput = {
        phone: '11977777777',
        name: 'Manual Client',
        satisfied: true,
        complained: false
      };

      const result = await createClient('user-2', input);

      expect(result.importSource).toBe('manual');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          import_source: 'manual',
          phone: '+5511977777777'
        })
      );
    });

    it('should normalize phone number for manual clients', async () => {
      const mockClient = {
        id: '789',
        user_id: 'user-3',
        name: 'Test Client',
        phone: '+5511966666666',
        satisfied: true,
        complained: false,
        review_status: 'NOT_SENT',
        import_source: 'manual',
        attendance_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        sent_at: null,
        reviewed_at: null
      };

      const mockSupabaseChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClient, error: null })
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const input: ClientInput = {
        phone: '(11) 96666-6666',
        satisfied: true,
        complained: false
      };

      await createClient('user-3', input);

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+5511966666666'
        })
      );
    });
  });

  describe('checkPhoneExists', () => {
    it('should use normalized phone for duplicate checking', async () => {
      const mockSupabaseChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: '123' }, 
          error: null 
        })
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const exists = await checkPhoneExists('user-1', '(11) 99999-9999');

      expect(exists).toBe(true);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('phone', '+5511999999999');
    });

    it('should return false when phone does not exist', async () => {
      const mockSupabaseChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116' } 
        })
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      const exists = await checkPhoneExists('user-1', '11988888888');

      expect(exists).toBe(false);
    });

    it('should detect duplicates with different phone formats', async () => {
      const mockSupabaseChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: '123' }, 
          error: null 
        })
      };

      (supabase.from as any).mockReturnValue(mockSupabaseChain);

      // Both formats should normalize to the same value
      const exists1 = await checkPhoneExists('user-1', '11999999999');
      const exists2 = await checkPhoneExists('user-1', '(11) 99999-9999');

      expect(exists1).toBe(true);
      expect(exists2).toBe(true);
      
      // Both should query with the same normalized phone
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('phone', '+5511999999999');
    });
  });
});
