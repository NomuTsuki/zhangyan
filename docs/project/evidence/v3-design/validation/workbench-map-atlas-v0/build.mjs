import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sources = {
  FIXTURES: '../first-ceramic-author-scenarios-v0/fixtures.mjs',
  SOLVER: '../first-ceramic-author-scenarios-v0/solver.mjs',
  CASE: '../knowledge-map-slice-v0/case.mjs',
  SEMANTICS: '../evidence-semantics-v0/semantics.mjs',
  SESSION: '../workbench-map-focus-v1/session.mjs',
  GRAPH: 'graph.mjs',
  LAYOUT: 'layout.mjs',
};
const namespaces = Object.fromEntries(Object.entries(sources).map(([name, path]) => [path.split('/').pop(), name]));
const stamp = { builtAt: new Date().toISOString(), sources: {}, templateSha256: '' };
const hash = text => createHash('sha256').update(text).digest('hex');
const modules = [];
for (const [name, path] of Object.entries(sources)) {
  const raw = await readFile(resolve(here, path), 'utf8');
  stamp.sources[name] = { path, sha256: hash(raw) };
  const names = [...raw.matchAll(/^export\s+(?:async\s+)?(?:const|let|function|class)\s+([\w$]+)/gm)].map(match => match[1]);
  let code = raw.replace(/^import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?\s*/gm, (_, bindings, source) => {
    const ns = namespaces[source.split('/').pop()];
    if (!ns) throw new Error(`Unsupported import: ${source}`);
    return `const {${bindings.replace(/\bas\b/g, ':')}} = ${ns};\n`;
  });
  code = code.replace(/^export\s*\{([^}]+)\};?/gm, (_, bindings) => {
    for (const value of bindings.split(',').map(value => value.trim()).filter(Boolean)) {
      if (/\bas\b/.test(value)) throw new Error('Aliased export requires explicit build support');
      names.push(value);
    }
    return '';
  }).replace(/^export\s+(?=(?:async\s+)?(?:const|let|function|class)\b)/gm, '');
  if (/^\s*(?:import|export)\s/m.test(code)) throw new Error(`Unresolved module syntax: ${name}`);
  modules.push(`const ${name} = (() => {\n${code}\nreturn {${[...new Set(names)].join(',')}};\n})();`);
}
const template = await readFile(resolve(here, 'template.html'), 'utf8');
stamp.templateSha256 = hash(template);
const output = template.replace('/*__STAMP__*/', `const STAMP = ${JSON.stringify(stamp, null, 2)};`)
  .replace('/*__MODULES__*/', modules.join('\n\n'));
if (/\/\*__(?:STAMP|MODULES)__\*\//.test(output)) throw new Error('Unresolved template placeholder');
await writeFile(resolve(here, 'prototype.html'), output, 'utf8');
await writeFile(resolve(here, 'build-stamp.json'), JSON.stringify(stamp, null, 2) + '\n', 'utf8');
console.log('Built prototype.html; source modules: ' + Object.keys(sources).length);
console.log('Template SHA256: ' + stamp.templateSha256);
console.log('Output bytes: ' + Buffer.byteLength(output));
