 [ ] **TESTE 3**: Executei comando para consultar webhook
  - Resultado (copie e cole): _______________

- [ ] **TESTE 4**: Executei webhook simulado
  - Vi log no backend? (Sim/Não): _______________
  - Qual erro apareceu? _______________

---

## 🎯 Próximo Passo

**EXECUTE OS TESTES ACIMA** e me envie os resultados de CADA teste.

Com essas informações, vou identificar exatamente onde está o problema e aplicar a solução correta.

**NÃO PULE NENHUM TESTE** - cada um elimina uma possível causa.
enviar para o ngrok

---

## 📋 Checklist de Debug

Execute os testes nesta ordem e me informe os resultados:

- [ ] **TESTE 1.1**: Acessei `/health` no navegador
  - Resultado: _______________

- [ ] **TESTE 1.2**: Executei comando PowerShell para testar endpoint
  - Vi log no backend? (Sim/Não): _______________

- [ ] **TESTE 2**: Abri interface ngrok (http://127.0.0.1:4040)
  - Enviei mensagem de teste
  - Apareceu requisição POST? (Sim/Não): _______________
  - Se sim, qual status code? _______________

-

Se o webhook não está configurado corretamente:

1. Desconecte WhatsApp no frontend

2. Aguarde aparecer "Desconectado"

3. Reconecte WhatsApp

4. Aguarde aparecer no backend:
```
✅ [setWebhook] Webhook configured successfully
```

5. Execute TESTE 3 novamente para confirmar

---

### SOLUÇÃO #3: Verificar Logs Detalhados da Evolution API

Se nada funcionar, precisamos ver os logs da Evolution API:

1. Acesse o painel da Evolution API (se tiver acesso)

2. Verifique logs de webhook

3. Procure por erros ao 
```env
BACKEND_URL=https://NOVA-URL-AQUI.ngrok-free.app
```

7. Reinicie backend (Ctrl+C e `npm run dev`)

8. Desconecte e reconecte WhatsApp

#### Opção C: Usar Backend em Produção (Render)

Se ngrok continuar com problemas:

1. Atualize `backend/.env`:
```env
BACKEND_URL=https://google-review-whatsapp.onrender.com
```

2. Faça deploy do código atual para o Render

3. Reinicie backend local (ou use o de produção)

4. Desconecte e reconecte WhatsApp

---

### SOLUÇÃO #2: Reconfigurar Webhook na Evolution APIarning:true"
```

3. **NÃO PRECISA** atualizar `.env` (URL continua a mesma)

4. Teste novamente enviando mensagem

#### Opção B: Criar Conta ngrok (Recomendado)

1. Crie conta: https://dashboard.ngrok.com/signup

2. Copie authtoken: https://dashboard.ngrok.com/get-started/your-authtoken

3. Configure:
```powershell
cd C:\ngrok
.\ngrok.exe config add-authtoken SEU_AUTHTOKEN_AQUI
```

4. Reinicie ngrok:
```powershell
.\ngrok.exe http 3000
```

5. Copie a NOVA URL (pode ter mudado)

6. Atualize `backend/.env`:-signature': 'present' },
  bodyKeys: [ 'event', 'instance', 'data' ]
}
```

**SE VER ISSO**: Backend está funcionando! Problema é que Evolution API não está enviando.

**SE NÃO VER NADA**: Problema no backend ou rota não registrada.

---

## 💡 SOLUÇÕES

### SOLUÇÃO #1: Resolver Bloqueio do ngrok

#### Opção A: Adicionar Flag para Pular Aviso

1. Pare o ngrok atual (Ctrl+C no terminal do ngrok)

2. Reinicie com flag:
```powershell
cd C:\ngrok
.\ngrok.exe http 3000 --request-header-add "ngrok-skip-browser-w)"
} catch {
    Write-Host "❌ ERRO!"
    Write-Host "Erro: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
```

### Passo 4.2: Verificar Logs do Backend

**✅ RESULTADO ESPERADO NO BACKEND**:
```
POST /api/webhooks/evolution
📨 [Webhook] Received webhook request {
  method: 'POST',
  path: '/evolution',
  headers: { 'x-evolutionl Debug"
        message = @{
            conversation = "Mensagem de teste"
        }
    }
    date_time = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json -Depth 10

Write-Host "Enviando webhook simulado para localhost..."
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/evolution" -Method POST -Headers $headers -Body $body
    Write-Host "✅ SUCESSO!"
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.ContentE 4: Simular Webhook Completo

### Passo 4.1: Enviar Webhook Simulado

Abra PowerShell e execute (COPIE E COLE TUDO):

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-evolution-signature" = "sha256=test-signature-for-debugging"
}

$body = @{
    event = "messages.upsert"
    instance = "user-73136007-028b-4e46-badb-6841be48e4f7"
    data = @{
        key = @{
            remoteJid = "5511999999999@s.whatsapp.net"
            fromMe = $false
        }
        pushName = "Teste Manuay_events": true,
    "webhook_base64": false,
    "events": [
      "QRCODE_UPDATED",
      "CONNECTION_UPDATE",
      "MESSAGES_UPSERT"
    ]
  }
}
```

**❌ SE `enabled: false`**:
- Webhook está desabilitado
- Vá para "SOLUÇÃO #2"

**❌ SE URL DIFERENTE**:
- URL antiga ainda configurada
- Vá para "SOLUÇÃO #2"

**❌ SE NÃO TEM `MESSAGES_UPSERT` nos events**:
- Evento de mensagens não está configurado
- Vá para "SOLUÇÃO #2"

**❌ SE ERRO 404**:
- Webhook não foi configurado
- Vá para "SOLUÇÃO #2"

---

## 🧪 TESTapiKey
}

$url = "$apiUrl/webhook/find/$instanceName"

try {
    $result = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
    $result | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERRO: $_"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
}
```

### Passo 3.2: Analisar Resultado

**✅ RESULTADO ESPERADO**:
```json
{
  "webhook": {
    "enabled": true,
    "url": "https://1f0c-2804-22e4-a0db-1b00-f4db-2617-c853-cb7b.ngrok-free.app/api/webhooks/evolution",
    "webhook_bé no processamento

**❌ SE NÃO APARECER NENHUMA REQUISIÇÃO**:
- Evolution API NÃO está enviando webhooks
- Vá para "TESTE 3"

---

## 🧪 TESTE 3: Verificar Configuração do Webhook na Evolution API

### Passo 3.1: Consultar Webhook Configurado

Abra PowerShell e execute (COPIE E COLE TUDO):

```powershell
$instanceName = "user-73136007-028b-4e46-badb-6841be48e4f7"
$apiUrl = "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host"
$apiKey = "429683C4C977415CAAFCCE10F7D50A29"

$headers = @{
    "apikey" = $viar Mensagem de Teste

1. Use outro celular/WhatsApp
2. Envie mensagem para o número conectado
3. Aguarde 5 segundos

### Passo 2.3: Verificar Requisições

Na interface do ngrok (http://127.0.0.1:4040):

**✅ SE APARECER REQUISIÇÃO POST `/api/webhooks/evolution`**:
- Evolution API está enviando!
- Clique na requisição para ver detalhes
- Verifique o status code (200, 401, 403, etc.)
- **Se status 401**: Problema de assinatura
- **Se status 403**: ngrok bloqueando
- **Se status 200**: Webhook chegou! Problema n"} -Body '{"test":"test"}'
```

**✅ SE VER NO BACKEND**:
```
POST /api/webhooks/evolution
📨 [Webhook] Received webhook request
```

Significa que ngrok está funcionando! Problema é na Evolution API.

**❌ SE NÃO VER NADA NO BACKEND**:

ngrok está bloqueando. Vá para "SOLUÇÃO #1".

---

## 🧪 TESTE 2: Verificar Interface Web do ngrok

### Passo 2.1: Abrir Interface do ngrok

Abra no navegador:

```
http://127.0.0.1:4040
```

Você deve ver a interface web do ngrok com lista de requisições.

### Passo 2.2: Enna.
- **SOLUÇÃO**: Vá para "SOLUÇÃO #1" abaixo.

**❌ SE VER ERRO 404/502**:
- ngrok não está redirecionando corretamente.
- **SOLUÇÃO**: Verifique se ngrok está rodando e se a URL está correta.

### Passo 1.2: Testar Webhook Endpoint Diretamente

Abra PowerShell e execute:

```powershell
# Teste simples - apenas verificar se endpoint responde
Invoke-WebRequest -Uri "https://1f0c-2804-22e4-a0db-1b00-f4db-2617-c853-cb7b.ngrok-free.app/api/webhooks/evolution" -Method POST -Headers @{"Content-Type"="application/jsono backend.

**CAUSA PROVÁVEL**: ngrok free tier está bloqueando webhooks OU Evolution API não está enviando.

---

## 🧪 TESTE 1: Verificar se ngrok está acessível

### Passo 1.1: Testar Health Endpoint

Abra o navegador e acesse:

```
https://1f0c-2804-22e4-a0db-1b00-f4db-2617-c853-cb7b.ngrok-free.app/health
```

**✅ RESULTADO ESPERADO**:
```json
{"status":"ok","timestamp":"...","database":"supabase"}
```

**❌ SE VER PÁGINA DE AVISO DO NGROK**: 
- Esse é o problema! Evolution API não consegue passar por essa págius Atual (Baseado nos Logs)

✅ Backend rodando com ngrok: `https://1f0c-2804-22e4-a0db-1b00-f4db-2617-c853-cb7b.ngrok-free.app`
✅ Evolution API configurada: `https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host`
✅ Webhook configurado com sucesso: `✅ [setWebhook] Webhook configured successfully`
✅ WhatsApp conectado: `state: 'open'`
❌ **WEBHOOKS NÃO CHEGAM**: Nenhum log `📨 [Webhook] Received` aparece

## 🎯 Problema Identificado

**SINTOMA**: Quando mensagem chega no WhatsApp, NENHUM log de webhook aparece # 🔍 Guia de Debug: Auto-Importação de Contatos

## 📊 Stat