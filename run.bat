@echo off
:: FlowChat - Service Management Script for Windows
:: This script starts, stops, and checks the status of the FlowChat services

setlocal EnableDelayedExpansion

:: File to store PIDs
set "PID_FILE=%CD%\flowchat_services.pid"

:: Backend variables
set "BACKEND_DIR=%CD%\backend"
set "VENV_DIR=%BACKEND_DIR%\venv"
set "LOGS_DIR=%BACKEND_DIR%\logs"
set "BACKEND_LOG=%LOGS_DIR%\backend.log"

:: Frontend variables
set "FRONTEND_DIR=%CD%\frontend"
set "FRONTEND_LOG=%FRONTEND_DIR%\frontend.log"

:: Create logs directory if it doesn't exist
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: Check if first argument is provided
if "%~1"=="" goto usage

:: Parse command
if "%~1"=="start" goto start_all
if "%~1"=="stop" goto stop_all
if "%~1"=="restart" goto restart_all
if "%~1"=="status" goto show_status
if "%~1"=="start-b" goto start_backend
if "%~1"=="start-f" goto start_frontend
if "%~1"=="stop-b" goto stop_backend
if "%~1"=="stop-f" goto stop_frontend
if "%~1"=="help" goto usage
goto usage

:start_all
echo Starting FlowChat services...
call :check_python
call :check_node
call :setup_venv
call :check_env_file
call :start_backend_proc
call :start_frontend_proc
goto end

:stop_all
echo Stopping FlowChat services...
call :stop_backend_proc
call :stop_frontend_proc
goto end

:restart_all
echo Restarting FlowChat services...
call :stop_backend_proc
call :stop_frontend_proc
call :check_python
call :check_node
call :setup_venv
call :check_env_file
call :start_backend_proc
call :start_frontend_proc
goto end

:start_backend
call :check_python
call :setup_venv
call :check_env_file
call :start_backend_proc
goto end

:start_frontend
call :check_node
call :start_frontend_proc
goto end

:stop_backend
call :stop_backend_proc
goto end

:stop_frontend
call :stop_frontend_proc
goto end

:show_status
echo ===== FlowChat Services Status =====
call :is_backend_running
if !errorlevel! equ 0 (
    for /f "tokens=2 delims=:" %%a in ('findstr "backend:" "%PID_FILE%"') do (
        echo Backend: Running (PID: %%a)
    )
) else (
    echo Backend: Stopped
)

call :is_frontend_running
if !errorlevel! equ 0 (
    for /f "tokens=2 delims=:" %%a in ('findstr "frontend:" "%PID_FILE%"') do (
        echo Frontend: Running (PID: %%a)
    )
) else (
    echo Frontend: Stopped
)
echo ====================================
goto end

:: Helper functions

:check_python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH. Please install it to run the backend.
    exit /b 1
)
exit /b 0

:check_node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH. Please install it to run the frontend.
    exit /b 1
)
exit /b 0

:setup_venv
echo Setting up Python virtual environment...

if not exist "%VENV_DIR%" (
    :: Create virtual environment
    python -m venv "%VENV_DIR%"
    
    :: Activate virtual environment and install dependencies
    call "%VENV_DIR%\Scripts\activate.bat"
    pip install -r "%BACKEND_DIR%\requirements.txt"
    call "%VENV_DIR%\Scripts\deactivate.bat"
    
    echo Virtual environment created and dependencies installed.
) else (
    echo Virtual environment already exists.
)
exit /b 0

:check_env_file
if not exist "%BACKEND_DIR%\.env" (
    if exist "%BACKEND_DIR%\.env.example" (
        echo Creating .env file from .env.example...
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo Please update the .env file with your actual configuration values.
    ) else (
        echo No .env.example file found. Please create a .env file manually.
    )
)
exit /b 0

:start_backend_proc
echo Starting FlowChat Backend...

:: Check if already running
call :is_backend_running
if !errorlevel! equ 0 (
    echo Backend is already running.
    exit /b 0
)

:: Start the backend
cd "%BACKEND_DIR%"
call "%VENV_DIR%\Scripts\activate.bat"

:: Start with START /B to run in background
start /B cmd /c "python app.py > "%BACKEND_LOG%" 2>&1"
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq cmd.exe" /v /fo list ^| findstr /i "PID:"') do (
    set lastpid=%%a
)

:: Save PID to file
echo backend:!lastpid! >> "%PID_FILE%"
call "%VENV_DIR%\Scripts\deactivate.bat"
cd "%~dp0"

echo Backend started with PID: !lastpid!
echo Logs available at: %BACKEND_LOG%
exit /b 0

:start_frontend_proc
echo Starting FlowChat Frontend...

:: Check if already running
call :is_frontend_running
if !errorlevel! equ 0 (
    echo Frontend is already running.
    exit /b 0
)

:: Install dependencies if node_modules doesn't exist
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd "%FRONTEND_DIR%"
    call npm install
    cd "%~dp0"
)

:: Start the frontend
cd "%FRONTEND_DIR%"
start /B cmd /c "npm start > "%FRONTEND_LOG%" 2>&1"
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq cmd.exe" /v /fo list ^| findstr /i "PID:"') do (
    set lastpid=%%a
)

:: Save PID to file
echo frontend:!lastpid! >> "%PID_FILE%"
cd "%~dp0"

echo Frontend started with PID: !lastpid!
echo Logs available at: %FRONTEND_LOG%
exit /b 0

:is_backend_running
if exist "%PID_FILE%" (
    for /f "tokens=2 delims=:" %%a in ('findstr "backend:" "%PID_FILE%"') do (
        tasklist /fi "pid eq %%a" 2>nul | find "%%a" >nul
        if !errorlevel! equ 0 (
            exit /b 0
        )
    )
)
exit /b 1

:is_frontend_running
if exist "%PID_FILE%" (
    for /f "tokens=2 delims=:" %%a in ('findstr "frontend:" "%PID_FILE%"') do (
        tasklist /fi "pid eq %%a" 2>nul | find "%%a" >nul
        if !errorlevel! equ 0 (
            exit /b 0
        )
    )
)
exit /b 1

:stop_backend_proc
echo Stopping FlowChat Backend...

if exist "%PID_FILE%" (
    for /f "tokens=2 delims=:" %%a in ('findstr "backend:" "%PID_FILE%"') do (
        taskkill /pid %%a /f >nul 2>&1
        if !errorlevel! equ 0 (
            echo Backend stopped.
        ) else (
            echo Backend is not running.
        )
        
        :: Remove the PID from the file
        type "%PID_FILE%" | findstr /v "backend:%%a" > "%PID_FILE%.tmp"
        move /y "%PID_FILE%.tmp" "%PID_FILE%" >nul
    )
) else (
    echo No PID file found.
)
exit /b 0

:stop_frontend_proc
echo Stopping FlowChat Frontend...

if exist "%PID_FILE%" (
    for /f "tokens=2 delims=:" %%a in ('findstr "frontend:" "%PID_FILE%"') do (
        taskkill /pid %%a /f >nul 2>&1
        if !errorlevel! equ 0 (
            echo Frontend stopped.
        ) else (
            echo Frontend is not running.
        )
        
        :: Remove the PID from the file
        type "%PID_FILE%" | findstr /v "frontend:%%a" > "%PID_FILE%.tmp"
        move /y "%PID_FILE%.tmp" "%PID_FILE%" >nul
    )
) else (
    echo No PID file found.
)
exit /b 0

:usage
echo FlowChat Service Management Script
echo Usage: %~nx0 [command]
echo.
echo Commands:
echo   start       Start both backend and frontend services
echo   stop        Stop both backend and frontend services
echo   restart     Restart both backend and frontend services
echo   status      Show status of services
echo   start-b     Start only the backend service
echo   start-f     Start only the frontend service
echo   stop-b      Stop only the backend service
echo   stop-f      Stop only the frontend service
echo   help        Show this help message
echo.
goto end

:end
endlocal 