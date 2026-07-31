import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlUrl = new URL("../public/掌眼_低保真交互原型.html", import.meta.url);
const pageUrl = new URL("../app/page.tsx", import.meta.url);
const clientUrl = new URL("../standalone/client.js", import.meta.url);

test("standalone teacher demo contains the integrated loop and stays self-contained", async () => {
  const [html, page, client] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(pageUrl, "utf8"),
    readFile(clientUrl, "utf8"),
  ]);

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>掌眼｜民国漆木首饰盒低保真原型<\/title>/);
  assert.match(html, /共享行动循环原型/);
  assert.match(html, /P2 · 交叉调查/);
  assert.match(html, /付费专项检测/);
  assert.match(html, /客观结果分/);
  assert.match(html, /判断质量分/);
  assert.match(html, /规则、状态与回放/);
  assert.match(html, /button:not\(:disabled\)\s*\{\s*cursor:\s*pointer/);
  assert.match(html, /id="debug-root"/);
  assert.match(html, /window\.__ZHANGYAN_CASE__/);
  assert.match(html, /window\.__ZHANGYAN_DEBUG__/);
  assert.match(html, /function resolveInspect\(/);
  assert.match(html, /function resolveDialogue\(/);
  assert.match(html, /function resolveTest\(/);
  assert.match(html, /function resolveDiscount\(/);
  assert.match(html, /function resolveBuyout\(/);
  assert.match(html, /function calculateNpcPosterior\(/);
  assert.match(html, /function calculateSettlement\(/);
  assert.match(html, /function renderInvestigate\(/);
  assert.match(html, /function renderEvidence\(/);
  assert.match(html, /function renderTrade\(/);
  assert.match(html, /function renderReview\(/);
  assert.match(html, /function renderDebug\(/);
  assert.match(html, /actionPointCost":2/);
  assert.match(html, /valueCost":10/);
  assert.match(html, /购买与拒绝是零行动点终局动作/);
  assert.match(html, /候选行为/);
  assert.match(html, /整局状态变化图/);
  assert.match(html, /定价评分分项：局末解锁/);
  assert.match(html, /同源陈述卡不重复计权/);
  assert.match(html, /sharedEvidenceIds/);
  assert.match(html, /npcPosterior/);
  assert.match(html, /只强调不利部分/);
  assert.match(html, /谨慎参考/);
  assert.match(html, /按输入值提出普通报价/);
  assert.match(html, /无条件买断/);
  assert.match(html, /收进证据簿，返回调查/);
  assert.match(html, /publicReason/);
  assert.doesNotMatch(html, /reservationPrice/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i);

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

  assert.match(client, /function resolveAction\(/);
  assert.match(client, /function calculateNpcPosterior\(/);
  assert.match(client, /function resolveBuyout\(/);
  assert.match(client, /function renderDebug\(/);
  assert.match(client, /kind !== "statement"/);
  assert.match(client, /sharedEvidenceIds/);
  assert.match(client, /playerReferenceOffer/);
  assert.match(client, /hidePricingTrace/);
  assert.match(client, /window\.__ZHANGYAN_DEBUG__/);

  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, "expected exactly one inline interaction script");
  assert.doesNotThrow(() => new Function(scripts[0][1]));
});
