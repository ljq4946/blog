@echo off
title Blog Web
cd /d "%~dp0..\frontend"
set "VITE_API_BASE_URL=/api"
corepack pnpm --filter @blog/web dev
pause
