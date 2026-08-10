import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { lacquerBoxCase } from "../content/lacquer-box";
import {
  calculateNegotiationCapacity,
  getPlayerReferenceOffer,
} from "../game/negotiation";
import { GRADE_ORDER } from "../game/outcome-grades";
import {
  calculatePosterior,
  createInitialWorldState,
  getDiscoveredEvidence,
  getTestConsent,
  resolveTurn,
} from "../game/resolve-action";
import type {
  ActionTone,
  EvidenceDefinition,
  PlayerAction,
  TruthVariantId,
  WorldState,
} from "../game/types";
import { ArtifactIllustration } from "./components/ArtifactIllustration";
import {
  buildPlayerPresentation,
  buildPlayerView,
  buildSettlementCard,
  describeNpcAtmosphere,
  type PlayerProjection,
  type PlayerEvidenceView,
  type PlayerSettlementCard,
  type PlayerView,
} from "./presentation";
import {
  buildDeveloperProjection,
  type DeveloperProjection,
} from "../game/projections";
import "./styles.css";

type Stage = "arrival" | "investigate" | "result" | "trade" | "review";
type InvestigationMode = "observe" | "ask";
type Overlay = "evidence" | "reference" | null;

const toneOptions: Array<{
  id: ActionTone;
  label: string;
  description: string;
}> = [
  { id: "gentle", label: "温和求证", description: "保护关系，更容易让对方补充回忆" },
  { id: "professional", label: "专业核验", description: "围绕事实推进，关系与压力较平衡" },
  { id: "firm", label: "直接质疑", description: "施压明显，但可能损伤信任与成交意愿" },
];

const strengthCopy = {
  weak: "线索",
  medium: "中等证据",
  strong: "强证据",
  anchor: "锚点证据",
} as const;

function Icon({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <span className="icon" aria-hidden={label ? undefined : true} aria-label={label}>
      {children}
    </span>
  );
}

function ResourcePill({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`resource-pill${emphasis ? " is-emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Progress({ stage }: { stage: Stage }) {
  const current =
    stage === "arrival"
      ? 0
      : stage === "investigate" || stage === "result"
        ? 1
        : stage === "trade"
          ? 2
          : 3;
  const labels = ["来客", "查验", "交易", "复盘"];
  return (
    <ol className="progress" aria-label="本局进度">
      {labels.map((label, index) => (
        <li
          className={
            index === current ? "is-current" : index < current ? "is-complete" : ""
          }
          aria-current={index === current ? "step" : undefined}
          key={label}
        >
          <i>{index < current ? "✓" : index + 1}</i>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function EvidenceCard({
  evidence,
  shared,
  compact = false,
}: {
  evidence: PlayerEvidenceView;
  shared: boolean;
  compact?: boolean;
}) {
  return (
    <article className={`evidence-card${compact ? " is-compact" : ""}`}>
      <div className="evidence-card__meta">
        <span>{strengthCopy[evidence.strength]}</span>
        <em>{evidence.kind === "test" ? "双方已知" : shared ? "已向卖家公开" : "仅你掌握"}</em>
      </div>
      <h3>{evidence.name}</h3>
      <p>
        <b>看到什么</b>
        {evidence.detail}
      </p>
      {!compact && (
        <>
          <p>
            <b>可能意味着</b>
            {evidence.inference}
          </p>
          <p className="evidence-lead">
            <b>下一步线索</b>
            {evidence.lead}
          </p>
        </>
      )}
    </article>
  );
}

function OverlaySheet({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const sheet = sheetRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(
        sheet?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
    focusables()[0]?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet__handle" />
        <header>
          <div>
            <span>{eyebrow}</span>
            <h2 id="sheet-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={`关闭${title}`}>
            ×
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        <button className="secondary-button sheet__close" onClick={onClose}>
          返回当前页面
        </button>
      </section>
    </div>
  );
}

function PlayerHeader({
  stage,
  evidenceCount,
  onOpenEvidence,
}: {
  stage: Stage;
  evidenceCount: number;
  onOpenEvidence: () => void;
}) {
  return (
    <header className="player-header">
      <div className="brand">
        <strong>掌眼</strong>
        <span>鉴器 · 察人 · 定交易</span>
      </div>
      <button className="ledger-button" onClick={onOpenEvidence}>
        <Icon>册</Icon>
        证据簿
        <em>{evidenceCount}</em>
      </button>
      <Progress stage={stage} />
    </header>
  );
}

function Arrival({
  onStart,
  onReference,
}: {
  onStart: () => void;
  onReference: () => void;
}) {
  return (
    <main
      className="screen arrival-screen"
      data-stage-focus
      tabIndex={-1}
      aria-label="来客"
    >
      <div className="arrival-ambient">
        <span>今日第 1 位来客</span>
        <p>门帘轻响，一只包着旧报纸的木盒被放到柜面。</p>
      </div>

      <section className="seller-card">
        <div className="seller-avatar" aria-hidden="true">
          刘
        </div>
        <div>
          <span>来客 · {lacquerBoxCase.seller.name}</span>
          <h1>{lacquerBoxCase.title}</h1>
          <p>{lacquerBoxCase.seller.summary}</p>
        </div>
      </section>

      <blockquote>
        “{lacquerBoxCase.claims[0].text}”
        <cite>卖家最初陈述</cite>
      </blockquote>

      <section className="opening-price">
        <span>卖家开价</span>
        <strong>{lacquerBoxCase.seller.openingPrice}</strong>
        <em>价值点</em>
        <p>开价只是卖家的当前判断，不代表真实价值。</p>
      </section>

      <div className="trait-list" aria-label="卖家公开印象">
        {lacquerBoxCase.npcProfile.publicTraits.map((trait) => (
          <span key={trait}>{trait}</span>
        ))}
      </div>

      <div className="screen-actions">
        <button className="primary-button" onClick={onStart}>
          把器物请上鉴台
        </button>
        <button className="text-button" onClick={onReference}>
          先翻阅参考簿
        </button>
      </div>
    </main>
  );
}

function Investigation({
  player,
  mode,
  selectedTargetId,
  selectedTopicId,
  selectedTone,
  selectedEvidenceId,
  notice,
  onMode,
  onSelectTarget,
  onSelectTopic,
  onSelectTone,
  onSelectEvidence,
  onInspect,
  onAsk,
  onTest,
  onTrade,
  onReference,
}: {
  player: PlayerView;
  mode: InvestigationMode;
  selectedTargetId: string;
  selectedTopicId: string;
  selectedTone: ActionTone;
  selectedEvidenceId: string;
  notice: string;
  onMode: (mode: InvestigationMode) => void;
  onSelectTarget: (targetId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onSelectTone: (tone: ActionTone) => void;
  onSelectEvidence: (evidenceId: string) => void;
  onInspect: () => void;
  onAsk: () => void;
  onTest: () => void;
  onTrade: () => void;
  onReference: () => void;
}) {
  const selectedTarget =
    lacquerBoxCase.observationTargets.find((target) => target.id === selectedTargetId)
    ?? lacquerBoxCase.observationTargets[0];
  const evidence = player.discoveredEvidence;
  const testConsent = player.testConsent;
  const lastTurn = player.lastTurn;
  const lastStatement = player.statementHistory.at(-1);
  const phase = player.projection.atmosphere;

  return (
    <main
      className="screen investigation-screen"
      data-stage-focus
      tabIndex={-1}
      aria-label="调查"
    >
      <section className="case-strip">
        <div>
          <span>案号 001</span>
          <strong>{lacquerBoxCase.title}</strong>
        </div>
        <button className="quiet-button" onClick={onReference}>
          参考簿
        </button>
      </section>

      <div className="resource-rail">
        <ResourcePill
          label="调查行动"
          value={`${player.actionPoints} / ${lacquerBoxCase.actionBudget}`}
          emphasis={player.actionPoints <= 2}
        />
        <ResourcePill label="当前要价" value={`${player.currentPrice} 点`} />
        <ResourcePill label="卖家状态" value={phase.label} />
      </div>

      <div className="mode-switch" role="group" aria-label="调查方式">
        <button
          aria-pressed={mode === "observe"}
          className={mode === "observe" ? "is-active" : ""}
          onClick={() => onMode("observe")}
        >
          观察器物
        </button>
        <button
          aria-pressed={mode === "ask"}
          className={mode === "ask" ? "is-active" : ""}
          onClick={() => onMode("ask")}
        >
          询问来客
        </button>
      </div>

      {mode === "observe" ? (
        <>
          <section className="artifact-stage">
            <div className="section-heading">
              <div>
                <span>器物查验</span>
                <h2>选择要看的位置</h2>
              </div>
              <em>每次消耗 1 点</em>
            </div>
            <ArtifactIllustration
              selectedTargetId={selectedTargetId}
              inspectedTargetIds={player.inspectedTargetIds}
              onSelect={onSelectTarget}
            />
            <div className="target-copy" aria-live="polite">
              <span>{selectedTarget.label}</span>
              <strong>{selectedTarget.short}</strong>
              <p>{selectedTarget.knowledgeHint}</p>
            </div>
            <button
              className="primary-button"
              disabled={player.actionPoints < 1}
              onClick={onInspect}
            >
              {player.inspectedTargetIds.includes(selectedTarget.id)
                ? `复查${selectedTarget.label} · 消耗 1 点`
                : `检查${selectedTarget.label} · 消耗 1 点`}
            </button>
          </section>

          <section className="specialist-card">
            <div>
              <span>有代价的确定性</span>
              <h3>{lacquerBoxCase.test.label}</h3>
              <p>{lacquerBoxCase.test.description}</p>
            </div>
            <button
              className="secondary-button"
              disabled={!testConsent.allowed}
              onClick={onTest}
              title={testConsent.allowed ? undefined : testConsent.reasons.join("；")}
            >
              送检 · {lacquerBoxCase.test.actionPointCost} 行动 / {lacquerBoxCase.test.valueCost} 价值
            </button>
          </section>
        </>
      ) : (
        <section className="dialogue-panel">
          <div className="npc-presence">
            <div className="seller-avatar is-small" aria-hidden="true">
              刘
            </div>
            <div>
              <span>{lacquerBoxCase.seller.name}</span>
              <strong>{phase.label}</strong>
              <p>{phase.detail}</p>
            </div>
          </div>

          {lastStatement && (
            <blockquote className="last-response">
              “{lastStatement.text}”
              <cite>最近一次回答</cite>
            </blockquote>
          )}

          {lastTurn?.action.kind === "dialogue" && lastTurn.priceChange && (
            <div className="price-revaluation" role="status">
              <div>
                <span>卖家正式重估</span>
                <strong>
                  {lastTurn.priceChange.before}
                  <i aria-hidden="true">→</i>
                  {lastTurn.priceChange.after}
                </strong>
              </div>
              <p>{lastTurn.priceChange.publicReason}</p>
            </div>
          )}

          <fieldset>
            <legend>1. 你想问什么</legend>
            <div className="choice-grid">
              {lacquerBoxCase.dialogueTopics.map((topic) => (
                <button
                  type="button"
                  className={selectedTopicId === topic.id ? "is-selected" : ""}
                  aria-pressed={selectedTopicId === topic.id}
                  onClick={() => onSelectTopic(topic.id)}
                  key={topic.id}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend id="evidence-choice-label">2. 是否出示具体证据</legend>
            <select
              aria-labelledby="evidence-choice-label"
              value={selectedEvidenceId}
              onChange={(event) => onSelectEvidence(event.target.value)}
            >
              <option value="">不出示证据，只作询问</option>
              {evidence
                .filter((item) => item.kind === "object")
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    出示「{item.name}」
                    {item.shared ? "（已公开）" : ""}
                  </option>
                ))}
            </select>
            <small>一旦出示，这条证据会进入双方共享信息；未选中的证据仍然私有。</small>
          </fieldset>

          <fieldset>
            <legend>3. 选择表达方式</legend>
            <div className="tone-list">
              {toneOptions.map((tone) => (
                <button
                  type="button"
                  className={selectedTone === tone.id ? "is-selected" : ""}
                  aria-pressed={selectedTone === tone.id}
                  onClick={() => onSelectTone(tone.id)}
                  key={tone.id}
                >
                  <strong>{tone.label}</strong>
                  <span>{tone.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            className="primary-button"
            disabled={player.actionPoints < 1}
            onClick={onAsk}
          >
            提问 · 消耗 1 点调查行动
          </button>

          {lastTurn?.action.kind === "dialogue" && (
            <div className="turn-feedback">
              <span>本轮变化</span>
              <strong>{lastTurn.title}</strong>
              <p>{lastTurn.description}</p>
            </div>
          )}
        </section>
      )}

      <div className="sticky-trade-entry">
        <div>
          <span>你可以随时收束调查</span>
          <strong>进入交易后，首次正式报价将锁定调查</strong>
        </div>
        <button onClick={onTrade}>进入交易</button>
      </div>

      <p className="sr-status" aria-live="polite">
        {notice}
      </p>
    </main>
  );
}

function ResultScreen({
  player,
  onCollect,
}: {
  player: PlayerView;
  onCollect: () => void;
}) {
  const lastTurn = player.lastTurn;
  const evidenceIds = lastTurn?.evidenceAdded ?? [];
  const evidence = player.discoveredEvidence.filter((item) =>
    evidenceIds.includes(item.id),
  );
  const isTest = lastTurn?.action.kind === "test";

  return (
    <main
      className="screen result-screen"
      data-stage-focus
      tabIndex={-1}
      aria-label="证据结果"
    >
      <div className="result-illustration">
        <span>{isTest ? "检" : "鉴"}</span>
      </div>
      <header>
        <span>{isTest ? "共同检测完成" : "发现新的器物证据"}</span>
        <h1>{lastTurn?.title ?? "查验完成"}</h1>
        <p>{lastTurn?.description}</p>
      </header>
      <div className="result-evidence-list">
        {evidence.map((item) => (
          <EvidenceCard
            evidence={item}
            shared={item.shared}
            key={item.id}
          />
        ))}
      </div>
      <div className="result-note">
        <strong>{isTest ? "检测结果已进入双方账本" : "器物观察默认只有你知道"}</strong>
        <p>
          {isTest
            ? "卖家也知道这项结果，后续判断与报价可能随之变化。"
            : "只有你主动在询问中出示，卖家才会把这条证据纳入判断。"}
        </p>
      </div>
      <button className="primary-button" onClick={onCollect}>
        收进证据簿，继续调查
      </button>
    </main>
  );
}

function Trade({
  player,
  offerInput,
  notice,
  onOfferInput,
  onQuote,
  onBuy,
  onReject,
  onBack,
}: {
  player: PlayerView;
  offerInput: string;
  notice: string;
  onOfferInput: (value: string) => void;
  onQuote: () => void;
  onBuy: () => void;
  onReject: () => void;
  onBack: () => void;
}) {
  const capacity = player.negotiation?.remainingCapacity
    ?? player.projection.resources.bargaining.remaining;
  const initialCapacity = player.negotiation?.initialCapacity
    ?? player.projection.resources.bargaining.total;
  const reference = player.reference;
  const lastTurn = player.lastTurn;
  const quote = Number(offerInput);
  const quoteError =
    offerInput.trim() === ""
      ? "请输入你的报价。"
      : !Number.isFinite(quote)
        ? "请输入有效数字。"
        : !Number.isInteger(quote)
          ? "报价必须使用整数。"
          : quote <= 0
            ? "报价必须大于 0。"
            : quote >= player.currentPrice
              ? `报价需低于卖家当前要价 ${player.currentPrice} 点。`
              : "";
  const validQuote = quoteError === "";
  const quoteUnavailableReason =
    quoteError || (capacity < 1 ? "议价容量已经用尽；你仍可接受当前价或拒绝。" : "");
  const locked = Boolean(player.negotiation);
  const offersMade = player.negotiation?.offersMade ?? 0;
  const tradeScreenRef = useRef<HTMLElement>(null);
  const terminalActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (offersMade < 1) return;

    const frame = window.requestAnimationFrame(() => {
      const screen = tradeScreenRef.current;
      const actions = terminalActionsRef.current;
      if (!screen || !actions) return;

      const screenRect = screen.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const neededScroll = actionsRect.bottom - screenRect.bottom + 16;
      if (neededScroll > 0) screen.scrollBy({ top: neededScroll });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [offersMade]);

  return (
    <main
      ref={tradeScreenRef}
      className="screen trade-screen"
      data-stage-focus
      tabIndex={-1}
      aria-label="交易"
    >
      <header className="trade-heading">
        <span>交易桌</span>
        <h1>现在，该把判断写进价格</h1>
        <p>系统参考偏向控制损失；最终报价与是否成交由你决定。</p>
      </header>

      <div className="resource-rail">
        <ResourcePill
          label="议价容量"
          value={`${capacity} / ${initialCapacity}`}
          emphasis={capacity <= 1}
        />
        <ResourcePill label="卖家要价" value={`${player.currentPrice} 点`} />
      </div>

      {locked && (
        <div className="locked-notice">
          <Icon>锁</Icon>
          <div>
            <strong>正式议价已经开始</strong>
            <span>调查已锁定，但你始终可以接受当前价或拒绝。</span>
          </div>
        </div>
      )}

      <section className="reference-offer">
        <div>
          <span>参考簿 · 谨慎报价</span>
          <strong>{reference.suggestedOffer}</strong>
          <em>价值点</em>
        </div>
        <p>
          依据你掌握的信息取偏保守位置；它不保证卖家接受，也不保证买到潜在珍品。
        </p>
        <button
          className="quiet-button"
          disabled={reference.suggestedOffer >= player.currentPrice}
          onClick={() =>
            onOfferInput(
              String(reference.offer),
            )
          }
        >
          填入参考价
        </button>
      </section>

      {lastTurn?.action.kind === "discount" && (
        <blockquote className="trade-response">
          <span>卖家回应</span>
          “{lastTurn.description}”
          {lastTurn.priceChange && (
            <cite>
              要价 {lastTurn.priceChange.before} → {lastTurn.priceChange.after}
            </cite>
          )}
        </blockquote>
      )}

      <section className="quote-panel">
        <label htmlFor="player-offer">你的报价</label>
        <div className="offer-input">
          <button
            aria-label="报价减少5点"
            onClick={() => onOfferInput(String(Math.max(1, (quote || 0) - 5)))}
          >
            −
          </button>
          <input
            id="player-offer"
            type="number"
            inputMode="numeric"
            min="1"
            max={Math.max(1, player.currentPrice - 1)}
            step="1"
            value={offerInput}
            aria-invalid={Boolean(quoteError)}
            aria-describedby="quote-guidance quote-error"
            onChange={(event) => onOfferInput(event.target.value)}
          />
          <button
            aria-label="报价增加5点"
            onClick={() =>
              onOfferInput(
                String(Math.min(player.currentPrice - 1, (quote || 0) + 5)),
              )
            }
          >
            ＋
          </button>
        </div>
        <small id="quote-guidance">
          每次正式报价消耗 1 点议价容量。NPC的还价属于同一轮回应，不重复收费。
        </small>
        <p id="quote-error" role="status" className="quote-error">
          {quoteUnavailableReason}
        </p>
        <button
          className="primary-button"
          disabled={Boolean(quoteUnavailableReason)}
          onClick={onQuote}
        >
          正式报价 {validQuote ? `${quote} 点` : ""} · 消耗 1 容量
        </button>
      </section>

      <div className="terminal-actions" ref={terminalActionsRef}>
        <button className="buy-button" onClick={onBuy}>
          <strong>按当前要价买下</strong>
          <span>{player.currentPrice} 点 · 立即成交</span>
        </button>
        <button className="reject-button" onClick={onReject}>
          <strong>拒绝交易</strong>
          <span>保留资金 · 结束本局</span>
        </button>
      </div>

      {!locked && (
        <button className="text-button" onClick={onBack}>
          暂不报价，返回调查
        </button>
      )}

      {capacity === 0 && (
        <div className="capacity-empty" role="status">
          议价容量已经用尽；接受当前价与拒绝交易仍然可用。
        </div>
      )}
      <p className="sr-status" aria-live="polite">
        {notice}
      </p>
    </main>
  );
}

function Review({
  player,
  playerSettlement,
  onRestart,
}: {
  player: PlayerView;
  playerSettlement: PlayerSettlementCard;
  onRestart: () => void;
}) {
  const settlement = player.settlement!;
  const judgment = playerSettlement.sections.find(
    (section) => section.id === "judgment",
  )!;
  const truth = settlement.truth;
  const discovered = player.discoveredEvidence;
  const overallIndex = GRADE_ORDER.indexOf(settlement.overallGrade);

  return (
    <main
      className="screen review-screen"
      data-stage-focus
      tabIndex={-1}
      aria-label="复盘"
    >
      <section className="review-hero">
        <span>本局复盘 · 综合成果</span>
        <div className="grade-seal" data-grade={settlement.overallGrade}>
          {settlement.overallGrade}
        </div>
        <h1>{settlement.endingTitle}</h1>
        <p>{settlement.outcomeLabel}</p>
        <div className="grade-scale" aria-label={`综合等级 ${settlement.overallGrade}`}>
          {GRADE_ORDER.map((grade, index) => (
            <i
              className={
                index === overallIndex
                  ? "is-current"
                  : index < overallIndex
                    ? "is-filled"
                    : ""
              }
              key={grade}
            >
              {grade}
            </i>
          ))}
        </div>
      </section>

      <section className="truth-reveal">
        <span>客观真相</span>
        <h2>{truth.label}</h2>
        <p>{truth.summary}</p>
        <div>
          <strong>{settlement.truth.trueValue}</strong>
          <em>真实价值</em>
          <strong>{settlement.paidPrice || "—"}</strong>
          <em>成交价格</em>
          <strong className={settlement.actualNet >= 0 ? "is-positive" : "is-negative"}>
            {settlement.actualNet > 0 ? "+" : ""}
            {settlement.actualNet}
          </strong>
          <em>实际净结果</em>
        </div>
      </section>

      <section className="grade-cards">
        {[
          ["物品品质", settlement.qualityGrade, `综合等级最高可达 ${settlement.qualityCap}`],
          ["议价表现", settlement.bargainingGrade, "相对入场价与可达底线"],
          ["判断质量", judgment.grade, playerSettlement.judgmentReason],
          ["收益结果", settlement.netGrade, settlement.outcomeLabel],
        ].map(([label, grade, detail]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{grade}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="review-section">
        <div className="section-heading">
          <div>
            <span>事实解锁</span>
            <h2>这只盒子究竟发生过什么</h2>
          </div>
        </div>
        <ul className="truth-facts">
          {truth.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section className="review-section">
        <div className="section-heading">
          <div>
            <span>你的证据链</span>
            <h2>{discovered.length} 条信息如何影响判断</h2>
          </div>
        </div>
        <div className="review-evidence-list">
          {discovered.map((item) => (
            <EvidenceCard
              evidence={item}
              shared={item.shared}
              compact
              key={item.id}
            />
          ))}
        </div>
      </section>

      <section className="review-section decision-log">
        <div className="section-heading">
          <div>
            <span>行动回放</span>
            <h2>本局的关键拐点</h2>
          </div>
        </div>
        <ol>
          {player.actionHistory.map((turn) => (
            <li key={turn.turn}>
              <i>{turn.turn}</i>
              <div>
                <strong>{turn.actionLabel}</strong>
                <p>{turn.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <button className="primary-button" onClick={onRestart}>
        重新开始本案
      </button>
    </main>
  );
}

function TeacherRail({ developer }: { developer: DeveloperProjection }) {
  // Legacy source contract: world.status === "settled" then 真实价值 {truth.trueValue}.
  // The developer projection now owns that settlement gate through `developer.truth`.
  const truth = developer.truth;
  const lastTurn = developer.actionHistory.at(-1);
  const judgment = truth ? developer.settlement?.judgmentBreakdown : undefined;
  const values = [
    ["压力", developer.npcState.pressure],
    ["信任", developer.npcState.trust],
    ["成交意愿", developer.npcState.dealIntent],
    ["控制感", developer.npcState.control],
  ] as const;

  return (
    <aside id="developer-rail" className="teacher-rail" aria-label="开发调试视图">
      <header>
        <span>DEVELOPMENT VIEW</span>
        <h2>规则与系统进程</h2>
        <p>供讨论与调试，不属于玩家界面</p>
      </header>

      <section>
        <div className="rail-heading">
          <h3>精确运行状态</h3>
          <span>第 {lastTurn?.turn ?? 0} 轮</span>
        </div>
        <div className="exact-state-list">
          {values.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <i>
                <b style={{ width: `${value}%` }} />
              </i>
            </div>
          ))}
        </div>
      </section>

      {judgment && (
        <section>
          <div className="rail-heading">
            <h3>判断质量拆解</h3>
            <span>局末解锁</span>
          </div>
          <div className="judgment-debug-grid">
            {[
              ["决策合理性 D", judgment.decisionScore],
              ["后验确定性 C", judgment.certaintyScore],
              ["证据稳健度 R", judgment.robustnessScore],
              ["综合判断 J", judgment.rawScore],
            ].map(([label, score]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{score}</strong>
              </div>
            ))}
          </div>
          <dl className="judgment-debug-list">
            <div>
              <dt>基础档</dt>
              <dd>{judgment.baseGrade}</dd>
            </div>
            <div>
              <dt>证据上限</dt>
              <dd>{judgment.evidenceCap}</dd>
            </div>
            <div>
              <dt>最终档</dt>
              <dd>{judgment.finalGrade}</dd>
            </div>
            <div>
              <dt>独立来源</dt>
              <dd>{judgment.independentSourceGroups.join("、") || "无"}</dd>
            </div>
            <div>
              <dt>已覆盖维度</dt>
              <dd>{judgment.coveredDimensions.join("、") || "无"}</dd>
            </div>
            <div>
              <dt>缺失维度</dt>
              <dd>{judgment.missingDimensions.join("、") || "无"}</dd>
            </div>
            <div>
              <dt>决定性证据</dt>
              <dd>{judgment.decisiveEvidenceId ?? "无"}</dd>
            </div>
            <div>
              <dt>SSS资格</dt>
              <dd>{judgment.sssEligible ? "具备" : "未具备"}</dd>
            </div>
          </dl>
        </section>
      )}

      <section>
        <div className="rail-heading">
          <h3>本轮隐藏设定</h3>
          <span>{truth ? "局末解锁" : "尚未解锁"}</span>
        </div>
        {truth ? (
          <div className="truth-debug">
            <strong>{truth.label}</strong>
            <span>真实价值 {truth.trueValue}</span>
            <small>品质 {truth.qualityGrade} · 综合封顶 {truth.overallGradeCap}</small>
          </div>
        ) : (
          <div className="truth-locked">
            <strong>等待本局结束</strong>
            <span>完成本局后显示真实价值与品质，避免提前剧透演示。</span>
          </div>
        )}
      </section>

      <section>
        <div className="rail-heading">
          <h3>最近一次规则结算</h3>
          <span>{lastTurn ? lastTurn.title : "等待输入"}</span>
        </div>
        {lastTurn ? (
          <div className="last-turn-debug">
            <strong>{lastTurn.actionLabel}</strong>
            <p>{lastTurn.description}</p>
            <div>
              <span>调查点成本 {lastTurn.actionPointCost}</span>
              <span>议价成本 {lastTurn.negotiationCapacityCost}</span>
            </div>
            {lastTurn.changes.map((change) => (
              <code key={`${lastTurn.turn}-${change.key}`}>
                {change.label} {change.before} → {change.after}（
                {change.delta > 0 ? "+" : ""}
                {change.delta}）
              </code>
            ))}
          </div>
        ) : (
          <p className="rail-empty">玩家开始观察或询问后，这里显示精确状态变化。</p>
        )}
      </section>
    </aside>
  );
}

function TeacherGuide({ player }: { player: PlayerProjection }) {
  const privateCount = player.evidence.items.filter(
    (item) => item.visibility === "private",
  ).length;
  const sharedCount = player.evidence.items.filter(
    (item) => item.visibility === "shared",
  ).length;
  return (
    <aside className="teacher-guide" aria-label="教师演示说明">
      <div className="guide-brand">掌眼 · 教师演示</div>
      <h1>从局部证据，走到一笔有代价的决定</h1>
      <p>
        当前版本展示一局完整的低级场教学案：器物查验、询问、具体证据公开、有限议价与多维结算。
      </p>

      <section>
        <span>本版要验证</span>
        <ol>
          <li>插画负责定位，文字负责准确传递鉴定细节。</li>
          <li>证据与NPC状态动态变化，调查资源线性减少。</li>
          <li>首次正式报价后收束到交易，不会出现流程死锁。</li>
          <li>结果同时看客观收益、议价与判断，不再以100分代替成功。</li>
        </ol>
      </section>

      <section className="guide-live">
        <span>当前信息边界</span>
        <div>
          <strong>{privateCount}</strong>
          <small>玩家私有证据</small>
        </div>
        <div>
          <strong>{sharedCount}</strong>
          <small>双方共享证据</small>
        </div>
      </section>

      <footer>
        <span>普通 Web / H5</span>
        <p>面向微信聊天与公众号链接打开；不依赖微信小游戏 AppID 或 Unity。</p>
      </footer>
    </aside>
  );
}

export default function HighFidelityApp() {
  const [stage, setStage] = useState<Stage>("arrival");
  const [mode, setMode] = useState<InvestigationMode>("observe");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [world, setWorld] = useState<WorldState>(() =>
    createInitialWorldState(lacquerBoxCase),
  );
  const [selectedTargetId, setSelectedTargetId] = useState("surface");
  const [selectedTopicId, setSelectedTopicId] = useState("repair-history");
  const [selectedTone, setSelectedTone] = useState<ActionTone>("professional");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [offerInput, setOfferInput] = useState("60");
  const [notice, setNotice] = useState("");
  const [developerOpen, setDeveloperOpen] = useState(false);
  const playerFrameRef = useRef<HTMLDivElement>(null);
  const previousStageRef = useRef<Stage>(stage);

  const playerView = useMemo(
    () => buildPlayerView(lacquerBoxCase, world),
    [world],
  );
  const player = playerView.projection;
  const evidence = playerView.discoveredEvidence;
  const playerSettlement = player.settlement;
  const developer = useMemo(
    () => buildDeveloperProjection(lacquerBoxCase, world),
    [world],
  );

  useEffect(() => {
    if (previousStageRef.current === stage) return;
    previousStageRef.current = stage;
    const frame = window.requestAnimationFrame(() => {
      playerFrameRef.current
        ?.querySelector<HTMLElement>("[data-stage-focus]")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [stage]);

  function perform(action: PlayerAction, nextStage?: Stage) {
    try {
      const next = resolveTurn(lacquerBoxCase, world, action);
      setWorld(next);
      setNotice(next.actionHistory.at(-1)?.description ?? "行动已完成");
      if (next.status === "settled") {
        setStage("review");
      } else if (nextStage) {
        setStage(nextStage);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "当前行动无法执行");
    }
  }

  function restart(truthVariantId: TruthVariantId = "restored-genuine") {
    const next = createInitialWorldState(
      lacquerBoxCase,
      lacquerBoxCase.seed,
      truthVariantId,
    );
    setWorld(next);
    setStage("arrival");
    setMode("observe");
    setOverlay(null);
    setSelectedTargetId("surface");
    setSelectedTopicId("repair-history");
    setSelectedTone("professional");
    setSelectedEvidenceId("");
    setOfferInput("60");
    setNotice("");
    setDeveloperOpen(false);
  }

  return (
    <div
      className={`demo-workbench${developerOpen ? " is-developer-open" : ""}`}
    >
      <TeacherGuide player={player} />

      <div ref={playerFrameRef} className="player-frame">
        <PlayerHeader
          stage={stage}
          evidenceCount={player.evidence.items.length}
          onOpenEvidence={() => setOverlay("evidence")}
        />

        {stage === "arrival" && (
          <Arrival
            onStart={() => setStage("investigate")}
            onReference={() => setOverlay("reference")}
          />
        )}
        {stage === "investigate" && (
          <Investigation
            player={playerView}
            mode={mode}
            selectedTargetId={selectedTargetId}
            selectedTopicId={selectedTopicId}
            selectedTone={selectedTone}
            selectedEvidenceId={selectedEvidenceId}
            notice={notice}
            onMode={setMode}
            onSelectTarget={setSelectedTargetId}
            onSelectTopic={setSelectedTopicId}
            onSelectTone={setSelectedTone}
            onSelectEvidence={setSelectedEvidenceId}
            onInspect={() =>
              perform(
                { kind: "inspect", targetId: selectedTargetId },
                "result",
              )
            }
            onAsk={() =>
              perform({
                kind: "dialogue",
                topicId: selectedTopicId,
                tone: selectedTone,
                evidenceId: selectedEvidenceId || undefined,
              })
            }
            onTest={() =>
              perform(
                { kind: "test", testId: lacquerBoxCase.test.id },
                "result",
              )
            }
            onTrade={() => setStage("trade")}
            onReference={() => setOverlay("reference")}
          />
        )}
        {stage === "result" && (
          <ResultScreen player={playerView} onCollect={() => setStage("investigate")} />
        )}
        {stage === "trade" && (
          <Trade
            player={playerView}
            offerInput={offerInput}
            notice={notice}
            onOfferInput={setOfferInput}
            onQuote={() => perform({ kind: "discount", offer: Number(offerInput) })}
            onBuy={() => perform({ kind: "buy" })}
            onReject={() => perform({ kind: "reject" })}
            onBack={() => setStage("investigate")}
          />
        )}
        {stage === "review" && playerSettlement && (
          <Review
            player={playerView}
            playerSettlement={playerSettlement}
            onRestart={() => restart()}
          />
        )}

        {overlay === "evidence" && (
          <OverlaySheet
            eyebrow="信息仓库"
            title={`证据簿 · ${evidence.length} 条`}
            onClose={() => setOverlay(null)}
          >
            <div className="evidence-sheet-summary">
              <span>仅你掌握</span>
              <strong>
                {playerView.discoveredEvidence.filter((item) => !item.shared).length}
              </strong>
              <span>双方共享</span>
              <strong>{playerView.sharedEvidenceIds.length}</strong>
            </div>
            <div className="evidence-sheet-list">
              {evidence.length ? (
                evidence.map((item) => (
                  <EvidenceCard
                    evidence={item}
                    shared={item.shared}
                    key={item.id}
                  />
                ))
              ) : (
                <div className="empty-book">
                  <Icon>册</Icon>
                  <strong>证据簿还是空的</strong>
                  <p>观察器物、询问来客或共同检测后，信息会收录在这里。</p>
                </div>
              )}
            </div>
          </OverlaySheet>
        )}

        {overlay === "reference" && (
          <OverlaySheet
            eyebrow="随手参考"
            title="掌柜参考簿"
            onClose={() => setOverlay(null)}
          >
            <div className="reference-list">
              {lacquerBoxCase.knowledgeCards.map((card, index) => (
                <article key={card.id}>
                  <span>0{index + 1}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </OverlaySheet>
        )}
      </div>

      <div className="developer-slot">
        <button
          className="developer-toggle"
          aria-expanded={developerOpen}
          aria-controls="developer-rail"
          onClick={() => setDeveloperOpen((open) => !open)}
        >
          <Icon>{developerOpen ? "收" : "数"}</Icon>
          <span className="developer-toggle__label">
            {developerOpen ? "收起开发复盘" : "展开开发复盘"}
          </span>
        </button>
        {developerOpen && <TeacherRail developer={developer} />}
      </div>
    </div>
  );
}
