import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { 
  getClientsByUserId, 
  getClientById, 
  createClient,
  markClientAsSent,
  markClientAsReviewed,
  checkPhoneExists,
  getMetrics,
  ClientInput 
} from '../models/client';
import { getBusinessByUserId } from '../models/business';
import { validatePhone } from '../validators/phone';
import { validateRequired } from '../validators/required';
import { generateReviewRequestLink } from '../utils/waLinkGenerator';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/clients
 * Lista todos os clientes do usuário
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const clients = await getClientsByUserId(userId);

    res.json({ clients });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao buscar clientes'
    });
  }
});

/**
 * GET /api/clients/:id
 * Busca cliente por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'ID do cliente inválido'
      });
      return;
    }

    const client = await getClientById(clientId, userId);

    if (!client) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Cliente não encontrado'
      });
      return;
    }

    res.json(client);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao buscar cliente'
    });
  }
});

/**
 * POST /api/clients
 * Cadastra novo cliente
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, phone, satisfied, complained } = req.body;

    // Validar campo obrigatório (phone)
    const requiredValidation = validateRequired({ phone }, ['phone']);
    if (!requiredValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: requiredValidation.errors
      });
      return;
    }

    // Validar telefone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: phoneValidation.error,
        field: 'phone'
      });
      return;
    }

    // Verificar se telefone já existe
    const phoneExists = await checkPhoneExists(userId, phone);
    if (phoneExists) {
      res.status(400).json({
        error: 'PHONE_ALREADY_EXISTS',
        message: 'Este telefone já está cadastrado.',
        field: 'phone'
      });
      return;
    }

    // Validar booleans
    if (typeof satisfied !== 'boolean') {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Campo "satisfied" deve ser boolean',
        field: 'satisfied'
      });
      return;
    }

    if (typeof complained !== 'boolean') {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Campo "complained" deve ser boolean',
        field: 'complained'
      });
      return;
    }

    const clientData: ClientInput = {
      name: name || undefined,
      phone,
      satisfied,
      complained
    };

    const client = await createClient(userId, clientData);

    res.status(201).json(client);
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao cadastrar cliente'
    });
  }
});

/**
 * POST /api/clients/:id/request-review
 * Gera link wa.me e marca cliente como enviado
 */
router.post('/:id/request-review', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'ID do cliente inválido'
      });
      return;
    }

    // Buscar cliente
    const client = await getClientById(clientId, userId);

    if (!client) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Cliente não encontrado'
      });
      return;
    }

    // Verificar se cliente está apto (NOT_SENT e não reclamou)
    if (client.reviewStatus !== 'NOT_SENT') {
      res.status(400).json({
        error: 'ALREADY_SENT',
        message: 'Este cliente já recebeu o link de avaliação.'
      });
      return;
    }

    // Verificar se cliente reclamou
    if (client.complained) {
      res.status(400).json({
        error: 'CLIENT_COMPLAINED',
        message: 'Clientes que reclamaram não podem receber solicitação de avaliação.'
      });
      return;
    }

    // Buscar configuração do negócio
    const business = await getBusinessByUserId(userId);

    if (!business) {
      res.status(400).json({
        error: 'BUSINESS_NOT_CONFIGURED',
        message: 'Configure seu negócio antes de solicitar avaliações'
      });
      return;
    }

    // Gerar link wa.me
    const waLink = generateReviewRequestLink(
      client.phone,
      business.defaultMessage,
      business.googleReviewLink
    );

    // Atualizar status do cliente para SENT
    const updatedClient = await markClientAsSent(clientId, userId);

    res.json({
      waLink,
      client: updatedClient
    });
  } catch (error) {
    console.error('Erro ao solicitar avaliação:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao solicitar avaliação'
    });
  }
});

/**
 * POST /api/clients/:id/mark-reviewed
 * Marca cliente como avaliado manualmente
 */
router.post('/:id/mark-reviewed', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'ID do cliente inválido'
      });
      return;
    }

    // Buscar cliente
    const client = await getClientById(clientId, userId);

    if (!client) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Cliente não encontrado'
      });
      return;
    }

    // Verificar se cliente recebeu o link (status SENT)
    if (client.reviewStatus !== 'SENT') {
      res.status(400).json({
        error: 'INVALID_STATUS',
        message: 'Apenas clientes que receberam o link podem ser marcados como avaliados.'
      });
      return;
    }

    // Marcar como avaliado
    const updatedClient = await markClientAsReviewed(clientId, userId);

    res.json(updatedClient);
  } catch (error) {
    console.error('Erro ao marcar cliente como avaliado:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao marcar cliente como avaliado'
    });
  }
});

/**
 * GET /api/clients/metrics
 * Retorna métricas de envios e avaliações
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const metrics = await getMetrics(userId);

    res.json(metrics);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao buscar métricas'
    });
  }
});

export default router;
