// Servidor estático para probar la app compilada como en Firebase Hosting:
// aplica los encabezados de firebase.json (incluida la política de seguridad de
// contenido) y devuelve index.html para las rutas de la app.
//
//   node pruebas/servidor.mjs [carpeta=dist-demo] [puerto=4173]

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const carpeta = resolve(process.argv[2] ?? 'dist-demo');
const puerto = Number(process.argv[3] ?? 4173);
const config = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8')).hosting;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

/** Convierte un patrón de Firebase Hosting (glob con ** , * y @(a|b)) en expresión regular. */
function aRegex(patron) {
  let p = patron.startsWith('/') || patron.startsWith('**') ? patron : `/${patron}`;
  let r = '';
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '*' && p[i + 1] === '*') {
      i++;
      if (p[i + 1] === '/') {
        i++;
        r += '(?:.*/)?';
      } else r += '.*';
    } else if (c === '*') r += '[^/]*';
    else if (c === '@' && p[i + 1] === '(') {
      const fin = p.indexOf(')', i);
      r += `(?:${p.slice(i + 2, fin).split('|').map((x) => x.replace(/[.+^${}()[\]\\]/g, '\\$&')).join('|')})`;
      i = fin;
    } else r += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${r}$`);
}

const reglas = (config.headers ?? []).map((h) => ({ re: aRegex(h.source), headers: h.headers }));
const ignorar = (config.ignore ?? []).map(aRegex);

function encabezados(ruta) {
  const h = {};
  for (const r of reglas) if (r.re.test(ruta)) for (const { key, value } of r.headers) h[key] = value;
  return h;
}

createServer(async (req, res) => {
  try {
    const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let archivo = normalize(join(carpeta, ruta));
    if (!archivo.startsWith(carpeta + sep) && archivo !== carpeta) {
      res.writeHead(400).end();
      return;
    }
    let servida = ruta;
    let existe = false;
    try {
      existe = (await stat(archivo)).isFile() && !ignorar.some((re) => re.test(ruta));
    } catch {
      /* no existe */
    }
    if (!existe) {
      // Archivos con extensión que no existen: 404, como Firebase. El resto va a la app.
      if (extname(ruta) && extname(ruta) !== '.html') {
        res.writeHead(404, encabezados(ruta)).end('No encontrado');
        return;
      }
      archivo = join(carpeta, 'index.html');
      servida = '/index.html';
    }
    let cuerpo = await readFile(archivo);
    const tipo = TIPOS[extname(archivo)] ?? 'application/octet-stream';
    const extra = {};
    // Como Firebase Hosting: el texto viaja comprimido.
    const acepta = String(req.headers['accept-encoding'] ?? '');
    if (/^(text|application\/(json|manifest))|svg/.test(tipo) && cuerpo.length > 1024) {
      if (acepta.includes('br')) (cuerpo = brotliCompressSync(cuerpo)), (extra['Content-Encoding'] = 'br');
      else if (acepta.includes('gzip')) (cuerpo = gzipSync(cuerpo)), (extra['Content-Encoding'] = 'gzip');
      extra.Vary = 'Accept-Encoding';
    }
    res.writeHead(200, { 'Content-Type': tipo, ...extra, ...encabezados(ruta), ...(servida !== ruta ? encabezados(servida) : {}) });
    res.end(req.method === 'HEAD' ? undefined : cuerpo);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(puerto, '127.0.0.1', () => console.log(`Sirviendo ${carpeta} en http://127.0.0.1:${puerto}`));
