// Experimental presentation checks — review required.
// Exercise actual local-session results; never inject observations or alter fixtures.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { materialRecord } from '../src/material-records.ts';
import { newSession, take, solve, workbench } from '../../workbench-map-fusion-v0/local-session.mjs';
import { buildGraph } from '../../workbench-map-fusion-v0/graph.mjs';
const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',P:'A.LOCATE.HISTORIC_IMAGE',X:'A.IMAGE.XRAY',C:'A.VERIFY.OBJECT_CONTINUITY',D:'A.MAP.REGION_CONTINUITY',T2:'A.RESEARCH.ACCIDENT',T2A:'A.RELATE.ARCHIVE.T2_TO_OBJECT'};
const O={W:'obs.current.whole',B:'obs.current.base',P:'obs.phase.t1',X:'obs.structure.xray.early',C:'obs.object.continuity',D:'obs.structure.major.cross-time',DA:'obs.structure.major.documented-cross-time',T2:'obs.accident.major'};
const identity={kind:'claim',id:'claim:identity',title:'年代与类别'};
const graph=s=>buildGraph(solve(s),s);
function add(s,key,basis){const r=take(s,A[key]??key,basis?{comparisonBasis:basis}:{});assert.equal(r.ok,true,r.why);return r;}
function session(keys){const s=newSession(22);for(const key of keys)add(s,key);return s;}

test('partial identity explains a current observation without inventing the missing reading or conclusion',()=>{
  const s=session(['W']),g=graph(s),before=JSON.stringify(s);
  const record=materialRecord(g,O.W,identity);
  assert.equal(record.contextState,'这项判断尚未成立');
  assert.equal(record.usedByEstablishedClaim,false);
  assert.ok(record.role.includes('没有单独确定年代'));
  assert.ok(record.pending.some(text=>text.includes('底足')));
  assert.ok(record.pending.some(text=>text.includes('身份路径')));
  assert.equal(materialRecord(g,O.B,identity),null);
  assert.equal(materialRecord(g,'interpretation:photo-repair',identity),null);
  assert.deepEqual(record.inputs,[]);
  assert.equal(JSON.stringify(s),before);
});

test('C retains its actual two inputs; the photograph does not replace C as identity proof',()=>{
  const s=session(['P','B','W']);add(s,'C');const g=graph(s);
  const c=materialRecord(g,O.C,identity),photo=materialRecord(g,O.P,identity);
  assert.deepEqual(c.inputs.map(o=>o.id),s.log.at(-1).materialObservationIds);
  assert.deepEqual(c.inputs.map(o=>o.id),[O.P,O.B]);
  assert.equal(c.usedByEstablishedClaim,true);
  assert.equal(photo.usedByEstablishedClaim,false);
  assert.ok(photo.role.includes('不直接证明制造年代'));
  assert.equal(c.contextState,'这项判断已有依据');
  assert.ok(materialRecord(g,O.P).role.includes('核验已相符'));
  assert.deepEqual(c.originalSourceIds,g.observations.find(o=>o.id===O.C).originalSourceIds);
});

test('photo comparison uses its recorded material basis and changes interpretation without another acquisition',()=>{
  const s=session(['P','W','X']);add(s,'D','photo');
  const beforeGraph=graph(s),before=materialRecord(beforeGraph,O.D);
  assert.deepEqual(before.inputs.map(o=>o.id),[O.P,O.W,O.X]);
  assert.ok(before.pending.some(t=>t.includes('照片归属')));
  assert.equal(materialRecord(beforeGraph,O.X).pending.length,0);
  add(s,'B');add(s,'C');const after=materialRecord(graph(s),O.D);
  assert.deepEqual(after.inputs,before.inputs);
  assert.equal(after.pending.length,0);
  assert.ok(after.role.includes('照片归属已核实'));
  assert.equal(s.acquired.filter(o=>o.observationId===O.D).length,1);
  assert.ok(materialRecord(beforeGraph,O.D).pending.length>0,'Historical graph must retain its own attribution state');
});

test('C does not explain the archive comparison; accident attribution is required',()=>{
  const s=session(['P','B','W','C','T2']);add(s,'D','archive');
  const before=materialRecord(graph(s),O.DA);
  assert.deepEqual(before.inputs.map(o=>o.id),[O.T2,O.W]);
  assert.ok(before.pending.some(t=>t.includes('事故记录归属尚未核实')));
  add(s,'T2A');const after=materialRecord(graph(s),O.DA);
  assert.equal(after.pending.length,0);
  assert.ok(after.role.includes('事故记录归属已核实'));
  assert.ok(after.archiveRelations.some(r=>r.key==='corroboration'&&r.status==='established'));
});

test('archive attribution alone does not claim physical corroboration',()=>{
  const s=session(['W','T2','T2A']);
  const record=materialRecord(graph(s),'obs.archive.t2.object-attribution');
  assert.equal(record.archiveRelations.find(r=>r.key==='attribution').status,'established');
  assert.notEqual(record.archiveRelations.find(r=>r.key==='corroboration').status,'established');
  assert.ok(record.limit.includes('不单独证明'));
});

test('every acquired record in both legal full routes is readable and only links acquired material',()=>{
  for(const basis of ['photo','archive']){
    const s=newSession(22);
    while(s.log.length<22){
      const row=workbench(s).find(r=>r.usable&&!r.done&&(r.action.id!==A.D||r.comparisonOptions.some(c=>c.id===basis&&c.usable)));
      assert.ok(row);add(s,row.action.id,row.action.id===A.D?basis:undefined);
    }
    const g=graph(s),snapshot=JSON.stringify(s),known=new Set(g.observations.map(o=>o.id));
    for(const o of g.observations){
      const record=materialRecord(g,o.id,{kind:'claim',id:'claim:coherentDecisionProfile',title:'连贯说明'});
      assert.ok(record&&record.result&&record.scope&&record.limit);
      assert.ok(record.inputs.every(input=>known.has(input.id)));
      assert.deepEqual(record.originalSourceIds,o.originalSourceIds);
    }
    assert.equal(new Set(s.log.map(e=>e.actionId)).size,22);
    assert.equal(JSON.stringify(s),snapshot);
  }
});
