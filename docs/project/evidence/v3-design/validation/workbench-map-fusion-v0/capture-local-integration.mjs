// Local portfolio evidence capture; no product-state injection or image editing.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, writeFile, readFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ACTION_BY_ID } from './local-case.mjs';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../../../../..');
const out=resolve(root,'docs/portfolio/2026-09-08-fusion-local-integration');await mkdir(out,{recursive:true});
const relative='docs/project/evidence/v3-design/validation/workbench-map-fusion-v0/prototype.html';
const baseline=execFileSync('git',['show','14f9bee:'+relative],{cwd:root});
const current=await readFile(resolve(here,'prototype.html'));
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.url==='/before'?baseline:current);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
const pw=createRequire(import.meta.url)(process.argv[2]||'playwright');const browser=await pw.chromium.launch({headless:true,channel:'msedge'});
const ctx=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2});const page=await ctx.newPage();
const A={xray:'A.IMAGE.XRAY',photo:'A.LOCATE.HISTORIC_IMAGE',base:'A.OBSERVE.BASE',verify:'A.VERIFY.OBJECT_CONTINUITY',whole:'A.OBSERVE.WHOLE'};
async function act(page,id){await page.locator('.bench [data-kind="place"][data-id="'+ACTION_BY_ID.get(id).place+'"]').click();await page.locator('#action-pop [data-take="'+id+'"]').click();}
async function shot(name){await page.locator('#clear-selection').click();await page.mouse.move(1,1);await page.waitForFunction(()=>window.fusionSnapshot().transient===null);await page.screenshot({path:resolve(out,name+'.png')});}
try{
 await page.goto(url+'/before');for(const id of[A.xray,A.photo,A.base])await act(page,id);await shot('2026-09-08-before-shared-question-2x');
 await page.goto(url+'/after');for(const id of[A.xray,A.photo,A.base])await act(page,id);await shot('2026-09-08-after-two-material-gap-2x');
 await act(page,A.verify);await shot('2026-09-08-after-photo-history-2x');
 await page.setViewportSize({width:1920,height:1000});await page.goto(url+'/after');
 for(const id of[A.whole,A.base,A.photo,A.verify,'A.RESEARCH.ACCIDENT','A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT','A.CORROBORATE.ARCHIVE.T3_CURRENT','A.ANALYZE.MATERIAL.SUBSTRATE','A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.INSPECT.WINDOWS','A.SYNTHESIZE.SURFACE_REGIONS','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'])await act(page,id);
 await shot('2026-09-08-full-fusion-2x');
 const videoCtx=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out,size:{width:1440,height:1000}}});const videoPage=await videoCtx.newPage();
 await videoPage.goto(url+'/after');await videoPage.waitForTimeout(1800);await act(videoPage,A.xray);await videoPage.waitForTimeout(2200);await act(videoPage,A.photo);await videoPage.waitForTimeout(2500);await act(videoPage,A.base);await videoPage.waitForTimeout(2400);await videoPage.locator('#node-controls [data-id="question:photo-object"]').click();await videoPage.waitForTimeout(2600);await act(videoPage,A.verify);await videoPage.waitForTimeout(3000);await videoPage.locator('#clear-selection').click();await videoPage.mouse.move(1,1);await videoPage.waitForTimeout(2000);
 const video=videoPage.video();await videoCtx.close();await rename(await video.path(),resolve(out,'2026-09-08-photo-road-connection.webm'));
 await writeFile(resolve(out,'capture-manifest.json'),JSON.stringify({baselineCommit:'14f9bee',beforeHtmlSha256:createHash('sha256').update(baseline).digest('hex'),afterHtmlSha256:createHash('sha256').update(current).digest('hex'),viewportPair:{width:1440,height:1000,deviceScaleFactor:2},hero:{width:1920,height:1000,deviceScaleFactor:2},video:{width:1440,height:1000},method:'Native Edge screenshots and real pointer actions; no image editing; baseline served from git blob without checkout changes.'},null,2)+'\n');
 console.log('Captured before/after pair, connected local state, full-map hero and motion clip.');
}finally{await ctx.close();await browser.close();server.close();}
