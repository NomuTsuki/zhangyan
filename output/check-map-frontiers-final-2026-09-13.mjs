// review required: read-only presentation audit; no source, session rules or baseline is changed.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {engine,derive,diffGraphs} from '../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/engine.ts';
import {layoutMap} from '../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/map-layout.mjs';
import {roadTransitionPlan} from '../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/map-motion.mjs';
import {ACTIONS} from '../docs/project/evidence/v3-design/validation/workbench-map-fusion-v0/local-case.mjs';
const out='output/playwright/frontier-system-repair-final-2026-09-13';await mkdir(out,{recursive:true});
const file='docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html';
const report={buildSha256:createHash('sha256').update(await readFile(file)).digest('hex'),readOnly:true,orders:0,transitions:0,uniqueTransitions:0,frontiers:{},retirements:[],directionMismatches:[],unsupportedRetirements:[]};
const seen=new Set(),retired=new Set(),directions=new Set();
const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',MAT:'A.ANALYZE.MATERIAL.SUBSTRATE',LAYER:'A.INSPECT.MATERIAL.LAYER_SEQUENCE',UV:'A.SCREEN.UV',POINT:'A.INSPECT.WINDOWS',SURF:'A.SYNTHESIZE.SURFACE_REGIONS',DECOR:'A.OBSERVE.REGION_DECOR',X:'A.IMAGE.XRAY',T2:'A.RESEARCH.ACCIDENT',T3:'A.RESEARCH.LATE_TREATMENT',P:'A.LOCATE.HISTORIC_IMAGE',C:'A.VERIFY.OBJECT_CONTINUITY',CMP:'A.MAP.REGION_CONTINUITY',CORP:'A.COMPARE.CORPUS'};
const model=s=>{const m=derive(s);return {g:m.graph,l:layoutMap(m.graph),solved:m.solved};};
const sig=s=>s.acquired.map(x=>x.observationId).sort().join('|');
function record(before,after,action,route){
 report.transitions++;const key=before.signature+'>'+action.id+':'+action.basis;if(seen.has(key))return;seen.add(key);report.uniqueTransitions++;
 const changes=diffGraphs(before.g,after.g),plan=roadTransitionPlan(after.g,after.l,before.l,changes);
 for(const f of before.l.frontiers){const entry=report.frontiers[f.id]??={title:f.title,states:0,canonical:false,open:false,declaredTargets:new Set(),retireActions:new Set()};entry.states++;entry.canonical||=f.segments.some(s=>!!s.canonicalRouteId);entry.open||=f.segments.some(s=>!s.canonicalRouteId);for(const id of f.continuation?.nodeIds??[])entry.declaredTargets.add(id);
  const retirement=plan.retiring.find(r=>r.frontier.id===f.id),gone=!after.g.frontiers.some(r=>r.id===f.id);
  if(!gone)continue;entry.retireActions.add(action.id);
  if(!retirement?.successorRouteIds?.length&&!plan.handovers.some(h=>h.frontierId===f.id))report.unsupportedRetirements.push({frontier:f.id,action,route:[...route]});
  const matches=f.segments.map(s=>s.canonicalRouteId).filter(Boolean),ink=[...after.l.routes,...plan.transferRoutes].filter(r=>matches.includes(r.id));
  const summary={frontier:f.id,title:f.title,action,route:[...route],anchorIds:f.anchorIds,declaredNextNodeIds:f.continuation?.nodeIds??[],canonicalRouteIds:matches,retireAt:retirement?.retireAt??null,newNodeIds:changes.addedNodeIds,newEdgeIds:changes.addedEdgeIds,matchingRoadIds:ink.map(r=>r.id)};
  const retireKey=f.id+'|'+action.id+'|'+summary.retireAt+'|'+f.anchorIds.join('|');if(!retired.has(retireKey)){retired.add(retireKey);report.retirements.push(summary);}
  const acquiredNode=after.l.nodes.find(n=>n.id===action.observationId);
  if(!acquiredNode)continue;
  for(const path of before.l._state.frontierRoads[f.id]??[]){const anchor=before.l.nodes.find(n=>n.id===path.from);if(!anchor)continue;let points=path.samples;const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);if(dist(points[0],anchor)>dist(points.at(-1),anchor))points=[...points].reverse();const first=points[0],end=points.at(-1),startDistance=dist(first,acquiredNode),endDistance=dist(end,acquiredNode);if(endDistance>startDistance+1){const dk=f.id+'|'+action.observationId+'|'+path.from;if(!directions.has(dk)){directions.add(dk);report.directionMismatches.push({...summary,anchor:{id:anchor.id,x:anchor.x,y:anchor.y},target:{id:acquiredNode.id,x:acquiredNode.x,y:acquiredNode.y},pathStart:first,pathEnd:end,startDistance,endDistance});}}}
 }
}
function run(priority=[],seed=1,basis='photo'){
 const s=engine.newSession(),route=[];let previous={...model(s),signature:sig(s)},rng=seed;const ranks=new Map(priority.map((id,i)=>[id,i]));
 while(s.log.length<22){const candidates=engine.workbench(s).filter(r=>r.usable&&!r.done).map(row=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return{row,rank:ranks.get(row.action.id)??100+rng/2**32};}).sort((a,b)=>a.rank-b.rank);if(!candidates.length)break;const row=candidates[0].row,choice=row.comparisonOptions?.find(o=>o.id===basis&&o.usable)?.id??row.comparisonOptions?.find(o=>o.usable)?.id;const result=engine.take(s,row.action.id,choice?{comparisonBasis:choice}:{});if(!result.ok)throw Error('Illegal audit route');const action={id:row.action.id,basis:choice,observationId:result.observationId};route.push(action);const next={...model(s),signature:sig(s)};record(previous,next,action,route);previous=next;}
 report.orders++;
}
const targeted=[[A.LAYER,A.MAT],[A.MAT,A.LAYER],[A.UV,A.POINT,A.SURF],[A.W,A.DECOR,A.POINT],[A.W,A.X],[A.W,A.T2],[A.W,A.B,A.CORP],[A.P,A.B,A.C,A.X,A.W,A.CMP],[A.T2,'A.RELATE.ARCHIVE.T2_TO_OBJECT'],[A.T3,'A.CORROBORATE.ARCHIVE.T3_CURRENT']];
for(const [i,priority] of targeted.entries())run(priority,i+1,i%2?'photo':'archive');
for(const action of ACTIONS)run([action.id],report.orders+101,report.orders%2?'photo':'archive');
for(let seed=1;seed<=16;seed++)run([],seed*7919,seed%2?'photo':'archive');
for(const f of Object.values(report.frontiers)){f.declaredTargets=[...f.declaredTargets];f.retireActions=[...f.retireActions];}
report.summary={frontierIds:Object.keys(report.frontiers).length,retirementVariants:report.retirements.length,immediateVariants:report.retirements.filter(r=>r.retireAt===0).length,misdirectedVariants:report.directionMismatches.length,unsupportedRetirements:report.unsupportedRetirements.length};
await writeFile(out+'/sweep.json',JSON.stringify(report,null,2));console.log(JSON.stringify({orders:report.orders,transitions:report.transitions,unique:report.uniqueTransitions,...report.summary}));
if(report.summary.immediateVariants||report.unsupportedRetirements.length)process.exitCode=1;
