@echo off
title Khoi dong Frontend - Do An 3
echo Dang kiem tra va khoi dong 3 giao dien Frontend...

start "Admin Frontend" cmd /k "cd /d %~dp0admin-frontend && npm run dev"
start "Ecommerce Frontend" cmd /k "cd /d %~dp0ecommerce-frontend && npm run dev"
start "WMS Frontend" cmd /k "cd /d %~dp0wms-frontend && npm run dev"

echo Da mo 3 cua so Terminal cho Frontend!
pause
