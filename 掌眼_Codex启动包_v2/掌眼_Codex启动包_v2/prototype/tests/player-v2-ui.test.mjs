import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const playerSourceUrl = new URL("../player/PlayerApp.tsx", import.meta.url);
const playerStylesUrl = new URL("../player/styles.css", import.meta.url);

test("player scene keeps artifact, NPC portrait, and anchored speech together", async () => {
  const source = await readFile(playerSourceUrl, "utf8");
  assert.match(source, /function EncounterScene/);
  assert.equal((source.match(/<EncounterScene\b/g) ?? []).length, 2);
  assert.match(source, /className="artifact-figure"/);
  assert.match(source, /className="npc-portrait"/);
  assert.match(source, /className="speech-bubble" role="status" aria-live="polite"/);
});

test("inspect and dialogue are modes while dossier and appraisal stay separate", async () => {
  const source = await readFile(playerSourceUrl, "utf8");
  assert.match(source, /className="action-mode-group card" role="group"/);
  assert.match(source, /aria-pressed=\{mode === "inspect"\}/);
  assert.match(source, /aria-pressed=\{mode === "dialogue"\}/);
  assert.match(source, /className="dossier-trigger"[\s\S]*aria-expanded=\{dossierOpen\}[\s\S]*aria-controls="dossier-drawer"/);
  assert.match(source, />形成判断<\/button>/);
  assert.match(source, /role="dialog" aria-modal="true"/);
  assert.match(source, /if \(event\.key === "Escape"\)/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /focusLabel=\{mode === "inspect" \? focusLabel : null\}/);
  assert.match(source, /`对话 \$\{1 \+ world\.statementHistory\.length\}`/);
});

test("player surface does not expose fact labels or live acceptance probability", async () => {
  const source = await readFile(playerSourceUrl, "utf8");
  for (const forbidden of [
    "seller.summary",
    "npcProfile.publicTraits",
    "visibleAcceptanceProbability",
    "卖家接受倾向约",
    "输入报价后显示卖家倾向",
    "spindle?.selectedId",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace(/[?.]/g, "\\$&")), forbidden);
  }
});

test("settled actions leave the NPC response visible until review is requested", async () => {
  const source = await readFile(playerSourceUrl, "utf8");
  assert.match(source, /world\.status === "settled"[\s\S]*查看本局复盘/);
  assert.doesNotMatch(source, /if \(next\.status === "settled"\) onReview\(\)/);
  for (const reply of ["成交", "不能再少了", "这个价不行", "先告辞了"]) {
    assert.match(source, new RegExp(reply));
  }
});

test("mobile scene text and primary controls meet the first-slice size floor", async () => {
  const css = await readFile(playerStylesUrl, "utf8");
  assert.match(css, /\.speech-bubble p \{[^}]*font-size: 18px/s);
  assert.match(css, /\.action-mode-group button, \.dossier-trigger \{ min-height: 64px; \}/);
  assert.match(css, /\.test-strip button \{ min-height: 44px; \}/);
  assert.match(css, /\.dossier-close \{ width: 46px; height: 46px;/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.encounter-scene \{ min-height: 348px;/);
});
