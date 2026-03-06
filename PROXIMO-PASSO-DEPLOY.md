# 🚀 PRÓXIMO PASSO: Deploy no Render

## ✅ Status Atual

- ✅ Sistema funcionando localmente
- ✅ Código no GitHub (commit: "Migração para Supabase concluída")
- ✅ Tabelas criadas no Supabase
- ⏳ **PRÓXIMO:** Deploy do backend no Render

---

## 📋 O que você precisa fazer AGORA

### 1. Acessar o Render

Acesse: https://dashboard.render.com

Se não tem conta, crie uma (é grátis e rápido).

### 2. Criar Web Service

1. Clique em **"New +"** → **"Web Service"**
2. Clique em **"Connect GitHub"** (se ainda não conectou)
3. Selecione o repositório do seu projeto
4. Clique em **"Connect"**

### 3. Configurar o Service

Preencha os campos:

**Name:** `google-review-whatsapp` (ou outro nome que preferir)

**Region:** `Oregon (US West)` (ou mais próximo)

**Branch:** `main`

**Root Directory:** `backend`

**Runtime:** `Node`

**Build Command:**
```
npm install && npm run build
```

⚠️ **IMPORTANTE:** NÃO inclua `npm run init-db` (não existe mais!)

**Start Command:**
```
npm start
```

**Instance Type:** Selecione **"Free"**

### 4. Adicionar Variáveis de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**

Adicione estas 5 variáveis (copie e cole exatamente):

**Variável 1:**
- Key: `SUPABASE_URL`
- Value: `https://cuychbunipzwfaitnbor.supabase.co`

**Variável 2:**
- Key: `SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU`

**Variável 3:**
- Key: `SUPABASE_SERVICE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q`

**Variável 4:**
- Key: `NODE_ENV`
- Value: `production`

**Variável 5:**
- Key: `PORT`
- Value: `10000`

### 5. Criar o Service

1. Clique em **"Create Web Service"**
2. Aguarde o build (2-5 minutos)
3. Acompanhe os logs

### 6. Verificar se funcionou

Após o deploy, você verá uma URL tipo:
```
https://google-review-whatsapp.onrender.com
```

Acesse: `https://sua-url.onrender.com/health`

Se retornar isso, está funcionando! ✅
```json
{"status":"ok","timestamp":"..."}
```

---

## ❌ Se der erro

### Erro: "Missing script: 'init-db'"

**Solução:** Você colocou `npm run init-db` no Build Command. Remova!

O Build Command correto é:
```
npm install && npm run build
```

Para corrigir:
1. Vá em **"Settings"** → **"Build & Deploy"**
2. Edite o **Build Command**
3. Remova `&& npm run init-db`
4. Salve
5. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

### Erro: "Missing Supabase environment variables"

**Solução:** Verifique se adicionou as 3 variáveis do Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

Para corrigir:
1. Vá em **"Environment"**
2. Adicione as variáveis que faltam
3. Clique em **"Save Changes"**
4. O Render fará deploy automaticamente

### Outros erros

Veja os logs no painel do Render e me avise qual erro apareceu.

---

## 📝 Depois que funcionar

1. ✅ Anote a URL do backend
2. 📱 Me avise que funcionou
3. 🚀 Vamos configurar o frontend no Netlify

---

## 📚 Guias Completos

Se quiser mais detalhes, veja:
- `DEPLOY-BACKEND-RENDER.md` - Guia completo do Render
- `DEPLOY-GITHUB.md` - Guia completo de deploy (GitHub + Render + Netlify)

---

**Última atualização:** 09/01/2026
