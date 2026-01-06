import { dbGet, dbRun } from '../database/connection';

export interface Business {
  id: number;
  userId: number;
  businessName: string;
  whatsappNumber: string;
  googleReviewLink: string;
  defaultMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInput {
  businessName: string;
  whatsappNumber: string;
  googleReviewLink: string;
  defaultMessage: string;
}

/**
 * Busca configuração do negócio por userId
 */
export async function getBusinessByUserId(userId: number): Promise<Business | null> {
  const business = await dbGet(
    `SELECT 
      id, user_id as userId, business_name as businessName, 
      whatsapp_number as whatsappNumber, google_review_link as googleReviewLink,
      default_message as defaultMessage, created_at as createdAt, updated_at as updatedAt
    FROM business 
    WHERE user_id = ?`,
    [userId]
  ) as Business | undefined;

  return business || null;
}

/**
 * Cria configuração do negócio
 */
export async function createBusiness(userId: number, data: BusinessInput): Promise<Business> {
  const result = await dbRun(
    `INSERT INTO business 
      (user_id, business_name, whatsapp_number, google_review_link, default_message) 
    VALUES (?, ?, ?, ?, ?)`,
    [userId, data.businessName, data.whatsappNumber, data.googleReviewLink, data.defaultMessage]
  );

  const businessId = result.lastID;

  const business = await dbGet(
    `SELECT 
      id, user_id as userId, business_name as businessName, 
      whatsapp_number as whatsappNumber, google_review_link as googleReviewLink,
      default_message as defaultMessage, created_at as createdAt, updated_at as updatedAt
    FROM business 
    WHERE id = ?`,
    [businessId]
  ) as Business;

  return business;
}

/**
 * Atualiza configuração do negócio
 */
export async function updateBusiness(userId: number, data: Partial<BusinessInput>): Promise<Business> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.businessName !== undefined) {
    updates.push('business_name = ?');
    values.push(data.businessName);
  }
  if (data.whatsappNumber !== undefined) {
    updates.push('whatsapp_number = ?');
    values.push(data.whatsappNumber);
  }
  if (data.googleReviewLink !== undefined) {
    updates.push('google_review_link = ?');
    values.push(data.googleReviewLink);
  }
  if (data.defaultMessage !== undefined) {
    updates.push('default_message = ?');
    values.push(data.defaultMessage);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  await dbRun(
    `UPDATE business SET ${updates.join(', ')} WHERE user_id = ?`,
    values
  );

  const business = await getBusinessByUserId(userId);
  
  if (!business) {
    throw new Error('Erro ao atualizar configuração');
  }

  return business;
}
