# 🚀 Deploy com Supabase - Guia Completo

## Pré-requisitos

- ✅ Testes locais concluídos (ver `CHECKLIST-TESTES-SUPABASE.md`)
- ✅ Tabelas criadas no Supabase
- ✅ Contas no Render e Netlify

---

## 1️⃣ Deploy do Backend (Render)

### Atualizar Variáveis de Ambiente

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço: `google-review-whatsapp`
3. Vá em **"Environment"**
4. **REMOVA** as variáveis antigas:
   - ❌ `DATABASE_PATH`
   - ❌ `JWT_SECRET`

5. **ADICIONE** as novas variáveis:

```
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q
NODE_ENV=production
```

6. Clique em **"Save Changes"**

### Fazer Deploy

1. Vá em **"Manual Deploy"**
2. Clique em **"Deploy latest commit"**
3. Aguarde o build (2-3 minutos)
4. Verifique os logs:
   - ✅ `🚀 Servidor rodando na porta 10000`
   - ✅ `🗄️  Usando Supabase como banco de dados`

### Testar Backend

```bash
# Health check
curl https://google-review-whatsapp.onrender.com/health

# Esperado:
{"status":"ok","timestamp":"2026-01-08T..."}
```

---

## 2️⃣ Deploy do Frontend (Netlify)

### Atualizar Variáveis de Ambiente

1. Acesse: https://app.netlify.com
2. Selecione seu site
3. Vá em **"Site configuration"** → **"Environment variables"**
4. **ADICIONE** as novas variáveis:

```
VITE_API_URL=https://google-review-whatsapp.onrender.com/api
VITE_SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU
```

5. Clique em **"Save"**

### Fazer Deploy

#### Opção A: Deploy Automático (Git)
1. Faça commit das mudanças:
```bash
git add .
git commit -m "Migração para Supabase concluída"
git push origin main
```
2. Netlify fará deploy automaticamente

#### Opção B: Deploy Manual
1. Build local:
```bash
cd frontend
npm run build
```
2. No Netlify, vá em **"Deploys"**
3. Arraste a pasta `frontend/dist` para a área de upload

### Testar Frontend

1. Acesse seu site no Netlify
2. Crie uma nova conta
3. Configure seu negócio
4. Cadastre um cliente
5. Verifique se dados aparecem no Supabase

---

## 3️⃣ Configurar Email no Supabase (Produção)

### Habilitar Confirmação de Email

1. Acesse: https://cuychbunipzwfaitnbor.supabase.co
2. Vá em **"Authentication"** → **"Settings"**
3. **Habilite** "Enable email confirmations"
4. Configure **"Site URL"** com a URL do Netlify:
   - Ex: `https://seu-site.netlify.app`

### Configurar Email Templates (Opcional)

1. Vá em **"Authentication"** → **"Email Templates"**
2. Personalize os templates:
   - Confirm signup
   - Magic Link
   - Reset password

---

## 4️⃣ Verificar Segurança

### Row Level Security (RLS)

1. Acesse: https://cuychbunipzwfaitnbor.supabase.co
2. Vá em **"Authentication"** → **"Policies"**
3. Verifique se as políticas estão ativas:
   - ✅ user_profiles: 3 políticas
   - ✅ business: 3 políticas
   - ✅ clients: 4 políticas

### Testar Isolamento de Dados

1. Crie 2 contas diferentes
2. Cadastre clientes em cada conta
3. Verifique que cada usuário vê apenas seus dados

---

## 5️⃣ Monitoramento

### Logs do Backend (Render)

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço
3. Vá em **"Logs"**
4. Monitore erros e requisições

### Logs do Frontend (Netlify)

1. Acesse: https://app.netlify.com
2. Selecione seu site
3. Vá em **"Functions"** → **"Logs"**

### Logs do Supabase

1. Acesse: https://cuychbunipzwfaitnbor.supabase.co
2. Vá em **"Logs"**
3. Monitore:
   - API Logs
   - Auth Logs
   - Database Logs

---

## 6️⃣ Backup e Recuperação

### Backup Automático

O Supabase faz backup diário automaticamente:
- Retenção: 7 dias (plano gratuito)
- Acesse: **"Database"** → **"Backups"**

### Backup Manual

```sql
-- Exportar dados (SQL Editor)
SELECT * FROM clients;
SELECT * FROM business;
SELECT * FROM user_profiles;
```

### Restaurar Backup

1. Vá em **"Database"** → **"Backups"**
2. Selecione o backup
3. Clique em **"Restore"**

---

## 7️⃣ Limites do Plano Gratuito

### Supabase Free Tier
- ✅ 500 MB de dados
- ✅ 50.000 usuários ativos/mês
- ✅ 2 GB de transferência/mês
- ✅ Backup diário (7 dias)
- ✅ Row Level Security
- ✅ APIs REST e GraphQL

### Render Free Tier
- ✅ 750 horas/mês
- ⚠️ Dorme após 15 min de inatividade
- ⚠️ Primeiro acesso pode demorar 30s

### Netlify Free Tier
- ✅ 100 GB de banda/mês
- ✅ 300 minutos de build/mês
- ✅ Deploy automático

---

## 8️⃣ Troubleshooting

### Backend não inicia
- Verifique variáveis de ambiente
- Verifique logs do Render
- Teste health check

### Frontend não conecta
- Verifique VITE_API_URL
- Verifique CORS no backend
- Veja console do navegador (F12)

### Erro de autenticação
- Verifique SUPABASE_URL e SUPABASE_ANON_KEY
- Verifique se email confirmation está configurado
- Veja logs do Supabase

### Dados não salvam
- Verifique RLS (políticas de segurança)
- Verifique logs do Supabase → API Logs
- Teste com service_role key (temporariamente)

---

## 9️⃣ Próximas Melhorias

### Funcionalidades Pendentes
- [ ] Página de perfil de usuário
- [ ] Upload de foto de perfil
- [ ] Botão "Reenviar Link"
- [ ] Exportar relatórios (CSV/PDF)
- [ ] Notificações por email

### Otimizações
- [ ] Cache de dados
- [ ] Paginação de clientes
- [ ] Busca e filtros
- [ ] Dark mode

---

## ✅ Checklist Final

- [ ] Backend deployado no Render
- [ ] Frontend deployado no Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] Tabelas criadas no Supabase
- [ ] RLS habilitado e testado
- [ ] Email confirmation configurado
- [ ] Testes em produção concluídos
- [ ] Monitoramento configurado

---

## 🎉 Parabéns!

Seu sistema está em produção com:
- ✅ Dados persistentes e seguros
- ✅ Backup automático
- ✅ Autenticação robusta
- ✅ Escalável e gratuito
- ✅ Pronto para uso real

**URL do Sistema:** https://seu-site.netlify.app  
**URL da API:** https://google-review-whatsapp.onrender.com  
**Dashboard Supabase:** https://cuychbunipzwfaitnbor.supabase.co

---

## 📞 Suporte

Problemas? Verifique:
1. Logs do Render
2. Logs do Netlify
3. Logs do Supabase
4. Console do navegador (F12)
5. Documentação: `MIGRACAO-SUPABASE-CONCLUIDA.md`
