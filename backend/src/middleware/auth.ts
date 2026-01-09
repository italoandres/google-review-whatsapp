import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware de autenticação usando Supabase
 * Verifica se o token JWT do Supabase é válido e adiciona user ao request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Token de autenticação não fornecido' 
      });
      return;
    }

    // Formato esperado: "Bearer <token>"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Formato de token inválido. Use: Bearer <token>' 
      });
      return;
    }

    const token = parts[1];

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ 
        error: 'UNAUTHORIZED', 
        message: 'Token inválido ou expirado' 
      });
      return;
    }

    // Adicionar user ao request
    req.user = {
      userId: user.id,
      email: user.email!
    };
    
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(401).json({ 
      error: 'UNAUTHORIZED', 
      message: 'Erro ao verificar autenticação' 
    });
  }
}
