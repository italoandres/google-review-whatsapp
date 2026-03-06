# Sistema Multi-Tenant com Evolution API

## Como Funciona ATUALMENTE

### Arquitetura Atual
```
Sistema → Evolution API (1 instância manual) → WhatsApp de 1 cliente
```

**Problema**: Você precisa criar instâncias manualmente no Evolution API para cada cliente.

### Fluxo Atual (Manual)
1. Cliente 1 (Loja de Gás) faz login no sistema
2. **VOCÊ** acessa Evolution API Manager
3. **VOCÊ** cria instância `loja-gas-instance`
4. **VOCÊ** pega API Key e configura no sistema
5. Cliente escaneia QR Code
6. Repete para Cliente 2, Cliente 3, etc...

---

## Como Deveria Funcionar (AUTOMÁTICO)

### Arquitetura Multi-Tenant
```
Sistema → Evolution API (cria instâncias automaticamente) → WhatsApp de N clientes
  ├─ Cliente 1 (Loja de Gás) → instância auto-criada
  ├─ Cliente 2 (Pizzaria) → instância auto-criada
  └─ Cliente 3 (Salão) → instância auto-criada
```

### Fluxo Automático (O que precisa ser implementado)
1. Cliente faz login no sistema
2. Cliente vai em "Configurações WhatsApp"
3. Cliente clica em "Conectar WhatsApp"
4. **SISTEMA cria instância automaticamente via API**
5. QR Code aparece na tela
6. Cliente escaneia com o próprio celular
7. Pronto! Sem você precisar fazer nada

---

## O Que Precisa Ser Implementado

### 1. API Key Global do Evolution API

Você precisa configurar UMA API Key global no backend que tem permissão para criar instâncias:

**No Render (variáveis de ambiente do backend):**
```
EVOLUTION_API_URL=https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
EVOLUTION_API_GLOBAL_KEY=sua-api-key-global-aqui
```

### 2. Endpoint para Criar Instância Automaticamente

**Backend** (`backend/src/routes/evolution.ts`):
```typescript
/**
 * POST /api/evolution/create-instance
 * Cria instância automaticamente para o usuário
 */
router.post('/evolution/create-instance', authMiddleware, async (req, res) => {
  const userId = req.user?.userId;
  const instanceName = `user-${userId.substring(0, 8)}`; // Nome único por usuário
  
  // Chama Evolution API para criar instância
  const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'apikey': EVOLUTION_API_GLOBAL_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instanceName: instanceName,
      integration: 'WHATSAPP-BAILEYS'
    })
  });
  
  // Salva configuração no banco
  // Retorna QR Code para o frontend
});
```

### 3. Endpoint para Obter QR Code

**Backend**:
```typescript
/**
 * GET /api/evolution/qrcode
 * Retorna QR Code da instância do usuário
 */
router.get('/evolution/qrcode', authMiddleware, async (req, res) => {
  const config = await getConfig(userId);
  
  // Busca QR Code na Evolution API
  const response = await fetch(`${config.apiUrl}/instance/connect/${config.instanceName}`, {
    headers: { 'apikey': GLOBAL_API_KEY }
  });
  
  const data = await response.json();
  res.json({ qrcode: data.qrcode, base64: data.base64 });
});
```

### 4. Interface para Conectar WhatsApp

**Frontend** (`frontend/src/pages/EvolutionConfigPage.tsx`):
```tsx
const handleConnectWhatsApp = async () => {
  // 1. Criar instância automaticamente
  await evolutionApi.createInstance();
  
  // 2. Buscar QR Code
  const { qrcode } = await evolutionApi.getQRCode();
  
  // 3. Exibir QR Code na tela
  setQRCodeImage(qrcode);
  
  // 4. Polling para verificar se conectou
  const interval = setInterval(async () => {
    const status = await evolutionApi.checkConnection();
    if (status === 'connected') {
      clearInterval(interval);
      alert('WhatsApp conectado com sucesso!');
    }
  }, 3000);
};
```

---

## Comparação: Manual vs Automático

### Manual (Como está agora)
```
❌ Você cria instância no Evolution API
❌ Você copia API Key
❌ Você configura no sistema
❌ Cliente escaneia QR Code
❌ Repete para cada cliente
⏱️ Tempo: 5-10 minutos por cliente
```

### Automático (Como deveria ser)
```
✅ Cliente clica em "Conectar WhatsApp"
✅ Sistema cria instância automaticamente
✅ QR Code aparece na tela
✅ Cliente escaneia
✅ Pronto!
⏱️ Tempo: 30 segundos por cliente
```

---

## Próximos Passos

### Para Implementar Multi-Tenant Automático:

1. **Obter API Key Global do Evolution API**
   - Acesse Evolution API Manager
   - Vá em Settings → API Keys
   - Gere uma API Key com permissão de criar instâncias
   
2. **Configurar no Backend**
   - Adicionar `EVOLUTION_API_GLOBAL_KEY` no Render
   
3. **Implementar Endpoints**
   - `POST /api/evolution/create-instance`
   - `GET /api/evolution/qrcode`
   - `GET /api/evolution/connection-status`
   
4. **Atualizar Frontend**
   - Botão "Conectar WhatsApp"
   - Exibir QR Code
   - Polling de status de conexão

---

## Quer que eu implemente isso?

Se sim, vou criar um spec completo para implementar o sistema multi-tenant automático. Cada cliente poderá conectar o próprio WhatsApp sem você precisar fazer nada manualmente.
