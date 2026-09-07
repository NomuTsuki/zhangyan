/* Build a standalone, double-clickable HTML for the integrated map experiment.
   Rules remain sourced from the frozen author model. This entry changes only
   the player-facing projection, layout, focus, and disclosure layers while the
   earlier focus-v0 entry remains available for comparison. Run with:
   node build.mjs */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frozen = resolve(here, "../first-ceramic-author-scenarios-v0");
const sha = (text) => createHash("sha256").update(text, "utf8").digest("hex").toUpperCase();

function moduleToIife(source, namespace) {
  const names = [];
  const exportPattern = /^export\s+(?:const|function|class|let)\s+([A-Za-z_$][\w$]*)/gm;
  for (let match; (match = exportPattern.exec(source)); ) names.push(match[1]);
  if (!names.length) throw new Error(`${namespace}: no exports found`);
  const leftover = source.match(/^export\s+(?!const|function|class|let)/m);
  if (leftover) throw new Error(`${namespace}: unsupported export form: ${leftover[0]}`);
  const body = source.replace(/^export\s+(const|function|class|let)\s/gm, "$1 ");
  return {
    names,
    code: `/* ==== ${namespace} ==== */\nconst ${namespace} = (() => {\n${body}\nreturn { ${names.join(", ")} };\n})();`,
  };
}

function rewriteImports(source, label, namespaceByFile) {
  let output = source;
  const importPattern = /^import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?[ \t]*$/gm;
  const unmatched = [];
  output = output.replace(importPattern, (whole, names, importPath) => {
    const file = importPath.split("/").pop();
    const namespace = namespaceByFile[file];
    if (!namespace) {
      unmatched.push(importPath);
      return whole;
    }
    const clean = names.split(",").map((name) => name.trim()).filter(Boolean).join(", ");
    return `const { ${clean} } = ${namespace};`;
  });
  if (unmatched.length) throw new Error(`${label}: unmatched imports: ${unmatched.join(", ")}`);
  if (/^import\s/m.test(output)) throw new Error(`${label}: unsupported import remains`);
  return output;
}

const NAMESPACE_BY_FILE = {
  "fixtures.mjs": "FIXTURES",
  "solver.mjs": "SOLVER",
  "case.mjs": "CASE",
  "semantics.mjs": "SEMANTICS",
  "session.mjs": "SESSION",
  "projection.mjs": "PROJECTION",
  "params.mjs": "PARAMS",
  "layout.mjs": "LAYOUT",
  "focus.mjs": "FOCUS",
};

const raw = {
  FIXTURES: await readFile(resolve(frozen, "fixtures.mjs"), "utf8"),
  SOLVER: await readFile(resolve(frozen, "solver.mjs"), "utf8"),
  CASE: await readFile(resolve(here, "../knowledge-map-slice-v0/case.mjs"), "utf8"),
  SEMANTICS: await readFile(resolve(here, "../evidence-semantics-v0/semantics.mjs"), "utf8"),
  SESSION: await readFile(resolve(here, "session.mjs"), "utf8"),
  PROJECTION: await readFile(resolve(here, "projection.mjs"), "utf8"),
  PARAMS: await readFile(resolve(here, "params.mjs"), "utf8"),
  LAYOUT: await readFile(resolve(here, "layout.mjs"), "utf8"),
  FOCUS: await readFile(resolve(here, "focus.mjs"), "utf8"),
};

const ORDER = [
  "FIXTURES", "SOLVER", "CASE", "SEMANTICS", "SESSION",
  "PROJECTION", "PARAMS", "LAYOUT", "FOCUS",
];
const built = [];
const stamp = { builtAt: new Date().toISOString().slice(0, 10), sha: {}, exports: {} };
for (const namespace of ORDER) {
  const rewritten = rewriteImports(raw[namespace], namespace, NAMESPACE_BY_FILE);
  const module = moduleToIife(rewritten, namespace);
  built.push(module.code);
  stamp.sha[namespace] = sha(raw[namespace]);
  stamp.exports[namespace] = module.names.length;
}

const template = await readFile(resolve(here, "template.html"), "utf8");
const output = template
  .replace("/*__STAMP__*/", `const STAMP = ${JSON.stringify(stamp, null, 2)};`)
  .replace("/*__INLINE__*/", built.join("\n\n"));
if (output.includes("__INLINE__") || output.includes("__STAMP__")) {
  throw new Error("template placeholders were not fully replaced");
}

await writeFile(resolve(here, "prototype.html"), output, "utf8");
console.log("prototype.html generated");
for (const namespace of ORDER) {
  console.log(`  ${namespace.padEnd(11)} sha256 ${stamp.sha[namespace].slice(0, 16)}... exports ${stamp.exports[namespace]}`);
}
console.log(`  output ${(output.length / 1024).toFixed(0)} KB`);
