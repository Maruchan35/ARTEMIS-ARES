// =============================================================================
// KATHERINE voice: Web Speech API text-to-speech (calm, slightly synthetic AI
// tone) + optional push-to-talk speech recognition (Chrome / Edge).
// =============================================================================

import type { Lang } from './mentorTypes';

export type VoicePresetId =
  | 'katherine_hud'
  | 'capcom_warm'
  | 'gnc_crisp'
  | 'deep_control'
  | 'apollo_calm';

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
  { id: 'apollo_calm', labelEs: 'Voz Histórica Apollo (Pausada)', labelEn: 'Historic Apollo (Measured)', rate: 0.88, pitch: 0.90, volume: 0.95 },
];

const KEY_URI_PREFIX = 'astro.mentorVoiceURI.';
const KEY_PRESET = 'astro.mentorVoicePreset';

const PREFERRED: Record<Lang, RegExp[]> = {
  // Edge "Natural" voices sound best; then Windows/Google defaults.
  es: [/Dalia.*Natural/i, /Natural.*(es-MX|Mexico)/i, /Elvira.*Natural/i, /Sabina/i, /Dalia/i, /Helena/i, /Laura/i, /Paloma/i, /Google español/i],
  en: [/Aria.*Natural/i, /Jenny.*Natural/i, /Natural.*(en-US)/i, /Aria/i, /Jenny/i, /Zira/i, /Samantha/i, /Google US English/i],
};

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

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

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const s = synth();
  if (!s) return undefined;
  const voices = s.getVoices();
  const savedUri = readLs(`${KEY_URI_PREFIX}${lang}`, '');
  if (savedUri) {
    const chosen = voices.find((v) => v.voiceURI === savedUri);
    if (chosen) return chosen;
  }
  for (const re of PREFERRED[lang]) {
    const v = voices.find((vv) => re.test(vv.name) && vv.lang.toLowerCase().startsWith(lang));
    if (v) return v;
  }
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang));
}

function activePreset(): VoicePreset {
  const id = readLs(KEY_PRESET, 'capcom_warm') as VoicePresetId;
  return VOICE_PRESETS.find((p) => p.id === id) ?? VOICE_PRESETS[0];
}

const voiceListeners = new Set<() => void>();
const notifyVoiceListeners = () => voiceListeners.forEach((cb) => cb());

// Voices load asynchronously in Chromium.
if (synth()) {
  synth()!.onvoiceschanged = () => notifyVoiceListeners();
}

export const mentorVoice = {
  supported: !!synth(),

  getAvailableVoices(lang?: Lang): SpeechSynthesisVoice[] {
    const s = synth();
    if (!s) return [];
    const all = s.getVoices();
    const sorted = [...all].sort((a, b) => {
      const aMatch = lang && a.lang.toLowerCase().startsWith(lang) ? 0 : 1;
      const bMatch = lang && b.lang.toLowerCase().startsWith(lang) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      const aNat = /natural/i.test(a.name) ? 0 : 1;
      const bNat = /natural/i.test(b.name) ? 0 : 1;
      if (aNat !== bNat) return aNat - bNat;
      return a.name.localeCompare(b.name);
    });
    return sorted;
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

  speak(text: string, lang: Lang, onStart?: () => void, onEnd?: () => void) {
    const s = synth();
    if (!s || !text.trim()) {
      onEnd?.();
      return;
    }
    s.cancel();
    // Strip symbols the TTS reads badly.
    const clean = text.replace(/[₂]/g, '2').replace(/[*_`#]/g, '').replace(/\s+/g, ' ');
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice(lang);
    const preset = activePreset();
    if (v) u.voice = v;
    u.lang = v?.lang ?? (lang === 'es' ? 'es-MX' : 'en-US');
    u.rate = preset.rate;
    u.pitch = preset.pitch;
    u.volume = preset.volume;
    u.onstart = () => onStart?.();
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    s.speak(u);
  },

  testSpeak(lang: Lang, onEnd?: () => void) {
    const msg =
      lang === 'es'
        ? 'Control Houston a bordo. KATHERINE en línea: presión de cabina 101.3 kilopascales, todos los sistemas nominales.'
        : 'Houston flight control onboard. KATHERINE online: cabin pressure 101.3 kilopascals, all systems nominal.';
    this.speak(msg, lang, undefined, onEnd);
  },

  stop() {
    synth()?.cancel();
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
