import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const root=process.cwd(),base='docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html';
const out=resolve('output/playwright/report-source-2026-09-13/pair'),assets=resolve('docs/portfolio/2026-09-13-report-source-continuity');await mkdir(out,{recursive:true});
const baseline=resolve(out,'2e5dafc-prototype.html');await writeFile(baseline,execFileSync('git',['show',`2e5dafc:${base}`],{maxBuffer:16*1024*1024}),{flag:'wx'});
const browser=await chromium.launch({channel:'msedge',headless:true}),evidence=[];
try{for(const [name,source] of [['before',baseline],['after',resolve(root,base)]]){
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'}),page=await context.newPage();
 await page.goto(pathToFileURL(source).href+'?lang=en');await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady);
 for(const [i,id] of ['A.RELATE.ARCHIVE.T2_TO_OBJECT','A.RESEARCH.ACCIDENT'].entries()){
  await page.locator('[data-place="T2"]').click();await page.locator(`[data-action-row="${id}"] [data-action]`).click();await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n&&!window.hifiSnapshot().computeBusy,i+1);
 }
 await page.keyboard.press('Escape');await page.locator('.map-fit').click();
 const file=resolve(assets,`2026-09-13-${name}-same-two-enquiries.png`);await page.screenshot({path:file});
 evidence.push({name,sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),file,snapshot:await page.evaluate(()=>({session:window.hifiSnapshot().session,graph:window.hifiSnapshot().graph,camera:window.hifiMapSnapshot().camera}))});await context.close();
}}finally{await browser.close();}
await writeFile(resolve(out,'evidence.json'),JSON.stringify(evidence,null,2));console.log(evidence.map(e=>({name:e.name,sha:e.sourceSha256,steps:e.snapshot.session.log.length,sourceLinks:e.snapshot.graph.edges.filter(e=>e.kind==='source-record').length})));
