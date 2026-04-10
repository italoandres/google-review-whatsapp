# 🧪 Teste Manual do Webhook

## Comando para Testar

Execute este comando no PowerShell para enviar um webhook de teste:

```powershell
$payload = @'
{
  "event": "messages.upsert",
  "instance": "user-1da9b90b-085d-4899-ac95-153dad4b1e78",
  "data": {
    "key": {
      "remoteJid": "5518997401716@s.whatsapp.net",
      "fromMe": false,
      "id": "TEST_MANUAL_123"
    },
    "pushName": "Teste Manual Kiro",
    "message": {
      "conversation": "Teste manual do webhook"
    }
  },
  "destination": "5518997401716",
  "date_time": "2026-03-13T20:30:00.000Z"
}
'@

Invoke-WebRequest -Uri "https://google-review-whatsapp.onrender.com/api/webhooks/evolution" -Method POST -Body $payload -ContentType "application/json" | Select-Object StatusCode, Content
```

## O que Esperar

### Se Funcionar ✅

```
StatusCode : 200
Content    : {"success":true,"message":"Message processed and contact imported","clientId":"xxx"}
```

### Se Falhar ❌

Possíveis erros:
- `401`: Assinatura inválida (esperado, pois não enviamos assinatura)
- `400`: Payload inválido
- `500`: Erro no processamento

## Verificar Logs do Render

Depois de executar o comando, verifique os logs do Render. Deve aparecer:

```
📨 [Webhook] Received webhook request
🔄 [handleEvent] Event normalization
📨 [handleMessageUpsert] Processing message
✅ [handleMessageUpsert] Instance found
🔍 [handleMessageUpsert] Attempting to extract contact
📞 [handleMessageUpsert] Contact extraction result
🔢 [handleMessageUpsert] Phone normalization
🔎 [handleMessageUpsert] Phone existence check
✅ [handleMessageUpsert] Contact auto-imported
```

## Verificar no Sistema

Depois do teste:
1. Acessar: https://avaliacaowhtas.netlify.app
2. Ir em "Clientes"
3. Procurar por: "Teste Manual Kiro" ou telefone "5518997401716"

---

**Execute o comando acima e me envie:**
1. O resultado (StatusCode e Content)
2. Os logs do Render que aparecerem
