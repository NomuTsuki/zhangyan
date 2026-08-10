import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { lacquerBoxCase } from "./content/lacquer-box.ts";
import { DEFAULT_RULESET_IDENTITY } from "./game/ruleset.ts";

const buildIndexUrl = new URL("./work/hifi/index.html", import.meta.url);
const buildRoot = fileURLToPath(new URL("./work/hifi/", import.meta.url));
const outputUrl = new URL(
  "./public/掌眼_V2_高保真演示.html",
  import.meta.url,
);
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
  rulesetId: DEFAULT_RULESET_IDENTITY.rulesetId,
  rulesetVersion: DEFAULT_RULESET_IDENTITY.rulesetVersion,
  caseId: lacquerBoxCase.id,
  caseVersion: lacquerBoxCase.caseVersion,
  sourceCommit,
  sourceTreeStatus: productStatus === "" ? "clean" : "dirty",
};

function getAttribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']+)["']|([^\\s>]+))`, "i"),
  );
  return match?.[1] ?? match?.[2] ?? null;
}

function resolveLocalAsset(reference) {
  const assetUrl = new URL(reference, buildIndexUrl);
  if (assetUrl.protocol !== "file:") {
    throw new Error(`High-fidelity build contains a remote asset: ${reference}`);
  }

  const assetPath = fileURLToPath(assetUrl);
  const relativePath = relative(buildRoot, assetPath);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    resolve(assetPath) === resolve(buildRoot)
  ) {
    throw new Error(`High-fidelity asset escapes the build directory: ${reference}`);
  }
  return assetPath;
}

function escapeClosingTag(source, tagName) {
  return source.replace(
    new RegExp(`</${tagName}`, "gi"),
    `<\\/${tagName}`,
  );
}

async function inlineStyles(html) {
  const tags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  let output = html;
  let count = 0;

  for (const tag of tags) {
    if ((getAttribute(tag, "rel") ?? "").toLowerCase() !== "stylesheet") {
      continue;
    }
    const href = getAttribute(tag, "href");
    if (!href) {
      throw new Error("Stylesheet link is missing href");
    }
    const css = await readFile(resolveLocalAsset(href), "utf8");
    output = output.replace(
      tag,
      () => `<style>${escapeClosingTag(css, "style")}</style>`,
    );
    count += 1;
  }

  if (count === 0) {
    throw new Error("High-fidelity build did not emit a stylesheet");
  }
  return output;
}

async function inlineScripts(html) {
  const tags = [
    ...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(?:["'][^"']+["']|[^\s>]+)[^>]*>\s*<\/script>/gi),
  ].map((match) => match[0]);
  let output = html;

  if (tags.length !== 1) {
    throw new Error(
      `Expected one high-fidelity entry script, received ${tags.length}`,
    );
  }

  for (const tag of tags) {
    const source = getAttribute(tag, "src");
    if (!source) {
      throw new Error("Entry script is missing src");
    }
    const javascript = await readFile(resolveLocalAsset(source), "utf8");
    output = output.replace(
      tag,
      () =>
        `<script type="module">${escapeClosingTag(javascript, "script")}</script>`,
    );
  }

  return output;
}

let html = await readFile(buildIndexUrl, "utf8");
html = await inlineStyles(html);
html = await inlineScripts(html);
const provenanceJson = JSON.stringify(provenance).replaceAll("</script", "<\\/script");
html = html.replace(
  "</head>",
  `<script id="zhangyan-build-provenance" type="application/json">${provenanceJson}</script></head>`,
);

if (/<script\b[^>]*\bsrc\s*=/i.test(html)) {
  throw new Error("Generated teacher demo still contains an external script");
}
if (/<link\b[^>]*\brel\s*=\s*["']?stylesheet\b/i.test(html)) {
  throw new Error("Generated teacher demo still contains an external stylesheet");
}

await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
await writeFile(outputUrl, html, "utf8");
console.log(`Generated ${fileURLToPath(outputUrl)}`);
