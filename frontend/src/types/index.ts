// Re-exportar tipos do serviço de API
export type { User, AuthResponse, Business, Client, RequestReviewResponse } from '../services/api';

// Tipos adicionais para o frontend
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string>;
  field?: string;
}

export interface FormErrors {
  [key: string]: string;
}
