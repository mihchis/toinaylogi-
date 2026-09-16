@echo off
chcp 65001 >nul
title ToiNayLoGi - Dung Supabase Local & Next.js UI
cd /d "%~dp0"

echo ================================================================
echo           TOI NAY LO GI - STOPPING SERVICES
echo ================================================================
echo.

:: 1. Tu dong tim duong dan Docker CLI neu chua co trong PATH
where docker >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%PATH%"
    ) else if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe" (
        set "PATH=%ProgramFiles%\Docker\Docker\resources\bin;%PATH%"
    ) else if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set "PATH=C:\Program Files\Docker\Docker\resources\bin;%PATH%"
    )
)

:: 2. Dung Supabase Local neu dang chay
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Dang dung cac container Supabase Local...
    call npx supabase stop
    echo [OK] Da dung xong Supabase Local.
) else (
    echo [*] Docker khong chay hoac Supabase chua duoc bat.
)

echo.
echo [OK] Hoan tat! Ban co the dong cua so nay.
pause
