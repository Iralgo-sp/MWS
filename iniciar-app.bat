@echo off
cd /d "%~dp0"

start "Backend - Vehiculos" cmd /k "cd backend && npm run dev"
start "Frontend - Vehiculos" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
