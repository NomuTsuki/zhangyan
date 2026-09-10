/* review required: native UI regression and cold-page responsiveness checks.
 * Read-only observers never replace game state, engine calls, timers or animations. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {ACTIONS} from '../../workbench-map-fusion-v0/local-case.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..'),tag=process.argv.find(x=>x.startsWith('--tag='))?.slice(6)||'first';
const suite=process.argv.find(x=>x.startsWith('--suite='))?.slice(8)||'all',url=process.argv.find(x=>x.startsWith('--url='))?.slice(6)||pathToFileURL(resolve(base,'prototype.html')).href;
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7);
const out=resolve(base,'verification-performance-fix-2026-09-10',tag);await mkdir(out,{recursive:true});
const report={reviewRequired:true,url,sha256:createHash('sha256').update(await readFile(resolve(base,'prototype.html'))).digest('hex'),suite,checks:[],generatedAt:new Date().toISOString()};
const actions=new Map(ACTIONS.map(a=>[a.id,a])),body={OBJ_W:'整只碗',OBJ_F:'底足与修足',OBJ_D:'纹饰与色差',OBJ_R:'没被改动的特征',SURF:'表面'};
const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',P:'A.LOCATE.HISTORIC_IMAGE',C:'A.VERIFY.OBJECT_CONTINUITY',X:'A.IMAGE.XRAY',T2:'A.RESEARCH.ACCIDENT',ATTR:'A.RELATE.ARCHIVE.T2_TO_OBJECT',D:'A.MAP.REGION_CONTINUITY'};
const main=[A.W,A.B,A.P,A.C,A.T2,A.ATTR,'A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT',A.X,'A.INSPECT.WINDOWS','A.CORROBORATE.ARCHIVE.T3_CURRENT','A.SYNTHESIZE.SURFACE_REGIONS','A.ANALYZE.MATERIAL.SUBSTRATE','A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'];
const rest=['A.SCREEN.UV','A.OBSERVE.REGION_DECOR','A.COMPARE.CORPUS','A.COMPARE.CORPUS.RECHECK',A.D];
const browser=await chromium.launch({channel:'msedge',headless:true});let page,errors=[];
async function start(reduced=true,width=1440,dpr=1){if(page)await page.close();errors=[];page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:dpr,reducedMotion:reduced?'reduce':'no-preference'});page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady!==false&&window.hifiSnapshot?.().visibleBody.includes('OBJ_R'));}
const state=()=>page.evaluate(()=>window.hifiSnapshot()),map=()=>page.evaluate(()=>window.hifiMapSnapshot());
async function prepare(id,basis){const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();const p=actions.get(id).place;if(body[p]){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(p==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');await page.waitForFunction(p=>window.hifiSnapshot().visibleBody.includes(p),p);await page.locator('.bowl-target-list').getByRole('button',{name:body[p],exact:true}).click();}else await page.locator(`[data-place="${p}"]`).click();const row=page.locator(`[data-action-row="${id}"]`);if(basis)await row.locator(`input[value="${basis}"]`).check();return row.locator(`[data-action="${id}"]`);}
async function take(id,basis){const n=(await state()).session.log.length;await(await prepare(id,basis)).click();await page.waitForFunction(n=>!window.hifiSnapshot().computeBusy&&window.hifiSnapshot().session.log.length===n,n+1,{timeout:30000});}
async function idle(){await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='idle',null,{timeout:30000});}
async function motion(reduce){await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('dialog').getByRole('checkbox').setChecked(reduce);await page.keyboard.press('Escape');}
async function shot(name){const file=resolve(out,name+'.png');await page.screenshot({path:file,timeout:6000});return file;}
async function check(name,fn){if(only&&!name.includes(only))return;try{const evidence=await fn();assert.deepEqual(errors,[]);report.checks.push({name,passed:true,evidence});}catch(e){let screenshot;try{screenshot=await shot('failure-'+report.checks.length);}catch{}report.checks.push({name,passed:false,error:e.stack,errors:[...errors],screenshot});}await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.checks.at(-1)));}
if(suite==='all'||suite==='reveal'){
await check('New question and frontier wait until information lands and camera pulls back',async()=>{
 await start(false);await take(A.X);await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='fly');await page.waitForTimeout(350);
 const node=page.locator('[data-map-node="obs.structure.xray.early"]'),q=page.locator('[data-map-frontier="question:change"]');assert.equal(await node.evaluate(e=>getComputedStyle(e).opacity),'0');assert.equal(await q.evaluate(e=>getComputedStyle(e).opacity),'0','Question cannot precede the flying material');
 assert.equal(await page.locator('[data-frontier-hit="question:change"]').count(),0);const before=await shot('xray-in-flight');
 await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='focus');assert.equal(await node.evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await q.evaluate(e=>getComputedStyle(e).opacity),'0');
 const mask=page.locator('[data-frontier-growth="question:change"]').first();const initial=await mask.evaluate(e=>getComputedStyle(e).strokeDashoffset);await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='connect');await page.waitForTimeout(450);const growing=await mask.evaluate(e=>getComputedStyle(e).strokeDashoffset);assert.notEqual(growing,initial);assert.equal(await q.evaluate(e=>getComputedStyle(e).opacity),'0');const middle=await shot('xray-frontier-growing');await idle();assert.equal(await q.evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await page.locator('[data-frontier-hit="question:change"]').count(),1);return {before,middle,initial,growing,after:await shot('xray-frontier-settled')};
});
await check('The old photo question stays with its road until verification reaches it',async()=>{
 await start();for(const id of [A.W,A.B,A.P])await take(id);await motion(false);await take(A.C);await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='fly');const q=page.locator('[data-retiring-question="question:photo-object"]');assert.equal(await q.evaluate(e=>getComputedStyle(e).opacity),'1');const before=await shot('verification-flight-old-question');await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='connect');await page.waitForTimeout(600);assert.equal(await q.evaluate(e=>getComputedStyle(e).opacity),'1');await page.waitForTimeout(1500);assert.ok(+await q.evaluate(e=>getComputedStyle(e).opacity)<.01);await idle();assert.equal(await q.count(),0);assert.equal((await state()).session.log.length,4);return{before,after:await shot('verification-settled')};
});
await check('Canceling during flight or frontier growth settles every visible element',async()=>{
 await start(false);await take(A.X);await page.getByRole('button',{name:'缩小地图',exact:true}).click();await idle();const before=await map();assert.equal(await page.locator('[data-map-frontier="question:change"]').evaluate(e=>getComputedStyle(e).opacity),'1');await page.waitForTimeout(4200);assert.deepEqual((await map()).camera,before.camera);assert.equal((await map()).flight,false);await take(A.P);await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='connect');await page.keyboard.press('Escape');await idle();assert.equal(await page.locator('[data-frontier-growth]').count(),0);return{historyLength:(await state()).session.log.length,camera:before.camera};
});
}
if(suite==='all'||suite==='performance'){
await check('22 cold native investigations keep the UI responsive and preserve costs and judgments',async()=>{
 await start();await page.evaluate(()=>{window.__perfFix={events:[],tasks:[]};new PerformanceObserver(l=>window.__perfFix.tasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask'});document.addEventListener('click',e=>{if(e.target.closest('[data-action]')){const row={id:e.target.closest('[data-action]').dataset.action,at:performance.now()};window.__perfFix.events.push(row);requestAnimationFrame(()=>row.firstFrame=performance.now()-row.at);}},true);});
 for(const id of [...main,...rest]){await take(id,id===A.D?'archive':undefined);if((await state()).session.log.length===17){const s=await state();assert.equal(s.stage,'G3');assert.ok(Object.values(s.claims).filter(c=>c?.established).length>=4);}}
 const s=await state();assert.equal(s.session.log.length,22);assert.equal(s.session.billed.reduce((n,x)=>n+x,0),22);assert.equal(s.session.budget,22);assert.equal(s.session.stopped,false);
 const perf=await page.evaluate(()=>window.__perfFix),worst=Math.max(...perf.events.map(e=>e.firstFrame)),maxTask=Math.max(0,...perf.tasks.map(e=>e.duration));await writeFile(resolve(out,'cold-route.json'),JSON.stringify(perf,null,2));assert.ok(worst<200,`Click-to-next-frame ${worst} ms exceeds the 200 ms regression budget`);assert.ok(maxTask<200,`Main thread long task ${maxTask} ms exceeds budget`);
 const repeated=await prepare(A.W);assert.equal(await repeated.isDisabled(),true);assert.equal(await repeated.innerText(),'已经做过');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'收手，作出判断',exact:true}).click();await page.getByRole('button',{name:'确认收手',exact:true}).click();await page.waitForFunction(()=>window.hifiSnapshot().session.stopped);return{worstClickFrameMs:worst,maxLongTaskMs:maxTask,steps:s.session.log.length,stage:s.stage};
});
for(const [name,operation]of [['manual-navigation','navigate'],['cancel-selection','clear'],['history','history'],['restart','restart'],['stop','stop']])await check(`Cold pending investigation remains atomic through ${name}`,async()=>{
 await start();for(const id of main.slice(0,16))await take(id);await motion(false);const button=await prepare(main[16]);if(operation==='clear')await page.locator(`[data-action-row="${main[16]}"] .method-title`).click();const box=await button.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2,{clickCount:operation==='clear'?1:2,delay:12});await page.waitForFunction(()=>window.hifiSnapshot().computeBusy);
 let expectedCamera;
 if(operation==='navigate'){for(let i=0;i<14;i++)await page.getByRole('button',{name:'缩小地图',exact:true}).click();expectedCamera=(await map()).camera;}
 if(operation==='clear')await page.getByRole('button',{name:'取消选择',exact:true}).click();
 if(operation==='history'){await page.getByRole('button',{name:/^调查记录/}).click();await page.locator('.history-list button').first().click();}
 if(operation==='restart'){await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:'重开',exact:true}).click();await page.getByRole('button',{name:'重新开始',exact:true}).click();}
 if(operation==='stop'){await page.getByRole('button',{name:'收手，作出判断',exact:true}).click();await page.getByRole('button',{name:'确认收手',exact:true}).click();}
 await page.waitForFunction(()=>window.hifiSnapshot().engineReady&&!window.hifiSnapshot().computeBusy,null,{timeout:30000});await page.waitForTimeout(1800);const s=await state(),m=await map();assert.equal(s.session.log.length,operation==='restart'?0:17);assert.equal(s.session.billed.reduce((n,x)=>n+x,0),s.session.log.length);assert.equal(m.flight,false);assert.equal(m.phase,'idle');
 if(expectedCamera)assert.deepEqual(m.camera,expectedCamera);if(operation==='clear')assert.equal(s.selection,null);if(operation==='history'){assert.equal(s.historyIndex,0);assert.equal(s.graph.nodes.length,0);await page.locator('.history-banner button').click();await page.waitForFunction(()=>window.hifiSnapshot().historyIndex===null&&!window.hifiSnapshot().computeBusy);assert.ok((await state()).graph.nodes.length>0);}if(operation==='stop')assert.equal(s.session.stopped,true);return{log:s.session.log.length,bill:s.session.billed,phase:m.phase,history:s.historyIndex,camera:m.camera};
});
}
report.passed=report.checks.every(c=>c.passed);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,out}));if(!report.passed)process.exitCode=1;
