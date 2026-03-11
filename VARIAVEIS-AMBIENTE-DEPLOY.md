# 📋 Variáveis de Ambiente - Deploy

## 🎨 Frontend (Netlify)

### Total: 3 variáveis

```env
VITE_SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU

VITE_API_URL=https://SEU_BACKEND_URL.onrender.com/api
```

**⚠️ Substitua `SEU_BACKEND_URL` pela URL real do Render!**

---

## ⚙️ Backend (Render)

### Total: 10 variáveis

```env
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU

SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q

PORT=3000

NODE_ENV=production

ENCRYPTION_KEY=340013285889db4348a7576ed2843f377811f7da94e8d233440266126e06be95

WEBHOOK_SECRET=wh_secret_a8f3d9c2e1b4567890abcdef12345678

EVOLUTION_API_URL=https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host

EVOLUTION_API_GLOBAL_KEY=429683C4C977415CAAFCCE10F7D50A29

BACKEND_URL=https://SEU_BACKEND_URL.onrender.com
```

**⚠️ Substitua `SEU_BACKEND_URL` pela URL real do Render!**

---

## 📝 Como Copiar e Colar

### No Netlify:

1. Vá em "Site settings" → "Environment variables"
2. Para cada variável:
   - Clique em "Add a variable"
   - **Key:** Cole o nome (ex: `VITE_SUPABASE_URL`)
   - **Value:** Cole o valor
   - Clique em "Create variable"

### No Render:

1. Vá em "Environment"
2. Para cada variável:
   - Clique em "Add Environment Variable"
   - **Key:** Cole o nome (ex: `SUPABASE_URL`)
   - **Value:** Cole o valor
   - Clique em "Save"

---

## ✅ Checklist

### Frontend (Netlify):
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_API_URL (com URL do Render)

### Backend (Render):
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_KEY
- [ ] PORT
- [ ] NODE_ENV
- [ ] ENCRYPTION_KEY
- [ ] WEBHOOK_SECRET
- [ ] EVOLUTION_API_URL
- [ ] EVOLUTION_API_GLOBAL_KEY
- [ ] BACKEND_URL (com URL do Render)

---

## 🔐 Segurança

**NUNCA compartilhe:**
- `SUPABASE_SERVICE_KEY`
- `ENCRYPTION_KEY`
- `WEBHOOK_SECRET`
- `EVOLUTION_API_GLOBAL_KEY`

Essas são chaves secretas que dão acesso total ao sistema!
