# 🚀 Guia Completo: Como Rodar o Sistema Localmente

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Preciso do ngrok?](#preciso-do-ngrok)
3. [Passo a Passo Completo](#passo-a-passo-completo)
4. [Ordem de Execução](#ordem-de-execução)
5. [Testando o Sistema](#testando-o-sistema)
6. [Problemas Comuns](#problemas-comuns)

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ Node.js (v16 ou superior)
- ✅ npm ou yarn
- ✅ Git
- ✅ Conta no Supabase (já configurada)
- ✅ Evolution API rodando (já configurada)
- ✅ ngrok (vamos instalar agora)

---

## Preciso do ngrok?

### ✅ SIM, você precisa do ngrok!

**Por quê?**

O sistema usa **webhooks** da Evolution API para auto-importar contatos do WhatsApp. Quando alguém manda mensagem no WhatsApp, a Evolution API precisa enviar essa informação para o seu backend.

**O problema:**
- Seu backend está em `http://localhost:3000`
- A Evolution API está na internet (Easypanel)
- A Evolution API **NÃO CONSEGUE** acessar `localhost` do seu computador

**A solução:**
- ngrok cria um túnel público que aponta para o seu `localhost:3000`
- Exemplo: `https://abc123.ngrok-free.app` → `http://localhost:3000`
- A Evolution API consegue enviar webhooks para a URL do ngrok
- O ngrok repassa para o seu backend local

**Resumo:**
```
WhatsApp → Evolution API → ngrok (público) → localhost:3000 (seu PC)
```

---

## Passo a Passo Completo

### 1️⃣ Instalar o ngrok

#### Windows:

**Opção A: Baixar executável**
1. Acesse: https://ngrok.com/download
2. Baixe a versão para Windows
3. Extraia o arquivo `ngrok.exe` para uma pasta (ex: `C:\ngrok`)
4. Adicione ao PATH ou use o caminho completo

**Opção B: Via Chocolatey**
```powershell
choco install ngrok
```

**Opção C: Via Scoop**
```powershell
scoop install ngrok
```

#### Criar conta no ngrok (GRÁTIS):
1. Acesse: https://dashboard.ngrok.com/signup
2. Crie uma conta gratuita
3. Copie seu **Authtoken** em: https://dashboard.ngrok.com/get-started/your-authtoken

#### Configurar o authtoken:
```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

---

### 2️⃣ Configurar Arquivos .env

#### Backend (.env)

Arquivo: `backend/.env`

```env
# Supabase
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q

# App
PORT=3000
NODE_ENV=development

# Security
ENCRYPTION_KEY=340013285889db4348a7576ed2843f377811f7da94e8d233440266126e06be95
WEBHOOK_SECRET=wh_secret_a8f3d9c2e1b4567890abcdef12345678

# Evolution API
EVOLUTION_API_URL=https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
EVOLUTION_API_GLOBAL_KEY=429683C4C977415CAAFCCE10F7D50A29

# Backend URL (IMPORTANTE: Será atualizado com a URL do ngrok)
BACKEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** O `BACKEND_URL` será atualizado depois que você iniciar o ngrok!

#### Frontend (.env)

Arquivo: `frontend/.env`

```env
# Supabase
VITE_SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU

# API URL (desenvolvimento local)
VITE_API_URL=http://localhost:3000/api
```

---

### 3️⃣ Instalar Dependências

Abra **2 terminais PowerShell** (um para backend, outro para frontend):

#### Terminal 1 - Backend:
```powershell
cd C:\SAGW
cd backend
npm install
```

#### Terminal 2 - Frontend:
```powershell
cd C:\SAGW
cd frontend
npm install
```

---

## Ordem de Execução

### 🎯 ORDEM CORRETA (MUITO IMPORTANTE!)

```
1. ngrok (primeiro!)
2. Backend (segundo)
3. Frontend (terceiro)
```

### Por que essa ordem?

1. **ngrok primeiro**: Precisamos da URL pública antes de iniciar o backend
2. **Backend segundo**: Precisa da URL do ngrok configurada no `.env`
3. **Frontend por último**: Só precisa que o backend esteja rodando

---

### 1️⃣ Iniciar o ngrok

Abra um **novo terminal PowerShell** (Terminal 3):

```powershell
ngrok http 3000
```

**Você verá algo assim:**

```
ngrok

Session Status                online
Account                       Seu Nome (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**📝 COPIE A URL DO FORWARDING!**

Exemplo: `https://abc123.ngrok-free.app`

**⚠️ DEIXE ESTE TERMINAL ABERTO!** Se fechar, o ngrok para de funcionar.

---

### 2️⃣ Atualizar BACKEND_URL no .env

Abra o arquivo `backend/.env` e atualize:

```env
# ANTES:
BACKEND_URL=http://localhost:3000

# DEPOIS (use a URL que o ngrok mostrou):
BACKEND_URL=https://abc123.ngrok-free.app
```

**💾 SALVE O ARQUIVO!**

---

### 3️⃣ Iniciar o Backend

No **Terminal 1** (backend):

```powershell
cd C:\SAGW\backend
npm run dev
```

**Você deve ver:**

```
✅ Configuration validated successfully
📍 Backend URL: https://abc123.ngrok-free.app
🔗 Evolution API: https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
🗄️  Supabase: https://cuychbunipzwfaitnbor.supabase.co
⚙️  Environment: development
🚀 Servidor rodando na porta 3000
📍 http://localhost:3000
🏥 Health check: http://localhost:3000/health
🗄️  Usando Supabase como banco de dados
```

**✅ Se aparecer isso, o backend está OK!**

**⚠️ DEIXE ESTE TERMINAL ABERTO!**

---

### 4️⃣ Iniciar o Frontend

No **Terminal 2** (frontend):

```powershell
cd C:\SAGW\frontend
npm run dev
```

**Você deve ver:**

```
VITE v5.4.21  ready in 1340 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**✅ Se aparecer isso, o frontend está OK!**

**⚠️ DEIXE ESTE TERMINAL ABERTO!**

---

## Testando o Sistema

### 1️⃣ Testar Backend

Abra o navegador e acesse:

```
http://localhost:3000/health
```

**Deve retornar:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-10T...",
  "uptime": 123.456
}
```

---

### 2️⃣ Testar Frontend

Abra o navegador e acesse:

```
http://localhost:5173
```

**Deve aparecer a página de login do sistema!**

---

### 3️⃣ Testar ngrok

Abra o navegador e acesse:

```
https://abc123.ngrok-free.app/health
```

(Use a URL que o ngrok mostrou para você)

**Deve retornar o mesmo JSON do teste 1!**

Se funcionar, significa que:
- ✅ ngrok está funcionando
- ✅ Backend está acessível pela internet
- ✅ Evolution API conseguirá enviar webhooks

---

### 4️⃣ Testar Auto-Import

1. Faça login no sistema
2. Vá em "Conexão WhatsApp"
3. Conecte seu WhatsApp
4. Envie uma mensagem de teste para o número conectado
5. Vá em "Clientes"
6. Clique no botão **"🔄 Atualizar"** (novo botão com destaque roxo!)
7. O contato deve aparecer na lista com badge "📱 Auto"

---

## Problemas Comuns

### ❌ Problema 1: "ngrok not found"

**Solução:**
- Certifique-se de que instalou o ngrok
- Adicione ao PATH ou use o caminho completo:
  ```powershell
  C:\ngrok\ngrok.exe http 3000
  ```

---

### ❌ Problema 2: Backend não inicia

**Erro:** `Port 3000 is already in use`

**Solução:**
```powershell
# Encontrar processo usando a porta 3000
netstat -ano | findstr :3000

# Matar o processo (substitua PID pelo número que apareceu)
taskkill /PID 1234 /F
```

---

### ❌ Problema 3: Frontend não carrega

**Erro:** Página em branco

**Solução:**
1. Pressione `F12` no navegador
2. Veja erros no Console
3. Verifique se `VITE_API_URL` está correto no `frontend/.env`
4. Limpe o cache: `Ctrl + Shift + Delete`

---

### ❌ Problema 4: Auto-import não funciona

**Possíveis causas:**

1. **ngrok não está rodando**
   - Verifique se o terminal do ngrok está aberto
   - Acesse `https://sua-url.ngrok-free.app/health`

2. **BACKEND_URL incorreto no .env**
   - Abra `backend/.env`
   - Verifique se `BACKEND_URL` tem a URL do ngrok
   - Reinicie o backend após alterar

3. **Evolution API não configurada**
   - Vá em "Conexão WhatsApp"
   - Desconecte e reconecte o WhatsApp
   - Isso reconfigura os webhooks

---

### ❌ Problema 5: ngrok URL muda toda vez

**Explicação:**
- Na versão gratuita do ngrok, a URL muda a cada reinício
- Você precisa atualizar `BACKEND_URL` no `.env` toda vez

**Solução:**
- Mantenha o ngrok rodando enquanto trabalha
- Ou assine o plano pago do ngrok para ter URL fixa

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────┐
│                    SEU COMPUTADOR                        │
│                                                          │
│  Terminal 1: Backend (localhost:3000)                   │
│  Terminal 2: Frontend (localhost:5173)                  │
│  Terminal 3: ngrok (túnel público)                      │
│                                                          │
│  Navegador: http://localhost:5173                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↕
                    (ngrok túnel)
                          ↕
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                            │
│                                                          │
│  Evolution API (Easypanel)                              │
│  ↓                                                       │
│  Envia webhooks para:                                   │
│  https://abc123.ngrok-free.app/api/webhooks/evolution   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

Antes de começar a usar, verifique:

- [ ] ngrok instalado e configurado
- [ ] ngrok rodando (Terminal 3 aberto)
- [ ] `BACKEND_URL` atualizado no `backend/.env` com URL do ngrok
- [ ] Backend rodando (Terminal 1 aberto)
- [ ] Frontend rodando (Terminal 2 aberto)
- [ ] `http://localhost:3000/health` retorna OK
- [ ] `http://localhost:5173` abre o sistema
- [ ] `https://sua-url.ngrok-free.app/health` retorna OK
- [ ] WhatsApp conectado no sistema
- [ ] Teste de auto-import funcionando

---

## 🎉 Pronto!

Agora você tem o sistema rodando localmente com auto-import funcionando!

**Lembre-se:**
- Mantenha os 3 terminais abertos
- Se reiniciar o ngrok, atualize o `BACKEND_URL` no `.env`
- Use o botão **"🔄 Atualizar"** na página de clientes para ver novos contatos

**Dúvidas?** Consulte os guias:
- `GUIA-DEBUG-AUTO-IMPORT.md` - Debug de auto-import
- `GUIA-DEBUG-WEBHOOK.md` - Debug de webhooks
- `GUIA-CONFIGURAR-NGROK.md` - Mais detalhes sobre ngrok
