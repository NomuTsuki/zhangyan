/* review required: current case closeout checks, 2026-09-12.
 * Does not rewrite historical contracts or frozen fixtures. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { engine, derive, resolveFocus } from '../src/engine.ts';
import { takeNewInvestigation } from '../src/action-state.mjs';
import { materialRecord } from '../src/material-records.ts';
import { layoutMap as makeLayout } from '../src/map-layout.mjs';
import { events as frozenEvents } from '../../first-ceramic-author-scenarios-v0/fixtures.mjs';
import { events, ACTIONS } from '../../workbench-map-fusion-v0/local-case.mjs';
const P='A.INSPECT.WINDOWS',S='A.SYNTHESIZE.SURFACE_REGIONS',OP='obs.surface.point-layering',OS='obs.surface.resolved';
const route=['A.OBSERVE.WHOLE','A.OBSERVE.BASE','A.LOCATE.HISTORIC_IMAGE','A.VERIFY.OBJECT_CONTINUITY','A.RESEARCH.ACCIDENT',
 'A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT','A.CORROBORATE.ARCHIVE.T3_CURRENT',
 'A.ANALYZE.MATERIAL.SUBSTRATE','A.INSPECT.MATERIAL.LAYER_SEQUENCE',P,S,'A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'];
const checks=[];
const check=(name,fn)=>{try{checks.push({name,passed:true,evidence:fn()});}catch(e){checks.push({name,passed:false,error:e.stack});}};
const act=(s,id,options)=>{const r=takeNewInvestigation(s,id,options);assert.equal(r.ok,true,r.why);return r;};
check('Regional synthesis requires acquired trial-window readings; rejected request is atomic',()=>{
 const s=engine.newSession(),before=JSON.stringify(s),row=engine.workbench(s).find(r=>r.action.id===S);
 assert.equal(row.usable,false);assert.deepEqual(row.needsActionIds,[P]);assert.match(row.why,/试窗/);
 assert.equal(takeNewInvestigation(s,S).ok,false);assert.equal(JSON.stringify(s),before);
 assert.equal(derive(s).graph.nodes.some(n=>n.id===OS),false);
 return {why:row.why,noCharge:true,noPrematureMaterial:true};
});
check('Point investigation unlocks synthesis; report traces the actual point input',()=>{
 const s=engine.newSession();act(s,P);const before=derive(s),frontier=before.graph.frontiers.find(f=>f.id==='question:surface');
 assert.ok(frontier);assert.equal(before.graph.nodes.some(n=>n.id===OS),false);
 assert.equal(before.rows.find(r=>r.action.id===S).usable,true);
 const focused=resolveFocus({kind:'action',id:S},before,s);assert.ok(focused.nodeIds.includes(OP));
 act(s,S);const after=derive(s);assert.equal(s.log.length,2);assert.equal(s.billed.reduce((a,b)=>a+b,0),2);
 assert.equal(after.graph.frontiers.some(f=>f.id==='question:surface'),false);
 assert.ok(after.graph.edges.some(e=>e.from===OP&&e.to===OS));
 const record=materialRecord(after.graph,OS);assert.deepEqual(record.inputs.map(i=>i.id),[OP]);
 assert.deepEqual(engine.replayLog(s.log,s.budget),s);
 assert.equal(derive(engine.replayLog(s.log.slice(0,1),s.budget)).graph.nodes.some(n=>n.id===OS),false);
 const prior=JSON.stringify(s);assert.equal(takeNewInvestigation(s,S).alreadyDone,true);assert.equal(JSON.stringify(s),prior);
 return {inputs:record.inputs,historyAndRepeatPreserved:true};
});
check('Surface road grows on the existing geometry without moving the point',()=>{
 const s=engine.newSession();act(s,P);const a=makeLayout(derive(s).graph);act(s,S);const b=makeLayout(derive(s).graph);
 const x=a.nodes.find(n=>n.id===OP),y=b.nodes.find(n=>n.id===OP);assert.deepEqual([x.x,x.y],[y.x,y.y]);
 const frontier=a.frontiers.find(f=>f.id==='question:surface');assert.ok(frontier);
 const road=b.routes.find(r=>r.edgeIds?.includes(`support:${OP}:${OS}`));assert.ok(road);
 return {pointPosition:[x.x,x.y],frontierId:frontier.id,roadId:road.id};
});
check('Both 16-investigation routes retain all four claims, bills and stop behavior',()=>{
 return [false,true].map(alternative=>{const s=engine.newSession();const ids=[...route];if(alternative)ids[6]='A.MAP.REGION_CONTINUITY';
  for(const id of ids)act(s,id);const solved=engine.solve(s);
  assert.equal(solved.stage,'G3');for(const id of ['identity','majorReassembly','threePhase','coherentDecisionProfile'])assert.equal(solved.claims[id].established,true,id);
  assert.equal(s.log.length,16);assert.equal(s.budget-s.log.length,6);assert.deepEqual(engine.replayLog(s.log),s);
  s.stopped=true;const before=JSON.stringify(s);assert.equal(takeNewInvestigation(s,'A.SCREEN.UV').ok,false);assert.equal(JSON.stringify(s),before);
  return {alternative,steps:16,billed:s.billed,stage:solved.stage};});
});
check('All 22 distinct methods remain reachable under the unchanged budget',()=>{
 const s=engine.newSession();while(s.log.length<22){const row=engine.workbench(s).find(r=>r.usable&&!r.done);assert.ok(row);act(s,row.action.id,{comparisonBasis:row.comparisonOptions?.find(x=>x.usable)?.id});}
 assert.equal(new Set(s.log.map(e=>e.actionId)).size,22);assert.ok(s.log.findIndex(e=>e.actionId===P)<s.log.findIndex(e=>e.actionId===S));
 assert.equal(s.budget,22);assert.equal(engine.solve(s).stage,'G3');return {methods:ACTIONS.length,stage:'G3'};
});
check('Frozen source and evidence weights remain unchanged',()=>{
 assert.deepEqual(frozenEvents.surface.acquisitionRequires,[]);
 for(const k of ['observationId','sourceIds','dependencyUnitId','sharedLatentIds','facts','contextualFacts','factor','proofRoles','coverage'])assert.deepEqual(events.surface[k],frozenEvents.surface[k],k);
 const repo=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
 const paths=['docs/project/evidence/v3-design/validation/first-ceramic-author-scenarios-v0','docs/project/evidence/v3-design/validation/knowledge-map-slice-v0','docs/project/evidence/v3-design/validation/workbench-map-v0','docs/project/evidence/v3-design/validation/workbench-map-atlas-v0','docs/project/evidence/v3-design/validation/workbench-map-focus-v1'];
 assert.equal(execFileSync('git',['diff','--name-only','14a54a2','--',...paths],{cwd:repo,encoding:'utf8'}).trim(),'');
 assert.equal(execFileSync('git',['diff','--name-only','v2.0.0-player-prototype-freeze','--','掌眼_Codex启动包_v2'],{cwd:repo,encoding:'utf8'}).trim(),'');
 return {baseline:'14a54a2',frozenAndOldPrototypesUntouched:true};
});
console.log(JSON.stringify({reviewRequired:true,passed:checks.every(c=>c.passed),checks},null,2));if(checks.some(c=>!c.passed))process.exitCode=1;
