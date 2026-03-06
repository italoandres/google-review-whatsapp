-- ============================================
-- ROLLBACK: Remove Evolution API Support
-- Feature: WhatsApp Auto-Import
-- ============================================

-- Drop evolution_api_config table (cascades to policies and triggers)
DROP TABLE IF EXISTS evolution_api_config CASCADE;

-- Remove import_source column from clients table
ALTER TABLE clients DROP COLUMN IF EXISTS import_source;

-- Drop index for import source filtering
DROP INDEX IF EXISTS idx_clients_import_source;

-- Drop index for evolution config user lookup
DROP INDEX IF EXISTS idx_evolution_config_user;

-- ============================================
-- END OF ROLLBACK
-- ============================================
