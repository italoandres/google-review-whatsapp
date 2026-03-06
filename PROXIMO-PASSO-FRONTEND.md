# 🚀 PRÓXIMO PASSO: Deploy do Frontend no Netlify

## ✅ Backend Funcionando!

O backend está no ar! 🎉

**URL do Backend:** `https://google-review-whatsapp-XXXX.onrender.com`

(Anote essa URL, você vai precisar!)

---

## 📋 O que fazer AGORA

### 1. Acessar o Netlify

Acesse: https://app.netlify.com

Se não tem conta, crie uma (é grátis e rápido).

### 2. Criar Novo Site

1. Clique em **"Add new site"** → **"Import an existing project"**
2. Clique em **"Deploy with GitHub"**
3. Autorize o Netlify a acessar seu GitHub (se ainda não fez)
4. Selecione o repositório `google-review-whatsapp`

### 3. Configurar Build Settings

Preencha os campos:

**Site name:** `meu-sistema-avaliacoes` (ou outro nome que preferir)

**Branch to deploy:** `main`

**Base directory:** `frontend`

**Build command:** `npm run build`

**Publish directory:** `frontend/dist`

### 4. Adicionar Variáveis de Ambiente

**ANTES de clicar em "Deploy"**, role para baixo e clique em **"Show advanced"** → **"New variable"**

Adicione estas 3 variáveis:

**Variável 1:**
- Key: `VITE_API_URL`
- Value: `https://SUA-URL-DO-BACKEND.onrender.com/api`

⚠️ **IMPORTANTE:** Substitua `SUA-URL-DO-BACKEND` pela URL real do seu backend!
⚠️ **NÃO ESQUEÇA** o `/api` no final!

**Variável 2:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://cuychbunipzwfaitnbor.supabase.co`

**Variável 3:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU`

### 5. Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build (2-3 minutos)
3. Anote a URL do frontend (ex: `https://meu-sistema-avaliacoes.netlify.app`)

### 6. Testar

Acesse a URL do frontend e teste:

1. Criar uma conta
2. Fazer login
3. Configurar seu negócio
4. Cadastrar um cliente
5. Solicitar avaliação

---

## ❌ Se der erro

### Erro: "Failed to compile"

**Solução:** Verifique se as 3 variáveis de ambiente foram adicionadas corretamente.

### Erro: "Network Error" ou "Failed to fetch"

**Solução:** 
1. Verifique se a `VITE_API_URL` está correta
2. Verifique se tem `/api` no final
3. Verifique se o backend está funcionando (acesse `/health`)

### Frontend não conecta ao backend

**Solução:** Pode ser CORS. Vou te ajudar a configurar depois.

---

## 📝 Checklist

- [ ] Acessei o Netlify
- [ ] Criei novo site
- [ ] Conectei ao GitHub
- [ ] Configurei Base directory = `frontend`
- [ ] Configurei Build command = `npm run build`
- [ ] Configurei Publish directory = `frontend/dist`
- [ ] Adicionei `VITE_API_URL` (com URL do backend + `/api`)
- [ ] Adicionei `VITE_SUPABASE_URL`
- [ ] Adicionei `VITE_SUPABASE_ANON_KEY`
- [ ] Cliquei em "Deploy site"
- [ ] Aguardei o build
- [ ] Testei o site

---

## 🎯 Resultado Final

Quando tudo estiver pronto:

- 🌐 **Frontend:** `https://seu-site.netlify.app`
- 🔧 **Backend:** `https://seu-backend.onrender.com`
- 🗄️ **Banco:** `https://cuychbunipzwfaitnbor.supabase.co`

Sistema 100% em produção! 🚀

---

**Última atualização:** 09/01/2026
