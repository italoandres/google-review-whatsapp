import { getConfig, saveConfig, toggleEnabled, getDecryptedApiKey, testConnection } from './evolutionConfig';
import { supabase } from '../lib/supabase';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';

// Mock the supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock the encryption utilities
jest.mock('../utils/encryption', () => ({
  encryptApiKey: jest.fn((key: string) => `encrypted_${key}`),
  decryptApiKey: jest.fn((encrypted: string) => encrypted.replace('encrypted_', ''))
}));

// Mock global fetch
global.fetch = jest.fn();

describe('Evolution API Configuration Model', () => {
  const mockUserId = 'user-123';
  const mockConfig = {
    id: 'config-123',
    user_id: mockUserId,
    api_url: 'https://evolution-api.example.com',
    encrypted_api_key: 'encrypted_test-api-key',
    instance_name: 'test-instance',
    webhook_secret: 'test-webhook-secret',
    is_enabled: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return config when found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockConfig, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await getConfig(mockUserId);

      expect(result).toEqual({
        id: mockConfig.id,
        userId: mockConfig.user_id,
        apiUrl: mockConfig.api_url,
        encryptedApiKey: mockConfig.encrypted_api_key,
        instanceName: mockConfig.instance_name,
        webhookSecret: mockConfig.webhook_secret,
        isEnabled: mockConfig.is_enabled,
        createdAt: mockConfig.created_at,
        updatedAt: mockConfig.updated_at
      });
    });

    it('should return null when config not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await getConfig(mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' }
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      await expect(getConfig(mockUserId)).rejects.toThrow('Error fetching Evolution API configuration');
    });
  });

  describe('saveConfig', () => {
    const mockInput = {
      apiUrl: 'https://evolution-api.example.com',
      apiKey: 'test-api-key',
      instanceName: 'test-instance',
      webhookSecret: 'test-webhook-secret'
    };

    it('should create new config when none exists', async () => {
      // Mock getConfig to return null (no existing config)
      const mockSelectGet = jest.fn().mockReturnThis();
      const mockEqGet = jest.fn().mockReturnThis();
      const mockSingleGet = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock insert
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectInsert = jest.fn().mockReturnThis();
      const mockSingleInsert = jest.fn().mockResolvedValue({
        data: mockConfig,
        error: null
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call is getConfig
          return {
            select: mockSelectGet,
            eq: mockEqGet,
            single: mockSingleGet
          };
        } else {
          // Second call is insert
          return {
            insert: mockInsert,
            select: mockSelectInsert,
            single: mockSingleInsert
          };
        }
      });

      mockSelectGet.mockReturnValue({ eq: mockEqGet });
      mockEqGet.mockReturnValue({ single: mockSingleGet });
      mockInsert.mockReturnValue({ select: mockSelectInsert });
      mockSelectInsert.mockReturnValue({ single: mockSingleInsert });

      const result = await saveConfig(mockUserId, mockInput);

      expect(encryptApiKey).toHaveBeenCalledWith(mockInput.apiKey);
      expect(result.encryptedApiKey).toBe('encrypted_test-api-key');
    });

    it('should update existing config', async () => {
      // Mock getConfig to return existing config
      const mockSelectGet = jest.fn().mockReturnThis();
      const mockEqGet = jest.fn().mockReturnThis();
      const mockSingleGet = jest.fn().mockResolvedValue({
        data: mockConfig,
        error: null
      });

      // Mock update
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEqUpdate = jest.fn().mockReturnThis();
      const mockSelectUpdate = jest.fn().mockReturnThis();
      const mockSingleUpdate = jest.fn().mockResolvedValue({
        data: { ...mockConfig, updated_at: '2024-01-02T00:00:00Z' },
        error: null
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call is getConfig
          return {
            select: mockSelectGet,
            eq: mockEqGet,
            single: mockSingleGet
          };
        } else {
          // Second call is update
          return {
            update: mockUpdate,
            eq: mockEqUpdate,
            select: mockSelectUpdate,
            single: mockSingleUpdate
          };
        }
      });

      mockSelectGet.mockReturnValue({ eq: mockEqGet });
      mockEqGet.mockReturnValue({ single: mockSingleGet });
      mockUpdate.mockReturnValue({ eq: mockEqUpdate });
      mockEqUpdate.mockReturnValue({ select: mockSelectUpdate });
      mockSelectUpdate.mockReturnValue({ single: mockSingleUpdate });

      const result = await saveConfig(mockUserId, mockInput);

      expect(encryptApiKey).toHaveBeenCalledWith(mockInput.apiKey);
      expect(result.encryptedApiKey).toBe('encrypted_test-api-key');
    });
  });

  describe('toggleEnabled', () => {
    it('should enable auto-import', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      });

      mockUpdate.mockReturnValue({ eq: mockEq });

      await toggleEnabled(mockUserId, true);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_enabled: true
        })
      );
    });

    it('should disable auto-import', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      });

      mockUpdate.mockReturnValue({ eq: mockEq });

      await toggleEnabled(mockUserId, false);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_enabled: false
        })
      );
    });

    it('should throw error on database error', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        error: { message: 'Database error' }
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq
      });

      mockUpdate.mockReturnValue({ eq: mockEq });

      await expect(toggleEnabled(mockUserId, true)).rejects.toThrow(
        'Error toggling Evolution API enabled status'
      );
    });
  });

  describe('getDecryptedApiKey', () => {
    it('should return decrypted API key when config exists', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockConfig, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await getDecryptedApiKey(mockUserId);

      expect(decryptApiKey).toHaveBeenCalledWith(mockConfig.encrypted_api_key);
      expect(result).toBe('test-api-key');
    });

    it('should return null when config does not exist', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await getDecryptedApiKey(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('testConnection', () => {
    const mockInput = {
      apiUrl: 'https://evolution-api.example.com',
      apiKey: 'test-api-key',
      instanceName: 'test-instance',
      webhookSecret: 'test-webhook-secret'
    };

    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it('should return true when connection is successful and state is open', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ state: 'open' })
      });

      const result = await testConnection(mockInput);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockInput.apiUrl}/instance/connectionState/${mockInput.instanceName}`,
        {
          method: 'GET',
          headers: {
            'apikey': mockInput.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should return false when connection state is not open', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ state: 'close' })
      });

      const result = await testConnection(mockInput);

      expect(result).toBe(false);
    });

    it('should return false when HTTP response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await testConnection(mockInput);

      expect(result).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await testConnection(mockInput);

      expect(result).toBe(false);
    });

    it('should construct correct URL with apiUrl and instanceName', async () => {
      const customInput = {
        ...mockInput,
        apiUrl: 'https://custom-api.com',
        instanceName: 'custom-instance'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ state: 'open' })
      });

      await testConnection(customInput);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-api.com/instance/connectionState/custom-instance',
        expect.any(Object)
      );
    });

    it('should include API key in request header', async () => {
      const customInput = {
        ...mockInput,
        apiKey: 'custom-api-key-12345'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ state: 'open' })
      });

      await testConnection(customInput);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'apikey': 'custom-api-key-12345'
          })
        })
      );
    });
  });
});
