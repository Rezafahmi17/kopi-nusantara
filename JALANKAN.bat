@echo off
cd /d "%~dp0"
cls
echo ================================================
echo Menjalankan Kopi Nusantara + MySQL/phpMyAdmin
echo ================================================
echo.
echo Pastikan XAMPP MySQL sudah aktif dan database sudah di-import.
echo File SQL: database\kopi_nusantara.sql
echo.
if not exist node_modules (
  echo Menginstall dependency terlebih dahulu...
  npm install
)
echo.
echo Membuat build frontend terbaru...
npm run build
echo.
echo Menjalankan server di http://localhost:3001
node server.js
pause
