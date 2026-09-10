/* review required. Baseline telemetry only: no rendering/state/animation mutation. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,start,prepare,take,idle,motion,A,mainRoute,remaining,out,sha256} from './common.mjs';
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)||'baseline';
const profile=process.argv.includes('--profile');
const dest=resolve(out,tag);await mkdir(dest,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={reviewRequired:true,sha256,tag,profile,headless:true,viewport:[1440,1000],generatedAt:new Date().toISOString(),scenarios:[]};
let page;
async function install(){await page.evaluate(()=>{
 window.__audit={active:false};
 new PerformanceObserver(list=>{if(window.__audit.active)for(const e of list.getEntries())window.__audit.longtasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:false});
 document.addEventListener('click',e=>{if(window.__audit.active&&e.target.closest('[data-action]'))window.__audit.click=performance.now();},true);
 let last=0,lastPhase='',lastSample=0;
 const frame=now=>{const a=window.__audit;if(a.active){if(last)a.frames.push({t:now,dt:now-last});const phase=document.querySelector('.map-component')?.dataset.phase;if(phase!==lastPhase){a.phases.push({t:performance.now(),phase});lastPhase=phase;}
 if(a.visibility&&now-lastSample>110){lastSample=now;const read=el=>({id:el.dataset.mapNode||el.dataset.mapFrontier||el.dataset.frontierGroup,opacity:getComputedStyle(el).opacity,display:getComputedStyle(el).display,box:(()=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})(),text:el.innerText||''});a.visual.push({t:performance.now(),phase,flight:!!document.querySelector('.investigation-flight'),nodes:[...document.querySelectorAll('[data-map-node]')].map(read),frontiers:[...document.querySelectorAll('[data-map-frontier]')].map(read),roads:[...document.querySelectorAll('[data-frontier-group]')].map(read)});}
 last=now;}else{last=0;lastPhase='';lastSample=0;}requestAnimationFrame(frame);};requestAnimationFrame(frame);
 });}
function stats(a){const origin=a.click||a.started,frames=a.frames.filter(f=>f.t>=origin&&f.t<=a.ended).map(f=>f.dt).sort((x,y)=>x-y);const tasks=a.longtasks.filter(t=>t.start+t.duration>=origin);return{clickToIdleMs:a.ended-origin,firstFlyMs:(a.phases.find(p=>p.phase==='fly')?.t||origin)-origin,frames:frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],max:frames.at(-1),over50:frames.filter(x=>x>50).length,over100:frames.filter(x=>x>100).length,longTaskCount:tasks.length,longTaskTotal:tasks.reduce((n,x)=>n+x.duration,0),maxLongTask:Math.max(0,...tasks.map(x=>x.duration)),phases:a.phases.map(p=>({phase:p.phase,ms:p.t-origin}))};}
async function measure(name,id,{visibility=false,basis}={}){const button=await prepare(page,id,basis);await page.waitForTimeout(200);let cdp;if(profile){cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 await page.evaluate(visibility=>{window.__audit={active:true,visibility,frames:[],longtasks:[],visual:[],phases:[],started:performance.now()};},visibility);
 const wall=performance.now();await button.click();await page.waitForFunction(id=>window.hifiSnapshot().session.log.at(-1)?.actionId===id,id);await idle(page);await page.waitForTimeout(100);const a=await page.evaluate(()=>{window.__audit.ended=performance.now();window.__audit.active=false;return window.__audit;});
 if(cdp){const p=await cdp.send('Profiler.stop');await writeFile(resolve(dest,name+'.cpuprofile'),JSON.stringify(p.profile));await cdp.detach();}
 const state=await page.evaluate(()=>({session:window.hifiSnapshot().session,map:window.hifiMapSnapshot()}));const result={name,id,wallMs:performance.now()-wall,stats:stats(a),sessionLength:state.session.log.length,errors:[...page.errors],geometry:{nodes:state.map.layout.nodes.length,routes:state.map.layout.routes.length,frontiers:state.map.layout.frontiers.length}};await writeFile(resolve(dest,name+'-raw.json'),JSON.stringify(a,null,2));report.scenarios.push(result);console.log(JSON.stringify(result));await writeFile(resolve(dest,'report.json'),JSON.stringify(report,null,2));}
try{
 page=await start(browser);await install();await measure('01-first-xray',A.X,{visibility:!profile});await measure('02-photo-after-xray',A.P,{visibility:!profile});await page.close();
 page=await start(browser,{reduced:true});await install();for(const id of [A.W,A.B,A.P,A.X])await take(page,id);await motion(page,false);await measure('03-continuity-four-known',A.C,{visibility:!profile});await page.close();
 page=await start(browser,{reduced:true});await install();for(const id of mainRoute.slice(0,16))await take(page,id);await motion(page,false);await measure('04-seventeenth-provenance',mainRoute[16],{visibility:false});
 for(const id of remaining.slice(0,4)){await motion(page,true);await take(page,id);}await motion(page,false);await measure('05-twentysecond-comparison',A.D,{basis:'archive'});
 await page.getByRole('button',{name:'全览',exact:true}).click();await page.waitForTimeout(500);
 await page.evaluate(()=>{window.__audit={active:true,visibility:false,frames:[],longtasks:[],visual:[],phases:[],started:performance.now()};});
 const v=await page.locator('.map-viewport').boundingBox();await page.mouse.move(v.x+v.width*.8,v.y+v.height*.4);await page.mouse.down();await page.mouse.move(v.x+v.width*.5,v.y+v.height*.55,{steps:30});await page.mouse.move(v.x+v.width*.8,v.y+v.height*.4,{steps:30});await page.mouse.up();for(let i=0;i<6;i++)await page.getByRole('button',{name:i%2?'缩小地图':'放大地图',exact:true}).click();
 await page.waitForTimeout(500);const drag=await page.evaluate(()=>{window.__audit.active=false;window.__audit.ended=performance.now();return window.__audit;});await writeFile(resolve(dest,'06-dense-interaction-raw.json'),JSON.stringify(drag,null,2));report.scenarios.push({name:'06-dense-interaction',stats:stats(drag),errors:page.errors});
}catch(e){report.error=e.stack;console.log(e.stack);}finally{await browser.close();await writeFile(resolve(dest,'report.json'),JSON.stringify(report,null,2));}
