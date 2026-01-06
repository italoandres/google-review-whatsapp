import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwt';

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido e adiciona user ao request
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
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

    // Verificar token
    const payload = verifyToken(token);
    
    // Adicionar user ao request
    req.user = payload;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'UNAUTHORIZED', 
      message: 'Token inválido ou expirado' 
    });
  }
}
