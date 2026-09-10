import { engine, derive, diffGraphs } from './engine.ts';
import { takeNewInvestigation } from './action-state.mjs';

// Actions contain outcome functions. They are implementation details, never
// executable data sent to the view. Every other field retains its real value.
function transferable(value) {
  if (Array.isArray(value)) return value.map(transferable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([, entry]) => typeof entry !== 'function' && entry !== undefined)
    .map(([key, entry]) => [key, transferable(entry)]));
  return value;
}

/** One authoritative session and one solver module/cache per background worker. */
export function createEngineRuntime() {
  let session = engine.newSession(22), model = null, revision = 0;
  const currentModel = () => model ?? (model = derive(session));
  function snapshot(viewSession = session, historyIndex = null, extra = {}) {
    return transferable({ session, viewSession, historyIndex, revision,
      model: viewSession === session ? currentModel() : derive(viewSession), ...extra });
  }
  return {
    dispatch(command, payload = {}) {
      if (command === 'init') {
        session = engine.newSession(payload.budget ?? 22); model = null; revision++;
        return snapshot();
      }
      if (command === 'view') {
        if (payload.historyIndex === null || payload.historyIndex === undefined) return snapshot();
        const index = payload.historyIndex;
        if (!Number.isInteger(index) || index < 0 || index > session.log.length) throw Error('这段调查记录不存在。');
        const past = engine.replayLog(session.log.slice(0, index), session.budget, false);
        return snapshot(past, index);
      }
      if (payload.expectedRevision !== undefined && payload.expectedRevision !== revision) {
        return snapshot(session, null, { result: { ok: false, stale: true, why: '调查状态已经变化，请重新选择手段。' } });
      }
      if (command === 'take') {
        const next = structuredClone(session), beforeGraph = currentModel().graph;
        const result = takeNewInvestigation(next, payload.actionId, payload.options ?? {});
        if (!result.ok) return snapshot(session, null, { result });
        const after = derive(next), changes = diffGraphs(beforeGraph, after.graph);
        session = next; model = after; revision++;
        return snapshot(session, null, { result, changes, beforeGraph });
      }
      if (command === 'budget') {
        const next = structuredClone(session), result = engine.setBudget(next, payload.budget);
        if (result.ok) { session = next; model = null; revision++; }
        return snapshot(session, null, { result });
      }
      if (command === 'stop') {
        if (!session.stopped) { session = { ...session, stopped: true }; model = null; revision++; }
        return snapshot();
      }
      throw Error(`Unknown background command: ${command}`);
    },
  };
}
