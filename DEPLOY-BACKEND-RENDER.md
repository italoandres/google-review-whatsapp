# 🚀 Guia de Deploy do Backend no Render (Supabase)

## ⚠️ IMPORTANTE - Sistema Migrado para Supabase

Este sistema foi **migrado de SQLite para Supabase (PostgreSQL)**. Não há mais banco de dados local!

## Pré-requisitos

- ✅ Conta no Render (https://render.com)
- ✅ Repositório Git no GitHub
- ✅ Código do backend commitado
- ✅ Tabelas criadas no Supabase
- ✅ Chaves do Supabase (URL, ANON_KEY, SERVICE_KEY)

## Passo a Passo - Deploy no Render

### 1. Verificar Repositório

O código já está no GitHub! ✅

```bash
# Verificar status
git status

# Ver último commit
git log --oneline -1
```

### 2. Criar Web Service no Render

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `google-review-whatsapp` (ou o nome que você deu)

### 3. Configurar o Service

**Name:** `google-review-whatsapp` (ou outro nome)

**Region:** `Oregon (US West)` (ou mais próximo de você)

**Branch:** `main`

**Root Directory:** `backend`

**Runtime:** `Node`

**Build Command:**
```bash
npm install && npm run build
```

⚠️ **IMPORTANTE:** Removemos `npm run init-db` porque não há mais banco local!

**Start Command:**
```bash
npm start
```

**Instance Type:** Selecione **"Free"** (grátis)

### 4. Configurar Variáveis de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**

Adicione estas variáveis (copie e cole):

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://cuychbunipzwfaitnbor.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc2NDgsImV4cCI6MjA4MzQ2MzY0OH0.JfKaw-b5Siw_7ilrqUCt_kUe7xi-2RJMaO76maV8yhU` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWNoYnVuaXB6d2ZhaXRuYm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4NzY0OCwiZXhwIjoyMDgzNDYzNjQ4fQ.Td0PWFAggP0ocaBmSoa9n7lpWMkVXC5PWawCdiCTq1Q` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

**Nota:** O Render usa a porta 10000 por padrão, mas o código já está preparado para usar `process.env.PORT`.

### 5. Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (2-5 minutos)
3. Verifique os logs para confirmar sucesso

**Logs esperados:**
```
✅ npm install
✅ npm run build
✅ Starting service...
🚀 Servidor rodando na porta 10000
🗄️  Usando Supabase como banco de dados
```

### 6. Anotar URL do Backend

Após o deploy, anote a URL fornecida pelo Render:

```
https://google-review-whatsapp.onrender.com
```

Você vai precisar dessa URL para configurar o frontend!

### 7. Testar o Backend

Acesse a URL + `/health`:

```
https://seu-backend.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-01-09T..."
}
```

✅ Se retornar isso, o backend está funcionando!

## Próximos Passos

Após o backend estar funcionando:

1. ✅ Anote a URL do backend
2. 📱 Configure o frontend no Netlify (veja `DEPLOY-NETLIFY.md`)
3. 🔧 Configure CORS se necessário (veja abaixo)

## Configurar CORS (se necessário)

Se o frontend não conseguir conectar ao backend, atualize o CORS.

Edite `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seu-site.netlify.app'  // Adicione seu domínio Netlify
  ],
  credentials: true
}));
```

Depois faça commit e push:

```bash
git add .
git commit -m "Configurar CORS para produção"
git push
```

O Render fará deploy automaticamente! ✅

## Logs e Monitoramento

### Ver Logs

No painel do Render:
1. Vá em **"Logs"**
2. Veja logs em tempo real
3. Procure por erros

### Logs Importantes

```
✅ Servidor rodando na porta 10000
✅ Usando Supabase como banco de dados
✅ Health check: http://localhost:10000/health
```

## Troubleshooting

### ❌ Erro: "Missing Supabase environment variables"

**Solução:** Verifique se as 3 variáveis do Supabase foram adicionadas:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

### ❌ Erro: "Missing script: 'init-db'"

**Solução:** O Build Command deve ser apenas:
```bash
npm install && npm run build
```

Remova `npm run init-db` (não existe mais!)

### ❌ Erro: "Port already in use"

**Solução:** Não especifique porta fixa. O código já usa:
```typescript
const PORT = process.env.PORT || 3000;
```

### ❌ Backend retorna 500 ou 401

**Solução:** 
1. Verifique se as tabelas foram criadas no Supabase
2. Verifique se as chaves do Supabase estão corretas
3. Veja os logs do Render para mais detalhes

## Planos e Custos

### Free Tier
- ✅ 750 horas/mês
- ✅ Builds ilimitados
- ⚠️ Dorme após 15 min de inatividade (primeira requisição demora ~30s)
- ✅ Perfeito para testes e projetos pessoais

### Starter ($7/mês)
- ✅ Sempre ativo
- ✅ Melhor performance
- ✅ Sem tempo de espera

Para este projeto, o **Free Tier funciona perfeitamente**!

## Checklist de Deploy

- [ ] Código commitado e no GitHub ✅
- [ ] Web Service criado no Render
- [ ] Root Directory = `backend`
- [ ] Build command = `npm install && npm run build`
- [ ] Start command = `npm start`
- [ ] Variáveis de ambiente configuradas (3 do Supabase + NODE_ENV + PORT)
- [ ] Deploy concluído sem erros
- [ ] `/health` retorna status ok
- [ ] URL do backend anotada
- [ ] Pronto para configurar frontend!

## Deploy Automático

Agora, sempre que você fizer mudanças no código:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O Render fará deploy automaticamente! ✅

## Comandos Úteis

### Build Local (testar antes de deploy)

```bash
cd backend
npm install
npm run build
npm start
```

### Ver Logs no Render

Acesse o dashboard → Logs → Veja em tempo real

## Alternativas ao Render

- **Railway:** Similar ao Render, fácil de usar
- **Heroku:** Mais caro, mas muito estável
- **DigitalOcean App Platform:** Bom custo-benefício
- **Vercel:** Ótimo para Node.js, deploy automático
- **AWS Elastic Beanstalk:** Mais complexo, mais controle

## Vantagens do Supabase

✅ **Sem banco de dados local:** Não precisa de disco persistente no Render
✅ **Backups automáticos:** Supabase faz backup automaticamente
✅ **Escalável:** Suporta múltiplos acessos simultâneos
✅ **Seguro:** Autenticação e RLS (Row Level Security) integrados
✅ **Grátis:** 500MB de banco + 2GB de storage no plano gratuito

## Suporte

Problemas com deploy?

1. ✅ Verifique os logs no Render
2. ✅ Teste o build localmente
3. ✅ Verifique as variáveis de ambiente
4. ✅ Consulte: https://render.com/docs
5. ✅ Veja `DEPLOY-GITHUB.md` para guia completo

## Recursos Úteis

- 📚 Documentação Render: https://render.com/docs
- 💬 Render Community: https://community.render.com
- 🚀 Node.js no Render: https://render.com/docs/deploy-node-express-app
- 🗄️ Supabase Docs: https://supabase.com/docs

---

**Última atualização:** 09/01/2026 - Sistema migrado para Supabase ✅
