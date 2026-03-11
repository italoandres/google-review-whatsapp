# 🔍 Guia de Debug: Webhook Evolution API

## 📋 O Que Vamos Fazer

1. Adicionar logs detalhados (✅ FEITO)
2. Reiniciar backend para ver logs
3. Testar conexão e observar logs
4. Testar webhook manualmente com curl

## 🚀 Passo 1: Reiniciar Backend

```bash
# No terminal do backend (Ctrl+C para parar)
cd C:\SAGW\backend
npm run dev
```

Aguarde aparecer:
```
✅ Configuration validated successfully
🚀 Servidor rodando na porta 3000
```

## 🧪 Passo 2: Testar Conexão e Observar Logs

1. **No navegador**: Acesse http://localhost:5173/whatsapp-connection
2. **Clique em**: "Conectar WhatsApp"
3. **Observe o terminal do backend** - deve mostrar:

```
🔧 [setWebhook] Attempting to configure webhook {
  instanceName: 'user-73136007-028b-4e46-badb-6841be48e4f7',
  url: 'http://localhost:3000/webhook/set/user-...',
  webhookConfig: { ... },
  bodyLength: 123
}

📡 [setWebhook] Response received {
  instanceName: 'user-...',
  status: 400,
  statusText: 'Bad Request',
  ok: false
}

❌ [setWebhook] Failed - Response body: {
  instanceName: 'user-...',
  status: 400,
  statusText: 'Bad Request',
  body: '...' <-- ESTE É O ERRO QUE PRECISAMOS VER
}
```

4. **COPIE O ERRO** que aparecer no campo `body:` e me envie

## 🔬 Passo 3: Testar Webhook Manualmente (VOCÊ FAZ)

Vou te dar o comando curl para testar. Primeiro preciso do seu `instanceName`.

### 3.1. Obter instanceName

**Opção A - Pelos logs do backend**:
Procure no terminal do backend por:
```
instanceName: 'user-73136007-028b-4e46-badb-6841be48e4f7'
```

**Opção B - Pelo Supabase**:
1. Acesse: https://cuychbunipzwfaitnbor.supabase.co
2. Vá em: Table Editor → whatsapp_instances
3. Copie o valor da coluna `instance_name`

### 3.2. Testar Webhook com curl

Substitua `SEU_INSTANCE_NAME` pelo valor que você copiou:

```bash
curl -X POST \
  "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/set/SEU_INSTANCE_NAME" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D50A29" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"http://localhost:3000/api/webhooks/evolution\",\"webhook_by_events\":true,\"webhook_base64\":false,\"events\":[\"QRCODE_UPDATED\",\"CONNECTION_UPDATE\",\"MESSAGES_UPSERT\"]}"
```

**COPIE A RESPOSTA** e me envie.

### 3.3. Testar com Configuração Simplificada

Se o comando acima der erro, tente esta versão mais simples:

```bash
curl -X POST \
  "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/set/SEU_INSTANCE_NAME" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D50A29" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"http://localhost:3000/api/webhooks/evolution\",\"webhook_by_events\":false,\"webhook_base64\":false,\"events\":[\"CONNECTION_UPDATE\",\"MESSAGES_UPSERT\"]}"
```

**COPIE A RESPOSTA** e me envie.

## 🔍 Passo 4: Observar Logs de Polling

Após conectar o WhatsApp (escanear QR code), observe os logs do backend:

```
🔍 [getConnectionStatus] Checking status {
  userId: '...',
  instanceName: 'user-...',
  currentStatusInDB: 'connecting',
  hasInstance: true
}

📡 [getConnectionState] Response {
  instanceName: 'user-...',
  state: 'open',  <-- ESTE É O ESTADO QUE A EVOLUTION API RETORNA
  fullResponse: { ... }
}

🔄 [getConnectionStatus] Mapped status {
  instanceName: 'user-...',
  evolutionState: 'open',
  mappedStatus: 'connected',  <-- ESTE É O STATUS MAPEADO
  currentDBStatus: 'connecting',
  willUpdate: true,
  attempt: 1
}

✅ [getConnectionStatus] Status updated in DB {
  instanceName: 'user-...',
  oldStatus: 'connecting',
  newStatus: 'connected'
}
```

**COPIE ESTES LOGS** e me envie.

## 📊 O Que Estamos Investigando

### Problema 1: Webhook Falha
- **Sintoma**: `Failed to set webhook: Bad Request`
- **Causa Possível**: 
  - URL localhost não é acessível
  - Eventos inválidos (QRCODE_UPDATED pode não existir)
  - Formato do payload incorreto
- **Solução**: Depende do erro exato que veremos nos logs

### Problema 2: Polling Não Detecta Conexão
- **Sintoma**: Continua em "Aguardando conexão..." mesmo após conectar
- **Causa Possível**:
  - Evolution API retorna 'connecting' ao invés de 'open'
  - Evolution API tem cache/delay
  - Mapeamento de status está errado
- **Solução**: Depende do que veremos nos logs

## 📝 Checklist

Marque conforme for fazendo:

- [ ] Reiniciei o backend
- [ ] Testei conexão no navegador
- [ ] Copiei erro do webhook dos logs
- [ ] Obtive o instanceName
- [ ] Testei webhook com curl (versão 1)
- [ ] Testei webhook com curl (versão 2 - simplificada)
- [ ] Copiei resposta do curl
- [ ] Escaneei QR code no WhatsApp
- [ ] Copiei logs de polling
- [ ] Enviei todos os logs para análise

## 🎯 Próximos Passos

Após você me enviar os logs, vou:

1. **Analisar o erro exato do webhook**
2. **Ver o que Evolution API está retornando no polling**
3. **Implementar a correção específica**

Possíveis correções:
- Simplificar configuração do webhook (remover eventos inválidos)
- Usar ngrok para expor localhost
- Remover webhook e melhorar polling
- Ajustar mapeamento de status

---

**Status**: Logs adicionados, aguardando teste
**Próximo passo**: Você testar e me enviar os logs
**Tempo estimado**: 10 minutos
