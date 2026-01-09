# 📋 Como Criar Tabelas no Supabase

## Passo a Passo

### 1. Acessar o Supabase
- Abra: https://cuychbunipzwfaitnbor.supabase.co
- Faça login com sua conta

### 2. Abrir SQL Editor
- No menu lateral esquerdo, clique em **"SQL Editor"**
- Clique em **"New query"**

### 3. Copiar e Colar o SQL
- Abra o arquivo `supabase-schema.sql` na raiz do projeto
- Copie TODO o conteúdo
- Cole no editor SQL do Supabase

### 4. Executar o SQL
- Clique no botão **"Run"** (ou pressione Ctrl+Enter)
- Aguarde a execução (deve levar alguns segundos)
- Você verá uma mensagem de sucesso

### 5. Verificar Tabelas Criadas
- No menu lateral, clique em **"Table Editor"**
- Você deve ver 3 tabelas:
  - `user_profiles`
  - `business`
  - `clients`

### 6. Configurar Autenticação (Opcional para Desenvolvimento)
- No menu lateral, clique em **"Authentication"**
- Clique em **"Settings"**
- Role até **"Email Auth"**
- **Desabilite** "Enable email confirmations" (temporariamente)
- Isso permite criar contas sem confirmar email

---

## ✅ Pronto!

Agora você pode testar o sistema localmente:

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

1. Crie uma nova conta
2. Faça login
3. Configure seu negócio
4. Cadastre um cliente
5. Vá no Supabase → Table Editor → clients
6. Você deve ver o cliente cadastrado!

---

## ⚠️ Problemas Comuns

### Erro: "relation does not exist"
- As tabelas não foram criadas
- Execute o SQL novamente

### Erro: "permission denied"
- RLS está bloqueando
- Verifique se as políticas foram criadas

### Erro: "duplicate key value"
- Você está tentando criar algo que já existe
- Limpe as tabelas e tente novamente

---

## 🗑️ Limpar Dados (se necessário)

Se precisar recomeçar do zero:

```sql
-- Deletar todas as tabelas
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS business CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Depois execute o supabase-schema.sql novamente
```

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Console do navegador (F12)
2. Logs do backend (terminal)
3. Supabase → Logs → API Logs
