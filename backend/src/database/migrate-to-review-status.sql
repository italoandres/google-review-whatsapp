-- Migração: Adicionar controle de status de avaliação
-- Este script migra bancos de dados existentes para o novo sistema de status

-- Passo 1: Adicionar novos campos
ALTER TABLE clients ADD COLUMN review_status TEXT DEFAULT 'NOT_SENT';
ALTER TABLE clients ADD COLUMN sent_at DATETIME;
ALTER TABLE clients ADD COLUMN reviewed_at DATETIME;

-- Passo 2: Migrar dados existentes
-- 'apto' → 'NOT_SENT'
UPDATE clients SET review_status = 'NOT_SENT' WHERE status = 'apto';

-- 'solicitado' → 'SENT' (copiar request_date para sent_at)
UPDATE clients SET review_status = 'SENT', sent_at = request_date WHERE status = 'solicitado';

-- 'bloqueado' → 'NOT_SENT' (mantém lógica de complained)
UPDATE clients SET review_status = 'NOT_SENT' WHERE status = 'bloqueado';

-- Passo 3: Criar índice único para telefone por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_phone ON clients(user_id, phone);

-- Passo 4: Criar índice para review_status
CREATE INDEX IF NOT EXISTS idx_clients_review_status ON clients(review_status);

-- Passo 5: Remover índice antigo (opcional)
DROP INDEX IF EXISTS idx_clients_status;

-- NOTA: Os campos 'status' e 'request_date' podem ser removidos manualmente após validação
-- Para remover, seria necessário recriar a tabela (SQLite não suporta DROP COLUMN diretamente)
