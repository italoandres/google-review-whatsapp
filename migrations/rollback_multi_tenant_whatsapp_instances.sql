-- ============================================
-- ROLLBACK: Multi-Tenant WhatsApp Instances Support
-- Feature: whatsapp-multi-tenant-auto-instance
-- ============================================

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS rate_limit_records CASCADE;
DROP TABLE IF EXISTS whatsapp_webhook_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_connection_history CASCADE;
DROP TABLE IF EXISTS whatsapp_instances CASCADE;

-- Drop the trigger function if no other tables use it
-- (Keep it if other tables still use it)
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- END OF ROLLBACK
-- ============================================
