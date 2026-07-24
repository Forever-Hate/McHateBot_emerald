@echo off
setlocal
cd /d "%~dp0.."

if exist out rd /S /Q out
if exist exe rd /S /Q exe
call pnpm exec tsc --pretty false
if errorlevel 1 exit /b 1
REM Ensure compiled JS and any non-.ts resources are present in out\

if not exist out\McHateBot.js (
	echo TypeScript build did not produce out\McHateBot.js
	exit /b 1
)

if not exist out\language mkdir out\language
if not exist out\dist mkdir out\dist
copy /Y .env out >nul
copy /Y config-orginal.json out\config.json >nul
copy /Y settings-orginal.json out\settings.json >nul
xcopy .\language out\language /E /I /Y >nul
xcopy .\dist out\dist /E /I /Y >nul
if errorlevel 1 exit /b 1

if "%PKG_TARGET%"=="" set "PKG_TARGET=node24-win-x64"
echo Packaging for %PKG_TARGET%...
call pnpm exec pkg ./out\McHateBot.js -t %PKG_TARGET% -c package.json
if errorlevel 1 exit /b 1

copy /Y config-orginal.json exe\config.json >nul
copy /Y settings-orginal.json exe\settings.json >nul
xcopy .\language exe\language /E /I /Y >nul
copy /Y .env exe >nul
if errorlevel 1 exit /b 1

echo Build completed successfully.
exit /b 0