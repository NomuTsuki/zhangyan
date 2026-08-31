/* 求"一局理论最多行动次数"的上界。
   跑法:node ceiling.mjs

   为什么需要跑而不是数一遍动作表:动作之间有 acquisitionRequires 与 needs 门,
   有些动作可能永远解不开;而顺序会影响哪些门能开。所以用随机化贪心多次搜索,
   取能达到的最大"互不相同的动作数"。

   重复动作在本案是允许的(DEC-030 要求重复看得见),所以严格意义上的行动次数
   没有上界。这里把上界定义为"互不相同的动作都各做一次" —— 超过它之后每一步
   都只能是重复,再给点数不会解锁任何新东西。 */
import { ACTIONS, availability } from "../knowledge-map-slice-v0/case.mjs";
import { newSession, take, factsOf } from "./session.mjs";

const HUGE = 999;

function greedyRun(rng) {
  const s = newSession(HUGE);
  const done = new Set();
  for (let step = 0; step < ACTIONS.length * 2; step++) {
    const facts = factsOf(s);
    const pool = ACTIONS.filter((a) => !done.has(a.id))
      .map((a) => ({ a, ok: canTake(facts, done, a) }))
      .filter((x) => x.ok);
    if (!pool.length) break;
    const pick = pool[Math.floor(rng() * pool.length)].a;
    const r = take(s, pick.id);
    if (!r.ok) { done.add(pick.id); continue; } /* 顺序非法等,记为不可用 */
    done.add(pick.id);
  }
  return { done, log: s.log.map((l) => l.actionId) };
}

/* 复用 case.mjs 的门判定,不另写一套 */
function canTake(facts, done, a) {
  const av = availability(facts, [...done]).find((x) => x.action.id === a.id);
  return av.usable;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let best = { done: new Set(), log: [] };
for (let seed = 1; seed <= 400; seed++) {
  const r = greedyRun(mulberry32(seed));
  if (r.done.size > best.done.size) best = r;
}

const all = ACTIONS.map((a) => a.id);
const unreachable = all.filter((id) => !best.done.has(id));

console.log(`动作表总数            : ${all.length}`);
console.log(`一局内可达的互异动作数: ${best.done.size}`);
console.log(`永远够不到的动作      : ${unreachable.length ? unreachable.join("、") : "无"}`);
console.log(`\n达成该上界的一条顺序(${best.log.length} 步):`);
best.log.forEach((id, i) => console.log(`  ${String(i + 1).padStart(2)}. ${id}`));
