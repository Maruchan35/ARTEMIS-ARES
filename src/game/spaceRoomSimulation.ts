import { NASA_CONSTANTS } from '../data/nasaConstants';
import {
  CREW_COMPANIONS,
  EndingId,
  LAUNCH_STAGING_EVENTS,
  LEGACY_NOTES,
  MissionId,
} from '../data/aether4StoryData';
import { Box2DM, VERIFIED_PLAYER_STATS } from '../data/lockdownVerifiedWorldData';
import {
  createInitialPlayerState,
  getThrowProfile,
  PAWN_CONSTANTS,
  PlayerMoveInput,
  PlayerPhysicsState,
  resolveCircleVsBoxes,
  WorldItemEntity,
} from './lockdownPhysics';
import { HeldItem } from './lockdownTasks';

// =============================================================================
// Single-Player NASA Habitation & Multi-Phase Mission Simulation (8.0m x 7.0m x 3.4m)
// Uses LOCKDOWN Protocol physics/item archetypes & 2-slot inventory adapted to
// official NASA constants (`BVAD`, `NASA Twins Study`, `FSP`, `ESDMD-001`, `APH/Veggie`, `MEDS/SLS`).
// =============================================================================

export type LightingMode = 'day' | 'circadian' | 'alert' | 'spectral_magenta' | 'blueprint_launch';

export type RoomStationKind =
  | 'bunk_bed'
  | 'bunk_light_switch'
  | 'window_shutter_button'
  | 'cabin_terminal'
  | 'power_charger'
  | 'power_box'
  | 'power_lever'
  | 'eclss_vent'
  | 'filter_regenerator'
  | 'ration_dispenser'
  | 'water_rehydrator'
  | 'food_heater'
  | 'suit_mirror_station'
  | 'treadmill_station'
  | 'whc_hygiene_station'
  | 'eva_locker_station'
  | 'crisis_quiz_station'
  | 'legacy_tablet_station'
  | 'hatch_next_mission'
  | 'manifest_eclss'
  | 'manifest_power'
  | 'manifest_rover'
  | 'meds_stage_button'
  | 'skylab_thermal_station'
  | 'spe_electrolyzer_station'
  | 'krusty_reactor_station'
  | 'aph_chamber_station'
  | 'compost_valve_station'
  | 'bios3_buffer_station'
  | 'rover_cockpit_station'
  | 'regolith_shield_station'
  | 'mission_ending_station';

export interface RoomStationState {
  id: string;
  kind: RoomStationKind;
  x: number;
  y: number;
  z: number;
  yawDeg: number;
  labelEs: string;
  labelEn: string;
  progress: number; // 0..100
  active: boolean;
  done: boolean;
  screwsLeft?: number;
  hasBattery?: boolean;
  hasFuse?: boolean;
  hasDirtyFilter?: boolean;
  hasCleanFilter?: boolean;
  hasRice?: boolean;
  hasWater?: boolean;
  foodReady?: boolean;
  value?: string;
  noteId?: number;
}

export interface RoomObjectiveProgress {
  sleepCompleted: boolean;
  powerRestored: boolean;
  eclssCleaned: boolean;
  mealPrepared: boolean;
  viewportOpened: boolean;
  exerciseCalibrated: boolean;
  whcInspected: boolean;
  evaChecked: boolean;
  crisisSolved: boolean;
  manifestConfigured: boolean;
  launchCompleted: boolean;
  thermalFixed: boolean;
  powerBalanced: boolean;
  aphHarvested: boolean;
  compostIsolated: boolean;
  bios3Activated: boolean;
  roverReturned: boolean;
  regolithDeployed: boolean;
}

export interface SpaceRoomState {
  currentMissionId: MissionId;
  elapsedSec: number;
  lightingMode: LightingMode;
  shutterOpen: boolean;
  sleeping: boolean;
  sleepTimerSec: number;
  exercisingTimerSec: number;
  cabinPressureKpa: number;
  o2Percent: number;
  co2Ppm: number;
  waterLiters: number;
  powerKwe: number;
  tempCelsius: number;
  humidityPercent: number;
  foodKg: number;
  batteryPercent: number;
  crewRadiationMsv: number;
  crewMoralePercent: number;
  wasteKg: number;
  heartRateBpm: number;
  bpSys: number;
  bpDia: number;
  internalHeatWm2: number;
  eclssChoice: 'closed_regen' | 'open_lioh';
  powerChoice: 'fsp_40kw' | 'solar_only';
  roverChoice: 'kilopower_rover' | 'rtg_solar_rover';
  launchStageIndex: number;
  crisisDecision: 'water_priority' | 'food_priority' | null;
  act1Decision: 'duct_tape_patch' | 'cdra_reroute' | null;
  act2Decision: 'krusty_spe' | 'solar_ration' | null;
  act3Decision: 'isolate_bios3' | 'vent_compost' | null;
  act4Decision: 'shield_2m_rover' | 'unshielded_dash' | null;
  endingId: EndingId | null;
  unlockedLegacyNotes: number[];
  unlockedNewspapers: number[];
  activeRadio: {
    speakerId: keyof typeof CREW_COMPANIONS;
    textEs: string;
    textEn: string;
    timestampSec: number;
  };
  stations: RoomStationState[];
  worldItems: WorldItemEntity[];
  objectives: RoomObjectiveProgress;
}

export interface RoomLookTarget {
  kind: 'station' | 'item' | null;
  id: string;
  labelEs: string;
  labelEn: string;
}

export const ROOM_BOUNDS = {
  minX: 0.0,
  maxX: 8.0,
  minY: 0.0,
  maxY: 7.0,
  heightM: 3.4,
} as const;

/**
 * Hermetic 4-wall room envelope + exact AABB colliders for all furniture pieces.
 */
export const SPACE_ROOM_COLLIDERS: Box2DM[] = [
  // Hermetic exterior structural walls
  [-0.25, -0.25, -0.2, 0.0, 7.25, 3.6, 'RoomWall_West'],
  [8.0, -0.25, -0.2, 8.25, 7.25, 3.6, 'RoomWall_East'],
  [0.0, -0.25, -0.2, 8.0, 0.0, 3.6, 'RoomWall_South'],
  [0.0, 7.0, -0.2, 8.0, 7.25, 3.6, 'RoomWall_North'],

  // Corner structural pilasters
  [0.0, 0.0, 0.0, 0.35, 0.35, 3.4, 'Pilaster_SW'],
  [7.65, 0.0, 0.0, 8.0, 0.35, 3.4, 'Pilaster_SE'],
  [0.0, 6.65, 0.0, 0.35, 7.0, 3.4, 'Pilaster_NW'],
  [7.65, 6.65, 0.0, 8.0, 7.0, 3.4, 'Pilaster_NE'],

  // 1. Crew Bunk Bed + Nightstand (West Wall, North-Mid)
  [0.02, 3.75, 0.0, 1.32, 5.95, 1.05, 'Furn_CrewBunk'],

  // 2. Nutrition & Hydration Galley (West Wall, South-Mid)
  [0.02, 1.05, 0.0, 1.02, 2.85, 1.15, 'Furn_Galley'],

  // 3. Central Engineering Workbench
  [3.15, 3.18, 0.0, 4.85, 4.12, 0.92, 'Furn_Workbench'],

  // 4. North Viewport Desk & Cabin Terminal (under Space Window)
  [2.75, 6.28, 0.0, 5.25, 6.98, 0.95, 'Furn_NorthDesk'],

  // 5. East Electric Bus Rack (Battery Charger, Distribution Box, Power Lever)
  [7.12, 3.90, 0.0, 7.98, 5.95, 2.15, 'Furn_PowerRack'],

  // 6. East EVA Suit Mirror Platform
  [7.20, 1.35, 0.0, 7.98, 2.75, 0.35, 'Furn_SuitMirrorPad'],

  // 7. South ECLSS Rack (CO2 Vent Duct + LiOH Regenerator)
  [4.85, 0.02, 0.0, 6.55, 0.88, 2.2, 'Furn_ECLSSRack'],
];

const SURFACE_BOXES = [
  // Workbench tabletop at Z = 0.92m
  { minX: 3.1, maxX: 4.9, minY: 3.12, maxY: 4.18, topZ: 0.92 },
  // North desk surface at Z = 0.95m
  { minX: 2.7, maxX: 5.3, minY: 6.24, maxY: 7.0, topZ: 0.95 },
  // Galley counter surface at Z = 0.95m
  { minX: 0.0, maxX: 1.05, minY: 1.0, maxY: 2.9, topZ: 0.95 },
];

export function createRoomSpawnPlayer(): PlayerPhysicsState {
  // Spawn near south-center facing North (+Y, yaw=90deg) overlooking workbench, bed, power rack, and window
  return createInitialPlayerState(4.0, 1.85, 0.0, 90, 'station');
}

export interface RoomCarryState {
  eclssChoice?: 'closed_regen' | 'open_lioh';
  powerChoice?: 'fsp_40kw' | 'solar_only';
  roverChoice?: 'kilopower_rover' | 'rtg_solar_rover';
  unlockedLegacyNotes?: number[];
  unlockedNewspapers?: number[];
  crisisDecision?: 'water_priority' | 'food_priority' | null;
  act1Decision?: 'duct_tape_patch' | 'cdra_reroute' | null;
  act2Decision?: 'krusty_spe' | 'solar_ration' | null;
  act3Decision?: 'isolate_bios3' | 'vent_compost' | null;
  act4Decision?: 'shield_2m_rover' | 'unshielded_dash' | null;
  waterLiters?: number;
  foodKg?: number;
  crewRadiationMsv?: number;
  crewMoralePercent?: number;
}

export function createInitialSpaceRoomState(
  missionId: MissionId = 'tutorial_hab',
  carry?: RoomCarryState
): SpaceRoomState {
  const unlockedLegacyNotes = Array.from(new Set(carry?.unlockedLegacyNotes ?? []));
  const unlockedNewspapers = Array.from(new Set(carry?.unlockedNewspapers ?? [1]));

  const eclssChoice = carry?.eclssChoice ?? 'closed_regen';
  const powerChoice = carry?.powerChoice ?? 'fsp_40kw';
  const roverChoice = carry?.roverChoice ?? 'kilopower_rover';

  const coreSharedStations: RoomStationState[] = [
    {
      id: 'bunk_light_switch',
      kind: 'bunk_light_switch',
      x: 0.14,
      y: 3.50,
      z: 1.32,
      yawDeg: 0,
      labelEs: 'Control Espectral SSLA / Alerta',
      labelEn: 'SSLA / Alert Spectral Switch',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'window_shutter_button',
      kind: 'window_shutter_button',
      x: 2.35,
      y: 6.86,
      z: 1.32,
      yawDeg: -90,
      labelEs: 'Escudo Ventanal Espacial',
      labelEn: 'Space Viewport Shutter',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'suit_mirror_station',
      kind: 'suit_mirror_station',
      x: 7.45,
      y: 2.05,
      z: 1.25,
      yawDeg: 180,
      labelEs: 'Espejo y Vestidor Traje EVA',
      labelEn: 'EVA Suit Mirror & Customizer',
      progress: 0,
      active: true,
      done: false,
    },
  ];

  let stations: RoomStationState[] = [];
  let worldItems: WorldItemEntity[] = [];
  let lightingMode: LightingMode = 'day';
  let shutterOpen = true;
  let o2Percent: number = NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_O2_PERCENT;
  let co2Ppm = 580;
  let waterLiters: number = carry?.waterLiters ?? NASA_CONSTANTS.HABITAT_ATMOSPHERE.WATER_TANK_CAPACITY_KG;
  let powerKwe: number = powerChoice === 'fsp_40kw' ? NASA_CONSTANTS.POWER_AND_THERMAL.FSP_40_NET_KWE : NASA_CONSTANTS.POWER_AND_THERMAL.SOLAR_MAX_KWE;
  let tempCelsius = 22.0;
  let humidityPercent = 42.0;
  let foodKg = carry?.foodKg ?? 24.0;
  let batteryPercent = 94.0;
  let crewRadiationMsv = carry?.crewRadiationMsv ?? 0.8;
  let crewMoralePercent = carry?.crewMoralePercent ?? 96.0;
  const wasteKg =
    NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_URINE_KG +
    NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_FECAL_KG;

  let radioSpeaker: keyof typeof CREW_COMPANIONS = 'KATHERINE';
  let radioEs =
    'AETHER-4 Fase 0 iniciada en JSC Houston (6,300 K). Calibra ejercicio ASCAN, litera 8.5 h, WHC y simula la crisis de agua.';
  let radioEn =
    'AETHER-4 Phase 0 live at JSC Houston (6,300 K). Calibrate ASCAN treadmill, 8.5 h bunk cycle, WHC rack & solve the water crisis drill.';

  if (missionId === 'tutorial_hab') {
    lightingMode = 'day';
    stations = [
      ...coreSharedStations,
      {
        id: 'bunk_bed',
        kind: 'bunk_bed',
        x: 0.72,
        y: 4.85,
        z: 0.65,
        yawDeg: 0,
        labelEs: 'Litera Tripulante (Ciclo 8.5 h)',
        labelEn: 'Crew Bunk Bed (8.5 h Cycle)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 4.0,
        y: 6.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Terminal Diagnóstico NASA',
        labelEn: 'NASA Diagnostics Terminal',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'treadmill_station',
        kind: 'treadmill_station',
        x: 2.05,
        y: 5.55,
        z: 0.68,
        yawDeg: 0,
        labelEs: 'Caminadora ASCAN (2.0 h/día · 82 kg)',
        labelEn: 'ASCAN Treadmill (2.0 h/day · 82 kg)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'whc_hygiene_station',
        kind: 'whc_hygiene_station',
        x: 6.45,
        y: 6.65,
        z: 1.25,
        yawDeg: -90,
        labelEs: 'Compartimento Higiene WHC (STS-126)',
        labelEn: 'WHC Hygiene Rack (STS-126)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'eva_locker_station',
        kind: 'eva_locker_station',
        x: 7.45,
        y: 2.72,
        z: 1.35,
        yawDeg: 180,
        labelEs: 'Vestidor EVA NBL (Regla del 8: 8h · 1L)',
        labelEn: 'NBL EVA Locker (Rule of 8: 8h · 1L)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'crisis_quiz_station',
        kind: 'crisis_quiz_station',
        x: 3.45,
        y: 3.65,
        z: 1.05,
        yawDeg: 0,
        labelEs: 'Simulador Crisis Fuga de Agua [F]',
        labelEn: 'Water Leak Crisis Simulator [Click]',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 4.95,
        y: 6.52,
        z: 1.05,
        yawDeg: -90,
        labelEs: 'Nota de Legado #1 (ISS ECLSS)',
        labelEn: 'Legacy Note #1 (ISS ECLSS)',
        progress: 0,
        active: true,
        done: false,
        noteId: 1,
      },
      {
        id: 'power_charger',
        kind: 'power_charger',
        x: 7.45,
        y: 5.45,
        z: 1.08,
        yawDeg: 180,
        labelEs: 'Cargador Batería Litio',
        labelEn: 'Li-Ion Battery Charger',
        progress: 0,
        active: true,
        done: false,
        hasBattery: false,
      },
      {
        id: 'power_box',
        kind: 'power_box',
        x: 7.45,
        y: 4.85,
        z: 1.35,
        yawDeg: 180,
        labelEs: 'Caja Distribución FSP (Batería+Fusible)',
        labelEn: 'FSP Power Box (Battery+Fuse)',
        progress: 0,
        active: true,
        done: false,
        hasBattery: false,
        hasFuse: false,
      },
      {
        id: 'power_lever',
        kind: 'power_lever',
        x: 7.45,
        y: 4.22,
        z: 1.32,
        yawDeg: 180,
        labelEs: 'Palanca de Potencia Cabina',
        labelEn: 'Cabin Power Breaker Lever',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'eclss_vent',
        kind: 'eclss_vent',
        x: 5.25,
        y: 0.42,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Conducto Ventilación CO₂ (4 tornillos)',
        labelEn: 'CO₂ Vent Duct (4 screws)',
        progress: 0,
        active: true,
        done: false,
        screwsLeft: 4,
        hasDirtyFilter: true,
        hasCleanFilter: false,
      },
      {
        id: 'filter_regenerator',
        kind: 'filter_regenerator',
        x: 6.12,
        y: 0.42,
        z: 1.15,
        yawDeg: 90,
        labelEs: 'Regenerador Filtro LiOH (7.0 kg)',
        labelEn: 'LiOH Filter Regenerator (7.0 kg)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'ration_dispenser',
        kind: 'ration_dispenser',
        x: 0.52,
        y: 2.52,
        z: 1.12,
        yawDeg: 0,
        labelEs: 'Dispensador Ración Deshidratada',
        labelEn: 'Dehydrated Ration Dispenser',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'water_rehydrator',
        kind: 'water_rehydrator',
        x: 0.52,
        y: 1.95,
        z: 1.12,
        yawDeg: 0,
        labelEs: 'Inyector Agua Potable (0.50 L)',
        labelEn: 'Potable Water Injector (0.50 L)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'food_heater',
        kind: 'food_heater',
        x: 0.52,
        y: 1.38,
        z: 1.12,
        yawDeg: 0,
        labelEs: 'Calentador Galley BVAD',
        labelEn: 'BVAD Galley Heater',
        progress: 0,
        active: true,
        done: false,
        hasRice: false,
        hasWater: false,
        foodReady: false,
      },
      {
        id: 'hatch_next_mission',
        kind: 'hatch_next_mission',
        x: 2.40,
        y: 0.16,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Escotilla a Fase 1: Manifiesto & MEDS',
        labelEn: 'Hatch to Phase 1: Manifest & MEDS',
        progress: 0,
        active: true,
        done: false,
        value: 'manifest_launch',
      },
    ];

    worldItems = [
      { uid: 'room_screwdriver_1', itemKey: 'DA_ScrewDriver', category: 'melee', x: 3.55, y: 3.55, z: 0.94, vx: 0, vy: 0, vz: 0, yawDeg: 25, thrownByPlayer: false, charge: 100 },
      { uid: 'room_battery_1', itemKey: 'DA_Battery', category: 'task', x: 4.0, y: 3.72, z: 1.02, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 25 },
      { uid: 'room_fuse_1', itemKey: 'DA_Fuse', category: 'task', x: 4.42, y: 3.45, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: 45, thrownByPlayer: false, charge: 100 },
      { uid: 'room_sample_1', itemKey: 'DA_Sample', category: 'task', x: 3.85, y: 6.50, z: 1.05, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'room_card_1', itemKey: 'DA_AccessCard', category: 'utility', x: 3.38, y: 6.52, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -15, thrownByPlayer: false, charge: 100 },
      { uid: 'room_waterpouch_1', itemKey: 'DA_WaterPouch', category: 'task', x: 0.62, y: 2.35, z: 1.02, vx: 0, vy: 0, vz: 0, yawDeg: 10, thrownByPlayer: false, charge: 100 },
      { uid: 'room_tablet_1', itemKey: 'DA_LegacyTablet', category: 'utility', x: 4.65, y: 3.78, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: -20, thrownByPlayer: false, charge: 100 },
    ];
  } else if (missionId === 'manifest_launch') {
    lightingMode = 'blueprint_launch';
    radioSpeaker = 'KATHERINE';
    radioEs =
      'Fase 1: El módulo lunar soporta 12,000 kg (Marte 20,000 kg). Elige ECLSS, Energía y Rover en la mesa holográfica y ejecuta las 5 etapas en cabina MEDS.';
    radioEn =
      'Phase 1: Moon lander cap is 12,000 kg (Mars 20,000 kg). Select ECLSS, Power & Rover at the holographic table and run all 5 MEDS launch stages.';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 3.25,
        y: 6.58,
        z: 1.15,
        yawDeg: -90,
        labelEs: 'Telemetría MEDS 11-LCD',
        labelEn: '11-LCD MEDS Telemetry',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'manifest_eclss',
        kind: 'manifest_eclss',
        x: 3.45,
        y: 3.65,
        z: 1.05,
        yawDeg: 0,
        labelEs: eclssChoice === 'closed_regen' ? 'Carga ECLSS: Reciclaje ISS (730 kg)' : 'Carga ECLSS: LiOH Abierto (9.3 kg/d)',
        labelEn: eclssChoice === 'closed_regen' ? 'Payload ECLSS: Closed WPA/CDRA (730 kg)' : 'Payload ECLSS: Open LiOH (9.3 kg/d)',
        progress: 0,
        active: true,
        done: true,
        value: eclssChoice,
      },
      {
        id: 'manifest_power',
        kind: 'manifest_power',
        x: 4.0,
        y: 3.65,
        z: 1.05,
        yawDeg: 0,
        labelEs: powerChoice === 'fsp_40kw' ? 'Planta: FSP KRUSTY 40 kWe (5.8 t)' : 'Planta: Solar 20 kWe (Vulnerable 354h)',
        labelEn: powerChoice === 'fsp_40kw' ? 'Power: 40 kWe KRUSTY FSP (5.8 t)' : 'Power: 20 kWe Solar (Blackout Risk)',
        progress: 0,
        active: true,
        done: true,
        value: powerChoice,
      },
      {
        id: 'manifest_rover',
        kind: 'manifest_rover',
        x: 4.55,
        y: 3.65,
        z: 1.05,
        yawDeg: 0,
        labelEs: roverChoice === 'kilopower_rover' ? 'Movilidad: Rover FSP (17 h)' : 'Movilidad: Rover Solar/RTG (1 h)',
        labelEn: roverChoice === 'kilopower_rover' ? 'Mobility: FSP Rover (17 h)' : 'Mobility: Solar/RTG Rover (1 h)',
        progress: 0,
        active: true,
        done: true,
        value: roverChoice,
      },
      {
        id: 'meds_stage_button',
        kind: 'meds_stage_button',
        x: 4.0,
        y: 6.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Consola MEDS: Ejecutar Etapa Lanzamiento [1/5]',
        labelEn: 'MEDS Console: Step Orbital Staging [1/5]',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 4.95,
        y: 6.52,
        z: 1.05,
        yawDeg: -90,
        labelEs: 'Nota de Legado #2 (Apollo 13 & ISS)',
        labelEn: 'Legacy Note #2 (Apollo 13 & ISS)',
        progress: 0,
        active: true,
        done: false,
        noteId: 2,
      },
      {
        id: 'hatch_next_mission',
        kind: 'hatch_next_mission',
        x: 2.40,
        y: 0.16,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Escotilla a Fase 2 Actos 1-2: Superficie',
        labelEn: 'Hatch to Phase 2 Acts 1-2: Surface',
        progress: 0,
        active: true,
        done: false,
        value: 'act1_2_surface',
      },
    ];

    worldItems = [
      { uid: 'f1_card', itemKey: 'DA_AccessCard', category: 'utility', x: 3.35, y: 6.50, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'f1_efuse', itemKey: 'DA_EmergencyFuse', category: 'task', x: 4.55, y: 6.50, z: 0.99, vx: 0, vy: 0, vz: 0, yawDeg: 18, thrownByPlayer: false, charge: 100 },
    ];
  } else if (missionId === 'act1_2_surface') {
    lightingMode = 'alert';
    shutterOpen = true;
    tempCelsius = 34.5;
    powerKwe = powerChoice === 'fsp_40kw' ? 28.0 : 1.4;
    batteryPercent = powerChoice === 'fsp_40kw' ? 88 : 34;
    crewRadiationMsv = Math.max(crewRadiationMsv, 18.0);
    radioSpeaker = 'CONRAD';
    radioEs =
      'ALERTA ACTOS 1-2: Impacto rompió escudo térmico (163 W/m²) y la oscuridad cubre los paneles (99.9998% bloqueo). Repara panel con Cinta/Destornillador y equilibra KRUSTY + SPE.';
    radioEn =
      'ACTS 1-2 ALERT: Impact breached thermal shield (163 W/m²) and darkness blocks 99.9998% sunlight. Repair with Duct Tape/Screwdriver & balance KRUSTY + SPE.';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 3.35,
        y: 6.58,
        z: 1.15,
        yawDeg: -90,
        labelEs: 'Monitor Térmico y Radiación',
        labelEn: 'Thermal & Radiation Monitor',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'skylab_thermal_station',
        kind: 'skylab_thermal_station',
        x: 7.45,
        y: 5.15,
        z: 1.35,
        yawDeg: 180,
        labelEs: 'Panel Térmico Skylab / Adaptador Apollo 13 (163 W/m²)',
        labelEn: 'Skylab Thermal Panel / Apollo 13 Patch (163 W/m²)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'power_charger',
        kind: 'power_charger',
        x: 7.45,
        y: 5.75,
        z: 1.08,
        yawDeg: 180,
        labelEs: 'Cargador Batería Auxiliar',
        labelEn: 'Aux Battery Charger',
        progress: 0,
        active: true,
        done: false,
        hasBattery: false,
      },
      {
        id: 'spe_electrolyzer_station',
        kind: 'spe_electrolyzer_station',
        x: 5.45,
        y: 0.42,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Electrolizador SPE (2H₂O → 2H₂ + O₂ · 66.7% Pot.)',
        labelEn: 'SPE Electrolyzer (2H₂O → 2H₂ + O₂ · 66.7% Pwr)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'krusty_reactor_station',
        kind: 'krusty_reactor_station',
        x: 4.0,
        y: 6.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Reactor KRUSTY 40 kWe Stirling & Radiador 133.4 m²',
        labelEn: '40 kWe KRUSTY Stirling & 133.4 m² Radiator',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 4.95,
        y: 6.52,
        z: 1.05,
        yawDeg: -90,
        labelEs: 'Nota de Legado #3 & #4 (Skylab / KRUSTY)',
        labelEn: 'Legacy Notes #3 & #4 (Skylab / KRUSTY)',
        progress: 0,
        active: true,
        done: false,
        noteId: 3,
      },
      {
        id: 'hatch_next_mission',
        kind: 'hatch_next_mission',
        x: 2.40,
        y: 0.16,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Escotilla a Acto 3: Invernadero APH/BIOS-3',
        labelEn: 'Hatch to Act 3: APH/BIOS-3 Greenhouse',
        progress: 0,
        active: true,
        done: false,
        value: 'act3_greenhouse',
      },
    ];

    worldItems = [
      { uid: 'a1_tape', itemKey: 'DA_DuctTapeKit', category: 'task', x: 3.92, y: 3.65, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: 10, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_screw', itemKey: 'DA_ScrewDriver', category: 'melee', x: 3.48, y: 3.55, z: 0.96, vx: 0, vy: 0, vz: 0, yawDeg: 35, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_efuse', itemKey: 'DA_EmergencyFuse', category: 'task', x: 4.42, y: 3.55, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: -20, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_bat', itemKey: 'DA_Battery', category: 'task', x: 4.18, y: 3.76, z: 1.02, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 45 },
    ];
  } else if (missionId === 'act3_greenhouse') {
    lightingMode = 'spectral_magenta';
    o2Percent = 19.3;
    co2Ppm = 1450;
    humidityPercent = 66;
    tempCelsius = 23.0;
    radioSpeaker = 'WHITSON';
    radioEs =
      'ACTO 3 MAGENTA (630 nm + 450 nm): Cultivos VEG-05 listos en cámara APH (1,700 cm²), pero O₂ cae hacia 19.0% por microbios del compostaje. ¡Cierra válvula y activa tanque BIOS-3!';
    radioEn =
      'ACT 3 MAGENTA (630 nm + 450 nm): VEG-05 tomatoes ready in APH (1,700 cm²), yet O₂ is sinking toward 19.0% via compost microbes! Seal valve & engage BIOS-3 buffer!';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 3.8,
        y: 6.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Control GLA APH (180 Sensores)',
        labelEn: 'APH GLA Monitor (180 Sensors)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'aph_chamber_station',
        kind: 'aph_chamber_station',
        x: 6.25,
        y: 6.55,
        z: 1.28,
        yawDeg: -90,
        labelEs: 'Cámara Botánica APH / Veggie (VEG-05 · Arcilla)',
        labelEn: 'APH / Veggie Growth Rack (VEG-05 · Clay Pillow)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'compost_valve_station',
        kind: 'compost_valve_station',
        x: 5.45,
        y: 0.42,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Válvula Compostaje Microbiano (Drenaje O₂)',
        labelEn: 'Microbial Compost Loop Valve (O₂ Drain)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'bios3_buffer_station',
        kind: 'bios3_buffer_station',
        x: 0.55,
        y: 2.05,
        z: 1.15,
        yawDeg: 0,
        labelEs: 'Tanque Amortiguador BIOS-3 (1,000 L + 400 kg Regolito)',
        labelEn: 'BIOS-3 Buffer Tank (1,000 L + 400 kg Regolith)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 4.95,
        y: 6.52,
        z: 1.05,
        yawDeg: -90,
        labelEs: 'Nota de Legado #5 (Biosphere 2 vs BIOS-3)',
        labelEn: 'Legacy Note #5 (Biosphere 2 vs BIOS-3)',
        progress: 0,
        active: true,
        done: false,
        noteId: 5,
      },
      {
        id: 'hatch_next_mission',
        kind: 'hatch_next_mission',
        x: 2.40,
        y: 0.16,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Escotilla a Acto 4: Tormenta Solar & Rover',
        labelEn: 'Hatch to Act 4: Solar Storm & Rover',
        progress: 0,
        active: true,
        done: false,
        value: 'act4_storm_rover',
      },
    ];

    worldItems = [
      { uid: 'a3_clay', itemKey: 'DA_ClayPillow', category: 'task', x: 3.75, y: 3.65, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'a3_jar', itemKey: 'DA_WaterJar', category: 'task', x: 4.25, y: 3.65, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: 15, thrownByPlayer: false, charge: 100 },
      { uid: 'a3_screw', itemKey: 'DA_ScrewDriver', category: 'melee', x: 3.45, y: 3.45, z: 0.96, vx: 0, vy: 0, vz: 0, yawDeg: 40, thrownByPlayer: false, charge: 100 },
    ];
  } else {
    // act4_storm_rover
    lightingMode = 'alert';
    crewRadiationMsv = Math.max(carry?.crewRadiationMsv ?? 85, 95);
    radioSpeaker = 'LOVELL';
    radioEs =
      'ACTO 4 ALERTA SPE (>250 mSv): ¡Eyección solar crítica! Pilota el Rover de 6,000 kg de vuelta, despliega 2 m de regolito (300 g/cm² · 400 t) y sella el Veredicto AETHER-4.';
    radioEn =
      'ACT 4 SPE ALERT (>250 mSv): Critical proton storm! Drive the 6,000 kg Rover back, deploy 2 m compacted regolith (300 g/cm² · 400 t) & seal Final Outcome.';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 3.25,
        y: 6.58,
        z: 1.15,
        yawDeg: -90,
        labelEs: 'Monitor Radiación SPE (Límite 250 mSv / 30d)',
        labelEn: 'SPE Radiation Monitor (250 mSv / 30d Limit)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'rover_cockpit_station',
        kind: 'rover_cockpit_station',
        x: 4.0,
        y: 6.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Consola Rover Presurizado 6,000 kg (Retorno)',
        labelEn: '6,000 kg Pressurized Rover Drive Console',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'regolith_shield_station',
        kind: 'regolith_shield_station',
        x: 7.45,
        y: 4.85,
        z: 1.35,
        yawDeg: 180,
        labelEs: 'Blindaje Regolito Compacto (2.0 m · 300 g/cm² · 400 t)',
        labelEn: 'Compacted Regolith Shield (2.0 m · 300 g/cm² · 400 t)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'mission_ending_station',
        kind: 'mission_ending_station',
        x: 4.0,
        y: 3.65,
        z: 1.06,
        yawDeg: 0,
        labelEs: 'Consola Central: Veredicto Final AETHER-4',
        labelEn: 'Central Console: Evaluate AETHER-4 Final Ending',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 4.95,
        y: 6.52,
        z: 1.05,
        yawDeg: -90,
        labelEs: 'Nota de Legado #6 (Tormenta Agosto 1972)',
        labelEn: 'Legacy Note #6 (Aug 1972 Solar Storm)',
        progress: 0,
        active: true,
        done: false,
        noteId: 6,
      },
      {
        id: 'hatch_next_mission',
        kind: 'hatch_next_mission',
        x: 2.40,
        y: 0.16,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Reiniciar Campaña en Fase 0 (JSC)',
        labelEn: 'Restart Campaign at Phase 0 (JSC)',
        progress: 0,
        active: true,
        done: false,
        value: 'tutorial_hab',
      },
    ];

    worldItems = [
      { uid: 'a4_regolith', itemKey: 'DA_RegolithSample', category: 'task', x: 3.65, y: 3.65, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'a4_card', itemKey: 'DA_AccessCard', category: 'utility', x: 4.35, y: 3.55, z: 0.98, vx: 0, vy: 0, vz: 0, yawDeg: 15, thrownByPlayer: false, charge: 100 },
    ];
  }

  return {
    currentMissionId: missionId,
    elapsedSec: 0,
    lightingMode,
    shutterOpen,
    sleeping: false,
    sleepTimerSec: 0,
    exercisingTimerSec: 0,
    cabinPressureKpa: NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA,
    o2Percent,
    co2Ppm,
    waterLiters,
    powerKwe,
    tempCelsius,
    humidityPercent,
    foodKg,
    batteryPercent,
    crewRadiationMsv,
    crewMoralePercent,
    wasteKg,
    heartRateBpm: NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.PREFLIGHT_NOMINAL_HR_BPM,
    bpSys: NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.PREFLIGHT_NOMINAL_BP_SYS,
    bpDia: NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.PREFLIGHT_NOMINAL_BP_DIA,
    internalHeatWm2: NASA_CONSTANTS.POWER_AND_THERMAL.HAB_INTERNAL_HEAT_MAX_WM2,
    eclssChoice,
    powerChoice,
    roverChoice,
    launchStageIndex: 0,
    crisisDecision: carry?.crisisDecision ?? null,
    act1Decision: carry?.act1Decision ?? null,
    act2Decision: carry?.act2Decision ?? null,
    act3Decision: carry?.act3Decision ?? null,
    act4Decision: carry?.act4Decision ?? null,
    endingId: null,
    unlockedLegacyNotes,
    unlockedNewspapers,
    activeRadio: {
      speakerId: radioSpeaker,
      textEs: radioEs,
      textEn: radioEn,
      timestampSec: 0,
    },
    stations,
    worldItems,
    objectives: {
      sleepCompleted: false,
      powerRestored: false,
      eclssCleaned: false,
      mealPrepared: false,
      viewportOpened: true,
      exerciseCalibrated: false,
      whcInspected: false,
      evaChecked: false,
      crisisSolved: carry?.crisisDecision != null,
      manifestConfigured: missionId !== 'manifest_launch',
      launchCompleted: false,
      thermalFixed: false,
      powerBalanced: false,
      aphHarvested: false,
      compostIsolated: false,
      bios3Activated: false,
      roverReturned: false,
      regolithDeployed: false,
    },
  };
}

/**
 * Reuses LOCKDOWN Protocol's AsyncTickPawn movement feel & AABB collision resolution inside the 8x7m room.
 */
export function stepSpaceRoomPlayer(
  state: PlayerPhysicsState,
  input: PlayerMoveInput,
  dtSec: number,
  gravityMs2: number = PAWN_CONSTANTS.gravityMs2
): PlayerPhysicsState {
  const next = { ...state };
  const clampedDt = Math.min(0.05, Math.max(0.001, dtSec));
  const subCount = Math.min(8, Math.max(1, Math.round(clampedDt / (PAWN_CONSTANTS.asyncDeltaSec * 2))));
  const h = clampedDt / subCount;

  const movingInput = Math.abs(input.forward) > 0.05 || Math.abs(input.strafe) > 0.05;
  const canSprint = input.sprint && !input.crouch && !next.exhausted && movingInput && next.stamina > 2;
  next.sprinting = canSprint;
  next.crouching = input.crouch;

  let targetSpeed = PAWN_CONSTANTS.walkSpeedMs;
  if (next.slowTier > 0) targetSpeed = PAWN_CONSTANTS.slowTiersMs[next.slowTier - 1];
  else if (input.crouch) targetSpeed = PAWN_CONSTANTS.slowTiersMs[1];
  else if (canSprint) targetSpeed = PAWN_CONSTANTS.speedTiersMs[1];

  if (canSprint) {
    next.stamina = Math.max(0, next.stamina - 18 * clampedDt);
    if (next.stamina <= 0.5) {
      next.exhausted = true;
      next.exhaustCooldown = Math.abs(VERIFIED_PLAYER_STATS.exhaustCd);
    }
  } else {
    if (next.exhaustCooldown > 0) {
      next.exhaustCooldown = Math.max(0, next.exhaustCooldown - clampedDt);
    }
    const regenRate = movingInput ? VERIFIED_PLAYER_STATS.minRegen * 1.4 : VERIFIED_PLAYER_STATS.maxRegen * 0.7;
    next.stamina = Math.min(100, next.stamina + regenRate * clampedDt);
    if (next.exhaustCooldown <= 0 && next.stamina >= 25) next.exhausted = false;
  }

  const yawRad = (next.yawDeg * Math.PI) / 180;
  const fx = Math.cos(yawRad);
  const fy = Math.sin(yawRad);
  const rx = -fy;
  const ry = fx;

  let wantVx = fx * input.forward + rx * input.strafe;
  let wantVy = fy * input.forward + ry * input.strafe;
  const mag = Math.hypot(wantVx, wantVy);
  if (mag > 1e-4) {
    wantVx = (wantVx / mag) * targetSpeed;
    wantVy = (wantVy / mag) * targetSpeed;
  } else {
    wantVx = 0;
    wantVy = 0;
  }

  if (input.jumpPressed && next.grounded && next.stamina >= VERIFIED_PLAYER_STATS.jumpStamina) {
    next.vz = PAWN_CONSTANTS.jumpVelocityMs;
    next.grounded = false;
    next.stamina = Math.max(0, next.stamina - VERIFIED_PLAYER_STATS.jumpStamina);
  }

  for (let s = 0; s < subCount; s++) {
    const accel = next.grounded ? Math.min(1, h * 18) : Math.min(1, h * 5);
    next.vx += (wantVx - next.vx) * accel;
    next.vy += (wantVy - next.vy) * accel;

    const [px, py] = resolveCircleVsBoxes(
      next.x + next.vx * h,
      next.y + next.vy * h,
      next.z,
      PAWN_CONSTANTS.collisionRadiusM,
      SPACE_ROOM_COLLIDERS
    );
    next.x = Math.max(ROOM_BOUNDS.minX + 0.35, Math.min(ROOM_BOUNDS.maxX - 0.35, px));
    next.y = Math.max(ROOM_BOUNDS.minY + 0.35, Math.min(ROOM_BOUNDS.maxY - 0.35, py));

    if (!next.grounded || next.vz > 0) {
      next.vz -= gravityMs2 * h;
      next.z += next.vz * h;
      if (next.z > 1.85) {
        next.z = 1.85;
        if (next.vz > 0) next.vz = 0;
      }
      if (next.z <= 0) {
        next.z = 0;
        next.vz = 0;
        next.grounded = true;
      }
    } else {
      next.z = 0;
    }
  }

  return next;
}

function getRestingZForXY(x: number, y: number): number {
  for (const s of SURFACE_BOXES) {
    if (x >= s.minX && x <= s.maxX && y >= s.minY && y <= s.maxY) {
      return s.topZ + 0.05;
    }
  }
  return 0.05;
}

export function stepSpaceRoomSimulation(
  sim: SpaceRoomState,
  player: PlayerPhysicsState,
  dtSec: number
): SpaceRoomState {
  const dt = Math.min(0.05, Math.max(0.001, dtSec));
  sim.elapsedSec += dt;

  // Dynamic heart rate & blood pressure based on exertion / sleep / storm stress
  const speed = Math.hypot(player.vx, player.vy);
  const exercising = sim.exercisingTimerSec > 0;
  const targetBpm = sim.sleeping
    ? 58
    : exercising
    ? 142
    : player.sprinting
    ? 124
    : speed > 0.5
    ? 86
    : NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.PREFLIGHT_NOMINAL_HR_BPM;
  sim.heartRateBpm += (targetBpm - sim.heartRateBpm) * Math.min(1, dt * 2.5);

  const targetSys = exercising ? 136 : sim.lightingMode === 'alert' ? 128 : NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.PREFLIGHT_NOMINAL_BP_SYS;
  sim.bpSys += (targetSys - sim.bpSys) * Math.min(1, dt * 1.5);

  if (sim.sleeping) {
    sim.sleepTimerSec -= dt;
    player.stamina = Math.min(100, player.stamina + 35 * dt);
    player.hp = Math.min(100, player.hp + 10 * dt);
    sim.crewMoralePercent = Math.min(100, sim.crewMoralePercent + 4 * dt);
    if (sim.sleepTimerSec <= 0) {
      sim.sleeping = false;
      sim.sleepTimerSec = 0;
      sim.objectives.sleepCompleted = true;
    }
  }

  if (sim.exercisingTimerSec > 0) {
    sim.exercisingTimerSec = Math.max(0, sim.exercisingTimerSec - dt);
    sim.waterLiters = Math.max(10, sim.waterLiters - 0.08 * dt);
    sim.humidityPercent = Math.min(58, sim.humidityPercent + 1.8 * dt);
    sim.crewMoralePercent = Math.min(100, sim.crewMoralePercent + 1.5 * dt);
  } else {
    const targetHum = sim.currentMissionId === 'act3_greenhouse' ? 62 : 44;
    sim.humidityPercent += (targetHum - sim.humidityPercent) * Math.min(1, dt * 0.25);
  }

  // Mission-specific coupled 10-variable NASA dynamics
  if (sim.currentMissionId === 'tutorial_hab') {
    if (!sim.objectives.eclssCleaned) {
      sim.o2Percent = Math.max(20.1, sim.o2Percent - 0.002 * dt);
      sim.co2Ppm = Math.min(1350, sim.co2Ppm + 4.0 * dt);
    } else {
      sim.o2Percent = Math.min(21.0, sim.o2Percent + 0.02 * dt);
      sim.co2Ppm = Math.max(430, sim.co2Ppm - 18.0 * dt);
    }
    sim.powerKwe = sim.objectives.powerRestored ? 40.0 : 10.0;
  } else if (sim.currentMissionId === 'manifest_launch') {
    sim.powerKwe = sim.powerChoice === 'fsp_40kw' ? 40.0 : 20.0;
    sim.co2Ppm = sim.eclssChoice === 'closed_regen' ? 420 : 620;
  } else if (sim.currentMissionId === 'act1_2_surface') {
    if (!sim.objectives.thermalFixed) {
      sim.tempCelsius = Math.min(39.0, sim.tempCelsius + 0.35 * dt);
      sim.internalHeatWm2 = NASA_CONSTANTS.POWER_AND_THERMAL.HAB_INTERNAL_HEAT_MAX_WM2;
      sim.crewMoralePercent = Math.max(45, sim.crewMoralePercent - 0.3 * dt);
    } else {
      sim.tempCelsius = Math.max(21.8, sim.tempCelsius - 1.2 * dt);
      sim.internalHeatWm2 = 96;
    }
    if (!sim.objectives.powerBalanced) {
      if (sim.powerChoice === 'solar_only') {
        sim.powerKwe = 0.04; // 99.9998% Mars storm / lunar night attenuation
        sim.batteryPercent = Math.max(8, sim.batteryPercent - 0.85 * dt);
      } else {
        sim.powerKwe = 24.0;
      }
    } else {
      sim.powerKwe = sim.powerChoice === 'fsp_40kw' ? 40.0 : 4.2;
      sim.batteryPercent = Math.min(100, sim.batteryPercent + 2.2 * dt);
    }
  } else if (sim.currentMissionId === 'act3_greenhouse') {
    if (!sim.objectives.compostIsolated) {
      // Soil microbe O2 drawdown mirroring Biosphere 2 (0.022 - 0.153 L/kg*min)
      sim.o2Percent = Math.max(18.6, sim.o2Percent - 0.036 * dt);
      sim.co2Ppm = Math.min(1900, sim.co2Ppm + 14.0 * dt);
    } else {
      const recoveryRate = sim.objectives.bios3Activated ? 0.14 : 0.05;
      sim.o2Percent = Math.min(20.9, sim.o2Percent + recoveryRate * dt);
      sim.co2Ppm = Math.max(510, sim.co2Ppm - 28.0 * dt);
    }
  } else if (sim.currentMissionId === 'act4_storm_rover') {
    if (!sim.objectives.regolithDeployed) {
      // August 1972 SPE unshielded dose rate rising toward >250 mSv 30-day limit
      sim.crewRadiationMsv = Math.min(340, sim.crewRadiationMsv + 2.8 * dt);
      sim.crewMoralePercent = Math.max(40, sim.crewMoralePercent - 0.5 * dt);
    } else {
      // 300 g/cm2 (2.0 m compacted regolith = 400 tons) blocks primary solar protons
      sim.crewRadiationMsv = Math.min(240, sim.crewRadiationMsv + 0.015 * dt);
      sim.crewMoralePercent = Math.min(100, sim.crewMoralePercent + 1.2 * dt);
    }
    sim.powerKwe = sim.powerChoice === 'fsp_40kw' ? 40.0 : 3.4;
  }

  // Step battery induction charger & galley heater
  for (const st of sim.stations) {
    if (st.kind === 'power_charger' && st.hasBattery && st.progress < 100) {
      st.progress = Math.min(100, st.progress + 28 * dt);
      if (st.progress >= 100) st.done = true;
    }
    if (st.kind === 'food_heater' && st.hasRice && st.hasWater && !st.foodReady && st.progress > 0 && st.progress < 100) {
      st.progress = Math.min(100, st.progress + 34 * dt);
      if (st.progress >= 100) {
        st.foodReady = true;
        st.done = true;
      }
    }
  }

  // Step thrown / bouncing world items using verified LOCKDOWN restitution & tabletop landings
  for (const it of sim.worldItems) {
    const restZ = getRestingZForXY(it.x, it.y);
    const moving = Math.abs(it.vx) > 0.02 || Math.abs(it.vy) > 0.02 || Math.abs(it.vz) > 0.02 || it.z > restZ + 0.02;
    if (!moving) continue;

    const prof = getThrowProfile(it.itemKey);
    let nx = it.x + it.vx * dt;
    let ny = it.y + it.vy * dt;
    let nz = it.z + it.vz * dt;
    let nvx = it.vx;
    let nvy = it.vy;
    let nvz = it.vz - prof.gravityMs2 * dt;

    // Wall bounces
    const wallsOnly = SPACE_ROOM_COLLIDERS.slice(0, 4);
    const [px, py] = resolveCircleVsBoxes(nx, ny, nz, prof.radiusM, wallsOnly);
    if (Math.abs(px - nx) > 0.002) nvx = -nvx * prof.restitution;
    if (Math.abs(py - ny) > 0.002) nvy = -nvy * prof.restitution;
    nx = Math.max(0.2, Math.min(7.8, px));
    ny = Math.max(0.2, Math.min(6.8, py));

    const landZ = getRestingZForXY(nx, ny);
    if (nz <= landZ) {
      nz = landZ;
      if (Math.abs(nvz) > 0.9) nvz = -nvz * prof.restitution;
      else nvz = 0;
      nvx *= 0.72;
      nvy *= 0.72;
    }

    it.x = nx;
    it.y = ny;
    it.z = nz;
    it.vx = nvx;
    it.vy = nvy;
    it.vz = nvz;
  }

  return sim;
}

export function findRoomLookTarget(player: PlayerPhysicsState, sim: SpaceRoomState): RoomLookTarget {
  const eyeH = player.crouching ? PAWN_CONSTANTS.eyeHeightCrouchingM : PAWN_CONSTANTS.eyeHeightStandingM;
  const yawRad = (player.yawDeg * Math.PI) / 180;
  const pitchRad = (player.pitchDeg * Math.PI) / 180;
  const fx = Math.cos(pitchRad) * Math.cos(yawRad);
  const fy = Math.cos(pitchRad) * Math.sin(yawRad);
  const fz = Math.sin(pitchRad);

  let bestScore = Infinity;
  let bestTarget: RoomLookTarget = { kind: null, id: '', labelEs: '', labelEn: '' };

  for (const it of sim.worldItems) {
    const dx = it.x - player.x;
    const dy = it.y - player.y;
    const dz = it.z - (player.z + eyeH);
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 2.35) continue;
    const dot = (dx * fx + dy * fy + dz * fz) / Math.max(0.01, dist);
    if (dot < 0.72) continue;
    const score = dist * (1.35 - dot);
    if (score < bestScore) {
      bestScore = score;
      bestTarget = { kind: 'item', id: it.uid, labelEs: 'Recoger objeto', labelEn: 'Pick up item' };
    }
  }

  for (const st of sim.stations) {
    const dx = st.x - player.x;
    const dy = st.y - player.y;
    const dz = st.z - (player.z + eyeH);
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 2.55) continue;
    const dot = (dx * fx + dy * fy + dz * fz) / Math.max(0.01, dist);
    if (dot < 0.68) continue;
    const score = dist * (1.35 - dot);
    if (score < bestScore) {
      bestScore = score;
      bestTarget = { kind: 'station', id: st.id, labelEs: st.labelEs, labelEn: st.labelEn };
    }
  }

  return bestTarget;
}

export function evaluateMissionEnding(sim: SpaceRoomState): EndingId {
  const radiationSafe = sim.crewRadiationMsv < NASA_CONSTANTS.RADIATION_AND_SHIELDING.SPE_30_DAY_LIMIT_MSV;
  const o2Healthy = sim.o2Percent >= NASA_CONSTANTS.HABITAT_ATMOSPHERE.HYPOXIA_THRESHOLD_PERCENT + 0.5;
  if (
    sim.powerChoice === 'fsp_40kw' &&
    sim.eclssChoice === 'closed_regen' &&
    sim.objectives.regolithDeployed &&
    radiationSafe &&
    o2Healthy
  ) {
    return 'ending_3_interplanetary_cradle';
  }
  if (
    sim.eclssChoice === 'open_lioh' ||
    (!sim.objectives.thermalFixed && sim.tempCelsius >= 31) ||
    (sim.act1Decision === 'duct_tape_patch' && sim.powerChoice !== 'fsp_40kw')
  ) {
    return 'ending_1_duct_tape';
  }
  return 'ending_2_silent_bunker';
}

function unlockNoteAndPaper(sim: SpaceRoomState, noteId?: number, paperId?: number) {
  if (noteId && !sim.unlockedLegacyNotes.includes(noteId)) {
    sim.unlockedLegacyNotes.push(noteId);
  }
  if (paperId && !sim.unlockedNewspapers.includes(paperId)) {
    sim.unlockedNewspapers.push(paperId);
  }
}

export interface RoomInteractionResult {
  handItem: HeldItem | null;
  msgEs: string;
  msgEn: string;
  tone: 'ok' | 'warn' | 'err';
  animType: 'reach' | 'use';
  openTerminalModal?: boolean;
  openMirrorModal?: boolean;
  openCrisisModal?: boolean;
  openLegacyNoteId?: number;
  openNewspaperId?: number;
  openEndingModal?: EndingId;
  advanceMission?: MissionId;
  consumeFoodAnim?: boolean;
}

export function interactRoomStation(
  stationId: string,
  sim: SpaceRoomState,
  handItem: HeldItem | null
): RoomInteractionResult {
  const st = sim.stations.find((s) => s.id === stationId);
  if (!st) {
    return { handItem, msgEs: 'Sin objetivo', msgEn: 'No target', tone: 'warn', animType: 'reach' };
  }

  switch (st.kind) {
    case 'bunk_bed': {
      sim.sleeping = true;
      sim.sleepTimerSec = 2.6;
      st.done = true;
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        msgEs: `Descanso circadiano iniciado (${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.SLEEP_RECOMMENDED_HOURS} h ciclo NASA) — Estamina 100%`,
        msgEn: `Circadian rest started (${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.SLEEP_RECOMMENDED_HOURS} h NASA cycle) — Stamina 100%`,
      };
    }

    case 'bunk_light_switch': {
      const order: LightingMode[] = ['day', 'circadian', 'spectral_magenta', 'blueprint_launch', 'alert'];
      sim.lightingMode = order[(order.indexOf(sim.lightingMode) + 1) % order.length];
      const labels: Record<LightingMode, [string, string]> = {
        day: ['Luz Clínica SSLA 6,300 K activada', 'SSLA Clinical 6,300 K lighting enabled'],
        circadian: ['Luz Cálida Nocturna 2,700 K activada', 'Warm Circadian 2,700 K lighting enabled'],
        spectral_magenta: ['Luz Botánica APH Magenta (630+450 nm) activada', 'APH Magenta Grow Glow (630+450 nm) enabled'],
        blueprint_launch: ['Iluminación Blueprint MEDS (#0F2547) activada', 'MEDS Blueprint (#0F2547) mode enabled'],
        alert: ['Iluminación Roja de Emergencia activada', 'Red Emergency Alert lighting enabled'],
      };
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        msgEs: labels[sim.lightingMode][0],
        msgEn: labels[sim.lightingMode][1],
      };
    }

    case 'window_shutter_button': {
      sim.shutterOpen = !sim.shutterOpen;
      if (sim.shutterOpen) sim.objectives.viewportOpened = true;
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        msgEs: sim.shutterOpen ? 'Compuerta del ventanal espacial abierta' : 'Escudo anti-radiación del ventanal cerrado',
        msgEn: sim.shutterOpen ? 'Space viewport shutter opened' : 'Radiation shield shutter closed',
      };
    }

    case 'cabin_terminal':
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        openTerminalModal: true,
        msgEs: 'Abriendo Terminal NASA & Telemetría de 10 Variables',
        msgEn: 'Opening NASA 10-Variable Telemetry Terminal',
      };

    case 'suit_mirror_station':
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        openMirrorModal: true,
        msgEs: 'Abriendo Vestidor / Espejo del Traje EVA',
        msgEn: 'Opening EVA Suit Mirror & Customizer',
      };

    case 'treadmill_station': {
      sim.exercisingTimerSec = 3.5;
      sim.objectives.exerciseCalibrated = true;
      st.done = true;
      sim.activeRadio = {
        speakerId: 'KATHERINE',
        textEs: `Caminadora ASCAN calibrada: 82 kg · ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OXYGEN_EXERCISE_KG} kg O₂/d · ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.DRINKING_WATER_EXERCISE_KG} L agua/d · 2.0 h/día contra pérdida ósea (1.5%/mes).`,
        textEn: `ASCAN Treadmill calibrated: 82 kg · ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OXYGEN_EXERCISE_KG} kg O₂/d · ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.DRINKING_WATER_EXERCISE_KG} L water/d · 2.0 h/d bone mitigation.`,
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: `Ejercicio ASCAN calibrado (142 bpm · ${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.EXERCISE_DAILY_HOURS} h/día NASA)`,
        msgEn: `ASCAN Exercise calibrated (142 bpm · ${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.EXERCISE_DAILY_HOURS} h/day NASA)`,
      };
    }

    case 'whc_hygiene_station': {
      sim.objectives.whcInspected = true;
      st.done = true;
      unlockNoteAndPaper(sim, undefined, 2);
      sim.activeRadio = {
        speakerId: 'WHITSON',
        textEs: `WHC STS-126 verificado: recupera agua potable desde ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_URINE_KG} kg orina y ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_VAPOR_KG} kg vapor/día. Space Paper #2 desbloqueado.`,
        textEn: `STS-126 WHC checked: recovers potable water from ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_URINE_KG} kg urine & ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_VAPOR_KG} kg vapor/day. Space Paper #2 unlocked.`,
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'WHC verificado (+Space Paper #2 "WATER FROM URINE!?" en archivo [P])',
        msgEn: 'WHC inspected (+Space Paper #2 "WATER FROM URINE!?" unlocked in [P])',
      };
    }

    case 'eva_locker_station': {
      sim.objectives.evaChecked = true;
      st.done = true;
      unlockNoteAndPaper(sim, undefined, 4);
      sim.activeRadio = {
        speakerId: 'LOVELL',
        textEs: `Piscina NBL (61.5 x 31.1 m · 6.2M gal) y Regla del 8 verificadas: traje EVA ${NASA_CONSTANTS.EVA_SUIT.MAX_AUTONOMY_HOURS} h máx., ${NASA_CONSTANTS.EVA_SUIT.WATER_BAG_LITERS} L agua y ${NASA_CONSTANTS.EVA_SUIT.FOOD_BARS} barra. Space Paper #4 desbloqueado.`,
        textEn: `NBL Pool (61.5 x 31.1 m · 6.2M gal) & Rule of 8 checked: ${NASA_CONSTANTS.EVA_SUIT.MAX_AUTONOMY_HOURS} h EVA autonomy, ${NASA_CONSTANTS.EVA_SUIT.WATER_BAG_LITERS} L drink bag, ${NASA_CONSTANTS.EVA_SUIT.FOOD_BARS} bar. Space Paper #4 unlocked.`,
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Regla del 8 EVA verificada (+Space Paper #4 "SPACE UNDERWATER!?" en [P])',
        msgEn: 'EVA Rule of 8 verified (+Space Paper #4 "SPACE UNDERWATER!?" in [P])',
      };
    }

    case 'crisis_quiz_station': {
      sim.activeRadio = {
        speakerId: 'KATHERINE',
        textEs: 'SIMULACRO FASE 0: Fuga de agua tras 80 días. ¿Qué protege la prioridad vital NASA: Aire < Agua (20% deshidratación) < Comida?',
        textEn: 'PHASE 0 DRILL: Water leak beyond Day 80. Which NASA priority rule saves lives: Air < Water (20% loss) < Food?',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        openCrisisModal: true,
        msgEs: 'Abriendo Simulador de Crisis ECLSS / WHC...',
        msgEn: 'Opening ECLSS / WHC Crisis Simulator...',
      };
    }

    case 'legacy_tablet_station': {
      const nid = st.noteId ?? 1;
      unlockNoteAndPaper(sim, nid, nid === 2 ? 1 : undefined);
      st.done = true;
      const entry = LEGACY_NOTES.find((n) => n.id === nid);
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        openLegacyNoteId: nid,
        msgEs: entry ? `${entry.titleEs} desbloqueada` : `Nota de Legado #${nid} desbloqueada`,
        msgEn: entry ? `${entry.titleEn} unlocked` : `Legacy Note #${nid} unlocked`,
      };
    }

    case 'manifest_eclss': {
      sim.eclssChoice = sim.eclssChoice === 'closed_regen' ? 'open_lioh' : 'closed_regen';
      st.value = sim.eclssChoice;
      st.labelEs = sim.eclssChoice === 'closed_regen' ? 'Carga ECLSS: Reciclaje ISS (730 kg)' : 'Carga ECLSS: LiOH Abierto (9.3 kg/d)';
      st.labelEn = sim.eclssChoice === 'closed_regen' ? 'Payload ECLSS: Closed WPA/CDRA (730 kg)' : 'Payload ECLSS: Open LiOH (9.3 kg/d)';
      sim.objectives.manifestConfigured = true;
      return {
        handItem,
        animType: 'use',
        tone: sim.eclssChoice === 'closed_regen' ? 'ok' : 'warn',
        msgEs:
          sim.eclssChoice === 'closed_regen'
            ? 'Arquitectura ECLSS: Reciclador WPA/CDRA ISS (730 kg · Rentable >80 días)'
            : 'Arquitectura ECLSS: Ciclo Abierto LiOH (9.3 kg/p/día · Advertencia >80 días)',
        msgEn:
          sim.eclssChoice === 'closed_regen'
            ? 'ECLSS selected: ISS Closed WPA/CDRA (730 kg · Breakeven >80 days)'
            : 'ECLSS selected: Open-loop LiOH (9.3 kg/p/d · Depletion warning >80 days)',
      };
    }

    case 'manifest_power': {
      sim.powerChoice = sim.powerChoice === 'fsp_40kw' ? 'solar_only' : 'fsp_40kw';
      st.value = sim.powerChoice;
      sim.powerKwe = sim.powerChoice === 'fsp_40kw' ? 40.0 : 20.0;
      st.labelEs = sim.powerChoice === 'fsp_40kw' ? 'Planta: FSP KRUSTY 40 kWe (5.8 t)' : 'Planta: Solar 20 kWe (Vulnerable 354h)';
      st.labelEn = sim.powerChoice === 'fsp_40kw' ? 'Power: 40 kWe KRUSTY FSP (5.8 t)' : 'Power: 20 kWe Solar (Blackout Risk)';
      sim.objectives.manifestConfigured = true;
      return {
        handItem,
        animType: 'use',
        tone: sim.powerChoice === 'fsp_40kw' ? 'ok' : 'warn',
        msgEs:
          sim.powerChoice === 'fsp_40kw'
            ? 'Planta Energía: FSP KRUSTY 40 kWe (5,800 kg · Opera en oscuridad 354 h)'
            : 'Planta Energía: Paneles Solares 20 kWe (Cae a 0.0002% en tormentas de polvo)',
        msgEn:
          sim.powerChoice === 'fsp_40kw'
            ? 'Power Plant: 40 kWe KRUSTY FSP (5,800 kg · Runs in 354 h darkness)'
            : 'Power Plant: 20 kWe Solar Arrays (Drops to 0.0002% in global dust storms)',
      };
    }

    case 'manifest_rover': {
      sim.roverChoice = sim.roverChoice === 'kilopower_rover' ? 'rtg_solar_rover' : 'kilopower_rover';
      st.value = sim.roverChoice;
      st.labelEs = sim.roverChoice === 'kilopower_rover' ? 'Movilidad: Rover FSP (17 h)' : 'Movilidad: Rover Solar/RTG (1 h)';
      st.labelEn = sim.roverChoice === 'kilopower_rover' ? 'Mobility: FSP Rover (17 h)' : 'Mobility: Solar/RTG Rover (1 h)';
      sim.objectives.manifestConfigured = true;
      return {
        handItem,
        animType: 'use',
        tone: sim.roverChoice === 'kilopower_rover' ? 'ok' : 'warn',
        msgEs:
          sim.roverChoice === 'kilopower_rover'
            ? 'Rover Presurizado 6,000 kg: Tracción FSP 10 kWe (17 horas de autonomía)'
            : 'Rover Presurizado 6,000 kg: Solar/RTG 3.4 kW (Solo 1 hora de autonomía)',
        msgEn:
          sim.roverChoice === 'kilopower_rover'
            ? '6,000 kg Rover: 10 kWe FSP traction (17 hours continuous endurance)'
            : '6,000 kg Rover: 3.4 kW RTG/Solar traction (1 hour limit)',
      };
    }

    case 'meds_stage_button': {
      if (sim.launchStageIndex >= LAUNCH_STAGING_EVENTS.length) {
        sim.launchStageIndex = 0;
      }
      sim.launchStageIndex += 1;
      const ms = LAUNCH_STAGING_EVENTS[sim.launchStageIndex - 1];
      sim.lightingMode = sim.launchStageIndex >= 3 ? 'blueprint_launch' : 'day';
      sim.activeRadio = {
        speakerId: 'KATHERINE',
        textEs: `${ms.phaseEs} (${ms.slsTime}): ${ms.eventEs}`,
        textEn: `${ms.phaseEn} (${ms.slsTime}): ${ms.eventEn}`,
        timestampSec: sim.elapsedSec,
      };
      if (sim.launchStageIndex >= LAUNCH_STAGING_EVENTS.length) {
        sim.objectives.launchCompleted = true;
        st.done = true;
        st.labelEs = 'Cabina MEDS: Inserción TLI Completa [5/5]';
        st.labelEn = 'MEDS Cockpit: TLI Insertion Complete [5/5]';
        unlockNoteAndPaper(sim, 2, 5);
        unlockNoteAndPaper(sim, undefined, 1);
      } else {
        st.labelEs = `Consola MEDS: Siguiente Etapa [${sim.launchStageIndex + 1}/5]`;
        st.labelEn = `MEDS Console: Next Staging Step [${sim.launchStageIndex + 1}/5]`;
      }
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: `${ms.phaseEs} · ${ms.altitudeLabel}`,
        msgEn: `${ms.phaseEn} · ${ms.altitudeLabel}`,
      };
    }

    case 'skylab_thermal_station': {
      if (handItem?.itemKey === 'DA_DuctTapeKit' || handItem?.itemKey === 'DA_ScrewDriver') {
        sim.act1Decision = 'duct_tape_patch';
        sim.objectives.thermalFixed = true;
        st.done = true;
        unlockNoteAndPaper(sim, 3, 1);
        sim.activeRadio = {
          speakerId: 'CONRAD',
          textEs:
            'Parche Skylab/Apollo 13 fijado con éxito (Nota #3): carga térmica cayendo de 163 W/m² a niveles seguros.',
          textEn:
            'Skylab/Apollo 13 parasol patch secured (Note #3): thermal load dropping safely below 163 W/m².',
          timestampSec: sim.elapsedSec,
        };
        return {
          handItem: handItem.itemKey === 'DA_DuctTapeKit' ? null : handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: '¡Escudo térmico reparado al estilo Skylab 2 / Apollo 13! (Nota #3 desbloqueada)',
          msgEn: 'Thermal shield patched Skylab 2 / Apollo 13 style! (Legacy Note #3 unlocked)',
        };
      }
      if (st.progress < 50) {
        st.progress = 50;
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Recoge Cinta Adhesiva o Destornillador de la mesa (o pulsa otra vez para Desvío CDRA de emergencia)',
          msgEn: 'Grab Duct Tape Kit or Screwdriver from center bench (or press again for emergency CDRA loop reroute)',
        };
      }
      sim.act1Decision = 'cdra_reroute';
      sim.objectives.thermalFixed = true;
      st.done = true;
      unlockNoteAndPaper(sim, 3, 1);
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Circuito térmico CDRA desviado — Temperatura en descenso (Nota #3 desbloqueada)',
        msgEn: 'Thermal loop rerouted through CDRA — Cooling active (Legacy Note #3 unlocked)',
      };
    }

    case 'spe_electrolyzer_station': {
      sim.waterLiters = Math.max(20, sim.waterLiters - 0.9);
      sim.o2Percent = Math.min(21.0, sim.o2Percent + 0.7);
      st.done = true;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Electrólisis SPE activa: 2H₂O → 2H₂ + O₂ (66.7% potencia · +0.7% O₂)',
        msgEn: 'SPE Electrolysis active: 2H₂O → 2H₂ + O₂ (66.7% power share · +0.7% O₂)',
      };
    }

    case 'krusty_reactor_station': {
      sim.act2Decision = sim.powerChoice === 'fsp_40kw' ? 'krusty_spe' : 'solar_ration';
      sim.objectives.powerBalanced = true;
      st.done = true;
      sim.lightingMode = sim.powerChoice === 'fsp_40kw' ? 'day' : 'circadian';
      unlockNoteAndPaper(sim, 4, 6);
      sim.activeRadio = {
        speakerId: 'CONRAD',
        textEs:
          sim.powerChoice === 'fsp_40kw'
            ? 'Reactor KRUSTY 40 kWe Stirling estable en oscuridad de 354 h (radiadores 133.4 / 216.2 m²). Nota #4 y Space Paper #6 desbloqueados.'
            : 'Modo Solar Racionado en oscuridad: baterías al límite sin KRUSTY. Nota #4 y Space Paper #6 desbloqueados.',
        textEn:
          sim.powerChoice === 'fsp_40kw'
            ? '40 kWe KRUSTY Stirling steady through 354 h darkness (133.4 / 216.2 m² radiators). Note #4 & Space Paper #6 unlocked.'
            : 'Solar rationing mode: batteries stressed without KRUSTY. Note #4 & Space Paper #6 unlocked.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem: handItem?.itemKey === 'DA_EmergencyFuse' ? null : handItem,
        animType: 'use',
        tone: sim.powerChoice === 'fsp_40kw' ? 'ok' : 'warn',
        msgEs:
          sim.powerChoice === 'fsp_40kw'
            ? 'Reactor FSP KRUSTY 40 kWe estabilizado (Nota #4 + Space Paper #6)'
            : 'Red Solar en racionamiento extremo de emergencia (Nota #4 + Space Paper #6)',
        msgEn:
          sim.powerChoice === 'fsp_40kw'
            ? '40 kWe KRUSTY FSP Reactor stabilized (Note #4 + Space Paper #6)'
            : 'Solar grid placed on emergency rationing (Note #4 + Space Paper #6)',
      };
    }

    case 'aph_chamber_station': {
      sim.objectives.aphHarvested = true;
      st.done = true;
      unlockNoteAndPaper(sim, undefined, 3);
      sim.foodKg += 2.4;
      sim.activeRadio = {
        speakerId: 'WHITSON',
        textEs: 'Cosecha VEG-05 en cámara APH (1,700 cm² · 630+450 nm magenta) exitosa. ¡No olvides cerrar la válvula del compostaje microbiano!',
        textEn: 'VEG-05 tomato harvest in APH rack (1,700 cm² · 630+450 nm magenta) complete. Remember to seal the microbial compost valve!',
        timestampSec: sim.elapsedSec,
      };
      const returnedHand =
        handItem?.itemKey === 'DA_ClayPillow' || !handItem
          ? { uid: `veg05_${Date.now()}`, itemKey: 'DA_CookedRice', charge: 100, clean: true, ammo: 0 }
          : handItem;
      return {
        handItem: returnedHand,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Cosecha VEG-05 recogida bajo luz 630+450 nm (+2.4 kg · Space Paper #3)',
        msgEn: 'VEG-05 tomatoes harvested under 630+450 nm grow glow (+2.4 kg · Space Paper #3)',
      };
    }

    case 'compost_valve_station': {
      sim.objectives.compostIsolated = true;
      sim.act3Decision = 'isolate_bios3';
      st.done = true;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Válvula de compostaje aislada: se detiene drenaje microbiano de O₂ (0.022–0.153 L/kg·min)',
        msgEn: 'Microbial compost loop sealed: O₂ microbial drawdown stopped (0.022–0.153 L/kg·min)',
      };
    }

    case 'bios3_buffer_station': {
      sim.objectives.bios3Activated = true;
      st.done = true;
      sim.waterLiters = Math.min(103.0, sim.waterLiters + 12.0);
      unlockNoteAndPaper(sim, 5, 3);
      sim.activeRadio = {
        speakerId: 'WHITSON',
        textEs: 'Tanque amortiguador (1,000 L agua + 400 kg regolito) y protocolo BIOS-3 (95% recuperación agua) en línea. Nota #5 desbloqueada.',
        textEn: '1,000 L water + 400 kg regolith buffer & BIOS-3 protocol (95% water recovery) active. Legacy Note #5 unlocked.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem: handItem?.itemKey === 'DA_WaterJar' ? null : handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Protocolo BIOS-3 activado (95% rec. agua · Nota #5 desbloqueada)',
        msgEn: 'BIOS-3 protocol engaged (95% water recovery · Legacy Note #5 unlocked)',
      };
    }

    case 'rover_cockpit_station': {
      sim.objectives.roverReturned = true;
      st.done = true;
      sim.activeRadio = {
        speakerId: 'LOVELL',
        textEs:
          sim.roverChoice === 'kilopower_rover'
            ? `Rover de 6,000 kg (${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_DRIVE_POWER_KW} kWe) regresó a salvo con ${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_HOURS_FSP_10KW} h de autonomía FSP.`
            : 'Rover Solar/RTG (límite 1 h) apenas alcanzó la esclusa antes del pico SPE.',
        textEn:
          sim.roverChoice === 'kilopower_rover'
            ? `6,000 kg Rover (${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_DRIVE_POWER_KW} kWe) safely docked with ${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_HOURS_FSP_10KW} h FSP range.`
            : 'Solar/RTG Rover (1 h ceiling) barely reached airlock ahead of SPE spike.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'use',
        tone: sim.roverChoice === 'kilopower_rover' ? 'ok' : 'warn',
        msgEs: 'Rover 6,000 kg acoplado en esclusa — ¡Despliega ahora el blindaje de 2 m de regolito!',
        msgEn: '6,000 kg Rover docked — Deploy the 2 m compacted regolith shield now!',
      };
    }

    case 'regolith_shield_station': {
      sim.objectives.regolithDeployed = true;
      sim.act4Decision = 'shield_2m_rover';
      if (handItem?.itemKey === 'DA_RegolithSample') {
        sim.crewRadiationMsv = Math.max(40, sim.crewRadiationMsv - 15);
      }
      st.done = true;
      sim.lightingMode = 'day';
      unlockNoteAndPaper(sim, 6, undefined);
      return {
        handItem: handItem?.itemKey === 'DA_RegolithSample' ? null : handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Blindaje de 2.0 m regolito (300 g/cm² · 400 t) desplegado — Nota #6 desbloqueada',
        msgEn: '2.0 m compacted regolith shield (300 g/cm² · 400 t) deployed — Note #6 unlocked',
      };
    }

    case 'mission_ending_station': {
      const ending = evaluateMissionEnding(sim);
      sim.endingId = ending;
      st.done = true;
      unlockNoteAndPaper(sim, 6, undefined);
      return {
        handItem,
        animType: 'use',
        tone: ending === 'ending_3_interplanetary_cradle' ? 'ok' : 'warn',
        openEndingModal: ending,
        msgEs: 'Calculando veredicto final AETHER-4 con telemetría real NASA...',
        msgEn: 'Evaluating AETHER-4 final outcome with real NASA telemetry...',
      };
    }

    case 'hatch_next_mission': {
      const nextId = (st.value as MissionId | undefined) ?? 'manifest_launch';
      if (sim.currentMissionId === 'tutorial_hab') {
        const doneCount = [
          sim.objectives.sleepCompleted,
          sim.objectives.powerRestored,
          sim.objectives.eclssCleaned,
          sim.objectives.mealPrepared,
          sim.objectives.exerciseCalibrated,
          sim.objectives.whcInspected,
          sim.objectives.evaChecked,
          sim.objectives.crisisSolved,
        ].filter(Boolean).length;
        if (doneCount < 2) {
          return {
            handItem,
            animType: 'reach',
            tone: 'warn',
            msgEs: `Completa al menos 2 ejercicios de Fase 0 antes de embarcar (${doneCount}/2 hechos)`,
            msgEn: `Complete at least 2 Phase 0 drills before boarding (${doneCount}/2 done)`,
          };
        }
      } else if (sim.currentMissionId === 'manifest_launch' && !sim.objectives.launchCompleted) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Ejecuta las 5 etapas de despegue en la Consola MEDS antes de abrir la escotilla',
          msgEn: 'Step through all 5 launch stages at the MEDS Console before opening hatch',
        };
      } else if (sim.currentMissionId === 'act1_2_surface' && (!sim.objectives.thermalFixed || !sim.objectives.powerBalanced)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Repara el Panel Térmico (Este) y estabiliza KRUSTY/SPE (Norte) antes de avanzar',
          msgEn: 'Fix Thermal Panel (East) & balance KRUSTY/SPE (North) before advancing',
        };
      } else if (sim.currentMissionId === 'act3_greenhouse' && !sim.objectives.aphHarvested && !sim.objectives.bios3Activated) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Cosecha en APH o activa el Tanque BIOS-3 antes de continuar al Acto 4',
          msgEn: 'Harvest APH crops or activate BIOS-3 Tank before advancing to Act 4',
        };
      }
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        advanceMission: nextId,
        msgEs: 'Despresurizando esclusa — Transición al siguiente módulo AETHER-4...',
        msgEn: 'Cycling airlock — Transitioning to next AETHER-4 module...',
      };
    }

    case 'power_charger': {
      if (!st.hasBattery && handItem?.itemKey === 'DA_Battery') {
        st.hasBattery = true;
        st.progress = Math.max(10, handItem.charge);
        st.done = st.progress >= 100;
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: `Batería colocada en el cargador (${Math.round(st.progress)}%)`,
          msgEn: `Battery inserted into charger (${Math.round(st.progress)}%)`,
        };
      }
      if (st.hasBattery && !handItem) {
        const charge = Math.round(st.progress);
        st.hasBattery = false;
        st.progress = 0;
        st.done = false;
        return {
          handItem: {
            uid: `bat_${Date.now()}`,
            itemKey: 'DA_Battery',
            charge,
            clean: true,
            ammo: 0,
          },
          animType: 'use',
          tone: charge >= 95 ? 'ok' : 'warn',
          msgEs: `Batería retirada al ${charge}%`,
          msgEn: `Battery retrieved at ${charge}%`,
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        msgEs: st.hasBattery ? 'Cargando batería... vacía la mano para recogerla' : 'Necesitas la Celda de Batería en mano',
        msgEn: st.hasBattery ? 'Charging battery... free hand to pick up' : 'Hold Battery Cell to insert',
      };
    }

    case 'power_box': {
      if (!st.hasBattery && handItem?.itemKey === 'DA_Battery') {
        if (handItem.charge < 90) {
          return {
            handItem,
            animType: 'reach',
            tone: 'warn',
            msgEs: `Batería al ${handItem.charge}% — Cárgala primero en el Cargador al lado`,
            msgEn: `Battery at ${handItem.charge}% — Charge it first in the adjacent Charger`,
          };
        }
        st.hasBattery = true;
        if (st.hasFuse) st.done = true;
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: st.hasFuse ? 'Batería + Fusible listos — Acciona la Palanca' : 'Batería cargada instalada. Falta el Fusible.',
          msgEn: st.hasFuse ? 'Battery + Fuse installed — Pull the Lever' : 'Charged Battery seated. Fuse still needed.',
        };
      }
      if (!st.hasFuse && (handItem?.itemKey === 'DA_Fuse' || handItem?.itemKey === 'DA_EmergencyFuse')) {
        st.hasFuse = true;
        if (st.hasBattery) st.done = true;
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: st.hasBattery ? 'Fusible + Batería listos — Acciona la Palanca' : 'Fusible instalado. Falta Batería cargada (100%).',
          msgEn: st.hasBattery ? 'Fuse + Battery ready — Pull the Lever' : 'Fuse seated. Charged Battery (100%) still needed.',
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        msgEs: st.done
          ? 'Caja FSP lista — Pulsa la Palanca de Potencia abajo'
          : 'Inserta Batería cargada (100%) y Fusible de la mesa',
        msgEn: st.done
          ? 'FSP box ready — Pull Power Lever right below'
          : 'Insert charged Battery (100%) and Fuse from workbench',
      };
    }

    case 'power_lever': {
      const box = sim.stations.find((s) => s.kind === 'power_box');
      if (!box?.hasBattery || !box?.hasFuse) {
        return {
          handItem,
          animType: 'reach',
          tone: 'err',
          msgEs: 'La Caja FSP requiere Batería cargada + Fusible antes de subir la palanca',
          msgEn: 'FSP Box needs charged Battery + Fuse before throwing lever',
        };
      }
      st.done = true;
      sim.objectives.powerRestored = true;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: `Potencia FSP restaurada (${sim.internalHeatWm2} W/m² nominales en cabina)`,
        msgEn: `FSP power restored (${sim.internalHeatWm2} W/m² cabin thermal baseline)`,
      };
    }

    case 'eclss_vent': {
      if ((st.screwsLeft ?? 0) > 0) {
        if (handItem?.itemKey !== 'DA_ScrewDriver') {
          return {
            handItem,
            animType: 'reach',
            tone: 'warn',
            msgEs: `Rejilla con ${st.screwsLeft} tornillos — Equipa el Destornillador EVA de la mesa`,
            msgEn: `Vent panel has ${st.screwsLeft} screws — Hold EVA Screwdriver from workbench`,
          };
        }
        st.screwsLeft = Math.max(0, (st.screwsLeft ?? 1) - 1);
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs:
            st.screwsLeft > 0
              ? `Tornillo retirado (quedan ${st.screwsLeft})`
              : 'Rejilla abierta — Vacía la mano para extraer el cartucho LiOH sucio',
          msgEn:
            st.screwsLeft > 0
              ? `Screw removed (${st.screwsLeft} left)`
              : 'Vent open — Free hand to pull dirty LiOH cartridge',
        };
      }
      if (st.hasDirtyFilter && !handItem) {
        st.hasDirtyFilter = false;
        return {
          handItem: {
            uid: `lioh_${Date.now()}`,
            itemKey: 'DA_VentFilter',
            charge: 20,
            clean: false,
            ammo: 0,
          },
          animType: 'use',
          tone: 'ok',
          msgEs: 'Cartucho LiOH saturado retirado — Llévalo al Regenerador de al lado',
          msgEn: 'Dirty LiOH cartridge pulled — Clean it in the Regenerator next to it',
        };
      }
      if (!st.hasDirtyFilter && !st.hasCleanFilter && handItem?.itemKey === 'DA_VentFilter' && handItem.clean) {
        st.hasCleanFilter = true;
        st.done = true;
        sim.objectives.eclssCleaned = true;
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: 'Filtro LiOH limpio instalado — Depuración CO₂ (1.08 kg/día) nominal',
          msgEn: 'Clean LiOH filter seated — CO₂ scrubbing (1.08 kg/day) nominal',
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: st.done ? 'ok' : 'warn',
        msgEs: st.done ? 'Ventilación ECLSS 100% operativa' : 'Limpia el filtro LiOH en el Regenerador y regrésalo aquí',
        msgEn: st.done ? 'ECLSS ventilation 100% nominal' : 'Clean the LiOH cartridge at Regenerator and return it here',
      };
    }

    case 'filter_regenerator': {
      if (handItem?.itemKey === 'DA_VentFilter' && !handItem.clean) {
        st.done = true;
        return {
          handItem: { ...handItem, clean: true, charge: 100 },
          animType: 'use',
          tone: 'ok',
          msgEs: 'Cartucho LiOH regenerado al 100% — Insértalo de vuelta en el conducto',
          msgEn: 'LiOH cartridge regenerated to 100% — Insert back into vent duct',
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        msgEs: 'Trae un cartucho LiOH sucio del Conducto de Ventilación',
        msgEn: 'Bring a dirty LiOH cartridge from the Vent Duct',
      };
    }

    case 'ration_dispenser': {
      if (handItem) {
        return { handItem, animType: 'reach', tone: 'warn', msgEs: 'Guarda en Mochila [E] o suelta [RMB] para tomar ración', msgEn: 'Store [E] or drop [RMB] item before grabbing ration' };
      }
      return {
        handItem: { uid: `rice_${Date.now()}`, itemKey: 'DA_Rice', charge: 100, clean: true, ammo: 0 },
        animType: 'use',
        tone: 'ok',
        msgEs: `Sobre de Ración Deshidratada (${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg/d BVAD)`,
        msgEn: `Dehydrated Ration Pouch (${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg/d BVAD)`,
      };
    }

    case 'water_rehydrator': {
      if (handItem) {
        return { handItem, animType: 'reach', tone: 'warn', msgEs: 'Guarda en Mochila [E] o suelta [RMB] para tomar agua', msgEn: 'Store [E] or drop [RMB] item before grabbing water' };
      }
      return {
        handItem: { uid: `water_${Date.now()}`, itemKey: 'DA_WaterPouch', charge: 100, clean: true, ammo: 0 },
        animType: 'use',
        tone: 'ok',
        msgEs: `Bolsa de Agua Rehidratación (${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_REHYDRATION_WATER_KG} kg BVAD)`,
        msgEn: `Rehydration Water Pouch (${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_REHYDRATION_WATER_KG} kg BVAD)`,
      };
    }

    case 'food_heater': {
      if (!st.hasRice && handItem?.itemKey === 'DA_Rice') {
        st.hasRice = true;
        if (st.hasWater) st.progress = 5;
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: st.hasWater ? 'Ración + Agua insertadas — Calentando ración...' : 'Ración insertada — Falta Bolsa de Agua',
          msgEn: st.hasWater ? 'Ration + Water loaded — Heating meal...' : 'Ration loaded — Add Water Pouch',
        };
      }
      if (!st.hasWater && (handItem?.itemKey === 'DA_Fish' || handItem?.itemKey === 'DA_WaterPouch' || handItem?.itemKey === 'DA_WaterJar')) {
        st.hasWater = true;
        if (st.hasRice) st.progress = 5;
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: st.hasRice ? 'Agua + Ración insertadas — Calentando ración...' : 'Agua insertada — Falta Ración Deshidratada',
          msgEn: st.hasRice ? 'Water + Ration loaded — Heating meal...' : 'Water loaded — Add Dehydrated Ration',
        };
      }
      if (st.foodReady && !handItem) {
        st.foodReady = false;
        st.hasRice = false;
        st.hasWater = false;
        st.progress = 0;
        sim.objectives.mealPrepared = true;
        return {
          handItem: { uid: `meal_${Date.now()}`, itemKey: 'DA_Pizzushi', charge: 100, clean: true, ammo: 0 },
          animType: 'use',
          tone: 'ok',
          msgEs: 'Bandeja Hidratada recogida (clic izquierdo para consumir)',
          msgEn: 'Hydrated Meal Tray collected (left-click to eat)',
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        msgEs:
          st.hasRice && st.hasWater
            ? `Calentando comida... (${Math.round(st.progress)}%)`
            : 'Inserta Ración Deshidratada y Bolsa de Agua de al lado',
        msgEn:
          st.hasRice && st.hasWater
            ? `Heating meal... (${Math.round(st.progress)}%)`
            : 'Insert Dehydrated Ration & Water Pouch from dispensers',
      };
    }
  }
}
