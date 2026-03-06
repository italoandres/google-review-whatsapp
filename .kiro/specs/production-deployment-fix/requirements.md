# Requirements Document

## Introduction

Este documento especifica os requisitos para corrigir e configurar o deployment completo do sistema de avaliações Google + WhatsApp em produção. O sistema já possui código implementado e serviços deployados, mas está com problemas de conectividade ao banco de dados Supabase e falta de configuração final da Evolution API.

## Glossary

- **System**: O sistema completo de avaliações Google + WhatsApp
- **Backend**: Aplicação Node.js/Express deployada no Render
- **Frontend**: Aplicação React deployada no Netlify
- **Supabase**: Serviço de banco de dados PostgreSQL gerenciado
- **Evolution_API**: Serviço de integração WhatsApp deployado no Easypanel
- **Instance**: Instância de conexão WhatsApp na Evolution API
- **Webhook**: Endpoint HTTP que recebe eventos da Evolution API
- **Environment_Variables**: Variáveis de configuração dos serviços
- **ENCRYPTION_KEY**: Chave criptográfica para proteger dados sensíveis
- **QR_Code**: Código QR para autenticação do WhatsApp
- **Auto_Import**: Funcionalidade de importação automática de clientes via WhatsApp

## Requirements

### Requirement 1: Verificar e Corrigir Conectividade do Supabase

**User Story:** Como administrador do sistema, eu quero verificar e corrigir a URL do Supabase, para que o sistema possa conectar ao banco de dados em produção.

#### Acceptance Criteria

1. THE System SHALL identificar se o projeto Supabase existe ou foi deletado
2. IF o projeto foi deletado, THEN THE System SHALL fornecer instruções para criar novo projeto Supabase
3. WHEN um projeto Supabase válido existe, THE System SHALL validar que a URL responde corretamente
4. THE System SHALL validar que as credenciais (anon key e service role key) estão corretas
5. WHEN a URL do Supabase é alterada, THE System SHALL documentar a nova URL para atualização nos serviços

### Requirement 2: Aplicar Schema do Banco de Dados

**User Story:** Como administrador do sistema, eu quero garantir que o schema do banco de dados está correto, para que todas as funcionalidades do sistema operem adequadamente.

#### Acceptance Criteria

1. THE System SHALL aplicar o schema principal (tabelas users, businesses, clients, messages)
2. THE System SHALL aplicar a migration da Evolution API (tabela evolution_config)
3. WHEN o schema é aplicado, THE System SHALL validar que todas as tabelas foram criadas
4. THE System SHALL validar que todos os índices e constraints estão presentes
5. WHEN o schema já existe, THE System SHALL detectar e evitar duplicação

### Requirement 3: Gerar Chave de Criptografia

**User Story:** Como administrador do sistema, eu quero gerar uma ENCRYPTION_KEY segura, para que dados sensíveis sejam protegidos adequadamente.

#### Acceptance Criteria

1. THE System SHALL gerar uma chave de 32 bytes em formato hexadecimal
2. THE System SHALL validar que a chave tem exatamente 64 caracteres hexadecimais
3. THE System SHALL fornecer instruções claras de como usar a chave gerada
4. THE System SHALL alertar que a chave deve ser mantida em segredo
5. THE System SHALL documentar onde a chave deve ser configurada

### Requirement 4: Configurar Variáveis de Ambiente do Backend

**User Story:** Como administrador do sistema, eu quero atualizar as variáveis de ambiente do backend no Render, para que o backend conecte corretamente ao Supabase e Evolution API.

#### Acceptance Criteria

1. THE System SHALL fornecer lista completa de variáveis necessárias (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY, EVOLUTION_API_URL, EVOLUTION_API_KEY, JWT_SECRET, PORT, NODE_ENV)
2. WHEN variáveis são atualizadas, THE System SHALL instruir redeploy do serviço
3. THE System SHALL validar formato correto de cada variável
4. THE System SHALL fornecer valores de exemplo quando aplicável
5. THE System SHALL documentar onde encontrar cada valor necessário

### Requirement 5: Configurar Variáveis de Ambiente do Frontend

**User Story:** Como administrador do sistema, eu quero atualizar as variáveis de ambiente do frontend no Netlify, para que o frontend conecte corretamente ao backend e Supabase.

#### Acceptance Criteria

1. THE System SHALL fornecer lista completa de variáveis necessárias (VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
2. WHEN variáveis são atualizadas, THE System SHALL instruir redeploy do site
3. THE System SHALL validar que VITE_API_URL aponta para o backend correto
4. THE System SHALL validar que as credenciais Supabase correspondem ao projeto correto
5. THE System SHALL fornecer instruções passo-a-passo para configuração no Netlify

### Requirement 6: Criar e Configurar Instância na Evolution API

**User Story:** Como administrador do sistema, eu quero criar uma instância na Evolution API e conectar ao WhatsApp, para que o sistema possa receber mensagens.

#### Acceptance Criteria

1. WHEN uma requisição de criação é enviada, THE Evolution_API SHALL criar uma nova instância
2. THE Evolution_API SHALL retornar um QR Code para autenticação
3. WHEN o QR Code é escaneado, THE Evolution_API SHALL confirmar conexão bem-sucedida
4. THE System SHALL validar que a instância está com status "open"
5. THE System SHALL armazenar o nome da instância para uso posterior

### Requirement 7: Configurar Webhook da Evolution API

**User Story:** Como administrador do sistema, eu quero configurar o webhook da Evolution API, para que mensagens recebidas sejam processadas pelo backend.

#### Acceptance Criteria

1. THE System SHALL configurar webhook apontando para {BACKEND_URL}/api/evolution/webhook
2. THE System SHALL habilitar eventos de mensagens (messages.upsert)
3. WHEN o webhook é configurado, THE Evolution_API SHALL enviar eventos para o endpoint
4. THE Backend SHALL validar assinatura dos eventos recebidos
5. THE Backend SHALL processar mensagens e importar clientes automaticamente

### Requirement 8: Validar Integração Completa

**User Story:** Como administrador do sistema, eu quero validar que toda a integração está funcionando, para que o sistema opere corretamente em produção.

#### Acceptance Criteria

1. THE System SHALL validar que o frontend carrega sem erros
2. THE System SHALL validar que login funciona corretamente
3. THE System SHALL validar que é possível criar/editar clientes manualmente
4. WHEN uma mensagem é recebida no WhatsApp, THE System SHALL importar o cliente automaticamente
5. THE System SHALL validar que mensagens podem ser enviadas via interface
6. THE System SHALL validar que métricas do dashboard são exibidas corretamente
7. THE System SHALL validar que a configuração da Evolution API é salva e carregada corretamente

### Requirement 9: Documentar Configuração de Produção

**User Story:** Como administrador do sistema, eu quero ter documentação completa da configuração, para que possa replicar ou corrigir problemas futuros.

#### Acceptance Criteria

1. THE System SHALL documentar todas as URLs dos serviços (Frontend, Backend, Supabase, Evolution API)
2. THE System SHALL documentar todas as variáveis de ambiente configuradas (sem expor valores sensíveis)
3. THE System SHALL documentar o processo de criação da instância WhatsApp
4. THE System SHALL documentar como verificar logs de cada serviço
5. THE System SHALL documentar troubleshooting comum (webhook não recebe eventos, erro de conexão, etc)

### Requirement 10: Implementar Verificação de Saúde dos Serviços

**User Story:** Como administrador do sistema, eu quero verificar rapidamente a saúde de todos os serviços, para que possa identificar problemas rapidamente.

#### Acceptance Criteria

1. THE Backend SHALL expor endpoint /health que retorna status de conexão ao Supabase
2. THE Backend SHALL expor endpoint /api/evolution/status que retorna status da Evolution API
3. WHEN um serviço está indisponível, THE System SHALL retornar erro descritivo
4. THE Frontend SHALL exibir indicadores visuais de conectividade
5. THE System SHALL validar conectividade ao iniciar
