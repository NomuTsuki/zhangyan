/** Display-only enquiry continuity. No fact, observation, proof role or action
 * is created here. An enquiry trail records scope/complementarity, never proof. */
import {NAMES as N} from './fixed-map-schema.mjs';
import {REPORT_SOURCES} from './archive-report-links.mjs';
const pair=(id,from,to,label,details)=>({id,from,to,label,details,kind:'enquiry',directed:false,provenanceOnly:true,sourceIds:[from,to]});
export const ENQUIRY_ROUTES=[
 pair('enquiry:material-pair',N.MAT,N.LAYER,'基底与层序互补','基底读数说明材料，层序读数说明先后。两份调查互补，不能互相替代，也不单独证明完整修复史。'),
 pair('enquiry:appearance-windows',N.DECOR,N.POINT,'从外观查到层次','外观调查留下问题，试窗记录所查点位的层次。此线记录调查的接续，不把点位结果外推为整器结论。'),
 pair('enquiry:visible-structure',N.W,N.X,'从可见修补查到内部','整器观察与成像分别记录可见修补和当前内部结构。这是调查方向的接续，不是两项材料相互证明。'),
 pair('enquiry:visible-surface',N.W,N.DECOR,'从可见修补查到外观','整器观察与纹饰调查分别记录修补分布和外观变化；其他修复问题仍可继续调查。'),
 pair('enquiry:visible-records',N.W,N.T2,'从可见修补查到记录','修补调查延伸到事故记录。取得记录不等于确认记录属于本碗，也不等于记载事件已获实物印证。'),
 pair('enquiry:craft-whole',N.W,N.C,'整体特征用于比对','这条联系保留比对使用的整体制造读数；年代判断仍需要完整的共同依据。'),
 pair('enquiry:craft-base',N.B,N.C,'底足特征用于比对','这条联系保留比对使用的底足读数；年代判断仍需要完整的共同依据。'),
 pair('enquiry:craft-repeat-whole',N.W,'obs.corpus.identity.repeat','整体特征用于比对','这条联系保留比对使用的整体制造读数；年代判断仍需要完整的共同依据。'),
 pair('enquiry:craft-repeat-base',N.B,'obs.corpus.identity.repeat','底足特征用于比对','这条联系保留比对使用的底足读数；年代判断仍需要完整的共同依据。'),
 pair('enquiry:structure-comparison',N.X,N.D,'成像用于区域比较','成像提供本次比较使用的当前结构定位。比较报告的历史用途仍需要对应对象的核验，不能由这条联系单独推出。'),
 pair('enquiry:archive-comparison',N.T2,N.DA,'记录用于区域比较','比较使用这份事故记录。报告已经取得与报告能否用于本器历史分别判断，归属未明时仍需核验。'),
];
export const ENQUIRY_BY_ID=Object.fromEntries(ENQUIRY_ROUTES.map(r=>[r.id,r]));
const intent=r=>({id:r.id,from:r.from,to:r.to});
const route=id=>intent(ENQUIRY_BY_ID[id]);
const make=(id,anchorIds,title,explanation,actionIds)=>({id,kind:'stub',anchorIds,title,explanation,actionIds,sourceIds:anchorIds,continuation:{nodeIds:[],edgeIds:[]}});

export function projectFrontierContinuity(graph){
 // The alternate comparison is an actually acquired record. Keep its authored
 // slot when the first corpus later arrives, rather than silently dropping its
 // enquiry trails because the inherited atlas stores it only in the log.
 const repeat=graph.observations.find(o=>o.id==='obs.corpus.identity.repeat');
 if(repeat&&!graph.nodes.some(n=>n.id===repeat.id))graph={...graph,nodes:[...graph.nodes,{...repeat,kind:'evidence',state:'known',sourceIds:[repeat.id]}],
  observations:graph.observations.map(o=>o.id===repeat.id?{...o,nodeId:o.id,representedAs:'node'}:o)};
 const has=id=>graph.nodes.some(n=>n.id===id),obtained=id=>graph.observations.some(o=>o.id===id);
 const frontiers=graph.frontiers.map(f=>({...f}));
 const set=f=>{const i=frontiers.findIndex(x=>x.id===f.id);if(i<0)frontiers.push(f);else frontiers[i]=f;};
 // A limitation survives later investigations: another method cannot upgrade
 // an earlier negative result into evidence of absence.
 if(has(N.UV))set(make('question:negative',[N.UV],'未检出不能证明没有补绘','本次紫外检查的能力限制仍然保留。其他方法取得的新信息不会使这次未检出变成不存在的证明。',has(N.POINT)?[]:['A.INSPECT.WINDOWS']));
 if(has(N.W)&&!obtained(N.C)&&!obtained('obs.corpus.identity.repeat'))set(make('question:craft',[N.W,N.B].filter(has),'这些制造特征放进历史参照会怎样？','把已有的形制与底足读数放进同期真品参照，可以了解哪些身份方向对得上、哪些对不上。',['A.COMPARE.CORPUS']));
 const branches=[['enquiry:visible-structure','A.IMAGE.XRAY'],['enquiry:visible-surface','A.OBSERVE.REGION_DECOR'],['enquiry:visible-records','A.RESEARCH.ACCIDENT']];
 const open=branches.filter(([id])=>!has(ENQUIRY_BY_ID[id].to));
 if(has(N.W)&&open.length)set(make('question:visible-intervention',[N.W],'眼见的修补牵涉哪些层面？','肉眼已经看到修补分布。纹饰色差、内部结构或事件记录能从不同方面继续了解这些改动。',open.map(([,a])=>a)));
 const edges=[...graph.edges,...ENQUIRY_ROUTES.filter(r=>has(r.from)&&has(r.to)).map(r=>({...r}))];
 for(const f of frontiers){
  let intents=[];let role='relation';
  if(f.id==='question:material-base'||f.id==='question:material-sequence'){intents=[route('enquiry:material-pair')];role='complement';}
  if(f.id==='question:appearance'){intents=[route('enquiry:appearance-windows')];role='enquiry';}
  if(f.id==='question:change'){intents=[route('enquiry:structure-comparison')];role='enquiry';}
  if(f.id==='question:craft'){
   intents=f.anchorIds.map(id=>route(id===N.B?'enquiry:craft-base':'enquiry:craft-whole'));
   f.alternativeRoads=f.anchorIds.map(id=>route(id===N.B?'enquiry:craft-repeat-base':'enquiry:craft-repeat-whole'));
   f.actionIds=[...new Set([...f.actionIds,'A.COMPARE.CORPUS.RECHECK'])];role='enquiry';
  }
  if(f.id==='question:visible-intervention'){intents=open.map(([id])=>route(id));role='enquiry';}
  if(f.id==='question:negative'){f.kind='boundary';role='boundary';}
  if(f.id==='question:history'){
   const members=[has(N.EARLY)?N.EARLY:has(N.P)?N.P:null,N.T2,N.T3].filter(id=>id&&has(id));
   f.anchorIds=members;
   f.sourceIds=[...new Set(members.flatMap(id=>graph.nodes.find(n=>n.id===id)?.sourceIds||[id]))].filter(obtained);
   intents=members.map(id=>id===N.P?{id:'interpretation:photo-history',from:N.P,to:N.EARLY}:
    {id:`proof-group:threePhase:input:${id}`,from:id,to:'JT'});
   role='convergence';
  }
  const archive=/^question:archive:(t[23]):(attribution|corroboration)$/.exec(f.id);
  if(archive&&f.kind!=='conflict'){
   const report=Object.values(REPORT_SOURCES).find(b=>b.group===archive[1]&&b.relationKey===archive[2]);
   // Without the object endpoint, the next visible material is the actual
   // verification report. Its later folding is an explicit handover.
   if(!has(N.W))intents=[{id:report.sourceEdgeId,from:report.reportId,to:report.recordId}];
   if(archive[1]==='t2'&&archive[2]==='corroboration'&&!has(N.DA)&&has(N.W))f.alternativeRoads=[route('enquiry:archive-comparison')];
   f.successorRouteIds=[report.sourceEdgeId,`archive:${archive[1]}:object`,...(archive[1]==='t2'&&archive[2]==='corroboration'?['enquiry:archive-comparison','interpretation:archive:difference']:[])];
  }
  f.continuity={role,roads:intents,completionTargets:f.id==='question:history'?['claim:threePhase']:[]};
  f.successorRouteIds=[...new Set([...(f.successorRouteIds||[]),...intents.map(r=>r.id),...(f.alternativeRoads||[]).map(r=>r.id),...(f.continuation?.edgeIds||[])])];
 }
 return {...graph,edges,frontiers,questions:frontiers,frontierContractVersion:1};
}
