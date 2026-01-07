# 🔄 Guia de Migração do Banco de Dados

## Contexto

O sistema foi atualizado com um novo controle de status. Se você já tem dados no banco, precisa executar a migração.

## ⚠️ IMPORTANTE

**SEMPRE faça backup antes de migrar!**

## Para Desenvolvimento Local (Windows)

### Opção 1: Recriar Banco (Recomendado para Testes)

Se você está testando e não tem dados importantes:

```cmd
cd backend
del database\app.db
npm run dev
```

O banco será recriado automaticamente com a nova estrutura.

### Opção 2: Migrar Dados Existentes

Se você tem dados que quer manter:

1. **Fazer backup:**
   ```cmd
   cd backend
   copy database\app.db database\app.db.backup
   ```

2. **Executar migração:**
   ```cmd
   sqlite3 database\app.db < src\database\migrate-to-review-status.sql
   ```

3. **Se não tiver sqlite3 instalado:**
   - Baixe: https://www.sqlite.org/download.html
   - Ou use DB Browser for SQLite: https://sqlitebrowser.org/

4. **Usando DB Browser for SQLite:**
   - Abra `backend/database/app.db`
   - Vá em "Execute SQL"
   - Cole o conteúdo de `backend/src/database/migrate-to-review-status.sql`
   - Clique em "Execute"

## Para Produção (Render)

### 1. Fazer Backup

Antes de qualquer coisa, faça backup do banco:

```bash
# Conectar via SSH ao Render (se disponível)
# Ou baixar o arquivo app.db via SFTP

cp database/app.db database/app.db.backup
```

### 2. Executar Migração

```bash
sqlite3 database/app.db < src/database/migrate-to-review-status.sql
```

### 3. Reiniciar Aplicação

No painel do Render:
1. Vá em "Manual Deploy"
2. Clique em "Deploy latest commit"

## Verificar Migração

Após migrar, verifique se funcionou:

### 1. Verificar Estrutura

```sql
-- Abrir banco
sqlite3 database/app.db

-- Ver estrutura da tabela clients
.schema clients

-- Deve mostrar:
-- review_status TEXT NOT NULL DEFAULT 'NOT_SENT'
-- sent_at DATETIME
-- reviewed_at DATETIME
```

### 2. Verificar Dados

```sql
-- Ver alguns clientes
SELECT id, phone, review_status, sent_at, reviewed_at FROM clients LIMIT 5;

-- Contar por status
SELECT review_status, COUNT(*) FROM clients GROUP BY review_status;
```

### 3. Testar no Frontend

1. Abrir aplicação
2. Ir em "Clientes"
3. Verificar se status aparecem corretamente:
   - ⬜ Não Enviado
   - 🟡 Enviado
   - 🟢 Avaliado
4. Ir em "Dashboard"
5. Verificar se métricas aparecem

## Conversão de Status

A migração converte automaticamente:

| Status Antigo | Status Novo | Observação |
|---------------|-------------|------------|
| `apto` | `NOT_SENT` | Cliente pode receber link |
| `solicitado` | `SENT` | Copia `request_date` para `sent_at` |
| `bloqueado` | `NOT_SENT` | Mantém lógica de `complained` |

## Rollback (Reverter Migração)

Se algo der errado:

```cmd
cd backend
del database\app.db
copy database\app.db.backup database\app.db
```

## Problemas Comuns

### Erro: "duplicate column name"

Significa que a migração já foi executada. Não precisa executar novamente.

### Erro: "no such table: clients"

O banco não foi inicializado. Execute:

```cmd
npm run dev
```

### Erro: "UNIQUE constraint failed"

Você tem telefones duplicados no banco. Antes de migrar, limpe duplicados:

```sql
-- Ver duplicados
SELECT phone, COUNT(*) FROM clients GROUP BY phone HAVING COUNT(*) > 1;

-- Remover duplicados (mantenha apenas o mais recente)
DELETE FROM clients WHERE id NOT IN (
  SELECT MAX(id) FROM clients GROUP BY phone
);
```

## Suporte

Se tiver problemas:

1. Verifique os logs do backend
2. Verifique se o backup foi feito
3. Tente recriar o banco (se não tiver dados importantes)
4. Consulte `IMPLEMENTADO-CONTROLE-STATUS.md` para detalhes técnicos
