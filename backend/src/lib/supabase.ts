import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client com service_role key (acesso total - apenas backend)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Tipos do banco de dados
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      business: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          whatsapp_number: string;
          google_review_link: string;
          default_message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          whatsapp_number: string;
          google_review_link: string;
          default_message: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          whatsapp_number?: string;
          google_review_link?: string;
          default_message?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          phone: string;
          satisfied: boolean;
          complained: boolean;
          review_status: 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';
          sent_at: string | null;
          reviewed_at: string | null;
          attendance_date: string;
          import_source: 'manual' | 'auto-imported';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          phone: string;
          satisfied?: boolean;
          complained?: boolean;
          review_status?: 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';
          sent_at?: string | null;
          reviewed_at?: string | null;
          attendance_date?: string;
          import_source?: 'manual' | 'auto-imported';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          phone?: string;
          satisfied?: boolean;
          complained?: boolean;
          review_status?: 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';
          sent_at?: string | null;
          reviewed_at?: string | null;
          attendance_date?: string;
          import_source?: 'manual' | 'auto-imported';
          created_at?: string;
        };
      };
      evolution_api_config: {
        Row: {
          id: string;
          user_id: string;
          api_url: string;
          encrypted_api_key: string;
          instance_name: string;
          webhook_secret: string;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_url: string;
          encrypted_api_key: string;
          instance_name: string;
          webhook_secret: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          api_url?: string;
          encrypted_api_key?: string;
          instance_name?: string;
          webhook_secret?: string;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_instances: {
        Row: {
          id: string;
          user_id: string;
          instance_name: string;
          status: 'disconnected' | 'connecting' | 'connected';
          encrypted_api_key: string | null;
          phone_number: string | null;
          connected_at: string | null;
          disconnected_at: string | null;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_name: string;
          status?: 'disconnected' | 'connecting' | 'connected';
          encrypted_api_key?: string | null;
          phone_number?: string | null;
          connected_at?: string | null;
          disconnected_at?: string | null;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_name?: string;
          status?: 'disconnected' | 'connecting' | 'connected';
          encrypted_api_key?: string | null;
          phone_number?: string | null;
          connected_at?: string | null;
          disconnected_at?: string | null;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_connection_history: {
        Row: {
          id: string;
          user_id: string;
          instance_name: string;
          event_type: 'connected' | 'disconnected' | 'created' | 'deleted' | 'error';
          status: string;
          details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_name: string;
          event_type: 'connected' | 'disconnected' | 'created' | 'deleted' | 'error';
          status: string;
          details?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_name?: string;
          event_type?: 'connected' | 'disconnected' | 'created' | 'deleted' | 'error';
          status?: string;
          details?: Record<string, any> | null;
          created_at?: string;
        };
      };
      whatsapp_webhook_logs: {
        Row: {
          id: string;
          instance_name: string;
          event_type: string;
          payload: Record<string, any>;
          signature: string | null;
          signature_valid: boolean | null;
          processed: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          instance_name: string;
          event_type: string;
          payload: Record<string, any>;
          signature?: string | null;
          signature_valid?: boolean | null;
          processed?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          instance_name?: string;
          event_type?: string;
          payload?: Record<string, any>;
          signature?: string | null;
          signature_valid?: boolean | null;
          processed?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
      };
      rate_limit_records: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          request_count: number;
          window_start: string;
          window_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          request_count?: number;
          window_start: string;
          window_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          request_count?: number;
          window_start?: string;
          window_end?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
