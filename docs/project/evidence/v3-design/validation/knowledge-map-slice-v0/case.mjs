/* 第一器物的玩家侧投影层 —— 可丢弃切片专用。
 *
 * 边界(硬):
 *  - 本文件只读已冻结的作者夹具与求解器,不改它们一个字节;
 *  - 作者真相全部留在求解器里。本文件不得读 expectedProfile,不得读 h*,
 *    不得把任何只有作者知道的东西投影给玩家(DEC-026 隔离清单);
 *  - 不得把 supports/marginals 当成产品概率给玩家看 —— 夹具 manifest.json
 *    声明它们是 fixture-only technical values;
 *  - 不得按玩法质量调整任何估值或后验(DEC-030);
 *  - 醒目度不进入价值计算、不缩小排序定义域(DEC-029 / DEC-031)。
 */

import { events } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";

/* ---------- 结局表 ----------
 * 一个动作在冻结目录里往往对应多个"结局"事件。本案该给哪一个,不是自拟的,
 * 推导规则只有两条:
 *   (1) 以那条完整 G3 路线(场景 g3-with-allowed-unknowns)用到的事件为本案正典;
 *   (2) 正典没有覆盖的分歧,按其它冻结场景的可达性推,不得让任何已声明可达的
 *       路线因本表而走不通。
 *
 * 两处需要解释的推导:
 *
 * A.IMAGE.XRAY 固定给 xrayEarly,不给 physicalMajor。
 *   xrayEarly 带 requiresContextFacts=[identityObjectContinuity] 与
 *   contextualFacts=[currentStructureReadoutByRegion],所以它同时覆盖两种时机:
 *   没有对象连续性时读数挂起(inactive),之后补上就自动激活(contextualized)。
 *   physicalMajor 直接给结构事实,反而抹掉"早拿后懂"。用前者更忠实。
 *
 * A.RELATE.ARCHIVE.T2_TO_OBJECT 固定给 t2Attribution(已建立),不给 contested。
 *   本想设计成"没有独立锚点就先给争议",但冻结场景 g2-documented-stop 的六步路线
 *   没有对象连续性核对却建立了归属并被声明为 G2。按上面第 (2) 条,不能让那条
 *   路线走不通,所以本案归属直接建立。
 *   代价:走查 player-session.html 里那个"争议 T2"的一局在本案正典下走不出来。
 *   它演示的机制是真的(来自场景 archive-attribution-contested-not-promoted),
 *   但不是这只碗的正典结局。此处明写,不静默留着。
 */

const T = { FREE: 0, LOW: 1, MID: 2, HIGH: 3 };
export const COST_LABEL = ["免费", "低", "中", "高"];

/* place = 地图上的地点 id。多个动作可以落在同一个地点上。 */
export const ACTIONS = [
  { id: "A.OBSERVE.WHOLE", place: "OBJ_W", cost: T.FREE,
    name: "看整体形制与胎釉", ask: "这东西大体是什么、动过没动过?",
    outcome: () => "whole" },

  { id: "A.OBSERVE.BASE", place: "OBJ_F", cost: T.FREE,
    name: "看底足与修足", ask: "制造工艺留下的痕迹是什么样的?",
    outcome: () => "base" },

  { id: "A.OBSERVE.REGION_DECOR", place: "OBJ_D", cost: T.FREE,
    name: "逐区看纹饰与色差", ask: "外观有没有被重新整合过?",
    outcome: () => "appearance" },

  /* 2026-08-31 盲测:「语料」是语言学的词,他第一猜是去比对款识题字,而碗上没有文字;
     「非构图稳定锚点」是他全屏最看不懂的一条。手段名是玩家要点的按钮,不能留行话。 */
  { id: "A.COMPARE.CORPUS", place: "CORPUS", cost: T.LOW,
    name: "拿同期真品比一比", ask: "这种做法放到同时代的真品里,算常见还是罕见?",
    outcome: () => "corpus" },

  { id: "A.COMPARE.CORPUS.RECHECK", place: "RPT", cost: T.LOW,
    name: "换一批真品再比一次", ask: "换一批真品来比,会不会比出别的结论?",
    outcome: () => "corpusDuplicate" },

  { id: "A.VERIFY.OBJECT_CONTINUITY", place: "OBJ_R", cost: T.MID,
    name: "核对那些没被改动过的特征", ask: "手里这只和记录里那只,是同一只吗?",
    outcome: () => "identityContinuity" },

  { id: "A.IMAGE.XRAY", place: "XRAY", cost: T.HIGH,
    name: "X 射线多角度逐区成像", ask: "釉面底下的结构是什么样的?",
    outcome: () => "xrayEarly" },

  { id: "A.SCREEN.UV", place: "UV", cost: T.MID,
    name: "紫外筛查补绘", ask: "有没有后加的补绘层?",
    outcome: () => "noSignalUnresolved" },

  { id: "A.RESEARCH.ACCIDENT", place: "T2", cost: T.LOW,
    name: "查有没有出过事的记录", ask: "有人记录过一次严重损坏吗?",
    outcome: () => "accident" },

  { id: "A.RELATE.ARCHIVE.T2_TO_OBJECT", place: "T2", cost: T.LOW,
    name: "看事故记录说的是不是这只碗", ask: "那组记录讲的是手里这一只吗?",
    outcome: () => "t2Attribution" },

  { id: "A.CORROBORATE.ARCHIVE.T2_CURRENT", place: "T2", cost: T.LOW,
    name: "拿事故记录去对这只碗", ask: "记录里写的事,在这只碗上找得到吗?",
    outcome: () => "documentedCurrentCorroboration" },

  { id: "A.LOCATE.HISTORIC_IMAGE", place: "T1", cost: T.LOW,
    name: "找更早的影像", ask: "这只碗以前长什么样?",
    outcome: () => "t1" },

  /* 唯一带额外前置的动作:跨时点对照需要有第二个时点可对。
     两条入口对应 G2 的两条 OR 路线,与冻结场景一致。 */
  { id: "A.MAP.REGION_CONTINUITY", place: "OBJ_W", cost: T.MID,
    name: "把两个时候一块一块对比", ask: "从那时到现在,结构上变了什么?",
    needs: (f) => f.has("currentStructureReadoutByRegion") || f.has("t2ArchiveObjectAttribution"),
    /* 理由必须点名玩家该去点哪个手段(harness K2 段守着这一条),不能只描述缺什么。 */
    needsWhy: "对比要两头,现在只有一头 —— 要么先用「X 射线多角度逐区成像」拍出它现在的内部结构," +
      "要么先用「看事故记录说的是不是这只碗」把更早那一头定下来。这不是锁,是没有两头就无从对比",
    outcome: (f) => f.has("currentStructureReadoutByRegion")
      ? "repairContinuity" : "documentedCrossTime" },

  { id: "A.RESEARCH.LATE_TREATMENT", place: "T3", cost: T.LOW,
    name: "查后来还有没有人动过", ask: "更晚的时候还有人动过它吗?",
    outcome: () => "t3" },

  { id: "A.RELATE.ARCHIVE.T3_TO_OBJECT", place: "T3", cost: T.LOW,
    name: "看后期记录说的是不是这只碗", ask: "那批更晚的记录讲的也是手里这一只吗?",
    outcome: () => "t3Attribution" },

  { id: "A.CORROBORATE.ARCHIVE.T3_CURRENT", place: "T3", cost: T.LOW,
    name: "拿后期记录去对这只碗", ask: "那些后期处理,在这只碗上对得上吗?",
    outcome: () => "t3CurrentCorroboration" },

  { id: "A.ANALYZE.MATERIAL.SUBSTRATE", place: "MAT", cost: T.HIGH,
    name: "化验要紧几处的底子", ask: "要紧那几处底下,是原来的瓷还是后来补的?",
    outcome: () => "materialSubstrate" },

  { id: "A.INSPECT.MATERIAL.LAYER_SEQUENCE", place: "MAT", cost: T.HIGH,
    name: "查各层的先后顺序", ask: "这些层是按什么先后上去的?",
    outcome: () => "materialLayerSequence" },

  { id: "A.INSPECT.WINDOWS", place: "SURF", cost: T.MID,
    name: "在表面开几个小窗看层次", ask: "补绘到底压在哪一层上?",
    outcome: () => "surfacePoint" },

  { id: "A.SYNTHESIZE.SURFACE_REGIONS", place: "SURF", cost: T.MID,
    name: "把开过的小窗连成片", ask: "补绘一共盖了多大范围?",
    outcome: () => "surface" },

  { id: "A.ASSESS.TREATED_AND_UNTREATED", place: "STAB", cost: T.MID,
    name: "看它结不结实、能不能摆出来", ask: "现在还能安全摆出来展吗?",
    outcome: () => "stability" },

  { id: "A.TRACE.PROVENANCE_CHAIN", place: "PROV", cost: T.LOW,
    name: "追它经手过谁", ask: "它的经手记录能追到哪一步为止?",
    outcome: () => "documentation" },
];

export const ACTION_BY_ID = new Map(ACTIONS.map((a) => [a.id, a]));

/* ---------- 可用性 ----------
 * 只有两种不可用,而且都必须给出人话理由 —— DEC-026 禁止无解释的行动门:
 *   1. 冻结事件自带的 acquisitionRequires 还没满足;
 *   2. 本表声明的 needs 还没满足(目前只有跨时点对照一条)。
 * 已经做过的动作不消失,标成"做过了",再做一次仍然允许(重复要看得见,DEC-030)。
 *
 * 2026-08-31:原先这里把缺失的事实 id 直接拼进理由里,于是开局第一屏就把
 * `还缺前置:currentBody、baseManufacture` 这种内部键摆给了玩家(真人试玩当场指出)。
 * 现在改为**反查出该先做哪个动作并说出它的名字** —— 这不只是换个说法:
 * 玩家追问的"这是需要解锁吗"本身说明旧措辞把逻辑前置误传成了剧情门,
 * 而点名动作直接告诉他"这一步要用到那一步的结果",没有解锁这回事。
 */

/* 事实 → 当前状态下能产出它的动作。冻结事件自带 facts 与 acquisitionActionId,
   所以这是查出来的而非另建一张表;按当前 facts 算 outcome,分支动作也能算对。 */
function producersOf(facts) {
  const m = new Map();
  for (const a of ACTIONS) {
    const ev = events[a.outcome(facts)];
    for (const f of ev.facts ?? []) {
      if (!m.has(f)) m.set(f, []);
      if (!m.get(f).includes(a)) m.get(f).push(a);
    }
  }
  return m;
}

export function availability(facts, doneActionIds) {
  const producers = producersOf(facts);
  return ACTIONS.map((a) => {
    const ev = events[a.outcome(facts)];
    const missing = ev.acquisitionRequires.filter((f) => !facts.has(f));
    const gated = a.needs && !a.needs(facts);
    return {
      action: a,
      done: doneActionIds.includes(a.id),
      usable: missing.length === 0 && !gated,
      why: missing.length ? missingWhy(missing, producers, a)
        : gated ? a.needsWhy : null,
      /* 给界面用:该先做的那几个动作,让它可以做成可点的链接而不是一句死话 */
      needsActionIds: missing.length ? prereqActions(missing, producers, a).map((x) => x.id) : [],
    };
  });
}

function prereqActions(missing, producers, self) {
  const out = [];
  for (const f of missing) {
    for (const p of producers.get(f) ?? []) {
      if (p.id !== self.id && !out.includes(p)) out.push(p);
    }
  }
  return out;
}

/* 一句人话。**任何情况下都不许把事实 id 漏出去** —— 查不到产出动作时说不知道,
   也不要退回去打印内部键。 */
function missingWhy(missing, producers, self) {
  const acts = prereqActions(missing, producers, self);
  if (!acts.length) return "这一步要用到别处的结果,而现在没有手段能直接去拿";
  const names = acts.map((x) => `「${x.name}」`).join("和");
  return `得先有${names}的结果 —— 不是锁,是这一步的推理要拿它当依据`;
}

/* ---------- 玩家可见读数 ----------
 * 全部只从求解器输出推。刻意不投影:posterior、marginals、supports、
 * expectedProfile、以及任何"离答案还有多远"的量。
 */
export function playerView(solved) {
  const c = solved.claims;
  const rel = solved.coverage.archiveRelations;
  /* 四个状态来自冻结夹具:未决 / 有局部内容但归属未完成 / 已建立 / 直接冲突。
     必须翻成人话 —— 把 suggestive 这种 token 直接摆给玩家等于让界面说黑话。 */
  const relLabel = {
    unresolved: "还没结论",
    suggestive: "有指向性,但还没归到本器",
    established: "已建立",
    contested: "有冲突",
  };
  return {
    stage: solved.stage,
    /* "你现在能主张什么" —— 定性,不给数字 */
    can: [
      c.identity.established && "这是晚 18 世纪外销瓷这个方向可以主张",
      c.identity.contested && "身份方向存在冲突,系统不替你选边",
      c.identity.logicallyRefuted && "身份方向已被逻辑反驳",
      c.majorReassembly.established && "曾发生重大重组可以主张",
      c.majorReassembly.contested && "重大重组存在冲突,系统不替你选边",
      c.majorReassembly.logicallyRefuted && "重大重组已被逻辑反驳",
      c.threePhase.established && "三阶段修复史可以主张",
      c.coherentDecisionProfile.established && "决策所需的整体画面已经自洽",
    ].filter(Boolean),
    /* 阻断 G3 的已登记未知 —— 这是"还差什么"的合法说法 */
    blocking: solved.coverage.g3BlockingUnknowns,
    /* G2 的两条 OR 路线,直接来自求解器 */
    routes: {
      documented: solved.coverage.majorProofPaths.documented,
      physical: solved.coverage.majorProofPaths.physical,
    },
    /* 档案三关系:记录内部 / 记录—现器 / 事件—物证 */
    archive: ["t2", "t3"].map((k) => ({
      group: k.toUpperCase(),
      recordCoherence: relLabel[rel[k].recordCoherence] ?? rel[k].recordCoherence,
      objectAttribution: relLabel[rel[k].objectAttribution] ?? rel[k].objectAttribution,
      eventCorroboration: relLabel[rel[k].eventCorroboration] ?? rel[k].eventCorroboration,
      established: rel[k].systemAttributionEstablished,
    })),
    /* 挂起与阴性:"早拿后懂"与能力门在界面上的落点 */
    pending: solved.evidence.inactiveObservationIds,
    activated: solved.evidence.contextualizedObservationIds,
    negativeUnresolved: solved.evidence.unresolvedNegativeIds,
    scopeLimited: solved.evidence.scopeLimitedObservationIds,
    conflicts: solved.conflicts,
    facts: solved.coverage.facts,
    units: solved.evidence.activeDependencyUnits,
  };
}
