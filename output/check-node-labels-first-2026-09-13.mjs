// Read-only UI diagnosis requested by the user. No product files are changed.
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {engine} from '../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/engine.ts';
import {ACTIONS} from '../docs/project/evidence/v3-design/validation/workbench-map-fusion-v0/local-case.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const dir=resolve('output/playwright/node-label-repair-first-2026-09-13');await mkdir(dir,{recursive:true});
const actions=new Map(ACTIONS.map(a=>[a.id,a])),s=engine.newSession(),order=[];
while(s.log.length<22){const rows=engine.workbench(s).filter(r=>r.usable&&!r.done);const r=rows.find(r=>r.action.id!=='A.MAP.REGION_CONTINUITY')||rows[0];if(!r)break;const basis=r.comparisonOptions?.find(x=>x.id==='photo'&&x.usable)?.id||r.comparisonOptions?.find(x=>x.usable)?.id;engine.take(s,r.action.id,basis?{comparisonBasis:basis}:{});order.push([r.action.id,basis]);}
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(pathToFileURL(resolve('docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html')).href+'?lang=zh');
 await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady&&window.hifiSnapshot().visibleBody.includes('OBJ_R'));
 for(const [id,basis]of order){const count=await page.evaluate(()=>window.hifiSnapshot().session.log.length),place=actions.get(id).place;
  if(['OBJ_W','OBJ_F','OBJ_D','OBJ_R','SURF'].includes(place)){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');await page.waitForFunction(p=>window.hifiSnapshot().visibleBody.includes(p),place);await page.locator(`.bowl-target-list [data-bowl-target="${place}"]`).click();}
  else await page.locator(`[data-place="${place}"]`).click();
  const row=page.locator(`[data-action-row="${id}"]`);if(basis)await row.locator(`input[value="${basis}"]`).check();await row.locator('[data-action]').click();await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n&&!window.hifiSnapshot().computeBusy,count+1);
 }
 await page.keyboard.press('Escape');await page.locator('.map-fit').click();
 const report=await page.evaluate(()=>{
  const l=window.hifiMapSnapshot().layout;
  return {steps:window.hifiSnapshot().session.log.length,remoteLabelIds:l.diagnostics.remoteLabelIds,
   nodes:l.nodes.filter(n=>!n.box).map(n=>{const box=n.labelBounds;return{id:n.id,title:n.title,lines:n.lines,x:n.x,y:n.y,label:box,separation:Math.hypot(Math.max(box.x-n.x,0,n.x-box.x-box.width),Math.max(box.y-n.y,0,n.y-box.y-box.height))};}),
   markers:[...document.querySelectorAll('[data-report-marker]')].map(e=>({id:e.dataset.reportMarker,title:e.title,glyphWidth:getComputedStyle(e.querySelector('i')).width,hasSeparateLabel:!!document.querySelector(`[data-map-label="${e.dataset.reportMarker}"]`)})),
   mainGlyphWidth:getComputedStyle(document.querySelector('[data-map-node] i')).width,
   quietRoad:document.querySelector('.map-road.is-quiet')?getComputedStyle(document.querySelector('.map-road.is-quiet')).opacity:null};
 });
 await page.screenshot({path:resolve(dir,'all-22-overview.png')});
 report.errors=errors;await writeFile(resolve(dir,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({steps:report.steps,remote:report.remoteLabelIds,largest:report.nodes.sort((a,b)=>b.separation-a.separation).slice(0,4),markers:report.markers,mainGlyphWidth:report.mainGlyphWidth,errors},null,2));
}finally{await browser.close();}
