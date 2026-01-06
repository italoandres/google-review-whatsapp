# 🔧 Guia de Correção de Erros

## Erros Corrigidos

Fiz correções no código para resolver os problemas de:
1. ❌ Erro ao criar conta/fazer login
2. ❌ Erro ao cadastrar cliente

## Como Aplicar as Correções

### Passo 1: Parar o Sistema

Se o sistema estiver rodando:
1. Feche as 2 janelas de terminal que estão abertas
2. Ou pressione `Ctrl + C` em cada terminal

### Passo 2: Limpar o Banco de Dados Antigo

```bash
# No Windows (Prompt de Comando)
cd backend
del database\app.db

# Ou manualmente:
# Vá na pasta backend/database e delete o arquivo app.db
```

### Passo 3: Reinicializar o Banco

```bash
cd backend
npm run init-db
```

Você deve ver: "✅ Banco de dados inicializado com sucesso"

### Passo 4: Testar o Banco (Opcional)

```bash
cd backend
node test-db.js
```

Você deve ver:
- ✅ Conectado ao banco
- ✅ Tabelas encontradas: users, business, clients
- ✅ Usuário inserido com ID: 1
- ✅ Usuário encontrado

### Passo 5: Reiniciar o Sistema

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Ou use o `start.bat` se estiver no Windows.

## Testando as Correções

### Teste 1: Criar Conta

1. Acesse: http://localhost:5173
2. Clique em "Criar conta"
3. Email: `teste@teste.com`
4. Senha: `123456`
5. Clique em "Criar Conta"

**Resultado esperado:** Você deve ser redirecionado para a tela de configuração.

### Teste 2: Fazer Login

1. Faça logout (botão "Sair")
2. Email: `teste@teste.com`
3. Senha: `123456`
4. Clique em "Entrar"

**Resultado esperado:** Você deve entrar no sistema.

### Teste 3: Configurar Negócio

1. Nome do Negócio: `Meu Negócio Teste`
2. WhatsApp: `5511999999999`
3. Link Google: `https://g.page/r/teste/review`
4. Mensagem: (deixe a padrão)
5. Clique em "Salvar e Continuar"

**Resultado esperado:** Você deve ser redirecionado para a tela de clientes.

### Teste 4: Cadastrar Cliente

1. Clique em "+ Novo Cliente"
2. Nome: `João Silva`
3. Telefone: `5511988887777`
4. Marque "Cliente satisfeito"
5. Clique em "Cadastrar Cliente"

**Resultado esperado:** Cliente deve aparecer na lista com status "Apto".

## Se Ainda Houver Erros

### Verificar Logs do Backend

No terminal do backend, procure por mensagens de erro em vermelho.

Erros comuns:
- `SQLITE_ERROR`: Problema com o banco de dados
- `EADDRINUSE`: Porta 3000 já está em uso
- `Cannot find module`: Falta instalar dependências

### Verificar Logs do Frontend

No navegador:
1. Pressione `F12` para abrir o Console
2. Vá na aba "Console"
3. Procure por erros em vermelho

### Reinstalar Dependências

Se nada funcionar:

```bash
# Backend
cd backend
rmdir /s /q node_modules
del package-lock.json
npm install

# Frontend
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```

## Detalhes Técnicos das Correções

### 1. Conexão com Banco de Dados

**Problema:** A promisificação do SQLite não estava capturando o `lastID` corretamente.

**Solução:** Reescrevi as funções `dbRun`, `dbGet` e `dbAll` manualmente com Promises nativas.

### 2. Tipos Booleanos

**Problema:** SQLite armazena booleanos como 0/1, mas JavaScript espera true/false.

**Solução:** Adicionei conversão explícita de booleanos ao buscar clientes do banco.

### 3. Logs de Erro

**Melhoria:** Adicionei logs detalhados para facilitar debug de problemas futuros.

## Precisa de Mais Ajuda?

Se os erros persistirem:

1. Copie a mensagem de erro completa
2. Copie os logs do terminal do backend
3. Tire um print da tela
4. Entre em contato com suporte

## Checklist de Verificação

- [ ] Parei o sistema
- [ ] Deletei o banco antigo (app.db)
- [ ] Executei `npm run init-db`
- [ ] Testei com `node test-db.js`
- [ ] Reiniciei o sistema
- [ ] Consegui criar conta
- [ ] Consegui fazer login
- [ ] Consegui configurar negócio
- [ ] Consegui cadastrar cliente

Se todos os itens estão marcados, o sistema está funcionando! ✅
