/* review required: new high-fidelity UI checks. All game actions use native UI.
 * hifiSnapshot / hifiMapSnapshot are read-only inspection surfaces. This script
 * never injects or replaces the game's state, actions, callbacks or animations.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ACTIONS } from '../../workbench-map-fusion-v0/local-case.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),arg=name=>args.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const url=args.includes('--offline')?pathToFileURL(resolve(base,'prototype.html')).href:arg('url')||'http://127.0.0.1:4260/';
const suite=arg('suite')||'all';
const tag=(arg('tag')||'').replace(/[^a-z0-9_-]/gi,''),fileTag=tag?`${tag}-`:'';
const report={generatedAt:new Date().toISOString(),url,suite,tag,reviewRequired:true,scenarios:[],
  boundary:'Machine UI integration checks, not human gameplay or aesthetic acceptance. No old tests, baselines or rules are changed.'};
const A={whole:'A.OBSERVE.WHOLE',base:'A.OBSERVE.BASE',photo:'A.LOCATE.HISTORIC_IMAGE',verify:'A.VERIFY.OBJECT_CONTINUITY',
  xray:'A.IMAGE.XRAY',accident:'A.RESEARCH.ACCIDENT',attribution:'A.RELATE.ARCHIVE.T2_TO_OBJECT',compare:'A.MAP.REGION_CONTINUITY'};
const actionById=new Map(ACTIONS.map(action=>[action.id,action]));
const bodyLabels={OBJ_W:'整只碗',OBJ_F:'底足与修足',OBJ_D:'纹饰与色差',OBJ_R:'没被改动的特征',SURF:'表面'};
const mainRoute=[A.whole,A.base,A.photo,A.verify,A.accident,A.attribution,'A.CORROBORATE.ARCHIVE.T2_CURRENT',
  'A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT',A.xray,'A.INSPECT.WINDOWS',
  'A.CORROBORATE.ARCHIVE.T3_CURRENT','A.SYNTHESIZE.SURFACE_REGIONS','A.ANALYZE.MATERIAL.SUBSTRATE',
  'A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'];
const remainingRoute=['A.SCREEN.UV','A.OBSERVE.REGION_DECOR','A.COMPARE.CORPUS','A.COMPARE.CORPUS.RECHECK',A.compare];
const claimIds=['identity','majorReassembly','threePhase','coherentDecisionProfile'];
let browser,activePage=null;
const browserErrors=new WeakMap();
const read=page=>page.evaluate(()=>window.hifiSnapshot());
const map=page=>page.evaluate(()=>window.hifiMapSnapshot());
async function waitIdle(page){await page.waitForFunction(()=>window.hifiMapSnapshot?.().phase==='idle',null,{timeout:5000});}
async function capture(page,name){const target=resolve(base,`verification-${fileTag}${name}.png`);await page.screenshot({path:target,fullPage:true,animations:'disabled'});return target;}
async function newPage(width=1440,reducedMotion=true){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:reducedMotion?'reduce':'no-preference'});
  activePage=page;const errors=[];browserErrors.set(page,errors);
  page.on('pageerror',error=>errors.push({type:'pageerror',message:error.message}));
  page.on('console',message=>{if(message.type()==='error')errors.push({type:'console',message:message.text()});});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.hifiSnapshot&&!!window.hifiMapSnapshot,null,{timeout:15000});
  await page.locator('.bowl-webgl').waitFor({timeout:8000});
  await page.waitForFunction(()=>window.hifiSnapshot().visibleBody.includes('OBJ_R'),null,{timeout:4000});
  const initial=await read(page);assert.equal(initial.session.log.length,0);assert.equal(initial.reduceMotion,reducedMotion);
  return page;
}
async function closeMethods(page){const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();}
async function openAction(page,id){
  await closeMethods(page);const action=actionById.get(id);assert.ok(action,id);
  const place=action.place;
  if(bodyLabels[place]){
    const canvas=page.locator('.bowl-webgl');await canvas.focus();await page.keyboard.press('Home');
    if(place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');
    await page.waitForFunction(target=>window.hifiSnapshot().visibleBody.includes(target),place,{timeout:4000});
    await page.locator('.bowl-target-list').getByRole('button',{name:bodyLabels[place],exact:true}).click();
  }else await page.locator(`[data-place="${place}"]`).click();
  const row=page.locator(`[data-action-row="${id}"]`);await row.waitFor({state:'visible',timeout:3000});return row;
}
async function prepare(page,id,basis){
  const before=await read(page);const row=await openAction(page,id);
  assert.deepEqual((await read(page)).session,before.session,'Selecting a place must be free');
  if(id===A.compare&&basis)await row.locator(`input[name="comparison-basis"][value="${basis}"]`).check();
  return row.locator(`[data-action="${id}"]`);
}
async function executePrepared(page,button,id){
  const before=await read(page),action=actionById.get(id);
  assert.equal(await button.isEnabled(),true,`Expected available action: ${id}`);
  await button.click();
  await page.waitForFunction(count=>window.hifiSnapshot().session.log.length===count,before.session.log.length+1,{timeout:6000});
  const after=await read(page);
  assert.equal(after.session.log.at(-1).actionId,id);
  assert.equal(after.session.billed[action.cost],before.session.billed[action.cost]+1);
  assert.equal(after.session.budget,before.session.budget);
  return after;
}
async function investigate(page,id,basis=id===A.compare?'archive':undefined){return executePrepared(page,await prepare(page,id,basis),id);}
async function openHistory(page,step){
  await page.getByRole('button',{name:/^调查记录/}).click();
  await page.locator('.history-list button').nth(step).click();
  await page.waitForFunction(index=>window.hifiSnapshot().historyIndex===index,step,{timeout:4000});
}
async function returnLive(page){await page.locator('.history-banner button').click();await page.waitForFunction(()=>window.hifiSnapshot().historyIndex===null);}
async function restart(page){
  await page.getByRole('button',{name:'设置',exact:true}).click();
  await page.getByRole('button',{name:'重开',exact:true}).click();
  await page.getByRole('button',{name:'重新开始',exact:true}).click();
  await page.waitForFunction(()=>window.hifiSnapshot().session.log.length===0);await waitIdle(page);
}
async function stop(page){
  await page.getByRole('button',{name:'收手，作出判断',exact:true}).click();
  await page.locator('#judgment-note').fill('测试记录：主要经历已有依据，仍保留未解之处。');
  await page.getByRole('button',{name:'确认收手',exact:true}).click();
  await page.waitForFunction(()=>window.hifiSnapshot().session.stopped);await waitIdle(page);
}
async function assertNoLateAnimation(page,duration=2350){
  const first=await map(page);assert.equal(first.phase,'idle');assert.equal(first.flight,false);
  await page.waitForTimeout(duration);const last=await map(page);assert.equal(last.phase,'idle');assert.equal(last.flight,false);
  assert.deepEqual(last.camera,first.camera,'Cancelled animation must not move the camera later');return last;
}
async function scenario(name,fn){
  const entry={name,passed:false};const start=Date.now();
  try{entry.evidence=await fn();const errors=browserErrors.get(activePage)||[];entry.errors=errors;assert.deepEqual(errors,[],'Unexpected browser errors');entry.passed=true;}
  catch(error){entry.error=error.stack||String(error);entry.errors=browserErrors.get(activePage)||[];
    if(activePage&&!activePage.isClosed()){
      try{entry.failureScreenshot=await capture(activePage,`failure-${name.replace(/[^a-z0-9-]/gi,'-')}`);entry.lastState=await read(activePage);entry.lastMap=await map(activePage);}catch{}
    }
  }finally{entry.elapsedMs=Date.now()-start;report.scenarios.push(entry);console.log(JSON.stringify({scenario:name,passed:entry.passed,error:entry.error?.split('\n').slice(0,3).join('\n')}));if(activePage&&!activePage.isClosed())await activePage.close();activePage=null;}
}

try{
  const executablePath=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
  assert.ok(executablePath,'Microsoft Edge executable is required.');
  browser=await chromium.launch({executablePath,headless:true});

  if(['all','main'].includes(suite))for(const width of [1280,1440,1920])await scenario(`desktop-${width}`,async()=>{
    const page=await newPage(width,true),screenshots={};
    const initial=await read(page);assert.equal(initial.graph.nodes.length,0);assert.equal(initial.session.budget,22);
    screenshots.initial=await capture(page,`${width}-initial`);
    for(let i=0;i<mainRoute.length;i++){
      await investigate(page,mainRoute[i]);
      if(i===10){const middle=await read(page);assert.equal(middle.stage,'G2');assert.equal(middle.claims.identity.established,true);
        assert.equal(middle.claims.majorReassembly.established,true);assert.ok(middle.graph.frontiers.some(frontier=>frontier.id==='question:surface'));
        await page.getByRole('button',{name:'全览',exact:true}).click();screenshots.mid=await capture(page,`${width}-mid`);}
    }
    const g3=await read(page);assert.equal(g3.stage,'G3');claimIds.forEach(id=>assert.equal(g3.claims[id].established,true,id));
    assert.equal(g3.session.log.length,17);await page.getByRole('button',{name:'全览',exact:true}).click();screenshots.g3=await capture(page,`${width}-g3`);
    const free=JSON.stringify(g3.session);await page.locator('.judgment-overview .judgment-row').first().click();
    assert.equal(JSON.stringify((await read(page)).session),free,'Judgment selection changes no game state');
    for(const id of remainingRoute)await investigate(page,id,id===A.compare?'archive':undefined);
    const complete=await read(page);assert.equal(complete.session.log.length,22);assert.equal(new Set(complete.session.log.map(entry=>entry.actionId)).size,22);
    assert.equal(complete.session.stopped,false,'Budget exhaustion must not stop the game automatically');
    const lastButton=await prepare(page,A.whole);assert.equal(await lastButton.isDisabled(),true);await closeMethods(page);
    const beforeStop=structuredClone((await read(page)).session);await stop(page);const stopped=await read(page);
    assert.deepEqual(stopped.session.log,beforeStop.log);assert.deepEqual(stopped.session.billed,beforeStop.billed);
    assert.equal(stopped.stopping.playerChoice,'STOP');assert.equal(stopped.stopping.systemAutoEnded,false);assert.equal(stopped.stage,'G3');
    screenshots.stop=await capture(page,`${width}-stop`);
    return {screenshots,stage:stopped.stage,actions:stopped.session.log.map(entry=>entry.actionId),billed:stopped.session.billed,
      finalNodes:stopped.graph.nodes.length,finalEdges:stopped.graph.edges.length,finalFrontiers:stopped.graph.frontiers.length};
  });

  if(['all','materials'].includes(suite))await scenario('materials-and-comparison-history',async()=>{
    const page=await newPage(1440,true),screenshots={};
    await investigate(page,A.xray);await investigate(page,A.photo);
    const xrPhoto=await read(page);assert.equal(xrPhoto.graph.observations.find(o=>o.id==='obs.structure.xray.early').interpretationState,'current');
    const freeBefore=JSON.stringify(xrPhoto.session);
    await page.locator('.map-notice button').click();await page.getByRole('dialog').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.querySelectorAll('.sheet-dialog .plate-canvas canvas').length===1);
    assert.equal(await page.locator('.material-reading').textContent().then(t=>t.includes('仍需核对')),true);
    screenshots.photo=await capture(page,'material-photo-unverified');
    await page.getByRole('button',{name:'底足与锔痕',exact:true}).click();
    await page.waitForTimeout(200);await page.getByRole('button',{name:'放大或恢复材料图像',exact:true}).click();
    await page.waitForTimeout(200);assert.equal(JSON.stringify((await read(page)).session),freeBefore);
    await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
    await investigate(page,A.whole);await investigate(page,A.compare,'photo');
    const reportFirst=await read(page),photoHistoryStep=reportFirst.session.log.length;
    assert.equal(reportFirst.session.log.at(-1).comparisonBasis,'photo');
    assert.equal(reportFirst.graph.observations.find(o=>o.id==='obs.structure.major.cross-time').interpretationState,'awaiting-attribution');
    await investigate(page,A.base);await investigate(page,A.verify);
    const verified=await read(page);
    assert.equal(verified.graph.observations.find(o=>o.id==='obs.structure.major.cross-time').interpretationState,'established');
    for(const id of ['obs.phase.t1','obs.structure.xray.early','obs.structure.major.cross-time'])assert.equal(verified.session.log.filter(entry=>entry.observationId===id).length,1);
    assert.equal(verified.graph.nodes.some(node=>node.id==='obs.object.continuity'),false);
    assert.ok(verified.graph.edges.some(edge=>edge.id==='photo:object'&&edge.sourceIds.includes('obs.object.continuity')));
    await page.locator('.map-notice button').click();
    await page.waitForFunction(()=>document.querySelectorAll('.sheet-dialog .plate-canvas canvas').length===2);
    const rendered=await page.locator('.sheet-dialog .plate-canvas canvas').evaluateAll(canvases=>canvases.map(canvas=>{
      const gl=canvas.getContext('webgl2');if(!gl)return{rendered:false};const pixels=new Uint8Array(canvas.width*canvas.height*4);
      gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let visible=0;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;
      return {rendered:visible>1000,width:canvas.width,height:canvas.height,nontransparentPixels:visible};
    }));assert.ok(rendered.every(item=>item.rendered));
    screenshots.verification=await capture(page,'material-object-verification');
    await page.getByRole('button',{name:'底足与锔痕',exact:true}).click();await page.waitForTimeout(200);
    screenshots.basePair=await capture(page,'material-base-comparison');await page.keyboard.press('Escape');
    await investigate(page,A.accident);
    const both=await prepare(page,A.compare);assert.equal(await both.isDisabled(),true,'Both available comparisons still require explicit UI choice');
    const basisControls=page.locator(`[data-action-row="${A.compare}"] input[name="comparison-basis"]`);
    assert.equal(await basisControls.count(),2);assert.equal(await basisControls.nth(0).isEnabled(),true);assert.equal(await basisControls.nth(1).isEnabled(),true);
    const noChoice=JSON.stringify((await read(page)).session);await closeMethods(page);assert.equal(JSON.stringify((await read(page)).session),noChoice);
    await investigate(page,A.compare,'archive');const archivePending=await read(page);
    assert.equal(archivePending.graph.observations.find(o=>o.id==='obs.structure.major.documented-cross-time').interpretationState,'awaiting-attribution');
    await investigate(page,A.attribution);const established=await read(page);
    assert.equal(established.graph.observations.find(o=>o.id==='obs.structure.major.documented-cross-time').interpretationState,'established');
    const stored=structuredClone(established.session);
    await openHistory(page,photoHistoryStep);const past=await read(page);
    assert.equal(past.viewSession.log.at(-1).comparisonBasis,'photo');
    assert.deepEqual(past.viewSession.log.at(-1).materialObservationIds,stored.log[photoHistoryStep-1].materialObservationIds);
    assert.equal(past.graph.observations.find(o=>o.id==='obs.structure.major.cross-time').interpretationState,'awaiting-attribution');
    assert.deepEqual(past.session,stored);screenshots.history=await capture(page,'comparison-history-before-attribution');await returnLive(page);
    const button=await prepare(page,A.compare,'archive'),beforeRepeat=await read(page),cameraBefore=(await map(page)).camera;
    await executePrepared(page,button,A.compare);await page.waitForTimeout(1000);
    const repeated=await read(page),repeatMap=await map(page);
    assert.deepEqual(repeatMap.camera,cameraBefore,'Repeating a report must not move the map camera');
    assert.equal(repeatMap.phase,'idle');assert.equal(repeatMap.flight,false);
    assert.equal(repeated.graph.observations.length,beforeRepeat.graph.observations.length);
    assert.equal(repeated.session.log.length,beforeRepeat.session.log.length+1);
    assert.equal(repeated.session.billed[2],beforeRepeat.session.billed[2]+1);
    return {screenshots,rendered,photoHistoryStep,bases:repeated.session.log.filter(entry=>entry.comparisonBasis).map(entry=>entry.comparisonBasis),repeatedRecordCount:repeated.graph.observations.length};
  });

  if(['all','motion'].includes(suite))await scenario('animation-sequence-and-cancellation',async()=>{
    const page=await newPage(1440,false),screenshots={},phases=[];
    await investigate(page,A.whole);
    const until=Date.now()+2800;
    while(Date.now()<until){const snap=await map(page);if(phases.at(-1)!==snap.phase)phases.push(snap.phase);
      if(snap.phase==='fly'&&!screenshots.fly)screenshots.fly=await capture(page,'motion-fly');
      if(snap.phase==='idle'&&phases.includes('connect'))break;await page.waitForTimeout(35);}
    assert.deepEqual(phases,['fly','focus','connect','idle'],'Expected acquisition, local focus, connection, then settled map');
    await investigate(page,A.xray);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly',null,{timeout:1800});
    await page.getByRole('button',{name:'查看委托',exact:true}).click();await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='idle');
    await page.keyboard.press('Escape');await assertNoLateAnimation(page);
    await investigate(page,A.photo);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly',null,{timeout:1800});
    const blank=await page.locator('.map-viewport').evaluate(element=>{
      const r=element.getBoundingClientRect();
      for(const fy of [.12,.88,.5])for(const fx of [.08,.92,.48]){const x=r.left+r.width*fx,y=r.top+r.height*fy,hit=document.elementFromPoint(x,y);
        if(hit?.closest('.map-viewport')&&!hit.closest('button,.road-hit'))return{x,y};}
      throw Error('No native map drag starting point is exposed');
    });
    await page.mouse.move(blank.x,blank.y);await page.mouse.down();await page.mouse.move(blank.x+38,blank.y+25,{steps:5});await page.mouse.up();
    await assertNoLateAnimation(page);
    await investigate(page,A.base);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly',null,{timeout:1800});
    const liveLog=(await read(page)).session.log;await openHistory(page,0);await assertNoLateAnimation(page);
    assert.equal((await read(page)).graph.nodes.length,0);await returnLive(page);assert.deepEqual((await read(page)).session.log,liveLog);
    await investigate(page,A.verify);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly',null,{timeout:1800});
    const relation=await map(page),state=await read(page),landing=relation.fresh?.landingId;
    assert.ok(landing,'A verification report must have a landing relation');
    assert.ok(relation.layout.routes.some(route=>route.id===landing&&route.edgeIds.includes('photo:object')),'Verification must land on photo attribution, not an unrelated proof road');
    assert.equal(state.graph.nodes.some(node=>node.id==='obs.object.continuity'),false);
    screenshots.relation=await capture(page,'motion-relation-landing');await waitIdle(page);
    const repeatButton=await prepare(page,A.verify),repeatCamera=(await map(page)).camera;
    await executePrepared(page,repeatButton,A.verify);await page.waitForTimeout(950);
    assert.deepEqual((await map(page)).camera,repeatCamera);assert.equal((await map(page)).flight,false);
    await investigate(page,A.accident);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly',null,{timeout:1800});
    const oldGame=(await read(page)).gameId;await restart(page);await assertNoLateAnimation(page);
    assert.equal((await read(page)).session.log.length,0);assert.equal((await read(page)).gameId,oldGame+1);
    await investigate(page,A.whole);await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='fly',null,{timeout:1800});
    await stop(page);await assertNoLateAnimation(page);const stopped=await read(page);
    assert.equal(stopped.session.stopped,true);assert.equal(stopped.session.log.length,1);
    return {phases,screenshots,verificationLanding:landing,cancelledBy:['modal/Escape','map drag','history','restart','stop'],stoppedAfterOneAction:true};
  });
}catch(error){report.fatal=error.stack||String(error);}finally{
  if(browser)await browser.close();report.passed=!report.fatal&&report.scenarios.length>0&&report.scenarios.every(scenario=>scenario.passed);
  const output=resolve(base,`verification-browser-${fileTag}${suite}.json`);await writeFile(output,JSON.stringify(report,null,2)+'\n','utf8');
  console.log(JSON.stringify({passed:report.passed,output,passedScenarios:report.scenarios.filter(item=>item.passed).length,total:report.scenarios.length,fatal:report.fatal,
    failures:report.scenarios.filter(item=>!item.passed).map(item=>({name:item.name,error:item.error?.split('\n').slice(0,3).join('\n'),errors:item.errors,failureScreenshot:item.failureScreenshot}))}));
  if(!report.passed)process.exitCode=1;
}
