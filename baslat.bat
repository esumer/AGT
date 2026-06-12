@echo off
title ASM Gider Takip

echo.
echo ==========================================
echo   ASM Gider Takip - Baslatiliyor
echo ==========================================
echo.

REM Node.js kontrolu
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi! Lutfen once kur.bat calistirin.
    pause
    exit /b 1
)

REM Frontend build kontrolu
if not exist "%~dp0frontend\dist\index.html" (
    echo [UYARI] Arayuz derlenmemis. Derleniyor...
    cd /d "%~dp0frontend"
    call npm run build
    if %errorlevel% neq 0 (
        echo [HATA] Derleme basarisiz. Lutfen once kur.bat calistirin.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
    echo [OK] Derleme tamamlandi.
)

REM ---- Port 3000'i temizle (eski process varsa kapat) ----
echo Port 3000 kontrol ediliyor...
for /f "skip=4 tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr "TCP.*:3000 "') do (
    if not "%%a"=="0" if not "%%a"=="" (
        echo   Eski process kapatiliyor: PID %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)
timeout /t 1 >nul

REM Backend klasorune gec
cd /d "%~dp0backend"

REM Veritabani guncelleme
echo Veritabani kontrol ediliyor...
call npx prisma db push >nul 2>&1
call npx prisma generate >nul 2>&1
echo [OK] Veritabani hazir.

echo.
echo +--------------------------------------------------+
echo :                                                  :
echo :   BU PENCEREYI KAPATMAYIN!                       :
echo :                                                  :
echo :   Tarayicinizda acin:                            :
echo :     http://localhost:3000                        :
echo :                                                  :
echo +--------------------------------------------------+
echo.

set NODE_ENV=production
call npm run start

REM Buraya gelindiyse npm start hata verdi
echo.
echo ==========================================
echo [HATA] Sunucu beklenmedik sekilde kapandi!
echo ==========================================
echo.
echo Olasi sebepler:
echo   - Port 3000 baska program tarafindan kullaniliyor
echo   - backend\.env dosyasinda hata var
echo   - node_modules eksik (kur.bat calistirin)
echo.
pause
