/* review required: scoped native UI, offline delivery and capture checks.
 * UI actions are real; window snapshots and DOM observers are read-only. */
import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { ACTIONS } from '../../workbench-map-fusion-v0/local-case.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(base,'../../../../../..');
const before=process.argv.includes('--before'),tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)||(before?'before':'after');
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const out=resolve(root,'output/playwright/closeout-2026-09-12',tag);await mkdir(out,{recursive:true});
const assets=resolve(root,'docs/portfolio/2026-09-12-v3-closeout');await mkdir(assets,{recursive:true});
const source=resolve(base,'prototype.html'),url=pathToFileURL(source).href;
const report={reviewRequired:true,url,sha256:createHash('sha256').update(await readFile(source)).digest('hex'),checks:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});let page,context,errors=[];
const P='A.INSPECT.WINDOWS',S='A.SYNTHESIZE.SURFACE_REGIONS',OP='obs.surface.point-layering',OS='obs.surface.resolved';
const actions=new Map(ACTIONS.map(a=>[a.id,a])),body={OBJ_W:'整只碗',OBJ_F:'底足与修足',OBJ_D:'纹饰与色差',OBJ_R:'没被改动的特征',SURF:'表面'};
const route=['A.OBSERVE.WHOLE','A.OBSERVE.BASE','A.LOCATE.HISTORIC_IMAGE','A.VERIFY.OBJECT_CONTINUITY','A.RESEARCH.ACCIDENT','A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT','A.CORROBORATE.ARCHIVE.T3_CURRENT','A.ANALYZE.MATERIAL.SUBSTRATE','A.INSPECT.MATERIAL.LAYER_SEQUENCE',P,S,'A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'];
const state=()=>page.evaluate(()=>window.hifiSnapshot());
async function start(width=1440,dpr=1,reduced=true,record=false){if(context)await context.close();errors=[];context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:dpr,reducedMotion:reduced?'reduce':'no-preference',...(record?{recordVideo:{dir:out,size:{width,height:1000}}}:{})});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('page-crash'));await page.goto(url);await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady&&window.hifiSnapshot().visibleBody.includes('OBJ_R'));await writeFile(resolve(out,'last-initial-ui.txt'),await page.locator('body').innerText());}
async function prepare(id){const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();const place=actions.get(id).place;if(body[place]){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');await page.waitForFunction(p=>window.hifiSnapshot().visibleBody.includes(p),place);await page.locator('.bowl-target-list').getByRole('button',{name:body[place],exact:true}).click();}else await page.locator(`[data-place="${place}"]`).click();return page.locator(`[data-action-row="${id}"]`);}
async function take(id){const n=(await state()).session.log.length;const row=await prepare(id);await row.locator(`[data-action="${id}"]`).click();await page.waitForFunction(n=>!window.hifiSnapshot().computeBusy&&window.hifiSnapshot().session.log.length===n,n+1,{timeout:30000});}
const idle=()=>page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='idle',null,{timeout:30000});
async function shot(name,portfolio=false){const path=resolve(portfolio?assets:out,`2026-09-12-${tag==='final'?'closeout-':''}${name}.png`);await page.screenshot({path});return path;}
async function check(name,fn){if(only&&!name.includes(only))return;try{const evidence=await fn();assert.deepEqual(errors,[]);report.checks.push({name,passed:true,evidence});}catch(e){report.checks.push({name,passed:false,error:e.stack,errors:[...errors],screenshot:await shot('failure-'+report.checks.length)});}await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.checks.at(-1)));}
try{
 if(before){await check('Baseline permits regional synthesis before trial windows',async()=>{await start(1440,2);const row=await prepare(S);assert.equal(await row.locator(`[data-action="${S}"]`).isEnabled(),true);const setup=await shot('before-surface-method-2x',true);await take(S);await idle();const s=await state();assert.equal(s.session.log.length,1);assert.ok(s.graph.nodes.some(n=>n.id===OS));assert.ok(!s.graph.nodes.some(n=>n.id===OP));return{setup,steps:1,hasPoint:false,hasSurface:true};});}
 else{
  await check('Unavailable synthesis explains the missing input and cannot spend an opportunity',async()=>{await start(1440,2);const row=await prepare(S),button=row.locator(`[data-action="${S}"]`);assert.equal(await button.isDisabled(),true);assert.match(await row.innerText(),/试窗/);await row.locator('.method-title').click();assert.equal((await state()).session.log.length,0);assert.ok(!(await state()).graph.nodes.some(n=>n.id===OS));return{setup:await shot('after-surface-method-2x',true),steps:0,why:await row.innerText()};});
  await check('Window result then regional synthesis grows the existing road and keeps history',async()=>{
   await start(1440,2,false,true);await page.evaluate(()=>{window.__closeoutPhases=[];new MutationObserver(()=>{const p=document.querySelector('.map-component').dataset.phase;if(window.__closeoutPhases.at(-1)?.phase!==p)window.__closeoutPhases.push({phase:p,at:performance.now()});}).observe(document.querySelector('.map-component'),{attributes:true,attributeFilter:['data-phase']});});
   await page.waitForTimeout(3000);await take(P);await idle();assert.ok((await state()).graph.frontiers.some(f=>f.id==='question:surface'));await shot('surface-frontier-2x',true);
   const row=await prepare(S);assert.equal(await row.locator(`[data-action="${S}"]`).isEnabled(),true);const s=(await state()).session;
   await row.locator(`[data-action="${S}"]`).click();await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='fly');
   assert.equal(await page.locator(`[data-map-node="${OS}"]`).evaluate(e=>getComputedStyle(e).opacity),'0');
   await idle();const after=await state();assert.equal(after.session.log.length,2);assert.equal(after.graph.frontiers.some(f=>f.id==='question:surface'),false);
   await shot('surface-connected-2x',true);await page.waitForTimeout(4000);const phases=await page.evaluate(()=>window.__closeoutPhases);for(const p of ['fly','focus','pullback','connect','idle'])assert.ok(phases.some(x=>x.phase===p),p);
   const done=await prepare(S);assert.equal(await done.locator(`[data-action="${S}"]`).innerText(),'已经做过');assert.equal(await done.locator(`[data-action="${S}"]`).isDisabled(),true);await page.keyboard.press('Escape');
   await page.getByRole('button',{name:/^调查记录/}).click();const history=page.locator('.history-list button');await history.nth(1).click();await page.waitForFunction(()=>!window.hifiSnapshot().computeBusy&&window.hifiSnapshot().historyIndex===1);const old=await state();assert.ok(old.graph.nodes.some(n=>n.id===OP));assert.ok(!old.graph.nodes.some(n=>n.id===OS));await page.locator('.history-banner button').click();await page.waitForFunction(()=>!window.hifiSnapshot().computeBusy&&window.hifiSnapshot().historyIndex===null);assert.equal((await state()).session.log.length,2);
   return{phases,steps:2,billed:after.session.billed,priorSteps:s.log.length};
  });
  for(const width of [1280,1440,1920])await check(`${width}px full 16-investigation route, minimum zoom, drag, history and stop`,async()=>{
   await start(width,width===1440?2:1);await page.evaluate(()=>{window.__closeoutPerf={frames:[],tasks:[]};new PerformanceObserver(l=>window.__closeoutPerf.tasks.push(...l.getEntries().map(x=>x.duration))).observe({type:'longtask'});document.addEventListener('click',e=>{if(e.target.closest('[data-action]')){const t=performance.now();requestAnimationFrame(()=>window.__closeoutPerf.frames.push(performance.now()-t));}},true);});
   for(const id of route)await take(id);await idle();await page.keyboard.press('Escape');const s=await state();assert.equal(s.stage,'G3');assert.equal(s.session.log.length,16);assert.equal(s.session.budget-s.session.log.length,6);for(const id of ['identity','majorReassembly','threePhase','coherentDecisionProfile'])assert.equal(s.claims[id].established,true);
   assert.equal(await page.getByText('先把这只碗拿在眼前。',{exact:false}).count(),0);assert.ok(await page.getByText('已有材料和判断保留在地图中。',{exact:false}).isVisible());
   await page.getByRole('button',{name:'全览',exact:true}).click();if(width===1440)await shot('workbench-16-actions-2x',true);else await shot('full-'+width);
   for(let n=0;n<24;n++)await page.getByRole('button',{name:'缩小地图',exact:true}).click();assert.equal((await page.evaluate(()=>window.hifiMapSnapshot())).camera.s,.2);
   const rect=await page.locator('.map-viewport').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+60,rect.y+rect.height/2+40,{steps:12});await page.mouse.up();assert.equal(await page.evaluate(()=>window.getSelection()?.toString()),'');await page.waitForTimeout(500);assert.equal((await page.evaluate(()=>window.hifiMapSnapshot())).phase,'idle');await page.getByRole('button',{name:'全览',exact:true}).click();
   await page.getByRole('button',{name:/^调查记录/}).click();await page.locator('.history-list button').nth(1).click();await page.waitForFunction(()=>!window.hifiSnapshot().computeBusy&&window.hifiSnapshot().historyIndex===1);assert.equal((await state()).session.log.length,16);await page.locator('.history-banner button').click();await page.waitForFunction(()=>!window.hifiSnapshot().computeBusy&&window.hifiSnapshot().historyIndex===null);
   await page.getByRole('button',{name:'收手，作出判断',exact:true}).click();await page.getByRole('button',{name:'确认收手',exact:true}).click();await page.waitForFunction(()=>window.hifiSnapshot().session.stopped);assert.equal((await state()).session.log.length,16);
   const perf=await page.evaluate(()=>window.__closeoutPerf);return{steps:16,stage:'G3',minimumZoom:.2,maxInputToFrameMs:Math.max(...perf.frames),maxLongTaskMs:Math.max(0,...perf.tasks),stopped:true};
  });
 }
}finally{if(context)await context.close();await browser.close();report.passed=report.checks.every(x=>x.passed);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,out}));if(!report.passed)process.exitCode=1;
