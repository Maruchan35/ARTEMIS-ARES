import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SpaceRoomState } from '../game/spaceRoomSimulation';
import { MentorDirector, PRIORITY, QueuedMentorEvent, buildTelemetry } from '../ai/mentorDirector';
import { MENTOR_CARDS } from '../ai/mentorKnowledge';
import { CHECK_PROMPT, PERSONA_LINES, composeOfflineReply, isRealWorldSafetyIssue, safetyReply, searchCards } from '../ai/offlineMentor';
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
/** A 4-bit Gemma on Colab takes ~25-35 s per answer; give it room before falling back to the cards. */
const MODEL_TIMEOUT_MS = 75000;
const eventKey = (e: MentorEvent) => `${e.kind}|${e.topic}|${e.text ?? ''}`;
const priorityOf = (e: MentorEvent) => (PRIORITY as Record<string, number>)[e.kind] ?? PRIORITY.decision;

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
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
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

const HoloAvatar: React.FC<{ accent: string; speaking: boolean; thinking: boolean; compact?: boolean }> = ({
  accent,
  speaking,
  thinking,
  compact = false,
}) => (
  <svg viewBox="0 0 100 100" className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} shrink-0 holo-flicker`} aria-hidden="true">
    <defs>
      <radialGradient id="katCore" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor={accent} stopOpacity="0.65" />
        <stop offset="70%" stopColor={accent} stopOpacity="0.16" />
        <stop offset="100%" stopColor={accent} stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#katCore)" stroke={accent} strokeOpacity="0.65" strokeWidth="2.4" strokeDasharray="4 6" className="holo-spin" />
    <circle cx="50" cy="50" r="36" fill="none" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" strokeDasharray="22 8 5 8" className={thinking ? 'holo-spin-fast' : 'holo-spin-rev'} />
    <circle cx="50" cy="50" r="19" fill={accent} fillOpacity={speaking ? 0.34 : 0.18} stroke={accent} strokeWidth="2" className="holo-pulse" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect
        key={i}
        x={35 + i * 6.5}
        y="46"
        width="3.6"
        height="8"
        rx="1.8"
        fill={accent}
        opacity={speaking ? 0.98 : 0.65}
        className={speaking ? 'holo-wave' : ''}
        style={{ animationDelay: `${i * 0.11}s`, transformOrigin: `${36.8 + i * 6.5}px 50px` }}
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
  /** Model replies that arrived while an alarm was on screen: shown when their event comes up again. */
  const readyRepliesRef = useRef(new Map<string, MentorReply>());
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
  const [collapsed, setCollapsed] = useState(true);
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
      mentorVoice.setNeural(st.online ? st.voice : null);
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
      // Alarms are composed offline (instant), so they may jump in while the model is still thinking.
      const ownsLock = !processingRef.current;
      if (!ownsLock && event.kind !== 'alarm') {
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
        const key = eventKey(event);
        const ready = readyRepliesRef.current.get(key);
        if (ready) {
          readyRepliesRef.current.delete(key);
          reply = ready;
        } else if (ownsLock && srv.online && MODEL_KINDS.has(event.kind) && (srv.backend !== 'offline' || event.kind === 'question')) {
          const prevStage = stageRef.current;
          const askedAt = Date.now();
          setStage('thinking');
          // Free questions are grounded on the closest verified card, so "¿Sabías que…?" stays on topic.
          const ground = card ?? (event.kind === 'question' ? searchCards(event.text ?? '', l) : undefined);
          const { reply: r, failed } = await askMentorServer(
            {
              event,
              lang: l,
              telemetry: tele,
              history: historyRef.current.slice(-6),
              card: ground
                ? {
                    say: ground.say[l],
                    fact: ground.fact[l],
                    source: ground.source,
                    simple: ground.simple?.[l],
                    ragQuery: ground.ragQuery,
                    tone: ground.tone,
                  }
                : undefined,
            },
            MODEL_TIMEOUT_MS
          );
          if (r) reply = r;
          else if (failed) {
            serverRef.current = { ...serverRef.current, online: false };
            setServer(serverRef.current);
          }
          if (shownAtRef.current > askedAt && reply) {
            // An alarm took the screen while the model was thinking: keep this answer for right after it.
            readyRepliesRef.current.set(key, reply);
            queueRef.current = [{ event, priority: priorityOf(event) }, ...queueRef.current];
            return;
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
        if (ownsLock) processingRef.current = false;
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
      if (pausedRef.current) return;
      const head = queueRef.current[0];
      if (!head) return;
      if (processingRef.current) {
        // While the model thinks only an alarm may cut in (crew safety first).
        if (head.event.kind === 'alarm') {
          queueRef.current.shift();
          void handleEvent(head.event);
        }
        return;
      }
      const urgent = head.priority <= PRIORITY.alarm;
      const waitingAnswer = stageRef.current === 'check' || stageRef.current === 'quiz';
      // Decisions may cut a long message short once it has been on screen for a few seconds.
      const canCut = head.priority <= PRIORITY.decision && now - shownAtRef.current >= 4000 && shownRef.current?.reply.mode !== 'crisis';
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
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const typingDone = !!shown && typed >= shown.reply.say.length;
  const ragDocs = (server.ragDocs ?? 0).toLocaleString('en-US');
  const coreLabel = !server.online
    ? t('Núcleo local: tarjetas NASA verificadas', 'Local core: verified NASA cards')
    : server.backend === 'offline'
      ? t(`Núcleo: biblioteca NASA · ${ragDocs} docs`, `Core: NASA library · ${ragDocs} docs`)
      : t(`Núcleo: AstroCopilot Gemma-4 · ${server.backend}`, `Core: AstroCopilot Gemma-4 · ${server.backend}`);

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

  const orbAccent = mode === 'crisis' ? '#fb7185' : mode === 'safety' ? '#38bdf8' : '#38bdf8';

  return (
    <div
      className="fixed right-2.5 top-[210px] z-30 flex flex-col items-end gap-1.5 max-w-[330px] pointer-events-none"
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Compact glowing circular blue AI orb directly below the minimap */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        {!collapsed && (
          <div className="flex items-center gap-1 rounded-full bg-slate-950/75 border border-sky-400/50 px-2 py-0.5 backdrop-blur-sm">
            <button type="button" onClick={toggleVoice} className="text-[11px] text-sky-200 hover:text-white px-1" title={t('Voz [M]', 'Voice [M]')}>
              {voiceOn ? '🔊' : '🔇'}
            </button>
            <button type="button" onClick={() => setChatOpen((o) => !o)} className="text-[11px] font-mono text-sky-300 hover:text-white px-1" title={t('Chat IA [T]', 'AI Chat [T]')}>
              [T]
            </button>
            <button type="button" onClick={configureServer} className="flex items-center gap-1 text-[10px] font-mono text-sky-300/80 hover:text-white px-1" title={coreLabel}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${server.online ? 'bg-emerald-400' : 'bg-sky-400'}`} />
              AI
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`rounded-full p-1 transition pointer-events-auto backdrop-blur-sm ${
            mode === 'crisis'
              ? 'bg-rose-950/65 border-2 border-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.7)]'
              : 'bg-sky-950/65 border-2 border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.72)] hover:scale-105'
          }`}
          title={t('KATHERINE IA · Clic para opciones o [T] para preguntar', 'KATHERINE AI · Click for options or [T] to talk')}
        >
          <HoloAvatar accent={orbAccent} speaking={speaking} thinking={stage === 'thinking'} compact />
        </button>
      </div>

      {/* AI comments rendered as clean blue text lines (no heavy box obscuring the viewport) */}
      {!paused && stage === 'thinking' && (
        <div className="pointer-events-none text-right pr-2 border-r-2 border-sky-400/75 text-[11px] font-medium text-sky-300 drop-shadow-[0_1px_6px_rgba(2,6,23,0.98)]">
          <span className="italic">{PERSONA_LINES.thinking[lang]}</span>
          <span className="holo-dots" />
        </div>
      )}

      {!paused && stage !== 'thinking' && shown && (
        <div className="pointer-events-auto flex flex-col items-end gap-1 text-right pr-2 border-r-2 border-sky-400/80 bg-slate-950/25 rounded-l px-2 py-1 backdrop-blur-[2px]">
          <p className="text-[11.5px] leading-snug font-medium text-sky-300 drop-shadow-[0_1px_6px_rgba(2,6,23,0.98)] whitespace-pre-wrap">
            {shown.reply.say.slice(0, typed)}
            {!typingDone && <span className="holo-caret">▌</span>}
          </p>
          {typingDone && shown.reply.didYouKnow && (
            <p className="text-[10.5px] leading-snug text-sky-200/90 drop-shadow-[0_1px_5px_rgba(2,6,23,0.98)] holo-fade">
              {shown.reply.didYouKnow}
            </p>
          )}
          {typingDone && shown.reply.check && (
            <p className="text-[11px] font-semibold text-cyan-300 drop-shadow-[0_1px_5px_rgba(2,6,23,0.98)] holo-fade">
              {shown.reply.check}
            </p>
          )}
          {typingDone && stage === 'check' && (
            <div className="flex flex-wrap justify-end gap-1 pt-0.5 holo-fade">
              <button type="button" className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-400/65 text-[10.5px] font-semibold text-sky-200 hover:bg-sky-800/80" onClick={() => answerCheck(true)}>
                [1] {t('Sí, entiendo', 'Yes')}
              </button>
              <button type="button" className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-400/65 text-[10.5px] font-semibold text-sky-200 hover:bg-sky-800/80" onClick={() => answerCheck(false)}>
                [2] {t('Repetir', 'Again')}
              </button>
            </div>
          )}
          {typingDone && stage === 'quiz' && quiz && (
            <div className="flex flex-col items-end gap-1 pt-0.5 holo-fade">
              {quiz.order.map((optIdx, slot) => (
                <button key={slot} type="button" className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-400/65 text-[10.5px] font-semibold text-sky-200 hover:bg-sky-800/80 text-right" onClick={() => answerQuiz(slot)}>
                  [{slot + 1}] {quiz.card.quiz!.options[optIdx][lang]}
                </button>
              ))}
            </div>
          )}
          {typingDone && shown.footer && (
            <div className="text-[10.5px] font-semibold text-cyan-200 drop-shadow-[0_1px_5px_rgba(2,6,23,0.98)] holo-fade">
              {shown.footer}
            </div>
          )}
        </div>
      )}

      {(!collapsed || chatOpen) && (
        <form
          className="pointer-events-auto flex gap-1 w-[260px] bg-slate-950/85 border border-sky-400/60 rounded-lg p-1.5 backdrop-blur-md shadow-lg"
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
                setCollapsed(true);
                e.currentTarget.blur();
              }
            }}
            maxLength={300}
            placeholder={t('Pregúntale a KATHERINE… [T]', 'Ask KATHERINE… [T]')}
            className="flex-1 min-w-0 bg-slate-900/90 border border-sky-500/50 rounded px-2 py-1 text-[11.5px] text-sky-100 placeholder:text-sky-400/60 outline-none focus:border-sky-300"
          />
          {mentorEars.supported && (
            <button type="button" onClick={listen} className={`px-2 py-1 rounded border border-sky-400/50 text-xs text-sky-200 ${listening ? 'holo-listening' : ''}`} title={t('Hablar por micrófono', 'Mic')}>
              🎙
            </button>
          )}
          <button type="submit" className="px-2 py-1 rounded bg-sky-600/80 hover:bg-sky-500 text-xs text-white font-semibold">
            ➤
          </button>
        </form>
      )}
    </div>
  );
};
