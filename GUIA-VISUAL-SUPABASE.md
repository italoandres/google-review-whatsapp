# 🎨 Guia Visual - Criar Tabelas no Supabase

## 📋 Passo a Passo com Imagens

### 1️⃣ Acessar o Supabase

```
🌐 URL: https://cuychbunipzwfaitnbor.supabase.co
```

- Abra o link acima
- Faça login com sua conta

---

### 2️⃣ Abrir SQL Editor

```
Menu Lateral → SQL Editor → New query
```

**O que você verá:**
```
┌─────────────────────────────────────┐
│ 📊 Supabase Dashboard               │
├─────────────────────────────────────┤
│ 🏠 Home                             │
│ 📊 Table Editor                     │
│ 🔐 Authentication                   │
│ 📦 Storage                          │
│ 🔧 Database                         │
│ ⚡ SQL Editor  ← CLIQUE AQUI        │
│ 📈 Logs                             │
└─────────────────────────────────────┘
```

---

### 3️⃣ Criar Nova Query

```
Botão: + New query
```

**O que você verá:**
```
┌─────────────────────────────────────┐
│ SQL Editor                          │
├─────────────────────────────────────┤
│ [+ New query]  [Templates]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ -- Digite seu SQL aqui          │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Run] [Format]                      │
└─────────────────────────────────────┘
```

---

### 4️⃣ Copiar SQL

**No seu computador:**
1. Abra o arquivo `supabase-schema.sql` (na raiz do projeto)
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

**Conteúdo do arquivo:**
```sql
-- ============================================
-- SCHEMA DO SUPABASE
-- Sistema de Avaliações Google via WhatsApp
-- ============================================

-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
```

---

### 5️⃣ Colar no Editor

**No Supabase:**
1. Clique no editor SQL
2. Cole o conteúdo (Ctrl+V)

**O que você verá:**
```
┌─────────────────────────────────────┐
│ SQL Editor                          │
├─────────────────────────────────────┤
│ [+ New query]  [Templates]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ -- SCHEMA DO SUPABASE           │ │
│ │ CREATE TABLE user_profiles (    │ │
│ │   id UUID PRIMARY KEY...        │ │
│ │ );                              │ │
│ │ CREATE TABLE business (         │ │
│ │   ...                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Run] [Format]                      │
└─────────────────────────────────────┘
```

---

### 6️⃣ Executar SQL

```
Clique em: [Run]
Ou pressione: Ctrl+Enter
```

**O que você verá:**
```
┌─────────────────────────────────────┐
│ ⏳ Running query...                 │
└─────────────────────────────────────┘

↓ Depois de alguns segundos ↓

┌─────────────────────────────────────┐
│ ✅ Success. No rows returned        │
│ Rows: 0                             │
│ Time: 1.2s                          │
└─────────────────────────────────────┘
```

---

### 7️⃣ Verificar Tabelas Criadas

```
Menu Lateral → Table Editor
```

**O que você verá:**
```
┌─────────────────────────────────────┐
│ 📊 Table Editor                     │
├─────────────────────────────────────┤
│ Tables:                             │
│                                     │
│ 📋 user_profiles                    │
│ 📋 business                         │
│ 📋 clients                          │
│                                     │
│ [+ New table]                       │
└─────────────────────────────────────┘
```

---

### 8️⃣ Verificar Estrutura das Tabelas

**Clique em `clients`:**
```
┌─────────────────────────────────────┐
│ 📋 clients                          │
├─────────────────────────────────────┤
│ Columns:                            │
│ • id (uuid)                         │
│ • user_id (uuid)                    │
│ • name (text)                       │
│ • phone (text)                      │
│ • satisfied (boolean)               │
│ • complained (boolean)              │
│ • review_status (text)              │
│ • sent_at (timestamptz)             │
│ • reviewed_at (timestamptz)         │
│ • attendance_date (timestamptz)     │
│ • created_at (timestamptz)          │
└─────────────────────────────────────┘
```

---

### 9️⃣ Verificar Políticas de Segurança (RLS)

```
Menu Lateral → Authentication → Policies
```

**O que você verá:**
```
┌─────────────────────────────────────┐
│ 🔐 Row Level Security (RLS)         │
├─────────────────────────────────────┤
│ user_profiles:                      │
│ ✅ Users can view own profile       │
│ ✅ Users can update own profile     │
│ ✅ Users can insert own profile     │
│                                     │
│ business:                           │
│ ✅ Users can view own business      │
│ ✅ Users can insert own business    │
│ ✅ Users can update own business    │
│                                     │
│ clients:                            │
│ ✅ Users can view own clients       │
│ ✅ Users can insert own clients     │
│ ✅ Users can update own clients     │
│ ✅ Users can delete own clients     │
└─────────────────────────────────────┘
```

---

## ✅ PRONTO!

Se você viu todas as tabelas e políticas, está tudo certo!

**Próximo passo:** Testar o sistema localmente

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse: http://localhost:5173

---

## 🔍 Verificar se Funcionou

### Teste Rápido

1. **Criar conta:**
   - Abra http://localhost:5173
   - Clique em "Criar conta"
   - Preencha email e senha
   - Clique em "Criar Conta"

2. **Verificar no Supabase:**
   - Vá em: Authentication → Users
   - Você deve ver o usuário criado!

3. **Configurar negócio:**
   - Preencha os dados
   - Clique em "Salvar"

4. **Verificar no Supabase:**
   - Vá em: Table Editor → business
   - Você deve ver a configuração!

5. **Cadastrar cliente:**
   - Preencha nome e telefone
   - Marque "Cliente satisfeito"
   - Clique em "Adicionar"

6. **Verificar no Supabase:**
   - Vá em: Table Editor → clients
   - Você deve ver o cliente!

---

## 🎉 SUCESSO!

Se você conseguiu:
- ✅ Criar tabelas
- ✅ Ver políticas de segurança
- ✅ Criar conta
- ✅ Salvar dados
- ✅ Ver dados no Supabase

**Parabéns! Migração concluída com sucesso!** 🚀

---

## 📞 Problemas?

### Erro ao executar SQL
- Verifique se copiou TODO o conteúdo
- Tente executar novamente
- Veja mensagem de erro

### Tabelas não aparecem
- Recarregue a página (F5)
- Vá em Table Editor novamente

### Políticas não aparecem
- Vá em Authentication → Policies
- Verifique se RLS está habilitado

---

**Última atualização:** 08/01/2026  
**Próximo:** Testar localmente com `CHECKLIST-TESTES-SUPABASE.md`
