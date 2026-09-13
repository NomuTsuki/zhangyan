/** Read-only provenance presentation. These links never supply proof roles,
 * observations, claim witnesses, or acquisition conditions to the solver. */
export const REPORT_SOURCES = Object.freeze(Object.fromEntries(['t2','t3'].flatMap(group=>
 ['object-attribution','current-corroboration'].map(role=>{
  const reportId=`obs.archive.${group}.${role}`;
  return [reportId,{reportId,recordId:group==='t2'?'obs.accident.major':'obs.phase.t3',group,
   relationKey:role==='object-attribution'?'attribution':'corroboration',sourceEdgeId:`source:${reportId}`}];
 }))));

export function connectReportSources(graph) {
 const acquired=new Map(graph.observations.map(o=>[o.id,o])),visible=new Set(graph.nodes.map(n=>n.id));
 const bindings=Object.values(REPORT_SOURCES).filter(b=>acquired.has(b.reportId)).map(b=>{
  const carrier=graph.edges.find(e=>e.id===`archive:${b.group}:object`&&e.sourceIds.includes(b.reportId));
  return {...b,recordAcquired:acquired.has(b.recordId),carrierEdgeId:carrier?.id??null,title:acquired.get(b.reportId).title};
 });
 const edges=bindings.filter(b=>b.recordAcquired&&visible.has(b.reportId)&&visible.has(b.recordId)).map(b=>({
  id:b.sourceEdgeId,from:b.reportId,to:b.recordId,kind:'source-record',directed:false,
  label:'核验报告对应这份记录',details:'这条线对应核验报告及其原始记录，便于回查。它不新增核验结果，也不表示记载事件已经得到实物印证。',
  sourceIds:[b.reportId,b.recordId],provenanceOnly:true,
 }));
 return {...graph,edges:[...graph.edges,...edges],reportBindings:bindings};
}
