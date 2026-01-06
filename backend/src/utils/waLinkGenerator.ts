import { replaceGoogleLink } from '../validators/message';

/**
 * Codifica mensagem para URL (formato wa.me)
 */
export function encodeMessageForUrl(message: string): string {
  return encodeURIComponent(message);
}

/**
 * Gera link wa.me completo
 * @param phone - Número de telefone no formato internacional (ex: 5511999999999)
 * @param message - Mensagem a ser enviada
 * @returns URL do WhatsApp no formato wa.me
 */
export function generateWaLink(phone: string, message: string): string {
  // Remover caracteres não numéricos do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Codificar mensagem para URL
  const encodedMessage = encodeMessageForUrl(message);
  
  // Gerar link wa.me
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Gera link wa.me com substituição da variável {{link_google}}
 * @param phone - Número de telefone do cliente
 * @param defaultMessage - Mensagem padrão com variável {{link_google}}
 * @param googleReviewLink - Link de avaliação do Google
 * @returns URL do WhatsApp com mensagem personalizada
 */
export function generateReviewRequestLink(
  phone: string,
  defaultMessage: string,
  googleReviewLink: string
): string {
  // Substituir variável {{link_google}} pelo link real
  const personalizedMessage = replaceGoogleLink(defaultMessage, googleReviewLink);
  
  // Gerar link wa.me
  return generateWaLink(phone, personalizedMessage);
}
