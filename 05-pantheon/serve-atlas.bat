@echo off
rem Previsualizar los charts del N°5 CON fotos (via http, no file://).
rem Doble clic: levanta un server local y abre la tabla en el navegador.
cd /d "%~dp0.."
start "" http://localhost:8770/05-pantheon/top.html
python -m http.server 8770
