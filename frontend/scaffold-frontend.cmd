:: ---- scaffold-frontend-fixed.cmd ----
:: Run this inside your Next.js 'frontend' folder (where package.json exists)
@echo off
setlocal ENABLEDELAYEDEXPANSION

if not exist package.json (
  echo [ERROR] Run this inside your Next.js ^'frontend^' folder (where package.json exists).
  exit /b 1
)

:: Folders (quoted to handle parentheses)
mkdir "app\(auth)\login" 2>nul
mkdir "app\(auth)\signup" 2>nul
mkdir "app\(auth)" 2>nul
mkdir "app\(protected)\dashboard" 2>nul
mkdir "app\(protected)\lands\[id]\edit" 2>nul
mkdir "app\(protected)\lands" 2>nul
mkdir "app\(protected)\requests" 2>nul
mkdir "app\(protected)\transactions" 2>nul
mkdir "app\(protected)\assistant" 2>nul
mkdir "app\api\auth\login" 2>nul
mkdir "app\api\auth\signup" 2>nul
mkdir "app\api\proxy\[...path]" 2>nul
mkdir "components\ui" 2>nul
mkdir "lib" 2>nul

:: Files (no FOR: use a helper to avoid parsing issues)
call :touch "app\(auth)\layout.tsx"
call :touch "app\(auth)\login\page.tsx"
call :touch "app\(auth)\signup\page.tsx"
call :touch "app\(protected)\layout.tsx"
call :touch "app\(protected)\dashboard\page.tsx"
call :touch "app\(protected)\lands\page.tsx"
call :touch "app\(protected)\lands\[id]\edit\page.tsx"
call :touch "app\(protected)\requests\page.tsx"
call :touch "app\(protected)\transactions\page.tsx"
call :touch "app\(protected)\assistant\page.tsx"
call :touch "app\api\auth\login\route.ts"
call :touch "app\api\auth\signup\route.ts"
call :touch "app\api\proxy\[...path]\route.ts"
call :touch "components\Sidebar.tsx"
call :touch "components\Topbar.tsx"
call :touch "components\ui\Button.tsx"
call :touch "components\ui\Input.tsx"
call :touch "components\ui\Card.tsx"
call :touch "lib\config.ts"
call :touch "lib\fetcher.ts"
call :touch "lib\auth.ts"
call :touch "lib\validators.ts"
call :touch "middleware.ts"

:: .env.local template
if not exist .env.local (
  (
    echo API_URL="https://smartlands-production.up.railway.app"
    echo NEXT_PUBLIC_API_URL="https://smartlands-production.up.railway.app"
    echo COOKIE_NAME="sl_token"
  )>.env.local
  echo [+] created .env.local
) else (
  echo [=] exists  .env.local
)

echo.
echo Done. Now paste code into the created files from the main Canvas.
endlocal
exit /b 0

:touch
if not exist "%~1" (
  >"%~1" echo.
  echo [+] created %~1
) else (
  echo [=] exists  %~1
)
exit /b 0
:: ---- /scaffold-frontend-fixed.cmd ----
