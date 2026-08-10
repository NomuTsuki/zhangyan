import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import {
  createInitialWorldState,
  getNpcPricing,
  resolveTurn,
} from "../game/resolve-action.ts";
import { buildDeveloperProjection } from "../game/projections.ts";
import {
  buildEvidenceDisclosure,
  buildPlayerPresentation,
  buildPlayerView,
  buildPlayerResources,
  buildSettlementCard,
  describeNpcAtmosphere,
  summarizeTurnForPlayer,
} from "../hifi/presentation.ts";

function start(variant = "restored-genuine") {
  return createInitialWorldState(lacquerBoxCase, 20260723, variant);
}

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}

async function renderReview(world, playerSettlement) {
  const server = await createServer({
    configFile: false,
    logLevel: "error",
    plugins: [
      {
        name: "expose-review-for-render-test",
        enforce: "pre",
        transform(source, id) {
          if (!id.endsWith("/hifi/HighFidelityApp.tsx")) return null;
          return `${source}\nexport { Review as __testReview };`;
        },
      },
    ],
    server: { middlewareMode: true },
  });

  try {
    const { __testReview: Review } = await server.ssrLoadModule(
      "/hifi/HighFidelityApp.tsx",
    );
    const player = buildPlayerView(lacquerBoxCase, world);
    return renderToStaticMarkup(
      createElement(Review, {
        player,
        playerSettlement,
        onRestart: () => {},
      }),
    );
  } finally {
    await server.close();
  }
}

async function renderTeacherRail(developer) {
  const server = await createServer({
    configFile: false,
    logLevel: "error",
    plugins: [
      {
        name: "expose-teacher-rail-for-render-test",
        enforce: "pre",
        transform(source, id) {
          if (!id.endsWith("/hifi/HighFidelityApp.tsx")) return null;
          return `${source}\nexport { TeacherRail as __testTeacherRail };`;
        },
      },
    ],
    server: { middlewareMode: true },
  });

  try {
    const { __testTeacherRail: TeacherRail } = await server.ssrLoadModule(
      "/hifi/HighFidelityApp.tsx",
    );
    return renderToStaticMarkup(createElement(TeacherRail, { developer }));
  } finally {
    await server.close();
  }
}

async function renderTrade(player, offerInput) {
  const server = await createServer({
    configFile: false,
    logLevel: "error",
    plugins: [
      {
        name: "expose-trade-for-render-test",
        enforce: "pre",
        transform(source, id) {
          if (!id.endsWith("/hifi/HighFidelityApp.tsx")) return null;
          return `${source}\nexport { Trade as __testTrade };`;
        },
      },
    ],
    server: { middlewareMode: true },
  });

  try {
    const { __testTrade: Trade } = await server.ssrLoadModule(
      "/hifi/HighFidelityApp.tsx",
    );
    return renderToStaticMarkup(
      createElement(Trade, {
        player,
        offerInput,
        notice: "",
        onOfferInput: () => {},
        onQuote: () => {},
        onBuy: () => {},
        onReject: () => {},
        onBack: () => {},
      }),
    );
  } finally {
    await server.close();
  }
}

test("trade recommendation, input, and submitted action stay synchronized after state changes", async () => {
  const initial = start("restored-genuine");
  const inspectedSurface = resolveTurn(lacquerBoxCase, initial, {
    kind: "inspect",
    targetId: "surface",
  });
  const repricedReference = resolveTurn(lacquerBoxCase, inspectedSurface, {
    kind: "inspect",
    targetId: "bottom",
  });
  const playerViews = [initial, repricedReference].map((state) =>
    buildPlayerView(lacquerBoxCase, state),
  );

  assert.deepEqual(
    playerViews.map((player) => player.reference.offer),
    [10, 55],
  );
  for (const player of playerViews) {
    const offerInput = String(player.reference.offer);
    const html = await renderTrade(player, offerInput);
    assert.match(
      html,
      new RegExp(`reference-offer[\\s\\S]*?<strong>${offerInput}</strong>`),
    );
    assert.match(html, new RegExp(`<input[^>]+value="${offerInput}"`));
  }

  const source = await readFile(
    new URL("../hifi/HighFidelityApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /function offerInputForPlayerView\([\s\S]{0,200}?String\(player\.reference\.offer\)/,
  );
  assert.match(
    source,
    /useState\(\(\) =>[\s\S]{0,120}?offerInputForPlayerView\([\s\S]{0,120}?buildPlayerView\(lacquerBoxCase, world\)/,
  );
  assert.match(
    source,
    /const next = resolveTurn[\s\S]{0,240}?setOfferInput\([\s\S]{0,120}?offerInputForPlayerView\([\s\S]{0,120}?buildPlayerView\(lacquerBoxCase, next\)/,
  );
  assert.match(
    source,
    /function restart[\s\S]{0,500}?setOfferInput\([\s\S]{0,120}?offerInputForPlayerView\([\s\S]{0,120}?buildPlayerView\(lacquerBoxCase, next\)/,
  );
  assert.match(
    source,
    /onQuote=\{\(\) => perform\(\{ kind: "discount", offer: Number\(offerInput\) \}\)\}/,
  );
  assert.doesNotMatch(source, /useState\("60"\)|setOfferInput\("60"\)/);
});

test("player presentation never exposes hidden truth or exact NPC state fields", () => {
  const state = start("hidden-treasure");
  const presentation = buildPlayerPresentation(lacquerBoxCase, state);
  const keys = collectKeys(presentation);
  const serialized = JSON.stringify(presentation);

  for (const forbiddenKey of [
    "truthVariantId",
    "trueValue",
    "npcState",
    "pressure",
    "trust",
    "dealIntent",
    "control",
    "posterior",
    "formula",
    "spindle",
  ]) {
    assert.equal(
      keys.has(forbiddenKey),
      false,
      `player presentation leaked ${forbiddenKey}`,
    );
  }
  assert.doesNotMatch(serialized, /hidden-treasure|被低估的珍品/);
  assert.equal(presentation.settlement, null);
});

test("NPC atmosphere is qualitative and does not return exact state values", () => {
  const relaxed = describeNpcAtmosphere(lacquerBoxCase.initialNpcState);
  const strained = describeNpcAtmosphere({
    pressure: 82,
    trust: 28,
    dealIntent: 24,
    control: 33,
    phase: "pressured",
  });

  assert.deepEqual(relaxed, {
    level: "open",
    label: "气氛尚可",
    detail: "卖家愿意继续说明，交流仍有余地。",
  });
  assert.deepEqual(strained, {
    level: "strained",
    label: "气氛紧绷",
    detail: "卖家明显提高戒备，继续施压可能让交易中断。",
  });
  assert.equal(
    Object.values(strained).some((value) => typeof value === "number"),
    false,
  );
});

test("turn summary keeps seller words and public price feedback but omits rule traces", () => {
  const inspected = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "joint",
  });
  const challenged = resolveTurn(lacquerBoxCase, inspected, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const summary = summarizeTurnForPlayer(challenged.actionHistory.at(-1));
  const keys = collectKeys(summary);

  assert.ok(summary);
  assert.equal(summary.title.length > 0, true);
  assert.equal(summary.sellerWords.length > 0, true);
  assert.equal(summary.observations.length > 0, true);
  assert.equal(summary.newEvidenceCount, 1);
  assert.equal(keys.has("changes"), false);
  assert.equal(keys.has("formulaLog"), false);
  assert.equal(keys.has("spindle"), false);
  if (summary.priceUpdate) {
    assert.equal(summary.priceUpdate.reason.length > 0, true);
    assert.equal(Number.isFinite(summary.priceUpdate.before), true);
    assert.equal(Number.isFinite(summary.priceUpdate.after), true);
  }
});

test("resource cards separate investigation points from bargaining capacity", () => {
  const initial = start();
  const initialResources = buildPlayerResources(lacquerBoxCase, initial);

  assert.deepEqual(initialResources.investigation, {
    id: "investigation",
    label: "调查行动点",
    remaining: 6,
    total: 6,
    usage: "检查、询问与专项检测使用",
    status: "available",
  });
  assert.deepEqual(initialResources.bargaining, {
    id: "bargaining",
    label: "议价容量",
    remaining: 5,
    total: 5,
    usage: "每次正式报价消耗 1 点",
    status: "preview",
  });

  const pricing = getNpcPricing(lacquerBoxCase, initial);
  const negotiated = resolveTurn(lacquerBoxCase, initial, {
    kind: "discount",
    offer: pricing.acceptLine - 4,
  });
  const afterOffer = buildPlayerResources(lacquerBoxCase, negotiated);

  assert.equal(afterOffer.investigation.remaining, 6);
  assert.equal(afterOffer.bargaining.remaining, 4);
  assert.equal(afterOffer.bargaining.total, 5);
  assert.equal(afterOffer.bargaining.status, "active");
});

test("evidence disclosure lists concrete discovered evidence as the only shareable unit", () => {
  const first = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "joint",
  });
  const second = resolveTurn(lacquerBoxCase, first, {
    kind: "inspect",
    targetId: "interior",
  });
  const shared = resolveTurn(lacquerBoxCase, second, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const disclosure = buildEvidenceDisclosure(lacquerBoxCase, shared);

  assert.equal(disclosure.unit, "specific-evidence");
  assert.deepEqual(
    disclosure.items
      .filter((item) => item.visibility === "shared")
      .map((item) => item.id),
    ["modern-adhesive-trace"],
  );
  assert.deepEqual(
    disclosure.items
      .filter((item) => item.visibility === "private")
      .map((item) => item.id),
    ["restored-interior"],
  );
  assert.deepEqual(
    disclosure.items
      .filter((item) => item.canDisclose)
      .map((item) => item.id),
    ["restored-interior"],
  );
  assert.equal(
    collectKeys(disclosure).has("disclosureFrame"),
    false,
  );
});

test("settlement card exposes D—SSS grades without hidden truth identifiers or values", () => {
  const visible = {
    ...start("restored-genuine"),
    discoveredEvidenceIds: ["restored-bottom"],
  };
  const settled = resolveTurn(lacquerBoxCase, visible, {
    kind: "reject",
  });
  const card = buildSettlementCard(settled.settlement);
  const keys = collectKeys(card);

  assert.ok(card);
  assert.match(card.overallGrade, /^(D|C|B|A|S|SS|SSS)$/);
  assert.match(card.judgmentReason, /单点|独立佐证/);
  assert.deepEqual(
    card.sections.map((section) => section.label),
    ["器物客观品质", "实际净收益", "议价表现", "判断质量"],
  );
  assert.equal(keys.has("truthVariantId"), false);
  assert.equal(keys.has("trueValue"), false);
  assert.equal(keys.has("objectiveScore"), false);
  assert.equal(keys.has("judgmentScore"), false);
  const serialized = JSON.stringify(card);
  for (const forbidden of [
    "judgmentBreakdown",
    "decisionScore",
    "certaintyScore",
    "robustnessScore",
    "rawScore",
    "baseGrade",
    "evidenceCap",
    "dominantVariantId",
    "supportingSignalIds",
    "independentSourceGroups",
    "coveredDimensions",
    "missingDimensions",
    "crossValidated",
    "decisiveEvidenceId",
    "sssEligible",
    "capApplied",
    "capReason",
    "formula",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden));
  }
  assert.doesNotMatch(
    serialized,
    /restored-genuine|旧胎重修真品/,
  );
});

test("rendered Review judgment card consumes the player settlement projection", async () => {
  const settled = resolveTurn(lacquerBoxCase, start("restored-genuine"), {
    kind: "reject",
  });
  const baseCard = buildSettlementCard(settled.settlement);
  assert.ok(baseCard);
  const playerSettlement = {
    ...baseCard,
    judgmentReason: "SAFE_JUDGMENT_REASON",
    sections: baseCard.sections.map((section) =>
      section.id === "judgment" ? { ...section, grade: "D" } : section,
    ),
  };
  const world = {
    ...settled,
    settlement: {
      ...settled.settlement,
      judgmentGrade: "SSS",
      judgmentLabel: "UNSAFE_JUDGMENT_LABEL",
      judgmentBreakdown: {
        ...settled.settlement.judgmentBreakdown,
        decisionScore: 91,
        certaintyScore: 92,
        robustnessScore: 93,
        rawScore: 94,
        dominantVariantId: "UNSAFE_DOMINANT_VARIANT",
        independentSourceGroups: ["UNSAFE_SOURCE_GROUP"],
        coveredDimensions: ["UNSAFE_COVERED_DIMENSION"],
        missingDimensions: ["UNSAFE_MISSING_DIMENSION"],
        decisiveEvidenceId: "UNSAFE_DECISIVE_EVIDENCE",
        sssEligible: true,
        formula: ["UNSAFE_BREAKDOWN_FORMULA"],
      },
    },
  };

  const html = await renderReview(world, playerSettlement);

  assert.match(html, /SAFE_JUDGMENT_REASON/);
  for (const forbidden of [
    "UNSAFE_JUDGMENT_LABEL",
    "UNSAFE_DOMINANT_VARIANT",
    "UNSAFE_SOURCE_GROUP",
    "UNSAFE_COVERED_DIMENSION",
    "UNSAFE_MISSING_DIMENSION",
    "UNSAFE_DECISIVE_EVIDENCE",
    "UNSAFE_BREAKDOWN_FORMULA",
    "91",
    "92",
    "93",
    "94",
  ]) {
    assert.doesNotMatch(html, new RegExp(forbidden));
  }
});

test("rendered developer rail consumes a developer projection instead of WorldState", async () => {
  const state = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "joint",
  });
  const developer = buildDeveloperProjection(lacquerBoxCase, state);
  developer.npcState.pressure = 17;
  const unsafeWorld = {
    ...state,
    npcState: { ...state.npcState, pressure: 99 },
  };

  const html = await renderTeacherRail(developer, unsafeWorld);

  assert.match(html, />17</);
  assert.doesNotMatch(html, />99</);
});

test("developer rail restores settled judgment diagnostics from DeveloperProjection", async () => {
  const settled = resolveTurn(lacquerBoxCase, start(), { kind: "reject" });
  const developer = buildDeveloperProjection(lacquerBoxCase, settled);

  const html = await renderTeacherRail(developer);

  for (const label of [
    "决策合理性 D",
    "后验确定性 C",
    "证据稳健度 R",
    "证据上限",
    "缺失维度",
  ]) {
    assert.match(html, new RegExp(label));
  }
});

test("developer rail keeps judgment diagnostics closed before settlement", async () => {
  const developer = buildDeveloperProjection(lacquerBoxCase, start());

  const html = await renderTeacherRail(developer);

  for (const label of [
    "判断质量拆解",
    "决策合理性 D",
    "后验确定性 C",
    "证据稳健度 R",
    "证据上限",
    "缺失维度",
  ]) {
    assert.doesNotMatch(html, new RegExp(label));
  }
});
