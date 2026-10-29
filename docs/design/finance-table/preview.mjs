import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const arg = (key, fallback) => process.argv[process.argv.indexOf(key) + 1] || fallback;
const port = process.argv.includes('--port') ? Number(arg('--port', '4173')) : 4173;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ttf': 'font/ttf' };
http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/account/jamescleaning')) {
      res.writeHead(302, { Location: 'https://myblue.finance' + url.pathname + url.search }).end();
      return;
    }
    // The recovered connection UI only reads configuration; no financial API is proxied.
    if (url.pathname === '/api/config') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ fundingEnabled: false }));
      return;
    }
    const file = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Design preview listening on ${port}`));
