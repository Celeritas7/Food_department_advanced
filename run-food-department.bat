@echo off
title Food Department local dev server
REM Double-click to run the app locally (Vite dev server with hot reload).
REM Put this .bat in the project root, next to package.json. Leave the window open while testing.
cd /d "%~dp0"

if not exist "package.json" (
  echo Could not find package.json here.
  echo Put this .bat in the project root ^(Food_department_advanced^).
  echo Current folder: %CD%
  pause & goto :eof
)

REM --- Find npm: PATH first, then common install locations ---
REM (double-clicking uses plain cmd, where a shell-only PATH may not be active)
set "NPM="
for %%P in (
  "npm.cmd"
  "%ProgramFiles%\nodejs\npm.cmd"
  "%ProgramFiles(x86)%\nodejs\npm.cmd"
  "%LOCALAPPDATA%\Programs\nodejs\npm.cmd"
  "%APPDATA%\nvm\npm.cmd"
  "%USERPROFILE%\anaconda3\npm.cmd"
  "%USERPROFILE%\anaconda3\Scripts\npm.cmd"
  "%USERPROFILE%\miniconda3\Scripts\npm.cmd"
) do (
  if not defined NPM (
    call "%%~P" --version >nul 2>nul && set "NPM=%%~P"
  )
)

if not defined NPM (
  echo.
  echo Could not find npm automatically.
  echo Install Node.js from https://nodejs.org ^(LTS^), or open the terminal
  echo you normally use, cd to this folder, and run:
  echo     npm run dev
  echo.
  pause & goto :eof
)

if not exist ".env" (
  echo.
  echo WARNING: no .env file. The app needs VITE_SUPABASE_URL and
  echo VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.
  echo.
)

if not exist "node_modules\" (
  echo.
  echo First run: installing dependencies ^(takes a minute^)...
  echo.
  REM --legacy-peer-deps: vite 8 vs @vitejs/plugin-react 4 conflict (fixed properly in P4)
  call "%NPM%" install --legacy-peer-deps
  if errorlevel 1 (
    echo.
    echo npm install failed. See the error above.
    pause & goto :eof
  )
)

echo.
echo   Food Department - local dev server
echo   npm:     %NPM%
echo   Open:    http://localhost:5173/Food_department_advanced/
echo   (Edits to src/ reload automatically. Close this window to stop.)
echo.

start "" "http://localhost:5173/Food_department_advanced/"
call "%NPM%" run dev -- --port 5173 --strictPort

echo.
echo Server stopped.
pause
