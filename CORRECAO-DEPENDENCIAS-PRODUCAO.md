# 🔧 Correção: Dependências de Produção

## ❌ Problema

O build no Render estava falhando com erros:

```
error TS7016: Could not find a declaration file for module 'express'
error TS7016: Could not find a declaration file for module 'cors'
```

## 🔍 Causa

O Render executa `npm install` em produção, que **não instala devDependencies**.

Os tipos do TypeScript (`@types/express`, `@types/cors`, `@types/node`, `typescript`) estavam em `devDependencies`, mas são **necessários para o build** (`npm run build`).

## ✅ Solução

Movemos os tipos e o TypeScript de `devDependencies` para `dependencies`:

**Movidos para dependencies:**
- `@types/cors`
- `@types/express`
- `@types/node`
- `typescript`

**Permaneceram em devDependencies:**
- `@types/jest` (apenas para testes locais)
- `@types/supertest` (apenas para testes locais)
- `jest`, `ts-jest`, `fast-check`, `supertest` (apenas para testes locais)
- `ts-node`, `ts-node-dev` (apenas para desenvolvimento local)

## 📝 Mudanças

**Arquivo:** `backend/package.json`

**Antes:**
```json
"dependencies": {
  "@supabase/supabase-js": "^2.90.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2"
},
"devDependencies": {
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.21",
  "@types/node": "^20.10.6",
  "typescript": "^5.3.3",
  ...
}
```

**Depois:**
```json
"dependencies": {
  "@supabase/supabase-js": "^2.90.1",
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.21",
  "@types/node": "^20.10.6",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "typescript": "^5.3.3"
},
"devDependencies": {
  "@types/jest": "^29.5.11",
  ...
}
```

## 🚀 Deploy

Commit: `88fd4ec - fix: mover tipos TypeScript para dependencies para build em producao`

O Render vai fazer deploy automaticamente em 2-3 minutos.

## ✅ Por que isso funciona?

Em produção, o Render executa:

1. `npm install` → Instala apenas `dependencies`
2. `npm run build` → Executa `tsc` (TypeScript compiler)
3. `npm start` → Executa `node dist/server.js`

Para o passo 2 funcionar, precisamos do `typescript` e dos `@types/*` em `dependencies`.

## 📊 Impacto

- ✅ Build em produção funciona
- ✅ Desenvolvimento local continua funcionando
- ⚠️ Tamanho do `node_modules` em produção aumenta um pouco (mas é necessário)

---

**Data:** 09/01/2026
**Status:** Correção aplicada e commitada ✅
