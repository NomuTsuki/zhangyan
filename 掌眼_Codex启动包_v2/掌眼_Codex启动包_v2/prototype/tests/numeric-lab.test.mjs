import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const labUrl = new URL("../public/掌眼_数值实验台.html", import.meta.url);

async function loadLab() {
  const html = await readFile(labUrl, "utf8");
  const modelMatch = html.match(/<script id="simulation-model">([\s\S]*?)<\/script>/i);
  assert.ok(modelMatch, "simulation model script should exist");

  const sandbox = {
    console,
    Math,
    JSON,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Map,
    Set,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(modelMatch[1], sandbox, { filename: "numeric-lab-model.js" });
  return { html, Model: sandbox.ZhangyanNumericLabModel };
}

test("numeric lab is a self-contained development surface", async () => {
  const { html } = await loadLab();

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<title>掌眼｜规则与定价数值实验台<\/title>/);
  assert.match(html, /五档价值参数表/);
  assert.match(html, /保守收购上限/);
  assert.match(html, /有限议价：行为分支与可达性/);
  assert.match(html, /双后验与有代价的信息公开/);
  assert.match(html, /验证门槛/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i);

  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 2, "expected one model script and one UI script");
  for (const script of scripts) {
    assert.doesNotThrow(() => new Function(script[1]));
  }
});

test("batch simulation is deterministic and respects core boundaries", async () => {
  const { Model } = await loadLab();
  const config = Model.makeDefaultConfig();
  config.runs = 1600;

  const first = Model.runBatch(config);
  const second = Model.runBatch(config);

  assert.deepEqual(first.gradeRates, second.gradeRates);
  assert.deepEqual(first.strategySummaries, second.strategySummaries);
  assert.equal(first.safeMedian, second.safeMedian);
  assert.equal(first.quantileCoverage, second.quantileCoverage);
  assert.equal(first.capCoverage, second.capCoverage);
  assert.equal(first.deadlocks, 0);
  assert.equal(second.deadlocks, 0);

  const normalSum = first.scenario.normalWeights.reduce((sum, value) => sum + value, 0);
  const eventSum = first.scenario.eventWeights.reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(normalSum - 1) < 1e-10);
  assert.ok(Math.abs(eventSum - 1) < 1e-10);
  assert.ok(first.scenario.priorQ20 <= first.scenario.priorQ50);
  assert.ok(first.safeMedian >= 0);
  assert.ok(first.quantileCoverage >= 0 && first.quantileCoverage <= 1);
  assert.ok(Math.abs(first.quantileCoverage - (1 - config.riskQuantile)) < 0.06);
  assert.equal(first.quantileCoverageTotal, config.runs);
  assert.equal(first.capCoverageEligible, config.runs - first.safeZeroCount);
  assert.ok(first.capCoverage === null || (first.capCoverage >= 0 && first.capCoverage <= 1));

  for (const summary of first.strategySummaries) {
    assert.ok(Number.isFinite(summary.meanNet));
    assert.ok(Number.isFinite(summary.medianNet));
    assert.ok(summary.dealRate >= 0 && summary.dealRate <= 1);
    assert.ok(summary.lossRateAmongDeals >= 0 && summary.lossRateAmongDeals <= 1);
    assert.ok(summary.averageFormalOffers >= 0 && summary.averageFormalOffers <= 3);
    assert.ok(summary.averageOffersPerStarted >= 0 && summary.averageOffersPerStarted <= 3);
    assert.ok(summary.multiRoundRate >= 0 && summary.multiRoundRate <= 1);
    assert.equal(
      Object.values(summary.branchCounts).reduce((sum, value) => sum + value, 0),
      summary.npcResponses,
    );
    assert.equal(
      Object.values(summary.terminalCounts).reduce((sum, value) => sum + value, 0)
        + summary.unresolvedCount,
      config.runs,
    );
  }

  const opening = first.strategySummaries.find((summary) => summary.key === "opening");
  assert.equal(opening.npcResponses, 0, "player accepting the opening is not an NPC response");
  assert.equal(opening.playerActionCounts.acceptOpening, config.runs);
});

test("market event thickens both tails and reachability includes all four behaviors", async () => {
  const { Model } = await loadLab();
  const config = Model.makeDefaultConfig();
  const scenario = Model.scenarioFromConfig(config);

  const normalFake = scenario.normalWeights[0] + scenario.normalWeights[1];
  const eventFake = scenario.eventWeights[0] + scenario.eventWeights[1];
  assert.ok(eventFake > normalFake);
  assert.ok(scenario.eventWeights.at(-1) > scenario.normalWeights.at(-1));

  const reachability = Model.buildReachability(config);
  assert.deepEqual(
    [...new Set(reachability.seen)].sort(),
    ["accept", "counter", "exit", "reject"],
  );
});

test("all evidence tuples are enumerated and their grouped probability remains one", async () => {
  const { Model } = await loadLab();

  for (const evidence of ["low", "medium", "high"]) {
    const config = Model.makeDefaultConfig();
    config.evidence = evidence;
    const scenario = Model.scenarioFromConfig(config);
    const rows = Model.buildSignalRows(config, scenario);
    const expectedCombinations = 5 ** Model.EVIDENCE_PROFILES[evidence].taus.length;

    assert.equal(
      rows.reduce((sum, row) => sum + row.combinationCount, 0),
      expectedCombinations,
    );
    assert.ok(Math.abs(rows.reduce((sum, row) => sum + row.probability, 0) - 1) < 1e-10);
    assert.equal(new Set(rows.map((row) => row.signalIndex)).size, rows.length);
    for (const row of rows) {
      assert.ok(row.probability > 0);
      assert.ok(Math.abs(row.weights.reduce((sum, value) => sum + value, 0) - 1) < 1e-10);
      assert.equal(row.weights[row.signalIndex], Math.max(...row.weights));
    }
  }
});

test("terminal fallback works at AP boundaries and player actions do not pollute NPC branches", async () => {
  const { Model } = await loadLab();

  for (const remainingAP of [0, 1, 4]) {
    const config = Model.makeDefaultConfig();
    config.runs = 360;
    config.remainingAP = remainingAP;
    const result = Model.runBatch(config);

    assert.equal(result.deadlocks, 0);
    assert.equal(
      result.deadlocks,
      result.strategySummaries.reduce((sum, summary) => sum + summary.unresolvedCount, 0),
    );
    for (const summary of result.strategySummaries) {
      assert.equal(
        Object.values(summary.terminalCounts).reduce((sum, value) => sum + value, 0),
        config.runs,
      );
    }
  }

  assert.equal(Model.isTerminalRecord({ terminal: null }), false);
  assert.equal(Model.isTerminalRecord({
    terminal: { reached: true, outcome: "noDeal", actor: "player", reason: "playerWalkedAway" },
  }), true);
});

test("NPC flexibility affects counters and directed evidence support stays bounded", async () => {
  const { Model } = await loadLab();
  const config = Model.makeDefaultConfig();
  const baseProfile = Model.NPC_PROFILES.collector;
  const responseInput = {
    offer: 50,
    currentAsk: 100,
    baseFloor: 60,
    state: { trust: 60, pressure: 35, intent: 65, control: 58 },
    evidenceSupport: 0.4,
    roundIndex: 1,
    patienceAfter: 1,
    tick: 2,
  };
  const rigid = Model.chooseResponse({ ...responseInput, profile: { ...baseProfile, flexibility: 0.10 } });
  const flexible = Model.chooseResponse({ ...responseInput, profile: { ...baseProfile, flexibility: 0.50 } });

  assert.equal(rigid.branch, "counter");
  assert.equal(flexible.branch, "counter");
  assert.ok(flexible.counter < rigid.counter);
  assert.ok(flexible.counter >= flexible.nextLine);

  const scenario = Model.scenarioFromConfig(config);
  const downward = Model.offerSupport(config, scenario, { q50: scenario.priorQ50 * 0.4 });
  const upward = Model.offerSupport(config, scenario, { q50: scenario.priorQ50 * 1.6 });
  assert.ok(downward > 0 && downward <= 1);
  assert.equal(upward, 0);
});

test("dual-posterior batch is deterministic and all five disclosure policies terminate cleanly", async () => {
  const { Model } = await loadLab();
  const config = Model.makeDefaultDisclosureConfig();
  config.runs = 96;
  config.seed = "dual-contract-20260724";

  const first = Model.runDisclosureBatch(config);
  const second = Model.runDisclosureBatch(config);
  const strategyKeys = Object.keys(Model.DISCLOSURE_STRATEGIES).sort();

  assert.deepEqual(first, second);
  assert.equal(first.summaries.length, 5);
  assert.deepEqual(first.summaries.map((summary) => summary.key).sort(), strategyKeys);
  assert.equal(first.deadlocks, 0);
  assert.equal(first.duplicateSources, 0);
  for (const summary of first.summaries) {
    assert.equal(summary.terminalRate, 1);
    assert.equal(summary.duplicateSources, 0);
    assert.ok(summary.dealRate >= 0 && summary.dealRate <= 1);
    assert.ok(summary.riskTransferDealRate >= 0 && summary.riskTransferDealRate <= 1);
  }
});

test("dual-posterior policies keep beliefs normalized, isolate truth, and expose the NPC matrix", async () => {
  const { Model } = await loadLab();
  const config = Model.makeDefaultDisclosureConfig();
  config.runs = 72;
  config.seed = "dual-matrix-20260724";
  const experiment = Model.runDisclosureExperiment(config);

  assert.equal(Model.dualTruthIsolationProbe(config), true);
  assert.deepEqual(
    experiment.matrix.map((row) => row.npcKey).sort(),
    Object.keys(Model.DISCLOSURE_NPCS).sort(),
  );

  for (const strategyKey of Object.keys(Model.DISCLOSURE_STRATEGIES)) {
    const result = Model.runDisclosurePolicy(experiment.traceCase, config, strategyKey);
    assert.equal(result.terminalReached, true);
    assert.equal(result.duplicatePlayerSources, 0);
    assert.equal(result.duplicateNpcSources, 0);

    for (const posterior of [result.playerPosterior, result.npcPosterior]) {
      assert.ok(posterior.every((weight) => Number.isFinite(weight) && weight >= 0));
      assert.ok(Math.abs(posterior.reduce((sum, weight) => sum + weight, 0) - 1) < 1e-10);
    }
  }

  for (const row of experiment.matrix) {
    assert.equal(row.deadlocks, 0);
    assert.equal(row.summaries.length, 5);
    const buyout = row.summaries.find((summary) => summary.key === "buyout");
    assert.ok(buyout);
    assert.ok(Number.isFinite(buyout.meanNet));
    assert.ok(buyout.riskTransferDealRate >= 0 && buyout.riskTransferDealRate <= 1);
  }
});
