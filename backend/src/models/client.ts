import { dbGet, dbAll, dbRun } from '../database/connection';

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

export interface ClientInput {
  name?: string;
  phone: string;
  satisfied: boolean;
  complained: boolean;
}

export interface Metrics {
  sentToday: number;
  sentWeek: number;
  sentMonth: number;
  reviewedWeek: number;
  reviewedMonth: number;
}

/**
 * Calcula status inicial do cliente baseado nas regras de negócio
 */
export function calculateInitialReviewStatus(complained: boolean): ReviewStatus {
  // Clientes que reclamaram começam como NOT_SENT (bloqueados de receber link)
  // Clientes satisfeitos começam como NOT_SENT (aptos para receber link)
  return 'NOT_SENT';
}

/**
 * Verifica se telefone já existe para o usuário
 */
export async function checkPhoneExists(userId: number, phone: string): Promise<boolean> {
  const result = await dbGet(
    `SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND phone = ?`,
    [userId, phone]
  ) as { count: number };

  return result.count > 0;
}

/**
 * Busca todos os clientes de um usuário
 */
export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const clients = await dbAll(
    `SELECT 
      id, user_id as userId, name, phone, 
      satisfied, complained, review_status as reviewStatus,
      sent_at as sentAt, reviewed_at as reviewedAt,
      attendance_date as attendanceDate, 
      created_at as createdAt
    FROM clients 
    WHERE user_id = ?
    ORDER BY created_at DESC`,
    [userId]
  ) as any[];

  // Converter booleanos do SQLite (0/1) para JavaScript (true/false)
  return clients.map(client => ({
    ...client,
    satisfied: Boolean(client.satisfied),
    complained: Boolean(client.complained)
  }));
}

/**
 * Busca cliente por ID
 */
export async function getClientById(clientId: number, userId: number): Promise<Client | null> {
  const client = await dbGet(
    `SELECT 
      id, user_id as userId, name, phone, 
      satisfied, complained, review_status as reviewStatus,
      sent_at as sentAt, reviewed_at as reviewedAt,
      attendance_date as attendanceDate, 
      created_at as createdAt
    FROM clients 
    WHERE id = ? AND user_id = ?`,
    [clientId, userId]
  ) as any;

  if (!client) {
    return null;
  }

  // Converter booleanos do SQLite (0/1) para JavaScript (true/false)
  return {
    ...client,
    satisfied: Boolean(client.satisfied),
    complained: Boolean(client.complained)
  };
}

/**
 * Cria novo cliente
 */
export async function createClient(userId: number, data: ClientInput): Promise<Client> {
  const reviewStatus = calculateInitialReviewStatus(data.complained);
  const attendanceDate = new Date().toISOString();

  const result = await dbRun(
    `INSERT INTO clients 
      (user_id, name, phone, satisfied, complained, review_status, attendance_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.name || null,
      data.phone,
      data.satisfied ? 1 : 0,
      data.complained ? 1 : 0,
      reviewStatus,
      attendanceDate
    ]
  );

  const clientId = result.lastID;

  const client = await dbGet(
    `SELECT 
      id, user_id as userId, name, phone, 
      satisfied, complained, review_status as reviewStatus,
      sent_at as sentAt, reviewed_at as reviewedAt,
      attendance_date as attendanceDate, 
      created_at as createdAt
    FROM clients 
    WHERE id = ?`,
    [clientId]
  ) as any;

  // Converter booleanos do SQLite (0/1) para JavaScript (true/false)
  return {
    ...client,
    satisfied: Boolean(client.satisfied),
    complained: Boolean(client.complained)
  };
}

/**
 * Atualiza status do cliente para "SENT" e registra data de envio
 */
export async function markClientAsSent(clientId: number, userId: number): Promise<Client> {
  const sentAt = new Date().toISOString();

  await dbRun(
    `UPDATE clients 
    SET review_status = 'SENT', sent_at = ? 
    WHERE id = ? AND user_id = ?`,
    [sentAt, clientId, userId]
  );

  const client = await getClientById(clientId, userId);
  
  if (!client) {
    throw new Error('Cliente não encontrado após atualização');
  }

  return client;
}

/**
 * Marca cliente como avaliado manualmente
 */
export async function markClientAsReviewed(clientId: number, userId: number): Promise<Client> {
  const reviewedAt = new Date().toISOString();

  await dbRun(
    `UPDATE clients 
    SET review_status = 'REVIEWED_MANUAL', reviewed_at = ? 
    WHERE id = ? AND user_id = ?`,
    [reviewedAt, clientId, userId]
  );

  const client = await getClientById(clientId, userId);
  
  if (!client) {
    throw new Error('Cliente não encontrado após atualização');
  }

  return client;
}

/**
 * Busca métricas de envios e avaliações
 */
export async function getMetrics(userId: number): Promise<Metrics> {
  const now = new Date();
  
  // Início do dia (hoje às 00:00)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  
  // Início da semana (domingo às 00:00)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekISO = startOfWeek.toISOString();
  
  // Início do mês (dia 1 às 00:00)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Envios hoje
  const sentTodayResult = await dbGet(
    `SELECT COUNT(*) as count FROM clients 
     WHERE user_id = ? AND review_status IN ('SENT', 'REVIEWED_MANUAL') 
     AND sent_at >= ?`,
    [userId, startOfToday]
  ) as { count: number };

  // Envios esta semana
  const sentWeekResult = await dbGet(
    `SELECT COUNT(*) as count FROM clients 
     WHERE user_id = ? AND review_status IN ('SENT', 'REVIEWED_MANUAL') 
     AND sent_at >= ?`,
    [userId, startOfWeekISO]
  ) as { count: number };

  // Envios este mês
  const sentMonthResult = await dbGet(
    `SELECT COUNT(*) as count FROM clients 
     WHERE user_id = ? AND review_status IN ('SENT', 'REVIEWED_MANUAL') 
     AND sent_at >= ?`,
    [userId, startOfMonth]
  ) as { count: number };

  // Avaliações confirmadas esta semana
  const reviewedWeekResult = await dbGet(
    `SELECT COUNT(*) as count FROM clients 
     WHERE user_id = ? AND review_status = 'REVIEWED_MANUAL' 
     AND reviewed_at >= ?`,
    [userId, startOfWeekISO]
  ) as { count: number };

  // Avaliações confirmadas este mês
  const reviewedMonthResult = await dbGet(
    `SELECT COUNT(*) as count FROM clients 
     WHERE user_id = ? AND review_status = 'REVIEWED_MANUAL' 
     AND reviewed_at >= ?`,
    [userId, startOfMonth]
  ) as { count: number };

  return {
    sentToday: sentTodayResult.count,
    sentWeek: sentWeekResult.count,
    sentMonth: sentMonthResult.count,
    reviewedWeek: reviewedWeekResult.count,
    reviewedMonth: reviewedMonthResult.count,
  };
}
