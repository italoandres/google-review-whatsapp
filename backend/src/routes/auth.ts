import { Router, Request, Response } from 'express';
import { dbGet, dbRun } from '../database/connection';
import { hashPassword, comparePassword } from '../auth/hash';
import { generateToken } from '../auth/jwt';
import { validateEmail, validateRequired } from '../validators/required';

const router = Router();

/**
 * POST /api/auth/register
 * Registra novo usuário
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar campos obrigatórios
    const requiredValidation = validateRequired({ email, password }, ['email', 'password']);
    if (!requiredValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: requiredValidation.errors
      });
      return;
    }

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: emailValidation.error
      });
      return;
    }

    // Validar senha
    if (password.length < 6) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Senha deve ter no mínimo 6 caracteres'
      });
      return;
    }

    // Verificar se email já existe
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      res.status(400).json({
        error: 'EMAIL_EXISTS',
        message: 'Email já cadastrado'
      });
      return;
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Inserir usuário
    const result = await dbRun(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );

    const userId = result.lastID;

    // Gerar token
    const token = generateToken({ userId, email });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao registrar usuário'
    });
  }
});

/**
 * POST /api/auth/login
 * Autentica usuário
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validar campos obrigatórios
    const requiredValidation = validateRequired({ email, password }, ['email', 'password']);
    if (!requiredValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: requiredValidation.errors
      });
      return;
    }

    // Buscar usuário
    const user = await dbGet(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email]
    ) as any;

    if (!user) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou senha inválidos'
      });
      return;
    }

    // Verificar senha
    const passwordMatch = await comparePassword(password, user.password_hash);
    
    if (!passwordMatch) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou senha inválidos'
      });
      return;
    }

    // Gerar token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao fazer login'
    });
  }
});

export default router;
