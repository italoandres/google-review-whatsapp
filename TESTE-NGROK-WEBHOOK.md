# 🧪 Teste: Verificar se ngrok está bloqueando webhooks

## Problema Identificado

ngrok free tier pode estar mostrando página de aviso que bloqueia webhooks da Evolution API.

## Teste 1: Verificar Health Endpoint

Abra o navegador e acesse:

```
https://1f0c-2804-22e4-a0db-1b00-f4db-2617-c853-cb7b.ngrok-free.app/health
```

**RESULTADO ESPERADO**:
```json
{"status":"ok","timestamp":"...","database":"supabase"}
```

**SE VER PÁGINA DE AVISO DO NGROK**: Esse é o problema! Evolution API não consegue passar por essa página.

## Teste 2: Simular Webhook Manualmente

Abra PowerShell e execute:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-evolution-signature" = "test-signature"
}

$body = @{
    event = "messages.upsert"
    instance = "test-instance"
    data = @{
        key = @{
            remoteJid = "5511999999999@s.whatsapp.net"
            fromMe = $false
        }
        pushName = "Teste Manual"
        message = @{
            conversation = "Teste"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "https://1f0c-2804-22e4-a0db-1b00-f4db-2617-c853-cb7b.ngrok-free.app/api/webhooks/evolution" -Method POST -Headers $headers -Body $body
```

**RESULTADO ESPERADO NO BACKEND**:
```
POST /api/webhooks/evolution
📨 [Webhook] Received webhook request
```

**SE NÃO VER NADA**: ngrok está bloqueando.

## Teste 3: Verificar Interface Web do ngrok

1. Abra: http://127.0.0.1:4040
2. Envie uma mensagem de teste no WhatsApp
3. Verifique se alguma requisição POST aparece na interface

**SE NÃO APARECER NADA**: Evolution API não está conseguindo enviar para o ngrok.

**SE APARECER MAS COM STATUS 403/404**: ngrok está bloqueando.

## Soluções

### Solução 1: Desabilitar Página de Aviso (RECOMENDADO)

Adicione flag `--request-header-add` ao iniciar ngrok:

```powershell
cd C:\ngrok
.\ngrok.exe http 3000 --request-header-add "ngrok-skip-browser-warning:true"
```

### Solução 2: Criar Conta ngrok e Usar Authtoken

Se ainda não fez:

1. Crie conta: https://dashboard.ngrok.com/signup
2. Copie authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure:
```powershell
.\ngrok.exe config add-authtoken SEU_AUTHTOKEN
```
4. Reinicie ngrok:
```powershell
.\ngrok.exe http 3000
```

### Solução 3: Usar Backend em Produção (Render)

Se ngrok continuar com problemas, use o backend em produção:

1. Pare o backend local
2. Atualize `.env`:
```env
BACKEND_URL=https://google-review-whatsapp.onrender.com
```
3. Faça deploy do código atual para o Render
4. Desconecte e reconecte WhatsApp

## Próximo Passo

Execute os testes acima e me informe os resultados.
