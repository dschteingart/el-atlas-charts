@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Escrutinio EN VIVO - 2a vuelta (TSE). Si cerras esta ventana, el mapa deja de actualizarse.
start "" "%~dp0mapa_en_vivo_2da.html"
python vivo.py --turno 2 --publicar
pause
