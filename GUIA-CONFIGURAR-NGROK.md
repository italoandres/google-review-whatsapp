# 🚀 Guia: Configurar ngrok para Auto-Importação de Contatos

## 📋 O Que Vamos Fazer

Configurar ngrok para expor seu backend local (`localhost:3000`) para a internet, permitindo que a Evolution API envie webhooks e a auto-importação funcione.

## 🎯 Problema Identificado

**CAUSA RAIZ**: Backend rodando em `http://localhost:3000` não é acessível pela Evolution API (servidor remoto).

**EVIDÊNCIA**:
```
Webhook configuration failed, but instance was created {
  error: 'Failed to set webhook: Bad Request'
}
```

**CONSEQUÊNCIA**: Webhooks não chegam → Auto-importação não funciona

---

## 🔧 PASSO 1: Instalar ngrok

### Opção A: Download Direto (RECOMENDADO)

1. Acesse: https://ngrok.com/download
2. Clique em "Download for Windows"
3. Extraia o arquivo `ngrok.exe` para uma pasta (ex: `C:\ngrok\`)

### Opção B: Via Chocolatey (se você tem instalado)

```powershell
choco install ngrok
```

### Opção C: Via Scoop (se você tem instalado)

```powershell
scoop install ngrok
```

---

## 🔧 PASSO 2: Criar Conta ngrok (Opcional mas Recomendado)

**Por que criar conta?**
- URL permanece a mesma por mais tempo
- Mais conexões simultâneas
- Melhor performance

**Como criar:**

1. Acesse: https://dashboard.ngrok.com/signup
2. Crie conta (pode usar Google/GitHub)
3. Após login, copie seu **Authtoken** em: https://dashboard.ngrok.com/get-started/your-authtoken

**Configurar authtoken:**

```powershell
# Navegue até a pasta onde está o ngrok.exe
cd C:\ngrok

# Configure o authtoken (substitua YOUR_AUTHTOKEN pelo seu token)
.\ngrok.exe config add-authtoken YOUR_AUTHTOKEN
```

---

## 🔧 PASSO 3: Iniciar ngrok

### 3.1. Abrir Terminal Separado

**IMPORTANTE**: Abra um novo terminal PowerShell/CMD separado (não use o terminal do backend).

### 3.2. Navegar até a pasta do ngrok

```powershell
cd C:\ngrok
```

### 3.3. Iniciar ngrok na porta 3000

```powershell
.\ngrok.exe http 3000
```

**OU** se instalou via Chocolatey/Scoop:

```powershell
ngrok http 3000
```

### 3.4. Verificar se funcionou

Você deve ver algo assim:

```
ngrok                                                                   

Session Status                online
Account                       seu-email@example.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**COPIE A URL DO FORWARDING**: `https://abc123def456.ngrok-free.app`

⚠️ **ATENÇÃO**: Sua URL será diferente! Use a URL que aparecer no SEU terminal.

---

## 🔧 PASSO 4: Atualizar Backend URL

### 4.1. Abrir arquivo .env

Abra o arquivo `backend/.env` no editor.

### 4.2. Atualizar BACKEND_URL

**ANTES:**
```env
BACKEND_URL=http://localhost:3000
```

**DEPOIS** (substitua pela SUA URL do ngrok):
```env
BACKEND_URL=https://abc123def456.ngrok-free.app
```

### 4.3. Salvar arquivo

Salve o arquivo `.env`.

---

## 🔧 PASSO 5: Reiniciar Backend

### 5.1. Parar backend atual

No terminal do backend, pressione `Ctrl+C`.

### 5.2. Iniciar backend novamente

```powershell
cd C:\SAGW\backend
npm run dev
```

### 5.3. Verificar logs

Aguarde aparecer:

```
✅ Configuration validated successfully
📍 Backend URL: https://abc123def456.ngrok-free.app
🔗 Evolution API: https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
🚀 Servidor rodando na porta 3000
```

**IMPORTANTE**: Verifique se a "Backend URL" mostra a URL do ngrok (não localhost).

---

## 🔧 PASSO 6: Desconectar e Reconectar WhatsApp

**Por que?** Para reconfigurar o webhook com a nova URL do ngrok.

### 6.1. Abrir frontend

Acesse: http://localhost:5173

### 6.2. Ir para página de WhatsApp

Clique em "WhatsApp" no menu.

### 6.3. Desconectar WhatsApp

Se estiver conectado, clique em "Desconectar WhatsApp".

Aguarde aparecer "Desconectado".

### 6.4. Reconectar WhatsApp

Clique em "Conectar WhatsApp".

Aguarde o QR Code aparecer.

Escaneie o QR Code no seu celular.

### 6.5. Verificar logs do backend

No terminal do backend, você deve ver:

```
POST /api/evolution/create-instance
🔧 [setWebhook] Attempting to configure webhook {
  instanceName: 'user-...',
  url: 'https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/set/user-...',
  webhookConfig: {
    url: 'https://abc123def456.ngrok-free.app/api/webhooks/evolution',
    webhook_by_events: true,
    webhook_base64: false,
    events: [ 'QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT' ]
  }
}

📡 [setWebhook] Response received {
  instanceName: 'user-...',
  status: 200,
  statusText: 'OK',
  ok: true
}

✅ [setWebhook] Webhook configured successfully {
  instanceName: 'user-...'
}
```

**SE VER ISSO**: Webhook foi configurado com sucesso! ✅

**SE VER "Bad Request"**: Algo ainda está errado. Me avise.

---

## 🔧 PASSO 7: Testar Auto-Importação

### 7.1. Enviar mensagem de teste

**IMPORTANTE**: A mensagem deve vir DE FORA (outro número).

Use outro celular/WhatsApp e envie uma mensagem para o número conectado.

Mensagem pode ser qualquer coisa: "Oi", "Teste", etc.

### 7.2. Observar logs do backend

Após enviar a mensagem, você deve ver no terminal do backend:

```
📨 [Webhook] Received webhook request {
  method: 'POST',
  path: '/evolution',
  headers: { 'x-evolution-signature': 'present' },
  bodyKeys: [ 'event', 'instance', 'data' ],
  timestamp: '...'
}

📨 [handleMessageUpsert] Processing message {
  instanceName: 'user-...',
  event: 'messages.upsert',
  hasData: true
}

✅ [handleMessageUpsert] Instance found {
  instanceName: 'user-...',
  userId: '...'
}

📞 [handleMessageUpsert] Contact extraction result {
  hasContact: true,
  contact: { phone: '5511999999999', name: 'Nome do Contato' }
}

🔢 [handleMessageUpsert] Phone normalization {
  originalPhone: '5511999999999',
  normalizedPhone: '+5511999999999',
  success: true
}

✅ [handleMessageUpsert] Contact auto-imported {
  clientId: '...',
  phone: '+5511999999999',
  name: 'Nome do Contato'
}
```

**SE VER ISSO**: Auto-importação funcionou! 🎉

### 7.3. Verificar no frontend

1. Vá para página "Clientes"
2. O contato deve aparecer na lista
3. Deve ter tag "Auto-importado"

---

## 📊 Checklist de Teste

Marque conforme for fazendo:

- [ ] Instalei ngrok
- [ ] Criei conta ngrok (opcional)
- [ ] Configurei authtoken (opcional)
- [ ] Iniciei ngrok (`ngrok http 3000`)
- [ ] Copiei URL do ngrok
- [ ] Atualizei `BACKEND_URL` no `.env`
- [ ] Reiniciei backend
- [ ] Verifiquei que Backend URL mostra URL do ngrok
- [ ] Desconectei WhatsApp
- [ ] Reconectei WhatsApp
- [ ] Vi log "Webhook configured successfully"
- [ ] Enviei mensagem de teste (de outro número)
- [ ] Vi log "Webhook Received"
- [ ] Vi log "Contact auto-imported"
- [ ] Verifiquei contato na página de Clientes

---

## 🔍 Troubleshooting

### Problema: ngrok não inicia

**Erro**: `ngrok.exe não é reconhecido`

**Solução**: Navegue até a pasta onde está o `ngrok.exe`:
```powershell
cd C:\ngrok
.\ngrok.exe http 3000
```

### Problema: Backend URL ainda mostra localhost

**Causa**: Não salvou o arquivo `.env` ou não reiniciou o backend.

**Solução**:
1. Verifique se salvou `backend/.env`
2. Pare o backend (Ctrl+C)
3. Inicie novamente (`npm run dev`)

### Problema: Webhook ainda falha com "Bad Request"

**Causa**: URL do ngrok pode estar incorreta ou ngrok não está rodando.

**Solução**:
1. Verifique se ngrok está rodando (terminal separado)
2. Verifique se a URL no `.env` está correta (copie do terminal do ngrok)
3. Teste a URL no navegador: `https://sua-url.ngrok-free.app/health`
   - Deve retornar: `{"status":"ok"}`

### Problema: Webhook não chega

**Causa**: Webhook pode não estar configurado na Evolution API.

**Solução**:
1. Desconecte WhatsApp
2. Reconecte WhatsApp (para reconfigurar webhook)
3. Verifique logs do backend para ver se webhook foi configurado

### Problema: ngrok URL muda toda vez

**Causa**: Versão gratuita do ngrok gera URL aleatória.

**Solução**:
- **Opção 1**: Criar conta ngrok (URL dura mais tempo)
- **Opção 2**: Usar plano pago do ngrok (URL permanente)
- **Opção 3**: Usar backend em produção (Render) - URL permanente

---

## 🎯 Próximos Passos

Após configurar ngrok e testar:

1. **Desenvolvimento local**: Continue usando ngrok enquanto desenvolve
2. **Produção**: O sistema já funciona automaticamente no Render (URL permanente)
3. **Lembre-se**: Toda vez que reiniciar ngrok, precisa:
   - Atualizar `BACKEND_URL` no `.env`
   - Reiniciar backend
   - Desconectar e reconectar WhatsApp

---

## 💡 Dicas

### Manter ngrok rodando

- Deixe o terminal do ngrok aberto enquanto trabalha
- Se fechar, precisa reiniciar e atualizar URL

### Verificar webhooks recebidos

ngrok tem uma interface web para ver requisições:

1. Acesse: http://127.0.0.1:4040
2. Veja todas as requisições HTTP recebidas
3. Útil para debug

### Alternativa: Usar produção

Se ngrok for muito trabalhoso, use o backend em produção:

```env
BACKEND_URL=https://google-review-whatsapp.onrender.com
```

Mas lembre-se: precisa fazer deploy toda vez que mudar código.

---

**Status**: Guia criado
**Próximo passo**: Seguir o guia passo a passo
**Tempo estimado**: 10-15 minutos
