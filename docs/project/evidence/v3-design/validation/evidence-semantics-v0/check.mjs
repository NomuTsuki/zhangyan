/* 情报语义文本的机械检查 —— 只读,不改任何冻结字节。
 *
 * 检查三类事:
 *   A. 覆盖率:每个可达动作、每条被用到的底层线索、每个证明角色、
 *      每条登记未知、两条路线、四个阶段,都必须有玩家可读文本;
 *   B. 泄题:玩家可读文本里不得出现作者答案键、夹具技术量或内部标识符;
 *   C. 写作护栏:whyShort 有字数上限,防止决策面那一行随时间膨胀。
 *      这不是产品数值(不改变任何游戏行为),所以不进 PARAMS.md,只作 lint。
 *
 * 检查不到的东西显式列在 README 的人工复核一节,不假装被覆盖。
 *
 * 跑法:node check.mjs
 */

import { events, PROOF_ROLES, unknownRegistry, expectedProfile, thresholds }
  from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { ACTIONS } from "../knowledge-map-slice-v0/case.mjs";
import {
  ACTION_SEMANTICS, LATENT_SEMANTICS, PROOF_ROLE_SEMANTICS,
  ROUTE_SEMANTICS, STAGE_SEMANTICS, UNKNOWN_SEMANTICS,
} from "./semantics.mjs";

const DECISION_LINE_BUDGET = 60; // 全角字数上限;写作护栏,非产品数值,见 README

let pass = 0;
const fails = [];
function ok(name) { pass += 1; console.log("  ok    " + name); }
function bad(name, detail) { fails.push(name + " :: " + detail); console.log("  FAIL  " + name + " :: " + detail); }
function check(name, cond, detail) { cond ? ok(name) : bad(name, detail); }

/* 可达事件 = 每个动作的 outcome 在「无事实」与「全事实」两种输入下的结果,
   这样带分支的动作(逐区跨时点对照)两条分支都会被算进来。 */
const allFacts = new Set();
for (const e of Object.values(events)) {
  for (const f of [...(e.facts ?? []), ...(e.contextualFacts ?? [])]) allFacts.add(f);
}
const reachableEvents = new Set();
for (const a of ACTIONS) {
  reachableEvents.add(a.outcome(new Set()));
  reachableEvents.add(a.outcome(allFacts));
}
const reachableLatents = new Set();
for (const key of reachableEvents) {
  for (const l of (events[key].sharedLatentIds ?? [])) reachableLatents.add(l);
}

console.log("== A. 覆盖率 ==");

const missingActions = ACTIONS.filter((a) => !ACTION_SEMANTICS[a.id]).map((a) => a.id);
check(`22 个动作全部有语义文本 (${ACTIONS.length} 个动作)`,
  missingActions.length === 0, "缺:" + missingActions.join("、"));

const missingLatents = [...reachableLatents].filter((l) => !LATENT_SEMANTICS[l]);
check(`每条可达底层线索都有语义 (${reachableLatents.size} 条)`,
  missingLatents.length === 0, "缺:" + missingLatents.join("、"));

const roleIds = Object.values(PROOF_ROLES);
const missingRoles = roleIds.filter((r) => !PROOF_ROLE_SEMANTICS[r]);
check(`每个证明角色都有语义 (${roleIds.length} 个)`,
  missingRoles.length === 0, "缺:" + missingRoles.join("、"));

const unknownKeys = Object.keys(unknownRegistry);
const missingUnknowns = unknownKeys.filter((u) => !UNKNOWN_SEMANTICS[u]);
check(`每条登记未知都有人话说法 (${unknownKeys.length} 条)`,
  missingUnknowns.length === 0, "缺:" + missingUnknowns.join("、"));

check("G2 两条路线都有语义",
  Boolean(ROUTE_SEMANTICS.documented && ROUTE_SEMANTICS.physical), "缺路线语义");

const stageIds = ["NONE", "G1", "G2", "G3"];
const missingStages = stageIds.filter((s) => !STAGE_SEMANTICS[s]);
check("四个阶段都有语义", missingStages.length === 0, "缺:" + missingStages.join("、"));

/* 反向检查:不应该有多余条目在描述已经不可达的东西 */
const extraLatents = Object.keys(LATENT_SEMANTICS).filter((l) => !reachableLatents.has(l));
check("没有多余的线索语义(描述不可达的东西)",
  extraLatents.length === 0, "多余:" + extraLatents.join("、"));

/* 收集全部玩家可读字符串(只取值,不取键) */
const playerText = [];
const collect = (obj, path) => {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") playerText.push({ where: path + "." + k, text: v });
    else if (v && typeof v === "object") collect(v, path + "." + k);
  }
};
collect(ACTION_SEMANTICS, "ACTION");
collect(LATENT_SEMANTICS, "LATENT");
collect(PROOF_ROLE_SEMANTICS, "PROOF");
collect(ROUTE_SEMANTICS, "ROUTE");
collect(STAGE_SEMANTICS, "STAGE");
collect(UNKNOWN_SEMANTICS, "UNKNOWN");

check(`收集到玩家可读文本 ${playerText.length} 条,且没有空串`,
  playerText.length > 0 && playerText.every((p) => p.text.trim().length > 0),
  "有空串:" + playerText.filter((p) => !p.text.trim()).map((p) => p.where).join("、"));

console.log("");
console.log("== B. 泄题与黑话 ==");

/* B1. 作者答案键的六个轴值一个都不许出现 */
const answerTokens = Object.values(expectedProfile);
const leakedAnswers = [];
for (const p of playerText) {
  for (const t of answerTokens) if (p.text.includes(t)) leakedAnswers.push(p.where + " 含 " + t);
}
check(`不含作者答案键的任何轴值 (${answerTokens.length} 个轴)`,
  leakedAnswers.length === 0, leakedAnswers.join("; "));

/* B2. 那个把候选答案写进键名的未知,其人话说法不许回音 */
const echoed = playerText.filter((p) => /late\s*-?18/i.test(p.text));
check("不回音 late18 这类把答案写进键名的内部记法",
  echoed.length === 0, echoed.map((p) => p.where).join("、"));

/* B3. 夹具内部技术量:阈值与支持度一律不许露 */
const techTokens = [
  ...Object.values(thresholds).map(String),
  "supports", "posterior", "marginal", "expectedProfile", "sharedLatent",
];
const leakedTech = [];
for (const p of playerText) {
  for (const t of techTokens) if (p.text.includes(t)) leakedTech.push(p.where + " 含 " + t);
}
check("不含阈值与后验等夹具技术量", leakedTech.length === 0, leakedTech.join("; "));

/* B4. 内部标识符:界面说黑话是试玩失败的直接原因之一 */
const idPatterns = [
  [/latent\./, "latent.*"],
  [/PROOF\./, "PROOF.*"],
  [/\bobs\./, "obs.*"],
  [/\bdep\./, "dep.*"],
  [/\bsource\./, "source.*"],
  [/OBJECT\.FIRST/, "OBJECT.FIRST"],
  [/ARCHIVE\.CANDIDATE/, "ARCHIVE.CANDIDATE.*"],
  [/RELATION\./, "RELATION.*"],
  [/CLAIM\./, "CLAIM.*"],
  [/\bA\.[A-Z]/, "动作 id"],
];
const leakedIds = [];
for (const p of playerText) {
  for (const [re, label] of idPatterns) if (re.test(p.text)) leakedIds.push(p.where + " 含 " + label);
}
check("不含内部标识符", leakedIds.length === 0, leakedIds.join("; "));

/* B5. camelCase 事实名 */
const leakedFacts = [];
for (const p of playerText) {
  for (const f of allFacts) if (p.text.includes(f)) leakedFacts.push(p.where + " 含 " + f);
}
check(`不含 camelCase 事实名 (对照 ${allFacts.size} 个事实)`,
  leakedFacts.length === 0, leakedFacts.join("; "));

/* B6. 未知的人话说法不许原样复述内部键 */
const echoedKeys = Object.entries(UNKNOWN_SEMANTICS)
  .filter(([k, v]) => v.label.includes(k) || v.meaning.includes(k))
  .map(([k]) => k);
check("未知的人话说法不复述内部键", echoedKeys.length === 0, echoedKeys.join("、"));

console.log("");
console.log("== C. 写作护栏 ==");

const overBudget = Object.entries(ACTION_SEMANTICS)
  .filter(([, v]) => [...v.whyShort].length > DECISION_LINE_BUDGET)
  .map(([k, v]) => k + "=" + [...v.whyShort].length);
check(`whyShort 全部不超过 ${DECISION_LINE_BUDGET} 字`,
  overBudget.length === 0, "超出:" + overBudget.join("、"));

const lens = Object.values(ACTION_SEMANTICS).map((v) => [...v.whyShort].length);
console.log("        whyShort 字数:最短 " + Math.min(...lens) +
  ",最长 " + Math.max(...lens) +
  ",平均 " + (lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1));

const longLens = Object.values(ACTION_SEMANTICS).map((v) => [...v.whyLong].length);
console.log("        whyLong  字数:最短 " + Math.min(...longLens) +
  ",最长 " + Math.max(...longLens) +
  ",平均 " + (longLens.reduce((a, b) => a + b, 0) / longLens.length).toFixed(1));

console.log("");
console.log("== 结果 ==");
console.log("  通过 " + pass + " 项,失败 " + fails.length + " 项");
if (fails.length) {
  console.log("");
  for (const f of fails) console.log("  - " + f);
  process.exitCode = 1;
} else {
  console.log("  全部通过。注意:覆盖率与泄题是机械检查,");
  console.log("  「这段话读起来是否真的让非专业玩家看懂」不在机器能力之内 —— 待真人验证。");
}
