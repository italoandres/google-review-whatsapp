@echo off
echo ========================================
echo Corrigindo Erros do Sistema
echo ========================================
echo.

echo [1/3] Limpando banco de dados antigo...
cd backend
if exist database\app.db (
    del database\app.db
    echo Banco antigo removido!
) else (
    echo Nenhum banco antigo encontrado.
)

echo.
echo [2/3] Reinicializando banco de dados...
call npm run init-db
if errorlevel 1 (
    echo ERRO ao inicializar banco!
    pause
    exit /b 1
)

echo.
echo [3/3] Testando banco de dados...
node test-db.js

echo.
echo ========================================
echo Correcao concluida!
echo.
echo Agora execute: start.bat
echo ========================================
pause
