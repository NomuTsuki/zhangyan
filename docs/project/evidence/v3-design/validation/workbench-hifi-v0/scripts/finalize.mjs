import fs from 'node:fs';
import crypto from 'node:crypto';
const output = new URL('../dist/index.html', import.meta.url);
const bytes = fs.readFileSync(output);
fs.writeFileSync(new URL('../prototype.html', import.meta.url), bytes);
fs.writeFileSync(new URL('../build-stamp.json', import.meta.url), JSON.stringify({
  builtAt: new Date().toISOString(), entry: 'prototype.html', bytes: bytes.length,
  sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  source: 'React/Three.js presentation; imports unchanged fusion local-session and graph modules',
}, null, 2)+'\n');
console.log(`Offline prototype built: ${bytes.length} bytes`);
