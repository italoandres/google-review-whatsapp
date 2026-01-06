import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getBusinessByUserId, createBusiness, updateBusiness, BusinessInput } from '../models/business';
import { validatePhone } from '../validators/phone';
import { validateGoogleReviewUrl } from '../validators/url';
import { validateMessage } from '../validators/message';
import { validateRequired } from '../validators/required';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/business/config
 * Retorna configuração do negócio
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const business = await getBusinessByUserId(userId);

    if (!business) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Configuração não encontrada'
      });
      return;
    }

    res.json(business);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao buscar configuração'
    });
  }
});

/**
 * POST /api/business/config
 * Cria ou atualiza configuração do negócio
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { businessName, whatsappNumber, googleReviewLink, defaultMessage } = req.body;

    // Validar campos obrigatórios
    const requiredValidation = validateRequired(
      { businessName, whatsappNumber, googleReviewLink, defaultMessage },
      ['businessName', 'whatsappNumber', 'googleReviewLink', 'defaultMessage']
    );

    if (!requiredValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: requiredValidation.errors
      });
      return;
    }

    // Validar telefone
    const phoneValidation = validatePhone(whatsappNumber);
    if (!phoneValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: phoneValidation.error,
        field: 'whatsappNumber'
      });
      return;
    }

    // Validar URL do Google
    const urlValidation = validateGoogleReviewUrl(googleReviewLink);
    if (!urlValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: urlValidation.error,
        field: 'googleReviewLink'
      });
      return;
    }

    // Validar mensagem
    const messageValidation = validateMessage(defaultMessage);
    if (!messageValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: messageValidation.error,
        field: 'defaultMessage'
      });
      return;
    }

    // Verificar se já existe configuração
    const existingBusiness = await getBusinessByUserId(userId);

    let business;
    if (existingBusiness) {
      // Atualizar
      business = await updateBusiness(userId, {
        businessName,
        whatsappNumber,
        googleReviewLink,
        defaultMessage
      });
    } else {
      // Criar
      business = await createBusiness(userId, {
        businessName,
        whatsappNumber,
        googleReviewLink,
        defaultMessage
      });
    }

    // Incluir warning se houver
    const response: any = business;
    if (messageValidation.warning) {
      response.warning = messageValidation.warning;
    }

    res.status(existingBusiness ? 200 : 201).json(response);
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao salvar configuração'
    });
  }
});

/**
 * PUT /api/business/config
 * Atualiza parcialmente configuração do negócio
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { businessName, whatsappNumber, googleReviewLink, defaultMessage } = req.body;

    // Verificar se configuração existe
    const existingBusiness = await getBusinessByUserId(userId);
    if (!existingBusiness) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Configuração não encontrada. Use POST para criar.'
      });
      return;
    }

    const updates: Partial<BusinessInput> = {};
    const errors: Record<string, string> = {};

    // Validar e adicionar campos que foram fornecidos
    if (businessName !== undefined) {
      if (businessName.trim().length === 0) {
        errors.businessName = 'Nome do negócio não pode estar vazio';
      } else {
        updates.businessName = businessName;
      }
    }

    if (whatsappNumber !== undefined) {
      const phoneValidation = validatePhone(whatsappNumber);
      if (!phoneValidation.valid) {
        errors.whatsappNumber = phoneValidation.error!;
      } else {
        updates.whatsappNumber = whatsappNumber;
      }
    }

    if (googleReviewLink !== undefined) {
      const urlValidation = validateGoogleReviewUrl(googleReviewLink);
      if (!urlValidation.valid) {
        errors.googleReviewLink = urlValidation.error!;
      } else {
        updates.googleReviewLink = googleReviewLink;
      }
    }

    if (defaultMessage !== undefined) {
      const messageValidation = validateMessage(defaultMessage);
      if (!messageValidation.valid) {
        errors.defaultMessage = messageValidation.error!;
      } else {
        updates.defaultMessage = defaultMessage;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: errors
      });
      return;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Nenhum campo para atualizar'
      });
      return;
    }

    const business = await updateBusiness(userId, updates);

    res.json(business);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar configuração'
    });
  }
});

export default router;
