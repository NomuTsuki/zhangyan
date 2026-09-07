import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 4179);
createServer(async (request, response) => {
  if (!['/', '/prototype.html'].includes((request.url || '').split('?')[0])) {
    response.writeHead(404); response.end('Not found'); return;
  }
  try {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(await readFile(resolve(here, 'prototype.html')));
  } catch (error) { response.writeHead(500); response.end(String(error)); }
}).listen(port, '127.0.0.1', () => console.log(`Atlas prototype: http://127.0.0.1:${port}`));
