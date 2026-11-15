// =============================================================================
// KATHERINE voice.
//  · Neural HD voice: Supertonic 3 rendered by the mentor bridge (POST /api/tts).
//    Same voice in Spanish and English, warm and natural. Needs the bridge running
//    with `pip install supertonic` (ai_bridge/mentor_voice.py).
//  · Browser voice: Web Speech API, ranked so the best installed voices win
//    (Edge "Natural" voices > Google > Apple premium > the rest).
// The player picks language, voice and speed in the panel; prefs live in localStorage.
// Push-to-talk speech recognition (Chrome / Edge) lives in `mentorEars`.
// =============================================================================

import type { Lang } from './mentorTypes';
import { mentorServerUrl } from './mentorClient';

export interface VoicePrefs {
  /** 'auto' = neural HD when the bridge offers it, otherwise the best browser voice. */
  engine: 'auto' | 'neural' | 'browser';
  neuralVoice: string;
  /** Chosen browser voice (voiceURI) per language; empty = best ranked. */
  browserVoice: Partial<Record<Lang, string>>;
  /** 0.8 – 1.25 */
  rate: number;
}

export interface NeuralVoiceInfo {
  status: string;
  voices: string[];
  default?: string;
  hint?: string;
}

/** Supertonic 3 presets. Order and labels come from listening tests + measured pitch (F5 lowest/calmest female). */
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

export const VOICE_SAMPLE: Record<Lang, string> = {
  es: 'Hola, cadete. Soy KATHERINE. Estaré contigo en cada paso de la misión.',
  en: "Hi, cadet. I'm KATHERINE. I'll be with you every step of the mission.",
};

const PREFS_KEY = 'astro.voicePrefs';
const DEFAULT_PREFS: VoicePrefs = { engine: 'auto', neuralVoice: 'F5', browserVoice: {}, rate: 1 };

function loadPrefs(): VoicePrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<VoicePrefs>) };
  } catch {
    /* storage blocked or bad JSON */
  }
  return { ...DEFAULT_PREFS };
}

let prefs = loadPrefs();
let neural: NeuralVoiceInfo = { status: 'off', voices: [] };
let neuralFailures = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((cb) => cb());

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

/** Installed voices for a language, best first. */
function browserVoices(lang: Lang): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  return s
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith(lang) && !/undefined/i.test(v.name))
    .sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang));
}

function chosenBrowserVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const list = browserVoices(lang);
  const uri = prefs.browserVoice[lang];
  return (uri && list.find((v) => v.voiceURI === uri)) || list[0];
}

// Voices load asynchronously in Chromium.
if (synth()) synth()!.addEventListener?.('voiceschanged', notify);

// ------------------------------------------------------------------ playback state
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

async function fetchNeural(text: string, lang: Lang): Promise<Blob> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${mentorServerUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, voice: prefs.neuralVoice, speed: prefs.rate }),
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
    audio.volume = 0.95;
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
  const v = chosenBrowserVoice(lang);
  // Chrome cuts utterances longer than ~15 s: queue one per sentence.
  const chunks = chunkText(clean);
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    if (v) u.voice = v;
    u.lang = v?.lang ?? (lang === 'es' ? 'es-MX' : 'en-US');
    u.rate = prefs.rate;
    u.pitch = 1.0;
    u.volume = 0.95;
    if (i === 0) u.onstart = () => myToken === token && onStart?.();
    if (i === chunks.length - 1) {
      u.onend = () => myToken === token && endSpeech();
      u.onerror = () => myToken === token && endSpeech();
    }
    s.speak(u);
  });
}

async function speakNeural(text: string, lang: Lang, myToken: number, onStart?: () => void) {
  const chunks = chunkText(text);
  let started = false;
  let next: Promise<Blob> | null = fetchNeural(chunks[0], lang);
  next.catch(() => undefined);
  for (let i = 0; i < chunks.length; i++) {
    let blob: Blob;
    try {
      blob = await next!;
    } catch {
      if (myToken !== token) return;
      // Bridge hiccup: finish this line with the browser voice and back off after repeated failures.
      if (++neuralFailures >= 2) neural = { ...neural, status: 'error' };
      notify();
      speakBrowser(chunks.slice(i).join(' '), lang, myToken, started ? undefined : onStart);
      return;
    }
    if (myToken !== token) return;
    neuralFailures = 0;
    next = i + 1 < chunks.length ? fetchNeural(chunks[i + 1], lang) : null;
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

function activeEngine(): 'neural' | 'browser' {
  if (prefs.engine === 'browser') return 'browser';
  return neural.status === 'ready' && neural.voices.includes(prefs.neuralVoice) ? 'neural' : 'browser';
}

export const mentorVoice = {
  supported: !!synth() || typeof Audio !== 'undefined',

  speak(text: string, lang: Lang, onStart?: () => void, onEnd?: () => void) {
    stopAll();
    if (!text.trim()) {
      onEnd?.();
      return;
    }
    const myToken = ++token;
    pendingEnd = onEnd ?? null;
    if (activeEngine() === 'neural') void speakNeural(text, lang, myToken, onStart);
    else speakBrowser(text, lang, myToken, onStart);
  },

  stop: stopAll,

  activeEngine,
  browserVoices,
  chosenBrowserVoice,

  getPrefs(): VoicePrefs {
    return prefs;
  },

  setPrefs(patch: Partial<VoicePrefs>) {
    prefs = { ...prefs, ...patch, browserVoice: { ...prefs.browserVoice, ...(patch.browserVoice ?? {}) } };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    notify();
  },

  /** Called with the bridge's /api/health `voice` block (or null when the bridge is down). */
  setNeural(info: NeuralVoiceInfo | null | undefined) {
    const nextInfo: NeuralVoiceInfo = info ?? { status: 'off', voices: [] };
    if (nextInfo.status === neural.status && nextInfo.voices.length === neural.voices.length) return;
    neural = nextInfo;
    neuralFailures = 0;
    notify();
  },

  neural(): NeuralVoiceInfo {
    return neural;
  },

  /** Re-render hook for the settings UI (voices load late, prefs change). */
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
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
