// Pre-generated, human-reviewed teaching lines (ai_bridge/colab_pregen.py → src/ai/generated/tutorContent.json).
// The neural model writes level-specific explanations ahead of time on Colab; a person approves them; the game
// then serves them instantly and offline. Only entries with "approved": true are used.
import data from './generated/tutorContent.json';
import type { AgeLevel } from './learner';
import type { Lang } from './mentorTypes';

export interface TutorLine {
  say?: string;
  analogy?: string;
  check?: string;
  approved?: boolean;
}

const ENTRIES = (data as { entries: Record<string, TutorLine> }).entries;

export function tutorLine(cardId: string, level: AgeLevel, lang: Lang): TutorLine | undefined {
  const e = ENTRIES[`${cardId}.${level}.${lang}`];
  return e && e.approved ? e : undefined;
}
