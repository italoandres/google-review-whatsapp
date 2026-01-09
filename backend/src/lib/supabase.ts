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
          created_at?: string;
        };
      };
    };
  };
}
