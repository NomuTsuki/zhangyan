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

  { id: "A.COMPARE.CORPUS", place: "CORPUS", cost: T.LOW,
    name: "比同期真品语料", ask: "这种制造特征在同期真品里常见吗?",
    outcome: () => "corpus" },

  { id: "A.COMPARE.CORPUS.RECHECK", place: "RPT", cost: T.LOW,
    name: "再调一批语料复核", ask: "换一批语料会不会得出别的结论?",
    outcome: () => "corpusDuplicate" },

  { id: "A.VERIFY.OBJECT_CONTINUITY", place: "OBJ_R", cost: T.MID,
    name: "核对非构图稳定锚点", ask: "手里这只和记录里那只是同一只吗?",
    outcome: () => "identityContinuity" },

  { id: "A.IMAGE.XRAY", place: "XRAY", cost: T.HIGH,
    name: "X 射线多角度逐区成像", ask: "釉面底下的结构是什么样的?",
    outcome: () => "xrayEarly" },

  { id: "A.SCREEN.UV", place: "UV", cost: T.MID,
    name: "紫外筛查补绘", ask: "有没有后加的补绘层?",
    outcome: () => "noSignalUnresolved" },

  { id: "A.RESEARCH.ACCIDENT", place: "T2", cost: T.LOW,
    name: "检索事故记录组", ask: "有人记录过一次重大损坏吗?",
    outcome: () => "accident" },

  { id: "A.RELATE.ARCHIVE.T2_TO_OBJECT", place: "T2", cost: T.LOW,
    name: "核对事故记录的对象归属", ask: "那组记录说的是这只碗吗?",
    outcome: () => "t2Attribution" },

  { id: "A.CORROBORATE.ARCHIVE.T2_CURRENT", place: "T2", cost: T.LOW,
    name: "拿事故记录对现器物证", ask: "记录描述的事,现器上找得到吗?",
    outcome: () => "documentedCurrentCorroboration" },

  { id: "A.LOCATE.HISTORIC_IMAGE", place: "T1", cost: T.LOW,
    name: "找早期影像", ask: "这只碗以前长什么样?",
    outcome: () => "t1" },

  /* 唯一带额外前置的动作:跨时点对照需要有第二个时点可对。
     两条入口对应 G2 的两条 OR 路线,与冻结场景一致。 */
  { id: "A.MAP.REGION_CONTINUITY", place: "OBJ_W", cost: T.MID,
    name: "逐区跨时点对照", ask: "结构从那时到现在变了什么?",
    needs: (f) => f.has("currentStructureReadoutByRegion") || f.has("t2ArchiveObjectAttribution"),
    needsWhy: "得先有第二个时点可以对 —— 要么拿到可读的逐区结构读数,要么先把事故记录归到本器",
    outcome: (f) => f.has("currentStructureReadoutByRegion")
      ? "repairContinuity" : "documentedCrossTime" },

  { id: "A.RESEARCH.LATE_TREATMENT", place: "T3", cost: T.LOW,
    name: "检索后期处理记录组", ask: "后来还有人动过它吗?",
    outcome: () => "t3" },

  { id: "A.RELATE.ARCHIVE.T3_TO_OBJECT", place: "T3", cost: T.LOW,
    name: "核对后期记录的对象归属", ask: "那批后期记录也是这只碗的吗?",
    outcome: () => "t3Attribution" },

  { id: "A.CORROBORATE.ARCHIVE.T3_CURRENT", place: "T3", cost: T.LOW,
    name: "拿后期记录对现器区域", ask: "后期处理在现器上对得上吗?",
    outcome: () => "t3CurrentCorroboration" },

  { id: "A.ANALYZE.MATERIAL.SUBSTRATE", place: "MAT", cost: T.HIGH,
    name: "点位材料基底分析", ask: "关键区是原片还是重建的?",
    outcome: () => "materialSubstrate" },

  { id: "A.INSPECT.MATERIAL.LAYER_SEQUENCE", place: "MAT", cost: T.HIGH,
    name: "微观层序检查", ask: "这些层是按什么顺序上去的?",
    outcome: () => "materialLayerSequence" },

  { id: "A.INSPECT.WINDOWS", place: "SURF", cost: T.MID,
    name: "开表面试窗点位", ask: "补绘到底压在哪一层上?",
    outcome: () => "surfacePoint" },

  { id: "A.SYNTHESIZE.SURFACE_REGIONS", place: "SURF", cost: T.MID,
    name: "表面区域综合", ask: "补绘范围有多大?",
    outcome: () => "surface" },

  { id: "A.ASSESS.TREATED_AND_UNTREATED", place: "STAB", cost: T.MID,
    name: "评估承力与陈列条件", ask: "现在还能安全陈列吗?",
    outcome: () => "stability" },

  { id: "A.TRACE.PROVENANCE_CHAIN", place: "PROV", cost: T.LOW,
    name: "追来源链", ask: "它的流转记录到哪一步为止?",
    outcome: () => "documentation" },
];

export const ACTION_BY_ID = new Map(ACTIONS.map((a) => [a.id, a]));

/* ---------- 可用性 ----------
 * 只有两种不可用,而且都必须给出人话理由 —— DEC-026 禁止无解释的行动门:
 *   1. 冻结事件自带的 acquisitionRequires 还没满足;
 *   2. 本表声明的 needs 还没满足(目前只有跨时点对照一条)。
 * 已经做过的动作不消失,标成"做过了",再做一次仍然允许(重复要看得见,DEC-030)。
 */
export function availability(facts, doneActionIds) {
  return ACTIONS.map((a) => {
    const ev = events[a.outcome(facts)];
    const missing = ev.acquisitionRequires.filter((f) => !facts.has(f));
    const gated = a.needs && !a.needs(facts);
    return {
      action: a,
      done: doneActionIds.includes(a.id),
      usable: missing.length === 0 && !gated,
      why: missing.length
        ? `还缺前置:${missing.join("、")}`
        : gated ? a.needsWhy : null,
    };
  });
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
