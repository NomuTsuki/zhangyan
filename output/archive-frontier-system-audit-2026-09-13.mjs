// Preserve diagnostic evidence only; never overwrite prior artifacts.
import {readFile,copyFile,mkdir,writeFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve('.');
const dest='docs/project/evidence/v3-design/validation/workbench-hifi-v0/verification-frontier-system-audit-2026-09-13';
const input='output/playwright/frontier-system-audit-2026-09-13';
await mkdir(dest,{recursive:true});
const pairs=[['sweep.json',`${input}/sweep.json`],['browser-report.json',`${input}/browser/report.json`],
  ...['layers-before-material-before.png','layers-before-material-after.png','record-before-verification-connect.png',
    'uv-to-regional-synthesis-after.png','appearance-to-window-after.png','xray-to-comparison-connect.png'].map(f=>[f,`${input}/browser/${f}`]),
  ['user-material-order-feedback.png','C:/Users/ASUS/AppData/Local/Temp/codex-clipboard-6887514c-91de-4e07-9e5f-09ecc416644e.png'],
  ...['audit-map-frontiers-2026-09-13.mjs','audit-frontier-browser-2026-09-13.mjs'].map(f=>[`${f}.txt`,`output/${f}`])];
const entries=[];
for(const [name,source] of pairs){await copyFile(source,`${dest}/${name}`,constants.COPYFILE_EXCL);const data=await readFile(`${dest}/${name}`);entries.push({file:name,source,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
const product='docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html';
const data=await readFile(product),sha256=createHash('sha256').update(data).digest('hex');
const sweep=JSON.parse(await readFile(`${dest}/sweep.json`,'utf8')),browser=JSON.parse(await readFile(`${dest}/browser-report.json`,'utf8'));
if(sha256!==sweep.buildSha256||sha256!==browser.sha256)throw new Error('Evidence build mismatch');
const manifest={capturedAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),product:{file:product,sha256,bytes:data.length},
  verdict:'FAIL: systematic frontier retirement without a visible successor',reviewRequired:true,
  coverage:{orders:sweep.orders,transitions:sweep.transitions,uniqueTransitions:sweep.uniqueTransitions,...sweep.summary,
    browserCasesExecuted:browser.cases.filter(c=>c.executed).length,browserCasesTotal:browser.cases.length},entries};
await writeFile(`${dest}/manifest.json`,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({preserved:entries.length,sha256,coverage:manifest.coverage}));
