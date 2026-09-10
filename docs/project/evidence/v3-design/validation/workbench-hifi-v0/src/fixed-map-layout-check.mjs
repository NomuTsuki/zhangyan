/* review required: new presentation checks for the user-approved fixed skeleton.
 * These checks use the real fusion session/graph. No old baseline is modified.
 * Geometry evidence is not a human readability or full browser acceptance claim.
 */
import assert from 'node:assert/strict';
import { newSession, take, solve, workbench } from '../../workbench-map-fusion-v0/local-session.mjs';
import { buildGraph } from '../../workbench-map-fusion-v0/graph.mjs';
import { layoutMap, placeMapLabels } from './map-layout.mjs';
const A = { W:'A.OBSERVE.WHOLE', B:'A.OBSERVE.BASE', P:'A.LOCATE.HISTORIC_IMAGE', C:'A.VERIFY.OBJECT_CONTINUITY',
  X:'A.IMAGE.XRAY', T2:'A.RESEARCH.ACCIDENT', T2A:'A.RELATE.ARCHIVE.T2_TO_OBJECT', T2C:'A.CORROBORATE.ARCHIVE.T2_CURRENT',
  POINT:'A.INSPECT.WINDOWS', SURF:'A.SYNTHESIZE.SURFACE_REGIONS', UV:'A.ILLUMINATE.UV' };
const results = [];
function step(s, id, options) { const r = take(s,id,options); assert.equal(r.ok,true,`${id}: ${r.why}`); return r; }
function graph(s) { return buildGraph(solve(s),s); }
function run(ids) { const s = newSession(); let l = null; for(const id of ids) { step(s,id); l=layoutMap(graph(s),l); } return {s,l,g:graph(s)}; }
function sameGeometry(l) { return { nodes:l.nodes.map(n=>({id:n.id,x:n.x,y:n.y})),
  routes:l.routes.map(r=>({id:r.id,d:r.d})),junctions:l.junctions.map(j=>({id:j.id,x:j.x,y:j.y})) }; }
function check(name, fn) { try { results.push({name,passed:true,evidence:fn()}); } catch(e) { results.push({name,passed:false,error:e.stack}); } }
function parseSamples(d) {
  const commands=d.match(/[MC][^MC]*/g)??[], samples=[]; let cursor;
  for(const command of commands) {
    const n=command.slice(1).trim().split(/[ ,]+/).map(Number);
    if(command[0]==='M'){cursor={x:n[0],y:n[1]};samples.push(cursor);continue;}
    const a={x:n[0],y:n[1]},b={x:n[2],y:n[3]},end={x:n[4],y:n[5]},start=cursor;
    const count=Math.ceil(Math.hypot(a.x-start.x,a.y-start.y)+Math.hypot(b.x-a.x,b.y-a.y)+Math.hypot(end.x-b.x,end.y-b.y));
    for(let i=1;i<=count;i++){const t=i/count,u=1-t;samples.push({x:u**3*start.x+3*u*u*t*a.x+3*u*t*t*b.x+t**3*end.x,y:u**3*start.y+3*u*u*t*a.y+3*u*t*t*b.y+t**3*end.y});}
    cursor=end;
  } return samples;
}
function pathCollisions(l) {
  const collisions=[];
  for(const route of l.routes){const samples=parseSamples(route.d);for(const n of [...l.nodes,...l.junctions]){
    if(n.id===route.from||n.id===route.to)continue;
    if(samples.some(p=>n.box?Math.abs(p.x-n.x)<n.box.w/2-.05&&Math.abs(p.y-n.y)<n.box.h/2-.05:n.isJunction?Math.abs(p.x-n.x)+Math.abs(p.y-n.y)<8.25-.05:Math.hypot(p.x-n.x,p.y-n.y)<9.75-.05))collisions.push([route.id,n.id]);
  }}return collisions;
}
check('Empty graph reveals no fixed slots, roads or judgments',()=>{
  const l=layoutMap(graph(newSession()));assert.equal(l.nodes.length,0);assert.equal(l.routes.length,0);assert.equal(l.junctions.length,0);return{nodes:0};
});
check('Different legal discovery orders and a fresh final projection have identical geometry',()=>{
  const a=run([A.W,A.B,A.P,A.C]),b=run([A.P,A.B,A.W,A.C]);
  assert.deepEqual(sameGeometry(a.l),sameGeometry(b.l));assert.deepEqual(sameGeometry(a.l),sameGeometry(layoutMap(a.g)));
  const measured=Object.fromEntries(a.l.nodes.filter(n=>!n.box).map(n=>[n.id,{width:230,height:100}]));
  assert.deepEqual(sameGeometry(placeMapLabels(a.l,measured,b.l)),sameGeometry(a.l));
  return{nodes:a.l.nodes.length,routes:a.l.routes.length,measurementsCannotMoveRoads:true};
});
check('Photo gap exposes two masks of the exact later correspondence curve',()=>{
  const {s,l}=run([A.P,A.B]);const gap=l.frontiers.find(f=>f.id==='question:photo-object');assert.equal(gap.segments.length,2);
  step(s,A.C);const next=layoutMap(graph(s),l),r=next.routes.find(r=>r.id==='photo:object');
  gap.segments.forEach(segment=>assert.equal(segment.d,r.d));assert.deepEqual(gap.segments.map(s=>[s.from,s.to]),[[0,.43],[.57,1]]);
  for(const old of l.nodes){const n=next.nodes.find(n=>n.id===old.id);assert.deepEqual([n.x,n.y],[old.x,old.y]);}
  assert.ok(!next.frontiers.some(f=>f.id===gap.id));return{canonicalRoad:r.id,oldNodesStable:true};
});
check('Archive attribution and corroboration establish separate same-curve halves in either order',()=>{
  const outcomes=[];
  for(const order of [[A.T2A,A.T2C],[A.T2C,A.T2A]]) {
    const {s,l}=run([A.W,A.T2]);const gaps=l.frontiers.filter(f=>f.canonicalRouteId==='archive:t2:object');assert.equal(gaps.length,2);
    assert.equal(gaps[0].segments[0].d,gaps[1].segments[0].d);
    step(s,order[0]);const first=layoutMap(graph(s),l),r=first.routes.find(r=>r.id==='archive:t2:object');
    assert.equal(r.visibleSegments.length,1);const expected=order[0]===A.T2A?[0,.485]:[.515,1];assert.deepEqual(Object.values(r.visibleSegments[0]),expected);
    const waiting=first.frontiers.find(f=>f.canonicalRouteId===r.id);assert.equal(waiting.segments[0].d,r.d);
    step(s,order[1]);const last=layoutMap(graph(s),first),connected=last.routes.find(r=>r.id==='archive:t2:object');
    assert.equal(connected.d,r.d);assert.deepEqual(connected.visibleSegments,[{from:0,to:1}]);assert.equal(connected.labels.length,2);
    outcomes.push({first:order[0],visible:expected,labelsAvoidEachOther:last.diagnostics.labelOverlaps.length===0});
  }return outcomes;
});
check('One-ended surface frontier follows its later support curve without revealing the result',()=>{
  const {s,l}=run([A.POINT]);const f=l.frontiers.find(f=>f.id==='question:surface');assert.ok(f);assert.ok(!l.nodes.some(n=>n.id==='obs.surface.resolved'));
  step(s,A.SURF);const after=layoutMap(graph(s),l),road=after.routes.find(r=>r.id==='support:obs.surface.point-layering:obs.surface.resolved');
  assert.equal(f.segments[0].d,road.d);assert.ok(f.segments[0].to<1);return{visibleEnd:f.segments[0].to};
});
check('UV unresolved negative is an open boundary and cannot manufacture a support road',()=>{
  const s=newSession();const row=workbench(s).find(r=>/UV/.test(r.action.id));assert.ok(row);step(s,row.action.id);const g=graph(s),l=layoutMap(g);
  const f=l.frontiers.find(f=>f.id==='question:negative');assert.ok(f);assert.ok(f.openBoundary);
  assert.ok(f.segments.every(s=>s.canonicalRouteId===null&&s.edgeIds.length===0));assert.ok(!l.routes.some(r=>r.from==='obs.surface.no-signal.unresolved'&&r.kind==='support'));
  assert.deepEqual(l.nodes.map(n=>n.id).sort(),g.nodes.map(n=>n.id).sort());return{question:f.id,canonicalRoad:null};
});
check('Twenty-two real actions and reordered acquisition preserve every real node and group',()=>{
  const outcomes=[];
  for(let seed=1;seed<=3;seed++) {
    const s=newSession();let previous=null,random=seed;const remoteLabelsByStep=[];
    while(s.log.length<22){const options=workbench(s).filter(r=>r.usable&&!r.done);random=(random*1664525+1013904223)>>>0;const r=options[random%options.length];step(s,r.action.id,{comparisonBasis:r.comparisonOptions?.find(c=>c.usable)?.id});
      const g=graph(s),l=layoutMap(g,previous);assert.equal(l.diagnostics.maxNodeMovement,0);assert.deepEqual(l.diagnostics.unmappedNodeIds,[]);
      assert.deepEqual(l.nodes.map(n=>n.id).sort(),g.nodes.map(n=>n.id).sort());
      assert.ok(l.routes.every(r=>!['context','reference'].includes(r.kind)&&r.edgeIds.every(id=>g.edges.some(e=>e.id===id))));
      assert.ok(l.junctions.every(j=>j.memberNodeIds.length>=2&&g.supportGroups.some(group=>group.id===j.groupId)));
      assert.deepEqual(l.diagnostics.labelOverlaps,[]);assert.deepEqual(pathCollisions(l),[],`seed ${seed}, step ${s.log.length}`);
      if(l.diagnostics.remoteLabelIds.length)remoteLabelsByStep.push({step:s.log.length,ids:l.diagnostics.remoteLabelIds});previous=l;
    }
    assert.deepEqual(sameGeometry(previous),sameGeometry(layoutMap(graph(s))));outcomes.push({seed,nodes:previous.nodes.length,routes:previous.routes.length,remoteEstimatedLabels:previous.diagnostics.remoteLabelIds,remoteLabelsByStep});
  }return outcomes;
});
check('Actual cubic paths avoid unrelated real information glyphs, junctions and claim boxes',()=>{
  const s=newSession();while(new Set(s.log.map(l=>l.actionId)).size<21){const r=workbench(s).find(r=>r.usable&&!r.done&&r.action.id!=='A.COMPARE.CORPUS.RECHECK');step(s,r.action.id,{comparisonBasis:r.comparisonOptions?.find(c=>c.usable)?.id});}
  step(s,'A.MAP.REGION_CONTINUITY',{comparisonBasis:'archive'});const l=layoutMap(graph(s));let comparisons=0;const collisions=[];
  for(const route of l.routes){const samples=parseSamples(route.d);for(const n of [...l.nodes,...l.junctions]){if(n.id===route.from||n.id===route.to)continue;comparisons++;
    const hit=samples.some(p=>n.box?Math.abs(p.x-n.x)<n.box.w/2-.05&&Math.abs(p.y-n.y)<n.box.h/2-.05:n.isJunction?Math.abs(p.x-n.x)+Math.abs(p.y-n.y)<8.25-.05:Math.hypot(p.x-n.x,p.y-n.y)<9.75-.05);
    if(hit)collisions.push([route.id,n.id]);
  }}assert.deepEqual(collisions,[]);return{nodes:l.nodes.length,routes:l.routes.length,comparisons,sampling:'independent SVG cubic evaluation at <=1px control-polygon step'};
});
console.log(JSON.stringify({reviewRequired:true,passed:results.every(r=>r.passed),checks:results.length,results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
