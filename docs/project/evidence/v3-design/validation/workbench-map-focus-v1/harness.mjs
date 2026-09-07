/* 无界面自检:先把投影层验掉,再写任何界面。跑法:node harness.mjs */
import { proofRoleContracts } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { ACTIONS, ACTION_BY_ID, COST_LABEL } from "../knowledge-map-slice-v0/case.mjs";
import { newSession, take, solve, workbench, setBudget, clampBudget,
         BUDGET_MIN, BUDGET_MAX, BUDGET_DEFAULT } from "./session.mjs";
import { mentalMap, decisionSurface, readout, OBS_LABEL, SLOT_LABEL, SLOT_FACTS,
         CLAIM_LABEL, CLAIM_NOT_ON_MAP, TOPIC_SUMMARY } from "./projection.mjs";

const line = (s) => console.log(s);
let fails = 0;
function check(label, cond, detail = "") {
  if (!cond) { fails++; line(`  FAIL  ${label} ${detail}`); }
  else line(`  ok    ${label} ${detail}`);
}

function play(label, actionIds, { stop = false, quiet = false } = {}) {
  if (!quiet) line(`\n=== ${label} ===`);
  const s = newSession();
  for (const id of actionIds) {
    const r = take(s, id);
    const a = ACTION_BY_ID.get(id);
    if (!r.ok) { if (!quiet) line(`  x ${a?.name ?? id} — ${r.why}`); continue; }
    if (!quiet) {
      const mark = { progress: "推进", repeat: "重复", negative: "阴性",
                     suspended: "暂挂", deadend: "无新信息" }[r.kind];
      line(`  ${String(s.log.length).padStart(2)}. ${a.name.padEnd(14)} ` +
        `费用${COST_LABEL[a.cost]}  [${mark}]${r.stageMoved ? `  ${r.from}→${r.to}` : ""}`);
    }
  }
  if (stop) s.stopped = true;
  const solved = solve(s);
  const map = mentalMap(solved);
  const ds = decisionSurface(solved, workbench(s));
  const ro = readout(solved, s);
  if (!quiet) {
    line(`  ---- 地图 ----`);
    line(`  观察 ${map.nodes.length} · 议题 ${map.topics.length} · 已查实 ${map.axioms.length}` +
      ` · 逻辑边 ${map.edges.length} · 连通分量 ${map.components.length}` +
      ` (最大 ${map.components[0]?.length ?? 0})`);
    const byKind = {};
    for (const e of map.edges) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    line(`  边的种类:${Object.entries(byKind).map(([k, v]) => k + "=" + v).join(" ") || "(无)"}`);
    if (map.topics.length) {
      line(`  议题归类(不是结论):`);
      for (const topic of map.topics) line(`    · ${topic.short}  (${topic.memberIds.length} 条内容)`);
    }
    if (map.axioms.length) { line(`  已经查实(已离场决策面):`); for (const a of map.axioms) line(`    · ${a.line}`); }
    line(`  ---- 决策面 ${ds.items.length} 条 ----`);
    if (ds.clear) line(`  (清空)${ds.clearLine}`);
    for (const it of ds.items) {
      line(`  [${it.kind}] ${it.title}`);
      if (it.means.length) {
        line(`      手段(不排序):` + it.means
          .map((m) => `${m.name}(${m.costLabel}${m.usable === false ? "·暂不可用" : ""})`).join(" / "));
      } else line(`      手段:(暂无现成手段)`);
    }
    line(`  ---- 读数(不在地图上) ----`);
    line(`  ${ro.name} — ${ro.line}`);
    line(`  路线:档案=${ro.routes[0].open ? "通" : "未通"} 物证=${ro.routes[1].open ? "通" : "未通"}` +
      ` · 用掉点数 ${ro.used}/${ro.budget}`);
  }
  return { s, solved, map, ds, ro };
}

/* ---------------- A. 标签覆盖:任何漏配都要报错 ---------------- */
line("### A. 标签覆盖");
{
  /* 把 22 个动作全做一遍(忽略预算),拿最全的节点与槽位集合 */
  const s = newSession();
  const seenObs = new Set();
  for (const a of ACTIONS) {
    const r = take(s, a.id);
    if (r.ok) seenObs.add(r.observationId);
    else if (s.log.length >= s.budget) { s.log.length = 0; /* 解开步数继续铺 */ }
  }
  const solved = solve(s);
  for (const id of solved.evidence.observationIds) seenObs.add(id);
  const missing = [...seenObs].filter((id) => !OBS_LABEL[id]);
  check(`${seenObs.size} 条可达观察全部有情报标签`, missing.length === 0, "缺:" + missing.join(", "));

  const slotMiss = [];
  for (const [claim, pw] of Object.entries(solved.coverage.proofWitnesses ?? {})) {
    if (CLAIM_NOT_ON_MAP.has(claim) || Array.isArray(pw)) continue;
    if (!CLAIM_LABEL[claim]) slotMiss.push("claim:" + claim);
    for (const slot of Object.keys(pw)) {
      if (!SLOT_LABEL[claim]?.[slot]) slotMiss.push(claim + "." + slot);
    }
  }
  check("每个主张与槽位都有人话标签", slotMiss.length === 0, "缺:" + slotMiss.join(", "));
  check("g1 与 appearanceRestore 不进地图", CLAIM_NOT_ON_MAP.has("g1"));
}

/* ---------------- B. 空局 ---------------- */
line("\n### B. 空局:右侧必须是空的");
{
  const s = newSession();
  const solved = solve(s);
  const map = mentalMap(solved);
  const ds = decisionSurface(solved, workbench(s));
  check("空局地图没有任何节点(玩家没有的东西不存在位置)",
    map.nodes.length === 0 && map.topics.length === 0 && map.axioms.length === 0);
  check("空局没有边", map.edges.length === 0);
  check("空局决策面为空", ds.items.length === 0, `实际 ${ds.items.length}`);
  const wb = workbench(s);
  check("左侧工作台空局就有可用动作(器物侧不受解锁约束)", wb.some((r) => r.usable));
  /* DEC-032 第三节:器物侧行动不受剧情解锁约束。这里查的是免费肉眼观察 ——
     同在器物上的「逐区跨时点对照」被前置事实挡住,那是逻辑不可能(没有第二个时点
     就无从对照),不是剧情解锁。这条张力记在 README。 */
  const freeObj = wb.filter((r) => r.action.cost === 0);
  check("器物侧免费观察空局全部可用(不受解锁约束)", freeObj.every((r) => r.usable),
    freeObj.filter((r) => !r.usable).map((r) => r.action.name).join(","));
  check("免费观察正好三条", freeObj.length === 3, `实际 ${freeObj.length}`);
}

/* ---------------- A2. 防漂移:SLOT_FACTS 必须与满局求解器输出一致 ---------------- */
line("\n### A2. SLOT_FACTS 防漂移");
{
  const s = newSession();
  for (const a of ACTIONS) { if (s.log.length >= s.budget) s.log.length = 0; take(s, a.id); }
  const solved = solve(s);
  const drift = [];
  for (const [claim, pw] of Object.entries(solved.coverage.proofWitnesses ?? {})) {
    if (CLAIM_NOT_ON_MAP.has(claim) || Array.isArray(pw)) continue;
    for (const [slot, facts] of Object.entries(pw)) {
      const authored = (SLOT_FACTS[claim]?.[slot] ?? []).slice().sort().join(",");
      const actual = (facts ?? []).slice().sort().join(",");
      if (authored !== actual) drift.push(`${claim}.${slot}: 表=[${authored}] 实=[${actual}]`);
    }
  }
  check("满局每个槽位的事实与手写表一致", drift.length === 0, drift.join(" | "));
}

/* ---------------- C. 同议题内容只做归类,不冒充局部结论 ---------------- */
const c1 = play("C. 两条免费观察 → 第一个议题归类", ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE"]);
check("两条观察共享潜变量后形成议题", c1.map.topics.length >= 1,
  `实际 ${c1.map.topics.length}`);
check("议题的成员至少两条", c1.map.topics.every((topic) => topic.memberIds.length >= 2));
check("议题明说只是归类,不是结论",
  c1.map.topics.every((topic) => topic.summary === TOPIC_SUMMARY && topic.summary.includes("不是结论")));
check("议题不是地图节点", !Object.hasOwn(c1.map, "findings")
  && c1.map.edges.every((edge) => edge.kind !== "latent")
  && c1.map.edges.every((edge) => !edge.from.startsWith("F:") && !edge.to.startsWith("F:")));
{
  const one = play("(内部)只做一条观察", ["A.OBSERVE.WHOLE"], { quiet: true });
  check("只有一条观察时不产生议题(不预告玩家没有的结构)",
    one.map.topics.length === 0, `实际 ${one.map.topics.length}`);
  check("只有一条观察时没有边", one.map.edges.length === 0);
}
{
  const surface = play("(内部)紫外阴性与表面窗口仍归入同一议题",
    ["A.SCREEN.UV", "A.INSPECT.WINDOWS"], { quiet: true });
  const topic = surface.map.topics.find((candidate) => candidate.id === "T:latent.surface-map");
  check("议题收纳玩家已取得但暂时不能作证的内容",
    topic?.memberIds.includes("obs.surface.no-signal.unresolved")
      && topic?.memberIds.includes("obs.surface.point-layering"));
  check("归类没有篡改紫外阴性的暂挂状态",
    surface.map.nodes.some((node) => node.id === "obs.surface.no-signal.unresolved" && node.state === "suspended"));
}

/* ---------------- D. 意义未定观察:悬空 → 被接住 ---------------- */
const d1 = play("D. 射线先行:悬空", ["A.IMAGE.XRAY", "A.OBSERVE.WHOLE"]);
check("射线读数处于暂挂状态", d1.map.nodes.some((n) => n.id === "obs.structure.xray.early" && n.state === "suspended"));
check("决策面出现意义未定观察一类", d1.ds.items.some((i) => i.kind === "suspended"));
{
  const sus = d1.ds.items.find((i) => i.kind === "suspended");
  check("悬空条目给得出补它的手段(领域知识无偿给)", (sus?.means.length ?? 0) > 0,
    `手段数 ${sus?.means.length ?? 0}`);
}
const d2 = play("D2. 补上同一器物 → 被接住", ["A.IMAGE.XRAY", "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY"]);
check("射线读数被接住", d2.map.nodes.some((n) => n.id === "obs.structure.xray.early" && n.state === "caught"));
check("出现 caught 类逻辑边", d2.map.edges.some((e) => e.kind === "caught"));
check("被接住后不再挂在决策面第一类",
  !d2.ds.items.some((i) => i.id === "S:obs.structure.xray.early"));

/* ---------------- E. 前置依赖边 ---------------- */
const e1 = play("E. 语料比对的前置", ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS"]);
check("出现 prereq 类逻辑边", e1.map.edges.some((e) => e.kind === "prereq"));
check("prereq 边指向语料比对那条情报",
  e1.map.edges.some((e) => e.kind === "prereq" && e.to === "obs.corpus.identity"));

/* ---------------- F. 公理坍缩 ---------------- */
const f1 = play("F. 物证路线到 G2:主张成立 → 坍缩成公理", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY",
  "A.OBSERVE.REGION_DECOR", "A.IMAGE.XRAY", "A.MAP.REGION_CONTINUITY",
]);
check("到达 G2", f1.solved.stage === "G2", `实际 ${f1.solved.stage}`);
check("成立且无争议的主张坍缩成公理", f1.map.axioms.length >= 1, `实际 ${f1.map.axioms.length}`);
check("公理只占一行", f1.map.axioms.every((a) => a.line.length < 40));
check("已成立的主张不再出现在决策面的差一件里",
  !f1.ds.items.some((i) => i.kind === "onemore" && i.id.startsWith("C:majorReassembly")));
check("G 不在地图节点里", ![...f1.map.nodes, ...f1.map.axioms]
  .some((n) => /G1|G2|G3/.test(n.id)));

/* ---------------- G. 差一件即可合拢 ---------------- */
const g1 = play("G. 档案路线走一半:应当出现差一件", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT",
]);
check("出现差一件即可合拢一类", g1.ds.items.some((i) => i.kind === "onemore"),
  g1.ds.items.map((i) => i.kind).join(","));
{
  const om = g1.ds.items.filter((i) => i.kind === "onemore" || i.kind === "gap");
  check("每条缺口都给得出手段", om.every((i) => i.means.length > 0),
    om.filter((i) => !i.means.length).map((i) => i.title).join(" | "));
}
/* 独立来源不够时必须按来源并集判断,不能按 witness 个数 */
check("满局不会因为 witness 只有一个就误报差来源", (() => {
  const s = newSession();
  for (const a of ACTIONS) { if (s.log.length >= s.budget) s.log.length = 0; take(s, a.id); }
  const solved = solve(s);
  const ds = decisionSurface(solved, workbench(s));
  const bogus = ds.items.filter((i) => i.id.startsWith("R:"));
  return bogus.length === 0;
})(), "如失败说明把 minimumSourceCount 当成了 witness 个数");

/* ---------------- H. 阴性与孤岛 ---------------- */
const h1 = play("H. 紫外阴性 + 一条离散情报", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.SCREEN.UV", "A.TRACE.PROVENANCE_CHAIN",
]);
check("阴性未过能力门被单列", h1.ds.items.some((i) => i.id.startsWith("N:")));
check("孤立的情报被认成孤岛或至少不假装连上了",
  h1.map.components.length >= 2, `分量数 ${h1.map.components.length}`);

/* ---------------- I. 决策面有界 ---------------- */
line("\n### I. 决策面大小有界(DEC-032 第八节)");
{
  const rows = [];
  const s = newSession();
  const order = ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.OBSERVE.REGION_DECOR",
    "A.COMPARE.CORPUS", "A.VERIFY.OBJECT_CONTINUITY", "A.IMAGE.XRAY",
    "A.MAP.REGION_CONTINUITY", "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT",
    "A.CORROBORATE.ARCHIVE.T2_CURRENT", "A.LOCATE.HISTORIC_IMAGE", "A.RESEARCH.LATE_TREATMENT"];
  for (const id of order) {
    take(s, id);
    const solved = solve(s);
    const map = mentalMap(solved);
    const ds = decisionSurface(solved, workbench(s));
    rows.push({ n: s.log.length, nodes: map.nodes.length, topics: map.topics.length,
      axioms: map.axioms.length, edges: map.edges.length, items: ds.items.length,
      clearLine: ds.clearLine, stage: solved.stage });
  }
  for (const r of rows) {
    line(`  第${String(r.n).padStart(2)}步  观察${String(r.nodes).padStart(2)}` +
      ` 议题${String(r.topics).padStart(2)} 已查实${r.axioms} 边${String(r.edges).padStart(2)}` +
      ` · 决策面${String(r.items).padStart(2)} 条 · ${r.stage}`);
  }
  const maxItems = Math.max(...rows.map((r) => r.items));
  check("决策面全程不超过 8 条(探索让新东西进场,定案让旧东西离场)",
    maxItems <= 8, `实际最大 ${maxItems}`);
  /* 决策面清空是允许的(到了 G2 本来就该给收手留位置),但不许渲染成空白:
     必须给出一句明说的理由。 */
  const blank = rows.filter((r) => r.items === 0 && !r.clearLine).map((r) => r.n);
  check("决策面为空时必须有明说的理由,不许空白",
    blank.length === 0, "空白于第 " + blank.join("、") + " 步");
  const cleared = rows.filter((r) => r.items === 0).map((r) => r.n);
  line(`  (决策面清空发生在第 ${cleared.join("、") || "—"} 步,均带明说理由)`);
  const maxEdges = Math.max(...rows.map((r) => r.edges));
  check("逻辑边不是毛球(全程 ≤ 40 条)", maxEdges <= 40, `实际最大 ${maxEdges}`);
  check("地图确实在长(末步观察数 > 首步)", rows.at(-1).nodes > rows[0].nodes);
  check("末步有边(不是一盘散点)", rows.at(-1).edges > 0, `实际 ${rows.at(-1).edges}`);
}

/* ---------------- J. 不泄题 ---------------- */
line("\n### J. 玩家可见文本不含内部标识符与作者答案");
{
  const s = newSession();
  const order = ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.IMAGE.XRAY", "A.SCREEN.UV",
    "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT", "A.VERIFY.OBJECT_CONTINUITY",
    "A.MAP.REGION_CONTINUITY", "A.COMPARE.CORPUS", "A.TRACE.PROVENANCE_CHAIN"];
  for (const id of order) take(s, id);
  const solved = solve(s);
  const map = mentalMap(solved);
  const ds = decisionSurface(solved, workbench(s));
  const ro = readout(solved, s);

  const texts = [];
  for (const n of map.nodes) texts.push(n.short, n.gist);
  for (const topic of map.topics) texts.push(topic.short, topic.summary);
  for (const a of map.axioms) texts.push(a.short, a.line);
  for (const e of map.edges) texts.push(e.note ?? "");
  for (const i of ds.items) {
    texts.push(i.title, i.body);
    for (const m of i.means) texts.push(m.name, m.ask, m.whyShort, m.costLabel);
  }
  texts.push(ro.name, ro.line, ...ro.routes.flatMap((r) => [r.name, r.meaning]));
  texts.push(ds.clearLine ?? "");
  /* 工作台弹窗的四段文本与不可用理由。
     2026-08-31 补:原先这里只扫投影层的输出,漏掉了 case.mjs 的 availability().why,
     于是开局第一屏那句 `还缺前置:currentBody、baseManufacture` 一路漏到玩家眼前,
     是真人试玩当场抓出来的。**按界面来源抄,不按模块抄。** */
  for (const st of [newSession(), (() => {
    const x = newSession();
    for (const id of ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE"]) take(x, id);
    return x;
  })()]) {
    for (const row of workbench(st)) {
      texts.push(row.action.name, row.action.ask, row.why ?? "");
    }
  }
  /* 把清空文案也扫一遍:另起一个到 G2 的干净局面 */
  {
    const s2 = newSession();
    for (const id of ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY",
      "A.OBSERVE.REGION_DECOR", "A.IMAGE.XRAY", "A.MAP.REGION_CONTINUITY"]) take(s2, id);
    const d2 = decisionSurface(solve(s2), workbench(s2));
    texts.push(d2.clearLine ?? "");
  }
  const blob = texts.filter(Boolean).join("\n");

  const answerTokens = ["LATE18", "REPRODUCTION", "THREE_PHASE", "NO_MAJOR_REASSEMBLY",
    "MAJOR_REASSEMBLY_NOT_THREE_PHASE", "expectedProfile", "posterior", "marginals"];
  const hitAnswers = answerTokens.filter((t) => blob.includes(t));
  check("不含作者答案键", hitAnswers.length === 0, "命中:" + hitAnswers.join(","));

  const idPatterns = [/obs\./, /latent\./, /\bdep\./, /PROOF\./, /source\./, /OBJECT\.FIRST/,
    /ARCHIVE\.CANDIDATE/, /RELATION\./, /STAGE_RESULT/, /A\.[A-Z_]+\./];
  const hitIds = idPatterns.filter((p) => p.test(blob)).map(String);
  check("不含内部标识符", hitIds.length === 0, "命中:" + hitIds.join(" "));

  const techTokens = ["supports", "minimumSourceCount", "dependencyUnitId", "sharedLatentIds",
    "acquisitionRequires", "requiresContextFacts", "g3Profile", "threshold"];
  const hitTech = techTokens.filter((t) => blob.includes(t));
  check("不含内部技术量", hitTech.length === 0, "命中:" + hitTech.join(","));
  check("不再把系统归类写成自动推出的局部结论",
    !blob.includes("系统自动连出来") && !blob.includes("局部Finding"));

  const camel = blob.match(/\b[a-z]+[A-Z][a-zA-Z]+\b/g) ?? [];
  check("不含 camelCase 事实名", camel.length === 0, "命中:" + [...new Set(camel)].join(","));
  line(`  (扫过 ${texts.filter(Boolean).length} 段玩家可见文本,共 ${blob.length} 字)`);
}

/* ---------------- K. 手段一律标价且不排序 ---------------- */
line("\n### K. 手段标价与不排序(DEC-032 第七节判定标准)");
{
  const s = newSession();
  for (const id of ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.RESEARCH.ACCIDENT",
                    "A.RELATE.ARCHIVE.T2_TO_OBJECT", "A.IMAGE.XRAY"]) take(s, id);
  const solved = solve(s);
  const ds = decisionSurface(solved, workbench(s));
  const allMeans = ds.items.flatMap((i) => i.means);
  check("每个手段都带价", allMeans.every((m) => typeof m.costLabel === "string" && m.costLabel));
  check("每个手段都说得出它问什么", allMeans.every((m) => m.ask && m.ask.length > 3));
  const multi = ds.items.filter((i) => i.means.length > 1);
  line(`  决策面 ${ds.items.length} 条,其中 ${multi.length} 条给出多于一种手段`);
  check("决策面同时摆着多个缺口(不是只剩一条路)", ds.items.length >= 2,
    `实际 ${ds.items.length}`);
  /* 不排序:投影层不得输出任何优先级/权重字段 */
  const forbidden = ["rank", "priority", "score", "weight", "recommended", "best"];
  const json = JSON.stringify(ds.items);
  const hit = forbidden.filter((k) => json.includes(`"${k}"`));
  check("输出里没有排序/权重字段", hit.length === 0, "命中:" + hit.join(","));
}

/* ---------------- K2. 不可用理由必须点名动作,永不吐事实 id ---------------- */
line("\n### K2. 不可用理由(2026-08-31 真人试玩抓出的泄题)");
{
  /* 把整局每一步的每一条不可用理由都收集起来,不只看开局 */
  const s = newSession(22);
  const whys = [];
  const collect = () => {
    for (const row of workbench(s)) if (!row.usable) whys.push({ row, why: row.why });
  };
  collect();
  for (const a of ACTIONS) { take(s, a.id); collect(); }

  check(`扫过 ${whys.length} 条不可用理由`, whys.length > 0);
  const idLike = whys.filter((w) => /[a-z]+[A-Z]|^[a-z]+\./.test(w.why ?? ""));
  check("没有一条理由吐出内部事实 id",
    idLike.length === 0, idLike.slice(0, 3).map((w) => w.why).join(" | "));
  /* 原先这里给「跨时点对照」那条 needsWhy 开了一个按原文豁免的后门。
     2026-08-31 把那句改成真的点名两个手段后,后门已无必要 —— 删掉,保证反而更强:
     每一条理由都必须用「」点到具体手段,或者明说没有手段可用。 */
  const vague = whys.filter((w) => !/「.+」/.test(w.why) && !w.why.includes("没有手段"));
  check("每条理由要么点名动作、要么明说没有手段", vague.length === 0,
    vague.slice(0, 3).map((w) => w.why).join(" | "));
  /* needsActionIds 必须指向真实存在的动作,界面才能做成可点的链接 */
  const badRef = whys.flatMap((w) => (w.row.needsActionIds ?? []))
    .filter((id) => !ACTION_BY_ID.has(id));
  check("点名的动作都真实存在", badRef.length === 0, badRef.join(","));
  const sample = [...new Set(whys.map((w) => w.why))].slice(0, 4);
  for (const t of sample) line(`  例:${t}`);
}

/* ---------------- L. 行动点数:范围、开局前可改、局中锁死 ---------------- */
line("\n### L. 行动点数(param slice.investigationBudget)");
{
  check(`下界 ${BUDGET_MIN}、上界 ${BUDGET_MAX}、默认取上界`,
    BUDGET_MIN === 12 && BUDGET_MAX === 22 && BUDGET_DEFAULT === BUDGET_MAX,
    `实际 ${BUDGET_MIN}/${BUDGET_MAX}/${BUDGET_DEFAULT}`);

  /* 上界必须等于"互异动作各做一次"的步数 —— 由 ceiling.mjs 跑出 22 全可达。
     动作表若增删而这里忘了改,本项立刻失败。 */
  check("上界等于动作表长度(超过它每一步只能是重复)", BUDGET_MAX === ACTIONS.length,
    `上界 ${BUDGET_MAX} vs 动作表 ${ACTIONS.length}`);

  check("越界一律夹到范围内", clampBudget(0) === BUDGET_MIN && clampBudget(999) === BUDGET_MAX
    && clampBudget(11) === BUDGET_MIN && clampBudget(23) === BUDGET_MAX);
  check("非数字回落到默认", clampBudget("x") === BUDGET_DEFAULT && clampBudget(undefined) === BUDGET_DEFAULT);
  check("小数取整", clampBudget(15.4) === 15 && clampBudget(15.6) === 16);

  /* 开局前可改 */
  const s = newSession();
  check("默认开局点数即上界", s.budget === BUDGET_MAX, `实际 ${s.budget}`);
  check("一步未走时可改", setBudget(s, 14).ok && s.budget === 14, `实际 ${s.budget}`);

  /* 走一步之后锁死 */
  take(s, "A.OBSERVE.WHOLE");
  const locked = setBudget(s, 20);
  check("动过手之后改不动", locked.ok === false && s.budget === 14, locked.why ?? "");

  /* 点数确实卡得住:设成下界,走满就不许再走 */
  const t = newSession(BUDGET_MIN);
  const order = ACTIONS.map((a) => a.id);
  let taken = 0;
  for (const id of order) { if (take(t, id).ok) taken++; }
  check(`设成 ${BUDGET_MIN} 时最多走 ${BUDGET_MIN} 步`, t.log.length === BUDGET_MIN,
    `实际 ${t.log.length}(尝试 ${order.length} 个动作)`);
  const after = take(t, "A.OBSERVE.WHOLE");
  check("用完之后动作被挡住且给人话理由",
    after.ok === false && /点数|机会/.test(after.why), after.why ?? "");
  check("用完之后工作台全部标为不可负担",
    workbench(t).every((r) => r.affordable === false));

  /* 慷慨设定不会把读数或投影搞坏 */
  const u = newSession(BUDGET_MAX);
  for (const a of ACTIONS) take(u, a.id);
  const uSolved = solve(u);
  const uRo = readout(uSolved, u);
  check("满点数一局能把 22 个动作全走完", u.log.length === ACTIONS.length,
    `实际 ${u.log.length}`);
  check("读数如实回报本局点数", uRo.budget === BUDGET_MAX && uRo.used === u.log.length,
    `${uRo.used}/${uRo.budget}`);
  const uDs = decisionSurface(uSolved, workbench(u));
  check("走满之后决策面仍然说得出话(空也要有理由)",
    uDs.items.length > 0 || (uDs.clear && !!uDs.clearLine),
    `${uDs.items.length} 条 / clear=${uDs.clear}`);
  line(`  满点数一局:阶段 ${uRo.stage} · 档案路线${uRo.routes[0].open ? "通" : "未通"}` +
    ` · 物证路线${uRo.routes[1].open ? "通" : "未通"} · 账单按档 ${uRo.billed.join("/")}`);

  /* M. 两种货币:步数约束、钱只记账。账单按档计数,不许悄悄求和 */
  line("\nM. 两种货币(2026-08-31 用户决定:步数唯一约束,钱只累加告知)");
  const m = newSession(BUDGET_MAX);
  check("新局账单四档全为 0", readout(solve(m), m).billed.join(",") === "0,0,0,0",
    readout(solve(m), m).billed.join(","));
  let mSteps = 0;
  for (const a of ACTIONS) if (take(m, a.id).ok) mSteps += 1;
  const mBilled = readout(solve(m), m).billed;
  check("账单四档之和恒等于走过的步数(每步恰好记一笔)",
    mBilled.reduce((x, y) => x + y, 0) === mSteps,
    `${mBilled.join("+")} vs ${mSteps} 步`);
  check("会话不再暴露 spent 这个把档位序数相加的字段", m.spent === undefined,
    String(m.spent));
  check("免费档确实被记了账(不花钱不等于没发生)", mBilled[0] > 0, `免费×${mBilled[0]}`);
}

line(`\n${fails === 0 ? "全部通过" : `${fails} 项失败`}`);
process.exit(fails === 0 ? 0 : 1);
