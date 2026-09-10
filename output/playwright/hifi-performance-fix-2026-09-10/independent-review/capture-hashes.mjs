import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),base='E:/zhangyan__v2/docs/project/evidence/v3-design/validation/workbench-hifi-v0';
const files=['src/App.tsx','src/MapView.tsx','src/map-motion.mjs','src/engine-client.mjs','src/engine-runtime.mjs','src/engine.worker.ts','src/engine.ts','src/action-state.mjs','vite.config.ts','scripts/finalize.mjs'];
const report={reviewedAt:new Date().toISOString(),scope:'static source review only; no build, engine execution, or browser',files:files.map(file=>{const bytes=fs.readFileSync(path.join(base,file));return{file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};})};
fs.writeFileSync(path.join(out,'source-hashes.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
