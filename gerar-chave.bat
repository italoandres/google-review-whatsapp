@echo off
echo ========================================
echo   GERAR CHAVE DE CRIPTOGRAFIA
echo ========================================
echo.
echo Gerando chave secreta...
echo.

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

echo.
echo ========================================
echo COPIE A CHAVE ACIMA (64 caracteres)
echo ========================================
echo.
echo Agora voce precisa:
echo 1. Copiar a chave acima (Ctrl+C)
echo 2. Abrir o arquivo: backend\.env
echo 3. Encontrar a linha: ENCRYPTION_KEY=
echo 4. Colar a chave: ENCRYPTION_KEY=sua-chave-aqui
echo 5. Salvar o arquivo (Ctrl+S)
echo.
pause
