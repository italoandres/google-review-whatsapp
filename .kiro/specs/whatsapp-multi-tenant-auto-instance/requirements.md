# Requirements Document

## Introduction

Este documento especifica os requisitos para um sistema multi-tenant que permite criação automática de instâncias WhatsApp via Evolution API. O sistema elimina a necessidade de configuração manual, permitindo que cada usuário conecte seu próprio WhatsApp de forma self-service através de um fluxo automatizado de criação de instância, exibição de QR Code e verificação de conexão.

## Glossary

- **System**: O sistema completo de gerenciamento multi-tenant de instâncias WhatsApp
- **Backend**: Componente servidor que gerencia APIs e lógica de negócio
- **Frontend**: Interface web do usuário
- **Evolution_API**: API externa para gerenciamento de instâncias WhatsApp
- **Instance**: Instância individual do WhatsApp associada a um usuário
- **QR_Code**: Código QR usado para autenticação do WhatsApp
- **Webhook**: Endpoint HTTP que recebe eventos da Evolution API
- **User**: Usuário autenticado do sistema
- **Connection_Status**: Estado da conexão WhatsApp (disconnected, connecting, connected)
- **Instance_Name**: Identificador único da instância no formato user-{userId}
- **Global_API_Key**: Chave de autenticação com permissões administrativas na Evolution API
- **Database**: Banco de dados do sistema para persistência
- **Polling**: Verificação periódica do status de conexão
- **Rate_Limiter**: Mecanismo de controle de taxa de requisições

## Requirements

### Requirement 1: Criação Automática de Instância

**User Story:** Como usuário, eu quero que o sistema crie automaticamente uma instância WhatsApp para mim, para que eu não precise configurar manualmente.

#### Acceptance Criteria

1. WHEN um User solicita criação de instância, THE Backend SHALL gerar um Instance_Name único no formato "user-{userId}"
2. WHEN o Instance_Name é gerado, THE Backend SHALL chamar a Evolution_API para criar a Instance
3. WHEN a Evolution_API retorna sucesso, THE Backend SHALL salvar a configuração da Instance no Database
4. WHEN a Evolution_API retorna erro, THE Backend SHALL retornar mensagem de erro descritiva ao User
5. IF uma Instance já existe para o User, THEN THE Backend SHALL reutilizar a Instance existente
6. THE Backend SHALL validar que o User possui autenticação válida antes de criar Instance

### Requirement 2: Endpoint de Criação de Instância

**User Story:** Como desenvolvedor, eu quero um endpoint REST para criação de instâncias, para que o Frontend possa solicitar criação de forma padronizada.

#### Acceptance Criteria

1. THE Backend SHALL expor endpoint POST /api/evolution/create-instance
2. WHEN o endpoint recebe requisição, THE Backend SHALL validar token de autenticação do User
3. WHEN a validação falha, THE Backend SHALL retornar status HTTP 401
4. WHEN a criação é bem-sucedida, THE Backend SHALL retornar status HTTP 201 com dados da Instance
5. WHEN a criação falha, THE Backend SHALL retornar status HTTP apropriado (400, 500) com mensagem de erro
6. THE Backend SHALL registrar log detalhado de cada tentativa de criação

### Requirement 3: Obtenção de QR Code

**User Story:** Como usuário, eu quero visualizar o QR Code da minha instância WhatsApp, para que eu possa escanear e conectar meu telefone.

#### Acceptance Criteria

1. THE Backend SHALL expor endpoint GET /api/evolution/qrcode
2. WHEN o endpoint recebe requisição, THE Backend SHALL buscar o QR_Code da Instance do User na Evolution_API
3. WHEN o QR_Code está disponível, THE Backend SHALL retornar imagem em formato base64
4. IF o QR_Code expirou, THEN THE Backend SHALL solicitar novo QR_Code à Evolution_API
5. WHEN o QR_Code não está disponível, THE Backend SHALL retornar status HTTP 404
6. THE Backend SHALL validar que o User só pode acessar QR_Code da própria Instance

### Requirement 4: Verificação de Status de Conexão

**User Story:** Como usuário, eu quero saber o status da minha conexão WhatsApp em tempo real, para que eu saiba quando a conexão foi estabelecida.

#### Acceptance Criteria

1. THE Backend SHALL expor endpoint GET /api/evolution/connection-status
2. WHEN o endpoint recebe requisição, THE Backend SHALL consultar status na Evolution_API
3. THE Backend SHALL retornar Connection_Status com valores: "disconnected", "connecting" ou "connected"
4. WHEN a Evolution_API está indisponível, THE Backend SHALL retornar status "disconnected" com flag de erro
5. THE Backend SHALL responder em menos de 2 segundos
6. THE Backend SHALL validar que o User só pode verificar status da própria Instance

### Requirement 5: Configuração Automática de Webhook

**User Story:** Como desenvolvedor, eu quero que webhooks sejam configurados automaticamente, para que eventos do WhatsApp sejam recebidos sem configuração manual.

#### Acceptance Criteria

1. WHEN uma Instance é criada com sucesso, THE Backend SHALL configurar Webhook automaticamente na Evolution_API
2. THE Webhook SHALL apontar para URL {BACKEND_URL}/api/webhooks/evolution
3. THE Backend SHALL habilitar eventos de mensagens recebidas no Webhook
4. WHEN a configuração do Webhook falha, THE Backend SHALL registrar erro em log mas não falhar a criação da Instance
5. THE Backend SHALL incluir token de validação na configuração do Webhook
6. THE Backend SHALL expor endpoint POST /api/webhooks/evolution para receber eventos

### Requirement 6: Interface de Conexão no Frontend

**User Story:** Como usuário, eu quero uma interface simples para conectar meu WhatsApp, para que eu possa fazer isso sem conhecimento técnico.

#### Acceptance Criteria

1. THE Frontend SHALL exibir botão "Conectar WhatsApp" quando User não possui Instance conectada
2. WHEN o User clica no botão, THE Frontend SHALL solicitar criação de Instance ao Backend
3. WHEN o QR_Code está disponível, THE Frontend SHALL exibir a imagem do QR_Code
4. WHILE aguardando conexão, THE Frontend SHALL exibir indicador de status "Aguardando conexão"
5. WHEN a conexão é estabelecida, THE Frontend SHALL exibir mensagem "WhatsApp conectado com sucesso"
6. IF ocorre erro, THEN THE Frontend SHALL exibir mensagem de erro amigável ao User

### Requirement 7: Polling Automático de Status

**User Story:** Como usuário, eu quero que o sistema detecte automaticamente quando meu WhatsApp conecta, para que eu não precise atualizar a página manualmente.

#### Acceptance Criteria

1. WHEN o QR_Code é exibido, THE Frontend SHALL iniciar Polling do Connection_Status
2. THE Frontend SHALL verificar status a cada 3 segundos
3. WHEN Connection_Status muda para "connected", THE Frontend SHALL parar o Polling
4. WHEN o User navega para outra página, THE Frontend SHALL cancelar o Polling
5. THE Frontend SHALL limitar Polling a máximo de 60 tentativas (3 minutos)
6. WHEN o limite é atingido, THE Frontend SHALL exibir mensagem sugerindo gerar novo QR_Code

### Requirement 8: Gerenciamento de Conexão Existente

**User Story:** Como usuário, eu quero gerenciar minha conexão WhatsApp existente, para que eu possa desconectar ou reconectar quando necessário.

#### Acceptance Criteria

1. WHEN o User possui Instance conectada, THE Frontend SHALL exibir status atual da conexão
2. THE Frontend SHALL exibir botão "Desconectar WhatsApp" para Instance conectada
3. WHEN o User clica em desconectar, THE Backend SHALL remover a Instance da Evolution_API
4. THE Frontend SHALL exibir botão "Reconectar WhatsApp" para Instance desconectada
5. WHEN o User clica em reconectar, THE Frontend SHALL gerar novo QR_Code
6. THE Frontend SHALL exibir timestamp da última conexão bem-sucedida

### Requirement 9: Configuração de Variáveis de Ambiente

**User Story:** Como administrador, eu quero configurar credenciais da Evolution API via variáveis de ambiente, para que as credenciais não fiquem hardcoded no código.

#### Acceptance Criteria

1. THE Backend SHALL ler variável EVOLUTION_API_URL para URL base da Evolution_API
2. THE Backend SHALL ler variável EVOLUTION_API_GLOBAL_KEY para autenticação
3. WHEN variáveis obrigatórias não estão definidas, THE Backend SHALL falhar ao iniciar com mensagem clara
4. THE Backend SHALL validar formato da EVOLUTION_API_URL (deve ser URL válida)
5. THE Backend SHALL usar EVOLUTION_API_GLOBAL_KEY em header "apikey" nas requisições
6. THE Backend SHALL ler variável BACKEND_URL para configuração de Webhook

### Requirement 10: Segurança e Isolamento Multi-Tenant

**User Story:** Como usuário, eu quero garantia de que só posso acessar minha própria instância WhatsApp, para que meus dados estejam protegidos.

#### Acceptance Criteria

1. THE Backend SHALL validar que User autenticado só pode criar Instance para si mesmo
2. THE Backend SHALL validar que User só pode acessar QR_Code da própria Instance
3. THE Backend SHALL validar que User só pode verificar Connection_Status da própria Instance
4. THE Backend SHALL validar que User só pode desconectar própria Instance
5. THE Backend SHALL criptografar credenciais sensíveis antes de salvar no Database
6. THE Backend SHALL validar assinatura de requisições recebidas no Webhook

### Requirement 11: Rate Limiting

**User Story:** Como administrador, eu quero limitar taxa de criação de instâncias, para que o sistema não seja sobrecarregado ou abusado.

#### Acceptance Criteria

1. THE Backend SHALL implementar Rate_Limiter para endpoint de criação de Instance
2. THE Rate_Limiter SHALL permitir máximo 3 tentativas de criação por User a cada 10 minutos
3. WHEN o limite é excedido, THE Backend SHALL retornar status HTTP 429
4. THE Backend SHALL incluir header "Retry-After" na resposta 429
5. THE Rate_Limiter SHALL usar identificador do User como chave
6. THE Backend SHALL registrar tentativas que excedem rate limit em log

### Requirement 12: Tratamento de Erros - Evolution API Offline

**User Story:** Como usuário, eu quero mensagens claras quando a Evolution API está indisponível, para que eu saiba que o problema não é com minha conexão.

#### Acceptance Criteria

1. WHEN a Evolution_API não responde em 10 segundos, THE Backend SHALL considerar timeout
2. WHEN ocorre timeout, THE Backend SHALL retornar mensagem "Serviço WhatsApp temporariamente indisponível"
3. THE Backend SHALL registrar falhas de comunicação com Evolution_API em log
4. THE Frontend SHALL exibir mensagem amigável sugerindo tentar novamente em alguns minutos
5. THE Backend SHALL implementar retry com backoff exponencial (3 tentativas)
6. WHEN todas tentativas falham, THE Backend SHALL retornar erro ao Frontend

### Requirement 13: Tratamento de Erros - Instância Duplicada

**User Story:** Como usuário, eu quero que o sistema reutilize minha instância existente, para que eu não tenha problemas ao tentar conectar novamente.

#### Acceptance Criteria

1. WHEN o User solicita criação e já possui Instance no Database, THE Backend SHALL verificar status na Evolution_API
2. IF a Instance existe e está ativa na Evolution_API, THEN THE Backend SHALL retornar dados da Instance existente
3. IF a Instance existe no Database mas não na Evolution_API, THEN THE Backend SHALL criar nova Instance
4. THE Backend SHALL atualizar registro no Database com novos dados da Instance
5. THE Backend SHALL retornar status HTTP 200 (não 201) ao reutilizar Instance
6. THE Backend SHALL registrar em log quando Instance é reutilizada

### Requirement 14: Tratamento de Erros - QR Code Expirado

**User Story:** Como usuário, eu quero que o sistema gere automaticamente novo QR Code quando o anterior expira, para que eu não fique preso com código inválido.

#### Acceptance Criteria

1. WHEN o Backend detecta QR_Code expirado, THE Backend SHALL solicitar novo QR_Code à Evolution_API
2. THE Frontend SHALL detectar QR_Code expirado através de Connection_Status
3. WHEN QR_Code expira, THE Frontend SHALL exibir mensagem "QR Code expirado, gerando novo..."
4. THE Frontend SHALL automaticamente solicitar novo QR_Code ao Backend
5. THE Frontend SHALL exibir novo QR_Code sem requerer ação do User
6. THE Backend SHALL limitar geração de novos QR_Codes a 1 por minuto por User

### Requirement 15: Tratamento de Erros - Conexão Perdida

**User Story:** Como usuário, eu quero ser notificado quando minha conexão WhatsApp é perdida, para que eu possa reconectar rapidamente.

#### Acceptance Criteria

1. WHEN o Webhook recebe evento de desconexão, THE Backend SHALL atualizar Connection_Status no Database
2. THE Backend SHALL registrar timestamp da desconexão
3. WHEN o Frontend detecta mudança para "disconnected", THE Frontend SHALL exibir notificação ao User
4. THE Frontend SHALL exibir botão "Reconectar" na notificação
5. THE Backend SHALL enviar email ao User notificando desconexão (se configurado)
6. THE Frontend SHALL verificar Connection_Status ao carregar página

### Requirement 16: Logging e Auditoria

**User Story:** Como administrador, eu quero logs detalhados de operações, para que eu possa debugar problemas e auditar uso do sistema.

#### Acceptance Criteria

1. THE Backend SHALL registrar log de cada criação de Instance com userId e timestamp
2. THE Backend SHALL registrar log de cada chamada à Evolution_API com request e response
3. THE Backend SHALL registrar log de erros com stack trace completo
4. THE Backend SHALL registrar log de eventos recebidos no Webhook
5. THE Backend SHALL incluir requestId único em cada log para rastreamento
6. THE Backend SHALL usar níveis de log apropriados (info, warn, error)

### Requirement 17: Documentação de Configuração

**User Story:** Como administrador, eu quero documentação clara de como configurar o sistema, para que eu possa fazer deploy sem dificuldades.

#### Acceptance Criteria

1. THE System SHALL incluir arquivo README.md com instruções de configuração
2. THE README SHALL documentar como obter Global_API_Key da Evolution_API
3. THE README SHALL listar todas variáveis de ambiente obrigatórias
4. THE README SHALL incluir exemplos de valores para cada variável
5. THE README SHALL documentar requisitos de permissões da Global_API_Key
6. THE README SHALL incluir seção de troubleshooting com problemas comuns

### Requirement 18: Suporte a Múltiplos Usuários Simultâneos

**User Story:** Como sistema, eu preciso suportar múltiplos usuários criando instâncias simultaneamente, para que o sistema seja escalável.

#### Acceptance Criteria

1. THE Backend SHALL processar requisições de criação de Instance de forma concorrente
2. THE Backend SHALL usar transações no Database para evitar race conditions
3. WHEN dois Users criam Instance simultaneamente, THE Backend SHALL processar ambas requisições com sucesso
4. THE Backend SHALL garantir que Instance_Name é único usando constraint no Database
5. THE Backend SHALL implementar retry logic para conflitos de concorrência
6. THE Backend SHALL suportar mínimo de 10 criações simultâneas sem degradação

### Requirement 19: Validação de Webhook Signature

**User Story:** Como desenvolvedor, eu quero validar assinatura de webhooks, para que apenas eventos legítimos da Evolution API sejam processados.

#### Acceptance Criteria

1. THE Backend SHALL validar header de assinatura em requisições ao Webhook
2. WHEN a assinatura é inválida, THE Backend SHALL retornar status HTTP 401
3. WHEN a assinatura é válida, THE Backend SHALL processar evento
4. THE Backend SHALL usar algoritmo HMAC-SHA256 para validação
5. THE Backend SHALL usar secret configurado em variável de ambiente WEBHOOK_SECRET
6. THE Backend SHALL registrar tentativas de webhook com assinatura inválida

### Requirement 20: Parser de Eventos do Webhook

**User Story:** Como desenvolvedor, eu quero parser robusto de eventos do webhook, para que eventos sejam processados corretamente.

#### Acceptance Criteria

1. WHEN o Webhook recebe evento, THE Backend SHALL parsear JSON do body
2. THE Backend SHALL validar estrutura do evento contra schema esperado
3. WHEN evento é de tipo "connection.update", THE Backend SHALL atualizar Connection_Status
4. WHEN evento é de tipo "messages.upsert", THE Backend SHALL processar mensagem recebida
5. IF o parsing falha, THEN THE Backend SHALL registrar erro e retornar status HTTP 400
6. FOR ALL eventos válidos, parsing e posterior parsing SHALL produzir estrutura equivalente (round-trip property)

### Requirement 21: Pretty Printer de Eventos

**User Story:** Como desenvolvedor, eu quero formatar eventos para logs, para que seja fácil debugar problemas.

#### Acceptance Criteria

1. THE Backend SHALL implementar Pretty_Printer para eventos do Webhook
2. THE Pretty_Printer SHALL formatar eventos em JSON legível com indentação
3. THE Pretty_Printer SHALL omitir campos sensíveis (tokens, keys) dos logs
4. THE Backend SHALL usar Pretty_Printer ao registrar eventos em log
5. THE Pretty_Printer SHALL truncar payloads grandes (>1KB) com indicador
6. THE Pretty_Printer SHALL preservar estrutura original do evento

### Requirement 22: Cleanup de Instâncias Inativas

**User Story:** Como administrador, eu quero que instâncias inativas sejam identificadas, para que eu possa gerenciar recursos da Evolution API.

#### Acceptance Criteria

1. THE Backend SHALL registrar timestamp de última atividade de cada Instance
2. THE Backend SHALL expor endpoint GET /api/admin/inactive-instances
3. THE Backend SHALL considerar Instance inativa após 30 dias sem atividade
4. WHEN endpoint é chamado, THE Backend SHALL retornar lista de Instance inativas
5. THE Backend SHALL incluir userId e dias de inatividade para cada Instance
6. THE Backend SHALL requerer autenticação de administrador para acessar endpoint

### Requirement 23: Monitoramento de Conexões Ativas

**User Story:** Como administrador, eu quero visualizar conexões ativas, para que eu possa monitorar uso do sistema.

#### Acceptance Criteria

1. THE Backend SHALL expor endpoint GET /api/admin/active-connections
2. WHEN endpoint é chamado, THE Backend SHALL retornar contagem de Instance conectadas
3. THE Backend SHALL retornar lista de userId com Instance conectadas
4. THE Backend SHALL incluir timestamp de última conexão para cada Instance
5. THE Backend SHALL requerer autenticação de administrador para acessar endpoint
6. THE Backend SHALL responder em menos de 1 segundo

### Requirement 24: Troca de Número WhatsApp

**User Story:** Como usuário, eu quero poder trocar o número WhatsApp conectado, para que eu possa usar número diferente quando necessário.

#### Acceptance Criteria

1. THE Frontend SHALL exibir botão "Trocar Número" para Instance conectada
2. WHEN o User clica em trocar número, THE Frontend SHALL confirmar ação com modal
3. WHEN confirmado, THE Backend SHALL desconectar Instance atual
4. THE Backend SHALL limpar dados da Instance anterior no Database
5. THE Backend SHALL permitir User criar nova Instance imediatamente
6. THE Backend SHALL registrar histórico de trocas de número no Database

### Requirement 25: Histórico de Conexões

**User Story:** Como usuário, eu quero ver histórico das minhas conexões WhatsApp, para que eu possa rastrear quando conectei e desconectei.

#### Acceptance Criteria

1. THE Backend SHALL registrar cada evento de conexão e desconexão no Database
2. THE Backend SHALL expor endpoint GET /api/evolution/connection-history
3. WHEN endpoint é chamado, THE Backend SHALL retornar últimas 10 entradas do histórico
4. THE Backend SHALL incluir timestamp, tipo de evento (connect/disconnect) e status
5. THE Frontend SHALL exibir histórico em formato de timeline
6. THE Backend SHALL validar que User só pode acessar próprio histórico
