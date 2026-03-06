# ✅ Checklist: Deploy Backend no Render

Use este checklist enquanto faz o deploy. Marque cada item conforme completa.

---

## 🎯 Pré-requisitos

- [ ] Sistema funcionando localmente
- [ ] Código no GitHub
- [ ] Conta no Render criada

---

## 📝 Passo a Passo

### 1. Criar Web Service

- [ ] Acessei https://dashboard.render.com
- [ ] Cliquei em "New +" → "Web Service"
- [ ] Conectei ao GitHub
- [ ] Selecionei o repositório correto

### 2. Configurações Básicas

- [ ] **Name:** `google-review-whatsapp` (ou outro)
- [ ] **Region:** `Oregon (US West)` (ou mais próximo)
- [ ] **Branch:** `main`
- [ ] **Root Directory:** `backend`
- [ ] **Runtime:** `Node`
- [ ] **Instance Type:** `Free`

### 3. Comandos

- [ ] **Build Command:** `npm install && npm run build`
- [ ] **Start Command:** `npm start`
- [ ] ⚠️ Confirmei que NÃO tem `npm run init-db`

### 4. Variáveis de Ambiente

Cliquei em "Advanced" e adicionei:

- [ ] `SUPABASE_URL` = `https://cuychbunipzwfaitnbor.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = (chave longa que começa com eyJhbGc...)
- [ ] `SUPABASE_SERVICE_KEY` = (chave longa que começa com eyJhbGc...)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`

### 5. Deploy

- [ ] Cliquei em "Create Web Service"
- [ ] Aguardei o build (2-5 minutos)
- [ ] Build concluído sem erros

### 6. Testar

- [ ] Anotei a URL do backend: `_______________________________`
- [ ] Acessei: `https://minha-url.onrender.com/health`
- [ ] Retornou: `{"status":"ok","timestamp":"..."}`

---

## ✅ Pronto!

Se todos os itens estão marcados, o backend está funcionando! 🎉

**Próximo passo:** Deploy do frontend no Netlify

---

## ❌ Se algo deu errado

### Erro no Build

**Sintoma:** Build falhou com erro "Missing script: 'init-db'"

**Solução:**
1. Vá em "Settings" → "Build & Deploy"
2. Edite o Build Command
3. Remova `&& npm run init-db`
4. Salve e faça deploy manual

### Erro ao Iniciar

**Sintoma:** Build ok, mas serviço não inicia

**Solução:**
1. Vá em "Logs"
2. Procure por "Missing Supabase environment variables"
3. Vá em "Environment"
4. Verifique se as 3 variáveis do Supabase estão lá
5. Salve (deploy automático)

### Health Check Falha

**Sintoma:** `/health` retorna erro 404 ou 500

**Solução:**
1. Verifique se a URL está correta
2. Aguarde 1-2 minutos (serviço pode estar iniciando)
3. Se persistir, veja os logs

---

## 📞 Precisa de Ajuda?

Me avise qual erro apareceu e vou te ajudar!

---

**Última atualização:** 09/01/2026
