import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SpaceRoomState } from '../game/spaceRoomSimulation';
import { MentorDirector, PRIORITY, QueuedMentorEvent, buildTelemetry } from '../ai/mentorDirector';
import { MENTOR_CARDS } from '../ai/mentorKnowledge';
import { CHECK_PROMPT, PERSONA_LINES, composeOfflineReply, isRealWorldSafetyIssue, safetyReply } from '../ai/offlineMentor';
import { MentorServerStatus, askMentorServer, checkMentorServer, mentorServerUrl } from '../ai/mentorClient';
import { mentorEars, mentorVoice } from '../ai/mentorVoice';
import type { Lang, MentorCard, MentorEvent, MentorReply, MentorTurn } from '../ai/mentorTypes';
import { soundEngine } from '../audio/soundEngine';

// =============================================================================
// KATHERINE · holographic mentor AI panel.
// Watches the simulation (MentorDirector), explains every decision with real
// NASA data, asks "¿Entiendes la idea?", runs a mini quiz, answers questions
// (text or voice) and speaks with TTS. Uses the AstroCopilot model server when
// online; otherwise the verified offline cards.
// =============================================================================

type Stage = 'idle' | 'thinking' | 'message' | 'check' | 'quiz';

interface Shown {
  reply: MentorReply;
  topic: string;
  kind: MentorEvent['kind'] | 'persona';
  card?: MentorCard;
  /** 0 = no buttons · 1 = first "¿entiendes?" · 2 = after "explícamelo otra vez". */
  checkRound: 0 | 1 | 2;
  footer?: string;
}

interface Props {
  simRef: React.MutableRefObject<SpaceRoomState>;
  lang: Lang;
  /** True while a modal is open or the player sleeps: events wait in the queue. */
  paused: boolean;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const MODEL_KINDS = new Set<MentorEvent['kind']>(['decision', 'objective', 'mission_start', 'ending', 'question', 'explain_again']);

function readPref(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}
function writePref(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

let audioCtx: AudioContext | null = null;
function holoBlip(alarm = false) {
  if (!soundEngine.enabled) return;
  try {
    audioCtx = audioCtx ?? new AudioContext();
    const t0 = audioCtx.currentTime;
    const tones = alarm ? [660, 440] : [880, 1320];
    tones.forEach((f, i) => {
      const o = audioCtx!.createOscillator();
      const g = audioCtx!.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.12);
      o.connect(g).connect(audioCtx!.destination);
      o.start(t0 + i * 0.09);
      o.stop(t0 + i * 0.09 + 0.14);
    });
  } catch {
    /* audio blocked until user gesture */
  }
}

const HoloAvatar: React.FC<{ accent: string; speaking: boolean; thinking: boolean }> = ({ accent, speaking, thinking }) => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 shrink-0 holo-flicker" aria-hidden="true">
    <defs>
      <radialGradient id="katCore" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
        <stop offset="70%" stopColor={accent} stopOpacity="0.12" />
        <stop offset="100%" stopColor={accent} stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 7" className="holo-spin" />
    <circle cx="50" cy="50" r="39" fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" strokeDasharray="22 9 4 9" className={thinking ? 'holo-spin-fast' : 'holo-spin-rev'} />
    <polygon points="50,18 76,33 76,63 50,80 24,63 24,33" fill="url(#katCore)" stroke={accent} strokeWidth="1.6" className="holo-pulse" />
    <rect x="38" y="40" width="5" height="8" rx="2.5" fill={accent} className="holo-blink" />
    <rect x="57" y="40" width="5" height="8" rx="2.5" fill={accent} className="holo-blink" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect
        key={i}
        x={36 + i * 6}
        y="57"
        width="3.5"
        height="8"
        rx="1.5"
        fill={accent}
        opacity={speaking ? 0.95 : 0.45}
        className={speaking ? 'holo-wave' : ''}
        style={{ animationDelay: `${i * 0.11}s`, transformOrigin: `${37.75 + i * 6}px 61px` }}
      />
    ))}
  </svg>
);

export const MentorHologram: React.FC<Props> = ({ simRef, lang, paused }) => {
  const directorRef = useRef(new MentorDirector());
  const queueRef = useRef<QueuedMentorEvent[]>([]);
  const busyUntilRef = useRef(0);
  const pendingSinceRef = useRef(0);
  const shownAtRef = useRef(0);
  const processingRef = useRef(false);
  const historyRef = useRef<MentorTurn[]>([]);
  const langRef = useRef(lang);
  const pausedRef = useRef(paused);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stageRef = useRef<Stage>('idle');
  const [stage, setStageState] = useState<Stage>('idle');
  const setStage = useCallback((s: Stage) => {
    stageRef.current = s;
    setStageState(s);
  }, []);

  const shownRef = useRef<Shown | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [typed, setTyped] = useState(0);
  const quizRef = useRef<{ card: MentorCard; order: number[] } | null>(null);
  const [quiz, setQuiz] = useState<{ card: MentorCard; order: number[] } | null>(null);

  const serverRef = useRef<MentorServerStatus>({ online: false, backend: 'offline' });
  const [server, setServer] = useState<MentorServerStatus>(serverRef.current);
  const voiceRef = useRef(readPref('astro.mentorVoice', true));
  const [voiceOn, setVoiceOn] = useState(voiceRef.current);
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // ------------------------------------------------------------ server status
  useEffect(() => {
    let alive = true;
    let timer = 0;
    const poll = async () => {
      const st = await checkMentorServer();
      if (!alive) return;
      serverRef.current = st;
      setServer(st);
      // Re-check often while connected; back off when the bridge is not running (less console noise).
      timer = window.setTimeout(poll, st.online ? 20000 : 60000);
    };
    void poll();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      mentorVoice.stop();
    };
  }, []);

  // ---------------------------------------------------------------- present
  const present = useCallback(
    (sh: Shown, next: Stage) => {
      shownRef.current = sh;
      setShown(sh);
      setTyped(0);
      setStage(next);
      const l = langRef.current;
      const r = sh.reply;
      historyRef.current = [...historyRef.current, { role: 'mentor' as const, text: r.say }].slice(-10);
      holoBlip(r.mode === 'crisis' || r.mode === 'safety');
      const full = [r.say, r.didYouKnow ? `${l === 'es' ? '¿Sabías que…?' : 'Did you know?'} ${r.didYouKnow}` : '', r.check ?? ''].join(' ').trim();
      const now = Date.now();
      busyUntilRef.current = now + Math.max(5000, full.length * 48);
      pendingSinceRef.current = now;
      shownAtRef.current = now;
      if (voiceRef.current) {
        mentorVoice.speak(full, l, () => setSpeaking(true), () => setSpeaking(false));
      }
    },
    [setStage]
  );

  // typewriter
  useEffect(() => {
    if (!shown) return;
    const len = shown.reply.say.length;
    const id = window.setInterval(() => {
      setTyped((t) => {
        if (t >= len) {
          window.clearInterval(id);
          return len;
        }
        return Math.min(len, t + 2);
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [shown]);

  // ----------------------------------------------------------- handle event
  const handleEvent = useCallback(
    async (event: MentorEvent) => {
      if (processingRef.current) {
        queueRef.current.unshift({ event, priority: 0 });
        return;
      }
      processingRef.current = true;
      try {
        const l = langRef.current;
        const tele = buildTelemetry(simRef.current);
        const card = MENTOR_CARDS[event.topic];

        if (event.kind === 'question' && isRealWorldSafetyIssue(event.text ?? '')) {
          present({ reply: safetyReply(l), topic: 'safety', kind: 'question', checkRound: 0 }, 'message');
          return;
        }

        let reply: MentorReply | null = composeOfflineReply(event, l, tele);
        // The model handles teaching moments; an 'offline' bridge (RAG only) is still used for free questions.
        const srv = serverRef.current;
        if (srv.online && MODEL_KINDS.has(event.kind) && (srv.backend !== 'offline' || event.kind === 'question')) {
          const prevStage = stageRef.current;
          setStage('thinking');
          const { reply: r, failed } = await askMentorServer({
            event,
            lang: l,
            telemetry: tele,
            history: historyRef.current.slice(-6),
            card: card
              ? {
                  say: card.say[l],
                  fact: card.fact[l],
                  source: card.source,
                  simple: card.simple?.[l],
                  ragQuery: card.ragQuery,
                  tone: card.tone,
                }
              : undefined,
          });
          if (r) reply = r;
          else if (failed) {
            serverRef.current = { ...serverRef.current, online: false };
            setServer(serverRef.current);
          }
          if (!reply) setStage(prevStage === 'thinking' ? 'idle' : prevStage);
        }
        if (!reply) return;

        const wantsButtons =
          reply.mode !== 'safety' &&
          reply.mode !== 'crisis' &&
          (event.kind === 'decision' || event.kind === 'explain_again' || (event.kind === 'objective' && !!card?.askCheck));
        if (wantsButtons && !reply.check) reply = { ...reply, check: pick(CHECK_PROMPT[l]) };
        if (!wantsButtons && event.kind !== 'question') reply = { ...reply, check: undefined };

        present(
          {
            reply,
            topic: event.topic,
            kind: event.kind,
            card,
            checkRound: wantsButtons ? (event.kind === 'explain_again' ? 2 : 1) : 0,
          },
          wantsButtons ? 'check' : 'message'
        );
      } finally {
        processingRef.current = false;
      }
    },
    [present, setStage, simRef]
  );

  const enqueue = useCallback((q: QueuedMentorEvent) => {
    const list = queueRef.current.filter((x) => !(x.event.topic === q.event.topic && x.event.kind === q.event.kind && q.event.kind !== 'question'));
    if (q.event.kind === 'hint' && list.length) return; // never nag on top of real events
    list.push(q);
    list.sort((a, b) => a.priority - b.priority);
    queueRef.current = list.slice(0, 6);
  }, []);

  // ------------------------------------------------------------ main loop
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      if (!pausedRef.current) {
        for (const q of directorRef.current.tick(simRef.current, now)) enqueue(q);
      }
      const st = stageRef.current;
      if ((st === 'check' || st === 'quiz') && now - pendingSinceRef.current > 45000) {
        quizRef.current = null;
        setQuiz(null);
        setStage('message');
        busyUntilRef.current = now;
      }
      if (pausedRef.current || processingRef.current) return;
      const head = queueRef.current[0];
      if (!head) return;
      const urgent = head.priority <= PRIORITY.alarm;
      const waitingAnswer = stageRef.current === 'check' || stageRef.current === 'quiz';
      // Decisions may cut a long message short once it has been on screen for a few seconds.
      const canCut = head.priority <= PRIORITY.decision && now - shownAtRef.current >= 4000;
      if (!urgent && (waitingAnswer || (now < busyUntilRef.current && !canCut))) return;
      queueRef.current.shift();
      if (waitingAnswer) {
        quizRef.current = null;
        setQuiz(null);
      }
      void handleEvent(head.event);
    }, 400);
    return () => window.clearInterval(id);
  }, [enqueue, handleEvent, setStage, simRef]);

  // ------------------------------------------------------- player answers
  const startQuiz = useCallback(
    (card: MentorCard) => {
      const q = card.quiz!;
      const order = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
      quizRef.current = { card, order };
      setQuiz(quizRef.current);
      const l = langRef.current;
      present(
        {
          reply: { say: `${pick(PERSONA_LINES.understoodYes[l])} ${q.q[l]}`, sources: [card.source], mode: 'socratic', origin: 'card' },
          topic: card.id,
          kind: 'persona',
          card,
          checkRound: 0,
        },
        'quiz'
      );
    },
    [present]
  );

  const answerCheck = useCallback(
    (understood: boolean) => {
      const sh = shownRef.current;
      if (!sh || stageRef.current !== 'check') return;
      const l = langRef.current;
      directorRef.current.noteActivity(Date.now());
      historyRef.current.push({ role: 'player', text: understood ? (l === 'es' ? 'Sí, entiendo.' : 'Yes, I get it.') : l === 'es' ? 'No, explícamelo otra vez.' : 'No, explain it again.' });
      if (understood) {
        if (sh.card?.quiz) startQuiz(sh.card);
        else
          present(
            { reply: { say: pick(PERSONA_LINES.understoodYesNoQuiz[l]), sources: [], mode: 'socratic', origin: 'card' }, topic: sh.topic, kind: 'persona', checkRound: 0 },
            'message'
          );
      } else if (sh.checkRound >= 2 || !sh.card) {
        present({ reply: { say: pick(PERSONA_LINES.stillNo[l]), sources: [], mode: 'socratic', origin: 'card' }, topic: sh.topic, kind: 'persona', checkRound: 0 }, 'message');
      } else {
        void handleEvent({ kind: 'explain_again', topic: sh.topic });
      }
    },
    [handleEvent, present, startQuiz]
  );

  const answerQuiz = useCallback(
    (slot: number) => {
      const qz = quizRef.current;
      if (!qz || stageRef.current !== 'quiz') return;
      const l = langRef.current;
      const q = qz.card.quiz!;
      const chosen = qz.order[slot];
      if (chosen === undefined) return;
      const ok = chosen === q.correct;
      quizRef.current = null;
      setQuiz(null);
      directorRef.current.noteActivity(Date.now());
      historyRef.current.push({ role: 'player', text: q.options[chosen][l] });
      let footer: string | undefined;
      if (ok) {
        const sim = simRef.current;
        sim.crewMoralePercent = Math.min(100, sim.crewMoralePercent + 2);
        footer = l === 'es' ? '+2% moral de la tripulación' : '+2% crew morale';
      }
      const say = ok ? `${pick(PERSONA_LINES.quizRight[l])} ${q.why[l]}` : `${pick(PERSONA_LINES.quizWrong[l])} «${q.options[q.correct][l]}». ${q.why[l]}`;
      present({ reply: { say, sources: [qz.card.source], mode: 'socratic', origin: 'card' }, topic: qz.card.id, kind: 'persona', checkRound: 0, footer }, 'message');
    },
    [present, simRef]
  );

  // -------------------------------------------------------------- chat
  const openChat = useCallback(() => {
    document.exitPointerLock?.();
    setCollapsed(false);
    setChatOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  const sendQuestion = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      historyRef.current.push({ role: 'player', text: t });
      directorRef.current.noteActivity(Date.now());
      enqueue({ event: { kind: 'question', topic: '', text: t }, priority: PRIORITY.question });
      setChatText('');
      setChatOpen(false);
      inputRef.current?.blur();
    },
    [enqueue]
  );

  const listen = useCallback(async () => {
    if (!mentorEars.supported || listening) return;
    mentorVoice.stop();
    setListening(true);
    const heard = await mentorEars.listen(langRef.current);
    setListening(false);
    if (heard) sendQuestion(heard);
  }, [listening, sendQuestion]);

  const toggleVoice = useCallback(() => {
    voiceRef.current = !voiceRef.current;
    setVoiceOn(voiceRef.current);
    writePref('astro.mentorVoice', voiceRef.current);
    if (!voiceRef.current) mentorVoice.stop();
  }, []);

  // Dev-only console hook to test the mentor: __katherine.sim().crisisDecision = 'food_priority'; __katherine.ask('...')
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __katherine?: unknown };
    w.__katherine = { sim: () => simRef.current, ask: (q: string) => sendQuestion(q), queue: () => queueRef.current };
    return () => {
      delete w.__katherine;
    };
  }, [sendQuestion, simRef]);

  // ------------------------------------------------------------ keyboard
  const keyHandlers = useRef({ answerCheck, answerQuiz, openChat, toggleVoice });
  keyHandlers.current = { answerCheck, answerQuiz, openChat, toggleVoice };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const h = keyHandlers.current;
      const st = stageRef.current;
      if (e.code === 'KeyT') {
        e.preventDefault();
        h.openChat();
      } else if (e.code === 'KeyM') {
        h.toggleVoice();
      } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
        if (st === 'check') h.answerCheck(true);
        else if (st === 'quiz') h.answerQuiz(0);
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        if (st === 'check') h.answerCheck(false);
        else if (st === 'quiz') h.answerQuiz(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ------------------------------------------------------------ render
  const mode = shown?.reply.mode ?? 'socratic';
  const accent = mode === 'crisis' ? '#fb7185' : mode === 'safety' ? '#fbbf24' : '#38bdf8';
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const typingDone = !!shown && typed >= shown.reply.say.length;
  const coreLabel = server.online
    ? t(`Núcleo: AstroCopilot Gemma-4 · ${server.backend}`, `Core: AstroCopilot Gemma-4 · ${server.backend}`)
    : t('Núcleo local: tarjetas NASA verificadas', 'Local core: verified NASA cards');

  const configureServer = () => {
    const url = window.prompt(t('URL del servidor del mentor (ai_bridge/mentor_server.py):', 'Mentor server URL (ai_bridge/mentor_server.py):'), mentorServerUrl);
    if (url === null) return;
    try {
      if (url.trim()) localStorage.setItem('astro.mentorUrl', url.trim());
      else localStorage.removeItem('astro.mentorUrl');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed right-3 top-28 z-30 pointer-events-auto rounded-full holo-panel p-1"
        title={t('Abrir a KATHERINE', 'Open KATHERINE')}
      >
        <HoloAvatar accent={accent} speaking={speaking} thinking={stage === 'thinking'} />
      </button>
    );
  }

  return (
    <div className="fixed right-3 top-28 z-30 w-[370px] max-w-[calc(100vw-24px)] pointer-events-auto" onContextMenu={(e) => e.stopPropagation()}>
      <div className={`holo-panel ${mode === 'crisis' ? 'holo-crisis' : ''}`} style={{ borderColor: `${accent}99` }}>
        <div className="flex items-start gap-2.5 p-2.5 pb-1.5">
          <HoloAvatar accent={accent} speaking={speaking} thinking={stage === 'thinking'} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[13px] font-black tracking-[0.2em]" style={{ color: accent }}>
                  KATHERINE
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  {mode === 'crisis' ? t('Modo crisis · órdenes primero', 'Crisis mode · commands first') : t('IA mentora · Misión AETHER-4', 'Mentor AI · AETHER-4 Mission')}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={toggleVoice} className="holo-btn" title={t('Voz [M]', 'Voice [M]')}>
                  {voiceOn ? '🔊' : '🔇'}
                </button>
                <button type="button" onClick={() => setCollapsed(true)} className="holo-btn" title={t('Minimizar', 'Minimize')}>
                  ▁
                </button>
              </div>
            </div>
            <button type="button" onClick={configureServer} className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200" title={mentorServerUrl}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${server.online ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'}`} />
              {coreLabel}
            </button>
          </div>
        </div>

        <div className="px-3 pb-2.5 text-[13px] leading-snug text-slate-100 min-h-[48px]">
          {stage === 'thinking' && (
            <div className="text-cyan-200/90 italic">
              {PERSONA_LINES.thinking[lang]}
              <span className="holo-dots" />
            </div>
          )}
          {stage !== 'thinking' && !shown && (
            <div className="text-slate-400">{t('En línea. Explora el módulo; te acompaño en cada decisión.', 'Online. Explore the module; I will be with you on every decision.')}</div>
          )}
          {stage !== 'thinking' && shown && (
            <>
              <p className="whitespace-pre-wrap">
                {shown.reply.say.slice(0, typed)}
                {!typingDone && <span className="holo-caret">▌</span>}
              </p>
              {typingDone && shown.reply.didYouKnow && (
                <div className="mt-2 border-l-2 pl-2 py-1 bg-sky-950/40 holo-fade" style={{ borderColor: accent }}>
                  <div className="text-[10px] font-black tracking-widest" style={{ color: accent }}>
                    {t('¿SABÍAS QUE…?', 'DID YOU KNOW?')}
                  </div>
                  <div className="text-[12px] text-slate-200">{shown.reply.didYouKnow}</div>
                </div>
              )}
              {typingDone && shown.reply.check && <p className="mt-2 font-bold holo-fade" style={{ color: accent }}>{shown.reply.check}</p>}
              {typingDone && stage === 'check' && (
                <div className="mt-2 flex gap-2 holo-fade">
                  <button type="button" className="holo-choice" onClick={() => answerCheck(true)}>
                    [1] {t('Sí, entiendo', 'Yes, I get it')}
                  </button>
                  <button type="button" className="holo-choice" onClick={() => answerCheck(false)}>
                    [2] {t('Explícamelo otra vez', 'Explain it again')}
                  </button>
                </div>
              )}
              {typingDone && stage === 'quiz' && quiz && (
                <div className="mt-2 flex flex-col gap-1.5 holo-fade">
                  {quiz.order.map((optIdx, slot) => (
                    <button key={slot} type="button" className="holo-choice text-left" onClick={() => answerQuiz(slot)}>
                      [{slot + 1}] {quiz.card.quiz!.options[optIdx][lang]}
                    </button>
                  ))}
                </div>
              )}
              {typingDone && shown.footer && <div className="mt-1.5 text-[11px] font-black text-emerald-300 holo-fade">{shown.footer}</div>}
              {typingDone && shown.reply.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 holo-fade">
                  {shown.reply.sources.slice(0, 3).map((s) => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 border border-slate-600 text-slate-400 font-mono">
                      {s}
                    </span>
                  ))}
                  <span className="text-[9px] px-1.5 py-0.5 text-slate-500 font-mono">{shown.reply.origin === 'model' ? 'AstroCopilot' : t('tarjeta verificada', 'verified card')}</span>
                </div>
              )}
            </>
          )}
        </div>

        {chatOpen ? (
          <form
            className="flex gap-1.5 px-2.5 pb-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(chatText);
            }}
          >
            <input
              ref={inputRef}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setChatOpen(false);
                  e.currentTarget.blur();
                }
              }}
              maxLength={300}
              placeholder={t('Pregúntale a KATHERINE…', 'Ask KATHERINE…')}
              className="flex-1 min-w-0 bg-slate-950/80 border border-sky-700 px-2 py-1 text-[13px] text-slate-100 outline-none focus:border-sky-400"
            />
            {mentorEars.supported && (
              <button type="button" onClick={listen} className={`holo-btn ${listening ? 'holo-listening' : ''}`} title={t('Hablar por micrófono', 'Speak into the microphone')}>
                🎙
              </button>
            )}
            <button type="submit" className="holo-btn">
              ➤
            </button>
          </form>
        ) : (
          <div className="px-3 pb-2 text-[10px] text-slate-500 font-mono">
            [T] {t('Hablar', 'Talk')} · [1]/[2] {t('Responder', 'Answer')} · [M] {t('Voz', 'Voice')}
          </div>
        )}
      </div>
    </div>
  );
};
