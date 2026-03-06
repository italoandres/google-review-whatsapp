# Multi-Tenant WhatsApp Instances Migration Guide

## Overview

This migration adds support for multi-tenant WhatsApp instance auto-creation via Evolution API. It creates 4 new database tables to manage instances, connection history, webhook logs, and rate limiting.

## Prerequisites

- Supabase project with admin access
- Evolution API instance with global API key
- Backend server with environment variables configured

## Migration Files

1. **add_multi_tenant_whatsapp_instances.sql** - Creates all required tables
2. **rollback_multi_tenant_whatsapp_instances.sql** - Rollback script (if needed)

## Tables Created

### 1. whatsapp_instances
Stores WhatsApp instance data per user.

**Columns:**
- `id` - UUID primary key
- `user_id` - Reference to auth.users
- `instance_name` - Unique instance identifier (format: user-{userId})
- `status` - Connection status (disconnected, connecting, connected)
- `encrypted_api_key` - Encrypted Evolution API key
- `phone_number` - Connected WhatsApp phone number
- `connected_at` - Timestamp of last connection
- `disconnected_at` - Timestamp of last disconnection
- `last_activity_at` - Timestamp of last activity
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

**Constraints:**
- One instance per user (UNIQUE constraint on user_id)
- Valid status values only
- RLS enabled (users can only access their own instance)

### 2. whatsapp_connection_history
Tracks connection/disconnection events.

**Columns:**
- `id` - UUID primary key
- `user_id` - Reference to auth.users
- `instance_name` - Instance identifier
- `event_type` - Type of event (connected, disconnected, created, deleted, error)
- `status` - Status at time of event
- `details` - JSONB field for additional event data
- `created_at` - Event timestamp

**Constraints:**
- Valid event types only
- RLS enabled (users can only view their own history)

### 3. whatsapp_webhook_logs
Logs webhook events from Evolution API.

**Columns:**
- `id` - UUID primary key
- `instance_name` - Instance that triggered the event
- `event_type` - Type of webhook event
- `payload` - JSONB field with full event payload
- `signature` - Webhook signature for validation
- `signature_valid` - Whether signature was valid
- `processed` - Whether event was processed
- `error_message` - Error message if processing failed
- `created_at` - Log timestamp

**Note:** No RLS on this table (system access only)

### 4. rate_limit_records
Tracks rate limiting per user and endpoint.

**Columns:**
- `id` - UUID primary key
- `user_id` - Reference to auth.users
- `endpoint` - API endpoint being rate limited
- `request_count` - Number of requests in current window
- `window_start` - Start of rate limit window
- `window_end` - End of rate limit window
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

**Constraints:**
- Unique per user, endpoint, and window
- RLS enabled (service role access only)

## Step-by-Step Migration

### Step 1: Backup Database

Before running any migration, create a backup:

```bash
# Using Supabase CLI
supabase db dump -f backup_before_multi_tenant.sql

# Or via Supabase Dashboard:
# Settings > Database > Database Backups > Create Backup
```

### Step 2: Update Environment Variables

Add the following to your `.env` file:

```bash
# Evolution API (Multi-Tenant WhatsApp Instances)
EVOLUTION_API_URL=https://your-evolution-api.example.com
EVOLUTION_API_GLOBAL_KEY=your-global-api-key-here

# Backend URL (for webhook configuration)
BACKEND_URL=http://localhost:3000

# Webhook Security
WEBHOOK_SECRET=your-webhook-secret-here

# Rate Limiting (optional - defaults shown)
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=3

# QR Code Settings (optional - defaults shown)
QR_CODE_EXPIRY_SECONDS=60
MAX_POLLING_ATTEMPTS=60
POLLING_INTERVAL_MS=3000
```

**Generate secure keys:**

```bash
# Generate WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Run Migration

#### Option A: Via Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `add_multi_tenant_whatsapp_instances.sql`
4. Paste and click "Run"
5. Verify all tables were created successfully

#### Option B: Via Supabase CLI

```bash
supabase db push --file migrations/add_multi_tenant_whatsapp_instances.sql
```

#### Option C: Via psql

```bash
psql -h your-db-host -U postgres -d postgres -f migrations/add_multi_tenant_whatsapp_instances.sql
```

### Step 4: Verify Migration

Run the following SQL to verify tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'whatsapp_instances',
  'whatsapp_connection_history',
  'whatsapp_webhook_logs',
  'rate_limit_records'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'whatsapp_instances',
  'whatsapp_connection_history',
  'whatsapp_webhook_logs',
  'rate_limit_records'
);

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'whatsapp_instances',
  'whatsapp_connection_history',
  'whatsapp_webhook_logs',
  'rate_limit_records'
);
```

Expected output:
- 4 tables created
- RLS enabled on all tables
- Multiple indexes created

### Step 5: Test Configuration Validation

Start your backend server to test configuration validation:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Configuration validated successfully
📍 Backend URL: http://localhost:3000
🔗 Evolution API: https://your-evolution-api.example.com
🗄️  Supabase: https://your-project.supabase.co
⚙️  Environment: development
🚀 Servidor rodando na porta 3000
```

If configuration is invalid, you'll see clear error messages indicating what needs to be fixed.

### Step 6: Run Tests

Verify the configuration validation works correctly:

```bash
cd backend
npm test -- environment.test.ts
```

All tests should pass.

## Rollback Procedure

If you need to rollback the migration:

### Step 1: Backup Current Data

```sql
-- Export data from new tables (if any)
COPY whatsapp_instances TO '/tmp/whatsapp_instances_backup.csv' CSV HEADER;
COPY whatsapp_connection_history TO '/tmp/connection_history_backup.csv' CSV HEADER;
COPY whatsapp_webhook_logs TO '/tmp/webhook_logs_backup.csv' CSV HEADER;
COPY rate_limit_records TO '/tmp/rate_limit_backup.csv' CSV HEADER;
```

### Step 2: Run Rollback Script

```bash
psql -h your-db-host -U postgres -d postgres -f migrations/rollback_multi_tenant_whatsapp_instances.sql
```

Or via Supabase Dashboard SQL Editor:
1. Copy contents of `rollback_multi_tenant_whatsapp_instances.sql`
2. Paste and run

### Step 3: Remove Environment Variables

Remove the new environment variables from your `.env` file.

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

## Troubleshooting

### Error: "Missing required environment variable"

**Solution:** Ensure all required environment variables are set in your `.env` file. Check `.env.example` for reference.

### Error: "ENCRYPTION_KEY must be 64 hex characters"

**Solution:** Generate a new encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Error: "EVOLUTION_API_URL must be a valid URL"

**Solution:** Ensure the URL includes protocol (http:// or https://) and is properly formatted.

### Error: "relation already exists"

**Solution:** The tables already exist. Either:
1. Drop the tables manually and re-run migration
2. Skip migration if tables are already correct
3. Run rollback script first, then re-run migration

### Error: "permission denied for table"

**Solution:** Ensure you're using a user with sufficient privileges (postgres user or service role key).

## Post-Migration Tasks

1. **Update API Documentation** - Document new endpoints for instance management
2. **Configure Evolution API** - Ensure Evolution API is accessible from backend
3. **Test Webhook Endpoint** - Verify webhook endpoint is accessible from Evolution API
4. **Monitor Logs** - Watch for any configuration or connection issues
5. **Test Instance Creation** - Create a test instance to verify end-to-end flow

## Security Considerations

1. **Encryption Key** - Keep ENCRYPTION_KEY secure and never commit to version control
2. **Webhook Secret** - Use a strong random value for WEBHOOK_SECRET
3. **Evolution API Key** - Protect EVOLUTION_API_GLOBAL_KEY as it has admin privileges
4. **RLS Policies** - Verify RLS policies are working correctly before production use
5. **HTTPS** - Always use HTTPS for Evolution API and backend URLs in production

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Evolution API is accessible from backend
4. Check Supabase logs for database errors
5. Review migration SQL for any syntax errors

## Next Steps

After successful migration:

1. Implement instance creation endpoint (Task 2)
2. Implement QR code retrieval endpoint (Task 3)
3. Implement connection status endpoint (Task 4)
4. Implement webhook handler (Task 5)
5. Build frontend UI for WhatsApp connection (Task 6)

## References

- **Spec**: `.kiro/specs/whatsapp-multi-tenant-auto-instance/`
- **Requirements**: Requirements 9.1, 9.2, 9.3, 9.4, 25.1
- **Design**: See design.md for complete architecture
- **Evolution API Docs**: https://doc.evolution-api.com/
