@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Escrutinio EN VIVO - 1a vuelta (TSE). Si cerras esta ventana, el mapa deja de actualizarse.
start "" "%~dp0mapa_en_vivo_1ra.html"
python vivo.py --turno 1
pause
