let token = localStorage.getItem('admin_token');
let adminPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    mostrarPanel();
  }

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    login();
  });
});

async function login() {
  const usuario = document.getElementById('login-usuario').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (data.token) {
      token = data.token;
      localStorage.setItem('admin_token', token);
      document.getElementById('admin-user').textContent = data.usuario;
      mostrarPanel();
    } else {
      alert(data.error || 'Error al iniciar sesion');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

function mostrarPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  adminBuscar();
}

function logout() {
  token = null;
  localStorage.removeItem('admin_token');
  document.getElementById('login-screen').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';
}

function showSection(section) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`section-${section}`).classList.add('active');
  document.querySelector(`.nav-btn[data-section="${section}"]`).classList.add('active');

  if (section === 'pedidos') cargarPedidos();
  if (section === 'usuarios') cargarUsuarios();
  if (section === 'insumos') cargarInsumos();
  if (section === 'proveedores') cargarProveedores();
  if (section === 'clientes') cargarClientes();
}

let adminBuscarTimer;
function adminBuscar() {
  clearTimeout(adminBuscarTimer);
  adminBuscarTimer = setTimeout(() => cargarAdminProductos(), 300);
}

async function cargarAdminProductos(page = 1) {
  adminPage = page;
  const buscar = document.getElementById('admin-buscar').value;
  const container = document.getElementById('admin-productos');

  try {
    const params = new URLSearchParams({ page, limit: 20, ...(buscar && { buscar }) });
    const res = await fetch(`/api/admin/productos?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) { logout(); return; }

    const data = await res.json();

    container.innerHTML = data.productos.map(p => `
      <div class="admin-card" onclick="verProductoAdmin(${p.id})">
        <img src="${p.imagen_principal || 'https://via.placeholder.com/100'}" alt="${p.titulo}"
             onerror="this.src='https://via.placeholder.com/100'" />
        <div class="admin-card-info">
          <h4>${p.titulo}</h4>
          <p>${p.categoria || 'General'} | ${p.tiempo_impresion_horas || 0}h ${p.tiempo_impresion_minutos || 0}m | ${p.peso_gramos || 0}g</p>
          <p>MakerWorld ID: ${p.makerworld_id || 'N/A'}</p>
          <p class="precio">${p.precio_total > 0 ? '$' + p.precio_total.toFixed(2) : 'Sin precio'}</p>
        </div>
      </div>
    `).join('') || '<p>No hay productos</p>';

  } catch (error) {
    container.innerHTML = '<p>Error cargando productos</p>';
  }
}

async function verProductoAdmin(id) {
  try {
    const res = await fetch(`/api/productos/${id}`);
    const p = await res.json();

    let imagenes = [];
    try { imagenes = JSON.parse(p.imagenes || '[]'); } catch(e) {}
    let materiales = [];
    try { materiales = JSON.parse(p.materiales || '[]'); } catch(e) {}
    let impresoras = [];
    try { impresoras = JSON.parse(p.impresoras_compatibles || '[]'); } catch(e) {}
    let filamentos = [];
    try { filamentos = JSON.parse(p.filamentos || '[]'); } catch(e) {}

    document.getElementById('producto-modal-body').innerHTML = `
      <h2>${p.titulo}</h2>
      <p style="color:#888; margin-bottom:15px">MakerWorld ID: ${p.makerworld_id || 'N/A'} | <a href="${p.url_makerworld || '#'}" target="_blank">Ver en MakerWorld</a></p>

      <div class="modal-galeria" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; margin-bottom:20px;">
        <img src="${p.imagen_principal || 'https://via.placeholder.com/300'}" style="width:100%; height:180px; object-fit:cover; border-radius:8px;"
             onerror="this.src='https://via.placeholder.com/300'" />
        ${imagenes.filter(i => i !== p.imagen_principal).map(img =>
          `<img src="${img}" style="width:100%; height:180px; object-fit:cover; border-radius:8px;" onerror="this.style.display='none'" />`
        ).join('')}
      </div>

      <div class="modal-detail-grid">
        <div class="modal-detail-item">
          <label>Tiempo impresion</label>
          <span>${p.tiempo_impresion_horas || 0}h ${p.tiempo_impresion_minutos || 0}m</span>
        </div>
        <div class="modal-detail-item">
          <label>Peso</label>
          <span>${p.peso_gramos || 0}g</span>
        </div>
        <div class="modal-detail-item">
          <label>Platos</label>
          <span>${p.num_platos || 1}</span>
        </div>
        <div class="modal-detail-item">
          <label>Categoria</label>
          <span>${p.categoria || 'General'}</span>
        </div>
        <div class="modal-detail-item">
          <label>Materiales</label>
          <span>${materiales.join(', ') || 'N/A'}</span>
        </div>
        <div class="modal-detail-item">
          <label>Impresoras</label>
          <span>${impresoras.join(', ') || 'N/A'}</span>
        </div>
        <div class="modal-detail-item">
          <label>Likes</label>
          <span>${p.likes || 0}</span>
        </div>
        <div class="modal-detail-item">
          <label>Descargas</label>
          <span>${p.descargas || 0}</span>
        </div>
      </div>

      ${filamentos.length > 0 ? `
        <h4 style="margin-top:15px">Filamentos</h4>
        <ul class="modal-filamentos">
          ${filamentos.map(f => `
            <li>
              <span class="color-dot" style="background:${f.color || '#ccc'}"></span>
              <strong>${f.type || 'N/A'}</strong> - ${f.usedGrams || 0}g (${f.usedMeters || 0}m)
            </li>
          `).join('')}
        </ul>
      ` : ''}

      <div class="precio-form">
        <h4>Asignar precio</h4>
        <div class="precio-row">
          <label>Costo impresion:</label>
          <input type="number" id="precio-impresion" value="${p.precio_impresion || 0}" step="0.01" min="0" />
        </div>
        <div class="precio-row">
          <label>Costo material:</label>
          <input type="number" id="precio-material" value="${p.precio_material || 0}" step="0.01" min="0" />
        </div>
        <div class="precio-row">
          <label>Ganancia:</label>
          <input type="number" id="precio-ganancia" value="${p.precio_ganancia || 0}" step="0.01" min="0" />
        </div>
        <p style="margin: 10px 0; font-weight:700;">Total: $<span id="precio-total-preview">${p.precio_total || 0}</span></p>
        <button class="btn-guardar-precio" onclick="guardarPrecio(${p.id})">Guardar precio</button>
      </div>
    `;

    document.getElementById('precio-impresion').addEventListener('input', actualizarTotalPreview);
    document.getElementById('precio-material').addEventListener('input', actualizarTotalPreview);
    document.getElementById('precio-ganancia').addEventListener('input', actualizarTotalPreview);

    document.getElementById('producto-modal').style.display = 'flex';
  } catch (error) {
    alert('Error cargando producto');
  }
}

function actualizarTotalPreview() {
  const imp = parseFloat(document.getElementById('precio-impresion').value) || 0;
  const mat = parseFloat(document.getElementById('precio-material').value) || 0;
  const gan = parseFloat(document.getElementById('precio-ganancia').value) || 0;
  document.getElementById('precio-total-preview').textContent = (imp + mat + gan).toFixed(2);
}

async function guardarPrecio(id) {
  const imp = parseFloat(document.getElementById('precio-impresion').value) || 0;
  const mat = parseFloat(document.getElementById('precio-material').value) || 0;
  const gan = parseFloat(document.getElementById('precio-ganancia').value) || 0;

  try {
    const res = await fetch(`/api/admin/productos/${id}/precio`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        precio_impresion: imp,
        precio_material: mat,
        precio_ganancia: gan
      })
    });

    if (res.ok) {
      alert('Precio guardado');
      cerrarProductoModal();
      cargarAdminProductos(adminPage);
    }
  } catch (error) {
    alert('Error guardando precio');
  }
}

function cerrarProductoModal() {
  document.getElementById('producto-modal').style.display = 'none';
}

document.getElementById('producto-modal').addEventListener('click', (e) => {
  if (e.target.id === 'producto-modal') cerrarProductoModal();
});

async function importarProductos() {
  const urlsText = document.getElementById('import-urls').value;
  const urls = urlsText.split('\n').map(u => u.trim()).filter(u => u.length > 0);

  if (urls.length === 0) {
    alert('Pega al menos una URL de MakerWorld');
    return;
  }

  const statusDiv = document.getElementById('import-status');
  statusDiv.style.display = 'block';
  statusDiv.style.background = '#e3f2fd';
  statusDiv.innerHTML = `Importando ${urls.length} productos... Esto puede tardar unos segundos.`;

  try {
    const res = await fetch('/api/admin/productos/importar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ urls })
    });

    const data = await res.json();

    if (data.success) {
      statusDiv.style.background = '#e8f5e9';
      statusDiv.innerHTML = `Se importaron ${data.importados} productos correctamente.`;
      document.getElementById('import-urls').value = '';
      cargarAdminProductos();
    } else {
      statusDiv.style.background = '#ffebee';
      statusDiv.innerHTML = `Error: ${data.error}`;
    }
  } catch (error) {
    statusDiv.style.background = '#ffebee';
    statusDiv.innerHTML = 'Error de conexion';
  }
}

async function cargarPedidos() {
  const estado = document.getElementById('filtro-estado').value;
  const container = document.getElementById('admin-pedidos');

  try {
    const params = estado ? `?estado=${estado}` : '';
    const res = await fetch(`/api/admin/pedidos${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) { logout(); return; }

    const pedidos = await res.json();

    if (pedidos.length === 0) {
      container.innerHTML = '<p style="color:#888; padding:20px;">No hay pedidos</p>';
      return;
    }

    container.innerHTML = pedidos.map(p => `
      <div class="pedido-card">
        <div class="pedido-header">
          <strong>${p.cliente_nombre || 'Sin nombre'}</strong>
          <span class="pedido-estado estado-${p.estado}">${p.estado}</span>
        </div>
        <div class="pedido-detalle">
          <p><strong>Producto:</strong> ${p.producto_titulo || 'N/A'}</p>
          <p><strong>Telefono:</strong> ${p.cliente_telefono || 'N/A'}</p>
          <p><strong>Email:</strong> ${p.cliente_email || 'N/A'}</p>
          <p><strong>Cantidad:</strong> ${p.cantidad}</p>
          ${p.color_filamento ? `<p><strong>Color:</strong> ${p.color_filamento}</p>` : ''}
          ${p.notas ? `<p><strong>Notas:</strong> ${p.notas}</p>` : ''}
          ${p.precio_cotizado > 0 ? `<p><strong>Precio:</strong> $${p.precio_cotizado.toFixed(2)}</p>` : ''}
          <p><strong>Fecha:</strong> ${new Date(p.created_at).toLocaleDateString('es')}</p>
        </div>
        <div class="pedido-actions">
          ${p.estado === 'pendiente' ? `<button onclick="cambiarEstado(${p.id}, 'en_proceso')">Poner en proceso</button>` : ''}
          ${p.estado === 'en_proceso' ? `<button onclick="cambiarEstado(${p.id}, 'completado')">Marcar completado</button>` : ''}
          ${p.estado === 'completado' ? `<button onclick="cambiarEstado(${p.id}, 'entregado')">Marcar entregado</button>` : ''}
        </div>
      </div>
    `).join('');

  } catch (error) {
    container.innerHTML = '<p>Error cargando pedidos</p>';
  }
}

async function cambiarEstado(id, estado) {
  try {
    const res = await fetch(`/api/admin/pedidos/${id}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado })
    });

    if (res.ok) cargarPedidos();
  } catch (error) {
    alert('Error actualizando pedido');
  }
}

async function cargarUsuarios() {
  const container = document.getElementById('admin-usuarios');
  try {
    const res = await fetch('/api/admin/usuarios', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) { logout(); return; }
    const usuarios = await res.json();

    container.innerHTML = '<div class="usuarios-list">' + usuarios.map(u => `
      <div class="usuario-card">
        <span>${u.usuario}</span>
        <small>${u.created_at ? new Date(u.created_at).toLocaleDateString('es') : ''}</small>
        ${usuarios.length > 1 ? `<button onclick="eliminarUsuario(${u.id})" class="btn-delete">Eliminar</button>` : '<small style="color:#888">(admin principal)</small>'}
      </div>
    `).join('') + '</div>';
  } catch (error) {
    container.innerHTML = '<p>Error cargando usuarios</p>';
  }
}

async function crearUsuario() {
  const usuario = document.getElementById('nuevo-usuario').value;
  const password = document.getElementById('nuevo-password').value;

  if (!usuario || !password) {
    alert('Completa todos los campos');
    return;
  }

  try {
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById('nuevo-usuario').value = '';
      document.getElementById('nuevo-password').value = '';
      cargarUsuarios();
    } else {
      alert(data.error || 'Error al crear usuario');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

async function eliminarUsuario(id) {
  if (!confirm('Eliminar este usuario?')) return;

  try {
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (data.success) {
      cargarUsuarios();
    } else {
      alert(data.error || 'Error al eliminar');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

// === TOGGLES ===
function toggleNuevoPedido() {
  const f = document.getElementById('nuevo-pedido-form');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function toggleForm(tipo) {
  const f = document.getElementById(`form-${tipo}`);
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

// === PEDIDOS (manual) ===
async function crearPedido() {
  const cliente_nombre = document.getElementById('p-cliente').value;
  if (!cliente_nombre) { alert('El nombre del cliente es obligatorio'); return; }

  const body = {
    cliente_nombre,
    cliente_telefono: document.getElementById('p-telefono').value,
    cliente_email: document.getElementById('p-email').value,
    producto_id: parseInt(document.getElementById('p-producto').value) || null,
    cantidad: parseInt(document.getElementById('p-cantidad').value) || 1,
    color_filamento: document.getElementById('p-color').value,
    precio_cotizado: parseFloat(document.getElementById('p-precio').value) || 0,
    notas: document.getElementById('p-notas').value
  };

  try {
    const res = await fetch('/api/admin/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      ['p-cliente','p-telefono','p-email','p-producto','p-cantidad','p-color','p-precio','p-notas'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('p-cantidad').value = 1;
      toggleNuevoPedido();
      cargarPedidos();
    } else {
      alert(data.error || 'Error al crear pedido');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

// === GENERIC CRUD HELPER ===
function renderCrud(containerId, items, columns, tipo) {
  const container = document.getElementById(containerId);
  if (!items.length) { container.innerHTML = '<p style="color:#888; padding:20px;">No hay registros</p>'; return; }

  container.innerHTML = items.map(item => `
    <div class="crud-card">
      <div class="crud-card-body">
        ${columns.map(col => `<div class="crud-field"><label>${col.label}</label><span>${item[col.key] != null ? escapeHtml(String(item[col.key])) : '-'}</span></div>`).join('')}
      </div>
      <div class="crud-actions">
        <button onclick="eliminarItem('${tipo}', ${item.id})" class="btn-delete">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

async function eliminarItem(tipo, id) {
  if (!confirm('Eliminar este registro?')) return;
  try {
    const res = await fetch(`/api/admin/${tipo}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      if (tipo === 'insumos') cargarInsumos();
      if (tipo === 'proveedores') cargarProveedores();
      if (tipo === 'clientes') cargarClientes();
    } else {
      alert(data.error || 'Error al eliminar');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

// === INSUMOS ===
async function cargarInsumos() {
  try {
    const res = await fetch('/api/admin/insumos', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const items = await res.json();
    renderCrud('admin-insumos', items, [
      { key: 'nombre', label: 'Nombre' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'unidad', label: 'Unidad' },
      { key: 'stock_minimo', label: 'Stock minimo' },
      { key: 'proveedor', label: 'Proveedor' },
      { key: 'notas', label: 'Notas' }
    ], 'insumos');
  } catch (error) {
    document.getElementById('admin-insumos').innerHTML = '<p>Error cargando insumos</p>';
  }
}

async function guardarInsumo() {
  const nombre = document.getElementById('i-nombre').value;
  if (!nombre) { alert('El nombre es obligatorio'); return; }
  const body = {
    nombre,
    categoria: document.getElementById('i-categoria').value,
    cantidad: parseFloat(document.getElementById('i-cantidad').value) || 0,
    unidad: document.getElementById('i-unidad').value,
    stock_minimo: parseFloat(document.getElementById('i-minimo').value) || 0,
    proveedor: document.getElementById('i-proveedor').value,
    notas: document.getElementById('i-notas').value
  };
  try {
    const res = await fetch('/api/admin/insumos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      ['i-nombre','i-categoria','i-cantidad','i-unidad','i-minimo','i-proveedor','i-notas'].forEach(id => document.getElementById(id).value = '');
      toggleForm('insumo');
      cargarInsumos();
    } else {
      alert(data.error || 'Error al guardar');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

// === PROVEEDORES ===
async function cargarProveedores() {
  try {
    const res = await fetch('/api/admin/proveedores', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const items = await res.json();
    renderCrud('admin-proveedores', items, [
      { key: 'empresa', label: 'Empresa' },
      { key: 'contacto', label: 'Contacto' },
      { key: 'telefono', label: 'Telefono' },
      { key: 'email', label: 'Email' },
      { key: 'direccion', label: 'Direccion' },
      { key: 'notas', label: 'Notas' }
    ], 'proveedores');
  } catch (error) {
    document.getElementById('admin-proveedores').innerHTML = '<p>Error cargando proveedores</p>';
  }
}

async function guardarProveedor() {
  const empresa = document.getElementById('pr-empresa').value;
  if (!empresa) { alert('La empresa es obligatoria'); return; }
  const body = {
    empresa,
    contacto: document.getElementById('pr-contacto').value,
    telefono: document.getElementById('pr-telefono').value,
    email: document.getElementById('pr-email').value,
    direccion: document.getElementById('pr-direccion').value,
    notas: document.getElementById('pr-notas').value
  };
  try {
    const res = await fetch('/api/admin/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      ['pr-empresa','pr-contacto','pr-telefono','pr-email','pr-direccion','pr-notas'].forEach(id => document.getElementById(id).value = '');
      toggleForm('proveedor');
      cargarProveedores();
    } else {
      alert(data.error || 'Error al guardar');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

// === CLIENTES ===
async function cargarClientes() {
  try {
    const res = await fetch('/api/admin/clientes', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const items = await res.json();
    renderCrud('admin-clientes', items, [
      { key: 'nombre', label: 'Nombre' },
      { key: 'telefono', label: 'Telefono' },
      { key: 'email', label: 'Email' },
      { key: 'direccion', label: 'Direccion' },
      { key: 'notas', label: 'Notas' }
    ], 'clientes');
  } catch (error) {
    document.getElementById('admin-clientes').innerHTML = '<p>Error cargando clientes</p>';
  }
}

async function guardarCliente() {
  const nombre = document.getElementById('c-nombre').value;
  if (!nombre) { alert('El nombre es obligatorio'); return; }
  const body = {
    nombre,
    telefono: document.getElementById('c-telefono').value,
    email: document.getElementById('c-email').value,
    direccion: document.getElementById('c-direccion').value,
    notas: document.getElementById('c-notas').value
  };
  try {
    const res = await fetch('/api/admin/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      ['c-nombre','c-telefono','c-email','c-direccion','c-notas'].forEach(id => document.getElementById(id).value = '');
      toggleForm('cliente');
      cargarClientes();
    } else {
      alert(data.error || 'Error al guardar');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}

// === CAMBIAR CONTRASENA ===
async function cambiarPassword() {
  const actual = document.getElementById('pass-actual').value;
  const nueva = document.getElementById('pass-nueva').value;
  const confirm = document.getElementById('pass-confirm').value;

  if (!actual || !nueva || !confirm) { alert('Completa todos los campos'); return; }
  if (nueva !== confirm) { alert('Las contrasenas nuevas no coinciden'); return; }

  try {
    const res = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ actual, nueva })
    });
    const data = await res.json();
    if (data.success) {
      alert('Contrasena cambiada correctamente');
      ['pass-actual','pass-nueva','pass-confirm'].forEach(id => document.getElementById(id).value = '');
    } else {
      alert(data.error || 'Error al cambiar contrasena');
    }
  } catch (error) {
    alert('Error de conexion');
  }
}
