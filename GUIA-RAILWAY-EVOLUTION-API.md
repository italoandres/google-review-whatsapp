# Deploy Evolution API no Railway (Conta Separada - GRÁTIS)

## ✅ Vantagens desta Solução
- 100% GRÁTIS (usando segunda conta Railway)
- Não precisa instalar nada no seu PC
- Evolution API fica online 24/7
- PostgreSQL incluído automaticamente

## Passo 1: Criar Nova Conta Railway

1. Acesse: https://railway.app
2. Clique em "Login" e escolha "GitHub"
3. Use um email diferente ou crie nova conta GitHub se necessário
4. Confirme o email

## Passo 2: Criar Projeto Evolution API

1. No dashboard Railway, clique em "New Project"
2. Escolha "Deploy from Docker Image"
3. Cole esta imagem: `atendai/evolution-api:v2.1.1`
4. Clique em "Deploy"

## Passo 3: Adicionar PostgreSQL

1. No mesmo projeto, clique em "+ New"
2. Escolha "Database" → "PostgreSQL"
3. Railway vai criar o banco automaticamente

## Passo 4: Configurar Variáveis de Ambiente

Clique no serviço Evolution API → aba "Variables" → adicione:

```bash
# Servidor
SERVER_TYPE=https
SERVER_PORT=8080

# Banco de Dados (Railway preenche automaticamente)
DATABASE_PROVIDER=postgresql
DATABASE_ENABLED=true
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true

# Conexão PostgreSQL (copie do serviço PostgreSQL)
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}

# Autenticação
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D50A29
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# Webhook Global
WEBHOOK_GLOBAL_ENABLED=false

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
```

## Passo 5: Gerar Domínio Público

1. No serviço Evolution API, vá em "Settings"
2. Clique em "Generate Domain"
3. Railway vai criar uma URL tipo: `evolution-api-production-xxxx.up.railway.app`
4. **COPIE ESTA URL** - você vai precisar dela!

## Passo 6: Atualizar Backend Principal

Agora você precisa atualizar a variável `EVOLUTION_API_URL` no seu backend (conta Railway principal):

1. Acesse sua conta Railway principal (avaliacaowhats-spec)
2. Abra o projeto do backend
3. Vá em "Variables"
4. Adicione ou atualize:
   ```
   EVOLUTION_API_URL=https://evolution-api-production-xxxx.up.railway.app
   ```
   (use a URL que você copiou no Passo 5)

## Passo 7: Testar Evolution API

Abra o navegador e acesse:
```
https://evolution-api-production-xxxx.up.railway.app/manager
```

Você deve ver a interface do Evolution API Manager!

## Passo 8: Configurar Webhook no Evolution API

Depois que tudo estiver rodando, você precisa configurar o webhook para o seu backend receber os eventos do WhatsApp.

Vou te ajudar com isso depois que o Evolution API estiver no ar!

---

## 🎯 Próximos Passos

Depois que o Evolution API estiver rodando:
1. Conectar WhatsApp via QR Code
2. Configurar webhook para apontar para seu backend Railway
3. Testar auto-import de contatos

---

## ⚠️ Importante

- Guarde bem a URL do Evolution API
- Não compartilhe a API Key (429683C4C977415CAAFCCE10F7D50A29)
- O plano free tem limite de 500 horas/mês (suficiente para uso normal)
