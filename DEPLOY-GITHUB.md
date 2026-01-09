# 🚀 Deploy no GitHub + Render + Netlify

## 📋 Pré-requisitos

- ✅ Sistema funcionando localmente
- ✅ Conta no GitHub
- ✅ Conta no Render (backend)
- ✅ Conta no Netlify (frontend)
- ✅ Tabelas criadas no Supabase

---

## 1️⃣ Subir para o GitHub

### Passo 1: Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `google-review-whatsapp` (ou outro nome)
3. Descrição: "Sistema de solicitação de avaliações Google via WhatsApp"
4. **Privado** ou **Público** (sua escolha)
5. **NÃO** marque "Add a README file"
6. Clique em **"Create repository"**

### Passo 2: Inicializar Git (se ainda não fez)

Abra o terminal na pasta do projeto:

```bash
cd C:\SAGW

# Verificar se já tem git inicializado
git status
```

Se der erro "not a git repository", inicialize:

```bash
git init
git add .
git commit -m "Migração para Supabase concluída"
```

Se já tiver git, apenas faça commit das mudanças:

```bash
git add .
git commit -m "Migração para Supabase concluída"
```

### Passo 3: Conectar ao GitHub

Copie a URL do seu repositório (algo como `https://github.com/seu-usuario/google-review-whatsapp.git`) e execute:

```bash
# Adicionar remote (substitua pela sua URL)
git remote add origin https://github.com/seu-usuario/google-review-whatsapp.git

# Verificar
git remote -v

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

Se pedir usuário e senha:
- **Usuário:** seu username do GitHub
- **Senha:** use um **Personal Access Token** (não a senha da conta)
  - Crie em: https://github.com/settings/tokens
  - Permissões: `repo` (acesso completo)

---

## 2️⃣ Deploy do Backend (Render)

### Passo 1: Criar Web Service

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `google-review-whatsapp`

### Passo 2: Configurar o serviço

**Build & Deploy:**
- **Name:** `google-review-whatsapp` (ou outro)
- **Region:** `Oregon (US West)` (ou mais próximo)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Instance Type:**
- Selecione **"Free"** (grátis)

### Passo 3: Adicionar variáveis de ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**

Adicione estas variáveis:

```
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q
NODE_ENV=production
PORT=10000
```

### Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (2-5 minutos)
3. Anote a URL do backend (ex: `https://google-review-whatsapp.onrender.com`)

### Passo 5: Testar

Acesse: `https://seu-backend.onrender.com/health`

Deve retornar:
```json
{"status":"ok","timestamp":"..."}
```

---

## 3️⃣ Deploy do Frontend (Netlify)

### Passo 1: Criar novo site

1. Acesse: https://app.netlify.com
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Conecte ao GitHub
4. Selecione o repositório `google-review-whatsapp`

### Passo 2: Configurar build

**Build settings:**
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/dist`

### Passo 3: Adicionar variáveis de ambiente

Antes de fazer deploy, clique em **"Site configuration"** → **"Environment variables"**

Adicione estas variáveis:

```
VITE_API_URL=https://seu-backend.onrender.com/api
VITE_SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
```

⚠️ **IMPORTANTE:** Substitua `https://seu-backend.onrender.com` pela URL real do seu backend!

### Passo 4: Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build (2-3 minutos)
3. Anote a URL do frontend (ex: `https://seu-site.netlify.app`)

### Passo 5: Configurar domínio personalizado (opcional)

1. Vá em **"Domain settings"**
2. Clique em **"Options"** → **"Edit site name"**
3. Escolha um nome (ex: `meu-sistema-avaliacoes`)
4. URL final: `https://meu-sistema-avaliacoes.netlify.app`

---

## 4️⃣ Configurar CORS no Backend

Se o frontend não conseguir conectar ao backend, você precisa atualizar o CORS.

### Opção A: Permitir qualquer origem (desenvolvimento)

Já está configurado assim por padrão.

### Opção B: Permitir apenas seu domínio (produção)

Edite `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seu-site.netlify.app'
  ]
}));
```

Depois faça commit e push:

```bash
git add .
git commit -m "Configurar CORS para produção"
git push
```

O Render fará deploy automaticamente!

---

## 5️⃣ Configurar Email no Supabase (Produção)

1. Acesse: https://cuychbunipzwfaitnbor.supabase.co
2. Vá em **"Authentication"** → **"Settings"**
3. **Site URL:** Cole a URL do Netlify (ex: `https://seu-site.netlify.app`)
4. **Redirect URLs:** Adicione:
   - `https://seu-site.netlify.app/**`
5. **Enable email confirmations:** Habilite (opcional)

---

## 6️⃣ Testar em Produção

1. Acesse seu site no Netlify
2. Crie uma conta
3. Configure seu negócio
4. Cadastre um cliente
5. Solicite avaliação
6. Verifique se o WhatsApp abre

---

## 7️⃣ Deploy Automático

Agora, sempre que você fizer mudanças:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

- ✅ Render fará deploy do backend automaticamente
- ✅ Netlify fará deploy do frontend automaticamente

---

## 🎉 Pronto!

Seu sistema está em produção!

**URLs:**
- Frontend: `https://seu-site.netlify.app`
- Backend: `https://seu-backend.onrender.com`
- Supabase: `https://cuychbunipzwfaitnbor.supabase.co`

---

## 📞 Problemas Comuns

### Backend não inicia no Render
- Verifique variáveis de ambiente
- Veja logs: Dashboard → Logs

### Frontend não conecta ao backend
- Verifique `VITE_API_URL` no Netlify
- Verifique CORS no backend
- Veja console do navegador (F12)

### Erro 401 (Unauthorized)
- Verifique se as chaves do Supabase estão corretas
- Verifique se o token está sendo enviado

### Dados não aparecem
- Verifique se as tabelas foram criadas no Supabase
- Verifique RLS (políticas de segurança)
- Veja logs do Supabase

---

## 🔒 Segurança

⚠️ **NUNCA** commite arquivos `.env` para o GitHub!

O `.gitignore` já está configurado para ignorar esses arquivos.

Se acidentalmente commitou:

```bash
# Remover do histórico
git rm --cached backend/.env
git rm --cached frontend/.env
git commit -m "Remover arquivos .env"
git push
```

Depois, **TROQUE** as chaves do Supabase!

---

**Última atualização:** 08/01/2026
