class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;
  private thrusterGain: GainNode | null = null;
  private thrusterOsc: AudioNode | null = null;
  private thrusterSubOsc: OscillatorNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  }

  public playSuccess() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  public playAlarm() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    [0, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = ctx.currentTime + offset;
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(660, t + 0.09);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  public playTool(kind: 'wrench' | 'weld' | 'o2' | 'med' | 'rover') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    if (kind === 'wrench') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.setValueAtTime(340, t + 0.06);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    } else if (kind === 'weld') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1240, t);
      osc.frequency.linearRampToValueAtTime(410, t + 0.2);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    } else if (kind === 'o2') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    } else if (kind === 'med') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, t);
      osc.frequency.setValueAtTime(880, t + 0.09);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(150, t + 0.15);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  public setRocketThruster(level: number) {
    const ctx = this.ensureContext();
    if (!ctx || !this.enabled) {
      this.stopRocketThruster();
      return;
    }
    if (level <= 0.01) {
      if (this.thrusterGain) {
        this.thrusterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
      }
      return;
    }

    if (!this.thrusterGain) {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        // Brown/pink crackle noise for deep realistic RS-25/SRB rocket roar
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.08 * white) / 1.08;
        data[i] = (lastOut * 2.5 + white * 0.35);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 680;
      filter.Q.value = 1.4;

      const subOsc = ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.value = 54;
      const subGain = ctx.createGain();
      subGain.gain.value = 0.25;

      const gain = ctx.createGain();
      gain.gain.value = 0.0001;

      noise.connect(filter);
      subOsc.connect(subGain);
      subGain.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      subOsc.start();

      this.thrusterOsc = noise;
      this.thrusterSubOsc = subOsc;
      this.thrusterFilter = filter;
      this.thrusterGain = gain;
    }

    const clamped = Math.min(1, Math.max(0, level));
    if (this.thrusterFilter) {
      this.thrusterFilter.frequency.setTargetAtTime(220 + clamped * 920, ctx.currentTime, 0.08);
    }
    this.thrusterGain.gain.setTargetAtTime(0.06 + clamped * 0.26, ctx.currentTime, 0.06);
  }

  public playCalmChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [392.0, 493.88, 587.33]; // G4 - B4 - D5 gentle chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + idx * 0.14;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.055, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  }

  public playWellnessMusic() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    // Calm ambient space chord progression (Fmaj7 -> Cmaj9) using soft sine & triangle pads
    const chords = [
      { time: 0, freqs: [174.61, 220.0, 261.63, 329.63] },
      { time: 1.9, freqs: [130.81, 196.0, 246.94, 293.66] },
    ];
    chords.forEach((chord) => {
      chord.freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t0 = ctx.currentTime + chord.time;
        osc.frequency.setValueAtTime(f, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.032, t0 + 0.45);
        gain.gain.exponentialRampToValueAtTime(0.0004, t0 + 2.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 2.15);
      });
    });
  }

  public playButtonClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [980, 520].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t0 = t + idx * 0.025;
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t0 + 0.022);
      gain.gain.setValueAtTime(0.055, t0);
      gain.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.03);
    });
  }

  public playSlotInsert() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 1. Mechanical click (ContainerSlot_Click)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(420, t);
    clickOsc.frequency.exponentialRampToValueAtTime(160, t + 0.045);
    clickGain.gain.setValueAtTime(0.09, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.055);

    // 2. Pneumatic hiss (ContainerSlot_pcht)
    const bufLen = Math.floor(ctx.sampleRate * 0.14);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 2600;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.05, t + 0.03);
    nGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);
    noise.connect(hp);
    hp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t + 0.03);

    // 3. Servo lock hum (ContainerSlot_vrr)
    const servo = ctx.createOscillator();
    const sGain = ctx.createGain();
    servo.type = 'sawtooth';
    servo.frequency.setValueAtTime(140, t + 0.07);
    servo.frequency.linearRampToValueAtTime(240, t + 0.19);
    sGain.gain.setValueAtTime(0.04, t + 0.07);
    sGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.21);
    servo.connect(sGain);
    sGain.connect(ctx.destination);
    servo.start(t + 0.07);
    servo.stop(t + 0.22);
  }

  public playFootstep(isRunning: boolean, squeak = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const pitchJitter = 0.92 + Math.random() * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime((isRunning ? 135 : 95) * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.065);
    gain.gain.setValueAtTime(isRunning ? 0.07 : 0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.075);

    if (squeak) {
      const sq = ctx.createOscillator();
      const sqGain = ctx.createGain();
      sq.type = 'triangle';
      sq.frequency.setValueAtTime(1450 * pitchJitter, t + 0.01);
      sq.frequency.exponentialRampToValueAtTime(1880 * pitchJitter, t + 0.055);
      sqGain.gain.setValueAtTime(0.022, t + 0.01);
      sqGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
      sq.connect(sqGain);
      sqGain.connect(ctx.destination);
      sq.start(t + 0.01);
      sq.stop(t + 0.065);
    }
  }

  public playScrewdriver() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [0, 0.055, 0.11].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(760 + i * 110, t + offset);
      osc.frequency.exponentialRampToValueAtTime(380, t + offset + 0.04);
      gain.gain.setValueAtTime(0.045, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + offset + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.05);
    });
  }

  public playItemThrow() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playItemImpact() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190 + Math.random() * 60, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.075);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.085);
  }

  public playGunshot(heavy = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = heavy ? 0.24 : 0.14;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (heavy ? 0.055 : 0.03)));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 1800 : 3200, t);
    filter.frequency.exponentialRampToValueAtTime(220, t + dur);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(heavy ? 0.22 : 0.16, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);

    const punch = ctx.createOscillator();
    const pGain = ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(heavy ? 160 : 240, t);
    punch.frequency.exponentialRampToValueAtTime(42, t + (heavy ? 0.14 : 0.08));
    pGain.gain.setValueAtTime(heavy ? 0.2 : 0.14, t);
    pGain.gain.exponentialRampToValueAtTime(0.001, t + (heavy ? 0.15 : 0.09));
    punch.connect(pGain);
    pGain.connect(ctx.destination);
    punch.start(t);
    punch.stop(t + (heavy ? 0.16 : 0.1));
  }

  public playMeleeSwing() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.11);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.125);
  }

  public playExplosion() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 0.85;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.22));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + dur);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.32, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);

    const sub = ctx.createOscillator();
    const sGain = ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(95, t);
    sub.frequency.exponentialRampToValueAtTime(24, t + 0.55);
    sGain.gain.setValueAtTime(0.24, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    sub.connect(sGain);
    sGain.connect(ctx.destination);
    sub.start(t);
    sub.stop(t + 0.62);
  }

  public playDefibRez() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(1680, t + 0.24);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.27);

    const zap = ctx.createOscillator();
    const zGain = ctx.createGain();
    zap.type = 'square';
    zap.frequency.setValueAtTime(120, t + 0.25);
    zap.frequency.exponentialRampToValueAtTime(60, t + 0.36);
    zGain.gain.setValueAtTime(0.11, t + 0.25);
    zGain.gain.exponentialRampToValueAtTime(0.001, t + 0.37);
    zap.connect(zGain);
    zGain.connect(ctx.destination);
    zap.start(t + 0.25);
    zap.stop(t + 0.38);
  }

  public playRoleReveal(isDissident = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const freqs = isDissident ? [196, 185, 138.6] : [261.6, 392, 523.25];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isDissident ? 'sawtooth' : 'triangle';
      const st = t + idx * 0.14;
      osc.frequency.setValueAtTime(f, st);
      gain.gain.setValueAtTime(0.09, st);
      gain.gain.exponentialRampToValueAtTime(0.0008, st + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.58);
    });
  }

  public stopRocketThruster() {
    if (this.thrusterOsc && 'stop' in this.thrusterOsc) {
      try {
        (this.thrusterOsc as AudioBufferSourceNode).stop();
      } catch {
        // Ignore if already stopped
      }
    }
    if (this.thrusterSubOsc) {
      try {
        this.thrusterSubOsc.stop();
      } catch {
        // Ignore
      }
    }
    this.thrusterOsc = null;
    this.thrusterSubOsc = null;
    this.thrusterFilter = null;
    this.thrusterGain = null;
  }
}

export const soundEngine = new SoundEngine();
