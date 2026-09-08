/* Fusion-only presentation of the approved local relationships.
 * Interpretations are views of existing solved facts, never ledger entries or
 * additional claims, factors, votes, or acquisition actions. */
const O = {
  photo:'obs.phase.t1', base:'obs.current.base', whole:'obs.current.whole',
  continuity:'obs.object.continuity', xray:'obs.structure.xray.early',
  physical:'obs.structure.major.cross-time', documented:'obs.structure.major.documented-cross-time',
  accident:'obs.accident.major', attribution:'obs.archive.t2.object-attribution',
};
const unique = values => [...new Set(values.filter(Boolean))];

export function projectLocalRelations(graph, solved, session) {
  const facts = new Set(solved.coverage?.facts ?? []);
  const observations = new Map(graph.observations.map(o => [o.id,o]));
  const acquired = new Map((session?.acquired ?? []).map(e => [e.observationId,e]));
  const has = id => observations.has(id);
  const node = id => graph.nodes.find(n => n.id===id);
  const patch = (id, value) => { if(node(id)) Object.assign(node(id),value); if(observations.has(id)) Object.assign(observations.get(id),value); };
  const sources = ids => unique(ids).filter(has);
  const explained = id => (acquired.get(id)?.requiresContextFacts ?? []).every(fact => facts.has(fact));
  const photoReady = has(O.photo)&&has(O.continuity)&&has(O.base)&&facts.has('t1Established');
  graph.localSupportGroups=[];
  graph.proofRepresentatives={};
  graph.questions=graph.questions.filter(q=>q.id!=='question:context');

  patch(O.xray,{title:'当前内部的接合痕迹',state:'known',contextualized:false,interpretationState:'current',
    summary:'今日多角度成像已经留下声明可读区域内的接合、填料候选与瓷片边界。它直接记录当前结构；历史照片核验不决定这份当前观察是否存在，也不替所有接合断代。'});
  patch(O.photo,{title:'旧照片中的锔修痕迹',state:'known',contextualized:photoReady,
    interpretationState:photoReady?'established':'awaiting-attribution',stateLabel:photoReady?'已接入本器历史':'',
    summary:'19世纪末的旧照片中可见足部瑕疵与旧锔痕。照片的这些内容已经取得。'+(photoReady?'本照片与现器核验相符后，锔痕可以归入这只碗的早期历史。':'还需核对照片中的对象是否就是眼前这只碗。')+'具体图像与特征值尚未制作；此处沿用已设定的案例内容。'});
  patch(O.continuity,{title:'旧照片与现器的核验报告',summary:'核验针对本例已取得的旧照片与现器对应特征。报告支持为同一对象；它不替事故记录、后期处理报告或其他历史材料完成归属。'});

  // Remove the obsolete shared-context connections, keeping unrelated genuine
  // context edges (e.g. manufacturing observations used by corpus comparison).
  graph.edges=graph.edges.filter(e=>!(e.kind==='context'&&(
    (e.from===O.continuity&&[O.photo,O.xray,O.physical,O.documented].includes(e.to))||
    [O.physical,O.documented].includes(e.to))));

  if(has(O.continuity)&&node(O.photo)&&node(O.base)) {
    observations.get(O.continuity).nodeId=O.photo;
    observations.get(O.continuity).representedAs='relation';
    graph.nodes=graph.nodes.filter(n=>n.id!==O.continuity);
    graph.edges=graph.edges.map(e=>({...e,from:e.from===O.continuity?O.photo:e.from,to:e.to===O.continuity?O.photo:e.to})).filter(e=>e.from!==e.to);
  }
  const addEdge=(id,from,to,label,kind,sourceIds,details,directed=true,extra={})=>{
    if(!node(from)||!node(to)||from===to)return;
    const edge={id,from,to,label,kind,sourceIds:sources(sourceIds),details,directed,...extra};
    if(!edge.sourceIds.length)return;
    const index=graph.edges.findIndex(e=>e.id===id);
    if(index<0)graph.edges.push(edge);else graph.edges[index]=edge;
  };
  const addInterpretation=(id,title,summary,sourceIds,anchorIds)=>{
    if(!sourceIds.every(has)||node(id))return;
    graph.nodes.push({id,kind:'interpretation',state:'known',title,summary,sourceIds:sources(sourceIds),
      group:'history',interpretationOnly:true,layoutAnchorIds:anchorIds.filter(id=>node(id)),stateLabel:'已有信息的新用途'});
  };
  const representProof=(edge,interpretationId)=>{
    edge.from=interpretationId;
    edge.sourceIds=sources([...edge.sourceIds,...node(interpretationId).sourceIds]);
    const claim=node(edge.to);
    if(claim?.kind==='claim')claim.sourceIds=sources([...(claim.sourceIds??[]),...edge.sourceIds]);
  };

  if(has(O.photo)&&has(O.continuity)&&node(O.base)) {
    addEdge('photo:object',O.base,O.photo,'照片与现器的对应特征相符','attribution',
      [O.photo,O.base,O.continuity],'这份核验报告支持指定旧照片与眼前器物为同一对象。照片和现器观察先取得，报告后来建立两端关系。点击原始依据可回查核验；不是照片与X射线互相证明。',false);
  }else if(node(O.photo)){
    const anchors=[O.photo,O.base].filter(id=>node(id));
    graph.questions.push({id:'question:photo-object',kind:anchors.length===2?'gap':'stub',anchorIds:anchors,
      title:'照片里是眼前这只碗吗？',
      explanation:has(O.base)?'旧照片和现器对应特征都在手，尚未取得这张照片的归属核验。两份材料的存在不等于已经相符。':'照片内容已取得；先观察现器的对应特征，才有这次核验所需的另一端材料。',
      actionIds:has(O.base)?['A.VERIFY.OBJECT_CONTINUITY']:['A.OBSERVE.BASE','A.VERIFY.OBJECT_CONTINUITY'],
      sourceIds:sources([...anchors,has(O.physical)?O.physical:null]),
      continuation:{nodeIds:[],edgeIds:['photo:object']}});
  }
  if(photoReady){
    const id='interpretation:photo-repair';
    addInterpretation(id,'照片拍摄时已留有锔修痕迹','至迟在这张19世纪末照片拍摄时，这只碗已经过锔修。这是既有早期状态事实的范围表述，不新增计分判断，不把今天所有内部接合都定为同一时期。',
      [O.photo,O.continuity,O.base],[O.photo]);
    addEdge('interpretation:photo-history',O.photo,id,'旧照片接入本器早期历史','support',[O.photo,O.continuity,O.base],
      '照片中的旧锔痕、有效时点与本照片核验共同允许这一表述。照片没有重新取得，核验报告也没有变成另一份照片。');
    for(const edge of graph.edges)if(edge.kind==='support'&&edge.from===O.photo&&edge.to==='claim:threePhase')representProof(edge,id);
  }

  for(const [id,basis,origin,attr,fact,interpretationId] of [
    [O.physical,'photo',O.photo,O.continuity,'crossTimeMajorChange','interpretation:photo-change'],
    [O.documented,'archive',O.accident,O.attribution,'t2EventPhysicalCorrespondence','interpretation:archive-change'],
  ]){
    if(!has(id))continue;
    const active=explained(id)&&facts.has(fact);
    const event=acquired.get(id);
    const entry=session?.log?.find(item=>item.observationId===id);
    const materialIds=sources(entry?.materialObservationIds??event?.materialObservationIds??(basis==='photo'?[O.photo,O.whole,O.xray]:[O.accident,O.whole]));
    patch(id,{title:basis==='photo'?'旧照与现状的区域差异报告':'事故记录与现状的比较报告',state:'known',
      contextualized:active,interpretationState:active?'established':'awaiting-attribution',
      stateLabel:active?'已接入本器历史':'报告已取得 · 归属待核实',
      summary:(basis==='photo'?'报告比较指定旧照的可见区域与当前修补记录，成像只补充当前结构定位。':'报告比较指定事故记录与当前修补记录。')+
        (active?'相应的对象归属已确认，原报告现可用于本器历史。':'比较报告已经取得；对象归属还未确认，不能把记录间的差异直接说成本器经历的变化。')+
        '适用范围仍限于原报告声明的可比区域。旧照片未显露的内部接缝不构成“不存在”的证据，具体对照素材尚未制作。',
      materialObservationIds:materialIds,comparisonBasis:basis});
    if(node(id))node(id).layoutAnchorIds=materialIds.filter(id=>node(id));
    for(const materialId of materialIds){
      const label=materialId===origin?'这份记录提供历史参照':materialId===O.xray?'成像补充当前结构定位':'现器观察提供当前参照';
      addEdge(`comparison-material:${basis}:${materialId}`,materialId,id,label,'reference',[materialId,id],
        '这条道路说明本报告使用了哪份已取得材料，不单独证明本器发生变化。报告的取得时间与原始来源保持可查。');
    }
    if(active&&has(attr)&&node(origin)&&node(id)){
      const needed=sources([...materialIds,id,attr]);
      addInterpretation(interpretationId,basis==='photo'?'此碗在两个时点间的区域变化':'事故处理与现物的对应',
        basis==='photo'?'指定历史材料与当前区域的差异，在对象归属和时点明确后可归为本器的范围限定变化。完整重大重组判断仍使用原求解器的全部证明条件。':'事故记录已归属本器，原比较报告在声明范围内对所述处理提供现物印证。它不替后期记录作归属，也不改变原报告的取得次数。',needed,[id,origin]);
      const differenceEdge=`interpretation:${basis}:difference`,attributionEdge=`interpretation:${basis}:attribution`;
      addEdge(differenceEdge,id,interpretationId,basis==='photo'?'原比较报告提供范围内的差异':'比较报告提供处理与现物的对应','support',needed,
        basis==='photo'?'差异报告与对应对象归属共同成立；报告可以先于归属取得。':'比较报告与事故记录归属共同支持现物印证；两份报告可以换序取得。');
      addEdge(attributionEdge,origin,interpretationId,'已核实的归属提供本器历史用途','support',needed,
        basis==='photo'?'这一入路使用旧照片与现器的原始核验报告；它不为X射线的当前观察提供有效性。':'这一入路使用事故记录自己的归属报告，不使用旧照片的核验代替。');
      graph.localSupportGroups.push({id:`interpretation-group:${basis}`,targetId:interpretationId,kind:'all',
        title:'比较报告与对应归属共同支持',sourceIds:needed,memberNodeIds:[id,origin],edgeIds:[differenceEdge,attributionEdge]});
      graph.proofRepresentatives[id]=interpretationId;
      for(const edge of graph.edges)if(edge.kind==='support'&&edge.from===id&&edge.to.startsWith('claim:'))representProof(edge,interpretationId);
    }
  }
  // Old report IDs remain selectable even when rendered by a road.
  refreshObservationEdges(graph);
  return graph;
}

export function refreshObservationEdges(graph){
  for(const observation of graph.observations)observation.edgeIds=graph.edges.filter(edge=>edge.sourceIds?.includes(observation.id)).map(edge=>edge.id);
}
