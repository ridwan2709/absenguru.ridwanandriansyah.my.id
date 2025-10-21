@echo off
REM ============================================
REM Setup Cron Job untuk Notifikasi Jadwal Pagi
REM Windows Task Scheduler
REM ============================================

echo.
echo ========================================
echo   Setup Notifikasi Jadwal Otomatis
echo ========================================
echo.

REM Cek apakah running sebagai Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Script ini harus dijalankan sebagai Administrator!
    echo.
    echo Cara menjalankan sebagai Administrator:
    echo 1. Klik kanan pada file ini
    echo 2. Pilih "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [INFO] Checking PHP installation...

REM Cek PHP di XAMPP
set PHP_PATH=C:\xampp\php\php.exe
if not exist "%PHP_PATH%" (
    echo [WARNING] PHP tidak ditemukan di: %PHP_PATH%
    echo.
    set /p PHP_PATH="Masukkan path lengkap ke php.exe: "
)

if not exist "%PHP_PATH%" (
    echo [ERROR] PHP tidak ditemukan di: %PHP_PATH%
    echo.
    pause
    exit /b 1
)

echo [OK] PHP ditemukan: %PHP_PATH%
echo.

REM Get current directory (scripts folder)
set SCRIPT_PATH=%~dp0cron_jadwal_pagi.php

if not exist "%SCRIPT_PATH%" (
    echo [ERROR] File cron_jadwal_pagi.php tidak ditemukan!
    echo Path: %SCRIPT_PATH%
    echo.
    pause
    exit /b 1
)

echo [OK] Script ditemukan: %SCRIPT_PATH%
echo.

REM Buat folder logs jika belum ada (di parent directory)
if not exist "%~dp0..\logs" (
    echo [INFO] Membuat folder logs...
    mkdir "%~dp0..\logs"
)

echo [INFO] Membuat Task Scheduler...
echo.

REM Hapus task lama jika ada
schtasks /delete /tn "Notifikasi Jadwal Pagi" /f >nul 2>&1

REM Buat task baru
schtasks /create /tn "Notifikasi Jadwal Pagi" /tr "\"%PHP_PATH%\" \"%SCRIPT_PATH%\"" /sc daily /st 06:00 /f

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo   ✅ Setup Berhasil!
    echo ========================================
    echo.
    echo Task "Notifikasi Jadwal Pagi" telah dibuat.
    echo Jadwal akan otomatis terkirim setiap hari jam 06:00 pagi.
    echo.
    echo Informasi Task:
    echo - Nama: Notifikasi Jadwal Pagi
    echo - Jadwal: Setiap hari jam 06:00
    echo - PHP: %PHP_PATH%
    echo - Script: %SCRIPT_PATH%
    echo.
    echo Untuk melihat task:
    echo   taskschd.msc
    echo.
    echo Untuk test manual sekarang:
    echo   schtasks /run /tn "Notifikasi Jadwal Pagi"
    echo.
    echo Untuk melihat log:
    echo   %~dp0..\logs\cron_jadwal.log
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ Setup Gagal!
    echo ========================================
    echo.
    echo Terjadi kesalahan saat membuat task.
    echo Silakan coba setup manual via Task Scheduler.
    echo.
)

echo.
set /p TEST="Apakah Anda ingin test kirim jadwal sekarang? (Y/N): "
if /i "%TEST%"=="Y" (
    echo.
    echo [INFO] Menjalankan test...
    echo.
    schtasks /run /tn "Notifikasi Jadwal Pagi"
    echo.
    echo [INFO] Task sedang berjalan...
    echo [INFO] Tunggu beberapa detik dan cek grup WhatsApp Anda.
    echo [INFO] Cek log di: %~dp0..\logs\cron_jadwal.log
    echo.
)

pause
