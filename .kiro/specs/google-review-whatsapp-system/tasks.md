# Implementation Plan: Sistema de Solicitação de Avaliações Google via WhatsApp

## Overview

Este plano detalha a implementação incremental do sistema web MVP para solicitação de avaliações do Google via WhatsApp. A implementação seguirá uma abordagem bottom-up, começando pela infraestrutura (banco de dados e backend), seguida pela lógica de negócio, e finalizando com o frontend e integração.

Cada tarefa é projetada para ser executada por um agente de geração de código, construindo sobre as tarefas anteriores de forma incremental, sem deixar código órfão ou não integrado.

## Tasks

- [x] 1. Configurar estrutura do projeto e dependências
  - Criar estrutura de pastas (backend/, frontend/, database/)
  - Inicializar package.json para backend e frontend
  - Instalar dependências: Express, SQLite3, bcrypt, jsonwebtoken, cors (backend)
  - Instalar dependências: React, TypeScript, axios, react-router-dom (frontend)
  - Criar arquivo .gitignore
  - Criar README.md com instruções de instalação
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 2. Implementar camada de banco de dados
  - [x] 2.1 Criar schema SQLite e módulo de conexão
    - Criar arquivo database/schema.sql com tabelas users, business, clients
    - Implementar database/connection.ts para gerenciar conexão SQLite
    - Implementar função de inicialização do banco
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 2.2 Escrever testes de propriedade para persistência
    - **Property 22: Dados de autenticação persistem**
    - **Property 23: Dados de clientes persistem**
    - **Property 24: Todos os dados persistem após reinicialização**
    - **Validates: Requirements 8.1, 8.3, 8.5**

- [ ] 3. Implementar módulo de validação
  - [x] 3.1 Criar validadores de entrada
    - Implementar validators/phone.ts para validação de telefone (DDI + DDD + número)
    - Implementar validators/url.ts para validação de URL
    - Implementar validators/message.ts para validação de mensagem com {{link_google}}
    - Implementar validators/required.ts para campos obrigatórios
    - _Requirements: 3.7, 9.1, 9.2, 9.3, 9.4_

  - [ ] 3.2 Escrever testes de propriedade para validadores
    - **Property 11: Telefone inválido é rejeitado**
    - **Property 25: URL inválida é rejeitada**
    - **Property 26: Campos obrigatórios vazios impedem salvamento**
    - **Property 27: Mensagem sem variável gera aviso**
    - **Validates: Requirements 3.7, 9.1, 9.2, 9.3, 9.4**

  - [ ] 3.3 Escrever testes unitários para validadores
    - Testar telefone brasileiro válido
    - Testar telefone sem DDD
    - Testar URL válida e inválida
    - Testar mensagem com e sem variável
    - _Requirements: 3.7, 9.1, 9.2, 9.4_

- [ ] 4. Implementar autenticação e autorização
  - [x] 4.1 Criar módulo de autenticação
    - Implementar auth/hash.ts com funções de hash de senha usando bcrypt
    - Implementar auth/jwt.ts com funções de geração e verificação de JWT
    - Implementar middleware/auth.ts para proteção de rotas
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.2 Implementar rotas de autenticação
    - Criar routes/auth.ts com POST /api/auth/register
    - Implementar POST /api/auth/login
    - Integrar validação de email e senha
    - _Requirements: 1.1, 1.2_

  - [ ] 4.3 Escrever testes de propriedade para autenticação
    - **Property 1: Autenticação com credenciais válidas concede acesso**
    - **Property 2: Autenticação com credenciais inválidas rejeita acesso**
    - **Property 3: Sessão persiste até logout**
    - **Property 4: Usuários não autenticados são redirecionados**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [ ] 4.4 Escrever testes unitários para autenticação
    - Testar login com credenciais válidas
    - Testar login com email inválido
    - Testar login com senha inválida
    - Testar registro com email duplicado
    - _Requirements: 1.1, 1.2_

- [ ] 5. Checkpoint - Verificar infraestrutura básica
  - Garantir que todos os testes passam
  - Verificar que banco de dados é criado corretamente
  - Verificar que autenticação funciona
  - Perguntar ao usuário se há dúvidas

- [ ] 6. Implementar lógica de negócio - Configuração
  - [x] 6.1 Criar modelo e rotas de Business
    - Implementar models/business.ts com funções CRUD
    - Criar routes/business.ts com GET/POST/PUT /api/business/config
    - Integrar validadores de telefone, URL e mensagem
    - Aplicar middleware de autenticação
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 6.2 Escrever testes de propriedade para configuração
    - **Property 5: Configuração aceita dados válidos**
    - **Property 6: Configuração round-trip preserva dados**
    - **Property 20: Edição de configuração aceita novos valores válidos**
    - **Property 21: Configuração atualizada é aplicada imediatamente**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 7.2, 7.3, 7.4, 7.5, 7.6**

  - [ ] 6.3 Escrever testes unitários para configuração
    - Testar criação de configuração inicial
    - Testar atualização de configuração existente
    - Testar busca de configuração inexistente
    - _Requirements: 2.6, 7.2, 7.3, 7.4, 7.5_

- [ ] 7. Implementar lógica de negócio - Clientes
  - [x] 7.1 Criar modelo e rotas de Client
    - Implementar models/client.ts com funções CRUD
    - Implementar lógica de cálculo de status (apto/bloqueado/solicitado)
    - Criar routes/clients.ts com GET/POST /api/clients
    - Integrar validador de telefone
    - Aplicar middleware de autenticação
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3_

  - [ ] 7.2 Escrever testes de propriedade para clientes
    - **Property 7: Cliente com telefone válido é aceito**
    - **Property 8: Data de atendimento é registrada automaticamente**
    - **Property 9: Cliente reclamou resulta em status bloqueado**
    - **Property 10: Cliente satisfeito sem reclamação resulta em status apto**
    - **Property 12: Todos os clientes cadastrados aparecem na lista**
    - **Property 13: Lista de clientes contém campos obrigatórios**
    - **Property 14: Status do cliente é válido**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.6, 4.1, 4.2, 4.3**

  - [ ] 7.3 Escrever testes unitários para clientes
    - Testar cadastro com nome e telefone
    - Testar cadastro apenas com telefone
    - Testar cliente com reclamação tem status bloqueado
    - Testar cliente satisfeito tem status apto
    - _Requirements: 3.1, 3.5, 3.6_

- [ ] 8. Implementar gerador de links WhatsApp
  - [x] 8.1 Criar módulo de geração de links wa.me
    - Implementar utils/waLinkGenerator.ts
    - Implementar função para substituir {{link_google}} na mensagem
    - Implementar função para codificar mensagem para URL
    - Implementar função para gerar link wa.me completo
    - _Requirements: 5.1, 5.2_

  - [x] 8.2 Criar rota de solicitação de avaliação
    - Implementar POST /api/clients/:id/request-review
    - Integrar gerador de links wa.me
    - Atualizar status do cliente para "solicitado"
    - Registrar data de solicitação
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 6.1_

  - [ ] 8.3 Escrever testes de propriedade para gerador de links
    - **Property 15: Link wa.me contém telefone do cliente**
    - **Property 16: Substituição de variável no link wa.me**
    - **Property 17: Solicitação atualiza status para solicitado**
    - **Property 18: Solicitação registra data**
    - **Property 19: Data de solicitação persiste**
    - **Validates: Requirements 5.1, 5.2, 5.6, 5.7, 6.1, 6.2**

  - [ ] 8.4 Escrever testes unitários para gerador de links
    - Testar formato do link wa.me
    - Testar codificação de mensagem para URL
    - Testar substituição de variável
    - _Requirements: 5.1, 5.2_

- [x] 9. Configurar servidor Express
  - Criar server.ts com configuração do Express
  - Configurar CORS para permitir requisições do frontend
  - Configurar middleware de parsing JSON
  - Registrar todas as rotas (auth, business, clients)
  - Configurar tratamento de erros global
  - Inicializar banco de dados na inicialização
  - _Requirements: 1.1, 1.2, 2.2, 3.1, 4.1, 5.1_

- [ ] 10. Checkpoint - Verificar backend completo
  - Garantir que todos os testes passam
  - Testar todas as rotas manualmente com Postman ou similar
  - Verificar tratamento de erros
  - Perguntar ao usuário se há dúvidas

- [ ] 11. Implementar frontend - Configuração inicial
  - [x] 11.1 Configurar projeto React com TypeScript
    - Criar projeto React com Vite
    - Configurar TypeScript
    - Instalar e configurar React Router
    - Instalar axios para requisições HTTP
    - Criar estrutura de pastas (components/, pages/, services/, types/)
    - _Requirements: 10.1, 10.3_

  - [x] 11.2 Criar serviço de API
    - Implementar services/api.ts com configuração do axios
    - Implementar interceptor para adicionar token JWT
    - Implementar funções para todas as rotas do backend
    - _Requirements: 1.3, 1.4_

  - [x] 11.3 Criar tipos TypeScript
    - Definir interfaces em types/index.ts (User, Business, Client, etc.)
    - Garantir consistência com modelos do backend
    - _Requirements: 2.2, 3.1, 4.1_

- [ ] 12. Implementar frontend - Autenticação
  - [x] 12.1 Criar página de login
    - Implementar pages/LoginPage.tsx
    - Criar formulário com email e senha
    - Implementar validação de campos
    - Implementar chamada à API de login
    - Armazenar token JWT no localStorage
    - Redirecionar para página principal após login
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 12.2 Criar componente de rota protegida
    - Implementar components/ProtectedRoute.tsx
    - Verificar presença de token JWT
    - Redirecionar para login se não autenticado
    - _Requirements: 1.4_

  - [ ] 12.3 Escrever testes unitários para LoginPage
    - Testar renderização do formulário
    - Testar validação de campos
    - Testar chamada à API
    - _Requirements: 1.1, 1.2_

- [ ] 13. Implementar frontend - Configuração do negócio
  - [x] 13.1 Criar página de setup inicial
    - Implementar pages/SetupPage.tsx
    - Criar formulário com todos os campos de configuração
    - Implementar validação de campos (telefone, URL, mensagem)
    - Implementar chamada à API para salvar configuração
    - Redirecionar para página de clientes após salvar
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 13.2 Criar página de edição de configuração
    - Implementar pages/ConfigPage.tsx
    - Reutilizar lógica do SetupPage
    - Carregar configuração atual da API
    - Permitir edição e salvamento
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 13.3 Escrever testes unitários para páginas de configuração
    - Testar renderização do formulário
    - Testar validação de campos
    - Testar salvamento de configuração
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 7.2, 7.3, 7.4, 7.5_

- [ ] 14. Implementar frontend - Gerenciamento de clientes
  - [x] 14.1 Criar página de listagem de clientes
    - Implementar pages/ClientsPage.tsx
    - Carregar lista de clientes da API
    - Exibir tabela com nome, telefone, data, status
    - Implementar botão "Pedir Avaliação" condicional (apenas para status "apto")
    - Exibir data de solicitação para clientes com status "solicitado"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.3_

  - [x] 14.2 Criar formulário de cadastro de cliente
    - Implementar components/AddClientForm.tsx
    - Criar formulário com nome (opcional), telefone (obrigatório), checkboxes
    - Implementar validação de telefone
    - Implementar lógica de checkboxes (satisfeito/reclamou)
    - Implementar chamada à API para cadastrar cliente
    - Atualizar lista após cadastro
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 14.3 Implementar funcionalidade de solicitar avaliação
    - Implementar função handleRequestReview em ClientsPage
    - Chamar API para gerar link wa.me
    - Abrir link wa.me em nova aba (window.open)
    - Atualizar lista de clientes após solicitação
    - _Requirements: 5.1, 5.2, 5.6, 5.7_

  - [ ] 14.4 Escrever testes unitários para componentes de cliente
    - Testar renderização da lista
    - Testar renderização do formulário
    - Testar validação de campos
    - Testar exibição condicional do botão
    - _Requirements: 3.1, 4.1, 4.4, 4.5_

- [ ] 15. Implementar frontend - Navegação e layout
  - [x] 15.1 Criar componente de layout
    - Implementar components/Layout.tsx com header e navegação
    - Adicionar links para Clientes e Configurações
    - Adicionar botão de logout
    - _Requirements: 7.1, 10.1_

  - [x] 15.2 Configurar rotas da aplicação
    - Implementar App.tsx com React Router
    - Definir rotas: /login, /setup, /clients, /config
    - Aplicar ProtectedRoute para rotas autenticadas
    - Implementar lógica de redirecionamento (primeiro acesso → setup)
    - _Requirements: 1.4, 2.1, 7.1_

  - [x] 15.3 Adicionar estilos básicos
    - Criar arquivo CSS global com estilos simples e limpos
    - Garantir responsividade para mobile
    - Aplicar feedback visual para ações (loading, sucesso, erro)
    - _Requirements: 10.1, 10.4, 10.5_

- [ ] 16. Checkpoint - Verificar integração frontend-backend
  - Garantir que todos os testes passam
  - Testar fluxo completo: login → setup → cadastro → solicitação
  - Verificar responsividade em diferentes tamanhos de tela
  - Verificar tratamento de erros no frontend
  - Perguntar ao usuário se há dúvidas

- [ ] 17. Implementar tratamento de erros no frontend
  - Criar components/ErrorMessage.tsx para exibir erros
  - Implementar tratamento de erros de rede
  - Implementar tratamento de erros de validação
  - Implementar tratamento de erros de autenticação (redirecionar para login)
  - Adicionar feedback visual para todas as ações
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.5_

- [ ] 18. Criar documentação e scripts
  - [ ] 18.1 Atualizar README.md
    - Adicionar descrição do projeto
    - Adicionar instruções de instalação
    - Adicionar instruções para rodar backend
    - Adicionar instruções para rodar frontend
    - Adicionar instruções para rodar testes
    - Adicionar informações sobre estrutura do projeto
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 18.2 Criar scripts de desenvolvimento
    - Adicionar script para inicializar banco de dados
    - Adicionar script para rodar backend em modo dev
    - Adicionar script para rodar frontend em modo dev
    - Adicionar script para rodar todos os testes
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 19. Testes de integração end-to-end
  - Implementar teste de fluxo completo: registro → login → setup → cadastro cliente → solicitar avaliação
  - Implementar teste de edição de configuração e verificação em novo link
  - Implementar teste de persistência após reinicialização
  - _Requirements: 1.1, 2.6, 3.1, 5.1, 7.6, 8.5_

- [ ] 20. Checkpoint final - Revisão completa
  - Garantir que todos os testes passam
  - Testar sistema completo manualmente
  - Verificar que não há código órfão ou não integrado
  - Verificar que README está completo e correto
  - Verificar que todas as funcionalidades obrigatórias estão implementadas
  - Perguntar ao usuário se há ajustes necessários

## Notes

- Todas as tarefas são obrigatórias para uma implementação completa
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam correção universal
- Testes unitários validam exemplos específicos e casos extremos
- A implementação segue ordem bottom-up: infraestrutura → lógica → interface
- Nenhum código fica órfão - cada tarefa integra com as anteriores
