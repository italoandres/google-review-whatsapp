# 🚀 Guia de Deploy - Sistema Multi-Tenant WhatsApp

## ✅ Status Atual
- ✅ Código commitado e enviado para GitHub
- ✅ Erro do build corrigido (Jest types removido)
- ⏳ Render fazendo deploy automático
- ⏳ Falta executar migration no Supabase
- ⏳ Falta adicionar variáveis de ambiente no Render

---

## 📋 Passo 1: Executar Migration no Supabase

### 1.1 Acessar o Supabase
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto: **cuychbunipzwfaitnbor**

### 1.2 Abrir SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New Query"** (ou "+ New query")

### 1.3 Copiar e Executar o SQL
1. Abra o arquivo: `migrations/add_multi_tenant_whatsapp_instances.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase (Ctrl+V)
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

### 1.4 Verificar Sucesso
Você deve ver uma mensagem de sucesso dizendo que 4 tabelas foram criadas:
- ✅ `whatsapp_instances`
- ✅ `whatsapp_connection_history`
- ✅ `whatsapp_webhook_logs`
- ✅ `rate_limit_records`

---

## 📋 Passo 2: Adicionar Variáveis de Ambiente no Render

### 2.1 Acessar o Render
1. Acesse: https://dashboard.render.com
2. Faça login
3. Clique no seu serviço: **google-review-whatsapp**

### 2.2 Ir para Environment
1. No menu lateral esquerdo, clique em **"Environment"**
2. Role até a seção **"Environment Variables"**

### 2.3 Adicionar as 5 Novas Variáveis

Clique em **"Add Environment Variable"** para cada uma:

#### Variável 1: ENCRYPTION_KEY
```
Key: ENCRYPTION_KEY
Value: 340013285889db4348a7576ed2843f377811f7da94e8d233440266126e06be95
```

#### Variável 2: WEBHOOK_SECRET
```
Key: WEBHOOK_SECRET
Value: wh_secret_a8f3d9c2e1b4567890abcdef12345678
```

#### Variável 3: EVOLUTION_API_URL
```
Key: EVOLUTION_API_URL
Value: https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
```

#### Variável 4: EVOLUTION_API_GLOBAL_KEY
```
Key: EVOLUTION_API_GLOBAL_KEY
Value: tpuQVDtOgLGRihphPSwaFBXU39xSKmkz
```

#### Variável 5: BACKEND_URL
```
Key: BACKEND_URL
Value: https://google-review-whatsapp.onrender.com
```

### 2.4 Salvar e Fazer Redeploy
1. Clique em **"Save Changes"** no final da página
2. O Render vai fazer redeploy automaticamente
3. Aguarde 2-3 minutos

---

## 📋 Passo 3: Verificar se o Deploy Funcionou

### 3.1 Verificar Logs do Render
1. No Render, clique na aba **"Logs"**
2. Procure por estas mensagens de sucesso:
```
✅ Configuration validated successfully
📍 Backend URL: https://google-review-whatsapp.onrender.com
🔗 Evolution API: https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
🗄️  Supabase: https://cuychbunipzwfaitnbor.supabase.co
⚙️  Environment: production
🚀 Servidor rodando na porta 10000
```

### 3.2 Testar o Health Check
Abra no navegador:
```
https://google-review-whatsapp.onrender.com/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"2025-..."}
```

---

## 🎉 Pronto! Backend em Produção

Agora você tem 5 novos endpoints funcionando:

### Endpoints Disponíveis

1. **Criar Instância WhatsApp**
```
POST https://google-review-whatsapp.onrender.com/api/evolution/create-instance
Headers: Authorization: Bearer <seu-token-jwt>
```

2. **Obter QR Code**
```
GET https://google-review-whatsapp.onrender.com/api/evolution/qrcode
Headers: Authorization: Bearer <seu-token-jwt>
```

3. **Status da Conexão**
```
GET https://google-review-whatsapp.onrender.com/api/evolution/connection-status
Headers: Authorization: Bearer <seu-token-jwt>
```

4. **Desconectar**
```
POST https://google-review-whatsapp.onrender.com/api/evolution/disconnect
Headers: Authorization: Bearer <seu-token-jwt>
```

5. **Reconectar**
```
POST https://google-review-whatsapp.onrender.com/api/evolution/reconnect
Headers: Authorization: Bearer <seu-token-jwt>
```

---

## 🔍 Troubleshooting

### Se o deploy falhar:
1. Verifique os logs no Render
2. Certifique-se que todas as 5 variáveis foram adicionadas corretamente
3. Verifique se a migration foi executada no Supabase

### Se aparecer erro de configuração:
- Verifique se as URLs estão corretas (com https://)
- Verifique se a ENCRYPTION_KEY tem exatamente 64 caracteres
- Verifique se a EVOLUTION_API_GLOBAL_KEY está correta

---

## 📝 Próximos Passos

Depois que o backend estiver funcionando, você pode:

1. **Testar os endpoints** via Postman ou Insomnia
2. **Implementar o frontend** (tarefas 11-27 do spec)
3. **Adicionar webhook endpoint** (tarefa 11)
4. **Criar interface React** para conectar WhatsApp

---

**Dúvidas?** Me chama que eu te ajudo! 🚀
