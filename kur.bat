@echo off
title ASM Gider Takip - Kurulum

echo.
echo ==========================================
echo   ASM Gider Takip - Kurulum
echo ==========================================
echo.

REM Node.js kontrolu
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi!
    echo.
    echo Lutfen once Node.js kurun: https://nodejs.org
    echo Kurduktan sonra bilgisayari yeniden baslatip tekrar deneyin.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
echo [OK] Node.js: %NODE_VER%
echo.

REM npm kontrolu
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] npm bulunamadi!
    pause
    exit /b 1
)
echo [OK] npm bulundu.
echo.

REM Backend paketleri
echo [1/4] Backend paketleri yukleniyor...
cd /d "%~dp0backend"
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo [HATA] Backend paketleri yuklenemedi!
    pause
    exit /b 1
)
echo [OK] Backend hazir.
echo.

REM Veritabani
echo [2/4] Veritabani olusturuluyor...
if not exist uploads mkdir uploads
call npx prisma db push
call npx prisma generate
echo [OK] Veritabani hazir.
echo.

REM Frontend paketleri
echo [3/4] Arayuz derleniyor (2-3 dakika surebilir)...
cd /d "%~dp0frontend"
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo [HATA] Frontend paketleri yuklenemedi!
    pause
    exit /b 1
)

if not exist ".env.production" (
    echo VITE_API_URL=http://localhost:3000> .env.production
)

call npm run build
if %errorlevel% neq 0 (
    echo [HATA] Derleme basarisiz!
    echo        Hata detayi icin: cd frontend ve npm run build yazin.
    pause
    exit /b 1
)
echo [OK] Arayuz derlendi.
echo.

REM Tamamlandi
cd /d "%~dp0"
echo [4/4] Kurulum tamamlandi!
echo.
echo ==========================================
echo   Baslatmak icin: baslat.bat
echo ==========================================
echo.
pause
