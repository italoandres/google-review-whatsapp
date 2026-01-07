import axios, { AxiosInstance, AxiosError } from 'axios';

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

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - limpar e redirecionar para login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos
export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Business {
  id: number;
  userId: number;
  businessName: string;
  whatsappNumber: string;
  googleReviewLink: string;
  defaultMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  userId: number;
  name: string | null;
  phone: string;
  satisfied: boolean;
  complained: boolean;
  reviewStatus: 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';
  sentAt: string | null;
  reviewedAt: string | null;
  attendanceDate: string;
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

// API de Autenticação
export const authApi = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
};

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
  getAll: async (): Promise<Client[]> => {
    const response = await api.get<{ clients: Client[] }>('/clients');
    return response.data.clients;
  },

  getById: async (id: number): Promise<Client> => {
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

  requestReview: async (id: number): Promise<RequestReviewResponse> => {
    const response = await api.post<RequestReviewResponse>(`/clients/${id}/request-review`);
    return response.data;
  },

  markAsReviewed: async (id: number): Promise<Client> => {
    const response = await api.post<Client>(`/clients/${id}/mark-reviewed`);
    return response.data;
  },

  getMetrics: async (): Promise<Metrics> => {
    const response = await api.get<Metrics>('/clients/metrics');
    return response.data;
  },
};

export default api;
