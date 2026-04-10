# 🔍 Verificação: Webhook na Nova Instância

## 📋 Status Atual

**Nova Instância**: `user-1da9b90b-085d-4899-ac95-153dad4b1e78`

### Logs Observados (Após Enviar Mensagem)

```
🔍 [getConnectionStatus] Verificando status
📡 [getConnectionState] Resposta
🔄 [getConnectionStatus] Status mapeado
```

### Logs que DEVERIAM aparecer:

```
❌ 📨 [Webhook] Received webhook request
❌ 🔍 [Webhook] Full payload received
❌ 📨 [handleMessageUpsert] Processing message
```

## 🎯 Problema Persiste

Mesmo com a nova instância, o webhook **ainda não está chegando** ao backend.

## 🔧 Próxima Verificação

Vamos verificar a configuração COMPLETA do webhook na nova instância para ver:
1. ✅ Se o webhook está configurado
2. ✅ Se a URL está correta
3. ✅ Se os eventos estão corretos
4. ❓ **Qual é o nome EXATO do evento de mensagens**

### Comando para Verificar (PowerShell)

```powershell
Invoke-WebRequest -Uri "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/find/user-1da9b90b-085d-4899-ac95-153dad4b1e78" -Headers @{"apikey"="429683C4C977415CAAFCCE10F7D50A29"} -Method GET | Select-Object -ExpandProperty Content
```

**IMPORTANTE**: Use `-ExpandProperty Content` para ver o JSON completo, não apenas o resumo.

## 🔍 O que Estamos Procurando

Precisamos ver o JSON completo para verificar:

```json
{
  "webhook": {
    "url": "https://google-review-whatsapp.onrender.com/api/webhooks/evolution",
    "enabled": true,
    "events": [
      "connection.update",
      "MESSAGES_UPSERT"  ← Pode ser este nome
      // ou
      "messages.upsert"  ← Ou este nome
      // ou
      "MESSAGES_UPDATE"  ← Ou outro nome
    ]
  }
}
```

## 🚨 Possíveis Causas

### CAUSA 1: Nome do Evento Está Diferente

O backend está esperando: `messages.upsert`

Mas a Evolution API pode estar enviando:
- `MESSAGES_UPSERT` (maiúsculas)
- `MESSAGES_UPDATE` (nome diferente)
- `message.upsert` (singular)
- Outro nome

**Solução**: Atualizar o código do backend para aceitar o nome correto.

### CAUSA 2: Webhook Não Está Habilitado

Mesmo configurado, pode estar com `enabled: false`.

**Solução**: Habilitar webhook via API.

### CAUSA 3: URL Incorreta

URL pode estar com erro de digitação ou protocolo errado.

**Solução**: Reconfigurar webhook com URL correta.

## 📊 Próximo Passo

**Execute o comando acima** e me envie o resultado COMPLETO do JSON.

Com isso vou poder:
1. ✅ Confirmar se webhook está configurado
2. ✅ Ver qual é o nome EXATO do evento
3. ✅ Atualizar o código se necessário
4. ✅ Fazer o auto-import funcionar

---

**Status**: Aguardando verificação da configuração completa do webhook
**Comando**: Ver acima (com `-ExpandProperty Content`)
