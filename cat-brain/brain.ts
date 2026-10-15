import {createSourceTable, input, inputBit} from './vendor/handwired/cells.ts';
import {emitCompare, emitFirstActive, emitMultiply} from './vendor/handwired/numeric-ui-core.ts';

export const ROLL_STEPS = 65536;
export const MOODS = ['scratch', 'browse', 'guard', 'chase', 'yarn', 'knead', 'regal', 'swat', 'stretch', 'roll', 'pounce', 'sit', 'loaf', 'groom', 'wander'] as const;
export const TARGETS = ['none', 'stand', 'friend', 'yarn', 'post'] as const;

// Compile once. A decision is a fixed arithmetic circuit, evaluated only when
// a cat needs a new mood, rather than once per rendered frame.
function buildBrain() {
  const table = createSourceTable();
  const cells = table.declare({
    roll: input([0, ROLL_STEPS - 1], {grid: 1}),
    stand: inputBit(),
    friend: inputBit(),
    yarn: inputBit(),
    post: inputBit(),
    walkSpeed: input([0, 10]),
  });
  const circuit = table.createCircuit();
  const one = circuit.constant(1);
  const roll = circuit.affine([[cells.roll, 1 / ROLL_STEPS]]);
  const below = (threshold: number) => emitCompare(circuit, cells.roll, '<', circuit.constant(Math.ceil(threshold * ROLL_STEPS)));
  const when = (threshold: number, available = one) => emitMultiply(circuit, below(threshold), available);

  // The order preserves the cats' existing priorities, including falling
  // through to resting behaviors when a toy or playmate isn't available.
  const choices = [
    {active: when(.06, cells.stand), mood: 'scratch', target: 'stand', duration: 5.4, variation: 3, speed: 1.35},
    {active: when(.12, cells.stand), mood: 'browse', target: 'stand', duration: 5.4, variation: 3, speed: 1.15},
    {active: when(.18, cells.stand), mood: 'guard', target: 'stand', duration: 5.4, variation: 3, speed: 1.15},
    {active: when(.26, cells.friend), mood: 'chase', target: 'friend', duration: 3.4, variation: 2, speed: 2.15},
    {active: when(.34, cells.yarn), mood: 'yarn', target: 'yarn', duration: 4, variation: 2, speed: 1.7},
    {active: when(.42, cells.post), mood: 'scratch', target: 'post', duration: 3.2, variation: 1, speed: 1.25},
    {active: below(.4), mood: 'knead', target: 'none', duration: 3.4, variation: 2, speed: 0},
    {active: below(.5), mood: 'regal', target: 'none', duration: 3.8, variation: 2, speed: 0},
    {active: below(.58), mood: 'swat', target: 'none', duration: 2.4, variation: 1, speed: 0},
    {active: below(.66), mood: 'stretch', target: 'none', duration: 2.2, variation: 1, speed: 0},
    {active: below(.73), mood: 'roll', target: 'none', duration: 2.6, variation: 1, speed: 0},
    {active: below(.8), mood: 'pounce', target: 'none', duration: 2.1, variation: 1, speed: .4},
    {active: below(.86), mood: 'sit', target: 'none', duration: 2.6, variation: 2, speed: 0},
    {active: below(.91), mood: 'loaf', target: 'none', duration: 2.8, variation: 1, speed: 0},
    {active: below(.96), mood: 'groom', target: 'none', duration: 2.2, variation: 1, speed: 0},
    {active: one, mood: 'wander', target: 'none', duration: 2.4, variation: 2.2, speed: 0},
  ] as const;
  const selected = emitFirstActive(circuit, one, choices.map(choice => choice.active));
  const weighted = (values: readonly number[]) => circuit.affine(selected.map((wire, i) => [wire, values[i]!] as const));
  const mood = weighted(choices.map(choice => MOODS.indexOf(choice.mood)));
  const target = weighted(choices.map(choice => TARGETS.indexOf(choice.target)));
  const duration = circuit.affine([
    [weighted(choices.map(choice => choice.duration)), 1],
    [emitMultiply(circuit, roll, weighted(choices.map(choice => choice.variation))), 1],
  ]);
  const speed = circuit.affine([
    [weighted(choices.map(choice => choice.speed)), 1],
    [emitMultiply(circuit, selected[selected.length - 1]!, cells.walkSpeed), 1],
  ]);
  const swatLeg = emitCompare(circuit, cells.roll, '>=', circuit.constant(Math.floor(.54 * ROLL_STEPS) + 1));
  const roots = [mood, target, duration, speed, swatLeg];
  return {cells, roots, selected, ...table.finish()};
}

export const builtBrain = buildBrain();
export const brainInfo = Object.freeze({
  engine: 'Handwired',
  revision: '4ea7fcb27ebe93acf49b9f29a93e162b975bad46',
  operations: builtBrain.circuit.operations.length,
  inputs: builtBrain.initialSource.length,
});

export type CatInputs = {roll: number; stand: boolean; friend: boolean; yarn: boolean; post: boolean; walkSpeed: number};

export function createCatBrain() {
  const {cells, circuit, roots} = builtBrain;
  const source = new Float32Array(builtBrain.initialSource);
  const evaluate = circuit.createTensorEvaluator(roots);
  return (inputs: CatInputs) => {
    // A finite integer grid makes each threshold an exact FP32 decision.
    // The host supplies sensory facts; it does not choose a behavior.
    source[cells.roll] = Math.min(ROLL_STEPS - 1, Math.max(0, Math.floor(inputs.roll * ROLL_STEPS)));
    source[cells.stand] = Number(inputs.stand);
    source[cells.friend] = Number(inputs.friend);
    source[cells.yarn] = Number(inputs.yarn);
    source[cells.post] = Number(inputs.post);
    source[cells.walkSpeed] = inputs.walkSpeed;
    const [mood, target, moodT, speed, swatLeg] = evaluate(source);
    return {mood: MOODS[mood!], target: TARGETS[target!], moodT: moodT!, speed: speed!, swatLeg: swatLeg!};
  };
}
