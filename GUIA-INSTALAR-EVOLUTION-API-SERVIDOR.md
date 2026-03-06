# 🚀 Guia: Instalar Evolution API no Seu Servidor (Opção 2)

## 📋 O Que Você Vai Fazer

Você vai criar UM servidor com Evolution API que vai servir TODOS os seus clientes.

**Custo estimado**: R$30-80/mês (dependendo do servidor)
**Tempo**: 30-60 minutos
**Dificuldade**: Média

---

## PASSO 1: Escolher e Contratar um Servidor VPS

### Opções Recomendadas (do mais barato ao mais caro):

#### A) Contabo (MAIS BARATO - Recomendado para começar)
- **Preço**: ~R$25/mês (€4.50)
- **Site**: https://contabo.com
- **Plano**: VPS S (4 vCPU, 8GB RAM)
- **Localização**: Escolha "Germany" ou "USA"

#### B) DigitalOcean
- **Preço**: $12/mês (~R$60)
- **Site**: https://www.digitalocean.com
- **Plano**: Basic Droplet (2 vCPU, 4GB RAM)
- **Localização**: Escolha "São Paulo" ou "New York"

#### C) Vultr
- **Preço**: $12/mês (~R$60)
- **Site**: https://www.vultr.com
- **Plano**: Cloud Compute (2 vCPU, 4GB RAM)

#### D) AWS Lightsail
- **Preço**: $10/mês (~R$50)
- **Site**: https://aws.amazon.com/lightsail
- **Plano**: 2GB RAM

### O Que Fazer:

1. Escolha uma das opções acima
2. Crie uma conta
3. Contrate um servidor com:
   - **Sistema Operacional**: Ubuntu 22.04 LTS
   - **RAM**: Mínimo 4GB (recomendado 8GB)
   - **Disco**: Mínimo 50GB

4. Anote as informações:
   - IP do servidor (exemplo: 123.45.67.89)
   - Usuário: root
   - Senha (ou chave SSH)

---

## PASSO 2: Conectar no Servidor

### No Windows (usando PowerShell):

```powershell
ssh root@SEU_IP_AQUI
```

Exemplo:
```powershell
ssh root@123.45.67.89
```

Se pedir confirmação, digite `yes` e pressione Enter.

---

## PASSO 3: Instalar Evolution API

### 3.1 - Atualizar o Sistema

Cole estes comandos um por vez:

```bash
apt update && apt upgrade -y
```

### 3.2 - Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 3.3 - Instalar Docker Compose

```bash
apt install docker-compose -y
```

### 3.4 - Criar Pasta para Evolution API

```bash
mkdir -p /root/evolution-api
cd /root/evolution-api
```

### 3.5 - Criar Arquivo de Configuração

```bash
nano docker-compose.yml
```

Cole este conteúdo (use Ctrl+Shift+V para colar):

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # Configurações Básicas
      - SERVER_URL=http://SEU_IP_AQUI:8080
      - AUTHENTICATION_API_KEY=MUDE_ESTA_CHAVE_SECRETA_123456789
      
      # Configurações de Instância
      - CONFIG_SESSION_PHONE_CLIENT=Evolution API
      - CONFIG_SESSION_PHONE_NAME=Chrome
      
      # Webhook
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
      
      # Logs
      - LOG_LEVEL=ERROR
      - LOG_COLOR=true
      
      # Database (SQLite - mais simples)
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=sqlite
      - DATABASE_CONNECTION_URI=file:./evolution.db
      
      # Outras configurações
      - QRCODE_LIMIT=30
      - INSTANCE_EXPIRATION_TIME=false
      
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

volumes:
  evolution_instances:
  evolution_store:
```

**IMPORTANTE**: Substitua:
- `SEU_IP_AQUI` pelo IP do seu servidor
- `MUDE_ESTA_CHAVE_SECRETA_123456789` por uma senha forte (anote ela!)

Para salvar:
1. Pressione `Ctrl + X`
2. Pressione `Y`
3. Pressione `Enter`

### 3.6 - Iniciar Evolution API

```bash
docker-compose up -d
```

### 3.7 - Verificar se Está Rodando

```bash
docker ps
```

Você deve ver algo como:
```
CONTAINER ID   IMAGE                              STATUS
abc123def456   atendai/evolution-api:latest      Up 10 seconds
```

---

## PASSO 4: Testar a Instalação

### 4.1 - Abrir no Navegador

Acesse: `http://SEU_IP_AQUI:8080`

Você deve ver uma mensagem JSON tipo:
```json
{
  "status": "ok",
  "message": "Evolution API is running"
}
```

### 4.2 - Testar a API

Abra o PowerShell e teste:

```powershell
curl http://SEU_IP_AQUI:8080/instance/fetchInstances -H "apikey: SUA_CHAVE_SECRETA"
```

Se retornar `[]` (lista vazia), está funcionando!

---

## PASSO 5: Configurar Domínio (OPCIONAL mas Recomendado)

### Por que usar domínio?

- URL bonita: `https://whatsapp.seusite.com` em vez de `http://123.45.67.89:8080`
- HTTPS (seguro)
- Mais profissional

### Como fazer:

1. Compre um domínio (exemplo: registro.br, GoDaddy, Namecheap)
2. Crie um subdomínio: `whatsapp.seudominio.com`
3. Aponte para o IP do servidor
4. Instale SSL (vou te ajudar depois se quiser)

**Por enquanto, pode pular isso e usar o IP direto.**

---

## PASSO 6: Criar Primeira Instância (TESTE)

### 6.1 - Criar Instância via API

No PowerShell:

```powershell
$body = @{
    instanceName = "teste-cliente1"
    qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://SEU_IP_AQUI:8080/instance/create" `
  -Method POST `
  -Headers @{"apikey"="SUA_CHAVE_SECRETA"; "Content-Type"="application/json"} `
  -Body $body
```

### 6.2 - Conectar WhatsApp

```powershell
Invoke-RestMethod -Uri "http://SEU_IP_AQUI:8080/instance/connect/teste-cliente1" `
  -Method GET `
  -Headers @{"apikey"="SUA_CHAVE_SECRETA"}
```

Vai retornar um QR Code em base64. Para ver:

1. Copie o código base64
2. Acesse: https://base64.guru/converter/decode/image
3. Cole o código
4. Vai aparecer o QR Code
5. Escaneie com seu WhatsApp

---

## PASSO 7: Configurar no Seu Sistema

Agora volte para o seu sistema em `http://localhost:5173/evolution-config` e preencha:

- **URL da API**: `http://SEU_IP_AQUI:8080`
- **API Key**: A chave secreta que você definiu
- **Nome da Instância**: `teste-cliente1`
- **Webhook Secret**: Crie uma senha forte (32+ caracteres)

---

## 📊 Gerenciamento de Clientes

### Para Cada Cliente Novo:

1. Criar instância via API (pode automatizar isso no seu sistema)
2. Cliente escaneia QR Code
3. Pronto!

### Comandos Úteis:

**Listar todas as instâncias:**
```bash
curl http://SEU_IP_AQUI:8080/instance/fetchInstances -H "apikey: SUA_CHAVE"
```

**Ver status de uma instância:**
```bash
curl http://SEU_IP_AQUI:8080/instance/connectionState/NOME_INSTANCIA -H "apikey: SUA_CHAVE"
```

**Deletar instância:**
```bash
curl -X DELETE http://SEU_IP_AQUI:8080/instance/delete/NOME_INSTANCIA -H "apikey: SUA_CHAVE"
```

---

## 🔧 Manutenção

### Ver Logs:
```bash
cd /root/evolution-api
docker-compose logs -f
```

### Reiniciar:
```bash
docker-compose restart
```

### Parar:
```bash
docker-compose down
```

### Iniciar:
```bash
docker-compose up -d
```

### Atualizar para Nova Versão:
```bash
docker-compose pull
docker-compose up -d
```

---

## 💰 Modelo de Negócio Sugerido

### Seus Custos:
- Servidor VPS: R$30-80/mês
- Domínio (opcional): R$40/ano

### Você Cobra do Cliente:
- Taxa de Setup: R$100 (uma vez)
- Mensalidade: R$50-100/mês por cliente

### Exemplo com 10 Clientes:
- **Receita**: R$500-1000/mês
- **Custo**: R$80/mês (servidor)
- **Lucro**: R$420-920/mês

---

## ❓ Problemas Comuns

### "Connection refused"
- Verifique se o firewall está liberado na porta 8080
- No painel do VPS, libere a porta 8080

### "Container keeps restarting"
- Veja os logs: `docker-compose logs`
- Provavelmente erro no docker-compose.yml

### "QR Code não aparece"
- Verifique se a instância foi criada
- Tente novamente o comando de connect

---

## 🎯 Próximos Passos

Depois que testar e funcionar:

1. ✅ Configurar domínio + SSL (HTTPS)
2. ✅ Automatizar criação de instâncias no seu sistema
3. ✅ Criar painel de administração para gerenciar clientes
4. ✅ Configurar backup automático

---

**Dúvidas?** Me chame que eu te ajudo! 🚀
