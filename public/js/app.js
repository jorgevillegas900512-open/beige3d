let paginaActual = 1;
let totalPaginas = 1;
let letraActual = '';

document.addEventListener('DOMContentLoaded', () => {
  cargarCategorias();
  contarPorLetras();

  document.getElementById('buscarInput').addEventListener('input', debounce(() => {
    paginaActual = 1;
    cargarProductos();
  }, 300));

  document.getElementById('filtroCategoria').addEventListener('change', () => {
    paginaActual = 1;
    cargarProductos();
  });
});

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function cargarCategorias() {
  try {
    const res = await fetch('/api/categorias');
    const categorias = await res.json();
    const select = document.getElementById('filtroCategoria');
    categorias.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.categoria;
      opt.textContent = `${cat.categoria} (${cat.count})`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('Error cargando categorias:', error);
  }
}

async function contarPorLetras() {
  try {
    const res = await fetch('/api/productos?limit=500');
    const data = await res.json();
    const productos = data.productos || [];
    const letras = {};
    productos.forEach(p => {
      const primera = (p.titulo || '').charAt(0).toUpperCase();
      if (primera && /[A-Z]/.test(primera)) {
        letras[primera] = (letras[primera] || 0) + 1;
      }
    });
    renderFiltroAlfabetico(letras);
    cargarProductos();
  } catch (error) {
    console.error('Error contando letras:', error);
  }
}

function renderFiltroAlfabetico(letras) {
  const container = document.getElementById('filtroAlfabeto');
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let html = `<button class="${letraActual === '' ? 'active' : ''}" onclick="filtrarPorLetra('')">Todo</button>`;

  alfabeto.forEach(letra => {
    const count = letras[letra] || 0;
    const clase = letraActual === letra ? 'active' : (count === 0 ? 'disabled' : '');
    html += `<button class="${clase}" onclick="filtrarPorLetra('${letra}')" title="${count} productos">${letra}</button>`;
  });

  container.innerHTML = html;
}

function filtrarPorLetra(letra) {
  letraActual = letra;
  paginaActual = 1;
  cargarProductos();
  contarPorLetras();
}

async function cargarProductos() {
  const buscar = document.getElementById('buscarInput').value;
  const categoria = document.getElementById('filtroCategoria').value;
  const catalogo = document.getElementById('catalogo');

  catalogo.innerHTML = '<div class="loading">Cargando productos...</div>';

  try {
    const params = new URLSearchParams({
      page: paginaActual,
      limit: 20,
      ...(buscar && { buscar }),
      ...(categoria && { categoria }),
      ...(letraActual && { letra: letraActual })
    });

    const res = await fetch(`/api/productos?${params}`);
    const data = await res.json();

    document.getElementById('resultados-info').textContent =
      `${data.pagination.total} productos encontrados${letraActual ? ' (letra ' + letraActual + ')' : ''}`;

    if (data.productos.length === 0) {
      catalogo.innerHTML = '<div class="no-resultados">No se encontraron productos.</div>';
      document.getElementById('paginacion').innerHTML = '';
      return;
    }

    catalogo.innerHTML = data.productos.map(p => crearTarjeta(p)).join('');
    totalPaginas = data.pagination.pages;
    renderPaginacion();
  } catch (error) {
    catalogo.innerHTML = '<div class="no-resultados">Error cargando productos</div>';
  }
}

function crearTarjeta(producto) {
  let tags = [];
  try {
    tags = JSON.parse(producto.tags || '[]').slice(0, 3);
  } catch(e) {}

  return `
    <div class="producto-card" onclick="verDetalle(${producto.id})">
      <img src="${producto.imagen_principal || 'https://via.placeholder.com/300x220?text=Sin+imagen'}"
           alt="${producto.titulo}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/300x220?text=Sin+imagen'" />
      <div class="info">
        <h3 title="${producto.titulo}">${producto.titulo}</h3>
        <div class="meta">
          <span>${producto.tiempo_impresion_horas || 0}h ${producto.tiempo_impresion_minutos || 0}m</span>
          <span>${producto.peso_gramos || 0}g</span>
          <span>${producto.likes || 0} likes</span>
        </div>
        <div class="tags">
          <span class="tag categoria-tag">${producto.categoria || 'General'}</span>
          ${tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

async function verDetalle(id) {
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
    let tags = [];
    try { tags = JSON.parse(p.tags || '[]'); } catch(e) {}

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
      <h2>${p.titulo}</h2>

      <div class="modal-galeria">
        <img src="${p.imagen_principal || 'https://via.placeholder.com/400x300?text=Sin+imagen'}"
             alt="${p.titulo}" onerror="this.src='https://via.placeholder.com/400x300?text=Sin+imagen'" />
        ${imagenes.filter(i => i !== p.imagen_principal).map(img =>
          `<img src="${img}" alt="Vista" onerror="this.style.display='none'" />`
        ).join('')}
      </div>

      <div class="modal-detalles">
        <div class="detalle-item">
          <label>Tiempo de impresion</label>
          <span>${p.tiempo_impresion_horas || 0}h ${p.tiempo_impresion_minutos || 0}m</span>
        </div>
        <div class="detalle-item">
          <label>Peso total</label>
          <span>${p.peso_gramos || 0}g</span>
        </div>
        <div class="detalle-item">
          <label>Platos</label>
          <span>${p.num_platos || 1}</span>
        </div>
        <div class="detalle-item">
          <label>Categoria</label>
          <span>${p.categoria || 'General'}</span>
        </div>
        <div class="detalle-item">
          <label>Materiales</label>
          <span>${materiales.join(', ') || 'No especificado'}</span>
        </div>
        <div class="detalle-item">
          <label>Impresoras</label>
          <span>${impresoras.slice(0, 3).join(', ')}${impresoras.length > 3 ? '...' : ''}</span>
        </div>
        <div class="detalle-item">
          <label>Descargas</label>
          <span>${p.descargas || 0}</span>
        </div>
        <div class="detalle-item">
          <label>Impresiones</label>
          <span>${p.impresiones || 0}</span>
        </div>
      </div>

      ${filamentos.length > 0 ? `
        <h3 style="margin-bottom:10px">Filamentos necesarios</h3>
        <ul class="filamentos-list">
          ${filamentos.map(f => `
            <li>
              <span class="filamento-color" style="background:${f.color || '#ccc'}"></span>
              <strong>${f.type || 'N/A'}</strong> - ${f.usedGrams || 0}g (${f.usedMeters || 0}m)
            </li>
          `).join('')}
        </ul>
      ` : ''}

      ${tags.length > 0 ? `
        <div style="margin-top:15px">
          <strong>Tags:</strong> ${tags.map(t => `<span class="tag">${t}</span>`).join(' ')}
        </div>
      ` : ''}

      ${p.precio_total > 0 ? `
        <div style="margin-top:15px; padding:15px; background:#e8f5e9; border-radius:8px;">
          <strong style="font-size:1.3rem; color:#2e7d32;">Precio: $${p.precio_total.toFixed(2)}</strong>
        </div>
      ` : ''}

      <a href="${p.url_makerworld || '#'}" target="_blank" class="btn-solicitar">
        Ver en MakerWorld
      </a>

      <button class="btn-solicitar" style="background:#1976d2; margin-left:10px" onclick="solicitarImpresion(${p.id}, '${p.titulo.replace(/'/g, "\\'")}')">
        Solicitar impresion
      </button>
    `;

    document.getElementById('modal').style.display = 'flex';
  } catch (error) {
    alert('Error cargando detalle del producto');
  }
}

function cerrarModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') cerrarModal();
});

function solicitarImpresion(id, titulo) {
  const nombre = prompt('Tu nombre:');
  if (!nombre) return;
  const telefono = prompt('Tu telefono/WhatsApp:');
  if (!telefono) return;

  fetch('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente_nombre: nombre,
      cliente_telefono: telefono,
      producto_id: id,
      cantidad: 1
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Pedido enviado! Te contactaremos pronto.');
      cerrarModal();
    } else {
      alert('Error: ' + (data.error || 'Intenta de nuevo'));
    }
  })
  .catch(() => alert('Error de conexion'));
}

function renderPaginacion() {
  const container = document.getElementById('paginacion');
  if (totalPaginas <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  if (paginaActual > 1) {
    html += `<button onclick="cambiarPagina(${paginaActual - 1})">Anterior</button>`;
  }

  for (let i = 1; i <= totalPaginas; i++) {
    if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
      html += `<button class="${i === paginaActual ? 'active' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
    } else if (i === paginaActual - 3 || i === paginaActual + 3) {
      html += `<button disabled>...</button>`;
    }
  }

  if (paginaActual < totalPaginas) {
    html += `<button onclick="cambiarPagina(${paginaActual + 1})">Siguiente</button>`;
  }

  container.innerHTML = html;
}

function cambiarPagina(page) {
  paginaActual = page;
  cargarProductos();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
