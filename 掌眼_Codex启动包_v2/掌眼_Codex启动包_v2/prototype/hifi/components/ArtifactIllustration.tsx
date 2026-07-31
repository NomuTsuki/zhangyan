"use client";

import { useId, type CSSProperties } from "react";

export type ArtifactTargetId =
  | "surface"
  | "bottom"
  | "joint"
  | "latch"
  | "interior";

export interface ArtifactIllustrationProps {
  selectedTargetId: string;
  inspectedTargetIds: readonly string[];
  onSelect: (targetId: ArtifactTargetId) => void;
}

type ArtifactView = "front" | "bottom" | "open";

type TargetPresentation = {
  id: ArtifactTargetId;
  label: string;
  view: ArtifactView;
  x: number;
  y: number;
};

const VIEW_META: Record<
  ArtifactView,
  { label: string; description: string; defaultTargetId: ArtifactTargetId }
> = {
  front: {
    label: "正面",
    description: "观察漆面、锁扣与侧边接口",
    defaultTargetId: "surface",
  },
  bottom: {
    label: "底部",
    description: "观察底款与底部磨损",
    defaultTargetId: "bottom",
  },
  open: {
    label: "开盒",
    description: "观察内腔、木胎与拼接接口",
    defaultTargetId: "interior",
  },
};

const TARGETS: Record<ArtifactTargetId, TargetPresentation> = {
  surface: {
    id: "surface",
    label: "漆面",
    view: "front",
    x: 39,
    y: 36,
  },
  latch: {
    id: "latch",
    label: "锁扣",
    view: "front",
    x: 52,
    y: 60,
  },
  joint: {
    id: "joint",
    label: "接口",
    view: "open",
    x: 23,
    y: 56,
  },
  bottom: {
    id: "bottom",
    label: "底部",
    view: "bottom",
    x: 52,
    y: 56,
  },
  interior: {
    id: "interior",
    label: "内腔",
    view: "open",
    x: 57,
    y: 68,
  },
};

const TARGETS_BY_VIEW: Record<ArtifactView, readonly ArtifactTargetId[]> = {
  front: ["surface", "latch"],
  bottom: ["bottom"],
  open: ["joint", "interior"],
};

const VIEW_BY_TARGET: Record<ArtifactTargetId, ArtifactView> = {
  surface: "front",
  latch: "front",
  joint: "open",
  bottom: "bottom",
  interior: "open",
};

function isArtifactTargetId(value: string): value is ArtifactTargetId {
  return value in TARGETS;
}

function FrontView({
  lacquerId,
  lacquerLightId,
  brassId,
  shadowId,
}: {
  lacquerId: string;
  lacquerLightId: string;
  brassId: string;
  shadowId: string;
}) {
  return (
    <g aria-hidden="true">
      <ellipse cx="360" cy="430" rx="248" ry="32" fill="#10251f" opacity=".16" />
      <g filter={`url(#${shadowId})`}>
        <rect
          x="108"
          y="126"
          width="504"
          height="190"
          rx="42"
          fill={`url(#${lacquerLightId})`}
          stroke="#55231d"
          strokeWidth="5"
        />
        <path
          d="M111 251h498v128c0 29-23 52-52 52H163c-29 0-52-23-52-52V251Z"
          fill={`url(#${lacquerId})`}
          stroke="#55231d"
          strokeWidth="5"
        />
        <path
          d="M130 248h460"
          fill="none"
          stroke="#d3a85e"
          strokeWidth="3"
          opacity=".72"
        />
        <path
          d="M137 156c72-17 128 18 184 3 67-18 109-12 158 8 35 14 72 11 106-2"
          fill="none"
          stroke="#e4bf76"
          strokeLinecap="round"
          strokeWidth="2.5"
          opacity=".62"
        />
        <path
          d="M160 220c34-30 77-47 119-45 45 2 83 28 120 31 51 4 89-25 147-28"
          fill="none"
          stroke="#bd8746"
          strokeLinecap="round"
          strokeWidth="2"
          opacity=".55"
        />
        <path
          d="M180 207c11-27 24-45 45-60m-19 35c-13-7-25-8-37-4m42-8c15-10 30-13 47-9"
          fill="none"
          stroke="#d7ac62"
          strokeLinecap="round"
          strokeWidth="2"
          opacity=".7"
        />
        <circle cx="469" cy="187" r="22" fill="#c58c43" opacity=".18" />
        <circle
          cx="469"
          cy="187"
          r="16"
          fill="none"
          stroke="#deb86f"
          strokeWidth="2"
          opacity=".56"
        />
        <path
          d="M141 286c96 18 178 12 251-7 70-18 129-13 187 7"
          fill="none"
          stroke="#8f4637"
          strokeWidth="10"
          opacity=".27"
        />
        <path
          d="M151 395h418"
          fill="none"
          stroke="#2e1714"
          strokeLinecap="round"
          strokeWidth="5"
          opacity=".42"
        />
        <g>
          <path
            d="M324 238h72v55c0 17-13 30-30 30h-12c-17 0-30-13-30-30v-55Z"
            fill={`url(#${brassId})`}
            stroke="#775724"
            strokeWidth="4"
          />
          <rect x="339" y="259" width="42" height="18" rx="8" fill="#795522" opacity=".74" />
          <circle cx="360" cy="294" r="6" fill="#4d3517" />
        </g>
        <path
          d="M122 269h23m430 0h23"
          fill="none"
          stroke="#d6ad62"
          strokeLinecap="round"
          strokeWidth="5"
          opacity=".75"
        />
      </g>
      <text
        x="360"
        y="478"
        fill="#5d665f"
        fontFamily="PingFang SC, Microsoft YaHei, sans-serif"
        fontSize="17"
        textAnchor="middle"
      >
        正面构图 · 整体形态示意
      </text>
    </g>
  );
}

function BottomView({
  woodId,
  lacquerId,
  brassId,
  shadowId,
}: {
  woodId: string;
  lacquerId: string;
  brassId: string;
  shadowId: string;
}) {
  return (
    <g aria-hidden="true">
      <ellipse cx="360" cy="427" rx="236" ry="31" fill="#10251f" opacity=".15" />
      <g filter={`url(#${shadowId})`}>
        <path
          d="M151 103h418c31 0 57 25 57 56v210c0 31-26 56-57 56H151c-31 0-57-25-57-56V159c0-31 26-56 57-56Z"
          fill={`url(#${lacquerId})`}
          stroke="#55231d"
          strokeWidth="5"
          transform="rotate(-2 360 264)"
        />
        <path
          d="M148 132h424c16 0 29 13 29 29v189c0 23-19 42-42 42H160c-23 0-42-19-42-42V161c0-16 13-29 30-29Z"
          fill={`url(#${woodId})`}
          stroke="#8e563d"
          strokeWidth="3"
          transform="rotate(-2 360 264)"
        />
        <path
          d="M156 179c87-31 171-16 249 5 63 16 116 19 167-1M147 330c88 18 163 9 229-9 67-18 126-15 183 9"
          fill="none"
          stroke="#6e3d2c"
          strokeLinecap="round"
          strokeWidth="3"
          opacity=".34"
        />
        <path
          d="M319 212c27-17 58-18 84-3 25 14 37 42 31 69-7 30-32 52-63 54-30 1-57-17-67-46-9-28-3-55 15-74Z"
          fill="#3d211b"
          opacity=".3"
        />
        <path
          d="M330 225c19-11 43-11 62 1 17 11 26 30 23 50-4 22-22 39-45 41-23 2-44-11-52-32-8-22-3-44 12-60Z"
          fill="none"
          stroke={`url(#${brassId})`}
          strokeDasharray="4 7"
          strokeLinecap="round"
          strokeWidth="3"
          opacity=".7"
        />
        <path
          d="M337 268h49M361 242v51"
          fill="none"
          stroke="#d7ae69"
          strokeLinecap="round"
          strokeWidth="2"
          opacity=".48"
        />
        <g fill="#382019" stroke="#a56d43" strokeWidth="2">
          <path d="M122 139h42v18h-42Z" />
          <path d="M557 124h42v18h-42Z" />
          <path d="M119 370h42v18h-42Z" />
          <path d="M557 354h42v18h-42Z" />
        </g>
      </g>
      <text
        x="360"
        y="478"
        fill="#5d665f"
        fontFamily="PingFang SC, Microsoft YaHei, sans-serif"
        fontSize="17"
        textAnchor="middle"
      >
        底部构图 · 底款与磨损位置示意
      </text>
    </g>
  );
}

function OpenView({
  lacquerId,
  liningId,
  brassId,
  shadowId,
}: {
  lacquerId: string;
  liningId: string;
  brassId: string;
  shadowId: string;
}) {
  return (
    <g aria-hidden="true">
      <ellipse cx="360" cy="454" rx="252" ry="27" fill="#10251f" opacity=".16" />
      <g filter={`url(#${shadowId})`}>
        <path
          d="M145 54h430c25 0 45 20 45 45v131H100V99c0-25 20-45 45-45Z"
          fill={`url(#${lacquerId})`}
          stroke="#55231d"
          strokeWidth="5"
        />
        <path
          d="M148 80h424c11 0 20 9 20 20v101H128V100c0-11 9-20 20-20Z"
          fill={`url(#${liningId})`}
          stroke="#b98754"
          strokeWidth="3"
        />
        <path
          d="M172 113c70 21 130 17 188-3 62-21 122-24 186-3"
          fill="none"
          stroke="#8c684a"
          strokeLinecap="round"
          strokeWidth="2"
          opacity=".35"
        />
        <path
          d="M108 239h504v159c0 30-24 54-54 54H162c-30 0-54-24-54-54V239Z"
          fill={`url(#${lacquerId})`}
          stroke="#55231d"
          strokeWidth="5"
        />
        <path
          d="M139 266h442v107c0 25-20 45-45 45H184c-25 0-45-20-45-45V266Z"
          fill={`url(#${liningId})`}
          stroke="#b98754"
          strokeWidth="3"
        />
        <rect x="165" y="288" width="112" height="101" rx="17" fill="#c7a77e" opacity=".52" />
        <rect x="296" y="288" width="259" height="44" rx="14" fill="#c7a77e" opacity=".52" />
        <rect x="296" y="346" width="123" height="43" rx="14" fill="#c7a77e" opacity=".52" />
        <rect x="432" y="346" width="123" height="43" rx="14" fill="#c7a77e" opacity=".52" />
        <path
          d="M126 244h468"
          fill="none"
          stroke="#e1b76b"
          strokeWidth="3"
          opacity=".72"
        />
        <g fill={`url(#${brassId})`} stroke="#72501f" strokeWidth="2">
          <rect x="169" y="224" width="68" height="23" rx="6" />
          <rect x="483" y="224" width="68" height="23" rx="6" />
        </g>
        <path
          d="M149 275c31 7 48 20 61 41M568 275c-31 7-48 20-61 41"
          fill="none"
          stroke="#7f4b36"
          strokeLinecap="round"
          strokeWidth="3"
          opacity=".42"
        />
      </g>
      <text
        x="360"
        y="496"
        fill="#5d665f"
        fontFamily="PingFang SC, Microsoft YaHei, sans-serif"
        fontSize="17"
        textAnchor="middle"
      >
        开盒构图 · 内腔与接口位置示意
      </text>
    </g>
  );
}

export function ArtifactIllustration({
  selectedTargetId,
  inspectedTargetIds,
  onSelect,
}: ArtifactIllustrationProps) {
  const reactId = useId().replace(/:/g, "");
  const titleId = `artifact-title-${reactId}`;
  const descriptionId = `artifact-description-${reactId}`;
  const paperId = `artifact-paper-${reactId}`;
  const lacquerId = `artifact-lacquer-${reactId}`;
  const lacquerLightId = `artifact-lacquer-light-${reactId}`;
  const woodId = `artifact-wood-${reactId}`;
  const liningId = `artifact-lining-${reactId}`;
  const brassId = `artifact-brass-${reactId}`;
  const shadowId = `artifact-shadow-${reactId}`;

  const normalizedTargetId: ArtifactTargetId = isArtifactTargetId(selectedTargetId)
    ? selectedTargetId
    : "surface";
  const activeView = VIEW_BY_TARGET[normalizedTargetId];
  const activeTarget = TARGETS[normalizedTargetId];
  const inspectedTargets = new Set(inspectedTargetIds);

  const stageStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "720 / 520",
    overflow: "hidden",
    border: "1px solid rgba(104, 115, 109, 0.24)",
    borderRadius: 24,
    background: "#ede3d2",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.78)",
  };

  const viewButtonStyle: CSSProperties = {
    minWidth: 72,
    minHeight: 44,
    padding: "8px 14px",
    border: "1px solid #cfc6b5",
    borderRadius: 999,
    font: "inherit",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <section
      className="artifact-illustration"
      aria-labelledby={titleId}
      data-view={activeView}
    >
      <div className="artifact-illustration__heading">
        <div>
          <p className="artifact-illustration__eyebrow">器物观察</p>
          <h2 id={titleId}>民国漆木首饰盒</h2>
        </div>
        <p className="artifact-illustration__selection" role="status" aria-live="polite">
          当前观察：{activeTarget.label}
          <span aria-hidden="true"> · </span>
          {inspectedTargets.has(normalizedTargetId) ? "已检查" : "尚未检查"}
        </p>
      </div>

      <div
        className="artifact-illustration__view-switcher"
        role="group"
        aria-label="选择器物观察视图"
      >
        {(Object.keys(VIEW_META) as ArtifactView[]).map((view) => {
          const selected = view === activeView;
          const meta = VIEW_META[view];
          return (
            <button
              type="button"
              className={`artifact-illustration__view-button${selected ? " is-active" : ""}`}
              style={{
                ...viewButtonStyle,
                color: selected ? "#fffdf7" : "#173f38",
                borderColor: selected ? "#173f38" : "#cfc6b5",
                background: selected ? "#173f38" : "#fffdf7",
              }}
              aria-pressed={selected}
              title={meta.description}
              onClick={() => onSelect(meta.defaultTargetId)}
              key={view}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="artifact-illustration__stage" style={stageStyle}>
        <svg
          className="artifact-illustration__svg"
          viewBox="0 0 720 520"
          width="720"
          height="520"
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <title>{VIEW_META[activeView].label}视图中的漆木首饰盒插画</title>
          <desc id={descriptionId}>
            非写实二维插画，仅用于辨认器物整体形态和观察位置；鉴定事实由检查后的文字记录给出。
          </desc>
          <defs>
            <linearGradient id={paperId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f8f1e5" />
              <stop offset=".52" stopColor="#e9ddc9" />
              <stop offset="1" stopColor="#ded0b9" />
            </linearGradient>
            <linearGradient id={lacquerId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7f352c" />
              <stop offset=".48" stopColor="#55231f" />
              <stop offset="1" stopColor="#2f1715" />
            </linearGradient>
            <linearGradient id={lacquerLightId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a65340" />
              <stop offset=".42" stopColor="#7f352d" />
              <stop offset="1" stopColor="#4e211d" />
            </linearGradient>
            <linearGradient id={woodId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6f3c2d" />
              <stop offset=".5" stopColor="#4b2b22" />
              <stop offset="1" stopColor="#2d1b18" />
            </linearGradient>
            <linearGradient id={liningId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ead5b7" />
              <stop offset=".55" stopColor="#d6b88d" />
              <stop offset="1" stopColor="#b98e62" />
            </linearGradient>
            <linearGradient id={brassId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f0d28b" />
              <stop offset=".42" stopColor="#b88b3f" />
              <stop offset="1" stopColor="#765421" />
            </linearGradient>
            <filter
              id={shadowId}
              x="-20%"
              y="-20%"
              width="140%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#281713" floodOpacity=".22" />
            </filter>
          </defs>
          <rect width="720" height="520" fill={`url(#${paperId})`} />
          <circle cx="112" cy="85" r="86" fill="#fffdf7" opacity=".35" />
          <circle cx="650" cy="448" r="125" fill="#b28a4c" opacity=".08" />
          <path
            d="M0 420c115-50 224-49 331-9 127 48 248 39 389-27v136H0Z"
            fill="#173f38"
            opacity=".055"
            aria-hidden="true"
          />

          {activeView === "front" && (
            <FrontView
              lacquerId={lacquerId}
              lacquerLightId={lacquerLightId}
              brassId={brassId}
              shadowId={shadowId}
            />
          )}
          {activeView === "bottom" && (
            <BottomView
              woodId={woodId}
              lacquerId={lacquerId}
              brassId={brassId}
              shadowId={shadowId}
            />
          )}
          {activeView === "open" && (
            <OpenView
              lacquerId={lacquerId}
              liningId={liningId}
              brassId={brassId}
              shadowId={shadowId}
            />
          )}
        </svg>

        <div
          className="artifact-illustration__hotspot-layer"
          aria-label={`${VIEW_META[activeView].label}视图可检查位置`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {TARGETS_BY_VIEW[activeView].map((targetId, index) => {
            const target = TARGETS[targetId];
            const selected = targetId === normalizedTargetId;
            const inspected = inspectedTargets.has(targetId);
            const stateText = selected
              ? inspected
                ? "当前选择，已检查"
                : "当前选择，尚未检查"
              : inspected
                ? "已检查"
                : "尚未检查";

            return (
              <button
                type="button"
                className={[
                  "artifact-illustration__hotspot",
                  selected ? "is-selected" : "",
                  inspected ? "is-inspected" : "",
                ].filter(Boolean).join(" ")}
                style={{
                  position: "absolute",
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  minWidth: 56,
                  minHeight: 48,
                  padding: "6px 9px",
                  color: selected ? "#fffdf7" : "#173f38",
                  border: `2px solid ${selected ? "#fffdf7" : inspected ? "#b28a4c" : "#173f38"}`,
                  borderRadius: 14,
                  background: selected
                    ? "#9b3f32"
                    : inspected
                      ? "rgba(255, 253, 247, 0.96)"
                      : "rgba(255, 253, 247, 0.9)",
                  boxShadow: selected
                    ? "0 0 0 4px rgba(155, 63, 50, 0.22), 0 8px 20px rgba(29, 38, 34, 0.2)"
                    : "0 6px 18px rgba(29, 38, 34, 0.16)",
                  font: "inherit",
                  cursor: "pointer",
                  pointerEvents: "auto",
                  transform: "translate(-50%, -50%)",
                }}
                aria-label={`${target.label}，${stateText}`}
                aria-pressed={selected}
                data-target-id={targetId}
                data-inspected={inspected ? "true" : "false"}
                onClick={() => onSelect(targetId)}
                key={targetId}
              >
                <span
                  className="artifact-illustration__hotspot-index"
                  aria-hidden="true"
                  style={{ display: "block", fontSize: 11, fontWeight: 800, opacity: 0.78 }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="artifact-illustration__hotspot-label"
                  style={{ display: "block", fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}
                >
                  {target.label}
                </span>
                <span
                  className="artifact-illustration__hotspot-state"
                  style={{ display: "block", marginTop: 2, fontSize: 10, fontWeight: 700 }}
                >
                  {selected ? "当前" : inspected ? "已检查" : "可检查"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="artifact-illustration__disclaimer">
        插画用于定位，不呈现可直接判定真伪的微观细节；细纹、标记与结构判断以观察后的文字记录为准。
      </p>
    </section>
  );
}

export default ArtifactIllustration;
