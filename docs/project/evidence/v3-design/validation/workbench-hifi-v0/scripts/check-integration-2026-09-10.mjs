/* review required: approved UI changes, native browser actions; snapshots read only. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {ACTIONS} from '../../workbench-map-fusion-v0/local-case.mjs';
import {completedInvestigation,takeNewInvestigation} from '../src/action-state.mjs';
import * as engine from '../../workbench-map-fusion-v0/local-session.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..'),tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)||'first';
const out=resolve(base,'verification-integration-2026-09-10',tag);await mkdir(out,{recursive:true});
const html=await readFile(resolve(base,'prototype.html'));
const report={reviewRequired:true,sha256:createHash('sha256').update(html).digest('hex'),checks:[],generatedAt:new Date().toISOString()};
const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',P:'A.LOCATE.HISTORIC_IMAGE',C:'A.VERIFY.OBJECT_CONTINUITY',X:'A.IMAGE.XRAY',T2:'A.RESEARCH.ACCIDENT',ATTR:'A.RELATE.ARCHIVE.T2_TO_OBJECT',CORR:'A.CORROBORATE.ARCHIVE.T2_CURRENT',D:'A.MAP.REGION_CONTINUITY',POINT:'A.INSPECT.WINDOWS',SURF:'A.SYNTHESIZE.SURFACE_REGIONS'};
const body={OBJ_W:'整只碗',OBJ_F:'底足与修足',OBJ_D:'纹饰与色差',OBJ_R:'没被改动的特征',SURF:'表面'};
const actions=new Map(ACTIONS.map(a=>[a.id,a]));
const browser=await chromium.launch({channel:'msedge',headless:true});let page,errors=[];
const state=()=>page.evaluate(()=>window.hifiSnapshot()),map=()=>page.evaluate(()=>window.hifiMapSnapshot());
async function start(width=1440,reduced=true){if(page)await page.close();errors=[];page=await browser.newPage({viewport:{width,height:1000},reducedMotion:reduced?'reduce':'no-preference'});page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(resolve(base,'prototype.html')).href);await page.waitForFunction(()=>window.hifiSnapshot&&window.hifiMapSnapshot);await page.locator('.bowl-webgl').waitFor();await page.waitForFunction(()=>window.hifiSnapshot().visibleBody.includes('OBJ_R'));}
async function prepare(id,basis,hotspot=false){const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();const p=actions.get(id).place;
  if(body[p]){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(p==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');await page.waitForFunction(id=>window.hifiSnapshot().visibleBody.includes(id),p);if(hotspot)await page.locator(`.bowl-hotspot[data-bowl-target="${p}"]`).click();else await page.locator('.bowl-target-list').getByRole('button',{name:body[p],exact:true}).click();}
  else await page.locator(`[data-place="${p}"]`).click();
  const row=page.locator(`[data-action-row="${id}"]`);await row.waitFor();if(basis)await row.locator(`input[value="${basis}"]`).check();return row.locator(`[data-action="${id}"]`);
}
async function take(id,basis){const button=await prepare(id,basis),before=await state();assert.equal(await button.isEnabled(),true,id);await button.click();await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n,before.session.log.length+1);return state();}
async function idle(){await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='idle',null,{timeout:20000});}
async function screenshot(name){const file=resolve(out,name+'.png');await page.screenshot({path:file,fullPage:true});return file;}
async function settingMotion(reduce){await page.getByRole('button',{name:'设置',exact:true}).click();const checkbox=page.getByRole('dialog').getByRole('checkbox');if(reduce)await checkbox.check();else await checkbox.uncheck();await page.keyboard.press('Escape');}
async function check(name,fn){try{const evidence=await fn();assert.deepEqual(errors,[]);report.checks.push({name,passed:true,evidence});console.log(JSON.stringify({name,passed:true}));}catch(error){report.checks.push({name,passed:false,error:error.stack,errors:[...errors],screenshot:page?await screenshot('failure-'+report.checks.length):null});console.log(JSON.stringify({name,passed:false,error:error.message}));}}

await check('Identical investigations are free to recall; a new comparison basis is still new',async()=>{
 const s=engine.newSession();for(const id of [A.W,A.B,A.P,A.C,A.T2,A.X])assert.equal(takeNewInvestigation(s,id).ok,true);
 const snap=structuredClone(s);assert.equal(takeNewInvestigation(s,A.W).alreadyDone,true);assert.deepEqual(s,snap);
 assert.equal(takeNewInvestigation(s,A.D,{comparisonBasis:'photo'}).ok,true);const photo=structuredClone(s);
 assert.equal(takeNewInvestigation(s,A.D,{comparisonBasis:'photo'}).alreadyDone,true);assert.deepEqual(s,photo);
 assert.equal(takeNewInvestigation(s,A.D,{comparisonBasis:'archive'}).ok,true);assert.notEqual(completedInvestigation(s,A.D,'photo').observationId,completedInvestigation(s,A.D,'archive').observationId);
 return{ordinaryRepeatCharged:false,matchingBasisCharged:false,alternateBasisPreserved:true};
});
await check('Actual entry anchors the popup and the flight for outside and bowl hotspots',async()=>{
 await start(1440,false);const results=[];
 for(const [id,hotspot]of [[A.X,false],['A.OBSERVE.REGION_DECOR',true]]){
  const button=await prepare(id,null,hotspot),s=await state(),anchor=s.entryAnchor,pop=await page.locator('.investigation-popover').boundingBox();
  assert.ok(pop.x>=anchor.x+anchor.width-1,'popover is next to the left investigation entry');assert.ok(Math.abs(pop.x-anchor.x-anchor.width-12)<2);assert.ok(anchor.y+anchor.height>=pop.y-12&&anchor.y<=pop.y+pop.height+12);
  const photo=await screenshot(hotspot?'bowl-near-popup':'outside-near-popup');await button.click();await page.waitForFunction(()=>window.hifiMapSnapshot().flight===true);
  const flight=(await map()).flightPath.match(/^M ([\d.-]+) ([\d.-]+)/);assert.ok(Math.abs(+flight[1]-anchor.x-anchor.width/2)<3);assert.ok(Math.abs(+flight[2]-anchor.y-anchor.height/2)<3);
  results.push({id,anchor,pop,screenshot:photo});await page.keyboard.press('Escape');await idle();const camera=(await map()).camera;await page.waitForTimeout(3300);assert.deepEqual((await map()).camera,camera);assert.equal((await map()).flight,false);
 }
 return results;
});
await check('Map dragging does not select text; selection and recovery remain free',async()=>{
 await start();await take(A.W);await take(A.B);await take(A.P);await take(A.C);await page.getByRole('button',{name:'全览',exact:true}).click();
 const s=await state(),before=(await map()).camera;const spot=await page.locator('.map-viewport').evaluate(el=>{const r=el.getBoundingClientRect();for(let y=r.top+30;y<r.bottom-100;y+=25)for(let x=r.left+20;x<r.right-100;x+=25){const hit=document.elementFromPoint(x,y);if(hit?.closest('.map-viewport')&&!hit.closest('button,.road-hit'))return{x,y};}throw Error('No drag space');});
 await page.mouse.move(spot.x,spot.y);await page.mouse.down();await page.mouse.move(spot.x+180,spot.y+160,{steps:20});await page.mouse.up();assert.equal(await page.evaluate(()=>getSelection().toString()),'');assert.notDeepEqual((await map()).camera,before);assert.deepEqual((await state()).session,s.session);
 await page.locator('[data-claim="identity"]').click();await page.keyboard.press('Escape');assert.equal((await state()).selection,null);assert.deepEqual((await state()).session,s.session);return{selectedText:'',sessionUnchanged:true};
});
await check('UI repeat buttons are disabled and material recall preserves judgment context',async()=>{
 await start(1280);await take(A.W);await take(A.B);const button=await prepare(A.W);assert.equal(await button.isDisabled(),true);assert.equal(await button.innerText(),'已经做过');const before=(await state()).session;await page.locator('.completed-record').click();assert.equal(await page.locator('.plate-canvas canvas').count(),0);await page.keyboard.press('Escape');assert.deepEqual((await state()).session,before);
 await page.locator('[data-claim="identity"]').click();await page.locator('.sources-section .source-row').first().click();assert.equal((await state()).materialContext.id,'claim:identity');const content=await page.getByRole('dialog').innerText();assert.match(content,/年代与类别/);assert.match(content,/观察|调查结果/);assert.equal(await page.locator('.plate-canvas canvas').count(),0);const shot=await screenshot('1280-judgment-evidence');await page.keyboard.press('Escape');assert.deepEqual((await state()).session,before);
 await take(A.P);await take(A.T2);await take(A.X);await take(A.D,'photo');const repeated=await prepare(A.D,'photo');assert.equal(await repeated.isDisabled(),true);await page.locator('input[name="comparison-basis"][value="archive"]').check();assert.equal(await repeated.isEnabled(),true);await repeated.click();assert.equal((await state()).session.log.at(-1).comparisonBasis,'archive');return{context:'claim:identity',screenshot:shot,alternativeComparisonEnabled:true};
});
await check('Old photo and xray remain acquired once; verification grows first and later uses follow',async()=>{
 await start();for(const id of [A.X,A.P,A.W,A.B])await take(id);const pre=await map(),preState=await state();const canonical=pre.layout.frontiers.find(f=>f.id==='question:photo-object').segments[0].d;
 await settingMotion(false);await take(A.C);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect',null,{timeout:10000});
 const beginning=await map();assert.equal(beginning.layout.routes.find(r=>r.id==='photo:object').d,canonical);assert.ok(beginning.transition.routes['interpretation:photo-history'].start>beginning.transition.routes['photo:object'].end);
 const startMask=await page.locator('[data-growth-mask="photo:object"]').first().evaluate(el=>getComputedStyle(el).strokeDashoffset);await page.waitForTimeout(900);const middleMask=await page.locator('[data-growth-mask="photo:object"]').first().evaluate(el=>getComputedStyle(el).strokeDashoffset);assert.notEqual(startMask,middleMask);const shot=await screenshot('photo-mid-connection');await idle();
 const after=await state();for(const id of ['obs.phase.t1','obs.structure.xray.early'])assert.equal(after.session.log.filter(e=>e.observationId===id).length,1);for(const n of pre.layout.nodes){const next=(await map()).layout.nodes.find(p=>p.id===n.id);assert.equal(next.x,n.x);assert.equal(next.y,n.y);}assert.equal(after.session.log.length,preState.session.log.length+1);
 const bounds=await page.evaluate(()=>{const v=document.querySelector('.map-viewport').getBoundingClientRect();return ['claim:identity','interpretation:photo-repair'].map(id=>{const node=document.querySelector(`[data-map-node="${id}"]`),label=document.querySelector(`[data-map-label="${id}"]`);return{id,inside:[node,label].filter(Boolean).every(el=>{const r=el.getBoundingClientRect();return r.left>=v.left&&r.right<=v.right&&r.top>=v.top&&r.bottom<=v.bottom;})};});});assert.ok(bounds.every(b=>b.inside),'Both new judgment and historical use must remain inside the pullback');return{sameCanonicalCurve:true,startMask,middleMask,newResultBounds:bounds,screenshot:shot};
});
await check('History, restart and stopping cancel camera and roads without stale callbacks',async()=>{
 await start(1440,false);await take(A.W);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly');await page.getByRole('button',{name:/^调查记录/}).click();await page.locator('.history-list button').first().click();await idle();assert.equal((await state()).graph.nodes.length,0);const past=(await map()).camera;await page.waitForTimeout(3300);assert.deepEqual((await map()).camera,past);await page.locator('.history-banner button').click();
 await take(A.P);await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:'重开',exact:true}).click();await page.getByRole('button',{name:'重新开始',exact:true}).click();await idle();await page.waitForTimeout(3300);assert.equal((await state()).session.log.length,0);assert.equal((await map()).flight,false);
 await take(A.X);await page.getByRole('button',{name:'收手，作出判断',exact:true}).click();await page.getByRole('button',{name:'确认收手',exact:true}).click();await idle();const stopMap=(await map()).camera;await page.waitForTimeout(3300);assert.equal((await state()).session.stopped,true);assert.equal((await state()).session.log.length,1);assert.deepEqual((await map()).camera,stopMap);return{history:true,restart:true,stopping:true};
});
await check('A method opened from a question resolves its body entry after rotation',async()=>{
 await start();for(const id of [A.W,A.B,A.P])await take(id);await page.keyboard.press('Escape');
 await page.locator('.open-question').filter({hasText:'照片里是眼前这只碗吗'}).click();
 await page.locator('.related-methods summary').click();await page.locator('.related-methods button').filter({hasText:actions.get(A.C).name}).click();
 assert.equal((await state()).openPlace,'OBJ_R');await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');await page.waitForFunction(()=>window.hifiSnapshot().visibleBody.includes('OBJ_R'));
 const button=page.locator(`[data-action="${A.C}"]`);await button.waitFor();assert.equal(await button.isEnabled(),true);await button.click();await page.waitForFunction(()=>window.hifiSnapshot().session.log.length===4);return{completed:true,action:(await state()).session.log.at(-1).actionId};
});
if(page)await page.close();await browser.close();report.passed=report.checks.every(c=>c.passed);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,out}));if(!report.passed)process.exitCode=1;
