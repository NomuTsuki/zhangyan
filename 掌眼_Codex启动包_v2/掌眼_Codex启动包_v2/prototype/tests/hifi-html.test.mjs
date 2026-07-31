import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicHtmlUrl = new URL(
  "../public/掌眼_高保真教师演示.html",
  import.meta.url,
);
const distHtmlUrl = new URL(
  "../dist/client/掌眼_高保真教师演示.html",
  import.meta.url,
);

async function readIfPresent(url) {
  return readFile(url, "utf8").catch((error) => {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  });
}

test("high-fidelity build produces the offline teacher demo", async () => {
  const html = await readIfPresent(publicHtmlUrl);

  assert.notEqual(
    html,
    null,
    "expected public/掌眼_高保真教师演示.html to be generated",
  );
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>掌眼｜高保真教师演示<\/title>/i);
  assert.match(html, /<meta name="viewport"/i);
  assert.match(html, /<meta name="theme-color" content="#173f38"/i);
});

test("high-fidelity teacher demo has no external runtime dependencies", async () => {
  const html = await readIfPresent(publicHtmlUrl);
  assert.notEqual(html, null, "expected the generated teacher demo");

  assert.match(html, /<style>[\s\S]+<\/style>/i);
  assert.match(html, /<script type="module">[\s\S]+<\/script>/i);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(
    html,
    /<link\b[^>]*\brel\s*=\s*["']?stylesheet\b/i,
  );
  assert.doesNotMatch(
    html,
    /\b(?:src|href)\s*=\s*["']https?:\/\//i,
  );
  assert.doesNotMatch(html, /@import\s+(?:url\()?["']?https?:\/\//i);
});

test("application build copies the exact teacher demo into dist/client", async () => {
  const [publicHtml, distHtml] = await Promise.all([
    readIfPresent(publicHtmlUrl),
    readIfPresent(distHtmlUrl),
  ]);

  assert.notEqual(publicHtml, null, "expected the public teacher demo");
  assert.notEqual(distHtml, null, "expected the dist/client teacher demo");
  assert.equal(distHtml, publicHtml);
});

test("teacher demo exposes the approved player contract and keeps development data outside it", async () => {
  const html = await readIfPresent(publicHtmlUrl);
  assert.notEqual(html, null, "expected the generated teacher demo");

  for (const requiredText of [
    "调查行动",
    "议价容量",
    "仅你掌握",
    "具体证据",
    "综合成果",
    "DEVELOPMENT VIEW",
    "不属于玩家界面",
    "普通 Web / H5",
  ]) {
    assert.match(html, new RegExp(requiredText));
  }

  assert.doesNotMatch(html, /客观结果分|70分胜利线|只强调不利部分/);
});
