// Audio manager — Web Audio API synthesized sound effects.
// No external sound files needed.

export function createAudioManager() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  // --- Sound generators ---

  function playTone(freq, duration, type = "sine", volume = 0.3, decay = true) {
    if (muted) return;
    const ac = ensureContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    if (decay) {
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }

  function playNoise(duration, volume = 0.15, filterFreq = 3000) {
    if (muted) return;
    const ac = ensureContext();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = ac.createGain();
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    source.start(ac.currentTime);
  }

  // --- Named sounds ---

  const sounds = {
    cardFlip(opts = {}) {
      playNoise(0.06, 0.2, 5000);
      playTone(800, 0.04, "sine", 0.08);
    },
    cardPlace(opts = {}) {
      playNoise(0.08, 0.1, 1500);
    },
    weaponEquip(opts = {}) {
      playTone(600, 0.08, "triangle", 0.2);
      playTone(900, 0.15, "sine", 0.15);
      playNoise(0.05, 0.08, 8000);
    },
    weaponHone(opts = {}) {
      // Metallic sharpening: rising scrape + ring
      playNoise(0.1, 0.15, 6000);
      playTone(500, 0.08, "triangle", 0.12);
      playTone(800, 0.12, "sine", 0.1);
      playTone(1100, 0.15, "triangle", 0.08);
    },
    combatHit(opts = {}) {
      const vol = opts.volume ?? 0.3;
      playNoise(0.12, vol * 0.5, 2000);
      playTone(120, 0.15, "sawtooth", vol * 0.3);
      playTone(80, 0.2, "sine", vol * 0.2);
    },
    potionDrink(opts = {}) {
      // Bubbly: rapid frequency modulation
      if (muted) return;
      const ac = ensureContext();
      const osc = ac.createOscillator();
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = 400;
      lfo.type = "sine";
      lfo.frequency.value = 12;
      lfoGain.gain.value = 100;
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime);
      lfo.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.3);
      lfo.stop(ac.currentTime + 0.3);
    },
    potionWaste(opts = {}) {
      playTone(250, 0.2, "sine", 0.12);
      playTone(180, 0.3, "sine", 0.1);
    },
    roomAvoid(opts = {}) {
      // Whoosh: noise with frequency sweep
      if (muted) return;
      const ac = ensureContext();
      const bufferSize = ac.sampleRate * 0.3;
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ac.createBufferSource();
      source.buffer = buffer;
      const filter = ac.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 500;
      filter.frequency.linearRampToValueAtTime(3000, ac.currentTime + 0.15);
      filter.frequency.linearRampToValueAtTime(300, ac.currentTime + 0.3);
      filter.Q.value = 2;
      const gain = ac.createGain();
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      source.start(ac.currentTime);
    },
    gameWin(opts = {}) {
      playTone(523, 0.3, "sine", 0.15);      // C5
      playTone(659, 0.3, "sine", 0.12);      // E5
      playTone(784, 0.4, "sine", 0.15);      // G5
      setTimeout(() => playTone(1047, 0.5, "sine", 0.12), 150); // C6
    },
    gameLoss(opts = {}) {
      playTone(300, 0.4, "sine", 0.15);
      playTone(250, 0.5, "sine", 0.12);
      setTimeout(() => playTone(200, 0.6, "sine", 0.1), 200);
    },
    buttonClick(opts = {}) {
      playTone(600, 0.04, "sine", 0.08);
      playNoise(0.03, 0.05, 4000);
    },
  };

  function play(name, opts = {}) {
    if (muted) return;
    const fn = sounds[name];
    if (fn) fn(opts);
  }

  function setMuted(value) {
    muted = value;
  }

  function isMuted() {
    return muted;
  }

  return { play, setMuted, isMuted };
}
