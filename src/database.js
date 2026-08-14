const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'catalogo.json');

const DEFAULT_DATA = {
  productos: [],
  admins: [],
  pedidos: [],
  next_producto_id: 1,
  next_admin_id: 1,
  next_pedido_id: 1
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function initDatabase() {
  const db = readDb();
  if (!db.productos) db.productos = [];
  if (!db.admins) db.admins = [];
  if (!db.pedidos) db.pedidos = [];
  if (!db.next_producto_id) db.next_producto_id = 1;
  if (!db.next_admin_id) db.next_admin_id = 1;
  if (!db.next_pedido_id) db.next_pedido_id = 1;

  // Crear admin por defecto si no existe ninguno
  if (db.admins.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.admins.push({
      id: 1,
      usuario: 'admin',
      password: hash,
      created_at: new Date().toISOString()
    });
    db.next_admin_id = 2;
    console.log('Admin por defecto creado: admin / admin123');
  }

  writeDb(db);
  console.log('Base de datos inicializada');
}

module.exports = { readDb, writeDb, initDatabase, DB_FILE };
