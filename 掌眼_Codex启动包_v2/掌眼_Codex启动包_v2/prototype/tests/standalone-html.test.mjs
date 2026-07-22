import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlUrl = new URL("../public/掌眼_低保真交互原型.html", import.meta.url);
const pageUrl = new URL("../app/page.tsx", import.meta.url);

test("standalone teacher demo is self-contained and executable", async () => {
  const [html, page] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(pageUrl, "utf8"),
  ]);

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>掌眼｜民国漆木首饰盒低保真原型<\/title>/);
  assert.match(html, /单文件 · 离线可用/);
  assert.match(html, /现代胶痕/);
  assert.match(html, /送检后付款/);
  assert.match(html, /下一步由你决定/);
  assert.match(html, /button:not\(:disabled\)\s*\{\s*cursor:\s*pointer/);
  assert.doesNotMatch(html, /关闭，继续观察|close-modal/);
  assert.match(html, /if \(action === "collect"\)[\s\S]*?state\.evidence = true[\s\S]*?modalRoot\.innerHTML = ""[\s\S]*?go\("observe"\)/);
  assert.doesNotMatch(html, /if \(action === "collect"\)[^\n]*go\("evidence"\)/);
  const standaloneEvidenceScreen = html.match(/function renderEvidence\(\) \{([\s\S]*?)function renderAction/);
  assert.ok(standaloneEvidenceScreen, "expected standalone evidence screen");
  assert.doesNotMatch(standaloneEvidenceScreen[1], /data-action="action"/);
  assert.match(standaloneEvidenceScreen[1], /data-action="observe"/);
  assert.match(html, /function resolveAction\(/);
  assert.match(html, /id="debug-root"/);
  assert.match(html, /function renderDebug\(/);
  assert.match(html, /精确规则输出/);
  assert.match(html, /result\.changes\.map/);
  assert.match(html, /<\/section>\s*<aside class="debug-rail"/);
  const standaloneResponseScreen = html.match(/function renderResponse\(\) \{([\s\S]*?)function renderTrade/);
  assert.ok(standaloneResponseScreen, "expected standalone response screen");
  assert.doesNotMatch(standaloneResponseScreen[1], /debug-delta|debug-log|规则结算日志|seed/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i);

  assert.match(page, /下一步由你决定/);
  assert.match(page, /actionResult\.changes\.map/);
  assert.match(page, /resolveAction/);
  assert.match(page, /className="debug-rail"/);
  assert.match(page, /供讨论与调试，不属于玩家界面/);
  assert.match(page, /<\/section>\s*<aside className="debug-rail"/);
  assert.doesNotMatch(page, /npcStatePreview/);
  assert.doesNotMatch(page, /关闭，继续观察/);
  assert.match(page, /if \(detailIsNew\) setEvidenceFound\(true\);[\s\S]*?setDetailOpen\(false\);[\s\S]*?go\("observe"\);/);
  const reactEvidenceScreen = page.match(/screen === "evidence"([\s\S]*?)screen === "action"/);
  assert.ok(reactEvidenceScreen, "expected React evidence screen");
  assert.doesNotMatch(reactEvidenceScreen[1], /go\("action"\)/);
  assert.match(reactEvidenceScreen[1], /go\("observe"\)/);
  const reactResponseScreen = page.match(/screen === "response"([\s\S]*?)screen === "trade"/);
  assert.ok(reactResponseScreen, "expected React response screen");
  assert.doesNotMatch(reactResponseScreen[1], /actionResult\.changes\.map|规则结算日志|seed/);
  const script = html.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(script, "expected one inline interaction script");
  assert.doesNotThrow(() => new Function(script[1]));

  for (const screen of [
    "home",
    "arrival",
    "observe",
    "evidence",
    "action",
    "response",
    "trade",
    "review",
  ]) {
    assert.match(html, new RegExp(`render${screen[0].toUpperCase()}${screen.slice(1)}`));
  }
});
