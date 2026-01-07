# 🚀 Guia de Deploy no Netlify

## Pré-requisitos

- ✅ Conta no Netlify (https://netlify.com)
- ✅ Repositório Git (GitHub, GitLab ou Bitbucket)
- ✅ Backend rodando em algum servidor (para produção)

## Passo a Passo

### 1. Preparar o Repositório

```bash
git add .
git commit -m "Correções TypeScript para build Netlify"
git push origin main
```

### 2. Conectar ao Netlify

1. Acesse https://app.netlify.com
2. Clique em "Add new site" → "Import an existing project"
3. Escolha seu provedor Git (GitHub, GitLab, etc.)
4. Selecione o repositório do projeto

### 3. Configurar Build Settings

**Base directory:**
```
frontend
```

**Build command:**
```
npm run build
```

**Publish directory:**
```
frontend/dist
```

**Node version:**
```
18
```

### 4. Configurar Variáveis de Ambiente

⚠️ **CRÍTICO:** Esta variável é OBRIGATÓRIA para o frontend funcionar em produção.

No painel do Netlify:

1. Vá em "Site settings" → "Environment variables"
2. Clique em "Add a variable"
3. Adicione:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://google-review-whatsapp.onrender.com/api`

**IMPORTANTE:**
- ❌ NÃO use `localhost`, `127.0.0.1` ou IPs locais (`192.168.*`)
- ✅ Use APENAS a URL pública do backend em produção
- ✅ A URL deve terminar com `/api`
- ✅ Deve começar com `https://` (não `http://`)

### 5. Deploy

1. Clique em "Deploy site"
2. Aguarde o build (1-3 minutos)
3. Acesse a URL fornecida pelo Netlify

## Configuração Automática

O arquivo `frontend/netlify.toml` já está configurado com:

- ✅ Comando de build
- ✅ Pasta de publicação
- ✅ Redirects para SPA
- ✅ Versão do Node.js

## Verificar Build

### Logs de Build

Se o build falhar:

1. Vá em "Deploys" no painel do Netlify
2. Clique no deploy que falhou
3. Veja os logs detalhados

### Erros Comuns

**Erro: "VITE_API_URL is not defined"**
- Solução: Configure a variável de ambiente no Netlify

**Erro: "VITE_API_URL is required"**
- Solução: A variável está vazia ou não foi configurada. Adicione no Netlify.

**Erro: "Cannot use localhost or local IP in production"**
- Solução: Você configurou `localhost`, `127.0.0.1` ou IP local (`192.168.*`) no Netlify
- Configure com a URL pública do backend: `https://google-review-whatsapp.onrender.com/api`

**Erro: "Network request failed" ou "Failed to fetch"**
- Solução: Verifique se o backend está rodando e acessível
- Verifique se o CORS está configurado corretamente no backend

**Erro: "Node version mismatch"**
- Solução: Verifique se o Node 18+ está configurado

**Erro: "Build command failed"**
- Solução: Verifique se o `package.json` está correto

## Testar Localmente

Antes de fazer deploy, teste localmente:

```bash
cd frontend

# Limpar build anterior
rm -rf dist

# Build
npm run build

# Testar build localmente
npm run preview
```

Acesse: http://localhost:4173

## Deploy Contínuo

Após a configuração inicial, cada push para a branch principal (`main` ou `master`) fará deploy automaticamente.

## Domínio Customizado

Para usar seu próprio domínio:

1. Vá em "Domain settings" no Netlify
2. Clique em "Add custom domain"
3. Siga as instruções para configurar DNS

## Rollback

Se algo der errado:

1. Vá em "Deploys"
2. Encontre um deploy anterior que funcionava
3. Clique em "Publish deploy"

## Monitoramento

O Netlify fornece:

- ✅ Analytics de acesso
- ✅ Logs de build
- ✅ Notificações de deploy
- ✅ Preview de branches

## Custos

- **Plano Free:** 100GB bandwidth/mês, builds ilimitados
- **Plano Pro:** $19/mês, mais recursos

Para este projeto, o plano Free é suficiente.

## Checklist Final

Antes de considerar o deploy completo:

- [ ] Build local funciona (`npm run build`)
- [ ] Variável `VITE_API_URL` configurada no Netlify
- [ ] Backend está acessível pela URL configurada
- [ ] CORS configurado no backend para aceitar requisições do domínio Netlify
- [ ] Site abre sem erros no console do navegador
- [ ] Login funciona
- [ ] Cadastro de clientes funciona
- [ ] Solicitação de avaliação funciona

## Configurar CORS no Backend

**IMPORTANTE:** O backend precisa aceitar requisições do domínio Netlify.

No arquivo `backend/src/server.ts`, atualize:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seu-site.netlify.app'  // Adicione seu domínio Netlify
  ]
}));
```

## Suporte

Problemas com deploy?

1. Verifique os logs no Netlify
2. Teste o build localmente
3. Verifique as variáveis de ambiente
4. Consulte a documentação: https://docs.netlify.com

## Recursos Úteis

- Documentação Netlify: https://docs.netlify.com
- Vite Deploy Guide: https://vitejs.dev/guide/static-deploy.html
- Netlify Community: https://answers.netlify.com
