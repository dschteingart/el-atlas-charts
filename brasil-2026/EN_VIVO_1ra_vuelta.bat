@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Escrutinio EN VIVO - 1a vuelta (TSE). Si cerras esta ventana, el mapa deja de actualizarse.
echo Tambien se publica online: https://dschteingart.github.io/brasil-2026-vivo/
start "" "%~dp0mapa_en_vivo_1ra.html"
python vivo.py --turno 1 --publicar
pause
