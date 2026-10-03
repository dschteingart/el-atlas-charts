@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ENSAYO con datos FICTICIOS. No usar al aire como resultados.
start "" "%~dp0mapa_en_vivo_1ra.html"
python vivo.py --simulacro --intervalo 6
pause
