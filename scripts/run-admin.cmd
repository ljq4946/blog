@echo off
title Blog Admin
cd /d "%~dp0..\frontend"
set "VITE_API_BASE_URL=/api"
corepack pnpm --filter @blog/admin dev
pause
