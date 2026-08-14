const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDb, writeDb, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'impresion3d_secret_key_2024';

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

function paginate(array, page, limit) {
  const start = (page - 1) * limit;
  return array.slice(start, start + limit);
}

// === AUTH ===
app.post('/api/admin/login', (req, res) => {
  const { usuario, password } = req.body;
  const db = readDb();
  const admin = db.admins.find(a => a.usuario === usuario);
  if (!admin) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign({ id: admin.id, usuario: admin.usuario }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, usuario: admin.usuario });
});

app.post('/api/admin/register', (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return res.status(400).json({ error: 'Usuario y password requeridos' });

  const db = readDb();
  if (db.admins.find(a => a.usuario === usuario)) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const admin = {
    id: db.next_admin_id++,
    usuario,
    password: hash,
    created_at: new Date().toISOString()
  };
  db.admins.push(admin);
  writeDb(db);

  const token = jwt.sign({ id: admin.id, usuario }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, usuario });
});

// === PRODUCTOS PUBLICOS ===
app.get('/api/productos', (req, res) => {
  const { buscar, categoria, letra, page = 1, limit = 20 } = req.query;
  const db = readDb();
  let filtered = db.productos.filter(p => p.activo === 1);

  if (buscar) {
    const term = buscar.toLowerCase();
    filtered = filtered.filter(p =>
      (p.titulo && p.titulo.toLowerCase().includes(term)) ||
      (p.tags && p.tags.toLowerCase().includes(term)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(term))
    );
  }

  if (categoria) {
    filtered = filtered.filter(p => p.categoria === categoria);
  }

  if (letra) {
    filtered = filtered.filter(p => {
      const primera = (p.titulo || '').charAt(0).toUpperCase();
      return primera === letra.toUpperCase();
    });
  }

  filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));

  const total = filtered.length;
  const productos = paginate(filtered, parseInt(page), parseInt(limit));

  res.json({
    productos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

app.get('/api/productos/:id', (req, res) => {
  const db = readDb();
  const producto = db.productos.find(p => p.id === parseInt(req.params.id));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

app.get('/api/categorias', (req, res) => {
  const db = readDb();
  const counts = {};
  db.productos.filter(p => p.activo === 1).forEach(p => {
    const cat = p.categoria || 'General';
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const categorias = Object.entries(counts)
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count);
  res.json(categorias);
});

// === ADMIN PRODUCTOS ===
app.get('/api/admin/productos', authMiddleware, (req, res) => {
  const { buscar, page = 1, limit = 20 } = req.query;
  const db = readDb();
  let filtered = [...db.productos];

  if (buscar) {
    const term = buscar.toLowerCase();
    filtered = filtered.filter(p =>
      (p.titulo && p.titulo.toLowerCase().includes(term)) ||
      (p.makerworld_id && p.makerworld_id.toLowerCase().includes(term)) ||
      (p.tags && p.tags.toLowerCase().includes(term))
    );
  }

  filtered.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  const total = filtered.length;
  const productos = paginate(filtered, parseInt(page), parseInt(limit));

  res.json({
    productos,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  });
});

app.put('/api/admin/productos/:id/precio', authMiddleware, (req, res) => {
  const { precio_impresion, precio_material, precio_ganancia } = req.body;
  const db = readDb();
  const producto = db.productos.find(p => p.id === parseInt(req.params.id));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  producto.precio_impresion = precio_impresion || 0;
  producto.precio_material = precio_material || 0;
  producto.precio_ganancia = precio_ganancia || 0;
  producto.precio_total = (precio_impresion || 0) + (precio_material || 0) + (precio_ganancia || 0);
  producto.updated_at = new Date().toISOString();

  writeDb(db);
  res.json({ success: true });
});

app.post('/api/admin/productos/importar', authMiddleware, async (req, res) => {
  const { urls, query, limite = 50 } = req.body;
  try {
    const { importarPorUrls, importarPorModeloIds } = require('./scraper');
    let importados;
    if (urls && urls.length > 0) {
      importados = await importarPorUrls(urls);
    } else if (query) {
      importados = await importarPorUrls([]);
    } else {
      return res.status(400).json({ error: 'Se requiere urls o query' });
    }
    res.json({ success: true, importados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === PEDIDOS ===
app.get('/api/admin/pedidos', authMiddleware, (req, res) => {
  const { estado, page = 1, limit = 20 } = req.query;
  const db = readDb();
  let filtered = [...db.pedidos];

  if (estado) {
    filtered = filtered.filter(p => p.estado === estado);
  }

  filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const enriched = filtered.map(p => {
    const producto = db.productos.find(pr => pr.id === p.producto_id);
    return { ...p, producto_titulo: producto?.titulo, imagen_principal: producto?.imagen_principal };
  });

  res.json(enriched);
});

app.post('/api/admin/pedidos', authMiddleware, (req, res) => {
  const { cliente_nombre, cliente_telefono, cliente_email, producto_id, cantidad, color_filamento, notas, precio_cotizado } = req.body;
  const db = readDb();

  const pedido = {
    id: db.next_pedido_id++,
    cliente_nombre,
    cliente_telefono,
    cliente_email,
    producto_id,
    cantidad: cantidad || 1,
    color_filamento,
    notas,
    precio_cotizado: precio_cotizado || 0,
    estado: 'pendiente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.pedidos.push(pedido);
  writeDb(db);

  res.json({ success: true, id: pedido.id });
});

app.put('/api/admin/pedidos/:id/estado', authMiddleware, (req, res) => {
  const { estado } = req.body;
  const db = readDb();
  const pedido = db.pedidos.find(p => p.id === parseInt(req.params.id));
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

  pedido.estado = estado;
  pedido.updated_at = new Date().toISOString();
  writeDb(db);

  res.json({ success: true });
});

app.post('/api/pedidos', (req, res) => {
  const { cliente_nombre, cliente_telefono, cliente_email, producto_id, cantidad, color_filamento, notas } = req.body;
  const db = readDb();

  const pedido = {
    id: db.next_pedido_id++,
    cliente_nombre,
    cliente_telefono,
    cliente_email,
    producto_id,
    cantidad: cantidad || 1,
    color_filamento,
    notas,
    precio_cotizado: 0,
    estado: 'pendiente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.pedidos.push(pedido);
  writeDb(db);

  res.json({ success: true, id: pedido.id, mensaje: 'Pedido recibido! Te contactaremos pronto.' });
});

// === SPA FALLBACK ===
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

initDatabase();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Catalogo publico: http://localhost:${PORT}/`);
  console.log(`Panel admin: http://localhost:${PORT}/admin/`);
});

module.exports = app;
