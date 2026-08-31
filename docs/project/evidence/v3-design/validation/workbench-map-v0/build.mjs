/* 把冻结规则核 + 语义文本 + 本层投影内联成一个可双击的离线 HTML。
   浏览器不允许 file:// 下的 ES module import(CORS),而要求是双击就能开、不挂服务。
   只读冻结源,一个字节都不写回;每个模块包成独立 IIFE,同名内部帮助函数互不覆盖;
   源文件 SHA-256 写进产物,副本与冻结源不一致时页面自己报警。
   跑法:node build.mjs */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frozen = resolve(here, "../first-ceramic-author-scenarios-v0");
const sha = (t) => createHash("sha256").update(t, "utf8").digest("hex").toUpperCase();

function moduleToIife(src, ns) {
  const names = [];
  const re = /^export\s+(?:const|function|class|let)\s+([A-Za-z_$][\w$]*)/gm;
  for (let m; (m = re.exec(src)); ) names.push(m[1]);
  if (!names.length) throw new Error(`${ns}: 没找到任何导出,构建规则可能已经失效`);
  const leftover = src.match(/^export\s+(?!const|function|class|let)/m);
  if (leftover) throw new Error(`${ns}: 出现了本脚本不认识的 export 形式:${leftover[0]}`);
  const body = src.replace(/^export\s+(const|function|class|let)\s/gm, "$1 ");
  return {
    names,
    code: `/* ==== ${ns} ==== */\nconst ${ns} = (() => {\n${body}\nreturn { ${names.join(", ")} };\n})();`,
  };
}

/* 把 `import { a, b } from "…/x.mjs";` 改写成 `const { a, b } = NS;`。
   全部 import 都必须被认领,漏一个就报错 —— 免得内联出一个静默半残的产物。 */
function rewriteImports(src, label, nsByFile) {
  let out = src;
  const re = /^import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?[ \t]*$/gm;
  const unmatched = [];
  out = out.replace(re, (whole, names, path) => {
    const file = path.split("/").pop();
    const ns = nsByFile[file];
    if (!ns) { unmatched.push(path); return whole; }
    const clean = names.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
    return `const { ${clean} } = ${ns};`;
  });
  if (unmatched.length) throw new Error(`${label}: 有 import 没被认领:${unmatched.join(", ")}`);
  if (/^import\s/m.test(out)) {
    throw new Error(`${label}: 还剩下本脚本不认识的 import 形式`);
  }
  return out;
}

const NS_BY_FILE = {
  "fixtures.mjs": "FIXTURES",
  "solver.mjs": "SOLVER",
  "case.mjs": "CASE",
  "semantics.mjs": "SEMANTICS",
  "session.mjs": "SESSION",
  "projection.mjs": "PROJECTION",
};

const raw = {
  FIXTURES: await readFile(resolve(frozen, "fixtures.mjs"), "utf8"),
  SOLVER: await readFile(resolve(frozen, "solver.mjs"), "utf8"),
  CASE: await readFile(resolve(here, "../knowledge-map-slice-v0/case.mjs"), "utf8"),
  SEMANTICS: await readFile(resolve(here, "../evidence-semantics-v0/semantics.mjs"), "utf8"),
  SESSION: await readFile(resolve(here, "session.mjs"), "utf8"),
  PROJECTION: await readFile(resolve(here, "projection.mjs"), "utf8"),
};

/* 依赖顺序:被依赖的先内联 */
const ORDER = ["FIXTURES", "SOLVER", "CASE", "SEMANTICS", "SESSION", "PROJECTION"];
const built = [];
const stamp = { builtAt: new Date().toISOString().slice(0, 10), sha: {}, exports: {} };
for (const ns of ORDER) {
  const rewritten = rewriteImports(raw[ns], ns, NS_BY_FILE);
  const m = moduleToIife(rewritten, ns);
  built.push(m.code);
  stamp.sha[ns] = sha(raw[ns]);
  stamp.exports[ns] = m.names.length;
}

const template = await readFile(resolve(here, "template.html"), "utf8");
const out = template
  .replace("/*__STAMP__*/", `const STAMP = ${JSON.stringify(stamp, null, 2)};`)
  .replace("/*__INLINE__*/", built.join("\n\n"));
if (out.includes("__INLINE__") || out.includes("__STAMP__")) {
  throw new Error("模板占位符没有被全部替换");
}

await writeFile(resolve(here, "prototype.html"), out, "utf8");
console.log("prototype.html 已生成");
for (const ns of ORDER) {
  console.log(`  ${ns.padEnd(11)} sha256 ${stamp.sha[ns].slice(0, 16)}…  导出 ${stamp.exports[ns]} 个`);
}
console.log(`  产物大小 ${(out.length / 1024).toFixed(0)} KB`);
