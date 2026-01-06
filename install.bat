@echo off
echo ========================================
echo Sistema de Avaliacoes Google - Instalacao
echo ========================================
echo.
echo Este script vai instalar todas as dependencias.
echo Isso pode levar alguns minutos...
echo.
pause

echo.
echo [1/3] Instalando dependencias do Backend...
cd backend
call npm install
if errorlevel 1 (
    echo ERRO ao instalar backend!
    pause
    exit /b 1
)

echo.
echo [2/3] Inicializando banco de dados...
call npm run init-db
if errorlevel 1 (
    echo ERRO ao inicializar banco!
    pause
    exit /b 1
)

echo.
echo [3/3] Instalando dependencias do Frontend...
cd ../frontend
call npm install
if errorlevel 1 (
    echo ERRO ao instalar frontend!
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo Instalacao concluida com sucesso!
echo.
echo Para iniciar o sistema, execute: start.bat
echo ========================================
pause
