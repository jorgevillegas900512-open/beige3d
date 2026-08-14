const https = require('https');
const http = require('http');
const { readDb, writeDb } = require('./database');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Error parsing JSON: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function extractIdFromUrl(url) {
  const match = url.match(/\/models\/(\d+)/);
  return match ? match[1] : null;
}

async function obtenerDetalleModelo(designId) {
  const url = `https://api.bambulab.com/v1/design-service/design/${designId}`;
  try {
    return await fetchJson(url);
  } catch (error) {
    console.error('Error obteniendo detalle:', error.message);
    return null;
  }
}

function guardarProducto(db, modelo) {
  const makerworldId = modelo.modelId || String(modelo.id);
  const existing = db.productos.find(p => p.makerworld_id === makerworldId);

  const instance = modelo.instances && modelo.instances[0];
  const plates = instance?.extention?.modelInfo?.plates || [];
  const filaments = instance?.instanceFilaments || [];
  const pictures = modelo.designExtension?.design_pictures || [];
  const categories = modelo.categories || [];
  const categoryName = categories[0]?.name || 'General';

  const images = pictures.map(p => p.url).filter(Boolean);
  if (modelo.coverUrl && !images.includes(modelo.coverUrl)) {
    images.unshift(modelo.coverUrl);
  }

  const pesoGramos = instance?.weight || 0;
  const numPlatos = plates.length || 1;

  const data = {
    makerworld_id: makerworldId,
    titulo: modelo.title || 'Sin titulo',
    descripcion: modelo.summary || modelo.summaryTranslated || '',
    imagen_principal: modelo.coverUrl || '',
    imagenes: JSON.stringify(images),
    categoria: categoryName,
    tags: JSON.stringify(modelo.tags || []),
    materiales: JSON.stringify([...new Set(filaments.map(f => f.type))]),
    impresoras_compatibles: JSON.stringify([]),
    tiempo_impresion_horas: 0,
    tiempo_impresion_minutos: 0,
    peso_gramos: pesoGramos,
    num_platos: numPlatos,
    filamentos: JSON.stringify(filaments.map(f => ({
      type: f.type,
      color: f.color,
      usedMeters: parseFloat(f.usedM) || 0,
      usedGrams: parseInt(f.usedG) || 0
    }))),
    licencia: modelo.license || '',
    disenador: modelo.designCreator?.name || '',
    likes: modelo.likeCount || 0,
    descargas: modelo.downloadCount || 0,
    impresiones: modelo.printCount || 0,
    url_makerworld: `https://makerworld.com/en/models/${modelo.id}-${modelo.slug || ''}`,
    activo: 1,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    Object.assign(existing, data);
    console.log(`  Actualizado: ${data.titulo}`);
  } else {
    data.id = db.next_producto_id++;
    data.created_at = new Date().toISOString();
    data.precio_impresion = 0;
    data.precio_material = 0;
    data.precio_ganancia = 0;
    data.precio_total = 0;
    db.productos.push(data);
    console.log(`  Importado: ${data.titulo}`);
  }

  return true;
}

async function importarPorUrls(urls) {
  console.log(`Importando ${urls.length} modelos por URL...`);

  const db = readDb();
  let importados = 0;

  for (const url of urls) {
    const designId = extractIdFromUrl(url.trim());
    if (!designId) {
      console.log(`  URL invalida: ${url}`);
      continue;
    }

    try {
      const modelo = await obtenerDetalleModelo(designId);
      if (modelo) {
        guardarProducto(db, modelo);
        importados++;
      }
    } catch (err) {
      console.error(`  Error con ID ${designId}: ${err.message}`);
    }
  }

  writeDb(db);
  console.log(`\nTotal importados: ${importados}`);
  return importados;
}

async function importarPorModeloIds(ids) {
  console.log(`Importando ${ids.length} modelos por ID...`);

  const db = readDb();
  let importados = 0;

  for (const id of ids) {
    try {
      const modelo = await obtenerDetalleModelo(id);
      if (modelo) {
        guardarProducto(db, modelo);
        importados++;
      }
    } catch (err) {
      console.error(`  Error con ID ${id}: ${err.message}`);
    }
  }

  writeDb(db);
  console.log(`\nTotal importados: ${importados}`);
  return importados;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const comando = args[0];

  if (comando === 'url' || comando === 'urls') {
    const urls = args.slice(1);
    importarPorUrls(urls);
  } else if (comando === 'ids') {
    const ids = args.slice(1);
    importarPorModeloIds(ids);
  } else {
    console.log('Uso:');
    console.log('  node scraper.js url "URL1" "URL2" ...  - Importar por URLs');
    console.log('  node scraper.js ids 12345 67890        - Importar por IDs');
    console.log('');
    console.log('Ejemplo:');
    console.log('  node scraper.js url "https://makerworld.com/en/models/2316580-spring-swing-couple-silhouette"');
  }
}

module.exports = { importarPorUrls, importarPorModeloIds, obtenerDetalleModelo, extractIdFromUrl };
