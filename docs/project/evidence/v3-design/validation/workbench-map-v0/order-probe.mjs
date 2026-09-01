/* 开局第一步到底能点哪些手段?以及有没有「名字暗示了前置、规则却不拦」的对。
   跑法:cmd /c "node order-probe.mjs > order-probe-out.txt 2>&1"

   起因:2026-08-31 用户第二轮反馈第 2 条 ——「把开过的小窗连成片」在开局就可点,
   而它的名字明摆着说要先「在表面开几个小窗看层次」。名字承诺的顺序,规则不认。 */
import { ACTIONS, ACTION_BY_ID } from "../knowledge-map-slice-v0/case.mjs";
import { newSession, take, workbench } from "./session.mjs";
import { events } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { ACTION_SEMANTICS } from "../evidence-semantics-v0/semantics.mjs";

const line = (s = "") => console.log(s);

line("=".repeat(72));
line("一、开局(一步未走)时,每个手段可不可点");
line("=".repeat(72));
const s0 = newSession(22);
const rows = workbench(s0);
for (const r of rows) {
  line(`${r.usable ? "可点" : "不可点"}  ${r.action.name}`);
  if (!r.usable) line(`        理由:${r.why}`);
}
line(`\n开局可点 ${rows.filter((r) => r.usable).length} / ${rows.length} 个手段。`);

line("");
line("=".repeat(72));
line("二、每个手段的机制前置(acquisitionRequires)与来源(sourceIds)");
line("=".repeat(72));
line("看点:sourceIds 里引用了别的手段产出的来源,却没写进 acquisitionRequires,");
line("就是「语义上依赖、机制上不拦」—— 名字一旦把这层依赖说出来,玩家就会觉得界面自相矛盾。");
line("");

/* 哪个来源由哪个手段产出 */
const sourceOwner = new Map();
for (const [key, ev] of Object.entries(events)) {
  for (const sid of ev.sourceIds ?? []) {
    if (!sourceOwner.has(sid)) sourceOwner.set(sid, []);
    sourceOwner.get(sid).push({ key, action: ev.acquisitionActionId });
  }
}

const suspects = [];
for (const [key, ev] of Object.entries(events)) {
  const aid = ev.acquisitionActionId;
  const a = ACTION_BY_ID.get(aid);
  if (!a) continue;
  const req = ev.acquisitionRequires ?? [];
  const shared = [];
  for (const sid of ev.sourceIds ?? []) {
    for (const o of sourceOwner.get(sid) ?? []) {
      if (o.key !== key && o.action && o.action !== aid) {
        shared.push(`${sid} ← 也来自「${ACTION_BY_ID.get(o.action)?.name ?? o.action}」`);
      }
    }
  }
  if (!shared.length && !req.length) continue;
  line(`「${a.name}」(${aid})`);
  line(`   机制前置 acquisitionRequires: ${req.length ? req.join(", ") : "(无)"}`);
  for (const t of shared) line(`   共用来源: ${t}`);
  if (shared.length && !req.length) {
    line(`   >>> 可疑:共用别的手段的来源,却没有任何机制前置`);
    suspects.push(a.name);
  }
  line("");
}

line(`共 ${suspects.length} 个可疑手段:${suspects.map((n) => "「" + n + "」").join("、") || "(无)"}`);

line("");
line("=".repeat(72));
line("三、实测:能不能把「连成片」当第一步做,不先开小窗");
line("=".repeat(72));
const s1 = newSession(22);
const r1 = take(s1, "A.SYNTHESIZE.SURFACE_REGIONS");
line(`第一步直接做「把开过的小窗连成片」:${r1.ok ? "成功" : "被拒 —— " + r1.why}`);
if (r1.ok) {
  line(`  得到的情报:${r1.observationId ?? "(未回报)"}`);
  const r2 = take(s1, "A.INSPECT.WINDOWS");
  line(`  再补做「在表面开几个小窗看层次」:${r2.ok ? "成功" : "被拒 —— " + r2.why}`);
  line("  >>> 结论:规则允许倒着来。名字暗示的顺序不存在,是名字在撒谎。");
}

line("");
line("=".repeat(72));
line("四、开局第一屏出现过、但玩家还没被解释过的专有名词");
line("=".repeat(72));
line("规则(用户 2026-08-31 定):任何专有名词必须在玩家游玩过程中至少出现并被明确解释一次,");
line("才允许在别处使用。开局第一屏是最严的地方 —— 那时玩家什么都还没做。");
line("");
const JARGON = [
  "重大重组", "重组", "干预", "潜变量", "外推", "层序", "承力", "信噪比",
  "原片", "锚点", "语料", "公理", "阴性", "计权", "本器", "现器", "整器",
  "两个时候", "跨时点", "时点", "三期", "三个时期", "自洽", "印证", "归属",
  "覆盖", "区位", "点位", "逐区", "综合", "底子", "胎釉", "修足", "补绘",
];

/* 界面路径,不是代码模块 —— 上一轮泄题和这一轮漏扫都是「按模块抄」造成的。
   openly = 玩家不点任何东西就看得见;onClick = 要点「为什么要紧」才展开。 */
const surfaces = [];
for (const r of rows) {
  const sem = ACTION_SEMANTICS[r.action.id] ?? {};
  surfaces.push({ where: `手段名「${r.action.name}」`, text: r.action.name, openly: true });
  surfaces.push({ where: `它问什么(${r.action.name})`, text: r.action.ask, openly: true });
  surfaces.push({ where: `whyShort(${r.action.name})`, text: sem.whyShort, openly: true });
  if (!r.usable) surfaces.push({ where: `不可用理由(${r.action.name})`, text: r.why, openly: true });
  surfaces.push({ where: `whyLong(${r.action.name})`, text: sem.whyLong, openly: false });
}

const seen = new Map();
for (const s of surfaces) {
  if (!s.text) continue;
  for (const j of JARGON) {
    if (!s.text.includes(j)) continue;
    if (!seen.has(j)) seen.set(j, []);
    seen.get(j).push(s);
  }
}
for (const [j, hits] of [...seen].sort((a, b) => b[1].length - a[1].length)) {
  const open = hits.filter((h) => h.openly);
  line(`「${j}」命中 ${hits.length} 处,其中 ${open.length} 处玩家不点就看得见`);
  for (const h of (open.length ? open : hits).slice(0, 3)) {
    line(`    · ${h.openly ? "直接可见" : "要点开"} ${h.where}`);
  }
}
line(`\n开局第一屏共命中 ${seen.size} 个未经解释的专有名词,`);
line(`其中 ${[...seen].filter(([, h]) => h.some((x) => x.openly)).length} 个是玩家不点任何东西就会读到的。`);

line("");
line("=".repeat(72));
line("五、开局第一屏的文本量(第 3 条:认知过载)");
line("=".repeat(72));
const openText = surfaces.filter((s) => s.openly && s.text);
const total = openText.reduce((n, s) => n + s.text.length, 0);
line(`不点任何东西就摆在屏幕上的字符串:${openText.length} 条,合计 ${total} 字`);
const worst = [...openText].sort((a, b) => b.text.length - a.text.length).slice(0, 8);
line(`最长的 8 条:`);
for (const s of worst) line(`   ${String(s.text.length).padStart(4)} 字  ${s.where}`);
const hidden = surfaces.filter((s) => !s.openly && s.text);
line(`\n要点「为什么要紧」才展开的:${hidden.length} 条,合计 ${hidden.reduce((n, s) => n + s.text.length, 0)} 字`);
line(`   其中最长 ${Math.max(...hidden.map((s) => s.text.length))} 字`);
