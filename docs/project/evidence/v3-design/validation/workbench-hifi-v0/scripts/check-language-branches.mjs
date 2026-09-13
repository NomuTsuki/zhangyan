/* review required: browser regression for order-dependent questions, road
 * details, source reports, history and accessibility text. Uses real controls. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {ACTIONS} from '../../workbench-map-fusion-v0/local-case.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(base,'../../../../../..');
const tag=process.argv.find(s=>s.startsWith('--tag='))?.slice(6)||'before',repro=process.argv.includes('--repro');
const only=process.argv.find(s=>s.startsWith('--only='))?.slice(7);
const out=resolve(root,'output/playwright/language-audit-2026-09-13',tag),assets=resolve(root,'docs/portfolio/2026-09-13-language-order-fix');
await mkdir(out,{recursive:true});await mkdir(assets,{recursive:true});
const source=resolve(base,'prototype.html'),url=pathToFileURL(source).href+'?lang=en';
const report={reviewRequired:true,sha256:createHash('sha256').update(await readFile(source)).digest('hex'),checks:[],inspected:{questions:[],roads:[],nodes:[],materials:[],actions:[]},scans:0};
if(repro)await copyFile(source,resolve(out,'reproduced-build.html'));
const browser=await chromium.launch({channel:'msedge',headless:true});let context,page,errors=[];
const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',P:'A.LOCATE.HISTORIC_IMAGE',C:'A.VERIFY.OBJECT_CONTINUITY',X:'A.IMAGE.XRAY',CMP:'A.MAP.REGION_CONTINUITY',T2:'A.RESEARCH.ACCIDENT',A2:'A.RELATE.ARCHIVE.T2_TO_OBJECT',C2:'A.CORROBORATE.ARCHIVE.T2_CURRENT',T3:'A.RESEARCH.LATE_TREATMENT',A3:'A.RELATE.ARCHIVE.T3_TO_OBJECT',C3:'A.CORROBORATE.ARCHIVE.T3_CURRENT',MAT:'A.ANALYZE.MATERIAL.SUBSTRATE',LAY:'A.INSPECT.MATERIAL.LAYER_SEQUENCE',POINT:'A.INSPECT.WINDOWS',SURF:'A.SYNTHESIZE.SURFACE_REGIONS',UV:'A.SCREEN.UV',CORP:'A.COMPARE.CORPUS',REPEAT:'A.COMPARE.CORPUS.RECHECK'};
const actions=new Map(ACTIONS.map(a=>[a.id,a]));
const state=()=>page.evaluate(()=>window.hifiSnapshot());
const idle=()=>page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='idle',null,{timeout:30000});
async function start(width=1440){if(context)await context.close();errors=[];context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:width===1440?2:1,reducedMotion:'reduce'});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('crash'));await page.goto(url);await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady&&window.hifiSnapshot().visibleBody.includes('OBJ_R'));}
async function shot(name,portfolio=false){const file=resolve(portfolio?assets:out,`2026-09-13-${tag}-${name}.png`);await page.screenshot({path:file});return file;}
const observed=(kind,id)=>{if(!report.inspected[kind].includes(id))report.inspected[kind].push(id);};
async function scan(where){
 report.scans++;const missing=await page.evaluate(()=>{
  const found=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode,p=n.parentElement;if(!p||p.closest('script,style,.brand,.language-switch,.final-note,textarea,dialog:not([open])')||!p.getClientRects().length)continue;if(/\p{Script=Han}/u.test(n.textContent))found.push(n.textContent.trim());}
  for(const e of document.querySelectorAll('[aria-label],[title],[placeholder]')){if(!e.getClientRects().length||e.closest('.brand,.language-switch,dialog:not([open])'))continue;for(const key of ['aria-label','title','placeholder'])if(/\p{Script=Han}/u.test(e.getAttribute(key)||''))found.push(key+': '+e.getAttribute(key));}return[...new Set(found)];
 });assert.deepEqual(missing,[],where+' leaks Chinese');
}
async function take(id,basis){const n=(await state()).session.log.length;const place=actions.get(id)?.place;assert.ok(place,id+' is an actual action');if(await page.locator('.investigation-popover').count())await page.locator('.popover-heading button').click();if(['OBJ_W','OBJ_F','OBJ_D','OBJ_R','SURF'].includes(place)){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(place==='OBJ_F')for(let k=0;k<11;k++)await page.keyboard.press('ArrowUp');await page.waitForFunction(p=>window.hifiSnapshot().visibleBody.includes(p),place);await page.locator(`.bowl-target-list [data-bowl-target="${place}"]`).click();}else await page.locator(`[data-place="${place}"]`).click();const row=page.locator(`[data-action-row="${id}"]`);if(basis)await row.locator(`input[value="${basis}"]`).check();await row.locator('[data-action]').click();await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n&&!window.hifiSnapshot().computeBusy,n+1,{timeout:30000});await idle();observed('actions',id);}
async function inspectState(){
 const before=await state();await page.keyboard.press('Escape');await page.locator('.map-fit').click();await scan('default view');
 const questions=(await state()).graph.frontiers;
 for(const q of questions){const element=page.locator(`[data-map-frontier="${q.id}"]`);await element.focus();await element.press('Enter');observed('questions',q.id);await scan('question '+q.id);const methods=page.locator('.related-methods');if(await methods.count()){await methods.locator('summary').click();await scan('question methods '+q.id);}}
 const roads=await page.locator('.road-key').count();for(let i=0;i<roads;i++){const el=page.locator('.road-key').nth(i);if(await el.isDisabled())continue;
  // Several visible branches select the same proof group. The product correctly
  // toggles a repeated selection off, so clear it before inspecting each branch.
  await page.keyboard.press('Escape');await el.focus();await el.press('Enter');const selected=(await state()).selection;assert.ok(selected,'road must open its edge or proof-group detail');observed('roads',selected.kind+':'+selected.id);await scan('road detail '+selected.id);}
 const nodes=await page.locator('[data-map-node]').count();for(let i=0;i<nodes;i++){const el=page.locator('[data-map-node]').nth(i),id=await el.getAttribute('data-map-node');await el.focus();await el.press('Enter');observed('nodes',id);await scan('node detail '+id);const open=page.locator('.selection-details .material-link');if(await open.count()){await open.first().click();const active=await page.locator('.material-reader').getAttribute('data-observation-id');observed('materials',active);await scan('record '+active);await page.locator('.material-image-toggle').click();await scan('record source '+active);await page.keyboard.press('Escape');}}
 for(const id of ['identity','majorReassembly','threePhase','coherentDecisionProfile']){await page.locator(`[data-claim="${id}"]`).click();await scan('assessment '+id);}
 await page.keyboard.press('Escape');const after=await state();assert.deepEqual(after.session,before.session,'review changed the ledger');assert.deepEqual(after.graph,before.graph,'review changed acquired information');
}
async function check(name,fn){if(only&&!name.includes(only))return;try{const evidence=await fn();assert.deepEqual(errors,[]);report.checks.push({name,passed:true,evidence});}catch(e){report.checks.push({name,passed:false,error:e.stack,errors:[...errors],screenshot:await shot('failure-'+report.checks.length)});}await writeFile(resolve(out,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.checks.at(-1)));}
const cases=[
 {name:'Report-first later attribution',width:1440,steps:['A3','W','T3','C3']},
 {name:'Report-first later corroboration',width:1280,steps:['C3','T3','W','A3']},
 {name:'Report-first damage attribution',width:1920,steps:['A2','W','T2','C2']},
 {name:'Report-first damage corroboration',width:1440,steps:['C2','T2','W','A2']},
 {name:'Photograph and comparison before attribution',width:1280,steps:['P','B','W','X','CMP','C'],basis:'photo'},
 {name:'Archive comparison before attribution',width:1920,steps:['W','T2','CMP','A2'],basis:'archive'},
 {name:'Layers before substrates and surface synthesis',width:1440,steps:['LAY','MAT','POINT','SURF','UV']},
 {name:'Repeat comparison before primary comparison',width:1440,steps:['W','B','REPEAT','CORP']},
 {name:'Eight-action state matching the reported evidence set',width:1440,steps:['W','B','P','T2','A2','C2','POINT','A3']},
];
try{
 if(repro){await check('Minimal report-first reproduction',async()=>{await start();await take(A.A3);await page.keyboard.press('Escape');await page.locator('.map-fit').click();const overview=await shot('report-first-overview',true);await page.locator('.open-question').first().click();const details=await shot('report-first-detail',true);await scan('minimal report-first');return{overview,details};});}
 else for(const test of cases)await check(test.name,async()=>{await start(test.width);for(const step of test.steps){await take(A[step],step==='CMP'?test.basis:undefined);await inspectState();if(test.steps.indexOf(step)===0&&test.name==='Report-first later attribution'){await shot('report-first-overview',true);await page.locator('.open-question').first().click();await shot('report-first-detail',true);}}
  if(test.name.startsWith('Eight-action')){await page.locator('.map-fit').click();await shot('eight-actions',true);}
  await page.locator('.game-topbar').getByRole('button',{name:/^Records/}).click();await scan('history list');await page.locator('.history-list button').nth(1).click();await page.waitForFunction(()=>window.hifiSnapshot().historyIndex===1&&!window.hifiSnapshot().computeBusy);await inspectState();const s=await state();await page.locator('.language-switch').click();await page.locator('.language-switch').click();await scan('language restore in history');assert.deepEqual((await state()).session,s.session);await page.locator('.history-banner button').click();await page.waitForFunction(()=>window.hifiSnapshot().historyIndex===null&&!window.hifiSnapshot().computeBusy);await scan('present restored');
  return{width:test.width,steps:test.steps.length,historyChecked:true};});
}finally{if(context)await context.close();await browser.close();report.passed=report.checks.every(c=>c.passed);await writeFile(resolve(out,'browser.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,scans:report.scans,coverage:Object.fromEntries(Object.entries(report.inspected).map(([k,v])=>[k,v.length])),out}));if(!report.passed)process.exitCode=1;
