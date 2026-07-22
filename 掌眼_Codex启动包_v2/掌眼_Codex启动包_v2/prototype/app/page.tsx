"use client";

import { useMemo, useState } from "react";
import {
  lacquerBoxCase,
  type OutcomeId,
} from "../content/lacquer-box";

type Screen =
  | "home"
  | "arrival"
  | "observe"
  | "evidence"
  | "action"
  | "response"
  | "trade"
  | "review";
type ArtifactView = "front" | "bottom" | "joint";
type Tone = "gentle" | "professional" | "firm";

const progress = [
  { id: "home", label: "开店" },
  { id: "arrival", label: "来客" },
  { id: "observe", label: "观察" },
  { id: "evidence", label: "证据" },
  { id: "action", label: "行动" },
  { id: "response", label: "回应" },
  { id: "trade", label: "交易" },
  { id: "review", label: "复盘" },
] as const;

const toneOptions: Array<{
  id: Tone;
  label: string;
  benefit: string;
  risk: string;
}> = [
  { id: "gentle", label: "温和", benefit: "更利于建立信任", risk: "可能保留对方控制感" },
  { id: "professional", label: "专业", benefit: "证据效果稳定", risk: "需要明确物证支撑" },
  { id: "firm", label: "强硬", benefit: "快速施加压力", risk: "信任下降、可能离场" },
];

function MockBadge() {
  return <span className="mock-badge">原型 Mock</span>;
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

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [artifactView, setArtifactView] = useState<ArtifactView>("front");
  const [evidenceFound, setEvidenceFound] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIsNew, setDetailIsNew] = useState(false);
  const [tone, setTone] = useState<Tone>("professional");
  const [toneFeedback, setToneFeedback] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] =
    useState<OutcomeId>("conditional-testing");

  const currentStep = progress.findIndex((item) => item.id === screen);
  const actionPoints = evidenceFound ? 3 : lacquerBoxCase.actionBudget;
  const outcome = useMemo(
    () => lacquerBoxCase.outcomes.find((item) => item.id === selectedOutcome)!,
    [selectedOutcome],
  );

  function go(next: Screen) {
    setToneFeedback(null);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetPrototype() {
    setScreen("home");
    setArtifactView("front");
    setEvidenceFound(false);
    setDetailOpen(false);
    setDetailIsNew(false);
    setTone("professional");
    setToneFeedback(null);
    setSelectedOutcome("conditional-testing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function inspectJoint() {
    const isNewEvidence = !evidenceFound;
    setArtifactView("joint");
    setDetailIsNew(isNewEvidence);
    setDetailOpen(true);
  }

  function submitAction() {
    if (tone === "professional") {
      go("response");
      return;
    }

    setToneFeedback(
      tone === "gentle"
        ? "温和表达保住了信任，但这次没有迫使对方正面解释胶痕。可以换一种策略继续。"
        : "强硬质疑迅速提高压力，同时让刘先生产生离场倾向。核心演示建议改用专业表达。",
    );
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
                description="先确认来客与委托，再开始今天的掌眼。"
              />

              <div className="status-board">
                <div><span>营业状态</span><strong>已开门</strong></div>
                <div><span>资金</span><strong>占位</strong></div>
                <div><span>声誉</span><strong>占位</strong></div>
              </div>

              <article className="guest-card">
                <div className="avatar-placeholder" aria-hidden="true">刘</div>
                <div className="guest-copy">
                  <p className="card-kicker">今日来客 · 1 / 1</p>
                  <h2>{lacquerBoxCase.seller.name}</h2>
                  <p>带来一只旧漆木首饰盒，希望尽快出手。</p>
                  <div className="tag-row">
                    <span>旧物委托</span><span>来源待核</span>
                  </div>
                </div>
              </article>

              <div className="prototype-callout">
                <MockBadge />
                <p>本轮只演示一个案件的核心交互路径，不代表正式数值与美术。</p>
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
                title="先听说法，再验证主张"
                description="卖家的叙述不是答案，而是一组待核验的信息。"
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
                <div><span>卖家开价</span><strong>{lacquerBoxCase.seller.openingPrice}</strong></div>
                <small>{lacquerBoxCase.seller.openingPriceNote}</small>
              </div>

              <div className="button-stack">
                <button className="primary-button" onClick={() => go("observe")}>开始掌眼</button>
                <button className="text-button" onClick={() => go("home")}>返回店铺</button>
              </div>
            </>
          )}

          {screen === "observe" && (
            <>
              <ScreenHeading
                eyebrow="P2 · 器物观察"
                title="选择视角，寻找可验证的细节"
                description="检查会消耗行动点。客观证据比情绪信号更可靠。"
              />

              <div className="resource-row">
                <span>剩余行动点</span>
                <strong>{actionPoints} / {lacquerBoxCase.actionBudget}</strong>
              </div>

              {evidenceFound && (
                <div className="next-choice" role="status">
                  <span>证据已收录</span>
                  <div>
                    <strong>下一步由你决定</strong>
                    <p>继续观察、查看证据簿，或用“现代胶痕”发起行动。</p>
                  </div>
                </div>
              )}

              <div className={`artifact-stage view-${artifactView}`}>
                <div className="artifact-lid" />
                <div className="artifact-body"><span className="artifact-latch" /></div>
                {artifactView === "joint" && (
                  <button className="joint-hotspot" onClick={inspectJoint} aria-label="检查接口热点">
                    <span>+</span><small>{evidenceFound ? "复查接口" : "检查接口"}</small>
                  </button>
                )}
                <p>{artifactView === "front" ? "正面：观察漆面、纹饰与整体形制" : artifactView === "bottom" ? "底部：查看底款与磨损" : "接口：检查拼接与修复痕迹"}</p>
              </div>

              <div className="segmented-control" aria-label="器物视角">
                {(["front", "bottom", "joint"] as ArtifactView[]).map((view) => (
                  <button
                    key={view}
                    aria-pressed={artifactView === view}
                    onClick={() => setArtifactView(view)}
                  >
                    {view === "front" ? "正面" : view === "bottom" ? "底部" : "接口"}
                  </button>
                ))}
              </div>

              {artifactView === "joint" && !evidenceFound && (
                <button className="primary-button" onClick={inspectJoint}>点击检查接口热点</button>
              )}

              <nav className="tool-nav" aria-label="案件工具">
                <button disabled={!evidenceFound} onClick={() => go("evidence")}>
                  <strong>证据簿</strong><span>{evidenceFound ? "1 条证据" : "尚未发现"}</span>
                </button>
                <button disabled={!evidenceFound} onClick={() => go("action")}>
                  <strong>行动</strong><span>{evidenceFound ? "用证据对峙" : "发现证据后解锁"}</span>
                </button>
                <button disabled><strong>交易</strong><span>对质后解锁</span></button>
              </nav>

              <button className="text-button" onClick={() => go("arrival")}>返回来客页</button>
            </>
          )}

          {screen === "evidence" && (
            <>
              <ScreenHeading
                eyebrow="P3 · 证据簿"
                title="把物证与陈述放在一起比较"
                description="矛盾不是自动判真伪，而是下一步行动的依据。"
              />

              <div className="comparison-grid">
                <article className="evidence-card">
                  <div className="card-topline"><span>客观证据</span><strong>{lacquerBoxCase.evidence.strength}</strong></div>
                  <div className="evidence-thumb"><span>胶痕局部</span></div>
                  <h2>{lacquerBoxCase.evidence.name}</h2>
                  <p>{lacquerBoxCase.evidence.detail}</p>
                </article>
                <div className="contradiction-mark"><span>形成矛盾</span></div>
                <article className="claim-card">
                  <div className="card-topline"><span>NPC 陈述</span><strong>待核验</strong></div>
                  <p className="claim-topic">修复历史</p>
                  <blockquote>“{lacquerBoxCase.response.before}”</blockquote>
                  <small>记录于来客上门阶段</small>
                </article>
              </div>

              <div className="button-stack">
                <button className="secondary-button" onClick={() => go("observe")}>返回观察</button>
              </div>
            </>
          )}

          {screen === "action" && (
            <>
              <ScreenHeading
                eyebrow="P4 · 选择行动"
                title="组成这一次结构化行动"
                description="目标、行动、态度和证据共同决定回应。"
              />

              <dl className="action-summary">
                <div><dt>调查目标</dt><dd>修复历史</dd></div>
                <div><dt>行动类型</dt><dd>指出矛盾</dd></div>
                <div><dt>引用证据</dt><dd>现代胶痕</dd></div>
              </dl>

              <fieldset className="tone-fieldset">
                <legend>选择表达态度</legend>
                {toneOptions.map((option) => (
                  <button
                    type="button"
                    className={tone === option.id ? "selected" : ""}
                    aria-pressed={tone === option.id}
                    onClick={() => { setTone(option.id); setToneFeedback(null); }}
                    key={option.id}
                  >
                    <span className="tone-title"><strong>{option.label}</strong>{option.id === "professional" && <em>核心演示</em>}</span>
                    <span>{option.benefit}</span><small>{option.risk}</small>
                  </button>
                ))}
              </fieldset>

              {toneFeedback && <div className="strategy-feedback" role="status">{toneFeedback}</div>}

              <div className="button-stack">
                <button className="primary-button" onClick={submitAction}>提交行动</button>
                <button className="text-button" onClick={() => go("observe")}>返回观察</button>
              </div>
            </>
          )}

          {screen === "response" && (
            <>
              <ScreenHeading
                eyebrow="P5 · NPC 回应"
                title="陈述发生变化，记录新的版本"
                description="现阶段显示 0—100 精确 Mock 数值，便于讨论规则；尚非最终平衡。"
              />

              <div className="phase-change">
                <span>放松</span><i aria-hidden="true">→</i><strong>谨慎</strong><MockBadge />
              </div>

              <div className="delta-grid">
                {lacquerBoxCase.npcStatePreview.map((item) => {
                  const delta = item.after - item.before;
                  return (
                    <div key={item.id}>
                      <span>{item.label}</span>
                      <strong>{item.before} → {item.after}</strong>
                      <small>{delta > 0 ? "+" : ""}{delta} · {item.reason}</small>
                    </div>
                  );
                })}
              </div>

              <section className="statement-history">
                <div><span>原陈述</span><blockquote>“{lacquerBoxCase.response.before}”</blockquote></div>
                <div className="new-statement"><span>新陈述</span><blockquote>“{lacquerBoxCase.response.after}”</blockquote></div>
              </section>

              <div className="insight-callout">
                <strong>当前推断</strong>
                <p>器物存在现代处理风险，卖家缩小了原陈述范围，但尚未说明完整来源。</p>
              </div>

              <div className="button-stack">
                <button className="primary-button" onClick={() => go("trade")}>进入交易处置</button>
                <button className="secondary-button" onClick={() => go("evidence")}>查看证据簿</button>
              </div>
            </>
          )}

          {screen === "trade" && (
            <>
              <ScreenHeading
                eyebrow="P6 · 对质与交易"
                title="选择能覆盖当前风险的处置"
                description="胜利不是必须成交，而是让条件与证据相匹配。"
              />

              <div className="risk-summary">
                <div><span>当前风险</span><strong>中高</strong></div>
                <ul>
                  <li>已发现：现代胶痕</li>
                  <li>已确认：卖家修复陈述发生变化</li>
                  <li>仍未知：底款、锁扣与完整来源链</li>
                </ul>
              </div>

              <fieldset className="outcome-fieldset">
                <legend>选择最终处置</legend>
                {lacquerBoxCase.outcomes.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={selectedOutcome === item.id ? "selected" : ""}
                    aria-pressed={selectedOutcome === item.id}
                    onClick={() => setSelectedOutcome(item.id)}
                  >
                    <span><strong>{item.label}</strong>{item.id === "conditional-testing" && <em>建议演示</em>}</span>
                    <small>{item.short}</small>
                  </button>
                ))}
              </fieldset>

              <div className="trade-condition">
                <MockBadge />
                <p>{outcome.result}</p>
              </div>

              <div className="button-stack">
                <button className="primary-button" onClick={() => go("review")}>确认处置</button>
                <button className="text-button" onClick={() => go("response")}>返回回应</button>
              </div>
            </>
          )}

          {screen === "review" && (
            <>
              <ScreenHeading
                eyebrow="P7 · 结算与复盘"
                title="本次处置已记录"
                description="复盘解释判断依据，而不是只告诉玩家买没买到。"
              />

              <div className="outcome-banner">
                <span>最终处置</span><h2>{outcome.label}</h2><p>{outcome.result}</p>
              </div>

              <section className="truth-panel">
                <div className="section-title"><h2>物品真相</h2><span>复盘解锁</span></div>
                <ul>{lacquerBoxCase.truth.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>

              <div className="review-evidence">
                <div><span>本局发现</span><strong>现代胶痕</strong></div>
                <div><span>本局忽略</span><strong>{lacquerBoxCase.ignoredEvidence.length} 条线索</strong></div>
              </div>

              <section className="score-panel">
                <div><span>判断质量</span><strong>证据驱动</strong></div>
                <div><span>证据质量</span><strong>强证据 × 1</strong></div>
                <div><span>交易质量</span><strong>{outcome.assessment}</strong></div>
                <div><span>关系影响</span><strong>合作关系保留</strong></div>
              </section>

              <div className="receipt-placeholder">
                <span>次日回执占位</span>
                <p>{selectedOutcome === "conditional-testing" ? "明日可收到第三方检测结果。" : "未来版本将在下一营业日反馈本次决定的后续影响。"}</p>
              </div>

              <button className="primary-button" onClick={resetPrototype}>重新体验</button>
            </>
          )}
        </div>

        <footer className="app-footer">
          <span>低保真交互原型</span><span>390 × 844 基准</span>
        </footer>

        {detailOpen && (
          <div className="modal-backdrop" role="presentation">
            <section className="evidence-modal" role="dialog" aria-modal="true" aria-labelledby="evidence-modal-title">
              <div className="modal-handle" />
              <div className="modal-topline"><MockBadge /><span>{detailIsNew ? "行动点 -1" : "证据已收录"}</span></div>
              <div className="detail-placeholder" aria-hidden="true"><i /><i /><b>胶</b></div>
              <p className="eyebrow">S1 · {detailIsNew ? "发现证据" : "证据详情"}</p>
              <h2 id="evidence-modal-title">{lacquerBoxCase.evidence.name}</h2>
              <p>{lacquerBoxCase.evidence.detail}</p>
              <div className="evidence-meta"><span>{lacquerBoxCase.evidence.strength}</span><span>关联：修复历史</span></div>
              <div className="button-stack">
                <button className="primary-button" onClick={() => {
                  if (detailIsNew) setEvidenceFound(true);
                  setDetailOpen(false);
                  setDetailIsNew(false);
                  go("observe");
                }}>
                  {detailIsNew ? "收进证据簿" : "返回观察"}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
