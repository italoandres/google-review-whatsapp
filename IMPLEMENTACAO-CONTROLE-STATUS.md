# 🎯 Implementação: Controle de Status e Métricas

## Contexto

Sistema atual usa 3 status: `apto`, `bloqueado`, `solicitado`
- ✅ Já impede reenvio (verifica status antes de enviar)
- ❌ Não tem status "avaliado" (marcação manual)
- ❌ Não tem métricas de envios/avaliações
- ❌ Não valida telefone duplicado

## Objetivo

Implementar controle robusto de status por telefone com:
1. Novo status: `REVIEWED_MANUAL` (avaliado manualmente)
2. Bloqueio de telefone duplicado
3. Botão "Marcar como avaliado" na UI
4. Dashboard com métricas semanais/mensais

## Mudanças no Banco de Dados

### 1. Alterar Schema (schema.sql)

**ANTES:**
```sql
status TEXT NOT NULL CHECK(status IN ('apto', 'bloqueado', 'solicitado'))
```

**DEPOIS:**
```sql
review_status TEXT NOT NULL CHECK(review_status IN ('NOT_SENT', 'SENT', 'REVIEWED_MANUAL')),
sent_at DATETIME,
reviewed_at DATETIME,
```

**Campos adicionais:**
- `review_status`: Status de envio/avaliação
- `sent_at`: Timestamp do envio do link
- `reviewed_at`: Timestamp da marcação manual

**Índice para telefone:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_phone ON clients(user_id, phone);
```

### 2. Script de Migração

Criar `backend/src/database/migrations/001_add_review_status.sql`:

```sql
-- Adicionar novos campos
ALTER TABLE clients ADD COLUMN review_status TEXT DEFAULT 'NOT_SENT';
ALTER TABLE clients ADD COLUMN sent_at DATETIME;
ALTER TABLE clients ADD COLUMN reviewed_at DATETIME;

-- Migrar dados existentes
UPDATE clients SET review_status = 'NOT_SENT' WHERE status = 'apto';
UPDATE clients SET review_status = 'SENT', sent_at = request_date WHERE status = 'solicitado';
UPDATE clients SET review_status = 'NOT_SENT' WHERE status = 'bloqueado';

-- Adicionar constraint
-- (SQLite não suporta ALTER TABLE ADD CONSTRAINT, então recriar tabela)

-- Criar índice único para telefone por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_phone ON clients(user_id, phone);
```

## Mudanças no Backend

### 1. Atualizar Types (models/client.ts)

```typescript
export type ReviewStatus = 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';

export interface Client {
  id: number;
  userId: number;
  name: string | null;
  phone: string;
  satisfied: boolean;
  complained: boolean;
  reviewStatus: ReviewStatus;
  sentAt: string | null;
  reviewedAt: string | null;
  attendanceDate: string;
  createdAt: string;
}
```

### 2. Atualizar Funções (models/client.ts)

**Adicionar:**
```typescript
/**
 * Verifica se telefone já existe para o usuário
 */
export async function checkPhoneExists(userId: number, phone: string): Promise<boolean>

/**
 * Marca cliente como avaliado (manual)
 */
export async function markClientAsReviewed(clientId: number, userId: number): Promise<Client>

/**
 * Busca métricas de envios e avaliações
 */
export async function getMetrics(userId: number, period: 'today' | 'week' | 'month'): Promise<Metrics>
```

### 3. Atualizar Rotas (routes/clients.ts)

**Modificar POST /api/clients:**
- Validar telefone duplicado antes de criar

**Modificar POST /api/clients/:id/request-review:**
- Atualizar `review_status` para `SENT`
- Registrar `sent_at`

**Adicionar POST /api/clients/:id/mark-reviewed:**
- Validar que status é `SENT`
- Atualizar para `REVIEWED_MANUAL`
- Registrar `reviewed_at`

**Adicionar GET /api/clients/metrics:**
- Retornar métricas de envios e avaliações

## Mudanças no Frontend

### 1. Atualizar Types (types.ts)

```typescript
export type ReviewStatus = 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';

export interface Client {
  id: number;
  userId: number;
  name: string | null;
  phone: string;
  satisfied: boolean;
  complained: boolean;
  reviewStatus: ReviewStatus;
  sentAt: string | null;
  reviewedAt: string | null;
  attendanceDate: string;
  createdAt: string;
}

export interface Metrics {
  sentToday: number;
  sentWeek: number;
  sentMonth: number;
  reviewedWeek: number;
  reviewedMonth: number;
}
```

### 2. Atualizar API (services/api.ts)

```typescript
export const clientsApi = {
  // ... métodos existentes
  
  markAsReviewed: async (id: number): Promise<Client> => {
    const response = await api.post<Client>(`/clients/${id}/mark-reviewed`);
    return response.data;
  },
  
  getMetrics: async (): Promise<Metrics> => {
    const response = await api.get<Metrics>('/clients/metrics');
    return response.data;
  },
};
```

### 3. Atualizar ClientsPage.tsx

**Adicionar:**
- Coluna "Status" com emojis visuais:
  - ⬜ NÃO ENVIADO
  - 🟡 ENVIADO
  - 🟢 AVALIADO
- Botão "✅ Marcar como Avaliado" para status `SENT`
- Modal de confirmação ao marcar como avaliado

**Modificar:**
- Validação de telefone duplicado no formulário
- Mensagem de erro clara se telefone já existe

### 4. Criar DashboardPage.tsx

Novo componente com métricas:

```
📊 MÉTRICAS DE ENVIO (Automático)
├─ Hoje: X links enviados
├─ Esta semana: X links enviados
└─ Este mês: X links enviados

✅ AVALIAÇÕES CONFIRMADAS (Manual)
├─ Esta semana: X clientes avaliaram
└─ Este mês: X clientes avaliaram

⚠️ O sistema não identifica automaticamente avaliações feitas no Google.
```

## Regras de Negócio

### 1. Bloqueio de Reenvio

```typescript
// Antes de enviar link
if (client.reviewStatus === 'SENT' || client.reviewStatus === 'REVIEWED_MANUAL') {
  throw new Error('Este cliente já recebeu o link de avaliação.');
}
```

### 2. Telefone Único por Usuário

```typescript
// Antes de criar cliente
const exists = await checkPhoneExists(userId, phone);
if (exists) {
  throw new Error('Este telefone já está cadastrado.');
}
```

### 3. Marcação Manual de Avaliação

```typescript
// Apenas status SENT pode ser marcado como REVIEWED_MANUAL
if (client.reviewStatus !== 'SENT') {
  throw new Error('Apenas clientes que receberam o link podem ser marcados como avaliados.');
}
```

## Interface (UX)

### Status Visual

| Status | Emoji | Texto | Cor |
|--------|-------|-------|-----|
| NOT_SENT | ⬜ | Não Enviado | Cinza |
| SENT | 🟡 | Enviado | Amarelo |
| REVIEWED_MANUAL | 🟢 | Avaliado | Verde |

### Botões por Status

| Status | Botão Disponível |
|--------|------------------|
| NOT_SENT | 📱 Pedir Avaliação |
| SENT | ✅ Marcar como Avaliado |
| REVIEWED_MANUAL | - (nenhum) |

### Modal de Confirmação

```
Confirmar Avaliação

Você confirma que este cliente avaliou seu negócio no Google?

⚠️ Esta ação não pode ser desfeita.

[Cancelar] [✅ Sim, Confirmar]
```

## Ordem de Implementação

1. ✅ Criar script de migração do banco
2. ✅ Atualizar schema.sql
3. ✅ Atualizar models/client.ts (types e funções)
4. ✅ Atualizar routes/clients.ts (validações e novas rotas)
5. ✅ Atualizar frontend/types.ts
6. ✅ Atualizar frontend/services/api.ts
7. ✅ Atualizar ClientsPage.tsx (UI e botões)
8. ✅ Criar DashboardPage.tsx (métricas)
9. ✅ Testar fluxo completo
10. ✅ Documentar mudanças

## Testes Manuais

- [ ] Cadastrar cliente novo
- [ ] Tentar cadastrar telefone duplicado (deve bloquear)
- [ ] Enviar link de avaliação (status muda para SENT)
- [ ] Tentar reenviar link (deve bloquear)
- [ ] Marcar como avaliado (status muda para REVIEWED_MANUAL)
- [ ] Verificar métricas no dashboard
- [ ] Verificar timestamps (sent_at, reviewed_at)

## Compatibilidade

**Dados existentes:**
- Script de migração converte status antigos para novos
- `apto` → `NOT_SENT`
- `solicitado` → `SENT` (com sent_at = request_date)
- `bloqueado` → `NOT_SENT` (mantém lógica de complained)

**Campos deprecated:**
- `status` (antigo) → pode ser removido após migração
- `request_date` (antigo) → substituído por `sent_at`

## Documentação

Atualizar:
- README.md (nova funcionalidade de métricas)
- GUIA-RAPIDO.md (como marcar cliente como avaliado)
- Adicionar METRICAS.md (explicação das métricas)
