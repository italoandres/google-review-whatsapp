# Guia: Push para Repositório Railway

## Problema
O Git está usando as credenciais da conta antiga (italoandres). Você precisa fazer push com a nova conta (avaliacaowhats-spec).

## Solução: Push Manual

### Opção 1: Usar Token de Acesso Pessoal (Recomendado)

1. **Criar Token no GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token" → "Generate new token (classic)"
   - Dê um nome: "Railway Deploy"
   - Marque o escopo: `repo` (acesso completo aos repositórios)
   - Clique em "Generate token"
   - **COPIE O TOKEN** (você só verá uma vez!)

2. **Fazer Push com Token:**
```powershell
# Formato: https://TOKEN@github.com/usuario/repo.git
git push https://SEU_TOKEN_AQUI@github.com/avaliacaowhats-spec/review-google--whatsapp.git main
```

### Opção 2: Usar GitHub CLI (gh)

Se você tiver o GitHub CLI instalado:

```powershell
# Fazer login com a nova conta
gh auth login

# Depois fazer push normal
git push railway main
```

### Opção 3: Limpar Credenciais do Windows

```powershell
# Abrir o Gerenciador de Credenciais do Windows
cmdkey /list

# Remover credenciais do GitHub
cmdkey /delete:git:https://github.com

# Depois tentar push novamente (vai pedir novas credenciais)
git push railway main
```

## Verificar se Funcionou

Depois do push, verifique no GitHub:
https://github.com/avaliacaowhats-spec/review-google--whatsapp

## Próximo Passo: Conectar ao Railway

Depois que o código estiver no GitHub:

1. Acesse: https://railway.app
2. Faça login
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha: `avaliacaowhats-spec/review-google--whatsapp`
6. Railway vai detectar automaticamente que é Node.js

## Variáveis de Ambiente no Railway

Você vai precisar configurar as mesmas variáveis do Render:

```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
EVOLUTION_API_URL=https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D50A29
WEBHOOK_SECRET=sua_chave_webhook
ENCRYPTION_KEY=sua_chave_encryption
```

## Comandos de Build no Railway

Railway vai detectar automaticamente do package.json:
- Build: `npm install && npm run build`
- Start: `npm start`

Não precisa configurar nada!
