-- ============================================
-- MIGRATION: Add Multi-Tenant WhatsApp Instances Support
-- Feature: whatsapp-multi-tenant-auto-instance
-- Task: 1 - Setup de infraestrutura e banco de dados
-- ============================================

-- Create whatsapp_instances table
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
  encrypted_api_key TEXT,
  phone_number VARCHAR(20),
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_instance UNIQUE(user_id),
  CONSTRAINT valid_status CHECK (status IN ('disconnected', 'connecting', 'connected'))
);

-- Create indexes for whatsapp_instances
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_last_activity ON whatsapp_instances(last_activity_at);

-- Enable Row Level Security for whatsapp_instances
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_instances
DROP POLICY IF EXISTS "Users can view own whatsapp instance" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert own whatsapp instance" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can update own whatsapp instance" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete own whatsapp instance" ON whatsapp_instances;

CREATE POLICY "Users can view own whatsapp instance"
  ON whatsapp_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp instance"
  ON whatsapp_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whatsapp instance"
  ON whatsapp_instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own whatsapp instance"
  ON whatsapp_instances FOR DELETE
  USING (auth.uid() = user_id);

-- Create whatsapp_connection_history table
CREATE TABLE IF NOT EXISTS whatsapp_connection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN ('connected', 'disconnected', 'created', 'deleted', 'error'))
);

-- Create indexes for whatsapp_connection_history
CREATE INDEX IF NOT EXISTS idx_connection_history_user_id ON whatsapp_connection_history(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_history_created_at ON whatsapp_connection_history(created_at DESC);

-- Enable Row Level Security for whatsapp_connection_history
ALTER TABLE whatsapp_connection_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_connection_history
DROP POLICY IF EXISTS "Users can view own connection history" ON whatsapp_connection_history;
DROP POLICY IF EXISTS "Users can insert own connection history" ON whatsapp_connection_history;

CREATE POLICY "Users can view own connection history"
  ON whatsapp_connection_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connection history"
  ON whatsapp_connection_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create whatsapp_webhook_logs table
CREATE TABLE IF NOT EXISTS whatsapp_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  signature VARCHAR(255),
  signature_valid BOOLEAN,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for whatsapp_webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_instance ON whatsapp_webhook_logs(instance_name);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON whatsapp_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON whatsapp_webhook_logs(processed);

-- Note: No RLS on webhook_logs as it's accessed by system, not users directly

-- Create rate_limit_records table
CREATE TABLE IF NOT EXISTS rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_endpoint_window UNIQUE(user_id, endpoint, window_start)
);

-- Create indexes for rate_limit_records
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint ON rate_limit_records(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_end ON rate_limit_records(window_end);

-- Enable Row Level Security for rate_limit_records
ALTER TABLE rate_limit_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limit_records (system access only)
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limit_records;

CREATE POLICY "Service role can manage rate limits"
  ON rate_limit_records
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at on whatsapp_instances
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_whatsapp_instances_updated_at ON whatsapp_instances;
CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limit_records_updated_at ON rate_limit_records;
CREATE TRIGGER update_rate_limit_records_updated_at
  BEFORE UPDATE ON rate_limit_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- END OF MIGRATION
-- ============================================
