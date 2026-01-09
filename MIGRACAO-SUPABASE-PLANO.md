# 🚀 Plano de Migração para Supabase

## Visão Geral

Migração completa de SQLite para Supabase (PostgreSQL + Auth + Storage)

**Tempo estimado:** 3-5 dias  
**Custo:** $0/mês (plano gratuito)  
**Benefícios:** Backup automático, perfil completo, escalável, profissional

---

## 📋 Checklist de Implementação

### Fase 1: Setup do Supabase (30 min)
- [ ] 1.1 Criar conta no Supabase
- [ ] 1.2 Criar novo projeto
- [ ] 1.3 Obter credenciais (URL + anon key + service key)
- [ ] 1.4 Configurar variáveis de ambiente

### Fase 2: Migração do Schema (2h)
- [ ] 2.1 Converter schema SQLite para PostgreSQL
- [ ] 2.2 Criar tabelas no Supabase
- [ ] 2.3 Configurar Row Level Security (RLS)
- [ ] 2.4 Criar políticas de acesso

### Fase 3: Migração da Autenticação (3h)
- [ ] 3.1 Remover JWT manual
- [ ] 3.2 Implementar Supabase Auth no backend
- [ ] 3.3 Implementar Supabase Auth no frontend
- [ ] 3.4 Migrar usuários existentes

### Fase 4: Migração dos Models (4h)
- [ ] 4.1 Substituir SQLite por Supabase Client
- [ ] 4.2 Atualizar model de usuários
- [ ] 4.3 Atualizar model de negócios
- [ ] 4.4 Atualizar model de clientes
- [ ] 4.5 Testar todas as queries

### Fase 5: Perfil de Usuário (2h)
- [ ] 5.1 Criar tabela user_profiles
- [ ] 5.2 Configurar Supabase Storage (fotos)
- [ ] 5.3 Criar página de perfil
- [ ] 5.4 Upload de foto de perfil

### Fase 6: Botão Reenviar (1h)
- [ ] 6.1 Criar rota de reenvio
- [ ] 6.2 Adicionar botão na UI
- [ ] 6.3 Implementar confirmação

### Fase 7: Migração de Dados (1h)
- [ ] 7.1 Exportar dados do SQLite
- [ ] 7.2 Importar para Supabase
- [ ] 7.3 Validar integridade

### Fase 8: Testes e Deploy (2h)
- [ ] 8.1 Testar localmente
- [ ] 8.2 Testar em produção
- [ ] 8.3 Atualizar documentação
- [ ] 8.4 Validar backup automático

---

## 🔧 Mudanças Técnicas

### Backend

**Remover:**
- ❌ `sqlite3` package
- ❌ `backend/src/database/connection.ts`
- ❌ `backend/src/database/init.ts`
- ❌ `backend/src/database/schema.sql`
- ❌ JWT manual (`jsonwebtoken`)
- ❌ Bcrypt manual

**Adicionar:**
- ✅ `@supabase/supabase-js`
- ✅ `backend/src/lib/supabase.ts` (client)
- ✅ Middleware de autenticação Supabase

**Modificar:**
- 🔄 Todos os models (usar Supabase client)
- 🔄 Rotas de autenticação (usar Supabase Auth)
- 🔄 Middleware de autenticação

### Frontend

**Adicionar:**
- ✅ `@supabase/supabase-js`
- ✅ `frontend/src/lib/supabase.ts` (client)
- ✅ Context de autenticação
- ✅ Página de perfil

**Modificar:**
- 🔄 `services/api.ts` (usar Supabase Auth)
- 🔄 Login/Registro (usar Supabase Auth)
- 🔄 ProtectedRoute (verificar sessão Supabase)

---

## 📊 Schema PostgreSQL

### Tabela: users (gerenciada pelo Supabase Auth)
```sql
-- Supabase cria automaticamente
-- Campos: id (uuid), email, encrypted_password, created_at, etc.
```

### Tabela: user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Tabela: business
```sql
CREATE TABLE business (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  google_review_link TEXT NOT NULL,
  default_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE business ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business"
  ON business FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
  ON business FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON business FOR UPDATE
  USING (auth.uid() = user_id);
```

### Tabela: clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  satisfied BOOLEAN NOT NULL DEFAULT false,
  complained BOOLEAN NOT NULL DEFAULT false,
  review_status TEXT NOT NULL DEFAULT 'NOT_SENT' CHECK(review_status IN ('NOT_SENT', 'SENT', 'REVIEWED_MANUAL')),
  sent_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  attendance_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- Índices
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_review_status ON clients(review_status);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🔐 Autenticação

### Antes (JWT Manual)
```typescript
// Backend gera JWT
const token = jwt.sign({ userId }, JWT_SECRET);

// Frontend envia token
headers: { Authorization: `Bearer ${token}` }
```

### Depois (Supabase Auth)
```typescript
// Backend verifica sessão
const { data: { user } } = await supabase.auth.getUser(token);

// Frontend usa sessão automática
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});
```

---

## 📦 Dependências

### Backend
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

**Remover:**
- `sqlite3`
- `jsonwebtoken`
- `bcryptjs`

### Frontend
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2"
  }
}
```

---

## 🌍 Variáveis de Ambiente

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui

# App
PORT=3000
NODE_ENV=development
```

### Frontend (.env)
```env
# Supabase (chaves públicas)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

---

## 🎯 Ordem de Implementação

### Dia 1: Setup e Schema
1. Criar projeto Supabase
2. Configurar schema PostgreSQL
3. Configurar RLS
4. Testar conexão

### Dia 2: Backend
1. Instalar Supabase client
2. Migrar models
3. Atualizar rotas
4. Testar APIs

### Dia 3: Frontend
1. Instalar Supabase client
2. Implementar autenticação
3. Atualizar componentes
4. Testar fluxos

### Dia 4: Funcionalidades
1. Perfil de usuário
2. Upload de foto
3. Botão reenviar
4. Testes

### Dia 5: Deploy e Validação
1. Migrar dados
2. Deploy produção
3. Testes finais
4. Documentação

---

## ✅ Benefícios Imediatos

Após migração:
- ✅ Dados nunca mais somem
- ✅ Backup automático (point-in-time recovery)
- ✅ Perfil de usuário completo
- ✅ Upload de fotos
- ✅ Autenticação robusta
- ✅ Escalável
- ✅ Grátis (até 500MB)

---

## 🚀 Próximo Passo

**Vou começar agora!**

1. Criar guia de setup do Supabase
2. Converter schema
3. Implementar backend
4. Implementar frontend
5. Testar e deploy

**Preparado para começar?** 🎉
