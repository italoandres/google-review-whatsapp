/**
 * Valida formato de URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL é obrigatória' };
  }

  // Remover espaços
  const cleanUrl = url.trim();

  // Verificar se começa com http:// ou https://
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return { 
      valid: false, 
      error: 'URL deve começar com http:// ou https://' 
    };
  }

  // Tentar criar objeto URL para validação
  try {
    const urlObj = new URL(cleanUrl);
    
    // Verificar se tem hostname
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return { valid: false, error: 'URL inválida: domínio muito curto' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Formato de URL inválido' };
  }
}

/**
 * Valida se é uma URL do Google Maps/Reviews
 */
export function validateGoogleReviewUrl(url: string): { valid: boolean; error?: string } {
  const urlValidation = validateUrl(url);
  
  if (!urlValidation.valid) {
    return urlValidation;
  }

  const cleanUrl = url.trim().toLowerCase();
  
  // Verificar se é uma URL do Google
  if (!cleanUrl.includes('google.com') && !cleanUrl.includes('g.page')) {
    return { 
      valid: false, 
      error: 'URL deve ser do Google (google.com ou g.page)' 
    };
  }

  return { valid: true };
}
