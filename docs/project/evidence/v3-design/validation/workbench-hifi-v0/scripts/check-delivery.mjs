/* review required: local stage-entry and artifact provenance checks. */
import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir,readdir,copyFile } from 'node:fs/promises';
import { resolve,dirname,extname } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(base,'../../../../../..'),out=resolve(root,'output/playwright/closeout-2026-09-12/delivery');await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const stamp=JSON.parse(await readFile(resolve(base,'build-stamp.json'),'utf8')),html=await readFile(resolve(base,'prototype.html'));
assert.equal(html.length,stamp.bytes);assert.equal(sha(html),stamp.sha256);
const assets=resolve(root,'docs/portfolio/2026-09-12-v3-closeout');
const inventory=[];for(const name of await readdir(assets)){if(!['.png','.mp4'].includes(extname(name)))continue;const bytes=await readFile(resolve(assets,name));let dimensions;
 if(name.endsWith('.png'))dimensions={width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 else dimensions=JSON.parse(execFileSync('D:/anaconda/Library/bin/ffprobe.exe',['-v','error','-show_entries','format=duration:stream=width,height,r_frame_rate','-of','json',resolve(assets,name)],{encoding:'utf8'}));
 inventory.push({name,bytes:bytes.length,sha256:sha(bytes),dimensions});}
await writeFile(resolve(assets,'assets.json'),JSON.stringify({build:stamp,assets:inventory},null,2));
const entry=resolve(root,'docs/project/delivery/index.html'),entryText=await readFile(entry,'utf8'),links=[];
for(const match of entryText.matchAll(/(?:href|src)="([^"#]+)"/g)){const path=resolve(dirname(entry),decodeURIComponent(match[1]));await readFile(path);links.push(match[1]);}
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[];
try{for(const width of [1280,1440]){const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(entry).href);await page.getByRole('heading',{level:1}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.getByText('看一段调查如何接通地图',{exact:true}).click();await page.locator('video').evaluate(v=>v.load());await page.waitForFunction(()=>document.querySelector('video').readyState>=1);const video=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));assert.ok(video.duration>=15&&video.duration<=30);await page.getByText('看一段调查如何接通地图',{exact:true}).click();
 await page.screenshot({path:resolve(out,`entry-${width}.png`),fullPage:true});await page.getByRole('link',{name:'打开鉴定工作台 ↗',exact:true}).click();await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady);assert.equal(page.url(),pathToFileURL(resolve(base,'prototype.html')).href);assert.equal((await page.evaluate(()=>window.hifiSnapshot())).session.log.length,0);assert.deepEqual(errors,[]);checks.push({width,passed:true,video,offlineGameOpened:true});await page.close();}}
finally{await browser.close();}
const repo=execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'}).trim();assert.equal(resolve(repo),root);
const report={passed:true,reviewRequired:true,build:stamp,localLinks:links,checks};await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
const keep=resolve(base,'verification-closeout-2026-09-12');await mkdir(keep,{recursive:true});
for(const [src,dst] of [['output/surface-closeout-before.json','surface-before.json'],['output/surface-closeout-after.json','surface-after.json'],['output/closeout-session-check.log','session-check.log'],['output/closeout-frozen-contract.log','frozen-contract.log'],['output/closeout-material-check.log','material-check.log'],['output/closeout-layout-check.log','layout-check.json'],['output/playwright/closeout-2026-09-12/before/report.json','browser-before.json'],['output/playwright/closeout-2026-09-12/final/report.json','browser-final.json'],['output/playwright/closeout-2026-09-12/delivery/report.json','delivery.json']])await copyFile(resolve(root,src),resolve(keep,dst));
console.log(JSON.stringify(report,null,2));
