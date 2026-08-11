import { useEffect, useMemo, useRef, useState } from "react";

import {
  PLAYER_CASE_CATALOG,
  createSeededSession,
  type SeededSession,
} from "../content/case-catalog.ts";
import { calculatePlayerValuation } from "../game/player-valuation.ts";
import {
  calculatePosterior,
  createInitialWorldState,
  getTestConsent,
  resolveTurn,
} from "../game/resolve-action.ts";
import type {
  ActionTone,
  AppraisalConfidence,
  CaseDefinition,
  PlayerAction,
  WorldState,
} from "../game/types.ts";

type Stage = "start" | "investigate" | "appraise" | "trade" | "review";

function generatedSeed() {
  const querySeed = new URLSearchParams(window.location.search).get("seed");
  if (querySeed && /^\d{1,9}$/.test(querySeed)) return Number(querySeed);
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return 1 + values[0] % 99_999_999;
}

function artifactMark(caseDefinition: CaseDefinition) {
  if (caseDefinition.id.includes("porcelain")) return "瓷";
  if (caseDefinition.id.includes("calligraphy")) return "画";
  return "漆";
}

function confidenceLabel(confidence: AppraisalConfidence) {
  return {
    reserved: "保留判断 · 55%",
    confident: "较有把握 · 75%",
    certain: "非常确定 · 90%",
  }[confidence];
}

function Header({ seed, evidenceCount }: { seed: number; evidenceCount: number }) {
  return (
    <header className="player-header">
      <div className="brand"><strong>掌眼</strong><span>鉴器 · 察人 · 定交易</span></div>
      <div className="header-ledgers">
        <span>局号 <b>{seed}</b></span>
        <span>证据 <b>{evidenceCount}</b></span>
      </div>
    </header>
  );
}

function npcBubbleText(caseDefinition: CaseDefinition, world: WorldState) {
  const latest = world.actionHistory.at(-1);
  if (!latest) return caseDefinition.claims[0]?.text ?? "您先看看这件东西。";

  if (latest.action.kind === "dialogue") {
    return latest.statement?.text ?? latest.description;
  }
  if (latest.action.kind === "inspect" || latest.action.kind === "test") {
    return caseDefinition.claims[0]?.text ?? "您先看看这件东西。";
  }
  if (latest.action.kind === "appraise") {
    return "看得差不多了？那就说说您的价。";
  }
  if (latest.action.kind === "buy") {
    return "好，就按这个价成交。";
  }
  if (latest.action.kind === "reject") {
    return "那就先到这里。";
  }
  if (latest.action.kind === "buyout") {
    return world.currentPrice === latest.action.offer
      ? "这个条件，我应了。"
      : "这个价我不能应，今天就不再谈了。";
  }
  if (latest.action.kind === "discount") {
    if (world.status === "settled" && world.currentPrice === latest.action.offer) return `好，${latest.action.offer} 点，成交。`;
    if (world.status === "settled") return "这个价没法谈，我先告辞了。";
    if (latest.before.currentPrice !== world.currentPrice) return `${world.currentPrice} 点，不能再少了。`;
    return "这个价不行。您可以再想想。";
  }
  return caseDefinition.claims[0]?.text ?? "您先看看这件东西。";
}

function publicTradeFeedback(world: WorldState) {
  const latest = world.actionHistory.at(-1);
  if (!latest || latest.action.kind === "appraise") return null;
  if (latest.action.kind === "buy") {
    return { title: "交易已经确认", description: `你按 ${latest.before.currentPrice} 点买下了这件器物。` };
  }
  if (latest.action.kind === "reject") {
    return { title: "本次交易结束", description: "你决定不买下这件器物。" };
  }
  return { title: latest.title, description: latest.description };
}

function EncounterScene({
  caseDefinition,
  world,
  phase,
  focusLabel,
}: {
  caseDefinition: CaseDefinition;
  world: WorldState;
  phase: "investigate" | "trade";
  focusLabel: string | null;
}) {
  return (
    <section className={`encounter-scene scene-${phase}${focusLabel ? " is-inspecting" : ""}`} aria-labelledby={`${phase}-scene-title`}>
      <div className="scene-caption">
        <span>{phase === "trade" ? "交易桌" : "今日来客"}</span>
        <h1 id={`${phase}-scene-title`}>{caseDefinition.title}</h1>
      </div>
      <div className="speech-bubble" role="status" aria-live="polite">
        <p>{npcBubbleText(caseDefinition, world)}</p>
        <small>{caseDefinition.seller.name}</small>
      </div>
      <figure className="artifact-figure">
        <div className="artifact-mark" aria-hidden="true">{artifactMark(caseDefinition)}</div>
        <figcaption>{focusLabel ? `正在细看 · ${focusLabel}` : "待鉴器物"}</figcaption>
      </figure>
      <figure className="npc-portrait" aria-label={`${caseDefinition.seller.name}的半身占位立绘`}>
        <div className="npc-silhouette" aria-hidden="true"><span /></div>
        <figcaption>{caseDefinition.seller.name}</figcaption>
      </figure>
    </section>
  );
}

function StartScreen({ seed, onSeed, onStart }: {
  seed: string;
  onSeed: (value: string) => void;
  onStart: () => void;
}) {
  return (
    <main className="start-screen">
      <div className="start-seal">掌眼</div>
      <p className="eyebrow">一间古玩铺，一次无法回头的判断</p>
      <h1>证据不会替你作决定</h1>
      <p>观察器物、听取来客陈述，决定公开哪些证据，再把你的判断写进价格。</p>
      <details className="seed-control">
        <summary>使用指定局号</summary>
        <label htmlFor="seed">局号</label>
        <input
          id="seed"
          inputMode="numeric"
          pattern="[0-9]*"
          value={seed}
          onChange={(event) => onSeed(event.target.value.replace(/\D/g, "").slice(0, 9))}
        />
        <small>分享同一局号，可以复现相同来客与隐藏真相。</small>
      </details>
      <button className="primary" disabled={!seed || Number(seed) < 1} onClick={onStart}>开门迎客</button>
    </main>
  );
}

function EvidenceList({ caseDefinition, world }: { caseDefinition: CaseDefinition; world: WorldState }) {
  if (world.discoveredEvidenceIds.length === 0) {
    return <p className="empty">证据簿还是空的。先观察器物，或从来客的话里寻找矛盾。</p>;
  }
  return (
    <div className="evidence-list">
      {world.discoveredEvidenceIds.map((id) => {
        const evidence = caseDefinition.evidence[id];
        if (!evidence) return null;
        return (
          <article key={id} className="evidence-card">
            <div><span>{evidence.strength === "anchor" ? "锚点" : evidence.strength === "strong" ? "强证据" : "线索"}</span><em>{world.sharedEvidenceIds.includes(id) ? "双方已知" : "仅你掌握"}</em></div>
            <h3>{evidence.name}</h3>
            <p>{evidence.detail}</p>
            <strong>{evidence.inference}</strong>
          </article>
        );
      })}
    </div>
  );
}

type DossierTab = "evidence" | "dialogue" | "reference";

function DossierDrawer({
  open,
  setOpen,
  caseDefinition,
  world,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  caseDefinition: CaseDefinition;
  world: WorldState;
}) {
  const [tab, setTab] = useState<DossierTab>("evidence");
  const closeButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawer.current) return;
      const focusable = Array.from(drawer.current.querySelectorAll<HTMLElement>(
        "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
      )).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="dossier-layer">
      <button className="dossier-backdrop" aria-label="关闭案卷" onClick={() => setOpen(false)} />
      <section ref={drawer} id="dossier-drawer" className="dossier-drawer" role="dialog" aria-modal="true" aria-labelledby="dossier-title">
        <header className="dossier-header">
          <div><span>只读记录</span><h2 id="dossier-title">本局案卷</h2></div>
          <button ref={closeButton} className="dossier-close" onClick={() => setOpen(false)} aria-label="关闭案卷">×</button>
        </header>
        <div className="dossier-tabs" role="tablist" aria-label="案卷分类">
          {([
            ["evidence", `证据 ${world.discoveredEvidenceIds.length}`],
            ["dialogue", `对话 ${1 + world.statementHistory.length}`],
            ["reference", "参考"],
          ] as Array<[DossierTab, string]>).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? "selected" : ""}
              onClick={() => setTab(id)}
            >{label}</button>
          ))}
        </div>
        <div className="dossier-content">
          {tab === "evidence" && <EvidenceList caseDefinition={caseDefinition} world={world} />}
          {tab === "dialogue" && (
            <div className="dialogue-log">
              <article><span>初次陈述</span><p>“{caseDefinition.claims[0]?.text ?? "请您先看看。"}”</p></article>
              {world.statementHistory.map((statement) => (
                <article key={`${statement.turn}-${statement.signalId}`}><span>第 {statement.turn} 轮</span><p>“{statement.text}”</p></article>
              ))}
            </div>
          )}
          {tab === "reference" && (
            <div className="reference-list">
              {caseDefinition.knowledgeCards.map((card) => (
                <article key={card.id}><h3>{card.title}</h3><p>{card.body}</p></article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Investigation({ session, world, onWorld, onAppraise, onReview }: {
  session: SeededSession;
  world: WorldState;
  onWorld: (world: WorldState) => void;
  onAppraise: () => void;
  onReview: () => void;
}) {
  const { caseDefinition } = session;
  const [mode, setMode] = useState<"inspect" | "dialogue">("inspect");
  const [tone, setTone] = useState<ActionTone>("professional");
  const [topicId, setTopicId] = useState(caseDefinition.dialogueTopics[0].id);
  const [evidenceId, setEvidenceId] = useState("");
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const consent = getTestConsent(caseDefinition, world);
  const latestTurn = world.actionHistory.at(-1);
  const focusLabel = caseDefinition.observationTargets.find((target) => target.id === focusTargetId)?.label ?? null;

  function perform(action: PlayerAction) {
    try {
      const next = resolveTurn(caseDefinition, world, action);
      onWorld(next);
      setErrorNotice("");
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "当前行动无法执行");
    }
  }

  return (
    <main className="screen-grid investigation-screen">
      <div className="main-column">
        <EncounterScene caseDefinition={caseDefinition} world={world} phase="investigate" focusLabel={mode === "inspect" ? focusLabel : null} />
        <div className="resource-row">
          <div><span>调查行动</span><strong>{world.actionPoints} / {caseDefinition.actionBudget}</strong></div>
          <div><span>当前要价</span><strong>{world.currentPrice} 点</strong></div>
          <div><span>检测费用</span><strong>{world.feesPaid} 点</strong></div>
        </div>

        <section className="investigation-controls">
          <div className="action-mode-group card" role="group" aria-label="调查行动">
            <button className={mode === "inspect" ? "selected" : ""} aria-pressed={mode === "inspect"} onClick={() => setMode("inspect")}>
              <span>细看</span><small>从器物找证据</small>
            </button>
            <button className={mode === "dialogue" ? "selected" : ""} aria-pressed={mode === "dialogue"} onClick={() => setMode("dialogue")}>
              <span>询问</span><small>听说法、作回应</small>
            </button>
          </div>
          <button className="dossier-trigger" aria-haspopup="dialog" aria-expanded={dossierOpen} aria-controls="dossier-drawer" onClick={() => setDossierOpen(true)}>
            <span>案卷</span><small>{world.discoveredEvidenceIds.length} 条证据</small>
          </button>
        </section>

        {mode === "inspect" && (
          <section className="card action-card active-action-card">
            <div className="section-heading"><span>细看器物</span><small>每处消耗 1 行动</small></div>
            <div className="target-grid">
              {caseDefinition.observationTargets.map((target) => (
                <button
                  key={target.id}
                  disabled={world.status === "settled" || world.actionPoints < 1 || world.inspectedTargetIds.includes(target.id)}
                  onClick={() => {
                    setFocusTargetId(target.id);
                    perform({ kind: "inspect", targetId: target.id });
                  }}
                >
                  <strong>{target.label}</strong><span>{world.inspectedTargetIds.includes(target.id) ? "已记录" : target.short}</span>
                </button>
              ))}
            </div>
            <section className="test-strip">
              <div><strong>{caseDefinition.test.label}</strong><span>{caseDefinition.test.description}</span></div>
              <button disabled={world.status === "settled" || !consent.allowed} onClick={() => perform({ kind: "test", testId: caseDefinition.test.id })}>检测 · {caseDefinition.test.valueCost}点</button>
            </section>
          </section>
        )}

        {mode === "dialogue" && (
          <section className="card action-card active-action-card">
            <div className="section-heading"><span>询问来客</span><small>每次消耗 1 行动</small></div>
            <label htmlFor="dialogue-topic">问题</label>
            <select id="dialogue-topic" value={topicId} onChange={(event) => setTopicId(event.target.value)}>
              {caseDefinition.dialogueTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label} · {topic.prompt}</option>)}
            </select>
            <label>态度</label>
            <div className="tone-row">
              {(["gentle", "professional", "firm"] as ActionTone[]).map((item) => (
                <button key={item} className={tone === item ? "selected" : ""} onClick={() => setTone(item)}>
                  {{ gentle: "温和", professional: "专业", firm: "强硬" }[item]}
                </button>
              ))}
            </div>
            <label htmlFor="dialogue-evidence">出示证据</label>
            <select id="dialogue-evidence" value={evidenceId} onChange={(event) => setEvidenceId(event.target.value)}>
              <option value="">不出示，开放询问</option>
              {world.discoveredEvidenceIds.filter((id) => caseDefinition.evidence[id]?.kind !== "statement").map((id) => (
                <option key={id} value={id}>{caseDefinition.evidence[id].name}</option>
              ))}
            </select>
            <button className="secondary" disabled={world.status === "settled" || world.actionPoints < 1} onClick={() => perform({ kind: "dialogue", topicId, tone, evidenceId: evidenceId || undefined })}>提出问题</button>
          </section>
        )}

        {latestTurn && latestTurn.action.kind !== "appraise" && (
          <section className="action-feedback" aria-live="polite">
            <span>刚刚记录</span><strong>{latestTurn.title}</strong><p>{latestTurn.description}</p>
          </section>
        )}
        {errorNotice && <p className="notice error-notice" role="alert">{errorNotice}</p>}
        {world.status === "settled"
          ? <button className="primary appraisal-cta" onClick={onReview}>查看本局复盘</button>
          : <button className="primary appraisal-cta" onClick={onAppraise}>形成判断</button>}
        <DossierDrawer open={dossierOpen} setOpen={setDossierOpen} caseDefinition={caseDefinition} world={world} />
      </div>
    </main>
  );
}

function Appraisal({ session, world, onWorld, onBack, onTrade }: {
  session: SeededSession;
  world: WorldState;
  onWorld: (world: WorldState) => void;
  onBack: () => void;
  onTrade: () => void;
}) {
  const { caseDefinition } = session;
  const [hypothesisId, setHypothesisId] = useState(caseDefinition.judgmentModel.hypothesisOrder[1]);
  const [confidence, setConfidence] = useState<AppraisalConfidence>("reserved");
  function submit() {
    const next = resolveTurn(caseDefinition, world, { kind: "appraise", hypothesisId, confidence });
    onWorld(next);
    onTrade();
  }
  return (
    <main className="focus-screen">
      <span className="eyebrow">掌眼结论</span>
      <h1>你目前最相信哪一种解释？</h1>
      <p>这不是最终真相，而是你愿意据此进入交易的判断。</p>
      <div className="hypothesis-list">
        {caseDefinition.judgmentModel.hypothesisOrder.map((id) => {
          const truth = caseDefinition.truthVariants[id];
          return <button key={id} className={hypothesisId === id ? "selected" : ""} onClick={() => setHypothesisId(id)}><strong>{truth.label}</strong><span>{truth.summary}</span></button>;
        })}
      </div>
      <h2>你有多大把握？</h2>
      <div className="confidence-row">
        {(["reserved", "confident", "certain"] as AppraisalConfidence[]).map((item) => <button key={item} className={confidence === item ? "selected" : ""} onClick={() => setConfidence(item)}>{confidenceLabel(item)}</button>)}
      </div>
      <div className="button-row"><button className="quiet" onClick={onBack}>继续调查</button><button className="primary" onClick={submit}>确认判断，进入交易</button></div>
    </main>
  );
}

function Trade({ session, world, onWorld, onReview }: {
  session: SeededSession;
  world: WorldState;
  onWorld: (world: WorldState) => void;
  onReview: () => void;
}) {
  const { caseDefinition } = session;
  const posterior = calculatePosterior(caseDefinition, world.discoveredEvidenceIds, world.statementHistory);
  const valuation = calculatePlayerValuation(posterior);
  const [offer, setOffer] = useState("");
  const [dossierOpen, setDossierOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const offerNumber = Number(offer);
  const validOffer = world.status === "active" && offer !== "" && Number.isInteger(offerNumber) && offerNumber > 0 && offerNumber < world.currentPrice;
  const tradeFeedback = publicTradeFeedback(world);

  function perform(action: PlayerAction) {
    try {
      const next = resolveTurn(caseDefinition, world, action);
      onWorld(next);
      setOffer("");
      setErrorNotice("");
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "当前行动无法执行");
    }
  }

  return (
    <main className="trade-screen">
      <div className="trade-utility"><span className="eyebrow">把判断写进价格</span><button aria-haspopup="dialog" aria-expanded={dossierOpen} aria-controls="dossier-drawer" onClick={() => setDossierOpen(true)}>查看案卷</button></div>
      <EncounterScene caseDefinition={caseDefinition} world={world} phase="trade" focusLabel={null} />
      <section className="valuation-card">
        <div><span>当前主观估值</span><strong>{valuation.q10}—{valuation.q90}</strong><em>价值点</em></div>
        <dl><div><dt>期望价值</dt><dd>{valuation.expectedValue}</dd></div><div><dt>不确定性</dt><dd>{valuation.uncertaintyLabel}</dd></div><div><dt>卖家要价</dt><dd>{world.currentPrice}</dd></div></dl>
        <p>估值来自你目前掌握的证据。最终报价由你决定。</p>
      </section>
      {world.status === "active" && (
        <section className="offer-panel card">
          <label htmlFor="offer">你的报价</label>
          <input id="offer" type="number" inputMode="numeric" placeholder="留空，自己判断" value={offer} onChange={(event) => setOffer(event.target.value)} />
          <div className="offer-hint"><span>正式报价消耗 1 点议价容量</span><strong>卖家会用回应表明态度</strong></div>
          <button className="secondary" disabled={!validOffer} onClick={() => perform({ kind: "discount", offer: offerNumber })}>正式报价</button>
        </section>
      )}
      {tradeFeedback && (
        <section className="action-feedback" aria-live="polite">
          <span>交易回应</span><strong>{tradeFeedback.title}</strong><p>{tradeFeedback.description}</p>
        </section>
      )}
      {errorNotice && <p className="notice error-notice" role="alert">{errorNotice}</p>}
      {world.status === "settled"
        ? <button className="primary review-cta" onClick={onReview}>查看本局复盘</button>
        : <div className="terminal-row"><button onClick={() => perform({ kind: "buy" })}><strong>按当前价买下</strong><span>{world.currentPrice} 点</span></button><button onClick={() => perform({ kind: "reject" })}><strong>拒绝交易</strong><span>结束本局</span></button></div>}
      <DossierDrawer open={dossierOpen} setOpen={setDossierOpen} caseDefinition={caseDefinition} world={world} />
    </main>
  );
}

function Review({ session, world, onReplay, onNew }: {
  session: SeededSession;
  world: WorldState;
  onReplay: () => void;
  onNew: () => void;
}) {
  const settlement = world.settlement!;
  const ability = settlement.ability;
  const objective = settlement.objectiveOutcome;
  const truth = session.caseDefinition.truthVariants[world.truthVariantId];
  return (
    <main className="review-screen">
      <section className="ability-hero">
        <span>本局能力评级</span><div>{ability.finalGrade}</div><h1>{settlement.endingTitle}</h1><p>能力只评价你当时信息下的判断，不由抽到的器物品质决定。</p>
      </section>
      <section className="score-grid">
        <article><span>鉴定</span><strong>{ability.appraisalScore}</strong><small>校准与证据结构</small></article>
        <article><span>决策</span><strong>{ability.decisionScore}</strong><small>主观后悔 {ability.visibleDecisionRegret}</small></article>
        <article><span>议价</span><strong>{ability.negotiationScore ?? "未评估"}</strong><small>{ability.negotiationScore === null ? "本局没有正式报价" : "可见报价效用"}</small></article>
      </section>
      {ability.capReasons.length > 0 && <section className="cap-note"><strong>评级边界</strong><ul>{ability.capReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></section>}
      <section className="truth-card card"><span>客观结果</span><h2>{truth.label}</h2><p>{truth.summary}</p><dl><div><dt>真实价值</dt><dd>{truth.trueValue}</dd></div><div><dt>成交价</dt><dd>{objective.acquired ? objective.paidPrice : "未成交"}</dd></div><div><dt>检测费用</dt><dd>{objective.feesPaid}</dd></div><div><dt>实际净结果</dt><dd className={objective.actualNet >= 0 ? "positive" : "negative"}>{objective.actualNet > 0 ? "+" : ""}{objective.actualNet}</dd></div>{!objective.acquired && <div><dt>事后错失价值</dt><dd>{objective.missedValue}</dd></div>}</dl><ul>{truth.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>
      <div className="button-row"><button className="quiet" onClick={onReplay}>重玩本局</button><button className="primary" onClick={onNew}>换一位来客</button></div>
    </main>
  );
}

export function PlayerApp() {
  const [seedText, setSeedText] = useState(() => String(generatedSeed()));
  const [session, setSession] = useState<SeededSession | null>(null);
  const [world, setWorld] = useState<WorldState | null>(null);
  const [stage, setStage] = useState<Stage>("start");

  const evidenceCount = world?.discoveredEvidenceIds.length ?? 0;
  const activeSeed = session?.seed ?? Number(seedText || 0);
  const shellClass = useMemo(() => `player-shell stage-${stage}`, [stage]);

  function start(seed: number) {
    const nextSession = createSeededSession(PLAYER_CASE_CATALOG, seed);
    setSession(nextSession);
    setWorld(createInitialWorldState(nextSession.caseDefinition, seed, nextSession.truthVariantId));
    setStage("investigate");
  }
  function newCase() {
    const seed = generatedSeed();
    setSeedText(String(seed));
    start(seed);
  }

  return (
    <div className={shellClass}>
      {stage !== "start" && <Header seed={activeSeed} evidenceCount={evidenceCount} />}
      {stage === "start" && <StartScreen seed={seedText} onSeed={setSeedText} onStart={() => start(Number(seedText))} />}
      {stage === "investigate" && session && world && <Investigation session={session} world={world} onWorld={setWorld} onAppraise={() => setStage("appraise")} onReview={() => setStage("review")} />}
      {stage === "appraise" && session && world && <Appraisal session={session} world={world} onWorld={setWorld} onBack={() => setStage("investigate")} onTrade={() => setStage("trade")} />}
      {stage === "trade" && session && world && <Trade session={session} world={world} onWorld={setWorld} onReview={() => setStage("review")} />}
      {stage === "review" && session && world && <Review session={session} world={world} onReplay={() => start(session.seed)} onNew={newCase} />}
    </div>
  );
}
