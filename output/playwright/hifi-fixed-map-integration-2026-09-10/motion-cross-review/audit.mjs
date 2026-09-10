import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIONS } from '../../../../docs/project/evidence/v3-design/validation/workbench-map-fusion-v0/local-case.mjs';
import { layoutMap } from '../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/map-layout.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const here=dirname(fileURLToPath(import.meta.url)),base=resolve(here,'../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0');
const html=resolve(base,'prototype.html');mkdirSync(here,{recursive:true});
const hitOnly=process.argv.includes('--hit');
const report={date:new Date().toISOString(),reviewer:'fusion_road_geometry: layout implementer, cross-reviewing parent renderer/motion; not an independent QA role',
  htmlSha256:createHash('sha256').update(readFileSync(html)).digest('hex'),
  boundary:'Actual offline UI; no injected actions, session mutation, animation override or fake clock. One archive enhancement only. Root owns full desktop/cancellation regressions.',samples:[],errors:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
page.on('pageerror',e=>report.errors.push(e.message));
const map=()=>page.evaluate(()=>window.hifiMapSnapshot());
const read=()=>page.evaluate(()=>window.hifiSnapshot());
async function action(id){
  const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();
  const a=ACTIONS.find(a=>a.id===id),body=['OBJ_W','OBJ_F','OBJ_D','OBJ_R','SURF'].includes(a.place);
  if(body){const canvas=page.locator('.bowl-webgl');await canvas.focus();await page.keyboard.press('Home');if(a.place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');
    await page.waitForFunction(id=>window.hifiSnapshot().visibleBody.includes(id),a.place,{timeout:5000});await page.locator(`[data-bowl-target="${a.place}"]`).filter({visible:true}).first().click();
  }else await page.locator(`[data-place="${a.place}"]`).click();
  const before=(await read()).session.log.length;
  await page.locator(`[data-action="${id}"]`).click();await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n,before+1);return before+1;
}
async function sample(label){
  return page.evaluate(label=>{
    const snapshot=window.hifiMapSnapshot(),routeId='archive:t2:object',group=document.querySelector(`[data-road-group="${routeId}"]`);
    const masks=[...document.querySelectorAll(`[data-growth-mask="${routeId}"]`)].map(el=>({offset:getComputedStyle(el).strokeDashoffset,animation:getComputedStyle(el).animation}));
    const visual=[...(group?.querySelectorAll('.map-road,.road-clearance')||[])].map(el=>{const ancestors=[];for(let p=el.parentElement;p&&p!==group;p=p.parentElement)if(p.hasAttribute('mask'))ancestors.push(p.getAttribute('mask'));return {type:el.classList.contains('road-clearance')?'underlay':'road',marker:el.getAttribute('marker-end'),ancestors};});
    return {label,phase:snapshot.phase,route:snapshot.layout.routes.find(r=>r.id===routeId),timing:snapshot.transition?.routes[routeId],masks,visual,
      oldJointOpacity:[...document.querySelectorAll('[data-junction]')].map(el=>({id:el.getAttribute('data-junction'),opacity:getComputedStyle(el).opacity})),
      correspondenceLabels:[...document.querySelectorAll(`[data-road-label="${routeId}"]`)].map(el=>({text:el.textContent,opacity:getComputedStyle(el).opacity})),
      oldPhotoOpacity:getComputedStyle(document.querySelector('[data-map-node="obs.phase.t1"]')).opacity,
      nodeDelays:snapshot.transition?.nodeDelays,camera:snapshot.camera};
  },label);
}
try{
  await page.goto(pathToFileURL(html).href);await page.waitForFunction(()=>window.hifiSnapshot&&window.hifiMapSnapshot);
  for(const id of ['A.OBSERVE.WHOLE','A.OBSERVE.BASE','A.LOCATE.HISTORIC_IMAGE','A.VERIFY.OBJECT_CONTINUITY','A.RESEARCH.ACCIDENT','A.RELATE.ARCHIVE.T2_TO_OBJECT'])await action(id);
  report.before=await map();
  const g=(await read()).graph,canonical=layoutMap(g);report.domMeasurementsPreserveRoutes=JSON.stringify(canonical.routes.map(r=>[r.id,r.d]))===JSON.stringify(report.before.layout.routes.map(r=>[r.id,r.d]));
  if(hitOnly){
    report.hitChecks=[];
    for(const fraction of [.25,.75]){
      const p=await page.evaluate(fraction=>{
        const path=document.querySelector('[data-route="archive:t2:object"]'),q=path.getPointAtLength(path.getTotalLength()*fraction),matrix=path.getScreenCTM(),point=new DOMPoint(q.x,q.y).matrixTransform(matrix),target=document.elementFromPoint(point.x,point.y),view=document.querySelector('.map-viewport').getBoundingClientRect();
        return {x:point.x,y:point.y,inside:point.x>view.left&&point.x<view.right&&point.y>view.top&&point.y<view.bottom,hitClass:target?.getAttribute('class'),hitMask:target?.getAttribute('mask'),frontier:target?.closest('[data-frontier-group]')?.getAttribute('data-frontier-group')};
      },fraction);
      if(p.inside)await page.mouse.click(p.x,p.y);
      report.hitChecks.push({fraction,...p,selected:(await read()).selection});
    }
  }else{
  await page.getByRole('button',{name:'设置',exact:true}).click();await page.locator('.setting-row input[type="checkbox"]').uncheck();await page.emulateMedia({reducedMotion:'no-preference'});await page.keyboard.press('Escape');
  await action('A.CORROBORATE.ARCHIVE.T2_CURRENT');
  await page.waitForTimeout(120);report.samples.push(await sample('flight-120ms'));
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect',null,{timeout:6000});
  const started=Date.now();await page.waitForTimeout(500);report.samples.push(await sample('connect-500ms'));
  await page.waitForTimeout(Math.max(0,900-(Date.now()-started)));report.samples.push(await sample('connect-900ms'));
  await page.screenshot({path:resolve(here,'archive-enhancement-900ms.png'),fullPage:true});
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='idle',null,{timeout:12000});report.after=await map();
  report.finalSession=(await read()).session.log.map(l=>({actionId:l.actionId,observationId:l.observationId}));
  await page.screenshot({path:resolve(here,'archive-enhancement-settled.png'),fullPage:true});
  }
}catch(e){report.failure=e.stack;try{report.buttons=await page.getByRole('button').allTextContents();await page.screenshot({path:resolve(here,'failure.png'),fullPage:true});}catch{}}
finally{const output=resolve(here,hitOnly?(process.argv.includes('--pointer')?'hit-final-pointer.json':process.argv.includes('--final')?'hit-final.json':'hit-audit.json'):'audit.json');writeFileSync(output,JSON.stringify(report,null,2),'utf8');await browser.close();console.log(JSON.stringify({output,htmlSha256:report.htmlSha256,failure:report.failure,hitChecks:report.hitChecks,samples:report.samples.map(s=>({label:s.label,phase:s.phase,masks:s.masks,joints:s.oldJointOpacity,labels:s.correspondenceLabels})),errors:report.errors},null,2));}
