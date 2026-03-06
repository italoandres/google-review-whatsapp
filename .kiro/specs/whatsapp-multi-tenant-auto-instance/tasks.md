# Implementation Plan: Sistema Multi-Tenant de Criação Automática de Instâncias WhatsApp

## Overview

Este plano de implementação detalha as tarefas necessárias para construir um sistema multi-tenant que automatiza a criação e gerenciamento de instâncias WhatsApp através da Evolution API. O sistema permite que cada usuário conecte seu próprio WhatsApp de forma self-service através de um fluxo automatizado de criação de instância, exibição de QR Code e verificação de conexão.

A implementação seguirá uma abordagem incremental, construindo primeiro a infraestrutura base (banco de dados, modelos, utilitários), depois a integração com Evolution API, seguida pelos endpoints REST, e finalmente a interface do usuário.

## Tasks

- [x] 1. Setup de infraestrutura e banco de dados
  - Criar migrations para tabelas do sistema multi-tenant
  - Configurar variáveis de ambiente necessárias
  - Implementar validação de configuração na inicialização
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 25.1_

- [x] 2. Implementar camada de utilitários e segurança
  - [x] 2.1 Implementar módulo de criptografia
    - Criar funções de encrypt/decrypt usando AES-256
    - Implementar geração segura de chaves
    - _Requirements: 10.5_
  
  - [x]* 2.2 Escrever property test para criptografia
    - **Property 24: Credential Encryption Round-Trip**
    - **Validates: Requirements 10.5**
  
  - [x] 2.3 Implementar validador de assinatura de webhook
    - Criar função de validação HMAC-SHA256
    - Implementar geração de assinatura para testes
    - _Requirements: 10.6, 19.1, 19.4_
  
  - [x]* 2.4 Escrever property test para validação de webhook
    - **Property 13: Webhook Signature Validation**
    - **Validates: Requirements 10.6, 19.1, 19.2**
  
  - [x] 2.5 Implementar rate limiter
    - Criar classe RateLimiter com controle por usuário
    - Implementar lógica de janela deslizante
    - Adicionar suporte a diferentes limites por endpoint
    - _Requirements: 11.2, 11.3, 11.4, 11.5_
  
  - [x]* 2.6 Escrever testes unitários para rate limiter
    - Testar limite exato no threshold
    - Testar reset de janela
    - Testar isolamento entre usuários
    - _Requirements: 11.2, 11.5_

- [x] 3. Implementar models e acesso ao banco de dados
  - [x] 3.1 Criar model WhatsAppInstance
    - Implementar CRUD operations
    - Adicionar métodos de busca por userId e instanceName
    - Implementar criptografia de API keys
    - _Requirements: 1.3, 10.5_
  
  - [x]* 3.2 Escrever testes unitários para WhatsAppInstance model
    - Testar criação e persistência
    - Testar criptografia de API keys
    - Testar queries por userId
    - _Requirements: 1.3, 10.5_
  
  - [x] 3.3 Criar model ConnectionHistory
    - Implementar inserção de eventos
    - Adicionar query para histórico por userId
    - Implementar paginação
    - _Requirements: 25.1, 25.2, 25.4_
  
  - [x]* 3.4 Escrever property test para histórico de conexões
    - **Property 35: Connection History Recording**
    - **Validates: Requirements 25.1, 25.4**
  
  - [x] 3.5 Criar model WebhookLog
    - Implementar logging de eventos de webhook
    - Adicionar índices para queries eficientes
    - _Requirements: 16.4_
  
  - [x] 3.6 Criar model RateLimitRecord
    - Implementar persistência de contadores
    - Adicionar cleanup de registros expirados
    - _Requirements: 11.1, 11.5_

- [x] 4. Implementar Evolution API Client
  - [ ] 4.1 Criar classe EvolutionAPIClient
    - Implementar método createInstance
    - Implementar método getQRCode
    - Implementar método getConnectionState
    - Implementar método deleteInstance
    - Implementar método setWebhook
    - Adicionar header "apikey" em todas requisições
    - _Requirements: 1.2, 3.2, 4.2, 5.1, 8.3, 9.5_
  
  - [ ] 4.2 Implementar retry logic com exponential backoff
    - Adicionar retry para falhas temporárias
    - Implementar backoff exponencial (3 tentativas)
    - Não fazer retry em erros de validação (4xx)
    - _Requirements: 12.5, 12.6_
  
  - [ ]* 4.3 Escrever property test para retry logic
    - **Property 19: Retry with Exponential Backoff**
    - **Validates: Requirements 12.5, 12.6**
  
  - [ ] 4.4 Implementar timeout handling
    - Configurar timeout de 10 segundos
    - Tratar timeout como erro temporário
    - _Requirements: 12.1, 12.2_
  
  - [ ]* 4.5 Escrever testes unitários para Evolution API Client
    - Testar criação de instância com sucesso
    - Testar tratamento de timeout
    - Testar tratamento de erro 500
    - Testar inclusão de header apikey
    - _Requirements: 1.2, 9.5, 12.1_

- [x] 5. Checkpoint - Validar infraestrutura base
  - Ensure all tests pass, ask the user if questions arise.

- [-] 6. Implementar Instance Manager Service
  - [x] 6.1 Criar InstanceManagerService
    - Implementar método createInstance
    - Gerar instanceName no formato "user-{userId}"
    - Implementar lógica de reutilização de instância existente
    - Salvar configuração no banco após criação
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [ ]* 6.2 Escrever property tests para Instance Manager
    - **Property 1: Instance Name Generation Format**
    - **Property 2: Instance Creation Idempotency**
    - **Property 3: Instance Persistence After Creation**
    - **Validates: Requirements 1.1, 1.3, 1.5**
  
  - [ ] 6.3 Implementar método getQRCode
    - Buscar QR Code da Evolution API
    - Detectar e renovar QR Code expirado
    - Aplicar rate limit de 1 por minuto
    - _Requirements: 3.2, 3.4, 14.1, 14.6_
  
  - [ ]* 6.4 Escrever property test para QR Code
    - **Property 8: QR Code Auto-Refresh on Expiry**
    - **Validates: Requirements 3.4, 14.1**
  
  - [x] 6.5 Implementar método getConnectionStatus
    - Consultar status na Evolution API
    - Mapear estados para valores válidos
    - Tratar Evolution API offline
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [ ]* 6.6 Escrever property test para connection status
    - **Property 9: Connection Status Valid Values**
    - **Validates: Requirements 4.3**
  
  - [x] 6.7 Implementar métodos disconnectInstance e reconnectInstance
    - Implementar desconexão via Evolution API
    - Atualizar status no banco de dados
    - Implementar reconexão gerando novo QR Code
    - _Requirements: 8.3, 8.5_
  
  - [ ]* 6.8 Escrever testes unitários para disconnect/reconnect
    - Testar desconexão com sucesso
    - Testar reconexão gera novo QR Code
    - Testar atualização de status no banco
    - _Requirements: 8.3, 8.5_

- [x] 7. Implementar configuração automática de webhook
  - [x] 7.1 Adicionar configuração de webhook no createInstance
    - Configurar webhook após criação de instância
    - Usar URL {BACKEND_URL}/api/webhooks/evolution
    - Habilitar eventos de mensagens
    - Não falhar criação se webhook falhar
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 7.2 Escrever property tests para webhook
    - **Property 10: Webhook Auto-Configuration**
    - **Property 11: Webhook Events Enabled**
    - **Property 12: Webhook Failure Non-Blocking**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 8. Implementar Webhook Handler
  - [x] 8.1 Criar WebhookHandler service
    - Implementar validação de assinatura
    - Implementar parser de eventos
    - Adicionar validação de schema JSON
    - _Requirements: 19.1, 19.2, 20.1, 20.2_
  
  - [ ]* 8.2 Escrever property test para webhook parsing
    - **Property 21: Webhook Event Parsing Round-Trip**
    - **Validates: Requirements 20.6**
  
  - [x] 8.3 Implementar processamento de eventos
    - Processar evento "connection.update"
    - Processar evento "messages.upsert"
    - Atualizar status no banco de dados
    - Registrar eventos em webhook_logs
    - _Requirements: 15.1, 20.3, 20.4_
  
  - [ ]* 8.4 Escrever property tests para processamento de eventos
    - **Property 22: Connection Status Update on Webhook**
    - **Property 23: Message Processing on Webhook**
    - **Validates: Requirements 15.1, 20.3, 20.4**
  
  - [x] 8.5 Implementar Pretty Printer para logs
    - Formatar eventos em JSON legível
    - Omitir campos sensíveis (tokens, keys)
    - Truncar payloads grandes (>1KB)
    - _Requirements: 21.1, 21.2, 21.3, 21.5_
  
  - [ ]* 8.6 Escrever property tests para Pretty Printer
    - **Property 31: Pretty Printer Structure Preservation**
    - **Property 32: Pretty Printer Sensitive Data Omission**
    - **Property 33: Pretty Printer Payload Truncation**
    - **Validates: Requirements 21.3, 21.5, 21.6**

- [x] 9. Checkpoint - Validar serviços core
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implementar endpoints REST - Instance Management
  - [x] 10.1 Criar endpoint POST /api/evolution/create-instance
    - Adicionar middleware de autenticação
    - Adicionar rate limiting (3 req / 10 min)
    - Validar usuário autenticado
    - Chamar InstanceManagerService.createInstance
    - Retornar 201 para nova instância, 200 para existente
    - Tratar erros com mensagens descritivas
    - _Requirements: 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 11.2, 11.3_
  
  - [ ]* 10.2 Escrever property tests para create-instance
    - **Property 5: Authentication Required for All Operations**
    - **Property 15: Rate Limiting Enforcement**
    - **Property 16: Rate Limiting Per User**
    - **Validates: Requirements 1.6, 2.2, 11.2, 11.5**
  
  - [x] 10.3 Criar endpoint GET /api/evolution/qrcode
    - Adicionar middleware de autenticação
    - Validar acesso apenas à própria instância
    - Chamar InstanceManagerService.getQRCode
    - Retornar QR Code em base64
    - Retornar 404 se não disponível
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  
  - [ ]* 10.4 Escrever property tests para qrcode endpoint
    - **Property 6: Multi-Tenant Isolation**
    - **Property 7: QR Code Base64 Format**
    - **Property 17: QR Code Rate Limiting**
    - **Validates: Requirements 3.3, 3.6, 10.2, 14.6**
  
  - [x] 10.5 Criar endpoint GET /api/evolution/connection-status
    - Adicionar middleware de autenticação
    - Validar acesso apenas à própria instância
    - Chamar InstanceManagerService.getConnectionStatus
    - Responder em menos de 2 segundos
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_
  
  - [x] 10.6 Criar endpoints POST /api/evolution/disconnect e /api/evolution/reconnect
    - Implementar disconnect chamando InstanceManagerService
    - Implementar reconnect gerando novo QR Code
    - Validar autenticação e isolamento multi-tenant
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 10.7 Escrever testes de integração para endpoints
    - Testar fluxo completo de criação até conexão
    - Testar disconnect e reconnect
    - Testar isolamento entre usuários
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 11. Implementar endpoint de webhook
  - [x] 11.1 Criar endpoint POST /api/webhooks/evolution
    - Validar assinatura no header x-evolution-signature
    - Retornar 401 se assinatura inválida
    - Chamar WebhookHandler.handleEvent
    - Registrar tentativas com assinatura inválida
    - Aplicar rate limiting (100 eventos/min por instância)
    - _Requirements: 5.6, 19.1, 19.2, 19.6_
  
  - [ ]* 11.2 Escrever property test para webhook endpoint
    - **Property 13: Webhook Signature Validation**
    - **Property 14: Webhook Signature Algorithm**
    - **Validates: Requirements 10.6, 19.1, 19.2, 19.4**
  
  - [ ]* 11.3 Escrever testes de integração para webhook
    - Testar recebimento de evento connection.update
    - Testar recebimento de evento messages.upsert
    - Testar rejeição de assinatura inválida
    - _Requirements: 19.1, 19.2, 20.3, 20.4_

- [ ] 12. Implementar endpoints administrativos
  - [ ] 12.1 Criar endpoint GET /api/admin/active-connections
    - Adicionar middleware de autenticação admin
    - Retornar contagem e lista de conexões ativas
    - Incluir timestamp de última conexão
    - Responder em menos de 1 segundo
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_
  
  - [ ] 12.2 Criar endpoint GET /api/admin/inactive-instances
    - Adicionar middleware de autenticação admin
    - Considerar inativa após 30 dias sem atividade
    - Retornar lista com userId e dias de inatividade
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_
  
  - [ ]* 12.3 Escrever property test para detecção de inatividade
    - **Property 34: Inactive Instance Detection**
    - **Validates: Requirements 22.3, 22.4**

- [ ] 13. Implementar endpoint de histórico
  - [ ] 13.1 Criar endpoint GET /api/evolution/connection-history
    - Adicionar middleware de autenticação
    - Validar acesso apenas ao próprio histórico
    - Retornar últimas 10 entradas por padrão
    - Suportar parâmetro limit para paginação
    - _Requirements: 25.2, 25.3, 25.4, 25.5, 25.6_
  
  - [ ]* 13.2 Escrever testes unitários para histórico
    - Testar paginação
    - Testar isolamento multi-tenant
    - Testar ordenação por timestamp
    - _Requirements: 25.3, 25.6_

- [ ] 14. Checkpoint - Validar todos endpoints backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implementar componentes React - Conexão WhatsApp
  - [x] 15.1 Criar página WhatsAppConnectionPage
    - Implementar estados: idle, creating, waiting_scan, connected, error
    - Adicionar botão "Conectar WhatsApp"
    - Exibir QR Code quando disponível
    - Exibir indicador de status durante conexão
    - Exibir mensagem de sucesso ao conectar
    - Exibir mensagens de erro amigáveis
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 15.2 Criar componente QRCodeDisplay
    - Exibir imagem do QR Code em base64
    - Adicionar botão de refresh
    - Mostrar contador de expiração (opcional)
    - _Requirements: 6.3_
  
  - [x] 15.3 Criar componente ConnectionStatusIndicator
    - Exibir status atual da conexão
    - Mostrar timestamp da última conexão
    - Adicionar botões "Desconectar" e "Reconectar"
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 16. Implementar polling automático no frontend
  - [x] 16.1 Adicionar polling de status na WhatsAppConnectionPage
    - Iniciar polling quando QR Code é exibido
    - Verificar status a cada 3 segundos
    - Parar polling quando status muda para "connected"
    - Cancelar polling ao sair da página
    - Limitar a 60 tentativas (3 minutos)
    - Exibir mensagem sugerindo novo QR Code após limite
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 16.2 Escrever testes unitários para polling
    - Testar início e parada de polling
    - Testar cancelamento ao desmontar componente
    - Testar limite de tentativas
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 17. Implementar gerenciamento de conexão existente
  - [x] 17.1 Adicionar lógica de verificação de conexão existente
    - Verificar status ao carregar página
    - Exibir interface apropriada baseada no status
    - _Requirements: 8.1, 15.6_
  
  - [x] 17.2 Implementar funcionalidade de desconexão
    - Adicionar confirmação via modal
    - Chamar endpoint de disconnect
    - Atualizar UI após desconexão
    - _Requirements: 8.2, 8.3_
  
  - [x] 17.3 Implementar funcionalidade de reconexão
    - Chamar endpoint de reconnect
    - Exibir novo QR Code
    - Reiniciar polling de status
    - _Requirements: 8.4, 8.5_
  
  - [x] 17.4 Implementar troca de número
    - Adicionar botão "Trocar Número"
    - Confirmar ação com modal
    - Desconectar instância atual
    - Permitir criação de nova instância
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_

- [ ] 18. Implementar componente de histórico de conexões
  - [ ] 18.1 Criar componente ConnectionHistoryList
    - Buscar histórico do endpoint
    - Exibir em formato de timeline
    - Mostrar tipo de evento e timestamp
    - _Requirements: 25.2, 25.3, 25.5_
  
  - [ ]* 18.2 Escrever testes unitários para histórico
    - Testar renderização de eventos
    - Testar formatação de timestamps
    - _Requirements: 25.5_

- [x] 19. Implementar tratamento de erros no frontend
  - [x] 19.1 Criar mapeamento de códigos de erro para mensagens amigáveis
    - Mapear UNAUTHORIZED, RATE_LIMIT_EXCEEDED, EVOLUTION_API_ERROR, etc
    - Criar mensagens em português
    - _Requirements: 12.2, 12.4_
  
  - [x] 19.2 Implementar ações de recuperação de erro
    - Adicionar botões de ação baseados no tipo de erro
    - Implementar retry automático para erros temporários
    - Implementar redirecionamento para login em erros de autenticação
    - _Requirements: 12.4, 14.3, 14.4, 14.5_
  
  - [x] 19.3 Adicionar notificações de desconexão
    - Detectar mudança para status "disconnected"
    - Exibir notificação ao usuário
    - Adicionar botão "Reconectar" na notificação
    - _Requirements: 15.3, 15.4, 15.5_

- [ ] 20. Checkpoint - Validar interface completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Implementar logging estruturado
  - [ ] 21.1 Criar módulo de logging
    - Implementar interface LogEntry
    - Adicionar níveis: info, warn, error
    - Incluir requestId em todos os logs
    - Adicionar contexto (userId, instanceName, operation)
    - _Requirements: 16.1, 16.2, 16.3, 16.5, 16.6_
  
  - [ ] 21.2 Adicionar logging em operações críticas
    - Logar criação de instância
    - Logar chamadas à Evolution API
    - Logar eventos de webhook
    - Logar erros com stack trace
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ]* 21.3 Escrever testes para logging
    - Testar inclusão de requestId
    - Testar níveis de log apropriados
    - Testar omissão de dados sensíveis
    - _Requirements: 16.5, 16.6_

- [ ] 22. Implementar validações de ambiente
  - [ ] 22.1 Criar módulo de validação de configuração
    - Validar presença de variáveis obrigatórias
    - Validar formato de EVOLUTION_API_URL
    - Validar tamanho de ENCRYPTION_KEY (32 bytes)
    - Falhar inicialização com mensagem clara se inválido
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 22.2 Escrever property tests para validação
    - **Property 25: Environment Variable Validation**
    - **Property 26: URL Format Validation**
    - **Property 27: API Key Header Presence**
    - **Validates: Requirements 9.3, 9.4, 9.5**

- [ ] 23. Implementar suporte a concorrência
  - [ ] 23.1 Adicionar transações no banco de dados
    - Usar transações em operações de criação de instância
    - Implementar retry logic para conflitos
    - _Requirements: 18.2, 18.5_
  
  - [ ]* 23.2 Escrever property tests para concorrência
    - **Property 28: Concurrent Instance Creation**
    - **Property 29: Database Transaction Safety**
    - **Property 30: Instance Name Uniqueness**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4**
  
  - [ ]* 23.3 Escrever testes de carga
    - Testar 10 criações simultâneas
    - Testar 50 usuários fazendo polling
    - Testar burst de 100 webhooks
    - _Requirements: 18.6_

- [ ] 24. Criar documentação
  - [ ] 24.1 Criar README.md com instruções de configuração
    - Documentar como obter Global API Key
    - Listar todas variáveis de ambiente
    - Incluir exemplos de valores
    - Documentar requisitos de permissões
    - Adicionar seção de troubleshooting
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  
  - [ ] 24.2 Criar documentação de API
    - Documentar todos endpoints REST
    - Incluir exemplos de request/response
    - Documentar códigos de status HTTP
    - Documentar rate limits
    - _Requirements: 2.1, 2.4, 2.5_

- [x] 25. Implementar health checks e monitoramento
  - [x] 25.1 Criar endpoints de health check
    - Implementar GET /health
    - Implementar GET /health/database
    - Implementar GET /health/evolution
    - _Requirements: 12.1, 12.2_
  
  - [x] 25.2 Adicionar métricas de monitoramento
    - Contar requisições por endpoint
    - Medir tempo de resposta
    - Contar erros por tipo
    - Monitorar taxa de sucesso de conexões
    - _Requirements: 16.1, 16.2_

- [ ] 26. Checkpoint final - Validação completa do sistema
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Integração e testes end-to-end
  - [ ]* 27.1 Escrever testes de integração completos
    - Testar fluxo completo: criação → QR Code → conexão
    - Testar fluxo de desconexão e reconexão
    - Testar isolamento multi-tenant
    - Testar tratamento de erros da Evolution API
    - _Requirements: 1.1, 1.2, 1.3, 3.2, 4.2, 8.3, 8.5, 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 27.2 Escrever testes de propriedades não implementados
    - **Property 4: Error Messages Are Descriptive**
    - **Property 18: Timeout Handling**
    - **Property 20: Orphaned Instance Recreation**
    - **Validates: Requirements 1.4, 12.1, 12.2, 13.3, 13.4**

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de correção
- Unit tests validam exemplos específicos e edge cases
- A implementação usa TypeScript para type safety
- O sistema é construído incrementalmente: infraestrutura → serviços → API → UI
- Todas as 35 propriedades de correção do design estão mapeadas para tasks de teste
- Rate limiting e segurança são implementados desde o início
- Logging estruturado facilita debugging e auditoria
