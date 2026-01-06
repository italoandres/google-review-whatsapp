import fs from 'fs';
import path from 'path';
import db, { dbRun } from './connection';

/**
 * Inicializa o banco de dados executando o schema SQL
 */
export async function initDatabase(): Promise<void> {
  try {
    // Detectar se estamos na pasta backend ou na raiz do projeto
    const cwd = process.cwd();
    const isInBackendFolder = cwd.endsWith('backend') || cwd.includes('backend\\') && !cwd.includes('backend\\backend');
    
    // Construir caminho correto baseado no contexto
    const schemaPath = isInBackendFolder
      ? path.join(cwd, 'src', 'database', 'schema.sql')
      : path.join(cwd, 'backend', 'src', 'database', 'schema.sql');
    
    console.log('📂 Lendo schema de:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Dividir por ponto e vírgula e executar cada statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await dbRun(statement);
    }
    
    console.log('✅ Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Se executado diretamente, inicializar o banco
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Banco de dados pronto para uso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Falha ao inicializar banco:', error);
      process.exit(1);
    });
}
