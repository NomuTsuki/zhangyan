"use client";

import { useMemo, useState } from "react";
import { lacquerBoxCase } from "../content/lacquer-box";
import {
  createInitialWorldState,
  getDiscoveredEvidence,
  getStateLabels,
  getTestConsent,
  getTruthForDebug,
  resolveTurn,
} from "../game/resolve-action";
import type {
  ActionTone,
  EvidenceDefinition,
  NPCPhase,
  PlayerAction,
  TurnRecord,
  WorldState,
} from "../game/types";

type Screen =
  | "home"
  | "arrival"
  | "investigate"
  | "evidence"
  | "response"
  | "trade"
  | "review";

const progress = [
  { id: "home", label: "开店" },
  { id: "arrival", label: "来客" },
  { id: "investigate", label: "调查" },
  { id: "trade", label: "交易" },
  { id: "review", label: "复盘" },
] as const;

const phaseLabels: Record<NPCPhase, string> = {
  relaxed: "放松",
  cautious: "谨慎",
  pressured: "受压",
  negotiating: "议价",
  exited: "离场",
};

const toneOptions: Array<{
  id: ActionTone;
  label: string;
  benefit: string;
  risk: string;
}> = [
  {
    id: "gentle",
    label: "温和",
    benefit: "更容易建立信任",
    risk: "对方可能继续掌控叙事",
  },
  {
    id: "professional",
    label: "专业",
    benefit: "证据与关系较平衡",
    risk: "无依据时推进有限",
  },
  {
    id: "firm",
    label: "强硬",
    benefit: "快速增加压力",
    risk: "信任和成交意愿下降",
  },
];

const stateColors = {
  pressure: "#d66c5c",
  trust: "#78c7a4",
  dealIntent: "#e1bd64",
  control: "#7fa9d8",
  actionPoints: "#d9d4c8",
} as const;

const stateLabelMap = getStateLabels();

function MockBadge() {
  return <span className="mock-badge">规则样片</span>;
}

function ScreenHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="screen-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function StateTimelineChart({ state }: { state: WorldState }) {
  const snapshots = [
    {
      label: "初始",
      npcState: lacquerBoxCase.initialNpcState,
      actionPoints: lacquerBoxCase.actionBudget,
    },
    ...state.actionHistory.map((turn) => ({
      label: `${turn.turn}`,
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
  const x = (index: number) =>
    snapshots.length === 1
      ? left
      : left + (index / (snapshots.length - 1)) * plotWidth;
  const y = (value: number) => top + ((100 - value) / 100) * plotHeight;
  const apAsPercent = (points: number) =>
    (points / lacquerBoxCase.actionBudget) * 100;
  const series = [
    {
      id: "pressure",
      label: "压力",
      color: stateColors.pressure,
      values: snapshots.map((item) => item.npcState.pressure),
    },
    {
      id: "trust",
      label: "信任",
      color: stateColors.trust,
      values: snapshots.map((item) => item.npcState.trust),
    },
    {
      id: "dealIntent",
      label: "成交",
      color: stateColors.dealIntent,
      values: snapshots.map((item) => item.npcState.dealIntent),
    },
    {
      id: "control",
      label: "控制",
      color: stateColors.control,
      values: snapshots.map((item) => item.npcState.control),
    },
    {
      id: "actionPoints",
      label: "行动点%",
      color: stateColors.actionPoints,
      values: snapshots.map((item) => apAsPercent(item.actionPoints)),
    },
  ];

  return (
    <div className="debug-chart-wrap">
      <svg
        className="debug-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="NPC四项状态与行动点逐回合变化图"
      >
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={left}
              x2={width - right}
              y1={y(value)}
              y2={y(value)}
              stroke="rgba(255,255,255,.12)"
              strokeWidth="1"
            />
            <text
              x={left - 8}
              y={y(value) + 4}
              textAnchor="end"
              fill="#84918c"
              fontSize="10"
            >
              {value}
            </text>
          </g>
        ))}
        {series.map((item) => (
          <polyline
            key={item.id}
            points={item.values
              .map((value, index) => `${x(index)},${y(value)}`)
              .join(" ")}
            fill="none"
            stroke={item.color}
            strokeWidth={item.id === "actionPoints" ? 2 : 2.6}
            strokeDasharray={item.id === "actionPoints" ? "6 5" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {snapshots.map((item, index) => (
          <g key={`${item.label}-${index}`}>
            <line
              x1={x(index)}
              x2={x(index)}
              y1={height - bottom}
              y2={height - bottom + 5}
              stroke="#84918c"
            />
            <text
              x={x(index)}
              y={height - 12}
              textAnchor="middle"
              fill="#aab4b0"
              fontSize="10"
            >
              {item.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="debug-chart-legend">
        {series.map((item) => (
          <span key={item.id}>
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EvidenceMiniCard({
  evidenceId,
}: {
  evidenceId: string;
}) {
  const evidence = (
    lacquerBoxCase.evidence as Record<string, EvidenceDefinition>
  )[evidenceId];
  return (
    <article className="evidence-list-card">
      <div className="card-topline">
        <span>{evidence.kind === "statement" ? "陈述证据" : evidence.kind === "test" ? "检测证据" : "器物证据"}</span>
        <strong>{evidence.strength}</strong>
      </div>
      <h3>{evidence.name}</h3>
      <p><strong>观察事实：</strong>{evidence.detail}</p>
      <p><strong>可能含义：</strong>{evidence.inference}</p>
      <small><strong>温和导向：</strong>{evidence.lead}</small>
    </article>
  );
}

function debugLine(line: string, revealSecrets: boolean) {
  if (revealSecrets) return line;
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

function DebugTurnDetails({
  turn,
  revealSecrets,
}: {
  turn: TurnRecord;
  revealSecrets: boolean;
}) {
  const hidePricingTrace = turn.action.kind === "discount" && !revealSecrets;

  return (
    <article className="debug-turn-detail">
      <header>
        <span>第 {turn.turn} 轮</span>
        <strong>{turn.actionLabel}</strong>
        <em>-{turn.actionPointCost} AP</em>
      </header>

      {turn.changes.length > 0 && (
        <div className="debug-delta-grid">
          {turn.changes.map((change, index) => (
            <div key={`${change.key}-${index}`}>
              <span>{change.label}</span>
              <strong>{change.before} → {change.after}</strong>
              <small>{change.delta > 0 ? "+" : ""}{change.delta}</small>
            </div>
          ))}
        </div>
      )}

      <div className="debug-log">
        {turn.formulaLog.map((line, index) => (
          <p key={`${line}-${index}`}><code>{debugLine(line, revealSecrets)}</code></p>
        ))}
      </div>

      {turn.spindle && (
        <div className="spindle-debug">
          <div className="spindle-stage">
            <strong>输入发散</strong>
            {turn.spindle.expansion.map((line) => (
              <span key={line}>{debugLine(line, revealSecrets)}</span>
            ))}
          </div>
          <div className="candidate-list">
            {turn.spindle.candidates.map((candidate) => (
              <div
                className={`${candidate.id === turn.spindle?.selectedId ? "selected" : ""} ${candidate.eligible ? "" : "filtered"}`}
                key={candidate.id}
              >
                <span>{candidate.label}</span>
                <strong>
                  {hidePricingTrace
                    ? candidate.eligible ? "入围" : "过滤"
                    : candidate.eligible ? candidate.score : "过滤"}
                </strong>
                <small>
                  {hidePricingTrace ? "定价评分分项：局末解锁" : candidate.formula}
                </small>
                <em>
                  {hidePricingTrace
                    ? "本轮只公开候选状态与最终回应"
                    : candidate.reasons.join("；")}
                </em>
              </div>
            ))}
          </div>
          <div className="spindle-stage converge">
            <strong>Storylet收敛</strong>
            {turn.spindle.convergence.map((line) => (
              <span key={line}>{debugLine(line, revealSecrets)}</span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function DebugRail({
  state,
  screen,
}: {
  state: WorldState;
  screen: Screen;
}) {
  const revealSecrets = state.status === "settled";
  const truth = revealSecrets ? getTruthForDebug(lacquerBoxCase, state) : null;
  const lastTurn = state.actionHistory.at(-1);
  const settlement = state.settlement;
  const pageLabel =
    screen === "evidence" || screen === "response"
      ? "调查辅助"
      : progress.find((item) => item.id === screen)?.label ?? screen;

  return (
    <aside className="debug-rail" aria-label="开发调试与规则进程">
      <header className="debug-rail-header">
        <p>DEVELOPMENT VIEW</p>
        <h2>规则、状态与回放</h2>
        <span>供讨论和调试，不属于手机玩家界面</span>
      </header>

      <section className="debug-panel">
        <div className="debug-panel-title"><h3>当前 WorldState</h3><span>实时</span></div>
        <dl className="debug-snapshot">
          <div><dt>页面</dt><dd>{pageLabel}</dd></div>
          <div><dt>回合</dt><dd>{state.turn}</dd></div>
          <div><dt>行动点</dt><dd>{state.actionPoints} / {lacquerBoxCase.actionBudget}</dd></div>
          <div><dt>证据</dt><dd>{state.discoveredEvidenceIds.length} 条</dd></div>
          <div><dt>当前价格</dt><dd>{state.currentPrice} 点</dd></div>
          <div><dt>检测费用</dt><dd>{state.feesPaid} 点</dd></div>
          <div><dt>NPC阶段</dt><dd>{phaseLabels[state.npcState.phase]}</dd></div>
          <div><dt>NPC认知档案</dt><dd>{lacquerBoxCase.npcProfile.label}</dd></div>
          <div><dt>隐藏真相</dt><dd>{truth ? `${truth.label} · ${truth.trueValue}点` : "局末解锁"}</dd></div>
          <div><dt>seed</dt><dd>{state.seed}</dd></div>
        </dl>
        <div className="debug-live-state">
          {Object.entries(stateLabelMap).map(([key, label]) => (
            <div key={key}>
              <span>{label}</span>
              <strong>{state.npcState[key as keyof typeof stateLabelMap]}</strong>
              <i><b style={{ width: `${state.npcState[key as keyof typeof stateLabelMap]}%` }} /></i>
            </div>
          ))}
        </div>
      </section>

      <section className="debug-panel">
        <div className="debug-panel-title">
          <h3>纺锤规则链</h3>
          <span>{lastTurn ? `第 ${lastTurn.turn} 轮` : "等待输入"}</span>
        </div>
        <ol className="debug-pipeline">
          {[
            "接收结构化行动",
            "扣除共享行动成本",
            "发散证据、态度与历史特征",
            "收敛为四项 NPC 数值",
            "发散合法候选行为",
            "效用评分与 Storylet 收敛",
            "写入回应与完整回放",
          ].map((item, index) => (
            <li className={lastTurn ? "done" : index === 0 ? "active" : ""} key={item}>
              <i>{index + 1}</i><span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      {lastTurn ? (
        <section className="debug-panel debug-result">
          <div className="debug-panel-title"><h3>最近一轮精确输出</h3><span>{lastTurn.title}</span></div>
          <DebugTurnDetails turn={lastTurn} revealSecrets={revealSecrets} />
        </section>
      ) : (
        <section className="debug-panel">
          <div className="debug-panel-title"><h3>最近一轮精确输出</h3><span>空</span></div>
          <p className="debug-empty">开始检查或询问后，这里会显示公式、候选行为、过滤原因与收敛结果。</p>
        </section>
      )}

      {state.status === "settled" && settlement && (
        <>
          <section className="debug-panel debug-report">
            <div className="debug-panel-title"><h3>整局状态变化图</h3><span>{state.actionHistory.length} 轮</span></div>
            <StateTimelineChart state={state} />
          </section>

          <section className="debug-panel debug-report">
            <div className="debug-panel-title"><h3>客观结果公式</h3><span>{settlement.objectiveScore} / 100</span></div>
            <div className="debug-formula-stack">
              {settlement.objectiveFormula.map((line) => <code key={line}>{line}</code>)}
            </div>
          </section>

          <section className="debug-panel debug-report">
            <div className="debug-panel-title"><h3>判断质量公式</h3><span>{settlement.judgmentScore} / 100</span></div>
            <div className="posterior-grid">
              {settlement.posterior.map((entry) => (
                <div key={entry.variantId}>
                  <span>{entry.label}</span>
                  <strong>{(entry.probability * 100).toFixed(1)}%</strong>
                  <small>价值 {entry.trueValue}</small>
                </div>
              ))}
            </div>
            <div className="debug-formula-stack">
              {settlement.judgmentFormula.map((line) => <code key={line}>{line}</code>)}
            </div>
          </section>

          <section className="debug-panel debug-report">
            <div className="debug-panel-title"><h3>全回合公式记录</h3><span>可复现</span></div>
            <div className="debug-all-turns">
              {state.actionHistory.map((turn) => (
                <DebugTurnDetails key={turn.turn} turn={turn} revealSecrets={revealSecrets} />
              ))}
            </div>
          </section>
        </>
      )}
    </aside>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [worldState, setWorldState] = useState<WorldState>(() =>
    createInitialWorldState(lacquerBoxCase),
  );
  const [selectedTargetId, setSelectedTargetId] = useState("surface");
  const [selectedTopicId, setSelectedTopicId] = useState("repair-history");
  const [selectedTone, setSelectedTone] =
    useState<ActionTone>("professional");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [evidenceReturnScreen, setEvidenceReturnScreen] =
    useState<"investigate" | "trade">("investigate");
  const [feedback, setFeedback] = useState<string | null>(null);

  const discoveredEvidence = useMemo(
    () => getDiscoveredEvidence(lacquerBoxCase, worldState),
    [worldState],
  );
  const lastTurn = worldState.actionHistory.at(-1);
  const selectedTarget = lacquerBoxCase.observationTargets.find(
    (item) => item.id === selectedTargetId,
  )!;
  const selectedTopic = lacquerBoxCase.dialogueTopics.find(
    (item) => item.id === selectedTopicId,
  )!;
  const testConsent = getTestConsent(lacquerBoxCase, worldState);
  const settlement = worldState.settlement;
  const currentStep =
    screen === "home"
      ? 0
      : screen === "arrival"
        ? 1
        : screen === "trade"
          ? 3
          : screen === "review"
            ? 4
            : 2;

  function go(next: Screen) {
    setFeedback(null);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEvidence(returnScreen: "investigate" | "trade") {
    setEvidenceReturnScreen(returnScreen);
    go("evidence");
  }

  function performAction(action: PlayerAction) {
    try {
      const next = resolveTurn(lacquerBoxCase, worldState, action);
      setWorldState(next);
      setFeedback(null);
      setScreen(next.status === "settled" ? "review" : "response");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "行动无法执行");
    }
  }

  function resetPrototype() {
    setScreen("home");
    setWorldState(createInitialWorldState(lacquerBoxCase));
    setSelectedTargetId("surface");
    setSelectedTopicId("repair-history");
    setSelectedTone("professional");
    setSelectedEvidenceId("");
    setEvidenceReturnScreen("investigate");
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="prototype-stage">
      <section className="phone-shell" aria-label="《掌眼》手机竖屏低保真原型">
        <header className="app-header">
          <div className="brand-row">
            <div>
              <span className="brand-mark">掌眼</span>
              <span className="brand-subtitle">鉴器 · 辨言 · 定交易</span>
            </div>
            <span className="case-code">案件 001</span>
          </div>
          <ol className="progress-strip" aria-label="案件进度">
            {progress.map((item, index) => (
              <li
                className={index === currentStep ? "active" : index < currentStep ? "done" : ""}
                key={item.id}
                aria-current={index === currentStep ? "step" : undefined}
              >
                <span>{index + 1}</span>
                <small>{item.label}</small>
              </li>
            ))}
          </ol>
        </header>

        <div className="screen" aria-live="polite">
          {screen === "home" && (
            <>
              <ScreenHeading
                eyebrow="P0 · 店铺首页"
                title="今日开门，第一位来客已到"
                description="客观真相藏在器物里，交易结果取决于你如何分配有限行动。"
              />
              <div className="status-board">
                <div><span>营业状态</span><strong>已开门</strong></div>
                <div><span>调查预算</span><strong>{lacquerBoxCase.actionBudget} 点</strong></div>
                <div><span>案件</span><strong>1 / 1</strong></div>
              </div>
              <article className="guest-card">
                <div className="avatar-placeholder" aria-hidden="true">刘</div>
                <div className="guest-copy">
                  <p className="card-kicker">今日来客</p>
                  <h2>{lacquerBoxCase.seller.name}</h2>
                  <p>带来一只旧漆木首饰盒，希望尽快出手。</p>
                  <div className="tag-row"><span>来源待核</span><span>开价待判</span></div>
                </div>
              </article>
              <div className="prototype-callout">
                <MockBadge />
                <p>本版重点验证共享行动点、动态证据、NPC纺锤决策与客观结算。</p>
              </div>
              <button className="primary-button" onClick={() => go("arrival")}>
                接待刘先生 <span aria-hidden="true">→</span>
              </button>
            </>
          )}

          {screen === "arrival" && (
            <>
              <ScreenHeading
                eyebrow="P1 · 来客上门"
                title="先记录说法，再决定如何验证"
                description="检测和询问可以任意交叉，但都会消耗同一套行动点。"
              />
              <div className="arrival-scene">
                <div className="npc-bust" aria-label="刘先生人物占位">
                  <span>刘</span><small>人物占位</small>
                </div>
                <div className="artifact-mini" aria-label="漆木首饰盒占位">
                  <div className="mini-lid" /><div className="mini-box"><i /></div>
                  <small>器物占位</small>
                </div>
              </div>
              <section className="statement-panel">
                <div className="speaker-line"><strong>刘先生</strong><span>初始陈述</span></div>
                {lacquerBoxCase.claims.map((claim) => (
                  <blockquote key={claim.id}>“{claim.text}”</blockquote>
                ))}
              </section>
              <div className="price-row">
                <div><span>卖家开价</span><strong>{lacquerBoxCase.seller.openingPrice} 价值点</strong></div>
                <small>游戏内量化值，不对应真实市场人民币</small>
              </div>
              <div className="button-stack">
                <button className="primary-button" onClick={() => go("investigate")}>进入调查循环</button>
                <button className="text-button" onClick={() => go("home")}>返回店铺</button>
              </div>
            </>
          )}

          {screen === "investigate" && (
            <>
              <ScreenHeading
                eyebrow="P2 · 交叉调查"
                title="边看边问，把线索连成证据"
                description="检查、询问、追问和议价共用行动点；交易入口始终保留。"
              />

              <div className="resource-row resource-triple">
                <div><span>行动点</span><strong>{worldState.actionPoints} / {lacquerBoxCase.actionBudget}</strong></div>
                <div><span>证据</span><strong>{discoveredEvidence.length}</strong></div>
                <div><span>当前价</span><strong>{worldState.currentPrice}</strong></div>
              </div>

              {worldState.actionPoints === 0 && (
                <div className="strategy-feedback" role="status">
                  调查预算已经耗尽。你仍可按当前价格购买或拒绝，不会陷入死局。
                </div>
              )}

              <section className="investigation-card">
                <div className="section-title">
                  <div><span>器物检测</span><h2>选择观察位置</h2></div>
                  <small>每次 -1 行动点</small>
                </div>
                <div className="observation-targets">
                  {lacquerBoxCase.observationTargets.map((target) => {
                    const inspected = worldState.inspectedTargetIds.includes(target.id);
                    return (
                      <button
                        className={selectedTargetId === target.id ? "selected" : ""}
                        onClick={() => setSelectedTargetId(target.id)}
                        key={target.id}
                      >
                        <strong>{target.label}</strong>
                        <small>{inspected ? "已检查" : target.short}</small>
                      </button>
                    );
                  })}
                </div>
                <div className={`artifact-map target-${selectedTarget.id}`}>
                  <div className="artifact-map-lid" />
                  <div className="artifact-map-body"><i /></div>
                  <span>{selectedTarget.label}</span>
                </div>
                <div className="soft-guidance">
                  <strong>背景提示</strong>
                  <p>{selectedTarget.knowledgeHint}</p>
                </div>
                <button
                  className="primary-button"
                  disabled={worldState.actionPoints < 1}
                  onClick={() => performAction({ kind: "inspect", targetId: selectedTarget.id })}
                >
                  {worldState.inspectedTargetIds.includes(selectedTarget.id)
                    ? `复查${selectedTarget.label}（仍消耗 1 点）`
                    : `检查${selectedTarget.label}（-1 行动点）`}
                </button>
              </section>

              <section className="investigation-card dialogue-builder">
                <div className="section-title">
                  <div><span>NPC交流</span><h2>组成一次询问或追问</h2></div>
                  <small>每次 -1 行动点</small>
                </div>
                <p className="builder-label">1. 选择问题</p>
                <div className="topic-options">
                  {lacquerBoxCase.dialogueTopics.map((topic) => (
                    <button
                      className={selectedTopicId === topic.id ? "selected" : ""}
                      onClick={() => setSelectedTopicId(topic.id)}
                      key={topic.id}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
                <blockquote className="question-preview">“{selectedTopic.prompt}”</blockquote>

                <label className="evidence-select">
                  <span>2. 引用证据（可以不选）</span>
                  <select
                    value={selectedEvidenceId}
                    onChange={(event) => setSelectedEvidenceId(event.target.value)}
                  >
                    <option value="">不出示证据，先固定说法</option>
                    {discoveredEvidence.map((evidence) => (
                      <option value={evidence.id} key={evidence.id}>
                        {evidence.name} · {evidence.topic}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="builder-label">3. 选择表达方式</p>
                <div className="tone-compact">
                  {toneOptions.map((option) => (
                    <button
                      className={selectedTone === option.id ? "selected" : ""}
                      onClick={() => setSelectedTone(option.id)}
                      key={option.id}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.benefit}</span>
                      <small>{option.risk}</small>
                    </button>
                  ))}
                </div>

                <button
                  className="primary-button"
                  disabled={worldState.actionPoints < 1}
                  onClick={() => performAction({
                    kind: "dialogue",
                    topicId: selectedTopicId,
                    tone: selectedTone,
                    evidenceId: selectedEvidenceId || undefined,
                  })}
                >
                  {selectedEvidenceId ? "引用证据追问（-1 行动点）" : "开放询问（-1 行动点）"}
                </button>
              </section>

              <details className="knowledge-drawer">
                <summary>打开鉴定背景知识</summary>
                <div>
                  {lacquerBoxCase.knowledgeCards.map((card) => (
                    <article key={card.id}><strong>{card.title}</strong><p>{card.body}</p></article>
                  ))}
                </div>
              </details>

              {feedback && <div className="strategy-feedback" role="status">{feedback}</div>}

              <nav className="tool-nav investigation-tools" aria-label="案件工具">
                <button onClick={() => openEvidence("investigate")}>
                  <strong>证据簿</strong><span>{discoveredEvidence.length} 条证据</span>
                </button>
                <button onClick={() => go("trade")}>
                  <strong>进入交易</strong><span>随时决策</span>
                </button>
              </nav>
            </>
          )}

          {screen === "evidence" && (
            <>
              <ScreenHeading
                eyebrow="P2 · 证据簿"
                title="事实、解释和导向分开记录"
                description="证据簿只保存信息，不在这里直接发起行动。"
              />
              {discoveredEvidence.length > 0 ? (
                <div className="evidence-list">
                  {discoveredEvidence.map((evidence) => (
                    <EvidenceMiniCard evidenceId={evidence.id} key={evidence.id} />
                  ))}
                </div>
              ) : (
                <div className="empty-evidence">
                  <strong>尚未发现器物证据</strong>
                  <p>你仍然可以先向NPC开放询问，记录他的原始说法。</p>
                </div>
              )}

              <section className="statement-log">
                <div className="section-title"><h2>NPC陈述历史</h2><span>{worldState.statementHistory.length} 条</span></div>
                {worldState.statementHistory.length > 0 ? worldState.statementHistory.map((statement) => (
                  <div key={`${statement.turn}-${statement.topicId}`}>
                    <span>第 {statement.turn} 轮 · {lacquerBoxCase.dialogueTopics.find((topic) => topic.id === statement.topicId)?.label}</span>
                    <blockquote>“{statement.text}”</blockquote>
                  </div>
                )) : <p>初始陈述已记录；后续询问会在这里形成时间线。</p>}
              </section>

              <button className="secondary-button" onClick={() => go(evidenceReturnScreen)}>
                {evidenceReturnScreen === "trade" ? "返回交易" : "返回调查"}
              </button>
            </>
          )}

          {screen === "response" && lastTurn && (
            <>
              <ScreenHeading
                eyebrow={`第 ${lastTurn.turn} 轮 · 行动结果`}
                title={lastTurn.title}
                description={lastTurn.actionLabel}
              />

              {lastTurn.changes.length > 0 && (
                <div className="phase-change">
                  <span>{phaseLabels[lastTurn.before.npcState.phase]}</span>
                  <i aria-hidden="true">→</i>
                  <strong>{phaseLabels[lastTurn.after.npcState.phase]}</strong>
                  <MockBadge />
                </div>
              )}

              <section className="response-card">
                <div className="card-topline">
                  <span>{lastTurn.statement ? "NPC回应" : "调查结果"}</span>
                  <strong>行动点 -{lastTurn.actionPointCost}</strong>
                </div>
                {lastTurn.statement
                  ? <blockquote>“{lastTurn.statement.text}”</blockquote>
                  : <p>{lastTurn.description}</p>}
              </section>

              {lastTurn.evidenceAdded.length > 0 && (
                <section className="new-evidence-stack">
                  <div className="section-title"><h2>本轮新增证据</h2><span>{lastTurn.evidenceAdded.length} 条</span></div>
                  {lastTurn.evidenceAdded.map((evidenceId) => (
                    <EvidenceMiniCard evidenceId={evidenceId} key={evidenceId} />
                  ))}
                </section>
              )}

              {lastTurn.statement && (
                <div className="insight-callout">
                  <strong>系统已记录</strong>
                  <p>这句话已经进入陈述历史。下一轮可以换问题、继续观察，或引用已有证据追问。</p>
                </div>
              )}

              <div className="button-stack">
                <button
                  className="primary-button"
                  onClick={() => go(worldState.actionPoints > 0 ? "investigate" : "trade")}
                >
                  {worldState.actionPoints > 0 ? "继续调查" : "行动点耗尽，进入交易"}
                </button>
                <button className="secondary-button" onClick={() => go("trade")}>现在进入交易</button>
                <button className="text-button" onClick={() => openEvidence("investigate")}>查看证据簿</button>
              </div>
            </>
          )}

          {screen === "trade" && (
            <>
              <ScreenHeading
                eyebrow="P3 · 交易处置"
                title="结束、议价，还是付费补证"
                description="买下和拒绝是终局；折价与专项检测有真实代价，也可能失败。"
              />

              <div className="resource-row resource-triple">
                <div><span>行动点</span><strong>{worldState.actionPoints}</strong></div>
                <div><span>当前价</span><strong>{worldState.currentPrice}</strong></div>
                <div><span>检测费</span><strong>{worldState.feesPaid}</strong></div>
              </div>

              <div className="risk-summary">
                <div><span>已知证据</span><strong>{discoveredEvidence.length} 条</strong></div>
                <ul>
                  {discoveredEvidence.slice(-3).map((evidence) => (
                    <li key={evidence.id}>{evidence.name}：{evidence.inference}</li>
                  ))}
                  {discoveredEvidence.length === 0 && <li>尚无器物证据，只掌握卖家初始说法。</li>}
                </ul>
              </div>

              <div className="trade-actions">
                <button onClick={() => performAction({ kind: "buy" })}>
                  <span><strong>按当前价买下</strong><em>终局</em></span>
                  <small>支付 {worldState.currentPrice} 价值点，直接承担真伪与价值结果。</small>
                </button>
                <button
                  disabled={worldState.actionPoints < 1 || worldState.currentPrice <= lacquerBoxCase.suggestedDiscount}
                  onClick={() => performAction({ kind: "discount", offer: lacquerBoxCase.suggestedDiscount })}
                >
                  <span><strong>提出 {lacquerBoxCase.suggestedDiscount} 点折价</strong><em>-1 AP</em></span>
                  <small>NPC可能接受、还价、拒绝或离场；不是必定成功的按钮。</small>
                </button>
                <button
                  disabled={!testConsent.allowed}
                  onClick={() => performAction({ kind: "test", testId: lacquerBoxCase.test.id })}
                >
                  <span><strong>{lacquerBoxCase.test.label}</strong><em>-2 AP / -10价值</em></span>
                  <small>{lacquerBoxCase.test.description} 检测后仍需交易决策。</small>
                </button>
                <button onClick={() => performAction({ kind: "reject" })}>
                  <span><strong>拒绝交易</strong><em>终局</em></span>
                  <small>避免继续承担价格风险，但可能错失被低估的珍品。</small>
                </button>
              </div>

              {!testConsent.allowed && (
                <div className="strategy-feedback">
                  当前不能送检：{testConsent.reasons.join("；") || "条件不满足"}。
                </div>
              )}
              {feedback && <div className="strategy-feedback" role="status">{feedback}</div>}

              <button
                className="secondary-button"
                onClick={() => openEvidence("trade")}
              >
                查看完整证据簿与陈述
              </button>
              <button
                className="text-button"
                disabled={worldState.actionPoints === 0}
                onClick={() => go("investigate")}
              >
                {worldState.actionPoints > 0 ? "返回调查" : "行动点耗尽，只能买下或拒绝"}
              </button>
            </>
          )}

          {screen === "review" && settlement && (
            <>
              <ScreenHeading
                eyebrow="P4 · 双层结算"
                title={settlement.endingTitle}
                description="客观结果决定本局事实上的成败；判断质量解释你当时是否有理有据。"
              />

              <div className={`outcome-banner ${settlement.objectiveSuccess ? "success" : "failure"}`}>
                <span>最终处置</span>
                <h2>{settlement.choiceLabel}</h2>
                <p>{settlement.objectiveLabel} · {settlement.judgmentLabel}</p>
              </div>

              <section className="truth-panel">
                <div className="section-title"><h2>物品客观真相</h2><span>复盘解锁</span></div>
                <h3>{settlement.truthLabel} · 真实价值 {settlement.trueValue}</h3>
                <ul>
                  {lacquerBoxCase.truthVariants[settlement.truthVariantId].facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </section>

              <section className="score-panel score-panel-large">
                <div><span>客观结果分</span><strong>{settlement.objectiveScore}</strong><small>{settlement.objectiveLabel}</small></div>
                <div><span>判断质量分</span><strong>{settlement.judgmentScore}</strong><small>{settlement.judgmentLabel}</small></div>
                <div><span>实际净结果</span><strong>{settlement.actualNet > 0 ? "+" : ""}{settlement.actualNet}</strong><small>价值 - 成交 - 检测费</small></div>
                <div><span>机会损失</span><strong>{settlement.regret}</strong><small>最佳可能 - 实际结果</small></div>
              </section>

              <div className="review-evidence">
                <div><span>本局发现</span><strong>{discoveredEvidence.length} 条证据</strong></div>
                <div><span>有成本行动</span><strong>{worldState.actionHistory.filter((turn) => turn.actionPointCost > 0).length} 次</strong></div>
                <div><span>检测费用</span><strong>{worldState.feesPaid} 点</strong></div>
              </div>

              <div className="prototype-callout">
                <MockBadge />
                <p>桌面右侧已经展开四项状态曲线、每轮公式、候选行为评分、后验概率和结算公式。</p>
              </div>

              <button className="primary-button" onClick={resetPrototype}>重新体验</button>
            </>
          )}
        </div>

        <footer className="app-footer">
          <span>共享行动循环原型</span><span>390 × 844 基准</span>
        </footer>
      </section>

      <DebugRail state={worldState} screen={screen} />
    </main>
  );
}
