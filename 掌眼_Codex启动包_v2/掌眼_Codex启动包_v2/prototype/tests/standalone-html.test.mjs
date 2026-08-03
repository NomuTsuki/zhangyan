import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlUrl = new URL("../public/掌眼_低保真交互原型.html", import.meta.url);
const pageUrl = new URL("../app/page.tsx", import.meta.url);
const clientUrl = new URL("../standalone/client.js", import.meta.url);

test("legacy low-fidelity snapshot stays self-contained and embeds its tracked client", async () => {
  const [html, client] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(clientUrl, "utf8"),
  ]);

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>掌眼｜民国漆木首饰盒低保真原型<\/title>/);
  assert.match(html, /共享行动循环原型/);
  assert.match(html, /规则、状态与回放/);
  assert.match(html, /button:not\(:disabled\)\s*\{\s*cursor:\s*pointer/);
  assert.match(html, /id="debug-root"/);
  assert.match(html, /window\.__ZHANGYAN_CASE__/);
  assert.match(html, /window\.__ZHANGYAN_DEBUG__/);
  assert.match(html, /function renderInvestigate\(/);
  assert.match(html, /function renderEvidence\(/);
  assert.match(html, /function renderTrade\(/);
  assert.match(html, /function renderReview\(/);
  assert.match(html, /function renderDebug\(/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i);

  assert.match(client, /function resolveAction\(/);
  assert.match(client, /function renderDebug\(/);
  assert.match(client, /window\.__ZHANGYAN_DEBUG__/);

  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, "expected exactly one inline interaction script");
  assert.ok(
    scripts[0][1].endsWith(client),
    "generated HTML must embed the tracked legacy client byte-for-byte",
  );
  assert.doesNotThrow(() => new Function(scripts[0][1]));
});

test("React development surface keeps the current integrated-loop contracts", async () => {
  const page = await readFile(pageUrl, "utf8");

  assert.match(page, /createInitialWorldState/);
  assert.match(page, /resolveTurn/);
  assert.match(page, /screen === "investigate"/);
  assert.match(page, /screen === "trade"/);
  assert.match(page, /function StateTimelineChart/);
  assert.match(page, /function DebugTurnDetails/);
  assert.match(page, /function DebugRail/);
  assert.match(page, /getPlayerReferenceOffer/);
  assert.doesNotMatch(page, /selectedDisclosureFrame/);
  assert.match(page, /kind: "buyout"/);
  assert.match(page, /review-causal-timeline/);
  assert.match(page, /lastTurn\.priceChange\.publicReason/);
  assert.match(page, /成果等级公式/);
  assert.match(page, /判断质量公式/);
  assert.match(page, /className="debug-rail"/);
  assert.match(page, /<\/section>\s*<DebugRail/);
  assert.doesNotMatch(page, /screen === "action"/);
  assert.doesNotMatch(page, /送检后付款/);
});
