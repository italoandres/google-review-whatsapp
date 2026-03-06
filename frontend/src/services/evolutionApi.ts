import api from './api';

// Tipos
export interface EvolutionConfig {
  configured: boolean;
  apiUrl?: string;
  apiKey?: string;
  instanceName?: string;
  isEnabled?: boolean;
}

export interface EvolutionConfigInput {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  webhookSecret?: string;
}

export interface TestConnectionResponse {
  connected: boolean;
}

export interface ToggleResponse {
  success: boolean;
  enabled: boolean;
}

// API de Evolution
export const evolutionApi = {
  getConfig: async (): Promise<EvolutionConfig> => {
    const response = await api.get<EvolutionConfig>('/evolution/config');
    return response.data;
  },

  saveConfig: async (data: EvolutionConfigInput): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>('/evolution/config', data);
    return response.data;
  },

  testConnection: async (data: {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
  }): Promise<TestConnectionResponse> => {
    const response = await api.post<TestConnectionResponse>('/evolution/test-connection', data);
    return response.data;
  },

  toggleAutoImport: async (enabled: boolean): Promise<ToggleResponse> => {
    const response = await api.post<ToggleResponse>('/evolution/toggle', { enabled });
    return response.data;
  },
};
