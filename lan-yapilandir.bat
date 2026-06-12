@echo off
title ASM Gider Takip - LAN Ayari (Yonetici Gerekli)

REM Yonetici kontrolu
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Bu dosyayi sag tiklayip "Yonetici olarak calistir" secin!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   ASM Gider Takip - LAN Ayari
echo ==========================================
echo.
echo Mevcut IP adresiniz:
echo.
ipconfig | findstr /i "IPv4"
echo.

REM Guvennlik Duvari kurali
echo [1/2] Guvenlik Duvari kurali ekleniyor (Port 3000)...
netsh advfirewall firewall delete rule name="ASM Gider Takip" >nul 2>&1
netsh advfirewall firewall add rule name="ASM Gider Takip" dir=in action=allow protocol=TCP localport=3000 description="ASM Gider Takip ag erisimi"

if %errorlevel% equ 0 (
    echo [OK] Guvenlik Duvari kurali eklendi.
) else (
    echo [HATA] Kural eklenemedi.
)
echo.

REM IP adresi bul
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set RAWIP=%%a
    goto :found
)
:found
set RAWIP=%RAWIP: =%

echo [2/2] Agdaki diger bilgisayarlardan erisim:
echo.
echo   Bu bilgisayarda : http://localhost:3000
echo   Agdaki diger PC : http://%RAWIP%:3000
echo.

echo Frontend API URL guncelleniyor...
echo VITE_API_URL=http://%RAWIP%:3000> "%~dp0frontend\.env.production"
echo [OK] frontend\.env.production: VITE_API_URL=http://%RAWIP%:3000

echo.
echo Frontend yeniden derleniyor...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% equ 0 (
    echo [OK] Derleme tamamlandi!
) else (
    echo [HATA] Derleme basarisiz. Lutfen once kur.bat calistirin.
)

echo.
echo ==========================================
echo   LAN ayari tamamlandi!
echo ==========================================
echo.
echo Statik IP icin: Ag Ayarlari > Ethernet/WiFi > IPv4
echo   Ornek: 192.168.1.100 / 255.255.255.0 / Gecit: 192.168.1.1
echo.
pause
