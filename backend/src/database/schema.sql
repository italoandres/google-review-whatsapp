-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações do negócio
CREATE TABLE IF NOT EXISTS business (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  business_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  google_review_link TEXT NOT NULL,
  default_message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT,
  phone TEXT NOT NULL,
  satisfied BOOLEAN NOT NULL DEFAULT 0,
  complained BOOLEAN NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'NOT_SENT' CHECK(review_status IN ('NOT_SENT', 'SENT', 'REVIEWED_MANUAL')),
  sent_at DATETIME,
  reviewed_at DATETIME,
  attendance_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_business_user_id ON business(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_review_status ON clients(review_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_phone ON clients(user_id, phone);
