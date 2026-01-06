import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/init';
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import clientsRoutes from './routes/clients';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Rota de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// Inicializar banco de dados e iniciar servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    console.log('✅ Banco de dados inicializado');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

export default app;
