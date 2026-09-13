/* review required: actual-state regression for the approved whole-map repair. */
import assert from 'node:assert/strict';
import {engine,derive,diffGraphs,resolveFocus} from '../src/engine.ts';
import {layoutMap} from '../src/map-layout.mjs';
import {roadTransitionPlan} from '../src/map-motion.mjs';
const W='A.OBSERVE.WHOLE',B='A.OBSERVE.BASE',P='A.LOCATE.HISTORIC_IMAGE',C='A.VERIFY.OBJECT_CONTINUITY',X='A.IMAGE.XRAY';
const M='A.ANALYZE.MATERIAL.SUBSTRATE',L='A.INSPECT.MATERIAL.LAYER_SEQUENCE',V='A.SCREEN.UV',T='A.INSPECT.WINDOWS',S='A.SYNTHESIZE.SURFACE_REGIONS';
const results=[];
const check=(name,fn)=>{try{results.push({name,passed:true,evidence:fn()});}catch(e){results.push({name,passed:false,error:e.stack});}};
const state=s=>{const m=derive(s);return{...m,l:layoutMap(m.graph)};};
function step(pre,action,options={}){const s=engine.newSession();for(const a of pre)assert.ok(engine.take(s,a).ok);const before=state(s);assert.ok(engine.take(s,action,options).ok);const after=state(s);return {s,before,after,plan:roadTransitionPlan(after.graph,after.l,before.l,diffGraphs(before.graph,after.graph))};}
for(const [first,last,q]of [[L,M,'question:material-base'],[M,L,'question:material-sequence']])check(`${q}: same road survives in both orders without claiming proof`,()=>{
 const {s,before,after,plan}=step([first],last),f=before.l.frontiers.find(f=>f.id===q),r=after.l.routes.find(r=>r.id==='enquiry:material-pair');
 assert.ok(r,'Complementary readings must leave a visible link');assert.equal(r.arrow,false);assert.notEqual(r.kind,'support');assert.equal(f.segments[0].d,r.d);
 assert.ok(plan.retiring.find(x=>x.frontier.id===q).retireAt>=plan.routes[r.id].end);
 const focus=resolveFocus({kind:'edge',id:r.id},after,s);assert.deepEqual(focus.claimIds,[]);assert.equal(s.log.length,2);assert.equal(after.graph.nodes.length,2);
 const reverse=first===L;assert.equal(plan.routes[r.id].reverse,reverse,'Grow out of the previously known end');
 return{road:r.id,reverse,retireAt:plan.retiring.find(x=>x.frontier.id===q).retireAt};
});
for(const group of ['T2','T3'])for(const role of ['RELATE','CORROBORATE'])check(`${group} ${role}: record first, report second, no object view`,()=>{
 const read=group==='T2'?'A.RESEARCH.ACCIDENT':'A.RESEARCH.LATE_TREATMENT',action=role==='RELATE'?`A.RELATE.ARCHIVE.${group}_TO_OBJECT`:`A.CORROBORATE.ARCHIVE.${group}_CURRENT`;
 const {before,after,plan}=step([read],action),qid=`question:archive:${group.toLowerCase()}:${role==='RELATE'?'attribution':'corroboration'}`;
 const f=before.l.frontiers.find(f=>f.id===qid),r=after.l.routes.find(r=>r.kind==='source-record');assert.ok(f&&r);
 assert.equal(f.segments[0].d,r.d);assert.ok(plan.retiring.find(x=>x.frontier.id===qid).retireAt>=plan.routes[r.id].end);
 assert.equal(plan.routes[r.id].reverse,true);return{road:r.id};
});
check('UV capability limit survives trial windows and regional synthesis',()=>{const {after}=step([V,T],S);assert.ok(after.graph.frontiers.some(f=>f.id==='question:negative'&&f.kind==='boundary'));assert.ok(!after.graph.edges.some(e=>e.kind==='support'&&e.from==='obs.surface.no-signal.unresolved'));});
check('Alternative identity proof does not pretend an unperformed period comparison is completed',()=>{const {after}=step([W,B,P],C);assert.equal(after.solved.claims.identity.established,true);assert.ok(after.graph.frontiers.some(f=>f.id==='question:craft'));assert.ok(!after.graph.nodes.some(n=>n.id==='obs.corpus.identity'));});
check('Surface enquiry is handed to the new question after its connecting trail',()=>{
 const {before,after,plan}=step(['A.OBSERVE.REGION_DECOR'],T),f=before.l.frontiers.find(f=>f.id==='question:appearance'),r=after.l.routes.find(r=>r.id==='enquiry:appearance-windows');assert.ok(r);assert.equal(r.d,f.segments[0].d);
 assert.ok(plan.frontiers['question:surface'].start>=plan.routes[r.id].end);assert.ok(plan.retiring.find(x=>x.frontier.id===f.id).retireAt>=plan.routes[r.id].end);
});
check('One repair branch leaves the other exploration directions open',()=>{const {after,plan}=step([W],X);const f=after.graph.frontiers.find(f=>f.id==='question:visible-intervention');assert.ok(f);assert.ok(after.l.routes.some(r=>r.id==='enquiry:visible-structure'));assert.ok(f.actionIds.includes('A.OBSERVE.REGION_DECOR'));assert.ok(plan.frontiers['question:change'].start>=plan.routes['enquiry:visible-structure'].end);});
check('Actual X-ray material used by a comparison retains its enquiry trail',()=>{const {before,after,plan}=step([X,P,W,B,C],'A.MAP.REGION_CONTINUITY',{comparisonBasis:'photo'});const f=before.l.frontiers.find(f=>f.id==='question:change'),r=after.l.routes.find(r=>r.id==='enquiry:structure-comparison');assert.ok(r);assert.equal(r.d,f.segments[0].d);assert.ok(plan.retiring.find(x=>x.frontier.id===f.id).retireAt>=plan.routes[r.id].end);});
check('Alternate corpus comparison follows its own branch and remains traceable later',()=>{
 const {before,after,plan}=step([W,B,P,C],'A.COMPARE.CORPUS.RECHECK');const f=before.l.frontiers.find(f=>f.id==='question:craft');
 const paths=after.l.routes.filter(r=>r.id.startsWith('enquiry:craft-repeat'));
 assert.equal(paths.length,2);assert.ok(paths.every(r=>f.segments.some(s=>s.d===r.d)));
 assert.ok(plan.retiring.find(x=>x.frontier.id===f.id).retireAt>=Math.max(...paths.map(r=>plan.routes[r.id].end)));
 const next=step([W,B,P,C,'A.COMPARE.CORPUS.RECHECK'],'A.COMPARE.CORPUS');assert.ok(next.after.graph.nodes.some(n=>n.id==='obs.corpus.identity.repeat'));
});
check('Archive cross-time comparison has a separate enquiry branch before it is acquired',()=>{
 const {before,after,plan}=step([W,'A.RESEARCH.ACCIDENT'],'A.MAP.REGION_CONTINUITY',{comparisonBasis:'archive'});
 const f=before.l.frontiers.find(f=>f.id==='question:archive:t2:corroboration'),r=after.l.routes.find(r=>r.id==='enquiry:archive-comparison');
 assert.ok(f.segments.some(s=>s.d===r.d));assert.ok(plan.retiring.find(x=>x.frontier.id===f.id).retireAt>=plan.routes[r.id].end);
 assert.equal(after.graph.observations.find(o=>o.id==='obs.structure.major.documented-cross-time').interpretationState,'awaiting-attribution');
 assert.ok(after.graph.frontiers.some(f=>f.id==='question:archive:t2:attribution'));
});
check('A history question traces interpreted early material to acquired records',()=>{
 const {s,after}=step([W,B,P,'A.RESEARCH.ACCIDENT','A.RELATE.ARCHIVE.T2_TO_OBJECT','A.CORROBORATE.ARCHIVE.T2_CURRENT'],C);
 const q=after.graph.frontiers.find(f=>f.id==='question:history');assert.ok(q);
 assert.ok(q.sourceIds.includes('obs.phase.t1'));assert.ok(q.sourceIds.includes('obs.object.continuity'));
 assert.ok(q.sourceIds.every(id=>after.graph.observations.some(o=>o.id===id)));
 const focus=resolveFocus({kind:'gap',id:q.id},after,s);assert.ok(focus.sources.some(o=>o.id==='obs.phase.t1'));
});
console.log(JSON.stringify({reviewRequired:true,passed:results.filter(r=>r.passed).length,total:results.length,results},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
