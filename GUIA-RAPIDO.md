# 🚀 Guia Rápido - Sistema de Avaliações Google

## Instalação (Apenas 1 vez)

### Windows
1. Duplo-clique em `install.bat`
2. Aguarde a instalação (5-10 minutos)
3. Pronto!

### Mac/Linux
```bash
cd backend && npm install && npm run init-db
cd ../frontend && npm install
```

## Iniciar o Sistema

### Windows
1. Duplo-clique em `start.bat`
2. Aguarde alguns segundos
3. Acesse: http://localhost:5173

### Mac/Linux
Terminal 1:
```bash
cd backend && npm run dev
```

Terminal 2:
```bash
cd frontend && npm run dev
```

Acesse: http://localhost:5173

## Primeiro Uso

### 1. Criar Conta
- Email: seu@email.com
- Senha: mínimo 6 caracteres

### 2. Configurar Negócio
- **Nome**: Nome da sua empresa
- **WhatsApp**: `5511999999999` (55 + DDD + número)
- **Link Google**: Cole o link do Google My Business
- **Mensagem**: Personalize (mantenha `{{link_google}}`)

### 3. Cadastrar Cliente
- Nome (opcional)
- Telefone: `5511999999999`
- ✅ Cliente satisfeito
- ❌ Cliente reclamou (bloqueia avaliação)

### 4. Solicitar Avaliação
1. Clique em "📱 Pedir Avaliação"
2. WhatsApp abre automaticamente
3. **Você envia manualmente** (clique em Enviar no WhatsApp)

## Dicas

✅ **Formato do telefone**: Sempre use `55` + DDD + número
✅ **Link do Google**: Pegue em Google My Business → "Obter mais avaliações"
✅ **Mensagem**: Use `{{link_google}}` para incluir o link automaticamente
✅ **Cliente reclamou**: Marca como "Bloqueado" - não pode receber solicitação

## Problemas?

### Backend não inicia
- Porta 3000 ocupada? Feche outros programas
- Executou `npm install`? Execute novamente

### Frontend não conecta
- Backend está rodando?
- Verifique: http://localhost:3000/health

### Telefone inválido
- Use formato: `5511999999999`
- Não use espaços, parênteses ou traços

### WhatsApp não abre
- Tem WhatsApp instalado?
- Navegador bloqueou pop-up? Permita pop-ups

## Suporte

Dúvidas? Verifique o arquivo `README.md` completo.
