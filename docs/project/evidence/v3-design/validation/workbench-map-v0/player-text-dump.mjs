/* 把玩家在界面上**实际看得见的每一个字**导出来。跑法:node player-text-dump.mjs

   两个用途:
   1. 零背景盲测的材料 —— 交给一个完全没有项目上下文的人/agent 读,看哪里读不懂;
   2. 泄题排查 —— harness.mjs 的 J 段只扫了投影层的输出,**漏了工作台弹窗那句
      「还缺前置:…」**,那句来自 case.mjs 且直接拼内部事实 id。本文件按界面来源
      逐个抄,不按模块抄,就是为了不再漏。
   
   同时打印阶段／主张／公理／局部 Finding 的对照,用来回答"它们和 G123 什么关系"。 */
import { readFileSync } from "node:fs";
import { ACTIONS, COST_LABEL } from "../knowledge-map-slice-v0/case.mjs";
import { newSession, take, solve, workbench } from "./session.mjs";
import { mentalMap, decisionSurface, readout, EDGE_KINDS } from "./projection.mjs";
import { ACTION_SEMANTICS } from "../evidence-semantics-v0/semantics.mjs";

const s = newSession(22);
for (const a of ACTIONS) take(s, a.id);
const solved = solve(s);
const map = mentalMap(solved);
const ds = decisionSurface(solved, workbench(s));
const ro = readout(solved, s);
const wb = workbench(s);

const H = (t) => console.log(`\n${"=".repeat(72)}\n${t}\n${"=".repeat(72)}`);

/* 界面上决策面那一档的中文标签。**必须与 template.html 的 KIND_LABEL 逐字一致** ——
   2026-08-31 首次盲测时本文件直接打了内部键(`[negative]`),让盲测者以为界面在漏代码,
   而界面其实显示的是中文。测量工具自己加噪声就等于在撒谎,所以这里照抄一份。 */
const KIND_LABEL = {
  suspended: "拿到了,但还读不出结论", negative: "没查到,但还不能当证据",
  onemore: "只差一块就合拢", gap: "已经动起来,还缺几块",
  conflict: "对不上,互相打架", island: "还没和别的东西接上",
};

/* 抄一份就会漂移,所以让本文件自己核对:界面改了标签而这里没跟上时,大声失败,
   而不是安静地导出一份跟界面不一样的文本去骗下一次盲测。 */
{
  const tpl = readFileSync(new URL("./template.html", import.meta.url), "utf8");
  const bad = Object.values(KIND_LABEL).filter((v) => !tpl.includes(`"${v}"`));
  if (bad.length) {
    console.error(
      `player-text-dump 与 template.html 已漂移:${bad.join("、")} 在界面里找不到。\n` +
      `本文件的 KIND_LABEL 必须与 template.html 逐字一致,否则盲测材料是假的。`);
    process.exit(1);
  }
}

H("一、顶栏读数(玩家一直看得见)");
console.log(`阶段名     : ${ro.name}`);
console.log(`阶段说明   : ${ro.line}`);
console.log(`点数       : 还剩 ${ro.budget - ro.used} 步 / 共 ${ro.budget} 步　·　已花 ` +
  (ro.billed.map((n, i) => (n ? `${COST_LABEL[i]}×${n}` : null)).filter(Boolean).join(" ")
    || "还没花钱"));
for (const r of ro.routes) console.log(`路线       : ${r.name} —— ${r.meaning} [${r.open ? "已通" : "未通"}]`);

/* 开局那一屏 —— 玩家第一眼看到的东西,也是"不可用理由"唯一出现的时候 */
const s0 = newSession(22);
const solved0 = solve(s0);
const map0 = mentalMap(solved0);
const ds0 = decisionSurface(solved0, workbench(s0));
const ro0 = readout(solved0, s0);

H("零、开局第一屏(玩家什么都还没做的时候,整个界面上有的字)");
console.log(`阶段名     : ${ro0.name}`);
console.log(`阶段说明   : ${ro0.line}`);
for (const r of ro0.routes) console.log(`路线       : ${r.name} —— ${r.meaning} [${r.open ? "已通" : "未通"}]`);
console.log(`地图上的节点: ${map0.nodes.length + map0.findings.length + map0.axioms.length} 个`);
console.log(`决策面      : ${ds0.clear ? ds0.clearLine : ds0.items.length + " 条"}`);
for (const it of ds0.items) console.log(`   · [${KIND_LABEL[it.kind] ?? it.kind}] ${it.title} —— ${it.body}`);
console.log(`\n开局时不可用的手段,以及界面给出的原话理由:`);
for (const row of workbench(s0)) {
  if (!row.usable) console.log(`   · ${row.action.name} → 「${row.why}」`);
}

H("二、左侧工作台:每个手段的四段文本 + 不可用理由");
for (const row of wb) {
  const a = row.action;
  const sem = ACTION_SEMANTICS[a.id] ?? {};
  console.log(`\n· ${a.name}`);
  console.log(`  副标(它问什么): ${a.ask}`);
  console.log(`  为什么要紧(短): ${sem.whyShort ?? "(无)"}`);
  console.log(`  为什么要紧(长): ${sem.whyLong ?? "(无)"}`);
  console.log(`  费用          : ${COST_LABEL[a.cost]}`);
  if (!row.usable) console.log(`  ★不可用理由   : ${row.why}`);
}

H("三、中间心智地图:节点标签");
for (const n of map.nodes) console.log(`· [情报] ${n.short} —— ${n.gist}`);
for (const f of map.findings) console.log(`· [局部Finding] ${f.short} —— ${f.gist}  (聚了 ${f.members.length} 条情报)`);
for (const a of map.axioms) console.log(`· [公理] ${a.line}`);

H("四、中间心智地图:边的图注(玩家看到的原话)");
/* 界面图注只出中文,不出 latent/prereq 这类内部键 */
for (const v of Object.values(EDGE_KINDS)) console.log(`· ${v}`);
console.log(`· 这条情报支持箭头指的那条已查实的结论`);
console.log(`· ● 你查到的一条情报`);
console.log(`· ⬣ 这几条说的是同一件事(系统自动连的,不花钱)`);
console.log(`· ▬ 已经查实的结论`);

H("五、右侧决策面:每张卡");
if (ds.clear) console.log(ds.clearLine);
for (const it of ds.items) {
  console.log(`\n· [${KIND_LABEL[it.kind] ?? it.kind}] ${it.title}`);
  console.log(`  正文: ${it.body}`);
  for (const m of it.means) {
    console.log(`  手段: ${m.name}(${m.costLabel})${m.usable === false ? " ·暂不可用" : ""}`);
    console.log(`        它问什么: ${m.ask}`);
    console.log(`        为什么要紧: ${m.whyShort ?? "(无)"}`);
  }
}

H("六、阶段／主张／公理／局部 Finding 的对照(回答「它们和 G123 什么关系」)");
console.log(`求解器给出的阶段 : ${solved.stage}`);
console.log(`\n全部主张的状态(阶段就是从这些主张算出来的):`);
for (const [id, c] of Object.entries(solved.claims ?? {})) {
  console.log(`  ${id.padEnd(26)} established=${!!c?.established}` +
    ` contested=${!!c?.contested} refuted=${!!c?.logicallyRefuted}`);
}
console.log(`\n地图上的公理 ${map.axioms.length} 个(= 已成立且无争议的主张,与阶段同源):`);
for (const a of map.axioms) console.log(`  ${a.claimId} → 「${a.short}」`);
console.log(`\n地图上的局部 Finding ${map.findings.length} 个(= 同一潜变量聚起 ≥2 条情报):`);
for (const f of map.findings) console.log(`  ${f.latentId} → 「${f.short}」`);
console.log(`\n关键事实:局部 Finding 不进入任何主张、不进入阶段计算。`);
console.log(`它在代码里的唯一去处是产生 latent 边(projection.mjs 第 176-178 行),`);
console.log(`即"把 ≥2 条说同一件底层事的情报连起来并给这一组起个名"。`);
console.log(`所以它当前对推进 G1/G2/G3 的机械价值是:零。`);
