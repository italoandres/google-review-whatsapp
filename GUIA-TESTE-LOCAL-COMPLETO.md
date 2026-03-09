# 🧪 Guia Completo de Teste Local

## 📋 Pré-requisitos

- Node.js instalado (v16 ou superior)
- npm ou yarn
- Git
- Acesso às credenciais do Supabase
- Evolution API rodando (https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host)

## 🚀 Passo a Passo

### 1. Configurar Backend

```bash
# Navegar para pasta do backend
cd backend

# Instalar dependências (se necessário)
npm install

# Criar arquivo .env (se não existir)
# Copiar de .env.example
cp .env.example .env
```

### 2. Configurar Variáveis de Ambiente do Backend

Edite `backend/.env` com:

```env
# Supabase
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Evolution API
EVOLUTION_API_URL=https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
EVOLUTION_API_GLOBAL_KEY=sua_chave_global_aqui

# Backend
BACKEND_URL=http://localhost:3000
PORT=3000

# Security
ENCRYPTION_KEY=sua_chave_encryption_32_caracteres
WEBHOOK_SECRET=sua_chave_webhook_secreta

# Environment
NODE_ENV=development
```

### 3. Rodar Backend

```bash
# Ainda na pasta backend
npm run dev

# Deve mostrar:
# ✅ Configuration validated successfully
# 🚀 Servidor rodando na porta 3000
# 📍 http://localhost:3000
# 🏥 Health check: http://localhost:3000/health
```

### 4. Configurar Frontend (Novo Terminal)

```bash
# Abrir novo terminal
cd frontend

# Instalar dependências (se necessário)
npm install

# Criar arquivo .env (se não existir)
```

### 5. Configurar Variáveis de Ambiente do Frontend

Edite `frontend/.env` com:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 6. Rodar Frontend

```bash
# Ainda na pasta frontend
npm run dev

# Deve mostrar:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### 7. Acessar Sistema

Abra o navegador em: **http://localhost:5173**

## 🧪 Testes a Realizar

### Teste 1: Login
1. Acesse http://localhost:5173/login
2. Faça login com suas credenciais
3. Deve redirecionar para dashboard

### Teste 2: Conexão WhatsApp
1. Acesse http://localhost:5173/whatsapp-connection
2. Clique em "Conectar WhatsApp"
3. **VERIFICAR**: QR code aparece e NÃO some
4. **VERIFICAR**: Barra de progresso funciona
5. **VERIFICAR**: Contador de tentativas atualiza
6. Escaneie o QR code no WhatsApp
7. **VERIFICAR**: Detecta conexão e mostra sucesso

### Teste 3: QR Code Não Some
1. Conecte WhatsApp
2. Aguarde QR code aparecer
3. **NÃO escaneie ainda**
4. Observe por 10 segundos
5. **VERIFICAR**: QR code permanece visível
6. **VERIFICAR**: Não volta para tela de erro
7. **VERIFICAR**: Contador continua funcionando

### Teste 4: Timeout e Verificação Final
1. Conecte WhatsApp
2. Aguarde QR code aparecer
3. **NÃO escaneie**
4. Aguarde até atingir 120 tentativas (6 minutos)
5. **VERIFICAR**: Faz verificação final antes de mostrar erro
6. **VERIFICAR**: Se conectou durante polling, mostra sucesso
7. **VERIFICAR**: Se não conectou, mostra erro com botão "Verificar Status"

### Teste 5: Botão "Verificar Status"
1. Se estiver em estado de erro
2. Clique em "Verificar Status"
3. **VERIFICAR**: Faz nova verificação
4. **VERIFICAR**: Se conectado, mostra sucesso
5. **VERIFICAR**: Se não conectado, mantém erro

## 🔍 Verificar Console do Navegador

Abra DevTools (F12) e observe:

### Console deve mostrar:
```
Checking connection status...
QR code not ready yet, retrying in 2s... (attempt 1/10)
QR code not ready yet, retrying in 2s... (attempt 2/10)
...
Polling connection status...
```

### Console NÃO deve mostrar:
- ❌ Erros em vermelho
- ❌ "QR code disappeared"
- ❌ "Unexpected state change"

## 🔧 Troubleshooting

### Backend não inicia
```bash
# Verificar se porta 3000 está livre
netstat -ano | findstr :3000

# Se estiver ocupada, matar processo ou mudar porta
```

### Frontend não conecta ao backend
```bash
# Verificar se VITE_API_URL está correto
cat frontend/.env

# Deve ser: VITE_API_URL=http://localhost:3000
```

### QR code não aparece
```bash
# Verificar logs do backend
# Deve mostrar:
# Instance creation...
# QR code generated...
```

### Erro 401 Unauthorized
```bash
# Verificar EVOLUTION_API_GLOBAL_KEY no backend/.env
# Deve ser a chave correta da Evolution API
```

### Erro de CORS
```bash
# Verificar se backend está rodando
# Verificar se VITE_API_URL está correto no frontend/.env
```

## 📊 Checklist de Validação

Após testes, marque:

- [ ] Backend inicia sem erros
- [ ] Frontend inicia sem erros
- [ ] Login funciona
- [ ] Página de conexão WhatsApp carrega
- [ ] Botão "Conectar WhatsApp" funciona
- [ ] QR code aparece
- [ ] QR code NÃO some após 1 segundo
- [ ] Barra de progresso funciona
- [ ] Contador de tentativas atualiza
- [ ] Conexão é detectada quando escaneia
- [ ] Mostra sucesso ao conectar
- [ ] Verificação final funciona (após 6 min)
- [ ] Botão "Verificar Status" funciona
- [ ] Sem erros no console

## 🎯 Critérios de Sucesso

O sistema está funcionando se:

1. ✅ QR code aparece e permanece visível
2. ✅ Polling funciona sem fazer QR code sumir
3. ✅ Detecta conexão automaticamente
4. ✅ Verificação final antes de erro funciona
5. ✅ Botão "Verificar Status" funciona
6. ✅ Sem erros no console

## 📝 Reportar Problemas

Se encontrar problemas, anote:

1. **O que estava fazendo**: Ex: "Cliquei em Conectar WhatsApp"
2. **O que esperava**: Ex: "QR code deveria aparecer"
3. **O que aconteceu**: Ex: "QR code apareceu e sumiu"
4. **Erros no console**: Copie mensagens de erro
5. **Logs do backend**: Copie logs relevantes

## 🚀 Próximo Passo

Após confirmar que tudo funciona localmente:

1. Fazer push para GitHub
2. Aguardar limite do Netlify resetar
3. Deploy automático acontecerá
4. Testar em produção

---

**Status**: Guia completo para teste local
**Objetivo**: Validar correções antes de deploy em produção
