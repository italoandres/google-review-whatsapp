# Solução: statusReason 405 - Instância Fechando Imediatamente

## Problema Identificado

A instância WhatsApp está sendo criada com sucesso, mas fecha imediatamente com erro 405:

```json
{
  "state": "close",
  "statusReason": 405
}
```

## Causa

O erro 405 na Evolution API geralmente indica:
- Problema de configuração do servidor
- Falta de permissões
- Configuração de webhook incorreta
- Problema com o banco de dados PostgreSQL

## Solução

### Passo 1: Verificar Variáveis da Evolution API no Railway

Acesse Railway (Conta 2 - onde está a Evolution API) e verifique se TODAS essas variáveis estão configuradas:

```
SERVER_TYPE=https
SERVER_PORT=8080
DATABASE_PROVIDER=postgresql
DATABASE_ENABLED=true
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D50A29
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
WEBHOOK_GLOBAL_ENABLED=false
LOG_LEVEL=ERROR
LOG_COLOR=true
```

### Passo 2: Adicionar Variáveis Faltando

Se alguma dessas variáveis estiver faltando, adicione:

#### Variáveis Críticas que Podem Estar Faltando:

1. **WEBHOOK_GLOBAL_ENABLED**
   ```
   WEBHOOK_GLOBAL_ENABLED=false
   ```
   (Importante: deve ser `false` para permitir webhooks por instância)

2. **AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES**
   ```
   AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
   ```

3. **DATABASE_SAVE_DATA_INSTANCE**
   ```
   DATABASE_SAVE_DATA_INSTANCE=true
   ```

4. **LOG_LEVEL**
   ```
   LOG_LEVEL=ERROR
   ```

### Passo 3: Verificar Logs da Evolution API

1. Acesse Railway (Conta 2)
2. Abra o projeto da Evolution API
3. Clique em **Deployments** → Deploy ativo → **View Logs**
4. Procure por erros relacionados a:
   - `Database connection failed`
   - `Webhook configuration error`
   - `Authentication failed`

### Passo 4: Reiniciar Evolution API

Depois de adicionar as variáveis:

1. No Railway (Conta 2)
2. Clique nos 3 pontinhos do serviço Evolution API
3. Clique em **Restart**
4. Aguarde 1-2 minutos

### Passo 5: Deletar Instância Antiga e Criar Nova

A instância antiga pode estar corrompida. Vamos deletá-la:

```powershell
# Deletar instância antiga
$headers = @{
    "apikey" = "429683C4C977415CAAFCCE10F7D50A29"
}

curl -Method DELETE `
  -Uri "https://evolution-api-production-5961.up.railway.app/instance/delete/user-1da9b90b-085d-4899-ac95-153dad4b1e78" `
  -Headers $headers
```

Depois:
1. Acesse https://avaliacaogoogle.netlify.app/whatsapp-connection
2. Clique em "Gerar QR Code" novamente
3. Uma nova instância será criada

### Passo 6: Verificar PostgreSQL

O problema pode ser com o banco de dados PostgreSQL:

1. No Railway (Conta 2)
2. Verifique se o serviço **Postgres** está "Active"
3. Se não estiver, clique em **Restart**

### Passo 7: Verificar Domínio Público

1. No Railway (Conta 2)
2. Clique no serviço Evolution API
3. Vá em **Settings** → **Networking**
4. Verifique se o domínio público está configurado
5. Deve ser: `evolution-api-production-5961.up.railway.app`
6. Porta: `8080`

## Configuração Completa da Evolution API

Para referência, aqui está a configuração completa que deve estar no Railway:

```env
# Servidor
SERVER_TYPE=https
SERVER_PORT=8080

# Banco de Dados
DATABASE_PROVIDER=postgresql
DATABASE_ENABLED=true
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}

# Autenticação
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D50A29
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# Webhook
WEBHOOK_GLOBAL_ENABLED=false

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
```

## Teste Rápido

Depois de fazer as correções, teste se a Evolution API está funcionando:

```powershell
# Teste 1: API está online?
curl https://evolution-api-production-5961.up.railway.app

# Teste 2: Criar instância de teste
$headers = @{
    "apikey" = "429683C4C977415CAAFCCE10F7D50A29"
    "Content-Type" = "application/json"
}

$body = @{
    instanceName = "test-debug-2"
    qrcode = $true
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

curl -Method POST `
  -Uri "https://evolution-api-production-5961.up.railway.app/instance/create" `
  -Headers $headers `
  -Body $body

# Teste 3: Verificar estado da instância
curl -Method GET `
  -Uri "https://evolution-api-production-5961.up.railway.app/instance/connectionState/test-debug-2" `
  -Headers $headers
```

Se o teste 3 retornar `"state": "connecting"` (e não "close"), o problema está resolvido!

## Checklist de Verificação

- [ ] Todas as variáveis de ambiente estão configuradas na Evolution API
- [ ] `WEBHOOK_GLOBAL_ENABLED=false`
- [ ] `AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true`
- [ ] PostgreSQL está "Active" no Railway
- [ ] Evolution API foi reiniciada após adicionar variáveis
- [ ] Instância antiga foi deletada
- [ ] Teste manual funcionou (instância não fecha imediatamente)
- [ ] Tentei gerar QR Code novamente no frontend

## Próximo Passo

Depois de fazer essas correções, tente gerar o QR Code novamente em:
https://avaliacaogoogle.netlify.app/whatsapp-connection

O QR Code deve aparecer agora!
