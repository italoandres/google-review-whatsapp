# Bugfix Requirements Document

## Introduction

Este documento descreve a correção do bug onde o QR code não aparece no frontend quando o usuário tenta conectar o WhatsApp. A Evolution API retorna `{"count":0}` indicando que não há QR code disponível, resultando em uma tela branca no frontend e a instância ficando presa no estado "connecting" sem QR code válido.

O bug impede que usuários conectem suas contas WhatsApp, bloqueando uma funcionalidade crítica do sistema.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN Evolution API retorna HTTP 200 com body `{"count":0}` (sem QR code) THEN o sistema não detecta que o QR code está ausente

1.2 WHEN Evolution API não gera QR code imediatamente após criar instância THEN o frontend tenta buscar QR code inexistente com retry (10 tentativas)

1.3 WHEN todas as tentativas de retry falham (404) THEN o frontend mostra tela branca ao invés de mensagem de erro clara

1.4 WHEN instância fica em estado "connecting" sem QR code THEN não há mecanismo para forçar regeneração do QR code

1.5 WHEN QR code expira ou não existe THEN o sistema não oferece opção de reconexão automática

### Expected Behavior (Correct)

2.1 WHEN Evolution API retorna `{"count":0}` THEN o sistema SHALL detectar ausência de QR code e retornar erro 404 apropriado

2.2 WHEN Evolution API não gera QR code imediatamente THEN o sistema SHALL aguardar ou forçar geração antes de retornar resposta

2.3 WHEN QR code não está disponível após retries THEN o frontend SHALL exibir mensagem de erro clara com opção de tentar novamente

2.4 WHEN instância está em "connecting" sem QR code THEN o sistema SHALL fornecer endpoint para forçar reconexão e gerar novo QR code

2.5 WHEN QR code expira ou não existe THEN o sistema SHALL oferecer reconexão automática ou manual com feedback claro ao usuário

### Unchanged Behavior (Regression Prevention)

3.1 WHEN Evolution API retorna QR code válido com sucesso THEN o sistema SHALL CONTINUE TO exibir QR code corretamente no frontend

3.2 WHEN usuário escaneia QR code válido THEN o sistema SHALL CONTINUE TO conectar instância e atualizar status para "connected"

3.3 WHEN instância já está conectada THEN o sistema SHALL CONTINUE TO retornar status "connected" sem gerar novo QR code

3.4 WHEN usuário solicita desconexão THEN o sistema SHALL CONTINUE TO desconectar instância corretamente

3.5 WHEN rate limit é excedido THEN o sistema SHALL CONTINUE TO retornar erro 429 com retry-after apropriado

3.6 WHEN webhook de CONNECTION_UPDATE é recebido THEN o sistema SHALL CONTINUE TO atualizar status da instância no banco de dados
