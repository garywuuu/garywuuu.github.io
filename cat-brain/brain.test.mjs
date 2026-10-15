import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {performance} from 'node:perf_hooks';
import {createCatBrain, builtBrain, brainInfo, ROLL_STEPS} from '../assets/js/cat-brain.js';

const decide = createCatBrain();
const oldSource = readFileSync(new URL('./fixtures/previous-cat-mood.txt', import.meta.url), 'utf8');
const playSource = readFileSync(new URL('../play.js', import.meta.url), 'utf8');
const newSource = playSource.slice(playSource.indexOf('function pickCatMood('), playSource.indexOf('\nfunction sendToPerch('));

// Exercise both the actual host integration and the saved, pre-Handwired policy.
function hostHarness(source) {
  let roll = 0;
  let stands = [];
  let result;
  const pick = new Function('hash', 'catStands', 'nearestOther', 'setCatMood', 'decideCatMood',
    `${source}\nreturn pickCatMood;`)(
    () => roll,
    () => stands,
    (cat, cats) => cats.find(other => other !== cat) ?? null,
    (cat, mood, extra) => { result = {mood, speed: 0, ...extra}; },
    decide,
  );
  const cat = {position: {x: 0, z: 0}, userData: {timer: 0, walkSpeed: .95}};
  const friend = {id: 'friend'};
  const stand = {id: 'stand'};
  const yarn = {id: 'yarn', userData: {kind: 'yarn'}};
  const post = {id: 'post', userData: {kind: 'post'}};
  return (value, available, walkSpeed = .95) => {
    roll = value;
    stands = available.stand ? [stand] : [];
    cat.userData.walkSpeed = walkSpeed;
    pick(cat, available.friend ? [cat, friend] : [cat], [available.yarn && yarn, available.post && post].filter(Boolean));
    return {
      mood: result.mood,
      moodT: result.moodT,
      speed: result.speed,
      target: result.target?.id ?? null,
      friend: result.playWith?.id ?? null,
      swatLeg: result.mood === 'swat' ? result.swatLeg : null,
    };
  };
}
const previous = hostHarness(oldSource);
const current = hostHarness(newSource);
const availability = Array.from({length: 16}, (_, mask) => ({
  stand: Boolean(mask & 1), friend: Boolean(mask & 2), yarn: Boolean(mask & 4), post: Boolean(mask & 8),
}));

test('behavior and scene targets match the previous policy across every availability combination', () => {
  const ticks = new Set([0, ROLL_STEPS - 1]);
  for (let tick = 0; tick < ROLL_STEPS; tick += 37) ticks.add(tick);
  for (const threshold of [.06, .12, .18, .26, .34, .4, .42, .5, .54, .58, .66, .73, .8, .86, .91, .96]) {
    for (let offset = -2; offset <= 2; offset++) ticks.add(Math.floor(threshold * ROLL_STEPS) + offset);
  }
  for (const flags of availability) {
    for (const tick of ticks) {
      const roll = tick / ROLL_STEPS;
      const expected = previous(roll, flags);
      const actual = current(roll, flags);
      assert.ok(Math.abs(actual.moodT - expected.moodT) < .000002, `duration at ${roll}`);
      assert.ok(Math.abs(actual.speed - expected.speed) < .000001, `speed at ${roll}`);
      assert.deepEqual({...actual, moodT: 0, speed: 0}, {...expected, moodT: 0, speed: 0}, `roll=${roll}, flags=${JSON.stringify(flags)}`);
    }
  }
});

test('network chooses exactly one action, including missing-resource fallbacks', () => {
  const {circuit, cells, selected} = builtBrain;
  const evaluate = circuit.createTensorEvaluator(selected);
  const source = new Float32Array(builtBrain.initialSource);
  for (const flags of availability) {
    for (const field of ['stand', 'friend', 'yarn', 'post']) source[cells[field]] = Number(flags[field]);
    for (let tick = 0; tick < ROLL_STEPS; tick += 19) {
      source[cells.roll] = tick;
      const gates = evaluate(source);
      assert.equal(gates.reduce((sum, bit) => sum + bit, 0), 1);
      assert.ok(gates.every(bit => bit === 0 || bit === 1));
    }
  }
});

test('input limits and separate brain instances are safe', () => {
  const flags = {stand: true, friend: true, yarn: true, post: true};
  const another = createCatBrain();
  assert.equal(decide({roll: -1, ...flags, walkSpeed: 0}).mood, 'scratch');
  const resting = decide({roll: .85, ...flags, walkSpeed: .95});
  assert.equal(another({roll: 1, ...flags, walkSpeed: 2}).speed, 2);
  assert.equal(resting.mood, 'sit');
  assert.throws(() => decide({roll: NaN, ...flags, walkSpeed: .95}));
  assert.throws(() => decide({roll: .5, ...flags, walkSpeed: Infinity}));
});

test('petting still overrides the autonomous mood immediately', () => {
  const start = playSource.indexOf('  function petCat(');
  const source = playSource.slice(start, playSource.indexOf('\n  function tryPet(', start));
  let result;
  let faced = false;
  const pet = new Function('setCatMood', 'faceToward', 'player', 'promptEl', `${source}\nreturn petCat;`)(
    (cat, mood, extra) => { result = {mood, ...extra}; },
    () => { faced = true; }, {x: 0, z: 0}, null,
  );
  const cat = {userData: {sky: false, mood: 'chase'}};
  assert.equal(pet(cat), true);
  assert.equal(result.mood, 'pet');
  assert.equal(result.moodT, 6.4);
  assert.equal(faced, true);
  cat.userData.mood = 'pet';
  pet(cat);
  assert.ok(result.moodT > 6.4);
  assert.equal(pet({userData: {sky: true}}), false);
});

test('report decision cost without imposing a machine-dependent timing assertion', () => {
  const inputs = {roll: .3, stand: true, friend: true, yarn: true, post: true, walkSpeed: .95};
  const start = performance.now();
  for (let i = 0; i < 10000; i++) decide(inputs);
  console.log(`${brainInfo.operations} circuit operations; ${((performance.now() - start) * 1000 / 10000).toFixed(1)} µs per decision`);
});
