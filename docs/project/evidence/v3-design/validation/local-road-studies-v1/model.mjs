// Experimental presentation studies. This module deliberately has no solver imports.
const MATCH_OUTCOMES = new Set(['match', 'uncertain', 'different']);
const COMPARISON_OUTCOMES = new Set(['difference', 'same', 'incomparable']);
const MATERIAL_ACTIONS = {
  TAKE_PHOTO: 'photo',
  TAKE_CURRENT: 'current',
  TAKE_XRAY: 'xray',
};

function initial(mode = 'photo') {
  const selectedMode = mode === 'compare' ? 'compare' : 'photo';
  const suppliedMaterials = selectedMode === 'compare';
  return {
    mode: selectedMode,
    materials: { photo: suppliedMaterials, current: suppliedMaterials, xray: false },
    match: null,
    comparison: null,
    log: [],
  };
}

function derive(state) {
  const hasBothMaterials = state.materials.photo && state.materials.current;
  const matched = state.match?.outcome === 'match';
  return {
    canVerify: hasBothMaterials && state.match === null,
    canCompare: state.mode === 'compare' && hasBothMaterials && state.comparison === null,
    historicalRepair: state.mode === 'photo' && state.materials.photo && matched,
    temporalChange: state.mode === 'compare' && matched && state.comparison?.outcome === 'difference',
    canTakePhoto: !state.materials.photo,
    canTakeCurrent: !state.materials.current,
    canTakeXray: !state.materials.xray,
  };
}

function reduce(state, action) {
  if (action?.type === 'RESET') return initial(state.mode);

  const material = MATERIAL_ACTIONS[action?.type];
  if (material && Object.hasOwn(MATERIAL_ACTIONS, action.type)) {
    if (state.materials[material]) return state;
    const event = { type: action.type, order: state.log.length + 1 };
    return {
      ...state,
      materials: { ...state.materials, [material]: true },
      log: [...state.log, event],
    };
  }

  const available = derive(state);
  if (action?.type === 'VERIFY' && available.canVerify && MATCH_OUTCOMES.has(action.outcome)) {
    const event = { type: 'VERIFY', outcome: action.outcome, order: state.log.length + 1 };
    return {
      ...state,
      match: { outcome: event.outcome, order: event.order },
      log: [...state.log, event],
    };
  }

  if (action?.type === 'COMPARE' && available.canCompare && COMPARISON_OUTCOMES.has(action.outcome)) {
    const event = { type: 'COMPARE', outcome: action.outcome, order: state.log.length + 1 };
    return {
      ...state,
      comparison: { outcome: event.outcome, order: event.order },
      log: [...state.log, event],
    };
  }

  return state;
}

export const StudyLogic = Object.freeze({ initial, reduce, derive });
