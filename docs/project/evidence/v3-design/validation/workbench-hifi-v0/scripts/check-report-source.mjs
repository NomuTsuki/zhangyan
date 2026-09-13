/* review required: actual-session regression for report-first source continuity. */
import assert from 'node:assert/strict';
import {engine,derive,diffGraphs,resolveFocus} from '../src/engine.ts';
import {layoutMap} from '../src/map-layout.mjs';
import {roadTransitionPlan} from '../src/map-motion.mjs';
const results=[];
const check=(name,fn)=>{try{results.push({name,passed:true,evidence:fn()});}catch(e){results.push({name,passed:false,error:e.stack});}};
const take=(s,id)=>assert.equal(engine.take(s,id).ok,true);
const state=s=>{const model=derive(s);return{model,g:model.graph,l:layoutMap(model.graph)};};
for(const group of ['t2','t3'])for(const role of ['object-attribution','current-corroboration'])check(`${group} ${role}: missing source becomes a traceable same-path connection`,()=>{
 const s=engine.newSession(),report=`obs.archive.${group}.${role}`,read=group==='t2'?'A.RESEARCH.ACCIDENT':'A.RESEARCH.LATE_TREATMENT';
 take(s,role==='object-attribution'?`A.RELATE.ARCHIVE.${group.toUpperCase()}_TO_OBJECT`:`A.CORROBORATE.ARCHIVE.${group.toUpperCase()}_CURRENT`);
 const before=state(s),q=before.l.frontiers.find(f=>f.id===`question:archive:${group}:source`);
 assert.ok(q);assert.equal(before.l.nodes.length,1);assert.equal(q.segments[0].canonicalRouteId,`source:${report}`);
 take(s,read);const after=state(s),r=after.l.routes.find(r=>r.id===`source:${report}`);
 assert.ok(r,'Acquiring the source must leave a report-to-record connection');assert.equal(r.d,q.segments[0].d);assert.equal(r.arrow,false);assert.equal(r.kind,'source-record');
 assert.equal(s.log.length,2);assert.equal(s.acquired.length,2);
 const plan=roadTransitionPlan(after.g,after.l,before.l,diffGraphs(before.g,after.g));
 assert.equal(plan.routes[r.id].both,false,'The source road must grow out from the already held report');
 assert.equal(plan.retiring.find(x=>x.frontier.id===q.id).retireAt,plan.routes[r.id].end);
 const remaining=Object.values(plan.frontiers);assert.ok(remaining.every(x=>x.start>=plan.routes[r.id].end),'A successor question waits for the source connection');
 const focus=resolveFocus({kind:'edge',id:r.id},after.model,s);assert.ok(focus.sourceIds.includes(report));assert.equal(focus.sources.length,2);assert.deepEqual(focus.claimIds,[]);
 take(s,'A.OBSERVE.WHOLE');const folded=state(s),marker=folded.l.reportMarkers.find(m=>m.reportId===report);assert.ok(marker);
 assert.ok(folded.g.observations.some(o=>o.id===report));assert.ok(!folded.l.routes.some(r=>r.id===`source:${report}`));
 const move=roadTransitionPlan(folded.g,folded.l,after.l,diffGraphs(after.g,folded.g)).reportTransfers.find(t=>t.reportId===report);
 assert.ok(move);assert.equal(move.sourceRoute.d,r.d);assert.ok(move.end>move.start);
 const alternative=engine.newSession();take(alternative,read);take(alternative,role==='object-attribution'?`A.RELATE.ARCHIVE.${group.toUpperCase()}_TO_OBJECT`:`A.CORROBORATE.ARCHIVE.${group.toUpperCase()}_CURRENT`);
 assert.equal(state(alternative).l.routes.find(x=>x.id===r.id).d,r.d);
 return{sourceRoad:r.id,retireAt:plan.routes[r.id].end,marker:marker.carrierEdgeId};
});
check('Both report types can precede one source without proving each other',()=>{
 const s=engine.newSession();take(s,'A.RELATE.ARCHIVE.T2_TO_OBJECT');take(s,'A.CORROBORATE.ARCHIVE.T2_CURRENT');const before=state(s);
 assert.equal(before.l.frontiers.find(f=>f.id==='question:archive:t2:source').segments.length,2);
 take(s,'A.RESEARCH.ACCIDENT');const after=state(s);assert.equal(after.l.routes.filter(r=>r.kind==='source-record').length,2);
 assert.ok(!after.g.edges.some(e=>e.kind==='source-record'&&e.to.startsWith('obs.archive.')));
 return{reports:2,sourceRecords:1};
});
check('Four report links remain readable before the object view and fold without moving fixed nodes',()=>{
 const s=engine.newSession(),route=[];
 for(;;){const a=engine.workbench(s).find(r=>r.usable&&!r.done&&r.action.id!=='A.OBSERVE.WHOLE');if(!a)break;const options={comparisonBasis:a.comparisonOptions?.find(o=>o.usable)?.id};assert.equal(engine.take(s,a.action.id,options).ok,true);route.push([a.action.id,options]);}
 const before=state(s);assert.equal(before.l.routes.filter(r=>r.kind==='source-record').length,4);assert.deepEqual(before.l.diagnostics.labelOverlaps,[]);assert.deepEqual(before.l.diagnostics.unmappedNodeIds,[]);
 take(s,'A.OBSERVE.WHOLE');const after=state(s);assert.equal(after.l.reportMarkers.length,4);assert.deepEqual(after.l.diagnostics.labelOverlaps,[]);
 const plan=roadTransitionPlan(after.g,after.l,before.l,diffGraphs(before.g,after.g));assert.equal(plan.reportTransfers.length,4);
 const other=engine.newSession();take(other,'A.OBSERVE.WHOLE');for(const [id,options] of route)assert.equal(engine.take(other,id,options).ok,true);
 const geometry=l=>({nodes:l.nodes.map(n=>[n.id,n.x,n.y]),routes:l.routes.map(r=>[r.id,r.d]),markers:l.reportMarkers});
 assert.deepEqual(geometry(after.l),geometry(state(other).l));
 return{beforeActions:route.length,sourceLinks:4,finalMarkers:4,finalGeometryIndependentOfOrder:true};
});
console.log(JSON.stringify({reviewRequired:true,passed:results.every(r=>r.passed),results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
