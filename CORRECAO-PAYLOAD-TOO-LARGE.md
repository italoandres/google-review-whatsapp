# ✅ CORREÇÃO: Payload Too Large Error

## 🎯 Problema Identificado

**Erro**: `PayloadTooLargeError: request entity too large`

### Detalhes do Erro

```
expected: 126922,
length: 126922,
limit: 102400,  ← Limite padrão: 100KB
type: 'entity.too.large'
```

### O que Estava Acontecendo

1. ✅ Webhooks estavam chegando ao backend
2. ✅ Evolution API estava enviando eventos `messages.upsert`
3. ❌ **Payload era muito grande** (126KB > 100KB)
4. ❌ Express rejeitava a requisição ANTES de processar
5. ❌ Auto-import não funcionava

### Por que o Payload é Grande?

A Evolution API envia MUITOS metadados junto com cada mensagem:

```json
{
  "event": "messages.upsert",
  "instance": "user-xxx",
  "data": {
    "key": { ... },
    "pushName": "Cleia",
    "message": {
      "messageContextInfo": {
        "deviceListMetadata": {
          "senderKeyIndexes": [...],      ← Arrays grandes
          "recipientKeyIndexes": [...],   ← Arrays grandes
          "recipientKeyHash": { ... }     ← Objeto grande
        }
      },
      "conversation": "Mensagem aqui"
    }
  }
}
```

Quando a mensagem tem:
- Imagens
- Documentos
- Áudios
- Vídeos
- Stickers
- Metadados de criptografia

O payload pode facilmente ultrapassar 100KB.

## 🔧 Correção Implementada

Aumentei o limite do body parser no `server.ts`:

```typescript
// ANTES (Limite padrão: 100KB)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEPOIS (Limite: 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Por que 10MB?

- **100KB**: Muito pequeno para mensagens com mídia
- **1MB**: Ainda pode ser insuficiente para alguns casos
- **10MB**: Suficiente para a maioria dos casos
- **Segurança**: Ainda protege contra ataques de DoS

## 📊 Antes vs Depois

### ANTES (Não Funcionava)

```
Evolution API → Envia payload de 126KB
              ↓
Express       → Limite: 100KB
              ↓
              ❌ PayloadTooLargeError
              ↓
              ❌ Requisição rejeitada
              ↓
              ❌ Auto-import não funciona
```

### DEPOIS (Funciona!)

```
Evolution API → Envia payload de 126KB
              ↓
Express       → Limite: 10MB
              ↓
              ✅ Payload aceito
              ↓
              ✅ Webhook processado
              ↓
              ✅ Auto-import funciona!
```

## 🚀 Próximos Passos

### 1. Fazer Deploy da Correção

```powershell
# No diretório backend
cd C:\SAGW\backend

# Fazer commit
git add backend/src/server.ts backend/src/services/webhookHandler.ts
git commit -m "fix: increase body parser limit to 10mb for webhook payloads"

# Push para GitHub
git push origin main
```

### 2. Aguardar Deploy Automático no Render

O Render vai detectar o push e fazer deploy automaticamente.

Acompanhe em: https://dashboard.render.com

Aguarde até ver:
```
✅ Deploy live
```

### 3. Testar Auto-Import

Depois do deploy:

1. Enviar mensagem de outro número para o WhatsApp conectado
2. Verificar logs do Render:
   - ✅ Não deve mais aparecer `PayloadTooLargeError`
   - ✅ Deve aparecer: `📨 [Webhook] Received webhook request`
   - ✅ Deve aparecer: `🔄 [handleEvent] Event normalization`
   - ✅ Deve aparecer: `📨 [handleMessageUpsert] Processing message`
   - ✅ Deve aparecer: `✅ [handleMessageUpsert] Contact auto-imported`

3. Verificar no sistema (https://avaliacaowhtas.netlify.app):
   - Ir em "Clientes"
   - Contato deve aparecer automaticamente na lista

## 🔍 Logs Esperados (Após Deploy)

### Webhook Recebido com Sucesso

```
🚨 [Webhook Middleware] Request received {
  method: 'POST',
  path: '/evolution',
  bodyType: 'object',
  bodyIsEmpty: false,
  bodyKeys: ['event', 'instance', 'data', ...]
}

📨 [Webhook] Received webhook request {
  method: 'POST',
  path: '/evolution',
  bodyKeys: ['event', 'instance', 'data', ...],
  timestamp: '2026-03-13T20:00:00.000Z'
}

🔄 [handleEvent] Event normalization {
  originalEvent: 'messages.upsert',
  normalizedEvent: 'messages.upsert',
  instanceName: 'user-1da9b90b-085d-4899-ac95-153dad4b1e78'
}

📨 [handleMessageUpsert] Processing message {
  instanceName: 'user-1da9b90b-085d-4899-ac95-153dad4b1e78',
  event: 'messages.upsert',
  hasData: true
}

✅ [handleMessageUpsert] Instance found {
  instanceName: 'user-1da9b90b-085d-4899-ac95-153dad4b1e78',
  userId: 'f8256dd5-46d4-4f1b-9865-8a11d9f7e77f'
}

🔍 [handleMessageUpsert] Attempting to extract contact

📞 [handleMessageUpsert] Contact extraction result {
  hasContact: true,
  contact: { phone: '5518997401716', name: 'Cleia' }
}

🔢 [handleMessageUpsert] Phone normalization {
  originalPhone: '5518997401716',
  normalizedPhone: '5518997401716',
  success: true
}

🔎 [handleMessageUpsert] Phone existence check {
  phone: '5518997401716',
  exists: false
}

✅ [handleMessageUpsert] Contact auto-imported {
  clientId: 'xxx-xxx-xxx',
  phone: '5518997401716',
  name: 'Cleia'
}
```

## 📝 Resumo das Correções

| Problema | Correção | Arquivo |
|----------|----------|---------|
| Nome do evento em maiúsculas | Normalização de eventos | `webhookHandler.ts` |
| Payload muito grande (126KB > 100KB) | Aumentar limite para 10MB | `server.ts` |

## ⚠️ Observações Importantes

### Sobre o Limite de 10MB

- **Suficiente**: Para a maioria dos casos de uso
- **Seguro**: Ainda protege contra ataques
- **Ajustável**: Pode ser aumentado se necessário

### Se Ainda Não Funcionar

Se após o deploy ainda não funcionar, verifique:

1. **Logs do Render**: Procure por outros erros
2. **Contato já existe**: Verifique se o telefone `5518997401716` já está cadastrado
3. **Webhook ainda configurado**: Execute novamente:
   ```powershell
   Invoke-WebRequest -Uri "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/find/user-1da9b90b-085d-4899-ac95-153dad4b1e78" -Headers @{"apikey"="429683C4C977415CAAFCCE10F7D50A29"} -Method GET | Select-Object -ExpandProperty Content
   ```

### Telefone Detectado nos Logs

Nos logs você enviou, vejo que o telefone é:
- **remoteJid**: `5518997401716@s.whatsapp.net`
- **pushName**: `Cleia`

Depois do deploy, esse contato deve ser importado automaticamente!

---

**Próxima ação**: Fazer commit e push das correções
**Tempo estimado**: 5 minutos para deploy + 2 minutos para teste
**Resultado esperado**: Auto-import funcionando ✅
