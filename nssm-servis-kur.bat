@echo off
title ASM Gider Takip - Windows Servis Kurulumu (Yonetici Gerekli)
setlocal enabledelayedexpansion

REM Yonetici kontrolu
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Bu dosyayi sag tiklayip "Yonetici olarak calistir" secin!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   ASM Gider Takip - Windows Servis Kurulumu
echo ==========================================
echo.
echo Bu script programi Windows servisi olarak kurar.
echo Bilgisayar acildiginda otomatik baslar.
echo.

REM NSSM kontrolu
set NSSM_PATH=%~dp0tools\nssm.exe

if not exist "%NSSM_PATH%" (
    echo [UYARI] NSSM bulunamadi: %NSSM_PATH%
    echo.
    echo NSSM indirme adresi: https://nssm.cc/download
    echo   1. nssm.zip indirin ve acin
    echo   2. win64\nssm.exe dosyasini su yere koyun:
    echo      %~dp0tools\nssm.exe
    echo.
    if not exist "%~dp0tools" mkdir "%~dp0tools"
    echo Klasor olusturuldu: %~dp0tools
    echo.
    pause
    exit /b 1
)
echo [OK] NSSM bulundu.

REM Node.js yolu
for /f "tokens=*" %%i in ('where node') do set NODE_PATH=%%i
if "%NODE_PATH%"=="" (
    echo [HATA] Node.js bulunamadi!
    pause
    exit /b 1
)
echo [OK] Node.js: %NODE_PATH%

REM tsx yolu
set TSX_PATH=%~dp0backend\node_modules\.bin\tsx.cmd
if not exist "%TSX_PATH%" (
    echo [HATA] tsx bulunamadi. Lutfen once kur.bat calistirin.
    pause
    exit /b 1
)
echo [OK] tsx bulundu.
echo.

REM Mevcut servisi kaldir
set SERVICE_NAME=ASM-Gider-Takip
"%NSSM_PATH%" status "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo Mevcut servis kaldiriliyor...
    "%NSSM_PATH%" stop "%SERVICE_NAME%" >nul 2>&1
    "%NSSM_PATH%" remove "%SERVICE_NAME%" confirm >nul 2>&1
    echo [OK] Eski servis kaldirildi.
)

REM Servis kur
echo Servis kuruluyor...
"%NSSM_PATH%" install "%SERVICE_NAME%" "%NODE_PATH%"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%~dp0backend"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppParameters "%~dp0backend\node_modules\.bin\tsx.cmd src/index.ts"
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "ASM Gider Takip"
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "ASM Gider Takip - Klinik Gider Takip Sistemi"
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START
"%NSSM_PATH%" set "%SERVICE_NAME%" ObjectName LocalSystem

REM Ortam degiskenleri
"%NSSM_PATH%" set "%SERVICE_NAME%" AppEnvironmentExtra "NODE_ENV=production" "PORT=3000"

REM Log klasoru
if not exist "%~dp0logs" mkdir "%~dp0logs"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%~dp0logs\output.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%~dp0logs\error.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateFiles 1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateBytes 5000000

REM Servisi baslat
echo.
echo Servis baslatiliyor...
"%NSSM_PATH%" start "%SERVICE_NAME%"
timeout /t 3 >nul
"%NSSM_PATH%" status "%SERVICE_NAME%"

echo.
echo ==========================================
echo   Servis kurulumu tamamlandi!
echo ==========================================
echo.
echo Yonetim:
echo   Durum : sc query ASM-Gider-Takip
echo   Durdur: sc stop ASM-Gider-Takip
echo   Baslat: sc start ASM-Gider-Takip
echo.
echo Loglar: %~dp0logs\
echo.
pause
