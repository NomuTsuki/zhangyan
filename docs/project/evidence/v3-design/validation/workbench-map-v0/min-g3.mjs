/* 求"最少多少个行动点数能让 G3 成立"。跑法:node min-g3.mjs

   为什么要跑:旧 PARAMS 条目说"完整 G3 路线需 17 步",那是冻结场景里那条路线的长度,
   不是最短路线的长度。玩家问的是下界,两者不是一回事。

   方法:先拿一条能到 G3 的序列(全 22 个动作),再做删减最小化 ——
   逐个试着拿掉一个动作,若剩下的序列仍能到 G3 就永久拿掉,直到任何单个删除都会
   破坏 G3。这样得到的是一个"局部极小集";换不同随机顺序多跑几轮,取最小的一个。

   结论的性质:这是真实最小值的**上界**(找到了这么短的,不保证没有更短的)。
   删减法找不到那种"必须同时换掉两个动作才能更短"的情形。不夸大成精确最小值。 */
import { ACTIONS } from "../knowledge-map-slice-v0/case.mjs";
import { newSession, take, solve } from "./session.mjs";

const HUGE = 999;

/* 按给定顺序重放一个动作子集,返回终局阶段与实际落地的步数。
   不可用的动作会被 take 拒绝,不计入步数 —— 这正是我们要的语义。 */
function replay(list) {
  const s = newSession(HUGE);
  for (const id of list) take(s, id);
  return { stage: solve(s).stage, steps: s.log.length, log: s.log.map((l) => l.actionId) };
}

function reachesG3(list) {
  return replay(list).stage === "G3";
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* 删减最小化:能拿掉就拿掉,直到一个都拿不掉 */
function minimize(order) {
  let keep = [...order];
  if (!reachesG3(keep)) return null;
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < keep.length; i++) {
      const trial = keep.filter((_, k) => k !== i);
      if (reachesG3(trial)) { keep = trial; changed = true; break; }
    }
  }
  return keep;
}

const all = ACTIONS.map((a) => a.id);
const baseline = replay(all);
console.log(`全 22 个动作:阶段 ${baseline.stage},实际落地 ${baseline.steps} 步`);
if (baseline.stage !== "G3") {
  console.log("基线就到不了 G3,后面不用跑了");
  process.exit(1);
}

let best = null;
const TRIALS = 12;
for (let seed = 1; seed <= TRIALS; seed++) {
  const order = seed === 1 ? all : shuffled(all, mulberry32(seed));
  const min = minimize(order);
  if (!min) { console.log(`  第 ${seed} 轮:该顺序到不了 G3,跳过`); continue; }
  const r = replay(min);
  console.log(`  第 ${seed} 轮:极小集 ${min.length} 个动作,落地 ${r.steps} 步,阶段 ${r.stage}`);
  if (!best || r.steps < best.steps) best = { steps: r.steps, log: r.log };
}

console.log(`\n找到的最短 G3 路线:${best.steps} 步`);
best.log.forEach((id, i) => {
  const a = ACTIONS.find((x) => x.id === id);
  console.log(`  ${String(i + 1).padStart(2)}. ${a.name}`);
});
console.log(`\n这是真实最小值的上界(删减法找不到"必须同时换两个动作才更短"的情形)。`);
console.log(`含义:行动点数低于 ${best.steps} 时 G3 在一局内不可能成立;` +
  `等于或高于它,G3 才有可能 —— 但仍要玩家真的走对。`);
