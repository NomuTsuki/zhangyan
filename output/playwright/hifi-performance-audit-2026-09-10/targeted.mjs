/* review required. Read-only native UI reproduction, no product edits. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,start,prepare,take,idle,motion,A,mainRoute,out,sha256} from './common.mjs';
const dev=process.argv.includes('--dev'),dest=resolve(out,dev?'targeted-dev':'targeted-offline');await mkdir(dest,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const report={reviewRequired:true,sha256,dev,generatedAt:new Date().toISOString(),results:[]};
let page;
try{
page=await start(browser,{reduced:true,...(dev?{url:'http://127.0.0.1:4260/'}:{})});
for(const id of mainRoute.slice(0,16))await take(page,id);
await motion(page,false);const button=await prepare(page,mainRoute[16]);
const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
await button.click();await idle(page);const prof=await cdp.send('Profiler.stop');await writeFile(resolve(dest,'provenance.cpuprofile'),JSON.stringify(prof.profile));
const snapshot=await page.evaluate(()=>({state:window.hifiSnapshot(),map:window.hifiMapSnapshot(),measurements:Object.fromEntries([...document.querySelectorAll('[data-map-label]')].map(el=>[el.dataset.mapLabel,{width:el.offsetWidth,height:el.offsetHeight}]))}));await writeFile(resolve(dest,'state-17.json'),JSON.stringify(snapshot));
report.results.push({case:'native-17-provenance',errors:page.errors,log:snapshot.state.session.log.length});
// Interrupt long road drawing with new investigation, history and restart.
await page.getByRole('button',{name:/^调查记录/}).click();await page.locator('.history-list button').nth(15).click();await page.locator('.history-banner button').click();
await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:'重开',exact:true}).click();await page.getByRole('button',{name:'重新开始',exact:true}).click();
await take(page,A.X);await take(page,A.P);await take(page,A.W);await take(page,A.B);await take(page,A.C);await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='connect');
const t=performance.now();await page.getByRole('button',{name:'设置',exact:true}).click();const latency=performance.now()-t;await page.getByRole('button',{name:'重开',exact:true}).click();await page.getByRole('button',{name:'重新开始',exact:true}).click();await page.waitForTimeout(5200);
report.results.push({case:'overlapping-investigations-then-restart-during-connection',settingsClickMs:latency,log:await page.evaluate(()=>window.hifiSnapshot().session.log.length),phase:await page.locator('.map-component').getAttribute('data-phase'),errors:page.errors});
}catch(e){report.error=e.stack;}finally{await browser.close();await writeFile(resolve(dest,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
