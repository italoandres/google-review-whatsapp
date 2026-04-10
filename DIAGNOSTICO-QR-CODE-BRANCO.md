# Diagnóstico: QR Code em Branco

## Problema
Ao clicar em "Gerar QR Code" na página https://avaliacaogoogle.netlify.app/whatsapp-connection, o espaço do QR code fica em branco.

## Passos para Diagnóstico

### 1. Verificar Console do Navegador

Abra o Console do navegador (F12 → aba Console) e procure por:

**Erros de rede:**
```
Failed to load resource: the server responded with a status of 500
Failed to load resource: the server responded with a status of 401
Failed to load resource: the server responded with a status of 429
```

**Erros de JavaScript:**
```
TypeError: Cannot read property 'qrCode' of undefined
Error: Request failed with status code 500
```

**Mensagens de log:**
```
🌐 API URL: https://review-google-whatsapp-production.up.railway.app/api
```

### 2. Verificar Aba Network (Rede)

1. Abra F12 → aba Network
2. Clique em "Gerar QR Code" novamente
3. Procure pela requisição: `create-instance`
4. Clique nela e veja:
   - **Status Code**: Deve ser 200 ou 201
   - **Response**: O que o servidor retornou
   - **Headers**: Verifique se tem `Authorization: Bearer ...`

### 3. Possíveis Causas

#### Causa 1: Backend Railway não está configurado corretamente
**Sintoma**: Status 500 ou erro de conexão
**Solução**: Verificar variáveis de ambiente no Railway

#### Causa 2: Token de autenticação inválido
**Sintoma**: Status 401 Unauthorized
**Solução**: Fazer logout e login novamente

#### Causa 3: Evolution API não está respondendo
**Sintoma**: Status 500 com mensagem "Failed to create WhatsApp instance"
**Solução**: Verificar se Evolution API está online

#### Causa 4: Rate limit excedido
**Sintoma**: Status 429 Too Many Requests
**Solução**: Aguardar 10 minutos antes de tentar novamente

#### Causa 5: Frontend não está atualizado
**Sintoma**: Ainda mostra URL antiga do Render
**Solução**: Limpar cache do navegador (Ctrl + Shift + R)

## Testes Rápidos

### Teste 1: Backend está online?
```powershell
curl https://review-google-whatsapp-production.up.railway.app/health
```
**Esperado**: `{"status":"ok","timestamp":"...","uptime":...}`

### Teste 2: Evolution API está online?
```powershell
curl https://evolution-api-production-5961.up.railway.app
```
**Esperado**: `{"status":200,"message":"Welcome to the Evolution API...","version":"2.1.1"}`

### Teste 3: Criar instância manualmente (com token)
```powershell
# Primeiro, pegue seu token de autenticação do navegador:
# F12 → Application → Local Storage → Procure por "supabase.auth.token"

$token = "SEU_TOKEN_AQUI"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

curl -Method POST `
  -Uri "https://review-google-whatsapp-production.up.railway.app/api/evolution/create-instance" `
  -Headers $headers
```

## Próximos Passos

Depois de fazer esses testes, me envie:

1. **Erros do Console** (se houver)
2. **Status Code** da requisição `create-instance`
3. **Response** da requisição (o que o servidor retornou)
4. **Resultado dos 3 testes** acima

Com essas informações, vou conseguir identificar exatamente o problema!

## Checklist de Verificação

- [ ] Console do navegador aberto (F12)
- [ ] Aba Network aberta
- [ ] Cliquei em "Gerar QR Code"
- [ ] Vi a requisição `create-instance` na aba Network
- [ ] Anotei o Status Code
- [ ] Copiei a Response
- [ ] Testei se backend está online
- [ ] Testei se Evolution API está online
