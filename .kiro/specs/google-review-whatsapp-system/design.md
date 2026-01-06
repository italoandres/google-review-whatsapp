# Design Document: Sistema de Solicitação de Avaliações Google via WhatsApp

## Overview

Este documento descreve o design de um sistema web MVP para pequenos negócios solicitarem avaliações no Google via WhatsApp de forma manual e segura. O sistema utiliza links wa.me (Click-to-Chat) para abrir conversas no WhatsApp com mensagens pré-preenchidas, sem automação de envio e sem uso de WhatsApp API, eliminando riscos de bloqueio.

O sistema é projetado como um produto simples e vendável (R$297), com foco em usabilidade, estabilidade e facilidade de uso para funcionários de pequenos negócios.

**Stack Tecnológica:**
- Frontend: React com TypeScript
- Backend: Node.js com Express
- Banco de Dados: SQLite
- Autenticação: JWT (JSON Web Tokens)

## Architecture

O sistema segue uma arquitetura cliente-servidor tradicional com separação clara entre frontend e backend:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Login Page  │  │  Setup Page  │  │ Clients Page │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Config Page  │  │   API Client │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Routes  │  │Business Routes│  │Client Routes │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Auth Middleware│  │  Validators  │  │Link Generator│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    users     │  │   business   │  │   clients    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Fluxo de Dados:**
1. Frontend envia requisições HTTP para o backend via API REST
2. Backend valida autenticação via JWT middleware
3. Backend processa requisições e interage com SQLite
4. Backend retorna respostas JSON para o frontend
5. Frontend atualiza UI com base nas respostas

## Components and Interfaces

### Frontend Components

#### 1. LoginPage
**Responsabilidade:** Autenticação de usuários

**Props:** Nenhuma

**State:**
- `email: string` - Email do usuário
- `password: string` - Senha do usuário
- `error: string | null` - Mensagem de erro

**Métodos:**
- `handleLogin()` - Envia credenciais para API e armazena token JWT

#### 2. SetupPage
**Responsabilidade:** Configuração inicial do negócio

**Props:** Nenhuma

**State:**
- `businessName: string` - Nome do negócio
- `whatsappNumber: string` - Número do WhatsApp
- `googleReviewLink: string` - Link de avaliação do Google
- `defaultMessage: string` - Mensagem padrão
- `errors: Record<string, string>` - Erros de validação

**Métodos:**
- `handleSave()` - Salva configurações via API
- `validateFields()` - Valida campos antes de salvar

#### 3. ClientsPage
**Responsabilidade:** Listagem e gerenciamento de clientes

**Props:** Nenhuma

**State:**
- `clients: Client[]` - Lista de clientes
- `showAddForm: boolean` - Controla exibição do formulário

**Métodos:**
- `loadClients()` - Carrega clientes da API
- `handleRequestReview(clientId)` - Gera link wa.me e abre WhatsApp

#### 4. AddClientForm
**Responsabilidade:** Cadastro de novos clientes

**Props:**
- `onClientAdded: () => void` - Callback após adicionar cliente

**State:**
- `name: string` - Nome do cliente (opcional)
- `phone: string` - Telefone do cliente (obrigatório)
- `satisfied: boolean` - Cliente satisfeito
- `complained: boolean` - Cliente reclamou

**Métodos:**
- `handleSubmit()` - Envia dados do cliente para API
- `validatePhone()` - Valida formato do telefone

#### 5. ConfigPage
**Responsabilidade:** Edição de configurações do negócio

**Props:** Nenhuma

**State:** Mesmo que SetupPage

**Métodos:** Mesmo que SetupPage

### Backend Routes

#### Auth Routes (`/api/auth`)

**POST /api/auth/register**
- Body: `{ email: string, password: string }`
- Response: `{ token: string, user: { id: number, email: string } }`
- Descrição: Registra novo usuário

**POST /api/auth/login**
- Body: `{ email: string, password: string }`
- Response: `{ token: string, user: { id: number, email: string } }`
- Descrição: Autentica usuário e retorna JWT

#### Business Routes (`/api/business`)

**GET /api/business/config**
- Headers: `Authorization: Bearer <token>`
- Response: `{ id: number, userId: number, businessName: string, whatsappNumber: string, googleReviewLink: string, defaultMessage: string }`
- Descrição: Retorna configurações do negócio

**POST /api/business/config**
- Headers: `Authorization: Bearer <token>`
- Body: `{ businessName: string, whatsappNumber: string, googleReviewLink: string, defaultMessage: string }`
- Response: `{ id: number, ... }`
- Descrição: Cria ou atualiza configurações

**PUT /api/business/config**
- Headers: `Authorization: Bearer <token>`
- Body: `{ businessName?: string, whatsappNumber?: string, googleReviewLink?: string, defaultMessage?: string }`
- Response: `{ id: number, ... }`
- Descrição: Atualiza configurações parcialmente

#### Client Routes (`/api/clients`)

**GET /api/clients**
- Headers: `Authorization: Bearer <token>`
- Response: `{ clients: Client[] }`
- Descrição: Lista todos os clientes do usuário

**POST /api/clients**
- Headers: `Authorization: Bearer <token>`
- Body: `{ name?: string, phone: string, satisfied: boolean, complained: boolean }`
- Response: `{ id: number, ... }`
- Descrição: Cadastra novo cliente

**POST /api/clients/:id/request-review**
- Headers: `Authorization: Bearer <token>`
- Response: `{ waLink: string, client: Client }`
- Descrição: Gera link wa.me e atualiza status do cliente

## Data Models

### User
```typescript
interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
```

**Tabela SQLite:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Business
```typescript
interface Business {
  id: number;
  userId: number;
  businessName: string;
  whatsappNumber: string;
  googleReviewLink: string;
  defaultMessage: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Tabela SQLite:**
```sql
CREATE TABLE business (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  business_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  google_review_link TEXT NOT NULL,
  default_message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Client
```typescript
interface Client {
  id: number;
  userId: number;
  name: string | null;
  phone: string;
  satisfied: boolean;
  complained: boolean;
  status: 'apto' | 'bloqueado' | 'solicitado';
  attendanceDate: Date;
  requestDate: Date | null;
  createdAt: Date;
}
```

**Tabela SQLite:**
```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT,
  phone TEXT NOT NULL,
  satisfied BOOLEAN NOT NULL DEFAULT 0,
  complained BOOLEAN NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('apto', 'bloqueado', 'solicitado')),
  attendance_date DATETIME NOT NULL,
  request_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Regras de Negócio para Status

O campo `status` é calculado com base nas seguintes regras:

1. Se `complained = true` → `status = 'bloqueado'`
2. Se `complained = false` e `satisfied = true` e `requestDate = null` → `status = 'apto'`
3. Se `requestDate != null` → `status = 'solicitado'`

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Property 1: Autenticação com credenciais válidas concede acesso
*Para qualquer* par de email e senha válidos cadastrados no sistema, quando um funcionário fornece essas credenciais, o sistema deve autenticar o usuário e retornar um token JWT válido.

**Validates: Requirements 1.1**

### Property 2: Autenticação com credenciais inválidas rejeita acesso
*Para qualquer* par de email e senha onde pelo menos um está incorreto, o sistema deve rejeitar a autenticação e retornar erro.

**Validates: Requirements 1.2**

### Property 3: Sessão persiste até logout
*Para qualquer* usuário autenticado com token JWT válido, o sistema deve manter a sessão ativa e permitir acesso a rotas protegidas até que o token expire ou seja invalidado.

**Validates: Requirements 1.3**

### Property 4: Usuários não autenticados são redirecionados
*Para qualquer* requisição a rota protegida sem token JWT válido, o sistema deve retornar erro 401 (Unauthorized).

**Validates: Requirements 1.4**

### Property 5: Configuração aceita dados válidos
*Para qualquer* conjunto de dados de configuração válidos (nome do negócio, número de WhatsApp no formato correto, URL válida, mensagem contendo {{link_google}}), o sistema deve aceitar e persistir os dados.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 6: Configuração round-trip preserva dados
*Para qualquer* configuração de negócio salva, quando recuperada do banco de dados, deve retornar os mesmos valores salvos.

**Validates: Requirements 2.6, 8.2**

### Property 7: Cliente com telefone válido é aceito
*Para qualquer* cliente com telefone no formato válido (com ou sem nome), o sistema deve aceitar o cadastro e persistir os dados.

**Validates: Requirements 3.1**

### Property 8: Data de atendimento é registrada automaticamente
*Para qualquer* cliente cadastrado, o sistema deve registrar automaticamente uma data de atendimento válida no momento do cadastro.

**Validates: Requirements 3.2**

### Property 9: Cliente reclamou resulta em status bloqueado
*Para qualquer* cliente cadastrado com checkbox "Cliente reclamou" marcado, o sistema deve definir o status como "bloqueado".

**Validates: Requirements 3.5**

### Property 10: Cliente satisfeito sem reclamação resulta em status apto
*Para qualquer* cliente cadastrado com "Cliente satisfeito" marcado e "Cliente reclamou" desmarcado, o sistema deve definir o status como "apto".

**Validates: Requirements 3.6**

### Property 11: Telefone inválido é rejeitado
*Para qualquer* string que não corresponde ao formato válido de telefone (DDI + DDD + número), o sistema deve rejeitar o cadastro e retornar erro de validação.

**Validates: Requirements 3.7, 9.1**

### Property 12: Todos os clientes cadastrados aparecem na lista
*Para qualquer* conjunto de clientes cadastrados por um usuário, quando a lista é solicitada, todos os clientes devem estar presentes na resposta.

**Validates: Requirements 4.1**

### Property 13: Lista de clientes contém campos obrigatórios
*Para qualquer* cliente na lista retornada, os campos nome, telefone, data de atendimento e status devem estar presentes.

**Validates: Requirements 4.2**

### Property 14: Status do cliente é válido
*Para qualquer* cliente no sistema, o status deve ser exatamente um dos três valores: "apto", "bloqueado" ou "solicitado".

**Validates: Requirements 4.3**

### Property 15: Link wa.me contém telefone do cliente
*Para qualquer* cliente apto quando solicitação de avaliação é gerada, o link wa.me resultante deve conter o número de telefone do cliente no formato correto.

**Validates: Requirements 5.1**

### Property 16: Substituição de variável no link wa.me
*Para qualquer* mensagem padrão contendo {{link_google}} e qualquer link do Google configurado, quando o link wa.me é gerado, a variável deve ser substituída pelo link real.

**Validates: Requirements 5.2**

### Property 17: Solicitação atualiza status para solicitado
*Para qualquer* cliente com status "apto", quando uma solicitação de avaliação é gerada, o status deve ser atualizado para "solicitado".

**Validates: Requirements 5.6**

### Property 18: Solicitação registra data
*Para qualquer* cliente que tem status atualizado para "solicitado", o sistema deve registrar a data e hora da solicitação.

**Validates: Requirements 5.7, 6.1**

### Property 19: Data de solicitação persiste
*Para qualquer* cliente com status "solicitado" e data de solicitação registrada, após reinicialização do sistema, a data deve permanecer inalterada.

**Validates: Requirements 6.2, 8.4**

### Property 20: Edição de configuração aceita novos valores válidos
*Para qualquer* campo de configuração e qualquer novo valor válido para esse campo, o sistema deve aceitar a atualização e persistir o novo valor.

**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 21: Configuração atualizada é aplicada imediatamente
*Para qualquer* configuração atualizada, quando um novo link wa.me é gerado após a atualização, ele deve usar os novos valores configurados.

**Validates: Requirements 7.6**

### Property 22: Dados de autenticação persistem
*Para qualquer* usuário cadastrado, após reinicialização do sistema, as credenciais devem permanecer válidas e permitir autenticação.

**Validates: Requirements 8.1**

### Property 23: Dados de clientes persistem
*Para qualquer* cliente cadastrado, após reinicialização do sistema, todos os dados do cliente devem permanecer inalterados.

**Validates: Requirements 8.3**

### Property 24: Todos os dados persistem após reinicialização
*Para qualquer* estado do sistema (usuários, configurações, clientes, histórico), após reinicialização, todos os dados devem ser recuperáveis e idênticos ao estado anterior.

**Validates: Requirements 8.5**

### Property 25: URL inválida é rejeitada
*Para qualquer* string que não corresponde ao formato válido de URL, quando fornecida como Link_Google, o sistema deve rejeitar e retornar erro de validação.

**Validates: Requirements 9.2**

### Property 26: Campos obrigatórios vazios impedem salvamento
*Para qualquer* formulário com campos obrigatórios, se algum campo obrigatório estiver vazio, o sistema deve impedir o salvamento e retornar erro indicando os campos faltantes.

**Validates: Requirements 9.3**

### Property 27: Mensagem sem variável gera aviso
*Para qualquer* mensagem padrão que não contém a string "{{link_google}}", o sistema deve retornar aviso ao usuário.

**Validates: Requirements 9.4**

## Error Handling

### Categorias de Erros

#### 1. Erros de Autenticação (401)
- Credenciais inválidas
- Token JWT ausente ou inválido
- Token expirado

**Tratamento:**
- Retornar status 401 com mensagem descritiva
- Frontend redireciona para página de login
- Limpar token armazenado no localStorage

#### 2. Erros de Validação (400)
- Formato de telefone inválido
- URL inválida
- Campos obrigatórios vazios
- Mensagem sem variável {{link_google}}

**Tratamento:**
- Retornar status 400 com objeto de erros por campo
- Frontend exibe mensagens de erro próximas aos campos
- Não persistir dados inválidos

#### 3. Erros de Autorização (403)
- Tentativa de acessar recursos de outro usuário
- Operação não permitida

**Tratamento:**
- Retornar status 403 com mensagem descritiva
- Frontend exibe mensagem de erro

#### 4. Erros de Recurso Não Encontrado (404)
- Cliente não existe
- Configuração não existe
- Rota não existe

**Tratamento:**
- Retornar status 404 com mensagem descritiva
- Frontend exibe mensagem apropriada

#### 5. Erros de Servidor (500)
- Erro de banco de dados
- Erro inesperado

**Tratamento:**
- Retornar status 500 com mensagem genérica
- Logar erro detalhado no servidor
- Frontend exibe mensagem genérica de erro

### Formato de Resposta de Erro

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string>;
}
```

**Exemplo:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos",
  "details": {
    "phone": "Formato de telefone inválido",
    "googleReviewLink": "URL inválida"
  }
}
```

## Testing Strategy

### Abordagem Dual de Testes

O sistema será testado usando duas abordagens complementares:

1. **Testes Unitários:** Verificam exemplos específicos, casos extremos e condições de erro
2. **Testes Baseados em Propriedades:** Verificam propriedades universais através de múltiplas entradas geradas

Ambos são necessários para cobertura abrangente - testes unitários capturam bugs concretos, testes de propriedade verificam correção geral.

### Framework de Testes

**Property-Based Testing:** fast-check (biblioteca JavaScript/TypeScript)
**Unit Testing:** Jest
**Integration Testing:** Supertest (para testes de API)

### Configuração de Testes de Propriedade

- Cada teste de propriedade deve executar **mínimo 100 iterações**
- Cada teste deve referenciar a propriedade do documento de design
- Formato de tag: `Feature: google-review-whatsapp-system, Property {número}: {texto da propriedade}`

### Estratégia de Testes por Componente

#### Backend - Auth Routes

**Testes Unitários:**
- Login com credenciais válidas retorna token
- Login com email inválido retorna erro
- Login com senha inválida retorna erro
- Registro com email duplicado retorna erro

**Testes de Propriedade:**
- Property 1: Autenticação válida sempre concede acesso
- Property 2: Credenciais inválidas sempre rejeitam acesso
- Property 3: Token válido sempre permite acesso a rotas protegidas
- Property 4: Requisições sem token sempre retornam 401

#### Backend - Business Routes

**Testes Unitários:**
- Configuração inicial cria registro no banco
- Atualização de configuração modifica registro existente
- Busca de configuração inexistente retorna 404

**Testes de Propriedade:**
- Property 5: Dados válidos sempre são aceitos
- Property 6: Configuração salva e recuperada é idêntica (round-trip)
- Property 20: Edição com valores válidos sempre é aceita
- Property 21: Configuração atualizada é usada em novos links

#### Backend - Client Routes

**Testes Unitários:**
- Cadastro de cliente com nome e telefone
- Cadastro de cliente apenas com telefone
- Cliente com reclamação tem status bloqueado
- Cliente satisfeito tem status apto

**Testes de Propriedade:**
- Property 7: Cliente com telefone válido sempre é aceito
- Property 8: Data de atendimento sempre é registrada
- Property 9: Cliente reclamou sempre resulta em status bloqueado
- Property 10: Cliente satisfeito sem reclamação sempre resulta em status apto
- Property 11: Telefone inválido sempre é rejeitado
- Property 12: Todos os clientes cadastrados aparecem na lista
- Property 17: Solicitação sempre atualiza status para solicitado
- Property 18: Solicitação sempre registra data

#### Backend - Link Generator

**Testes Unitários:**
- Link wa.me gerado tem formato correto
- Mensagem é codificada corretamente para URL
- Variável {{link_google}} é substituída

**Testes de Propriedade:**
- Property 15: Link sempre contém telefone do cliente
- Property 16: Variável sempre é substituída pelo link real

#### Backend - Validators

**Testes Unitários:**
- Telefone brasileiro válido passa validação
- Telefone sem DDD falha validação
- URL válida passa validação
- String sem protocolo falha validação de URL

**Testes de Propriedade:**
- Property 11: Telefones inválidos sempre são rejeitados
- Property 25: URLs inválidas sempre são rejeitadas
- Property 26: Campos obrigatórios vazios sempre impedem salvamento
- Property 27: Mensagem sem variável sempre gera aviso

#### Frontend - Components

**Testes Unitários:**
- LoginPage renderiza formulário
- AddClientForm valida campos antes de enviar
- ClientsPage exibe lista de clientes
- Botão "Pedir Avaliação" aparece apenas para clientes aptos

**Testes de Integração:**
- Fluxo completo: login → setup → cadastro cliente → solicitar avaliação
- Atualização de configuração reflete em novos links

#### Database - Persistence

**Testes de Propriedade:**
- Property 22: Dados de autenticação persistem após reinicialização
- Property 23: Dados de clientes persistem após reinicialização
- Property 24: Todos os dados persistem após reinicialização
- Property 19: Data de solicitação persiste após reinicialização

### Geradores para Property-Based Testing

Para testes de propriedade eficazes, precisamos de geradores inteligentes:

#### Gerador de Telefone Válido
```typescript
const validPhoneGen = fc.tuple(
  fc.constantFrom('55'), // DDI Brasil
  fc.integer({ min: 11, max: 99 }), // DDD
  fc.integer({ min: 900000000, max: 999999999 }) // Número
).map(([ddi, ddd, num]) => `${ddi}${ddd}${num}`);
```

#### Gerador de URL Válida
```typescript
const validUrlGen = fc.webUrl();
```

#### Gerador de Mensagem com Variável
```typescript
const messageWithVarGen = fc.tuple(
  fc.string(),
  fc.constant('{{link_google}}'),
  fc.string()
).map(([before, variable, after]) => `${before}${variable}${after}`);
```

#### Gerador de Cliente
```typescript
const clientGen = fc.record({
  name: fc.option(fc.string(), { nil: null }),
  phone: validPhoneGen,
  satisfied: fc.boolean(),
  complained: fc.boolean()
});
```

### Cobertura de Testes

**Meta de Cobertura:**
- Backend: 80% de cobertura de código
- Frontend: 70% de cobertura de componentes
- Todas as 27 propriedades devem ter testes implementados
- Todos os casos de erro devem ter testes unitários

### Execução de Testes

```bash
# Testes unitários
npm test

# Testes de propriedade
npm run test:property

# Todos os testes
npm run test:all

# Cobertura
npm run test:coverage
```
