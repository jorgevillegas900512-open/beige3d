# Guia de Deploy - Beige3D

## Opcion 1: Render.com (RECOMENDADO - Gratis)

### Paso 1: Crear cuenta en GitHub
1. Andá a https://github.com
2. Creá una cuenta gratuita
3. Creá un nuevo repositorio llamado "beige3d"

### Paso 2: Subir el codigo
1. Descargá e instalá GitHub Desktop: https://desktop.github.com
2. Abrí GitHub Desktop
3. File > Add Local Repository > seleccioná la carpeta C:\OPENCODE-BEIGE3D
4. Publish repository > nombre: "beige3d" > Publish

### Paso 3: Crear cuenta en Render
1. Andá a https://render.com
2. Creá cuenta con GitHub (boton "Get Started for Free")
3. New > Web Service
4. Conectá tu repositorio "beige3d"
5. Configuracion:
   - Name: beige3d
   - Runtime: Node
   - Build Command: npm install
   - Start Command: node src/server.js
   - Plan: Free
6. Click "Create Web Service"

### Paso 4: Tu pagina esta online
Render te da una URL como: https://beige3d.onrender.com

### Paso 5: Dominio personalizado (opcional)
1. Comprá un dominio (ej: beige3d.com) en Namecheap (~$10/año)
2. En Render, andá a Settings > Custom Domains
3. Agregá tu dominio
4. En Namecheap, configurá los DNS:
   - Type: CNAME
   - Host: @
   - Value: beige3d.onrender.com
5. Esperá 24-48 horas para que se active

---

## Opcion 2: Railway.app (Alternativa gratis)

1. Andá a https://railway.app
2. Sign up con GitHub
3. New Project > Deploy from GitHub repo
4. Seleccioná "beige3d"
5. Railway detecta automáticamente y deploya
6. Te da una URL como: https://beige3d-production.up.railway.app

---

## Datos de acceso

- **Catalogo publico**: https://tu-url.onrender.com
- **Panel admin**: https://tu-url.onrender.com/admin/
- **Usuario**: admin
- **Password**: admin123

---

## Notas importantes

- La version gratis de Render duerme despues de 15 min de inactividad
- La primera carga tarda ~30 segundos
- Para evitar que duerma, podes usar UptimeRobot (gratis) para hacer ping cada 5 minutos
