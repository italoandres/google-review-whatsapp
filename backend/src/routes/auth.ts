import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { validateEmail, validateRequired } from '../validators/required';

const router = Router();

/**
 * POST /api/auth/register
 * Registra novo usuário usando Supabase Auth
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

    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirmar email (desenvolvimento)
    });

    if (error) {
      // Tratar erros específicos do Supabase
      if (error.message.includes('already registered')) {
        res.status(400).json({
          error: 'EMAIL_EXISTS',
          message: 'Email já cadastrado'
        });
        return;
      }

      console.error('Erro do Supabase:', error);
      res.status(400).json({
        error: 'AUTH_ERROR',
        message: error.message
      });
      return;
    }

    if (!data.user) {
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao criar usuário'
      });
      return;
    }

    // Criar perfil do usuário
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        full_name: null,
        avatar_url: null,
        phone: null
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Não falhar o registro se o perfil não for criado
    }

    // Gerar sessão para o usuário
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: data.user.email!
    });

    if (sessionError) {
      console.error('Erro ao gerar sessão:', sessionError);
    }

    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email
      },
      message: 'Usuário criado com sucesso. Faça login para continuar.'
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
 * Autentica usuário usando Supabase Auth
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

    // Autenticar com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou senha inválidos'
      });
      return;
    }

    if (!data.user || !data.session) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou senha inválidos'
      });
      return;
    }

    // Retornar token e dados do usuário
    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
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
