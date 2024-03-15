#! /usr/bin/env bash
set -e
rm -rf out
rm -rf exe
npm exec -- tsc
cp .env out
mkdir -p out && cp -r language out
cp config-orginal.json out
cp settings-orginal.json out
mkdir -p out && cp -r dist out
mv out/config-orginal.json out/config.json
mv out/settings-orginal.json out/settings.json
npm exec -- pkg ./out/McHateBot.js -t node18 -c package.json
cp config-orginal.json exe
cp settings-orginal.json exe
mkdir -p exe && cp -r language exe
cp .env exe
mv exe/config-orginal.json exe/config.json
mv exe/settings-orginal.json exe/settings.json
mv exe/mchatebot_emerald exe/mchatebot_emerald.exe