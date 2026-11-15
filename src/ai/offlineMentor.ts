// =============================================================================
// KATHERINE offline core: persona lines, real-world safety gate and the
// card-based mentor used when the AstroCopilot model server is not reachable.
// =============================================================================

import type { AgeLevel } from './learner';
import { tutorLine } from './tutorContent';
import { MENTOR_CARDS, OBJECTIVE_HINTS, alarmAction } from './mentorKnowledge';
import type { Lang, MentorCard, MentorEvent, MentorReply, MentorTelemetry } from './mentorTypes';

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Persona: holographic tactical AI — confident, quick-witted, warm, protective. Short sentences.
const OPENERS: Record<MentorCard['tone'], Record<Lang, string[]>> = {
  good: {
    es: ['Buena elección, Cadete.', 'Eso es pensar como ingeniero de la NASA.', 'Me gusta cómo piensas.', 'Correcto. Y no lo digo solo porque me caigas bien.'],
    en: ['Good call, Cadet.', 'That is thinking like a NASA engineer.', 'I like the way you think.', 'Correct. And not just because I like you.'],
  },
  risky: {
    es: ['Mmm… decisión valiente. Veamos si también es sabia.', 'Interesante. Arriesgado, pero interesante.', 'Puedo trabajar con eso… aunque no te prometo nada.', 'Anotado. Yo habría elegido distinto, pero aprendamos.'],
    en: ['Hmm… a brave choice. Let us see if it is also a wise one.', 'Interesting. Risky, but interesting.', 'I can work with that… no promises, though.', 'Logged. I would have picked differently, but let us learn.'],
  },
  neutral: {
    es: ['Bien hecho.', 'Sistema verificado.', 'Otro punto para el equipo.', 'Eso es.'],
    en: ['Well done.', 'System verified.', 'Another point for the team.', 'That is it.'],
  },
  alarm: {
    es: ['Cadete, escúchame bien:', 'Alerta. Sin pánico, pero rápido:', 'Esto es un simulacro… pero actúa como si no lo fuera:'],
    en: ['Cadet, listen to me:', 'Alert. No panic, but move fast:', 'This is a drill… but act like it is not:'],
  },
};

export const CHECK_PROMPT: Record<Lang, string[]> = {
  es: ['¿Entiendes la idea?', '¿Tiene sentido para ti?', '¿Me sigues, Cadete?'],
  en: ['Do you get the idea?', 'Does that make sense to you?', 'Are you with me, Cadet?'],
};

export const PERSONA_LINES = {
  understoodYes: {
    es: ['Sabía que lo captarías. Probemos:', 'Excelente. Veamos si de verdad lo dominas:', 'Perfecto. Una pregunta rápida para confirmarlo:'],
    en: ['I knew you would get it. Let us test it:', 'Excellent. Let us see if you really own it:', 'Perfect. One quick question to confirm:'],
  },
  understoodYesNoQuiz: {
    es: ['Perfecto. Sigamos con la misión.', 'Así me gusta. Siguiente objetivo.'],
    en: ['Perfect. Back to the mission.', 'That is what I like to hear. Next objective.'],
  },
  explainAgain: {
    es: ['Tranquilo, lo vemos con otra imagen:', 'Va de nuevo, más sencillo:', 'Sin problema. Piénsalo así:'],
    en: ['No worries, let us picture it differently:', 'Again, simpler this time:', 'No problem. Think of it like this:'],
  },
  stillNo: {
    es: ['No pasa nada: hasta los ingenieros de Houston repasaban sus cálculos. Abre la Nota de Legado con [P] o pregúntame con [T] la parte que no te quede clara.'],
    en: ['That is fine: even Houston engineers double-checked their math. Open the Legacy Note with [P] or ask me with [T] about the part that is unclear.'],
  },
  quizRight: {
    es: ['¡Exacto!', '¡Correcto, Cadete!', 'Bingo. Houston estaría orgulloso.'],
    en: ['Exactly!', 'Correct, Cadet!', 'Bingo. Houston would be proud.'],
  },
  quizWrong: {
    es: ['Casi. La respuesta era otra:', 'No exactamente, pero buen intento:'],
    en: ['Close. The answer was the other one:', 'Not quite, but nice try:'],
  },
  thinking: { es: 'Analizando telemetría…', en: 'Analyzing telemetry…' },
  answerLead: {
    es: ['Buena pregunta. Esto dicen los datos reales:', 'Te lo cuento con datos reales:', 'Revisé mis archivos de la NASA:'],
    en: ['Good question. Here is what the real data says:', 'Let me answer with real data:', 'I checked my NASA files:'],
  },
  idle: {
    es: ['Sigo aquí, Cadete.', 'No me he ido a ningún lado.', 'Te observo… en el buen sentido.'],
    en: ['Still here, Cadet.', 'I have not gone anywhere.', 'I am watching… in a good way.'],
  },
  unknownQuestion: {
    es: 'Esa pregunta necesita mi núcleo completo (el modelo AstroCopilot está desconectado). Mientras tanto, revisa la Terminal de Diagnóstico o la Nota de Legado con [P].',
    en: 'That question needs my full core (the AstroCopilot model is offline). Meanwhile, check the Diagnostic Terminal or the Legacy Note with [P].',
  },
};

// ----------------------------------------------------------------------------
// Real-world safety gate (players are 10-14). Runs before anything else.
// ----------------------------------------------------------------------------
const REAL_WORLD_MARKERS = [
  // ES
  'en la vida real', 'de verdad me', 'fuera del juego', 'no en el juego', 'emergencia real',
  'me duele el pecho', 'dolor de pecho', 'no puedo respirar', 'me desmayo', 'me voy a desmayar', 'estoy sangrando',
  'me quiero morir', 'quiero morirme', 'matarme', 'suicid', 'hacerme daño', 'lastimarme', 'cortarme', 'autolesi',
  'me pegan', 'me están pegando', 'abuso', 'me tragué', 'me trague', 'cloro y amoniaco', 'veneno',
  // EN
  'in real life', 'for real', 'outside the game', 'not in the game', 'real emergency', 'chest pain', 'chest hurts',
  "can't breathe", 'cannot breathe', 'fainting', 'bleeding', 'kill myself', 'want to die', 'suicide', 'self-harm',
  'self harm', 'hurt myself', 'someone is hurting me', 'swallowed', 'bleach and ammonia', 'poison',
];

export function isRealWorldSafetyIssue(text: string): boolean {
  const t = text.toLowerCase();
  return REAL_WORLD_MARKERS.some((m) => t.includes(m));
}

export function safetyReply(lang: Lang): MentorReply {
  return {
    say:
      lang === 'es'
        ? 'Pauso la misión: esto es más importante que el juego. Por favor, avísale ahora mismo a un adulto de confianza (mamá, papá, tutor o maestro). Si es una emergencia, llama al 911. Si te sientes muy mal por dentro, en México puedes llamar gratis a la Línea de la Vida: 800 911 2000.'
        : 'Pausing the mission: this matters more than the game. Please tell a trusted adult right now (a parent, guardian or teacher). If it is an emergency, call your local emergency number (911 in the US and Mexico, 112 in Europe).',
    sources: ['Real-world safety protocol'],
    mode: 'safety',
    origin: 'card',
  };
}

// ----------------------------------------------------------------------------
// Card-based replies
// ----------------------------------------------------------------------------
export function cardFor(event: MentorEvent): MentorCard | undefined {
  return MENTOR_CARDS[event.topic];
}

function alarmValue(alarmId: string, t: MentorTelemetry): string {
  switch (alarmId) {
    case 'alarm_co2':
      return `(${Math.round(t.co2Ppm).toLocaleString('en-US')} ppm)`;
    case 'alarm_o2':
      return `(${t.o2Percent.toFixed(1)}%)`;
    case 'alarm_temp':
      return `(${t.tempCelsius.toFixed(1)} °C)`;
    case 'alarm_radiation':
      return `(${Math.round(t.crewRadiationMsv)} mSv)`;
    case 'alarm_battery':
      return `(${Math.round(t.batteryPercent)}%)`;
    case 'alarm_water':
      return `(${t.waterLiters.toFixed(1)} L)`;
    default:
      return '';
  }
}

/** Shorter, friendlier check-ins for the youngest players. */
const CHECK_PROMPT_EXPLORER: Record<Lang, string[]> = {
  es: ['¿Me entendiste?', '¿Lo ves, explorador?', '¿Tiene sentido?'],
  en: ['Did you get it?', 'See it, explorer?', 'Makes sense?'],
};

/** Small talk KATHERINE must handle even without the model (name, who she is, greetings, thanks). */
const PERSONA_QA: { re: RegExp; es: string; en: string }[] = [
  {
    re: /(c[oó]mo te llamas|tu nombre|qui[eé]n eres|qu[eé] eres|what('?s| is) your name|who are you|what are you)/i,
    es: 'Soy KATHERINE, la IA mentora de la misión AETHER-4. Te acompaño en cada decisión con datos reales de la NASA y te explico paso a paso cómo sobrevive una tripulación en el espacio.',
    en: "I'm KATHERINE, the AETHER-4 mission's AI mentor. I guide you through every decision with real NASA data and explain, step by step, how a crew survives in space.",
  },
  {
    re: /(qu[eé] puedes hacer|en qu[eé] me ayudas|c[oó]mo me ayudas|what can you do|how can you help)/i,
    es: 'Te explico cada decisión, te cuento cómo lo vivieron astronautas reales y te hago preguntas para que lo entiendas de verdad. Pregúntame del aire, el agua, la energía o la radiación, o presiona [T] cuando quieras.',
    en: 'I explain each decision, tell you how real astronauts lived it and ask you questions so you truly understand. Ask me about air, water, power or radiation, or press [T] anytime.',
  },
  {
    re: /^\s*(hola|holi|buenas|hey|hi|hello)\b[\s!¡.,?]*$/i,
    es: '¡Hola, cadete! Aquí KATHERINE. ¿Qué quieres saber de la misión?',
    en: "Hi, cadet! KATHERINE here. What would you like to know about the mission?",
  },
  {
    re: /(gracias|thank)/i,
    es: '¡Con gusto, cadete! Sigue así: cada decisión que entiendes te acerca a volver a casa.',
    en: "You're welcome, cadet! Keep it up: every decision you understand brings you closer to home.",
  },
];

export function personaReply(text: string, lang: Lang): MentorReply | null {
  const hit = PERSONA_QA.find((q) => q.re.test(text));
  return hit ? { say: hit[lang], sources: [], mode: 'chat', origin: 'card' } : null;
}

/**
 * Builds KATHERINE's reply from the verified cards, adapted to the player's age level:
 * explorer → the simple analogy first; cadet → meaning + fact; engineer → meaning + numbers.
 * Pre-generated, human-approved lines (tutorContent.json) win when they exist.
 */
export function composeOfflineReply(event: MentorEvent, lang: Lang, t: MentorTelemetry, level: AgeLevel = 'cadet'): MentorReply | null {
  if (event.kind === 'question') {
    const text = event.text ?? '';
    if (isRealWorldSafetyIssue(text)) return safetyReply(lang);
    const persona = personaReply(text, lang);
    if (persona) return persona;
    const hit = searchCards(text, lang);
    if (!hit) return { say: PERSONA_LINES.unknownQuestion[lang], sources: [], mode: 'chat', origin: 'card' };
    return {
      say: `${pick(PERSONA_LINES.answerLead[lang])} ${hit.fact[lang]}`,
      check: hit.quiz ? hit.quiz.q[lang] : undefined,
      sources: [hit.source],
      mode: 'chat',
      origin: 'card',
    };
  }

  if (event.kind === 'hint') {
    const h = OBJECTIVE_HINTS[event.topic];
    if (!h) return null;
    return { say: `${pick(PERSONA_LINES.idle[lang])} ${h[lang]}`, sources: [], mode: 'socratic', origin: 'card' };
  }

  const card = cardFor(event);
  if (!card) return null;

  if (event.kind === 'explain_again') {
    const pre = tutorLine(card.id, level, lang);
    return {
      say: `${pick(PERSONA_LINES.explainAgain[lang])} ${pre?.analogy ?? (card.simple ?? card.say)[lang]}`,
      check: lang === 'es' ? '¿Ahora sí tiene más sentido?' : 'Does it make more sense now?',
      sources: [card.source],
      mode: 'socratic',
      origin: 'card',
    };
  }

  if (event.kind === 'alarm') {
    return {
      say: `${pick(OPENERS.alarm[lang])} ${card.say[lang]} ${alarmValue(card.id, t)} ${alarmAction(card.id, t.missionId, lang)}`,
      didYouKnow: card.fact[lang],
      sources: [card.source],
      mode: 'crisis',
      origin: 'card',
    };
  }

  const opener = event.kind === 'mission_start' ? '' : `${pick(OPENERS[card.tone][lang])} `;
  const pre = tutorLine(card.id, level, lang);
  const body = pre?.say ?? (level === 'explorer' && card.simple ? card.simple[lang] : card.say[lang]);
  const checks = level === 'explorer' ? CHECK_PROMPT_EXPLORER[lang] : CHECK_PROMPT[lang];
  return {
    say: `${opener}${body}`,
    didYouKnow: card.fact[lang],
    check: card.askCheck ? pre?.check ?? pick(checks) : undefined,
    sources: [card.source],
    mode: 'socratic',
    origin: 'card',
  };
}

// Very small keyword search over the verified cards for offline free-text questions.
const STOP = new Set(
  'el la los las un una de del y o que por para con en es son se como qué que cual cuál porque por qué the a an of and or to in on is are why how what does do with for'.split(' ')
);
const SYNONYMS: Record<string, string[]> = {
  oxigeno: ['o₂', 'oxygen', 'aire', 'hipoxia'],
  oxygen: ['o₂', 'air', 'hypoxia'],
  co2: ['co₂', 'lioh', 'filtro', 'filter'],
  agua: ['water', 'orina', 'reciclaje'],
  energia: ['energía', 'reactor', 'solar', 'kwe', 'batería'],
  energy: ['power', 'reactor', 'solar', 'kwe', 'battery'],
  radiacion: ['radiación', 'tormenta', 'regolito', 'msv'],
  radiation: ['storm', 'regolith', 'msv'],
  huesos: ['hueso', 'ejercicio', 'caminadora'],
  bones: ['bone', 'exercise', 'treadmill'],
  plantas: ['lechuga', 'invernadero', 'veggie', 'aph', 'cosecha'],
  plants: ['lettuce', 'greenhouse', 'veggie', 'aph', 'harvest'],
  comida: ['food', 'tortilla', 'ración', 'deshidratada'],
  calor: ['temperatura', 'skylab', 'radiador', 'térmico'],
  heat: ['temperature', 'skylab', 'radiator', 'thermal'],
  gravedad: ['gravity', 'inercia', 'masa', 'peso', 'luna'],
  gravity: ['inertia', 'mass', 'weight', 'moon'],
  rover: ['apollo', 'rtg', 'kilopower'],
  dormir: ['sueño', 'litera', 'sleep'],
};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function searchCards(question: string, lang: Lang): MentorCard | undefined {
  const words = norm(question)
    .split(/[^a-z0-9₂]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) return undefined;
  const expanded = new Set(words);
  for (const w of words) for (const s of SYNONYMS[w] ?? []) expanded.add(norm(s));
  let best: { card: MentorCard; score: number } | undefined;
  for (const card of Object.values(MENTOR_CARDS)) {
    if (card.tone === 'alarm') continue;
    const hay = norm(`${card.say[lang]} ${card.fact[lang]} ${card.ragQuery}`);
    let score = 0;
    for (const w of expanded) if (hay.includes(w)) score += w.length > 4 ? 2 : 1;
    if (!best || score > best.score) best = { card, score };
  }
  return best && best.score >= 3 ? best.card : undefined;
}
