# 🎯 Guia de Setup do Supabase

## Passo 1: Criar Conta e Projeto

### 1.1 Criar Conta
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub (recomendado) ou email

### 1.2 Criar Novo Projeto
1. Clique em "New Project"
2. Preencha:
   - **Name:** `google-review-whatsapp`
   - **Database Password:** Gere uma senha forte (guarde!)
   - **Region:** `South America (São Paulo)` (mais próximo)
   - **Pricing Plan:** Free
3. Clique em "Create new project"
4. Aguarde 2-3 minutos (criação do banco)

---

## Passo 2: Obter Credenciais

### 2.1 API Keys
1. No painel do projeto, vá em **Settings** (⚙️) → **API**
2. Copie as seguintes chaves:

**Project URL:**
```
https://seu-projeto-id.supabase.co
```

**anon public (chave pública):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**service_role (chave privada - NUNCA exponha!):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Salvar Credenciais

**Backend (.env):**
```env
SUPABASE_URL=https://seu-projeto-id.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key-aqui
PORT=3000
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-public-key-aqui
```

---

## Passo 3: Criar Schema do Banco

### 3.1 Acessar SQL Editor
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "+ New query"

### 3.2 Executar Script SQL

Cole e execute este script:

```sql
-- ============================================
-- SCHEMA: Sistema de Avaliações Google
-- ============================================

-- 1. Tabela de Perfis de Usuário
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Configurações do Negócio
CREATE TABLE business (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  google_review_link TEXT NOT NULL,
  default_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Tabela de Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  satisfied BOOLEAN NOT NULL DEFAULT false,
  complained BOOLEAN NOT NULL DEFAULT false,
  review_status TEXT NOT NULL DEFAULT 'NOT_SENT' 
    CHECK(review_status IN ('NOT_SENT', 'SENT', 'REVIEWED_MANUAL')),
  sent_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  attendance_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_business_user_id ON business(user_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_review_status ON clients(review_status);
CREATE INDEX idx_clients_phone ON clients(phone);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para business
CREATE POLICY "Users can view own business"
  ON business FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
  ON business FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON business FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para clients
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

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para business
CREATE TRIGGER update_business_updated_at
  BEFORE UPDATE ON business
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS (Documentação)
-- ============================================

COMMENT ON TABLE user_profiles IS 'Perfis estendidos dos usuários';
COMMENT ON TABLE business IS 'Configurações do negócio de cada usuário';
COMMENT ON TABLE clients IS 'Clientes cadastrados para receber solicitação de avaliação';

COMMENT ON COLUMN clients.review_status IS 'Status: NOT_SENT (não enviado), SENT (enviado), REVIEWED_MANUAL (avaliado manualmente)';
COMMENT ON COLUMN clients.sent_at IS 'Data/hora do envio do link de avaliação';
COMMENT ON COLUMN clients.reviewed_at IS 'Data/hora da marcação manual como avaliado';
```

3. Clique em "Run" (ou Ctrl+Enter)
4. Verifique se aparece "Success. No rows returned"

---

## Passo 4: Configurar Storage (Fotos de Perfil)

### 4.1 Criar Bucket
1. Vá em **Storage** no menu lateral
2. Clique em "Create a new bucket"
3. Preencha:
   - **Name:** `avatars`
   - **Public bucket:** ✅ Marcar (fotos públicas)
4. Clique em "Create bucket"

### 4.2 Configurar Políticas de Storage

1. Clique no bucket `avatars`
2. Vá em "Policies"
3. Clique em "New policy"
4. Cole este código:

```sql
-- Permitir upload de avatares (apenas próprio usuário)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir atualização de avatares (apenas próprio usuário)
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir leitura pública de avatares
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

---

## Passo 5: Configurar Autenticação

### 5.1 Configurações de Email
1. Vá em **Authentication** → **Settings**
2. Em "Email Auth", verifique:
   - ✅ Enable Email provider
   - ✅ Confirm email (desmarque para desenvolvimento)

### 5.2 Configurar URL do Site
1. Em **Authentication** → **URL Configuration**
2. Adicione:
   - **Site URL:** `http://localhost:5173` (desenvolvimento)
   - **Redirect URLs:** 
     - `http://localhost:5173/**`
     - `https://seu-site.netlify.app/**` (produção)

---

## Passo 6: Testar Conexão

### 6.1 Testar no SQL Editor

Execute este teste:

```sql
-- Criar usuário de teste (via SQL - apenas para teste)
-- Em produção, use Supabase Auth

SELECT * FROM user_profiles;
SELECT * FROM business;
SELECT * FROM clients;
```

Deve retornar tabelas vazias (sem erro).

---

## Passo 7: Verificar Setup

### Checklist Final

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas (URL + keys)
- [ ] Schema SQL executado com sucesso
- [ ] Bucket `avatars` criado
- [ ] Políticas de storage configuradas
- [ ] Autenticação configurada
- [ ] Teste de conexão OK

---

## 🎉 Pronto!

Seu Supabase está configurado e pronto para uso!

**Próximos passos:**
1. Instalar dependências no projeto
2. Configurar Supabase client
3. Migrar código do backend
4. Migrar código do frontend
5. Testar localmente
6. Deploy em produção

---

## 📝 Notas Importantes

### Segurança
- ✅ **anon key** é pública (pode expor no frontend)
- ❌ **service_role key** é privada (NUNCA exponha!)
- ✅ RLS protege os dados automaticamente
- ✅ Cada usuário só vê seus próprios dados

### Limites do Plano Gratuito
- 500 MB de banco de dados
- 1 GB de armazenamento de arquivos
- 2 GB de bandwidth
- 50.000 usuários ativos mensais
- Backup automático (7 dias)

### Monitoramento
- Vá em **Database** → **Usage** para ver uso
- Vá em **Auth** → **Users** para ver usuários
- Vá em **Storage** → **Usage** para ver arquivos

---

## 🆘 Problemas Comuns

### "relation does not exist"
- Execute o script SQL novamente
- Verifique se está no projeto correto

### "RLS policy violation"
- Verifique se as políticas foram criadas
- Teste com usuário autenticado

### "Invalid API key"
- Verifique se copiou as chaves corretas
- Verifique se não tem espaços extras

---

**Tudo configurado? Vamos para a implementação!** 🚀
