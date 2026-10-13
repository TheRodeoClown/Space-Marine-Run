/*
 * input.js: Pointer lock, mouse and keyboard handlers.
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

document.addEventListener('pointerlockchange', () => locked = document.pointerLockElement === cv);
document.addEventListener('mousemove', e => {
  if (state !== 'play' || !(locked || down))
    return;
  const k = .0025 * cam.fov / 75;
  yaw -= e.movementX * k;
  pitch = clamp(pitch - e.movementY * k, -1.4, 1.4);
});
cv.addEventListener('mousedown', e => {
  if (e.button === 2) {
    zoomOn = true;
    return;
  }
  down = true;
  if (state === 'play' && !locked)
    lock();
});
addEventListener('mouseup', e => {
  if (e.button === 2)
    zoomOn = false;
  else
    down = false;
});
cv.addEventListener('contextmenu', e => e.preventDefault());
wrap.addEventListener('wheel', e => {
  if (state === 'play') {
    e.preventDefault();
    const n = performance.now();
    if (n - lw > 220) {
      lw = n;
      swapTo(P.cur ? 0 : 1);
    }
  }
}, { passive: false });
addEventListener('keydown', e => {
  if (e.repeat)
    return;
  keys[e.code] = true;
  if (e.code === 'KeyM')
    audio.toggle();
  if (e.code === 'KeyN')
    audio.toggleMusic();
  if (state === 'play') {
    if (e.code === 'Digit1')
      swapTo(0);
    if (e.code === 'Digit2')
      swapTo(1);
    if (e.code === 'KeyQ')
      throwNade();
    if (e.code === 'KeyR')
      startReload();
    if (e.code === 'Space') {
      melee();
      e.preventDefault();
    }
  }
  else if (state === 'pick' && /^Digit[1-3]$/.test(e.code)) {
    const q = +e.code.slice(5) - 1;
    if (pw) {
      if (q < 2)
        dropW(q);
    }
    else
      pick(q);
  }
});
addEventListener('keyup', e => keys[e.code] = false);
