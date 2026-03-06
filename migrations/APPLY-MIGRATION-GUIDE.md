# How to Apply the Evolution API Migration

## Step-by-Step Guide

### Step 1: Open Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in to your account
3. Select your project

### Step 2: Open SQL Editor

1. In the left sidebar, click on **SQL Editor**
2. Click **New Query** button (top right)

### Step 3: Copy Migration SQL

1. Open the file `migrations/add_evolution_api_support.sql`
2. Copy the entire contents (Ctrl+A, Ctrl+C)

### Step 4: Execute Migration

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for execution to complete

### Step 5: Verify Success

You should see a success message like:
```
Success. No rows returned
```

### Step 6: Test Migration

Run the test script to verify everything is working:

```bash
node migrations/test-migration.js
```

Expected output:
```
✅ Clients table exists
✅ import_source column exists
✅ evolution_api_config table exists
✅ All clients have valid import_source values
```

## What Gets Created

### 1. New Column: `clients.import_source`
- Type: VARCHAR(20)
- Values: 'manual' or 'auto-imported'
- Default: 'manual'
- All existing records updated to 'manual'

### 2. New Table: `evolution_api_config`
- Stores Evolution API credentials per user
- Encrypted API keys
- Row Level Security enabled
- One config per user (UNIQUE constraint)

### 3. Indexes
- `idx_clients_import_source` - Fast filtering by import source
- `idx_evolution_config_user` - Fast user lookup

### 4. RLS Policies
- Users can only view/edit their own Evolution API config
- Full CRUD operations protected by user_id

## Troubleshooting

### Error: "column already exists"
✅ This is fine! The migration was already applied.
Run `test-migration.js` to verify.

### Error: "table already exists"
✅ This is fine! The migration was already applied.
Run `test-migration.js` to verify.

### Error: "permission denied"
❌ Make sure you're using the correct Supabase project.
Check that you have admin access.

### Error: "syntax error"
❌ Make sure you copied the entire SQL file.
Try copying again from the beginning to the end.

## Rollback (If Needed)

If you need to undo the migration:

1. Open Supabase SQL Editor
2. Copy contents of `migrations/rollback_evolution_api_support.sql`
3. Paste and run

⚠️ **Warning:** This will delete the `evolution_api_config` table and all stored configurations!

## Next Steps After Migration

1. ✅ Verify migration with `test-migration.js`
2. ✅ Continue with Task 2: Implement encryption utilities
3. ✅ Update backend code to use new schema
4. ✅ Test the complete feature

## Need Help?

If you encounter issues:
1. Check the Supabase logs in the Dashboard
2. Verify your environment variables are set correctly
3. Make sure you're connected to the correct database
4. Review the migration SQL for any syntax issues
