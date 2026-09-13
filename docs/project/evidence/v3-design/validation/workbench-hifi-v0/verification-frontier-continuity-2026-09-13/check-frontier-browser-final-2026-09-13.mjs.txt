// review required: evidence-only browser audit of the current file; does not modify product files.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {ACTIONS} from '../docs/project/evidence/v3-design/validation/workbench-map-fusion-v0/local-case.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const capture=process.argv.includes('--capture'),only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const out=resolve('output/playwright/frontier-system-repair-final-2026-09-13/'+(capture?'browser-capture':'browser'));await mkdir(out,{recursive:true});
const source=resolve('docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html'),url=pathToFileURL(source).href+'?lang=zh';
const report={readOnly:true,sha256:createHash('sha256').update(await readFile(source)).digest('hex'),cases:[]};
const actions=new Map(ACTIONS.map(a=>[a.id,a])),browser=await chromium.launch({channel:'msedge',headless:true});let context,page,errors;
const snap=()=>page.evaluate(()=>({app:window.hifiSnapshot(),map:window.hifiMapSnapshot()}));
async function take(id,basis){const count=(await snap()).app.session.log.length,place=actions.get(id).place;if(['OBJ_W','OBJ_F','OBJ_D','OBJ_R','SURF'].includes(place)){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');await page.waitForFunction(p=>window.hifiSnapshot().visibleBody.includes(p),place);await page.locator(`.bowl-target-list [data-bowl-target="${place}"]`).click();}else await page.locator(`[data-place="${place}"]`).click();const row=page.locator(`[data-action-row="${id}"]`);if(basis)await row.locator(`input[value="${basis}"]`).check();await row.locator('[data-action]').click();await page.waitForFunction(n=>window.hifiSnapshot().session.log.length===n&&!window.hifiSnapshot().computeBusy,count+1,{timeout:30000});}
const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',MAT:'A.ANALYZE.MATERIAL.SUBSTRATE',LAYER:'A.INSPECT.MATERIAL.LAYER_SEQUENCE',UV:'A.SCREEN.UV',POINT:'A.INSPECT.WINDOWS',SURF:'A.SYNTHESIZE.SURFACE_REGIONS',DECOR:'A.OBSERVE.REGION_DECOR',X:'A.IMAGE.XRAY',T2:'A.RESEARCH.ACCIDENT',A2:'A.RELATE.ARCHIVE.T2_TO_OBJECT',P:'A.LOCATE.HISTORIC_IMAGE',C:'A.VERIFY.OBJECT_CONTINUITY',CMP:'A.MAP.REGION_CONTINUITY',CORP:'A.COMPARE.CORPUS'};
const cases=[
 ['layers-before-material',['LAYER'],'MAT','question:material-base'],
 ['material-before-layers',['MAT'],'LAYER','question:material-sequence'],
 ['record-before-verification',['T2'],'A2','question:archive:t2:attribution'],
 ['uv-to-regional-synthesis',['UV','POINT'],'SURF','question:negative'],
 ['manufacturing-comparison',['W','B'],'CORP','question:craft'],
 ['alternative-identity-route',['W','B','P'],'C','question:craft'],
 ['visible-repairs-branch',['W'],'X','question:visible-intervention'],
 ['appearance-to-window',['DECOR'],'POINT','question:appearance'],
 ['xray-to-comparison',['X','P','W','B','C'],'CMP','question:change'],
 ['alternate-corpus',['W','B','P','C'],'REPEAT','question:craft'],
 ['archive-comparison',['W','T2'],'CMP_ARCHIVE','question:archive:t2:corroboration'],
 ['record-to-object-endpoint',['T2'],'W','question:archive:t2:attribution'],
 ['handover-interrupt-zoom',['T2'],'W','question:archive:t2:attribution'],
 ['handover-interrupt-language',['T2'],'W','question:archive:t2:attribution'],
 ['handover-interrupt-stop',['T2'],'W','question:archive:t2:attribution'],
];
A.REPEAT='A.COMPARE.CORPUS.RECHECK';A.CMP_ARCHIVE=A.CMP;
try{for(const [name,pre,step,qid] of cases){
 if(only&&name!==only)continue;
 context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,reducedMotion:'reduce',...(capture?{recordVideo:{dir:out,size:{width:1440,height:1000}}}:{})});page=await context.newPage();errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{await page.goto(url);await page.waitForFunction(()=>window.hifiSnapshot?.().engineReady&&window.hifiSnapshot().visibleBody.includes('OBJ_R'));for(const id of pre)await take(A[id]);await page.keyboard.press('Escape');await page.locator('.map-fit').click();
  const before=await snap();assert.ok(before.app.graph.frontiers.some(f=>f.id===qid),qid+' must actually be visible');await page.screenshot({path:resolve(out,name+'-before.png')});
  if(capture)await page.waitForTimeout(3500);
  await page.locator('.game-topbar .settings-button').click();await page.locator('.setting-row input[type=checkbox]').uncheck();await page.keyboard.press('Escape');await take(A[step],step==='CMP'?'photo':step==='CMP_ARCHIVE'?'archive':undefined);
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='connect',null,{timeout:30000});const start=await snap();await page.waitForTimeout(350);
  const old=page.locator(`[data-retiring-question="${qid}"]`),oldOpacity=await old.count()?await old.evaluate(e=>getComputedStyle(e).opacity):null;
  await page.screenshot({path:resolve(out,name+'-connect.png')});
  const persistent=['uv-to-regional-synthesis','alternative-identity-route','visible-repairs-branch','record-to-object-endpoint'].includes(name)||name.startsWith('handover-interrupt');
  if(!persistent)assert.ok(Number(oldOpacity)>.5,'Old question must remain readable during connection');
  if(oldOpacity!==null&&Number(oldOpacity)>.5){const q=await old.boundingBox(),v=await page.locator('.map-viewport').boundingBox();assert.ok(q.x>=v.x-1&&q.x+q.width<=v.x+v.width+1&&q.y>=v.y-1&&q.y+q.height<=v.y+v.height+1,'Old question must be in pullback frame');}
  if(name==='record-to-object-endpoint'||name.startsWith('handover-interrupt')){
    const trail=page.locator('[data-frontier-handover] [data-route]').first();assert.ok(await trail.count());
    assert.equal(await trail.getAttribute('pathLength'),null,'Handover dashes must use world-pixel spacing');
  }
  if(name.startsWith('handover-interrupt')){
    if(name.endsWith('zoom'))for(let i=0;i<20;i++)await page.getByRole('button',{name:'缩小地图',exact:true}).click();
    if(name.endsWith('language')){await page.locator('.language-switch').click();await page.locator('.language-switch').click();}
    if(name.endsWith('stop')){await page.locator('.stop-button').click();await page.getByRole('button',{name:'确认收手',exact:true}).click();}
    await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='idle');assert.equal(await page.locator('[data-frontier-handover],[data-retiring-question]').count(),0);
    const settled=await snap();await page.waitForTimeout(4000);assert.deepEqual((await snap()).map.camera,settled.map.camera);assert.equal((await snap()).app.session.log.length,2);
  }
  await page.waitForFunction(()=>window.hifiMapSnapshot().phase==='idle',null,{timeout:40000});await page.locator('.map-fit').click();const after=await snap();await page.screenshot({path:resolve(out,name+'-after.png')});
  assert.equal(after.app.graph.frontiers.some(f=>f.id===qid),persistent,'Question retirement must match its meaning');
  if(name.includes('material')){const r=after.map.layout.routes.find(r=>r.id==='enquiry:material-pair');assert.ok(r&&!r.arrow);assert.equal(after.app.graph.nodes.length,2);}
  assert.deepEqual(errors,[]);
  if(capture)await page.waitForTimeout(4500);
  report.cases.push({name,executed:true,pre:pre.map(id=>A[id]),action:A[step],questionId:qid,beforeFrontier:before.map.layout.frontiers.find(f=>f.id===qid),oldOpacityAt350ms:oldOpacity,connectPlan:start.map.transition,afterNodes:after.app.graph.nodes.map(n=>({id:n.id,title:n.title})),afterRoads:after.map.layout.routes.map(r=>({id:r.id,kind:r.kind,edgeIds:r.edgeIds})),afterQuestions:after.app.graph.frontiers.map(f=>({id:f.id,title:f.title})),steps:after.app.session.log.length,errors});
 }catch(e){report.cases.push({name,executed:false,error:e.stack,errors});await page.screenshot({path:resolve(out,name+'-runner-failure.png')});}
 await context.close();context=null;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({name,...report.cases.at(-1),beforeFrontier:undefined,connectPlan:undefined,afterNodes:undefined,afterRoads:undefined,afterQuestions:undefined}));
}}finally{if(context)await context.close();await browser.close();}
console.log(JSON.stringify({executed:report.cases.filter(c=>c.executed).length,cases:report.cases.length,out}));
