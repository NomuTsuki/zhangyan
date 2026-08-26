/* 把冻结的规则核 + 本案投影层内联成一个可双击的离线 HTML。
 *
 * 为什么要内联:浏览器不允许 file:// 下的 ES module import(CORS),而用户要的是
 * 双击就能开、不用挂本地服务。所以构建期把源码搬进单文件。
 *
 * 为什么安全:
 *  - 只读冻结源,一个字节都不写回;
 *  - 每个文件包成独立 IIFE 再取出导出名,所以两个文件里同名的内部帮助函数
 *    不会互相覆盖(fixtures 和 solver 都有各自的 helper);
 *  - 冻结源的 SHA-256 写进产物。副本一旦与冻结源不一致,页面自己会报警。
 *
 * 跑法:node build.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frozen = resolve(here, "../first-ceramic-author-scenarios-v0");

const sha = (t) => createHash("sha256").update(t, "utf8").digest("hex").toUpperCase();

/* 找出 `export const/function/class NAME`,同时把 export 关键字剥掉。 */
function moduleToIife(src, ns) {
  const names = [];
  const re = /^export\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)/gm;
  for (let m; (m = re.exec(src)); ) names.push(m[1]);
  if (!names.length) throw new Error(`${ns}: 没找到任何导出,构建规则可能已经失效`);

  const leftover = src.match(/^export\s+(?!const|function|class)/m);
  if (leftover) throw new Error(`${ns}: 出现了本脚本不认识的 export 形式:${leftover[0]}`);

  const body = src.replace(/^export\s+(const|function|class)\s/gm, "$1 ");
  return {
    names,
    code: `/* ==== ${ns} ==== */\nconst ${ns} = (() => {\n${body}\nreturn { ${names.join(", ")} };\n})();`,
  };
}

const fixturesSrc = await readFile(resolve(frozen, "fixtures.mjs"), "utf8");
const solverSrc = await readFile(resolve(frozen, "solver.mjs"), "utf8");
let caseSrc = await readFile(resolve(here, "case.mjs"), "utf8");

/* case.mjs 在 Node 里 import fixtures;内联后改成从命名空间取。 */
const importLine = /^import\s*\{\s*events\s*\}\s*from\s*["'][^"']*fixtures\.mjs["'];?\s*$/m;
if (!importLine.test(caseSrc)) throw new Error("case.mjs 的 import 形式变了,构建脚本要同步改");
caseSrc = caseSrc.replace(importLine, "const { events } = FIXTURES;");

const fx = moduleToIife(fixturesSrc, "FIXTURES");
const sv = moduleToIife(solverSrc, "SOLVER");
const cs = moduleToIife(caseSrc, "CASE");

const stamp = {
  builtAt: new Date().toISOString().slice(0, 10),
  fixtures: sha(fixturesSrc),
  solver: sha(solverSrc),
  case: sha(caseSrc),
  exports: { FIXTURES: fx.names.length, SOLVER: sv.names.length, CASE: cs.names.length },
};

const template = await readFile(resolve(here, "template.html"), "utf8");
const out = template
  .replace("/*__STAMP__*/", `const STAMP = ${JSON.stringify(stamp, null, 2)};`)
  .replace("/*__INLINE__*/", [fx.code, sv.code, cs.code].join("\n\n"));

if (out.includes("__INLINE__") || out.includes("__STAMP__")) {
  throw new Error("模板占位符没有被全部替换");
}

await writeFile(resolve(here, "slice.html"), out, "utf8");
console.log(`slice.html 已生成`);
console.log(`  fixtures.mjs sha256 ${stamp.fixtures.slice(0, 16)}…  导出 ${fx.names.length} 个`);
console.log(`  solver.mjs   sha256 ${stamp.solver.slice(0, 16)}…  导出 ${sv.names.length} 个`);
console.log(`  case.mjs     sha256 ${stamp.case.slice(0, 16)}…  导出 ${cs.names.length} 个`);
console.log(`  产物大小 ${(out.length / 1024).toFixed(0)} KB`);
