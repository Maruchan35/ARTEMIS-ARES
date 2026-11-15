// =============================================================================
// KATHERINE's teaching brain (client side): age levels, concept map with
// prerequisites, and a per-player learner profile (mastery, confusion,
// misconceptions, spaced review). Everything is stored in localStorage and a
// short summary is sent to the model so it can teach at the right level.
// =============================================================================

import type { Bilingual, Lang } from './mentorTypes';

export type AgeLevel = 'explorer' | 'cadet' | 'engineer';

export const LEVELS: { id: AgeLevel; emoji: string; es: string; en: string; ages: string }[] = [
  { id: 'explorer', emoji: '🧒', es: 'Explorador', en: 'Explorer', ages: '6–9' },
  { id: 'cadet', emoji: '🧑‍🚀', es: 'Cadete', en: 'Cadet', ages: '10–14' },
  { id: 'engineer', emoji: '👩‍🔬', es: 'Ingeniero', en: 'Engineer', ages: '15+' },
];

export type ConceptId =
  | 'aire'
  | 'co2'
  | 'agua'
  | 'supervivencia'
  | 'energia'
  | 'radiacion'
  | 'gravedad'
  | 'cuerpo'
  | 'plantas'
  | 'temperatura'
  | 'movilidad'
  | 'comida'
  | 'cohete';

export interface Concept {
  id: ConceptId;
  name: Bilingual;
  prereqs: ConceptId[];
  /** Intro used when the player needs this concept before a harder one (one line per level). */
  intro?: Record<AgeLevel, Bilingual>;
  /** "Explícamelo con tus palabras…" prompt for open answers. */
  explain: Bilingual;
  /** Keywords (accent-free, lowercase) that a good open answer usually mentions. */
  keywords: Record<Lang, string[]>;
}

export const CONCEPTS: Record<ConceptId, Concept> = {
  aire: {
    id: 'aire',
    name: { es: 'Respirar en el espacio', en: 'Breathing in space' },
    prereqs: [],
    intro: {
      explorer: {
        es: 'Antes, algo importante: cuando respiras, tu cuerpo toma oxígeno, que es lo bueno del aire, y saca dióxido de carbono, que es como el aire "usado".',
        en: 'First, something important: when you breathe, your body takes in oxygen, the good part of air, and breathes out carbon dioxide, which is like "used" air.',
      },
      cadet: {
        es: 'Antes, la base: cada respiración toma O₂ y suelta CO₂. En una nave cerrada no hay ventanas que abrir, así que la nave tiene que dar O₂ y quitar el CO₂ todo el tiempo.',
        en: 'First, the basics: every breath takes in O₂ and releases CO₂. A spacecraft is sealed, so the ship must supply O₂ and remove CO₂ all the time.',
      },
      engineer: {
        es: 'Base primero: un astronauta consume cerca de 0.84 kg de O₂ al día y exhala más o menos 1 kg de CO₂. El soporte vital (ECLSS) debe cerrar ese balance de masa sin abrir la cabina.',
        en: 'Basics first: an astronaut consumes about 0.84 kg of O₂ per day and exhales about 1 kg of CO₂. Life support (ECLSS) must close that mass balance in a sealed cabin.',
      },
    },
    explain: {
      es: '¿Por qué una nave necesita quitar el CO₂ del aire?',
      en: 'Why does a spacecraft need to remove CO₂ from the air?',
    },
    keywords: {
      es: ['co2', 'dioxido', 'oxigeno', 'respir', 'exhal', 'acumul', 'cerrad', 'aire'],
      en: ['co2', 'dioxide', 'oxygen', 'breath', 'exhal', 'build', 'sealed', 'air'],
    },
  },
  co2: {
    id: 'co2',
    name: { es: 'Filtros de CO₂', en: 'CO₂ scrubbers' },
    prereqs: ['aire'],
    explain: { es: '¿Qué hace un filtro de CO₂ y qué pasa si se satura?', en: 'What does a CO₂ scrubber do and what happens if it fills up?' },
    keywords: {
      es: ['filtro', 'atrap', 'absorb', 'lioh', 'satur', 'cambi', 'co2', 'acumul'],
      en: ['filter', 'scrub', 'absorb', 'lioh', 'satur', 'replace', 'co2', 'build'],
    },
  },
  agua: {
    id: 'agua',
    name: { es: 'Reciclar el agua', en: 'Recycling water' },
    prereqs: [],
    intro: {
      explorer: {
        es: 'Antes, algo curioso: en el espacio no hay ríos ni lluvia, así que los astronautas limpian y vuelven a usar casi toda su agua.',
        en: 'First, a fun fact: in space there are no rivers or rain, so astronauts clean and reuse almost all their water.',
      },
      cadet: {
        es: 'Antes, la base: llevar agua desde la Tierra es carísimo, por eso la nave recicla la orina, el sudor y la humedad del aire para volver a beberlos.',
        en: 'First, the basics: launching water from Earth is very expensive, so the ship recycles urine, sweat and air humidity into drinking water again.',
      },
      engineer: {
        es: 'Base primero: cada kilogramo lanzado cuesta miles de dólares. Por eso la ISS cierra el ciclo del agua: destilación de orina, filtrado y oxidación catalítica, hasta recuperar cerca del 98 %.',
        en: 'Basics first: every kilogram launched costs thousands of dollars, so the ISS closes the water loop with urine distillation, filtration and catalytic oxidation, reaching about 98 % recovery.',
      },
    },
    explain: { es: '¿Por qué los astronautas reciclan el agua en vez de llevar más?', en: 'Why do astronauts recycle water instead of bringing more?' },
    keywords: {
      es: ['recicl', 'orina', 'sudor', 'peso', 'caro', 'cost', 'lanz', 'limpi', 'reus'],
      en: ['recycl', 'urine', 'sweat', 'weight', 'expens', 'cost', 'launch', 'clean', 'reus'],
    },
  },
  supervivencia: {
    id: 'supervivencia',
    name: { es: 'Qué cuidar primero', en: 'What to protect first' },
    prereqs: ['aire', 'agua'],
    explain: {
      es: 'Si todo falla al mismo tiempo, ¿qué cuidas primero y por qué?',
      en: 'If everything fails at once, what do you protect first and why?',
    },
    keywords: {
      es: ['aire', 'minuto', 'agua', 'dia', 'comida', 'semana', 'primero', 'oxigeno'],
      en: ['air', 'minute', 'water', 'day', 'food', 'week', 'first', 'oxygen'],
    },
  },
  energia: {
    id: 'energia',
    name: { es: 'Energía en la Luna y Marte', en: 'Power on the Moon and Mars' },
    prereqs: [],
    intro: {
      explorer: {
        es: 'Antes, algo clave: todo en la base usa electricidad, y de noche o con polvo los paneles solares casi no dan energía.',
        en: 'First, something key: everything in the base runs on electricity, and at night or in dust storms solar panels barely work.',
      },
      cadet: {
        es: 'Antes, la base: la noche lunar dura unos 14 días terrestres, así que los paneles solares necesitan baterías enormes o una fuente que no dependa del Sol.',
        en: 'First, the basics: a lunar night lasts about 14 Earth days, so solar panels need huge batteries or a power source that does not depend on the Sun.',
      },
      engineer: {
        es: 'Base primero: con unos 354 horas de oscuridad lunar, almacenar energía en baterías pesa demasiado. Un reactor de fisión pequeño como Kilopower entrega potencia continua sin importar el Sol.',
        en: 'Basics first: with about 354 hours of lunar darkness, battery storage becomes too heavy; a small fission reactor like Kilopower delivers continuous power regardless of sunlight.',
      },
    },
    explain: { es: '¿Por qué un reactor ayuda más que los paneles solares durante la noche lunar?', en: 'Why does a reactor help more than solar panels during the lunar night?' },
    keywords: {
      es: ['noche', 'sol', 'bateri', 'reactor', 'continu', 'polvo', 'panel', 'oscur'],
      en: ['night', 'sun', 'batter', 'reactor', 'continu', 'dust', 'panel', 'dark'],
    },
  },
  radiacion: {
    id: 'radiacion',
    name: { es: 'Radiación y blindaje', en: 'Radiation and shielding' },
    prereqs: [],
    explain: { es: '¿Cómo protege a la tripulación el regolito o el agua durante una tormenta solar?', en: 'How does regolith or water protect the crew during a solar storm?' },
    keywords: {
      es: ['blind', 'regolit', 'agua', 'protege', 'particul', 'tormenta', 'capa', 'absorb'],
      en: ['shield', 'regolith', 'water', 'protect', 'particle', 'storm', 'layer', 'absorb'],
    },
  },
  gravedad: {
    id: 'gravedad',
    name: { es: 'Gravedad, masa y peso', en: 'Gravity, mass and weight' },
    prereqs: [],
    intro: {
      explorer: {
        es: 'Antes, un secreto: en la Luna pesas menos y brincas más alto, pero tu cuerpo sigue siendo igual de grande.',
        en: 'First, a secret: on the Moon you weigh less and jump higher, but your body is just as big as before.',
      },
      cadet: {
        es: 'Antes, la base: la gravedad lunar es como 1/6 de la de la Tierra. Tu peso baja, pero tu masa es la misma, así que cuesta igual frenar o empujar cosas.',
        en: 'First, the basics: lunar gravity is about 1/6 of Earth’s. Your weight drops but your mass stays the same, so stopping or pushing things takes the same effort.',
      },
      engineer: {
        es: 'Base primero: g lunar es 1.62 m/s², un 16.5 % de la terrestre. El peso (m·g) baja, pero la inercia (m) no, y además disminuye la tracción, que depende de la fuerza normal.',
        en: 'Basics first: lunar g is 1.62 m/s², 16.5 % of Earth’s. Weight (m·g) drops, but inertia (m) does not, and traction drops too because it depends on the normal force.',
      },
    },
    explain: { es: '¿Por qué en la Luna pesas menos pero cuesta igual frenar?', en: 'Why do you weigh less on the Moon but stopping is just as hard?' },
    keywords: {
      es: ['masa', 'peso', 'gravedad', 'inercia', 'igual', 'sexto', 'frenar', 'friccion'],
      en: ['mass', 'weight', 'gravity', 'inertia', 'same', 'sixth', 'stop', 'friction'],
    },
  },
  cuerpo: {
    id: 'cuerpo',
    name: { es: 'El cuerpo en el espacio', en: 'The body in space' },
    prereqs: [],
    explain: { es: '¿Por qué los astronautas hacen ejercicio todos los días?', en: 'Why do astronauts exercise every day?' },
    keywords: { es: ['hueso', 'musculo', 'debil', 'gravedad', 'ejercicio', 'perder', 'sano'], en: ['bone', 'muscle', 'weak', 'gravity', 'exercise', 'lose', 'healthy'] },
  },
  plantas: {
    id: 'plantas',
    name: { es: 'Plantas que dan aire y comida', en: 'Plants that give air and food' },
    prereqs: ['aire'],
    explain: { es: '¿Cómo ayudan las plantas a la tripulación además de dar comida?', en: 'How do plants help the crew besides giving food?' },
    keywords: { es: ['oxigeno', 'co2', 'luz', 'fotosintesis', 'comida', 'aire', 'absorb'], en: ['oxygen', 'co2', 'light', 'photosynth', 'food', 'air', 'absorb'] },
  },
  temperatura: {
    id: 'temperatura',
    name: { es: 'Calor y radiadores', en: 'Heat and radiators' },
    prereqs: [],
    explain: { es: '¿Por qué una nave necesita radiadores si el espacio es frío?', en: 'Why does a spacecraft need radiators if space is cold?' },
    keywords: { es: ['calor', 'radiador', 'vacio', 'aire', 'equipo', 'sacar', 'enfri'], en: ['heat', 'radiator', 'vacuum', 'air', 'equipment', 'remove', 'cool'] },
  },
  movilidad: {
    id: 'movilidad',
    name: { es: 'Rover y caminatas', en: 'Rovers and EVAs' },
    prereqs: ['energia'],
    explain: { es: '¿Por qué un rover no debe alejarse más de lo que puedes regresar caminando?', en: 'Why should a rover never go farther than you can walk back?' },
    keywords: { es: ['regres', 'camin', 'falla', 'oxigeno', 'distancia', 'segur', 'traje'], en: ['return', 'walk', 'fail', 'oxygen', 'distance', 'safe', 'suit'] },
  },
  comida: {
    id: 'comida',
    name: { es: 'Comida espacial', en: 'Space food' },
    prereqs: [],
    explain: { es: '¿Por qué la comida espacial no puede hacer migajas?', en: 'Why can’t space food make crumbs?' },
    keywords: { es: ['migaja', 'flot', 'equipo', 'ojos', 'tortilla', 'pan'], en: ['crumb', 'float', 'equipment', 'eyes', 'tortilla', 'bread'] },
  },
  cohete: {
    id: 'cohete',
    name: { es: 'El lanzamiento', en: 'The launch' },
    prereqs: [],
    explain: { es: '¿Por qué cada kilo extra en el cohete importa tanto?', en: 'Why does every extra kilogram on the rocket matter so much?' },
    keywords: { es: ['peso', 'combustible', 'caro', 'masa', 'kilo', 'cost'], en: ['weight', 'fuel', 'expens', 'mass', 'kilo', 'cost'] },
  },
};

/** Which concept each verified card teaches. */
export const CARD_CONCEPT: Record<string, ConceptId> = {
  eclss_closed_regen: 'agua',
  eclss_open_lioh: 'co2',
  power_fsp_40kw: 'energia',
  power_solar_only: 'energia',
  rover_kilopower_rover: 'movilidad',
  rover_rtg_solar_rover: 'movilidad',
  crisis_water_priority: 'supervivencia',
  crisis_food_priority: 'supervivencia',
  act1_duct_tape_patch: 'co2',
  act1_cdra_reroute: 'co2',
  act2_krusty_spe: 'energia',
  act2_solar_ration: 'energia',
  act3_isolate_bios3: 'plantas',
  act3_vent_compost: 'plantas',
  act4_shield_2m_rover: 'radiacion',
  act4_unshielded_dash: 'radiacion',
  alarm_co2: 'co2',
  alarm_o2: 'aire',
  alarm_temp: 'temperatura',
  alarm_radiation: 'radiacion',
  alarm_battery: 'energia',
  alarm_water: 'agua',
  mission_tutorial_hab: 'cuerpo',
  mission_manifest_launch: 'cohete',
  mission_act1_2_surface: 'gravedad',
  mission_act3_greenhouse: 'plantas',
  mission_act4_storm_rover: 'radiacion',
  obj_sleepCompleted: 'cuerpo',
  obj_exerciseCalibrated: 'cuerpo',
  obj_whcInspected: 'agua',
  obj_evaChecked: 'movilidad',
  obj_powerRestored: 'energia',
  obj_eclssCleaned: 'co2',
  obj_mealPrepared: 'comida',
  obj_viewportOpened: 'cohete',
  obj_launchCompleted: 'cohete',
  obj_aphHarvested: 'plantas',
  obj_bios3Activated: 'plantas',
  obj_roverReturned: 'movilidad',
};

// ------------------------------------------------------------------ learner profile
interface ConceptState {
  mastery: number; // 0..1
  seen: number;
  correct: number;
  wrong: number;
  confused: number;
  introduced: boolean;
  explainedByPlayer: boolean;
  lastSeen: number;
}

export interface LearnerProfile {
  level: AgeLevel | null;
  concepts: Partial<Record<ConceptId, ConceptState>>;
  misconceptions: string[];
  /** Consecutive misses / hits across concepts (adaptive level). */
  missStreak: number;
  hitStreak: number;
}

const KEY = 'astro.learnerProfile';
const empty = (): LearnerProfile => ({ level: null, concepts: {}, misconceptions: [], missStreak: 0, hitStreak: 0 });

function load(): LearnerProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty(), ...(JSON.parse(raw) as Partial<LearnerProfile>) };
  } catch {
    /* ignore */
  }
  return empty();
}

let profile = load();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
};

function state(id: ConceptId): ConceptState {
  const s = profile.concepts[id] ?? { mastery: 0, seen: 0, correct: 0, wrong: 0, confused: 0, introduced: false, explainedByPlayer: false, lastSeen: 0 };
  profile.concepts[id] = s;
  return s;
}

const LEVEL_ORDER: AgeLevel[] = ['explorer', 'cadet', 'engineer'];

export const learner = {
  profile: () => profile,
  level: (): AgeLevel => profile.level ?? 'cadet',
  hasChosenLevel: () => profile.level !== null,

  setLevel(level: AgeLevel) {
    profile.level = level;
    profile.missStreak = 0;
    profile.hitStreak = 0;
    save();
  },

  conceptOf(cardId: string): ConceptId | undefined {
    return CARD_CONCEPT[cardId];
  },

  /** First prerequisite of `id` the player has not been introduced to (and does not master yet). */
  missingPrereq(id: ConceptId): ConceptId | undefined {
    return CONCEPTS[id].prereqs.find((p) => {
      const s = profile.concepts[p];
      return CONCEPTS[p].intro && !(s && (s.introduced || s.mastery >= 0.5));
    });
  },

  markIntroduced(id: ConceptId) {
    state(id).introduced = true;
    save();
  },

  noteSeen(id: ConceptId) {
    const s = state(id);
    s.seen += 1;
    s.lastSeen = Date.now();
    s.mastery = Math.min(1, s.mastery + 0.05);
    save();
  },

  /** Quiz or open-answer result. Returns a level change if the player should move up/down. */
  recordAnswer(id: ConceptId, correct: boolean, weight = 1): AgeLevel | null {
    const s = state(id);
    s.lastSeen = Date.now();
    if (correct) {
      s.correct += 1;
      s.mastery = Math.min(1, s.mastery + 0.3 * weight);
      profile.hitStreak += 1;
      profile.missStreak = 0;
    } else {
      s.wrong += 1;
      s.mastery = Math.max(0, s.mastery - 0.2 * weight);
      profile.missStreak += 1;
      profile.hitStreak = 0;
    }
    let change: AgeLevel | null = null;
    const i = LEVEL_ORDER.indexOf(learner.level());
    if (profile.missStreak >= 2 && i > 0) change = LEVEL_ORDER[i - 1];
    else if (profile.hitStreak >= 4 && i < LEVEL_ORDER.length - 1) change = LEVEL_ORDER[i + 1];
    if (change) {
      profile.level = change;
      profile.missStreak = 0;
      profile.hitStreak = 0;
    }
    save();
    return change;
  },

  recordConfusion(id: ConceptId) {
    const s = state(id);
    s.confused += 1;
    s.mastery = Math.max(0, s.mastery - 0.1);
    save();
  },

  markExplained(id: ConceptId) {
    state(id).explainedByPlayer = true;
    save();
  },

  shouldAskExplain(id: ConceptId): boolean {
    const s = profile.concepts[id];
    return learner.level() !== 'explorer' && !!s && s.mastery >= 0.3 && !s.explainedByPlayer;
  },

  addMisconception(text: string) {
    const t = text.trim().slice(0, 160);
    if (!t || profile.misconceptions.includes(t)) return;
    profile.misconceptions = [...profile.misconceptions, t].slice(-5);
    save();
  },

  /** A concept worth reviewing now: partly learned and not seen for a few minutes. */
  dueReview(now = Date.now()): ConceptId | undefined {
    const due = (Object.entries(profile.concepts) as [ConceptId, ConceptState][])
      .filter(([, s]) => s.mastery > 0.15 && s.mastery < 0.85 && now - s.lastSeen > 4 * 60_000)
      .sort((a, b) => a[1].mastery - b[1].mastery);
    return due[0]?.[0];
  },

  /** Compact summary sent to the model with every request. */
  summary() {
    const entries = Object.entries(profile.concepts) as [ConceptId, ConceptState][];
    return {
      level: learner.level(),
      mastered: entries.filter(([, s]) => s.mastery >= 0.7).map(([id]) => id),
      struggling: entries.filter(([, s]) => s.wrong + s.confused >= 2 && s.mastery < 0.5).map(([id]) => id),
      misconceptions: profile.misconceptions.slice(-3),
    };
  },

  reset() {
    profile = empty();
    save();
  },
};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Offline grading of an open answer: how many key ideas it mentions. */
export function gradeOpenAnswer(id: ConceptId, answer: string, lang: Lang): 'good' | 'partial' | 'miss' {
  const a = norm(answer);
  const hits = CONCEPTS[id].keywords[lang].filter((k) => a.includes(k)).length;
  if (hits >= 2) return 'good';
  if (hits === 1) return 'partial';
  return 'miss';
}
