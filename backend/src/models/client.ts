import { dbGet, dbAll, dbRun } from '../database/connection';

export type ClientStatus = 'apto' | 'bloqueado' | 'solicitado';

export interface Client {
  id: number;
  userId: number;
  name: string | null;
  phone: string;
  satisfied: boolean;
  complained: boolean;
  status: ClientStatus;
  attendanceDate: string;
  requestDate: string | null;
  createdAt: string;
}

export interface ClientInput {
  name?: string;
  phone: string;
  satisfied: boolean;
  complained: boolean;
}

/**
 * Calcula status do cliente baseado nas regras de negócio
 */
export function calculateClientStatus(complained: boolean, requestDate: string | null): ClientStatus {
  if (complained) {
    return 'bloqueado';
  }
  if (requestDate) {
    return 'solicitado';
  }
  return 'apto';
}

/**
 * Busca todos os clientes de um usuário
 */
export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const clients = await dbAll(
    `SELECT 
      id, user_id as userId, name, phone, 
      satisfied, complained, status,
      attendance_date as attendanceDate, 
      request_date as requestDate, 
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
      satisfied, complained, status,
      attendance_date as attendanceDate, 
      request_date as requestDate, 
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
  const status = calculateClientStatus(data.complained, null);
  const attendanceDate = new Date().toISOString();

  const result = await dbRun(
    `INSERT INTO clients 
      (user_id, name, phone, satisfied, complained, status, attendance_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.name || null,
      data.phone,
      data.satisfied ? 1 : 0,
      data.complained ? 1 : 0,
      status,
      attendanceDate
    ]
  );

  const clientId = result.lastID;

  const client = await dbGet(
    `SELECT 
      id, user_id as userId, name, phone, 
      satisfied, complained, status,
      attendance_date as attendanceDate, 
      request_date as requestDate, 
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
 * Atualiza status do cliente para "solicitado" e registra data
 */
export async function markClientAsRequested(clientId: number, userId: number): Promise<Client> {
  const requestDate = new Date().toISOString();

  await dbRun(
    `UPDATE clients 
    SET status = 'solicitado', request_date = ? 
    WHERE id = ? AND user_id = ?`,
    [requestDate, clientId, userId]
  );

  const client = await getClientById(clientId, userId);
  
  if (!client) {
    throw new Error('Cliente não encontrado após atualização');
  }

  return client;
}
