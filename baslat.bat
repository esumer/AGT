@echo off
chcp 65001 >nul
title ASM Gider Takip - Başlatıcı

echo ==========================================
echo ASM Gider Takip Sistemine Hos Geldiniz
echo ==========================================
echo.

:: Node.js kontrolü
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Node.js bilgisayarinizda kurulu degil!
    echo Sistemi calistirmak icin lutfen https://nodejs.org adresinden Node.js'i indirip kurun.
    pause
    exit /b
)

echo [1/4] Arka yuz (Backend) paketleri kontrol ediliyor ve yukleniyor...
cd backend
call npm install

echo.
echo [2/4] Veritabani ayarlari yapilandiriliyor...
call npx prisma db push
call npx prisma generate
cd ..

echo.
echo [3/4] On yuz (Frontend) paketleri kontrol ediliyor ve yukleniyor...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Sistem baslatiliyor... 
echo Lutfen acilan pencereleri sistemi kullanirken KAPATMAYIN!
echo.

:: Backend'i ayri bir komut penceresinde baslatir
start "ASM Gider Takip - Backend (Sunucu)" cmd /c "title ASM Gider Takip - Backend Sunucusu && color 0A && cd backend && npm run dev"

:: Sunucunun acilmasi icin 4 saniye bekle
timeout /t 4 >nul

:: Tarayicida projeyi ac
start http://localhost:5173

:: Frontend'i (on yuz) mevcut pencerede baslatir
title ASM Gider Takip - Frontend Sunucusu
color 0B
cd frontend
npm run dev
