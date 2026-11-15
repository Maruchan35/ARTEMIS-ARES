// =============================================================================
// KATHERINE · IA Mentora — shared types between the game, the offline mentor
// and the AstroCopilot mentor server (ai_bridge/mentor_server.py).
// =============================================================================

export type Lang = 'es' | 'en';

export interface Bilingual {
  es: string;
  en: string;
}

export type MentorEventKind =
  | 'mission_start'
  | 'decision'
  | 'objective'
  | 'alarm'
  | 'hint'
  | 'question'
  | 'explain_again'
  | 'ending';

export type MentorMode = 'socratic' | 'crisis' | 'chat' | 'safety';

export interface MentorQuiz {
  q: Bilingual;
  options: Bilingual[];
  correct: number;
  why: Bilingual;
}

/** A verified teaching card. Every number here comes from src/data/nasaConstants.ts or published NASA history. */
export interface MentorCard {
  id: string;
  tone: 'good' | 'risky' | 'neutral' | 'alarm';
  /** What the player's action/decision means for the mission. */
  say: Bilingual;
  /** "¿Sabías que...?" — real astronaut / NASA history. */
  fact: Bilingual;
  /** Where the fact comes from (shown to the player). */
  source: string;
  /** Simpler analogy for "explícamelo otra vez". */
  simple?: Bilingual;
  /** Optional comprehension quiz after the player says "sí, entiendo". */
  quiz?: MentorQuiz;
  /** English keyword query used by the server's NASA RAG engine. */
  ragQuery: string;
  /** Ask "¿Entiendes la idea?" after this card. */
  askCheck?: boolean;
}

export interface MentorEvent {
  kind: MentorEventKind;
  /** Card id (decision/objective/alarm/mission topics) — empty for free questions. */
  topic: string;
  /** Free text from the player (questions). */
  text?: string;
}

export interface MentorTelemetry {
  missionId: string;
  o2Percent: number;
  co2Ppm: number;
  tempCelsius: number;
  waterLiters: number;
  foodKg: number;
  powerKwe: number;
  batteryPercent: number;
  crewRadiationMsv: number;
  crewMoralePercent: number;
  heartRateBpm: number;
  eclssChoice: string;
  powerChoice: string;
  roverChoice: string;
  decisions: Record<string, string | null>;
  objectivesDone: string[];
  objectivesPending: string[];
}

export interface MentorTurn {
  role: 'mentor' | 'player';
  text: string;
}

export interface MentorReply {
  say: string;
  didYouKnow?: string;
  check?: string;
  sources: string[];
  mode: MentorMode;
  /** 'model' = Gemma-4 AstroCopilot answered; 'card' = verified offline card. */
  origin: 'model' | 'card';
  latencyMs?: number;
}

export interface MentorRequest {
  event: MentorEvent;
  lang: Lang;
  telemetry: MentorTelemetry;
  history: MentorTurn[];
  /** The verified card the game already has for this event: the server grounds the model on it. */
  card?: {
    say: string;
    fact: string;
    source: string;
    simple?: string;
    ragQuery: string;
    tone: MentorCard['tone'];
  };
}
