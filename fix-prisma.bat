@echo off
echo.
echo ====================================
echo Fixing Prisma Client
echo ====================================
echo.
echo This script will:
echo 1. Regenerate the Prisma client
echo 2. Optionally create a migration
echo.

cd /d "%~dp0"

echo Regenerating Prisma client...
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Prisma generation failed!
    echo Check the error above.
    pause
    exit /b 1
)

echo.
echo ✅ Prisma client regenerated successfully!
echo.
echo Next steps:
echo 1. Refresh your browser (Ctrl+R or Cmd+R)
echo 2. Test the category management system
echo 3. Check if images now display on the home page
echo.
echo Optional: Create a migration for version control by running:
echo   npx prisma migrate dev --name add_category_image_and_position
echo.
pause
