# 🚀 Guia Completo: Deploy no GitHub + Netlify

## 📋 Índice
1. [Preparar para o GitHub](#1-preparar-para-o-github)
2. [Fazer Push para o GitHub](#2-fazer-push-para-o-github)
3. [Deploy no Netlify](#3-deploy-no-netlify)
4. [Configurar Variáveis de Ambiente](#4-configurar-variáveis-de-ambiente)
5. [Testar o Deploy](#5-testar-o-deploy)

---

## 1️⃣ Preparar para o GitHub

### Verificar o que mudou

```bash
git status
```

### Adicionar todas as alterações

```bash
git add .
```

### Fazer commit

```bash
git commit -m "feat: adiciona filtro de data range + botão atualizar + melhorias gerais"
```

---

## 2️⃣ Fazer Push para o GitHub

### Se o repositório já existe no GitHub:

```bash
git push origin main
```

### Se é a primeira vez (repositório novo):

1. Crie um repositório no GitHub:
   - Acesse: https://github.com/new
   - Nome: `google-review-whatsapp-system` (ou outro nome)
   - Deixe PRIVADO (recomendado)
   - NÃO adicione README, .gitignore ou licença
   - Clique em "Create repository"

2. Conecte o repositório local ao GitHub:

```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git branch -M main
git push -u origin main
```

---

## 3️⃣ Deploy no Netlify

### Passo 1: Acessar o Netlify

1. Acesse: https://app.netlify.com
2. Faça login com sua NOVA conta
3. Clique em "Add new site" → "Import an existing project"

### Passo 2: Conectar ao GitHub

1. Clique em "GitHub"
2. Autorize o Netlify a acessar seus repositórios
3. Selecione o repositório que você acabou de criar

### Passo 3: Configurar o Build

**Build settings:**

```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

**⚠️ NÃO CLIQUE EM "Deploy" AINDA!**

Primeiro, vamos configurar as variáveis de ambiente.

---

## 4️⃣ Configurar Variáveis de Ambiente

### No Netlify, antes de fazer o deploy:

1. Clique em "Show advanced"
2. Clique em "New variable"
3. Adicione TODAS as variáveis abaixo:

### Variáveis Obrigatórias:

#### 1. VITE_SUPABASE_URL
```
https://cuychbunipzwfaitnbor.supabase.co
```

#### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
```

#### 3. VITE_API_URL
```
https://SEU_BACKEND_URL.onrender.com/api
```

**⚠️ IMPORTANTE:** Você precisa da URL do backend no Render!

Se ainda não fez o deploy do backend, veja a seção [Deploy do Backend](#deploy-do-backend) abaixo.

---

### Como adicionar cada variável:

Para cada variável acima:

1. Clique em "New variable"
2. **Key:** Cole o nome da variável (ex: `VITE_SUPABASE_URL`)
3. **Value:** Cole o valor correspondente
4. Clique em "Add"

Repita para todas as 3 variáveis.

---

### Agora sim, fazer o deploy:

1. Clique em "Deploy site"
2. Aguarde o build terminar (2-5 minutos)
3. Quando terminar, você verá a URL do seu site

---

## 5️⃣ Testar o Deploy

### Acessar o site

1. Clique na URL que o Netlify gerou (ex: `https://random-name-123.netlify.app`)
2. Você deve ver a página de login

### Testar funcionalidades:

- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Página de clientes carrega
- [ ] Filtros funcionam
- [ ] Botão "Atualizar" funciona
- [ ] Conexão WhatsApp funciona

---

## 📦 Deploy do Backend

Se você ainda não fez o deploy do backend no Render, siga este guia:

### 1. Acessar o Render

1. Acesse: https://dashboard.render.com
2. Faça login
3. Clique em "New +" → "Web Service"

### 2. Conectar ao GitHub

1. Conecte sua conta do GitHub
2. Selecione o mesmo repositório
3. Clique em "Connect"

### 3. Configurar o Web Service

**Settings:**

```
Name: google-review-backend (ou outro nome)
Region: Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### 4. Variáveis de Ambiente do Backend

Clique em "Advanced" e adicione:

#### SUPABASE_URL
```
https://cuychbunipzwfaitnbor.supabase.co
```

#### SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
```

#### SUPABASE_SERVICE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q
```

#### PORT
```
3000
```

#### NODE_ENV
```
production
```

#### ENCRYPTION_KEY
```
340013285889db4348a7576ed2843f377811f7da94e8d233440266126e06be95
```

#### WEBHOOK_SECRET
```
wh_secret_a8f3d9c2e1b4567890abcdef12345678
```

#### EVOLUTION_API_URL
```
https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
```

#### EVOLUTION_API_GLOBAL_KEY
```
429683C4C977415CAAFCCE10F7D50A29
```

#### BACKEND_URL
```
https://SEU_BACKEND_URL.onrender.com
```

**⚠️ IMPORTANTE:** O `BACKEND_URL` deve ser a URL que o Render vai gerar. Você pode deixar em branco por enquanto e atualizar depois.

### 5. Fazer o Deploy do Backend

1. Clique em "Create Web Service"
2. Aguarde o deploy (5-10 minutos)
3. Quando terminar, copie a URL gerada (ex: `https://google-review-backend.onrender.com`)

### 6. Atualizar BACKEND_URL

1. No Render, vá em "Environment"
2. Edite a variável `BACKEND_URL`
3. Cole a URL que o Render gerou
4. Clique em "Save Changes"
5. O backend vai fazer redeploy automaticamente

### 7. Atualizar VITE_API_URL no Netlify

1. Acesse o Netlify
2. Vá no seu site → "Site settings" → "Environment variables"
3. Edite `VITE_API_URL`
4. Cole: `https://SEU_BACKEND_URL.onrender.com/api`
5. Clique em "Save"
6. Vá em "Deploys" → "Trigger deploy" → "Deploy site"

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

### Backend (Render):
- [ ] Deploy concluído com sucesso
- [ ] Todas as 10 variáveis de ambiente configuradas
- [ ] `BACKEND_URL` aponta para a própria URL do Render
- [ ] Endpoint `/health` retorna OK: `https://SEU_BACKEND.onrender.com/health`

### Frontend (Netlify):
- [ ] Deploy concluído com sucesso
- [ ] Todas as 3 variáveis de ambiente configuradas
- [ ] `VITE_API_URL` aponta para o backend no Render
- [ ] Site abre e mostra a página de login
- [ ] Login funciona
- [ ] Dashboard carrega

### Funcionalidades:
- [ ] Cadastro de clientes funciona
- [ ] Filtros funcionam (busca, data, status, origem)
- [ ] Botão "Atualizar" funciona
- [ ] Conexão WhatsApp funciona
- [ ] Auto-import de contatos funciona

---

## 🔧 Problemas Comuns

### Erro: "VITE_API_URL is required"

**Solução:**
1. Verifique se a variável `VITE_API_URL` está configurada no Netlify
2. Faça um novo deploy: "Deploys" → "Trigger deploy"

### Erro: "Failed to fetch" ou "Network Error"

**Solução:**
1. Verifique se o backend está rodando: `https://SEU_BACKEND.onrender.com/health`
2. Verifique se `VITE_API_URL` está correto no Netlify
3. Verifique se o backend tem CORS habilitado (já está no código)

### Backend demora muito para responder

**Solução:**
- O Render Free tier "dorme" após 15 minutos de inatividade
- A primeira requisição pode demorar 30-60 segundos
- Considere usar o plano pago ou fazer "ping" periódico

### Auto-import não funciona

**Solução:**
1. Verifique se `BACKEND_URL` no Render aponta para a URL correta
2. Verifique se `EVOLUTION_API_GLOBAL_KEY` está correta
3. Reconecte o WhatsApp no sistema

---

## 📝 Resumo dos Comandos

```bash
# 1. Adicionar alterações
git add .

# 2. Fazer commit
git commit -m "feat: melhorias no sistema"

# 3. Fazer push
git push origin main

# 4. Acessar Netlify e configurar
# (via interface web)

# 5. Acessar Render e configurar
# (via interface web)
```

---

## 🎉 Pronto!

Seu sistema está no ar! 

**URLs importantes:**
- Frontend: `https://SEU_SITE.netlify.app`
- Backend: `https://SEU_BACKEND.onrender.com`
- Supabase: `https://cuychbunipzwfaitnbor.supabase.co`
- Evolution API: `https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host`

**Próximos passos:**
1. Teste todas as funcionalidades
2. Conecte o WhatsApp
3. Teste o auto-import
4. Compartilhe o link com os usuários!
