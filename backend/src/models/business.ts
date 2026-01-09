import { supabase } from '../lib/supabase';

export interface Business {
  id: string;
  userId: string;
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
export async function getBusinessByUserId(userId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('business')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return null;
    }
    console.error('Erro ao buscar business:', error);
    throw new Error('Erro ao buscar configuração do negócio');
  }

  if (!data) {
    return null;
  }

  // Mapear campos do banco para interface
  return {
    id: data.id,
    userId: data.user_id,
    businessName: data.business_name,
    whatsappNumber: data.whatsapp_number,
    googleReviewLink: data.google_review_link,
    defaultMessage: data.default_message,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Cria configuração do negócio
 */
export async function createBusiness(userId: string, input: BusinessInput): Promise<Business> {
  const { data, error } = await supabase
    .from('business')
    .insert({
      user_id: userId,
      business_name: input.businessName,
      whatsapp_number: input.whatsappNumber,
      google_review_link: input.googleReviewLink,
      default_message: input.defaultMessage
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar business:', error);
    throw new Error('Erro ao criar configuração do negócio');
  }

  // Mapear campos do banco para interface
  return {
    id: data.id,
    userId: data.user_id,
    businessName: data.business_name,
    whatsappNumber: data.whatsapp_number,
    googleReviewLink: data.google_review_link,
    defaultMessage: data.default_message,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Atualiza configuração do negócio
 */
export async function updateBusiness(userId: string, input: Partial<BusinessInput>): Promise<Business> {
  const updates: any = {};

  if (input.businessName !== undefined) {
    updates.business_name = input.businessName;
  }
  if (input.whatsappNumber !== undefined) {
    updates.whatsapp_number = input.whatsappNumber;
  }
  if (input.googleReviewLink !== undefined) {
    updates.google_review_link = input.googleReviewLink;
  }
  if (input.defaultMessage !== undefined) {
    updates.default_message = input.defaultMessage;
  }

  const { data, error } = await supabase
    .from('business')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar business:', error);
    throw new Error('Erro ao atualizar configuração do negócio');
  }

  // Mapear campos do banco para interface
  return {
    id: data.id,
    userId: data.user_id,
    businessName: data.business_name,
    whatsappNumber: data.whatsapp_number,
    googleReviewLink: data.google_review_link,
    defaultMessage: data.default_message,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
