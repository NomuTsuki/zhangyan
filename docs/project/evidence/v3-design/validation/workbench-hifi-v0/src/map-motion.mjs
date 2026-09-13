/** Experimental timing follows actual route dependencies, never a solved path. */
import { reportTransferGeometry,frontierHandoverGeometry } from './map-layout.mjs';
export const MOTION = Object.freeze({ flight:850, focus:600, hold:420, pullback:950,
  correspondence:1800, support:1700, longSupport:2300, junctionOutput:850, frontier:900, settle:260 });

export function intervalDifference(after = [{from:0,to:1}], before = []) {
  let output=after.map(part=>({...part}));
  for(const old of before)output=output.flatMap(part=>{
    if(old.to<=part.from||old.from>=part.to)return [part];
    return [...(old.from>part.from?[{from:part.from,to:old.from}]:[]),
      ...(old.to<part.to?[{from:old.to,to:part.to}]:[])];
  });
  return output.filter(part=>part.to-part.from>.00001);
}

const frontierSignature = f => JSON.stringify({title:f.title,anchors:f.anchorIds,segments:f.segments});
/** A question can grow only from anchors which have actually appeared. */
export function frontierTransitionPlan(layout,beforeLayout,nodeDelays={},routes={}) {
  const old=new Map((beforeLayout?.frontiers||[]).map(f=>[f.id,f]));
  const current=new Map(layout.frontiers.map(f=>[f.id,f]));
  const frontiers={};
  for(const f of layout.frontiers){
    const previous=old.get(f.id);
    if(previous&&frontierSignature(previous)===frontierSignature(f))continue;
    const sourceReady=Object.values(routes).filter(r=>r.continuityTargetIds?.some(id=>f.anchorIds.includes(id))).map(r=>r.end+MOTION.settle);
    const start=Math.max(0,...sourceReady,...f.anchorIds.map(id=>nodeDelays[id]===undefined?0:nodeDelays[id]+240));
    const segments=f.segments.map(s=>{
      const prior=(previous?.segments||[]).filter(p=>p.d===s.d).map(p=>({from:Math.max(p.from,s.from),to:Math.min(p.to,s.to)})).filter(p=>p.to>p.from);
      return {...s,prior,growth:intervalDifference([{from:s.from,to:s.to}],prior)};
    });
    frontiers[f.id]={start,duration:MOTION.frontier,end:start+MOTION.frontier,segments};
  }
  const handovers=[];
  const retiring=(beforeLayout?.frontiers||[]).filter(f=>!current.has(f.id)||frontiers[f.id]).map(f=>{
    const next=current.get(f.id),replacement=frontiers[f.id],ids=new Set([...(f.successorRouteIds||[]),...f.segments.map(s=>s.canonicalRouteId)]);
    const related=Object.values(routes).filter(r=>ids.has(r.id)||(f.continuity?.completionTargets||[]).includes(r.to));
    let end=Math.max(0,...related.map(r=>r.end));
    // A relocated frontier or alternative route needs a visible handover,
    // not an instantaneous substitution of unrelated SVG paths.
    const matchingInk=related.some(r=>f.segments.some(s=>s.d===r.d));
    const destination=next||(related.length?layout.nodes.find(n=>related.some(r=>r.to===n.id))||layout.routes.find(r=>related.some(p=>p.id===r.id))?.midpoint:null);
    if(!matchingInk&&destination){
      const geometry=frontierHandoverGeometry(f,destination);
      if(geometry){const start=0,duration=MOTION.correspondence;handovers.push({id:`handover:${f.id}`,frontierId:f.id,...geometry,start,duration,end:start+duration});end=Math.max(end,start+duration);}
    }
    // A non-topological boundary/record update has no promised answer road.
    // Keep it through the resulting material's reading beat, never retire at 0.
    if(!end)end=Math.max(MOTION.frontier,...Object.values(nodeDelays));
    if(replacement){replacement.start=Math.max(replacement.start,end+MOTION.settle);replacement.end=replacement.start+replacement.duration;}
    return {frontier:f,retireAt:end,labelRetireAt:replacement?replacement.end:end,successorRouteIds:related.map(r=>r.id)};
  });
  return {frontiers,retiring,handovers};
}

export function roadTransitionPlan(graph,layout,beforeLayout,changes) {
  const old=new Map((beforeLayout?.routes||[]).map(r=>[r.id,r]));
  const reportTransfers=(layout.reportMarkers??[]).flatMap(marker=>{
    const node=beforeLayout?.nodes.find(n=>n.id===marker.reportId);
    return node?[{...marker,fromNode:node,...reportTransferGeometry(marker.reportId,marker)}]:[];
  });
  const transferRoutes=reportTransfers.map(t=>t.sourceRoute);
  const changedIds=new Set([...(changes?.addedEdgeIds||[]),...(changes?.changedEdgeIds||[])]);
  const routes=[...layout.routes,...transferRoutes].filter(r=>!old.has(r.id)||r.edgeIds.some(id=>changedIds.has(id)));
  const correspondence=routes.filter(r=>r.kind!=='support');
  const sourceDelay=routes.some(r=>r.kind==='source-record')?MOTION.correspondence+MOTION.settle:0;
  const incoming=new Map();
  for(const r of routes){if(!incoming.has(r.to))incoming.set(r.to,[]);incoming.get(r.to).push(r);}
  const freshNodes=new Set(changes?.addedNodeIds||[]);
  const derived=new Set(graph.nodes.filter(n=>freshNodes.has(n.id)&&['claim','interpretation'].includes(n.kind)).map(n=>n.id));
  const joints=new Set(layout.junctions.map(j=>j.id));
  const memo=new Map(),resolving=new Set();
  const ready=id=>{
    if(!derived.has(id)&&!joints.has(id))return 0;
    return Math.max(0,...(incoming.get(id)||[]).map(r=>schedule(r).end));
  };
  function schedule(r){
    if(memo.has(r.id))return memo.get(r.id);
    if(resolving.has(r.id))throw Error('Cyclic support routes cannot be animated as dependencies');
    resolving.add(r.id);
    const fromJoint=joints.has(r.from),length=(r.samples||[]).slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-r.samples[i].x,p.y-r.samples[i].y),0);
    const baseDelay=()=>correspondence.length?Math.max(...correspondence.map(r=>schedule(r).end))+140:0;
    const start=r.kind==='support'?Math.max(baseDelay(),ready(r.from)):
      reportTransfers.some(t=>t.carrierEdgeId===r.id)?sourceDelay:0;
    const duration=r.kind!=='support'?MOTION.correspondence:fromJoint&&length<240?MOTION.junctionOutput:length>520?MOTION.longSupport:MOTION.support;
    const previous=old.get(r.id),visible=r.visibleSegments||[{from:0,to:1}],prior=previous?(previous.visibleSegments||[{from:0,to:1}]):[];
    const growth=intervalDifference(visible,prior);
    const reverse=['source-record','enquiry'].includes(r.kind)&&!!beforeLayout?.nodes.some(n=>n.id===r.to)&&!beforeLayout?.nodes.some(n=>n.id===r.from);
    const item={id:r.id,from:r.from,to:r.to,d:r.d,start,duration,end:start+duration,priorSegments:prior,growthSegments:growth.length?growth:visible,reverse,
      enhanced:!!previous,both:r.kind!=='support'&&r.kind!=='source-record'&&!previous,
      ...(['source-record','enquiry'].includes(r.kind)?{both:false,continuityTargetIds:reverse?[r.from]:[r.to]}:{}),
      ...(r.kind==='source-record'?{sourceRecordId:r.to}:{})};
    resolving.delete(r.id);memo.set(r.id,item);return item;
  }
  routes.forEach(schedule);
  const nodeDelays=Object.fromEntries([...derived].map(id=>[id,ready(id)]));
  const oldJoints=new Set((beforeLayout?.junctions||[]).map(j=>j.id));
  const junctionDelays=Object.fromEntries([...joints].filter(id=>!oldJoints.has(id)).map(id=>[id,ready(id)]));
  const routePlan=Object.fromEntries(memo),questions=frontierTransitionPlan(layout,beforeLayout,nodeDelays,routePlan);
  for(const transfer of reportTransfers){
    transfer.start=Math.max(routePlan[transfer.sourceRoute.id]?.end??0,routePlan[transfer.carrierEdgeId]?.end??0)+MOTION.settle;
    transfer.duration=MOTION.correspondence;transfer.end=transfer.start+transfer.duration;
  }
  return {routes:routePlan,nodeDelays,junctionDelays,...questions,reportTransfers,transferRoutes,
    duration:Math.max(0,...[...memo.values()].map(r=>r.end),...Object.values(questions.frontiers).map(f=>f.end),...questions.retiring.map(f=>f.retireAt+160),...reportTransfers.map(t=>t.end))+MOTION.settle};
}
