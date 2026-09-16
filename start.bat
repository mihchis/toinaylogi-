@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title ToiNayLoGi - Khoi Dong UI Localhost & Supabase Local
cd /d "%~dp0"

echo ================================================================
echo           TOI NAY LO GI - LOCALHOST & SUPABASE LAUNCHER
echo ================================================================
echo.

:: 1. Kiem tra Node.js & npm
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Khong tim thay Node.js trong he thong!
    echo Vui long cai dat Node.js tai https://nodejs.org
    pause
    exit /b 1
)

:: 2. Tu dong tim duong dan Docker CLI neu chua co trong PATH
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

:: 3. Dong bo file cau hinh .env.local cho Supabase Local
if exist "server\scripts\setup-local-env.mjs" (
    node server\scripts\setup-local-env.mjs
)

:: 4. Kiem tra Docker Daemon
echo.
echo [*] Dang kiem tra trang thai Docker Engine...
set DOCKER_READY=0

docker info >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_READY=1
) else (
    echo [*] Docker Engine chua hoat dong. Dang khoi chay Docker Desktop...
    
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\frontend\Docker Desktop.exe" (
        start "" "%LOCALAPPDATA%\Programs\DockerDesktop\frontend\Docker Desktop.exe"
    ) else if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )

    echo [*] Dang cho Docker Desktop khoi dong (toi da 30 giay)...
    for /L %%i in (1,1,10) do (
        docker info >nul 2>&1
        if !errorlevel! equ 0 (
            set DOCKER_READY=1
            goto :docker_started
        )
        timeout /t 3 /nobreak >nul
    )
)

:docker_started
if "%DOCKER_READY%"=="1" (
    echo [OK] Docker Engine da san sang!
    echo.
    echo [*] Dang khoi dong he thong Supabase Local (PostgreSQL, Auth, Studio)...
    call npx supabase start
    if %errorlevel% neq 0 (
        echo [!] Supabase start gap canh bao hoac loi, van tiep tuc khoi chay UI...
    ) else (
        echo [OK] Supabase Local da khoi dong thanh cong!
        echo - Supabase Studio:  http://127.0.0.1:54323
        echo - Supabase API:     http://127.0.0.1:54321
    )
) else (
    echo.
    echo ================================================================
    echo [!] CHU Y VE DOCKER DESKTOP:
    echo Docker Desktop can vai chuc giay de khoi dong hoac can xac nhan
    echo tren giao dien ung dung (vi du: chap nhan dieu khoan hoac cai WSL 2).
    echo Neu may chua cai WSL 2, ban co the mo PowerShell (Admin) chay:
    echo     wsl --install
    echo ================================================================
    echo.
    set /p RUN_UI_CHOICE="Ban co muon tiep tuc mo giao dien Web UI localhost ngay khong? (Y/N, mac dinh Y): "
    if /i "%RUN_UI_CHOICE%"=="N" (
        echo Ban co the chay lai start.bat sau khi Docker Desktop da san sang!
        pause
        exit /b 0
    )
)

:: 5. Khoi dong Web UI Localhost
echo.
echo [*] Dang khoi dong Web UI ToiNayLoGi tren http://localhost:3000 ...
start "ToiNayLoGi - Browser" http://localhost:3000
echo.
echo ================================================================
echo   Ung dung dang chay tren: http://localhost:3000
echo   De dung may chu, nhan Ctrl + C trong cua so nay.
echo   Hoac chay stop.bat de tat ca Supabase & Next.js.
echo ================================================================
echo.
npm run dev
