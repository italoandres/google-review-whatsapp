# 🚀 Guia de Deploy do Backend no Render

## Pré-requisitos

- ✅ Conta no Render (https://render.com)
- ✅ Repositório Git (GitHub, GitLab ou Bitbucket)
- ✅ Código do backend commitado

## Correção Aplicada

### ✅ Schema.sql em Produção

**Problema:** Em produção, `__dirname` aponta para `dist/database`, mas o `schema.sql` está em `src/database`.

**Solução:** Alterado `backend/src/database/init.ts` para detectar automaticamente o contexto:

```typescript
// Detectar se estamos na pasta backend ou na raiz do projeto
const cwd = process.cwd();
const isInBackendFolder = cwd.endsWith('backend') || cwd.includes('backend\\') && !cwd.includes('backend\\backend');

// Construir caminho correto baseado no contexto
const schemaPath = isInBackendFolder
  ? path.join(cwd, 'src', 'database', 'schema.sql')
  : path.join(cwd, 'backend', 'src', 'database', 'schema.sql');
```

**Funciona em:**
- ✔️ Local (executando de dentro da pasta backend)
- ✔️ Local (executando da raiz do projeto)
- ✔️ Render (Root Directory = backend)
- ✔️ Render (Root Directory = .)
- ✔️ Não depende de build
- ✔️ Não exige cópia manual

Agora funciona tanto localmente quanto em produção! ✅

## Passo a Passo - Deploy no Render

### 1. Preparar o Repositório

```bash
git add .
git commit -m "Fix: Corrigir caminho schema.sql para produção"
git push origin main
```

### 2. Criar Web Service no Render

1. Acesse https://dashboard.render.com
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório Git
4. Selecione o repositório do projeto

### 3. Configurar o Service

**Name:** `google-review-backend` (ou outro nome)

**Region:** Escolha a região mais próxima

**Branch:** `main` (ou sua branch principal)

**Root Directory:** `backend`

**Runtime:** `Node`

**Build Command:**
```bash
npm install && npm run build && npm run init-db
```

**Start Command:**
```bash
npm start
```

### 4. Configurar Variáveis de Ambiente

No painel do Render, adicione:

| Key | Value | Descrição |
|-----|-------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `JWT_SECRET` | `sua-chave-secreta-forte-aqui` | Chave para JWT (mude!) |
| `DATABASE_PATH` | `/opt/render/project/src/backend/database/app.db` | Caminho do banco |
| `NODE_ENV` | `production` | Ambiente |

**⚠️ IMPORTANTE:** Mude o `JWT_SECRET` para uma chave forte e única!

### 5. Configurar Disco Persistente (Opcional)

Para manter o banco de dados entre deploys:

1. No painel do Render, vá em "Disks"
2. Clique em "Add Disk"
3. **Name:** `database`
4. **Mount Path:** `/opt/render/project/src/backend/database`
5. **Size:** 1 GB (suficiente)

**Nota:** Sem disco persistente, o banco será recriado a cada deploy.

### 6. Deploy

1. Clique em "Create Web Service"
2. Aguarde o build (3-5 minutos)
3. Verifique os logs para confirmar sucesso

### 7. Testar o Backend

Acesse a URL fornecida pelo Render + `/health`:

```
https://seu-backend.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2024-01-06T..."
}
```

## Configurar CORS

**IMPORTANTE:** Atualize o CORS no backend para aceitar requisições do frontend.

Edite `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seu-frontend.netlify.app'  // Adicione seu domínio Netlify
  ],
  credentials: true
}));
```

Commit e push para atualizar.

## Atualizar Frontend

No Netlify, atualize a variável de ambiente:

```
VITE_API_URL=https://seu-backend.onrender.com/api
```

## Estrutura de Arquivos em Produção

```
/opt/render/project/src/backend/
├── src/
│   ├── database/
│   │   ├── schema.sql          ← Lido daqui!
│   │   ├── connection.ts
│   │   └── init.ts
│   ├── routes/
│   ├── models/
│   └── server.ts
├── dist/                        ← Código compilado
│   └── database/
│       └── init.js              ← Executado daqui
├── database/
│   └── app.db                   ← Banco de dados
└── package.json
```

## Logs e Monitoramento

### Ver Logs

No painel do Render:
1. Vá em "Logs"
2. Veja logs em tempo real
3. Procure por erros

### Logs Importantes

```
✅ Conectado ao banco de dados SQLite
✅ Banco de dados inicializado com sucesso
🚀 Servidor rodando na porta 3000
```

## Troubleshooting

### ❌ Erro: "Cannot find module 'schema.sql'"

**Solução:** Verifique se a correção do `init.ts` foi aplicada:
```typescript
const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
```

### ❌ Erro: "ENOENT: no such file or directory"

**Solução:** Verifique o Root Directory no Render está como `backend`.

### ❌ Erro: "Port already in use"

**Solução:** Não especifique porta fixa. Use:
```typescript
const PORT = process.env.PORT || 3000;
```

### ❌ Banco de dados reseta a cada deploy

**Solução:** Configure um disco persistente (veja passo 5).

## Planos e Custos

### Free Tier
- ✅ 750 horas/mês
- ✅ Builds ilimitados
- ⚠️ Dorme após 15 min de inatividade
- ⚠️ Sem disco persistente

### Starter ($7/mês)
- ✅ Sempre ativo
- ✅ Disco persistente incluído
- ✅ Melhor performance

Para este projeto, o Free Tier funciona para testes.

## Checklist de Deploy

- [ ] Código commitado e pushed
- [ ] Web Service criado no Render
- [ ] Root Directory = `backend`
- [ ] Build command correto
- [ ] Start command correto
- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET alterado
- [ ] Disco persistente configurado (opcional)
- [ ] Deploy concluído sem erros
- [ ] `/health` retorna status ok
- [ ] CORS configurado para frontend
- [ ] Frontend atualizado com URL do backend

## Comandos Úteis

### Build Local (testar antes de deploy)

```bash
cd backend
npm run build
npm run init-db
npm start
```

### Verificar Logs no Render

```bash
# Via CLI do Render (se instalado)
render logs -s seu-service-name
```

## Alternativas ao Render

- **Railway:** Similar ao Render, fácil de usar
- **Heroku:** Mais caro, mas muito estável
- **DigitalOcean App Platform:** Bom custo-benefício
- **AWS Elastic Beanstalk:** Mais complexo, mais controle

## Backup do Banco de Dados

Se usar disco persistente:

1. Acesse o shell do Render
2. Copie o arquivo `database/app.db`
3. Faça backup regularmente

Ou use um banco de dados gerenciado:
- **Render PostgreSQL** (recomendado)
- **PlanetScale** (MySQL)
- **MongoDB Atlas**

## Migração para PostgreSQL (Futuro)

Para produção séria, considere migrar de SQLite para PostgreSQL:

1. Render oferece PostgreSQL gratuito
2. Mais robusto para múltiplos acessos
3. Backups automáticos

## Suporte

Problemas com deploy?

1. Verifique os logs no Render
2. Teste o build localmente
3. Verifique as variáveis de ambiente
4. Consulte: https://render.com/docs

## Recursos Úteis

- Documentação Render: https://render.com/docs
- Render Community: https://community.render.com
- Node.js no Render: https://render.com/docs/deploy-node-express-app
