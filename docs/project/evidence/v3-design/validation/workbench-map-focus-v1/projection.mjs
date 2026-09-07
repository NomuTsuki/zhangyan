/* 心智地图与决策面的投影层。
   DEC-032 的结构不在冻结求解器的模型里,所以这一层在它外面,把求解器输出翻译成
   「观察 → 议题归类／逻辑边 → 已查实结论」。冻结文件一个字节都不改。

   拓扑(每一层都能在冻结数据里指出出处):
     观察节点     = solved.evidence.observationIds        —— 玩家花机会挣来的
     逻辑边       = 前置／接住／支持三种可追踪关系          —— 系统免费自动生成
     议题归类     = 同一潜变量上聚起 ≥2 条已取得内容        —— 只作分组,不是结论
     公理         = 已成立且无争议的主张,钉住不动         —— 从决策面离场,留在全图
     G            不进地图,只作一行读数(DEC-032 第十节)

   这一层无测试覆盖,是 DEC-032「先加投影层试」那个岔口的代价。 */
import { events, proofRoleContracts } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { ACTION_BY_ID, COST_LABEL } from "../knowledge-map-slice-v0/case.mjs";
import { ACTION_SEMANTICS, LATENT_SEMANTICS, PROOF_ROLE_SEMANTICS,
         ROUTE_SEMANTICS, STAGE_SEMANTICS } from "../evidence-semantics-v0/semantics.mjs";

/* ---------- 从夹具反查的索引(只读) ---------- */
const EVENT_BY_OBS = new Map();
for (const ev of Object.values(events)) EVENT_BY_OBS.set(ev.observationId, ev);

/* fact → 能产出它的动作。用于回答「想补这个缺口,行里靠什么手段」。
   这是领域知识,DEC-032 第七节要求无偿给。 */
const FACT_PRODUCERS = new Map();
for (const ev of Object.values(events)) {
  if (!ACTION_BY_ID.has(ev.acquisitionActionId)) continue;
  for (const f of [...(ev.facts ?? []), ...(ev.contextualFacts ?? [])]) {
    if (!FACT_PRODUCERS.has(f)) FACT_PRODUCERS.set(f, new Set());
    FACT_PRODUCERS.get(f).add(ev.acquisitionActionId);
  }
}

/* ---------- 情报标签。节点是情报,不是行动,所以不能拿动作名当标签。 ---------- */
export const OBS_LABEL = {
  "obs.current.whole": { short: "整只碗的样貌", gist: "器型与胎釉的整体面貌,加上肉眼看得见的动过手的地方分布在哪几块。" },
  "obs.current.base": { short: "底足痕迹", gist: "圈足与修足留下的成型痕迹 —— 制造工艺的指纹。" },
  "obs.appearance.restore": { short: "外观被重整过的痕迹", gist: "纹饰与色差显示外观被重新整合过的那些地方。" },
  "obs.corpus.identity": { short: "与同期真品的比对结果", gist: "这套制造特征放到同时代的真品里看,是常见还是罕见。" },
  "obs.corpus.identity.repeat": { short: "换一批真品复核(结论没变)", gist: "换一批同期真品再比一次,结论与上次一致 —— 是本局经历,但不额外加分。" },
  "obs.object.continuity": { short: "手里这只就是记录里那只", gist: "那些没被改动过的稳定特征对得上,所以手里这只与记录里那只是同一件。" },
  "obs.structure.xray.early": { short: "釉下结构影像", gist: "多角度射线下一块一块拍出来的内部结构。" },
  "obs.surface.no-signal.unresolved": { short: "紫外没照出补绘(还不能当证据)", gist: "没照出补绘的迹象,但这一次照的灵敏度不够,所以还不能据此说「没有补绘」。" },
  "obs.accident.major": { short: "那一组事故记录", gist: "几份彼此不矛盾的记录,描述了一次严重损坏和随后的修补。" },
  "obs.archive.t2.object-attribution": { short: "事故记录说的是这只碗", gist: "那组事故记录讲的就是手里这一只,不是同类的另一只。" },
  "obs.archive.t2.current-corroboration": { short: "事故记录在这只碗上对上了", gist: "记录里写的那次修补,在这只碗上找得到对应的痕迹。" },
  "obs.phase.t1": { short: "出事之前的影像", gist: "一张更早时候的样子,可以拿来当比较的底子。" },
  "obs.structure.major.cross-time": { short: "两个时候的结构差别", gist: "把两个时候的内部结构一块一块摆在一起,哪里变了看得见。" },
  "obs.structure.major.documented-cross-time": { short: "两个时候的结构差别(底子来自档案)", gist: "拿档案给的那个时间点当底子比出来的差别 —— 所以这条结论要靠「档案说的是这只碗」才站得住。" },
  "obs.phase.t3": { short: "更晚的一批处理记录", gist: "时间更靠后的一批处理记录,说明后来还有人动过它。" },
  "obs.archive.t3.object-attribution": { short: "后期记录说的是这只碗", gist: "那批更晚的记录讲的也是手里这一只。" },
  "obs.archive.t3.current-corroboration": { short: "后期处理在这只碗上对上了", gist: "那批后期处理,在这只碗对应的地方找得到。" },
  "obs.key-material.substrate-readings": { short: "关键几处的底子是什么", gist: "要紧那几处底下究竟是原来的瓷,还是后来补起来的。" },
  "obs.key-material.layer-sequence": { short: "各层的先后顺序", gist: "一层层上去的先后 —— 谁压在谁上面。" },
  "obs.surface.point-layering": { short: "试窗点上的层次关系", gist: "开窗的那几个点上,补绘压在哪一层之上,由此定出后加的和原有的谁先谁后。" },
  "obs.surface.resolved": { short: "补绘范围有多大,已经说得出来", gist: "把各个点连成片,补绘覆盖多大范围现在有答案了。" },
  "obs.stability.resolved": { short: "结不结实,已经说得出来", gist: "受力怎么传、能不能摆出来展，都评估过了。" },
  "obs.documentation.resolved": { short: "来源链查到哪一步为止", gist: "经手记录能追到哪一步,而且这一段里没有互相打架的文件。" },
};

/* ---------- 主张的槽位标签。空槽位就是「还差哪一块」。 ---------- */
/* 主张标签必须是**陈述句**,而且必须说的是它自己那两个槽位管的事。
   2026-08-31 盲测教训:`identity` 原本叫「它属于哪一路」,可它的槽位是「这只碗本身的
   工艺读数」+「与历史时点是同一件器物」—— 讲的是身份链接上了,不是窑口归属。
   玩家因此把它读成一个只有问题没有答案的结论,等一个永远不会来的答案。 */
export const CLAIM_LABEL = {
  identity: "这只碗就是档案里记的那一只",
  majorReassembly: "这只碗被大改过",
  threePhase: "改动分三次发生,不是一次",
  coherentDecisionProfile: "整份判断内部不矛盾",
};
/* g1 与 appearanceRestore 不进地图:前者是阶段结果(DEC-032 第十节),
   后者是单条事实而非主张。 */
export const CLAIM_NOT_ON_MAP = new Set(["g1", "appearanceRestore"]);

/* 槽位标签就是「还差哪一块」,所以每一条都要让玩家看得出缺的是什么东西。 */
export const SLOT_LABEL = {
  identity: {
    currentObject: "这只碗本身的工艺读数",
    path: "它与记录里那一只是同一件",
  },
  majorReassembly: {
    currentRepairMap: "说得出哪几处被动过手",
    documentedSourceGroup: "几份记录互不矛盾,而且说的是这只碗",
    documentedCrossTime: "档案里写的事,在两个时候的实物对比上对得上",
    physicalStructureMap: "一块一块拍出来的内部结构",
    physicalCrossTime: "两个时候的结构差别",
  },
  threePhase: {
    t1: "出事之前是什么状态",
    t2: "那次事故和随后的修补",
    t3: "后来又有人动过的部分",
  },
  coherentDecisionProfile: {
    documentation: "经手记录查到哪为止,而且不互相打架",
    keyMaterial: "要紧那几处的底子说得出来",
    stability: "结不结实说得出来",
    surface: "表面被补过多少说得出来",
  },
};

/* 查一批记录要分别过三道:记录之间对不对得上、说的是不是这只碗、写的事在实物上找不找得到。
   这三道必须能被玩家一次看全 —— 盲测者的原话是「三关系到底是哪三个,要我从三段说明里
   自己拼」,而且他把「三关系」和「第几关」混着读。所以界面上只准出现这三句,
   不准再出现「档案三关系」「第一关／第二关」这种要玩家自己去凑的说法。 */
export const ARCHIVE_REL_LABEL = {
  recordCoherence: "这几份记录互相对得上吗",
  objectAttribution: "这些记录说的是这只碗吗",
  eventCorroboration: "记录里写的事,在实物上找得到吗",
};
export const ARCHIVE_REL_STATE = {
  unresolved: "还没结论",
  suggestive: "有指向,但还不能确定说的就是这只碗",
  established: "已经确定",
  contested: "对不上,互相打架",
};
export const ARCHIVE_GROUP_LABEL = { t2: "事故那一组记录", t3: "后期处理那一组记录" };

/* 三种边。**两种是有方向的**,所以图上必须画箭头 —— 盲测者说没有箭头时他会按
   上下左右猜哪头是前提,猜反了就去点点不了的东西,然后当成 bug。
   句子也照方向写,不再用「悬空／被接住」这种他明说想象不出画面的说法。 */
export const EDGE_KINDS = {
  prereq: "箭尾那条先到手,箭头那条才拿得到",
  caught: "箭尾这条后来到手,才让箭头那条有了意义",
};
/* 地图上的关系都有方向。共享潜变量只作议题归类,不再渲染成边。 */
export const EDGE_DIRECTED = new Set(["prereq", "caught", "supports"]);

/* 议题标题刻意短于原有 latent 说明。它只回答「这些内容在谈哪件事」,
   不替玩家判断内容是否可用、相容,更不冒充系统已经推出的结论。 */
export const TOPIC_LABEL = {
  "latent.current-craft": "制作方式",
  "latent.repair-map": "修补位置",
  "latent.surface-map": "表面处理",
  "latent.region-map": "关键处材料",
  "latent.object-match": "是不是同一只",
  "latent.accident-event": "事故记录",
  "latent.archive-t2-object-relation": "事故记录与这只碗",
  "latent.archive-t2-event-relation": "事故记录与实物",
  "latent.pre-accident-reading": "出事前的样子",
  "latent.documented-cross-time": "前后发生的变化",
  "latent.treatment-scope": "后期处理范围",
  "latent.archive-t3-object-relation": "后期记录与这只碗",
  "latent.archive-t3-event-relation": "后期记录与实物",
  "latent.condition-session": "现在是否稳妥",
  "latent.event-chain": "经手来路",
};

export const TOPIC_SUMMARY =
  "这些内容在回答同一个问题；有的可能暂时不能当证据,也可能彼此矛盾。这里是归类,不是结论。";

/* ================= 心智地图 ================= */
export function mentalMap(solved) {
  const obsIds = [...solved.evidence.observationIds];
  const has = new Set(obsIds);
  const inactive = new Set(solved.evidence.inactiveObservationIds);
  const negative = new Set(solved.evidence.unresolvedNegativeIds);
  const scoped = new Set(solved.evidence.scopeLimitedObservationIds);
  const caughtSet = new Set(solved.evidence.contextualizedObservationIds);

  const nodes = obsIds.map((id) => {
    const ev = EVENT_BY_OBS.get(id);
    const label = OBS_LABEL[id];
    const state =
      inactive.has(id) ? "suspended"
      : negative.has(id) ? "negative"
      : scoped.has(id) ? "scoped"
      : caughtSet.has(id) ? "caught"
      : "active";
    return {
      type: "obs", id, state,
      short: label?.short ?? id,
      gist: label?.gist ?? "",
      actionId: ev?.acquisitionActionId ?? null,
      latents: [...(ev?.sharedLatentIds ?? [])],
      region: ev?.coverage?.region ?? null,
      method: ev?.coverage?.method ?? null,
    };
  });

  /* --- 议题:同一潜变量上聚起 ≥2 条已取得内容时显现 ---
     suspended／negative 仍是玩家已经取得的内容。旧 Finding 排除 suspended 是因为
     它假装在做推论；议题只做归类,所以必须如实把这些内容也收进来,节点本身的状态不变。 */
  const byLatent = new Map();
  for (const n of nodes) {
    for (const L of n.latents) {
      if (!byLatent.has(L)) byLatent.set(L, []);
      byLatent.get(L).push(n.id);
    }
  }
  const topics = [];
  for (const [L, members] of byLatent) {
    if (members.length < 2) continue;
    const sem = LATENT_SEMANTICS[L];
    topics.push({
      type: "topic", id: "T:" + L, latentId: L,
      short: TOPIC_LABEL[L] ?? sem?.name ?? "相关内容",
      summary: TOPIC_SUMMARY,
      memberIds: [...new Set(members)].sort(),
    });
  }
  topics.sort((a, b) => a.id.localeCompare(b.id));

  /* --- 逻辑边 --- */
  const edges = [];
  const seen = new Set();
  const push = (from, to, kind, note) => {
    const key = kind + "|" + from + "|" + to;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ from, to, kind, note });
  };

  /* 1. prereq:B 的获取前置由 A 的事实满足 */
  const factWitnesses = solved.coverage.factWitnesses ?? {};
  for (const id of obsIds) {
    const ev = EVENT_BY_OBS.get(id);
    for (const need of ev?.acquisitionRequires ?? []) {
      for (const w of factWitnesses[need] ?? []) {
        if (w.observationId !== id && has.has(w.observationId)) {
          push(w.observationId, id, "prereq", EDGE_KINDS.prereq);
        }
      }
    }
  }

  /* 2. caught:谁把悬空的那条接住了 */
  const caw = solved.coverage.contextActivationWitnesses ?? {};
  for (const [obsId, info] of Object.entries(caw)) {
    if (!has.has(obsId)) continue;
    for (const list of Object.values(info.witnesses ?? {})) {
      for (const w of list) {
        if (has.has(w.observationId)) {
          push(w.observationId, obsId, "caught", EDGE_KINDS.caught);
        }
      }
    }
  }

  /* --- 公理:已成立且无争议的主张,钉住不动,从决策面离场 --- */
  const axioms = [];
  for (const [claimId, c] of Object.entries(solved.claims ?? {})) {
    if (CLAIM_NOT_ON_MAP.has(claimId)) continue;
    if (!c?.established) continue;
    if (c.contested || c.logicallyRefuted) continue;
    axioms.push({
      type: "axiom", id: "AX:" + claimId, claimId,
      short: CLAIM_LABEL[claimId] ?? claimId,
      /* 不再叫「公理」。盲测者第一反应是数学课上「不证自明」的公理,而这里恰好相反 ——
         这是玩家花步数查实的东西。他明写每次看到都要在两种理解之间切换一次。 */
      line: (CLAIM_LABEL[claimId] ?? claimId) + " —— 已经查实,不用再查",
      supports: claimSupporters(solved, claimId),
    });
  }
  axioms.sort((a, b) => a.id.localeCompare(b.id));

  /* 公理 → 支撑它的观察,画作 supports 边(仍属免费自动生成) */
  for (const ax of axioms) {
    for (const m of ax.supports) if (has.has(m)) push(m, ax.id, "supports", ax.short);
  }

  return { nodes, topics, axioms, edges, components: components(nodes, topics, axioms, edges) };
}

/* 哪些观察在支撑某个主张:proofWitnesses 给槽位 → 事实,factWitnesses 给事实 → 观察。
   全部来自求解器输出,不复制求解器的判定逻辑。 */
export function claimSupporters(solved, claimId) {
  const pw = solved.coverage.proofWitnesses?.[claimId];
  const fw = solved.coverage.factWitnesses ?? {};
  if (!pw || Array.isArray(pw)) return [];
  const out = new Set();
  for (const facts of Object.values(pw)) {
    for (const f of facts ?? []) for (const w of fw[f] ?? []) out.add(w.observationId);
  }
  return [...out].sort();
}

/* 决策面仍沿用旧 Finding 时代的语义连通口径:只有非 suspended 的同议题内容
   达到两条时才互相接通。视觉议题可以诚实收纳 suspended／negative,但不能借此
   偷偷改变右侧「孤立小簇」的规则与稳定 ID。 */
function decisionTopicMembers(topic, nodeById) {
  return topic.memberIds.filter((id) => nodeById.has(id) && nodeById.get(id).state !== "suspended");
}

function legacyComponentMeta(component, topics, nodeById) {
  const members = new Set(component);
  const legacyMarkers = topics
    .filter((topic) => {
      const active = decisionTopicMembers(topic, nodeById);
      return active.length >= 2 && active.every((id) => members.has(id));
    })
    /* 仅用于保持旧 decisionSurface 的岛屿 ID／排序；不是图节点,不进入 nodes／edges。 */
    .map((topic) => "F:" + topic.latentId);
  const legacyIds = [...component, ...legacyMarkers].sort();
  return { first: legacyIds[0] ?? "", size: legacyIds.length };
}

/* 连通分量。用来找 DEC-032 决策面第四类「孤立小簇」。 */
function components(nodes, topics, axioms, edges) {
  const ids = [...nodes.map((n) => n.id), ...axioms.map((a) => a.id)];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map(ids.map((i) => [i, []]));
  for (const e of edges) {
    if (adj.has(e.from) && adj.has(e.to)) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); }
  }
  /* 议题不是节点也没有可见边。这里只用旧规则认可的成员做 union,
     让视觉归类变宽时不连带改变判题。 */
  for (const topic of topics) {
    const members = decisionTopicMembers(topic, nodeById);
    if (members.length < 2) continue;
    const pivot = members[0];
    for (const member of members.slice(1)) {
      adj.get(pivot).push(member);
      adj.get(member).push(pivot);
    }
  }
  const seen = new Set(); const comps = [];
  for (const i of ids) {
    if (seen.has(i)) continue;
    const stack = [i]; const comp = [];
    seen.add(i);
    while (stack.length) {
      const x = stack.pop(); comp.push(x);
      for (const y of adj.get(x) ?? []) if (!seen.has(y)) { seen.add(y); stack.push(y); }
    }
    comps.push(comp.sort());
  }
  comps.sort((a, b) => {
    const aa = legacyComponentMeta(a, topics, nodeById);
    const bb = legacyComponentMeta(b, topics, nodeById);
    return bb.size - aa.size || aa.first.localeCompare(bb.first);
  });
  return comps;
}

/* ================= 决策面 ================= */
/* DEC-032 第八节:只装四类。第七节:多个缺口并列、每个若干手段、都标价、不排序。 */
export function decisionSurface(solved, workbenchRows) {
  const usableById = new Map((workbenchRows ?? []).map((r) => [r.action.id, r]));
  const map = mentalMap(solved);
  const nodeById = new Map(map.nodes.map((n) => [n.id, n]));

  /* 手段:把 fact 或 role 翻译成「行里靠什么手段补它」,带价,不排序。 */
  const meansForFacts = (facts) => {
    const acts = new Set();
    for (const f of facts) for (const a of FACT_PRODUCERS.get(f) ?? []) acts.add(a);
    return [...acts].map(meansOf).filter(Boolean);
  };
  const meansOf = (actionId) => {
    const a = ACTION_BY_ID.get(actionId);
    if (!a) return null;
    const row = usableById.get(actionId);
    const sem = ACTION_SEMANTICS[actionId];
    return {
      actionId, name: a.name, ask: a.ask,
      cost: a.cost, costLabel: COST_LABEL[a.cost],
      usable: row ? row.usable : null,
      why: row?.why ?? null,
      done: row?.done ?? false,
      whyShort: sem?.whyShort ?? "",
    };
  };

  const items = [];

  /* 第一类:意义未定观察 —— 拿到了,还接不上任何东西 */
  const caw = solved.coverage.contextActivationWitnesses ?? {};
  const haveIds = new Set(map.nodes.map((n) => n.id));
  const negativeIds = new Set(solved.evidence.unresolvedNegativeIds);
  /* 换一种更够格的手段去问同一件底层的事 —— 从该观察所在的潜变量上找还没拿到的兄弟。
     只用玩家已经碰过的潜变量,不去枚举他没碰过的。 */
  const siblingMeans = (id) => {
    const latents = nodeById.get(id)?.latents ?? [];
    return meansForFacts(latents.flatMap((L) => latentSiblingFacts(L, haveIds)));
  };
  for (const id of solved.evidence.inactiveObservationIds) {
    if (negativeIds.has(id)) continue; /* 阴性另有说法,不重复列 */
    /* caw 只在前提已有见证时才出现;没出现时退回夹具的静态声明。 */
    const need = caw[id]?.requiredFacts ?? EVENT_BY_OBS.get(id)?.requiresContextFacts ?? [];
    items.push({
      kind: "suspended", id: "S:" + id,
      title: (nodeById.get(id)?.short ?? id) + " 现在还读不出结论",
      body: "这条你已经拿到手了,但少一个前提,所以现在还不能拿它下判断。" +
            "把那个前提补上,它会自己变成有用的证据 —— 不用重新花钱买一次,也不会因为等过一阵就打折。",
      means: meansForFacts(need),
    });
  }
  for (const id of negativeIds) {
    items.push({
      kind: "negative", id: "N:" + id,
      title: (nodeById.get(id)?.short ?? id) + " 没查到,但这不等于没有",
      body: "这一次什么也没查到。问题在于这个手段本身不够灵,不足以支撑「确实没有」这个结论 —— " +
            "「没查到」要能当证据用,得先有一个足够灵的手段来查。换一个看得更深的手段,去问同一件事。",
      means: siblingMeans(id),
    });
  }
  for (const id of solved.evidence.scopeLimitedObservationIds) {
    items.push({
      kind: "suspended", id: "L:" + id,
      title: (nodeById.get(id)?.short ?? id) + " 落在范围之外",
      body: "这条本身站得住,但它覆盖的范围不是当前问题需要的那一块。",
      means: [],
    });
  }

  /* 第二类:差一件即可合拢 —— 夹逼的靶子 */
  /* 2a. 主张的槽位。恰好只剩一个空 = onemore(夹逼靶子);
         剩两个以上但已有进展 = gap。

         gap 这一档是执行中放宽出来的,DEC-032 第八节原文只写了「差一件就能合拢」。
         不放宽会出现空白决策面:主张一旦缺两块以上就什么都不显示,玩家在 G1/G2
         面对一片空白 —— 那正是 DEC-032 要治的病。已在 README 声明,待用户裁决。 */
  for (const [claimId, pw] of Object.entries(solved.coverage.proofWitnesses ?? {})) {
    if (CLAIM_NOT_ON_MAP.has(claimId) || Array.isArray(pw)) continue;
    if (solved.claims?.[claimId]?.established) continue;
    const slots = Object.entries(pw);
    const empty = slots.filter(([, v]) => !(v ?? []).length);
    const filled = slots.length - empty.length;
    if (!filled || !empty.length) continue;
    if (empty.length === 1) {
      const [slot] = empty[0];
      items.push({
        kind: "onemore", id: "C:" + claimId + ":" + slot,
        title: `「${CLAIM_LABEL[claimId] ?? claimId}」只差一块:${SLOT_LABEL[claimId]?.[slot] ?? slot}`,
        body: `这项主张要的其他部分你已经有了,缺的是${SLOT_LABEL[claimId]?.[slot] ?? slot}。补上它,这一整块就合拢。`,
        means: meansForSlot(claimId, slot, meansForFacts),
      });
    } else {
      items.push({
        kind: "gap", id: "C:" + claimId,
        title: `「${CLAIM_LABEL[claimId] ?? claimId}」已经动起来了,还缺 ${empty.length} 块`,
        body: `已经落定的是:${slots.filter(([, v]) => (v ?? []).length)
          .map(([k]) => SLOT_LABEL[claimId]?.[k] ?? k).join("、")}。` +
          `还没有的是:${empty.map(([k]) => SLOT_LABEL[claimId]?.[k] ?? k).join("、")}。`,
        means: dedupeMeans(empty.flatMap(([slot]) => meansForSlot(claimId, slot, meansForFacts))),
        slots: empty.map(([slot]) => ({
          slot, label: SLOT_LABEL[claimId]?.[slot] ?? slot,
          means: meansForSlot(claimId, slot, meansForFacts),
        })),
      });
    }
  }
  /* 2b. 证明角色的独立来源不够。注意:minimumSourceCount 数的是来源并集,不是 witness 个数。 */
  for (const [roleId, contract] of Object.entries(proofRoleContracts)) {
    const ws = solved.coverage.proofRoleWitnesses?.[roleId];
    if (!ws?.length) continue;
    const sources = new Set();
    for (const w of ws) for (const s of w.sourceIds ?? []) sources.add(s);
    if (sources.size >= (contract.minimumSourceCount ?? 1)) continue;
    const sem = PROOF_ROLE_SEMANTICS[roleId];
    items.push({
      kind: "onemore", id: "R:" + roleId,
      title: (sem?.name ?? roleId) + " 还差一个独立来源",
      body: (sem?.meaning ? sem.meaning + " " : "") +
        `这一块要 ${contract.minimumSourceCount} 个彼此独立的来源,现在只有 ${sources.size} 个 —— 换一种手段印证同一件事是有用的,重复同一种手段没有用。`,
      means: [meansOf(contract.acquisitionActionId)].filter(Boolean),
    });
  }
  /* 2c. 档案三关系里差一环 */
  for (const [group, rel] of Object.entries(solved.coverage.archiveRelations ?? {})) {
    const states = ["recordCoherence", "objectAttribution", "eventCorroboration"]
      .map((k) => [k, rel[k]]);
    const open = states.filter(([, v]) => v === "unresolved" || v === "suggestive");
    const done = states.filter(([, v]) => v === "established");
    if (!done.length || open.length !== 1) continue;
    const [k, v] = open[0];
    items.push({
      kind: "onemore", id: "A:" + group + ":" + k,
      title: `${ARCHIVE_GROUP_LABEL[group] ?? group}:${ARCHIVE_REL_LABEL[k]} —— ${ARCHIVE_REL_STATE[v]}`,
      body: "查一批记录要分别过三道:①这几份记录互相对得上吗 ②这些记录说的是这只碗吗 " +
            "③记录里写的事,在实物上找得到吗。这三道是并列的,不分先后。你已经过了其中一部分,这一道还没有。",
      means: meansForArchive(group, k, meansOf),
    });
  }

  /* 第三类:打架的 */
  for (const c of solved.conflicts ?? []) {
    items.push({
      kind: "conflict", id: "X:" + (c.code ?? c.id ?? JSON.stringify(c).slice(0, 24)),
      title: "有两处对不上",
      body: "手上的东西互相矛盾。矛盾本身也是情报 —— 至少有一处读错了,或者其中一条根本不属于这只碗。",
      means: [], raw: c,
    });
  }
  for (const [claimId, c] of Object.entries(solved.claims ?? {})) {
    if (CLAIM_NOT_ON_MAP.has(claimId)) continue;
    if (!c?.contested && !c?.logicallyRefuted) continue;
    items.push({
      kind: "conflict", id: "XC:" + claimId,
      title: `「${CLAIM_LABEL[claimId] ?? claimId}」${c.logicallyRefuted ? "已被推翻" : "有争议"}`,
      body: c.logicallyRefuted
        ? "有一条证据在逻辑上直接否掉了这项主张。"
        : "支持与反对同时存在,这项主张现在站不稳。",
      means: [],
    });
  }
  for (const [group, rel] of Object.entries(solved.coverage.archiveRelations ?? {})) {
    for (const k of ["recordCoherence", "objectAttribution", "eventCorroboration"]) {
      if (rel[k] !== "contested") continue;
      items.push({
        kind: "conflict", id: "XA:" + group + ":" + k,
        title: `${ARCHIVE_GROUP_LABEL[group] ?? group}:${ARCHIVE_REL_LABEL[k]} 有冲突`,
        body: "这一环上出现了互相打架的说法。",
        means: meansForArchive(group, k, meansOf),
      });
    }
  }

  /* 第四类:孤立小簇 —— 内部自洽但没连上主结构 */
  const [main, ...rest] = map.components;
  for (const comp of rest) {
    const obsMembers = comp.filter((x) => nodeById.has(x));
    if (!obsMembers.length) continue;
    const suspended = new Set([...solved.evidence.inactiveObservationIds]);
    if (obsMembers.every((x) => suspended.has(x))) continue; /* 已在第一类里说过 */
    items.push({
      kind: "island", id: "I:" + legacyComponentMeta(comp, map.topics, nodeById).first,
      title: obsMembers.map((x) => nodeById.get(x).short).join("、") + " 还是一座孤岛",
      body: comp.length === 1
        ? "这条自己站得住,但还没有和别的东西发生关系。也可能它本来就相对独立 —— 离散不是缺陷。"
        : "这一小簇内部说得通,但和主结构还没接上。",
      means: meansForFacts(
        obsMembers.flatMap((x) => (nodeById.get(x)?.latents ?? []))
          .flatMap((L) => latentSiblingFacts(L, new Set(map.nodes.map((n) => n.id)))),
      ),
    });
  }

  /* 公理:已定案的一行,离场但仍在全图 */
  const axiomLines = map.axioms.map((a) => a.line);

  /* 决策面清空是一个有意义的状态,不是空白界面。
     这里刻意不把「玩家还没动过的主张」列出来充数 —— 那就是 DEC-032 第八节要治的
     todolist。没有悬而未决的东西时,开不开新线是纯粹的意图,按第七节那是玩家的活。 */
  const clear = items.length === 0;
  const clearLine = clear
    ? (map.nodes.length === 0
        ? "还没有任何情报。先从左边那只碗看起:看它不花钱,但每一个手段都占掉一步。"
        : "没有悬而未决的东西了:没有接不上的情报,没有差一件就合拢的,也没有打架的。" +
          "收手是一个正当选择;想往下走,就得自己开一条新线 —— 开哪条由你定。")
    : null;

  return { items, clear, clearLine, axioms: map.axioms, axiomLines, map,
           mainComponentSize: main ? legacyComponentMeta(main, map.topics, nodeById).size : 0 };
}

/* 某槽位要哪些事实 → 哪些手段产出这些事实。
   SLOT_FACTS 抄自满局求解器输出(见 harness 的防漂移检查),不是猜的。 */
function meansForSlot(claimId, slot, meansForFacts) {
  return dedupeMeans(meansForFacts(SLOT_FACTS[claimId]?.[slot] ?? []));
}
function meansForArchive(group, relKind, meansOf) {
  const roleId = ARCHIVE_ROLE[group]?.[relKind];
  const ids = Array.isArray(roleId) ? roleId : [roleId];
  const out = [];
  for (const r of ids) {
    const c = proofRoleContracts[r];
    if (c) { const m = meansOf(c.acquisitionActionId); if (m) out.push(m); }
  }
  return dedupeMeans(out);
}
function dedupeMeans(list) {
  const seen = new Set();
  return list.filter((m) => (seen.has(m.actionId) ? false : (seen.add(m.actionId), true)));
}
/* 同一潜变量上还没拿到的那些观察需要什么事实 —— 用来给孤岛提手段。
   只用玩家已有节点所在的潜变量,不去枚举玩家没碰过的潜变量。 */
function latentSiblingFacts(latentId, haveIds) {
  const out = [];
  for (const ev of Object.values(events)) {
    if (!(ev.sharedLatentIds ?? []).includes(latentId)) continue;
    if (haveIds.has(ev.observationId)) continue;
    if (!ACTION_BY_ID.has(ev.acquisitionActionId)) continue;
    out.push(...(ev.facts ?? []));
  }
  return out;
}

/* 槽位 → 它要的事实。抄自满局(22 动作)求解器输出的 coverage.proofWitnesses。
   harness 会拿满局输出回比这张表,漂移就报错。 */
export const SLOT_FACTS = {
  identity: {
    currentObject: ["baseManufacture", "currentBody"],
    path: ["identityComparisonExclusion", "identityObjectContinuity"],
  },
  majorReassembly: {
    currentRepairMap: ["currentRepairMap"],
    documentedCrossTime: ["t2EventPhysicalCorrespondence"],
    documentedSourceGroup: ["t2RecordClaimsDamageExtent", "t2RecordClaimsReassembly"],
    physicalCrossTime: ["crossTimeMajorChange"],
    physicalStructureMap: ["currentStructureReadoutByRegion"],
  },
  threePhase: {
    t1: ["t1Established"],
    t2: ["t2ArchiveObjectAttribution", "t2EventPhysicalCorrespondence", "t2RecordGroupCoherent"],
    t3: ["t3ArchiveObjectAttribution", "t3EventPhysicalCorrespondence", "t3RecordGroupCoherent"],
  },
  coherentDecisionProfile: {
    documentation: ["documentationBoundary", "documentationNoConflict"],
    keyMaterial: ["keyMaterialLayerSequenceReadings", "keyMaterialSubstrateReadings"],
    stability: ["displayConditionSpecified", "stabilityResolved"],
    surface: ["surfacePointLayering", "surfaceRegionalCoverage", "surfaceResolved"],
  },
};
const ARCHIVE_ROLE = {
  t2: {
    recordCoherence: "PROOF.ARCHIVE.T2.RECORD_COHERENCE",
    objectAttribution: "PROOF.ARCHIVE.T2.OBJECT_ATTRIBUTION",
    eventCorroboration: ["PROOF.ARCHIVE.T2.EVENT_CURRENT_CORROBORATION",
                         "PROOF.ARCHIVE.T2.EVENT_CROSS_TIME_CORROBORATION"],
  },
  t3: {
    recordCoherence: "PROOF.ARCHIVE.T3.RECORD_COHERENCE",
    objectAttribution: "PROOF.ARCHIVE.T3.OBJECT_ATTRIBUTION",
    eventCorroboration: "PROOF.ARCHIVE.T3.EVENT_CURRENT_CORROBORATION",
  },
};

/* ================= G:不进地图,只作一行读数 ================= */
export function readout(solved, session) {
  const sem = STAGE_SEMANTICS[solved.stage];
  const paths = solved.coverage.majorProofPaths ?? {};
  return {
    stage: solved.stage,
    name: sem?.name ?? solved.stage,
    line: sem?.meaning ?? "",
    used: session?.log?.length ?? 0,
    budget: session?.budget ?? null,
    /* 账单按档计数,不求和 —— 理由见 session.mjs 的 newSession 注释。
       本阶段钱不约束任何东西,只在局末告知,所以这里给的是构成而不是一个总数。 */
    billed: [...(session?.billed ?? [0, 0, 0, 0])],
    routes: [
      { id: "documented", ...ROUTE_SEMANTICS.documented, open: !!paths.documented },
      { id: "physical", ...ROUTE_SEMANTICS.physical, open: !!paths.physical },
    ],
    frozenStage: solved.stopping?.frozenStage ?? null,
  };
}
