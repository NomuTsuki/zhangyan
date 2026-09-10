import * as sessionEngine from '../../workbench-map-fusion-v0/local-session.mjs';

const COMPARISON = 'A.MAP.REGION_CONTINUITY';

/** UI execution identity: another comparison basis is a new investigation. */
export function completedInvestigation(session, actionId, comparisonBasis = '') {
  if (actionId === COMPARISON && !comparisonBasis) return null;
  const index = session.log.findIndex(entry => entry.actionId === actionId &&
    (actionId !== COMPARISON || entry.comparisonBasis === comparisonBasis));
  return index < 0 ? null : { ...session.log[index], step: index + 1 };
}

/** Guard the playable page without altering frozen or historical replay rules. */
export function takeNewInvestigation(session, actionId, options = {}) {
  let basis = options.comparisonBasis || '';
  if (actionId === COMPARISON && !basis) {
    const available = sessionEngine.workbench(session).find(row => row.action.id === actionId)
      ?.comparisonOptions?.filter(option => option.usable) || [];
    if (available.length === 1) basis = available[0].id;
  }
  const prior = completedInvestigation(session, actionId, basis);
  if (prior) return { ok: false, alreadyDone: true, observationId: prior.observationId,
    why: '这项调查已经做过，可以直接查看记录。' };
  return sessionEngine.take(session, actionId, basis ? { ...options, comparisonBasis: basis } : options);
}
