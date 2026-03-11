# 🧪 Teste: Verificar Configuração do Webhook na Evolution API

## Objetivo

Verificar se o webhook está realmente configurado na Evolution API.

## Teste: Consultar Webhook Configurado

Abra PowerShell e execute:

```powershell
$instanceName = "user-73136007-028b-4e46-badb-6841be48e4f7"
$apiUrl = "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host"
$apiKey = "429683C4C977415CAAFCCE10F7D50A29"

$headers = @{
    "apikey" = $apiKey
}

$url = "$apiUrl/webhook/find/$instanceName"

Invoke-RestMethod -Uri $url -Method GET -Headers $headers | ConvertTo-Json -Depth 10
```

**RESULTADO ESPERADO**:

```json
{
  "enabled": true,
  "url": "https://1f0c-2804-22e4-a0db-1b00-f4db-2617-c853-cb7b.ngrok-free.app/api/webhooks/evolution",
  "webhook_by_events": true,
  "webhook_base64": false,
  "events": [
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT"
  ]
}
```

## Análise dos Resultados

### ✅ Se mostrar a configuração correta:

Webhook está configurado. O problema é:
- ngrok bloqueando (Causa #1)
- Evolution API não está enviando eventos

### ❌ Se mostrar erro ou configuração diferente:

Webhook NÃO está configurado corretamente. Precisamos reconfigurar.

### ❌ Se mostrar `enabled: false`:

Webhook está desabilitado. Precisamos habilitar.

### ❌ Se a URL estiver diferente:

URL antiga ainda está configurada. Precisamos atualizar.

## Próximo Passo

Execute o comando acima e me envie o resultado completo.
