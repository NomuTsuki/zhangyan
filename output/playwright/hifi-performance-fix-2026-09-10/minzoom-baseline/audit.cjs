const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
const root='E:/zhangyan__v2',out=path.join(root,'output/playwright/hifi-performance-fix-2026-09-10/minzoom-baseline');
const source='docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',P:'A.LOCATE.HISTORIC_IMAGE',C:'A.VERIFY.OBJECT_CONTINUITY',T2:'A.RESEARCH.ACCIDENT',T2A:'A.RELATE.ARCHIVE.T2_TO_OBJECT',X:'A.IMAGE.XRAY',D:'A.MAP.REGION_CONTINUITY'};
const route=[A.W,A.B,A.P,A.C,A.T2,A.T2A,'A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT',A.X,'A.INSPECT.WINDOWS','A.CORROBORATE.ARCHIVE.T3_CURRENT','A.SYNTHESIZE.SURFACE_REGIONS','A.ANALYZE.MATERIAL.SUBSTRATE','A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN','A.SCREEN.UV','A.OBSERVE.REGION_DECOR','A.COMPARE.CORPUS','A.COMPARE.CORPUS.RECHECK',A.D];
const bodyLabels={OBJ_W:'整只碗',OBJ_F:'底足与修足',OBJ_D:'纹饰与色差',OBJ_R:'没被改动的特征',SURF:'表面'};
const metrics=async cdp=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
async function summary(page){return page.evaluate(()=>{const s=window.hifiSnapshot(),m=window.hifiMapSnapshot(),v=document.querySelector('.map-viewport').getBoundingClientRect();const nodes=[...document.querySelectorAll('[data-map-node]')];return{actions:s.session.log.length,observations:s.graph.observations.length,stage:s.stage,camera:m.camera,phase:m.phase,flight:m.flight,selection:s.selection,nodes:nodes.length,routes:m.layout.routes.length,frontiers:m.layout.frontiers.length,world:document.querySelector('.map-world').getAttribute('style'),visibleNodes:nodes.filter(n=>{const r=n.getBoundingClientRect();return r.right>v.left&&r.left<v.right&&r.bottom>v.top&&r.top<v.bottom}).length,finiteCamera:Object.values(m.camera).every(Number.isFinite),textSelection:window.getSelection().toString()};});}
async function monitor(page,cdp,label,operation,duration=1500){
 await page.evaluate(()=>{const a=window.__minZoomAudit;a.active=true;a.longTasks=[];a.mutations=0;a.styles=0;a.classes=0;a.pointerEvents=0;a.targets={};a.frames=[];a.last=performance.now();});
 const before=await metrics(cdp),started=Date.now();if(operation)await operation();await page.waitForTimeout(duration);
 const stats=await page.evaluate(()=>{const a=window.__minZoomAudit;a.active=false;const f=a.frames.sort((x,y)=>x-y);return{longTasks:a.longTasks,mutationCount:a.mutations,styleMutationCount:a.styles,classMutationCount:a.classes,pointerBoundaryEvents:a.pointerEvents,hoverTargets:a.targets,rafIntervals:f.length,rafP50:f[Math.floor(f.length*.5)]??null,rafP95:f[Math.floor(f.length*.95)]??null,rafMax:f.at(-1)??null,rafOver50ms:f.filter(x=>x>50).length};});
 const after=await metrics(cdp);return{label,wallMs:Date.now()-started,...stats,metricsDelta:Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount','JSHeapUsedSize'].map(k=>[k,after[k]-before[k]])),state:await summary(page)};
}
async function zoomMinimum(page){for(let i=0;i<15;i++)await page.getByRole('button',{name:'缩小地图',exact:true}).click({timeout:10000});}
async function overview(page){await page.getByRole('button',{name:'全览',exact:true}).click();}
async function wheelMinimum(page){const r=await page.locator('.map-viewport').boundingBox();await page.mouse.move(r.x+r.width*.63,r.y+r.height*.43);await page.keyboard.down('Control');await page.mouse.wheel(0,1800);await page.keyboard.up('Control');}
async function blankPoint(page){return page.evaluate(()=>{const v=document.querySelector('.map-viewport'),r=v.getBoundingClientRect();for(const x of [.85,.2,.5,.7])for(const y of [.78,.18,.5]){const p={x:r.left+r.width*x,y:r.top+r.height*y};if(!document.elementFromPoint(p.x,p.y)?.closest('button,.road-hit'))return p;}return{x:r.right-12,y:r.bottom-12};});}
async function openAction(page,action){
 const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();
 if(bodyLabels[action.place]){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(action.place==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');await page.waitForFunction(id=>window.hifiSnapshot().visibleBody.includes(id),action.place,{polling:150,timeout:5000});await page.locator('.bowl-target-list').getByRole('button',{name:bodyLabels[action.place],exact:true}).click();}
 else await page.locator(`[data-place="${action.place}"]`).click();
 if(action.id===A.D)await page.locator('input[name="comparison-basis"][value="archive"]').check();
 return page.locator(`[data-action="${action.id}"]`);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const input=path.join(out,'18dc40d-prototype.html');assert.ok(!fs.existsSync(input));const r=spawnSync('git',['show',`18dc40d:${source}`],{cwd:root,maxBuffer:24*1024*1024});assert.equal(r.status,0);fs.writeFileSync(input,r.stdout);assert.equal(sha(r.stdout),'98f640e5341d575d003e38b695851bf54f6ffecf275f0e5b308a9a7d0aafae1f');
 const {ACTIONS}=await import(pathToFileURL(path.join(root,'docs/project/evidence/v3-design/validation/workbench-map-fusion-v0/local-case.mjs')).href);const byId=new Map(ACTIONS.map(a=>[a.id,a]));
 const report={reviewRequired:true,source:{revision:'18dc40d',bytes:r.stdout.length,sha256:sha(r.stdout)},viewport:{width:1440,height:1000},browser:'Edge headless; one page; normal motion',instrumentation:'CDP cumulative metrics around bounded windows; timestamp-only RAF observer; low-cost mutation counters; full game snapshots only at checkpoints, never per frame',states:[],animationInterruptions:[],errors:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage({viewport:report.viewport,reducedMotion:'no-preference'});page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.stack||e.message));const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 try{
  await page.goto(pathToFileURL(input).href);await page.waitForFunction(()=>!!window.hifiSnapshot&&!!window.hifiMapSnapshot,{},{polling:150});
  await page.evaluate(()=>{const a=window.__minZoomAudit={active:false,longTasks:[],mutations:0,styles:0,classes:0,pointerEvents:0,targets:{},frames:[],last:0};new PerformanceObserver(list=>{if(a.active)for(const e of list.getEntries())a.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:false});new MutationObserver(rows=>{if(a.active)for(const row of rows){a.mutations++;if(row.attributeName==='style')a.styles++;if(row.attributeName==='class')a.classes++;}}).observe(document.querySelector('.map-world'),{subtree:true,attributes:true,attributeFilter:['class','style'],childList:true});for(const event of ['pointerover','pointerout'])document.querySelector('.map-viewport').addEventListener(event,e=>{if(!a.active)return;a.pointerEvents++;const t=e.target;const id=t.getAttribute?.('data-map-node')||t.getAttribute?.('data-map-label')||t.getAttribute?.('data-road-hit')||t.tagName;a.targets[id]=(a.targets[id]||0)+1;});const frame=now=>{if(a.active){a.frames.push(now-a.last);a.last=now;}requestAnimationFrame(frame);};requestAnimationFrame(frame);});
  async function checkState(count){
   await page.keyboard.press('Escape');await page.mouse.move(1420,75);const results=[];
   results.push(await monitor(page,cdp,'settled before zoom',null));
   results.push(await monitor(page,cdp,'15 minus-button clicks to clamp; pointer leaves map',()=>zoomMinimum(page)));
   assert.ok(Math.abs(results.at(-1).state.camera.s-.2)<1e-8);
   await page.mouse.move(1420,75);results.push(await monitor(page,cdp,'stationary at 20%, pointer outside',null));
   results.push(await monitor(page,cdp,'overview, then Ctrl-wheel back to 20%',async()=>{await overview(page);await wheelMinimum(page);}));
   const node=page.locator('[data-map-label]').first();if(await node.count()){await node.hover({force:true});results.push(await monitor(page,cdp,'stationary hover at 20%',null));}
   await page.mouse.move(1420,75);const p=await blankPoint(page);results.push(await monitor(page,cdp,'map drag at 20%',async()=>{await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+125,p.y-80,{steps:25});await page.mouse.up();}));
   results.push(await monitor(page,cdp,'recover through overview; then min again',async()=>{await overview(page);await zoomMinimum(page);}));
   await page.mouse.move(1420,75);await page.screenshot({path:path.join(out,`state-${count}-min20.png`)});
   report.states.push({requestedActionCount:count,results});fs.writeFileSync(path.join(out,'audit-progress.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({state:count,observations:results[0].state.observations,worstRafMs:Math.max(...results.map(x=>x.rafMax||0)),longTaskCount:results.reduce((s,x)=>s+x.longTasks.length,0),finite:results.every(x=>x.state.finiteCamera),errors:report.errors.length}));
  }
  await checkState(0);
  for(let i=0;i<route.length;i++){
   const id=route[i],button=await openAction(page,byId.get(id));
   if([0,5,17,21].includes(i)){
    const record=await monitor(page,cdp,`interrupt action ${i+1} while fly/focus`,async()=>{await button.click();await page.locator('.map-component:not([data-phase="idle"])').waitFor({timeout:5000});await wheelMinimum(page);},1800);
    report.animationInterruptions.push(record);assert.equal(record.state.phase,'idle');
   }else{await button.click();await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='idle',null,{polling:100,timeout:14000});}
   if([5,17,22].includes(i+1))await checkState(i+1);
  }
  report.final=await summary(page);assert.ok(report.states.every(s=>s.results.every(r=>r.state.finiteCamera)));fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2));console.log('BASELINE AUDIT COMPLETE');
 }catch(error){report.failure=error.stack||error.message;fs.writeFileSync(path.join(out,'audit-failure.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;}finally{await page.close();await browser.close();}
})();
