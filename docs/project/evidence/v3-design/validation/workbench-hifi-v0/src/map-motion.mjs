/** Experimental timing follows actual route dependencies, never a solved path. */
export const MOTION = Object.freeze({ flight:850, focus:600, hold:420, pullback:950,
  correspondence:1800, support:1700, longSupport:2300, junctionOutput:850, settle:260 });

export function intervalDifference(after = [{from:0,to:1}], before = []) {
  let output=after.map(part=>({...part}));
  for(const old of before)output=output.flatMap(part=>{
    if(old.to<=part.from||old.from>=part.to)return [part];
    return [...(old.from>part.from?[{from:part.from,to:old.from}]:[]),
      ...(old.to<part.to?[{from:old.to,to:part.to}]:[])];
  });
  return output.filter(part=>part.to-part.from>.00001);
}

export function roadTransitionPlan(graph,layout,beforeLayout,changes) {
  const old=new Map((beforeLayout?.routes||[]).map(r=>[r.id,r]));
  const changedIds=new Set([...(changes?.addedEdgeIds||[]),...(changes?.changedEdgeIds||[])]);
  const routes=layout.routes.filter(r=>!old.has(r.id)||r.edgeIds.some(id=>changedIds.has(id)));
  const correspondence=routes.filter(r=>r.kind!=='support');
  const baseDelay=correspondence.length?MOTION.correspondence+140:0;
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
    const start=r.kind==='support'?Math.max(baseDelay,ready(r.from)):0;
    const duration=r.kind!=='support'?MOTION.correspondence:fromJoint&&length<240?MOTION.junctionOutput:length>520?MOTION.longSupport:MOTION.support;
    const previous=old.get(r.id),visible=r.visibleSegments||[{from:0,to:1}],prior=previous?(previous.visibleSegments||[{from:0,to:1}]):[];
    const growth=intervalDifference(visible,prior);
    const item={id:r.id,start,duration,end:start+duration,priorSegments:prior,growthSegments:growth.length?growth:visible,
      enhanced:!!previous,both:r.kind!=='support'&&!previous};
    resolving.delete(r.id);memo.set(r.id,item);return item;
  }
  routes.forEach(schedule);
  const nodeDelays=Object.fromEntries([...derived].map(id=>[id,ready(id)]));
  const oldJoints=new Set((beforeLayout?.junctions||[]).map(j=>j.id));
  const junctionDelays=Object.fromEntries([...joints].filter(id=>!oldJoints.has(id)).map(id=>[id,ready(id)]));
  return {routes:Object.fromEntries(memo),nodeDelays,junctionDelays,
    duration:Math.max(0,...[...memo.values()].map(r=>r.end))+MOTION.settle};
}
