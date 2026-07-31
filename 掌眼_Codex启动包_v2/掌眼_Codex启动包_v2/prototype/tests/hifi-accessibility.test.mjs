import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appUrl = new URL("../hifi/HighFidelityApp.tsx", import.meta.url);
const stylesUrl = new URL("../hifi/styles.css", import.meta.url);

const [appSource, styles] = await Promise.all([
  readFile(appUrl, "utf8"),
  readFile(stylesUrl, "utf8"),
]);

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...styles.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "g")),
  ];
  return matches.at(-1)?.[1] ?? "";
}

test("compact controls still meet the 44px touch target minimum", () => {
  for (const selector of [
    ".quiet-button",
    ".mode-switch button",
    ".artifact-illustration__view-button",
  ]) {
    assert.match(
      rule(selector),
      /min-height:\s*44px(?:\s*!important)?\s*;/,
      `${selector} must have a 44px minimum height`,
    );
  }
});

test("investigation mode uses pressed buttons instead of an incomplete tabs pattern", () => {
  assert.match(appSource, /className="mode-switch" role="group"/);
  assert.match(appSource, /aria-pressed=\{mode === "observe"\}/);
  assert.match(appSource, /aria-pressed=\{mode === "ask"\}/);
  assert.doesNotMatch(appSource, /role="tab(?:list)?"/);
});

test("stage changes have a programmatic focus destination", () => {
  assert.match(appSource, /previousStageRef/);
  assert.match(appSource, /querySelector<HTMLElement>\("\[data-stage-focus\]"\)/);
  assert.ok(
    (appSource.match(/data-stage-focus/g) ?? []).length >= 5,
    "every player stage needs a focus destination",
  );
});

test("invalid quotes expose a nearby textual explanation", () => {
  assert.match(appSource, /const quoteError/);
  assert.match(appSource, /aria-invalid=\{Boolean\(quoteError\)\}/);
  assert.match(appSource, /id="quote-error" role="status"/);
  assert.match(appSource, /报价需低于卖家当前要价/);
});

test("the return-to-investigation control is removed after bargaining locks", () => {
  assert.match(
    appSource,
    /\{!locked && \(\s*<button className="text-button" onClick=\{onBack\}>/,
  );
  assert.doesNotMatch(appSource, /disabled=\{locked\}/);
});

test("the development rail starts closed and keeps truth locked until settlement", () => {
  assert.match(
    appSource,
    /const \[developerOpen, setDeveloperOpen\] = useState\(false\)/,
  );
  assert.match(appSource, /aria-expanded=\{developerOpen\}/);
  assert.match(
    appSource,
    /world\.status === "settled"[\s\S]+真实价值 \{truth\.trueValue\}/,
  );
  assert.match(appSource, /完成本局后显示真实价值与品质/);
});

test("evidence-driven repricing is shown beside the seller response", () => {
  assert.match(appSource, /className="price-revaluation"/);
  assert.match(appSource, /lastTurn\.priceChange\.before/);
  assert.match(appSource, /lastTurn\.priceChange\.after/);
  assert.match(appSource, /lastTurn\.priceChange\.publicReason/);
});

test("the concrete-evidence select has an accessible name", () => {
  assert.match(appSource, /<legend id="evidence-choice-label">/);
  assert.match(appSource, /aria-labelledby="evidence-choice-label"/);
});
