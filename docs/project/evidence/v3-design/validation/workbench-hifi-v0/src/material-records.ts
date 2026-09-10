import { SOURCE_BINDINGS } from '../../workbench-map-fusion-v0/local-case.mjs';

/** The selection that led to a material, kept while following its inputs. */
export type MaterialContext = {
  kind: string;
  id: string;
  title: string;
  status?: string;
  sourceIds?: string[];
};

const O = {
  whole: 'obs.current.whole', base: 'obs.current.base', photo: 'obs.phase.t1',
  continuity: 'obs.object.continuity', xray: 'obs.structure.xray.early',
  comparison: 'obs.structure.major.cross-time', documented: 'obs.structure.major.documented-cross-time',
  accident: 'obs.accident.major', later: 'obs.phase.t3', corpus: 'obs.corpus.identity',
  repeat: 'obs.corpus.identity.repeat', appearance: 'obs.appearance.restore',
  point: 'obs.surface.point-layering', surface: 'obs.surface.resolved', negative: 'obs.surface.no-signal.unresolved',
  substrate: 'obs.key-material.substrate-readings', layer: 'obs.key-material.layer-sequence',
  stability: 'obs.stability.resolved', provenance: 'obs.documentation.resolved',
  t2attr: 'obs.archive.t2.object-attribution', t2corr: 'obs.archive.t2.current-corroboration',
  t3attr: 'obs.archive.t3.object-attribution', t3corr: 'obs.archive.t3.current-corroboration',
};
type RecordCopy = { result: string; scope: string; limit: string; role: string };
const records: Record<string, RecordCopy> = {
  [O.whole]: {
    result: '已留下整器形制、胎釉，以及肉眼可见修补分布的观察记录。', scope: '现器整体与可见表面',
    limit: '看见修补，不等于已经证明内部曾被大规模拆散重组；整器观察也没有单独确定年代。',
    role: '提供当前器形与可见修补的参照，供工艺比对和现状对照使用。',
  },
  [O.base]: {
    result: '底足观察留下了修削与成型特征的局部读数。', scope: '实际查看的底足部位',
    limit: '底足是制造工艺的局部依据，不能独自确定整器年代，也不自动把某份历史记录归到这只碗。',
    role: '补充整器观察没有覆盖的底足制造特征，并为指定旧照片的对象核验提供当前材料。',
  },
  [O.corpus]: {
    result: '本次已把现器制造特征与同期真品参照进行比对，留下排除与保留身份方向的结果。', scope: '本次采用的制造特征与真品参照',
    limit: '这份比对不独自证明重大修复或修复先后；仍需结合现器整体与底足读数。',
    role: '在整体和底足观察之外，提供身份方向的比对依据。',
  },
  [O.repeat]: {
    result: '这次复核已留存，但没有形成另一份独立的身份依据。', scope: '原比对的同一证据范围',
    limit: '再做一次的经历会保留，不能当作两份独立证据累加。', role: '回查原比对，不增加独立支持。',
  },
  [O.photo]: {
    result: '19 世纪末的旧照片中可见足部瑕疵与旧锔痕。', scope: '照片拍摄时、照片可见的部位',
    limit: '照片未显露的内部接缝不能算作当时不存在；照片内容与照片属于哪只碗是两件事。',
    role: '保留较早时点的可见状态；核实对象归属后，才能作为本器早期历史的依据。',
  },
  [O.continuity]: {
    result: '指定旧照片与现器对应特征的核验结果相符，支持两者为同一对象。', scope: '这张旧照片与现器的对应特征',
    limit: '这份核验只处理本照片的归属，不替事故或后期记录完成归属，也不给今天所有内部接合断代。',
    role: '把指定旧照片中的早期状态接入本器历史；这是一份关系核验，不是重新取得照片。',
  },
  [O.xray]: {
    result: '当前多角度成像留下可读区域内的接合、填料候选与瓷片边界。', scope: '今日成像注明可读的区域',
    limit: '当前结构读数没有说明各处接合何时形成；它也不能替旧照片补出没有拍到的内部结构。',
    role: '直接记录当前内部结构，并在区域比较中补充当前结构定位。',
  },
  [O.comparison]: {
    result: '指定旧照的可见区域与现器记录已完成比较，留下可比范围内的区域差异报告。', scope: '旧照与当前记录都可比较的区域',
    limit: '比较报告不独自完成照片归属，也不独自证明重大重组。X 射线只补充当前定位，不能补造过去的内部状态。',
    role: '提供可比范围内的差异；照片归属核实后，这份差异才可归入本器历史。',
  },
  [O.documented]: {
    result: '指定事故记录与当前修补记录已完成比较，留下处理与现物对应情况的报告。', scope: '事故记录与现器的注明对应区域',
    limit: '完成比较不等于已经确认事故记录属于这只碗；照片的核验也不能替代事故记录自己的归属。',
    role: '在事故记录归属确认后，为所述处理提供范围限定的现物印证。',
  },
  [O.accident]: {
    result: '这组记录记述严重损坏与重组。记录内容已取得；它与这只碗的关系须分别核实。', scope: '本组事故记录',
    limit: '记录内部一致、记录属于这只碗、所述事件得到实物印证分别成立，不能用其中一项代替另两项。',
    role: '提供事故事件的历史记录；完整核验后才可用于本器的重大修复与先后解释。',
  },
  [O.later]: {
    result: '后期记录记述另一时点的局部处理。', scope: '本组后期处理记录',
    limit: '事故记录的核验不替这组后期记录完成归属或现物对应。',
    role: '提供后期处理的记录，完整核验后与早期状态、事故事件共同构成先后解释。',
  },
  [O.t2attr]: { result: '已核实事故记录指向这只碗。', scope: '事故记录的对象归属', limit: '对象归属不单独证明记载事件得到实物印证。', role: '补足事故记录自己的归属条件。' },
  [O.t2corr]: { result: '事故所述处理在注明范围内得到现物对应。', scope: '本次核对的事故处理与实物区域', limit: '事件相符不自动证明记录属于这只碗。', role: '补足事故记录的实物印证，保留对象归属的独立核验。' },
  [O.t3attr]: { result: '已核实后期记录指向这只碗。', scope: '后期记录的对象归属', limit: '这份归属不自动证明后期处理与实物对应，也不替事故记录归属。', role: '补足后期记录自己的归属条件。' },
  [O.t3corr]: { result: '后期处理在注明范围内得到现物对应。', scope: '本次核对的后期处理与实物区域', limit: '它不独自建立整部修复史，也不替对象归属。', role: '补足后期记录的实物印证，帮助保留后期与早先事件的边界。' },
  [O.appearance]: { result: '纹饰衔接与色差留下外观曾被重新整合的痕迹。', scope: '本次查看的纹饰与色差区域', limit: '外观重整不能单独推出结构层面的重大重组。', role: '提示表面干预，保留继续查看层次与范围的理由。' },
  [O.negative]: { result: '本次紫外检查没有检测到补绘信号。', scope: '本次检测能力与查看范围', limit: '未见信号不等于没有补绘；这份阴性结果不足以排除表面干预。', role: '保留一次阴性检查及能力边界，不把它改写为表面完整。' },
  [O.point]: { result: '试窗留下所取点位上各层的上下关系。', scope: '已取样的试窗点位', limit: '几个点的层次不能直接外推为整片区域。', role: '提供区域综合所需的点位读数，范围仍需另行综合。' },
  [O.surface]: { result: '点位读数已按区域综合，留下表面处理的覆盖范围。', scope: '已覆盖的表面区域', limit: '范围不超出本次综合覆盖，不能声称整只器物处处都已检查。', role: '补充连贯说明中的表面范围，与材料和结构判断分别保留。' },
  [O.substrate]: { result: '材料分析留下注明关键点位的基底读数。', scope: '实际覆盖的关键点位', limit: '点位基底不能代替界面层序，也不能说整个区域都已化验。', role: '补充材料基底这一面，与层序读数共同用于范围明确的材料说明。' },
  [O.layer]: { result: '关键界面的叠压读数留下层与层的先后关系。', scope: '实际读取的关键界面', limit: '层序不能代替基底材料读数，也不独自确定每次修复的年代。', role: '补充材料层序这一面；它与基底回答不同问题。' },
  [O.stability]: { result: '本次已评估承力路径与静态陈列条件。', scope: '已评估的承力与陈列条件', limit: '这不代表任何使用方式或载荷下都安全，也不为年代提供依据。', role: '说明当前如何陈列这一面，帮助最终决策保留使用条件。' },
  [O.provenance]: { result: '已核实范围内的流转链与文件一致性，并保留可追溯边界。', scope: '本次核实过的流转记录', limit: '边界之外仍可保留未知；这不等于器物一生的流转都已查清。', role: '让连贯说明包含来路的已知与未知边界。' },
};

const materialBindings: Record<string, { materialObservationIds: string[] }> = {
  [O.continuity]: SOURCE_BINDINGS.identityReference,
  [O.comparison]: SOURCE_BINDINGS.photoComparison,
  [O.documented]: SOURCE_BINDINGS.archiveComparison,
};
const inputRoles: Record<string, string> = {
  [O.photo]: '历史可见区域', [O.base]: '现器对应特征', [O.whole]: '当前可见修补与器形',
  [O.xray]: '当前结构定位', [O.accident]: '事故记录中的处理',
};

/** Only the supplied graph's acquired observations are allowed into this view. */
export function materialRecord(graph: any, id: string, context?: MaterialContext | null) {
  const observations: any[] = graph?.observations ?? [];
  const observation = observations.find(o => o.id === id);
  if (!observation) return null;
  const has = (key: string) => observations.some(o => o.id === key);
  const nodes: any[] = graph.nodes ?? [];
  const edges: any[] = graph.edges ?? [];
  const copy = records[id] ?? {
    result: observation.summary || '本次调查记录已留存。', scope: '本次记录注明的部位与方法',
    limit: '适用范围不超出原记录；未说明的内容仍保留未知。', role: '保留这次调查的实际记录及其边界。',
  };
  const inputs = (materialBindings[id]?.materialObservationIds ?? []).flatMap(sourceId => {
    const source = observations.find(o => o.id === sourceId);
    return source ? [{ id: source.id, title: source.title, role: inputRoles[source.id] ?? '本次使用的材料' }] : [];
  });
  let role = copy.role;
  const pending: string[] = [];
  if (id === O.photo && !has(O.continuity)) pending.push('这张照片尚未完成对象归属核验，早期痕迹暂不能归入眼前这只碗的历史。');
  if (id === O.photo && observation.interpretationState === 'established') role = '本照片与现器的核验已相符。至迟在照片拍摄时，这只碗已留有锔修痕迹；原照片现可作为本器早期状态的依据。';
  if (id === O.comparison && observation.interpretationState === 'established') role = '照片归属已核实，原比较报告现可用于说明本器在两个时点间、可比区域内的变化。';
  if (id === O.documented && observation.interpretationState === 'established') role = '事故记录归属已核实，原比较报告现为所述处理提供注明范围内的现物印证。';
  if (id === O.comparison && observation.interpretationState !== 'established') pending.push('比较报告已经取得；照片归属尚未核实。核验后可重新解释原报告，无需重做比较。');
  if (id === O.documented && observation.interpretationState !== 'established') pending.push('比较报告已经取得；事故记录归属尚未核实。归属确认后，原报告才用于本器事件印证。');
  if (id === O.point && !has(O.surface)) pending.push('当前只有点位结果，还没有区域综合。');
  const claimId = context?.kind === 'claim' ? context.id.replace(/^claim:/, '') : null;
  const claim = claimId ? nodes.find(n => n.id === `claim:${claimId}`) : null;
  if (claimId === 'identity') {
    const roles: Record<string, string> = {
      [O.whole]: '这份记录提供当前器形、胎釉与制造特征的观察基础。它要与底足读数，以及比对或核验所得的身份路径结合；本次整器观察没有单独确定年代。',
      [O.base]: '底足制造痕迹补充整体观察，是工艺判断的另一部分；还需结合身份比对或核验路径。',
      [O.photo]: '照片本身不直接证明制造年代。这里需要的是照片与现器相属的核验报告，不能把照片中的锔痕当作年代证明。',
      [O.continuity]: '本报告提供这张照片与现器为同一对象的核验依据。它与整体、底足观察共同用于身份路径；本报告本身没有直接给出制造年代。',
      [O.corpus]: records[O.corpus].role, [O.repeat]: records[O.repeat].role,
    };
    role = roles[id] ?? '这份材料没有提供年代与类别的直接依据；它的结果仍保留在本次调查记录中。';
    if (!claim && [O.whole, O.base, O.photo, O.continuity, O.corpus, O.repeat].includes(id)) {
      if (!has(O.whole)) pending.push('尚缺现器整体观察。');
      if (!has(O.base)) pending.push('尚缺底足制造痕迹。');
      if (!has(O.corpus) && !has(O.continuity)) pending.push('比对或对象核验所提供的身份路径尚未接通；现有观察还不能单独给出年代与类别。');
    }
  } else if (claimId === 'majorReassembly') {
    const roles: Record<string, string> = {
      [O.whole]: '可见修补分布是物证路线的当前参照之一。它还要和内部结构、已接入本器历史的区域变化共同成立；看到修补本身不等于重大重组。',
      [O.xray]: '当前接合与瓷片边界提供内部结构这一部分；完整物证路线还需要可见修补分布和本器跨时点的区域变化。',
      [O.comparison]: '照片归属核实后，范围内的差异可作为物证路线中的区域变化；仍需与可见修补分布、当前内部结构共同成立。',
      [O.documented]: '事故记录归属核实后，本报告提供事件与现物的对应，属于事故档案路线；不替记录归属或内部一致性。',
    };
    role = roles[id] ?? copy.role;
  } else if (claimId === 'threePhase') {
    role = [O.photo, O.continuity].includes(id)
      ? '对象归属核实后，旧照片为本器提供较早状态的时间依据。它只补充早期这一段，不能替事故与后期记录的完整核验。'
      : [O.accident, O.t2attr, O.t2corr, O.documented].includes(id)
        ? '这份材料参与事故阶段的记录核验。修复先后还须结合已归属本器的早期状态与完整核验的后期记录。'
        : [O.later, O.t3attr, O.t3corr].includes(id)
          ? '这份材料参与后期处理的记录核验。它与早期状态、事故事件共同构成先后解释，不能独自建立三个阶段。'
          : '这份材料补充现状或调查范围，本身不能为本器修复史单独增加一个阶段。';
  } else if (claimId === 'coherentDecisionProfile') {
    if (id === O.substrate && !has(O.layer)) pending.push('材料说明还缺关键界面的层序读数；基底分析不能替代它。');
    if (id === O.layer && !has(O.substrate)) pending.push('材料说明还缺关键点位的基底读数；层序不能替代它。');
  }
  const archiveId = [O.accident, O.t2attr, O.t2corr, O.documented].includes(id) ? O.accident
    : [O.later, O.t3attr, O.t3corr].includes(id) ? O.later : null;
  const archiveRelations = archiveId ? nodes.find(n => n.id === archiveId)?.relations ?? [] : [];
  const supportingSources = new Set<string>([
    ...(claim?.sourceIds ?? []),
    ...edges.filter(e => e.to === claim?.id && e.kind === 'support').flatMap(e => e.sourceIds ?? []),
  ]);
  const contextState = !claimId ? null : claim?.state === 'established' ? '这项判断已有依据' : '这项判断尚未成立';
  return {
    observation, ...copy, role, pending: [...new Set(pending)], inputs, archiveRelations,
    context: context ?? null, contextState,
    usedByEstablishedClaim: !!claim && supportingSources.has(id),
    originalSourceIds: [...(observation.originalSourceIds ?? [])],
  };
}
