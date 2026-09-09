/* Portfolio capture for the existing playable artifact. Native UI actions only.
 * Old assets are read-only. New filenames are date-prefixed and never replaced.
 * Candidate spread placement is editorial metadata, not a claim of UX approval.
 * review required: new capture/framing checks; human acceptance remains separate.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, constants } from 'node:fs';
import { mkdir, copyFile, readFile, writeFile, rmdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../../../../../../..');
const hifi=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const assetDir=resolve(projectRoot,'docs/portfolio/2026-09-09-hifi-workbench');
const suffix=(process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)||'').replace(/[^a-z0-9_-]/gi,'');
const prefix=`2026-09-09-${suffix?`${suffix}-`:''}`;
const highSource=resolve(hifi,'prototype.html');
const lowSource=resolve(hifi,'../workbench-map-fusion-v0/prototype.html');
const processSource=resolve(projectRoot,'docs/portfolio/2026-09-08-local-road-studies/2026-09-08-photo-after-2x.png');
const route=['A.OBSERVE.WHOLE','A.LOCATE.HISTORIC_IMAGE','A.OBSERVE.BASE','A.VERIFY.OBJECT_CONTINUITY'];
const places=['OBJ_W','T1','OBJ_F','OBJ_R'];
const bodyLabels={OBJ_W:'整只碗',OBJ_F:'底足与修足',OBJ_R:'没被改动的特征'};
const files={before:`${prefix}fusion-before-1440x900-2x.png`,after:`${prefix}hifi-after-1440x900-2x.png`,
  hero:`${prefix}hifi-hero-1440x900-2x.png`,process:`${prefix}local-road-study-process.png`,
  clip:`${prefix}evidence-gains-historical-meaning.webm`,manifest:`${prefix}capture-manifest.json`};
const captions={
  before:{slot:'process / system',line:'The fusion prototype records four completed investigations · Logical dependencies had to become visible before art direction · This is the same-state baseline for the workbench.'},
  after:{slot:'system / outcome',line:'The high-fidelity workbench presents the same four investigations · Object inspection and evidence relationships had to stay connected · The new presentation retains the existing records and judgment.'},
  hero:{slot:'outcome',line:'A verified photograph joins the bowl’s history in a navigable 3D workbench · New meaning had to preserve its original evidence · The candidate interface links the object, map and supported judgment.'},
  process:{slot:'process / reflection',line:'A small clickable study isolated the photograph and its later interpretation · Acquired material and justified meaning were being confused · The accepted local model preceded integration into the full map.'},
  clip:{slot:'system / process',line:'A live investigation moves from observation to verified history · Acquisition, focus and connection needed distinct feedback · Existing evidence gains a historical use without being acquired again.'},
};
const manifest={capturedAt:new Date().toISOString(),status:'candidate',reviewRequired:true,viewport:{width:1440,height:900},
  heroDeviceScaleFactor:2,clipDeviceScaleFactor:1,route,assets:[],browserErrors:[],
  boundary:'Native UI states captured from local artifacts. Machine verification and human aesthetic/gameplay acceptance remain separate.'};
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const filePath=key=>resolve(assetDir,files[key]);
const snapshot=page=>page.evaluate(()=>window.hifiSnapshot());
async function pngRecord(key){
  const buffer=await readFile(filePath(key));assert.equal(buffer.toString('ascii',1,4),'PNG');
  const pixels={width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
  if(key!=='process')assert.deepEqual(pixels,{width:2880,height:1800});
  manifest.assets.push({key,file:files[key],...captions[key],pixels,sha256:hash(buffer),bytes:buffer.length});
}
async function shot(page,key){assert.equal(existsSync(filePath(key)),false,`Refusing to replace ${files[key]}`);await page.screenshot({path:filePath(key),fullPage:false,animations:'disabled'});await pngRecord(key);}
async function watch(page){page.on('pageerror',error=>manifest.browserErrors.push(error.message));}
async function openHigh(page){
  await watch(page);await page.goto(pathToFileURL(highSource).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hifiSnapshot&&!!window.hifiMapSnapshot,null,{timeout:15000});
  await page.waitForFunction(()=>window.hifiSnapshot().visibleBody.includes('OBJ_R'),null,{timeout:5000});
}
async function highAction(page,index){
  const id=route[index],place=places[index],before=await snapshot(page);
  const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();
  if(bodyLabels[place]){
    await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');
    if(place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');
    await page.waitForFunction(target=>window.hifiSnapshot().visibleBody.includes(target),place,{timeout:5000});
    await page.locator('.bowl-target-list').getByRole('button',{name:bodyLabels[place],exact:true}).click();
  }else await page.locator(`[data-place="${place}"]`).click();
  assert.deepEqual((await snapshot(page)).session,before.session);
  await page.locator(`[data-action="${id}"]`).click();
  await page.waitForFunction(count=>window.hifiSnapshot().session.log.length===count,before.session.log.length+1,{timeout:5000});
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly',null,{timeout:2000});
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='idle',null,{timeout:4000});
  return snapshot(page);
}
async function highState(page){
  await openHigh(page);for(let i=0;i<route.length;i++)await highAction(page,i);
  const state=await snapshot(page);assert.equal(state.session.log.length,4);assert.equal(state.claims.identity.established,true);
  assert.ok(state.graph.edges.some(edge=>edge.id==='photo:object'));
  assert.ok(state.graph.nodes.some(node=>node.id==='interpretation:photo-repair'));
  const clear=page.locator('.selection-details').getByRole('button',{name:'取消选择',exact:true});if(await clear.count())await clear.click();
  return state;
}
async function videoDuration(file){
  const probe=['D:/anaconda/Library/bin/ffprobe.exe','C:/ffmpeg/bin/ffprobe.exe'].find(existsSync);
  assert.ok(probe,'An available ffprobe is required to verify the actual clip duration.');
  const result=spawnSync(probe,['-v','error','-show_entries','format=duration','-show_entries','stream=width,height','-of','json',file],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);const metadata=JSON.parse(result.stdout);
  return {durationSeconds:Number(metadata.format.duration),streams:metadata.streams,method:probe};
}
let browser;
await mkdir(assetDir,{recursive:true});
for(const filename of Object.values(files))assert.equal(existsSync(resolve(assetDir,filename)),false,`Refusing to replace ${filename}; use --suffix=take2 for another capture.`);
try{
  manifest.sources={high:{file:highSource,sha256:hash(await readFile(highSource))},low:{file:lowSource,sha256:hash(await readFile(lowSource))},process:{file:processSource,sha256:hash(await readFile(processSource))}};
  const executablePath=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
  browser=await chromium.launch({executablePath,headless:true});
  const beforePage=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2,reducedMotion:'no-preference'});
  await watch(beforePage);await beforePage.goto(pathToFileURL(lowSource).href,{waitUntil:'domcontentloaded'});
  await beforePage.waitForFunction(()=>!!window.fusionSnapshot,null,{timeout:10000});
  for(let i=0;i<route.length;i++){
    await beforePage.locator(`.bench [data-kind="place"][data-id="${places[i]}"]`).click();
    await beforePage.locator(`#action-pop [data-take="${route[i]}"]`).click();
    await beforePage.waitForFunction(count=>window.fusionSnapshot().session.log.length===count,i+1);
  }
  await beforePage.locator('#clear-selection').click();await beforePage.waitForTimeout(950);
  const low=await beforePage.evaluate(()=>window.fusionSnapshot());
  assert.equal(low.session.log.length,4);manifest.beforeState={stage:low.solved.stage,observationIds:low.graph.observations.map(item=>item.id),steps:low.session.log.map(item=>item.actionId)};
  await shot(beforePage,'before');await beforePage.close();

  const afterPage=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2,reducedMotion:'no-preference'});
  const state=await highState(afterPage);
  assert.deepEqual(new Set(state.graph.observations.map(item=>item.id)),new Set(manifest.beforeState.observationIds));
  assert.deepEqual(state.session.log.map(item=>item.actionId),manifest.beforeState.steps);
  manifest.afterState={stage:state.stage,observationIds:state.graph.observations.map(item=>item.id),steps:state.session.log.map(item=>item.actionId),claims:state.claims,
    camera:await afterPage.evaluate(()=>window.hifiMapSnapshot().camera)};
  await shot(afterPage,'after');
  manifest.afterState.framing=await afterPage.evaluate(()=>{
    const viewport=document.querySelector('.map-viewport').getBoundingClientRect(),outside=[];
    for(const label of document.querySelectorAll('.map-label,.map-claim,.map-question')){
      const walker=document.createTreeWalker(label,NodeFilter.SHOW_TEXT);let text;
      while((text=walker.nextNode())){if(!text.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(text);
        for(const rect of range.getClientRects())if(rect.left<viewport.left-.5||rect.right>viewport.right+.5||rect.top<viewport.top-.5||rect.bottom>viewport.bottom+.5){
          outside.push({id:label.getAttribute('data-map-label')||label.getAttribute('data-map-node'),text:text.textContent.trim(),rect:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}});
        }
      }
    }
    return {viewport:{left:viewport.left,right:viewport.right,top:viewport.top,bottom:viewport.bottom},outside};
  });
  assert.deepEqual(manifest.afterState.framing.outside,[],'Automatic 4-step framing clips actual label text at 1440 × 900');
  const unchanged=JSON.stringify(state.session);await afterPage.locator('.judgment-overview .judgment-row').first().click();
  assert.equal(JSON.stringify((await snapshot(afterPage)).session),unchanged);await shot(afterPage,'hero');await afterPage.close();

  await copyFile(processSource,filePath('process'),constants.COPYFILE_EXCL);await pngRecord('process');
  const rawVideoDir=resolve(assetDir,`${prefix}recording-source`);await mkdir(rawVideoDir);
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference',recordVideo:{dir:rawVideoDir,size:{width:1440,height:900}}});
  const started=Date.now(),videoPage=await context.newPage(),video=videoPage.video();const phases=[];
  await openHigh(videoPage);let polling=false;
  const sample=setInterval(async()=>{if(polling||videoPage.isClosed())return;polling=true;try{const phase=await videoPage.evaluate(()=>window.hifiMapSnapshot?.().phase);
    if(phase&&phases.at(-1)?.phase!==phase)phases.push({phase,atMs:Date.now()-started});}catch{}finally{polling=false;}},45);
  const at=async(seconds)=>{const remaining=seconds*1000-(Date.now()-started);if(remaining>0)await videoPage.waitForTimeout(remaining);};
  try{
    for(const [index,seconds]of [[0,2],[1,6],[2,11],[3,16]]){await at(seconds);await highAction(videoPage,index);}
    const final=await snapshot(videoPage);assert.equal(final.session.log.length,4);
    assert.equal(final.session.log.filter(entry=>entry.observationId==='obs.phase.t1').length,1);
    assert.ok(final.graph.nodes.some(node=>node.id==='interpretation:photo-repair'));
    await at(21);await videoPage.locator('.map-notice button').click();await videoPage.getByRole('dialog').waitFor({state:'visible'});
    await at(23.8);manifest.clipState={steps:final.session.log.map(entry=>entry.actionId),observationIds:final.graph.observations.map(item=>item.id),phaseTimeline:phases};
  }finally{clearInterval(sample);await context.close();}
  assert.ok(video);await video.saveAs(filePath('clip'));await video.delete();await rmdir(rawVideoDir);
  const duration=await videoDuration(filePath('clip'));assert.ok(duration.durationSeconds>=20&&duration.durationSeconds<=25,`Expected a 20–25s clip, got ${duration.durationSeconds}`);
  for(const phase of ['fly','focus','connect'])assert.equal(phases.filter(sample=>sample.phase===phase).length,4,phase);
  const clipBuffer=await readFile(filePath('clip'));manifest.assets.push({key:'clip',file:files.clip,...captions.clip,...duration,sha256:hash(clipBuffer),bytes:clipBuffer.length});
  assert.deepEqual(manifest.browserErrors,[]);manifest.passed=true;
  const readme=['# High-fidelity workbench capture · 2026-09-09','',
    'Candidate spread slots: system / process / outcome / reflection. Target spread: 594 × 210 mm. Capture framing: real 1440 × 900 desktop viewport; the hero and before/after PNGs use 2× device scale (2880 × 1800).',
    '', 'The before/after pair contains the same four completed investigations and the same acquired observations. The hero only changes the selected judgment. The clip is a native UI recording, including rotation to the foot and later verification of the original photograph. No game state or evidence was injected for appearance.',
    '', 'Status: playable candidate captured; machine checks are reported separately. Human readability, game feel and final visual approval remain pending.', '',
    '| Asset | Candidate slot | English caption |','|---|---|---|',
    ...manifest.assets.map(asset=>`| [${asset.file}](${asset.file}) | ${asset.slot} | ${asset.line} |`),
    '',`Process source copied unchanged from: ${processSource.replaceAll('\\','/')}. Its source hash and every capture hash are retained in [the capture manifest](${files.manifest}).`,
    '',`Actual encoded clip duration: ${duration.durationSeconds.toFixed(2)} seconds, checked with ffprobe. Four acquisition sequences include fly → focus → connect; the original photograph appears once in the final investigation log.`,
    '', 'The historical local study is a process asset, not an alternate claim that the final workbench has been accepted by a player.', ''].join('\n');
  const readmePath=resolve(assetDir,existsSync(resolve(assetDir,'README.md'))&&suffix?`README-${suffix}.md`:'README.md');await writeFile(readmePath,readme,{encoding:'utf8',flag:'wx'});
}catch(error){manifest.passed=false;manifest.error=error.stack||String(error);process.exitCode=1;}finally{
  if(browser)await browser.close();await writeFile(filePath('manifest'),JSON.stringify(manifest,null,2)+'\n',{encoding:'utf8',flag:'wx'});
  console.log(JSON.stringify({passed:manifest.passed,directory:assetDir,manifest:files.manifest,assets:manifest.assets.map(asset=>({file:asset.file,pixels:asset.pixels,durationSeconds:asset.durationSeconds})),error:manifest.error}));
}
