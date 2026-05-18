@echo off
setlocal
set MAVEN_VERSION=3.9.9
set BASE_DIR=%~dp0
set MVN_DIR=%BASE_DIR%.mvn\apache-maven-%MAVEN_VERSION%
if not exist "%MVN_DIR%\bin\mvn.cmd" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $base='%BASE_DIR%'; $version='%MAVEN_VERSION%'; $mvnDir=Join-Path $base ('.mvn/apache-maven-' + $version); $zip=Join-Path $base '.mvn/apache-maven.zip'; New-Item -ItemType Directory -Force (Split-Path $zip) | Out-Null; Invoke-WebRequest -Uri ('https://archive.apache.org/dist/maven/maven-3/' + $version + '/binaries/apache-maven-' + $version + '-bin.zip') -OutFile $zip; Expand-Archive -Force $zip (Join-Path $base '.mvn');"
)
"%MVN_DIR%\bin\mvn.cmd" --settings "%BASE_DIR%.mvn\settings.xml" %*
