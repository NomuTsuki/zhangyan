/* review required: report-source reveal, handoff, cancellation, and traceability.
 * Real UI inputs only; snapshots are read-only and no session is injected. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {ACTIONS} from '../../workbench-map-fusion-v0/local-case.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(base,'../../../../../..');
const tag=process.argv.find(s=>s.startsWith('--tag='))?.slice(6)||'first',only=process.argv.find(s=>s.startsWith('--only='))?.slice(7);
const out=resolve(root,'output/playwright/report-source-2026-09-13',tag),assets=resolve(root,'docs/portfolio/2026-09-13-report-source-continuity');
await mkdir(out,{recursive:true});await mkdir(assets,{recursive:true});
const source=resolve(base,'prototype.html'),url=pathToFileURL(source).href,actions=new Map(ACTIONS.map(a=>[a.id,a]));
const report={reviewRequired:true,sha256:createHash('sha256').update(await readFile(source)).digest('hex'),checks:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});let context,page,errors=[];
const state=()=>page.evaluate(()=>window.hifiSnapshot()),map=()=>page.evaluate(()=>window.hifiMapSnapshot());
const idle=()=>page.waitForFunction(()=>window.hifiMapSnapshot()?.phase==='idle',null,{timeout:40000});
async function start(width=1440,record=false){if(context)await context.close();errors=[];context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:width===1440?2:1,reducedMotion:'reduce',...(record?{recordVideo:{dir:out,size:{width,height:1000}}}:{})});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('crash'));await page.goto(url+'?lang=en');await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady&&window.hifiSnapshot().visibleBody.includes('OBJ_R'));}
async function motion(reduced){await page.locator('.game-topbar .settings-button').click();await page.locator('.setting-row input[type="checkbox"]').setChecked(reduced);await page.keyboard.press('Escape');}
async function take(id){const n=(await state()).session.log.length,place=actions.get(id).place;if(place==='OBJ_W')await page.locator('[data-bowl-target="OBJ_W"]').click();else await page.locator(`[data-place="${place}"]`).click();await page.locator(`[data-action-row="${id}"] [data-action]`).click();await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n&&!window.hifiSnapshot().computeBusy,n+1,{timeout:30000});}
async function shot(name,selected=false){const file=resolve(selected?assets:out,`2026-09-13-${tag}-${name}.png`);try{await readFile(file);throw Error('Capture already exists');}catch(e){if(e.code!=='ENOENT')throw e;}await page.screenshot({path:file});return file;}
async function english(){const found=await page.evaluate(()=>{const out=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const n=walk.currentNode,p=n.parentElement;if(!p||p.closest('script,style,.brand,.language-switch,dialog:not([open])')||!p.getClientRects().length)continue;if(/\p{Script=Han}/u.test(n.textContent))out.push(n.textContent);}return out;});assert.deepEqual(found,[]);}
async function check(name,fn){if(only&&!name.includes(only))return;try{const evidence=await fn();assert.deepEqual(errors,[]);report.checks.push({name,passed:true,evidence});}catch(e){report.checks.push({name,passed:false,error:e.stack,errors:[...errors],screenshot:await shot('failure-'+report.checks.length)});}await writeFile(resolve(out,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.checks.at(-1)));}
try{
 for(const [group,role,width] of [['t2','object-attribution',1440],['t2','current-corroboration',1280],['t3','object-attribution',1920],['t3','current-corroboration',1440]])await check(`${group} ${role}: source grows, remains, then report joins its carrier`,async()=>{
  await start(width);const id=`obs.archive.${group}.${role}`,q=`question:archive:${group}:source`,rid=group==='t2'?'obs.accident.major':'obs.phase.t3',read=group==='t2'?'A.RESEARCH.ACCIDENT':'A.RESEARCH.LATE_TREATMENT';
  await take(role==='object-attribution'?`A.RELATE.ARCHIVE.${group.toUpperCase()}_TO_OBJECT`:`A.CORROBORATE.ARCHIVE.${group.toUpperCase()}_CURRENT`);await idle();await page.locator('.map-fit').click();const before=await map(),d=before.layout.frontiers.find(f=>f.id===q).segments[0].d;
  const capture=group==='t2'&&role==='object-attribution';if(capture)await shot('held-report-frontier',true);
  await motion(false);await take(read);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly');
  assert.equal(await page.locator(`[data-map-node="${rid}"]`).evaluate(e=>getComputedStyle(e).opacity),'0');
  const old=page.locator(`[data-retiring-question="${q}"]`);assert.equal(await old.evaluate(e=>getComputedStyle(e).opacity),'1');
  const ink=page.locator(`[data-growth-mask="source:${id}"]`).first(),initial=await ink.evaluate(e=>getComputedStyle(e).strokeDashoffset);
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect');await page.waitForTimeout(600);
  const qbox=await old.boundingBox(),viewportBox=await page.locator('.map-viewport').boundingBox();
  assert.ok(qbox.x>=viewportBox.x&&qbox.x+qbox.width<=viewportBox.x+viewportBox.width,'The retiring source question must stay inside the pullback view');
  assert.notEqual(await ink.evaluate(e=>getComputedStyle(e).strokeDashoffset),initial);assert.equal(await old.evaluate(e=>getComputedStyle(e).opacity),'1');
  for(const element of await page.locator('[data-map-frontier]').all())assert.equal(await element.evaluate(e=>getComputedStyle(e).opacity),'0');
  if(capture)await shot('source-connecting',true);await idle();assert.equal(await old.count(),0);
  const linked=await map();assert.equal(linked.layout.routes.find(r=>r.id===`source:${id}`).d,d);if(capture)await shot('source-connected',true);
  const ri=linked.layout.routes.findIndex(r=>r.id===`source:${id}`);await page.locator('.road-key').nth(ri).click();await english();assert.equal((await state()).selection.id,`source:${id}`);assert.equal(await page.locator('.sources-section .source-row').count(),2);
  await page.locator(`[data-map-node="${id}"]`).click();await page.locator('.selection-details .material-link').click();await page.locator(`[data-report-source="${rid}"]`).click();assert.equal(await page.locator('.material-reader').getAttribute('data-observation-id'),rid);await english();await page.keyboard.press('Escape');
  await take('A.OBSERVE.WHOLE');await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly');assert.equal(await page.locator(`[data-retained-report="${id}"]`).evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await page.locator(`[data-report-marker="${id}"]`).evaluate(e=>getComputedStyle(e).opacity),'0');
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect');const transfer=(await map()).transition.reportTransfers.find(t=>t.reportId===id);await page.waitForTimeout(transfer.start+350);
  const traveler=page.locator(`[data-report-traveler="${id}"]`),p=await traveler.boundingBox();await page.waitForTimeout(500);const p2=await traveler.boundingBox();assert.ok(Math.hypot(p2.x-p.x,p2.y-p.y)>5,'Report must visibly move along its path');if(capture)await shot('report-joining-main-road',true);
  await idle();assert.equal(await traveler.count(),0);const marker=page.locator(`[data-report-marker="${id}"]`);assert.equal(await marker.evaluate(e=>getComputedStyle(e).opacity),'1');await marker.click();await page.locator('.selection-details .material-link').click();await english();assert.equal(await page.locator('.material-reader').getAttribute('data-observation-id'),id);await page.locator(`[data-report-source="${rid}"]`).click();await page.keyboard.press('Escape');
  assert.equal((await state()).session.log.length,3);if(capture)await shot('report-on-main-road',true);
  return{width,steps:3,canonicalPathPreserved:true,sourceAndReportReview:true,travelDistance:Math.hypot(p2.x-p.x,p2.y-p.y)};
 });
 await check('Already observed bowl: connect to arriving source before folding, in normal-speed recording',async()=>{
  await start(1440,true);await take('A.OBSERVE.WHOLE');await take('A.RELATE.ARCHIVE.T2_TO_OBJECT');await idle();await motion(false);await page.waitForTimeout(2200);await take('A.RESEARCH.ACCIDENT');await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect');const m=await map(),p=m.transition,sourceId='source:obs.archive.t2.object-attribution';
  assert.ok(p.routes['archive:t2:object'].start>p.routes[sourceId].end);assert.equal(await page.locator('[data-retained-report]').count(),1);await page.waitForTimeout(700);assert.equal(await page.locator('[data-retiring-question="question:archive:t2:source"]').evaluate(e=>getComputedStyle(e).opacity),'1');await idle();assert.equal(await page.locator('[data-report-marker]').count(),1);await english();await page.waitForTimeout(2500);const video=page.video();await context.close();context=null;const path=resolve(assets,`2026-09-13-${tag}-source-connect-and-fold.webm`);await video.saveAs(path);return{sourceFirst:true,video:path};
 });
 await check('Cancellation, history, language switch, minimum zoom and restart retain final state',async()=>{
  await start();await take('A.RELATE.ARCHIVE.T2_TO_OBJECT');await take('A.RESEARCH.ACCIDENT');await idle();await motion(false);await take('A.OBSERVE.WHOLE');await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect');await page.getByRole('button',{name:'Zoom out of map',exact:true}).click();await idle();const settled=await map();assert.equal(await page.locator('[data-report-traveler]').count(),0);assert.equal(await page.locator('[data-report-marker]').count(),1);await page.waitForTimeout(7000);assert.deepEqual((await map()).camera,settled.camera);
  await page.locator('.game-topbar').getByRole('button',{name:/^Records/}).click();await page.locator('.history-list button').nth(1).click();await page.waitForFunction(()=>window.hifiSnapshot().historyIndex===1&&!window.hifiSnapshot().computeBusy);assert.equal(await page.locator('[data-map-frontier="question:archive:t2:source"]').count(),1);assert.equal(await page.locator('[data-report-marker]').count(),0);await page.locator('.language-switch').click();await page.locator('.language-switch').click();await english();await page.locator('.history-banner button').click();await page.waitForFunction(()=>window.hifiSnapshot().historyIndex===null&&!window.hifiSnapshot().computeBusy);
  for(let i=0;i<20;i++)await page.getByRole('button',{name:'Zoom out of map',exact:true}).click();assert.equal((await map()).camera.s,.2);await page.locator('.game-topbar .settings-button').click();await page.getByRole('button',{name:'Restart',exact:true}).click();await page.getByRole('button',{name:'Restart',exact:true}).click();await page.waitForFunction(()=>window.hifiSnapshot().engineReady&&window.hifiSnapshot().session.log.length===0);assert.equal(await page.locator('[data-report-marker],[data-retained-report],[data-report-traveler]').count(),0);return{history:true,language:true,cancel:true,minZoom:.2,restart:true};
 });
 await check('Stopping, restarting and changing language during transfer clear every temporary carrier',async()=>{
  const outcomes=[];
  for(const mode of ['stop','restart','language']){
   await start();await take('A.RELATE.ARCHIVE.T2_TO_OBJECT');await take('A.RESEARCH.ACCIDENT');await idle();await motion(false);await take('A.OBSERVE.WHOLE');
   await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect');const startAt=(await map()).transition.reportTransfers[0].start;await page.waitForTimeout(startAt+200);
   if(mode==='stop'){await page.getByRole('button',{name:'Finish & assess',exact:true}).click();await page.getByRole('button',{name:'Confirm assessment',exact:true}).click();await page.waitForFunction(()=>window.hifiSnapshot().session.stopped);}
   if(mode==='restart'){await page.locator('.game-topbar .settings-button').click();await page.getByRole('button',{name:'Restart',exact:true}).click();await page.getByRole('button',{name:'Restart',exact:true}).click();await page.waitForFunction(()=>window.hifiSnapshot().engineReady&&window.hifiSnapshot().session.log.length===0);}
   if(mode==='language'){await page.locator('.language-switch').click();await page.locator('.language-switch').click();await english();}
   await idle();assert.equal(await page.locator('[data-report-traveler],[data-retained-report],[data-source-transfer]').count(),0);assert.equal((await state()).session.log.length,mode==='restart'?0:3);assert.equal(await page.locator('[data-report-marker]').count(),mode==='restart'?0:1);const settled=await map();await page.waitForTimeout(4000);assert.deepEqual((await map()).camera,settled.camera);outcomes.push(mode);
  }return{interruptedDuringTravel:outcomes};
 });
}finally{if(context)await context.close();await browser.close();report.passed=report.checks.every(c=>c.passed);await writeFile(resolve(out,'browser.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,out}));if(!report.passed)process.exitCode=1;
