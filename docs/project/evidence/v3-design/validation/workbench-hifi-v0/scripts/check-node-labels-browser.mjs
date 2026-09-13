// Presentation regression: review required. Uses real controls and rendered
// bounds; the frozen solver is used only to choose a legal 22-enquiry route.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {engine} from '../src/engine.ts';
import {ACTIONS} from '../../workbench-map-fusion-v0/local-case.mjs';
const base=fileURLToPath(new URL('../',import.meta.url));
const root=resolve(base,'../../../../../..');
const baseline=process.argv.includes('--baseline');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)||'final';
const prefix=baseline?(tag==='final'?'before':`before-${tag}`):tag;
const deviceScaleFactor=Number(process.argv.find(a=>a.startsWith('--dpr='))?.slice(6)||1);
const out=resolve(root,'output/playwright/node-label-repair-2026-09-13');
await mkdir(out,{recursive:true});
const artifact=baseline?resolve(out,'before-prototype.html'):resolve(base,'prototype.html');
const sha=createHash('sha256').update(await readFile(artifact)).digest('hex');
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const actions=new Map(ACTIONS.map(a=>[a.id,a])),session=engine.newSession(),order=[];
while(session.log.length<22){
 const rows=engine.workbench(session).filter(r=>r.usable&&!r.done);
 const row=rows.find(r=>r.action.id!=='A.MAP.REGION_CONTINUITY')||rows[0];
 if(!row)throw Error('The 22-enquiry route stalled');
 const basis=row.comparisonOptions?.find(x=>x.id==='photo'&&x.usable)?.id||row.comparisonOptions?.find(x=>x.usable)?.id;
 engine.take(session,row.action.id,basis?{comparisonBasis:basis}:{});order.push([row.action.id,basis]);
}
const results=[],errors=[],snapshots=[],checks=[];
const check=(name,pass,details)=>checks.push({name,pass:!!pass,details});
async function inspect(page,language,width,step){
 const result=await page.evaluate(()=>{
  const l=window.hifiMapSnapshot().layout,camera=window.hifiMapSnapshot().camera;
  const world=document.querySelector('.map-world').getBoundingClientRect();
  const byId=new Map([...l.nodes,...l.roadLabels,...l.frontiers].map(n=>[n.id,n]));
  const rects=[...document.querySelectorAll('[data-map-label]')].map(e=>{
   const r=e.getBoundingClientRect(),n=byId.get(e.dataset.mapLabel);
   const box={x:(r.x-world.x)/camera.s,y:(r.y-world.y)/camera.s,width:r.width/camera.s,height:r.height/camera.s};
   return{id:n.id,text:e.innerText,reportId:e.dataset.reportLabel,anchor:{x:n.x,y:n.y},box,
    distance:Math.hypot(Math.max(box.x-n.x,0,n.x-box.x-box.width),Math.max(box.y-n.y,0,n.y-box.y-box.height)),
    overflow:e.scrollWidth>e.offsetWidth+1||e.scrollHeight>e.offsetHeight+1};
  });
  const overlap=(a,b)=>a.x<b.x+b.width-.1&&a.x+a.width>b.x+.1&&a.y<b.y+b.height-.1&&a.y+a.height>b.y+.1;
  const labelOverlaps=rects.flatMap((r,i)=>rects.slice(i+1).filter(q=>overlap(r.box,q.box)).map(q=>[r.id,q.id]));
  // Independently sample the rendered SVG curves, rather than trusting the
  // layout solver's own collision report or its internal spatial buckets.
  const roadTextCollisions=[];
  for(const path of document.querySelectorAll('path.map-road,path.frontier-road')){
   const length=path.getTotalLength();
   const masks=[];
   for(let el=path;el&&el.tagName!=='svg';el=el.parentElement){
    const id=el.getAttribute('mask')?.match(/#([^)]*)/)?.[1];
    if(id)masks.push([...document.getElementById(id).querySelectorAll('path')].map(p=>{
     const from=-parseFloat(p.getAttribute('stroke-dashoffset')||'0');
     return{from,to:from+parseFloat(p.getAttribute('stroke-dasharray')||'1')};
    }));
   }
   for(let t=0;t<=length;t+=3){const p=path.getPointAtLength(t);
    // A frontier stores the entire future curve under a partial SVG mask.
    // Hidden future portions cannot collide with visible question text.
    if(!masks.every(parts=>parts.some(part=>t/length>=part.from&&t/length<=part.to)))continue;
    const hit=rects.find(r=>p.x>r.box.x&&p.x<r.box.x+r.box.width&&p.y>r.box.y&&p.y<r.box.y+r.box.height);
    if(hit){roadTextCollisions.push(hit.id);break;}
   }
  }
  const markers=[...document.querySelectorAll('[data-report-marker]')].map(e=>({id:e.dataset.reportMarker,
   size:parseFloat(getComputedStyle(e.querySelector('i')).width),named:rects.some(r=>r.reportId===e.dataset.reportMarker)}));
  return{rects,labelOverlaps,roadTextCollisions,markers,diagnostics:l.diagnostics,geometry:{nodes:l.nodes.map(n=>[n.id,n.x,n.y]),routes:l.routes.map(r=>[r.id,r.d])},
   bodyText:document.querySelector('.map-component').innerText,session:JSON.stringify(window.hifiSnapshot().session)};
 });
 snapshots.push({language,width,step,...result});
 const ordinary=new Set(await page.evaluate(()=>window.hifiMapSnapshot().layout.nodes.filter(n=>!n.box).map(n=>n.id)));
 const remote=result.rects.filter(r=>(ordinary.has(r.id)||r.reportId)&&r.distance>100.1);
 check(`${language}/${width}/${step}: nearby information names`,!remote.length,remote);
 check(`${language}/${width}/${step}: no label overlap or overflow`,!result.labelOverlaps.length&&!result.rects.some(r=>r.overflow),{overlap:result.labelOverlaps,overflow:result.rects.filter(r=>r.overflow)});
 check(`${language}/${width}/${step}: actual SVG roads avoid text`,!result.roadTextCollisions.length,result.roadTextCollisions);
 check(`${language}/${width}/${step}: reports have visible names`,result.markers.every(m=>m.named),result.markers);
 if(language==='en')check(`${language}/${width}/${step}: no Chinese map copy`,!/[\u3400-\u9fff]/u.test(result.bodyText));
 return result;
}
async function frameUpperMap(page){
 await page.locator('.map-fit').click();
 while(await page.evaluate(()=>window.hifiMapSnapshot().camera.s)>.201)await page.locator('.map-tools button').nth(0).click();
 while(await page.evaluate(()=>window.hifiMapSnapshot().camera.s)<.69)await page.locator('.map-tools button').nth(1).click();
 const c=await page.evaluate(()=>window.hifiMapSnapshot().camera),v=await page.locator('.map-viewport').boundingBox();
 await page.mouse.move(v.x+5,v.y+5);await page.mouse.down();
 await page.mouse.move(v.x+5+24-c.x,v.y+5+16-c.y,{steps:8});await page.mouse.up();
}
try{
 for(const language of ['zh','en']){
  const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(artifact).href+`?lang=${language}`);
  await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady&&window.hifiSnapshot().visibleBody.includes('OBJ_R'));
  const initial=await page.evaluate(()=>({steps:window.hifiSnapshot().session.log.length,nodes:window.hifiMapSnapshot().layout.nodes.length}));
  check(`${language}: empty map has no premature label`,initial.steps===0&&initial.nodes===0,initial);
  for(const [index,[id,basis]] of order.entries()){
   const place=actions.get(id).place,start=Date.now();
   if(['OBJ_W','OBJ_F','OBJ_D','OBJ_R','SURF'].includes(place)){
    await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');
    if(place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');
    await page.waitForFunction(p=>window.hifiSnapshot().visibleBody.includes(p),place);
    await page.locator(`.bowl-target-list [data-bowl-target="${place}"]`).click();
   }else await page.locator(`[data-place="${place}"]`).click();
   const row=page.locator(`[data-action-row="${id}"]`);if(basis)await row.locator(`input[value="${basis}"]`).check();
   await row.locator('[data-action]').click();
   await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n&&!window.hifiSnapshot().computeBusy,index+1);
   results.push({language,step:index+1,id,elapsedMs:Date.now()-start});
   if([1,8,16,22].includes(index+1)){
    await page.keyboard.press('Escape');
    for(const width of [1280,1440,1920]){await page.setViewportSize({width,height:1080});await inspect(page,language,width,index+1);}
   }
  }
  await frameUpperMap(page);
  await page.locator('[data-map-node="obs.current.base"]').click();
  await page.locator('.map-legend-toggle').click();
  await page.screenshot({path:resolve(out,`${prefix}-${language}-upper-map.png`)});
  const glyph=await page.evaluate(()=>{
   const a=document.querySelector('.legend-information-icon i'),b=document.querySelector('[data-map-node] i');
   const style=e=>e?[getComputedStyle(e).width,getComputedStyle(e).borderWidth,getComputedStyle(e,'::after').backgroundColor]:null;
   return{legend:style(a),node:style(b),quiet:getComputedStyle(document.querySelector('.map-road.is-quiet')).opacity,
    support:getComputedStyle(document.querySelector('.map-road.support-road')).stroke,
    correspondence:getComputedStyle(document.querySelector('.map-road.correspondence-road')).stroke};
  });
  check(`${language}: legend matches actual information glyph`,glyph.legend&&JSON.stringify(glyph.legend)===JSON.stringify(glyph.node),glyph);
  const last=snapshots.at(-1);check(`${language}: report glyph closer in size`,last.markers.every(m=>m.size===17),last.markers);
  await page.locator('.map-legend-toggle').click();await page.keyboard.press('Escape');await page.locator('.map-fit').click();
  const before=await page.evaluate(()=>JSON.stringify(window.hifiSnapshot().session));
  for(const marker of last.markers){
   const label=page.locator(`[data-report-label="${marker.id}"]`);if(!await label.count())continue;
   await label.hover();
   check(`${language}: ${marker.id} hover links glyph and road`,await page.evaluate(id=>document.querySelector(`[data-report-marker="${id}"]`).classList.contains('is-related')&&!!document.querySelector('.map-road.is-related'),marker.id));
   await label.click();
   check(`${language}: ${marker.id} selects original evidence`,await page.evaluate(id=>window.hifiSnapshot().selection?.kind==='evidence'&&window.hifiSnapshot().selection.id===id,marker.id));
   await page.keyboard.press('Escape');await page.mouse.move(2,2);
  }
  check(`${language}: selections do not consume enquiries`,before===await page.evaluate(()=>JSON.stringify(window.hifiSnapshot().session)));
  await page.screenshot({path:resolve(out,`${prefix}-${language}-overview.png`)});
  await context.close();
 }
 check('no browser errors',errors.length===0,errors);
 const previousFile=resolve(out,'before-results.json');
 if(!baseline){
  const previous=JSON.parse(await readFile(previousFile,'utf8'));
  check('fixed glyphs and roads match the pre-change build at every sampled state',snapshots.every(s=>JSON.stringify(s.geometry)===JSON.stringify(previous.snapshots.find(p=>p.language===s.language&&p.width===s.width&&p.step===s.step)?.geometry)));
 }
}catch(error){checks.push({name:'browser execution',pass:false,details:error.stack});}
finally{await browser.close();}
const report={artifact,sha,baseline,deviceScaleFactor,order,checks,snapshots,results,errors};
await writeFile(resolve(out,`${prefix}-results.json`),JSON.stringify(report,null,2));
console.log(JSON.stringify({sha,checks:checks.length,failed:checks.filter(c=>!c.pass),slowestActionMs:Math.max(0,...results.map(r=>r.elapsedMs))},null,2));
if(checks.some(c=>!c.pass))process.exitCode=1;
