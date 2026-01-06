# Requirements Document

## Introduction

Este documento especifica os requisitos para um sistema web MVP que permite pequenos negócios solicitarem avaliações no Google via WhatsApp de forma manual e segura. O sistema facilita o envio do link oficial de avaliação do Google através do WhatsApp usando links wa.me (Click-to-Chat), sem automação de envio, sem uso de WhatsApp API e sem risco de bloqueio.

O sistema é projetado como um produto simples e vendável (R$297), focado em usabilidade e estabilidade, permitindo que funcionários de pequenos negócios gerenciem clientes e solicitem avaliações com apenas 1 clique.

## Glossary

- **Sistema**: O sistema web de solicitação de avaliações do Google via WhatsApp
- **Negócio**: O pequeno negócio (cliente do sistema) que usa o sistema para solicitar avaliações
- **Funcionário**: Usuário do sistema que trabalha no negócio e gerencia clientes
- **Cliente**: Pessoa que foi atendida pelo negócio e pode receber solicitação de avaliação
- **Link_Google**: URL oficial de avaliação do Google My Business do negócio
- **Link_WaMe**: URL do formato wa.me usado para abrir conversas no WhatsApp
- **Mensagem_Padrão**: Texto configurável usado para solicitar avaliações, contendo a variável {{link_google}}
- **Status_Cliente**: Estado do cliente (Apto para avaliação, Bloqueado, Avaliação solicitada)

## Requirements

### Requirement 1: Autenticação de Usuário

**User Story:** Como funcionário, eu quero fazer login no sistema com email e senha, para que eu possa acessar as funcionalidades de forma segura.

#### Acceptance Criteria

1. WHEN um funcionário fornece email e senha válidos, THE Sistema SHALL autenticar o usuário e conceder acesso
2. WHEN um funcionário fornece credenciais inválidas, THE Sistema SHALL rejeitar o acesso e exibir mensagem de erro
3. THE Sistema SHALL manter a sessão do usuário autenticado até logout explícito
4. WHEN um usuário não autenticado tenta acessar funcionalidades protegidas, THE Sistema SHALL redirecionar para a tela de login

### Requirement 2: Configuração Inicial do Negócio

**User Story:** Como funcionário no primeiro acesso, eu quero configurar os dados do meu negócio, para que o sistema possa gerar mensagens personalizadas de solicitação de avaliação.

#### Acceptance Criteria

1. WHEN um funcionário acessa o sistema pela primeira vez, THE Sistema SHALL exibir tela de configuração inicial
2. THE Sistema SHALL permitir cadastro do nome do negócio
3. THE Sistema SHALL permitir cadastro do número de WhatsApp do negócio no formato DDI + DDD + número
4. THE Sistema SHALL permitir cadastro do Link_Google oficial de avaliação
5. THE Sistema SHALL permitir cadastro da Mensagem_Padrão contendo a variável {{link_google}}
6. WHEN a configuração inicial é salva, THE Sistema SHALL armazenar os dados e liberar acesso às demais funcionalidades

### Requirement 3: Cadastro de Cliente

**User Story:** Como funcionário, eu quero cadastrar clientes após atendimentos, para que eu possa gerenciar quem pode receber solicitação de avaliação.

#### Acceptance Criteria

1. THE Sistema SHALL permitir cadastro de cliente com nome (opcional) e telefone (obrigatório)
2. WHEN um cliente é cadastrado, THE Sistema SHALL registrar automaticamente a data do atendimento
3. THE Sistema SHALL permitir marcar checkbox "Cliente satisfeito"
4. THE Sistema SHALL permitir marcar checkbox "Cliente reclamou"
5. WHEN o checkbox "Cliente reclamou" está marcado, THE Sistema SHALL definir Status_Cliente como "Bloqueado"
6. WHEN o checkbox "Cliente satisfeito" está marcado e "Cliente reclamou" não está, THE Sistema SHALL definir Status_Cliente como "Apto para avaliação"
7. WHEN um telefone é fornecido, THE Sistema SHALL validar o formato antes de salvar

### Requirement 4: Listagem de Clientes

**User Story:** Como funcionário, eu quero visualizar a lista de clientes cadastrados, para que eu possa identificar quem está apto a receber solicitação de avaliação.

#### Acceptance Criteria

1. THE Sistema SHALL exibir tabela com todos os clientes cadastrados
2. WHEN exibindo a lista, THE Sistema SHALL mostrar nome, telefone, data do atendimento e Status_Cliente
3. THE Sistema SHALL exibir Status_Cliente como "Apto para avaliação", "Bloqueado" ou "Avaliação solicitada"
4. WHEN um cliente tem Status_Cliente "Apto para avaliação", THE Sistema SHALL exibir botão "Pedir Avaliação"
5. WHEN um cliente tem Status_Cliente "Bloqueado" ou "Avaliação solicitada", THE Sistema SHALL ocultar o botão "Pedir Avaliação"

### Requirement 5: Geração de Link para Solicitação de Avaliação

**User Story:** Como funcionário, eu quero gerar um link do WhatsApp com a mensagem pronta, para que eu possa solicitar avaliação ao cliente com 1 clique.

#### Acceptance Criteria

1. WHEN o funcionário clica em "Pedir Avaliação" para um cliente apto, THE Sistema SHALL gerar Link_WaMe com o telefone do cliente
2. WHEN gerando o Link_WaMe, THE Sistema SHALL incluir a Mensagem_Padrão com {{link_google}} substituído pelo Link_Google configurado
3. WHEN o Link_WaMe é gerado, THE Sistema SHALL abrir o WhatsApp Web ou App do dispositivo
4. THE Sistema SHALL NOT enviar a mensagem automaticamente
5. WHEN o WhatsApp é aberto, THE Sistema SHALL apresentar a conversa com a mensagem preenchida aguardando envio manual
6. WHEN o Link_WaMe é gerado e aberto, THE Sistema SHALL atualizar Status_Cliente para "Avaliação solicitada"
7. WHEN o Status_Cliente é atualizado para "Avaliação solicitada", THE Sistema SHALL registrar a data da solicitação

### Requirement 6: Histórico de Solicitações

**User Story:** Como funcionário, eu quero visualizar quando uma avaliação foi solicitada, para que eu possa acompanhar o histórico de interações.

#### Acceptance Criteria

1. WHEN um cliente tem Status_Cliente "Avaliação solicitada", THE Sistema SHALL exibir a data da solicitação na lista
2. THE Sistema SHALL manter registro permanente da data de solicitação
3. WHEN visualizando a lista de clientes, THE Sistema SHALL permitir identificar visualmente clientes que já receberam solicitação

### Requirement 7: Edição de Configurações do Negócio

**User Story:** Como funcionário, eu quero editar as configurações do meu negócio, para que eu possa atualizar dados quando necessário.

#### Acceptance Criteria

1. THE Sistema SHALL permitir acesso à tela de configurações após setup inicial
2. WHEN na tela de configurações, THE Sistema SHALL permitir edição do nome do negócio
3. WHEN na tela de configurações, THE Sistema SHALL permitir edição do número de WhatsApp
4. WHEN na tela de configurações, THE Sistema SHALL permitir edição do Link_Google
5. WHEN na tela de configurações, THE Sistema SHALL permitir edição da Mensagem_Padrão
6. WHEN configurações são atualizadas, THE Sistema SHALL aplicar as mudanças imediatamente para novas solicitações

### Requirement 8: Persistência de Dados

**User Story:** Como funcionário, eu quero que meus dados sejam salvos de forma confiável, para que eu não perca informações de clientes e configurações.

#### Acceptance Criteria

1. THE Sistema SHALL persistir dados de autenticação em banco de dados
2. THE Sistema SHALL persistir configurações do negócio em banco de dados
3. THE Sistema SHALL persistir dados de clientes em banco de dados
4. THE Sistema SHALL persistir histórico de solicitações em banco de dados
5. WHEN o sistema é reiniciado, THE Sistema SHALL manter todos os dados previamente salvos

### Requirement 9: Validação de Dados

**User Story:** Como funcionário, eu quero que o sistema valide os dados que eu insiro, para que eu evite erros de cadastro.

#### Acceptance Criteria

1. WHEN um telefone é fornecido sem formato válido, THE Sistema SHALL rejeitar e exibir mensagem de erro
2. WHEN o Link_Google é fornecido sem formato de URL válido, THE Sistema SHALL rejeitar e exibir mensagem de erro
3. WHEN campos obrigatórios estão vazios, THE Sistema SHALL impedir salvamento e indicar campos faltantes
4. WHEN a Mensagem_Padrão não contém {{link_google}}, THE Sistema SHALL exibir aviso ao usuário

### Requirement 10: Interface Simples e Responsiva

**User Story:** Como funcionário, eu quero uma interface simples e rápida, para que eu possa usar o sistema no dia a dia sem complicações.

#### Acceptance Criteria

1. THE Sistema SHALL exibir interface limpa e intuitiva
2. THE Sistema SHALL responder a ações do usuário em menos de 2 segundos
3. THE Sistema SHALL funcionar em navegadores desktop e mobile
4. WHEN em dispositivo mobile, THE Sistema SHALL adaptar layout para tela menor
5. THE Sistema SHALL exibir feedback visual para todas as ações do usuário
