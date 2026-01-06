import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/app.db');

// Garantir que o diretório existe
const dbDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Criar conexão com SQLite
const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Funções promisificadas manualmente para melhor controle
export function dbRun(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Erro no dbRun:', err);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function dbGet(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Erro no dbGet:', err);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Erro no dbAll:', err);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

export default db;
