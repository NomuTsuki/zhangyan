/* 核实盲测玩家的第 2、3 名问题是不是同一个 bug。
   跑法:cmd /c "node stopped-probe.mjs > stopped-probe-out.txt 2>&1"

   玩家原话:点「收手」后「界面没有明显变化」;随后「做这一步」按钮全灰且「没有任何文字说明」。
   怀疑:收手并没有把动作标成不可用,只是标成买不起,而解释文案只挂在「不可用」那一支上。 */
import { newSession, take, workbench } from "./session.mjs";

const line = (s = "") => console.log(s);

/* template.html 的两处渲染条件,照抄以便一旦改了这里就对不上:
     按钮禁用  = !(usable && affordable)
     解释可见  = !usable          <-- 注意:不看 affordable */
const btnDisabled = (r) => !(r.usable && r.affordable);
const explainShown = (r) => !r.usable;

const report = (title, s) => {
  const rows = workbench(s);
  const silent = rows.filter((r) => btnDisabled(r) && !explainShown(r));
  line(`${title}`);
  line(`  按钮变灰 ${rows.filter(btnDisabled).length} / ${rows.length} 个`);
  line(`  其中【灰了但一个字都不解释】${silent.length} 个`);
  if (silent.length) line(`  例:${silent.slice(0, 3).map((r) => "「" + r.action.name + "」").join("、")}`);
  return silent.length;
};

line("=".repeat(72));
line("场景一:开局,什么都没做");
line("=".repeat(72));
const s = newSession(22);
report("开局", s);

line("");
line("=".repeat(72));
line("场景二:走 3 步之后(玩家实际走到的地方)");
line("=".repeat(72));
for (const id of ["A.OBSERVE.STRUCTURE.XRAY", "A.SCREEN.UV", "A.RESEARCH.LATE_TREATMENT"]) {
  const r = take(s, id);
  line(`  做「${id}」:${r.ok ? "成功" : "被拒 —— " + r.why}`);
}
report("走 3 步后", s);

line("");
line("=".repeat(72));
line("场景三:按下「收手」之后 —— 玩家说这里什么反馈都没有");
line("=".repeat(72));
s.stopped = true;
const silentStopped = report("收手后", s);
const rows = workbench(s);
line("");
line(`  usable 仍为 true 的有 ${rows.filter((r) => r.usable).length} 个`);
line(`  affordable 为 false 的有 ${rows.filter((r) => !r.affordable).length} 个`);
line(`  >>> 收手只把 affordable 打成 false,没有动 usable。`);
line(`  >>> 而 template.html 第 639 行的解释只在 !usable 时渲染,`);
line(`      所以那句兜底文案「本局已经收手」是【死代码,永远不会显示】。`);

line("");
line("=".repeat(72));
line("场景四:步数用完(另一条通向同样静默的路)");
line("=".repeat(72));
/* 注意:newSession(3) 会被 clampBudget 静默抬到最小值,第一版探针就是这么假通过的。
   所以先建会话再读它真实的 budget,一直走到真的走不动为止。 */
const s2 = newSession(0);
line(`  请求预算 0,clampBudget 给的真实预算是 ${s2.budget}`);
let guard = 0;
while (s2.log.length < s2.budget && guard++ < 200) {
  const next = workbench(s2).find((r) => r.usable && r.affordable);
  if (!next) break;
  take(s2, next.action.id);
}
line(`  已走 ${s2.log.length} / ${s2.budget} 步,stopped=${s2.stopped}`);
if (s2.log.length < s2.budget) {
  line(`  !! 没能把步数走完(可用动作先耗尽了),这个场景测不到,不给结论`);
}
const silentBroke = report("步数耗尽", s2);

line("");
line("=".repeat(72));
line("结论");
line("=".repeat(72));
line(`收手后静默变灰的按钮:${silentStopped} 个`);
line(`步数耗尽后静默变灰的按钮:${silentBroke} 个 (走到 ${s2.log.length}/${s2.budget} 步)`);
line("");
line("玩家最需要被告知发生了什么的两个时刻 —— 我主动交差了 / 我没步数了 ——");
line("界面恰好一个字都不说,只是把按钮变灰。");
line("盲测玩家排的第 2 名与第 3 名问题是同一个 bug 的两面,不是两个问题。");
