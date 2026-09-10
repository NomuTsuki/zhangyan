/* Fresh-process first-combination versus warmed-combination diagnosis.
 * Imports the existing frozen solver without changing or clearing its cache.
 */
import { performance } from 'node:perf_hooks';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { engine } from '../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/engine.ts';
import { takeNewInvestigation } from '../../../../docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/action-state.mjs';
import { AXIS_NAMES, STATE_SPACE } from '../../../../docs/project/evidence/v3-design/validation/first-ceramic-author-scenarios-v0/solver.mjs';
const here=dirname(fileURLToPath(import.meta.url)),variant=process.argv[2]||'baseline';
const route=['A.OBSERVE.WHOLE','A.OBSERVE.BASE','A.LOCATE.HISTORIC_IMAGE','A.VERIFY.OBJECT_CONTINUITY','A.RESEARCH.ACCIDENT',
  'A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT','A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT',
  'A.IMAGE.XRAY','A.INSPECT.WINDOWS','A.CORROBORATE.ARCHIVE.T3_CURRENT','A.SYNTHESIZE.SURFACE_REGIONS','A.ANALYZE.MATERIAL.SUBSTRATE',
  'A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN','A.SCREEN.UV','A.OBSERVE.REGION_DECOR',
  'A.COMPARE.CORPUS','A.COMPARE.CORPUS.RECHECK','A.MAP.REGION_CONTINUITY'];
const priority=['A.TRACE.PROVENANCE_CHAIN','A.ASSESS.TREATED_AND_UNTREATED','A.ANALYZE.MATERIAL.SUBSTRATE',
  'A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.SYNTHESIZE.SURFACE_REGIONS','A.INSPECT.WINDOWS',
  'A.RESEARCH.ACCIDENT','A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT',
  'A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT','A.CORROBORATE.ARCHIVE.T3_CURRENT',
  'A.LOCATE.HISTORIC_IMAGE','A.OBSERVE.BASE','A.VERIFY.OBJECT_CONTINUITY','A.OBSERVE.WHOLE',
  'A.COMPARE.CORPUS','A.OBSERVE.REGION_DECOR','A.IMAGE.XRAY','A.SCREEN.UV','A.COMPARE.CORPUS.RECHECK','A.MAP.REGION_CONTINUITY'];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const fingerprint=(session,solved)=>{
  const byAxes=new Map();
  for(const unit of solved.evidence.activeDependencyUnits){
    const event=session.acquired.find(e=>e.dependencyUnitId===unit.unitId&&e.factor),axes=[...event.factor.affectsAxes].sort((a,b)=>AXIS_NAMES.indexOf(a)-AXIS_NAMES.indexOf(b)),key=axes.join('|');
    const g=byAxes.get(key)||{affectsAxes:axes,components:[]};g.components.push(event.factor);byAxes.set(key,g);
  }
  const groups=[...byAxes].sort(([a],[b])=>a.localeCompare(b)).map(([key,g])=>({id:`fixture.factor-group.${key}`,...g}));
  const key=JSON.stringify(stable({factors:groups,prior:STATE_SPACE.map(()=>1/STATE_SPACE.length)}));
  let permutations=1;for(let i=2;i<=groups.length;i++)permutations*=i;
  return{groups:groups.map(g=>({axes:g.affectsAxes,componentFactors:g.components.map(f=>f.id)})),groupCount:groups.length,permutations,
    axisFactorApplications:groups.length*permutations,keySha256:createHash('sha256').update(key).digest('hex')};
};
const session=engine.newSession(),seen=new Set(),steps=[];
for(let i=0;i<22;i++){
  const rows=engine.workbench(session).filter(r=>r.usable&&!r.done);
  const id=variant==='baseline'?route[i]:priority.find(id=>rows.some(r=>r.action.id===id));
  if(!id)throw Error('No bounded alternate action available');
  const options=id==='A.MAP.REGION_CONTINUITY'?{comparisonBasis:'archive'}:{};
  const before=structuredClone(session),started=performance.now(),result=takeNewInvestigation(session,id,options),firstMs=performance.now()-started;
  if(!result.ok)throw Error(`${id}: ${result.why}`);
  const solved=engine.solve(session),fp=fingerprint(session,solved),newCombination=!seen.has(fp.keySha256);seen.add(fp.keySha256);
  const warms=[];for(let j=0;j<4;j++){const copy=structuredClone(before),start=performance.now();const r=takeNewInvestigation(copy,id,options);if(!r.ok)throw Error(r.why);warms.push(performance.now()-start);}
  warms.sort((a,b)=>a-b);steps.push({step:i+1,action:id,stage:solved.stage,firstTakeMs:firstMs,warmTakeMedianMs:warms[2],newCombination,...fp});
}
const report={generatedAt:new Date().toISOString(),variant,node:process.version,freshProcess:true,stateCount:STATE_SPACE.length,
  method:'One new Node process per bounded order; existing runtime first take and 4 repeat executions on clones. No solver source modification or cache manipulation. Factor groups/cache fingerprint reconstructed from exposed active units and unmodified events.',
  keySemantics:'stableStringify({factors:groupedFactors(active units),prior:prior probabilities}); grouped axes and components matter; event count and action ordinal do not.',
  totalFirstMs:steps.reduce((n,s)=>n+s.firstTakeMs,0),steps};
const output=resolve(here,`cold-${variant}.json`);writeFileSync(output,JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify({output,stateCount:STATE_SPACE.length,totalFirstMs:report.totalFirstMs,steps:steps.map(s=>({step:s.step,action:s.action,groups:s.groupCount,permutations:s.permutations,newCombination:s.newCombination,firstMs:+s.firstTakeMs.toFixed(3),warmMs:+s.warmTakeMedianMs.toFixed(3)}))},null,2));
