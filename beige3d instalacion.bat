@echo off
title Beige3D - Instalador
color 0A
echo.
echo  ==========================================
echo   BEIGE3D - INSTALADOR
echo  ==========================================
echo.
echo  Este instalador configura todo lo necesario:
echo  - Node.js (si no esta instalado)
echo  - Dependencias de la aplicacion
echo  - Acceso directo en el escritorio
echo.
echo  Presiona cualquier tecla para comenzar...
pause >nul

:: Verificar si esta en la carpeta correcta
if not exist "src\server.js" (
    echo.
    echo  ERROR: No se encontro src\server.js
    echo  Asegurate de que esta en la carpeta correcta.
    echo.
    pause
    exit /b 1
)

:: Verificar si Node.js esta instalado
echo.
echo  [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  Node.js no encontrado. Descargando...
    echo.
    
    :: Crear carpeta temporal
    if not exist "%TEMP%\node-install" mkdir "%TEMP%\node-install"
    
    :: Descargar Node.js
    echo  Descargando Node.js v20...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node-install\node.msi'}"
    
    if not exist "%TEMP%\node-install\node.msi" (
        echo  ERROR: No se pudo descargar Node.js
        echo  Por favor, instala Node.js manualmente desde https://nodejs.org
        echo.
        pause
        exit /b 1
    )
    
    echo  Instalando Node.js...
    msiexec /i "%TEMP%\node-install\node.msi" /qn /norestart
    timeout /t 30 /nobreak >nul
    
    :: Actualizar PATH
    set "PATH=%PATH%;C:\Program Files\nodejs\"
    
    :: Verificar instalacion
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo  ERROR: Node.js no se pudo instalar
        echo  Por favor, instala Node.js manualmente desde https://nodejs.org
        echo.
        pause
        exit /b 1
    )
    
    echo  Node.js instalado correctamente!
) else (
    echo  Node.js ya esta instalado.
)

:: Instalar dependencias
echo.
echo  [2/5] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo  ERROR: No se pudieron instalar las dependencias
    echo.
    pause
    exit /b 1
)
echo  Dependencias instaladas!

:: Crear acceso directo en escritorio
echo.
echo  [3/5] Creando acceso directo en el escritorio...
powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Beige3D.lnk')); $Shortcut.TargetPath = '%~dp0iniciar.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Beige3D - Catalogo de Impresion 3D'; $Shortcut.Save()}"
echo  Acceso directo creado!

:: Crear acceso directo de administrador
echo.
echo  [4/5] Creando acceso directo del administrador...
powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Beige3D Admin.lnk')); $Shortcut.TargetPath = '%~dp0admin.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Beige3D - Panel de Administrador'; $Shortcut.Save()}"

:: Crear admin.bat
(
echo @echo off
echo title Beige3D - Admin
echo echo Abriendo panel de administrador...
echo start http://localhost:3000/admin/
echo call iniciar.bat
) > admin.bat

echo  Acceso directo del administrador creado!

:: Iniciar la aplicacion
echo.
echo  [5/5] Todo listo!
echo.
echo  ==========================================
echo   INSTALACION COMPLETADA
echo  ==========================================
echo.
echo  Para usar la aplicacion:
echo  1. Haz doble clic en "Beige3D" en tu escritorio
echo  2. Abre el navegador en: http://localhost:3000
echo.
echo  Panel de administrador:
echo  http://localhost:3000/admin/
echo  Usuario: admin
echo  Password: admin123
echo.
echo  Presiona cualquier tecla para iniciar la aplicacion...
pause >nul

start http://localhost:3000
call iniciar.bat
