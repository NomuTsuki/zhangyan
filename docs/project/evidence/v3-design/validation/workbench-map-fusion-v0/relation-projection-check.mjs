// review required: new fusion presentation checks, no old baseline edits.
import assert from 'node:assert/strict';
import {newSession,take,solve,workbench} from './local-session.mjs';
import {buildGraph,diffGraphs} from './graph.mjs';
import {layoutGraph} from './layout.mjs';
import {resolveSelection} from './selection.mjs';
const A={whole:'A.OBSERVE.WHOLE',base:'A.OBSERVE.BASE',photo:'A.LOCATE.HISTORIC_IMAGE',xray:'A.IMAGE.XRAY',verify:'A.VERIFY.OBJECT_CONTINUITY',compare:'A.MAP.REGION_CONTINUITY',t2:'A.RESEARCH.ACCIDENT',attr:'A.RELATE.ARCHIVE.T2_TO_OBJECT',substrate:'A.ANALYZE.MATERIAL.SUBSTRATE',layer:'A.INSPECT.MATERIAL.LAYER_SEQUENCE'};
const P='obs.phase.t1',C='obs.object.continuity',X='obs.structure.xray.early',R='obs.structure.major.cross-time',D='obs.structure.major.documented-cross-time';
const graph=s=>buildGraph(solve(s),s);
const act=(s,key,basis)=>{const result=take(s,A[key],{comparisonBasis:basis});assert.equal(result.ok,true,result.why);return graph(s);};
const node=(g,id)=>g.nodes.find(n=>n.id===id);
const found=(g,id)=>g.frontiers.find(n=>n.id===id);
function validate(g){
  const ids=new Set(g.nodes.map(n=>n.id)),known=new Set(g.observations.map(o=>o.id));
  assert.equal(ids.size,g.nodes.length);
  for(const edge of g.edges){assert.ok(ids.has(edge.from)&&ids.has(edge.to),edge.id+' endpoints');assert.ok(edge.sourceIds.length);for(const id of edge.sourceIds)assert.ok(known.has(id),edge.id+' unknown source '+id);}
  for(const n of g.nodes.filter(n=>n.kind==='interpretation')){assert.equal(known.has(n.id),false);assert.ok(n.sourceIds.every(id=>known.has(id)));}
  for(const group of g.supportGroups){assert.ok(ids.has(group.targetId));assert.ok(group.memberNodeIds.every(id=>ids.has(id)));}
}
const s=newSession();let g=act(s,'xray');assert.equal(node(g,X).state,'known');assert.equal(found(g,'question:context'),undefined);
g=act(s,'photo');assert.equal(node(g,P).state,'known');assert.equal(found(g,'question:photo-object').kind,'stub');assert.equal(node(g,'interpretation:photo-repair'),undefined);
g=act(s,'base');assert.equal(found(g,'question:photo-object').kind,'gap');const before=g;
const layout=layoutGraph(g,{width:778,height:680});const steps=[...node(g,P).steps];
g=act(s,'verify');assert.equal(node(g,C),undefined);assert.equal(node(g,P).state,'known');assert.deepEqual(node(g,P).steps,steps);assert.ok(node(g,'interpretation:photo-repair'));assert.equal(g.observations.length,4);
assert.ok(g.edges.find(e=>e.id==='photo:object'&&!e.directed&&e.sourceIds.includes(C)));assert.equal(found(g,'question:photo-object'),undefined);
assert.ok(diffGraphs(before,g).activatedNodeIds.includes(P));assert.equal(g.observations.find(o=>o.id===C).representedAs,'relation');validate(g);
const afterLayout=layoutGraph(g,{width:778,height:680,previous:layout});assert.equal(afterLayout.positions[P].x,layout.positions[P].x);assert.equal(afterLayout.positions[P].y,layout.positions[P].y);
for(const selection of [{kind:'evidence',id:C},{kind:'evidence',id:'interpretation:photo-repair'}]){const focus=resolveSelection(selection,g,solve(s),s,workbench(s));assert.ok(focus.active);assert.ok(focus.sourceIds.includes(C));if(selection.id===C)assert.ok(focus.edgeIds.includes('photo:object'));}
console.log('PASS current observations, two-ended photo gap, original report trace and interpretation selection');

for(const basis of ['photo','archive']){
  const session=newSession();act(session,'whole');if(basis==='photo'){act(session,'xray');act(session,'photo');}else act(session,'t2');
  const raw=act(session,'compare',basis),id=basis==='photo'?R:D;const report=raw.observations.find(o=>o.id===id);assert.equal(node(raw,id).state,'known');assert.equal(node(raw,id).interpretationState,'awaiting-attribution');
  assert.equal(node(raw,'interpretation:'+basis+'-change'),undefined);
  const rawSteps=[...report.steps];
  if(basis==='photo')act(session,'base');
  const active=act(session,basis==='photo'?'verify':'attr');assert.ok(node(active,'interpretation:'+basis+'-change'));assert.equal(node(active,id).interpretationState,'established');assert.deepEqual(active.observations.find(o=>o.id===id).steps,rawSteps);
  assert.ok(diffGraphs(raw,active).activatedNodeIds.includes(id));
  assert.equal(active.edges.some(e=>e.kind==='context'&&e.from===C&&e.to===X),false);validate(raw);validate(active);
  if(basis==='archive')assert.equal(active.nodes.some(n=>n.id==='interpretation:photo-repair'),false);
}
console.log('PASS photo and archive comparison reports retain identity and gain the correct historical use');

const materials=newSession();act(materials,'substrate');const mg=act(materials,'layer');assert.equal(mg.edges.some(e=>[e.from,e.to].includes('obs.key-material.substrate-readings')&&[e.from,e.to].includes('obs.key-material.layer-sequence')),false);
for(const width of [618,778,1258]){
  let prev=null;const session=newSession();
  for(const [key,basis] of [['whole'],['xray'],['photo'],['compare','photo'],['base'],['verify'],['t2'],['compare','archive'],['attr']]){
    const current=act(session,key,basis);validate(current);const next=layoutGraph(current,{width,height:680,previous:prev});
    assert.equal(next.diagnostics.maxMovement,0);assert.deepEqual(next.diagnostics.overlaps,[]);
    assert.deepEqual(next.diagnostics.routeNodeIntersections,[]);prev=next;
  }
}
console.log('PASS distinct material scopes and incrementally expanded local relationships at three map widths');
const history=newSession();
for(const id of [A.base,A.photo,A.verify,A.t2,A.attr,'A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT','A.CORROBORATE.ARCHIVE.T3_CURRENT'])assert.equal(take(history,id).ok,true);
const hg=graph(history),hf=resolveSelection({kind:'claim',id:'claim:threePhase'},hg,solve(history),history,workbench(history));
assert.ok(hf.actionIds.includes(A.verify));assert.ok(hf.sourceIds.includes(C));
assert.ok(hg.edges.find(e=>e.kind==='support'&&e.from==='interpretation:photo-repair'&&e.to==='claim:threePhase').sourceIds.includes(C));
assert.ok(hg.nodes.filter(n=>n.kind==='interpretation').every(n=>!hg.observations.some(o=>o.id===n.id)));
console.log('PASS historical judgments retain attribution reports in proof provenance and selection');
console.log('4/4 relation projection scenarios passed.');
