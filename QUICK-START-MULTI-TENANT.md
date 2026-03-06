# Quick Start: Multi-Tenant WhatsApp Instances

## 🚀 Task 1 Complete - Infrastructure Ready!

### What's Been Done

✅ **4 Database Tables Created**
- whatsapp_instances
- whatsapp_connection_history  
- whatsapp_webhook_logs
- rate_limit_records

✅ **Configuration Validation**
- Automatic validation on server startup
- Clear error messages for missing/invalid config
- 12 unit tests passing

✅ **Environment Variables**
- New variables added to .env.example
- Required and optional variables documented

---

## 🔧 Setup Instructions

### Step 1: Add Environment Variables

Edit `backend/.env` and add:

```bash
# Evolution API (Multi-Tenant WhatsApp Instances)
EVOLUTION_API_URL=https://your-evolution-api.example.com
EVOLUTION_API_GLOBAL_KEY=your-global-api-key-here

# Backend URL (for webhook configuration)
BACKEND_URL=http://localhost:3000

# Webhook Security (generate with command below)
WEBHOOK_SECRET=your-webhook-secret-here
```

**Generate WEBHOOK_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Run Database Migration

**Option A - Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy contents of `migrations/add_multi_tenant_whatsapp_instances.sql`
5. Paste and click "Run"

**Option B - Supabase CLI:**
```bash
supabase db push --file migrations/add_multi_tenant_whatsapp_instances.sql
```

### Step 3: Verify Setup

Start the backend:
```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Configuration validated successfully
📍 Backend URL: http://localhost:3000
🔗 Evolution API: https://your-evolution-api.example.com
🗄️  Supabase: https://your-project.supabase.co
⚙️  Environment: development
🚀 Servidor rodando na porta 3000
```

**If you see errors:**
- Check that all required environment variables are set
- Verify URLs are properly formatted (include http:// or https://)
- Ensure ENCRYPTION_KEY is 64 hex characters

### Step 4: Run Tests

```bash
cd backend
npm test -- environment.test.ts
```

Should show: **12 tests passed**

---

## 📋 Verification Checklist

After migration, verify in Supabase:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'whatsapp_%' OR table_name = 'rate_limit_records';

-- Should return 4 tables:
-- whatsapp_instances
-- whatsapp_connection_history
-- whatsapp_webhook_logs
-- rate_limit_records
```

---

## 🔐 Security Reminders

1. ✅ Never commit `.env` file to git
2. ✅ Use strong random values for WEBHOOK_SECRET
3. ✅ Protect EVOLUTION_API_GLOBAL_KEY (has admin privileges)
4. ✅ Use HTTPS for all URLs in production
5. ✅ Keep ENCRYPTION_KEY secure (used for API key encryption)

---

## 📚 Documentation

- **Full Migration Guide:** `migrations/MULTI_TENANT_MIGRATION_GUIDE.md`
- **Implementation Summary:** `TASK-1-IMPLEMENTATION-SUMMARY.md`
- **Spec Requirements:** `.kiro/specs/whatsapp-multi-tenant-auto-instance/requirements.md`

---

## ❓ Troubleshooting

### Error: "Missing required environment variable: EVOLUTION_API_URL"
**Fix:** Add EVOLUTION_API_URL to your `.env` file

### Error: "EVOLUTION_API_URL must be a valid URL"
**Fix:** Ensure URL includes protocol: `https://example.com` (not `example.com`)

### Error: "ENCRYPTION_KEY must be 64 hex characters"
**Fix:** Generate new key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Error: "relation already exists"
**Fix:** Tables already created. Either:
- Skip migration (tables are ready)
- Run rollback first: `migrations/rollback_multi_tenant_whatsapp_instances.sql`

---

## ✅ Next Steps

Task 1 is complete! Ready for:

- **Task 2:** Instance creation endpoint
- **Task 3:** QR code retrieval endpoint  
- **Task 4:** Connection status endpoint
- **Task 5:** Webhook handler
- **Task 6:** Frontend UI

---

## 🆘 Need Help?

1. Check server logs for detailed error messages
2. Review `migrations/MULTI_TENANT_MIGRATION_GUIDE.md`
3. Verify all environment variables in `.env.example`
4. Ensure Evolution API is accessible from backend
5. Check Supabase logs for database errors

---

**Status: ✅ Task 1 Complete - Infrastructure Ready!**
