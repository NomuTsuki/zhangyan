/* review required: language coverage at actual session/graph/material seams.
 * Legal action orders produce every checked state. No author truth injection. */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {engine,derive,cleanCopy} from '../src/engine.ts';
import {materialRecord} from '../src/material-records.ts';
import {translate} from '../src/locale-text.mjs';
import {ACTIONS} from '../../workbench-map-fusion-v0/local-case.mjs';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(base,'../../../../../..');
const tag=process.argv.find(s=>s.startsWith('--tag='))?.slice(6)||'before';
const minimal=process.argv.includes('--minimal'),out=resolve(root,'output/playwright/language-audit-2026-09-13',tag);await mkdir(out,{recursive:true});
const missing=new Map(),values=new Set(),signatures=new Set(),frontiers=new Set(),edges=new Set();let states=0,orders=0;
const displayKeys=new Set(['title','summary','label','statusLabel','stateLabel','explanation','details','subline','ask','why','scopeNote','result','scope','limit','role','contextState']);
function checkText(text,where,route){
 if(typeof text!=='string'||! /\p{Script=Han}/u.test(text))return;
 for(const source of new Set([text,cleanCopy(text)])){
 values.add(source);const english=translate(source,'en');if(/\p{Script=Han}/u.test(english)&&!missing.has(source))missing.set(source,{source,english,where,route:[...route]});
 }
}
function inspect(value,where,route,key=''){
 if(typeof value==='string'){if(displayKeys.has(key)||['pending'].includes(key))checkText(value,where,route);return;}
 if(Array.isArray(value)){value.forEach((v,i)=>inspect(v,where+'['+i+']',route,key));return;}
 if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))inspect(v,where+'.'+k,route,k);
}
function scan(session,route){
 const signature=session.acquired.map(e=>e.observationId).sort().join('|');if(signatures.has(signature))return;signatures.add(signature);states++;
 const model=derive(session);for(const f of model.graph.frontiers)frontiers.add(f.id);for(const e of model.graph.edges)edges.add(e.id);
 inspect(model.graph,'graph',route);inspect(model.overview,'overview',route);inspect(model.facets,'facets',route);
 for(const row of model.rows){checkText(row.action.name,'action.name',route);checkText(row.action.ask,'action.ask',route);checkText(row.why,'action.why',route);inspect(row.comparisonOptions,'comparison',route);}
 for(const observation of model.graph.observations){inspect(materialRecord(model.graph,observation.id),'material',route);for(const claim of model.overview)inspect(materialRecord(model.graph,observation.id,{kind:'claim',id:claim.id,title:claim.title}),'claim-material',route);}
}
function execute(preferred=[],seed=1,basis='photo'){
 const session=engine.newSession(),route=[];let rng=seed>>>0;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};scan(session,route);
 const rank=new Map(preferred.map((id,i)=>[id,i]));
 while(session.log.length<22){
  const usable=engine.workbench(session).filter(r=>r.usable&&!r.done).map(row=>({row,rank:rank.get(row.action.id)??(100+random())})).sort((a,b)=>a.rank-b.rank);
  assert.ok(usable.length);const row=usable[0].row,comparisonBasis=row.comparisonOptions?.find(o=>o.id===basis&&o.usable)?.id||row.comparisonOptions?.find(o=>o.usable)?.id;
  const action={id:row.action.id,...(comparisonBasis?{basis:comparisonBasis}:{})};const result=engine.take(session,action.id,comparisonBasis?{comparisonBasis}:{});assert.equal(result.ok,true);route.push(action);scan(session,route);if(minimal)break;
 }
 orders++;
}
// The reported bug takes one action: obtain later attribution before its record.
execute(['A.RELATE.ARCHIVE.T3_TO_OBJECT']);
if(!minimal){
 for(const first of ACTIONS)execute([first.id],orders+100,orders%2?'photo':'archive');
 execute(ACTIONS.map(a=>a.id).reverse(),17,'archive');
 execute(['A.IMAGE.XRAY','A.LOCATE.HISTORIC_IMAGE','A.OBSERVE.WHOLE','A.MAP.REGION_CONTINUITY','A.OBSERVE.BASE','A.VERIFY.OBJECT_CONTINUITY'],71);
 execute(['A.OBSERVE.WHOLE','A.RESEARCH.ACCIDENT','A.MAP.REGION_CONTINUITY','A.RELATE.ARCHIVE.T2_TO_OBJECT'],72,'archive');
 for(let seed=1;seed<=32;seed++)execute([],seed*7919,seed%2?'photo':'archive');
}
const result={reviewRequired:true,passed:missing.size===0,orders,uniqueStates:states,uniqueDisplayStrings:values.size,frontierIds:[...frontiers].sort(),edgeIds:[...edges].sort(),missing:[...missing.values()]};
await writeFile(resolve(out,'copy-coverage.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,orders,states,strings:values.size,missing:missing.size,out}));if(!result.passed)process.exitCode=1;
