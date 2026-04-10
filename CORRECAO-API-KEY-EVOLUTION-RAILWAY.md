# Correção: API Key da Evolution API no Railway

## Problema Identificado
O QR Code não está sendo gerado porque provavelmente a API key da Evolution API não está configurada corretamente no Railway backend.

## Variáveis de Ambiente Necessárias

O backend Railway precisa ter estas variáveis configuradas:

### 1. EVOLUTION_API_URL
```
https://evolution-api-production-5961.up.railway.app
```

### 2. EVOLUTION_API_GLOBAL_KEY
```
429683C4C977415CAAFCCE10F7D50A29
```

## Como Verificar e Corrigir no Railway

### Passo 1: Acessar Railway Backend
1. Acesse: https://railway.app
2. Faça login na conta: **avaliacaowhats-spec** (Conta 1)
3. Selecione o projeto: **review-google-whatsapp**
4. Clique no serviço do backend

### Passo 2: Verificar Variáveis de Ambiente
1. Clique na aba **Variables**
2. Procure por:
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_GLOBAL_KEY`

### Passo 3: Verificar se Estão Corretas

**EVOLUTION_API_URL deve ser:**
```
https://evolution-api-production-5961.up.railway.app
```

**EVOLUTION_API_GLOBAL_KEY deve ser:**
```
429683C4C977415CAAFCCE10F7D50A29
```

### Passo 4: Corrigir se Necessário

Se alguma variável estiver:
- ❌ Faltando
- ❌ Com valor errado
- ❌ Com URL antiga

**Faça:**
1. Clique em **New Variable** (se não existir)
2. Ou clique na variável existente para editar
3. Cole o valor correto
4. Clique em **Add** ou **Save**
5. O Railway vai fazer redeploy automaticamente

### Passo 5: Aguardar Redeploy
- Aguarde 1-2 minutos para o backend reiniciar
- Você verá "Deploying..." na tela
- Quando aparecer "Active", está pronto

### Passo 6: Verificar Logs
1. Clique na aba **Deployments**
2. Clique no deploy mais recente
3. Clique em **View Logs**
4. Procure por:
   ```
   ✅ Configuration validated successfully
   📍 Backend URL: https://review-google-whatsapp-production.up.railway.app
   🔗 Evolution API: https://evolution-api-production-5961.up.railway.app
   ```

Se aparecer essa mensagem, está tudo certo!

## Teste Rápido

Depois de corrigir, teste se o backend consegue acessar a Evolution API:

```powershell
curl https://review-google-whatsapp-production.up.railway.app/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

## Checklist de Verificação

- [ ] Acessei Railway (Conta 1 - avaliacaowhats-spec)
- [ ] Abri o projeto review-google-whatsapp
- [ ] Verifiquei a aba Variables
- [ ] `EVOLUTION_API_URL` está correto: `https://evolution-api-production-5961.up.railway.app`
- [ ] `EVOLUTION_API_GLOBAL_KEY` está correto: `429683C4C977415CAAFCCE10F7D50A29`
- [ ] Aguardei o redeploy completar
- [ ] Verifiquei os logs e vi "Configuration validated successfully"
- [ ] Testei o health check e funcionou

## Próximo Passo

Depois de corrigir as variáveis:
1. Aguarde o redeploy (1-2 minutos)
2. Acesse: https://avaliacaogoogle.netlify.app/whatsapp-connection
3. Clique em "Gerar QR Code"
4. O QR Code deve aparecer agora!

## Todas as Variáveis Necessárias no Railway Backend

Para referência, aqui está a lista completa:

```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q
EVOLUTION_API_URL=https://evolution-api-production-5961.up.railway.app
EVOLUTION_API_GLOBAL_KEY=429683C4C977415CAAFCCE10F7D50A29
WEBHOOK_SECRET=wh_secret_a8f3d9c2e1b4567890abcdef12345678
ENCRYPTION_KEY=340013285889db4348a7576ed2843f377811f7da94e8d233440266126e06be95
BACKEND_URL=https://review-google-whatsapp-production.up.railway.app
```

## Observação Importante

A API key `429683C4C977415CAAFCCE10F7D50A29` é a mesma que você configurou na Evolution API (Conta 2 do Railway) na variável `AUTHENTICATION_API_KEY`.

Elas DEVEM ser iguais para funcionar!
