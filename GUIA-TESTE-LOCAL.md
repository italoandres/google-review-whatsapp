# 🧪 Guia de Teste Local

## Passo a Passo

### 1. Abrir Terminal no Frontend

Abra um terminal (PowerShell ou CMD) na pasta do projeto e execute:

```bash
cd frontend
npm run dev
```

**O que vai acontecer**:
- Vite vai iniciar o servidor de desenvolvimento
- Vai mostrar algo como:
  ```
  VITE v5.4.21  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
  ```

### 2. Abrir no Navegador

Abra o navegador e acesse:

```
http://localhost:5173/login
```

**Importante**: O frontend local vai se conectar ao backend de PRODUÇÃO:
- Backend: https://google-review-whatsapp.onrender.com
- Supabase: https://cuychbunipzwfaitnbor.supabase.co
- Evolution API: https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host

Ou seja, você está testando o **frontend novo** com o **backend de produção**!

### 3. Fazer Login

1. Acesse http://localhost:5173/login
2. Faça login com suas credenciais
3. Vai redirecionar para o dashboard

### 4. Ir para Página de WhatsApp

Acesse:
```
http://localhost:5173/whatsapp-connection
```

Ou clique no menu para ir na página de conexão WhatsApp.

### 5. Testar o Fluxo Completo

#### Teste 1: Status Inicial
- ✅ Deve mostrar "Verificando status..." por 1 segundo
- ✅ Depois mostra "WhatsApp não conectado" OU "✅ Conectado"

#### Teste 2: Conectar WhatsApp
1. Clique em "Conectar WhatsApp"
2. ✅ Deve mostrar "Criando instância..."
3. ✅ Depois "Gerando QR code... (tentativa X de 10)"
4. ✅ QR code aparece
5. ✅ QR code FICA VISÍVEL (não some!)

#### Teste 3: Sair e Voltar (TESTE PRINCIPAL!)
1. Com QR code visível, abra outra aba
2. Vá para http://localhost:5173/dashboard
3. Escaneia o QR code no celular
4. Aguarde WhatsApp conectar no app
5. Volte para http://localhost:5173/whatsapp-connection
6. ✅ Deve mostrar "✅ WhatsApp conectado com sucesso!"

#### Teste 4: Verificação Automática
1. Abra o console do navegador (F12)
2. Vá na aba "Network"
3. ✅ Deve ver requisições para `/api/evolution/connection-status` a cada 5 segundos
4. Isso prova que está verificando automaticamente!

### 6. O Que Observar

**Console do navegador (F12 → Console)**:
- Não deve ter erros em vermelho
- Pode ter logs azuis (são normais)

**Network (F12 → Network)**:
- Requisições para `/api/evolution/connection-status` a cada 5s
- Status 200 (sucesso) ou 401 (não autenticado)

**Comportamento esperado**:
- ✅ Status verifica automaticamente
- ✅ QR code não some
- ✅ Detecta conexão mesmo se você sair da página
- ✅ Mostra status correto quando volta

### 7. Parar o Teste

Quando terminar de testar:

1. No terminal onde está rodando `npm run dev`
2. Aperte `Ctrl + C`
3. Confirme com `Y` se perguntar

## Problemas Comuns

### "Cannot find module"
```bash
cd frontend
npm install
npm run dev
```

### "Port 5173 already in use"
```bash
# Feche o terminal anterior ou use outra porta
npm run dev -- --port 5174
```

### "VITE_API_URL is required"
- Verifique se existe `frontend/.env`
- Deve ter: `VITE_API_URL=https://google-review-whatsapp.onrender.com/api`

## Depois do Teste

**Se funcionou**:
- Me avisa que funcionou
- Eu faço commit e deploy para produção

**Se não funcionou**:
- Me diz o que aconteceu
- Manda print ou copia o erro
- A gente corrige antes de fazer deploy

## Comandos Úteis

```bash
# Iniciar teste
cd frontend
npm run dev

# Parar teste
Ctrl + C

# Ver logs do backend (se precisar)
# (Não precisa rodar local, usa produção)

# Limpar cache (se der problema)
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

**Pronto para testar?** 🚀

Roda `cd frontend` e depois `npm run dev` e me avisa o que aconteceu!
