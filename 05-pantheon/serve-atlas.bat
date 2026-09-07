@echo off
rem Previsualizar los charts del N°5 por http (las fotos del PNG necesitan server, no file://).
rem Doble clic: levanta el server y abre la tabla.
cd /d "%~dp0.."
start "" http://localhost:8770/05-pantheon/top.html
python -m http.server 8770 2>nul || py -3 -m http.server 8770
