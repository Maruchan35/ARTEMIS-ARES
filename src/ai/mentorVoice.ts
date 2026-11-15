// =============================================================================
// KATHERINE voice: Web Speech API text-to-speech (calm, slightly synthetic AI
// tone) + optional push-to-talk speech recognition (Chrome / Edge).
// =============================================================================

import type { Lang } from './mentorTypes';

const PREFERRED: Record<Lang, RegExp[]> = {
  // Edge "Natural" voices sound best; then Windows/Google defaults.
  es: [/Dalia.*Natural/i, /Natural.*(es-MX|Mexico)/i, /Elvira.*Natural/i, /Sabina/i, /Dalia/i, /Helena/i, /Laura/i, /Paloma/i, /Google español/i],
  en: [/Aria.*Natural/i, /Jenny.*Natural/i, /Natural.*(en-US)/i, /Aria/i, /Jenny/i, /Zira/i, /Samantha/i, /Google US English/i],
};

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const s = synth();
  if (!s) return undefined;
  const voices = s.getVoices();
  for (const re of PREFERRED[lang]) {
    const v = voices.find((vv) => re.test(vv.name) && vv.lang.toLowerCase().startsWith(lang));
    if (v) return v;
  }
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang));
}

// Voices load asynchronously in Chromium.
if (synth()) synth()!.onvoiceschanged = () => void 0;

export const mentorVoice = {
  supported: !!synth(),

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
    if (v) u.voice = v;
    u.lang = v?.lang ?? (lang === 'es' ? 'es-MX' : 'en-US');
    u.rate = 1.04;
    u.pitch = 1.08;
    u.volume = 0.95;
    u.onstart = () => onStart?.();
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    s.speak(u);
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
