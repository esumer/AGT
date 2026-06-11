@echo off
chcp 65001 >nul
title ASM Gider Takip - Baslatici

echo ==========================================
echo ASM Gider Takip Sistemine Hos Geldiniz
echo ==========================================
echo.

REM Control Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Node.js bilgisayarinizda kurulu degil!
    echo Sistemi calistirmak icin lutfen https://nodejs.org/tr/download adresinden Node.js'i indirip kurun.
    pause
    exit /b
)

echo [1/4] Arka yuz (Backend) paketleri yukleniyor...
cd backend
if not exist uploads mkdir uploads
call npm install --no-audit --no-fund --loglevel=error >nul 2>&1

echo.
echo [2/4] Veritabani ayarlari yapilandiriliyor...
call npx prisma db push >nul 2>&1
call npx prisma generate >nul 2>&1
cd ..

echo.
echo [3/4] On yuz (Frontend) paketleri yukleniyor...
cd frontend
call npm install --no-audit --no-fund --loglevel=error >nul 2>&1
cd ..

echo.
echo [4/4] Sistem baslatiliyor... 
echo +--------------------------------------------------+
echo :                                                  :
echo :     LUTFEN BU PENCEREYI SISTEMI KULLANIRKEN      :
echo :                  KAPATMAYIN!                     :
echo :                                                  :
echo +--------------------------------------------------+
echo.

REM Start Backend and Frontend concurrently
call npx --yes concurrently -k -n "Backend,Frontend" -c "green,blue" "cd backend && npm run dev" "cd frontend && node run-dev.cjs"
