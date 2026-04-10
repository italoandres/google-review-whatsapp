# ✅ CORREÇÃO: Nome do Evento do Webhook

## 🎯 Problema Identificado

**Causa Raiz**: Incompatibilidade no formato do nome dos eventos entre Evolution API e backend.

### Configuração do Webhook (Evolution API)

```json
{
  "events": [
    "QRCODE_UPDATED",      ← Maiúsculas com underscore
    "CONNECTION_UPDATE",   ← Maiúsculas com underscore
    "MESSAGES_UPSERT"      ← Maiúsculas com underscore
  ]
}
```

### Código do Backend (Antes da Correção)

```typescript
switch (payload.event) {
  case 'connection.update':  ← Minúsculas com ponto
    return await this.handleConnectionUpdate(payload);
  
  case 'messages.upsert':    ← Minúsculas com ponto
    return await this.handleMessageUpsert(payload);
}
```

**Resultado**: Os eventos nunca eram processados porque os nomes não correspondiam!

## 🔧 Correção Implementada

Adicionei normalização do nome do evento no `webhookHandler.ts`:

```typescript
// Normalize event name to lowercase with dots for comparison
const normalizedEvent = payload.event.toLowerCase().replace(/_/g, '.');

console.log('🔄 [handleEvent] Event normalization', {
  originalEvent: payload.event,
  normalizedEvent,
  instanceName: payload.instance,
});

// Route to appropriate handler based on event type
switch (normalizedEvent) {
  case 'connection.update':
    return await this.handleConnectionUpdate(payload);
  
  case 'messages.upsert':
    return await this.handleMessageUpsert(payload);
  
  case 'qrcode.updated':
    // QR code events are handled by polling, just acknowledge
    return {
      success: true,
      message: 'QR code event acknowledged',
    };
  
  default:
    console.warn(`Unknown webhook event type: ${payload.event} (normalized: ${normalizedEvent})`);
    return {
      success: true,
      message: `Event type ${payload.event} logged but not processed`,
    };
}
```

### O que a Correção Faz

1. **Converte para minúsculas**: `MESSAGES_UPSERT` → `messages_upsert`
2. **Substitui underscores por pontos**: `messages_upsert` → `messages.upsert`
3. **Compara com os casos esperados**: `messages.upsert` ✅ Match!

### Eventos Suportados

Agora o backend aceita AMBOS os formatos:

| Evolution API | Backend (Normalizado) | Handler |
|---------------|----------------------|---------|
| `MESSAGES_UPSERT` | `messages.upsert` | Auto-import de contatos |
| `messages.upsert` | `messages.upsert` | Auto-import de contatos |
| `CONNECTION_UPDATE` | `connection.update` | Atualização de status |
| `connection.update` | `connection.update` | Atualização de status |
| `QRCODE_UPDATED` | `qrcode.updated` | Reconhecido (polling já trata) |
| `qrcode.updated` | `qrcode.updated` | Reconhecido (polling já trata) |

## 📊 Antes vs Depois

### ANTES (Não Funcionava)

```
Evolution API → Envia "MESSAGES_UPSERT"
              ↓
Backend       → Compara com "messages.upsert"
              ↓
              ❌ Não corresponde
              ↓
              ⚠️ "Unknown webhook event type"
              ↓
              ❌ Auto-import não funciona
```

### DEPOIS (Funciona!)

```
Evolution API → Envia "MESSAGES_UPSERT"
              ↓
Backend       → Normaliza para "messages.upsert"
              ↓
              ✅ Corresponde!
              ↓
              ✅ Chama handleMessageUpsert()
              ↓
              ✅ Auto-import funciona!
```

## 🚀 Próximos Passos

### 1. Fazer Deploy da Correção

```powershell
# No diretório backend
cd C:\SAGW\backend

# Fazer commit
git add backend/src/services/webhookHandler.ts
git commit -m "fix: normalize webhook event names (MESSAGES_UPSERT -> messages.upsert)"

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
   - Deve aparecer: `📨 [Webhook] Received webhook request`
   - Deve aparecer: `🔄 [handleEvent] Event normalization`
   - Deve aparecer: `📨 [handleMessageUpsert] Processing message`
   - Deve aparecer: `✅ [handleMessageUpsert] Contact auto-imported`

3. Verificar no sistema (https://avaliacaowhtas.netlify.app):
   - Ir em "Clientes"
   - Contato deve aparecer automaticamente na lista

## 🔍 Como Verificar se Funcionou

### Logs Esperados no Render (Após Enviar Mensagem)

```
📨 [Webhook] Received webhook request
🔍 [Webhook] Full payload received: {
  "event": "MESSAGES_UPSERT",
  "instance": "user-1da9b90b-085d-4899-ac95-153dad4b1e78",
  ...
}
🔄 [handleEvent] Event normalization {
  originalEvent: "MESSAGES_UPSERT",
  normalizedEvent: "messages.upsert",
  instanceName: "user-1da9b90b-085d-4899-ac95-153dad4b1e78"
}
📨 [handleMessageUpsert] Processing message
✅ [handleMessageUpsert] Instance found
🔍 [handleMessageUpsert] Attempting to extract contact
📞 [handleMessageUpsert] Contact extraction result { hasContact: true, ... }
🔢 [handleMessageUpsert] Phone normalization { success: true, ... }
🔎 [handleMessageUpsert] Phone existence check { exists: false }
✅ [handleMessageUpsert] Contact auto-imported
```

### Se Não Funcionar

Se após o deploy ainda não funcionar, verifique:

1. **Logs do Render**: Procure por erros ou warnings
2. **Webhook ainda configurado**: Execute novamente:
   ```powershell
   Invoke-WebRequest -Uri "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/find/user-1da9b90b-085d-4899-ac95-153dad4b1e78" -Headers @{"apikey"="429683C4C977415CAAFCCE10F7D50A29"} -Method GET | Select-Object -ExpandProperty Content
   ```
3. **Instância ainda conectada**: Verificar no sistema se WhatsApp está conectado

## 📝 Resumo

| Item | Status | Observação |
|------|--------|------------|
| Problema identificado | ✅ | Nome do evento em formato diferente |
| Correção implementada | ✅ | Normalização de eventos |
| Código commitado | ⏳ | Aguardando commit |
| Deploy no Render | ⏳ | Aguardando deploy |
| Teste de auto-import | ⏳ | Aguardando teste |

---

**Próxima ação**: Fazer commit e push da correção
**Tempo estimado**: 5 minutos para deploy + 2 minutos para teste
**Resultado esperado**: Auto-import funcionando ✅
