import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { PLAYER_CASE_CATALOG } from "./content/case-catalog.ts";
import { DEFAULT_RULESET_IDENTITY } from "./game/ruleset.ts";

const buildIndexUrl = new URL("./work/player/index.html", import.meta.url);
const buildRoot = fileURLToPath(new URL("./work/player/", import.meta.url));
const outputUrl = new URL("./public/掌眼_V2_玩家试玩版.html", import.meta.url);
const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const productRelativePath = "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype";

const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).trim();
const productStatus = execFileSync(
  "git",
  ["status", "--porcelain", "--untracked-files=all", "--", productRelativePath],
  { cwd: repositoryRoot, encoding: "utf8" },
).trim();
const provenance = {
  artifact: "player-trial",
  rulesetId: DEFAULT_RULESET_IDENTITY.rulesetId,
  rulesetVersion: DEFAULT_RULESET_IDENTITY.rulesetVersion,
  cases: PLAYER_CASE_CATALOG.map(({ id, caseVersion }) => ({ id, caseVersion })),
  sourceCommit,
  sourceTreeStatus: productStatus === "" ? "clean" : "dirty",
};

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']+)["']|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2] ?? null;
}

function resolveLocalAsset(reference) {
  const assetUrl = new URL(reference, buildIndexUrl);
  if (assetUrl.protocol !== "file:") throw new Error(`Player build contains a remote asset: ${reference}`);
  const assetPath = fileURLToPath(assetUrl);
  const relativePath = relative(buildRoot, assetPath);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || resolve(assetPath) === resolve(buildRoot)) {
    throw new Error(`Player asset escapes the build directory: ${reference}`);
  }
  return assetPath;
}

function escapeClosingTag(source, tagName) {
  return source.replace(new RegExp(`</${tagName}`, "gi"), `<\\/${tagName}`);
}

let html = await readFile(buildIndexUrl, "utf8");
for (const tag of [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0])) {
  if ((getAttribute(tag, "rel") ?? "").toLowerCase() !== "stylesheet") continue;
  const href = getAttribute(tag, "href");
  if (!href) throw new Error("Player stylesheet is missing href");
  const css = await readFile(resolveLocalAsset(href), "utf8");
  html = html.replace(tag, () => `<style>${escapeClosingTag(css, "style")}</style>`);
}

const scriptTags = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(?:["'][^"']+["']|[^\s>]+)[^>]*>\s*<\/script>/gi)].map((match) => match[0]);
if (scriptTags.length !== 1) throw new Error(`Expected one player entry script, received ${scriptTags.length}`);
const source = getAttribute(scriptTags[0], "src");
if (!source) throw new Error("Player entry script is missing src");
const javascript = await readFile(resolveLocalAsset(source), "utf8");
html = html.replace(scriptTags[0], () => `<script type="module">${escapeClosingTag(javascript, "script")}</script>`);

const provenanceJson = JSON.stringify(provenance).replaceAll("</script", "<\\/script");
html = html.replace("</head>", `<script id="zhangyan-build-provenance" type="application/json">${provenanceJson}</script></head>`);

if (/<script\b[^>]*\bsrc\s*=/i.test(html)) throw new Error("Generated player HTML still contains an external script");
if (/<link\b[^>]*\brel\s*=\s*["']?stylesheet\b/i.test(html)) throw new Error("Generated player HTML still contains an external stylesheet");

await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
await writeFile(outputUrl, html, "utf8");
console.log(`Generated ${fileURLToPath(outputUrl)}`);
