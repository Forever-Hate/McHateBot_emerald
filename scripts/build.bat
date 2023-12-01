@echo off
rd /S /Q out
rd /S /Q exe
call tsc
copy .env out
xcopy .\language out\language /E /I
copy config-orginal.json out
copy settings-orginal.json out
xcopy .\dist out\dist /E /I
move out\config-orginal.json out\config.json
move out\settings-orginal.json out\settings.json
call pkg ./out\McHateBot.js -t node18-win-x64 -c package.json
copy config-orginal.json exe
copy settings-orginal.json exe
xcopy .\language exe\language /E /I
copy .env exe
move exe\config-orginal.json exe\config.json
move exe\settings-orginal.json exe\settings.json