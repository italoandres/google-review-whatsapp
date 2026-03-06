# Database Migrations

This folder contains database migration scripts for the WhatsApp Auto-Import feature.

## Evolution API Support Migration

### Files

- `add_evolution_api_support.sql` - Main migration script
- `rollback_evolution_api_support.sql` - Rollback script
- `test-migration.js` - Test script to verify migration

### What This Migration Does

1. Adds `import_source` column to `clients` table
   - Values: 'manual' or 'auto-imported'
   - Default: 'manual'
   - Updates all existing records to 'manual'

2. Creates `evolution_api_config` table
   - Stores Evolution API credentials per user
   - Includes encryption for API keys
   - Has Row Level Security (RLS) policies

3. Adds necessary indexes for performance

### How to Apply Migration

#### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `add_evolution_api_support.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute

#### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### How to Test Migration

After applying the migration, run the test script:

```bash
cd migrations
node test-migration.js
```

The test script will verify:
- ✅ `clients` table has `import_source` column
- ✅ `evolution_api_config` table exists
- ✅ All existing clients have `import_source = 'manual'`
- ✅ RLS policies are in place

### How to Rollback

If you need to rollback the migration:

1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `rollback_evolution_api_support.sql`
3. Paste and run

**Warning:** Rolling back will delete the `evolution_api_config` table and all Evolution API configurations.

### Migration Details

#### New Column: `clients.import_source`

```sql
ALTER TABLE clients
ADD COLUMN import_source VARCHAR(20) DEFAULT 'manual' 
CHECK (import_source IN ('manual', 'auto-imported'));
```

#### New Table: `evolution_api_config`

```sql
CREATE TABLE evolution_api_config (
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
```

### Troubleshooting

**Error: "column already exists"**
- The migration has already been applied
- Run `test-migration.js` to verify

**Error: "table already exists"**
- The migration has already been applied
- Run `test-migration.js` to verify

**Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"**
- Make sure your `backend/.env` file has these variables set
- Check that the path in `test-migration.js` is correct

### Requirements Validated

This migration validates the following requirements:
- 9.1: Client_Record table includes `import_source` column
- 9.2: Client_Record table includes `created_at` timestamp (already exists)
- 9.3: System creates `evolution_api_config` table
- 9.4: `evolution_api_config` table includes required columns
- 9.5: Database migrations applied without data loss
- 9.6: Existing records have `import_source` set to "manual"
