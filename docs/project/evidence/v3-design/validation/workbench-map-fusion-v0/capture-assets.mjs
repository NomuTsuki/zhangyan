import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, rename, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { ACTION_BY_ID } from "../knowledge-map-slice-v0/case.mjs";
const here=dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const pw=require(process.argv[2] || "playwright");
const target=resolve(here,"../../../../../portfolio/2026-09-07-fusion-roads");
try { await access(target); throw new Error("Capture directory already exists; preserve the original capture set."); }
catch(error) { if(error.code!=="ENOENT")throw error; }
await mkdir(target,{recursive:true});
const browser=await pw.chromium.launch({headless:true,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2});
const page=await context.newPage();
const errors=[];page.on("pageerror",e=>errors.push(e.message));
async function action(id,atlas=false){
  const place=ACTION_BY_ID.get(id).place;
  await page.locator(atlas?'[data-place="'+place+'"]':'.bench [data-kind="place"][data-id="'+place+'"]').click();
  await page.locator((atlas?'':'#action-pop ')+'[data-take="'+id+'"]').click();
}
const pending=["A.IMAGE.XRAY","A.LOCATE.HISTORIC_IMAGE"];
await page.goto(pathToFileURL(resolve(here,"../workbench-map-atlas-v0/prototype.html")).href);
for(const id of pending)await action(id,true);
await page.mouse.move(2,2);
await page.screenshot({path:resolve(target,"2026-09-07-before-atlas-pending-1440-2x.png")});
await page.goto(pathToFileURL(resolve(here,"prototype.html")).href);
for(const id of pending)await action(id);
await page.locator('#node-controls [data-kind="gap"][data-id="question:context"]').click();
await page.mouse.move(2,2);await page.waitForFunction(()=>!window.fusionSnapshot().transient);
await page.screenshot({path:resolve(target,"2026-09-07-after-fusion-pending-1440-2x.png")});
for(const id of ["A.OBSERVE.BASE","A.VERIFY.OBJECT_CONTINUITY"])await action(id);
await page.mouse.move(2,2);await page.waitForFunction(()=>!window.fusionSnapshot().transient);
await page.screenshot({path:resolve(target,"2026-09-07-context-connected-1440-2x.png")});
await page.setViewportSize({width:1920,height:1000});
await page.reload();
const route=["A.OBSERVE.WHOLE","A.OBSERVE.BASE","A.VERIFY.OBJECT_CONTINUITY","A.RESEARCH.ACCIDENT","A.RELATE.ARCHIVE.T2_TO_OBJECT","A.CORROBORATE.ARCHIVE.T2_CURRENT","A.LOCATE.HISTORIC_IMAGE","A.RESEARCH.LATE_TREATMENT","A.RELATE.ARCHIVE.T3_TO_OBJECT","A.CORROBORATE.ARCHIVE.T3_CURRENT","A.ANALYZE.MATERIAL.SUBSTRATE","A.INSPECT.MATERIAL.LAYER_SEQUENCE","A.INSPECT.WINDOWS","A.SYNTHESIZE.SURFACE_REGIONS","A.ASSESS.TREATED_AND_UNTREATED","A.TRACE.PROVENANCE_CHAIN"];
for(const id of route)await action(id);
await page.locator("#clear-selection").click();await page.mouse.move(2,2);await page.waitForFunction(()=>!window.fusionSnapshot().transient);
await page.screenshot({path:resolve(target,"2026-09-07-fusion-hero-g3-1920-2x.png")});
await context.close();
const videoContext=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:target,size:{width:1440,height:1000}}});
const clip=await videoContext.newPage();
clip.on("pageerror",e=>errors.push(e.message));
await clip.goto(pathToFileURL(resolve(here,"prototype.html")).href);
for(const id of [...pending,"A.OBSERVE.BASE","A.VERIFY.OBJECT_CONTINUITY"]){
  await clip.locator('.bench [data-kind="place"][data-id="'+ACTION_BY_ID.get(id).place+'"]').click();
  await clip.waitForTimeout(1300);
  await clip.locator('#action-pop [data-take="'+id+'"]').click();
  await clip.mouse.move(2,2);await clip.waitForTimeout(2300);
  if(id===pending[1]){await clip.locator('#node-controls [data-kind="gap"][data-id="question:context"]').click();await clip.waitForTimeout(2200);}
}
await clip.waitForTimeout(2000);
const video=clip.video();await videoContext.close();
await rename(await video.path(),resolve(target,"2026-09-07-old-materials-gain-meaning.webm"));
await browser.close();
await writeFile(resolve(target,"capture-manifest.json"),JSON.stringify({capturedAt:new Date().toISOString(),builtHtmlSha256:createHash("sha256").update(await readFile(resolve(here,"prototype.html"))).digest("hex"),screenshots:{viewportPair:[1440,1000],hero:[1920,1000],deviceScaleFactor:2},beforeAfterActions:pending,clipActions:[...pending,"A.OBSERVE.BASE","A.VERIFY.OBJECT_CONTINUITY"],heroActions:route,errors,humanVerified:false},null,2)+"\n","utf8");
console.log("Captured 4 screenshots at 2x and one investigation clip; page errors: "+errors.length);
