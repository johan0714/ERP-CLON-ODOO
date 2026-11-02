Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       INICIANDO ERP MODULAR (CLON DE ODOO)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "[1/2] Iniciando Backend FastAPI en http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/2] Iniciando Frontend React (Vite) en http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nServidores iniciados correctamente!" -ForegroundColor Cyan
Write-Host "  -> Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  -> API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
