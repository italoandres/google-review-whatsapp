/**
 * Valida mensagem padrão de avaliação
 */
export function validateMessage(message: string): { valid: boolean; error?: string; warning?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Mensagem é obrigatória' };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return { valid: false, error: 'Mensagem não pode estar vazia' };
  }

  if (trimmedMessage.length < 10) {
    return { valid: false, error: 'Mensagem muito curta (mínimo 10 caracteres)' };
  }

  if (trimmedMessage.length > 1000) {
    return { valid: false, error: 'Mensagem muito longa (máximo 1000 caracteres)' };
  }

  // Verificar se contém a variável {{link_google}}
  if (!trimmedMessage.includes('{{link_google}}')) {
    return { 
      valid: true, 
      warning: 'Atenção: A mensagem não contém a variável {{link_google}}. O link de avaliação não será incluído.' 
    };
  }

  return { valid: true };
}

/**
 * Substitui a variável {{link_google}} pelo link real
 */
export function replaceGoogleLink(message: string, googleLink: string): string {
  return message.replace(/\{\{link_google\}\}/g, googleLink);
}
