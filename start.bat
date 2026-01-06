@echo off
echo ========================================
echo Sistema de Avaliacoes Google - Iniciar
echo ========================================
echo.

echo [1/2] Iniciando Backend...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Sistema iniciado!
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Aguarde alguns segundos e acesse:
echo http://localhost:5173
echo ========================================
pause
