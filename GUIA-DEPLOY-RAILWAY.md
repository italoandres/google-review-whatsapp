# Guia: Deploy no Railway

## ✅ Código Enviado com Sucesso!

O código está agora em: https://github.com/avaliacaowhats-spec/review-google--whatsapp

## Próximos Passos: Configurar Railway

### 1. Criar Projeto no Railway

1. Acesse: https://railway.app
2. Faça login (pode usar GitHub)
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha: `avaliacaowhats-spec/review-google--whatsapp`
6. Railway vai detectar automaticamente que é Node.js

### 2. Configurar Variáveis de Ambiente

Depois que o projeto for criado, clique em **"Variables"** e adicione:

```env
NODE_ENV=production
PORT=10000

# Supabase
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NzY4NzcsImV4cCI6MjA1MTE1Mjg3N30.8xQvxKGqYvLqxQxQxQxQxQxQxQxQxQxQxQxQxQxQ
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Evolution API
EVOLUTION_API_URL=https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D50A29

# Segurança
WEBHOOK_SECRET=sua_chave_webhook_aqui
ENCRYPTION_KEY=sua_chave_encryption_aqui
```

**IMPORTANTE:** Você precisa pegar as chaves reais do Supabase, Webhook e Encryption do seu `.env` atual.

### 3. Railway Vai Fazer Deploy Automaticamente

Railway vai:
- Detectar `package.json`
- Executar `npm install && npm run build`
- Executar `npm start`
- Gerar uma URL pública (ex: `https://seu-projeto.up.railway.app`)

### 4. Pegar a URL do Railway

Depois do deploy:
1. Clique em **"Settings"**
2. Role até **"Domains"**
3. Clique em **"Generate Domain"**
4. Copie a URL gerada (ex: `https://review-google-whatsapp-production.up.railway.app`)

### 5. Atualizar Webhook na Evolution API

Com a nova URL do Railway, atualize o webhook:

```powershell
$headers = @{
    "apikey" = "429683C4C977415CAAFCCE10F7D50A29"
    "Content-Type" = "application/json"
}

$body = @{
    url = "https://SUA_URL_RAILWAY.up.railway.app/api/webhooks/evolution"
    enabled = $true
    events = @("QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT")
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/set/user-1da9b90b-085d-4899-ac95-153dad4b1e78" -Method POST -Headers $headers -Body $body
```

### 6. Atualizar Frontend (Netlify)

Atualize a variável de ambiente no Netlify:
1. Acesse: https://app.netlify.com
2. Vá no seu site
3. **Site settings** → **Environment variables**
4. Edite `VITE_API_URL` para: `https://SUA_URL_RAILWAY.up.railway.app`
5. Clique em **"Trigger deploy"** para redeployar

### 7. Testar

```powershell
# Testar health check
Invoke-WebRequest -Uri "https://SUA_URL_RAILWAY.up.railway.app/health"

# Testar webhook manual
$payload = @{
  event = "messages.upsert"
  instance = "user-1da9b90b-085d-4899-ac95-153dad4b1e78"
  data = @{
    key = @{
      remoteJid = "5518997401716@s.whatsapp.net"
      fromMe = $false
      id = "TEST_RAILWAY_123"
    }
    pushName = "Teste Railway"
    message = @{
      conversation = "Teste do Railway"
    }
  }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "https://SUA_URL_RAILWAY.up.railway.app/api/webhooks/evolution" -Method POST -Body $payload -ContentType "application/json"
```

## Vantagens do Railway vs Render

✅ **Não dorme** (sempre ativo)
✅ **Mais rápido** (sem cold start)
✅ **Melhor para webhooks** (resposta imediata)
✅ **Plano gratuito melhor** ($5 de créditos por 30 dias)
✅ **Deploy mais rápido** (build otimizado)

## Monitoramento

Railway tem dashboard com:
- Logs em tempo real
- Uso de CPU/RAM
- Requisições HTTP
- Erros e crashes

Acesse: **Deployments** → Clique no deploy ativo → **View Logs**

## Custos Estimados

Com 1 cliente e tráfego baixo:
- **Mês 1**: Grátis ($5 de créditos)
- **Mês 2+**: ~$1-3/mês (depende do uso)

Muito mais barato e confiável que Render Free!
