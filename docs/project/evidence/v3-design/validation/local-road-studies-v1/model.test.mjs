// review required: new experimental presentation tests; no frozen baselines changed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { StudyLogic } from './model.mjs';

const { initial, reduce, derive } = StudyLogic;
const take = (state, type) => reduce(state, { type });
const verify = (state, outcome = 'match') => reduce(state, { type: 'VERIFY', outcome });
const compare = (state, outcome = 'difference') => reduce(state, { type: 'COMPARE', outcome });
const photoReady = () => take(take(initial(), 'TAKE_PHOTO'), 'TAKE_CURRENT');

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

test('each initial state is independent and compare starts with supplied materials only', () => {
  const first = initial();
  const second = initial();
  assert.deepEqual(first.materials, { photo: false, current: false, xray: false });
  assert.notEqual(first.materials, second.materials);
  assert.notEqual(first.log, second.log);
  assert.deepEqual(initial('compare'), {
    mode: 'compare',
    materials: { photo: true, current: true, xray: false },
    match: null,
    comparison: null,
    log: [],
  });
});

test('verification cannot run without both photo and current-object observations', () => {
  const empty = initial();
  const photoOnly = take(empty, 'TAKE_PHOTO');
  const currentOnly = take(empty, 'TAKE_CURRENT');
  for (const state of [empty, photoOnly, currentOnly]) {
    assert.equal(derive(state).canVerify, false);
    assert.equal(verify(state), state);
    assert.equal(state.match, null);
    assert.equal(derive(state).historicalRepair, false);
  }
  assert.equal(derive(photoReady()).canVerify, true);
});

test('acquiring the two materials in either order yields the same photo-history conclusion', () => {
  const photoFirst = verify(photoReady());
  const currentFirst = verify(take(take(initial(), 'TAKE_CURRENT'), 'TAKE_PHOTO'));
  assert.equal(derive(photoFirst).historicalRepair, true);
  assert.deepEqual(derive(photoFirst), derive(currentFirst));
  assert.deepEqual(photoFirst.log.map(event => event.type), ['TAKE_PHOTO', 'TAKE_CURRENT', 'VERIFY']);
  assert.deepEqual(currentFirst.log.map(event => event.type), ['TAKE_CURRENT', 'TAKE_PHOTO', 'VERIFY']);
  assert.deepEqual(photoFirst.log.map(event => event.order), [1, 2, 3]);
});

test('X-ray supplies current information without authorizing either historical conclusion', () => {
  const state = take(initial(), 'TAKE_XRAY');
  assert.equal(state.materials.xray, true);
  assert.equal(derive(state).historicalRepair, false);
  assert.equal(derive(state).temporalChange, false);
  assert.equal(derive(state).canVerify, false);
  assert.equal(verify(state), state);
  const withOtherMaterials = take(take(state, 'TAKE_PHOTO'), 'TAKE_CURRENT');
  assert.equal(derive(withOtherMaterials).historicalRepair, false);
});

test('uncertain and different-object reports preserve materials without a historical repair claim', () => {
  for (const outcome of ['uncertain', 'different']) {
    const state = verify(photoReady(), outcome);
    assert.equal(state.match.outcome, outcome);
    assert.equal(derive(state).historicalRepair, false);
    assert.equal(derive(state).canVerify, false);
    assert.deepEqual(state.materials, { photo: true, current: true, xray: false });
  }
});

test('a comparison acquired first gains historical use later without being acquired again', () => {
  const differenceFirst = compare(initial('compare'));
  assert.equal(derive(differenceFirst).temporalChange, false);
  const comparisonReport = differenceFirst.comparison;
  const firstEvent = differenceFirst.log[0];
  const interpreted = verify(differenceFirst);
  assert.equal(derive(interpreted).temporalChange, true);
  assert.equal(interpreted.comparison, comparisonReport);
  assert.equal(interpreted.log[0], firstEvent);
  assert.equal(interpreted.comparison.order, 1);
  assert.equal(interpreted.match.order, 2);
  assert.equal(interpreted.log.filter(event => event.type === 'COMPARE').length, 1);
  assert.deepEqual(interpreted.materials, { photo: true, current: true, xray: false });
});

test('every report combination has the same semantic result in either execution order', () => {
  for (const matchOutcome of ['match', 'uncertain', 'different']) {
    for (const comparisonOutcome of ['difference', 'same', 'incomparable']) {
      const comparisonFirst = verify(compare(initial('compare'), comparisonOutcome), matchOutcome);
      const verificationFirst = compare(verify(initial('compare'), matchOutcome), comparisonOutcome);
      const expected = matchOutcome === 'match' && comparisonOutcome === 'difference';
      assert.equal(derive(comparisonFirst).temporalChange, expected, `${matchOutcome}/${comparisonOutcome}`);
      assert.deepEqual(derive(comparisonFirst), derive(verificationFirst));
      assert.equal(derive(comparisonFirst).historicalRepair, false);
      assert.deepEqual(comparisonFirst.log.map(event => event.type), ['COMPARE', 'VERIFY']);
      assert.deepEqual(verificationFirst.log.map(event => event.type), ['VERIFY', 'COMPARE']);
    }
  }
});

test('photo example cannot execute cross-time comparison', () => {
  const state = photoReady();
  assert.equal(derive(state).canCompare, false);
  assert.equal(compare(state), state);
  assert.equal(derive(verify(state)).temporalChange, false);
});

test('duplicate investigations and reports neither add events nor overwrite an outcome', () => {
  const ready = photoReady();
  assert.equal(take(ready, 'TAKE_PHOTO'), ready);
  assert.equal(take(ready, 'TAKE_CURRENT'), ready);
  const uncertain = verify(ready, 'uncertain');
  assert.equal(verify(uncertain, 'match'), uncertain);
  const incomparable = compare(initial('compare'), 'incomparable');
  assert.equal(compare(incomparable, 'difference'), incomparable);
  const xray = take(initial(), 'TAKE_XRAY');
  assert.equal(take(xray, 'TAKE_XRAY'), xray);
  assert.equal(xray.log.length, 1);
});

test('invalid outcomes and unknown actions are ignored without mutating state', () => {
  const state = freezeDeep(initial('compare'));
  const before = JSON.stringify(state);
  for (const action of [
    null, undefined, {}, { type: 'UNKNOWN' }, { type: 'toString' },
    { type: 'VERIFY' }, { type: 'VERIFY', outcome: 'difference' },
    { type: 'COMPARE' }, { type: 'COMPARE', outcome: 'match' },
  ]) {
    assert.equal(reduce(state, action), state);
    assert.equal(JSON.stringify(state), before);
  }
});

test('valid updates do not mutate their input or prior source acquisition events', () => {
  const old = freezeDeep(take(initial(), 'TAKE_PHOTO'));
  const sourceEvent = old.log[0];
  const next = take(old, 'TAKE_CURRENT');
  const matched = verify(freezeDeep(next));
  assert.equal(old.materials.current, false);
  assert.equal(old.log.length, 1);
  assert.equal(matched.log[0], sourceEvent);
  assert.equal(matched.log[0].order, 1);
  assert.equal(next.match, null);
  assert.equal(matched.match.order, 3);
});

test('reset clears results and event history while retaining the selected example', () => {
  for (const mode of ['photo', 'compare']) {
    let state = mode === 'photo' ? verify(photoReady()) : verify(compare(initial(mode)));
    state = take(state, 'TAKE_XRAY');
    const cleared = take(freezeDeep(state), 'RESET');
    assert.deepEqual(cleared, initial(mode));
    assert.notEqual(cleared, state);
    assert.ok(state.log.length > 0);
    assert.notEqual(state.match, null);
  }
});
