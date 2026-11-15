// =============================================================================
// KATHERINE voice.
//  · Neural HD voice: Supertonic 3 rendered by the mentor bridge (POST /api/tts).
//    Same warm voice in Spanish and English. Needs the bridge running with
//    `pip install supertonic` (ai_bridge/mentor_voice.py). Listed first in the
//    voice selector as "HD"; "Automática" uses it whenever the bridge offers it.
//  · Browser voice: Web Speech API, ranked so the best installed voices win
//    (Edge "Natural" voices > Google > Apple premium > the rest).
//  · Presets (CAPCOM, GNC, Apollo…) set rate/pitch for browser voices and the
//    speaking speed of the HD voice.
// Push-to-talk speech recognition (Chrome / Edge) lives in `mentorEars`.
// =============================================================================

import type { Lang } from './mentorTypes';
import { mentorServerUrl } from './mentorClient';

export type VoicePresetId = 'katherine_hud' | 'capcom_warm' | 'gnc_crisp' | 'deep_control' | 'apollo_calm';

export interface VoicePreset {
  id: VoicePresetId;
  labelEs: string;
  labelEn: string;
  rate: number;
  pitch: number;
  volume: number;
}

export const VOICE_PRESETS: VoicePreset[] = [
  { id: 'katherine_hud', labelEs: 'KATHERINE Estándar (HUD)', labelEn: 'KATHERINE Standard (HUD)', rate: 1.02, pitch: 1.06, volume: 0.95 },
  { id: 'capcom_warm', labelEs: 'CAPCOM Houston (Cálida)', labelEn: 'Houston CAPCOM (Warm)', rate: 0.94, pitch: 0.96, volume: 0.96 },
  { id: 'gnc_crisp', labelEs: 'Computadora GNC (Precisa)', labelEn: 'GNC Computer (Crisp)', rate: 1.12, pitch: 1.14, volume: 0.95 },
  { id: 'deep_control', labelEs: 'Control Orbital (Grave)', labelEn: 'Orbital Control (Deep)', rate: 0.96, pitch: 0.82, volume: 0.98 },
  { id: 'apollo_calm', labelEs: 'Voz Histórica Apollo (Pausada)', labelEn: 'Historic Apollo (Measured)', rate: 0.88, pitch: 0.9, volume: 0.95 },
];

/** Supertonic 3 presets. Labels from listening tests + measured pitch (F5 = lowest, calmest female). */
export const NEURAL_VOICES: { id: string; es: string; en: string }[] = [
  { id: 'F5', es: 'KATHERINE · cálida (recomendada)', en: 'KATHERINE · warm (recommended)' },
  { id: 'F3', es: 'Femenina · serena', en: 'Female · calm' },
  { id: 'F1', es: 'Femenina · clara', en: 'Female · clear' },
  { id: 'F4', es: 'Femenina · ágil', en: 'Female · brisk' },
  { id: 'F2', es: 'Femenina · brillante', en: 'Female · bright' },
  { id: 'M4', es: 'Masculina · cálida', en: 'Male · warm' },
  { id: 'M1', es: 'Masculina · clara', en: 'Male · clear' },
  { id: 'M3', es: 'Masculina · grave', en: 'Male · deep' },
  { id: 'M2', es: 'Masculina · profunda', en: 'Male · low' },
  { id: 'M5', es: 'Masculina · narrador', en: 'Male · narrator' },
];
const NEURAL_PREFIX = 'neural:';
const DEFAULT_NEURAL = 'F5';

/** One entry of the voice selector (browser voice or HD neural voice). */
export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  neural?: boolean;
}

export interface NeuralVoiceInfo {
  status: string;
  voices: string[];
  default?: string;
  hint?: string;
}

const KEY_URI_PREFIX = 'astro.mentorVoiceURI.';
const KEY_PRESET = 'astro.mentorVoicePreset';

function readLs(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLs(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

let neural: NeuralVoiceInfo = { status: 'off', voices: [] };
let neuralFailures = 0;
const voiceListeners = new Set<() => void>();
const notifyVoiceListeners = () => voiceListeners.forEach((cb) => cb());

function activePreset(): VoicePreset {
  const id = readLs(KEY_PRESET, 'capcom_warm') as VoicePresetId;
  return VOICE_PRESETS.find((p) => p.id === id) ?? VOICE_PRESETS[0];
}

// ------------------------------------------------------------------ browser voices
function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

const WARM_FEMALE: Record<Lang, RegExp> = {
  es: /Dalia|Elvira|Ximena|Paloma|Salom[eé]|Larissa|Sabina|Helena|Laura|Paulina|M[oó]nica|Marisol|Renata|Valentina|Elena|Abril|Beatriz|Candela|Estrella|Irene|Nuria|Teresa|Triana|Catalina|Camila/i,
  en: /\bAva\b|\bEmma\b|Jenny|\bAria\b|Michelle|Libby|Sonia|Natasha|Clara|Samantha|Zira|Serena|Karen|Moira|Tessa|Allison|Susan|Joanna|Salli|Ana\b/i,
};

function scoreVoice(v: SpeechSynthesisVoice, lang: Lang): number {
  let s = 0;
  if (/Natural|Neural/i.test(v.name)) s += 100;
  else if (/Online/i.test(v.name)) s += 80;
  if (/Premium|Enhanced|Siri/i.test(v.name)) s += 60;
  if (/Google/i.test(v.name)) s += 50;
  if (WARM_FEMALE[lang].test(v.name)) s += 25;
  const l = v.lang.toLowerCase();
  if (lang === 'es' && /es[-_](mx|us|419)/.test(l)) s += 15;
  if (lang === 'en' && /en[-_]us/.test(l)) s += 10;
  return s;
}

/** Installed browser voices for a language, best first. */
function browserVoices(lang: Lang): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  return s
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith(lang) && !/undefined/i.test(v.name))
    .sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang));
}

function pickBrowserVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const saved = readLs(`${KEY_URI_PREFIX}${lang}`, '');
  const list = browserVoices(lang);
  return (saved && !saved.startsWith(NEURAL_PREFIX) && synth()?.getVoices().find((v) => v.voiceURI === saved)) || list[0];
}

function neuralReady(): boolean {
  return neural.status === 'ready' && neural.voices.length > 0;
}

/** HD voice id to use for `lang`, or null when the browser voice should speak. */
function neuralVoiceFor(lang: Lang): string | null {
  if (!neuralReady()) return null;
  const saved = readLs(`${KEY_URI_PREFIX}${lang}`, '');
  if (!saved) return neural.voices.includes(DEFAULT_NEURAL) ? DEFAULT_NEURAL : neural.voices[0];
  if (saved.startsWith(NEURAL_PREFIX)) {
    const id = saved.slice(NEURAL_PREFIX.length);
    return neural.voices.includes(id) ? id : DEFAULT_NEURAL;
  }
  return null; // the player picked a browser voice
}

// Voices load asynchronously in Chromium.
if (synth()) synth()!.addEventListener?.('voiceschanged', notifyVoiceListeners);

// ------------------------------------------------------------------ playback
let token = 0;
let currentAudio: HTMLAudioElement | null = null;
let finishCurrent: (() => void) | null = null;
let pendingEnd: (() => void) | null = null;

function endSpeech() {
  const cb = pendingEnd;
  pendingEnd = null;
  cb?.();
}

/** Splits on sentence ends followed by a space (keeps decimals like 0.165 intact); first chunk stays short. */
function chunkText(text: string): string[] {
  const parts = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    const firstIsTiny = out.length === 1 && last.length < 25;
    if (last !== undefined && (out.length > 1 || firstIsTiny) && last.length + p.length < 220) out[out.length - 1] = `${last} ${p}`;
    else out.push(p);
  }
  return out.length ? out : [text];
}

async function fetchNeural(text: string, lang: Lang, voice: string): Promise<Blob> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${mentorServerUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, voice, speed: activePreset().rate }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  } finally {
    window.clearTimeout(timer);
  }
}

function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = activePreset().volume;
    currentAudio = audio;
    const done = () => {
      audio.onended = null;
      audio.onerror = null;
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (finishCurrent === done) finishCurrent = null;
      resolve();
    };
    finishCurrent = done;
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}

function speakBrowser(text: string, lang: Lang, myToken: number, onStart?: () => void) {
  const s = synth();
  if (!s) {
    endSpeech();
    return;
  }
  const clean = text
    .replace(/[₂]/g, '2')
    .replace(/→/g, ', ')
    .replace(/[*_`#[\]{}|<>]/g, ' ')
    .replace(/\s+/g, ' ');
  const v = pickBrowserVoice(lang);
  const preset = activePreset();
  // Chrome cuts utterances longer than ~15 s: queue one per sentence.
  const chunks = chunkText(clean);
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    if (v) u.voice = v;
    u.lang = v?.lang ?? (lang === 'es' ? 'es-MX' : 'en-US');
    u.rate = preset.rate;
    u.pitch = preset.pitch;
    u.volume = preset.volume;
    if (i === 0) u.onstart = () => myToken === token && onStart?.();
    if (i === chunks.length - 1) {
      u.onend = () => myToken === token && endSpeech();
      u.onerror = () => myToken === token && endSpeech();
    }
    s.speak(u);
  });
}

async function speakNeural(text: string, lang: Lang, voice: string, myToken: number, onStart?: () => void) {
  const chunks = chunkText(text);
  let started = false;
  let next: Promise<Blob> | null = fetchNeural(chunks[0], lang, voice);
  next.catch(() => undefined);
  for (let i = 0; i < chunks.length; i++) {
    let blob: Blob;
    try {
      blob = await next!;
    } catch {
      if (myToken !== token) return;
      // Bridge hiccup: finish this line with the browser voice and back off after repeated failures.
      if (++neuralFailures >= 2) neural = { ...neural, status: 'error' };
      notifyVoiceListeners();
      speakBrowser(chunks.slice(i).join(' '), lang, myToken, started ? undefined : onStart);
      return;
    }
    if (myToken !== token) return;
    neuralFailures = 0;
    next = i + 1 < chunks.length ? fetchNeural(chunks[i + 1], lang, voice) : null;
    next?.catch(() => undefined);
    if (!started) {
      started = true;
      onStart?.();
    }
    await playBlob(blob);
    if (myToken !== token) return;
  }
  endSpeech();
}

function stopAll() {
  token++;
  synth()?.cancel();
  currentAudio?.pause();
  finishCurrent?.();
  endSpeech();
}

export const mentorVoice = {
  supported: !!synth() || typeof Audio !== 'undefined',

  /** Selector entries: HD neural voices first (when the bridge offers them), then browser voices, best first. */
  getAvailableVoices(lang?: Lang): VoiceOption[] {
    const l: Lang = lang ?? 'es';
    const hd: VoiceOption[] = neuralReady()
      ? NEURAL_VOICES.filter((v) => neural.voices.includes(v.id)).map((v) => ({
          voiceURI: `${NEURAL_PREFIX}${v.id}`,
          name: `✦ HD · ${v[l]}`,
          lang: 'ES/EN',
          neural: true,
        }))
      : [];
    const browser = browserVoices(l).map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }));
    return [...hd, ...browser];
  },

  subscribeVoices(cb: () => void): () => void {
    voiceListeners.add(cb);
    return () => {
      voiceListeners.delete(cb);
    };
  },

  getSelectedVoiceURI(lang: Lang): string {
    return readLs(`${KEY_URI_PREFIX}${lang}`, '');
  },

  setSelectedVoiceURI(lang: Lang, uri: string) {
    writeLs(`${KEY_URI_PREFIX}${lang}`, uri);
    notifyVoiceListeners();
  },

  getPresetId(): VoicePresetId {
    return activePreset().id;
  },

  setPresetId(id: VoicePresetId) {
    writeLs(KEY_PRESET, id);
    notifyVoiceListeners();
  },

  /** 'neural' when the HD voice will speak `lang`, otherwise 'browser'. */
  activeEngine(lang: Lang): 'neural' | 'browser' {
    return neuralVoiceFor(lang) ? 'neural' : 'browser';
  },

  speak(text: string, lang: Lang, onStart?: () => void, onEnd?: () => void) {
    stopAll();
    if (!text.trim()) {
      onEnd?.();
      return;
    }
    const myToken = ++token;
    pendingEnd = onEnd ?? null;
    const hd = neuralVoiceFor(lang);
    if (hd) void speakNeural(text, lang, hd, myToken, onStart);
    else speakBrowser(text, lang, myToken, onStart);
  },

  testSpeak(lang: Lang, onEnd?: () => void) {
    const msg =
      lang === 'es'
        ? 'Hola, cadete. Soy KATHERINE, tu mentora. Presión de cabina 101.3 kilopascales: todos los sistemas nominales.'
        : "Hi, cadet. I'm KATHERINE, your mentor. Cabin pressure 101.3 kilopascals: all systems nominal.";
    mentorVoice.speak(msg, lang, undefined, onEnd);
  },

  stop: stopAll,

  /** Called with the bridge's /api/health `voice` block (or null when the bridge is down). */
  setNeural(info: NeuralVoiceInfo | null | undefined) {
    const nextInfo: NeuralVoiceInfo = info ?? { status: 'off', voices: [] };
    if (nextInfo.status === neural.status && nextInfo.voices.length === neural.voices.length) return;
    neural = nextInfo;
    neuralFailures = 0;
    notifyVoiceListeners();
  },

  neural(): NeuralVoiceInfo {
    return neural;
  },
};

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const mentorEars = {
  supported: typeof window !== 'undefined' && !!recognitionCtor(),

  /** One-shot listen. Resolves with the transcript ('' if nothing heard). */
  listen(lang: Lang): Promise<string> {
    const Ctor = recognitionCtor();
    if (!Ctor) return Promise.resolve('');
    return new Promise((resolve) => {
      const rec = new Ctor();
      let text = '';
      rec.lang = lang === 'es' ? 'es-MX' : 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        text = e.results[0]?.[0]?.transcript ?? '';
      };
      rec.onerror = () => resolve(text);
      rec.onend = () => resolve(text);
      try {
        rec.start();
      } catch {
        resolve('');
      }
    });
  },
};
