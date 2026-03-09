# 🔧 Correção: QR Code Sumindo Após 1 Segundo

## ❌ Problema Identificado

O QR code aparecia e sumia após 1 segundo porque:

1. **useEffect com dependência errada**: O `useEffect` tinha `pageStatus` como dependência
2. **Verificação contínua**: Chamava `checkConnectionStatus()` a cada 3 segundos quando `pageStatus === 'waiting_scan'`
3. **Mudança prematura de estado**: Quando detectava conexão, mudava `pageStatus` para `'connected'`, fazendo o QR code sumir

## ✅ Solução Aplicada

Restaurei a versão do commit `40b7437` que funcionava corretamente:

### Diferenças Principais

**ANTES (Problemático - commit f521b2f)**:
```typescript
// useEffect com dependência pageStatus - ERRADO
useEffect(() => {
  checkConnectionStatus();
  
  const interval = setInterval(() => {
    if (pageStatus === 'idle' || pageStatus === 'error') {
      checkConnectionStatus(); // A cada 10s
    } else if (pageStatus === 'waiting_scan') {
      checkConnectionStatus(); // A cada 3s - PROBLEMA!
    }
  }, STATUS_CHECK_INTERVAL_MS);
  
  return () => clearInterval(interval);
}, [pageStatus]); // Dependência causa re-renders
```

**DEPOIS (Correto - commit 40b7437)**:
```typescript
// useEffect sem dependências - CORRETO
useEffect(() => {
  checkConnectionStatus(); // Apenas uma vez ao montar
  
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };
}, []); // Roda apenas uma vez

// Polling controlado manualmente via startPolling()
const startPolling = useCallback(() => {
  // Inicia polling apenas quando necessário
  // Polling verifica status mas NÃO muda pageStatus prematuramente
}, [pollingInterval]);
```

### Fluxo Correto

1. Usuário clica "Conectar WhatsApp"
2. `handleConnect()` → cria instância
3. `fetchQRCode()` → busca QR code
4. `setPageStatus('waiting_scan')` → mostra QR code
5. `startPolling()` → inicia verificação a cada 3s
6. Polling verifica status MAS mantém `pageStatus === 'waiting_scan'`
7. Apenas quando detecta `status === 'connected'`, muda para `'connected'`
8. QR code permanece visível até conexão ser confirmada

## 📋 Arquivos Modificados

- `frontend/src/pages/WhatsAppConnectionPage.tsx` - Restaurado para versão funcional

## 🧪 Como Testar Localmente

```bash
# 1. Instalar dependências (se necessário)
cd frontend
npm install

# 2. Configurar variáveis de ambiente
# Criar frontend/.env com:
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://cuychbunipzwfaitnbor.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui

# 3. Rodar backend
cd ../backend
npm install
npm run dev

# 4. Rodar frontend (em outro terminal)
cd ../frontend
npm run dev

# 5. Acessar
# http://localhost:5173/whatsapp-connection
```

## ✅ Resultado Esperado

- QR code aparece e PERMANECE visível
- Barra de progresso mostra tentativas
- Contador de tempo restante funciona
- Apenas muda para "conectado" quando realmente conectar
- Não some após 1 segundo

## 🎯 Próximos Passos

1. Testar localmente primeiro
2. Commit e push quando confirmar que funciona
3. Deploy no Netlify (quando tiver limite disponível)

## 📝 Lição Aprendida

**NÃO usar `useEffect` com dependências que mudam frequentemente para polling**

- ❌ ERRADO: `useEffect(() => { ... }, [pageStatus])`
- ✅ CORRETO: `useEffect(() => { ... }, [])` + controle manual via `startPolling()`

Isso evita re-renders desnecessários e mantém o estado consistente.

---

**Status**: Código corrigido e pronto para teste local
**Próximo passo**: Testar localmente antes de fazer deploy
