# 🚀 Guia Completo: Configuração Evolution API

## 📋 Entendendo o Processo

### Cada usuário precisa fazer isso?
**SIM!** Cada usuário do seu sistema precisa:
1. Ter sua própria conta Evolution API
2. Conectar seu próprio WhatsApp
3. Configurar no sistema

**Você (desenvolvedor)** já fez a parte técnica - o código está pronto! ✅

---

## 🎯 Passo a Passo para o Usuário

### PASSO 1: Criar Conta na Evolution API (Cloud)

Recomendo usar um serviço cloud (sem precisar instalar nada):

**Opções de Serviços Cloud:**
- **Evolution API Cloud** (oficial): https://evolution-api.com
- **Outras opções**: Procure por "Evolution API hosting" no Google

**O que fazer:**
1. Acesse o site do serviço
2. Crie uma conta (geralmente tem plano gratuito)
3. Faça login no painel

---

### PASSO 2: Criar uma Instância

No painel da Evolution API:

1. Procure por "Nova Instância" ou "Create Instance"
2. Dê um nome para sua instância (exemplo: `meu-whatsapp`)
3. Anote esse nome - você vai precisar!

**Você vai receber:**
- ✅ URL da API (exemplo: `https://api.evolution.com`)
- ✅ API Key (uma chave longa)
- ✅ Nome da Instância (o nome que você escolheu)

---

### PASSO 3: Conectar o WhatsApp

Ainda no painel da Evolution API:

1. Clique na instância que você criou
2. Procure por "Conectar WhatsApp" ou "Connect"
3. Vai aparecer um **QR Code**
4. Abra o WhatsApp no seu celular
5. Vá em: **Configurações > Aparelhos Conectados > Conectar Aparelho**
6. Escaneie o QR Code

**Pronto!** Seu WhatsApp está conectado! ✅

---

### PASSO 4: Configurar o Webhook

**O que é webhook?**
É o endereço que a Evolution API vai usar para avisar seu sistema quando chegar mensagem.

**No painel da Evolution API:**

1. Procure por "Webhook" ou "Configurações"
2. Cole esta URL no campo de webhook:
   ```
   http://localhost:3000/api/webhooks/evolution
   ```
   
   ⚠️ **IMPORTANTE**: Se você já fez deploy (Render/Netlify), use a URL de produção:
   ```
   https://seu-backend.onrender.com/api/webhooks/evolution
   ```

3. **Webhook Secret**: Crie uma senha forte (mínimo 32 caracteres)
   - Pode usar este gerador: https://www.random.org/strings/
   - Ou criar uma senha longa tipo: `minha-senha-super-secreta-12345678901234567890`
   - **ANOTE ESSA SENHA!** Você vai precisar no próximo passo

4. Salve a configuração do webhook

---

### PASSO 5: Configurar no Seu Sistema

Agora volte para: http://localhost:5173/evolution-config

**Preencha os campos:**

1. **URL da API**: 
   - Cole a URL que você recebeu (exemplo: `https://api.evolution.com`)
   - Deve começar com `https://`

2. **API Key**: 
   - Cole a chave que você recebeu
   - Vai ficar mascarada (••••) por segurança

3. **Nome da Instância**: 
   - Digite o nome que você escolheu (exemplo: `meu-whatsapp`)

4. **Webhook Secret**: 
   - Cole a senha que você criou no Passo 4
   - Deve ter pelo menos 32 caracteres

5. Clique em **"Testar Conexão"**
   - Se der ✅ verde: Tudo certo!
   - Se der ❌ vermelho: Revise os dados

6. Marque a caixinha **"Habilitar Auto-Importação de Clientes"**

7. Clique em **"Salvar Configuração"**

---

## 🎉 Pronto! Como Testar?

1. Peça para alguém mandar uma mensagem no seu WhatsApp
2. Vá em: http://localhost:5173/clients
3. O contato deve aparecer automaticamente na lista!

---

## 🔍 Onde Encontrar as Informações?

### No Painel da Evolution API, procure por:

**URL da API:**
- Geralmente está em "API Endpoint" ou "Base URL"
- Exemplo: `https://api.evolution.com` ou `https://seu-servidor.com`

**API Key:**
- Pode estar em "Credenciais", "API Key", "Token"
- É uma string longa tipo: `abc123def456...`

**Nome da Instância:**
- É o nome que você escolheu ao criar
- Geralmente aparece na lista de instâncias

**Webhook Secret:**
- Você mesmo cria! É uma senha forte
- Use no mínimo 32 caracteres

---

## ❓ Dúvidas Comuns

### "Não sei qual serviço cloud usar"
- Recomendo começar com o oficial: https://evolution-api.com
- Geralmente tem plano gratuito para testar

### "O QR Code não aparece"
- Verifique se a instância está ativa
- Tente recarregar a página
- Veja se o WhatsApp já não está conectado

### "Teste de conexão falhou"
- Verifique se copiou a URL corretamente
- Verifique se a API Key está correta
- Verifique se o nome da instância está exato

### "Mensagens não estão sendo importadas"
- Verifique se o webhook está configurado
- Verifique se a auto-importação está habilitada
- Veja os logs do backend para erros

---

## 🛠️ Comandos Úteis (Para Você, Desenvolvedor)

### Ver logs do backend:
```bash
cd C:\SAGW\backend
npm run dev
```

### Ver logs do frontend:
```bash
cd C:\SAGW\frontend
npm run dev
```

### Testar webhook manualmente:
```bash
curl -X POST http://localhost:3000/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -H "x-evolution-signature: sua-assinatura" \
  -d '{"event":"messages.upsert","instance":"teste","data":{"key":{"remoteJid":"5511999999999@s.whatsapp.net","fromMe":false,"id":"123"},"pushName":"Teste","message":{}}}'
```

---

## 📞 Próximos Passos

Depois de configurar:
1. ✅ Teste enviando mensagens
2. ✅ Verifique se os clientes aparecem
3. ✅ Teste enviar pedido de avaliação para um cliente auto-importado
4. ✅ Faça deploy se ainda não fez (Render + Netlify)

---

**Dúvidas?** Me chame que eu te ajudo! 🚀
