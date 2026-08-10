import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import {
  createInitialWorldState,
  resolveTurn,
} from "../game/resolve-action.ts";
import { buildDeveloperProjection } from "../game/projections.ts";
import { buildPlayerPresentation } from "../hifi/presentation.ts";

function start(variant = "restored-genuine") {
  return createInitialWorldState(lacquerBoxCase, 20260723, variant);
}

test("player projection has no truth, exact NPC state, posterior or formulas before settlement", () => {
  const projection = buildPlayerPresentation(lacquerBoxCase, start("hidden-treasure"));
  const serialized = JSON.stringify(projection);

  for (const forbidden of [
    "truthVariantId",
    "npcState",
    "npcPosterior",
    "formulaLog",
    "trueValue",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden));
  }
  assert.equal(projection.status, "active");
});

test("developer projection carries identity and audit data without mutating state", () => {
  const state = start();
  const before = structuredClone(state);
  const projection = buildDeveloperProjection(lacquerBoxCase, state);

  assert.equal(projection.caseId, lacquerBoxCase.id);
  assert.equal(projection.rulesetVersion, "2.0.0-alpha.1");
  assert.equal(projection.truth, null);
  assert.deepEqual(state, before);
});

test("developer projection is a deep copy and reveals truth only after settlement", () => {
  const active = start("hidden-treasure");
  const activeProjection = buildDeveloperProjection(lacquerBoxCase, active);
  activeProjection.npcState.pressure = 0;
  activeProjection.npcPosterior[0].probability = 0;

  assert.notEqual(active.npcState.pressure, 0);
  assert.notEqual(active.npcPosterior[0].probability, 0);
  assert.equal(activeProjection.truth, null);

  const settled = resolveTurn(lacquerBoxCase, start("hidden-treasure"), {
    kind: "reject",
  });
  const settledProjection = buildDeveloperProjection(lacquerBoxCase, settled);

  assert.equal(settledProjection.truth?.id, "hidden-treasure");
  assert.notEqual(settledProjection.lastTrace, null);
  assert.notEqual(settledProjection.lastTrace, settled.actionHistory.at(-1));
});

test("player-facing app components route safe player props instead of WorldState", async () => {
  const [hifiSource, appSource] = await Promise.all([
    readFile(new URL("../hifi/HighFidelityApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  for (const component of ["Investigation", "ResultScreen", "Trade", "Review"]) {
    const signature = new RegExp(`function ${component}\\([\\s\\S]{0,900}?\\) \\{`);
    const match = hifiSource.match(signature);
    assert.ok(match, `${component} signature was not found`);
    assert.doesNotMatch(match[0], /\bworld\b|WorldState/);
  }
  assert.doesNotMatch(hifiSource, /<(Investigation|ResultScreen|Trade|Review)[\s\S]{0,500}\bworld=\{world\}/);
  assert.match(hifiSource, /const playerView = useMemo\([\s\S]+buildPlayerView/);
  assert.match(hifiSource, /const developer = useMemo\([\s\S]+buildDeveloperProjection/);

  assert.match(appSource, /const playerView = useMemo\([\s\S]+buildPlayerView/);
  assert.match(appSource, /const developer = useMemo\([\s\S]+buildDeveloperProjection/);
  assert.doesNotMatch(appSource, /<DebugRail\s+state=\{worldState\}/);

  const executableHifi = hifiSource
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const executableApp = appSource
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(executableHifi, /\bworld\.(?!settlement\b)/);
  assert.doesNotMatch(executableApp, /\bworldState\./);
});
