import axios, { AxiosInstance, AxiosError } from 'axios';
import { supabase } from '../lib/supabase';

// ⚠️ IMPORTANTE: Em produção, NUNCA usar localhost
// A variável VITE_API_URL deve ser configurada no Netlify
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Validar que a URL da API está configurada
if (!API_BASE_URL) {
  console.error('❌ VITE_API_URL não está configurada!');
  console.error('Configure a variável de ambiente no Netlify ou no arquivo .env');
  throw new Error('VITE_API_URL is required');
}

// Validar que não está usando localhost em produção
if (import.meta.env.PROD && (
  API_BASE_URL.includes('localhost') || 
  API_BASE_URL.includes('127.0.0.1') ||
  API_BASE_URL.includes('192.168.')
)) {
  console.error('❌ ERRO: Tentando usar localhost/IP local em produção!');
  console.error('URL configurada:', API_BASE_URL);
  throw new Error('Cannot use localhost or local IP in production');
}

console.log('🌐 API URL:', API_BASE_URL);

// Criar instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token do Supabase
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - fazer logout
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos
export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Business {
  id: string;
  userId: string;
  businessName: string;
  whatsappNumber: string;
  googleReviewLink: string;
  defaultMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string | null;
  phone: string;
  satisfied: boolean;
  complained: boolean;
  reviewStatus: 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';
  sentAt: string | null;
  reviewedAt: string | null;
  attendanceDate: string;
  importSource?: 'manual' | 'auto-imported';
  createdAt: string;
}

export interface Metrics {
  sentToday: number;
  sentWeek: number;
  sentMonth: number;
  reviewedWeek: number;
  reviewedMonth: number;
}

export interface RequestReviewResponse {
  waLink: string;
  client: Client;
}

// WhatsApp Instance Types
export interface WhatsAppInstance {
  instanceName: string;
  status: string;
  qrCode?: string;
}

export interface ConnectionStatusResponse {
  status: 'disconnected' | 'connecting' | 'connected';
  instanceName: string;
  connectedAt?: string;
}

export interface QRCodeResponse {
  qrCode: string;
  expiresIn?: number;
}

export interface DisconnectResponse {
  success: boolean;
  message: string;
}

export interface ReconnectResponse {
  qrCode: string;
  instanceName: string;
}

// API de Negócio
export const businessApi = {
  getConfig: async (): Promise<Business> => {
    const response = await api.get<Business>('/business/config');
    return response.data;
  },

  saveConfig: async (data: {
    businessName: string;
    whatsappNumber: string;
    googleReviewLink: string;
    defaultMessage: string;
  }): Promise<Business> => {
    const response = await api.post<Business>('/business/config', data);
    return response.data;
  },

  updateConfig: async (data: Partial<{
    businessName: string;
    whatsappNumber: string;
    googleReviewLink: string;
    defaultMessage: string;
  }>): Promise<Business> => {
    const response = await api.put<Business>('/business/config', data);
    return response.data;
  },
};

// API de Clientes
export const clientsApi = {
  getAll: async (importSource?: 'manual' | 'auto-imported'): Promise<Client[]> => {
    const params = importSource ? { importSource } : {};
    const response = await api.get<{ clients: Client[] }>('/clients', { params });
    return response.data.clients;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  create: async (data: {
    name?: string;
    phone: string;
    satisfied: boolean;
    complained: boolean;
  }): Promise<Client> => {
    const response = await api.post<Client>('/clients', data);
    return response.data;
  },

  requestReview: async (id: string): Promise<RequestReviewResponse> => {
    const response = await api.post<RequestReviewResponse>(`/clients/${id}/request-review`);
    return response.data;
  },

  markAsReviewed: async (id: string): Promise<Client> => {
    const response = await api.post<Client>(`/clients/${id}/mark-reviewed`);
    return response.data;
  },

  getMetrics: async (): Promise<Metrics> => {
    const response = await api.get<Metrics>('/clients/metrics');
    return response.data;
  },
};

// API de WhatsApp Instance
export const whatsappApi = {
  createInstance: async (): Promise<WhatsAppInstance> => {
    const response = await api.post<WhatsAppInstance>('/evolution/create-instance');
    return response.data;
  },

  getQRCode: async (): Promise<QRCodeResponse> => {
    const response = await api.get<QRCodeResponse>('/evolution/qrcode');
    return response.data;
  },

  getConnectionStatus: async (): Promise<ConnectionStatusResponse> => {
    const response = await api.get<ConnectionStatusResponse>('/evolution/connection-status');
    return response.data;
  },

  disconnect: async (): Promise<DisconnectResponse> => {
    const response = await api.post<DisconnectResponse>('/evolution/disconnect');
    return response.data;
  },

  reconnect: async (): Promise<ReconnectResponse> => {
    const response = await api.post<ReconnectResponse>('/evolution/reconnect');
    return response.data;
  },
};

export default api;
