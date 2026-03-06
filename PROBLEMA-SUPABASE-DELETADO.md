# 🚨 PROBLEMA CRÍTICO: Projeto Supabase Não Existe

## ❌ O Que Está Acontecendo

O erro `DNS_PROBE_FINISHED_NXDOMAIN` significa que o domínio **não existe**:

```
cuychbunipzwfaitnbor.supabase.co
```

Isso acontece quando:
- ✅ O projeto Supabase foi **deletado**
- ✅ O projeto Supabase foi **pausado** (plano gratuito inativo)
- ✅ A URL está **incorreta**

---

## 🔍 PASSO 1: Verificar se o Projeto Existe

### Acesse o Dashboard do Supabase:

1. Vá em: https://supabase.com/dashboard
2. Faça login com sua conta
3. Veja se o projeto aparece na lista

### Cenário A: Projeto NÃO aparece na lista
➡️ **O projeto foi deletado ou nunca existiu**
➡️ Vá para **SOLUÇÃO A** abaixo

### Cenário B: Projeto aparece na lista
➡️ **O projeto existe mas pode estar pausado**
➡️ Vá para **SOLUÇÃO B** abaixo

---

## ✅ SOLUÇÃO A: Criar Novo Projeto Supabase

Se o projeto foi deletado, você precisa criar um novo:

### 1. Criar Projeto

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `google-review-whatsapp` (ou qualquer nome)
   - **Database Password:** Crie uma senha forte (ANOTE!)
   - **Region:** Escolha o mais próximo (ex: South America)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos (criação do banco)

### 2. Copiar Credenciais

Após criar o projeto:

1. Vá em **"Settings"** (ícone de engrenagem no menu lateral)
2. Clique em **"API"**
3. Copie:
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (começa com `eyJhbGc...`)
   - **service_role** key (começa com `eyJhbGc...`)

### 3. Criar Tabelas no Banco

1. No Supabase, vá em **"SQL Editor"** (menu lateral)
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `supabase-schema.sql` (na raiz do projeto)
4. Cole no editor SQL
5. Clique em **"Run"** (ou pressione Ctrl+Enter)
6. Aguarde a execução (deve aparecer "Success")

### 4. Aplicar Migration da Evolution API

1. Ainda no **"SQL Editor"**
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo `migrations/add_evolution_api_support.sql`
4. Cole no editor SQL
5. Clique em **"Run"**
6. Aguarde a execução

### 5. Configurar Authentication

1. Vá em **"Authentication"** (menu lateral)
2. Clique em **"URL Configuration"**
3. Configure:
   - **Site URL:** `https://meu-sistema-avaliacoes.netlify.app`
4. Role até **"Redirect URLs"**
5. Clique em **"Add URL"**
6. Adicione: `https://meu-sistema-avaliacoes.netlify.app/**`
7. Clique em **"Save"**

### 6. Atualizar Variáveis no Render (Backend)

1. Acesse: https://dashboard.render.com
2. Clique no seu serviço (`google-review-whatsapp`)
3. Vá em **"Environment"** (menu lateral)
4. Atualize as variáveis:
   - `SUPABASE_URL` = Nova URL do projeto (ex: `https://abcdefgh.supabase.co`)
   - `SUPABASE_ANON_KEY` = Nova anon key
   - `SUPABASE_SERVICE_KEY` = Nova service_role key
5. Clique em **"Save Changes"**
6. O Render vai fazer redeploy automaticamente

### 7. Atualizar Variáveis no Netlify (Frontend)

1. Acesse: https://app.netlify.com
2. Clique no seu site (`meu-sistema-avaliacoes`)
3. Vá em **"Site configuration"** → **"Environment variables"**
4. Atualize as variáveis:
   - `VITE_SUPABASE_URL` = Nova URL do projeto
   - `VITE_SUPABASE_ANON_KEY` = Nova anon key
5. Clique em **"Save"**
6. Vá em **"Deploys"** → **"Trigger deploy"** → **"Clear cache and deploy site"**

### 8. Criar Primeiro Usuário

1. Acesse: https://meu-sistema-avaliacoes.netlify.app
2. Clique em **"Criar conta"**
3. Preencha email e senha
4. Verifique o email de confirmação
5. Clique no link do email
6. Faça login

✅ **Pronto! Sistema funcionando com novo projeto Supabase!**

---

## ✅ SOLUÇÃO B: Reativar Projeto Pausado

Se o projeto existe mas está pausado:

### 1. Verificar Status

1. No dashboard do Supabase, clique no projeto
2. Veja se aparece mensagem de "Paused" ou "Inactive"

### 2. Reativar Projeto

1. Clique em **"Restore project"** ou **"Resume project"**
2. Aguarde a reativação (pode levar alguns minutos)

### 3. Copiar URL Correta

1. Vá em **"Settings"** → **"API"**
2. Copie a **Project URL** correta
3. Atualize as variáveis de ambiente no Render e Netlify (veja passos 6 e 7 da SOLUÇÃO A)

---

## 🧪 Testar Após Correção

1. Acesse: https://meu-sistema-avaliacoes.netlify.app
2. Abra o Console do navegador (F12)
3. Veja se ainda aparece erro de DNS
4. Se não aparecer erro de DNS, tente fazer login
5. Veja se o dashboard carrega

---

## 📋 Checklist

- [ ] Acessei o dashboard do Supabase
- [ ] Verifiquei se o projeto existe
- [ ] Se não existe: Criei novo projeto
- [ ] Se não existe: Copiei as novas credenciais
- [ ] Se não existe: Criei as tabelas com `supabase-schema.sql`
- [ ] Se não existe: Apliquei migration `add_evolution_api_support.sql`
- [ ] Se não existe: Configurei Authentication URLs
- [ ] Atualizei variáveis no Render
- [ ] Atualizei variáveis no Netlify
- [ ] Fiz deploy com "Clear cache" no Netlify
- [ ] Testei o sistema

---

## ❓ Ainda com Dúvidas?

Se após seguir os passos o erro persistir, me avise e informe:

1. O projeto aparece no dashboard do Supabase? (Sim/Não)
2. Qual é a URL correta do projeto? (copie de Settings → API)
3. Qual erro aparece no Console do navegador agora?

---

**Data:** 09/01/2026
**Status:** Aguardando verificação do usuário
