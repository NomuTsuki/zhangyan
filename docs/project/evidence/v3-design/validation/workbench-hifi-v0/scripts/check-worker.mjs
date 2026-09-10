/* review required: new asynchronous computation contract checks.
 * Frozen sources and existing tests remain unchanged. Real worker threads run
 * the actual worker entry; browser file:// packaging is a separate UI check.
 */
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';
import { readFile } from 'node:fs/promises';
import { BackgroundEngine } from '../src/engine-client.mjs';
import { engine, derive } from '../src/engine.ts';
import { takeNewInvestigation } from '../src/action-state.mjs';

class Adapter {
  onmessage=null;onerror=null;
  constructor(){this.thread=new Worker(new URL('./worker-node-adapter.mjs',import.meta.url));this.thread.on('message',data=>this.onmessage?.({data}));this.thread.on('error',error=>this.onerror?.(error));}
  postMessage(message){this.thread.postMessage(message);}
  terminate(){void this.thread.terminate();}
}
const makeClient=()=>new BackgroundEngine(()=>new Adapter());
const route=['A.OBSERVE.WHOLE','A.OBSERVE.BASE','A.LOCATE.HISTORIC_IMAGE','A.VERIFY.OBJECT_CONTINUITY','A.RESEARCH.ACCIDENT',
  'A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT',
  'A.IMAGE.XRAY','A.INSPECT.WINDOWS','A.CORROBORATE.ARCHIVE.T3_CURRENT','A.SYNTHESIZE.SURFACE_REGIONS','A.ANALYZE.MATERIAL.SUBSTRATE',
  'A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'];
const results=[];
async function check(name,run){try{results.push({name,passed:true,evidence:await run()});}catch(error){results.push({name,passed:false,error:error.stack});}}
async function acquire(client,ids){let r=await client.reset();for(const actionId of ids){r=await client.request('take',{actionId,expectedRevision:r.revision});assert.equal(r.result.ok,true,r.result.why);}return r;}

await check('UI has no synchronous solver, derive, replay or take calls',async()=>{
  const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(app,/\bengine\.(solve|workbench|take|replayLog|newSession|setBudget)\s*\(/);
  assert.doesNotMatch(app,/\b(?:derive|buildGraph|takeNewInvestigation)\s*\(/);
  assert.match(app,/worker&inline/);assert.match(app,/pending\.current=true/);assert.match(app,/viewVersion===viewRequest\.current/);
  return{offlinePackaging:'Vite inline worker import',uiCalls:'snapshot + read-only selection only'};
});
await check('Real Worker yields a serializable equivalent 17-step model and keeps parent responsive on cold solve',async()=>{
  const client=makeClient();try{
    let r=await acquire(client,route.slice(0,16));
    let ticks=0,last=performance.now(),maxGap=0;const timer=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;ticks++;},10);
    const start=performance.now();r=await client.request('take',{actionId:route[16],expectedRevision:r.revision});clearInterval(timer);const elapsed=performance.now()-start;
    assert.equal(r.result.ok,true);assert.ok(ticks>2,'Parent event loop must continue during expensive worker computation');assert.equal(r.session.log.length,17);assert.equal(r.model.solved.stage,'G3');
    structuredClone(r);assert.ok(r.model.rows.every(row=>typeof row.action.outcome==='undefined'));
    const mirror=engine.newSession();for(const id of route)assert.equal(takeNewInvestigation(mirror,id).ok,true);
    const expected=derive(mirror);assert.deepEqual(r.session,mirror);assert.deepEqual(r.model.solved,expected.solved);assert.deepEqual(r.model.graph,expected.graph);
    return{actions:17,stage:r.model.solved.stage,workerElapsedMs:elapsed,parentHeartbeatTicks:ticks,maxParentHeartbeatGapMs:maxGap,realSessionAndGraphEqual:true};
  }finally{client.dispose();}
});
await check('History and stop queued behind accepted take preserve its single charge and result',async()=>{
  const client=makeClient();try{
    const before=await acquire(client,route.slice(0,4));
    const taking=client.request('take',{actionId:route[4],expectedRevision:before.revision});
    const viewing=client.request('view',{historyIndex:2});const stopping=client.request('stop');
    const [taken,past,stopped]=await Promise.all([taking,viewing,stopping]);
    assert.equal(taken.session.log.length,5);assert.equal(past.session.log.length,5);assert.equal(past.viewSession.log.length,2);assert.equal(past.historyIndex,2);
    assert.equal(stopped.session.stopped,true);assert.equal(stopped.session.log.length,5);assert.deepEqual(stopped.session.billed,taken.session.billed);
    assert.equal(stopped.model.solved.stopping.playerChoice,'STOP');
    const current=await client.request('view',{historyIndex:null});assert.equal(current.historyIndex,null);assert.equal(current.session.stopped,true);
    const rejected=await client.request('take',{actionId:'A.SCREEN.UV',expectedRevision:current.revision});assert.equal(rejected.result.ok,false);assert.equal(rejected.session.log.length,5);
    return{historyLength:2,liveLength:5,stoppedAfterAcceptedTake:true,billed:stopped.session.billed};
  }finally{client.dispose();}
});
await check('Duplicate actions and stale revisions do not charge; a distinct comparison basis remains new',async()=>{
  const client=makeClient();try{
    let r=await acquire(client,[...route.slice(0,6),'A.IMAGE.XRAY']);const count=r.session.log.length,prior=r.revision;
    let rejected=await client.request('take',{actionId:route[0],expectedRevision:r.revision});assert.equal(rejected.result.alreadyDone,true);assert.equal(rejected.session.log.length,count);
    r=await client.request('take',{actionId:'A.MAP.REGION_CONTINUITY',options:{comparisonBasis:'photo'},expectedRevision:r.revision});assert.equal(r.result.ok,true);
    rejected=await client.request('take',{actionId:'A.SCREEN.UV',expectedRevision:prior});assert.equal(rejected.result.stale,true);assert.equal(rejected.session.log.length,count+1);
    r=await client.request('take',{actionId:'A.MAP.REGION_CONTINUITY',options:{comparisonBasis:'archive'},expectedRevision:r.revision});assert.equal(r.result.ok,true);
    assert.deepEqual(r.session.log.filter(e=>e.comparisonBasis).map(e=>e.comparisonBasis),['photo','archive']);
    return{initialActions:count,finalActions:r.session.log.length,bases:['photo','archive']};
  }finally{client.dispose();}
});
await check('Restart terminates a real cold computation and returns an unpolluted empty generation',async()=>{
  const client=makeClient();try{
    const ready=await acquire(client,route.slice(0,16));const generation=client.generation;
    const pending=client.request('take',{actionId:route[16],expectedRevision:ready.revision}).then(()=>({completed:true}),error=>({name:error.name}));
    await new Promise(resolve=>setTimeout(resolve,20));const empty=await client.reset(12),old=await pending;
    assert.equal(old.name,'AbortError');assert.equal(client.generation,generation+1);assert.equal(empty.session.log.length,0);assert.equal(empty.session.budget,12);
    const current=await client.request('view');assert.deepEqual(current.session,empty.session);
    return{oldRequest:old.name,newActions:0,budget:12,generation:client.generation};
  }finally{client.dispose();}
});
await check('A transport callback from a terminated generation cannot satisfy a new promise',async()=>{
  const transports=[],client=new BackgroundEngine(()=>{const t={messages:[],postMessage(m){this.messages.push(m);},terminate(){}};transports.push(t);return t;});
  try{
    const first=client.reset();transports[0].onmessage({data:{id:transports[0].messages[0].id,ok:true,value:{revision:1}}});await first;
    const oldHandler=transports[0].onmessage,pending=client.request('view').catch(error=>error.name);
    let fulfilled=false;const next=client.reset().then(value=>{fulfilled=true;return value;});assert.equal(await pending,'AbortError');
    const newId=transports[1].messages[0].id;oldHandler({data:{id:newId,ok:true,value:{polluted:true}}});await Promise.resolve();assert.equal(fulfilled,false);
    transports[1].onmessage({data:{id:newId,ok:true,value:{empty:true}}});assert.deepEqual(await next,{empty:true});return{lateGenerationIgnored:true};
  }finally{client.dispose();}
});
await check('Actual worker request-ID deduplication returns one charged investigation',async()=>{
  const adapter=new Adapter();let receive;
  adapter.onmessage=e=>receive?.(e.data);const ask=message=>new Promise(resolve=>{receive=resolve;adapter.postMessage(message);});
  try{
    await ask({id:1,command:'init',payload:{budget:22}});
    const message={id:2,command:'take',payload:{actionId:route[0]}},first=await ask(message),second=await ask(message);
    assert.deepEqual(second,first);assert.equal(second.value.session.log.length,1);return{sameResponse:true,chargedActions:1};
  }finally{adapter.terminate();}
});
console.log(JSON.stringify({reviewRequired:true,passed:results.every(r=>r.passed),total:results.length,results,
  boundary:'Real Node worker-thread and transport contract evidence; browser responsiveness, map camera behavior and file:// inline worker startup require the separate browser run.'},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
