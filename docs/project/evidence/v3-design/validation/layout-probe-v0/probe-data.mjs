/*
 * Build three deterministic snapshots from the existing V3 session and
 * projection layers. It keeps the projected graph intact and adds no layout
 * categories, ordering fields, placeholder nodes, or edge semantics.
 */
import { newSession, take, solve } from "../workbench-map-v0/session.mjs";
import { mentalMap } from "../workbench-map-v0/projection.mjs";

export const PROBE_ORDER = [
  "A.OBSERVE.WHOLE",
  "A.OBSERVE.BASE",
  "A.OBSERVE.REGION_DECOR",
  "A.COMPARE.CORPUS",
  "A.VERIFY.OBJECT_CONTINUITY",
  "A.IMAGE.XRAY",
  "A.MAP.REGION_CONTINUITY",
  "A.RESEARCH.ACCIDENT",
  "A.RELATE.ARCHIVE.T2_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T2_CURRENT",
  "A.LOCATE.HISTORIC_IMAGE",
  "A.RESEARCH.LATE_TREATMENT",
  "A.RELATE.ARCHIVE.T3_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T3_CURRENT",
  "A.ANALYZE.MATERIAL.SUBSTRATE",
  "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
  "A.INSPECT.WINDOWS",
  "A.SYNTHESIZE.SURFACE_REGIONS",
  "A.SCREEN.UV",
  "A.ASSESS.TREATED_AND_UNTREATED",
  "A.TRACE.PROVENANCE_CHAIN",
  "A.COMPARE.CORPUS.RECHECK",
];

export const CHECKPOINTS = [
  {
    step: 6,
    label: "少量内容",
    note: "关系刚刚成形：看两处局部判断是否各自聚成可辨认的小簇。",
  },
  {
    step: 12,
    label: "关系成形",
    note: "另一批档案证据加入：看新内容是否只扰动相关邻域，而非冲散整张地图。",
  },
  {
    step: 22,
    label: "完整内容",
    note: "全部内容在场：看主簇、小簇与暂未接上的点能否同时保持可读。",
  },
];

export function buildProbeTimeline() {
  const session = newSession(PROBE_ORDER.length);
  const timeline = [];

  for (let index = 0; index < PROBE_ORDER.length; index += 1) {
    const actionId = PROBE_ORDER[index];
    const result = take(session, actionId);
    if (!result.ok) {
      throw new Error(`第 ${index + 1} 步 ${actionId} 被拒绝：${result.why}`);
    }
    const solved = solve(session);
    const graph = structuredClone(mentalMap(solved));
    timeline.push({
      step: index + 1,
      actionId,
      graph,
      counts: {
        observations: graph.nodes.length,
        findings: graph.findings.length,
        conclusions: graph.axioms.length,
        edges: graph.edges.length,
      },
    });
  }

  return timeline;
}

export function buildProbeCheckpoints() {
  const timeline = buildProbeTimeline();
  return CHECKPOINTS.map((checkpoint) => {
    const state = timeline[checkpoint.step - 1];
    if (!state) throw new Error(`缺少第 ${checkpoint.step} 步快照`);
    return { ...state, label: checkpoint.label, note: checkpoint.note };
  });
}
