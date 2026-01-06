# Sistema de Solicitação de Avaliações Google via WhatsApp

Sistema web MVP para pequenos negócios solicitarem avaliações no Google via WhatsApp de forma manual e segura.

## 🎯 Objetivo

Facilitar o envio do link oficial de avaliação do Google por WhatsApp com apenas 1 clique, usando link wa.me (Click-to-Chat), sem envio automático, sem WhatsApp API e sem automações ilegais.

## 🚀 Funcionalidades

- ✅ Login simples com email e senha
- ✅ Configuração do negócio (nome, WhatsApp, link do Google, mensagem padrão)
- ✅ Cadastro de clientes com status (satisfeito/reclamou)
- ✅ Lista de clientes com filtros por status
- ✅ Geração de link WhatsApp com mensagem personalizada
- ✅ Histórico de solicitações de avaliação
- ✅ Interface responsiva (desktop e mobile)

## 🛠️ Stack Tecnológica

### Backend
- Node.js + Express
- TypeScript
- SQLite (banco de dados)
- JWT (autenticação)
- bcrypt (hash de senhas)

### Frontend
- React 18
- TypeScript
- React Router (navegação)
- Axios (requisições HTTP)
- Vite (build tool)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## 🔧 Instalação

### Método Rápido (Windows)

Se você está no Windows, use os scripts automáticos:

1. **Duplo-clique em `install.bat`**
   - Instala todas as dependências automaticamente
   - Inicializa o banco de dados
   - Aguarde a conclusão (pode levar 5-10 minutos)

2. **Duplo-clique em `start.bat`**
   - Inicia backend e frontend automaticamente
   - Abre 2 janelas de terminal
   - Aguarde alguns segundos e acesse: http://localhost:5173

### Método Manual

#### Passo 1: Instalar Node.js

Certifique-se de ter o Node.js 18 ou superior instalado:
- Baixe em: https://nodejs.org/
- Verifique a instalação: `node --version`

#### Passo 2: Baixar o projeto

Se você recebeu o projeto em um arquivo ZIP:
1. Extraia o arquivo ZIP
2. Abra o terminal/prompt de comando
3. Navegue até a pasta do projeto

#### Passo 3: Instalar dependências do Backend

```bash
cd backend
npm install
```

Aguarde a instalação de todas as dependências (pode levar alguns minutos).

#### Passo 4: Configurar variáveis de ambiente (Opcional)

O arquivo `.env` já está configurado com valores padrão. Se quiser alterar:

```bash
# Edite backend/.env
PORT=3000
JWT_SECRET=sua-chave-secreta-aqui
```

#### Passo 5: Inicializar banco de dados

```bash
npm run init-db
```

Você verá a mensagem: "✅ Banco de dados inicializado com sucesso"

#### Passo 6: Instalar dependências do Frontend

```bash
cd ../frontend
npm install
```

Aguarde a instalação (pode levar alguns minutos).

## ▶️ Executando o Projeto

Você precisará de **2 terminais/prompts** abertos simultaneamente.

### Terminal 1 - Backend

```bash
# Navegue até a pasta backend
cd backend

# Inicie o servidor
npm run dev
```

Você verá:
```
✅ Banco de dados inicializado
🚀 Servidor rodando na porta 3000
📍 http://localhost:3000
```

**Mantenha este terminal aberto!**

### Terminal 2 - Frontend

```bash
# Navegue até a pasta frontend (em outro terminal)
cd frontend

# Inicie o frontend
npm run dev
```

Você verá:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

**Mantenha este terminal aberto!**

### Acessar o Sistema

Abra seu navegador e acesse: **http://localhost:5173**

## 🎯 Como Usar o Sistema

### 1. Primeiro Acesso

1. Clique em "Criar conta"
2. Digite seu email e senha (mínimo 6 caracteres)
3. Clique em "Criar Conta"

### 2. Configurar seu Negócio

Na primeira vez, você será direcionado para a tela de configuração:

1. **Nome do Negócio**: Digite o nome da sua empresa
2. **Número do WhatsApp**: Digite no formato `5511999999999`
   - 55 = Brasil
   - 11 = DDD
   - 999999999 = seu número
3. **Link do Google**: Cole o link de avaliação do Google My Business
   - Exemplo: `https://g.page/r/...`
4. **Mensagem Padrão**: Personalize a mensagem (mantenha `{{link_google}}`)
5. Clique em "Salvar e Continuar"

### 3. Cadastrar Clientes

1. Na tela de Clientes, clique em "+ Novo Cliente"
2. Preencha:
   - Nome (opcional)
   - Telefone (obrigatório) - formato: `5511999999999`
   - Marque "Cliente satisfeito" se aplicável
   - Marque "Cliente reclamou" se aplicável (bloqueia solicitação)
3. Clique em "Cadastrar Cliente"

### 4. Solicitar Avaliação

1. Na lista de clientes, encontre um cliente com status "Apto"
2. Clique no botão "📱 Pedir Avaliação"
3. O WhatsApp abrirá automaticamente com a mensagem pronta
4. **Você precisa clicar em "Enviar" manualmente no WhatsApp**
5. O status do cliente mudará para "Avaliação Solicitada"

### 5. Editar Configurações

1. Clique em "Configurações" no menu superior
2. Edite os campos desejados
3. Clique em "Salvar Alterações"

## 🧪 Executando Testes

### Backend

```bash
cd backend
npm test                 # Executar todos os testes
npm run test:watch      # Modo watch
npm run test:coverage   # Com cobertura
```

### Frontend

```bash
cd frontend
npm test                # Executar todos os testes
npm run test:watch     # Modo watch
```

## 📁 Estrutura do Projeto

```
.
├── backend/
│   ├── src/
│   │   ├── auth/           # Autenticação e JWT
│   │   ├── database/       # Conexão e schema SQLite
│   │   ├── middleware/     # Middlewares Express
│   │   ├── models/         # Modelos de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── utils/          # Utilitários
│   │   ├── validators/     # Validadores de entrada
│   │   └── server.ts       # Servidor Express
│   ├── database/           # Arquivos do banco de dados
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços (API client)
│   │   ├── types/          # Tipos TypeScript
│   │   ├── App.tsx         # Componente principal
│   │   └── main.tsx        # Entry point
│   └── package.json
│
└── README.md
```

## 🔐 Segurança

- Senhas são hasheadas com bcrypt
- Autenticação via JWT
- Validação de entrada em todas as rotas
- CORS configurado
- Sem automação de envio de mensagens (100% manual)

## 📱 Como Usar

1. **Primeiro Acesso**: Faça login e configure seu negócio
2. **Cadastrar Cliente**: Após atender um cliente, cadastre-o no sistema
3. **Solicitar Avaliação**: Clique em "Pedir Avaliação" para gerar o link do WhatsApp
4. **Enviar Manualmente**: O WhatsApp abrirá com a mensagem pronta - você envia manualmente

## ❓ Perguntas Frequentes

### O sistema envia mensagens automaticamente?
**NÃO!** O sistema apenas abre o WhatsApp com a mensagem pronta. Você precisa clicar em "Enviar" manualmente.

### Posso usar em qualquer dispositivo?
Sim! O sistema funciona em computadores, tablets e celulares.

### Preciso de WhatsApp Business API?
**NÃO!** O sistema usa links wa.me que funcionam com WhatsApp normal.

### Como obter o link de avaliação do Google?
1. Acesse Google My Business
2. Vá em "Início" → "Obter mais avaliações"
3. Copie o link curto fornecido

### Posso editar a mensagem depois?
Sim! Vá em "Configurações" e edite a mensagem padrão quando quiser.

### O que acontece se eu marcar "Cliente reclamou"?
O cliente ficará com status "Bloqueado" e não aparecerá o botão de solicitar avaliação.

## 🐛 Problemas Comuns

### ❌ Erro ao criar conta ou fazer login

**Solução Rápida (Windows):**
1. Feche o sistema (feche os terminais)
2. Duplo-clique em `corrigir.bat`
3. Aguarde a conclusão
4. Execute `start.bat` novamente

**Solução Manual:**
```bash
cd backend
# Windows
del database\app.db
# Mac/Linux
rm database/app.db

# Reinicializar
npm run init-db

# Testar
node test-db.js
```

### ❌ Erro ao cadastrar cliente

Mesmo procedimento acima. O problema geralmente está no banco de dados.

### Backend não inicia
- Verifique se a porta 3000 está livre
- Certifique-se de ter executado `npm install` e `npm run init-db`

### Frontend não conecta ao backend
- Verifique se o backend está rodando
- Confirme que o arquivo `frontend/.env` tem `VITE_API_URL=http://localhost:3000/api`

### Erro ao cadastrar cliente (formato)
- Verifique o formato do telefone: `5511999999999`
- Certifique-se de incluir DDI (55) e DDD

### WhatsApp não abre
- Verifique se tem WhatsApp instalado ou WhatsApp Web aberto
- Alguns navegadores bloqueiam pop-ups - permita pop-ups para o site

## 🔧 Guia Completo de Correção

Veja o arquivo **[CORRIGIR-ERROS.md](CORRIGIR-ERROS.md)** para instruções detalhadas de troubleshooting.

## 🔒 Segurança em Produção

Se for colocar em produção (servidor real):

1. **Mude o JWT_SECRET** no arquivo `backend/.env`
2. **Use HTTPS** (não HTTP)
3. **Configure CORS** adequadamente
4. **Use banco de dados mais robusto** (PostgreSQL, MySQL)
5. **Faça backups regulares** do banco de dados

## ⚠️ Importante

- **NÃO** usa WhatsApp API
- **NÃO** automatiza envio de mensagens
- **NÃO** integra com sistemas externos
- **100% manual** - você controla cada envio

## 📄 Licença

MIT

## 📚 Documentação Adicional

- **[GUIA-RAPIDO.md](GUIA-RAPIDO.md)** - Guia rápido de instalação e uso
- **[COMO-OBTER-LINK-GOOGLE.md](COMO-OBTER-LINK-GOOGLE.md)** - Como obter o link de avaliação do Google
- **[EXEMPLOS-MENSAGENS.md](EXEMPLOS-MENSAGENS.md)** - 10 exemplos de mensagens prontas para usar

## 👨‍💻 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
