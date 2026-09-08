import { readFile, writeFile } from 'node:fs/promises';
const source = new URL('./', import.meta.url);
const template = await readFile(new URL('template.html', source), 'utf8');
const model = (await readFile(new URL('model.mjs', source), 'utf8')).replace(/^export\s+/gm, '');
if (!template.includes('/*__MODEL__*/')) throw new Error('Model placeholder missing');
await writeFile(new URL('prototype.html', source), template.replace('/*__MODEL__*/', model), 'utf8');
console.log('Built standalone prototype.html');
