@echo off
title Blog Backend
cd /d "%~dp0..\backend"
set "DB_URL=jdbc:mysql://localhost:3306/blog?useUnicode=true&characterEncoding=utf8&serverTimezone=UTC"
set "DB_USERNAME=blog"
set "DB_PASSWORD=blog"
set "ADMIN_USERNAME=4946"
set "ADMIN_PASSWORD=541312"
set "UPLOAD_DIR=%~dp0..\backend\uploads"
call mvnw.cmd spring-boot:run
pause
