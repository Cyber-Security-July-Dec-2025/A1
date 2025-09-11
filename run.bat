@echo off
setlocal ENABLEDELAYEDEXPANSION

:: Simple Docker runner for Windows with similar options as run.sh
:: Usage: run.bat [up|up-detach|down|down-v|logs|exec-server|exec-client]

set ACTION=%1
if "%ACTION%"=="" set ACTION=up

call :print_links

if /I "%ACTION%"=="up" goto :UP
if /I "%ACTION%"=="up-detach" goto :UPD
if /I "%ACTION%"=="up-d" goto :UPD
if /I "%ACTION%"=="down" goto :DOWN
if /I "%ACTION%"=="down-v" goto :DOWNV
if /I "%ACTION%"=="logs" goto :LOGS
if /I "%ACTION%"=="exec-server" goto :EXEC_SERVER
if /I "%ACTION%"=="exec-client" goto :EXEC_CLIENT

echo Usage: run.bat ^<up^|up-detach^|up-d^|down^|down-v^|logs^|exec-server^|exec-client^>
exit /b 2

:UP
echo Building and starting containers...
docker compose up --build
goto :EOF

:UPD
echo Building and starting containers in detached mode...
docker compose up -d --build
call :wait_and_open
goto :EOF

:DOWN
echo Stopping containers...
docker compose down
goto :EOF

:DOWNV
echo Stopping containers and removing volumes (DATA LOSS)...
docker compose down -v
goto :EOF

:LOGS
docker compose logs -f
goto :EOF

:EXEC_SERVER
docker compose exec server sh
goto :EOF

:EXEC_CLIENT
docker compose exec client sh
goto :EOF

:print_links
echo.
echo Open these in your browser:
echo   - Frontend: http://localhost:3000
echo   - API health: http://localhost:5001/health
echo.
exit /b 0

:wait_and_open
:: Wait up to ~40s for API to report healthy, then open browser tabs
powershell -NoProfile -Command "for ($i=0; $i -lt 40; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing http://localhost:5001/health -TimeoutSec 2; if ($r.StatusCode -eq 200) { break } } catch {} Start-Sleep -Seconds 1 } ; Start-Process http://localhost:3000 ; Start-Process http://localhost:5001/health"
exit /b 0


