# Beige3D - Catalogo de Impresion 3D

Catalogo web profesional para negocio de impresion 3D con productos de MakerWorld.

## Funcionalidades

- **Catalogo publico**: Galeria de productos con busqueda, filtro por categoria y filtro alfabetico
- **Panel de administrador**: Gestionar productos, asignar precios, administrar pedidos
- **Importacion de MakerWorld**: Importar productos con solo pegar la URL
- **Responsive**: Funciona en celular, tablet y computadora

## Como usar

### Local
```bash
npm install
npm start
```
Abrir http://localhost:3000

### Deploy (gratis)
Ver guia en DEPLOY.md

## Tecnologias

- Backend: Node.js + Express
- Base de datos: JSON (simple, sin configuracion)
- Frontend: HTML/CSS/JS vanilla
- Datos: MakerWorld API

## Estructura

```
├── src/
│   ├── server.js        # API backend
│   ├── database.js      # Manejo de BD
│   └── scraper.js       # Importador MakerWorld
├── public/
│   ├── index.html       # Catalogo publico
│   ├── admin/           # Panel administrador
│   └── css/, js/        # Estilos y scripts
├── data/                # Base de datos
└── package.json
```

## Licencia

Privado - Beige3D 2026
