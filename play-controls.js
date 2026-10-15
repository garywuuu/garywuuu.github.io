// Pointer lock remains the default. Embedded browsers can reject it, so a
// held mouse button also supports looking around without locking the cursor.
export function createMouseLookControls({canvas, intro, isBlocked, onMove, onActivate, onLockChange, onModeChange}) {
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  let pending = false;
  let refused = false;
  let dragging = false;
  let dragged = false;
  let lastX = 0;
  let lastY = 0;
  let distance = 0;

  const locked = () => doc.pointerLockElement === canvas;
  function updateMode() {
    const mode = locked() ? 'locked' : refused ? 'drag' : 'click';
    canvas.dataset.lookMode = mode;
    canvas.style.cursor = locked() ? 'none' : dragging ? 'grabbing' : refused ? 'grab' : '';
    onModeChange(mode);
  }
  function failed() {
    pending = false;
    refused = true;
    updateMode();
  }
  function requestLock() {
    if (isBlocked() || locked() || pending) return;
    if (typeof canvas.requestPointerLock !== 'function') {
      failed();
      return;
    }
    pending = true;
    try {
      // Call synchronously inside the input handler to retain user activation.
      const request = canvas.requestPointerLock();
      request?.catch(failed);
    } catch {
      failed();
    }
  }
  function start(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || isBlocked()) return;
    onActivate();
    dragged = false;
    distance = 0;
    dragging = !locked();
    lastX = event.clientX;
    lastY = event.clientY;
    requestLock();
    updateMode();
  }
  function stop() {
    dragging = false;
    updateMode();
  }
  function move(event) {
    if (isBlocked()) {
      stop();
      return;
    }
    if (locked()) {
      onMove(event.movementX || 0, event.movementY || 0);
    } else if (dragging) {
      if (!(event.buttons & 1)) {
        stop();
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      distance += Math.hypot(dx, dy);
      dragged ||= distance > 4;
      onMove(dx, dy);
    }
  }
  function lockChanged() {
    pending = false;
    dragging = false;
    if (locked()) refused = false;
    onLockChange(locked());
    updateMode();
  }

  canvas.addEventListener('pointerdown', start);
  intro?.addEventListener('pointerdown', start);
  doc.addEventListener('mousemove', move);
  doc.addEventListener('pointerup', stop);
  doc.addEventListener('pointercancel', stop);
  doc.addEventListener('pointerlockchange', lockChanged);
  doc.addEventListener('pointerlockerror', failed);
  win.addEventListener('blur', stop);
  updateMode();

  return {
    requestLock,
    stop,
    consumeDragClick() {
      const result = dragged;
      dragged = false;
      return result;
    },
  };
}
