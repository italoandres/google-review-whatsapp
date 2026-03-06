# 🚀 Configurar Evolution API - PASSO A PASSO

## ✅ Você está aqui:
- Evolution API instalada: `https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host`
- Painel aberto: `/manager/`
- Status: "No instances found"

---

## 📋 Próximos Passos

### 1. Criar uma Instância (Instance)

1. Clique no botão **"Instance +"** (canto superior direito)
2. Preencha os dados:

**Nome da Instância:**
```
avaliacoes-whatsapp
```

**Configurações:**
- **Channel**: baileys (conecta via WhatsApp Web com QR Code)
- **Business ID**: 123456789 (qualquer número - campo obrigatório mas não usado)
- **Number**: (deixe em branco por enquanto)
- **Token**: (será gerado automaticamente)

3. Clique em **"Create"**

---

### 2. Conectar WhatsApp via QR Code

Após criar a instância:

1. Clique na instância criada (`avaliacoes-whatsapp`)
2. Vá na aba **"Connect"** ou **"QR Code"**
3. Abra o WhatsApp no celular
4. Vá em **Configurações** → **Aparelhos conectados** → **Conectar um aparelho**
5. Escaneie o QR Code que aparece na tela
6. Aguarde a conexão (status deve mudar para "Connected" ou "Open")

---

### 3. Anotar Informações Importantes

Após conectar, anote estas informações:

**API URL:**
```
https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
```

**API Key:**
- Vá em **Settings** ou **API Key** no painel
- Copie a API Key (algo como: `B6D9C...`)
- Guarde em local seguro!

**Instance Name:**
```
avaliacoes-whatsapp
```

---

### 4. Configurar Webhook

Agora vamos configurar o webhook para enviar eventos ao seu sistema:

1. Na instância, vá em **"Webhook"** ou **"Settings"**
2. Preencha:

**Webhook URL:**
```
https://google-review-whatsapp.onrender.com/api/webhooks/evolution
```

**Events (Eventos):**
- Marque: `messages.upsert` (ou "New Message")
- Ou marque: `MESSAGES_UPSERT`

**Webhook Secret:**
```
meu-webhook-secreto-123
```
(Crie uma senha forte e anote!)

3. Clique em **"Save"** ou **"Update"**

---

### 5. Testar Webhook (Opcional)

Para testar se o webhook está funcionando:

1. Envie uma mensagem para o WhatsApp conectado
2. Veja se aparece nos logs da Evolution API
3. Veja se o backend recebe o webhook (logs do Render)

---

### 6. Configurar no Sistema

Agora vamos configurar no seu sistema:

1. Acesse: `http://localhost:5173` (ou o Netlify)
2. Faça login
3. Vá em **"📱 WhatsApp"** no menu (ou crie essa rota)
4. Preencha:

**API URL:**
```
https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
```

**API Key:**
```
(Cole a API Key que você copiou no passo 3)
```

**Instance Name:**
```
avaliacoes-whatsapp
```

**Webhook Secret:**
```
meu-webhook-secreto-123
```
(Use a mesma senha do passo 4!)

5. Clique em **"Testar Conexão"**
6. Se der sucesso, ative **"Auto-importação ativada"**
7. Clique em **"Salvar Configuração"**

---

### 7. Testar Auto-Importação

1. Envie uma mensagem no WhatsApp para o número conectado
2. Vá em **"Clientes"** no sistema
3. O contato deve aparecer automaticamente com badge **"Auto"**

---

## 📝 Checklist

- [ ] Instância criada na Evolution API
- [ ] WhatsApp conectado via QR Code
- [ ] API Key anotada
- [ ] Webhook configurado na Evolution API
- [ ] Webhook Secret anotado
- [ ] Sistema configurado com as credenciais
- [ ] Teste de conexão passou
- [ ] Auto-importação ativada
- [ ] Teste enviando mensagem no WhatsApp
- [ ] Cliente apareceu automaticamente na lista

---

## ⚠️ Problemas Comuns

### Webhook não funciona
- Verifique se a URL está correta
- Verifique se o backend está rodando
- Veja os logs do Render para erros

### QR Code não aparece
- Recarregue a página
- Tente criar uma nova instância
- Verifique se a Evolution API está rodando

### Conexão cai
- WhatsApp Web tem limite de dispositivos
- Desconecte outros dispositivos
- Reconecte via QR Code

---

## 🎯 Resultado Esperado

Depois de tudo configurado:

1. ✅ WhatsApp conectado na Evolution API
2. ✅ Webhook enviando eventos para o backend
3. ✅ Clientes sendo cadastrados automaticamente
4. ✅ Badge "Auto" aparecendo na lista
5. ✅ Cadastro manual continua funcionando

---

## 📞 Precisa de Ajuda?

Me avise em qual passo você está e se encontrou algum erro!

---

**Última atualização:** 09/01/2026
