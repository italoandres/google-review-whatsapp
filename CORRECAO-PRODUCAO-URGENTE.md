# 🔧 Correções Urgentes - Produção

## ❌ Problemas Identificados

### 1. Email redirecionando para localhost
O Supabase está configurado para redirecionar para `http://localhost:3000` ao invés do Netlify.

### 2. Erro 404 nas rotas da API
A variável `VITE_API_URL` está sem o `/api` no final.

---

## ✅ Solução 1: Configurar Redirect URL no Supabase

### Passo a Passo:

1. Acesse: https://cuychbunipzwfaitnbor.supabase.co
2. Faça login
3. Vá em **"Authentication"** (menu lateral esquerdo)
4. Clique em **"URL Configuration"**
5. Encontre o campo **"Site URL"**
6. Mude de:
   ```
   http://localhost:3000
   ```
   Para:
   ```
   https://meu-sistema-avaliacoes.netlify.app
   ```

7. Role para baixo até **"Redirect URLs"**
8. Clique em **"Add URL"**
9. Adicione:
   ```
   https://meu-sistema-avaliacoes.netlify.app/**
   ```

10. Clique em **"Save"**

✅ Pronto! Agora os emails vão redirecionar para o Netlify!

---

## ✅ Solução 2: Corrigir URL da API no Netlify

### Passo a Passo:

1. Acesse: https://app.netlify.com
2. Clique no seu site (`meu-sistema-avaliacoes`)
3. Vá em **"Site configuration"** (menu lateral esquerdo)
4. Clique em **"Environment variables"**
5. Encontre a variável `VITE_API_URL`
6. Clique em **"Options"** → **"Edit"**
7. Mude o valor de:
   ```
   https://google-review-whatsapp.onrender.com
   ```
   Para:
   ```
   https://google-review-whatsapp.onrender.com/api
   ```
   ⚠️ **IMPORTANTE:** Não esqueça o `/api` no final!

8. Clique em **"Save"**
9. Vá em **"Deploys"** (menu superior)
10. Clique em **"Trigger deploy"** → **"Clear cache and deploy site"**
11. Aguarde o deploy (1-2 minutos)

✅ Pronto! Agora as chamadas da API vão funcionar!

---

## 🧪 Testar

Após fazer as duas correções:

1. Acesse: https://meu-sistema-avaliacoes.netlify.app
2. Faça logout (se estiver logado)
3. Crie uma nova conta
4. Verifique o email de confirmação
5. Clique no link do email
6. Deve redirecionar para o Netlify (não mais para localhost)
7. Faça login
8. Veja se o dashboard carrega sem erros 404

---

## 📋 Checklist

- [ ] Acessei o Supabase
- [ ] Mudei "Site URL" para URL do Netlify
- [ ] Adicionei URL do Netlify nas "Redirect URLs"
- [ ] Salvei as configurações no Supabase
- [ ] Acessei o Netlify
- [ ] Editei `VITE_API_URL` para incluir `/api`
- [ ] Salvei a variável
- [ ] Fiz deploy com "Clear cache"
- [ ] Aguardei o deploy terminar
- [ ] Testei o sistema

---

## ✅ Resultado Esperado

Depois das correções:

- ✅ Emails redirecionam para o Netlify
- ✅ Dashboard carrega sem erros
- ✅ Métricas aparecem
- ✅ Lista de clientes carrega
- ✅ Consegue cadastrar clientes
- ✅ Consegue solicitar avaliações

---

**Data:** 09/01/2026
**Status:** Aguardando correções
