import { supabase } from '../lib/supabase';

export type ReviewStatus = 'NOT_SENT' | 'SENT' | 'REVIEWED_MANUAL';

export interface Client {
  id: string;
  userId: string;
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
 * Mapeia dados do banco para interface Client
 */
function mapClientFromDB(data: any): Client {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    phone: data.phone,
    satisfied: data.satisfied,
    complained: data.complained,
    reviewStatus: data.review_status,
    sentAt: data.sent_at,
    reviewedAt: data.reviewed_at,
    attendanceDate: data.attendance_date,
    createdAt: data.created_at
  };
}

/**
 * Verifica se telefone já existe para o usuário
 */
export async function checkPhoneExists(userId: string, phone: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return false;
    }
    console.error('Erro ao verificar telefone:', error);
    return false;
  }

  return !!data;
}

/**
 * Busca todos os clientes de um usuário
 */
export async function getClientsByUserId(userId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar clientes:', error);
    throw new Error('Erro ao buscar clientes');
  }

  return data.map(mapClientFromDB);
}

/**
 * Busca cliente por ID
 */
export async function getClientById(clientId: string, userId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return null;
    }
    console.error('Erro ao buscar cliente:', error);
    throw new Error('Erro ao buscar cliente');
  }

  return mapClientFromDB(data);
}

/**
 * Cria novo cliente
 */
export async function createClient(userId: string, input: ClientInput): Promise<Client> {
  const reviewStatus = calculateInitialReviewStatus(input.complained);

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: input.name || null,
      phone: input.phone,
      satisfied: input.satisfied,
      complained: input.complained,
      review_status: reviewStatus,
      attendance_date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar cliente:', error);
    
    // Tratar erro de telefone duplicado
    if (error.code === '23505') {
      throw new Error('Este telefone já está cadastrado');
    }
    
    throw new Error('Erro ao criar cliente');
  }

  return mapClientFromDB(data);
}

/**
 * Atualiza status do cliente para "SENT" e registra data de envio
 */
export async function markClientAsSent(clientId: string, userId: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      review_status: 'SENT',
      sent_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao marcar cliente como enviado:', error);
    throw new Error('Erro ao atualizar cliente');
  }

  return mapClientFromDB(data);
}

/**
 * Marca cliente como avaliado manualmente
 */
export async function markClientAsReviewed(clientId: string, userId: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      review_status: 'REVIEWED_MANUAL',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao marcar cliente como avaliado:', error);
    throw new Error('Erro ao atualizar cliente');
  }

  return mapClientFromDB(data);
}

/**
 * Busca métricas de envios e avaliações
 */
export async function getMetrics(userId: string): Promise<Metrics> {
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
  const { count: sentToday } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('review_status', ['SENT', 'REVIEWED_MANUAL'])
    .gte('sent_at', startOfToday);

  // Envios esta semana
  const { count: sentWeek } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('review_status', ['SENT', 'REVIEWED_MANUAL'])
    .gte('sent_at', startOfWeekISO);

  // Envios este mês
  const { count: sentMonth } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('review_status', ['SENT', 'REVIEWED_MANUAL'])
    .gte('sent_at', startOfMonth);

  // Avaliações confirmadas esta semana
  const { count: reviewedWeek } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('review_status', 'REVIEWED_MANUAL')
    .gte('reviewed_at', startOfWeekISO);

  // Avaliações confirmadas este mês
  const { count: reviewedMonth } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('review_status', 'REVIEWED_MANUAL')
    .gte('reviewed_at', startOfMonth);

  return {
    sentToday: sentToday || 0,
    sentWeek: sentWeek || 0,
    sentMonth: sentMonth || 0,
    reviewedWeek: reviewedWeek || 0,
    reviewedMonth: reviewedMonth || 0,
  };
}
