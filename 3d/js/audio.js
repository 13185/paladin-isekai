// Procedural SFX + ambient bed via Web Audio. No third-party samples required.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let master, ambientGain, sfxGain;
  let started = false;
  let stepCooldown = 0;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.85;
    master.connect(ctx.destination);
    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.22;
    ambientGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.7;
    sfxGain.connect(master);
  }

  function resume() {
    ensure();
    if (ctx.state === "suspended") ctx.resume();
    if (!started) {
      started = true;
      startAmbient();
    }
  }

  function env(gain, t, a, h, d, peak = 1) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + a);
    gain.gain.setValueAtTime(peak, t + a + h);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + a + h + d);
  }

  function tone(freq, dur, type = "sine", peak = 0.2) {
    if (muted || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(g);
    g.connect(sfxGain);
    env(g, t, 0.02, 0.04, dur, peak);
    o.start(t);
    o.stop(t + dur + 0.08);
  }

  function noiseBurst(dur, peak = 0.15, hp = 800) {
    if (muted || !ctx) return;
    const t = ctx.currentTime;
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = ctx.createGain();
    n.connect(f); f.connect(g); g.connect(sfxGain);
    env(g, t, 0.005, 0.01, dur * 0.9, peak);
    n.start(t);
    n.stop(t + dur);
  }

  function startAmbient() {
    if (!ctx) return;
    // warm drone
    const freqs = [98, 147, 196, 294];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      g.gain.value = 0.04 + i * 0.01;
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.03;
      lg.gain.value = 0.012;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(ambientGain);
      o.start(); lfo.start();
    });
    // soft wind noise
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    n.buffer = buf; n.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 500;
    const g = ctx.createGain(); g.gain.value = 0.035;
    n.connect(f); f.connect(g); g.connect(ambientGain);
    n.start();
  }

  const api = {
    resume,
    get muted() { return muted; },
    setMuted(v) {
      muted = v;
      if (master) master.gain.value = v ? 0 : 0.85;
    },
    toggle() {
      api.setMuted(!muted);
      return muted;
    },
    step(dt, moving, sprint) {
      if (!moving || muted || !ctx) return;
      stepCooldown -= dt;
      if (stepCooldown > 0) return;
      stepCooldown = sprint ? 0.28 : 0.38;
      noiseBurst(0.08, 0.07, 300);
      tone(sprint ? 90 : 70, 0.06, "sine", 0.05);
    },
    slash() { noiseBurst(0.12, 0.12, 1200); tone(740, 0.12, "triangle", 0.12); tone(1480, 0.08, "sine", 0.06); },
    heal() { tone(523, 0.25, "sine", 0.12); tone(659, 0.3, "sine", 0.1); tone(784, 0.35, "triangle", 0.08); },
    hammer() { tone(180, 0.2, "square", 0.1); tone(520, 0.16, "triangle", 0.12); noiseBurst(0.16, 0.14, 400); },
    judge() { tone(392, 0.4, "sawtooth", 0.08); tone(784, 0.45, "sine", 0.12); tone(1176, 0.3, "triangle", 0.08); },
    hit() { noiseBurst(0.1, 0.16, 600); tone(160, 0.1, "square", 0.08); },
    hurt() { tone(140, 0.2, "sawtooth", 0.1); noiseBurst(0.12, 0.12, 200); },
    ui() { tone(660, 0.08, "sine", 0.08); },
    level() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.28, "sine", 0.12), i * 90)); },
    death() { tone(196, 0.6, "sine", 0.12); tone(147, 0.8, "triangle", 0.1); },
    roll() { noiseBurst(0.14, 0.1, 900); },
    jump() { tone(400, 0.1, "sine", 0.07); },
  };
  return api;
}
