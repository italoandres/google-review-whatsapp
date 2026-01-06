/**
 * Valida campos obrigatórios
 */
export function validateRequired(
  fields: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of requiredFields) {
    const value = fields[field];
    
    if (value === undefined || value === null) {
      errors[field] = `Campo ${field} é obrigatório`;
      continue;
    }

    // Se for string, verificar se não está vazia
    if (typeof value === 'string' && value.trim().length === 0) {
      errors[field] = `Campo ${field} não pode estar vazio`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Valida email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email não pode estar vazio' };
  }

  // Regex simples para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  return { valid: true };
}
