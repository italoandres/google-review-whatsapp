# Guia de Troubleshooting: QR Code Não Aparece

## Situação Atual
- ✅ Frontend Netlify: https://avaliacaogoogle.netlify.app
- ✅ Backend Railway: https://review-google-whatsapp-production.up.railway.app
- ✅ Evolution API Railway: https://evolution-api-production-5961.up.railway.app
- ✅ Variáveis de ambiente configuradas
- ❌ QR Code não aparece (tela branca)

## Diagnóstico Passo a Passo

### 1. Verificar Logs do Railway Backend

**Como fazer:**
1. Acesse Railway (conta avaliacaowhats-spec)
2. Abra o projeto do backend
3. Clique em **Deployments** → Deploy ativo → **View Logs**
4. Deixe os logs abertos
5. Em outra aba, acesse https://avaliacaogoogle.netlify.app/whatsapp-connection
6. Clique em "Gerar QR Code"
7. Volte para os logs e copie as últimas 30 linhas

**O que procurar nos logs:**
- ❌ `Failed to create instance`
- ❌ `Network error`
- ❌ `Request timeout`
- ❌ `401 Unauthorized`
- ❌ `404 Not Found`
- ❌ `500 Internal Server Error`

### 2. Verificar Console do Navegador

**Como fazer:**
1. Abra https://avaliacaogoogle.netlify.app/whatsapp-connection
2. Pressione F12 → aba Console
3. Clique em "Gerar QR Code"
4. Copie todos os erros que aparecerem

**O que procurar:**
- ❌ `Failed to load resource: 500`
- ❌ `Failed to load resource: 401`
- ❌ `TypeError: Cannot read property`
- ❌ `Network Error`

### 3. Verificar Aba Network

**Como fazer:**
1. F12 → aba Network
2. Clique em "Gerar QR Code"
3. Procure pela requisição `create-instance`
4. Clique nela
5. Veja:
   - **Status**: Deve ser 200 ou 201
   - **Response**: O que o servidor retornou
   - **Preview**: Visualização da resposta

### 4. Testar Evolution API Diretamente

```powershell
# Teste 1: Evolution API está online?
curl https://evolution-api-production-5961.up.railway.app

# Teste 2: Criar instância manualmente
$headers = @{
    "apikey" = "429683C4C977415CAAFCCE10F7D50A29"
    "Content-Type" = "application/json"
}

$body = @{
    instanceName = "test-instance"
    qrcode = $true
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

curl -Method POST `
  -Uri "https://evolution-api-production-5961.up.railway.app/instance/create" `
  -Headers $headers `
  -Body $body
```

**Resultado esperado:**
```json
{
  "instance": {
    "instanceName": "test-instance",
    "status": "created"
  },
  "hash": {
    "apikey": "..."
  }
}
```

### 5. Verificar Conectividade Backend → Evolution API

No Railway backend, vá em **Deployments** → **View Logs** e procure por:

```
✅ Configuration validated successfully
🔗 Evolution API: https://evolution-api-production-5961.up.railway.app
```

Se não aparecer, há problema na configuração.

## Possíveis Causas e Soluções

### Causa 1: Evolution API Offline
**Sintoma**: Logs mostram "Network error" ou "Request timeout"
**Solução**: 
1. Acesse Railway (conta 2)
2. Verifique se Evolution API está "Active"
3. Se não, clique em "Restart"

### Causa 2: API Key Incorreta
**Sintoma**: Logs mostram "401 Unauthorized"
**Solução**:
1. Verifique se `EVOLUTION_API_GLOBAL_KEY` no backend = `AUTHENTICATION_API_KEY` na Evolution API
2. Ambos devem ser: `429683C4C977415CAAFCCE10F7D50A29`

### Causa 3: URL Incorreta
**Sintoma**: Logs mostram "404 Not Found" ou "ENOTFOUND"
**Solução**:
1. Verifique `EVOLUTION_API_URL` no backend
2. Deve ser: `https://evolution-api-production-5961.up.railway.app`
3. SEM barra no final!

### Causa 4: Porta Incorreta
**Sintoma**: Evolution API não responde
**Solução**:
1. Verifique se Evolution API tem `SERVER_PORT=8080`
2. Verifique se o domínio público está configurado para porta 8080

### Causa 5: Timeout
**Sintoma**: Logs mostram "Request timeout"
**Solução**:
1. Evolution API pode estar lento
2. Aumente o timeout no código (atualmente 10 segundos)
3. Ou reinicie a Evolution API

### Causa 6: Banco de Dados
**Sintoma**: Logs mostram erro do Supabase
**Solução**:
1. Verifique se tabela `whatsapp_instances` existe no Supabase
2. Verifique se `SUPABASE_SERVICE_KEY` está correto

### Causa 7: CORS
**Sintoma**: Console do navegador mostra "CORS error"
**Solução**:
1. Backend já tem CORS habilitado
2. Mas verifique se Evolution API permite requisições do backend

## Checklist de Verificação Rápida

- [ ] Evolution API está "Active" no Railway
- [ ] Backend está "Active" no Railway
- [ ] `EVOLUTION_API_URL` = `https://evolution-api-production-5961.up.railway.app`
- [ ] `EVOLUTION_API_GLOBAL_KEY` = `429683C4C977415CAAFCCE10F7D50A29`
- [ ] Evolution API `AUTHENTICATION_API_KEY` = `429683C4C977415CAAFCCE10F7D50A29`
- [ ] Evolution API `SERVER_PORT` = `8080`
- [ ] Netlify `VITE_API_URL` = `https://review-google-whatsapp-production.up.railway.app/api`
- [ ] Tabela `whatsapp_instances` existe no Supabase

## Próximos Passos

1. **Colete os logs** do Railway backend quando tentar gerar QR Code
2. **Colete os erros** do Console do navegador
3. **Teste** a Evolution API diretamente com curl
4. **Me envie** essas informações para eu identificar o problema exato

## Comando para Coletar Todas as Informações

```powershell
# Teste 1: Backend está online?
Write-Host "=== TESTE 1: Backend Health ===" -ForegroundColor Cyan
curl https://review-google-whatsapp-production.up.railway.app/health

# Teste 2: Evolution API está online?
Write-Host "`n=== TESTE 2: Evolution API Health ===" -ForegroundColor Cyan
curl https://evolution-api-production-5961.up.railway.app

# Teste 3: Criar instância de teste
Write-Host "`n=== TESTE 3: Criar Instância Teste ===" -ForegroundColor Cyan
$headers = @{
    "apikey" = "429683C4C977415CAAFCCE10F7D50A29"
    "Content-Type" = "application/json"
}
$body = '{"instanceName":"test-debug","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'
curl -Method POST `
  -Uri "https://evolution-api-production-5961.up.railway.app/instance/create" `
  -Headers $headers `
  -Body $body
```

Execute esse script e me envie o resultado completo!
