// Carregar variáveis de ambiente PRIMEIRO
import dotenv from 'dotenv';
dotenv.config();

// Validar configuração na inicialização
import { validateConfigOnStartup } from './config/environment';
const config = validateConfigOnStartup();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import clientsRoutes from './routes/clients';
import evolutionRoutes from './routes/evolution';
import whatsappInstanceRoutes from './routes/whatsappInstance';
import webhookRoutes from './routes/webhook';
import healthRoutes from './routes/health';

const app = express();
const PORT = config.app.port;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api', evolutionRoutes);
app.use('/api/evolution', whatsappInstanceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/health', healthRoutes);

// Tratamento de rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Rota não encontrada'
  });
});

// Tratamento de erros global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro não tratado:', err);
  
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Usando Supabase como banco de dados`);
});

export default app;
