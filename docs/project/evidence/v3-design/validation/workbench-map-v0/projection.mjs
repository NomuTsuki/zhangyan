/* 心智地图与决策面的投影层。
   DEC-032 的结构不在冻结求解器的模型里,所以这一层在它外面,把求解器输出翻译成
   「观察 → 逻辑边 → 局部 Finding → 公理」。冻结文件一个字节都不改。

   拓扑(每一层都能在冻结数据里指出出处):
     观察节点     = solved.evidence.observationIds        —— 玩家花机会挣来的
     逻辑边       = 四种既有关系,见下 EDGE_KINDS         —— 系统免费自动生成
     局部 Finding = 同一潜变量上聚起 ≥2 条观察时自动成形  —— 系统免费自动生成
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
  "obs.current.whole": { short: "整器读数", gist: "器型与胎釉的整体面貌,加上肉眼可见的干预痕迹分布在哪几区。" },
  "obs.current.base": { short: "底足痕迹", gist: "圈足与修足留下的成型痕迹 —— 制造工艺的指纹。" },
  "obs.appearance.restore": { short: "外观重整痕迹", gist: "纹饰与色差显示外观被重新整合过的那些区。" },
  "obs.corpus.identity": { short: "语料比对结果", gist: "这套制造特征在同期真品语料里是常见还是罕见。" },
  "obs.corpus.identity.repeat": { short: "语料复核(同一结论)", gist: "换一批语料复核,结论与上次一致 —— 是本局经历,但不额外计权。" },
  "obs.object.continuity": { short: "同一器物", gist: "不参与重组的稳定锚点对得上:手里这只与记录里那只是同一件。" },
  "obs.structure.xray.early": { short: "釉下结构影像", gist: "多角度射线下逐区的结构读数。" },
  "obs.surface.no-signal.unresolved": { short: "紫外无信号(未定)", gist: "没筛出补绘信号,但这次筛查的能力不足以支撑「没有补绘」这个结论。" },
  "obs.accident.major": { short: "事故记录组", gist: "一组彼此自洽的记录,描述了一次重大损坏与随后的重组。" },
  "obs.archive.t2.object-attribution": { short: "事故记录归属本器", gist: "那组事故记录说的就是这只碗。" },
  "obs.archive.t2.current-corroboration": { short: "事故记录对上现器", gist: "记录描述的那次重组,在现器上找得到对应痕迹。" },
  "obs.phase.t1": { short: "事故前影像", gist: "一个更早时点的样貌,可作比较基线。" },
  "obs.structure.major.cross-time": { short: "跨时点结构变化", gist: "把两个时点的逐区结构摆一起,变了什么看得见。" },
  "obs.structure.major.documented-cross-time": { short: "跨时点变化(依档案)", gist: "以档案给的时点作基线得出的跨时点变化 —— 结论依赖档案说的是这只碗。" },
  "obs.phase.t3": { short: "后期处理记录", gist: "更晚的一批处理记录,说明后来还有人动过它。" },
  "obs.archive.t3.object-attribution": { short: "后期记录归属本器", gist: "那批后期记录也是这只碗的。" },
  "obs.archive.t3.current-corroboration": { short: "后期记录对上现器", gist: "后期处理在现器对应区域找得到。" },
  "obs.key-material.substrate-readings": { short: "关键点基底读数", gist: "关键区的材料基底:是原片还是重建的。" },
  "obs.key-material.layer-sequence": { short: "微观层序", gist: "各层上去的先后顺序 —— 谁压在谁上面。" },
  "obs.surface.point-layering": { short: "表面试窗点位", gist: "开窗点上补绘压在哪一层之上,以此定后加层与原层的关系。" },
  "obs.surface.resolved": { short: "表面范围已定", gist: "把点位综合成区域,补绘范围有多大说得出来了。" },
  "obs.stability.resolved": { short: "稳定性已定", gist: "承力路径与陈列条件评估完成。" },
  "obs.documentation.resolved": { short: "来源链边界", gist: "流转记录到哪一步为止,且这段里没有互相打架的文件。" },
};

/* ---------- 主张的槽位标签。空槽位就是「还差哪一块」。 ---------- */
export const CLAIM_LABEL = {
  identity: "它属于哪一路",
  majorReassembly: "它曾被大幅重组过",
  threePhase: "重组分三个时点发生",
  coherentDecisionProfile: "整份判断内部自洽",
};
/* g1 与 appearanceRestore 不进地图:前者是阶段结果(DEC-032 第十节),
   后者是单条事实而非主张。 */
export const CLAIM_NOT_ON_MAP = new Set(["g1", "appearanceRestore"]);

export const SLOT_LABEL = {
  identity: {
    currentObject: "现器本身的工艺读数",
    path: "与历史时点是同一件器物",
  },
  majorReassembly: {
    currentRepairMap: "可具名的干预分布图",
    documentedSourceGroup: "记录组自洽并归到本器",
    documentedCrossTime: "档案所述与跨时点物证对得上",
    physicalStructureMap: "逐区结构读数",
    physicalCrossTime: "跨时点结构变化",
  },
  threePhase: {
    t1: "事故之前的状态",
    t2: "事故与那一次重组",
    t3: "后期的处理",
  },
  coherentDecisionProfile: {
    documentation: "文件边界清楚且无冲突",
    keyMaterial: "关键材料已定",
    stability: "稳定性已定",
    surface: "表面处理已定",
  },
};

export const ARCHIVE_REL_LABEL = {
  recordCoherence: "记录之间自洽吗",
  objectAttribution: "记录说的是这只碗吗",
  eventCorroboration: "记录说的事在物证上对得上吗",
};
export const ARCHIVE_REL_STATE = {
  unresolved: "还没结论",
  suggestive: "有指向性,但还没归到本器",
  established: "已建立",
  contested: "有冲突",
};
export const ARCHIVE_GROUP_LABEL = { t2: "事故那一组记录", t3: "后期处理那一组记录" };

export const EDGE_KINDS = {
  latent: "说的是同一件底层的事",
  prereq: "没有前一条,后一条拿不到",
  caught: "后来这条把先前悬空的那条接住了",
};

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

  /* --- 局部 Finding:同一潜变量上聚起 ≥2 条观察时自动成形 --- */
  const byLatent = new Map();
  for (const n of nodes) {
    if (n.state === "suspended") continue; /* 悬空的还没接上,不算进 Finding */
    for (const L of n.latents) {
      if (!byLatent.has(L)) byLatent.set(L, []);
      byLatent.get(L).push(n.id);
    }
  }
  const findings = [];
  for (const [L, members] of byLatent) {
    if (members.length < 2) continue;
    const sem = LATENT_SEMANTICS[L];
    findings.push({
      type: "finding", id: "F:" + L, latentId: L,
      short: sem?.name ?? L, gist: sem?.meaning ?? "",
      members: [...members].sort(),
    });
  }
  findings.sort((a, b) => a.id.localeCompare(b.id));

  /* --- 逻辑边 --- */
  const edges = [];
  const seen = new Set();
  const push = (from, to, kind, note) => {
    const key = kind + "|" + from + "|" + to;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ from, to, kind, note });
  };

  /* 1. latent:观察 → 它所属的局部 Finding */
  for (const f of findings) {
    for (const m of f.members) push(m, f.id, "latent", f.short);
  }
  /* 潜变量上只有一条观察时不连边 —— 玩家还没有那个 Finding,图上就不该有它。 */

  /* 2. prereq:B 的获取前置由 A 的事实满足 */
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

  /* 3. caught:谁把悬空的那条接住了 */
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
      line: (CLAIM_LABEL[claimId] ?? claimId) + " —— 已定,不再需要论证",
      supports: claimSupporters(solved, claimId),
    });
  }
  axioms.sort((a, b) => a.id.localeCompare(b.id));

  /* 公理 → 支撑它的观察,画作 supports 边(仍属免费自动生成) */
  for (const ax of axioms) {
    for (const m of ax.supports) if (has.has(m)) push(m, ax.id, "supports", ax.short);
  }

  return { nodes, findings, axioms, edges, components: components(nodes, findings, axioms, edges) };
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

/* 连通分量。用来找 DEC-032 决策面第四类「孤立小簇」。 */
function components(nodes, findings, axioms, edges) {
  const ids = [...nodes.map((n) => n.id), ...findings.map((f) => f.id), ...axioms.map((a) => a.id)];
  const adj = new Map(ids.map((i) => [i, []]));
  for (const e of edges) {
    if (adj.has(e.from) && adj.has(e.to)) { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); }
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
  comps.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
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
      title: (nodeById.get(id)?.short ?? id) + " 暂时接不上",
      body: "这条已经拿到了,但缺一个前提才能安全解释它。补上之后它会自动接进来,而且不重复计权。",
      means: meansForFacts(need),
    });
  }
  for (const id of negativeIds) {
    items.push({
      kind: "negative", id: "N:" + id,
      title: (nodeById.get(id)?.short ?? id) + " 没筛出东西,但不够格下结论",
      body: "这次没有发现信号。问题是这次筛查的能力不足以支撑「没有」这个结论 —— 阴性要成为证据,得先证明手段够格。换一种更能定层的手段去问同一件事。",
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
      body: "档案要分三件事看:记录之间自洽吗、记录说的是这只碗吗、记录说的事在物证上对得上吗。你已经落定了其中的一部分,这一环还没有。",
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
      kind: "island", id: "I:" + comp[0],
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
        ? "还没有任何情报。左边那只碗随便看,免费的几眼不要钱。"
        : "没有悬而未决的东西了:没有接不上的情报,没有差一件就合拢的,也没有打架的。" +
          "收手是一个正当选择;想往下走,就得自己开一条新线 —— 开哪条由你定。")
    : null;

  return { items, clear, clearLine, axioms: map.axioms, axiomLines, map,
           mainComponentSize: main?.length ?? 0 };
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
    routes: [
      { id: "documented", ...ROUTE_SEMANTICS.documented, open: !!paths.documented },
      { id: "physical", ...ROUTE_SEMANTICS.physical, open: !!paths.physical },
    ],
    frozenStage: solved.stopping?.frozenStage ?? null,
  };
}
