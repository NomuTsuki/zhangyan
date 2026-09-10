/* review required: screenshot audit distinct from non-capture performance runs. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,start,prepare,take,idle,motion,A,out,sha256} from './common.mjs';
const dest=resolve(out,'timing-capture');await mkdir(dest,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const report={reviewRequired:true,sha256,shots:[],errors:[]};
let page;
async function capture(name){const before=await page.evaluate(()=>{const v=document.querySelector('.map-viewport').getBoundingClientRect(),read=el=>{const r=el.getBoundingClientRect();return {id:el.dataset.mapNode||el.dataset.mapFrontier,opacity:getComputedStyle(el).opacity,intersectsViewport:r.right>v.left&&r.left<v.right&&r.bottom>v.top&&r.top<v.bottom};};return {phase:document.querySelector('.map-component').dataset.phase,flight:!!document.querySelector('.investigation-flight'),elapsed:performance.now()-window.__clickAt,nodes:[...document.querySelectorAll('[data-map-node]')].map(read),frontiers:[...document.querySelectorAll('[data-map-frontier]')].map(read)};});await page.screenshot({path:resolve(dest,name+'.png')});report.shots.push({name,...before});}
async function click(id){const b=await prepare(page,id);await page.evaluate(()=>{document.addEventListener('click',e=>{if(e.target.closest('[data-action]'))window.__clickAt=performance.now();},{once:true,capture:true});});await b.click();}
try{
page=await start(browser);await click(A.X);await page.waitForTimeout(500);await capture('01-first-xray-before-arrival');await idle(page);await capture('02-first-xray-settled');report.errors.push(...page.errors);await page.close();
page=await start(browser,{reduced:true});for(const id of [A.W,A.B,A.P,A.X])await take(page,id);await motion(page,false);await click(A.C);await page.waitForTimeout(450);await capture('03-continuity-before-arrival');await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='connect');await page.waitForTimeout(600);await capture('04-continuity-connecting');await idle(page);await capture('05-continuity-settled');report.errors.push(...page.errors);
}catch(e){report.error=e.stack;}finally{await browser.close();await writeFile(resolve(dest,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
