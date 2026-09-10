import * as SessionEngine from '../../workbench-map-fusion-v0/local-session.mjs';
import { ACTIONS as frozenActions } from '../../workbench-map-fusion-v0/local-case.mjs';
import { buildGraph, diffGraphs } from '../../workbench-map-fusion-v0/graph.mjs';
import { resolveSelection, judgmentOverview, judgmentFacets } from '../../workbench-map-fusion-v0/selection.mjs';

// This boundary consumes the existing solver; presentation never rewrites it.
export const engine = SessionEngine as any;
export const actions: any[] = frozenActions;
export { buildGraph, diffGraphs };
export type Selection = { kind: 'place'|'action'|'evidence'|'claim'|'edge'|'gap'|'group'; id: string } | null;
export type Investigation = { id:number; observationId:string; result:any; changes:any; origin:{x:number;y:number}; beforeGraph?:any; originPlaceId?:string; } | null;
export const places = [
  {id:'OBJ_W',name:'整只碗',group:'object'}, {id:'OBJ_F',name:'底足与修足',group:'object'},
  {id:'OBJ_D',name:'纹饰与色差',group:'object'}, {id:'OBJ_R',name:'没被改动的特征',group:'object'},
  {id:'SURF',name:'表面与层次',group:'object'},
  {id:'XRAY',name:'X 射线成像',group:'送检'}, {id:'UV',name:'紫外检查',group:'送检'}, {id:'MAT',name:'材料化验',group:'送检'},
  {id:'T1',name:'更早的影像',group:'查档'}, {id:'T2',name:'事故记录',group:'查档'},
  {id:'T3',name:'后期处理记录',group:'查档'}, {id:'PROV',name:'经手记录',group:'查档'},
  {id:'CORPUS',name:'同期真品',group:'比对'}, {id:'RPT',name:'另一批真品',group:'比对'},
  {id:'STAB',name:'结构与陈列',group:'现状'},
];
export const costNames=['免费','低','中','高'];
export const actionById = new Map(actions.map(a=>[a.id,a]));
export const placeById = new Map(places.map(p=>[p.id,p]));
export const stageNames:Record<string,string>={NONE:'尚在辨认',G1:'已有初步方向',G2:'主要经历已有依据',G3:'形成较完整的解释'};
export function derive(session:any){
  const solved=engine.solve(session), graph:any=buildGraph(solved,session),rows:any[]=engine.workbench(session);
  return {solved,graph,rows,overview:(judgmentOverview as any)(solved,graph),facets:(judgmentFacets as any)(solved,rows)};
}
export function resolveFocus(selection:Selection,model:ReturnType<typeof derive>,session:any){
  if(selection?.kind==='group'){
    const group=model.graph.supportGroups.find((g:any)=>g.id===selection.id);
    if(group)return {active:true,related:true,subject:group,nodeIds:[...group.memberNodeIds,group.targetId],edgeIds:group.edgeIds,
      frontierIds:[],actionIds:model.graph.observations.filter((o:any)=>group.sourceIds.includes(o.id)).map((o:any)=>o.actionId),
      placeIds:[],claimIds:[group.targetId.replace('claim:','')],sourceIds:group.sourceIds,
      sources:model.graph.observations.filter((o:any)=>group.sourceIds.includes(o.id)),primaryNodeIds:[group.targetId],primaryEdgeIds:group.edgeIds};
  }
  const projected:any=(resolveSelection as any)(selection,model.graph,model.solved,session,model.rows);
  if(!selection||!projected.subject)return projected;
  const graph=model.graph;
  // Selecting a judgment highlights its actual incoming proofs, never the
  // downstream claims that happen to cite one of the same source reports.
  if(selection.kind==='claim'){
    const id=selection.id.startsWith('claim:')?selection.id:`claim:${selection.id}`;
    const incoming=graph.edges.filter((e:any)=>e.to===id&&['support','conflict'].includes(e.kind));
    projected.edgeIds=incoming.map((e:any)=>e.id);
    projected.primaryEdgeIds=[...projected.edgeIds];
  }
  const observation=selection.kind==='evidence'?graph.observations.find((o:any)=>o.id===selection.id):null;
  const folded=observation?.representedAs==='relation';
  if(folded){
    const carriers=graph.edges.filter((e:any)=>['attribution','corroboration','same-object'].includes(e.kind)&&e.sourceIds?.includes(observation.id));
    projected.edgeIds=carriers.map((e:any)=>e.id);
    projected.primaryEdgeIds=[...projected.edgeIds];
    projected.nodeIds=[...new Set(carriers.flatMap((e:any)=>[e.from,e.to]))];
  }
  const report=observation||((selection.kind==='edge'&&selection.id==='photo:object')?graph.observations.find((o:any)=>o.id==='obs.object.continuity'):null);
  let inputIds:string[]=[];
  if(report){
    inputIds=(report.materialObservationIds||[]).filter((id:string)=>graph.nodes.some((n:any)=>n.id===id));
    if(!inputIds.length)inputIds=graph.edges.filter((e:any)=>e.to===report.id&&['reference','context'].includes(e.kind)).map((e:any)=>e.from);
    if(report.id==='obs.object.continuity')inputIds=['obs.phase.t1','obs.current.base'].filter(id=>graph.nodes.some((n:any)=>n.id===id));
  }
  projected.inputNodeIds=[...new Set(inputIds)];
  projected.nodeIds=[...new Set([...projected.nodeIds,...inputIds])];
  projected.inputSources=inputIds.map(id=>graph.observations.find((o:any)=>o.id===id)).filter(Boolean);
  for(const o of projected.inputSources){if(!projected.actionIds.includes(o.actionId))projected.actionIds.push(o.actionId);const place=actionById.get(o.actionId)?.place;if(place&&!projected.placeIds.includes(place))projected.placeIds.push(place);}
  return projected;
}
export function billText(session:any){return session.billed.map((count:number,i:number)=>count?`${costNames[i]} × ${count}`:'').filter(Boolean).join(' · ')||'尚未产生调查费用';}
export function observationTitle(graph:any,id:string){return graph.observations.find((o:any)=>o.id===id)?.title||'调查记录';}
export const cleanCopy=(text:string='')=>text.replace(/具体图像与特征值尚未制作；此处沿用已设定的案例内容。/g,'').replace(/\s*当前：.*$/,'').replace(/声明/g,'注明');
