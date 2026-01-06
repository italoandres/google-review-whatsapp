import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d'; // Token expira em 7 dias

export interface JwtPayload {
  userId: number;
  email: string;
}

/**
 * Gera token JWT
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}
