import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const playerHtmlUrl = new URL("../public/掌眼_V2_玩家试玩版.html", import.meta.url);

test("player trial is a self-contained artifact with all three cases", async () => {
  const html = await readFile(playerHtmlUrl, "utf8");
  assert.match(html, /掌眼 · 玩家试玩版/);
  assert.match(html, /民国漆木首饰盒/);
  assert.match(html, /青花折枝纹碗/);
  assert.match(html, /山水题跋立轴/);
  assert.match(html, /当前主观估值/);
  assert.match(html, /掌眼结论/);
  assert.match(html, /本局能力评级/);
  assert.match(html, /客观结果/);
  assert.match(html, /zhangyan-build-provenance/);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html, /<link\b[^>]*\brel\s*=\s*["']?stylesheet\b/i);
});

test("player trial excludes teacher, developer, and prototype-only surfaces", async () => {
  const html = await readFile(playerHtmlUrl, "utf8");
  for (const forbidden of [
    "teacher-guide",
    "teacher-rail",
    "developer-toggle",
    "demo-workbench",
    "教师演示",
    "开发侧栏",
    "参考簿 · 谨慎报价",
    "填入参考价",
    "插画用于定位，不呈现可直接判定真伪的微观细节",
  ]) {
    assert.doesNotMatch(html, new RegExp(forbidden), forbidden);
  }
  assert.doesNotMatch(html, /\["来客","查验","交易","复盘"\]/);
});

test("player offer is intentionally blank and no Q20 recommendation is bundled", async () => {
  const html = await readFile(playerHtmlUrl, "utf8");
  assert.match(html, /留空，自己判断/);
  assert.doesNotMatch(html, /谨慎参考\s*=|后验Q20|suggestedOffer/);
});

test("player bundle contains the mobile human-object scene and correct task hierarchy", async () => {
  const html = await readFile(playerHtmlUrl, "utf8");
  for (const marker of [
    "encounter-scene",
    "artifact-figure",
    "npc-portrait",
    "speech-bubble",
    "action-mode-group",
    "dossier-drawer",
    "细看",
    "询问",
    "案卷",
    "形成判断",
  ]) {
    assert.match(html, new RegExp(marker), marker);
  }
  assert.doesNotMatch(html, /卖家接受倾向约|输入报价后显示卖家倾向/);
});
