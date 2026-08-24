(() => {
  "use strict";

  const CASE = window.__ZHANGYAN_CASE__;
  const TRUTH_ID = "restored-genuine";
  const truthVariantIds = ["counterfeit", "restored-genuine", "hidden-treasure"];
  const progress = [
    ["home", "开店"],
    ["arrival", "来客"],
    ["investigate", "调查"],
    ["trade", "交易"],
    ["review", "复盘"],
  ];
  const phaseLabels = {
    relaxed: "放松",
    cautious: "谨慎",
    pressured: "受压",
    negotiating: "议价",
    exited: "离场",
  };
  const toneLabels = {
    gentle: "温和",
    professional: "专业",
    firm: "强硬",
  };
  const evidencePower = { weak: 0.7, medium: 1, strong: 1.3, anchor: 1.6 };
  const tonePressure = { gentle: 0.72, professional: 1, firm: 1.25 };
  const behaviorLabels = {
    cooperate: "补充说明",
    deflect: "模糊回应",
    "partial-admit": "部分承认",
    counter: "反向质疑",
    refuse: "拒绝回答",
    exit: "结束交易",
  };
  const stateLabels = {
    pressure: "压力",
    trust: "信任",
    dealIntent: "成交意愿",
    control: "控制感",
  };
  const toneOptions = [
    ["gentle", "温和", "更容易建立信任", "可能保留对方控制感"],
    ["professional", "专业", "证据与关系较平衡", "无依据时推进有限"],
    ["firm", "强硬", "快速增加压力", "信任和成交意愿下降"],
  ];

  const appRoot = document.querySelector("#app-root");
  const progressRoot = document.querySelector("#progress-root");
  const debugRoot = document.querySelector("#debug-root");

  const ui = {
    screen: "home",
    selectedTargetId: "surface",
    selectedTopicId: "repair-history",
    selectedTone: "professional",
    selectedDisclosureFrame: "neutral",
    selectedEvidenceId: "",
    offerInput: "",
    evidenceReturnScreen: "investigate",
    feedback: "",
  };

  let world = initialWorld();

  function initialWorld() {
    return {
      caseId: CASE.id,
      seed: CASE.seed,
      truthVariantId: TRUTH_ID,
      npcProfileId: CASE.npcProfile.id,
      status: "active",
      turn: 0,
      actionPoints: CASE.actionBudget,
      feesPaid: 0,
      currentPrice: CASE.seller.openingPrice,
      npcState: { ...CASE.initialNpcState },
      discoveredEvidenceIds: [],
      sharedEvidenceIds: [],
      npcPosterior: calculateNpcPosterior([]),
      priceHistory: [],
      inspectedTargetIds: [],
      completedTestIds: [],
      statementHistory: [],
      triggeredStoryletIds: [],
      actionHistory: [],
      settlement: null,
    };
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededUnit(seed, turn, key) {
    let value = (seed ^ hashString(key) ^ Math.imul(turn + 1, 2654435761)) >>> 0;
    value = (value ^ (value >>> 16)) >>> 0;
    value = Math.imul(value, 2246822507) >>> 0;
    value = (value ^ (value >>> 13)) >>> 0;
    value = Math.imul(value, 3266489909) >>> 0;
    value = (value ^ (value >>> 16)) >>> 0;
    return value / 4294967296;
  }

  function jitter(seed, turn, key) {
    return round1((seededUnit(seed, turn, `behavior:${key}`) - 0.5) * 3);
  }

  function pressureDecay(pressure) {
    if (pressure <= 40) return 1;
    if (pressure <= 70) return 0.75;
    return 0.5;
  }

  function phaseFor(state) {
    if (state.phase === "exited") return "exited";
    if (state.pressure >= 65) return "pressured";
    if (state.pressure >= 42 || state.trust < 46) return "cautious";
    return "relaxed";
  }

  function snapshot(state) {
    return {
      actionPoints: state.actionPoints,
      feesPaid: state.feesPaid,
      currentPrice: state.currentPrice,
      npcState: { ...state.npcState },
      evidenceCount: state.discoveredEvidenceIds.length,
      sharedEvidenceCount: state.sharedEvidenceIds.length,
      npcPosterior: state.npcPosterior.map((entry) => ({ ...entry })),
    };
  }

  function addTurn(before, next, data) {
    const turn = before.turn + 1;
    const record = {
      turn,
      before: snapshot(before),
      after: snapshot(next),
      ...data,
    };
    next.turn = turn;
    next.actionHistory = [...before.actionHistory, record];
    return next;
  }

  function makeChange(key, state, requestedDelta, reasons, formula) {
    const before = state[key];
    const after = clamp(before + requestedDelta);
    return {
      key,
      label: stateLabels[key],
      before,
      delta: after - before,
      after,
      reasons,
      formula,
    };
  }

  function applyChanges(initial, definitions) {
    const next = { ...initial };
    const changes = [];
    definitions.forEach((definition) => {
      const change = makeChange(
        definition.key,
        next,
        definition.delta,
        definition.reasons,
        definition.formula,
      );
      next[definition.key] = change.after;
      changes.push(change);
    });
    next.phase = phaseFor(next);
    return { next, changes };
  }

  function actionCost(action) {
    if (action.kind === "buy" || action.kind === "reject") return 0;
    if (action.kind === "test") return CASE.test.actionPointCost;
    return 1;
  }

  function ensureAllowed(state, action) {
    if (state.status !== "active") throw new Error("本局已经结束");
    if (state.npcState.phase === "exited") throw new Error("卖家已经离场");
    const cost = actionCost(action);
    if (state.actionPoints < cost) {
      throw new Error(`行动点不足：需要 ${cost}，当前 ${state.actionPoints}`);
    }
  }

  function posterior(evidenceIds, statementHistory = []) {
    const independentEvidenceIds = [...new Set(evidenceIds)].filter(
      (evidenceId) => CASE.evidence[evidenceId]?.kind !== "statement",
    );
    const uniqueSignals = [
      ...new Map(statementHistory.map((statement) => [statement.signalId, statement])).values(),
    ];
    const weights = truthVariantIds.map((variantId) => ({
      variantId,
      weight: independentEvidenceIds.reduce(
        (product, evidenceId) =>
          product * (CASE.evidence[evidenceId]?.likelihoods[variantId] ?? 1),
        1 / truthVariantIds.length,
      ) * uniqueSignals.reduce(
        (product, statement) =>
          product
          * Math.pow(
            Math.max(0.0001, statement.likelihoods[variantId] ?? 1),
            statement.confidence ?? 1,
          ),
        1,
      ),
    }));
    const total = weights.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    return weights.map((entry) => ({
      variantId: entry.variantId,
      label: CASE.truthVariants[entry.variantId].label,
      probability: entry.weight / total,
      trueValue: CASE.truthVariants[entry.variantId].trueValue,
    }));
  }

  function normalizePosterior(rawWeights) {
    const total = rawWeights.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    return rawWeights.map(({ variantId, weight }) => ({
      variantId,
      label: CASE.truthVariants[variantId].label,
      probability: weight / total,
      trueValue: CASE.truthVariants[variantId].trueValue,
    }));
  }

  function calculateNpcPosterior(sharedEvidenceIds) {
    const uniqueSharedEvidenceIds = [...new Set(sharedEvidenceIds)].filter(
      (evidenceId) => CASE.evidence[evidenceId]?.kind !== "statement",
    );
    const rawWeights = truthVariantIds.map((variantId) => {
      const privateWeight = CASE.npcProfile.privateSignals.reduce(
        (product, signal) =>
          product
          * Math.pow(
            Math.max(0.0001, signal.likelihoods[variantId]),
            signal.confidence,
          ),
        1 / truthVariantIds.length,
      );
      const sharedWeight = uniqueSharedEvidenceIds.reduce((product, evidenceId) => {
        const likelihood = CASE.evidence[evidenceId]?.likelihoods[variantId] ?? 1;
        return product
          * Math.pow(
            Math.max(0.0001, likelihood),
            CASE.npcProfile.expertise,
          );
      }, 1);
      return {
        variantId,
        weight: privateWeight * sharedWeight,
      };
    });
    return normalizePosterior(rawWeights);
  }

  function posteriorExpectedValue(entries) {
    return entries.reduce(
      (sum, entry) => sum + entry.probability * entry.trueValue,
      0,
    );
  }

  function posteriorQuantile(entries, quantile) {
    const ordered = [...entries].sort(
      (left, right) => left.trueValue - right.trueValue,
    );
    let cumulative = 0;
    for (const entry of ordered) {
      cumulative += entry.probability;
      if (cumulative >= quantile) return entry.trueValue;
    }
    return ordered.at(-1)?.trueValue ?? 0;
  }

  function posteriorEntropy(entries) {
    return entries.reduce(
      (sum, entry) =>
        entry.probability > 0
          ? sum - entry.probability * Math.log2(entry.probability)
          : sum,
      0,
    );
  }

  function roundToTick(value, tick = 5) {
    return Math.max(tick, Math.round(value / tick) * tick);
  }

  function ceilToTick(value, tick = 5) {
    return Math.max(tick, Math.ceil(value / tick) * tick);
  }

  function floorToTick(value, tick = 5) {
    return Math.max(tick, Math.floor(value / tick) * tick);
  }

  function npcStance(npcState) {
    const controlFit = 100 - Math.abs(npcState.control - 50);
    const score = round1(
      npcState.trust * 0.4
      + npcState.dealIntent * 0.35
      + (100 - npcState.pressure) * 0.15
      + controlFit * 0.1,
    );
    const stance =
      score >= 68 ? "cooperative"
        : score >= 52 ? "neutral"
          : score >= 38 ? "guarded" : "resistant";
    return { stance, score };
  }

  function npcPricing(state) {
    const entries = state.npcPosterior;
    const q10 = posteriorQuantile(entries, 0.1);
    const q25 = posteriorQuantile(entries, 0.25);
    const q50 = posteriorQuantile(entries, 0.5);
    const q75 = posteriorQuantile(entries, 0.75);
    const expectedValue = posteriorExpectedValue(entries);
    const subjectiveCenter = q50 * 0.6 + expectedValue * 0.4;
    const spread = Math.max(0, (q75 - q25) / 2);
    const profile = CASE.npcProfile;
    const outsideOption = Math.max(profile.outsideOption, q10 * 0.8);
    const certaintyEquivalent = Math.max(
      outsideOption,
      subjectiveCenter
        - profile.riskAversion * 0.25 * spread
        - profile.urgency * 0.06 * subjectiveCenter,
    );
    const { stance, score: stanceScore } = npcStance(state.npcState);
    const stanceMultipliers = {
      cooperative: 0.94,
      neutral: 1,
      guarded: 1.08,
      resistant: 1.2,
    };
    const stanceMultiplier = stanceMultipliers[stance];
    const uncappedAcceptLine = ceilToTick(
      Math.max(outsideOption, certaintyEquivalent * stanceMultiplier),
    );
    const acceptLine = Math.min(state.currentPrice, uncappedAcceptLine);
    const certaintyDiscount =
      profile.riskAversion
      * profile.urgency
      * Math.max(0, q75 - q25)
      * 0.08;
    const buyoutLine = Math.min(
      acceptLine,
      floorToTick(Math.max(outsideOption, acceptLine - certaintyDiscount)),
    );
    const targetAsk = Math.max(
      acceptLine,
      roundToTick(
        Math.max(
          outsideOption,
          subjectiveCenter * (1 + profile.markup) * stanceMultiplier,
        ),
      ),
    );
    return {
      posterior: entries,
      q10,
      q25,
      q50,
      q75,
      expectedValue,
      subjectiveCenter,
      spread,
      entropy: posteriorEntropy(entries),
      outsideOption,
      certaintyEquivalent,
      stance,
      stanceScore,
      stanceMultiplier,
      acceptLine,
      buyoutLine,
      targetAsk,
      formula: [
        `主观中枢 = 0.6×Q50(${q50}) + 0.4×期望值(${round1(expectedValue)}) = ${round1(subjectiveCenter)}`,
        `确定性等价 = max(外部选项${round1(outsideOption)}, 主观中枢${round1(subjectiveCenter)} - 风险折减${round1(profile.riskAversion * 0.25 * spread)} - 急售折减${round1(profile.urgency * 0.06 * subjectiveCenter)}) = ${round1(certaintyEquivalent)}`,
        `普通接受线 = min(当前报价${state.currentPrice}, 向上取整5(max(外部选项, 确定性等价×立场${stanceMultiplier}))) = ${acceptLine}`,
        `无条件买断线 = 向下取整5(max(外部选项, 普通线 - 风险转移折价${round1(certaintyDiscount)})) = ${buyoutLine}`,
      ],
    };
  }

  function playerReferenceOffer(state) {
    const entries = posterior(
      state.discoveredEvidenceIds,
      state.statementHistory,
    );
    const q20 = posteriorQuantile(entries, 0.2);
    const q50 = posteriorQuantile(entries, 0.5);
    const expectedValue = posteriorExpectedValue(entries);
    const safetyMargin = Math.max(5, q50 * 0.08);
    const suggestedOffer = floorToTick(
      Math.max(5, q20 - state.feesPaid - safetyMargin),
    );
    return {
      posterior: entries,
      q20,
      q50,
      expectedValue,
      entropy: posteriorEntropy(entries),
      safetyMargin,
      suggestedOffer,
      formula: `谨慎参考 = 向下取整5(max(5, 后验Q20(${q20}) - 已付检测费${state.feesPaid} - 安全垫${round1(safetyMargin)})) = ${suggestedOffer}`,
    };
  }

  function dominantVariant(entries) {
    return [...entries].sort(
      (left, right) => right.probability - left.probability,
    )[0]?.variantId;
  }

  function refreshNpcPricing(before, next, force = false) {
    if (next.priceHistory.length >= 2) return undefined;
    const beforeExpected = posteriorExpectedValue(before.npcPosterior);
    const afterExpected = posteriorExpectedValue(next.npcPosterior);
    const relativeShift =
      beforeExpected > 0 ? Math.abs(afterExpected / beforeExpected - 1) : 0;
    const beforeMedian = posteriorQuantile(before.npcPosterior, 0.5);
    const afterMedian = posteriorQuantile(next.npcPosterior, 0.5);
    const dominantChanged =
      dominantVariant(before.npcPosterior) !== dominantVariant(next.npcPosterior);
    const beforeStance = npcStance(before.npcState).stance;
    const afterStance = npcStance(next.npcState).stance;
    const stanceChanged = beforeStance !== afterStance;
    if (
      !force
      && relativeShift < 0.08
      && beforeMedian === afterMedian
      && !dominantChanged
      && !stanceChanged
    ) {
      return undefined;
    }

    const pricing = npcPricing(next);
    const repriced = roundToTick(
      next.currentPrice * 0.1 + pricing.targetAsk * 0.9,
    );
    if (repriced === next.currentPrice) return undefined;
    const reasons = [];
    if (force) reasons.push("共同检测产生了双方都能核验的新事实");
    if (relativeShift >= 0.08) {
      reasons.push(`共享信息使卖家主观估值移动${round1(relativeShift * 100)}%`);
    }
    if (dominantChanged || beforeMedian !== afterMedian) {
      reasons.push("卖家对器物最可能类型的判断发生跨档变化");
    }
    if (stanceChanged) {
      reasons.push(`谈判立场由${beforeStance}转为${afterStance}`);
    }
    const event = {
      turn: before.turn + 1,
      before: next.currentPrice,
      after: repriced,
      publicReason: force
        ? "共同检测出现了双方都能核验的新事实，卖家据此重新估价。"
        : afterExpected < beforeExpected
          ? "你公开的新事实让卖家重新考虑修复与价值风险。"
          : afterExpected > beforeExpected
            ? "你公开的新事实让卖家重新评估器物的年代与价值。"
            : "谈判立场发生变化，卖家重新表明当前报价。",
      reasons,
    };
    next.currentPrice = repriced;
    next.priceHistory.push(event);
    return event;
  }

  function calculateSettlement(state, choice, paidPrice, oracleDealFloor) {
    const truth = CASE.truthVariants[state.truthVariantId];
    const acquired =
      choice === "buy"
      || choice === "discount-buy"
      || choice === "buyout-buy";
    const actualNet = (acquired ? truth.trueValue - paidPrice : 0) - state.feesPaid;
    const oracleOptions = [
      { label: "开局直接拒绝", net: 0 },
      {
        label: `按开价${CASE.seller.openingPrice}买下`,
        net: truth.trueValue - CASE.seller.openingPrice,
      },
    ];
    if (oracleDealFloor < CASE.seller.openingPrice) {
      oracleOptions.push({
        label: `完全知情时按${oracleDealFloor}点最低可达买断线成交`,
        net: truth.trueValue - oracleDealFloor,
      });
    }
    const oracleBestNet = Math.max(...oracleOptions.map((option) => option.net));
    const regret = Math.max(0, oracleBestNet - actualNet);
    const stakes = Math.max(CASE.seller.openingPrice, truth.trueValue);
    const objectiveScore = clamp(Math.round(100 - (regret / stakes) * 100));
    const objectiveSuccess = objectiveScore >= 70;
    const objectiveLabel =
      objectiveScore >= 85 ? "客观成功"
        : objectiveScore >= 70 ? "基本成功"
          : objectiveScore >= 40 ? "客观失手" : "重大损失";

    const posteriorEntries = posterior(
      state.discoveredEvidenceIds,
      state.statementHistory,
    );
    const expectedValue = posteriorEntries.reduce(
      (sum, entry) => sum + entry.probability * entry.trueValue,
      0,
    );
    const buyExpectedNet = expectedValue - (paidPrice || state.currentPrice);
    const chosenExpectedNet = acquired ? buyExpectedNet : 0;
    const bestExpectedNet = Math.max(0, buyExpectedNet);
    const utilityGap = Math.max(0, bestExpectedNet - chosenExpectedNet);
    const strongest = Math.max(...posteriorEntries.map((entry) => entry.probability));
    const uniqueStatementCount =
      new Set(state.statementHistory.map((statement) => statement.signalId)).size;
    const independentEvidenceCount = state.discoveredEvidenceIds.filter(
      (evidenceId) => CASE.evidence[evidenceId]?.kind !== "statement",
    ).length;
    const visibleSignalCount = independentEvidenceCount + uniqueStatementCount;
    const uncertaintyPenalty =
      visibleSignalCount === 0 ? 15 : strongest < 0.55 ? 8 : 0;
    const unsupportedPenalty =
      acquired && visibleSignalCount === 0 ? 15 : 0;
    const redundantPenalty =
      state.actionHistory.filter((turn) => turn.redundant).length * 4;
    const exitPenalty = choice === "seller-exited" ? 15 : 0;
    const judgmentScore = clamp(Math.round(
      100 - utilityGap * 3 - uncertaintyPenalty - unsupportedPenalty
      - redundantPenalty - exitPenalty,
    ));
    const judgmentLabel =
      judgmentScore >= 85 ? "证据充分"
        : judgmentScore >= 70 ? "判断合理"
          : judgmentScore >= 50 ? "依据偏弱" : "判断失准";
    const judgmentHigh = judgmentScore >= 70;
    const endingTitle = objectiveSuccess
      ? judgmentHigh ? "真正掌眼" : "侥幸得手"
      : judgmentHigh ? "判断合理，但客观失手" : "看走眼";
    const choiceLabel = {
      buy: "按当前价格买下",
      "discount-buy": "折价成交",
      "buyout-buy": "无条件买断成交",
      "buyout-rejected": "无条件买断被拒",
      reject: "拒绝交易",
      "seller-exited": "卖家离场",
    }[choice];

    return {
      choice,
      choiceLabel,
      truthVariantId: truth.id,
      truthLabel: truth.label,
      trueValue: truth.trueValue,
      paidPrice,
      feesPaid: state.feesPaid,
      actualNet,
      oracleBestNet,
      regret,
      stakes,
      objectiveScore,
      objectiveSuccess,
      objectiveLabel,
      posterior: posteriorEntries,
      expectedValue,
      chosenExpectedNet,
      bestExpectedNet,
      utilityGap,
      judgmentScore,
      judgmentLabel,
      endingTitle,
      objectiveFormula: [
        `实际净结果 = ${acquired ? `${truth.trueValue}（真实价值）- ${paidPrice}（成交价）` : "0（未持有器物）"} - ${state.feesPaid}（检测费） = ${actualNet}`,
        `完全知情可达方案 = ${oracleOptions.map((option) => `${option.label}:${option.net}`).join("；")}`,
        `完全知情最佳净结果 = max(${oracleOptions.map((option) => option.net).join(", ")}) = ${oracleBestNet}`,
        `机会损失 = max(0, ${oracleBestNet} - ${actualNet}) = ${regret}`,
        `客观分 = clamp(round(100 - ${regret} ÷ ${stakes} × 100), 0, 100) = ${objectiveScore}`,
        `客观胜利阈值：${objectiveScore} ${objectiveSuccess ? "≥" : "<"} 70`,
      ],
      judgmentFormula: [
        `玩家可见信号 = ${independentEvidenceCount}条物证/检测 + ${uniqueStatementCount}类NPC陈述（同源陈述卡不重复计权）`,
        `玩家可见期望价值 = Σ(后验概率 × 各真相价值) = ${round1(expectedValue)}`,
        `所选方案期望净值 = ${round1(chosenExpectedNet)}；当前最佳期望净值 = ${round1(bestExpectedNet)}`,
        `效用差 = max(0, ${round1(bestExpectedNet)} - ${round1(chosenExpectedNet)}) = ${round1(utilityGap)}`,
        `判断分 = 100 - 效用差×3 - 不确定性${uncertaintyPenalty} - 无依据风险${unsupportedPenalty} - 重复行动${redundantPenalty} - 离场${exitPenalty} = ${judgmentScore}`,
        "判断质量只读取玩家已发现的物证、检测与NPC陈述信号，不读取本局隐藏真相。",
      ],
    };
  }

  function settle(state, choice, paidPrice, oracleDealFloor) {
    const next = copy(state);
    next.status = "settled";
    next.settlement = calculateSettlement(
      next,
      choice,
      paidPrice,
      oracleDealFloor,
    );
    return next;
  }

  function resolveInspect(state, action) {
    const target = CASE.observationTargets.find((item) => item.id === action.targetId);
    if (!target) throw new Error(`未知观察位置：${action.targetId}`);
    const next = copy(state);
    next.actionPoints -= 1;
    const redundant = state.inspectedTargetIds.includes(target.id);
    const evidenceAdded = [];
    const formulaLog = [`行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`];
    let title = `复查${target.label}，没有出现新的信息`;
    let description = "复查确认了原有观察，但不会重复生成证据。";

    if (!redundant) {
      next.inspectedTargetIds.push(target.id);
      const result = target.results[state.truthVariantId];
      if (!next.discoveredEvidenceIds.includes(result.evidenceId)) {
        next.discoveredEvidenceIds.push(result.evidenceId);
        evidenceAdded.push(result.evidenceId);
      }
      title = result.title;
      description = result.description;
      const roll = seededUnit(state.seed, state.turn + 1, `inspect:${target.id}`);
      const chance = result.bonusChance || 0;
      formulaLog.push(
        `幸运线索判定 = seededRoll(${state.seed}, 第${state.turn + 1}轮, ${target.id}) = ${round1(roll * 100)}%；阈值 ${round1(chance * 100)}%`,
      );
      if (
        result.bonusEvidenceId
        && roll < chance
        && !next.discoveredEvidenceIds.includes(result.bonusEvidenceId)
      ) {
        next.discoveredEvidenceIds.push(result.bonusEvidenceId);
        evidenceAdded.push(result.bonusEvidenceId);
        description += ` 小概率发现：${CASE.evidence[result.bonusEvidenceId].name}。`;
        formulaLog.push(`幸运线索命中：新增锚点证据「${CASE.evidence[result.bonusEvidenceId].name}」`);
      } else {
        formulaLog.push("幸运线索未命中；基础观察事实仍然保留。");
      }
    } else {
      formulaLog.push("重复位置：不重复发放证据，标记为低效行动。");
    }

    return addTurn(state, next, {
      action: { ...action },
      actionLabel: `检查${target.label}`,
      actionPointCost: 1,
      changes: [],
      evidenceAdded,
      title,
      description,
      formulaLog,
      spindle: null,
      redundant,
    });
  }

  function candidate(state, id, eligible, rawComponents, filterReasons) {
    const components = rawComponents.map((component) => ({
      ...component,
      value: round1(component.value),
    }));
    const baseScore = round1(
      components.reduce((sum, component) => sum + component.value, 0),
    );
    const randomJitter = eligible ? jitter(state.seed, state.turn + 1, id) : 0;
    const finalScore = eligible ? round1(baseScore + randomJitter) : -999;
    return {
      id,
      label: behaviorLabels[id],
      eligible,
      components,
      baseScore,
      jitter: randomJitter,
      finalScore,
      score: finalScore,
      formula: eligible
        ? `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore} + seed扰动${randomJitter} = ${finalScore}`
        : `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore}；硬条件过滤`,
      filterReasons,
      reasons: filterReasons,
    };
  }

  function fixedCandidate(id, label, eligible, rawComponents, filterReasons) {
    const components = rawComponents.map((component) => ({
      ...component,
      value: round1(component.value),
    }));
    const baseScore = round1(
      components.reduce((sum, component) => sum + component.value, 0),
    );
    const finalScore = eligible ? baseScore : -999;
    return {
      id,
      label,
      eligible,
      components,
      baseScore,
      jitter: 0,
      finalScore,
      score: finalScore,
      formula: eligible
        ? `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = ${finalScore}`
        : `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore}；硬条件过滤`,
      filterReasons,
      reasons: filterReasons,
    };
  }

  function chooseCandidate(candidates) {
    return candidates
      .filter((item) => item.eligible)
      .sort((left, right) => right.score - left.score)[0];
  }

  function evidenceExpectedValue(evidence) {
    const total = truthVariantIds.reduce(
      (sum, variantId) => sum + evidence.likelihoods[variantId],
      0,
    ) || 1;
    return truthVariantIds.reduce(
      (sum, variantId) =>
        sum
        + (
          evidence.likelihoods[variantId]
          / total
          * CASE.truthVariants[variantId].trueValue
        ),
      0,
    );
  }

  function resolveDialogue(state, action) {
    const topic = CASE.dialogueTopics.find((item) => item.id === action.topicId);
    if (!topic) throw new Error(`未知询问主题：${action.topicId}`);
    const evidence = action.evidenceId ? CASE.evidence[action.evidenceId] : null;
    if (evidence && !state.discoveredEvidenceIds.includes(evidence.id)) {
      throw new Error("不能引用尚未发现的证据");
    }
    const relevant = Boolean(
      evidence
      && (
        topic.evidenceTopics.includes(evidence.topic)
        || evidence.contradicts === CASE.claims.find((claim) => claim.topic === topic.label)?.id
      ),
    );
    const disclosureFrame = action.disclosureFrame || "neutral";
    const framingPenalty =
      evidence
      && evidence.kind !== "statement"
      && disclosureFrame === "downside"
        ? Math.round(
          10
          * CASE.npcProfile.honestySensitivity
          * CASE.npcProfile.expertise
          * clamp((evidenceExpectedValue(evidence) - 45) / 70, 0, 1),
        )
        : 0;
    const signature = `${action.topicId}:${action.evidenceId || "none"}:${action.tone}:${disclosureFrame}`;
    const repeatCount = state.actionHistory.filter(
      (turn) =>
        turn.action.kind === "dialogue"
        && `${turn.action.topicId}:${turn.action.evidenceId || "none"}:${turn.action.tone}:${turn.action.disclosureFrame || "neutral"}` === signature,
    ).length;
    const power = evidence ? evidencePower[evidence.strength] : 0.5;
    const relevanceFactor = evidence ? relevant ? 1 : 0.45 : 1;
    const decay = pressureDecay(state.npcState.pressure);
    const context = evidence ? relevant ? 2 : -2 : 0;
    const pressureDelta = clamp(Math.round(
      (evidence ? 10 : 3) * tonePressure[action.tone] * power
      * relevanceFactor * decay + context + repeatCount,
    ), 0, 28);
    const trustDelta = clamp(
      { gentle: 6, professional: 2, firm: -7 }[action.tone]
      + (evidence ? 0 : { gentle: 2, professional: 1, firm: -2 }[action.tone])
      + (evidence && !relevant ? -3 : 0)
      - framingPenalty
      - repeatCount * 2,
      -15,
      10,
    );
    const dealDelta = clamp(
      { gentle: 1, professional: -1, firm: -4 }[action.tone]
      - (evidence ? Math.round(power * 2) : 0)
      - Math.ceil(framingPenalty / 2)
      - repeatCount * 2,
      -15,
      5,
    );
    const controlDelta = evidence
      ? -clamp(
        Math.round(10 * tonePressure[action.tone] * power * relevanceFactor)
        + repeatCount,
        0,
        24,
      )
      : { gentle: 2, professional: -2, firm: -4 }[action.tone];
    const resolved = applyChanges(state.npcState, [
      {
        key: "pressure",
        delta: pressureDelta,
        reasons: [
          evidence ? `引用${evidence.name}` : "开放询问不要求证据",
          `态度：${toneLabels[action.tone]}`,
          `完全重复 ${repeatCount} 次`,
        ],
        formula: `round(基础${evidence ? 10 : 3} × 态度${tonePressure[action.tone]} × 证据${power} × 相关${relevanceFactor} × 衰减${decay} + 情境${context} + 重复${repeatCount}) = ${pressureDelta}`,
      },
      {
        key: "trust",
        delta: trustDelta,
        reasons: ["表达方式、证据相关性与重复历史共同作用"],
        formula: `态度基础 + 开放询问修正 + 相关性修正 - 片面披露${framingPenalty} - 重复${repeatCount}×2 = ${trustDelta}`,
      },
      {
        key: "dealIntent",
        delta: dealDelta,
        reasons: ["证据威胁和重复行动改变交易耐心"],
        formula: `态度基础 - 证据${evidence ? round1(power * 2) : 0} - 片面披露${Math.ceil(framingPenalty / 2)} - 重复${repeatCount}×2 = ${dealDelta}`,
      },
      {
        key: "control",
        delta: controlDelta,
        reasons: ["证据与表达方式改变卖家叙事空间"],
        formula: evidence
          ? `-round(10 × 态度${tonePressure[action.tone]} × 证据${power} × 相关${relevanceFactor}) - 重复${repeatCount} = ${controlDelta}`
          : `开放询问态度修正 = ${controlDelta}`,
      },
    ]);

    const n = resolved.next;
    const storyletId = `${topic.id}:partial-admit`;
    const storyletTriggered = state.triggeredStoryletIds.includes(storyletId);
    const candidates = [
      candidate(
        state, "cooperate", n.trust >= 40 && n.dealIntent >= 25,
        [
          { label: "固定", value: 10 },
          { label: "信任×0.35", value: n.trust * 0.35 },
          { label: "成交×0.25", value: n.dealIntent * 0.25 },
          { label: "压力×-0.15", value: -n.pressure * 0.15 },
          { label: "开放询问", value: evidence ? 0 : 8 },
          { label: "重复×-12", value: -repeatCount * 12 },
        ],
        ["信任至少40", "成交意愿至少25"],
      ),
      candidate(
        state, "deflect", n.control >= 22,
        [
          { label: "固定", value: 8 },
          { label: "控制×0.35", value: n.control * 0.35 },
          { label: "低压力×0.12", value: (100 - n.pressure) * 0.12 },
          { label: "弱证据", value: power < 1 ? 6 : 0 },
          { label: "重复×4", value: repeatCount * 4 },
        ],
        ["仍保有叙事控制空间"],
      ),
      candidate(
        state, "partial-admit",
        Boolean(evidence && relevant && power >= 1 && !storyletTriggered),
        [
          { label: "固定", value: 5 },
          { label: "压力×0.28", value: n.pressure * 0.28 },
          { label: "失控×0.25", value: (100 - n.control) * 0.25 },
          { label: "成交×0.15", value: n.dealIntent * 0.15 },
          { label: "证据效力×12", value: power * 12 },
        ],
        [
          evidence ? `引用${evidence.name}` : "没有引用证据",
          relevant ? "证据与问题相关" : "证据与问题不相关",
          storyletTriggered ? "一次性承认已触发" : "一次性承认尚未触发",
        ],
      ),
      candidate(
        state, "counter", n.pressure >= 45 || action.tone === "firm",
        [
          { label: "固定", value: 6 },
          { label: "压力×0.25", value: n.pressure * 0.25 },
          { label: "不信任×0.22", value: (100 - n.trust) * 0.22 },
          { label: "控制×0.18", value: n.control * 0.18 },
          { label: "强硬触发", value: action.tone === "firm" ? 8 : 0 },
        ],
        ["压力达到45或玩家采用强硬表达"],
      ),
      candidate(
        state, "refuse", n.pressure >= 65 || repeatCount >= 1,
        [
          { label: "固定", value: 4 },
          { label: "压力×0.28", value: n.pressure * 0.28 },
          { label: "不信任×0.25", value: (100 - n.trust) * 0.25 },
          { label: "重复×20", value: repeatCount * 20 },
        ],
        ["高压力或完全重复问题"],
      ),
      candidate(
        state, "exit",
        n.dealIntent <= 20 || (n.pressure >= 82 && n.trust <= 32),
        [
          { label: "压力×0.3", value: n.pressure * 0.3 },
          { label: "不信任×0.3", value: (100 - n.trust) * 0.3 },
          { label: "低成交×0.4", value: (100 - n.dealIntent) * 0.4 },
        ],
        ["成交意愿≤20，或压力≥82且信任≤32"],
      ),
    ];
    const selected = chooseCandidate(candidates);
    const next = copy(state);
    next.actionPoints -= 1;
    next.npcState = resolved.next;
    const sharedEvidenceAdded = [];
    if (
      evidence
      && evidence.kind !== "statement"
      && !next.sharedEvidenceIds.includes(evidence.id)
    ) {
      next.sharedEvidenceIds.push(evidence.id);
      sharedEvidenceAdded.push(evidence.id);
      next.npcPosterior = calculateNpcPosterior(next.sharedEvidenceIds);
    }
    const changes = [...resolved.changes];
    if (selected.id === "exit") {
      const exitChange = makeChange(
        "dealIntent",
        next.npcState,
        -next.npcState.dealIntent,
        ["NPC行为收敛为离场"],
        `成交意愿 ${next.npcState.dealIntent} → 0`,
      );
      next.npcState.dealIntent = 0;
      next.npcState.phase = "exited";
      changes.push(exitChange);
    }

    const statementSignal = topic.signals[selected.id];
    const sourceKind =
      selected.id === "refuse" || selected.id === "exit"
        ? "refusal"
        : selected.id === "counter" || topic.id === "price"
          ? "judgment"
          : "memory";
    const statementConfidence = {
      cooperate: 0.65,
      deflect: 0.45,
      "partial-admit": 0.72,
      counter: 0.55,
      refuse: 0.2,
      exit: 0.2,
    }[selected.id];
    const statement = {
      turn: state.turn + 1,
      topicId: topic.id,
      behaviorId: selected.id,
      sourceKind,
      confidence: statementConfidence,
      text: topic.responses[selected.id],
      signalId: statementSignal.id,
      signalLabel: statementSignal.label,
      likelihoods: { ...statementSignal.likelihoods },
    };
    next.statementHistory.push(statement);
    const evidenceAdded = [];
    if (selected.id === "partial-admit") {
      if (!next.triggeredStoryletIds.includes(storyletId)) {
        next.triggeredStoryletIds.push(storyletId);
      }
      if (
        topic.responseEvidenceId
        && !next.discoveredEvidenceIds.includes(topic.responseEvidenceId)
      ) {
        next.discoveredEvidenceIds.push(topic.responseEvidenceId);
        evidenceAdded.push(topic.responseEvidenceId);
      }
    }
    const priceChange =
      selected.id === "exit"
        ? undefined
        : refreshNpcPricing(state, next);
    const spindle = {
      expansion: [
        `问题：${topic.label}`,
        `态度：${toneLabels[action.tone]}`,
        `证据：${evidence?.name || "无（开放询问）"}`,
        `证据效力：${power}；相关性：${relevanceFactor}`,
        `同签名重复：${repeatCount} 次`,
      ],
      candidates,
      selectedId: selected.id,
      selectedLabel: selected.label,
      convergence: [
        `选择最高合法效用：${selected.label} ${selected.score}`,
        selected.id === "partial-admit"
          ? `命中一次性Storylet：${storyletId}`
          : "未命中事实承认Storylet",
        `收敛为有限模板：${statement.text}`,
        `写入可见陈述信号：${statement.signalLabel}`,
        priceChange
          ? `共享信息触发正式重估：${priceChange.before} → ${priceChange.after}`
          : "本轮没有达到正式重估阈值",
      ],
    };
    let completed = next;
    if (selected.id === "exit") {
      completed = settle(
        next,
        "seller-exited",
        0,
        npcPricing(state).buyoutLine,
      );
    }
    const titleMap = {
      cooperate: "对方补充了可以继续核验的说法",
      deflect: "对方仍试图保持叙事空间",
      "partial-admit": "证据迫使对方收窄原说法",
      counter: "对方开始反向质疑你的判断",
      refuse: "重复或高压让对方拒绝继续回答",
      exit: "关系与成交意愿跌破安全线",
    };
    return addTurn(state, completed, {
      action: { ...action, disclosureFrame },
      actionLabel: `${evidence ? evidence.kind === "statement" ? "引用既有陈述追问" : disclosureFrame === "downside" ? "强调不利部分并追问" : "完整公开并追问" : "开放询问"} · ${topic.label} · ${toneLabels[action.tone]}`,
      actionPointCost: 1,
      changes,
      evidenceAdded,
      sharedEvidenceAdded,
      priceChange,
      statement,
      title: titleMap[selected.id],
      description: statement.text,
      formulaLog: [
        `行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`,
        ...changes.map((change) => `${change.label}：${change.formula}`),
        `陈述信号：${statement.signalLabel}；似然 ${truthVariantIds.map((variantId) => `${variantId}=${statement.likelihoods[variantId]}`).join(" / ")}`,
        evidence
          ? evidence.kind === "statement"
            ? `信息可见性：引用NPC自己的陈述「${evidence.name}」，不写入共享物证账本，也不重复更新NPC后验`
            : `信息可见性：${sharedEvidenceAdded.length ? `首次公开「${evidence.name}」，写入双方共享账本` : `「${evidence.name}」此前已经公开，本轮不重复计权`}`
          : "信息可见性：未出示物证，NPC后验不读取玩家私有证据",
        `披露方式：${disclosureFrame === "downside" ? "只强调不利部分" : "完整陈述事实"}；可观察的不完整框架惩罚 = ${framingPenalty}`,
        priceChange
          ? `正式重估：${priceChange.before} → ${priceChange.after}；${priceChange.reasons.join("；")}`
          : "正式重估：未触发或目标价未跨越5点档位",
        "候选行为 = 过滤合法性后取最高分；seed扰动范围 [-1.5, +1.5]",
      ],
      spindle,
      redundant: repeatCount > 0,
    });
  }

  function testConsent(state) {
    const score = round1(
      state.npcState.trust * 0.35
      + state.npcState.dealIntent * 0.45
      + (100 - state.npcState.pressure) * 0.15
      + (100 - state.npcState.control) * 0.05,
    );
    const reasons = [];
    if (state.completedTestIds.includes(CASE.test.id)) reasons.push("本维度已经检测");
    if (state.actionPoints < CASE.test.actionPointCost) reasons.push("行动点不足");
    if (score < 50) reasons.push(`NPC同意分 ${score} < 50`);
    return {
      allowed: state.status === "active" && state.npcState.phase !== "exited" && reasons.length === 0,
      score,
      reasons,
      formula: `信任${state.npcState.trust}×0.35 + 成交${state.npcState.dealIntent}×0.45 + (100-压力${state.npcState.pressure})×0.15 + (100-控制${state.npcState.control})×0.05 = ${score}`,
    };
  }

  function resolveTest(state, action) {
    if (action.testId !== CASE.test.id) throw new Error("未知检测");
    const consent = testConsent(state);
    if (!consent.allowed) throw new Error(`当前不能送检：${consent.reasons.join("；")}`);
    const evidenceId = CASE.test.evidenceByVariant[state.truthVariantId];
    const evidence = CASE.evidence[evidenceId];
    const resolved = applyChanges(state.npcState, [
      { key: "pressure", delta: 2, reasons: ["外部核验增加压力"], formula: "送检固定压力修正 +2" },
      { key: "trust", delta: 1, reasons: ["透明检测协议"], formula: "透明检测协议固定信任修正 +1" },
      { key: "dealIntent", delta: -6, reasons: ["等待增加机会成本"], formula: "送检延迟固定成交意愿修正 -6" },
      { key: "control", delta: -4, reasons: ["第三方压缩叙事空间"], formula: "外部核验固定控制感修正 -4" },
    ]);
    const next = copy(state);
    next.actionPoints -= CASE.test.actionPointCost;
    next.feesPaid += CASE.test.valueCost;
    next.npcState = resolved.next;
    next.completedTestIds.push(CASE.test.id);
    if (!next.discoveredEvidenceIds.includes(evidenceId)) {
      next.discoveredEvidenceIds.push(evidenceId);
    }
    const sharedEvidenceAdded = [];
    if (!next.sharedEvidenceIds.includes(evidenceId)) {
      next.sharedEvidenceIds.push(evidenceId);
      sharedEvidenceAdded.push(evidenceId);
      next.npcPosterior = calculateNpcPosterior(next.sharedEvidenceIds);
    }
    const priceChange = refreshNpcPricing(state, next, true);
    const spindle = {
      expansion: [
        `检测项目：${CASE.test.label}`,
        `行动点成本：${CASE.test.actionPointCost}`,
        `价值成本：${CASE.test.valueCost}`,
      ],
      candidates: [
        fixedCandidate(
          "approve-test",
          "同意专项检测",
          true,
          [
            { label: "信任×0.35", value: state.npcState.trust * 0.35 },
            { label: "成交×0.45", value: state.npcState.dealIntent * 0.45 },
            { label: "低压力×0.15", value: (100 - state.npcState.pressure) * 0.15 },
            { label: "失控×0.05", value: (100 - state.npcState.control) * 0.05 },
          ],
          ["同意分达到50"],
        ),
        fixedCandidate(
          "reject-test",
          "拒绝专项检测",
          false,
          [
            { label: "固定", value: 100 },
            { label: "同意分", value: -consent.score },
          ],
          ["本轮被过滤"],
        ),
      ],
      selectedId: "approve-test",
      selectedLabel: "同意专项检测",
      convergence: [
        `只新增「${evidence.name}」`,
        "检测不直接给出整件价值",
        "共同检测结果自动进入双方账本，可能触发卖家重估",
        priceChange
          ? `卖家正式重估：${priceChange.before} → ${priceChange.after}`
          : "结果未令报价跨越5点档位",
      ],
    };
    return addTurn(state, next, {
      action: { ...action },
      actionLabel: `付费专项检测 · ${CASE.test.label}`,
      actionPointCost: CASE.test.actionPointCost,
      changes: resolved.changes,
      evidenceAdded: [evidenceId],
      sharedEvidenceAdded,
      priceChange,
      title: `检测完成：${evidence.name}`,
      description: `${evidence.detail} ${evidence.inference}`,
      formulaLog: [
        `行动点 = ${state.actionPoints} - ${CASE.test.actionPointCost} = ${next.actionPoints}`,
        `累计检测费 = ${state.feesPaid} + ${CASE.test.valueCost} = ${next.feesPaid}`,
        `NPC同意判定：${consent.formula}`,
        `共同检测：${evidence.name}同时进入玩家证据簿与双方共享账本`,
        priceChange
          ? `正式重估：${priceChange.before} → ${priceChange.after}；${priceChange.reasons.join("；")}`
          : "正式重估：目标价未跨越5点档位",
        ...resolved.changes.map((change) => `${change.label}：${change.formula}`),
      ],
      spindle,
      redundant: false,
    });
  }

  function resolveDiscount(state, action) {
    if (!Number.isInteger(action.offer) || action.offer <= 0) {
      throw new Error("普通报价必须是正整数");
    }
    if (action.offer >= state.currentPrice) {
      throw new Error("普通报价必须低于当前价格");
    }

    const pricing = npcPricing(state);
    const threshold = pricing.acceptLine;
    const gap = threshold - action.offer;
    const lowOffer = Math.max(0, state.currentPrice - action.offer);
    const resolved = applyChanges(state.npcState, [
      { key: "pressure", delta: clamp(Math.round(lowOffer / 8), 2, 8), reasons: ["报价低于当前价格"], formula: `clamp(round(差价${lowOffer}÷8), 2, 8)` },
      { key: "trust", delta: gap > 8 ? -5 : gap > 0 ? -2 : 1, reasons: ["报价与接受线比较"], formula: `报价差额 ${gap} 对应信任修正` },
      { key: "dealIntent", delta: gap > 8 ? -8 : gap > 0 ? -3 : 1, reasons: ["报价改变交易意愿"], formula: `报价差额 ${gap} 对应成交修正` },
      { key: "control", delta: gap <= 0 ? -4 : -1, reasons: ["报价迫使卖家表态"], formula: `是否达线 ${gap <= 0 ? "是" : "否"} → ${gap <= 0 ? -4 : -1}` },
    ]);
    const next = copy(state);
    next.actionPoints -= 1;
    next.npcState = { ...resolved.next, phase: "negotiating" };
    const exitEligible =
      gap > 15
      && (
        next.npcState.trust < 40
        || next.npcState.dealIntent < 40
        || next.npcState.pressure > 75
    );
    const candidates = [
      fixedCandidate(
        "accept-offer",
        "接受报价",
        gap <= 0,
        [
          { label: "固定", value: 90 },
          { label: "报价余量", value: -Math.abs(gap) },
        ],
        [gap <= 0 ? "报价达到可接受线" : "报价未达到可接受线"],
      ),
      fixedCandidate(
        "counter-offer",
        "提出还价",
        gap > 0 && gap <= 8,
        [
          { label: "固定", value: 82 },
          { label: "报价差额", value: -gap },
        ],
        ["差额在1—8"],
      ),
      fixedCandidate(
        "reject-offer",
        "拒绝报价",
        gap > 8,
        [
          { label: "固定", value: 72 },
          { label: "差额推动", value: Math.min(gap, 20) },
        ],
        ["报价明显过低"],
      ),
      fixedCandidate(
        "exit",
        "结束交易",
        exitEligible,
        [{ label: "离场固定效用", value: 95 }],
        ["差额>15，且信任<40、成交<40或压力>75"],
      ),
    ];
    const selected = chooseCandidate(candidates);
    let completed = next;
    let title = "卖家拒绝了本次报价";
    let description = "仍可按现价购买或拒绝。";
    if (selected.id === "accept-offer") {
      completed.currentPrice = action.offer;
      completed = settle(
        completed,
        "discount-buy",
        action.offer,
        pricing.buyoutLine,
      );
      title = `卖家接受 ${action.offer} 点报价`;
      description = "折价成交，进入双层结算。";
    } else if (selected.id === "counter-offer") {
      const counterPrice = Math.max(
        threshold,
        Math.round((state.currentPrice + action.offer) / 2),
      );
      completed.currentPrice = counterPrice;
      title = `卖家还价至 ${counterPrice} 点`;
      description = "新的当前价格已经记录。";
    } else if (selected.id === "exit") {
      completed.npcState = {
        ...completed.npcState,
        dealIntent: 0,
        phase: "exited",
      };
      title = "过低报价触发卖家离场";
      description = "案件进入复盘，不会停在无法操作的页面。";
      completed = settle(completed, "seller-exited", 0, pricing.buyoutLine);
    }
    return addTurn(state, completed, {
      action: { ...action },
      actionLabel: `提出普通报价 · ${action.offer} 点`,
      actionPointCost: 1,
      changes: resolved.changes,
      evidenceAdded: [],
      title,
      description,
      formulaLog: [
        `行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`,
        ...pricing.formula,
        ...resolved.changes.map((change) => `${change.label}：${change.formula}`),
      ],
      spindle: {
        expansion: [
          `玩家报价：${action.offer}`,
          `NPC认知档案：${CASE.npcProfile.label}`,
          `NPC后验：${pricing.posterior.map((entry) => `${entry.label}${round1(entry.probability * 100)}%`).join(" / ")}`,
          `后验Q25/Q50/Q75：${pricing.q25} / ${pricing.q50} / ${pricing.q75}`,
          `风险厌恶：${CASE.npcProfile.riskAversion}；急迫度：${CASE.npcProfile.urgency}；外部选项：${round1(pricing.outsideOption)}`,
        ],
        candidates,
        selectedId: selected.id,
        selectedLabel: selected.label,
        convergence: [
          ...pricing.formula,
          `报价差额 = ${gap}`,
          `收敛结果：${selected.label}`,
        ],
      },
      redundant: state.actionHistory.some(
        (turn) => turn.action.kind === "discount" && turn.action.offer === action.offer,
      ),
    });
  }

  function resolveBuyout(state, action) {
    if (!Number.isInteger(action.offer) || action.offer <= 0) {
      throw new Error("无条件买断报价必须是正整数");
    }
    if (action.offer >= state.currentPrice) {
      throw new Error("无条件买断价必须低于当前报价；按当前价成交请直接购买");
    }
    const pricing = npcPricing(state);
    const accepted = action.offer >= pricing.buyoutLine;
    const candidates = [
      fixedCandidate(
        "accept-buyout",
        "接受无条件买断",
        accepted,
        [
          { label: "报价", value: action.offer },
          { label: "风险转移价值", value: pricing.acceptLine - pricing.buyoutLine },
        ],
        [
          accepted
            ? `报价达到无条件买断线${pricing.buyoutLine}`
            : `报价未达到无条件买断线${pricing.buyoutLine}`,
        ],
      ),
      fixedCandidate(
        "reject-buyout",
        "拒绝并结束交易",
        !accepted,
        [
          { label: "买断线", value: pricing.buyoutLine },
          { label: "报价差额", value: action.offer - pricing.buyoutLine },
        ],
        [
          accepted
            ? "买断报价已经达到接受条件"
            : "一次性最终报价不足，卖家不再继续协商",
        ],
      ),
    ];
    const next = copy(state);
    next.actionPoints -= 1;
    if (accepted) next.currentPrice = action.offer;
    const choice = accepted ? "buyout-buy" : "buyout-rejected";
    const completed = settle(
      next,
      choice,
      accepted ? action.offer : 0,
      pricing.buyoutLine,
    );
    const settlement = completed.settlement;
    const selected = candidates.find((candidateItem) => candidateItem.eligible);
    const spindle = {
      expansion: [
        `玩家最终报价：${action.offer}`,
        "承诺：不再检测、不追加条件，成交后由玩家承担器物风险",
        `卖家风险厌恶${CASE.npcProfile.riskAversion} / 急迫度${CASE.npcProfile.urgency}`,
        `普通接受线${pricing.acceptLine} / 无条件买断线${pricing.buyoutLine}`,
      ],
      candidates,
      selectedId: selected.id,
      selectedLabel: selected.label,
      convergence: [
        ...pricing.formula,
        `最终报价${action.offer} ${accepted ? "≥" : "<"} 买断线${pricing.buyoutLine}`,
        "无条件买断无还价、无追加检测；无论接受或拒绝，本局立即结算",
      ],
    };
    return addTurn(state, completed, {
      action: { ...action },
      actionLabel: `提出无条件买断 · ${action.offer}点`,
      actionPointCost: 1,
      changes: [],
      evidenceAdded: [],
      sharedEvidenceAdded: [],
      title: accepted
        ? `卖家接受 ${action.offer} 点无条件买断`
        : "卖家拒绝最终报价并结束交易",
      description: accepted
        ? "你以放弃追加检测和条件换取确定成交，器物的剩余风险由你承担。"
        : "一次性最终报价没有达到卖家当前买断线，本局不再继续议价。",
      formulaLog: [
        `行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`,
        ...pricing.formula,
        `买断判定：${action.offer} ${accepted ? "≥" : "<"} ${pricing.buyoutLine}`,
        ...settlement.objectiveFormula,
        ...settlement.judgmentFormula,
      ],
      spindle,
      redundant: false,
    });
  }

  function resolveAction(state, action) {
    ensureAllowed(state, action);
    if (action.kind === "inspect") return resolveInspect(state, action);
    if (action.kind === "dialogue") return resolveDialogue(state, action);
    if (action.kind === "test") return resolveTest(state, action);
    if (action.kind === "discount") return resolveDiscount(state, action);
    if (action.kind === "buyout") return resolveBuyout(state, action);
    const paidPrice = action.kind === "buy" ? state.currentPrice : 0;
    const next = settle(
      copy(state),
      action.kind,
      paidPrice,
      npcPricing(state).buyoutLine,
    );
    return addTurn(state, next, {
      action: { ...action },
      actionLabel: action.kind === "buy" ? `按 ${state.currentPrice} 点买下` : "拒绝交易",
      actionPointCost: 0,
      changes: [],
      evidenceAdded: [],
      title: next.settlement.endingTitle,
      description: `${next.settlement.objectiveLabel}；${next.settlement.judgmentLabel}。`,
      formulaLog: [
        "购买与拒绝是零行动点终局动作，因此行动点耗尽也不会死锁。",
        ...next.settlement.objectiveFormula,
        ...next.settlement.judgmentFormula,
      ],
      spindle: null,
      redundant: false,
    });
  }

  function screenHeading(eyebrow, title, description) {
    return `<header class="screen-heading">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${description}</p>
    </header>`;
  }

  function mockBadge() {
    return '<span class="mock-badge">规则样片</span>';
  }

  function evidenceCard(id) {
    const evidence = CASE.evidence[id];
    const kind =
      evidence.kind === "statement" ? "陈述证据"
        : evidence.kind === "test" ? "检测证据" : "器物证据";
    const visibility =
      evidence.kind === "statement"
        ? "NPC口供 · 双方在场"
        : world.sharedEvidenceIds.includes(id)
          ? "双方共享"
          : "仅你掌握";
    return `<article class="evidence-list-card">
      <div class="card-topline"><span>${kind} · ${visibility}</span><strong>${evidence.strength}</strong></div>
      <h3>${evidence.name}</h3>
      <p><strong>观察事实：</strong>${evidence.detail}</p>
      <p><strong>可能含义：</strong>${evidence.inference}</p>
      <small><strong>温和导向：</strong>${evidence.lead}</small>
    </article>`;
  }

  function renderHome() {
    return `${screenHeading(
      "P0 · 店铺首页",
      "今日开门，第一位来客已到",
      "客观真相藏在器物里，交易结果取决于你如何分配有限行动。",
    )}
    <div class="status-board">
      <div><span>营业状态</span><strong>已开门</strong></div>
      <div><span>调查预算</span><strong>${CASE.actionBudget} 点</strong></div>
      <div><span>案件</span><strong>1 / 1</strong></div>
    </div>
    <article class="guest-card">
      <div class="avatar-placeholder">刘</div>
      <div class="guest-copy">
        <p class="card-kicker">今日来客</p><h2>${CASE.seller.name}</h2>
        <p>带来一只旧漆木首饰盒，希望尽快出手。</p>
        <div class="tag-row"><span>来源待核</span><span>开价待判</span></div>
      </div>
    </article>
    <div class="prototype-callout">${mockBadge()}<p>本版验证共享行动点、动态证据、NPC纺锤决策与双层结算。</p></div>
    <button class="primary-button" data-action="go" data-screen="arrival">接待刘先生 →</button>`;
  }

  function renderArrival() {
    return `${screenHeading(
      "P1 · 来客上门",
      "先记录说法，再决定如何验证",
      "检测和询问可以任意交叉，但都会消耗同一套行动点。",
    )}
    <div class="arrival-scene">
      <div class="npc-bust"><span>刘</span><small>人物占位</small></div>
      <div class="artifact-mini"><div class="mini-lid"></div><div class="mini-box"><i></i></div><small>器物占位</small></div>
    </div>
    <section class="statement-panel">
      <div class="speaker-line"><strong>刘先生</strong><span>初始陈述</span></div>
      ${CASE.claims.map((claim) => `<blockquote>“${claim.text}”</blockquote>`).join("")}
      <div class="tag-row">${CASE.npcProfile.publicTraits.map((trait) => `<span>${trait}</span>`).join("")}</div>
    </section>
    <div class="price-row">
      <div><span>卖家暂时报价</span><strong>${CASE.seller.openingPrice} 价值点</strong></div>
      <small>这是刘先生基于现有认识的报价，不是鉴定结论；游戏数值不对应人民币。</small>
    </div>
    <div class="button-stack">
      <button class="primary-button" data-action="go" data-screen="investigate">进入调查循环</button>
      <button class="text-button" data-action="go" data-screen="home">返回店铺</button>
    </div>`;
  }

  function renderInvestigate() {
    const target = CASE.observationTargets.find((item) => item.id === ui.selectedTargetId);
    const topic = CASE.dialogueTopics.find((item) => item.id === ui.selectedTopicId);
    const evidence = world.discoveredEvidenceIds.map((id) => CASE.evidence[id]);
    const sharedCount = world.sharedEvidenceIds.length;
    const privateCount = Math.max(0, evidence.length - sharedCount);
    const consent = testConsent(world);
    return `${screenHeading(
      "P2 · 交叉调查",
      "边看边问，把线索连成证据",
      "检查、询问、追问和议价共用行动点；交易入口始终保留。",
    )}
    <div class="resource-row resource-triple">
      <div><span>行动点</span><strong>${world.actionPoints} / ${CASE.actionBudget}</strong></div>
      <div><span>证据</span><strong>${privateCount}私有 / ${sharedCount}共享</strong></div>
      <div><span>当前价</span><strong>${world.currentPrice}</strong></div>
    </div>
    ${world.actionPoints === 0 ? '<div class="strategy-feedback">调查预算已经耗尽。你仍可购买或拒绝，不会死锁。</div>' : ""}
    <section class="investigation-card">
      <div class="section-title"><div><span>器物检测</span><h2>选择观察位置</h2></div><small>每次 -1 行动点</small></div>
      <div class="observation-targets">
        ${CASE.observationTargets.map((item) => `
          <button class="${item.id === ui.selectedTargetId ? "selected" : ""}" data-action="target" data-id="${item.id}">
            <strong>${item.label}</strong>
            <small>${world.inspectedTargetIds.includes(item.id) ? "已检查" : item.short}</small>
          </button>`).join("")}
      </div>
      <div class="artifact-map target-${target.id}">
        <div class="artifact-map-lid"></div><div class="artifact-map-body"><i></i></div><span>${target.label}</span>
      </div>
      <div class="soft-guidance"><strong>背景提示</strong><p>${target.knowledgeHint}</p></div>
      <button class="primary-button" data-action="inspect" ${world.actionPoints < 1 ? "disabled" : ""}>
        ${world.inspectedTargetIds.includes(target.id) ? `复查${target.label}（仍消耗 1 点）` : `检查${target.label}（-1 行动点）`}
      </button>
    </section>
    <section class="investigation-card dialogue-builder">
      <div class="section-title"><div><span>NPC交流</span><h2>组成一次询问或追问</h2></div><small>每次 -1 行动点</small></div>
      <p class="builder-label">1. 选择问题</p>
      <div class="topic-options">
        ${CASE.dialogueTopics.map((item) => `<button class="${item.id === ui.selectedTopicId ? "selected" : ""}" data-action="topic" data-id="${item.id}">${item.label}</button>`).join("")}
      </div>
      <blockquote class="question-preview">“${topic.prompt}”</blockquote>
      <label class="evidence-select"><span>2. 引用证据（可以不选）</span>
        <select id="evidence-select">
          <option value="">不出示证据，先固定说法</option>
          ${evidence.map((item) => `<option value="${item.id}" ${ui.selectedEvidenceId === item.id ? "selected" : ""}>${item.name} · ${world.sharedEvidenceIds.includes(item.id) || item.kind === "statement" ? "双方已知" : "仅你掌握"}</option>`).join("")}
        </select>
      </label>
      <p class="builder-label">3. 选择披露方式</p>
      <div class="topic-options">
        <button class="${ui.selectedDisclosureFrame === "neutral" ? "selected" : ""}" data-action="frame" data-id="neutral">完整说明事实</button>
        <button class="${ui.selectedDisclosureFrame === "downside" ? "selected" : ""}" data-action="frame" data-id="downside">只强调不利部分</button>
      </div>
      <div class="soft-guidance"><strong>公开有代价</strong><p>${ui.selectedEvidenceId ? "首次引用会把这条证据变成双方共享信息：可能换来补充口供，也可能促使卖家重新估价。" : "不出示证据只会固定口供，不会让卖家读取你私下发现的物证。"}</p></div>
      <p class="builder-label">4. 选择表达方式</p>
      <div class="tone-compact">
        ${toneOptions.map(([id, label, benefit, risk]) => `
          <button class="${ui.selectedTone === id ? "selected" : ""}" data-action="tone" data-id="${id}">
            <strong>${label}</strong><span>${benefit}</span><small>${risk}</small>
          </button>`).join("")}
      </div>
      <button class="primary-button" data-action="dialogue" ${world.actionPoints < 1 ? "disabled" : ""}>
        ${ui.selectedEvidenceId ? "公开证据并追问（-1 行动点）" : "开放询问（-1 行动点）"}
      </button>
    </section>
    <section class="investigation-card">
      <div class="section-title"><div><span>共同检测</span><h2>${CASE.test.label}</h2></div><small>双方都会看到结果</small></div>
      <p>${CASE.test.description}</p>
      <div class="soft-guidance"><strong>真实代价</strong><p>消耗 ${CASE.test.actionPointCost} 行动点与 ${CASE.test.valueCost} 价值点；结果自动进入双方账本，并可能触发卖家重估。</p></div>
      <button class="secondary-button" data-action="test" ${!consent.allowed ? "disabled" : ""}>共同送检（-${CASE.test.actionPointCost} AP / -${CASE.test.valueCost}价值）</button>
      ${!consent.allowed ? `<div class="strategy-feedback">当前不能共同检测：${consent.reasons.join("；") || "条件不满足"}。</div>` : ""}
    </section>
    <details class="knowledge-drawer"><summary>打开鉴定背景知识</summary><div>
      ${CASE.knowledgeCards.map((card) => `<article><strong>${card.title}</strong><p>${card.body}</p></article>`).join("")}
    </div></details>
    ${ui.feedback ? `<div class="strategy-feedback">${ui.feedback}</div>` : ""}
    <nav class="tool-nav investigation-tools">
      <button data-action="open-evidence" data-return="investigate"><strong>证据簿</strong><span>${evidence.length} 条证据</span></button>
      <button data-action="go" data-screen="trade"><strong>进入交易</strong><span>随时决策</span></button>
    </nav>`;
  }

  function renderEvidence() {
    return `${screenHeading(
      "P2 · 证据簿",
      "事实、解释和导向分开记录",
      "证据簿只保存信息，不在这里直接发起行动。",
    )}
    ${world.discoveredEvidenceIds.length
      ? `<div class="evidence-list">${world.discoveredEvidenceIds.map(evidenceCard).join("")}</div>`
      : '<div class="empty-evidence"><strong>尚未发现器物证据</strong><p>仍可先向NPC开放询问。</p></div>'}
    <section class="statement-log">
      <div class="section-title"><h2>NPC陈述历史</h2><span>${world.statementHistory.length} 条</span></div>
      ${world.statementHistory.length
        ? world.statementHistory.map((statement) => `<div><span>第 ${statement.turn} 轮</span><blockquote>“${statement.text}”</blockquote></div>`).join("")
        : "<p>初始陈述已记录；后续询问会形成时间线。</p>"}
    </section>
    <button class="secondary-button" data-action="go" data-screen="${ui.evidenceReturnScreen}">${ui.evidenceReturnScreen === "trade" ? "返回交易" : "返回调查"}</button>`;
  }

  function renderResponse() {
    const turn = world.actionHistory.at(-1);
    if (!turn) return renderInvestigate();
    const responseActions =
      turn.action.kind === "inspect"
        ? '<button class="primary-button" data-action="go" data-screen="investigate">收进证据簿，返回调查</button>'
        : `<button class="primary-button" data-action="go" data-screen="${world.actionPoints > 0 ? "investigate" : "trade"}">${world.actionPoints > 0 ? "继续调查" : "行动点耗尽，进入交易"}</button>
          <button class="secondary-button" data-action="go" data-screen="trade">现在进入交易</button>
          <button class="text-button" data-action="open-evidence" data-return="investigate">查看证据簿</button>`;
    return `${screenHeading(`第 ${turn.turn} 轮 · 行动结果`, turn.title, turn.actionLabel)}
    ${turn.changes.length ? `<div class="phase-change"><span>可观察反应</span><i>·</i><strong>${turn.statement ? behaviorLabels[turn.statement.behaviorId] : turn.priceChange ? "卖家公开重估" : "对方态度发生变化"}</strong>${mockBadge()}</div>` : ""}
    <section class="response-card">
      <div class="card-topline"><span>${turn.statement ? "NPC回应" : "调查结果"}</span><strong>行动点 -${turn.actionPointCost}</strong></div>
      ${turn.statement ? `<blockquote>“${turn.statement.text}”</blockquote>` : `<p>${turn.description}</p>`}
    </section>
    ${turn.sharedEvidenceAdded?.length ? `<div class="strategy-feedback">信息边界已变化：${turn.sharedEvidenceAdded.map((id) => `「${CASE.evidence[id].name}」`).join("、")}现在由双方共同掌握。</div>` : turn.evidenceAdded.some((id) => CASE.evidence[id].kind !== "statement") ? '<div class="strategy-feedback">本轮新物证先保存在你的证据簿中，卖家不会自动知道。</div>' : turn.evidenceAdded.length ? '<div class="strategy-feedback">NPC的新口供已经记录；它不会让NPC重复学习自己的记忆。</div>' : ""}
    ${turn.priceChange ? `<div class="price-row"><div><span>卖家公开重估</span><strong>${turn.priceChange.before} → ${turn.priceChange.after} 价值点</strong></div><small>${turn.priceChange.publicReason}</small></div>` : ""}
    ${turn.evidenceAdded.length ? `<section class="new-evidence-stack"><div class="section-title"><h2>本轮新增证据</h2><span>${turn.evidenceAdded.length} 条</span></div>${turn.evidenceAdded.map(evidenceCard).join("")}</section>` : ""}
    <div class="button-stack">
      ${responseActions}
    </div>`;
  }

  function renderTrade() {
    const consent = testConsent(world);
    const evidence = world.discoveredEvidenceIds.map((id) => CASE.evidence[id]);
    const reference = playerReferenceOffer(world);
    if (!ui.offerInput) ui.offerInput = String(reference.suggestedOffer);
    return `${screenHeading(
      "P3 · 交易处置",
      "接受、报价，还是转移风险",
      "普通报价允许还价；无条件买断放弃追加检测，无论接受或拒绝都会立即结束本局。",
    )}
    <div class="resource-row resource-triple">
      <div><span>行动点</span><strong>${world.actionPoints}</strong></div>
      <div><span>当前价</span><strong>${world.currentPrice}</strong></div>
      <div><span>检测费</span><strong>${world.feesPaid}</strong></div>
    </div>
    <div class="risk-summary"><div><span>已知证据</span><strong>${evidence.length} 条</strong></div><ul>
      ${evidence.length ? evidence.slice(-3).map((item) => `<li>${item.name}：${item.inference}</li>`).join("") : "<li>尚无器物证据，只掌握初始说法。</li>"}
    </ul></div>
    <label class="evidence-select"><span>输入你的报价（必须低于当前价）</span>
      <input id="offer-input" type="number" min="1" max="${Math.max(1, world.currentPrice - 1)}" step="1" inputmode="numeric" value="${ui.offerInput}">
    </label>
    <div class="soft-guidance"><strong>谨慎参考 ${reference.suggestedOffer} 点</strong><p>它只依据你当前掌握的信息给出保守参考，不知道隐藏真相，也不保证卖家接受。你可以自由改价。</p></div>
    <div class="trade-actions">
      <button data-action="buy"><span><strong>按当前价买下</strong><em>终局</em></span><small>支付 ${world.currentPrice} 价值点，承担客观结果。</small></button>
      <button data-action="discount" ${world.actionPoints < 1 ? "disabled" : ""}><span><strong>按输入值提出普通报价</strong><em>-1 AP</em></span><small>NPC可能接受、还价、拒绝或离场；未成交时通常还能继续行动。</small></button>
      <button data-action="buyout" ${world.actionPoints < 1 ? "disabled" : ""}><span><strong>按输入值提出无条件买断</strong><em>-1 AP · 必定终局</em></span><small>承诺不再检测、不追加条件；卖家接受或拒绝后，本局都立即结束。</small></button>
      <button data-action="test" ${!consent.allowed ? "disabled" : ""}><span><strong>${CASE.test.label}</strong><em>-2 AP / -10价值</em></span><small>${CASE.test.description} 检测后仍需决策。</small></button>
      <button data-action="reject"><span><strong>拒绝交易</strong><em>终局</em></span><small>避免价格风险，但可能错失珍品。</small></button>
    </div>
    ${!consent.allowed ? `<div class="strategy-feedback">当前不能送检：${consent.reasons.join("；") || "条件不满足"}。</div>` : ""}
    ${ui.feedback ? `<div class="strategy-feedback">${ui.feedback}</div>` : ""}
    <button class="secondary-button" data-action="open-evidence" data-return="trade">查看完整证据簿与陈述</button>
    <button class="text-button" data-action="go" data-screen="investigate" ${world.actionPoints === 0 ? "disabled" : ""}>${world.actionPoints > 0 ? "返回调查" : "行动点耗尽，只能买下或拒绝"}</button>`;
  }

  function causalReviewItems() {
    return world.actionHistory.flatMap((turn) => {
      const items = [];
      const privateEvidence = turn.evidenceAdded.filter(
        (id) =>
          CASE.evidence[id].kind !== "statement"
          && !turn.sharedEvidenceAdded?.includes(id),
      );
      if (privateEvidence.length) {
        items.push(`第${turn.turn}轮 · 私有发现：${privateEvidence.map((id) => CASE.evidence[id].name).join("、")}`);
      }
      if (turn.sharedEvidenceAdded?.length) {
        items.push(`第${turn.turn}轮 · 进入共享：${turn.sharedEvidenceAdded.map((id) => CASE.evidence[id].name).join("、")}`);
      }
      if (turn.statement) {
        const sourceLabel = {
          memory: "真诚记忆",
          judgment: "主观判断",
          refusal: "拒答或中止",
        }[turn.statement.sourceKind] || "陈述";
        items.push(`第${turn.turn}轮 · NPC${sourceLabel}：${turn.statement.signalLabel}`);
      }
      if (turn.priceChange) {
        items.push(`第${turn.turn}轮 · 公开重估：${turn.priceChange.before}→${turn.priceChange.after}`);
      }
      return items;
    });
  }

  function renderReview() {
    const result = world.settlement;
    const truth = CASE.truthVariants[result.truthVariantId];
    const causalItems = causalReviewItems();
    return `${screenHeading(
      "P4 · 双层结算",
      result.endingTitle,
      "客观结果决定本局事实上的成败；判断质量解释你当时是否有理有据。",
    )}
    <div class="outcome-banner ${result.objectiveSuccess ? "success" : "failure"}">
      <span>最终处置</span><h2>${result.choiceLabel}</h2><p>${result.objectiveLabel} · ${result.judgmentLabel}</p>
    </div>
    <section class="truth-panel">
      <div class="section-title"><h2>物品客观真相</h2><span>复盘解锁</span></div>
      <h3>${result.truthLabel} · 真实价值 ${result.trueValue}</h3>
      <ul>${truth.facts.map((fact) => `<li>${fact}</li>`).join("")}</ul>
    </section>
    <section class="statement-log">
      <div class="section-title"><h2>信息如何改变交易</h2><span>因果时间线</span></div>
      ${causalItems.length ? causalItems.map((item) => `<div><span>轨迹</span><blockquote>${item}</blockquote></div>`).join("") : "<p>本局没有形成额外证据或公开重估。</p>"}
    </section>
    <section class="score-panel score-panel-large">
      <div><span>客观结果分</span><strong>${result.objectiveScore}</strong><small>${result.objectiveLabel}</small></div>
      <div><span>判断质量分</span><strong>${result.judgmentScore}</strong><small>${result.judgmentLabel}</small></div>
      <div><span>实际净结果</span><strong>${result.actualNet > 0 ? "+" : ""}${result.actualNet}</strong><small>价值 - 成交 - 检测费</small></div>
      <div><span>机会损失</span><strong>${result.regret}</strong><small>最佳可能 - 实际结果</small></div>
    </section>
    <div class="review-evidence">
      <div><span>本局发现</span><strong>${world.discoveredEvidenceIds.length} 条证据</strong></div>
      <div><span>有成本行动</span><strong>${world.actionHistory.filter((turn) => turn.actionPointCost > 0).length} 次</strong></div>
      <div><span>检测费用</span><strong>${world.feesPaid} 点</strong></div>
    </div>
    <div class="prototype-callout">${mockBadge()}<p>桌面右侧已展开状态曲线、每轮公式、候选行为评分和结算公式。</p></div>
    <button class="primary-button" data-action="reset">重新体验</button>`;
  }

  function renderProgress() {
    const step =
      ui.screen === "home" ? 0
        : ui.screen === "arrival" ? 1
          : ui.screen === "trade" ? 3
            : ui.screen === "review" ? 4 : 2;
    progressRoot.innerHTML = progress.map(([, label], index) => `
      <li class="${index === step ? "active" : index < step ? "done" : ""}">
        <span>${index + 1}</span><small>${label}</small>
      </li>`).join("");
  }

  function debugChart() {
    const snapshots = [
      { label: "初始", npcState: CASE.initialNpcState, actionPoints: CASE.actionBudget },
      ...world.actionHistory.map((turn) => ({
        label: turn.turn,
        npcState: turn.after.npcState,
        actionPoints: turn.after.actionPoints,
      })),
    ];
    const width = 640;
    const height = 248;
    const left = 38;
    const right = 16;
    const top = 18;
    const bottom = 34;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const x = (index) => snapshots.length === 1
      ? left : left + (index / (snapshots.length - 1)) * plotWidth;
    const y = (value) => top + ((100 - value) / 100) * plotHeight;
    const series = [
      ["pressure", "压力", "#d66c5c", snapshots.map((item) => item.npcState.pressure)],
      ["trust", "信任", "#78c7a4", snapshots.map((item) => item.npcState.trust)],
      ["dealIntent", "成交", "#e1bd64", snapshots.map((item) => item.npcState.dealIntent)],
      ["control", "控制", "#7fa9d8", snapshots.map((item) => item.npcState.control)],
      ["actionPoints", "行动点%", "#d9d4c8", snapshots.map((item) => item.actionPoints / CASE.actionBudget * 100)],
    ];
    return `<div class="debug-chart-wrap"><svg class="debug-chart" viewBox="0 0 ${width} ${height}">
      ${[0, 25, 50, 75, 100].map((value) => `<g><line x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}" stroke="rgba(255,255,255,.12)"></line><text x="${left - 8}" y="${y(value) + 4}" text-anchor="end" fill="#84918c" font-size="10">${value}</text></g>`).join("")}
      ${series.map(([id, , color, values]) => `<polyline points="${values.map((value, index) => `${x(index)},${y(value)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="${id === "actionPoints" ? 2 : 2.6}" ${id === "actionPoints" ? 'stroke-dasharray="6 5"' : ""}></polyline>`).join("")}
      ${snapshots.map((item, index) => `<text x="${x(index)}" y="${height - 12}" text-anchor="middle" fill="#aab4b0" font-size="10">${item.label}</text>`).join("")}
    </svg><div class="debug-chart-legend">
      ${series.map(([, label, color]) => `<span><i style="background:${color}"></i>${label}</span>`).join("")}
    </div></div>`;
  }

  function debugLine(line) {
    if (world.status === "settled") return line;
    const pricingSecrets = [
      "卖家底价",
      "接受线",
      "报价差额",
      "信任溢价",
      "压力溢价",
      "成交意愿折让",
    ];
    if (pricingSecrets.some((token) => line.includes(token))) {
      return "定价门控与精确数值：局末解锁（本轮NPC回应已照常结算）";
    }
    return line;
  }

  function debugTurn(turn) {
    const spindle = turn.spindle;
    const hidePricingTrace = turn.action.kind === "discount" && world.status !== "settled";
    return `<article class="debug-turn-detail">
      <header><span>第 ${turn.turn} 轮</span><strong>${turn.actionLabel}</strong><em>-${turn.actionPointCost} AP</em></header>
      ${turn.changes.length ? `<div class="debug-delta-grid">${turn.changes.map((change) => `<div><span>${change.label}</span><strong>${change.before} → ${change.after}</strong><small>${change.delta > 0 ? "+" : ""}${change.delta}</small></div>`).join("")}</div>` : ""}
      <div class="debug-log">${turn.formulaLog.map((line) => `<p><code>${debugLine(line)}</code></p>`).join("")}</div>
      ${spindle ? `<div class="spindle-debug">
        <div class="spindle-stage"><strong>输入发散</strong>${spindle.expansion.map((line) => `<span>${debugLine(line)}</span>`).join("")}</div>
        <div class="candidate-list">${spindle.candidates.map((item) => `<div class="${item.id === spindle.selectedId ? "selected" : ""} ${item.eligible ? "" : "filtered"}"><span>${item.label}</span><strong>${hidePricingTrace ? item.eligible ? "入围" : "过滤" : item.eligible ? item.score : "过滤"}</strong><small>${hidePricingTrace ? "定价评分分项：局末解锁" : item.formula}</small><em>${hidePricingTrace ? "本轮只公开候选状态与最终回应" : item.reasons.join("；")}</em></div>`).join("")}</div>
        <div class="spindle-stage converge"><strong>Storylet收敛</strong>${spindle.convergence.map((line) => `<span>${debugLine(line)}</span>`).join("")}</div>
      </div>` : ""}
    </article>`;
  }

  function renderDebug() {
    const truth = CASE.truthVariants[world.truthVariantId];
    const last = world.actionHistory.at(-1);
    const result = world.settlement;
    const playerBelief = playerReferenceOffer(world);
    const pricing = npcPricing(world);
    debugRoot.innerHTML = `<header class="debug-rail-header">
      <p>DEVELOPMENT VIEW</p><h2>规则、状态与回放</h2>
      <span>供讨论和调试，不属于手机玩家界面</span>
    </header>
    <section class="debug-panel">
      <div class="debug-panel-title"><h3>当前 WorldState</h3><span>实时</span></div>
      <dl class="debug-snapshot">
        <div><dt>页面</dt><dd>${ui.screen}</dd></div>
        <div><dt>回合</dt><dd>${world.turn}</dd></div>
        <div><dt>行动点</dt><dd>${world.actionPoints} / ${CASE.actionBudget}</dd></div>
        <div><dt>玩家证据</dt><dd>${world.discoveredEvidenceIds.length} 条</dd></div>
        <div><dt>共享证据</dt><dd>${world.sharedEvidenceIds.length} 条</dd></div>
        <div><dt>当前价格</dt><dd>${world.currentPrice} 点</dd></div>
        <div><dt>正式重估</dt><dd>${world.priceHistory.length} / 2 次</dd></div>
        <div><dt>检测费用</dt><dd>${world.feesPaid} 点</dd></div>
        <div><dt>NPC阶段</dt><dd>${phaseLabels[world.npcState.phase]}</dd></div>
        <div><dt>NPC认知档案</dt><dd>${CASE.npcProfile.label}</dd></div>
        <div><dt>隐藏真相</dt><dd>${world.status === "settled" ? `${truth.label} · ${truth.trueValue}点` : "局末解锁"}</dd></div>
        <div><dt>seed</dt><dd>${world.seed}</dd></div>
      </dl>
      <div class="debug-live-state">
        ${Object.entries(stateLabels).map(([key, label]) => `<div><span>${label}</span><strong>${world.npcState[key]}</strong><i><b style="width:${world.npcState[key]}%"></b></i></div>`).join("")}
      </div>
    </section>
    <section class="debug-panel">
      <div class="debug-panel-title"><h3>双后验与信息边界</h3><span>精确调试</span></div>
      <div class="posterior-grid">
        ${playerBelief.posterior.map((entry) => `<div><span>玩家 · ${entry.label}</span><strong>${(entry.probability * 100).toFixed(1)}%</strong><small>价值 ${entry.trueValue}</small></div>`).join("")}
        ${world.npcPosterior.map((entry) => `<div><span>NPC · ${entry.label}</span><strong>${(entry.probability * 100).toFixed(1)}%</strong><small>价值 ${entry.trueValue}</small></div>`).join("")}
      </div>
      <div class="debug-formula-stack">
        <code>玩家账本：${world.discoveredEvidenceIds.join("、") || "仅市场先验"}；NPC陈述信号按 sourceId 去重并按置信度计权</code>
        <code>共享账本：${world.sharedEvidenceIds.join("、") || "尚无共享物证"}；NPC后验只读取私人信号与共享物证，不读取 TRUTH_ID</code>
        <code>NPC私人信号：${CASE.npcProfile.privateSignals.map((signal) => `${signal.label}(置信${signal.confidence})`).join("；")}</code>
        <code>${playerBelief.formula}</code>
      </div>
    </section>
    <section class="debug-panel">
      <div class="debug-panel-title"><h3>NPC估值与买断参数</h3><span>${pricing.stance}</span></div>
      <dl class="debug-snapshot">
        <div><dt>专业度</dt><dd>${CASE.npcProfile.expertise}</dd></div>
        <div><dt>真诚敏感</dt><dd>${CASE.npcProfile.honestySensitivity}</dd></div>
        <div><dt>风险厌恶</dt><dd>${CASE.npcProfile.riskAversion}</dd></div>
        <div><dt>急迫度</dt><dd>${CASE.npcProfile.urgency}</dd></div>
        <div><dt>NPC Q25/50/75</dt><dd>${pricing.q25} / ${pricing.q50} / ${pricing.q75}</dd></div>
        <div><dt>主观中枢</dt><dd>${round1(pricing.subjectiveCenter)}</dd></div>
        <div><dt>普通接受线</dt><dd>${pricing.acceptLine}</dd></div>
        <div><dt>无条件买断线</dt><dd>${pricing.buyoutLine}</dd></div>
      </dl>
      <div class="debug-formula-stack">${pricing.formula.map((line) => `<code>${line}</code>`).join("")}</div>
      ${world.priceHistory.length ? `<div class="debug-formula-stack">${world.priceHistory.map((event) => `<code>第${event.turn}轮 ${event.before}→${event.after}：${event.reasons.join("；")}</code>`).join("")}</div>` : ""}
    </section>
    <section class="debug-panel">
      <div class="debug-panel-title"><h3>纺锤规则链</h3><span>${last ? `第 ${last.turn} 轮` : "等待输入"}</span></div>
      <ol class="debug-pipeline">
        ${["接收结构化行动", "扣除共享行动成本", "发散证据、态度与历史", "收敛为NPC数值", "发散候选行为", "效用评分与Storylet收敛", "写入回应与回放"].map((item, index) => `<li class="${last ? "done" : index === 0 ? "active" : ""}"><i>${index + 1}</i><span>${item}</span></li>`).join("")}
      </ol>
    </section>
    ${last ? `<section class="debug-panel debug-result"><div class="debug-panel-title"><h3>最近一轮精确输出</h3><span>${last.title}</span></div>${debugTurn(last)}</section>` : '<section class="debug-panel"><p class="debug-empty">开始检查或询问后显示完整公式。</p></section>'}
    ${result ? `<section class="debug-panel debug-report"><div class="debug-panel-title"><h3>整局状态变化图</h3><span>${world.actionHistory.length}轮</span></div>${debugChart()}</section>
      <section class="debug-panel debug-report"><div class="debug-panel-title"><h3>客观结果公式</h3><span>${result.objectiveScore}/100</span></div><div class="debug-formula-stack">${result.objectiveFormula.map((line) => `<code>${line}</code>`).join("")}</div></section>
      <section class="debug-panel debug-report"><div class="debug-panel-title"><h3>判断质量公式</h3><span>${result.judgmentScore}/100</span></div>
        <div class="posterior-grid">${result.posterior.map((entry) => `<div><span>${entry.label}</span><strong>${(entry.probability * 100).toFixed(1)}%</strong><small>价值 ${entry.trueValue}</small></div>`).join("")}</div>
        <div class="debug-formula-stack">${result.judgmentFormula.map((line) => `<code>${line}</code>`).join("")}</div>
      </section>
      <section class="debug-panel debug-report"><div class="debug-panel-title"><h3>全回合公式记录</h3><span>可复现</span></div><div class="debug-all-turns">${world.actionHistory.map(debugTurn).join("")}</div></section>` : ""}
    `;
  }

  function render() {
    renderProgress();
    appRoot.innerHTML = {
      home: renderHome,
      arrival: renderArrival,
      investigate: renderInvestigate,
      evidence: renderEvidence,
      response: renderResponse,
      trade: renderTrade,
      review: renderReview,
    }[ui.screen]();
    renderDebug();
  }

  function go(screen) {
    ui.screen = screen;
    ui.feedback = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  }

  function perform(action) {
    try {
      world = resolveAction(world, action);
      ui.feedback = "";
      go(world.status === "settled" ? "review" : "response");
    } catch (error) {
      ui.feedback = error instanceof Error ? error.message : "行动无法执行";
      render();
    }
  }

  document.addEventListener("change", (event) => {
    if (event.target.id === "evidence-select") {
      ui.selectedEvidenceId = event.target.value;
      render();
    }
    if (event.target.id === "offer-input") {
      ui.offerInput = event.target.value;
      render();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "offer-input") {
      ui.offerInput = event.target.value;
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "go") return go(button.dataset.screen);
    if (action === "open-evidence") {
      ui.evidenceReturnScreen = button.dataset.return === "trade" ? "trade" : "investigate";
      return go("evidence");
    }
    if (action === "target") {
      ui.selectedTargetId = button.dataset.id;
      return render();
    }
    if (action === "topic") {
      ui.selectedTopicId = button.dataset.id;
      return render();
    }
    if (action === "tone") {
      ui.selectedTone = button.dataset.id;
      return render();
    }
    if (action === "frame") {
      ui.selectedDisclosureFrame = button.dataset.id === "downside"
        ? "downside"
        : "neutral";
      return render();
    }
    if (action === "inspect") {
      return perform({ kind: "inspect", targetId: ui.selectedTargetId });
    }
    if (action === "dialogue") {
      return perform({
        kind: "dialogue",
        topicId: ui.selectedTopicId,
        tone: ui.selectedTone,
        evidenceId: ui.selectedEvidenceId || undefined,
        disclosureFrame: ui.selectedDisclosureFrame,
      });
    }
    if (action === "buy") return perform({ kind: "buy" });
    if (action === "reject") return perform({ kind: "reject" });
    if (action === "discount") {
      return perform({ kind: "discount", offer: Number(ui.offerInput) });
    }
    if (action === "buyout") {
      return perform({ kind: "buyout", offer: Number(ui.offerInput) });
    }
    if (action === "test") return perform({ kind: "test", testId: CASE.test.id });
    if (action === "reset") {
      world = initialWorld();
      Object.assign(ui, {
        screen: "home",
        selectedTargetId: "surface",
        selectedTopicId: "repair-history",
        selectedTone: "professional",
        selectedDisclosureFrame: "neutral",
        selectedEvidenceId: "",
        offerInput: "",
        evidenceReturnScreen: "investigate",
        feedback: "",
      });
      return render();
    }
  });

  window.__ZHANGYAN_DEBUG__ = {
    getState: () => copy(world),
    resolveAction: (action) => perform(action),
    reset: () => {
      world = initialWorld();
      Object.assign(ui, {
        screen: "home",
        selectedTargetId: "surface",
        selectedTopicId: "repair-history",
        selectedTone: "professional",
        selectedDisclosureFrame: "neutral",
        selectedEvidenceId: "",
        offerInput: "",
        evidenceReturnScreen: "investigate",
        feedback: "",
      });
      render();
    },
  };

  render();
})();
