# 🚨 CORREÇÃO URGENTE: API URL no Netlify

## ❌ Problema Identificado

O erro 404 está acontecendo porque a variável `VITE_API_URL` no Netlify está configurada **SEM** o `/api` no final.

### O que está acontecendo:

```
🌐 API URL: https://google-review-whatsapp.onrender.com
❌ Tentando acessar: https://google-review-whatsapp.onrender.com/clients/metrics
✅ Deveria acessar: https://google-review-whatsapp.onrender.com/api/clients/metrics
```

---

## ✅ Solução Rápida

### Passo 1: Acessar Netlify

1. Acesse: https://app.netlify.com
2. Clique no seu site
3. Vá em **"Site settings"** → **"Environment variables"**

### Passo 2: Corrigir VITE_API_URL

1. Encontre a variável `VITE_API_URL`
2. Clique em **"Options"** → **"Edit"**
3. **Valor CORRETO:**

```
https://google-review-whatsapp.onrender.com/api
```

**⚠️ IMPORTANTE:** Tem que ter `/api` no final!

4. Clique em **"Save"**

### Passo 3: Fazer Redeploy

1. Vá em **"Deploys"**
2. Clique em **"Trigger deploy"** → **"Deploy site"**
3. Aguarde 2-3 minutos

---

## 🔍 Como Verificar se Está Correto

Depois do redeploy, abra o console do navegador (F12) e você deve ver:

```
🌐 API URL: https://google-review-whatsapp.onrender.com/api
```

**Com `/api` no final!**

---

## 📋 Checklist de Variáveis Corretas

Verifique se TODAS as 3 variáveis estão assim no Netlify:

### ✅ VITE_SUPABASE_URL
```
https://cuychbunipzwfaitnbor.supabase.co
```

### ✅ VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
```

### ✅ VITE_API_URL (CORRIGIR ESTA!)
```
https://google-review-whatsapp.onrender.com/api
```

**⚠️ Não esqueça do `/api` no final!**

---

## 🎯 Resumo

**Problema:** Faltou `/api` no final da URL do backend  
**Solução:** Adicionar `/api` na variável `VITE_API_URL` no Netlify  
**Tempo:** 2-3 minutos para corrigir + 2-3 minutos de redeploy  

Depois disso, o site vai funcionar perfeitamente! 🎉
