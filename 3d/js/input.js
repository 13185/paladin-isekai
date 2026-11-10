export function createInput(canvas) {
  const keys = Object.create(null);
  let lookX = 0, lookY = 0;
  const joy = { x: 0, y: 0 };
  const pressed = Object.create(null);
  let pointerLocked = false;
  let enabled = true;

  const onKey = (e, down) => {
    keys[e.code] = down;
    if (down && ["Space", "Tab"].includes(e.code)) e.preventDefault();
  };
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));

  canvas.addEventListener("click", () => {
    if (!enabled) return;
    if (!pointerLocked && canvas.requestPointerLock) canvas.requestPointerLock();
  });
  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener("mousemove", (e) => {
    if (!enabled) return;
    if (pointerLocked || e.buttons === 2) {
      lookX += e.movementX;
      lookY += e.movementY;
    }
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mousedown", (e) => {
    if (!enabled) return;
    if (e.button === 0) pressed.attack = true;
  });

  // mobile joystick
  const joyEl = document.getElementById("joy");
  const knob = document.getElementById("joy-knob");
  const lookPad = document.getElementById("look-pad");
  let joyTouch = null, lookTouch = null, lastLook = null;

  function bindStick(el) {
    if (!el) return;
    el.addEventListener("touchstart", (e) => {
      joyTouch = e.changedTouches[0].identifier;
      moveStick(e.changedTouches[0]);
      e.preventDefault();
    }, { passive: false });
    el.addEventListener("touchmove", (e) => {
      for (const t of e.changedTouches) if (t.identifier === joyTouch) moveStick(t);
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) if (t.identifier === joyTouch) {
        joyTouch = null; joy.x = 0; joy.y = 0;
        if (knob) knob.style.transform = "translate(0,0)";
      }
    };
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
  }
  function moveStick(t) {
    const r = joyEl.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const max = r.width * 0.38;
    const mag = Math.hypot(dx, dy) || 1;
    if (mag > max) { dx = dx / mag * max; dy = dy / mag * max; }
    joy.x = dx / max;
    joy.y = dy / max;
    if (knob) knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  bindStick(joyEl);

  if (lookPad) {
    lookPad.addEventListener("touchstart", (e) => {
      lookTouch = e.changedTouches[0].identifier;
      lastLook = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      e.preventDefault();
    }, { passive: false });
    lookPad.addEventListener("touchmove", (e) => {
      for (const t of e.changedTouches) if (t.identifier === lookTouch && lastLook) {
        lookX += t.clientX - lastLook.x;
        lookY += t.clientY - lastLook.y;
        lastLook = { x: t.clientX, y: t.clientY };
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) if (t.identifier === lookTouch) {
        lookTouch = null; lastLook = null;
      }
    };
    lookPad.addEventListener("touchend", end);
    lookPad.addEventListener("touchcancel", end);
  }

  const bindBtn = (id, action) => {
    const el = document.getElementById(id);
    if (!el) return;
    const down = (e) => { pressed[action] = true; e.preventDefault(); };
    el.addEventListener("touchstart", down, { passive: false });
    el.addEventListener("mousedown", down);
  };
  bindBtn("m-atk", "attack");
  bindBtn("m-jump", "jump");
  bindBtn("m-roll", "roll");
  bindBtn("m-interact", "interact");

  document.querySelectorAll("#skill-bar .sk").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pressed[btn.dataset.skill] = true;
    });
  });

  return {
    keys, joy,
    get pointerLocked() { return pointerLocked; },
    setEnabled(v) {
      enabled = v;
      if (!v && document.exitPointerLock && pointerLocked) document.exitPointerLock();
    },
    consumeLook() {
      const o = { x: lookX, y: lookY };
      lookX = lookY = 0;
      return o;
    },
    consume(name) {
      if (pressed[name]) { pressed[name] = false; return true; }
      return false;
    },
    pulse(name) { pressed[name] = true; },
    movingVector(cameraYaw) {
      let x = 0, z = 0;
      if (keys.KeyW || keys.ArrowUp) z -= 1;
      if (keys.KeyS || keys.ArrowDown) z += 1;
      if (keys.KeyA || keys.ArrowLeft) x -= 1;
      if (keys.KeyD || keys.ArrowRight) x += 1;
      x += joy.x;
      z += joy.y;
      const len = Math.hypot(x, z);
      if (len < 0.12) return { x: 0, z: 0, mag: 0 };
      const nx = x / len, nz = z / len;
      const c = Math.cos(cameraYaw), s = Math.sin(cameraYaw);
      return {
        x: nx * c + nz * s,
        z: -nx * s + nz * c,
        mag: Math.min(1, len),
      };
    },
  };
}

export function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}
