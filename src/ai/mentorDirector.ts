// =============================================================================
// KATHERINE director: watches the simulation state and turns what the player
// does into teaching moments (decisions, objectives, alarms, mission starts,
// idle hints). Pure logic — no React — so it is easy to test and extend.
// =============================================================================

import type { SpaceRoomState, RoomObjectiveProgress } from '../game/spaceRoomSimulation';
import { MENTOR_CARDS } from './mentorKnowledge';
import type { MentorEvent, MentorTelemetry } from './mentorTypes';

export interface QueuedMentorEvent {
  event: MentorEvent;
  /** Lower = more urgent. */
  priority: number;
}

export const PRIORITY = { question: 0, alarm: 1, decision: 2, ending: 2, mission_start: 3, objective: 4, hint: 5 } as const;

export const MISSION_OBJECTIVES: Record<string, (keyof RoomObjectiveProgress)[]> = {
  tutorial_hab: ['sleepCompleted', 'exerciseCalibrated', 'whcInspected', 'evaChecked', 'powerRestored', 'eclssCleaned', 'mealPrepared', 'crisisSolved'],
  manifest_launch: ['manifestConfigured', 'launchCompleted'],
  act1_2_surface: ['thermalFixed', 'powerBalanced'],
  act3_greenhouse: ['aphHarvested', 'compostIsolated', 'bios3Activated'],
  act4_storm_rover: ['roverReturned', 'regolithDeployed'],
};

interface AlarmRule {
  id: string;
  on: (s: SpaceRoomState) => boolean;
  off: (s: SpaceRoomState) => boolean;
}

// Thresholds tuned to the simulation's real ranges (see stepSpaceRoomSimulation).
export const ALARM_RULES: AlarmRule[] = [
  { id: 'alarm_co2', on: (s) => s.co2Ppm >= 1200, off: (s) => s.co2Ppm < 1000 },
  { id: 'alarm_o2', on: (s) => s.o2Percent < 19.6, off: (s) => s.o2Percent >= 20.0 },
  { id: 'alarm_temp', on: (s) => s.tempCelsius >= 30, off: (s) => s.tempCelsius < 27 },
  { id: 'alarm_radiation', on: (s) => s.crewRadiationMsv >= 150, off: (s) => s.crewRadiationMsv < 120 },
  { id: 'alarm_battery', on: (s) => s.batteryPercent < 30, off: (s) => s.batteryPercent >= 45 },
  { id: 'alarm_water', on: (s) => s.waterLiters < 40, off: (s) => s.waterLiters >= 50 },
];

type DecisionField = 'crisisDecision' | 'act1Decision' | 'act2Decision' | 'act3Decision' | 'act4Decision';
const DECISION_FIELDS: Record<DecisionField, string> = {
  crisisDecision: 'crisis',
  act1Decision: 'act1',
  act2Decision: 'act2',
  act3Decision: 'act3',
  act4Decision: 'act4',
};
type ManifestField = 'eclssChoice' | 'powerChoice' | 'roverChoice';
const MANIFEST_FIELDS: Record<ManifestField, string> = { eclssChoice: 'eclss', powerChoice: 'power', roverChoice: 'rover' };

interface Snapshot {
  missionId: string;
  elapsedSec: number;
  manifest: Record<ManifestField, string>;
  decisions: Record<DecisionField, string | null>;
  endingId: string | null;
  objectives: Record<string, boolean>;
}

function snap(s: SpaceRoomState): Snapshot {
  return {
    missionId: s.currentMissionId,
    elapsedSec: s.elapsedSec,
    manifest: { eclssChoice: s.eclssChoice, powerChoice: s.powerChoice, roverChoice: s.roverChoice },
    decisions: {
      crisisDecision: s.crisisDecision,
      act1Decision: s.act1Decision,
      act2Decision: s.act2Decision,
      act3Decision: s.act3Decision,
      act4Decision: s.act4Decision,
    },
    endingId: s.endingId,
    objectives: { ...s.objectives },
  };
}

export class MentorDirector {
  private prev: Snapshot | null = null;
  private manifestPending: Partial<Record<ManifestField, { value: string; at: number }>> = {};
  private manifestAnnounced: Partial<Record<ManifestField, string>> = {};
  private alarmArmed: Record<string, boolean> = {};
  private alarmLastAt: Record<string, number> = {};
  private lastProgressAt = 0;
  private lastHintAt = 0;
  private hintCount: Record<string, number> = {};

  static readonly MANIFEST_DEBOUNCE_MS = 2500;
  static readonly ALARM_COOLDOWN_MS = 90_000;
  static readonly IDLE_HINT_MS = 75_000;

  /** Call when the player does anything meaningful (asks, answers) to postpone idle hints. */
  noteActivity(nowMs: number) {
    this.lastProgressAt = nowMs;
  }

  tick(s: SpaceRoomState, nowMs: number): QueuedMentorEvent[] {
    const out: QueuedMentorEvent[] = [];
    const cur = snap(s);
    const prev = this.prev;

    // New mission (or re-entered the same one): reset baselines and brief the player.
    if (!prev || prev.missionId !== cur.missionId || cur.elapsedSec + 1 < prev.elapsedSec) {
      this.prev = cur;
      this.manifestPending = {};
      this.manifestAnnounced = { ...cur.manifest };
      for (const r of ALARM_RULES) this.alarmArmed[r.id] = true;
      this.lastProgressAt = nowMs;
      this.lastHintAt = nowMs;
      this.hintCount = {};
      out.push(ev('mission_start', `mission_${cur.missionId}`));
      return out;
    }

    // One-shot decisions (crisis + acts).
    for (const f of Object.keys(DECISION_FIELDS) as DecisionField[]) {
      const v = cur.decisions[f];
      if (v && v !== prev.decisions[f]) {
        out.push(ev('decision', `${DECISION_FIELDS[f]}_${v}`));
        this.lastProgressAt = nowMs;
      }
    }

    // Manifest toggles: players cycle through options, so wait until they settle.
    for (const f of Object.keys(MANIFEST_FIELDS) as ManifestField[]) {
      if (cur.manifest[f] !== prev.manifest[f]) this.manifestPending[f] = { value: cur.manifest[f], at: nowMs };
      const p = this.manifestPending[f];
      if (p && nowMs - p.at >= MentorDirector.MANIFEST_DEBOUNCE_MS) {
        delete this.manifestPending[f];
        if (p.value === cur.manifest[f] && p.value !== this.manifestAnnounced[f]) {
          this.manifestAnnounced[f] = p.value;
          out.push(ev('decision', `${MANIFEST_FIELDS[f]}_${p.value}`));
          this.lastProgressAt = nowMs;
        }
      }
    }

    // Objectives completed.
    for (const [k, done] of Object.entries(cur.objectives)) {
      if (done && !prev.objectives[k]) {
        this.lastProgressAt = nowMs;
        if (MENTOR_CARDS[`obj_${k}`]) out.push(ev('objective', `obj_${k}`));
      }
    }

    // Ending verdict.
    if (cur.endingId && cur.endingId !== prev.endingId) out.push(ev('ending', `end_${cur.endingId}`));

    // Telemetry alarms with hysteresis + cooldown (never while sleeping).
    if (!s.sleeping) {
      for (const r of ALARM_RULES) {
        if (this.alarmArmed[r.id] === undefined) this.alarmArmed[r.id] = true;
        if (this.alarmArmed[r.id] && r.on(s) && nowMs - (this.alarmLastAt[r.id] ?? -Infinity) >= MentorDirector.ALARM_COOLDOWN_MS) {
          this.alarmArmed[r.id] = false;
          this.alarmLastAt[r.id] = nowMs;
          out.push(ev('alarm', r.id));
        } else if (!this.alarmArmed[r.id] && r.off(s)) {
          this.alarmArmed[r.id] = true;
        }
      }
    }

    // Teacher nudge when the player seems stuck.
    if (!s.sleeping && nowMs - this.lastProgressAt >= MentorDirector.IDLE_HINT_MS && nowMs - this.lastHintAt >= MentorDirector.IDLE_HINT_MS) {
      const pending = (MISSION_OBJECTIVES[cur.missionId] ?? []).filter((k) => !cur.objectives[k]);
      if (pending.length) {
        const key = [...pending].sort((a, b) => (this.hintCount[a] ?? 0) - (this.hintCount[b] ?? 0))[0];
        this.hintCount[key] = (this.hintCount[key] ?? 0) + 1;
        this.lastHintAt = nowMs;
        out.push(ev('hint', key));
      }
    }

    this.prev = cur;
    return out;
  }
}

function ev(kind: MentorEvent['kind'], topic: string): QueuedMentorEvent {
  return { event: { kind, topic }, priority: PRIORITY[kind as keyof typeof PRIORITY] ?? 6 };
}

export function buildTelemetry(s: SpaceRoomState): MentorTelemetry {
  const keys = MISSION_OBJECTIVES[s.currentMissionId] ?? [];
  return {
    missionId: s.currentMissionId,
    o2Percent: +s.o2Percent.toFixed(2),
    co2Ppm: Math.round(s.co2Ppm),
    tempCelsius: +s.tempCelsius.toFixed(1),
    waterLiters: +s.waterLiters.toFixed(1),
    foodKg: +s.foodKg.toFixed(2),
    powerKwe: +s.powerKwe.toFixed(2),
    batteryPercent: Math.round(s.batteryPercent),
    crewRadiationMsv: +s.crewRadiationMsv.toFixed(1),
    crewMoralePercent: Math.round(s.crewMoralePercent),
    heartRateBpm: Math.round(s.heartRateBpm),
    eclssChoice: s.eclssChoice,
    powerChoice: s.powerChoice,
    roverChoice: s.roverChoice,
    decisions: {
      crisis: s.crisisDecision,
      act1: s.act1Decision,
      act2: s.act2Decision,
      act3: s.act3Decision,
      act4: s.act4Decision,
    },
    objectivesDone: keys.filter((k) => s.objectives[k]),
    objectivesPending: keys.filter((k) => !s.objectives[k]),
  };
}
