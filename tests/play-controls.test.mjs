import assert from 'node:assert/strict';
import test from 'node:test';
import {createMouseLookControls} from '../play-controls.js';

function setup(request) {
  const doc = new EventTarget();
  doc.defaultView = new EventTarget();
  doc.pointerLockElement = null;
  const canvas = new EventTarget();
  Object.assign(canvas, {ownerDocument: doc, dataset: {}, style: {}});
  const intro = new EventTarget();
  const moves = [];
  const locks = [];
  let requests = 0;
  let blocked = false;
  let activated = 0;
  canvas.requestPointerLock = () => {
    requests++;
    return request?.(doc, canvas);
  };
  const controls = createMouseLookControls({
    canvas, intro,
    isBlocked: () => blocked,
    onMove: (x, y) => moves.push([x, y]),
    onLockChange: value => locks.push(value),
    onModeChange: () => {},
    onActivate: () => activated++,
  });
  return {doc, canvas, intro, moves, locks, controls,
    get requests() { return requests; },
    get activated() { return activated; },
    block() { blocked = true; },
  };
}
function dispatch(target, type, values = {}) {
  target.dispatchEvent(Object.assign(new Event(type), {
    pointerType: 'mouse', button: 0, buttons: 1, clientX: 10, clientY: 20, ...values,
  }));
}

test('mouse-down requests lock immediately; locked mouse motion looks around', () => {
  const h = setup((doc, canvas) => {
    doc.pointerLockElement = canvas;
    dispatch(doc, 'pointerlockchange');
    return Promise.resolve();
  });
  dispatch(h.canvas, 'pointerdown');
  assert.equal(h.requests, 1);
  assert.equal(h.canvas.dataset.lookMode, 'locked');
  assert.equal(h.canvas.style.cursor, 'none');
  dispatch(h.doc, 'mousemove', {movementX: 12, movementY: -3, buttons: 0});
  assert.deepEqual(h.moves, [[12, -3]]);
  h.controls.requestLock();
  assert.equal(h.requests, 1);
  h.doc.pointerLockElement = null;
  dispatch(h.doc, 'pointerlockchange');
  assert.equal(h.canvas.dataset.lookMode, 'click');
  assert.deepEqual(h.locks, [true, false]);
});

test('promise rejection is handled and a held mouse button still looks around', async () => {
  const h = setup(() => Promise.reject(new Error('Embedded browser refused pointer lock')));
  dispatch(h.canvas, 'pointerdown');
  await Promise.resolve();
  assert.equal(h.canvas.dataset.lookMode, 'drag');
  dispatch(h.doc, 'mousemove', {clientX: 40, clientY: 35});
  assert.deepEqual(h.moves, [[30, 15]]);
  dispatch(h.doc, 'pointerup');
  dispatch(h.doc, 'mousemove', {clientX: 80, clientY: 50, buttons: 0});
  assert.equal(h.moves.length, 1);
  assert.equal(h.canvas.style.cursor, 'grab');
  assert.equal(h.controls.consumeDragClick(), true);
  assert.equal(h.controls.consumeDragClick(), false);
  dispatch(h.canvas, 'pointerdown');
  await Promise.resolve();
  assert.equal(h.requests, 2);
});

test('legacy error events, missing API, and synchronous failures allow drag look', () => {
  for (const failure of ['event', 'missing', 'throw']) {
    const h = setup(() => { if (failure === 'throw') throw new Error('Denied'); });
    if (failure === 'missing') delete h.canvas.requestPointerLock;
    dispatch(h.canvas, 'pointerdown');
    if (failure === 'event') dispatch(h.doc, 'pointerlockerror');
    assert.equal(h.canvas.dataset.lookMode, 'drag');
    dispatch(h.doc, 'mousemove', {clientX: 50, clientY: 20});
    assert.deepEqual(h.moves, [[40, 0]]);
  }
});

test('the welcome overlay starts capture; pending requests are not duplicated', () => {
  const h = setup();
  dispatch(h.intro, 'pointerdown');
  assert.equal(h.activated, 1);
  assert.equal(h.requests, 1);
  h.controls.requestLock();
  assert.equal(h.requests, 1);
});

test('hover, touch, secondary buttons, and arcade overlays do not trigger mouse look', () => {
  const h = setup();
  dispatch(h.doc, 'mousemove', {movementX: 40, movementY: 20});
  dispatch(h.canvas, 'pointerdown', {pointerType: 'touch'});
  dispatch(h.canvas, 'pointerdown', {button: 2});
  assert.equal(h.requests, 0);
  assert.deepEqual(h.moves, []);
  h.block();
  dispatch(h.canvas, 'pointerdown');
  h.controls.requestLock();
  assert.equal(h.requests, 0);
});

test('releasing outside the canvas, losing focus, or cancelling ends drag look', () => {
  for (const stop of ['blur', 'pointercancel', 'buttons']) {
    const h = setup();
    dispatch(h.canvas, 'pointerdown');
    if (stop === 'blur') dispatch(h.doc.defaultView, 'blur');
    if (stop === 'pointercancel') dispatch(h.doc, 'pointercancel');
    dispatch(h.doc, 'mousemove', {clientX: 50, clientY: 20, buttons: stop === 'buttons' ? 0 : 1});
    assert.deepEqual(h.moves, []);
  }
});

test('an ordinary click remains available to pet a cat', () => {
  const h = setup();
  dispatch(h.canvas, 'pointerdown');
  dispatch(h.doc, 'mousemove', {clientX: 11, clientY: 20});
  dispatch(h.doc, 'pointerup');
  assert.equal(h.controls.consumeDragClick(), false);
});
