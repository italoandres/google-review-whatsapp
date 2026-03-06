# ✅ Checklist: Deploy Frontend no Netlify

Use este checklist enquanto faz o deploy. Marque cada item conforme completa.

---

## 🎯 Pré-requisitos

- [ ] Backend funcionando no Render
- [ ] URL do backend anotada: `_______________________________`
- [ ] Conta no Netlify criada

---

## 📝 Passo a Passo

### 1. Criar Novo Site

- [ ] Acessei https://app.netlify.com
- [ ] Cliquei em "Add new site" → "Import an existing project"
- [ ] Cliquei em "Deploy with GitHub"
- [ ] Autorizei o Netlify (se necessário)
- [ ] Selecionei o repositório correto

### 2. Configurações Básicas

- [ ] **Site name:** `meu-sistema-avaliacoes` (ou outro)
- [ ] **Branch:** `main`
- [ ] **Base directory:** `frontend`
- [ ] **Build command:** `npm run build`
- [ ] **Publish directory:** `frontend/dist`

### 3. Variáveis de Ambiente

Cliquei em "Show advanced" e adicionei:

- [ ] `VITE_API_URL` = `https://MEU-BACKEND.onrender.com/api`
  - ⚠️ Substituí `MEU-BACKEND` pela URL real
  - ⚠️ Confirmei que tem `/api` no final
  
- [ ] `VITE_SUPABASE_URL` = `https://cuychbunipzwfaitnbor.supabase.co`

- [ ] `VITE_SUPABASE_ANON_KEY` = (chave longa que começa com eyJhbGc...)

### 4. Deploy

- [ ] Cliquei em "Deploy site"
- [ ] Aguardei o build (2-3 minutos)
- [ ] Build concluído sem erros

### 5. Testar

- [ ] Anotei a URL do frontend: `_______________________________`
- [ ] Acessei a URL
- [ ] Consegui criar uma conta
- [ ] Consegui fazer login
- [ ] Consegui configurar o negócio
- [ ] Consegui cadastrar um cliente
- [ ] Consegui solicitar avaliação
- [ ] WhatsApp abriu corretamente

---

## ✅ Pronto!

Se todos os itens estão marcados, o sistema está 100% em produção! 🎉

**URLs finais:**
- Frontend: `_______________________________`
- Backend: `_______________________________`
- Supabase: `https://cuychbunipzwfaitnbor.supabase.co`

---

## ❌ Se algo deu errado

### Build Falhou

**Sintoma:** Build failed no Netlify

**Solução:**
1. Vá em "Deploys" → Clique no deploy que falhou
2. Veja os logs
3. Verifique se as variáveis de ambiente estão corretas
4. Clique em "Retry deploy"

### Frontend não conecta ao backend

**Sintoma:** Erro "Network Error" ou "Failed to fetch"

**Solução:**
1. Vá em "Site configuration" → "Environment variables"
2. Verifique se `VITE_API_URL` está correta
3. Confirme que tem `/api` no final
4. Teste o backend: `https://seu-backend.onrender.com/health`
5. Se necessário, vamos configurar CORS

### Erro 401 (Unauthorized)

**Sintoma:** Não consegue fazer login ou criar conta

**Solução:**
1. Verifique se `VITE_SUPABASE_URL` está correta
2. Verifique se `VITE_SUPABASE_ANON_KEY` está correta
3. Vá no Supabase → Authentication → URL Configuration
4. Adicione a URL do Netlify nas "Redirect URLs"

---

## 📞 Precisa de Ajuda?

Me avise qual erro apareceu e vou te ajudar!

---

**Última atualização:** 09/01/2026
