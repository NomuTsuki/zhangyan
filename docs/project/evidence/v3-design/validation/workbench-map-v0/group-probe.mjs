/* 查地图分组的可行性:一条情报同时属于几个局部 Finding?
   重叠严重就画不成互斥分区,得改设计。跑法:node group-probe.mjs */
import { ACTIONS } from "../knowledge-map-slice-v0/case.mjs";
import { newSession, take, solve } from "./session.mjs";
import { mentalMap, OBS_LABEL } from "./projection.mjs";

const s = newSession(22);
for (const a of ACTIONS) take(s, a.id);
const map = mentalMap(solve(s));

const of = new Map();
for (const f of map.findings) for (const m of f.members) {
  if (!of.has(m)) of.set(m, []);
  of.get(m).push(f.short);
}

console.log(`情报 ${map.nodes.length} 条,局部 Finding ${map.findings.length} 个\n`);

const buckets = { 0: [], 1: [], 2: [], 3: [] };
for (const n of map.nodes) {
  const gs = of.get(n.id) ?? [];
  (buckets[Math.min(3, gs.length)] ??= []).push({ n, gs });
}
for (const k of Object.keys(buckets)) {
  const list = buckets[k];
  if (!list.length) continue;
  console.log(`属于 ${k}${k === "3" ? "+" : ""} 个 Finding 的情报:${list.length} 条`);
  for (const { n, gs } of list) {
    console.log(`  · ${(OBS_LABEL[n.id]?.short ?? n.id).padEnd(18)} ${gs.join(" ／ ") || "(孤立)"}`);
  }
  console.log("");
}

console.log("每个 Finding 的成员数:");
for (const f of map.findings) console.log(`  · ${f.short.padEnd(22)} ${f.members.length} 条`);

const byKind = {};
for (const e of map.edges) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
console.log(`\n边:${Object.entries(byKind).map(([k, v]) => k + "=" + v).join(" ")} 合计 ${map.edges.length}`);
console.log(`若把 Finding 降为分区(删掉 latent 边与 Finding 节点)、公理搬出主图(删掉 supports 边):`);
console.log(`  主图剩下节点 ${map.nodes.length} 个、边 ${(byKind.prereq ?? 0) + (byKind.caught ?? 0)} 条`);
