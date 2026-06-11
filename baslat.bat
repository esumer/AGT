@echo off
chcp 65001 >nul
title ASM Gider Takip - Baslatici

echo ==========================================
echo ASM Gider Takip Sistemine Hos Geldiniz
echo ==========================================
echo.

:: Node.js kontrolu
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
echo Lutfen bu pencereyi sistemi kullanirken KAPATMAYIN! Cikmak icin CTRL+C tuslarina basabilirsiniz.
echo.

:: Tarayicida projeyi acmak icin 4 saniye bekleyip baslatan bir komut arka planda calistirilir
start /b cmd /c "timeout /t 4 >nul && start http://localhost:5173"

:: Backend ve Frontend'i ayni pencerede eszamanli (concurrently) baslatir
call npx --yes concurrently -k -n "Backend,Frontend" -c "green,blue" "cd backend && npm run dev" "cd frontend && npm run dev"
