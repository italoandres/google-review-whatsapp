# 🔍 Investigação Profunda: Auto-Import Não Funciona em Produção

## 📋 Problema Reportado

**Sintoma**: WhatsApp está conectado, mas novas conversas que aparecem no app do WhatsApp não estão sendo salvas com número e nome no sistema.

**Contexto**:
- ✅ Funcionava localmente (localhost)
- ❌ Não funciona em produção (Netlify frontend + Render backend)
- ✅ WhatsApp está conectado
- ❌ Contatos não são importados automaticamente

## 🔬 Análise do Fluxo de Auto-Import

### Como Deveria Funcionar

```
┌─────────────────────────────────────────────────────────────┐
│ FLUXO COMPLETO DE AUTO-IMPORT                                │
└─────────────────────────────────────────────────────────────┘

1. Usuário recebe mensagem no WhatsApp
   └─> WhatsApp Business API detecta nova mensagem

2. Evolution API processa mensagem
   └─> Gera evento: messages.upsert
       └─> Payload contém:
           - event: "messages.upsert"
           - instance: "user-xxx"
           - data.key.remoteJid: "5511999999999@s.whatsapp.net"
           - data.key.fromMe: false
           - data.pushName: "Nome do Contato"

3. Evolution API envia webhook
   └─> POST https://google-review-whatsapp.onrender.com/api/webhooks/evolution
       └─> Headers:
           - x-evolution-signature: HMAC-SHA256
       └─> Body: payload JSON

4. Backend recebe webhook
   └─> Rota: /api/webhooks/evolution
       └─> Valida assinatura
       └─> Chama WebhookHandler.handleEvent()

5. WebhookHandler processa evento
   └─> Identifica tipo: messages.upsert
       └─> Chama handleMessageUpsert()
           └─> Extrai contato com extractContact()
           └─> Normaliza telefone com normalizePhone()
           └─> Verifica duplicata com checkPhoneExists()
           └─> Cria cliente com createAutoImportedClient()

6. Cliente salvo no Supabase
   └─> Tabela: clients
       └─> Campos:
           - phone: "5511999999999" (normalizado)
           - name: "Nome do Contato"
           - import_source: "auto-imported"
           - satisfied: false
           - complained: false
           - review_status: "NOT_SENT"
```

## 🎯 Pontos de Falha Possíveis

### HIPÓTESE 1: Webhook Não Está Configurado Corretamente

**Verificação Necessária**:
```typescript
// Em instanceManager.ts, linha ~135
const webhookUrl = `${this.backendUrl}/api/webhooks/evolution`;
```

**Possíveis Problemas**:
1. ❌ `BACKEND_URL` no Render está incorreta
2. ❌ Evolution API não consegue acessar o webhook
3. ❌ Webhook não foi configurado na instância

**Como Verificar**:
- Checar variável de ambiente `BACKEND_URL` no Render
- Deve ser: `https://google-review-whatsapp.onrender.com`
- Verificar logs do Render para ver se webhook está chegando

### HIPÓTESE 2: Webhook Está Chegando Mas Não Está Sendo Processado

**Possíveis Causas**:
1. ❌ Validação de assinatura falhando
2. ❌ Payload com estrutura diferente
3. ❌ Erro no parsing do JSON
4. ❌ Erro no processamento (exception silenciosa)

**Evidências no Código**:
```typescript
// webhook.ts tem logs detalhados
console.log('📨 [Webhook] Received webhook request', { ... });
console.log('🔍 [Webhook] Full payload received:', { ... });
```

**Como Verificar**:
- Acessar logs do Render
- Procurar por: `[Webhook] Received webhook request`
- Se não aparecer: webhook não está chegando
- Se aparecer: verificar próximos logs

### HIPÓTESE 3: Extração de Contato Falhando

**Possíveis Causas**:
1. ❌ Payload da Evolution API mudou de estrutura
2. ❌ Campo `pushName` não está presente
3. ❌ Campo `remoteJid` em formato diferente
4. ❌ Mensagem é `fromMe: true` (enviada pelo usuário)

**Evidências no Código**:
```typescript
// contactExtractor.ts
export function extractContact(payload: EvolutionWebhookPayload): ExtractedContact | null {
  // Filtra mensagens enviadas pelo usuário
  if (payload.data.key.fromMe) {
    return null;
  }
  
  // Extrai telefone de remoteJid
  const phone = remoteJid.replace('@s.whatsapp.net', '');
  
  // Usa pushName ou telefone como fallback
  const name = payload.data.pushName || phone;
  
  return { phone, name };
}
```

**Como Verificar**:
- Logs do Render devem mostrar:
  ```
  🔍 [handleMessageUpsert] Attempting to extract contact
  📞 [handleMessageUpsert] Contact extraction result
  ```
- Se `hasContact: false`: extração falhou
- Se `hasContact: true`: extração funcionou

### HIPÓTESE 4: Normalização de Telefone Falhando

**Possíveis Causas**:
1. ❌ Telefone em formato inesperado
2. ❌ Normalização retorna `null`
3. ❌ Telefone não passa validação

**Evidências no Código**:
```typescript
// phoneNormalizer.ts
export function normalizePhone(phone: string): string {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Valida formato E.164
  if (!/^\d{10,15}$/.test(cleaned)) {
    return '';
  }
  
  return cleaned;
}
```

**Como Verificar**:
- Logs do Render devem mostrar:
  ```
  🔢 [handleMessageUpsert] Phone normalization
  ```
- Se `success: false`: normalização falhou
- Verificar `originalPhone` vs `normalizedPhone`

### HIPÓTESE 5: Verificação de Duplicata Falhando

**Possíveis Causas**:
1. ❌ Erro ao consultar Supabase
2. ❌ Telefone já existe (não é erro, mas não cria novo)
3. ❌ Timeout na consulta

**Evidências no Código**:
```typescript
// client.ts
export async function checkPhoneExists(userId: string, phone: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .eq('phone', normalizedPhone)
    .single();
  
  return !!data;
}
```

**Como Verificar**:
- Logs do Render devem mostrar:
  ```
  🔎 [handleMessageUpsert] Phone existence check
  ```
- Se `exists: true`: telefone já cadastrado (esperado)
- Se `exists: false`: deveria criar novo cliente

### HIPÓTESE 6: Criação de Cliente Falhando

**Possíveis Causas**:
1. ❌ Erro ao inserir no Supabase
2. ❌ Violação de constraint (telefone duplicado)
3. ❌ Permissões do Supabase incorretas
4. ❌ Schema da tabela diferente

**Evidências no Código**:
```typescript
// client.ts
export async function createAutoImportedClient(input: AutoImportClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: input.userId,
      name: input.name,
      phone: normalizedPhone,
      satisfied: false,
      complained: false,
      review_status: 'NOT_SENT',
      import_source: 'auto-imported',
      attendance_date: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    throw new Error('Erro ao criar cliente auto-importado');
  }
  
  return mapClientFromDB(data);
}
```

**Como Verificar**:
- Logs do Render devem mostrar:
  ```
  ✅ [handleMessageUpsert] Contact auto-imported
  ```
- Se não aparecer: criação falhou
- Verificar erro no log anterior

### HIPÓTESE 7: Evolution API Não Está Enviando Eventos

**Possíveis Causas**:
1. ❌ Webhook não configurado na instância
2. ❌ Evolution API com problema
3. ❌ Instância desconectada
4. ❌ Eventos desabilitados

**Como Verificar**:
- Consultar Evolution API diretamente:
  ```bash
  curl -X GET \
    "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/find/user-USER_ID" \
    -H "apikey: 429683C4C977415CAAFCCE10F7D50A29"
  ```
- Deve retornar configuração do webhook
- Verificar se `url` está correta
- Verificar se `events` inclui `messages.upsert`

## 🔧 Plano de Investigação

### PASSO 1: Verificar Logs do Render (5 minutos)

**Objetivo**: Descobrir se webhook está chegando

**Como fazer**:
1. Acessar Render Dashboard
2. Ir em "Logs" do backend
3. Enviar mensagem de teste no WhatsApp
4. Procurar por:
   - `📨 [Webhook] Received webhook request`
   - `🔍 [Webhook] Full payload received`
   - `📨 [handleMessageUpsert] Processing message`

**Resultado Esperado**:
- ✅ Se logs aparecem: webhook está chegando, problema é no processamento
- ❌ Se logs NÃO aparecem: webhook não está chegando

### PASSO 2: Verificar Configuração do Webhook na Evolution API (5 minutos)

**Objetivo**: Confirmar que webhook está configurado

**Como fazer**:
```bash
# Substituir USER_ID pelo seu user_id do Supabase
curl -X GET \
  "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/webhook/find/user-USER_ID" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D50A29"
```

**Resultado Esperado**:
```json
{
  "webhook": {
    "url": "https://google-review-whatsapp.onrender.com/api/webhooks/evolution",
    "enabled": true,
    "events": [
      "connection.update",
      "messages.upsert"
    ]
  }
}
```

**Problemas Possíveis**:
- ❌ URL incorreta
- ❌ `enabled: false`
- ❌ `messages.upsert` não está na lista de eventos

### PASSO 3: Verificar Variáveis de Ambiente no Render (2 minutos)

**Objetivo**: Confirmar que `BACKEND_URL` está correta

**Como fazer**:
1. Acessar Render Dashboard
2. Ir em "Environment" do backend
3. Verificar `BACKEND_URL`

**Valor Esperado**:
```
BACKEND_URL=https://google-review-whatsapp.onrender.com
```

**Problemas Possíveis**:
- ❌ URL com `http://` ao invés de `https://`
- ❌ URL com `/` no final
- ❌ URL incorreta ou localhost

### PASSO 4: Testar Webhook Manualmente (5 minutos)

**Objetivo**: Simular envio de webhook para testar processamento

**Como fazer**:
```bash
# Obter instanceName do Supabase
# SELECT instance_name FROM whatsapp_instances WHERE user_id = 'SEU_USER_ID';

# Enviar webhook de teste
curl -X POST \
  "https://google-review-whatsapp.onrender.com/api/webhooks/evolution" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "user-SEU_USER_ID",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST123"
      },
      "pushName": "Teste Manual",
      "message": {
        "conversation": "Teste"
      }
    }
  }'
```

**Resultado Esperado**:
- ✅ Status 200: webhook processado
- ✅ Logs no Render mostram processamento
- ✅ Cliente criado no Supabase

**Problemas Possíveis**:
- ❌ Status 401: assinatura inválida (esperado, pois não enviamos assinatura)
- ❌ Status 400: payload inválido
- ❌ Status 500: erro no processamento

### PASSO 5: Verificar Tabela de Webhook Logs no Supabase (3 minutos)

**Objetivo**: Ver histórico de webhooks recebidos

**Como fazer**:
```sql
-- Conectar no Supabase SQL Editor
SELECT 
  instance_name,
  event_type,
  processed,
  error_message,
  created_at,
  payload
FROM whatsapp_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado Esperado**:
- ✅ Registros com `event_type: 'messages.upsert'`
- ✅ `processed: true`
- ✅ `error_message: null`

**Problemas Possíveis**:
- ❌ Nenhum registro: webhook não está chegando
- ❌ `processed: false`: webhook chegou mas não foi processado
- ❌ `error_message` preenchido: erro no processamento

### PASSO 6: Verificar Tabela de Clientes no Supabase (2 minutos)

**Objetivo**: Ver se clientes estão sendo criados

**Como fazer**:
```sql
-- Conectar no Supabase SQL Editor
SELECT 
  id,
  name,
  phone,
  import_source,
  created_at
FROM clients
WHERE user_id = 'SEU_USER_ID'
  AND import_source = 'auto-imported'
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado Esperado**:
- ✅ Clientes com `import_source: 'auto-imported'`
- ✅ `name` e `phone` preenchidos

**Problemas Possíveis**:
- ❌ Nenhum cliente: auto-import não está funcionando
- ❌ Clientes sem nome: `pushName` não está vindo no payload

## 📊 Matriz de Diagnóstico

| Sintoma | Causa Provável | Solução |
|---------|----------------|---------|
| Logs do Render não mostram webhook | Webhook não configurado ou URL incorreta | Verificar BACKEND_URL e recriar instância |
| Logs mostram webhook mas não processamento | Erro no parsing ou validação | Verificar estrutura do payload |
| Logs mostram "Contact extraction result: hasContact: false" | Payload com estrutura diferente | Atualizar extractContact() |
| Logs mostram "Phone normalization: success: false" | Telefone em formato inválido | Atualizar normalizePhone() |
| Logs mostram "Phone existence check: exists: true" | Telefone já cadastrado | Normal, não é erro |
| Logs mostram erro ao criar cliente | Problema no Supabase | Verificar permissões e schema |
| Nenhum log aparece | Webhook não está chegando | Verificar Evolution API e BACKEND_URL |

## 🎯 Checklist de Verificação

### Ambiente de Produção
- [ ] BACKEND_URL no Render está correta
- [ ] Evolution API consegue acessar o backend
- [ ] Webhook está configurado na instância
- [ ] Eventos `messages.upsert` estão habilitados

### Processamento de Webhook
- [ ] Webhook está chegando ao backend
- [ ] Validação de assinatura está passando (ou pulada em dev)
- [ ] Payload está sendo parseado corretamente
- [ ] Evento `messages.upsert` está sendo roteado

### Extração de Contato
- [ ] `extractContact()` está retornando contato
- [ ] `pushName` está presente no payload
- [ ] `remoteJid` está no formato esperado
- [ ] Mensagem não é `fromMe: true`

### Normalização e Validação
- [ ] `normalizePhone()` está retornando telefone válido
- [ ] Telefone não está duplicado
- [ ] Formato E.164 está correto

### Criação de Cliente
- [ ] `createAutoImportedClient()` está sendo chamado
- [ ] Insert no Supabase está funcionando
- [ ] Permissões do Supabase estão corretas
- [ ] Cliente aparece na tabela `clients`

## 💡 Próximos Passos

### IMEDIATO (Fazer Agora)
1. ✅ Acessar logs do Render
2. ✅ Enviar mensagem de teste no WhatsApp
3. ✅ Verificar se logs aparecem
4. ✅ Identificar em qual etapa está falhando

### SE WEBHOOK NÃO ESTÁ CHEGANDO
1. Verificar `BACKEND_URL` no Render
2. Verificar configuração do webhook na Evolution API
3. Recriar instância se necessário

### SE WEBHOOK ESTÁ CHEGANDO MAS NÃO PROCESSA
1. Analisar payload completo nos logs
2. Verificar estrutura do payload
3. Atualizar `extractContact()` se necessário
4. Verificar permissões do Supabase

### SE TUDO PARECE CORRETO MAS NÃO FUNCIONA
1. Testar webhook manualmente com curl
2. Verificar tabela `whatsapp_webhook_logs`
3. Verificar tabela `clients`
4. Adicionar mais logs se necessário

---

**Status**: Investigação preparada, aguardando execução dos passos
**Próximo passo**: Executar PASSO 1 (Verificar Logs do Render)
**Tempo estimado**: 20-30 minutos para diagnóstico completo
