@echo off
title ERP ODOO Runner
echo ========================================================
echo         INICIANDO ERP MODULAR (CLON DE ODOO)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Iniciando Servidor Backend FastAPI (Puerto 8000)...
start "ERP Backend (FastAPI)" cmd /k ".\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Iniciando Servidor Frontend React (Puerto 5173)...
start "ERP Frontend (Vite)" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Abriendo el navegador en http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   El ERP ya esta corriendo y se ha abierto en tu navegador.
echo   - Web App: http://localhost:5173
echo   - Documentacion API: http://localhost:8000/docs
echo ========================================================
echo.
pause
