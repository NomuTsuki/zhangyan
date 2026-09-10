/* Read-only diagnostic helper. Product sources, old tests and rules are untouched.
 * Measurements are Node CPU boundaries, not browser rendering or GPU timings.
 */
import { performance } from 'node:perf_hooks';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { Session } from 'node:inspector/promises';
import os from 'node:os';
import { engine, derive, buildGraph, diffGraphs, resolveFocus } from '../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/engine.ts';
import { takeNewInvestigation } from '../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/action-state.mjs';
import { layoutMap, placeMapLabels } from '../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/map-layout.mjs';
import { roadTransitionPlan } from '../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/map-motion.mjs';

const here=dirname(fileURLToPath(import.meta.url)),base=resolve(here,'../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0');
mkdirSync(here,{recursive:true});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const source=readFileSync(resolve(base,'src/MapView.tsx'),'utf8');
const actualHitFunction=source.slice(source.indexOf('function routeHitPath('),source.indexOf('function RoadInk('));
const routeHitPath=Function(stripTypeScriptTypes(actualHitFunction,{mode:'strip'})+'; return routeHitPath;')();
const report={generatedAt:new Date().toISOString(),executor:'fusion_road_geometry',mode:'read-only Node diagnostic, no candidate product edits',
  environment:{node:process.version,platform:process.platform,cpu:os.cpus()[0].model,logicalCpus:os.cpus().length},
  sources:Object.fromEntries(['src/App.tsx','src/MapView.tsx','src/map-layout.mjs','src/engine.ts','src/map-motion.mjs','prototype.html'].map(p=>[p,sha(resolve(base,p))])),
  bounds:'Warm same-process CPU cost. Estimated label bounds proxy is not actual DOM measurement. routeHitPath is extracted verbatim from current TS and type-stripped. React reconciliation, browser layout, paint and GPU work are not timed.',states:[],transitions:[]};
const route=['A.OBSERVE.WHOLE','A.OBSERVE.BASE','A.LOCATE.HISTORIC_IMAGE','A.VERIFY.OBJECT_CONTINUITY','A.RESEARCH.ACCIDENT',
  'A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT',
  'A.IMAGE.XRAY','A.INSPECT.WINDOWS','A.CORROBORATE.ARCHIVE.T3_CURRENT','A.SYNTHESIZE.SURFACE_REGIONS','A.ANALYZE.MATERIAL.SUBSTRATE',
  'A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN','A.SCREEN.UV','A.OBSERVE.REGION_DECOR',
  'A.COMPARE.CORPUS','A.COMPARE.CORPUS.RECHECK','A.MAP.REGION_CONTINUITY'];
const options=id=>id==='A.MAP.REGION_CONTINUITY'?{comparisonBasis:'photo'}:{};
const snapshots=[structuredClone(engine.newSession())],s=engine.newSession();
for(const id of route){const r=takeNewInvestigation(s,id,options(id));if(!r.ok)throw Error(`${id}: ${r.why}`);snapshots.push(structuredClone(s));}
function measure(fn,count=20){
  fn();const values=[];let sink;
  for(let i=0;i<count;i++){const start=performance.now();sink=fn();values.push(performance.now()-start);}
  values.sort((a,b)=>a-b);
  return {runs:count,medianMs:values[Math.floor(count/2)],p95Ms:values[Math.ceil(count*.95)-1],minMs:values[0],maxMs:values.at(-1),meanMs:values.reduce((a,b)=>a+b,0)/count};
}
const loaded=new Map();
for(const count of [0,5,17,22]){
  const session=snapshots[count],model=derive(session),graph=model.graph,layout=layoutMap(graph);
  const measurements=Object.fromEntries([...layout.nodes.filter(n=>!n.box),...layout.frontiers,...layout.roadLabels].map(n=>[n.id,{width:n.labelWidth,height:n.labelHeight}]));
  loaded.set(count,{session,model,graph,layout,measurements});
  const selection=session.log.length?{kind:'evidence',id:session.log.at(-1).observationId}:null;
  const functions={solve:()=>engine.solve(session),buildGraph_from_solved:()=>buildGraph(model.solved,session),workbench:()=>engine.workbench(session),
    derive:()=>derive(session),resolveFocus:()=>resolveFocus(selection,model,session),
    layoutMap_including_estimated_labels:()=>layoutMap(graph),placeMapLabels_estimated:()=>placeMapLabels(layout,null),
    placeMapLabels_bounds_proxy:()=>placeMapLabels(layout,measurements),
    routeHitPath_all_routes:()=>layout.routes.map(routeHitPath),snapshot_structuredClone_layout:()=>structuredClone(layout)};
  const metrics=Object.fromEntries(Object.entries(functions).map(([name,fn])=>[name,measure(fn)]));
  const hitStrings=layout.routes.map(routeHitPath);
  report.states.push({actions:count,stage:model.solved.stage,nodes:graph.nodes.length,observations:graph.observations.length,edges:graph.edges.length,
    drawnRoutes:layout.routes.length,frontiers:layout.frontiers.length,labels:Object.keys(measurements).length,
    routeSamplePoints:layout.routes.reduce((n,r)=>n+r.samples.length,0),frontierSamplePoints:Object.values(layout._state.frontierRoads).flat().reduce((n,r)=>n+r.samples.length,0),
    compactCurveCharacters:layout.routes.reduce((n,r)=>n+r.d.length,0),hitPolylineCharacters:hitStrings.reduce((n,d)=>n+d.length,0),
    labelBoundsProxy:'Current estimated labelWidth/labelHeight; real DOM figures belong to root browser trace',metrics});
}
function performCore(previous,actionId){
  const next=structuredClone(previous),before=buildGraph(engine.solve(previous),previous);
  const result=takeNewInvestigation(next,actionId,options(actionId));if(!result.ok)throw Error(result.why);
  const after=buildGraph(engine.solve(next),next),changes=diffGraphs(before,after);
  return {next,before,after,changes};
}
for(const at of [1,5,17,22]){
  const before=snapshots[at-1],action=route[at-1],core=performCore(before,action),newModel=derive(core.next),afterLayout=layoutMap(newModel.graph),beforeLayout=layoutMap(core.before);
  const dimensions=Object.fromEntries([...afterLayout.nodes.filter(n=>!n.box),...afterLayout.frontiers,...afterLayout.roadLabels].map(n=>[n.id,{width:n.labelWidth,height:n.labelHeight}]));
  const operations={perform_core:()=>performCore(before,action),derive_after:()=>derive(core.next),layout_after:()=>layoutMap(core.after),
    measurement_label_pass_proxy:()=>placeMapLabels(afterLayout,dimensions),beforeLayout_for_animation:()=>layoutMap(core.before),
    roadTransitionPlan:()=>roadTransitionPlan(core.after,afterLayout,beforeLayout,core.changes),
    synchronous_chain_excluding_DOM_and_React:()=>{const c=performCore(before,action),m=derive(c.next),l=layoutMap(m.graph);placeMapLabels(l,dimensions);const b=layoutMap(c.before);return roadTransitionPlan(m.graph,l,b,c.changes);}};
  report.transitions.push({enteringAction:at,action,metrics:Object.fromEntries(Object.entries(operations).map(([name,fn])=>[name,measure(fn,12)]))});
}
// Profile only the measured label/layout path, after timings above are complete.
const inspector=new Session();inspector.connect();await inspector.post('Profiler.enable');await inspector.post('Profiler.setSamplingInterval',{interval:1000});await inspector.post('Profiler.start');
const full=loaded.get(22);for(let i=0;i<35;i++){layoutMap(full.graph);placeMapLabels(full.layout,full.measurements);}
const {profile}=await inspector.post('Profiler.stop');inspector.disconnect();
writeFileSync(resolve(here,'layout-labels.cpuprofile'),JSON.stringify(profile),'utf8');
const nodes=new Map(profile.nodes.map(n=>[n.id,n])),self=new Map();
for(let i=0;i<(profile.samples??[]).length;i++){const id=profile.samples[i];self.set(id,(self.get(id)||0)+(profile.timeDeltas?.[i]??1000));}
report.profile={scope:'35 x (layoutMap full 22-action graph + placeMapLabels same estimated-bounds proxy)',totalSampledMs:[...self.values()].reduce((a,b)=>a+b,0)/1000,
  topSelf:[...self].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([id,micros])=>({function:nodes.get(id).callFrame.functionName||'(anonymous)',file:nodes.get(id).callFrame.url,line:nodes.get(id).callFrame.lineNumber+1,selfMs:micros/1000}))};
writeFileSync(resolve(here,'node-performance.json'),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify({output:resolve(here,'node-performance.json'),states:report.states.map(s=>({actions:s.actions,nodes:s.nodes,routes:s.drawnRoutes,samples:s.routeSamplePoints,hitChars:s.hitPolylineCharacters,medianMs:Object.fromEntries(Object.entries(s.metrics).map(([k,v])=>[k,+v.medianMs.toFixed(3)]))})),
  transitions:report.transitions.map(t=>({entering:t.enteringAction,medianMs:Object.fromEntries(Object.entries(t.metrics).map(([k,v])=>[k,+v.medianMs.toFixed(3)]))})),profile:report.profile},null,2));
