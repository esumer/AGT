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

REM Port 3000 kontrolu - zaten kullanimda mi?
netstat -ano | findstr ":3000 " >nul 2>&1
if %errorlevel% equ 0 (
    echo [UYARI] Port 3000 baska bir program tarafindan kullaniliyor.
    echo         Program zaten calisiyor olabilir.
    echo.
    echo Tarayicinizda acin: http://localhost:3000
    echo.
    echo Eger program calismiyorsa, bilgisayari yeniden baslatip tekrar deneyin.
    pause
    exit /b 0
)

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

REM Eger buraya gelindiyse npm start hata verdi
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
