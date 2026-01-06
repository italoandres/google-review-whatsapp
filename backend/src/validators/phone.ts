/**
 * Valida formato de telefone brasileiro com DDI + DDD + número
 * Formato esperado: 5511999999999 (DDI 55 + DDD 11 + número 999999999)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Telefone é obrigatório' };
  }

  // Remover espaços e caracteres especiais
  const cleanPhone = phone.replace(/\D/g, '');

  // Verificar se começa com 55 (DDI Brasil)
  if (!cleanPhone.startsWith('55')) {
    return { valid: false, error: 'Telefone deve começar com DDI 55 (Brasil)' };
  }

  // Verificar tamanho: 55 (2) + DDD (2) + número (8 ou 9 dígitos) = 12 ou 13 dígitos
  if (cleanPhone.length < 12 || cleanPhone.length > 13) {
    return { 
      valid: false, 
      error: 'Formato inválido. Use: 55 + DDD (2 dígitos) + número (8 ou 9 dígitos)' 
    };
  }

  // Extrair DDD (posições 2 e 3)
  const ddd = parseInt(cleanPhone.substring(2, 4));
  
  // Validar DDD (11 a 99)
  if (ddd < 11 || ddd > 99) {
    return { valid: false, error: 'DDD inválido (deve estar entre 11 e 99)' };
  }

  return { valid: true };
}

/**
 * Formata telefone para exibição
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 13) {
    // 55 11 99999-9999
    return `+${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 9)}-${cleanPhone.substring(9)}`;
  } else if (cleanPhone.length === 12) {
    // 55 11 9999-9999
    return `+${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 8)}-${cleanPhone.substring(8)}`;
  }
  
  return phone;
}
