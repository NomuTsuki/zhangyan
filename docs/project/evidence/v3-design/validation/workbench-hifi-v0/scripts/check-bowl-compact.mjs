// review required: focused short-stage and zoom coverage; no game state writes.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const hifi=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),tag=process.argv.find(s=>s.startsWith('--tag='))?.slice(6)||'compact';
const out=path.join(hifi,'verification-bowl-2026-09-10',tag);fs.mkdirSync(out,{recursive:true});
const {chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),report={review:'review required',states:[],errors:[],failures:[]};
for(const width of [1280,1440,1920]){
 const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>report.errors.push(String(e)));await page.goto('http://127.0.0.1:4260/scripts/bowl-preview.html?height=430');await page.locator('.bowl-webgl').waitFor();await page.waitForTimeout(600);
 for(const phase of ['initial','close','bottom','related']){
  const canvas=page.locator('.bowl-webgl');
  if(phase==='close'){for(let i=0;i<6;i++)await page.locator('[aria-label="拉近器物"]').click();}
  if(phase==='bottom'){await canvas.focus();for(let i=0;i<8;i++)await page.keyboard.press('ArrowUp');}
  if(phase==='related')await page.locator('[data-related]').click();
  await page.waitForTimeout(600);
  const state=await page.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};return{stage:box(document.querySelector('.bowl-stage')),visible:JSON.parse(document.querySelector('[data-visible]').textContent),hotspots:[...document.querySelectorAll('.bowl-hotspot')].map(e=>({id:e.dataset.bowlTarget,...box(e)})),labels:[...document.querySelectorAll('.bowl-callout')].map(e=>({id:e.dataset.bowlTarget,...box(e)}))};});
  report.states.push({width,phase,...state});const fail=why=>report.failures.push({width,phase,why});
  if(state.hotspots.length!==state.labels.length)fail('visible hotspot missing outside label');
  if(state.labels.some(l=>l.x<state.stage.x||l.y<state.stage.y||l.x+l.w>state.stage.x+state.stage.w||l.y+l.h>state.stage.y+state.stage.h))fail('label outside stage');
  for(let i=0;i<state.labels.length;i++)for(let j=i+1;j<state.labels.length;j++){const a=state.labels[i],b=state.labels[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)fail('label overlap');}
  if(phase==='related'){const before=report.states.at(-2);if(JSON.stringify(state.visible)!==JSON.stringify(before.visible)||JSON.stringify(state.labels)!==JSON.stringify(before.labels))fail('related state changed visibility/layout');}
  await page.locator('.bowl-scene').screenshot({path:path.join(out,`${width}-${phase}.png`)});
 }
 await page.close();
}
await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,errors:report.errors,failures:report.failures,states:report.states.map(s=>({width:s.width,phase:s.phase,height:s.stage.h,labels:s.labels.length,hotspots:s.hotspots.length}))},null,2));process.exitCode=report.errors.length||report.failures.length?1:0;
