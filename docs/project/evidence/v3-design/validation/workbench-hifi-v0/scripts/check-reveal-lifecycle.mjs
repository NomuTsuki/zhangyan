/* review required: regression checks use the actual session and graph, no invented result nodes. */
import assert from 'node:assert/strict';
import * as engine from '../../workbench-map-fusion-v0/local-session.mjs';
import {buildGraph,diffGraphs} from '../../workbench-map-fusion-v0/graph.mjs';
import {layoutMap} from '../src/map-layout.mjs';
import {roadTransitionPlan,MOTION} from '../src/map-motion.mjs';
const W='A.OBSERVE.WHOLE',B='A.OBSERVE.BASE',P='A.LOCATE.HISTORIC_IMAGE',C='A.VERIFY.OBJECT_CONTINUITY',X='A.IMAGE.XRAY';
const graph=s=>buildGraph(engine.solve(s),s);
function change(actions,id){const s=engine.newSession();for(const a of actions)assert.ok(engine.take(s,a).ok);const before=graph(s);assert.ok(engine.take(s,id).ok);const after=graph(s),old=layoutMap(before),layout=layoutMap(after);return {before,after,old,layout,plan:roadTransitionPlan(after,layout,old,diffGraphs(before,after))};}
let count=0;function check(name,fn){fn();count++;console.log(JSON.stringify({name,passed:true}));}
check('First information grows its question only in the connection phase',()=>{const {plan}=change([],X);assert.equal(plan.frontiers['question:change'].start,0);assert.equal(plan.frontiers['question:change'].duration,MOTION.frontier);assert.ok(plan.duration>=MOTION.frontier+240);assert.equal(plan.retiring.length,0);});
check('Historical interpretation waits for its true route; old questions remain old',()=>{const {plan,layout}=change([W,B,P],C);assert.ok(plan.nodeDelays['interpretation:photo-repair']>=plan.routes['interpretation:photo-history'].end);assert.ok(plan.nodeDelays['interpretation:photo-repair']>plan.routes['photo:object'].end);assert.ok(layout.frontiers.some(f=>f.id==='question:visible-intervention'));assert.equal(plan.frontiers['question:visible-intervention'],undefined);});
check('Old correspondence question stays until the actual road reaches it',()=>{const {plan}=change([W,B,P],C);const old=plan.retiring.find(r=>r.frontier.id==='question:photo-object');assert.ok(old);assert.equal(old.retireAt,plan.routes['photo:object'].end);});
check('A second independent material retains existing frontier ink',()=>{const {plan}=change([X],P);assert.equal(plan.frontiers['question:change'],undefined);assert.ok(plan.frontiers['question:photo-object']);});
check('Surface range frontier is replaced by its same canonical road',()=>{const {plan,old,layout}=change(['A.INSPECT.WINDOWS'],'A.SYNTHESIZE.SURFACE_REGIONS');const f=old.frontiers.find(f=>f.canonicalRouteId==='support:obs.surface.point-layering:obs.surface.resolved');assert.ok(f);const road=layout.routes.find(r=>r.id===f.canonicalRouteId);assert.ok(road);assert.equal(road.d,f.segments[0].d);const retired=plan.retiring.find(r=>r.frontier.id===f.id);assert.equal(retired.retireAt,plan.routes[road.id].end);});
console.log(JSON.stringify({reviewRequired:true,passed:count,total:5}));
