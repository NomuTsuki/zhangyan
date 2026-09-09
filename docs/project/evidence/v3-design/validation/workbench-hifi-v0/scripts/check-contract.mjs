/* review required: new high-fidelity integration checks.
 * Existing solver, tests, fixtures and numerical baselines are read-only.
 */
import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { engine, derive, actions, buildGraph, diffGraphs } from '../src/engine.ts';
import * as localSession from '../../workbench-map-fusion-v0/local-session.mjs';
import { ACTIONS, comparisonOptions } from '../../workbench-map-fusion-v0/local-case.mjs';

const here = dirname(fileURLToPath(import.meta.url)), base = resolve(here, '..');
const rootResult = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: base, encoding: 'utf8' });
const root = rootResult.stdout.trim();
const report = { generatedAt: new Date().toISOString(), reviewRequired: true, checks: [], protected: null,
  boundary: 'Integration behavior only; no claim of human comprehension, aesthetic acceptance or official numerical approval.' };
const A = { whole:'A.OBSERVE.WHOLE', base:'A.OBSERVE.BASE', photo:'A.LOCATE.HISTORIC_IMAGE',
  verify:'A.VERIFY.OBJECT_CONTINUITY', xray:'A.IMAGE.XRAY', accident:'A.RESEARCH.ACCIDENT',
  attribution:'A.RELATE.ARCHIVE.T2_TO_OBJECT', compare:'A.MAP.REGION_CONTINUITY' };
const four = ['identity', 'majorReassembly', 'threePhase', 'coherentDecisionProfile'];
const step = (session, id, options) => { const result = engine.take(session, id, options); assert.equal(result.ok, true, `${id}: ${result.why}`); return result; };
const run = (route) => { const session = engine.newSession(); route.forEach(id => step(session, id)); return session; };
async function check(name, fn) {
  try { const evidence = await fn(); report.checks.push({ name, passed:true, ...(evidence ? { evidence } : {}) }); }
  catch (error) { report.checks.push({ name, passed:false, error:error.stack || String(error) }); }
}

await check('High-fidelity engine uses the existing fusion functions and the same 22 actions', () => {
  for (const method of ['take','solve','newSession','workbench','replayLog','setBudget']) assert.strictEqual(engine[method], localSession[method]);
  assert.strictEqual(actions, ACTIONS); assert.equal(actions.length, 22);
  return { actionCount: actions.length, unchangedFunctionIdentity: true };
});

await check('Protected modules and old tests have no staged or unstaged difference from HEAD', async () => {
  assert.equal(rootResult.status, 0, rootResult.stderr);
  const paths = ['first-ceramic-author-scenarios-v0','knowledge-map-slice-v0','workbench-map-v0','workbench-map-focus-v1','workbench-map-atlas-v0','workbench-map-fusion-v0']
    .map(name => relative(root, resolve(base, '..', name)).replaceAll('\\','/'));
  const diff = spawnSync('git', ['diff', '--name-only', 'HEAD', '--', ...paths], { cwd:root, encoding:'utf8' });
  const pending = spawnSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...paths], { cwd:root, encoding:'utf8' });
  report.protected = { head:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(), paths,
    changedFiles:diff.stdout.trim().split(/\r?\n/).filter(Boolean), untrackedFiles:pending.stdout.trim().split(/\r?\n/).filter(Boolean) };
  assert.equal(diff.status, 0, diff.stderr); assert.equal(pending.status, 0, pending.stderr);
  assert.deepEqual(report.protected.changedFiles, []);
  assert.deepEqual(report.protected.untrackedFiles, []);
  const source = await readFile(resolve(base,'src/engine.ts'),'utf8');
  assert.match(source, /workbench-map-fusion-v0\/local-session\.mjs/);
  return report.protected;
});

await check('The 16-step inventory establishes all four claims on both archive routes', () => {
  const route = [A.whole,A.base,A.photo,A.verify,A.accident,A.attribution,'A.CORROBORATE.ARCHIVE.T2_CURRENT',
    'A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT','A.CORROBORATE.ARCHIVE.T3_CURRENT',
    'A.ANALYZE.MATERIAL.SUBSTRATE','A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.INSPECT.WINDOWS',
    'A.SYNTHESIZE.SURFACE_REGIONS','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'];
  const outcomes=[];
  for (const alternative of [false,true]) {
    const selected=[...route]; if(alternative)selected[6]=A.compare;
    const session=run(selected), result=engine.solve(session);
    assert.equal(session.log.length,16); assert.equal(result.stage,'G3');
    four.forEach(id=>assert.equal(result.claims[id].established,true,id));
    outcomes.push({route:selected,stage:result.stage,billed:session.billed});
  }
  return outcomes;
});

await check('All 22 actions are reachable without changing costs, opportunity budget or stop semantics', () => {
  const session=engine.newSession();
  while(session.log.length<22){
    const row=engine.workbench(session).find(item=>item.usable&&!item.done);assert.ok(row);
    const comparisonBasis=row.comparisonOptions?.find(option=>option.usable)?.id;
    step(session,row.action.id,{comparisonBasis});
  }
  assert.equal(new Set(session.log.map(entry=>entry.actionId)).size,22);
  assert.equal(session.billed.reduce((a,b)=>a+b,0),22);
  assert.equal(engine.solve(session).stage,'G3');
  const exhausted=JSON.stringify(session);assert.equal(engine.take(session,A.whole).ok,false);assert.equal(JSON.stringify(session),exhausted);
  assert.equal(engine.setBudget(session,12).ok,false);assert.equal(session.stopped,false);
  session.stopped=true;const stopped=JSON.stringify(session);
  assert.equal(engine.take(session,A.whole).ok,false);assert.equal(JSON.stringify(session),stopped);
  assert.equal(engine.solve(session).stopping.playerChoice,'STOP');
  assert.equal(engine.solve(session).stopping.systemAutoEnded,false);
  const small=engine.newSession(12);for(let i=0;i<12;i++)step(small,A.whole);
  assert.equal(engine.take(small,A.whole).ok,false);assert.equal(small.budget,12);
  return {actions:session.log.map(entry=>entry.actionId),billed:session.billed,stage:engine.solve(session).stage};
});

await check('Early X-ray is current information; photo waits for verification without being acquired twice', () => {
  const session=run([A.xray,A.photo]);let result=engine.solve(session);
  assert.ok(result.coverage.facts.includes('currentStructureReadoutByRegion'));
  assert.ok(!result.evidence.inactiveObservationIds.includes('obs.structure.xray.early'));
  assert.ok(!result.coverage.facts.includes('t1Established'));
  const before=buildGraph(result,session);step(session,A.base);step(session,A.verify);
  result=engine.solve(session);const after=buildGraph(result,session),changes=diffGraphs(before,after);
  assert.ok(result.coverage.facts.includes('t1Established'));
  for(const id of ['obs.phase.t1','obs.structure.xray.early']){
    assert.equal(session.log.filter(entry=>entry.observationId===id).length,1);
    assert.ok(!changes.addedNodeIds.includes(id));
  }
  assert.ok(!after.nodes.some(node=>node.id==='obs.object.continuity'));
  assert.ok(after.edges.some(edge=>edge.sourceIds.includes('obs.object.continuity')));
  return {activated:changes.activatedNodeIds,added:changes.addedNodeIds,observations:after.observations.length};
});

await check('Comparison reports retain selected materials through delayed interpretation and historical replay', () => {
  const session=run([A.whole,A.xray,A.photo]);step(session,A.compare,{comparisonBasis:'photo'});
  const prefix=structuredClone(session.log),before=engine.solve(session);
  assert.ok(!before.coverage.facts.includes('crossTimeMajorChange'));
  step(session,A.base);step(session,A.verify);step(session,A.accident);
  assert.equal(comparisonOptions(engine.factsOf(session)).filter(option=>option.usable).length,2);
  const untouched=JSON.stringify(session);assert.equal(engine.take(session,A.compare).requiresBasis,true);assert.equal(JSON.stringify(session),untouched);
  step(session,A.compare,{comparisonBasis:'archive'});step(session,A.attribution);
  const replay=engine.replayLog(session.log,22);assert.deepEqual(replay,session);
  const past=engine.replayLog(prefix,22);
  assert.equal(past.log.at(-1).comparisonBasis,'photo');
  assert.ok(!engine.solve(past).coverage.facts.includes('crossTimeMajorChange'));
  assert.ok(engine.solve(session).coverage.facts.includes('crossTimeMajorChange'));
  assert.ok(engine.solve(session).coverage.facts.includes('t2EventPhysicalCorrespondence'));
  for(const id of ['obs.structure.major.cross-time','obs.structure.major.documented-cross-time'])assert.equal(session.log.filter(entry=>entry.observationId===id).length,1);
  return {recordedBases:session.log.filter(entry=>entry.comparisonBasis).map(entry=>({basis:entry.comparisonBasis,materials:entry.materialObservationIds})),pastStage:engine.solve(past).stage};
});

await check('Repeated investigation charges once without creating evidence or increasing support', () => {
  const session=run([A.whole,A.accident,A.attribution]);step(session,A.compare,{comparisonBasis:'archive'});
  const before=engine.solve(session),graphBefore=derive(session).graph,billed=[...session.billed],count=session.log.length;
  const result=step(session,A.compare,{comparisonBasis:'archive'}),after=engine.solve(session);
  assert.equal(result.kind,'repeat');assert.equal(session.log.length,count+1);assert.equal(session.billed[2],billed[2]+1);
  assert.deepEqual(after.supports,before.supports);assert.deepEqual(after.evidence.observationIds,before.evidence.observationIds);
  assert.deepEqual(diffGraphs(graphBefore,derive(session).graph).addedNodeIds,[]);
  return {repeatKind:result.kind,steps:session.log.length,billed:session.billed,uniqueEvidence:after.evidence.observationIds.length};
});

report.passed=report.checks.every(check=>check.passed);
const output=resolve(base,'verification-contract.json');
await writeFile(output,JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify({passed:report.passed,passedChecks:report.checks.filter(check=>check.passed).length,total:report.checks.length,output,
  failures:report.checks.filter(check=>!check.passed)}));
if(!report.passed)process.exitCode=1;
