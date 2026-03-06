import {
  createWhatsAppInstance,
  getWhatsAppInstanceByUserId,
  getWhatsAppInstanceByName,
  updateWhatsAppInstance,
  deleteWhatsAppInstance,
  getDecryptedApiKey,
  updateLastActivity,
} from './whatsappInstance';
import { supabase } from '../lib/supabase';
import * as encryption from '../utils/encryption';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock encryption
jest.mock('../utils/encryption', () => ({
  encryptApiKey: jest.fn((key: string) => `encrypted_${key}`),
  decryptApiKey: jest.fn((encrypted: string) => encrypted.replace('encrypted_', '')),
}));

describe('WhatsAppInstance Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWhatsAppInstance', () => {
    it('should create instance with encrypted API key', async () => {
      const mockData = {
        id: 'instance-123',
        user_id: 'user-456',
        instance_name: 'user-user-456',
        status: 'disconnected',
        encrypted_api_key: 'encrypted_test-key',
        phone_number: null,
        connected_at: null,
        disconnected_at: null,
        last_activity_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockFrom = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      (supabase.from as any) = mockFrom;

      const result = await createWhatsAppInstance({
        userId: 'user-456',
        instanceName: 'user-user-456',
        apiKey: 'test-key',
      });

      expect(encryption.encryptApiKey).toHaveBeenCalledWith('test-key');
      expect(result.userId).toBe('user-456');
      expect(result.instanceName).toBe('user-user-456');
      expect(result.encryptedApiKey).toBe('encrypted_test-key');
    });

    it('should create instance without API key', async () => {
      const mockData = {
        id: 'instance-123',
        user_id: 'user-456',
        instance_name: 'user-user-456',
        status: 'disconnected',
        encrypted_api_key: null,
        phone_number: null,
        connected_at: null,
        disconnected_at: null,
        last_activity_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockFrom = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      (supabase.from as any) = mockFrom;

      const result = await createWhatsAppInstance({
        userId: 'user-456',
        instanceName: 'user-user-456',
      });

      expect(encryption.encryptApiKey).not.toHaveBeenCalled();
      expect(result.encryptedApiKey).toBeNull();
    });

    it('should throw error on database failure', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const mockFrom = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      (supabase.from as any) = mockFrom;

      await expect(
        createWhatsAppInstance({
          userId: 'user-456',
          instanceName: 'user-user-456',
        })
      ).rejects.toThrow('Failed to create WhatsApp instance: Database error');
    });
  });

  describe('getWhatsAppInstanceByUserId', () => {
    it('should return instance for valid user ID', async () => {
      const mockData = {
        id: 'instance-123',
        user_id: 'user-456',
        instance_name: 'user-user-456',
        status: 'connected',
        encrypted_api_key: 'encrypted_key',
        phone_number: '+5511999999999',
        connected_at: '2024-01-15T10:00:00Z',
        disconnected_at: null,
        last_activity_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any) = mockFrom;

      const result = await getWhatsAppInstanceByUserId('user-456');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-456');
      expect(result?.status).toBe('connected');
    });

    it('should return null when instance not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any) = mockFrom;

      const result = await getWhatsAppInstanceByUserId('nonexistent-user');

      expect(result).toBeNull();
    });
  });

  describe('updateWhatsAppInstance', () => {
    it('should update instance status', async () => {
      const mockData = {
        id: 'instance-123',
        user_id: 'user-456',
        instance_name: 'user-user-456',
        status: 'connected',
        encrypted_api_key: 'encrypted_key',
        phone_number: null,
        connected_at: '2024-01-15T10:00:00Z',
        disconnected_at: null,
        last_activity_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

      (supabase.from as any) = mockFrom;

      const result = await updateWhatsAppInstance('user-456', {
        status: 'connected',
        connectedAt: '2024-01-15T10:00:00Z',
      });

      expect(result.status).toBe('connected');
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteWhatsAppInstance', () => {
    it('should delete instance successfully', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ delete: mockDelete });

      (supabase.from as any) = mockFrom;

      await deleteWhatsAppInstance('user-456');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
    });
  });

  describe('getDecryptedApiKey', () => {
    it('should return decrypted API key', async () => {
      const mockData = {
        id: 'instance-123',
        user_id: 'user-456',
        instance_name: 'user-user-456',
        status: 'connected',
        encrypted_api_key: 'encrypted_test-key',
        phone_number: null,
        connected_at: null,
        disconnected_at: null,
        last_activity_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any) = mockFrom;

      const result = await getDecryptedApiKey('user-456');

      expect(encryption.decryptApiKey).toHaveBeenCalledWith('encrypted_test-key');
      expect(result).toBe('test-key');
    });

    it('should return null when instance not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any) = mockFrom;

      const result = await getDecryptedApiKey('nonexistent-user');

      expect(result).toBeNull();
    });
  });
});
