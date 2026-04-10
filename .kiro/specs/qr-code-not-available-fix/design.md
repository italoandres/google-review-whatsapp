# QR Code Not Available Bugfix Design

## Overview

Este design documenta a correção do bug onde o QR code não aparece no frontend quando o usuário tenta conectar o WhatsApp. O problema ocorre quando a Evolution API retorna `{"count":0}` ou resposta sem QR code válido, resultando em uma tela branca no frontend e a instância ficando presa no estado "connecting".

A solução implementa detecção robusta de QR code ausente, mecanismo de reconexão forçada, e melhor tratamento de erros tanto no backend quanto no frontend. A abordagem é mínima e focada apenas em corrigir o bug sem adicionar complexidade desnecessária.

## Glossary

- **Bug_Condition (C)**: A condição que dispara o bug - quando Evolution API retorna resposta sem QR code válido (`{"count":0}` ou resposta vazia)
- **Property (P)**: O comportamento desejado - sistema deve detectar ausência de QR code e forçar regeneração ou retornar erro claro
- **Preservation**: Comportamento existente de QR code válido, conexão bem-sucedida, e webhooks que devem permanecer inalterados
- **getQRCode**: Método em `EvolutionAPIClient` que busca QR code do endpoint `/instance/connect/{instanceName}`
- **getQRCode (service)**: Método em `InstanceManagerService` que orquestra obtenção de QR code com rate limiting
- **instanceState**: Estado da instância WhatsApp que pode ser 'disconnected', 'connecting', ou 'connected'
- **Evolution API v2.1.1**: API externa que gerencia instâncias WhatsApp e pode retornar `{"count":0}` quando QR code não está disponível

## Bug Details

### Bug Condition

O bug manifesta quando a Evolution API retorna uma resposta HTTP 200 mas sem QR code válido. Isso pode acontecer de duas formas: (1) resposta com `{"count":0}` indicando ausência de QR code, ou (2) resposta sem os campos `base64` ou `qrcode.base64` esperados. O método `getQRCode` no `EvolutionAPIClient` não valida se o QR code está presente na resposta, retornando `undefined` que causa erro no frontend.

**Formal Specification:**
```
FUNCTION isBugCondition(response)
  INPUT: response of type EvolutionAPIResponse
  OUTPUT: boolean
  
  RETURN response.status == 200
         AND (response.body.count == 0 
              OR (response.body.base64 == undefined 
                  AND response.body.qrcode?.base64 == undefined))
         AND expectedQRCodeDisplay() is not triggered
END FUNCTION
```

### Examples

- **Exemplo 1**: Evolution API retorna `{"count":0}` → Frontend recebe `undefined` como QR code → Tela branca sem mensagem de erro
- **Exemplo 2**: Evolution API retorna `{}` (objeto vazio) → `getQRCode` retorna `undefined` → Frontend tenta renderizar QR code inexistente
- **Exemplo 3**: Instância criada mas QR code não gerado imediatamente → Frontend faz 10 retries com 404 → Após 20 segundos mostra erro genérico
- **Edge case**: Evolution API retorna `{"base64": null}` → Sistema deve detectar e tratar como QR code ausente

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Quando Evolution API retorna QR code válido com `base64` presente, o sistema deve continuar exibindo QR code corretamente
- Quando usuário escaneia QR code válido, a conexão deve ser estabelecida e status atualizado para "connected"
- Quando instância já está conectada, não deve gerar novo QR code desnecessariamente
- Quando rate limit é excedido, deve continuar retornando erro 429 com retry-after
- Quando webhook CONNECTION_UPDATE é recebido, deve continuar atualizando status no banco de dados

**Scope:**
Todas as requisições que NÃO envolvem QR code ausente ou inválido devem ser completamente não afetadas por esta correção. Isso inclui:
- Fluxo normal de conexão com QR code válido
- Desconexão de instâncias
- Verificação de status de conexão
- Processamento de webhooks

## Hypothesized Root Cause

Baseado na descrição do bug e análise do código, as causas mais prováveis são:

1. **Validação Insuficiente de Resposta**: O método `getQRCode` em `EvolutionAPIClient.ts` não valida se o QR code está presente na resposta
   - Linha atual: `return data.base64 || data.qrcode?.base64;`
   - Problema: Retorna `undefined` quando ambos são `undefined`, ao invés de lançar erro

2. **Ausência de Mecanismo de Reconexão**: Não existe endpoint ou método para forçar regeneração de QR code quando instância está em "connecting" sem QR code válido
   - Evolution API oferece `/instance/logout/{instanceName}` e `/instance/restart/{instanceName}` mas não são utilizados

3. **Tratamento de Erro Inadequado no Frontend**: O componente `WhatsAppConnectionPage.tsx` não diferencia entre "QR code não disponível" e outros erros
   - Retry logic tenta 10 vezes mas não oferece opção de forçar reconexão

4. **Falta de Logs para Debug**: Não há logs suficientes para diagnosticar quando e por que o QR code não é gerado

## Correctness Properties

Property 1: Bug Condition - QR Code Validation and Error Handling

_For any_ Evolution API response where the QR code is absent (count == 0 or base64 fields are undefined), the fixed getQRCode method SHALL detect the absence, log the issue for debugging, and throw a QRCodeNotAvailableError with status 404, preventing undefined values from reaching the frontend.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Valid QR Code Flow

_For any_ Evolution API response where a valid QR code is present (base64 field contains valid data), the fixed code SHALL produce exactly the same behavior as the original code, successfully returning the QR code to the frontend and maintaining the existing connection flow.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File**: `backend/src/lib/evolutionApiClient.ts`

**Function**: `getQRCode`

**Specific Changes**:
1. **Adicionar Validação de QR Code**: Após receber resposta da API, validar se `base64` ou `qrcode.base64` existem e não são nulos
   - Se ausentes, lançar `EvolutionAPIError` com status 404
   - Adicionar log detalhado da resposta para debug

2. **Melhorar Mensagens de Erro**: Incluir informações sobre o formato da resposta recebida para facilitar diagnóstico

**File**: `backend/src/services/instanceManager.ts`

**Function**: `getQRCode`

**Specific Changes**:
3. **Adicionar Logs de Debug**: Registrar quando QR code não está disponível e quantas tentativas foram feitas

4. **Implementar Método de Reconexão Forçada**: Criar novo método `forceReconnect` que:
   - Chama `/instance/logout/{instanceName}` para forçar logout
   - Aguarda 2 segundos
   - Tenta obter novo QR code
   - Se falhar, chama `/instance/restart/{instanceName}` como fallback

**File**: `backend/src/routes/whatsappInstance.ts`

**Specific Changes**:
5. **Adicionar Endpoint de Reconexão Forçada**: Criar novo endpoint `POST /api/whatsapp/force-reconnect` que chama o método `forceReconnect`

**File**: `frontend/src/pages/WhatsAppConnectionPage.tsx`

**Specific Changes**:
6. **Melhorar Tratamento de Erro**: Quando `fetchQRCode` falha após retries, oferecer botão "Forçar Reconexão" que chama o novo endpoint

7. **Adicionar Feedback Visual**: Mostrar mensagem clara quando QR code não está disponível ao invés de tela branca

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de duas fases: primeiro, expor contraexemplos que demonstram o bug no código não corrigido, depois verificar que a correção funciona corretamente e preserva comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Expor contraexemplos que demonstram o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: Escrever testes que simulam Evolution API retornando `{"count":0}` ou resposta sem `base64`. Executar estes testes no código NÃO CORRIGIDO para observar falhas e entender a causa raiz.

**Test Cases**:
1. **Test Count Zero Response**: Simular Evolution API retornando `{"count":0}` (falhará no código não corrigido - retorna undefined)
2. **Test Empty Response**: Simular Evolution API retornando `{}` (falhará no código não corrigido - retorna undefined)
3. **Test Null Base64**: Simular Evolution API retornando `{"base64": null}` (falhará no código não corrigido - retorna null)
4. **Test Missing QRCode Field**: Simular Evolution API retornando `{"other": "data"}` sem campo qrcode (falhará no código não corrigido - retorna undefined)

**Expected Counterexamples**:
- Método `getQRCode` retorna `undefined` ou `null` ao invés de lançar erro
- Possíveis causas: falta de validação, operador `||` retorna undefined quando ambos operandos são undefined

### Fix Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug existe, a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL response WHERE isBugCondition(response) DO
  result := getQRCode_fixed(response)
  ASSERT result throws QRCodeNotAvailableError
  ASSERT error.statusCode == 404
  ASSERT error.message contains "QR Code not available"
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug NÃO existe, a função corrigida produz o mesmo resultado que a função original.

**Pseudocode:**
```
FOR ALL response WHERE NOT isBugCondition(response) DO
  ASSERT getQRCode_original(response) = getQRCode_fixed(response)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que comportamento permanece inalterado para todas as entradas não-buggy

**Test Plan**: Observar comportamento no código NÃO CORRIGIDO primeiro para respostas válidas com QR code, depois escrever testes property-based capturando esse comportamento.

**Test Cases**:
1. **Valid QR Code Preservation**: Observar que respostas com `{"base64": "valid-data"}` funcionam corretamente no código não corrigido, depois verificar que continuam funcionando após correção
2. **Alternative Format Preservation**: Observar que respostas com `{"qrcode": {"base64": "valid-data"}}` funcionam corretamente, depois verificar preservação
3. **Connection Flow Preservation**: Observar que fluxo completo de conexão (criar instância → obter QR → escanear → conectar) funciona, depois verificar que continua funcionando
4. **Rate Limiting Preservation**: Observar que rate limiting funciona corretamente para requisições válidas, depois verificar que não foi afetado

### Unit Tests

- Testar `getQRCode` com diferentes formatos de resposta da Evolution API (count:0, empty, null, valid)
- Testar novo método `forceReconnect` com sucesso e falha de logout/restart
- Testar novo endpoint `/force-reconnect` com instância existente e não existente
- Testar tratamento de erro no frontend quando QR code não está disponível

### Property-Based Tests

- Gerar respostas aleatórias da Evolution API e verificar que QR codes válidos são sempre retornados corretamente
- Gerar estados aleatórios de instância e verificar que reconexão forçada sempre resulta em novo QR code ou erro claro
- Testar que rate limiting continua funcionando através de muitos cenários de requisições

### Integration Tests

- Testar fluxo completo: criar instância → Evolution retorna count:0 → forçar reconexão → obter QR code válido
- Testar fluxo de erro: criar instância → múltiplas falhas → mensagem de erro clara no frontend
- Testar que webhooks continuam funcionando após reconexão forçada
