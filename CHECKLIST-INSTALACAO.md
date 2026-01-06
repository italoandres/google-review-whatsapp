# ✅ Checklist de Instalação e Verificação

Use este checklist para garantir que tudo está funcionando corretamente.

## Pré-requisitos

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Projeto extraído/baixado

## Instalação Backend

- [ ] Navegou até pasta `backend`
- [ ] Executou `npm install` (sem erros)
- [ ] Arquivo `.env` existe
- [ ] Executou `npm run init-db` (mensagem de sucesso)
- [ ] Pasta `database` foi criada

## Instalação Frontend

- [ ] Navegou até pasta `frontend`
- [ ] Executou `npm install` (sem erros)
- [ ] Arquivo `.env` existe

## Teste Backend

- [ ] Executou `npm run dev` na pasta backend
- [ ] Viu mensagem "🚀 Servidor rodando na porta 3000"
- [ ] Acessou http://localhost:3000/health (deve retornar JSON)

## Teste Frontend

- [ ] Executou `npm run dev` na pasta frontend
- [ ] Viu mensagem com "Local: http://localhost:5173"
- [ ] Acessou http://localhost:5173 (página carrega)

## Teste Funcional

### Autenticação
- [ ] Página de login aparece
- [ ] Consegue criar conta
- [ ] Consegue fazer login
- [ ] Token é salvo (não pede login novamente)

### Configuração
- [ ] Tela de setup aparece no primeiro acesso
- [ ] Consegue salvar configuração
- [ ] Validação de telefone funciona
- [ ] Validação de URL funciona
- [ ] Mensagem com `{{link_google}}` é aceita

### Clientes
- [ ] Página de clientes carrega
- [ ] Consegue abrir formulário de novo cliente
- [ ] Consegue cadastrar cliente
- [ ] Cliente aparece na lista
- [ ] Status "Apto" aparece corretamente
- [ ] Cliente com "reclamou" fica "Bloqueado"

### Solicitação de Avaliação
- [ ] Botão "Pedir Avaliação" aparece para clientes aptos
- [ ] Clique no botão abre WhatsApp
- [ ] Mensagem está preenchida corretamente
- [ ] Link do Google está na mensagem
- [ ] Status muda para "Avaliação Solicitada"
- [ ] Data de solicitação é registrada

### Edição de Configuração
- [ ] Menu "Configurações" funciona
- [ ] Dados atuais são carregados
- [ ] Consegue editar e salvar
- [ ] Mensagem de sucesso aparece

### Responsividade
- [ ] Sistema funciona em tela grande (desktop)
- [ ] Sistema funciona em tela pequena (mobile)
- [ ] Menu se adapta em mobile
- [ ] Tabela de clientes rola horizontalmente em mobile

## Problemas Comuns

### ❌ Backend não inicia
**Solução:**
- Verifique se porta 3000 está livre
- Execute `npm install` novamente
- Verifique se `.env` existe

### ❌ Frontend não conecta
**Solução:**
- Certifique-se que backend está rodando
- Verifique `frontend/.env` tem `VITE_API_URL=http://localhost:3000/api`
- Limpe cache do navegador

### ❌ Erro ao cadastrar
**Solução:**
- Verifique formato do telefone: `5511999999999`
- Certifique-se que backend está rodando
- Veja console do navegador (F12) para erros

### ❌ WhatsApp não abre
**Solução:**
- Permita pop-ups no navegador
- Verifique se tem WhatsApp instalado ou WhatsApp Web aberto
- Teste o link manualmente copiando e colando

## Tudo Funcionando? 🎉

Se todos os itens estão marcados, seu sistema está pronto para uso!

## Próximos Passos

1. Personalize sua mensagem padrão
2. Cadastre seus primeiros clientes
3. Comece a solicitar avaliações
4. Monitore o histórico de solicitações

## Precisa de Ajuda?

Consulte:
- `README.md` - Documentação completa
- `GUIA-RAPIDO.md` - Guia rápido
- `COMO-OBTER-LINK-GOOGLE.md` - Como obter link do Google
- `EXEMPLOS-MENSAGENS.md` - Exemplos de mensagens
