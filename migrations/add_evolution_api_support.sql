-- ============================================
-- MIGRATION: Add Evolution API Support
-- Feature: WhatsApp Auto-Import
-- ============================================

-- Add import_source column to clients table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'import_source'
  ) THEN
    ALTER TABLE clients
    ADD COLUMN import_source VARCHAR(20) DEFAULT 'manual' 
    CHECK (import_source IN ('manual', 'auto-imported'));
    
    RAISE NOTICE 'Column import_source added to clients table';
  ELSE
    RAISE NOTICE 'Column import_source already exists in clients table';
  END IF;
END $$;

-- Update existing records to have 'manual' import source
UPDATE clients 
SET import_source = 'manual' 
WHERE import_source IS NULL;

-- Add index for filtering by import source (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_clients_import_source'
  ) THEN
    CREATE INDEX idx_clients_import_source 
    ON clients(user_id, import_source);
    
    RAISE NOTICE 'Index idx_clients_import_source created';
  ELSE
    RAISE NOTICE 'Index idx_clients_import_source already exists';
  END IF;
END $$;

-- Create evolution_api_config table (if not exists)
CREATE TABLE IF NOT EXISTS evolution_api_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_url TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add index for fast user lookup (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_evolution_config_user'
  ) THEN
    CREATE INDEX idx_evolution_config_user ON evolution_api_config(user_id);
    
    RAISE NOTICE 'Index idx_evolution_config_user created';
  ELSE
    RAISE NOTICE 'Index idx_evolution_config_user already exists';
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE evolution_api_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evolution_api_config (drop if exists, then create)
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own evolution config" ON evolution_api_config;
  DROP POLICY IF EXISTS "Users can insert own evolution config" ON evolution_api_config;
  DROP POLICY IF EXISTS "Users can update own evolution config" ON evolution_api_config;
  DROP POLICY IF EXISTS "Users can delete own evolution config" ON evolution_api_config;
  
  RAISE NOTICE 'Existing policies dropped (if any)';
END $$;

-- Create RLS policies
CREATE POLICY "Users can view own evolution config"
  ON evolution_api_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evolution config"
  ON evolution_api_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evolution config"
  ON evolution_api_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evolution config"
  ON evolution_api_config FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on evolution_api_config (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_evolution_api_config_updated_at'
  ) THEN
    CREATE TRIGGER update_evolution_api_config_updated_at
      BEFORE UPDATE ON evolution_api_config
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Trigger update_evolution_api_config_updated_at created';
  ELSE
    RAISE NOTICE 'Trigger update_evolution_api_config_updated_at already exists';
  END IF;
END $$;

-- ============================================
-- END OF MIGRATION
-- ============================================
