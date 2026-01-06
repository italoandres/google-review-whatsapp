// Script de teste do banco de dados
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'app.db');
console.log('Testando banco de dados em:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco');
});

// Testar tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('❌ Erro ao listar tabelas:', err);
  } else {
    console.log('✅ Tabelas encontradas:', tables.map(t => t.name).join(', '));
  }
  
  // Testar inserção de usuário
  const testEmail = 'teste@teste.com';
  const testHash = '$2b$10$abcdefghijklmnopqrstuvwxyz123456789';
  
  db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [testEmail, testHash], function(err) {
    if (err) {
      console.log('⚠️  Usuário já existe ou erro:', err.message);
    } else {
      console.log('✅ Usuário inserido com ID:', this.lastID);
    }
    
    // Buscar usuário
    db.get('SELECT * FROM users WHERE email = ?', [testEmail], (err, row) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err);
      } else if (row) {
        console.log('✅ Usuário encontrado:', row);
      } else {
        console.log('⚠️  Usuário não encontrado');
      }
      
      db.close();
    });
  });
});
