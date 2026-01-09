# ✅ Checklist de Testes - Migração Supabase

## Antes de Começar

- [ ] Tabelas criadas no Supabase (ver `COMO-CRIAR-TABELAS-SUPABASE.md`)
- [ ] Email confirmation desabilitado no Supabase (para testes)
- [ ] Backend rodando (`cd backend && npm run dev`)
- [ ] Frontend rodando (`cd frontend && npm run dev`)

---

## 1️⃣ Teste de Autenticação

### Registro
- [ ] Abrir http://localhost:5173
- [ ] Clicar em "Criar conta"
- [ ] Preencher email e senha (mínimo 6 caracteres)
- [ ] Clicar em "Criar Conta"
- [ ] **Esperado:** Mensagem de sucesso ou redirecionamento

### Login
- [ ] Preencher email e senha
- [ ] Clicar em "Entrar"
- [ ] **Esperado:** Redirecionamento para /clients

### Verificar no Supabase
- [ ] Ir em Supabase → Authentication → Users
- [ ] **Esperado:** Ver usuário criado

---

## 2️⃣ Teste de Configuração do Negócio

### Primeira Configuração
- [ ] Após login, deve aparecer página de Setup
- [ ] Preencher:
  - Nome do negócio
  - WhatsApp (com DDI, ex: 5511999999999)
  - Link do Google (ex: https://g.page/r/...)
  - Mensagem padrão
- [ ] Clicar em "Salvar Configuração"
- [ ] **Esperado:** Redirecionamento para /clients

### Verificar no Supabase
- [ ] Ir em Supabase → Table Editor → business
- [ ] **Esperado:** Ver configuração salva

---

## 3️⃣ Teste de Cadastro de Clientes

### Cadastrar Cliente Satisfeito
- [ ] Ir em "Clientes"
- [ ] Clicar em "Adicionar Cliente"
- [ ] Preencher:
  - Nome (opcional)
  - Telefone (ex: 11999999999)
  - Marcar "Cliente satisfeito"
- [ ] Clicar em "Adicionar"
- [ ] **Esperado:** Cliente aparece na lista com status ⬜ NÃO ENVIADO

### Cadastrar Cliente que Reclamou
- [ ] Adicionar outro cliente
- [ ] Marcar "Cliente reclamou"
- [ ] **Esperado:** Cliente aparece na lista com status ⬜ NÃO ENVIADO

### Verificar no Supabase
- [ ] Ir em Supabase → Table Editor → clients
- [ ] **Esperado:** Ver 2 clientes cadastrados

---

## 4️⃣ Teste de Solicitação de Avaliação

### Enviar Link
- [ ] Clicar em "Solicitar Avaliação" no cliente satisfeito
- [ ] **Esperado:** 
  - Link do WhatsApp é aberto
  - Status muda para 🟡 ENVIADO
  - Botão "Solicitar Avaliação" desaparece

### Tentar Reenviar
- [ ] Tentar clicar novamente em "Solicitar Avaliação"
- [ ] **Esperado:** Botão não aparece (bloqueio funcionando)

### Verificar no Supabase
- [ ] Ir em Supabase → Table Editor → clients
- [ ] **Esperado:** 
  - review_status = 'SENT'
  - sent_at preenchido

---

## 5️⃣ Teste de Marcar como Avaliado

### Marcar Manualmente
- [ ] Clicar em "Marcar como Avaliado" no cliente ENVIADO
- [ ] Confirmar ação
- [ ] **Esperado:**
  - Status muda para 🟢 AVALIADO
  - Botão "Marcar como Avaliado" desaparece

### Verificar no Supabase
- [ ] Ir em Supabase → Table Editor → clients
- [ ] **Esperado:**
  - review_status = 'REVIEWED_MANUAL'
  - reviewed_at preenchido

---

## 6️⃣ Teste de Métricas

### Dashboard
- [ ] Ir em "Dashboard"
- [ ] **Esperado:** Ver métricas:
  - Envios hoje: 1
  - Envios esta semana: 1
  - Envios este mês: 1
  - Avaliações esta semana: 1
  - Avaliações este mês: 1

---

## 7️⃣ Teste de Navegação

### Trocar de Abas
- [ ] Ir em "Clientes"
- [ ] Ir em "Configurações"
- [ ] Ir em "Dashboard"
- [ ] Voltar em "Clientes"
- [ ] **Esperado:** Dados continuam aparecendo (não somem mais!)

### Recarregar Página
- [ ] Pressionar F5 (recarregar)
- [ ] **Esperado:** Continua logado, dados aparecem

---

## 8️⃣ Teste de Configurações

### Atualizar Configuração
- [ ] Ir em "Configurações"
- [ ] Alterar nome do negócio
- [ ] Clicar em "Salvar Alterações"
- [ ] **Esperado:** Mensagem de sucesso

### Verificar no Supabase
- [ ] Ir em Supabase → Table Editor → business
- [ ] **Esperado:** Ver alteração salva

---

## 9️⃣ Teste de Logout

### Sair da Conta
- [ ] Clicar em "Sair" (se houver botão)
- [ ] Ou limpar localStorage e recarregar
- [ ] **Esperado:** Redirecionamento para /login

### Tentar Acessar Rota Protegida
- [ ] Tentar acessar http://localhost:5173/clients
- [ ] **Esperado:** Redirecionamento para /login

---

## 🔟 Teste de Telefone Duplicado

### Cadastrar Mesmo Telefone
- [ ] Fazer login novamente
- [ ] Tentar cadastrar cliente com telefone já existente
- [ ] **Esperado:** Mensagem de erro "Este telefone já está cadastrado"

---

## 🎯 Resultado Esperado

Se todos os testes passaram:
- ✅ Autenticação funcionando
- ✅ Dados persistindo (não somem mais)
- ✅ CRUD de clientes funcionando
- ✅ Controle de status funcionando
- ✅ Métricas funcionando
- ✅ Navegação estável

---

## ⚠️ Se Algo Falhou

### Erro de Autenticação
- Verifique variáveis de ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Verifique se email confirmation está desabilitado

### Erro ao Salvar Dados
- Verifique se as tabelas foram criadas
- Verifique RLS (políticas de segurança)
- Veja logs do backend

### Dados Somem
- Verifique se está usando Supabase (não SQLite)
- Veja console do navegador (F12)

---

## 📞 Debug

### Console do Navegador (F12)
```
🌐 API URL: http://localhost:3000/api
✅ Supabase client initialized
```

### Logs do Backend
```
🚀 Servidor rodando na porta 3000
🗄️  Usando Supabase como banco de dados
```

---

## ✅ Próximo Passo

Se todos os testes passaram, você está pronto para:
1. Criar página de perfil de usuário
2. Adicionar botão "Reenviar Link"
3. Fazer deploy em produção

🎉 **Parabéns! Migração concluída com sucesso!**
