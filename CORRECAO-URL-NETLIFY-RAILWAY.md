# Correção: Atualizar URL da API no Netlify para Railway

## Problema
Frontend no Netlify estava tentando acessar o backend antigo do Render:
```
https://google-review-whatsapp.onrender.com/api
```

Erro no console:
```
google-review-whatsapp.onrender.com/api/evolution/create-instance:1 
Failed to load resource: the server responded with a status of 500 ()
```

## Solução

### 1. Atualizar Variável de Ambiente no Netlify

Acesse: https://app.netlify.com

1. Selecione o site: `avaliacaowhtas.netlify.app`
2. Vá em **Site configuration** → **Environment variables**
3. Encontre `VITE_API_URL`
4. Atualize para:
   ```
   https://review-google-whatsapp-production.up.railway.app/api
   ```
5. Salve a alteração

### 2. Fazer Redeploy do Frontend

1. Vá em **Deploys**
2. Clique em **Trigger deploy**
3. Selecione **Deploy site**
4. Aguarde o deploy completar (1-2 minutos)

### 3. Verificar

Após o deploy:
1. Acesse: https://avaliacaowhtas.netlify.app
2. Abra o Console do navegador (F12)
3. Deve aparecer:
   ```
   🌐 API URL: https://review-google-whatsapp-production.up.railway.app/api
   ```

4. Teste a conexão WhatsApp - deve funcionar agora!

## Arquitetura Atualizada

```
Frontend (Netlify)
https://avaliacaowhtas.netlify.app
         ↓
Backend (Railway - Conta 1)
https://review-google-whatsapp-production.up.railway.app
         ↓
Evolution API (Railway - Conta 2)
https://evolution-api-production-5961.up.railway.app
         ↓
Database (Supabase)
https://cuychbunipzwfaitnbor.supabase.co
```

## Variáveis de Ambiente Corretas

### Netlify (Frontend)
```
VITE_API_URL=https://review-google-whatsapp-production.up.railway.app/api
VITE_SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Railway Backend (Conta 1)
```
BACKEND_URL=https://review-google-whatsapp-production.up.railway.app
EVOLUTION_API_URL=https://evolution-api-production-5961.up.railway.app
EVOLUTION_API_GLOBAL_KEY=429683C4C977415CAAFCCE10F7D50A29
SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENCRYPTION_KEY=340013285889db4348a7576ed2843f377811f7da94e8d233440266126e06be95
WEBHOOK_SECRET=wh_secret_a8f3d9c2e1b4567890abcdef12345678
NODE_ENV=production
PORT=10000
```

### Railway Evolution API (Conta 2)
```
SERVER_TYPE=https
SERVER_PORT=8080
DATABASE_PROVIDER=postgresql
DATABASE_ENABLED=true
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D50A29
```

## Status Final

✅ Backend Railway funcionando
✅ Evolution API Railway funcionando  
⏳ Frontend Netlify - aguardando redeploy com URL correta
✅ Database Supabase funcionando

Após o redeploy do Netlify, todo o sistema estará funcionando!
