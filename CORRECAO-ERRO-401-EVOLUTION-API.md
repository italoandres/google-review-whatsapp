# 🔧 Correção: Erro 401 Unauthorized - Evolution API

## ❌ Problema

```
Failed to create instance: Unauthorized
statusCode: 401
```

A Evolution API está rejeitando a requisição porque a chave de autenticação está incorreta.

## 🔍 Causa

O `EVOLUTION_API_GLOBAL_KEY` no arquivo `backend/.env` está incorreto ou a Evolution API mudou a forma de autenticação.

## ✅ Solução

### Passo 1: Verificar a Chave Atual

Acesse o painel da Evolution API:
```
https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host
```

### Passo 2: Obter a Chave Correta

1. Faça login no painel da Evolution API
2. Vá em **Settings** ou **Configurações**
3. Procure por **Global API Key** ou **API Key**
4. Copie a chave completa

### Passo 3: Atualizar o .env

Edite `backend/.env` e atualize a linha:

```env
EVOLUTION_API_GLOBAL_KEY=SUA_CHAVE_AQUI
```

**IMPORTANTE**: A chave deve ser exatamente como está no painel, sem espaços extras.

### Passo 4: Reiniciar o Backend

```bash
# Pare o backend (Ctrl+C no terminal)
# Inicie novamente
npm run dev
```

### Passo 5: Testar Novamente

1. Acesse http://localhost:5173/whatsapp-connection
2. Clique em "Conectar WhatsApp"
3. Verifique se o erro 401 sumiu

## 🧪 Teste Manual da API

Se ainda não funcionar, teste a Evolution API diretamente:

```bash
# Windows PowerShell
$headers = @{
    "apikey" = "SUA_CHAVE_AQUI"
    "Content-Type" = "application/json"
}

$body = @{
    instanceName = "test-instance"
    webhook = "http://localhost:3000/api/webhooks/evolution"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/instance/create" -Method Post -Headers $headers -Body $body
```

Se retornar 401, a chave está errada.
Se retornar 200/201, a chave está correta e o problema é no código.

## 📝 Checklist

- [ ] Acessei o painel da Evolution API
- [ ] Copiei a chave correta
- [ ] Atualizei `backend/.env`
- [ ] Reiniciei o backend
- [ ] Testei novamente
- [ ] Erro 401 sumiu

## 🔍 Outras Possibilidades

### Se a chave estiver correta mas ainda der 401:

1. **Verificar URL da Evolution API**
   - Confirme que a URL está correta no `.env`
   - Teste acessar a URL no navegador

2. **Verificar formato do header**
   - A Evolution API pode esperar `apikey` ou `Authorization`
   - Vou verificar o código do cliente

3. **Verificar se a Evolution API está online**
   ```bash
   curl https://avaliacaowhtas-evolution-api.w3bjsw.easypanel.host/health
   ```

## 🚀 Próximo Passo

Depois de corrigir a chave:
1. Teste criar instância novamente
2. QR code deve aparecer
3. Sistema deve funcionar normalmente

---

**Status**: Aguardando correção da chave da Evolution API
**Próximo passo**: Obter chave correta e atualizar `.env`
