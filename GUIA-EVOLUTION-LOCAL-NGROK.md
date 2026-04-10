# Guia: Evolution API Local + ngrok

Como os serviços gratuitos estão exigindo banco de dados PostgreSQL (mais custos), a solução mais simples é rodar a Evolution API localmente e expor com ngrok.

## Passo 1: Instalar ngrok

1. Baixe: https://ngrok.com/download
2. Extraia o arquivo
3. Crie uma conta gratuita em https://ngrok.com
4. Copie seu token de autenticação
5. No PowerShell, rode: `ngrok config add-authtoken SEU_TOKEN`

## Passo 2: Rodar Evolution API localmente

### Opção A: Com Docker (Recomendado)

```powershell
docker run -d -p 8080:8080 `
  -e AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D50A29 `
  -e SERVER_URL=http://localhost:8080 `
  atendai/evolution-api:v2.1.1
```

### Opção B: Sem Docker (mais complicado)

Se não tiver Docker, precisaria instalar Node.js e clonar o repositório da Evolution API.

## Passo 3: Expor com ngrok

```powershell
ngrok http 8080
```

O ngrok vai mostrar algo assim:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8080
```

Copie esse URL (https://abc123.ngrok.io)

## Passo 4: Atualizar Railway

No Railway, atualize a variável:
```
EVOLUTION_API_URL=https://abc123.ngrok.io
```

## Passo 5: Testar

Acesse: https://abc123.ngrok.io

Deve aparecer a interface da Evolution API.

## Observações

- O ngrok gratuito muda o URL toda vez que você reinicia
- Você precisa deixar o PC ligado com o Docker e ngrok rodando
- Para produção real, seria melhor pagar por um serviço (Railway pago, Render pago, etc)

## Alternativa: Pagar pelo Railway

Se quiser evitar deixar o PC ligado, o plano pago do Railway custa $5/mês e permite múltiplos serviços.
