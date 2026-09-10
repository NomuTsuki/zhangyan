/* review required: each cost is the first visit to that factor combination in a fresh page. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,start,prepare,mainRoute,remaining,out,sha256,A} from './common.mjs';
const dest=resolve(out,'cold-route-browser');await mkdir(dest,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
const report={reviewRequired:true,sha256,reducedMotion:true,viewport:[1440,1000],generatedAt:new Date().toISOString(),steps:[]};let page;
try{page=await start(browser,{reduced:true});await page.evaluate(()=>{
 window.__cold={longtasks:[],clicked:0,firstFrame:0};new PerformanceObserver(list=>window.__cold.longtasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask'});
 document.addEventListener('click',e=>{if(e.target.closest('[data-action]')){window.__cold.clicked=performance.now();window.__cold.firstFrame=0;requestAnimationFrame(()=>window.__cold.firstFrame=performance.now());}},true);
});for(const id of [...mainRoute,...remaining]){const b=await prepare(page,id,id===A.D?'archive':undefined);await page.waitForTimeout(100);await b.click();await page.waitForFunction(()=>window.__cold.firstFrame>window.__cold.clicked);await page.waitForTimeout(70);const row=await page.evaluate(()=>{const a=window.__cold;return{firstFrameMs:a.firstFrame-a.clicked,longtasks:a.longtasks.filter(t=>t.start+t.duration>a.clicked),count:+document.querySelector('.record-count').textContent};});report.steps.push({id,...row});await writeFile(resolve(dest,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.steps.at(-1)));}report.errors=page.errors;}catch(e){report.error=e.stack;}finally{await browser.close();await writeFile(resolve(dest,'report.json'),JSON.stringify(report,null,2));}
