# ✅ Logs Detalhados Adicionados

## 📋 O Que Foi Feito

Adicionei logs detalhados em 3 arquivos para diagnosticar o problema:

### 1. `backend/src/lib/evolutionApiClient.ts`

#### Método `setWebhook()`:
- ✅ Log antes de enviar requisição (URL, config, body length)
- ✅ Log da resposta (status, statusText, ok)
- ✅ Log do corpo do erro (response body completo)
- ✅ Log de sucesso quando webhook é configurado

#### Método `getConnectionState()`:
- ✅ Log da resposta da Evolution API (state, fullResponse)
- ✅ Log de erro se falhar

### 2. `backend/src/services/instanceManager.ts`

#### Método `getConnectionStatus()`:
- ✅ Log ao iniciar verificação (userId, instanceName, status atual no DB)
- ✅ Log quando não encontra instância
- ✅ Log do mapeamento de status (evolutionState → mappedStatus)
- ✅ Log quando atualiza status no DB (oldStatus → newStatus)
- ✅ Log de warning após retries falharem
- ✅ Log de erro inesperado

## 🎯 O Que os Logs Vão Revelar

### Problema 1: Webhook Falha com "Bad Request"

**Logs que vão aparecer**:
```
🔧 [setWebhook] Attempting to configure webhook
📡 [setWebhook] Response received { status: 400, statusText: 'Bad Request' }
❌ [setWebhook] Failed - Response body: { body: '...' }
```

**O que vamos descobrir**:
- Qual é o erro exato da Evolution API
- Se é problema de URL, eventos, ou formato

### Problema 2: Polling Não Detecta Conexão

**Logs que vão aparecer**:
```
🔍 [getConnectionStatus] Checking status { currentStatusInDB: 'connecting' }
📡 [getConnectionState] Response { state: 'open' }
🔄 [getConnectionStatus] Mapped status { evolutionState: 'open', mappedStatus: 'connected' }
✅ [getConnectionStatus] Status updated in DB { oldStatus: 'connecting', newStatus: 'connected' }
```

**O que vamos descobrir**:
- Se Evolution API retorna 'open' ou 'connecting'
- Se o mapeamento está correto
- Se o status está sendo atualizado no DB

## 📝 Próximos Passos

1. **Você**: Reiniciar backend e testar conexão
2. **Você**: Copiar logs que aparecerem
3. **Você**: Testar webhook manualmente com curl
4. **Você**: Me enviar todos os logs
5. **Eu**: Analisar logs e implementar correção específica

## 🔧 Arquivos Modificados

- `backend/src/lib/evolutionApiClient.ts` - Logs em setWebhook() e getConnectionState()
- `backend/src/services/instanceManager.ts` - Logs em getConnectionStatus()

## 📚 Guias Criados

- `GUIA-DEBUG-WEBHOOK.md` - Passo a passo completo para você testar
- `LOGS-ADICIONADOS-RESUMO.md` - Este arquivo (resumo do que foi feito)

---

**Status**: Logs adicionados com sucesso
**Próximo passo**: Seguir `GUIA-DEBUG-WEBHOOK.md`
**Tempo estimado**: 10 minutos de teste
