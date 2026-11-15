"""Procedural 30 s sci-fi score + UI sound design for the CodeCraft / AETHER-4 promo.

Everything is synthesized (no samples, no licensing issues): sub drones, pads, a 120 BPM pulse,
risers, impacts, alarm motif, UI blips and a logo shimmer.  Music ducks under KATHERINE's lines.
Output: public/audio/score.wav (48 kHz, stereo, 16-bit, exactly 30.000 s).
Timing must match src/timeline.ts (VO start times and visual cues).
"""

from __future__ import annotations

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mus = np.zeros((2, N))  # music bus (ducked under VO)
sfx = np.zeros((2, N))  # UI / impact bus (not ducked)
verb_send = np.zeros((2, N))

# KATHERINE lines: (file start, speech start offset, speech end offset) — mirror of src/timeline.ts
VO = [(4.75, 0.37, 2.75), (7.45, 0.51, 3.68), (11.75, 0.39, 2.93), (16.95, 0.45, 2.22), (21.0, 0.46, 2.86), (25.75, 0.3, 2.3)]


def note(name: str) -> float:
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    return 440.0 * 2 ** ((names[name[:-1]] + 12 * (int(name[-1]) - 4)) / 12)


def tt(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def place(bus: np.ndarray, start: float, sig: np.ndarray, pan: float = 0.0, gain: float = 1.0, send: float = 0.0) -> None:
    i0 = int(start * SR)
    if i0 >= N:
        return
    sig = sig[: N - i0] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i0 : i0 + len(sig)] += sig * l * 1.414
    bus[1, i0 : i0 + len(sig)] += sig * r * 1.414
    if send:
        verb_send[0, i0 : i0 + len(sig)] += sig * l * send
        verb_send[1, i0 : i0 + len(sig)] += sig * r * send


def env_adsr(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    e = np.full(n, s)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, max(na, 1))[:na]
    e[na : na + nd] = np.linspace(1, s, max(nd, 1))[: len(e[na : na + nd])]
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(sig: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), sig)


def hp(sig: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), sig)


def saw(f: float, t: np.ndarray, harmonics: int = 12) -> np.ndarray:
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, harmonics + 1) if f * k < SR / 2.2) * 0.6


def pad(freqs: list[float], dur: float, bright: float = 1800, detune: float = 0.004) -> np.ndarray:
    t = tt(dur)
    s = sum(saw(f * (1 + d), t, 8) for f in freqs for d in (-detune, 0, detune)) / (len(freqs) * 3)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.18 * t)
    return lp(s, bright, 2) * (0.75 + 0.25 * lfo) * env_adsr(len(t), 0.9, 0.5, 0.85, min(1.2, dur * 0.4))


def pluck(f: float, dur: float = 0.24, bright: float = 3200) -> np.ndarray:
    t = tt(dur)
    return lp(saw(f, t, 10), bright, 2) * np.exp(-t * 16)


def kick(dur: float = 0.42, f0: float = 95, f1: float = 42) -> np.ndarray:
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) + 0.15 * hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 120)


def hat(dur: float = 0.05) -> np.ndarray:
    t = tt(dur)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 90)


def blip(f: float = 1760, dur: float = 0.07, f_end: float | None = None) -> np.ndarray:
    t = tt(dur)
    fr = np.linspace(f, f_end or f, len(t))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 45) * (1 - np.exp(-t * 2000))


def tick() -> np.ndarray:
    t = tt(0.012)
    return hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 500)


def impact(dur: float = 2.2, f0: float = 70, f1: float = 28) -> np.ndarray:
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crack = lp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 18) * 0.5
    return body + crack


def riser(dur: float, f0: float = 120, f1: float = 1600) -> np.ndarray:
    t = tt(dur)
    x = t / dur
    noise = rng.standard_normal(len(t))
    # Swept band: blend progressively brighter low-passed noise.
    sweep = lp(noise, 600) * (1 - x) + lp(noise, 2400) * x * (1 - x) * 2 + hp(noise, 3000) * x**2
    tone = np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** x) / SR) * 0.35
    return (sweep * 0.5 + tone) * x**1.6


def bell(f: float, dur: float = 2.5) -> np.ndarray:
    t = tt(dur)
    partials = [(1, 1), (2.01, 0.5), (2.76, 0.32), (4.07, 0.18), (5.43, 0.08)]
    return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * (1.6 + m * 0.9)) for m, a in partials) * 0.35


# ------------------------------------------------------------------------------------------------ A · boot (0-7 s)
t = tt(7.0)
drone = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 27.5 * t) + 0.25 * np.sin(2 * np.pi * 110.3 * t))
place(mus, 0.0, drone * np.clip(t / 3.0, 0, 1) * 0.22)
bed = lp(rng.standard_normal(len(tt(4.6))), 900) * np.linspace(0, 1, len(tt(4.6))) ** 1.5
place(mus, 0.0, bed, pan=0.0, gain=0.05)
for k, at in enumerate(np.arange(0.55, 4.1, 0.215)):  # one tick per compiled log line
    place(sfx, at, tick(), pan=float(rng.uniform(-0.6, 0.6)), gain=0.32)
    if k % 4 == 3:
        place(sfx, at + 0.02, blip(2637, 0.05), pan=0.3, gain=0.07)
place(sfx, 4.15, blip(1318, 0.09), gain=0.12)  # build ✓
place(mus, 3.9, riser(1.1, 200, 2400), gain=0.35, send=0.2)
place(sfx, 4.95, impact(2.4, 80, 30), gain=0.55, send=0.35)  # boot hit
place(mus, 4.95, pad([note("A2"), note("E3"), note("C4"), note("B4"), note("E5")], 2.3, 2600), gain=0.55, send=0.5)
for i, f in enumerate([note("A5"), note("E6"), note("B6")]):
    place(sfx, 5.05 + i * 0.09, bell(f, 1.6), pan=-0.4 + i * 0.4, gain=0.18, send=0.6)
for at, pn in [(5.25, -0.7), (5.4, 0.7), (5.55, -0.7), (5.7, 0.7)]:  # HUD corner brackets
    place(sfx, at, blip(1975, 0.05), pan=pn, gain=0.1)

# ------------------------------------------------------------------------------------------------ B · action (7-17 s)
BEAT = 0.5  # 120 BPM
prog = [  # one chord per bar (2 s)
    (7.0, ["A2", "E3", "A3", "C4", "E4", "B4"]),
    (9.0, ["F2", "C3", "F3", "A3", "C4", "E4"]),
    (11.0, ["C3", "G3", "C4", "E4", "G4", "D5"]),
    (13.0, ["G2", "D3", "G3", "B3", "D4", "F#4"]),
    (15.0, ["A2", "E3", "A3", "C4", "E4", "B4"]),
]
for bar_start, chord in prog:
    fr = [note(n) for n in chord]
    place(mus, bar_start, pad(fr[1:5], 2.1, 2000), gain=0.28, send=0.35)
    bass = saw(fr[0], tt(2.0), 6)
    pump = np.ones(len(bass))
    for b in range(4):  # sidechain pump on every kick
        i = int(b * BEAT * SR)
        pump[i : i + int(0.18 * SR)] *= np.linspace(0.25, 1, int(0.18 * SR))
    place(mus, bar_start, lp(bass, 420) * pump * env_adsr(len(bass), 0.01, 0.1, 0.9, 0.05), gain=0.32)
    arp = fr[2:] + fr[2:][::-1][1:-1]
    for s in range(16):  # 16ths
        if bar_start + s * 0.125 >= 16.9:
            break
        place(mus, bar_start + s * 0.125, pluck(arp[s % len(arp)] * 2, 0.22, 2600 + 900 * (s % 4 == 0)),
              pan=0.45 if s % 2 else -0.45, gain=0.14, send=0.25)
for b in np.arange(7.0, 16.9, BEAT):
    place(mus, b, kick(), gain=0.62)
    place(mus, b + BEAT / 2, hat(), pan=0.25, gain=0.11)
for at in np.arange(7.25, 16.9, 0.25):
    place(mus, at, hat(0.03), pan=-0.25, gain=0.04)
# telemetry cards / graphs / panel / mission cuts
for at, f, pn in [(7.15, 1568, -0.6), (7.3, 1760, -0.6), (7.45, 1976, -0.6), (7.6, 2093, -0.6), (7.9, 2349, 0.5),
                  (10.25, 1318, 0.6), (10.55, 1760, 0.6), (11.2, 2637, 0.6)]:
    place(sfx, at, blip(f, 0.06), pan=pn, gain=0.1)
for at in [13.0, 13.65, 14.3, 14.95]:  # whip cuts
    w = hp(rng.standard_normal(len(tt(0.28))), 1200) * np.sin(np.linspace(0, np.pi, len(tt(0.28)))) ** 2
    place(sfx, at - 0.12, w, gain=0.22, pan=0.0)
    place(sfx, at, blip(880, 0.08, 1760), gain=0.08)
place(mus, 15.0, riser(2.0, 90, 1900), gain=0.55, send=0.3)
for at in np.concatenate([np.arange(15.5, 16.25, 0.125), np.arange(16.25, 16.75, 0.0625), np.arange(16.75, 17.0, 0.03125)]):
    place(mus, at, hp(rng.standard_normal(len(tt(0.06))), 1500) * np.exp(-tt(0.06) * 60), gain=0.07 + (at - 15.5) * 0.08)

# ------------------------------------------------------------------------------------------------ C · climax (17-25 s)
place(sfx, 17.0, impact(3.0, 65, 26), gain=0.8, send=0.5)
place(mus, 17.0, pad([note("A2"), note("A#2"), note("E3"), note("F3")], 4.4, 900, 0.006), gain=0.42, send=0.4)
for i, at in enumerate(np.arange(17.25, 20.4, 0.5)):  # soft two-tone alarm
    f = 880 if i % 2 == 0 else 698.5
    tri = lp(np.sign(np.sin(2 * np.pi * f * tt(0.22))) * np.exp(-tt(0.22) * 6), 2200)
    place(sfx, at, tri, pan=-0.35 if i % 2 else 0.35, gain=0.06, send=0.2)
for b in np.arange(17.0, 21.4, 1.0):  # heartbeat
    place(mus, b, kick(0.35, 80, 40), gain=0.55)
    place(mus, b + 0.22, kick(0.3, 70, 38), gain=0.35)
# compute load: rising 32nd glitch arpeggio
for k, at in enumerate(np.arange(19.6, 22.35, 0.0625)):
    f = note("A4") * 2 ** (((k * 5) % 24) / 12) * (1 + 0.6 * (at - 19.6) / 2.7)
    place(mus, at, blip(f, 0.05) * 0.8, pan=float(np.sin(k * 0.7)) * 0.6, gain=0.06)
for at in [19.65, 20.4, 20.75, 21.1]:  # RAG hits appearing
    place(sfx, at, blip(2093, 0.06), pan=0.4, gain=0.1)
place(mus, 21.4, riser(1.0, 300, 2000), gain=0.3)
# resolution (22.4): brighter major pad + groove returns
place(sfx, 22.4, impact(1.6, 90, 45), gain=0.35, send=0.4)
for i, f in enumerate([note("C6"), note("E6"), note("G6")]):
    place(sfx, 22.45 + i * 0.08, bell(f, 2.0), pan=-0.3 + i * 0.3, gain=0.16, send=0.5)
place(mus, 22.4, pad([note("C3"), note("G3"), note("E4"), note("D5")], 2.7, 3000), gain=0.42, send=0.45)
for b in np.arange(22.4, 24.9, BEAT):
    place(mus, b, kick(), gain=0.5)
    place(mus, b + BEAT / 2, hat(), pan=0.25, gain=0.1)
for s, at in enumerate(np.arange(22.4, 24.9, 0.125)):
    arp = [note(n) for n in ["C5", "E5", "G5", "D6", "G5", "E5"]]
    place(mus, at, pluck(arp[s % len(arp)], 0.2, 3600), pan=0.4 if s % 2 else -0.4, gain=0.1, send=0.3)

# ------------------------------------------------------------------------------------------------ D · outro (25-30 s)
whoosh = hp(rng.standard_normal(len(tt(0.9))), 600) * np.sin(np.linspace(0, np.pi, len(tt(0.9)))) ** 3
place(sfx, 24.55, whoosh, gain=0.28)
place(sfx, 25.0, impact(3.5, 75, 30), gain=0.6, send=0.6)
place(mus, 25.0, pad([note("F2"), note("C3"), note("A3"), note("E4"), note("G4"), note("C5")], 4.9, 2400), gain=0.5, send=0.6)
for i, f in enumerate([note("A5"), note("C6"), note("E6"), note("B6")]):
    place(sfx, 25.15 + i * 0.11, bell(f, 3.2), pan=-0.45 + i * 0.3, gain=0.17, send=0.7)
place(sfx, 26.05, bell(note("E7"), 2.4), pan=0.2, gain=0.08, send=0.8)  # logo glint

# ------------------------------------------------------------------------------------------------ mix
ir_t = tt(2.8)
ir = rng.standard_normal((2, len(ir_t))) * np.exp(-ir_t * 2.4)
ir = np.stack([lp(ir[0], 6000), lp(ir[1], 5200)])
verb = np.stack([fftconvolve(verb_send[c], ir[c])[:N] for c in range(2)]) * 0.12

duck = np.ones(N)
for start, s0, s1 in VO:
    a, b = int((start + s0 - 0.08) * SR), int((start + s1 + 0.15) * SR)
    duck[a:b] = 0.25  # -12 dB under KATHERINE so the voice always sits on top
duck = lp(duck, 6.0, 1)  # smooth attack/release
mix = (mus + verb) * duck + sfx
mix = np.tanh(mix * 1.15) * 0.9
mix /= np.max(np.abs(mix)) / 0.89
fade = np.ones(N)
fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
fade[-int(0.7 * SR) :] = np.linspace(1, 0, int(0.7 * SR)) ** 2
sf.write("public/audio/score.wav", (mix * fade).T, SR, subtype="PCM_16")
print("score.wav", mix.shape[1] / SR, "s, peak", float(np.max(np.abs(mix * fade))))
