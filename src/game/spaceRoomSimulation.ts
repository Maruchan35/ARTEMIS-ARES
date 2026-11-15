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
  | 'nbl_pool_station'
  | 'computer_formulas_station'
  | 'centrifuge_station'
  | 'eclss_fire_station'
  | 'wall_manual_station'
  | 'orion_hatch'
  | 'orion_fault_panel'
  | 'orion_power_panel'
  | 'orion_pilot_seat'
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
  | 'mission_ending_station'
  | 'oga_o2_station'
  | 'cdra_sabatier_station'
  | 'wrs_water_station'
  | 'rpcm_breaker_station'
  | 'atcs_radiator_station'
  | 'quest_airlock_console'
  | 'a13_cryo_stir_panel'
  | 'a13_aquarius_transfer'
  | 'a13_mailbox_bench'
  | 'sts120_array_console'
  | 'sts120_cufflink_bench'
  | 'sts120_obss_repair'
  | 'npc_crew';

export type RoomZoneId =
  | 'west_hab'
  | 'central_corridor'
  | 'east_lab'
  | 'north_meds'
  | 'south_airlock'
  | 'sw_eva_nbl'
  | 'ne_compute_centrifuge'
  | 'se_eclss_fire_storage';

export interface RoomZoneInfo {
  id: RoomZoneId;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  nameEs: string;
  nameEn: string;
  accentHex: string;
}

export interface AutoDoorState {
  id: 'door_west' | 'door_east' | 'door_north' | 'door_south' | 'door_sw' | 'door_ne' | 'door_se' | 'door_orion_hatch';
  x: number;
  y: number;
  axis: 'x' | 'y';
  openProgress: number; // 0 (closed) .. 1 (open)
  wasOpeningAudio?: boolean;
  labelEs: string;
  labelEn: string;
}

export interface StationTrainingBrief {
  titleEs: string;
  titleEn: string;
  purposeEs: string;
  purposeEn: string;
  nasaDataEs: string;
  nasaDataEn: string;
  sourceDoc: string;
}

export const SPACE_ITEM_LABELS: Record<string, { es: string; en: string }> = {
  DA_ScrewDriver: { es: 'Destornillador EVA', en: 'EVA Screwdriver' },
  DA_Battery: { es: 'Batería Litio NASA', en: 'NASA Li-Ion Battery' },
  DA_Fuse: { es: 'Fusible Alta Carga', en: 'High-Load Fuse' },
  DA_EmergencyFuse: { es: 'Fusible Emergencia', en: 'Emergency Fuse' },
  DA_VentFilter: { es: 'Cartucho LiOH (7.0 kg)', en: 'LiOH Cartridge (7.0 kg)' },
  DA_Rice: { es: 'Ración Deshidratada', en: 'Dehydrated Ration' },
  DA_Fish: { es: 'Suplemento / Agua', en: 'Supplement / Water' },
  DA_WaterPouch: { es: 'Bolsa Agua Potable (0.5 L)', en: 'Potable Water Pouch (0.5 L)' },
  DA_WaterJar: { es: 'Jarrón Agua BIOS-3', en: 'BIOS-3 Water Jar' },
  DA_Pizzushi: { es: 'Bandeja Comida Espacial', en: 'Hot Space Meal Tray' },
  DA_CookedRice: { es: 'Cosecha VEG-05 / Tomates', en: 'VEG-05 Tomato Harvest' },
  DA_Sample: { es: 'Muestra Botánica', en: 'Botanical Sample' },
  DA_ClayPillow: { es: 'Almohadilla Arcilla APH', en: 'APH Porous Clay Pillow' },
  DA_DuctTapeKit: { es: 'Kit Cinta Apollo 13', en: 'Apollo 13 Duct Tape Kit' },
  DA_RegolithSample: { es: 'Muestra Regolito Lunar', en: 'Lunar Regolith Core' },
  DA_LegacyTablet: { es: 'Tableta Archivo NASA', en: 'NASA Archive Tablet' },
  DA_AccessCard: { es: 'Tarjeta Comandante', en: 'Commander Keycard' },
  DA_TorqueWrench: { es: 'Llave Dinamométrica EVA', en: 'EVA Torque Wrench' },
  DA_FireExtinguisher: { es: 'Extintor CO₂ PFE (ISS)', en: 'ISS CO₂ PFE Extinguisher' },
  DA_PbaMask: { es: 'Máscara O₂ PBA (Emergencia)', en: 'PBA Emergency O₂ Mask' },
  DA_CryoValve: { es: 'Válvula Criogénica LOX/LH₂', en: 'Cryogenic LOX/LH₂ Valve' },
  DA_FlightPlanCard: { es: 'Cartón Plan de Vuelo (Apollo 13)', en: 'Flight Plan Card (Apollo 13)' },
  DA_SuitHose: { es: 'Manguera Umbilical O₂/Traje', en: 'O₂ Umbilical Suit Hose' },
  DA_MailboxAdapter: { es: 'Adaptador LiOH "Mailbox"', en: '"Mailbox" LiOH Square Adapter' },
  DA_CufflinkKit: { es: 'Kit 5 Cufflinks Ala P6-4B', en: '5x P6-4B Aluminum Cufflinks' },
  DA_InsulatedCutter: { es: 'Pinza Aislada HV (160V DC)', en: 'HV Insulated Wire Cutter (160V)' },
};

export function getSpaceItemLabel(itemKey: string, lang: 'es' | 'en'): string {
  return SPACE_ITEM_LABELS[itemKey]?.[lang] ?? itemKey.replace(/^DA_/, '');
}

export const STATION_ZONES: RoomZoneInfo[] = [
  {
    id: 'west_hab',
    minX: 0.0,
    maxX: 6.2,
    minY: 0.0,
    maxY: 7.0,
    nameEs: 'Habitación y Biomédica (Oeste)',
    nameEn: 'Crew Habitation & Biomed (West)',
    accentHex: '#38bdf8',
  },
  {
    id: 'central_corridor',
    minX: 6.2,
    maxX: 13.8,
    minY: -1.4,
    maxY: 8.4,
    nameEs: 'Pasillos y Núcleo Central',
    nameEn: 'Corridors & Central Hub',
    accentHex: '#94a3b8',
  },
  {
    id: 'east_lab',
    minX: 13.8,
    maxX: 20.6,
    minY: 0.0,
    maxY: 7.0,
    nameEs: 'Laboratorio Ingeniería y Botánica (Este)',
    nameEn: 'Engineering & Botany Lab (East)',
    accentHex: '#22c55e',
  },
  {
    id: 'north_meds',
    minX: 7.2,
    maxX: 12.8,
    minY: 8.4,
    maxY: 13.4,
    nameEs: 'Puente de Mando MEDS (Norte)',
    nameEn: 'MEDS Flight Deck (North)',
    accentHex: '#FF4F00',
  },
  {
    id: 'south_airlock',
    minX: 6.8,
    maxX: 13.2,
    minY: -8.2,
    maxY: -1.4,
    nameEs: 'Hangar Sur y Cápsula Orion',
    nameEn: 'South Hangar & Orion Capsule',
    accentHex: '#f59e0b',
  },
  {
    id: 'sw_eva_nbl',
    minX: -0.4,
    maxX: 5.8,
    minY: -8.4,
    maxY: -2.4,
    nameEs: 'Piscina NBL y Esclusa EVA (Suroeste)',
    nameEn: 'NBL Pool & EVA Prep Bay (SW)',
    accentHex: '#0ea5e9',
  },
  {
    id: 'ne_compute_centrifuge',
    minX: 15.6,
    maxX: 22.0,
    minY: 9.4,
    maxY: 15.2,
    nameEs: 'Cómputo NASA y Centrífuga 4.5G (Noreste)',
    nameEn: 'NASA Compute Lab & 4.5G Centrifuge (NE)',
    accentHex: '#8b5cf6',
  },
  {
    id: 'se_eclss_fire_storage',
    minX: 15.2,
    maxX: 21.8,
    minY: -8.2,
    maxY: -2.4,
    nameEs: 'Cámara Incendio 0g y Almacén (Sureste)',
    nameEn: '0g ECLSS Fire Chamber & Storage (SE)',
    accentHex: '#ef4444',
  },
];

export function getRoomZoneAt(x: number, y: number): RoomZoneInfo {
  if (y > 9.4 && x >= 15.6) return STATION_ZONES[6];
  if (y < -2.4 && x >= 15.2) return STATION_ZONES[7];
  if (y < -2.4 && x <= 5.8) return STATION_ZONES[5];
  if (y >= 8.4 && x < 14.0) return STATION_ZONES[3];
  if (y <= -1.4 && x > 6.2 && x < 14.0) return STATION_ZONES[4];
  if (x < 6.2 && y >= 0.0 && y <= 7.0) return STATION_ZONES[0];
  if (x > 13.8 && y >= 0.0 && y <= 7.0) return STATION_ZONES[2];
  return STATION_ZONES[1];
}

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

export type ThrowPhysicsMode = 'earth_1g' | 'low_g' | 'dense_atmo' | 'zero_g';

export interface RpcBreakerState {
  id: 'OGA' | 'CDRA' | 'WRS' | 'ATCS' | 'PAYLOAD';
  labelEs: string;
  labelEn: string;
  loadKwe: number;
  closed: boolean;
  tripped: boolean;
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
  nblCertified: boolean;
  computerCertified: boolean;
  centrifugeCertified: boolean;
  fireDrillCertified: boolean;
  preflightRepaired: boolean;
  preflightSystemsOn: boolean;
  a13CryoDiagnosed: boolean;
  a13AquariusMigrated: boolean;
  a13MailboxInstalled: boolean;
  a13ColdPowerup: boolean;
  stsArrayInspected: boolean;
  stsCufflinksCrafted: boolean;
  stsWireSnipped: boolean;
  stsArrayDeployed: boolean;
}

export interface SpaceRoomState {
  currentMissionId: MissionId;
  elapsedSec: number;
  lightingMode: LightingMode;
  throwPhysicsMode: ThrowPhysicsMode;
  shutterOpen: boolean;
  orionHatchOpen: boolean;
  orionHatchSealed: boolean;
  orionLevelsChecked: boolean;
  playerInsideOrion: boolean;
  sleeping: boolean;
  sleepTimerSec: number;
  exercisingTimerSec: number;
  cabinPressureKpa: number;
  suitO2Percent: number;
  hydrationPercent: number;
  airlockStep: number;
  airlockPressureKpa: number;
  rpcmBreakers: RpcBreakerState[];
  rpcmLoadKwe: number;
  rpcmTripped: boolean;
  atcsLoopTempK: number;
  stsRedeploySteps: number;
  a13MailboxParts: { card: boolean; hose: boolean; tape: boolean };
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
  doors: AutoDoorState[];
  missionAssigned: boolean;
  stations: RoomStationState[];
  worldItems: WorldItemEntity[];
  objectives: RoomObjectiveProgress;
}

export interface RoomLookTarget {
  kind: 'npc' | 'station' | 'item' | null;
  id: string;
  stationKind?: RoomStationKind;
  labelEs: string;
  labelEn: string;
}

export const WALL_COLLIDER_COUNT = 60;

export const ROOM_BOUNDS = {
  minX: -0.4,
  maxX: 22.0,
  minY: -8.4,
  maxY: 15.2,
  heightM: 3.4,
} as const;

export const STATION_FLOOR_RECTS: Array<{
  id: string;
  zoneId: RoomZoneId;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}> = [
  { id: 'west_hab', zoneId: 'west_hab', minX: 0.0, maxX: 6.2, minY: 0.0, maxY: 7.0 },
  { id: 'corr_west', zoneId: 'central_corridor', minX: 6.2, maxX: 8.4, minY: 2.4, maxY: 4.6 },
  { id: 'central_hub', zoneId: 'central_corridor', minX: 8.4, maxX: 11.6, minY: 1.2, maxY: 5.8 },
  { id: 'corr_east', zoneId: 'central_corridor', minX: 11.6, maxX: 13.8, minY: 2.4, maxY: 4.6 },
  { id: 'east_lab', zoneId: 'east_lab', minX: 13.8, maxX: 20.6, minY: 0.0, maxY: 7.0 },
  { id: 'corr_north', zoneId: 'central_corridor', minX: 8.9, maxX: 11.1, minY: 5.8, maxY: 8.4 },
  { id: 'north_meds', zoneId: 'north_meds', minX: 7.2, maxX: 12.8, minY: 8.4, maxY: 13.4 },
  { id: 'corr_south', zoneId: 'central_corridor', minX: 8.9, maxX: 11.1, minY: -1.4, maxY: 1.2 },
  { id: 'south_airlock', zoneId: 'south_airlock', minX: 6.8, maxX: 13.2, minY: -8.2, maxY: -1.4 },
  // 3 New Training, Buoyancy, Centrifuge & Fire Wings + Corridors
  { id: 'corr_sw', zoneId: 'central_corridor', minX: 2.0, maxX: 4.2, minY: -2.4, maxY: 0.0 },
  { id: 'sw_eva_nbl', zoneId: 'sw_eva_nbl', minX: -0.4, maxX: 5.8, minY: -8.4, maxY: -2.4 },
  { id: 'corr_ne', zoneId: 'central_corridor', minX: 18.2, maxX: 20.4, minY: 7.0, maxY: 9.4 },
  { id: 'ne_compute_centrifuge', zoneId: 'ne_compute_centrifuge', minX: 15.6, maxX: 22.0, minY: 9.4, maxY: 15.2 },
  { id: 'corr_se', zoneId: 'central_corridor', minX: 18.2, maxX: 20.4, minY: -2.4, maxY: 0.0 },
  { id: 'se_eclss_fire_storage', zoneId: 'se_eclss_fire_storage', minX: 15.2, maxX: 21.8, minY: -8.2, maxY: -2.4 },
];

/**
 * Hermetic non-overlapping 8-room & 7-corridor station envelope (60 walls) + furniture/Orion AABBs.
 */
export const SPACE_ROOM_COLLIDERS: Box2DM[] = [
  // ---- West Habitation Perimeter (X=0..6.2, Y=0..7.0) [6] ----
  [-0.25, -0.25, -0.2, 0.0, 7.25, 3.6, 'Wall_WestHab_W'],
  [0.0, 7.0, -0.2, 6.45, 7.25, 3.6, 'Wall_WestHab_N_Win'],
  [0.0, -0.25, -0.2, 2.0, 0.0, 3.6, 'Wall_WestHab_S_L'],
  [4.2, -0.25, -0.2, 6.45, 0.0, 3.6, 'Wall_WestHab_S_R'],
  [6.2, 0.0, -0.2, 6.45, 2.4, 3.6, 'Wall_WestHab_E_S'],
  [6.2, 4.6, -0.2, 6.45, 7.0, 3.6, 'Wall_WestHab_E_N'],

  // ---- Elongated West Corridor (X=6.2..8.4, Y=2.4..4.6) [2] ----
  [6.45, 4.6, -0.2, 8.15, 4.85, 3.6, 'Wall_CorrW_N'],
  [6.45, 2.15, -0.2, 8.15, 2.4, 3.6, 'Wall_CorrW_S'],

  // ---- Central Hub (X=8.4..11.6, Y=1.2..5.8) [8] ----
  [8.15, 0.95, -0.2, 8.4, 2.4, 3.6, 'Wall_Hub_W_S'],
  [8.15, 4.6, -0.2, 8.4, 6.05, 3.6, 'Wall_Hub_W_N'],
  [11.6, 0.95, -0.2, 11.85, 2.4, 3.6, 'Wall_Hub_E_S'],
  [11.6, 4.6, -0.2, 11.85, 6.05, 3.6, 'Wall_Hub_E_N'],
  [8.4, 5.8, -0.2, 8.9, 6.05, 3.6, 'Wall_Hub_N_L'],
  [11.1, 5.8, -0.2, 11.6, 6.05, 3.6, 'Wall_Hub_N_R'],
  [8.4, 0.95, -0.2, 8.9, 1.2, 3.6, 'Wall_Hub_S_L'],
  [11.1, 0.95, -0.2, 11.6, 1.2, 3.6, 'Wall_Hub_S_R'],

  // ---- Elongated East Corridor (X=11.6..13.8, Y=2.4..4.6) [2] ----
  [11.85, 4.6, -0.2, 13.55, 4.85, 3.6, 'Wall_CorrE_N'],
  [11.85, 2.15, -0.2, 13.55, 2.4, 3.6, 'Wall_CorrE_S'],

  // ---- East Engineering & Botany Lab (X=13.8..20.6, Y=0..7.0) [7] ----
  [13.55, 0.0, -0.2, 13.8, 2.4, 3.6, 'Wall_EastLab_W_S'],
  [13.55, 4.6, -0.2, 13.8, 7.0, 3.6, 'Wall_EastLab_W_N'],
  [20.6, -0.25, -0.2, 20.85, 7.25, 3.6, 'Wall_EastLab_E'],
  [13.55, 7.0, -0.2, 18.2, 7.25, 3.6, 'Wall_EastLab_N_L'],
  [20.4, 7.0, -0.2, 20.6, 7.25, 3.6, 'Wall_EastLab_N_R'],
  [13.55, -0.25, -0.2, 18.2, 0.0, 3.6, 'Wall_EastLab_S_L'],
  [20.4, -0.25, -0.2, 20.6, 0.0, 3.6, 'Wall_EastLab_S_R'],

  // ---- Elongated North Corridor (X=8.9..11.1, Y=5.8..8.4) [2] ----
  [8.65, 6.05, -0.2, 8.9, 8.15, 3.6, 'Wall_CorrN_W'],
  [11.1, 6.05, -0.2, 11.35, 8.15, 3.6, 'Wall_CorrN_E'],

  // ---- North MEDS Flight Deck (X=7.2..12.8, Y=8.4..13.4) [5] ----
  [6.95, 8.15, -0.2, 8.9, 8.4, 3.6, 'Wall_Meds_S_L'],
  [11.1, 8.15, -0.2, 13.05, 8.4, 3.6, 'Wall_Meds_S_R'],
  [6.95, 8.4, -0.2, 7.2, 13.4, 3.6, 'Wall_Meds_W'],
  [12.8, 8.4, -0.2, 13.05, 13.4, 3.6, 'Wall_Meds_E'],
  [6.95, 13.4, -0.2, 13.05, 13.65, 3.6, 'Wall_Meds_N'],

  // ---- Elongated South Corridor (X=8.9..11.1, Y=-1.4..1.2) [2] ----
  [8.65, -1.15, -0.2, 8.9, 0.95, 3.6, 'Wall_CorrS_W'],
  [11.1, -1.15, -0.2, 11.35, 0.95, 3.6, 'Wall_CorrS_E'],

  // ---- South Orion Hangar & Boarding Airlock (X=6.8..13.2, Y=-8.2..-1.4) [5] ----
  [6.55, -1.4, -0.2, 8.9, -1.15, 3.6, 'Wall_Airlock_N_L'],
  [11.1, -1.4, -0.2, 13.45, -1.15, 3.6, 'Wall_Airlock_N_R'],
  [6.55, -8.2, -0.2, 6.8, -1.4, 3.6, 'Wall_Airlock_W'],
  [13.2, -8.2, -0.2, 13.45, -1.4, 3.6, 'Wall_Airlock_E'],
  [6.55, -8.45, -0.2, 13.45, -8.2, 3.6, 'Wall_Airlock_S'],

  // ---- Southwest Corridor (X=2.0..4.2, Y=-2.4..0.0) [2] ----
  [1.75, -2.4, -0.2, 2.0, -0.25, 3.6, 'Wall_CorrSW_W'],
  [4.2, -2.4, -0.2, 4.45, -0.25, 3.6, 'Wall_CorrSW_E'],

  // ---- Southwest NBL Pool & EVA Bay (X=-0.4..5.8, Y=-8.4..-2.4) [5] ----
  [-0.65, -2.4, -0.2, 1.75, -2.15, 3.6, 'Wall_SW_N_L'],
  [4.45, -2.4, -0.2, 6.05, -2.15, 3.6, 'Wall_SW_N_R'],
  [-0.65, -8.4, -0.2, -0.4, -2.4, 3.6, 'Wall_SW_W'],
  [5.8, -8.4, -0.2, 6.05, -2.4, 3.6, 'Wall_SW_E'],
  [-0.65, -8.65, -0.2, 6.05, -8.4, 3.6, 'Wall_SW_S'],

  // ---- Northeast Corridor (X=18.2..20.4, Y=7.0..9.4) [2] ----
  [17.95, 7.25, -0.2, 18.2, 9.4, 3.6, 'Wall_CorrNE_W'],
  [20.4, 7.25, -0.2, 20.65, 9.4, 3.6, 'Wall_CorrNE_E'],

  // ---- Northeast Compute & Centrifuge Hall (X=15.6..22.0, Y=9.4..15.2) [5] ----
  [15.35, 9.15, -0.2, 17.95, 9.4, 3.6, 'Wall_NE_S_L'],
  [20.65, 9.15, -0.2, 22.25, 9.4, 3.6, 'Wall_NE_S_R'],
  [15.35, 9.4, -0.2, 15.6, 15.2, 3.6, 'Wall_NE_W'],
  [22.0, 9.4, -0.2, 22.25, 15.2, 3.6, 'Wall_NE_E'],
  [15.35, 15.2, -0.2, 22.25, 15.45, 3.6, 'Wall_NE_N'],

  // ---- Southeast Corridor (X=18.2..20.4, Y=-2.4..0.0) [2] ----
  [17.95, -2.4, -0.2, 18.2, -0.25, 3.6, 'Wall_CorrSE_W'],
  [20.4, -2.4, -0.2, 20.65, -0.25, 3.6, 'Wall_CorrSE_E'],

  // ---- Southeast 0g Fire Chamber & Storage (X=15.2..21.8, Y=-8.2..-2.4) [5] ----
  [14.95, -2.4, -0.2, 17.95, -2.15, 3.6, 'Wall_SE_N_L'],
  [20.65, -2.4, -0.2, 22.05, -2.15, 3.6, 'Wall_SE_N_R'],
  [14.95, -8.2, -0.2, 15.2, -2.4, 3.6, 'Wall_SE_W'],
  [21.8, -8.2, -0.2, 22.05, -2.4, 3.6, 'Wall_SE_E'],
  [14.95, -8.45, -0.2, 22.05, -8.2, 3.6, 'Wall_SE_S'],

  // ---- Interior Furniture & Equipment Racks ----
  // West Hab: Crew Bunk, Galley, North Viewport Desk, WHC Booth, Mirror Pad
  [0.02, 3.75, 0.0, 1.32, 5.95, 1.05, 'Furn_CrewBunk'],
  [0.02, 1.05, 0.0, 1.02, 2.85, 1.15, 'Furn_Galley'],
  [2.15, 6.28, 0.0, 4.25, 6.96, 0.95, 'Furn_WestNorthDesk'],
  [4.80, 6.20, 0.0, 5.95, 6.96, 2.2, 'Furn_WHC_Booth'],
  [5.30, 0.28, 0.0, 6.12, 2.05, 0.35, 'Furn_SuitMirrorPad'],

  // Central Hub: Side Tool Bench
  [8.42, 4.72, 0.0, 8.88, 5.76, 0.92, 'Furn_CorridorToolBench'],

  // East Engineering & Botany Lab (shifted West cleanly clear of NE & SE portals!)
  [19.70, 3.90, 0.0, 20.58, 5.95, 2.15, 'Furn_EastPowerRack'],
  [19.70, 1.05, 0.0, 20.58, 3.55, 2.15, 'Furn_EastThermalRack'],
  [14.30, 0.12, 0.0, 17.90, 0.85, 2.15, 'Furn_EastECLSSRack'],
  [14.25, 6.18, 0.0, 17.85, 6.88, 2.15, 'Furn_EastBotanyKRUSTYRack'],
  [16.55, 3.05, 0.0, 18.15, 4.05, 0.92, 'Furn_EastWorkbench'],

  // North MEDS Command Deck (X=7.2..12.8, Y=8.4..13.4)
  [8.25, 12.60, 0.0, 11.75, 13.35, 0.95, 'Furn_MedsDeckConsole'],
  [8.85, 10.35, 0.0, 11.15, 11.25, 0.92, 'Furn_MedsManifestTable'],

  // South Hangar Walkable Orion Crew Module (aisle X=8.78..11.22, Y=-7.25..-4.55)
  [6.82, -8.18, 0.0, 8.25, -4.55, 2.6, 'Furn_OrionHull_W'],
  [11.75, -8.18, 0.0, 13.18, -4.55, 2.6, 'Furn_OrionHull_E'],
  [9.45, -7.90, 0.0, 10.55, -7.25, 1.1, 'Furn_OrionPilotSeat'],
  [8.25, -7.05, 0.0, 8.78, -5.25, 1.2, 'Furn_OrionConsole_L'],
  [11.22, -7.05, 0.0, 11.75, -5.25, 1.2, 'Furn_OrionConsole_R'],

  // Southwest Wing: NBL Immersion Pool Basin & EVA Prep Bench
  [0.15, -7.85, 0.0, 3.65, -4.35, 0.85, 'Furn_NBL_PoolBasin'],
  [4.95, -7.45, 0.0, 5.75, -5.20, 0.92, 'Furn_SW_ToolBench'],

  // Northeast Wing: NASA Formula Desk, 4.5G Centrifuge Rotor Pedestal & Supply Rack
  [15.65, 11.40, 0.0, 16.45, 14.30, 0.95, 'Furn_NE_FormulaDesk'],
  [18.60, 11.80, 0.0, 20.90, 14.10, 1.35, 'Furn_NE_CentrifugePedestal'],
  [21.15, 9.65, 0.0, 21.95, 11.45, 0.92, 'Furn_NE_SupplyRack'],

  // Southeast Wing: ISS 0g Fire Rack #2 & Storage Benches
  [17.65, -7.95, 0.0, 20.15, -6.95, 2.15, 'Furn_SE_FireRack2'],
  [15.25, -7.20, 0.0, 16.05, -4.30, 0.92, 'Furn_SE_StorageRackW'],
  [20.95, -5.60, 0.0, 21.75, -3.40, 0.92, 'Furn_SE_StorageRackE'],
];

const SURFACE_BOXES = [
  { minX: 0.0, maxX: 1.05, minY: 1.0, maxY: 2.9, topZ: 0.95 },
  { minX: 2.1, maxX: 4.3, minY: 6.22, maxY: 6.98, topZ: 0.95 },
  { minX: 8.4, maxX: 8.95, minY: 4.68, maxY: 5.8, topZ: 0.92 },
  { minX: 16.5, maxX: 18.2, minY: 3.0, maxY: 4.1, topZ: 0.92 },
  { minX: 8.8, maxX: 11.2, minY: 10.3, maxY: 11.3, topZ: 0.92 },
  { minX: 8.2, maxX: 11.8, minY: 12.55, maxY: 13.4, topZ: 0.95 },
  { minX: 4.9, maxX: 5.78, minY: -7.5, maxY: -5.15, topZ: 0.92 },
  { minX: 21.1, maxX: 21.98, minY: 9.6, maxY: 11.5, topZ: 0.92 },
  { minX: 15.2, maxX: 16.1, minY: -7.25, maxY: -4.25, topZ: 0.92 },
  { minX: 20.9, maxX: 21.78, minY: -5.65, maxY: -3.35, topZ: 0.92 },
  { minX: 15.6, maxX: 16.5, minY: 11.35, maxY: 14.35, topZ: 0.95 },
];

export function createDefaultAutoDoors(): AutoDoorState[] {
  return [
    { id: 'door_west', x: 7.3, y: 3.5, axis: 'x', openProgress: 0, labelEs: 'Compuerta Corredor Oeste', labelEn: 'West Airlock Door' },
    { id: 'door_east', x: 12.7, y: 3.5, axis: 'x', openProgress: 0, labelEs: 'Compuerta Lab Este', labelEn: 'East Lab Airlock Door' },
    { id: 'door_north', x: 10.0, y: 7.1, axis: 'y', openProgress: 0, labelEs: 'Compuerta Puente MEDS', labelEn: 'North MEDS Door' },
    { id: 'door_south', x: 10.0, y: -0.1, axis: 'y', openProgress: 0, labelEs: 'Compuerta Hangar Orion', labelEn: 'South Orion Hangar Door' },
    { id: 'door_sw', x: 3.1, y: -1.2, axis: 'y', openProgress: 0, labelEs: 'Compuerta Piscina NBL', labelEn: 'SW NBL Pool Door' },
    { id: 'door_ne', x: 19.3, y: 8.2, axis: 'y', openProgress: 0, labelEs: 'Compuerta Centrífuga 4.5G', labelEn: 'NE Centrifuge Lab Door' },
    { id: 'door_se', x: 19.3, y: -1.2, axis: 'y', openProgress: 0, labelEs: 'Compuerta Cámara Incendio', labelEn: 'SE Fire Chamber Door' },
    { id: 'door_orion_hatch', x: 10.0, y: -4.55, axis: 'y', openProgress: 1, labelEs: 'Escotilla Cápsula Orion', labelEn: 'Orion Capsule Pressure Hatch' },
  ];
}

export function clampToWalkableStation(
  x: number,
  y: number,
  prevX: number,
  prevY: number,
  radius: number,
  doors?: AutoDoorState[]
): [number, number] {
  let px = x;
  let py = y;

  // Enforce closed automatic door barriers cleanly
  if (doors) {
    for (const d of doors) {
      if (d.openProgress >= 0.45) continue;
      if (d.axis === 'x' && Math.abs(py - d.y) < 1.25) {
        const minBlock = d.x - 0.14 - radius;
        const maxBlock = d.x + 0.14 + radius;
        if (prevX <= d.x && px > minBlock) px = minBlock;
        else if (prevX >= d.x && px < maxBlock) px = maxBlock;
      } else if (d.axis === 'y' && Math.abs(px - d.x) < 1.25) {
        const minBlock = d.y - 0.14 - radius;
        const maxBlock = d.y + 0.14 + radius;
        if (prevY <= d.y && py > minBlock) py = minBlock;
        else if (prevY >= d.y && py < maxBlock) py = maxBlock;
      }
    }
  }

  // Exact seam-free shrunk union of all 8 rooms & 7 elongated corridors
  const r = radius;
  const cores: Array<[number, number, number, number]> = [
    [r, r, 6.2 - r, 7.0 - r], // west_hab
    [r, 2.4 + r, 20.6 - r, 4.6 - r], // West-Central-East spine
    [8.4 + r, 1.2 + r, 11.6 - r, 5.8 - r], // central_hub
    [8.9 + r, -4.6 + r, 11.1 - r, 13.4 - r], // South-Central-North spine
    [13.8 + r, r, 20.6 - r, 7.0 - r], // east_lab
    [7.2 + r, 8.4 + r, 12.8 - r, 13.4 - r], // north_meds
    [6.8 + r, -8.2 + r, 13.2 - r, -1.4 - r], // south_airlock (+ Orion capsule)
    [2.0 + r, -2.4 - r, 4.2 - r, r], // corr_sw bridge
    [-0.4 + r, -8.4 + r, 5.8 - r, -2.4 - r], // sw_eva_nbl
    [18.2 + r, 7.0 - r, 20.4 - r, 9.4 + r], // corr_ne bridge
    [15.6 + r, 9.4 + r, 22.0 - r, 15.2 - r], // ne_compute_centrifuge
    [18.2 + r, -2.4 - r, 20.4 - r, r], // corr_se bridge
    [15.2 + r, -8.2 + r, 21.8 - r, -2.4 - r], // se_eclss_fire_storage
  ];

  let inside = false;
  for (const [x1, y1, x2, y2] of cores) {
    if (px >= x1 && px <= x2 && py >= y1 && py <= y2) {
      inside = true;
      break;
    }
  }
  if (!inside) {
    let bestD2 = Infinity;
    let bestX = px;
    let bestY = py;
    for (const [x1, y1, x2, y2] of cores) {
      const cx = px < x1 ? x1 : px > x2 ? x2 : px;
      const cy = py < y1 ? y1 : py > y2 ? y2 : py;
      const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
      if (d2 < bestD2) {
        bestD2 = d2;
        bestX = cx;
        bestY = cy;
      }
    }
    px = bestX;
    py = bestY;
  }

  return [px, py];
}

export function computeStationPathWaypoints(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Array<{ x: number; y: number }> {
  const fromZone = getRoomZoneAt(fromX, fromY).id;
  const toZone = getRoomZoneAt(toX, toY).id;
  if (fromZone === toZone) {
    return [{ x: fromX, y: fromY }, { x: toX, y: toY }];
  }

  // Tree from each room outward to Central Hub (10.0, 3.5)
  const routeToHub = (z: RoomZoneId): Array<{ key: string; x: number; y: number }> => {
    switch (z) {
      case 'west_hab':
        return [{ key: 'wh_door', x: 6.2, y: 3.5 }, { key: 'hub', x: 10.0, y: 3.5 }];
      case 'sw_eva_nbl':
        return [
          { key: 'sw_deck', x: 3.1, y: -2.4 },
          { key: 'wh_sw', x: 3.1, y: 0.8 },
          { key: 'wh_door', x: 6.2, y: 3.5 },
          { key: 'hub', x: 10.0, y: 3.5 },
        ];
      case 'east_lab':
        return [{ key: 'el_door', x: 13.8, y: 3.5 }, { key: 'hub', x: 10.0, y: 3.5 }];
      case 'ne_compute_centrifuge':
        return [
          { key: 'ne_door', x: 19.3, y: 9.4 },
          { key: 'el_ne', x: 19.3, y: 5.8 },
          { key: 'el_door', x: 13.8, y: 3.5 },
          { key: 'hub', x: 10.0, y: 3.5 },
        ];
      case 'se_eclss_fire_storage':
        return [
          { key: 'se_door', x: 19.3, y: -2.4 },
          { key: 'el_se', x: 19.3, y: 1.5 },
          { key: 'el_door', x: 13.8, y: 3.5 },
          { key: 'hub', x: 10.0, y: 3.5 },
        ];
      case 'north_meds':
        return [{ key: 'nm_door', x: 10.0, y: 8.4 }, { key: 'hub', x: 10.0, y: 3.5 }];
      case 'south_airlock':
        return [{ key: 'sa_door', x: 10.0, y: -1.4 }, { key: 'hub', x: 10.0, y: 3.5 }];
      default:
        return [{ key: 'hub', x: 10.0, y: 3.5 }];
    }
  };

  const a = routeToHub(fromZone);
  const b = routeToHub(toZone);
  // Find Lowest Common Ancestor waypoint shared by a and b
  let lcaA = a.length - 1;
  let lcaB = b.length - 1;
  outer: for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (a[i].key === b[j].key) {
        lcaA = i;
        lcaB = j;
        break outer;
      }
    }
  }

  const pts: Array<{ x: number; y: number }> = [{ x: fromX, y: fromY }];
  for (let i = 0; i <= lcaA; i++) pts.push({ x: a[i].x, y: a[i].y });
  for (let j = lcaB - 1; j >= 0; j--) pts.push({ x: b[j].x, y: b[j].y });
  pts.push({ x: toX, y: toY });
  return pts;
}

export function getStationTrainingBrief(kind: RoomStationKind): StationTrainingBrief {
  const map: Partial<Record<RoomStationKind, StationTrainingBrief>> = {
    bunk_bed: {
      titleEs: 'Litera Tripulante · Sueño Circadiano',
      titleEn: 'Crew Bunk · Circadian Rest',
      purposeEs: 'Restablece la fatiga cognitiva y física de la tripulación. Sin ritmo circadiano estable los errores operativos en órbita se multiplican.',
      purposeEn: 'Restores physical and cognitive stamina; circadian disruption in orbit sharply increases crew operational error rates.',
      nasaDataEs: `Ciclo recomendado NASA Twins Study: ${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.SLEEP_RECOMMENDED_HOURS} horas/día (iluminación LED 2,700 K).`,
      nasaDataEn: `NASA Twins Study recommended sleep: ${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.SLEEP_RECOMMENDED_HOURS} h/day (2,700 K evening LED shift).`,
      sourceDoc: 'NASA Twins Study / HRP',
    },
    power_charger: {
      titleEs: 'Cargador de Celdas Litio NASA',
      titleEn: 'NASA Li-Ion Battery Charger',
      purposeEs: 'Carga acumuladores secundarios al 100% antes de conectarlos al bus principal FSP para evitar caídas de voltaje en soporte vital.',
      purposeEn: 'Charges secondary cells to 100% before seating into the main FSP distribution bus to prevent life-support brownouts.',
      nasaDataEs: `Capacidad nominal FSP KRUSTY: ${NASA_CONSTANTS.POWER_AND_THERMAL.FSP_40_NET_KWE} kWe continuos · Solar máximo ${NASA_CONSTANTS.POWER_AND_THERMAL.SOLAR_MAX_KWE} kWe.`,
      nasaDataEn: `Nominal KRUSTY FSP output: ${NASA_CONSTANTS.POWER_AND_THERMAL.FSP_40_NET_KWE} kWe continuous vs ${NASA_CONSTANTS.POWER_AND_THERMAL.SOLAR_MAX_KWE} kWe solar peak.`,
      sourceDoc: 'NASA FSP / KRUSTY NTRS 20190027563',
    },
    power_box: {
      titleEs: 'Caja de Distribución FSP',
      titleEn: 'FSP Power Distribution Box',
      purposeEs: 'Integra batería cargada (100%) y fusible de protección para alimentar depuradores de aire CO₂ y bombas de agua ECLSS.',
      purposeEn: 'Combines a 100% charged battery and protection fuse to power CO₂ scrubbers and ECLSS potable water pumps.',
      nasaDataEs: `Carga térmica interna de cabina: ${NASA_CONSTANTS.POWER_AND_THERMAL.HAB_INTERNAL_HEAT_MAX_WM2} W/m² máximo con rechazo térmico orbital.`,
      nasaDataEn: `Habitat internal thermal load ceiling: ${NASA_CONSTANTS.POWER_AND_THERMAL.HAB_INTERNAL_HEAT_MAX_WM2} W/m² under orbital heat rejection.`,
      sourceDoc: 'BVAD NASA/TP-2015-218570',
    },
    power_lever: {
      titleEs: 'Interruptor Maestro de Potencia Cabina',
      titleEn: 'Cabin Master Power Breaker',
      purposeEs: 'Cierra el circuito del reactor/bus FSP hacia los racks del hábitat tras validar batería y fusible.',
      purposeEn: 'Closes the main FSP bus circuit across habitat racks once battery and fuse safety checks pass.',
      nasaDataEs: `Bus completo energizado a ${NASA_CONSTANTS.POWER_AND_THERMAL.FSP_40_NET_KWE} kWe para operaciones de larga duración (>80 días).`,
      nasaDataEn: `Full bus energized at ${NASA_CONSTANTS.POWER_AND_THERMAL.FSP_40_NET_KWE} kWe supporting missions beyond 80 days.`,
      sourceDoc: 'ESDMD-001 / NASA FSP',
    },
    eclss_vent: {
      titleEs: 'Conducto ECLSS y Cartucho LiOH',
      titleEn: 'ECLSS Vent Duct & LiOH Cartridge',
      purposeEs: 'Elimina el dióxido de carbono exhalado por los astronautas para evitar hipercapnia y asfixia en cabina cerrada.',
      purposeEn: 'Scrubs exhaled CO₂ from the closed cabin atmosphere to prevent hypercapnia and asphyxiation.',
      nasaDataEs: `Metabolismo humano (82 kg): produce ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_CO2_KG} kg CO₂/día y consume ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OXYGEN_EXERCISE_KG} kg O₂/día.`,
      nasaDataEn: `82 kg crew metabolic rate: outputs ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_CO2_KG} kg CO₂/day and consumes ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OXYGEN_EXERCISE_KG} kg O₂/day.`,
      sourceDoc: 'BVAD NASA/TP-2015-218570 Table 4-1',
    },
    filter_regenerator: {
      titleEs: 'Regenerador Térmico de Cartuchos CO₂',
      titleEn: 'CO₂ Cartridge Regenerator',
      purposeEs: 'Desorbe el CO₂ capturado para reutilizar el medio filtrante sin agotar consumibles desechables en misiones lejanas.',
      purposeEn: 'Desorbs captured CO₂ so scrubber cartridges can be reused instead of depleting expendables beyond Earth orbit.',
      nasaDataEs: `Ciclo abierto LiOH consume ~9.3 kg/persona/día; ciclo cerrado CDRA/WPA es rentable >80 días (ESM NASA 2022).`,
      nasaDataEn: `Open-loop LiOH consumes ~9.3 kg/person/day; closed CDRA/WPA breaks even beyond 80 days.`,
      sourceDoc: 'NTRS 20220004670 / BVAD',
    },
    food_heater: {
      titleEs: 'Galley y Calentador de Raciones BVAD',
      titleEn: 'BVAD Food Rehydration Galley',
      purposeEs: 'Rehidrata e higieniza comida termo-estabilizada usando dosis exactas de agua potable en microgravedad o superficie.',
      purposeEn: 'Rehydrates and heats freeze-dried space rations with metered potable water volumes.',
      nasaDataEs: `Consumo BVAD 82 kg: ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg comida seca + ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_REHYDRATION_WATER_KG} kg agua rehidratación/día.`,
      nasaDataEn: `82 kg BVAD standard: ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg dry solids + ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_REHYDRATION_WATER_KG} kg rehydration water/day.`,
      sourceDoc: 'BVAD NASA/TP-2015-218570',
    },
    treadmill_station: {
      titleEs: 'Caminadora de Contramedidas ASCAN',
      titleEn: 'ASCAN Countermeasure Treadmill',
      purposeEs: 'Aplica carga mecánica axial en microgravedad para frenar la desmineralización ósea y atrofia muscular.',
      purposeEn: 'Applies mechanical axial loading in microgravity to counteract bone density loss and muscle atrophy.',
      nasaDataEs: `Prescripción médica ISS/ASCAN: ${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.EXERCISE_DAILY_HOURS} h/día (compensa ~1.5%/mes de pérdida ósea en fémur).`,
      nasaDataEn: `ISS/ASCAN prescription: ${NASA_CONSTANTS.MEDICAL_TWINS_STUDY.EXERCISE_DAILY_HOURS} h/day daily exercise countering ~1.5%/mo bone loss.`,
      sourceDoc: 'NASA Twins Study / HRP Protocol',
    },
    whc_hygiene_station: {
      titleEs: 'Compartimento Higiene WHC (STS-126)',
      titleEn: 'WHC Hygiene & Urine Recovery Rack',
      purposeEs: 'Procesa orina y condensado húmedo para destilar agua ultrapura cerrando el ciclo hídrico de la estación.',
      purposeEn: 'Processes urine and humidity condensate into ultra-pure potable water to close the station water loop.',
      nasaDataEs: `Recicla ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_URINE_KG} kg orina + ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_VAPOR_KG} kg vapor/día hacia ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.DRINKING_WATER_EXERCISE_KG} L consumo diario.`,
      nasaDataEn: `Recovers ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_URINE_KG} kg urine + ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.OUTPUT_VAPOR_KG} kg vapor/day toward ${NASA_CONSTANTS.METABOLIC_DAILY_82KG.DRINKING_WATER_EXERCISE_KG} L intake.`,
      sourceDoc: 'ISS ECLSS / STS-126 UPA & WPA',
    },
    eva_locker_station: {
      titleEs: 'Módulo de Traje EVA y Piscina NBL',
      titleEn: 'EVA Suit Locker & NBL Rule of 8',
      purposeEs: 'Verifica autonomía térmica, suministro de oxígeno y bebida interna antes de cada caminata espacial extravehicular.',
      purposeEn: 'Verifies suit O₂ autonomy, cooling, and in-helmet drink bag before every Extravehicular Activity (EVA).',
      nasaDataEs: `Regla del 8 EVA: ${NASA_CONSTANTS.EVA_SUIT.MAX_AUTONOMY_HOURS} h autonomía · ${NASA_CONSTANTS.EVA_SUIT.WATER_BAG_LITERS} L bolsa de agua · ${NASA_CONSTANTS.EVA_SUIT.FOOD_BARS} barra nutritiva.`,
      nasaDataEn: `EVA Rule of 8: ${NASA_CONSTANTS.EVA_SUIT.MAX_AUTONOMY_HOURS} h autonomy · ${NASA_CONSTANTS.EVA_SUIT.WATER_BAG_LITERS} L water drink bag · ${NASA_CONSTANTS.EVA_SUIT.FOOD_BARS} food bar.`,
      sourceDoc: 'JSC NBL (61.5×31.1 m) / EVA Checklist',
    },
    crisis_quiz_station: {
      titleEs: 'Simulador de Prioridades Vitales NASA',
      titleEn: 'NASA Life-Support Priority Simulator',
      purposeEs: 'Entrena decisiones de emergencia bajo escasez crítica de agua/energía usando los tiempos letales reales de fisiología humana.',
      purposeEn: 'Trains emergency triage decisions using real physiological survival timelines for Air, Water, and Food.',
      nasaDataEs: `Jerarquía NASA: Aire (minutos) < Agua (${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% deshidratación letal en días) < Comida (semanas).`,
      nasaDataEn: `NASA rule: Air (minutes) < Water (${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% lethal body water loss) < Food (weeks).`,
      sourceDoc: 'HIDH / BVAD NASA',
    },
    manifest_eclss: {
      titleEs: 'Manifiesto de Carga ECLSS',
      titleEn: 'ECLSS Payload Architecture',
      purposeEs: 'Selecciona entre reciclaje regenerativo ISS o ciclo abierto antes del lanzamiento orbital SLS.',
      purposeEn: 'Selects between regenerative ISS water/O₂ recycling or open-loop consumables prior to SLS departure.',
      nasaDataEs: `WPA/CDRA cerrado pesa ~730 kg pero ahorra >9.3 kg/persona/día frente a LiOH abierto tras 80 días.`,
      nasaDataEn: `Closed WPA/CDRA mass ~730 kg; beats open-loop LiOH (9.3 kg/p/d) past the 80-day breakeven point.`,
      sourceDoc: 'NTRS 20220004670 ESM',
    },
    manifest_power: {
      titleEs: 'Arquitectura Eléctrica de Misión',
      titleEn: 'Surface & Orbital Power Plant',
      purposeEs: 'Define la resiliencia eléctrica durante noches lunares de 354 horas o tormentas de polvo globales en Marte.',
      purposeEn: 'Defines power resilience through 354-hour lunar nights or Martian global dust storms.',
      nasaDataEs: `FSP KRUSTY 40 kWe (5.8 t) mantiene potencia nominal; Solar 20 kWe cae 99.9998% en tormenta de polvo.`,
      nasaDataEn: `40 kWe KRUSTY FSP (5.8 t) runs steady; 20 kWe solar drops 99.9998% during global dust storms.`,
      sourceDoc: 'NASA FSP / KRUSTY 20190027563',
    },
    manifest_rover: {
      titleEs: 'Selección de Movilidad Rover Presurizado',
      titleEn: 'Pressurized Rover Mobility Config',
      purposeEs: 'Establece el alcance de exploración científica y regreso de emergencia antes de una eyección solar (SPE).',
      purposeEn: 'Sets safe scientific exploration range and emergency return speed ahead of Solar Particle Events (SPE).',
      nasaDataEs: `Rover 6,000 kg: ${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_HOURS_FSP_10KW} h con recarga FSP 10 kWe frente a ${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_HOURS_RTG_3400W} h Solar/RTG.`,
      nasaDataEn: `6,000 kg Rover: ${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_HOURS_FSP_10KW} h endurance with 10 kWe FSP vs ${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_HOURS_RTG_3400W} h Solar/RTG.`,
      sourceDoc: 'ESDMD-001 / NASA FSP',
    },
    meds_stage_button: {
      titleEs: 'Secuencia de Lanzamiento SLS y Cabina MEDS',
      titleEn: 'SLS Launch Staging & MEDS Cockpit',
      purposeEs: 'Ejecuta separación de boosters sólidos, Max-Q, etapa central e Inyección Translunar (TLI) sin superar límites G.',
      purposeEn: 'Executes solid booster staging, Max-Q throttling, core cutoff, and Trans-Lunar Injection (TLI).',
      nasaDataEs: `Arquitectura MEDS de 11 pantallas LCD y empuje SLS hasta 384,400 km / órbita de transferencia.`,
      nasaDataEn: `11-LCD MEDS glass cockpit managing SLS staging burns to orbital / translunar insertion (384,400 km).`,
      sourceDoc: 'Space Shuttle MEDS / Artemis SLS',
    },
    skylab_thermal_station: {
      titleEs: 'Control Térmico Skylab / Apollo 13',
      titleEn: 'Skylab / Apollo 13 Thermal Repair',
      purposeEs: 'Reduce el flujo de calor solar entrante instalando un parasol reflectante Kapton/Mylar sobre la brecha del casco.',
      purposeEn: 'Reduces incoming solar thermal flux by deploying a Kapton/Mylar parasol shield over a breached hull.',
      nasaDataEs: `Mitiga sobrecarga térmica desde 163 W/m² hasta ~112 W/m² para evitar golpe de calor (>38 °C) en cabina.`,
      nasaDataEn: `Drops thermal overload from 163 W/m² down to ~112 W/m², preventing cabin heat stress (>38 °C).`,
      sourceDoc: 'Skylab 2 Repair / BVAD',
    },
    spe_electrolyzer_station: {
      titleEs: 'Electrolizador de Agua SPE (OGS)',
      titleEn: 'SPE Water Electrolyzer (OGS)',
      purposeEs: 'Divide agua reciclada en oxígeno respirable para la tripulación e hidrógeno para la reacción de Sabatier.',
      purposeEn: 'Splits reclaimed water into breathable cabin oxygen and hydrogen for CO₂ reduction (Sabatier).',
      nasaDataEs: `Reacción 2H₂O → 2H₂ + O₂ consume ~66.7% del presupuesto eléctrico ECLSS continuo.`,
      nasaDataEn: `2H₂O → 2H₂ + O₂ reaction consumes ~66.7% of continuous ECLSS power share.`,
      sourceDoc: 'ISS OGS / BVAD',
    },
    krusty_reactor_station: {
      titleEs: 'Reactor Nuclear de Fisión KRUSTY 40 kWe',
      titleEn: '40 kWe KRUSTY Fission Surface Power',
      purposeEs: 'Rechaza calor residual mediante radiadores Stirling en vacío manteniendo 40 kWe constantes día y noche.',
      purposeEn: 'Rejects Stirling waste heat through vacuum radiators while maintaining steady 40 kWe day and night.',
      nasaDataEs: `Radiador de 133.4 m² (lunar) a 216.2 m² (Marciano) en conjunto FSP de 5,800 kg.`,
      nasaDataEn: `133.4 m² (Lunar) to 216.2 m² (Martian) heat rejection radiator with 5,800 kg FSP assembly.`,
      sourceDoc: 'NASA KRUSTY NTRS 20190027563',
    },
    aph_chamber_station: {
      titleEs: 'Cámara Botánica APH / Veggie (VEG-05)',
      titleEn: 'APH / Veggie Growth Chamber (VEG-05)',
      purposeEs: 'Produce alimento fresco rico en antioxidantes y regenera O₂ por fotosíntesis usando LEDs espectrales específicos.',
      purposeEn: 'Produces fresh antioxidant-rich crops and regenerates O₂ via photosynthesis under tuned spectral LEDs.',
      nasaDataEs: `Espectro óptimo 630 nm Rojo + 450 nm Azul · Bandeja 1,700 cm² (~25 m²/persona para dieta plena).`,
      nasaDataEn: `Tuned 630 nm Red + 450 nm Blue LED spectrum · 1,700 cm² tray (~25 m²/person full closure).`,
      sourceDoc: 'ISS Veggie / APH GLA 180 Sensors',
    },
    compost_valve_station: {
      titleEs: 'Válvula de Aislamiento Microbiano',
      titleEn: 'Microbial Compost Isolation Valve',
      purposeEs: 'Aísla sustratos orgánicos cuando la respiración bacteriana del suelo consume O₂ más rápido que las plantas.',
      purposeEn: 'Isolates soil compost beds when microbial respiration strips cabin O₂ faster than crop photosynthesis.',
      nasaDataEs: `Lección real de Biosphere 2: el suelo microbiano drena 0.022–0.153 L O₂/kg·min si no se aísla.`,
      nasaDataEn: `Biosphere 2 lesson: unisolated soil microbes consume 0.022–0.153 L O₂/kg·min.`,
      sourceDoc: 'Biosphere 2 vs BIOS-3 Historical Case',
    },
    bios3_buffer_station: {
      titleEs: 'Tanque Amortiguador Hidropónico BIOS-3',
      titleEn: 'BIOS-3 Hydroponic Buffer Tank',
      purposeEs: 'Sustituye suelo microbiano inestable por arcilla porosa y amortiguación hídrica de alta recuperación.',
      purposeEn: 'Replaces high-draw soil with porous arcillite clay pillows and high-recovery hydroponic buffering.',
      nasaDataEs: `Referencia BIOS-3: tanque de 1,000 L + 400 kg sustrato logrando 95% de recuperación hídrica.`,
      nasaDataEn: `BIOS-3 reference: 1,000 L buffer tank + 400 kg substrate achieving 95% water closure.`,
      sourceDoc: 'BIOS-3 / ISS Veggie Arcillite',
    },
    rover_cockpit_station: {
      titleEs: 'Telemetría Rover Presurizado 6,000 kg',
      titleEn: '6,000 kg Pressurized Rover Dock',
      purposeEs: 'Coordina el acoplamiento rápido del rover tripulado en el hangar antes de que arriben protones solares (SPE).',
      purposeEn: 'Coordinates rapid crewed rover docking inside the protected habitat airlock ahead of SPE proton arrival.',
      nasaDataEs: `Tracción ${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_DRIVE_POWER_KW} kWe · Masa 6,000 kg · Ventana segura 17 h con FSP.`,
      nasaDataEn: `${NASA_CONSTANTS.POWER_AND_THERMAL.ROVER_DRIVE_POWER_KW} kWe drive power · 6,000 kg mass · 17 h safe sortie window with FSP.`,
      sourceDoc: 'NASA ESDMD-001 Pressurized Rover',
    },
    regolith_shield_station: {
      titleEs: 'Escudo Antirradiación de Regolito Compacto',
      titleEn: 'Compacted Regolith Radiation Shield',
      purposeEs: 'Atenúa tormentas de partículas solares (SPE) y radiación cósmica galáctica (GCR) mediante masa superficial local.',
      purposeEn: 'Attenuates Solar Particle Events (SPE) and Galactic Cosmic Rays (GCR) using compacted local surface regolith.',
      nasaDataEs: `Espesor crítico ${NASA_CONSTANTS.RADIATION_AND_SHIELDING.GCR_REGOLITH_THICKNESS_M} m (300 g/cm² · 400 t) para mantener dosis < ${NASA_CONSTANTS.RADIATION_AND_SHIELDING.SPE_30_DAY_LIMIT_MSV} mSv/30d.`,
      nasaDataEn: `${NASA_CONSTANTS.RADIATION_AND_SHIELDING.GCR_REGOLITH_THICKNESS_M} m thickness (300 g/cm² · 400 t) keeping crew dose < ${NASA_CONSTANTS.RADIATION_AND_SHIELDING.SPE_30_DAY_LIMIT_MSV} mSv/30d.`,
      sourceDoc: 'NASA HIDH / Aug 1972 SPE Limit',
    },
    orion_hatch: {
      titleEs: 'Escotilla Lateral de Acceso Orion CM (101.3 kPa)',
      titleEn: 'Orion CM Side Access Pressure Hatch (101.3 kPa)',
      purposeEs: 'Compuerta hermética de embarque desde la Bahía de Lanzamiento LC-39B; se abre para abordar la cápsula y debe cerrarse y sellarse a 101.3 kPa antes de encender sistemas.',
      purposeEn: 'Hermetic crew boarding hatch from LC-39B Launch Bay; opens for ingress and must be latched & sealed at 101.3 kPa before pre-flight power-up.',
      nasaDataEs: `Escotilla de 0.91 m · Sello doble redundante a ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA} kPa (14.7 psi).`,
      nasaDataEn: `0.91 m crew hatch · Redundant pressure seal at ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA} kPa (14.7 psi).`,
      sourceDoc: 'NASA Artemis ESDMD-001 Crew Ingress Spec',
    },
    hatch_next_mission: {
      titleEs: 'Esclusa de Embarque Aeroespacial SLS',
      titleEn: 'SLS Spacecraft Boarding Airlock',
      purposeEs: 'Ejecuta presurización final y secuencia real de ascenso en cohete antes de ingresar a módulos orbitales o planetarios.',
      purposeEn: 'Completes final pressure checks and launches the spacecraft ascent sequence to orbit or surface modules.',
      nasaDataEs: `Velocidad orbital LEO ${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_LEO_ORBITAL_VELOCITY_KMS} km/s, espera L2 ${NASA_CONSTANTS.ORBITAL.L2_PARKING_HOURS} h y descenso lunar ${NASA_CONSTANTS.ORBITAL.LUNAR_DESCENT_HOURS} h.`,
      nasaDataEn: `LEO orbital velocity ${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_LEO_ORBITAL_VELOCITY_KMS} km/s, L2 parking ${NASA_CONSTANTS.ORBITAL.L2_PARKING_HOURS} h, and ${NASA_CONSTANTS.ORBITAL.LUNAR_DESCENT_HOURS} h lunar descent.`,
      sourceDoc: 'Artemis SLS Flight Profile',
    },
    nbl_pool_station: {
      titleEs: 'Piscina NBL y Traje xEMU (Flotabilidad Neutra)',
      titleEn: 'NBL Buoyancy Pool & xEMU Suit Test',
      purposeEs: 'Verifica estanqueidad del traje xEMU a ΔP 29.6 kPa, calibra lastre neutro (0 kg neto) y abre las válvulas de la viga ISS bajo el agua.',
      purposeEn: 'Verifies xEMU suit pressure seal at ΔP 29.6 kPa, trims neutral buoyancy (0 net kg) and operates submerged ISS truss valves.',
      nasaDataEs: `Tanque NBL ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_LENGTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_WIDTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_DEPTH_M} m · 6.2M gal · ΔP 29.6 kPa.`,
      nasaDataEn: `NBL tank ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_LENGTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_WIDTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_DEPTH_M} m · 6.2M gal · ΔP 29.6 kPa.`,
      sourceDoc: 'NASA Neutral Buoyancy Lab (JSC)',
    },
    computer_formulas_station: {
      titleEs: 'Laboratorio de Cómputo y Física Espacial NASA',
      titleEn: 'NASA Spaceflight Math & Formulas Lab',
      purposeEs: 'Valida cálculos críticos antes del vuelo: irradiancia solar inversa (1/r²), presión hidrostática lunar e impulso orbital Tsiolkovsky.',
      purposeEn: 'Validates critical flight calculations: inverse-square solar irradiance (1/r²), lunar fluid pressure & Tsiolkovsky Δv.',
      nasaDataEs: `I₀=${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.SOLAR_IRRADIANCE_1AU_WM2} W/m² → Marte (1.524 UA)≈${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.SOLAR_IRRADIANCE_MARS_MEAN_WM2} W/m² · Luna g=${NASA_CONSTANTS.GRAVITY.MOON.value} m/s².`,
      nasaDataEn: `I₀=${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.SOLAR_IRRADIANCE_1AU_WM2} W/m² → Mars (1.524 AU)≈${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.SOLAR_IRRADIANCE_MARS_MEAN_WM2} W/m² · Moon g=${NASA_CONSTANTS.GRAVITY.MOON.value} m/s².`,
      sourceDoc: 'NASA NSSDC & BVAD Equations',
    },
    centrifuge_station: {
      titleEs: 'Centrífuga Humana 4.5 G + Maniobra AGSM',
      titleEn: '4.5 G Human Centrifuge + AGSM Drill',
      purposeEs: 'Entrena la resistencia vascular bajo cargas +Gz/+Gx hasta 4.5 G combinando válvula anti-G (52% protección) y tensión muscular AGSM.',
      purposeEn: 'Trains cardiovascular tolerance up to 4.5 G using the anti-G bladder valve (52% protection) and AGSM straining maneuver.',
      nasaDataEs: `Techo nominal tripulado +Gx = ${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.MAX_SUSTAINED_LAUNCH_G} G · Alerta por >4.0 G sin maniobra AGSM.`,
      nasaDataEn: `Crewed +Gx ceiling = ${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.MAX_SUSTAINED_LAUNCH_G} G · Tunnel vision onset >4.0 G without AGSM.`,
      sourceDoc: 'NASA HRP Centrifuge Protocol',
    },
    eclss_fire_station: {
      titleEs: 'Protocolo ISS de Incendio 0g (Rack #2)',
      titleEn: 'ISS 0g Rack #2 Fire Suppression Drill',
      purposeEs: 'Ejecuta el orden exacto de la NASA en fuego orbital: 1. Máscara PBA → 2. Cerrar ventilación IMV → 3. Cortar disyuntor → 4. Extintor CO₂ → 5. Depurar CO (<15 ppm).',
      purposeEn: 'Follows official ISS 5-step fire protocol: 1. PBA O₂ → 2. IMV Vent Shut → 3. Power Cut → 4. PFE CO₂ Spray → 5. LiOH Scrub (<15 ppm CO).',
      nasaDataEs: `Cartucho LiOH ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LIOH_CANISTER_MASS_KG} kg limpia CO tóxico a <15 ppm antes de quitar máscara PBA.`,
      nasaDataEn: `${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LIOH_CANISTER_MASS_KG} kg LiOH scrubs toxic CO <15 ppm before PBA doffing.`,
      sourceDoc: 'ISS Emergency Operations Manual',
    },
    orion_fault_panel: {
      titleEs: 'Bahía Crio / Fusible RS-25 de la Cápsula Orion',
      titleEn: 'Orion Cryogenic & RS-25 Fuse Repair Bay',
      purposeEs: 'Purga sellos LOX/LH₂, sustituye el fusible maestro y aplica par exacto con llave EVA antes de energizar la cabina.',
      purposeEn: 'Purges frozen LOX/LH₂ seals, swaps tripped HV bus fuse and torques manifold before cockpit power-up.',
      nasaDataEs: `Fugas criogénicas en RS-25 deben sellarse por debajo de 0.1 kPa/min antes de T-${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_PREVALVE_S * -1}s.`,
      nasaDataEn: `RS-25 cryogenic leaks must test below 0.1 kPa/min prior to T-${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_PREVALVE_S * -1}s.`,
      sourceDoc: 'SLS / Orion Pre-Launch Spec',
    },
    orion_power_panel: {
      titleEs: 'Panel Superior de 5 Interruptores Orion',
      titleEn: 'Orion 5-Switch Overhead Power Panel',
      purposeEs: 'Energiza en secuencia buses 28 VDC, navegación IMU, O₂ de cabina, preválvulas criogénicas y armado SRB verificando carga completa.',
      purposeEn: 'Powers on 28 VDC bus, IMU GNC, cabin O₂, cryo prevalves and SRB ignition arm while verifying no supplies are missing.',
      nasaDataEs: `Cabina Orion nominal: ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA} kPa · O₂ ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_O2_PERCENT}% · 11 pantallas MEDS.`,
      nasaDataEn: `Nominal Orion cockpit: ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA} kPa · O₂ ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_O2_PERCENT}% · 11 MEDS displays.`,
      sourceDoc: 'Orion Crew Module Flight Deck',
    },
    orion_pilot_seat: {
      titleEs: 'Asiento del Comandante Orion (Despegue y Aterrizaje 3D)',
      titleEn: 'Orion Commander Pilot Seat (3D Ascent & Landing)',
      purposeEs: 'Asegura arnés en cabina para ejecutar despegue SLS en 3D con estabilización activa en Max-Q (33.9 kPa) y descenso lunar/marciano.',
      purposeEn: 'Straps into flight seat to pilot 3D SLS ascent with active Max-Q stabilization (33.9 kPa) & 3D planetary landing.',
      nasaDataEs: `Max-Q T+${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_MAX_Q_S}s (${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_MAX_Q_ALT_FT} ft) · SRB Sep T+${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.SLS_SRB_SEP_S}s · TLI ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.SLS_TLI_S}s.`,
      nasaDataEn: `Max-Q T+${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_MAX_Q_S}s (${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_MAX_Q_ALT_FT} ft) · SRB Sep T+${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.SLS_SRB_SEP_S}s · TLI ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.SLS_TLI_S}s.`,
      sourceDoc: 'Artemis I / STS Flight Data',
    },
    oga_o2_station: {
      titleEs: 'Generador de Oxígeno OGA / Toma Traje HPG',
      titleEn: 'OGA Oxygen Generator / HPG Suit Umbilical',
      purposeEs: 'Produce O₂ mediante electrólisis (2H₂O → 2H₂ + O₂) y recarga el tanque portátil del traje EVA a 29.6 kPa (4.3 psi).',
      purposeEn: 'Produces O₂ via water electrolysis (2H₂O → 2H₂ + O₂) and refills portable EVA suit tanks at 29.6 kPa (4.3 psi).',
      nasaDataEs: `Potencia OGA: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.OGA_POWER_KWE} kWe · Traje: ${NASA_CONSTANTS.QUEST_AIRLOCK_EVA.EMU_SUIT_OP_KPA} kPa.`,
      nasaDataEn: `OGA Power: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.OGA_POWER_KWE} kWe · Suit: ${NASA_CONSTANTS.QUEST_AIRLOCK_EVA.EMU_SUIT_OP_KPA} kPa.`,
      sourceDoc: 'ISS ECLSS Node 3 Tranquility & SSP-50261',
    },
    cdra_sabatier_station: {
      titleEs: 'Rack CDRA y Reactor Sabatier (400 °C)',
      titleEn: 'CDRA CO₂ Scrubber & Sabatier Reactor (400 °C)',
      purposeEs: 'Elimina CO₂ atmosférico en tamices de zeolita regenerables y reacciona CO₂ + 4H₂ → CH₄ + 2H₂O para recuperar agua.',
      purposeEn: 'Scrubs CO₂ on regenerative zeolite beds and reacts CO₂ + 4H₂ → CH₄ + 2H₂O at 400 °C to reclaim water.',
      nasaDataEs: `Reactor Sabatier: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.SABATIER_REACTOR_TEMP_C} °C · Potencia CDRA: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.CDRA_POWER_KWE} kWe.`,
      nasaDataEn: `Sabatier Temp: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.SABATIER_REACTOR_TEMP_C} °C · CDRA Power: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.CDRA_POWER_KWE} kWe.`,
      sourceDoc: 'BVAD NASA/TP-2015-218570 Rev 2022',
    },
    wrs_water_station: {
      titleEs: 'Sistema Recuperación de Agua WRS (WPA + UPA)',
      titleEn: 'WRS Water Recovery Rack (WPA + UPA)',
      purposeEs: 'Dispensa agua potable purificada (98% recuperación ISS) para mantener hidratación personal dentro del rango BVAD (2.00–2.79 L/día).',
      purposeEn: 'Dispenses reclaimed potable water (98% ISS recovery) to maintain crew hydration inside BVAD 2.00–2.79 L/day envelope.',
      nasaDataEs: `Recuperación WRS: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.WRS_WATER_RECOVERY_PCT}% · Consumo BVAD: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.CREW_HYDRATION_L_PER_DAY} L/d.`,
      nasaDataEn: `WRS Recovery: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.WRS_WATER_RECOVERY_PCT}% · BVAD Intake: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.CREW_HYDRATION_L_PER_DAY} L/d.`,
      sourceDoc: 'BVAD & ISS Water Recovery Spec',
    },
    rpcm_breaker_station: {
      titleEs: 'Panel Eléctrico MBSU / RPCM (120V DC)',
      titleEn: 'MBSU / RPCM Breaker Rack (120V DC)',
      purposeEs: 'Distribuye 120V DC regulados desde el bus primario 160V DC y protege los racks con disyuntores rearmables manuales.',
      purposeEn: 'Routes 120V DC secondary power stepped down from 160V DC truss lines with manually resettable RPC breakers.',
      nasaDataEs: `Primario ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.SOLAR_PRIMARY_BUS_VDC}V DC → Secundario ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.SECONDARY_MBSU_RPCM_VDC}V DC (límite ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.RPCM_BUS_TRIP_LIMIT_KWE} kWe).`,
      nasaDataEn: `Primary ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.SOLAR_PRIMARY_BUS_VDC}V DC → Secondary ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.SECONDARY_MBSU_RPCM_VDC}V DC (${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.RPCM_BUS_TRIP_LIMIT_KWE} kWe limit).`,
      sourceDoc: 'ISS EPS MBSU / RPCM Architecture',
    },
    atcs_radiator_station: {
      titleEs: 'Bucle Térmico ATCS y Válvula de Amoníaco',
      titleEn: 'ATCS External Ammonia Loop & Radiator Valve',
      purposeEs: 'Transfiere el calor interno hacia los radiadores exteriores reduciendo la carga térmica de 420 K a niveles nominales (~277 K).',
      purposeEn: 'Rejects internal station heat to external photovoltaic radiator panels, dropping loop temp from 420 K down toward 277 K.',
      nasaDataEs: `Enfriamiento ATCS: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_LOOP_HOT_K} K → ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_LOOP_NOMINAL_K} K · Bomba ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_PUMP_POWER_KWE} kWe.`,
      nasaDataEn: `ATCS Cooling: ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_LOOP_HOT_K} K → ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_LOOP_NOMINAL_K} K · Pump ${NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_PUMP_POWER_KWE} kWe.`,
      sourceDoc: 'ISS Active Thermal Control System',
    },
    quest_airlock_console: {
      titleEs: 'Consola Esclusa Quest Airlock (Depress / MPEV)',
      titleEn: 'Quest Joint Airlock Console (Depress / MPEV)',
      purposeEs: 'Ejecuta los 5 pasos reales de despresurización/represurización antes de abrir escotilla exterior evitando enfermedad descompresiva.',
      purposeEn: 'Executes all 5 real Quest EVA depressurization/repressurization stages before exterior hatch unlatch.',
      nasaDataEs: `Secuencia SSP-50261: 101.3 → 70.3 → 39.5 → 29.6 (traje) → 14.0 (scavenge) → 2.1 kPa (MPEV).`,
      nasaDataEn: `SSP-50261 sequence: 101.3 → 70.3 → 39.5 → 29.6 (suit) → 14.0 (scavenge) → 2.1 kPa (MPEV).`,
      sourceDoc: 'NASA SSP-50261 Quest Airlock',
    },
    a13_cryo_stir_panel: {
      titleEs: 'Panel Criogénico O₂ #1/#2 y Buses A/B (Apollo 13)',
      titleEn: 'Cryo O₂ #1/#2 Stir & Bus A/B Fault Panel (Apollo 13)',
      purposeEs: 'Ejecuta agitado criogénico del Tanque #2 (1008→0 psia) y registra caída de Bus A 28.5V / Bus B 29.0V + fuga Tanque #1 (781.9 psia).',
      purposeEn: 'Stirs cryo O₂ Tank #2 (1008→0 psia) and logs Main Bus A 28.5V / Bus B 29.0V drop + Tank #1 leak (781.9 psia).',
      nasaDataEs: `T2 ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.O2_TANK2_NOMINAL_PSIA}→0 psia · T1 ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.O2_TANK1_LEAK_INIT_PSIA} psia · Bus A ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.MAIN_BUS_A_DROP_V}V.`,
      nasaDataEn: `T2 ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.O2_TANK2_NOMINAL_PSIA}→0 psia · T1 ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.O2_TANK1_LEAK_INIT_PSIA} psia · Bus A ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.MAIN_BUS_A_DROP_V}V.`,
      sourceDoc: 'Apollo 13 Report MSC-02680',
    },
    a13_aquarius_transfer: {
      titleEs: 'Bus Bote Salvavidas LM-7 Aquarius (12 A / 336 W)',
      titleEn: 'LM-7 Aquarius Lifeboat Power Switch (12 A / 336 W)',
      purposeEs: 'Apaga el Módulo de Mando Odyssey e inicia modo refugio Aquarius con límite estricto de 12 A (336 W) y 3.3 °C.',
      purposeEn: 'Powers down Odyssey CM and transfers life support to Aquarius lifeboat under strict 12 A (336 W) & 3.3 °C soak.',
      nasaDataEs: `Consumo Aquarius: ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.AQUARIUS_LIFEBOAT_AMPS} A (${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.AQUARIUS_LIFEBOAT_WATTS} W) · Temp ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.COLD_SOAK_CABIN_C} °C.`,
      nasaDataEn: `Aquarius Draw: ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.AQUARIUS_LIFEBOAT_AMPS} A (${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.AQUARIUS_LIFEBOAT_WATTS} W) · Temp ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.COLD_SOAK_CABIN_C} °C.`,
      sourceDoc: 'Apollo 13 Report MSC-02680',
    },
    a13_mailbox_bench: {
      titleEs: 'Mesa Ensamblaje "Mailbox" CO₂ (LiOH Cuadrado)',
      titleEn: '"Mailbox" Square LiOH Adapter Assembly Bench',
      purposeEs: 'Combina Cartón del Plan de Vuelo + Manguera Traje + Duct Tape para acoplar cartuchos cuadrados CM a Aquarius (14.9→1.2 mmHg).',
      purposeEn: 'Combines Flight Plan Card + Suit Hose + Duct Tape to adapt square CM canisters to Aquarius, dropping ppCO₂ from 14.9 to 1.2 mmHg.',
      nasaDataEs: `ppCO₂ pico ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.CO2_PEAK_MMHG} mmHg → ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.CO2_SAFE_POST_MAILBOX_MMHG} mmHg · Ración ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.WATER_RATION_L_PER_DAY} L/d.`,
      nasaDataEn: `Peak ppCO₂ ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.CO2_PEAK_MMHG} → ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.CO2_SAFE_POST_MAILBOX_MMHG} mmHg · Ration ${NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.WATER_RATION_L_PER_DAY} L/d.`,
      sourceDoc: 'Apollo 13 Report MSC-02680',
    },
    sts120_array_console: {
      titleEs: 'Consola Ala Solar P6-4B y Redespliegue por Medio Panel',
      titleEn: 'P6-4B Solar Array Diagnostics & Half-Bay Deploy Console',
      purposeEs: 'Monitorea el desgarro de 2.5 ft (Bahías 29-30) del ala de 240 ft energizada a 160V DC y controla el redespliegue de 5 pasos.',
      purposeEn: 'Monitors the 2.5 ft tear (Bays 29-30) on the live 160V DC 240 ft wing and executes 5-step half-bay deployment.',
      nasaDataEs: `Envergadura ${NASA_CONSTANTS.STS_120_P6_4B_2007.TOTAL_ARRAY_SPAN_FT} ft · Desgarro ${NASA_CONSTANTS.STS_120_P6_4B_2007.TEAR_LENGTH_FT} ft · Bus vivo ${NASA_CONSTANTS.STS_120_P6_4B_2007.LIVE_ARRAY_VOLTAGE_VDC}V DC.`,
      nasaDataEn: `Span ${NASA_CONSTANTS.STS_120_P6_4B_2007.TOTAL_ARRAY_SPAN_FT} ft · Tear ${NASA_CONSTANTS.STS_120_P6_4B_2007.TEAR_LENGTH_FT} ft · Live Bus ${NASA_CONSTANTS.STS_120_P6_4B_2007.LIVE_ARRAY_VOLTAGE_VDC}V DC.`,
      sourceDoc: 'STS-120 / Exp 16 EVA-4 Report',
    },
    sts120_cufflink_bench: {
      titleEs: 'Banco de Fabricación: 5 Mancuernillas ("Cufflinks")',
      titleEn: 'Improvised 5-Cufflink Fabrication Bench (Kapton + Al)',
      purposeEs: 'Construye los 5 tensores aislados con aluminio y cinta Kapton que aliviarán la tensión estructural en las bisagras del ala P6-4B.',
      purposeEn: 'Fabricates all 5 insulated aluminum & Kapton hinge splints ("cufflinks") to transfer tension across torn solar bays.',
      nasaDataEs: `Cantidad: ${NASA_CONSTANTS.STS_120_P6_4B_2007.CUFFLINKS_REQUIRED} cufflinks aislados para Bahías ${NASA_CONSTANTS.STS_120_P6_4B_2007.TORN_BAYS_RANGE}.`,
      nasaDataEn: `Required: ${NASA_CONSTANTS.STS_120_P6_4B_2007.CUFFLINKS_REQUIRED} insulated cufflinks for Bays ${NASA_CONSTANTS.STS_120_P6_4B_2007.TORN_BAYS_RANGE}.`,
      sourceDoc: 'STS-120 / Exp 16 EVA-4 Report',
    },
    sts120_obss_repair: {
      titleEs: 'Punto Exterior Canadarm2 + OBSS (90 ft) en Ala P6-4B',
      titleEn: 'Exterior Worksite: Canadarm2 + 90 ft OBSS Boom (160V DC)',
      purposeEs: 'Tras despresurizar Esclusa Quest a ≤2.1 kPa, corta el alambre atascado con pinza aislada 160V e instala los 5 cufflinks.',
      purposeEn: 'After depressing Quest Airlock ≤2.1 kPa, snips snagged wire with 160V insulated shears and threads all 5 cufflinks.',
      nasaDataEs: `Alcance brazo+OBSS: ${NASA_CONSTANTS.STS_120_P6_4B_2007.CANADARM2_PLUS_OBSS_FT} ft · Tensión fotovoltaica: ${NASA_CONSTANTS.STS_120_P6_4B_2007.LIVE_ARRAY_VOLTAGE_VDC}V DC.`,
      nasaDataEn: `Arm+OBSS Reach: ${NASA_CONSTANTS.STS_120_P6_4B_2007.CANADARM2_PLUS_OBSS_FT} ft · Live PV Array: ${NASA_CONSTANTS.STS_120_P6_4B_2007.LIVE_ARRAY_VOLTAGE_VDC}V DC.`,
      sourceDoc: 'STS-120 / Exp 16 EVA-4 Report',
    },
  };

  return (
    map[kind] ?? {
      titleEs: 'Estación de Entrenamiento NASA',
      titleEn: 'NASA Training Console',
      purposeEs: 'Módulo operativo para prácticas reales de habitabilidad espacial, telemetría biomédica y procedimientos orbitales.',
      purposeEn: 'Operational station for hands-on spaceflight habitability, biomedical telemetry, and orbital procedures.',
      nasaDataEs: `Presión nominal ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA} kPa · O₂ ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_O2_PERCENT}%.`,
      nasaDataEn: `Nominal cabin pressure ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA} kPa · O₂ ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_O2_PERCENT}%.`,
      sourceDoc: 'BVAD NASA/TP-2015-218570',
    }
  );
}

export function createRoomSpawnPlayer(): PlayerPhysicsState {
  // Spawn inside West Crew Habitation facing East toward Dra. Whitson & West Corridor
  return createInitialPlayerState(3.15, 3.2, 0.0, 20, 'station');
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
      y: 3.45,
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
      x: 1.95,
      y: 6.86,
      z: 1.32,
      yawDeg: -90,
      labelEs: 'Escudo Ventanal Exterior',
      labelEn: 'Exterior Viewport Shutter',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'suit_mirror_station',
      kind: 'suit_mirror_station',
      x: 5.50,
      y: 1.45,
      z: 1.25,
      yawDeg: 180,
      labelEs: 'Espejo y Vestidor Traje EVA',
      labelEn: 'EVA Suit Mirror & Customizer',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'npc_whitson',
      kind: 'npc_crew',
      x: 2.05,
      y: 2.20,
      z: 0.85,
      yawDeg: 25,
      labelEs: 'Dra. Whitson',
      labelEn: 'Dr. Whitson',
      progress: 0,
      active: true,
      done: false,
      value: 'WHITSON',
    },
    {
      id: 'npc_conrad',
      kind: 'npc_crew',
      x: 11.15,
      y: 1.80,
      z: 0.85,
      yawDeg: 145,
      labelEs: 'Ing. Conrad',
      labelEn: 'Eng. Conrad',
      progress: 0,
      active: true,
      done: false,
      value: 'CONRAD',
    },
    {
      id: 'npc_lovell',
      kind: 'npc_crew',
      x: 8.15,
      y: -3.20,
      z: 0.85,
      yawDeg: 40,
      labelEs: 'Cmdr. Lovell',
      labelEn: 'Cmdr. Lovell',
      progress: 0,
      active: true,
      done: false,
      value: 'LOVELL',
    },
    {
      id: 'oga_o2_station',
      kind: 'oga_o2_station',
      x: 16.08,
      y: -4.20,
      z: 1.25,
      yawDeg: 0,
      labelEs: 'Rack OGA O₂ (2H₂O→2H₂+O₂ · Recarga Traje 29.6 kPa)',
      labelEn: 'OGA O₂ Rack (2H₂O→2H₂+O₂ · Suit Refill 29.6 kPa)',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'wrs_water_station',
      kind: 'wrs_water_station',
      x: 16.08,
      y: -7.10,
      z: 1.18,
      yawDeg: 0,
      labelEs: 'Toma Potable WRS (WPA+UPA 98% · Beber H₂O BVAD)',
      labelEn: 'WRS Potable Tap (WPA+UPA 98% · Drink BVAD H₂O)',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'cdra_sabatier_station',
      kind: 'cdra_sabatier_station',
      x: 17.35,
      y: -7.10,
      z: 1.28,
      yawDeg: 90,
      labelEs: 'Rack CDRA + Sabatier 400 °C (CO₂ + 4H₂ → CH₄ + 2H₂O)',
      labelEn: 'CDRA + Sabatier 400 °C Rack (CO₂ + 4H₂ → CH₄ + 2H₂O)',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'rpcm_breaker_station',
      kind: 'rpcm_breaker_station',
      x: 20.92,
      y: -6.20,
      z: 1.28,
      yawDeg: 180,
      labelEs: 'Panel MBSU / RPCM 120V DC (Rearmar Disyuntores)',
      labelEn: 'MBSU / RPCM 120V DC Panel (Rebalance / Reset Breakers)',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'atcs_radiator_station',
      kind: 'atcs_radiator_station',
      x: 20.92,
      y: -3.50,
      z: 1.22,
      yawDeg: 180,
      labelEs: 'Válvula Térmica ATCS (Amoníaco Radiadores 420→277 K)',
      labelEn: 'ATCS External Ammonia Loop Valve (Radiators 420→277 K)',
      progress: 0,
      active: true,
      done: false,
    },
    {
      id: 'quest_airlock_console',
      kind: 'quest_airlock_console',
      x: 12.68,
      y: -2.55,
      z: 1.25,
      yawDeg: 180,
      labelEs: 'Consola Esclusa Quest Airlock (Secuencia MPEV kPa)',
      labelEn: 'Quest Joint Airlock Console (MPEV kPa Sequence)',
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
    'BASE EN TIERRA JSC HOUSTON (1G): Recorre los módulos y pasillos para completar el entrenamiento de cabina antes de abordar la nave en el Túnel Sur.';
  let radioEn =
    'EARTH GROUND BASE JSC HOUSTON (1G): Explore connected modules & corridors to complete full pre-flight training before boarding the spacecraft at the South Airlock.';

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
        x: 3.20,
        y: 6.24,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Terminal Diagnóstico NASA (Oeste)',
        labelEn: 'NASA Diagnostics Terminal (West)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'treadmill_station',
        kind: 'treadmill_station',
        x: 2.25,
        y: 5.05,
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
        x: 5.30,
        y: 6.16,
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
        x: 5.50,
        y: 0.78,
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
        x: 8.92,
        y: 5.15,
        z: 1.05,
        yawDeg: 0,
        labelEs: 'Simulador Crisis Fuga Agua (Núcleo Central)',
        labelEn: 'Water Leak Crisis Simulator (Central Hub)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 10.00,
        y: 12.58,
        z: 1.05,
        yawDeg: -90,
        labelEs: 'Nota de Legado #1 (Puente Norte)',
        labelEn: 'Legacy Note #1 (North Deck)',
        progress: 0,
        active: true,
        done: false,
        noteId: 1,
      },
      {
        id: 'power_charger',
        kind: 'power_charger',
        x: 19.68,
        y: 5.45,
        z: 1.08,
        yawDeg: 180,
        labelEs: 'Cargador Batería Litio (Lab Este)',
        labelEn: 'Li-Ion Battery Charger (East Lab)',
        progress: 0,
        active: true,
        done: false,
        hasBattery: false,
      },
      {
        id: 'power_box',
        kind: 'power_box',
        x: 19.68,
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
        x: 19.68,
        y: 4.22,
        z: 1.32,
        yawDeg: 180,
        labelEs: 'Palanca de Potencia Cabina (Lab Este)',
        labelEn: 'Cabin Power Breaker Lever (East Lab)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'eclss_vent',
        kind: 'eclss_vent',
        x: 15.60,
        y: 0.86,
        z: 1.35,
        yawDeg: 90,
        labelEs: 'Conducto CO₂ (4 tornillos · Lab Este)',
        labelEn: 'CO₂ Vent Duct (4 screws · East Lab)',
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
        x: 16.95,
        y: 0.86,
        z: 1.15,
        yawDeg: 90,
        labelEs: 'Regenerador Filtro LiOH (7.0 kg)',
        labelEn: 'LiOH Filter Regenerator (7.0 kg)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'nbl_pool_station',
        kind: 'nbl_pool_station',
        x: 3.85,
        y: -4.25,
        z: 1.12,
        yawDeg: -135,
        labelEs: 'Consola Piscina NBL 61.5 m y Traje xEMU',
        labelEn: '61.5 m NBL Pool & xEMU Suit Console',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'computer_formulas_station',
        kind: 'computer_formulas_station',
        x: 16.52,
        y: 12.85,
        z: 1.18,
        yawDeg: 0,
        labelEs: 'Pizarra Fórmulas NASA y Lab Cómputo (I=I₀/r² · Δv)',
        labelEn: 'NASA Formulas Chalkboard & Compute Lab (I=I₀/r² · Δv)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'centrifuge_station',
        kind: 'centrifuge_station',
        x: 18.60,
        y: 11.45,
        z: 1.12,
        yawDeg: 90,
        labelEs: 'Centrífuga Humana 4.5 G + Maniobra AGSM',
        labelEn: '4.5 G Human Centrifuge + AGSM Drill',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'eclss_fire_station',
        kind: 'eclss_fire_station',
        x: 18.90,
        y: -6.88,
        z: 1.28,
        yawDeg: 90,
        labelEs: 'Cámara Incendio 0g ISS (Rack #2 · PBA/IMV/PFE)',
        labelEn: 'ISS 0g Rack #2 Fire Chamber (PBA/IMV/PFE)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'wall_manual_station',
        kind: 'wall_manual_station',
        x: 16.52,
        y: 11.75,
        z: 1.38,
        yawDeg: 0,
        labelEs: 'Manual Técnico NASA en Pizarra (NBL/Física/Fuego)',
        labelEn: 'NASA Technical Wall Manual (NBL/Math/Fire)',
        progress: 0,
        active: true,
        done: false,
        value: 'computer',
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
        x: 10.00,
        y: -7.12,
        z: 1.25,
        yawDeg: 90,
        labelEs: 'Cápsula Orion Sur: Abordar y Despegar a Fase 1',
        labelEn: 'South Orion Capsule: Board & Launch to Phase 1',
        progress: 0,
        active: true,
        done: false,
        value: 'manifest_launch',
      },
    ];

    worldItems = [
      // Central Hub Bench (X=8.42..8.88, topZ=0.92 -> restZ=0.97)
      { uid: 'room_screwdriver_1', itemKey: 'DA_ScrewDriver', category: 'melee', x: 8.65, y: 5.05, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 25, thrownByPlayer: false, charge: 100 },
      { uid: 'room_battery_1', itemKey: 'DA_Battery', category: 'task', x: 8.65, y: 5.55, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 25 },
      { uid: 'room_fuse_1', itemKey: 'DA_Fuse', category: 'task', x: 8.65, y: 4.82, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 45, thrownByPlayer: false, charge: 100 },
      // East Lab Workbench (topZ=0.92 -> restZ=0.97)
      { uid: 'room_sample_1', itemKey: 'DA_Sample', category: 'task', x: 17.15, y: 3.55, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'room_tablet_1', itemKey: 'DA_LegacyTablet', category: 'utility', x: 17.65, y: 3.65, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -20, thrownByPlayer: false, charge: 100 },
      // West Desk & Galley (topZ=0.95 -> restZ=1.00)
      { uid: 'room_card_1', itemKey: 'DA_AccessCard', category: 'utility', x: 2.65, y: 6.48, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: -15, thrownByPlayer: false, charge: 100 },
      { uid: 'room_pouch_west', itemKey: 'DA_WaterPouch', category: 'utility', x: 0.65, y: 1.65, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 10, thrownByPlayer: false, charge: 100 },
      // SW NBL EVA Prep Bench
      { uid: 'room_wrench_sw', itemKey: 'DA_TorqueWrench', category: 'melee', x: 5.35, y: -5.80, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 12, thrownByPlayer: false, charge: 100 },
      { uid: 'room_cryo_sw', itemKey: 'DA_CryoValve', category: 'task', x: 5.35, y: -6.70, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -10, thrownByPlayer: false, charge: 100 },
      // NE Supply Rack
      { uid: 'room_bat_ne', itemKey: 'DA_Battery', category: 'task', x: 21.55, y: 10.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      // SE Fire & Storage Racks
      { uid: 'room_pba_se', itemKey: 'DA_PbaMask', category: 'utility', x: 15.65, y: -5.20, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 18, thrownByPlayer: false, charge: 100 },
      { uid: 'room_pfe_se', itemKey: 'DA_FireExtinguisher', category: 'task', x: 15.65, y: -6.20, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -25, thrownByPlayer: false, charge: 100 },
      { uid: 'room_tape_se', itemKey: 'DA_DuctTapeKit', category: 'task', x: 21.35, y: -4.40, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 5, thrownByPlayer: false, charge: 100 },
    ];
  } else if (missionId === 'manifest_launch') {
    lightingMode = 'blueprint_launch';
    radioSpeaker = 'KATHERINE';
    radioEs =
      'FASE 1 · PRE-VUELO Y ORION (LC-39B): Configura Manifiesto en Puente MEDS, recoge Llave EVA + Válvula Crio + Fusible, aborda la Cápsula Orion Sur, repara la falla RS-25, enciende los 5 sistemas y siéntate para despegar en 3D.';
    radioEn =
      'PHASE 1 · ORION PRE-FLIGHT (LC-39B): Configure MEDS Manifest, collect EVA Wrench + Cryo Valve + Emergency Fuse, board South Orion Capsule, repair RS-25 fault, power on all 5 overhead switches & strap in for 3D launch.';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 9.00,
        y: 12.58,
        z: 1.18,
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
        x: 9.25,
        y: 10.80,
        z: 1.05,
        yawDeg: 0,
        labelEs: eclssChoice === 'closed_regen' ? 'Carga ECLSS: Reciclaje ISS (730 kg)' : 'Carga ECLSS: LiOH Abierto (9.3 kg/d)',
        labelEn: eclssChoice === 'closed_regen' ? 'Payload ECLSS: Closed WPA/CDRA (730 kg)' : 'Payload ECLSS: Open LiOH (9.3 kg/d)',
        progress: 0,
        active: true,
        done: false,
        value: eclssChoice,
      },
      {
        id: 'manifest_power',
        kind: 'manifest_power',
        x: 10.00,
        y: 10.80,
        z: 1.05,
        yawDeg: 0,
        labelEs: powerChoice === 'fsp_40kw' ? 'Planta: FSP KRUSTY 40 kWe (5.8 t)' : 'Planta: Solar 20 kWe (Vulnerable 354h)',
        labelEn: powerChoice === 'fsp_40kw' ? 'Power: 40 kWe KRUSTY FSP (5.8 t)' : 'Power: 20 kWe Solar (Blackout Risk)',
        progress: 0,
        active: true,
        done: false,
        value: powerChoice,
      },
      {
        id: 'manifest_rover',
        kind: 'manifest_rover',
        x: 10.75,
        y: 10.80,
        z: 1.05,
        yawDeg: 0,
        labelEs: roverChoice === 'kilopower_rover' ? 'Movilidad: Rover FSP (17 h)' : 'Movilidad: Rover Solar/RTG (1 h)',
        labelEn: roverChoice === 'kilopower_rover' ? 'Mobility: FSP Rover (17 h)' : 'Mobility: Solar/RTG Rover (1 h)',
        progress: 0,
        active: true,
        done: false,
        value: roverChoice,
      },
      {
        id: 'orion_hatch',
        kind: 'orion_hatch',
        x: 10.00,
        y: -4.55,
        z: 1.25,
        yawDeg: 0,
        labelEs: 'Escotilla Orion · Abrir / Sellar Presión',
        labelEn: 'Orion Side Hatch · Open / Seal Pressure',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'orion_fault_panel',
        kind: 'orion_fault_panel',
        x: 8.82,
        y: -6.10,
        z: 1.18,
        yawDeg: 0,
        labelEs: 'Bahía Orion Izq: Reparar Falla Crio / Fusible RS-25',
        labelEn: 'Orion Port Bay: Repair Cryo / RS-25 Fuse Fault',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'orion_power_panel',
        kind: 'orion_power_panel',
        x: 11.18,
        y: -6.10,
        z: 1.18,
        yawDeg: 180,
        labelEs: 'Tablero Orion Der: Encender 5 Sistemas y Checklist',
        labelEn: 'Orion Stbd Panel: Power 5 Systems & Checklist',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'orion_pilot_seat',
        kind: 'orion_pilot_seat',
        x: 10.00,
        y: -7.12,
        z: 1.05,
        yawDeg: -90,
        labelEs: 'Asiento Comandante Orion: Sentarse y Despegar en 3D',
        labelEn: 'Orion Pilot Seat: Strap In & 3D Liftoff',
        progress: 0,
        active: true,
        done: false,
        value: 'act1_2_surface',
      },
      {
        id: 'meds_stage_button',
        kind: 'meds_stage_button',
        x: 10.00,
        y: 12.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Simulador MEDS Norte (Referencia Etapas 1-5)',
        labelEn: 'North MEDS Deck Reference (Stages 1-5)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 11.45,
        y: 12.58,
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
        x: 8.65,
        y: -4.20,
        z: 1.25,
        yawDeg: 0,
        labelEs: 'Esclusa Hangar Sur: Descender a Base Superficie (Fase 2)',
        labelEn: 'South Hangar Hatch: Descend to Surface Base (Phase 2)',
        progress: 0,
        active: true,
        done: false,
        value: 'act1_2_surface',
      },
    ];

    worldItems = [
      { uid: 'f1_card', itemKey: 'DA_AccessCard', category: 'utility', x: 8.65, y: 5.05, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'f1_efuse', itemKey: 'DA_EmergencyFuse', category: 'task', x: 8.65, y: 5.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 18, thrownByPlayer: false, charge: 100 },
      { uid: 'f1_cryo', itemKey: 'DA_CryoValve', category: 'task', x: 5.35, y: -6.20, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -12, thrownByPlayer: false, charge: 100 },
      { uid: 'f1_wrench', itemKey: 'DA_TorqueWrench', category: 'melee', x: 15.65, y: -5.60, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 25, thrownByPlayer: false, charge: 100 },
      { uid: 'f1_pfe', itemKey: 'DA_FireExtinguisher', category: 'task', x: 21.35, y: -4.50, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'f1_bat', itemKey: 'DA_Battery', category: 'task', x: 21.55, y: 10.50, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'f1_pouch', itemKey: 'DA_WaterPouch', category: 'utility', x: 0.65, y: 1.65, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 12, thrownByPlayer: false, charge: 100 },
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
      'ALERTA SUPERFICIE: Toma Cinta Apollo 13 o Destornillador en la mesa del Lab Este, repara el Escudo Térmico (163 W/m²), equilibra KRUSTY 40 kWe + Electrólisis SPE.';
    radioEn =
      'SURFACE ALERT: Grab Apollo 13 Duct Tape / Screwdriver at East Lab bench, calibrate Skylab Thermal Shield (163 W/m²), balance KRUSTY 40 kWe + SPE electrolysis.';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 9.00,
        y: 12.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Monitor Térmico y Radiación (Norte)',
        labelEn: 'Thermal & Radiation Monitor (North)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'skylab_thermal_station',
        kind: 'skylab_thermal_station',
        x: 19.68,
        y: 2.05,
        z: 1.35,
        yawDeg: 180,
        labelEs: 'Panel Térmico Skylab / Apollo 13 (163 W/m² · Este)',
        labelEn: 'Skylab Thermal Panel / Apollo 13 Patch (East)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'power_charger',
        kind: 'power_charger',
        x: 19.68,
        y: 5.45,
        z: 1.08,
        yawDeg: 180,
        labelEs: 'Cargador Batería Auxiliar (Este)',
        labelEn: 'Aux Battery Charger (East)',
        progress: 0,
        active: true,
        done: false,
        hasBattery: false,
      },
      {
        id: 'spe_electrolyzer_station',
        kind: 'spe_electrolyzer_station',
        x: 14.85,
        y: 0.86,
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
        x: 16.25,
        y: 6.16,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Reactor KRUSTY 40 kWe & Radiador 133.4 m²',
        labelEn: '40 kWe KRUSTY Stirling & 133.4 m² Radiator',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 11.45,
        y: 12.58,
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
        x: 10.00,
        y: -7.12,
        z: 1.25,
        yawDeg: 90,
        labelEs: 'Cápsula Orion Sur: Misión Invernadero APH/BIOS-3 (Acto 3)',
        labelEn: 'South Orion Capsule: APH/BIOS-3 Greenhouse Mission (Act 3)',
        progress: 0,
        active: true,
        done: false,
        value: 'act3_greenhouse',
      },
    ];

    worldItems = [
      { uid: 'a1_tape', itemKey: 'DA_DuctTapeKit', category: 'task', x: 17.05, y: 3.55, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 10, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_screw', itemKey: 'DA_ScrewDriver', category: 'melee', x: 17.65, y: 3.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 35, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_efuse', itemKey: 'DA_EmergencyFuse', category: 'task', x: 8.65, y: 5.05, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -20, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_bat', itemKey: 'DA_Battery', category: 'task', x: 21.55, y: 10.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 45 },
      { uid: 'a1_wrench', itemKey: 'DA_TorqueWrench', category: 'melee', x: 5.35, y: -5.90, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 14, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_pfe', itemKey: 'DA_FireExtinguisher', category: 'task', x: 15.65, y: -5.50, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -10, thrownByPlayer: false, charge: 100 },
      { uid: 'a1_pouch', itemKey: 'DA_WaterPouch', category: 'utility', x: 0.65, y: 1.65, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 8, thrownByPlayer: false, charge: 100 },
    ];
  } else if (missionId === 'act3_greenhouse') {
    lightingMode = 'spectral_magenta';
    o2Percent = 19.3;
    co2Ppm = 1450;
    humidityPercent = 66;
    tempCelsius = 23.0;
    radioSpeaker = 'WHITSON';
    radioEs =
      'ACTO 3 MAGENTA (630+450 nm): Toma la Almohadilla de Arcilla en la mesa, cosecha tomates VEG-05 en cámara APH (Lab Este), cierra Válvula Microbiana y activa BIOS-3.';
    radioEn =
      'ACT 3 MAGENTA (630+450 nm): Grab Clay Pillow on East bench, harvest VEG-05 in APH rack, seal Microbial Compost Valve & activate BIOS-3 buffer tank.';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 9.00,
        y: 12.58,
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
        x: 17.35,
        y: 6.16,
        z: 1.28,
        yawDeg: -90,
        labelEs: 'Cámara Botánica APH / Veggie (VEG-05 · Este)',
        labelEn: 'APH / Veggie Growth Rack (VEG-05 · East)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'compost_valve_station',
        kind: 'compost_valve_station',
        x: 14.85,
        y: 6.16,
        z: 1.35,
        yawDeg: -90,
        labelEs: 'Válvula Compostaje Microbiano (Drenaje O₂)',
        labelEn: 'Microbial Compost Loop Valve (O₂ Drain)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'bios3_buffer_station',
        kind: 'bios3_buffer_station',
        x: 19.68,
        y: 1.35,
        z: 1.15,
        yawDeg: 180,
        labelEs: 'Tanque Amortiguador BIOS-3 (1,000 L + 400 kg Regolito)',
        labelEn: 'BIOS-3 Buffer Tank (1,000 L + 400 kg Regolith)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 11.45,
        y: 12.58,
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
        x: 10.00,
        y: -7.12,
        z: 1.25,
        yawDeg: 90,
        labelEs: 'Cápsula Orion Sur: Despliegue Rover & Tormenta Solar (Acto 4)',
        labelEn: 'South Orion Capsule: Rover & Solar Storm Mission (Act 4)',
        progress: 0,
        active: true,
        done: false,
        value: 'act4_storm_rover',
      },
    ];

    worldItems = [
      { uid: 'a3_clay', itemKey: 'DA_ClayPillow', category: 'task', x: 17.00, y: 3.55, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'a3_jar', itemKey: 'DA_WaterJar', category: 'task', x: 5.35, y: -6.10, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 15, thrownByPlayer: false, charge: 100 },
      { uid: 'a3_screw', itemKey: 'DA_ScrewDriver', category: 'melee', x: 8.65, y: 5.20, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 40, thrownByPlayer: false, charge: 100 },
      { uid: 'a3_sample', itemKey: 'DA_Sample', category: 'task', x: 21.55, y: 10.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -15, thrownByPlayer: false, charge: 100 },
      { uid: 'a3_pouch', itemKey: 'DA_WaterPouch', category: 'utility', x: 0.65, y: 1.65, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 5, thrownByPlayer: false, charge: 100 },
    ];
  } else if (missionId === 'act4_storm_rover') {
    lightingMode = 'alert';
    crewRadiationMsv = Math.max(carry?.crewRadiationMsv ?? 85, 95);
    radioSpeaker = 'LOVELL';
    radioEs =
      'ACTO 4 ALERTA SPE (>250 mSv): Sube al Puente MEDS (Norte) para acoplar el Rover de 6,000 kg, corre al Lab Este con Regolito y sella 2.0 m de blindaje (300 g/cm²).';
    radioEn =
      'ACT 4 SPE ALERT (>250 mSv): Return 6,000 kg Rover at North MEDS deck, carry Regolith Core to East Lab & deploy 2.0 m compacted shielding (300 g/cm²).';

    stations = [
      ...coreSharedStations,
      {
        id: 'cabin_terminal',
        kind: 'cabin_terminal',
        x: 9.00,
        y: 12.58,
        z: 1.18,
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
        x: 10.85,
        y: 12.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Consola Rover Presurizado 6,000 kg (Puente Norte)',
        labelEn: '6,000 kg Pressurized Rover Console (North)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'regolith_shield_station',
        kind: 'regolith_shield_station',
        x: 19.68,
        y: 2.65,
        z: 1.35,
        yawDeg: 180,
        labelEs: 'Blindaje Regolito Compacto (2.0 m · 300 g/cm² · Este)',
        labelEn: 'Compacted Regolith Shield (2.0 m · 300 g/cm² · East)',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'mission_ending_station',
        kind: 'mission_ending_station',
        x: 10.00,
        y: 10.80,
        z: 1.06,
        yawDeg: 0,
        labelEs: 'Consola Puente MEDS: Veredicto Final AETHER-4',
        labelEn: 'MEDS Central Desk: Evaluate AETHER-4 Final Outcome',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'legacy_tablet_station',
        kind: 'legacy_tablet_station',
        x: 11.45,
        y: 12.58,
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
        x: 10.00,
        y: -7.12,
        z: 1.25,
        yawDeg: 90,
        labelEs: 'Cápsula Orion Sur: Emergencia Apollo 13 · Aquarius (Histórica 1)',
        labelEn: 'South Orion Capsule: Apollo 13 Aquarius Emergency (Historical 1)',
        progress: 0,
        active: true,
        done: false,
        value: 'apollo13_aquarius',
      },
    ];

    worldItems = [
      { uid: 'a4_regolith', itemKey: 'DA_RegolithSample', category: 'task', x: 8.65, y: 5.30, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 0, thrownByPlayer: false, charge: 100 },
      { uid: 'a4_card', itemKey: 'DA_AccessCard', category: 'utility', x: 17.25, y: 3.55, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 15, thrownByPlayer: false, charge: 100 },
      { uid: 'a4_regolith2', itemKey: 'DA_RegolithSample', category: 'task', x: 15.65, y: -5.40, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 10, thrownByPlayer: false, charge: 100 },
      { uid: 'a4_pouch', itemKey: 'DA_WaterPouch', category: 'utility', x: 0.65, y: 1.65, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 6, thrownByPlayer: false, charge: 100 },
    ];
  } else if (missionId === 'apollo13_aquarius') {
    lightingMode = 'circadian';
    shutterOpen = true;
    tempCelsius = NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.COLD_SOAK_CABIN_C;
    co2Ppm = 6400;
    o2Percent = 20.1;
    powerKwe = NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.AQUARIUS_LIFEBOAT_WATTS / 1000;
    batteryPercent = 34;
    waterLiters = 16.0;
    radioSpeaker = 'LOVELL';
    radioEs =
      'APOLLO 13 (1970 · AQUARIUS): 1) Agita Tanque Crio O₂ en Consola SM Sur. 2) Migra buses al refugio Aquarius en MEDS Norte (12 A / 336 W, 3.3 °C). 3) Recoge Plan de Vuelo + Manguera + Cinta Duct Tape y arma el adaptador "Mailbox" en Lab Este (CO₂ 14.9→1.2 mmHg). 4) Raciona agua (0.2 L/día) y reenciende para reentrada.';
    radioEn =
      'APOLLO 13 (1970 · AQUARIUS): 1) Run Cryo O₂ Stir at South SM Panel. 2) Migrate power to Aquarius (12 A / 336 W, 3.3 °C) at North MEDS. 3) Collect Flight Plan Card + Suit Hose + Duct Tape & assemble CO₂ "Mailbox" in East Lab (14.9→1.2 mmHg). 4) Apply 0.2 L/d water ration & cold power-up.';

    stations = [
      ...coreSharedStations,
      {
        id: 'a13_cryo_stir_panel',
        kind: 'a13_cryo_stir_panel',
        x: 11.45,
        y: -5.80,
        z: 1.18,
        yawDeg: 180,
        labelEs: 'Panel SM Cryo O₂: Agitar Tanque #2 / Medir Buses A-B',
        labelEn: 'SM Cryo O₂ Panel: Tank #2 Stir / Check Bus A-B',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'a13_aquarius_transfer',
        kind: 'a13_aquarius_transfer',
        x: 10.00,
        y: 12.60,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Consola LM Aquarius: Migrar a 12 A (336 W) y Ración 0.2 L/d',
        labelEn: 'LM Aquarius Console: Shed to 12 A (336 W) & 0.2 L/d Ration',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'a13_mailbox_bench',
        kind: 'a13_mailbox_bench',
        x: 17.35,
        y: 3.55,
        z: 1.05,
        yawDeg: 0,
        labelEs: 'Banco CO₂ "Mailbox": Plan de Vuelo + Manguera + Cinta',
        labelEn: 'CO₂ "Mailbox" Bench: Flight Plan + Hose + Duct Tape',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'wall_manual_station',
        kind: 'wall_manual_station',
        x: 16.52,
        y: 6.80,
        z: 1.38,
        yawDeg: -90,
        labelEs: 'Manual Técnico Apollo 13 (LM-7 Aquarius)',
        labelEn: 'Apollo 13 Technical Manual (LM-7 Aquarius)',
        progress: 0,
        active: true,
        done: false,
        value: 'eclss',
      },
      {
        id: 'hatch_next_mission',
        kind: 'hatch_next_mission',
        x: 10.00,
        y: -7.12,
        z: 1.25,
        yawDeg: 90,
        labelEs: 'Cápsula Orion Sur: Reentrada Pacífico → STS-120 EVA-4',
        labelEn: 'South Capsule: Pacific Splashdown → STS-120 EVA-4',
        progress: 0,
        active: true,
        done: false,
        value: 'sts120_p6_solar',
      },
    ];

    worldItems = [
      { uid: 'a13_plan', itemKey: 'DA_FlightPlanCard', category: 'task', x: 2.85, y: 6.55, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 5, thrownByPlayer: false, charge: 100 },
      { uid: 'a13_hose', itemKey: 'DA_SuitHose', category: 'task', x: 5.35, y: -6.10, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 18, thrownByPlayer: false, charge: 100 },
      { uid: 'a13_tape', itemKey: 'DA_DuctTapeKit', category: 'task', x: 8.65, y: 5.10, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -10, thrownByPlayer: false, charge: 100 },
      { uid: 'a13_screw', itemKey: 'DA_ScrewDriver', category: 'melee', x: 17.55, y: 3.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 28, thrownByPlayer: false, charge: 100 },
      { uid: 'a13_pouch', itemKey: 'DA_WaterPouch', category: 'utility', x: 0.65, y: 1.65, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 10, thrownByPlayer: false, charge: 100 },
      { uid: 'a13_card', itemKey: 'DA_AccessCard', category: 'utility', x: 21.55, y: 10.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -15, thrownByPlayer: false, charge: 100 },
    ];
  } else {
    // sts120_p6_solar
    lightingMode = 'blueprint_launch';
    shutterOpen = true;
    powerKwe = 12.4;
    batteryPercent = 66;
    radioSpeaker = 'CONRAD';
    radioEs =
      'STS-120 (2007 · ALA P6-4B): 1) Diagnostica desgarro de 2.5 ft (Bahías 29–30, 160V DC) en MEDS Norte. 2) Fabrica 5 Cufflinks de aluminio en Banco Lab Este. 3) Despresuriza Esclusa Quest a ~2.1 kPa (MPEV). 4) Toma Pinza Aislada HV + Cufflinks, sal al sitio Canadarm2+OBSS Sur, corta alambre y redespliega por medias bahías (5 pasos).';
    radioEn =
      'STS-120 (2007 · P6-4B WING): 1) Diagnose 2.5 ft tear (Bays 29–30, 160V DC) at North MEDS. 2) Craft 5 aluminum Cufflinks in East Lab. 3) Depressurize Quest Airlock to ~2.1 kPa (MPEV). 4) Carry HV Insulated Cutter + Cufflinks to South Canadarm2+OBSS site, snip snagged wire & deploy half-bay at a time (5 steps).';

    stations = [
      ...coreSharedStations,
      {
        id: 'sts120_array_console',
        kind: 'sts120_array_console',
        x: 9.50,
        y: 12.58,
        z: 1.18,
        yawDeg: -90,
        labelEs: 'Consola P6-4B (MEDS): Diagnosticar Desgarro 2.5 ft · 160V DC',
        labelEn: 'P6-4B Telemetry (MEDS): Diagnose 2.5 ft Tear · 160V DC',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'sts120_cufflink_bench',
        kind: 'sts120_cufflink_bench',
        x: 17.35,
        y: 3.55,
        z: 1.05,
        yawDeg: 0,
        labelEs: 'Banco Fabricación Truss: Armar 5 Cufflinks Aluminio',
        labelEn: 'Truss Fabrication Bench: Craft 5 Aluminum Cufflinks',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'sts120_obss_repair',
        kind: 'sts120_obss_repair',
        x: 12.35,
        y: -3.55,
        z: 1.22,
        yawDeg: 180,
        labelEs: 'Sitio Canadarm2 + OBSS (90 ft): Cortar Cable, Instalar Cufflinks y Desplegar Ala',
        labelEn: 'Canadarm2 + 90 ft OBSS Worksite: Snip Wire, Install Cufflinks & Half-Bay Deploy',
        progress: 0,
        active: true,
        done: false,
      },
      {
        id: 'wall_manual_station',
        kind: 'wall_manual_station',
        x: 16.52,
        y: 6.80,
        z: 1.38,
        yawDeg: -90,
        labelEs: 'Manual EVA-4 STS-120 (P6-4B / 160V DC)',
        labelEn: 'STS-120 EVA-4 Manual (P6-4B / 160V DC)',
        progress: 0,
        active: true,
        done: false,
        value: 'power',
      },
      {
        id: 'hatch_next_mission',
        kind: 'hatch_next_mission',
        x: 10.00,
        y: -7.12,
        z: 1.25,
        yawDeg: 90,
        labelEs: 'Cápsula Orion Sur: Regresar a Tierra (Entrenamiento JSC)',
        labelEn: 'South Orion Capsule: Return to Earth Base (JSC Training)',
        progress: 0,
        active: true,
        done: false,
        value: 'tutorial_hab',
      },
    ];

    worldItems = [
      { uid: 'sts_cutter', itemKey: 'DA_InsulatedCutter', category: 'task', x: 5.35, y: -6.20, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 14, thrownByPlayer: false, charge: 100 },
      { uid: 'sts_tape', itemKey: 'DA_DuctTapeKit', category: 'task', x: 8.65, y: 5.20, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -8, thrownByPlayer: false, charge: 100 },
      { uid: 'sts_screw', itemKey: 'DA_ScrewDriver', category: 'melee', x: 17.55, y: 3.45, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: 25, thrownByPlayer: false, charge: 100 },
      { uid: 'sts_wrench', itemKey: 'DA_TorqueWrench', category: 'melee', x: 15.65, y: -5.60, z: 0.97, vx: 0, vy: 0, vz: 0, yawDeg: -16, thrownByPlayer: false, charge: 100 },
      { uid: 'sts_pouch', itemKey: 'DA_WaterPouch', category: 'utility', x: 0.65, y: 1.65, z: 1.00, vx: 0, vy: 0, vz: 0, yawDeg: 4, thrownByPlayer: false, charge: 100 },
    ];
  }

  return {
    currentMissionId: missionId,
    elapsedSec: 0,
    lightingMode,
    throwPhysicsMode: missionId === 'tutorial_hab' ? 'earth_1g' : 'zero_g',
    shutterOpen,
    orionHatchOpen: missionId !== 'manifest_launch',
    orionHatchSealed: missionId !== 'manifest_launch',
    orionLevelsChecked: missionId !== 'manifest_launch',
    playerInsideOrion: false,
    sleeping: false,
    sleepTimerSec: 0,
    exercisingTimerSec: 0,
    cabinPressureKpa: NASA_CONSTANTS.HABITAT_ATMOSPHERE.NOMINAL_PRESSURE_KPA,
    suitO2Percent: 100,
    hydrationPercent: 92,
    airlockStep: 0,
    airlockPressureKpa: NASA_CONSTANTS.QUEST_AIRLOCK_EVA.CABIN_NOMINAL_KPA,
    rpcmBreakers: [
      { id: 'OGA', labelEs: 'Bus OGA (Electrólisis O₂)', labelEn: 'OGA Bus (O₂ Electrolysis)', loadKwe: 1.4, closed: true, tripped: false },
      { id: 'CDRA', labelEs: 'Bus CDRA / Sabatier CO₂', labelEn: 'CDRA / Sabatier CO₂ Bus', loadKwe: 1.5, closed: true, tripped: false },
      { id: 'WRS', labelEs: 'Bus WRS (Agua WPA+UPA)', labelEn: 'WRS Bus (WPA+UPA Water)', loadKwe: 1.1, closed: true, tripped: false },
      { id: 'ATCS', labelEs: 'Bus ATCS (Amoníaco Radiadores)', labelEn: 'ATCS Bus (Ammonia Loop)', loadKwe: 1.2, closed: true, tripped: false },
      { id: 'PAYLOAD', labelEs: 'Bus Payloads / Estufa', labelEn: 'Payloads / Heater Aux Bus', loadKwe: 0.8, closed: true, tripped: false },
    ],
    rpcmLoadKwe: 6.0,
    rpcmTripped: false,
    atcsLoopTempK: missionId === 'act1_2_surface' ? 420 : NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_LOOP_NOMINAL_K,
    stsRedeploySteps: 0,
    a13MailboxParts: { card: false, hose: false, tape: false },
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
    doors: createDefaultAutoDoors().map((d) =>
      d.id === 'door_orion_hatch' ? { ...d, openProgress: missionId === 'manifest_launch' ? 0 : 1 } : d
    ),
    missionAssigned: false,
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
      nblCertified: false,
      computerCertified: false,
      centrifugeCertified: false,
      fireDrillCertified: false,
      preflightRepaired: missionId !== 'manifest_launch',
      preflightSystemsOn: missionId !== 'manifest_launch',
      a13CryoDiagnosed: false,
      a13AquariusMigrated: false,
      a13MailboxInstalled: false,
      a13ColdPowerup: false,
      stsArrayInspected: false,
      stsCufflinksCrafted: false,
      stsWireSnipped: false,
      stsArrayDeployed: false,
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
  gravityMs2: number = PAWN_CONSTANTS.gravityMs2,
  doors?: AutoDoorState[]
): PlayerPhysicsState {
  const next = { ...state };
  const clampedDt = Math.min(0.05, Math.max(0.001, dtSec));
  const subCount = Math.min(12, Math.max(2, Math.round(clampedDt / PAWN_CONSTANTS.asyncDeltaSec)));
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

    const prevX = next.x;
    const prevY = next.y;
    const [px, py] = resolveCircleVsBoxes(
      next.x + next.vx * h,
      next.y + next.vy * h,
      next.z,
      PAWN_CONSTANTS.collisionRadiusM,
      SPACE_ROOM_COLLIDERS
    );
    const [clampedX, clampedY] = clampToWalkableStation(
      px,
      py,
      prevX,
      prevY,
      PAWN_CONSTANTS.collisionRadiusM,
      doors
    );
    next.x = clampedX;
    next.y = clampedY;

    if (!next.grounded || next.vz > 0) {
      next.vz -= Math.max(1.62, gravityMs2) * h;
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
  } else if (sim.currentMissionId === 'apollo13_aquarius') {
    // Apollo 13: CO2 climbs toward 14.9 mmHg until Mailbox adapter is installed -> drops to 1.2 mmHg
    if (!sim.objectives.a13MailboxInstalled) {
      sim.co2Ppm = Math.min(19600, sim.co2Ppm + 185 * dt);
    } else {
      sim.co2Ppm = Math.max(1580, sim.co2Ppm - 920 * dt);
    }
    const targetTemp = sim.objectives.a13ColdPowerup
      ? 18.2
      : NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.COLD_SOAK_CABIN_C;
    sim.tempCelsius += (targetTemp - sim.tempCelsius) * Math.min(1, dt * 0.6);
    sim.powerKwe = sim.objectives.a13ColdPowerup
      ? 1.85
      : sim.objectives.a13AquariusMigrated
      ? NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.AQUARIUS_LIFEBOAT_WATTS / 1000
      : 0.92;
  } else if (sim.currentMissionId === 'sts120_p6_solar') {
    // STS-120 P6-4B Array: half-bay deployment scales recovered 160V DC solar output
    sim.powerKwe = 12.4 + sim.stsRedeploySteps * 5.2;
  }

  // Personal NASA vital mechanics: Hydration (BVAD 2.00-2.79 L/d) & Suit O2 (29.6 kPa)
  const hydrationDrain = exercising ? 0.16 : player.sprinting ? 0.11 : 0.032;
  sim.hydrationPercent = Math.max(12, sim.hydrationPercent - hydrationDrain * dt);
  if (sim.hydrationPercent < 55) {
    sim.heartRateBpm = Math.min(168, sim.heartRateBpm + (55 - sim.hydrationPercent) * 0.28 * dt);
  }

  const suitDrain = sim.airlockPressureKpa < 90 ? (player.sprinting ? 0.22 : 0.12) : 0.018;
  sim.suitO2Percent = Math.max(15, sim.suitO2Percent - suitDrain * dt);

  // External ATCS Ammonia Loop radiator cooling/heating
  const atcsActive = sim.rpcmBreakers.find((b) => b.id === 'ATCS' && b.closed && !b.tripped);
  const targetLoopK =
    !atcsActive || (sim.currentMissionId === 'act1_2_surface' && !sim.objectives.thermalFixed)
      ? 420.0
      : NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_LOOP_NOMINAL_K;
  sim.atcsLoopTempK += (targetLoopK - sim.atcsLoopTempK) * Math.min(1, dt * 0.45);

  // MBSU / RPCM 120V DC Breaker Bus Load (trips > 6.2 kWe continuous load)
  const thermalPumpOverhead = sim.atcsLoopTempK > 360 ? 0.45 : 0;
  const activeBusLoad =
    sim.rpcmBreakers.reduce((sum, b) => sum + (b.closed && !b.tripped ? b.loadKwe : 0), 0) +
    thermalPumpOverhead;
  sim.rpcmLoadKwe = Number(activeBusLoad.toFixed(2));
  if (activeBusLoad > NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.RPCM_BUS_TRIP_LIMIT_KWE && !sim.rpcmTripped) {
    sim.rpcmTripped = true;
    for (const b of sim.rpcmBreakers) {
      if (b.id === 'PAYLOAD' || b.id === 'WRS') {
        b.closed = false;
        b.tripped = true;
      }
    }
  } else if (activeBusLoad <= NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.RPCM_BUS_TRIP_LIMIT_KWE && sim.rpcmBreakers.every((b) => !b.tripped)) {
    sim.rpcmTripped = false;
  }

  // Step automatic sliding bulkhead doors (corridors auto-open; Orion Hatch is manual)
  sim.playerInsideOrion = player.y < -4.55 && player.x >= 8.15 && player.x <= 11.85;
  for (const d of sim.doors) {
    const dist = Math.hypot(player.x - d.x, player.y - d.y);
    const targetOpen = d.id === 'door_orion_hatch' ? (sim.orionHatchOpen ? 1 : 0) : dist < 2.85 ? 1 : 0;
    const rate = dt * 3.4;
    if (d.openProgress < targetOpen) {
      d.openProgress = Math.min(1, d.openProgress + rate);
    } else if (d.openProgress > targetOpen) {
      d.openProgress = Math.max(0, d.openProgress - rate);
    }
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

  // Step thrown / bouncing world items with configurable 1G / Low-G / Dense Atmo / 0G floating physics
  const wallsOnly = SPACE_ROOM_COLLIDERS.slice(0, WALL_COLLIDER_COUNT);
  for (const it of sim.worldItems) {
    const restZ = getRestingZForXY(it.x, it.y);
    const velMag = Math.hypot(it.vx, it.vy, it.vz);
    const suspended0g = sim.throwPhysicsMode === 'zero_g' && it.thrownByPlayer && it.z > restZ + 0.08;
    const moving = velMag > 0.025 || (!suspended0g && it.z > restZ + 0.02);
    if (!moving) continue;

    const prof = getThrowProfile(it.itemKey);
    const gravScale =
      sim.throwPhysicsMode === 'zero_g'
        ? 0
        : sim.throwPhysicsMode === 'low_g'
        ? 0.36
        : sim.throwPhysicsMode === 'dense_atmo'
        ? 0.72
        : 1.0;
    const airDrag =
      sim.throwPhysicsMode === 'dense_atmo'
        ? Math.pow(0.76, dt * 10)
        : sim.throwPhysicsMode === 'zero_g'
        ? Math.pow(0.95, dt * 10)
        : 1.0;

    let nx = it.x + it.vx * dt;
    let ny = it.y + it.vy * dt;
    let nz = it.z + it.vz * dt;
    let nvx = it.vx * airDrag;
    let nvy = it.vy * airDrag;
    let nvz = (it.vz - prof.gravityMs2 * gravScale * dt) * airDrag;

    // Wall bounces across all connected modules & corridors (zero wall tunneling)
    const [px, py] = resolveCircleVsBoxes(nx, ny, nz, prof.radiusM, wallsOnly);
    if (Math.abs(px - nx) > 0.002) nvx = -nvx * Math.max(0.22, prof.restitution);
    if (Math.abs(py - ny) > 0.002) nvy = -nvy * Math.max(0.22, prof.restitution);
    const [cx, cy] = clampToWalkableStation(px, py, it.x, it.y, prof.radiusM);
    if (Math.abs(cx - px) > 0.002) nvx = -nvx * 0.35;
    if (Math.abs(cy - py) > 0.002) nvy = -nvy * 0.35;
    nx = cx;
    ny = cy;

    if (nz > 2.55) {
      nz = 2.55;
      if (nvz > 0) nvz = -nvz * 0.35;
    }

    const landZ = getRestingZForXY(nx, ny);
    if (nz <= landZ) {
      nz = landZ;
      if (Math.abs(nvz) > 0.45 && sim.throwPhysicsMode !== 'zero_g') {
        nvz = -nvz * Math.min(0.24, prof.restitution);
      } else {
        nvz = 0;
      }
      nvx *= 0.65;
      nvy *= 0.65;
      if (Math.hypot(nvx, nvy) < 0.06 && nvz === 0) {
        nvx = 0;
        nvy = 0;
        it.thrownByPlayer = false;
      }
    }

    if (sim.throwPhysicsMode === 'zero_g' && Math.hypot(nvx, nvy, nvz) < 0.025) {
      nvx = 0;
      nvy = 0;
      nvz = 0;
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
    if (dist > 2.1) continue;
    const dot = (dx * fx + dy * fy + dz * fz) / Math.max(0.01, dist);
    if (dot < 0.72) continue;
    const score = dist * (1.35 - dot);
    if (score < bestScore) {
      bestScore = score;
      bestTarget = {
        kind: 'item',
        id: it.uid,
        labelEs: getSpaceItemLabel(it.itemKey, 'es'),
        labelEn: getSpaceItemLabel(it.itemKey, 'en'),
      };
    }
  }

  for (const st of sim.stations) {
    const dx = st.x - player.x;
    const dy = st.y - player.y;
    const dz = st.z - (player.z + eyeH);
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 2.2) continue;
    const dot = (dx * fx + dy * fy + dz * fz) / Math.max(0.01, dist);
    if (dot < 0.68) continue;
    const score = dist * (1.35 - dot);
    if (score < bestScore) {
      bestScore = score;
      bestTarget = {
        kind: st.kind === 'npc_crew' ? 'npc' : 'station',
        id: st.id,
        stationKind: st.kind,
        labelEs: st.labelEs,
        labelEn: st.labelEn,
      };
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

function collectInventoryKeys(
  handItem: HeldItem | null,
  bagOrInventory: HeldItem | null | (HeldItem | null)[]
): HeldItem[] {
  const list: HeldItem[] = [];
  if (handItem) list.push(handItem);
  if (Array.isArray(bagOrInventory)) {
    for (const s of bagOrInventory) {
      if (s) list.push(s);
    }
  } else if (bagOrInventory) {
    list.push(bagOrInventory);
  }
  return list;
}

function hasItemInSlots(
  itemKey: string,
  handItem: HeldItem | null,
  bagOrInventory: HeldItem | null | (HeldItem | null)[]
): boolean {
  return collectInventoryKeys(handItem, bagOrInventory).some((s) => s.itemKey === itemKey);
}

function hasItemAnywhere(
  itemKey: string,
  sim: SpaceRoomState,
  handItem: HeldItem | null,
  bagOrInventory: HeldItem | null | (HeldItem | null)[]
): boolean {
  if (hasItemInSlots(itemKey, handItem, bagOrInventory)) return true;
  if (sim.worldItems.some((w) => w.itemKey === itemKey)) return true;
  if (itemKey === 'DA_Battery') {
    const ch = sim.stations.find((s) => s.kind === 'power_charger');
    const bx = sim.stations.find((s) => s.kind === 'power_box');
    if (ch?.hasBattery || bx?.hasBattery) return true;
  }
  if (itemKey === 'DA_Fuse' || itemKey === 'DA_EmergencyFuse') {
    const bx = sim.stations.find((s) => s.kind === 'power_box');
    if (bx?.hasFuse) return true;
  }
  if (itemKey === 'DA_Rice') {
    const fh = sim.stations.find((s) => s.kind === 'food_heater');
    if (fh?.hasRice || fh?.foodReady) return true;
  }
  if (itemKey === 'DA_WaterPouch') {
    const fh = sim.stations.find((s) => s.kind === 'food_heater');
    if (fh?.hasWater || fh?.foodReady) return true;
  }
  return false;
}

function purgeWorldItemKey(sim: SpaceRoomState, itemKey: string) {
  sim.worldItems = sim.worldItems.filter((w) => w.itemKey !== itemKey);
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
  openAscanModal?: 'nbl' | 'computer' | 'centrifuge' | 'fire';
  openWallManual?: boolean;
  openOrionPreflight?: 'fault_repair' | 'power_switches';
  openEngineeringModal?: RoomStationKind;
  openLaunchTransit?: { from: MissionId; to: MissionId };
  openCrewDialogue?: { crewId: keyof typeof CREW_COMPANIONS; stationId: string; giftEs?: string; giftEn?: string };
  trainingBriefKind?: RoomStationKind;
  openLegacyNoteId?: number;
  openNewspaperId?: number;
  openEndingModal?: EndingId;
  advanceMission?: MissionId;
  consumeFoodAnim?: boolean;
}

export function interactRoomStation(
  stationId: string,
  sim: SpaceRoomState,
  handItem: HeldItem | null,
  bagItem: HeldItem | null | (HeldItem | null)[] = null
): RoomInteractionResult {
  const st = sim.stations.find((s) => s.id === stationId);
  if (!st) {
    return { handItem, msgEs: 'Sin objetivo', msgEn: 'No target', tone: 'warn', animType: 'reach' };
  }
  if (st.kind !== 'npc_crew' && st.kind !== 'bunk_light_switch' && st.kind !== 'window_shutter_button') {
    sim.missionAssigned = true;
  }

  const res = ((): RoomInteractionResult => {
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

    case 'nbl_pool_station': {
      const hasWrench = handItem?.itemKey === 'DA_TorqueWrench' || handItem?.itemKey === 'DA_ScrewDriver';
      if (st.progress < 50 && !hasWrench) {
        st.progress = 50;
        sim.suitO2Percent = 100;
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: 'Casco xEMU sellado a 29.6 kPa ΔP (1/2) — Pulsa [E]/Clic otra vez (o usa Llave EVA) para ajustar lastre neutro NBL 61.5 m',
          msgEn: 'xEMU Helmet sealed at 29.6 kPa ΔP (1/2) — Press [E]/Click again (or use EVA Wrench) to trim 61.5 m NBL neutral buoyancy',
        };
      }
      st.progress = 100;
      st.done = true;
      sim.objectives.nblCertified = true;
      sim.suitO2Percent = 100;
      sim.crewMoralePercent = Math.min(100, sim.crewMoralePercent + 4);
      unlockNoteAndPaper(sim, 1, undefined);
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Certificación Piscina NBL completada en 3D: flotabilidad neutra calibrada (ΔP 29.6 kPa)',
        msgEn: 'NBL Pool Certification complete in 3D: neutral buoyancy trimmed (ΔP 29.6 kPa)',
      };
    }

    case 'computer_formulas_station': {
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        openAscanModal: 'computer',
        msgEs: 'Abriendo Laboratorio de Cómputo y Pizarra de Fórmulas NASA...',
        msgEn: 'Opening NASA Spaceflight Formulas & Compute Lab...',
      };
    }

    case 'centrifuge_station': {
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        openAscanModal: 'centrifuge',
        msgEs: 'Abordando Góndola Centrífuga Humana 4.5 G (Maniobra AGSM [SPACE])...',
        msgEn: 'Entering 4.5 G Human Centrifuge Gondola (AGSM [SPACE])...',
      };
    }

    case 'eclss_fire_station': {
      if (handItem?.itemKey === 'DA_PbaMask' && st.progress < 40) {
        st.progress = 40;
        sim.suitO2Percent = Math.min(100, sim.suitO2Percent + 12);
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: 'Máscara O₂ PBA colocada y ventilación IMV aislada (1/2) — Equipa Extintor CO₂ PFE de la mesa derecha',
          msgEn: 'PBA O₂ mask donned & IMV airflow isolated (1/2) — Grab CO₂ PFE Extinguisher from SE rack',
        };
      }
      if (handItem?.itemKey === 'DA_FireExtinguisher') {
        st.progress = 100;
        st.done = true;
        sim.objectives.fireDrillCertified = true;
        sim.co2Ppm = 580;
        sim.o2Percent = Math.min(20.9, sim.o2Percent + 0.5);
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: 'Fuego 0g en Rack #2 extinguido con CO₂ PFE físico (IMV apagado · <15 ppm CO)',
          msgEn: '0g Rack #2 fire suppressed physically with CO₂ PFE (IMV off · <15 ppm CO)',
        };
      }
      if (st.progress < 65) {
        st.progress = 65;
        return {
          handItem,
          animType: 'use',
          tone: 'warn',
          msgEs: 'Ventilador IMV apagado (1/2) — Toma Extintor CO₂ PFE o pulsa [E]/Clic otra vez para purga de emergencia',
          msgEn: 'IMV fan shutdown isolated (1/2) — Grab CO₂ PFE Extinguisher or press again for emergency purge',
        };
      }
      st.progress = 100;
      st.done = true;
      sim.objectives.fireDrillCertified = true;
      sim.co2Ppm = 580;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Protocolo ISS 0g Rack #2 completado (<15 ppm CO · Práctica Fuego certificada)',
        msgEn: 'ISS 0g Rack #2 Fire Drill certified (<15 ppm CO · Suppression verified)',
      };
    }

    case 'wall_manual_station': {
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        openWallManual: true,
        msgEs: 'Consultando Manual Técnico NASA en Pizarra...',
        msgEn: 'Reading NASA Technical Reference Board...',
      };
    }

    case 'orion_hatch': {
      if (!sim.orionHatchOpen) {
        sim.orionHatchOpen = true;
        sim.orionHatchSealed = false;
        st.done = false;
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: sim.playerInsideOrion
            ? 'Escotilla Orion desbloqueada y abierta hacia la Bahía de Lanzamiento'
            : 'Escotilla Orion abierta — Entra por la pasarela de la Bahía de Lanzamiento',
          msgEn: sim.playerInsideOrion
            ? 'Orion Side Hatch unlatched & opened toward Launch Bay'
            : 'Orion Side Hatch opened — Walk inside via Launch Bay Gantry',
        };
      }
      sim.orionHatchOpen = false;
      if (sim.playerInsideOrion) {
        sim.orionHatchSealed = true;
        st.done = true;
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: 'Escotilla Orion CERRADA y SELLADA (101.3 kPa). Repara falla Crio y comprueba niveles/interruptores.',
          msgEn: 'Orion Side Hatch CLOSED & SEALED (101.3 kPa). Repair Cryo fault & check levels/switches.',
        };
      }
      sim.orionHatchSealed = false;
      st.done = false;
      return {
        handItem,
        animType: 'use',
        tone: 'warn',
        msgEs: 'Escotilla Orion cerrada desde la Bahía de Lanzamiento',
        msgEn: 'Orion Side Hatch closed from Launch Bay',
      };
    }

    case 'orion_fault_panel': {
      if (sim.currentMissionId === 'manifest_launch' && !sim.orionHatchSealed) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Cierra y sella primero la Escotilla de Orion atrás tuyo (101.3 kPa)',
          msgEn: 'Close and seal the Orion Side Hatch behind you first (101.3 kPa)',
        };
      }
      return {
        handItem,
        animType: 'use',
        tone: 'warn',
        openOrionPreflight: 'fault_repair',
        msgEs: 'Abriendo Bahía Crio / Fusible RS-25 de la Cápsula Orion...',
        msgEn: 'Opening Orion Cryo Valve & RS-25 Fuse Repair Bay...',
      };
    }

    case 'orion_power_panel': {
      if (sim.currentMissionId === 'manifest_launch' && !sim.orionHatchSealed) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Cierra y sella primero la Escotilla de Orion (101.3 kPa)',
          msgEn: 'Close and seal Orion Side Hatch first (101.3 kPa)',
        };
      }
      if (!sim.objectives.preflightRepaired) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Repara primero la fuga criogénica / fusible RS-25 en el panel izquierdo de Orion',
          msgEn: 'Repair the RS-25 cryo valve & HV fuse on Orion port panel first',
        };
      }
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        openOrionPreflight: 'power_switches',
        msgEs: 'Abriendo Verificación de Niveles y 5 Interruptores Orion...',
        msgEn: 'Opening Orion Telemetry Levels & 5-Switch Overhead Panel...',
      };
    }

    case 'orion_pilot_seat': {
      if (!sim.objectives.manifestConfigured) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Configura primero el Manifiesto de Carga en el Puente Norte (MEDS)',
          msgEn: 'Configure the Payload Manifest on North MEDS Deck first',
        };
      }
      if (sim.currentMissionId === 'manifest_launch' && !sim.orionHatchSealed) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Escotilla sin sellar — Cierra y sella la Escotilla Orion (101.3 kPa) antes de despegar',
          msgEn: 'Hatch unsealed — Close & seal Orion Side Hatch (101.3 kPa) before liftoff',
        };
      }
      if (!sim.objectives.preflightRepaired || !sim.objectives.preflightSystemsOn || !sim.orionLevelsChecked) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Completa reparación Crio/RS-25 (izq.) y verifica niveles + 5 interruptores Orion (der.)',
          msgEn: 'Complete Orion cryo/fuse repair (port) and verify levels + 5 switches (starboard) first',
        };
      }
      const nextId = (st.value as MissionId | undefined) ?? 'act1_2_surface';
      sim.activeRadio = {
        speakerId: 'KATHERINE',
        textEs: 'COMANDANTE EN ASIENTO ORION: T-9.5 s Preválvulas RS-25 nominales. Toma control de actitud en Cabina 3D y estabiliza el ascenso hasta descenso lunar/marciano.',
        textEn: 'COMMANDER STRAPPED IN ORION SEAT: T-9.5 s RS-25 prevalves nominal. Take attitude control in 3D Cockpit through Max-Q to planetary landing.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        openLaunchTransit: { from: sim.currentMissionId, to: nextId },
        msgEs: 'Asegurado en asiento Orion — Iniciando secuencia de despegue 3D desde cabina...',
        msgEn: 'Strapped into Orion seat — Initiating interactive 3D cockpit launch...',
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
      if (handItem?.itemKey === 'DA_DuctTapeKit' || handItem?.itemKey === 'DA_ScrewDriver' || handItem?.itemKey === 'DA_TorqueWrench' || st.progress >= 50 || st.done) {
        st.progress = 100;
        const opt = handItem?.itemKey === 'DA_DuctTapeKit' ? 'patch' : 'cdra';
        return completeEngineeringCalibration('skylab_thermal_station', sim, handItem, opt);
      }
      st.progress = 50;
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        msgEs: 'Toma Cinta Kapton o Destornillador de la mesa (o pulsa otra vez para Desvío CDRA 163→112 W/m²)',
        msgEn: 'Grab Kapton Duct Tape or Screwdriver from workbench (or press again for CDRA Reroute 163→112 W/m²)',
      };
    }

    case 'spe_electrolyzer_station': {
      st.progress = 100;
      return completeEngineeringCalibration('spe_electrolyzer_station', sim, handItem, 'nominal');
    }

    case 'krusty_reactor_station': {
      if (handItem?.itemKey === 'DA_EmergencyFuse' || handItem?.itemKey === 'DA_Fuse' || handItem?.itemKey === 'DA_TorqueWrench' || st.progress >= 50 || st.done) {
        st.progress = 100;
        return completeEngineeringCalibration('krusty_reactor_station', sim, handItem, sim.powerChoice === 'fsp_40kw' ? 'krusty' : 'solar');
      }
      st.progress = 50;
      return {
        handItem,
        animType: 'use',
        tone: 'warn',
        msgEs: 'Núcleo KRUSTY precalentando (1/2) — Inserta Fusible Emergencia o pulsa [E]/Clic para fijar 40 kWe Stirling',
        msgEn: 'KRUSTY core pre-heating (1/2) — Insert Emergency Fuse or press again to lock 40 kWe Stirling output',
      };
    }

    case 'aph_chamber_station': {
      if (handItem?.itemKey === 'DA_ClayPillow' || st.progress >= 50 || st.done) {
        st.progress = 100;
        return completeEngineeringCalibration('aph_chamber_station', sim, handItem, 'nominal');
      }
      st.progress = 50;
      sim.lightingMode = 'spectral_magenta';
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Espectro APH 630+450 nm activado (1/2) — Usa Almohadilla de Arcilla o pulsa [E] para cosechar VEG-05',
        msgEn: 'APH 630+450 nm spectrum engaged (1/2) — Use Clay Pillow or press again to harvest VEG-05 tomatoes',
      };
    }

    case 'compost_valve_station': {
      st.progress = 100;
      return completeEngineeringCalibration('compost_valve_station', sim, handItem, 'nominal');
    }

    case 'bios3_buffer_station': {
      if (handItem?.itemKey === 'DA_WaterJar' || handItem?.itemKey === 'DA_WaterPouch' || st.progress >= 50 || st.done) {
        st.progress = 100;
        return completeEngineeringCalibration('bios3_buffer_station', sim, handItem, 'nominal');
      }
      st.progress = 50;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Tanque BIOS-3 1,000 L presurizando (1/2) — Vierte Jarrón H₂O o pulsa [E] para activar 95% recuperación',
        msgEn: 'BIOS-3 1,000 L tank priming (1/2) — Pour H₂O Jar or press again to activate 95% water recovery',
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
      if (handItem?.itemKey === 'DA_RegolithSample' || st.progress >= 50 || st.done) {
        st.progress = 100;
        return completeEngineeringCalibration('regolith_shield_station', sim, handItem, 'nominal');
      }
      st.progress = 50;
      return {
        handItem,
        animType: 'use',
        tone: 'warn',
        msgEs: 'Cargador de Regolito listo (1/2) — Trae Núcleo de Regolito o pulsa [E]/Clic para compactar 2.0 m (300 g/cm²)',
        msgEn: 'Regolith compactor armed (1/2) — Bring Regolith Core or press again to seal 2.0 m (300 g/cm²) shield',
      };
    }

    case 'npc_crew': {
      const crewId = (st.value as keyof typeof CREW_COMPANIONS | undefined) ?? 'CONRAD';
      const companion = CREW_COMPANIONS[crewId] ?? CREW_COMPANIONS.CONRAD;
      const guide = getCurrentGuidedStep(sim, handItem);
      sim.missionAssigned = true;
      st.done = true;

      let giftedItem: HeldItem | null = null;
      let giftEs = '';
      let giftEn = '';

      if (!handItem) {
        if (sim.currentMissionId === 'tutorial_hab') {
          if (!sim.objectives.powerRestored && !hasItemAnywhere('DA_Battery', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_bat_${Date.now()}`, itemKey: 'DA_Battery', charge: 35, clean: true, ammo: 0 };
            giftEs = 'Te entrego una Batería Li-Ion (35%) para el Cargador del Lab Este.';
            giftEn = 'Handing you a Li-Ion Battery (35%) for the East Lab Charger.';
          } else if (!sim.objectives.powerRestored && !hasItemAnywhere('DA_Fuse', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_fuse_${Date.now()}`, itemKey: 'DA_Fuse', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Te entrego un Fusible FSP nuevo para la Caja de Distribución.';
            giftEn = 'Handing you a fresh FSP Fuse for the Power Distribution Box.';
          } else if (!sim.objectives.eclssCleaned && !hasItemAnywhere('DA_ScrewDriver', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_sd_${Date.now()}`, itemKey: 'DA_ScrewDriver', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma este Destornillador EVA para los 4 tornillos del conducto CO₂.';
            giftEn = 'Take this precision Screwdriver for the 4 CO₂ vent duct screws.';
          }
        } else if (sim.currentMissionId === 'manifest_launch') {
          if (!sim.objectives.preflightRepaired) {
            if (!hasItemAnywhere('DA_CryoValve', sim, handItem, bagItem)) {
              giftedItem = { uid: `npc_cryo_${Date.now()}`, itemKey: 'DA_CryoValve', charge: 100, clean: true, ammo: 0 };
              giftEs = 'Toma esta Válvula Criogénica LOX/LH₂ para reparar la falla de la cápsula Orion.';
              giftEn = 'Take this Cryogenic LOX/LH₂ Valve to repair the Orion Service Bay fault.';
            } else if (!hasItemAnywhere('DA_EmergencyFuse', sim, handItem, bagItem)) {
              giftedItem = { uid: `npc_ef_${Date.now()}`, itemKey: 'DA_EmergencyFuse', charge: 100, clean: true, ammo: 0 };
              giftEs = 'Toma el Fusible Maestro RS-25 para el panel izquierdo dentro de Orion.';
              giftEn = 'Take the RS-25 Master Fuse for the port panel inside Orion.';
            } else if (!hasItemAnywhere('DA_TorqueWrench', sim, handItem, bagItem)) {
              giftedItem = { uid: `npc_tw_${Date.now()}`, itemKey: 'DA_TorqueWrench', charge: 100, clean: true, ammo: 0 };
              giftEs = 'Toma esta Llave Dinamométrica EVA para ajustar la brida a 28.5 N·m en Orion.';
              giftEn = 'Take this EVA Torque Wrench to torque the Orion manifold flange to 28.5 N·m.';
            }
          }
        } else if (sim.currentMissionId === 'act1_2_surface') {
          if (!sim.objectives.thermalFixed && !hasItemAnywhere('DA_DuctTapeKit', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_tape_${Date.now()}`, itemKey: 'DA_DuctTapeKit', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma el Kit Kapton / Cinta Skylab 2 para sellar el escudo térmico (Lab Este).';
            giftEn = 'Take the Skylab 2 Kapton Tape Kit to patch the East Lab thermal shield.';
          } else if (!sim.objectives.powerBalanced && !hasItemAnywhere('DA_EmergencyFuse', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_efuse_${Date.now()}`, itemKey: 'DA_EmergencyFuse', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma el Fusible Maestro KRUSTY 40 kWe para estabilizar el reactor en el Lab Este.';
            giftEn = 'Take the 40 kWe KRUSTY Master Fuse to stabilize the East Lab reactor.';
          }
        } else if (sim.currentMissionId === 'act3_greenhouse') {
          if (!sim.objectives.aphHarvested && !hasItemAnywhere('DA_ClayPillow', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_clay_${Date.now()}`, itemKey: 'DA_ClayPillow', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma este Sustrato Arcilloso Arcillita para cultivar tomates VEG-05 en el APH.';
            giftEn = 'Take this Arcillite Clay Pillow substrate for the APH VEG-05 rack.';
          } else if (!sim.objectives.bios3Activated && !hasItemAnywhere('DA_WaterJar', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_wjar_${Date.now()}`, itemKey: 'DA_WaterJar', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma esta Muestra H₂O pura para calibrar el tanque amortiguador BIOS-3 (1,000 L).';
            giftEn = 'Take this purified H₂O Sample to calibrate the 1,000 L BIOS-3 tank.';
          }
        } else if (sim.currentMissionId === 'act4_storm_rover' && !sim.objectives.regolithDeployed && !hasItemAnywhere('DA_RegolithSample', sim, handItem, bagItem)) {
          giftedItem = { uid: `npc_reg_${Date.now()}`, itemKey: 'DA_RegolithSample', charge: 100, clean: true, ammo: 0 };
          giftEs = 'Toma el núcleo de Regolito para activar el blindaje solar de 2.0 m (300 g/cm²).';
          giftEn = 'Take this Regolith core to deploy the 2.0 m solar shield (300 g/cm²).';
        } else if (sim.currentMissionId === 'apollo13_aquarius' && !sim.objectives.a13MailboxInstalled) {
          if (!sim.a13MailboxParts.card && !hasItemAnywhere('DA_FlightPlanCard', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_card_${Date.now()}`, itemKey: 'DA_FlightPlanCard', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma esta cubierta de Plan de Vuelo de cartón para armar el adaptador "Mailbox" LiOH.';
            giftEn = 'Take this cardboard Flight Plan cover to frame the "Mailbox" LiOH adapter.';
          } else if (!sim.a13MailboxParts.hose && !hasItemAnywhere('DA_SuitHose', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_hose_${Date.now()}`, itemKey: 'DA_SuitHose', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma esta Manguera de Traje Lunar para acoplar el "Mailbox" al tambor de Aquarius.';
            giftEn = 'Take this Lunar Suit Hose to couple the "Mailbox" onto the Aquarius CO₂ drum.';
          } else if (!sim.a13MailboxParts.tape && !hasItemAnywhere('DA_DuctTapeKit', sim, handItem, bagItem)) {
            giftedItem = { uid: `npc_tape13_${Date.now()}`, itemKey: 'DA_DuctTapeKit', charge: 100, clean: true, ammo: 0 };
            giftEs = 'Toma este rollo de Cinta Gris Duct Tape para sellar el "Mailbox" (CO₂ 14.9→1.2 mmHg).';
            giftEn = 'Take this gray Duct Tape roll to seal the "Mailbox" adapter (CO₂ 14.9→1.2 mmHg).';
          }
        } else if (sim.currentMissionId === 'sts120_p6_solar' && !sim.objectives.stsWireSnipped && !hasItemAnywhere('DA_InsulatedCutter', sim, handItem, bagItem)) {
          giftedItem = { uid: `npc_cut_${Date.now()}`, itemKey: 'DA_InsulatedCutter', charge: 100, clean: true, ammo: 0 };
          giftEs = 'Toma esta Pinza Aislada HV (160V DC) para cortar el cable enredado en P6-4B.';
          giftEn = 'Take this HV Insulated Cutter (160V DC) to snip the snagged guidewire on P6-4B.';
        }
      }

      const textEs = giftedItem
        ? `${companion.nameEs}: "${giftEs} Luego: ${guide.instructionEs}"`
        : `${companion.nameEs}: "${guide.instructionEs}"`;
      const textEn = giftedItem
        ? `${companion.nameEn}: "${giftEn} Next: ${guide.instructionEn}"`
        : `${companion.nameEn}: "${guide.instructionEn}"`;

      sim.activeRadio = {
        speakerId: crewId,
        textEs,
        textEn,
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem: giftedItem ?? handItem,
        animType: 'reach',
        tone: 'ok',
        openCrewDialogue: { crewId, stationId: st.id, giftEs: giftEs || undefined, giftEn: giftEn || undefined },
        msgEs: giftedItem ? `${companion.nameEs}: ${giftEs}` : `${companion.nameEs} te orienta (${guide.zoneEs})`,
        msgEn: giftedItem ? `${companion.nameEn}: ${giftEn}` : `${companion.nameEn} briefing (${guide.zoneEn})`,
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
          sim.objectives.powerRestored,
          sim.objectives.eclssCleaned,
          sim.objectives.mealPrepared,
          sim.objectives.exerciseCalibrated,
          sim.objectives.whcInspected,
          sim.objectives.crisisSolved,
          sim.objectives.nblCertified,
          sim.objectives.computerCertified,
          sim.objectives.centrifugeCertified,
          sim.objectives.fireDrillCertified,
        ].filter(Boolean).length;
        if (doneCount < 4) {
          return {
            handItem,
            animType: 'reach',
            tone: 'warn',
            msgEs: `Completa al menos 4 prácticas en Tierra (Fase 0) antes de abordar la nave (${doneCount}/10 listas)`,
            msgEn: `Complete at least 4 Phase 0 Earth drills before boarding (${doneCount}/10 ready)`,
          };
        }
      } else if (sim.currentMissionId === 'manifest_launch') {
        if (!sim.objectives.manifestConfigured) {
          return {
            handItem,
            animType: 'reach',
            tone: 'warn',
            msgEs: 'Configura primero el Manifiesto de Carga en el Puente Norte (MEDS)',
            msgEn: 'Configure Payload Manifest on North MEDS Deck first',
          };
        }
        if (!sim.objectives.preflightRepaired || !sim.objectives.preflightSystemsOn) {
          return {
            handItem,
            animType: 'reach',
            tone: 'warn',
            msgEs: 'Aborda la Cápsula Orion Sur: repara el panel izquierdo Crio/RS-25 y enciende los 5 interruptores derechos',
            msgEn: 'Board South Orion Capsule: repair left Cryo/RS-25 bay and turn on all 5 right overhead switches',
          };
        }
      } else if (sim.currentMissionId === 'act1_2_surface' && (!sim.objectives.thermalFixed || !sim.objectives.powerBalanced)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Repara el Panel Térmico (Lab Este) y estabiliza KRUSTY/SPE antes de avanzar',
          msgEn: 'Repair Thermal Panel (East Lab) & stabilize KRUSTY/SPE before advancing',
        };
      } else if (sim.currentMissionId === 'act3_greenhouse' && !sim.objectives.aphHarvested && !sim.objectives.bios3Activated) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Cosecha tomates VEG-05 (Lab Este) o activa el Tanque BIOS-3 antes de continuar',
          msgEn: 'Harvest VEG-05 tomatoes (East Lab) or activate BIOS-3 Tank before advancing',
        };
      } else if (sim.currentMissionId === 'act4_storm_rover' && (!sim.objectives.roverReturned || !sim.objectives.regolithDeployed)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Acopla el Rover 6,000 kg (MEDS Norte) y despliega el blindaje de regolito 2.0 m antes de avanzar',
          msgEn: 'Dock the 6,000 kg Rover (North MEDS) and deploy the 2.0 m regolith shield before advancing',
        };
      } else if (
        sim.currentMissionId === 'apollo13_aquarius' &&
        (!sim.objectives.a13CryoDiagnosed ||
          !sim.objectives.a13AquariusMigrated ||
          !sim.objectives.a13MailboxInstalled ||
          !sim.objectives.a13ColdPowerup)
      ) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Completa agitado Crio, migración Aquarius (12A), adaptador Mailbox y reencendido en frío antes de reentrada',
          msgEn: 'Complete Cryo stir, Aquarius migration (12A), Mailbox CO₂ adapter & cold power-up before splashdown',
        };
      } else if (
        sim.currentMissionId === 'sts120_p6_solar' &&
        (!sim.objectives.stsArrayInspected ||
          !sim.objectives.stsCufflinksCrafted ||
          !sim.objectives.stsWireSnipped ||
          !sim.objectives.stsArrayDeployed)
      ) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Completa diagnóstico P6-4B, 5 Cufflinks, corte HV en OBSS y despliegue por medias bahías [5/5]',
          msgEn: 'Complete P6-4B inspection, 5 Cufflinks, OBSS HV wire snip & 5/5 half-bay deployment first',
        };
      }
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        openLaunchTransit: { from: sim.currentMissionId, to: nextId },
        msgEs: 'Abordando nave AETHER-4 — Iniciando secuencia de ascenso al espacio...',
        msgEn: 'Boarding AETHER-4 spacecraft — Initiating space ascent sequence...',
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
          trainingBriefKind: 'power_lever',
          msgEs: 'La Caja FSP requiere Batería cargada + Fusible antes de subir la palanca',
          msgEn: 'FSP Box needs charged Battery + Fuse before throwing lever',
        };
      }
      st.done = true;
      sim.objectives.powerRestored = true;
      purgeWorldItemKey(sim, 'DA_Battery');
      purgeWorldItemKey(sim, 'DA_Fuse');
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        trainingBriefKind: 'power_lever',
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
        purgeWorldItemKey(sim, 'DA_VentFilter');
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          trainingBriefKind: 'eclss_vent',
          msgEs: 'Filtro LiOH limpio instalado — Depuración CO₂ (1.08 kg/día) nominal',
          msgEn: 'Clean LiOH filter seated — CO₂ scrubbing (1.08 kg/day) nominal',
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: st.done ? 'ok' : 'warn',
        trainingBriefKind: 'eclss_vent',
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
          trainingBriefKind: 'filter_regenerator',
          msgEs: 'Cartucho LiOH regenerado al 100% — Insértalo de vuelta en el conducto',
          msgEn: 'LiOH cartridge regenerated to 100% — Insert back into vent duct',
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        trainingBriefKind: 'filter_regenerator',
        msgEs: 'Trae un cartucho LiOH sucio del Conducto de Ventilación',
        msgEn: 'Bring a dirty LiOH cartridge from the Vent Duct',
      };
    }

    case 'ration_dispenser': {
      if (sim.objectives.mealPrepared) {
        return {
          handItem,
          animType: 'reach',
          tone: 'ok',
          msgEs: 'Objetivo de Nutrición BVAD ya completado (sin duplicar raciones)',
          msgEn: 'BVAD Nutrition objective already complete (no duplicate rations)',
        };
      }
      if (hasItemAnywhere('DA_Rice', sim, handItem, bagItem)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Ya tienes o hay una Ración Deshidratada activa (llévala al Calentador Galley)',
          msgEn: 'A Dehydrated Ration is already held/active (load it in Galley Heater)',
        };
      }
      if (handItem) {
        return { handItem, animType: 'reach', tone: 'warn', msgEs: 'Guarda en Mochila o suelta [RMB] para tomar ración', msgEn: 'Store or drop [RMB] item before grabbing ration' };
      }
      st.done = true;
      return {
        handItem: { uid: `rice_${Date.now()}`, itemKey: 'DA_Rice', charge: 100, clean: true, ammo: 0 },
        animType: 'use',
        tone: 'ok',
        msgEs: `Sobre de Ración Deshidratada (${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg/d BVAD)`,
        msgEn: `Dehydrated Ration Pouch (${NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg/d BVAD)`,
      };
    }

    case 'water_rehydrator': {
      if (sim.objectives.mealPrepared) {
        return {
          handItem,
          animType: 'reach',
          tone: 'ok',
          msgEs: 'Objetivo de Nutrición BVAD ya completado (sin duplicar agua)',
          msgEn: 'BVAD Nutrition objective already complete (no duplicate water)',
        };
      }
      if (hasItemAnywhere('DA_WaterPouch', sim, handItem, bagItem)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Ya existe una Bolsa de Agua Rehidratación activa (insértala en el Galley)',
          msgEn: 'A Rehydration Water Pouch is already held/active (load in Galley)',
        };
      }
      if (handItem) {
        return { handItem, animType: 'reach', tone: 'warn', msgEs: 'Guarda en Mochila o suelta [RMB] para tomar agua', msgEn: 'Store or drop [RMB] item before grabbing water' };
      }
      st.done = true;
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
        purgeWorldItemKey(sim, 'DA_Rice');
        purgeWorldItemKey(sim, 'DA_WaterPouch');
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

    case 'oga_o2_station': {
      const ogaBus = sim.rpcmBreakers.find((b) => b.id === 'OGA');
      if (ogaBus && (!ogaBus.closed || ogaBus.tripped)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'err',
          msgEs: 'Bus RPCM 120V DC de OGA desconectado/disparado — Rearma el panel MBSU/RPCM Sureste',
          msgEn: 'OGA 120V DC RPCM breaker tripped/open — Reset Southeast MBSU/RPCM panel first',
        };
      }
      sim.suitO2Percent = 100;
      sim.o2Percent = Math.min(21.2, sim.o2Percent + 0.8);
      sim.waterLiters = Math.max(12, sim.waterLiters - 0.45);
      st.done = true;
      st.progress = 100;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Reserva de O₂ del traje xEMU recargada al 100% (29.6 kPa) vía electrólisis OGA (2H₂O→2H₂+O₂)',
        msgEn: 'xEMU Suit O₂ reserve recharged to 100% (29.6 kPa) via OGA electrolysis (2H₂O→2H₂+O₂)',
      };
    }

    case 'wrs_water_station': {
      const wrsBus = sim.rpcmBreakers.find((b) => b.id === 'WRS');
      if (wrsBus && (!wrsBus.closed || wrsBus.tripped)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'err',
          msgEs: 'Bus RPCM 120V DC de WRS desconectado — Balancea cargas en panel MBSU/RPCM Sureste',
          msgEn: 'WRS 120V DC RPCM bus offline — Rebalance loads at SE MBSU/RPCM panel',
        };
      }
      const prevHydr = Math.round(sim.hydrationPercent);
      sim.hydrationPercent = 100;
      sim.heartRateBpm = Math.max(66, sim.heartRateBpm - 6);
      sim.waterLiters = Math.min(103.0, sim.waterLiters + 1.65);
      sim.wasteKg = Math.max(0.2, sim.wasteKg - 0.35);
      st.done = true;
      st.progress = 100;
      const nextHand =
        handItem?.itemKey === 'DA_WaterPouch'
          ? { ...handItem, charge: 100 }
          : !handItem
          ? { uid: `wrs_pouch_${Date.now()}`, itemKey: 'DA_WaterPouch', charge: 100, clean: true, ammo: 0 }
          : handItem;
      return {
        handItem: nextHand,
        animType: 'use',
        tone: 'ok',
        msgEs: `Hidratación oral BVAD restaurada (${prevHydr}%→100% · 2.00–2.79 L/d) + Ciclo WPA/UPA (98% rec.)`,
        msgEn: `Oral BVAD hydration restored (${prevHydr}%→100% · 2.00–2.79 L/d) + WPA/UPA 98% recovery cycle`,
      };
    }

    case 'cdra_sabatier_station': {
      const cdraBus = sim.rpcmBreakers.find((b) => b.id === 'CDRA');
      if (cdraBus && (!cdraBus.closed || cdraBus.tripped)) {
        return {
          handItem,
          animType: 'reach',
          tone: 'err',
          msgEs: 'Bus RPCM 120V DC de CDRA/Sabatier fuera de línea — Revisa panel MBSU/RPCM',
          msgEn: 'CDRA/Sabatier 120V DC bus offline — Check MBSU/RPCM breaker panel',
        };
      }
      sim.co2Ppm = Math.max(480, sim.co2Ppm - 580);
      sim.waterLiters = Math.min(103.0, sim.waterLiters + 1.35);
      st.done = true;
      st.progress = 100;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Reactor Sabatier 400 °C + Tamiz CDRA activos (CO₂+4H₂ → CH₄+2H₂O · +1.35 L H₂O)',
        msgEn: '400 °C Sabatier Reactor + CDRA bed active (CO₂+4H₂ → CH₄+2H₂O · +1.35 L H₂O)',
      };
    }

    case 'rpcm_breaker_station': {
      const anyTripped = sim.rpcmTripped || sim.rpcmBreakers.some((b) => b.tripped);
      if (anyTripped) {
        for (const b of sim.rpcmBreakers) {
          if (b.id === 'PAYLOAD') {
            b.closed = false;
            b.tripped = false;
          } else {
            b.closed = true;
            b.tripped = false;
          }
        }
        sim.rpcmTripped = false;
        const load = sim.rpcmBreakers.reduce((s, b) => s + (b.closed ? b.loadKwe : 0), 0);
        sim.rpcmLoadKwe = Number(load.toFixed(2));
        st.done = true;
        st.progress = 100;
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: `RPCM 120V DC rearmado: Payload aislado · ECLSS crítico (OGA+CDRA+WRS+ATCS) activo a ${sim.rpcmLoadKwe.toFixed(1)}/6.2 kWe`,
          msgEn: `120V DC RPCM reset: Payload shed · Essential ECLSS buses restored at ${sim.rpcmLoadKwe.toFixed(1)}/6.2 kWe`,
        };
      }
      const payload = sim.rpcmBreakers.find((b) => b.id === 'PAYLOAD');
      if (payload) {
        const nextClosed = !payload.closed;
        const projected =
          sim.rpcmBreakers.reduce((s, b) => s + (b.id === 'PAYLOAD' ? (nextClosed ? b.loadKwe : 0) : b.closed ? b.loadKwe : 0), 0) +
          (sim.atcsLoopTempK > 360 ? 0.45 : 0);
        if (nextClosed && projected > NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.RPCM_BUS_TRIP_LIMIT_KWE) {
          sim.rpcmTripped = true;
          payload.closed = false;
          payload.tripped = true;
          return {
            handItem,
            animType: 'use',
            tone: 'warn',
            msgEs: `Sobrecarga RPCM (${projected.toFixed(2)} > 6.2 kWe): disyuntor PAYLOAD disparado automáticamente — enfría ATCS primero`,
            msgEn: `RPCM Overload (${projected.toFixed(2)} > 6.2 kWe): PAYLOAD breaker tripped — cool ATCS radiators first`,
          };
        }
        payload.closed = nextClosed;
        payload.tripped = false;
      }
      for (const b of sim.rpcmBreakers) {
        if (b.id !== 'PAYLOAD') {
          b.closed = true;
          b.tripped = false;
        }
      }
      sim.rpcmLoadKwe = Number(
        sim.rpcmBreakers.reduce((s, b) => s + (b.closed ? b.loadKwe : 0), 0).toFixed(2)
      );
      st.done = true;
      st.progress = 100;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: `Panel MBSU/RPCM 120V DC balanceado: carga ${sim.rpcmLoadKwe.toFixed(1)} / 6.2 kWe (Payload ${payload?.closed ? 'ON' : 'OFF'})`,
        msgEn: `MBSU/RPCM 120V DC balanced: load ${sim.rpcmLoadKwe.toFixed(1)} / 6.2 kWe (Payload ${payload?.closed ? 'ON' : 'OFF'})`,
      };
    }

    case 'atcs_radiator_station': {
      sim.atcsLoopTempK = NASA_CONSTANTS.ISS_ECLSS_MBSU_RPCM.ATCS_LOOP_NOMINAL_K;
      sim.tempCelsius = Math.max(19.8, sim.tempCelsius - 4.2);
      st.done = true;
      st.progress = 100;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Válvula amoníaco ATCS purgada: radiadores externos a 277 K (-4.2 °C en cabina)',
        msgEn: 'ATCS external ammonia valve vented: radiator loop cooled to 277 K (-4.2 °C cabin)',
      };
    }

    case 'quest_airlock_console': {
      const stages = [
        { kpa: NASA_CONSTANTS.QUEST_AIRLOCK_EVA.CAMPOUT_O2_PURGE_KPA, es: 'Paso 1/5 · Campout pre-respiración O₂ (101.3 → 70.3 kPa)', en: 'Step 1/5 · O₂ pre-breathe Campout (101.3 → 70.3 kPa)' },
        { kpa: NASA_CONSTANTS.QUEST_AIRLOCK_EVA.SCAVENGE_MID_KPA, es: 'Paso 2/5 · Bomba Scavenge recuperando aire (70.3 → 39.5 kPa)', en: 'Step 2/5 · Scavenge Pump recovery (70.3 → 39.5 kPa)' },
        { kpa: NASA_CONSTANTS.QUEST_AIRLOCK_EVA.EMU_SUIT_OP_KPA, es: 'Paso 3/5 · Prueba de fugas traje EVA (39.5 → 29.6 kPa OK)', en: 'Step 3/5 · EVA suit leak check hold (39.5 → 29.6 kPa OK)' },
        { kpa: NASA_CONSTANTS.QUEST_AIRLOCK_EVA.SCAVENGE_CUTOFF_KPA, es: 'Paso 4/5 · Apagado bomba scavenge (29.6 → 14.0 kPa)', en: 'Step 4/5 · Scavenge pump shutoff vent (29.6 → 14.0 kPa)' },
        { kpa: NASA_CONSTANTS.QUEST_AIRLOCK_EVA.MPEV_VENT_SAFE_KPA, es: 'Paso 5/5 · Válvula manual MPEV a vacío (~2.1 kPa) — ¡Escotilla exterior lista para EVA!', en: 'Step 5/5 · Manual MPEV depress (~2.1 kPa) — Outer Hatch EVA-Ready!' },
      ];
      if (sim.airlockStep < stages.length) {
        const nextStage = stages[sim.airlockStep];
        sim.airlockStep += 1;
        sim.airlockPressureKpa = nextStage.kpa;
        sim.suitO2Percent = Math.max(30, sim.suitO2Percent - 4);
        st.progress = Math.round((sim.airlockStep / 5) * 100);
        st.done = sim.airlockStep === 5;
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: nextStage.es,
          msgEn: nextStage.en,
        };
      }
      sim.airlockStep = 0;
      sim.airlockPressureKpa = NASA_CONSTANTS.QUEST_AIRLOCK_EVA.CABIN_NOMINAL_KPA;
      st.progress = 0;
      st.done = false;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Represurización Quest Airlock completa (2.1 → 101.3 kPa · Igualación de cabina OK)',
        msgEn: 'Quest Airlock repressurization complete (2.1 → 101.3 kPa · Cabin equalized)',
      };
    }

    case 'a13_cryo_stir_panel': {
      sim.objectives.a13CryoDiagnosed = true;
      sim.lightingMode = 'alert';
      st.done = true;
      st.progress = 100;
      sim.activeRadio = {
        speakerId: 'LOVELL',
        textEs: '¡Houston, tenemos un problema! Tanque O₂ #2 cayó a 0 psia, Tanque #1 fuga a 781.9 psia (Bus A 28.5V / Bus B 29.0V). Sube al Puente MEDS para migrar al Aquarius.',
        textEn: 'Houston, we have a problem! O₂ Tank #2 failed to 0 psia, Tank #1 leaking at 781.9 psia (Bus A 28.5V / B 29.0V). Head up to North MEDS to migrate to Aquarius.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'use',
        tone: 'warn',
        msgEs: 'Agitado Crio O₂: Tanque #2=0 psia, Tanque #1=781.9 psia, Bus A=28.5V / B=29.0V',
        msgEn: 'Cryo O₂ Stir Fault: Tank #2=0 psia, Tank #1=781.9 psia, Bus A=28.5V / B=29.0V',
      };
    }

    case 'a13_aquarius_transfer': {
      if (!sim.objectives.a13CryoDiagnosed) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Realiza primero el agitado Crio O₂ en el Panel SM Sur antes de migrar energía',
          msgEn: 'Check SM Cryo O₂ stir telemetry in South Hangar before shedding to Aquarius',
        };
      }
      if (!sim.objectives.a13AquariusMigrated) {
        sim.objectives.a13AquariusMigrated = true;
        sim.powerKwe = NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.AQUARIUS_LIFEBOAT_WATTS / 1000;
        sim.tempCelsius = NASA_CONSTANTS.APOLLO_13_AQUARIUS_1970.COLD_SOAK_CABIN_C;
        sim.lightingMode = 'circadian';
        st.progress = 50;
        sim.activeRadio = {
          speakerId: 'LOVELL',
          textEs: 'LM Aquarius reducido a 12 A (336 W) y ración 0.2 L/día activada. Ahora recolecta Plan de Vuelo + Manguera + Cinta Duct Tape y ve al Banco "Mailbox" en Lab Este.',
          textEn: 'LM Aquarius shed to 12 A (336 W) & 0.2 L/day ration engaged. Collect Flight Plan + Suit Hose + Duct Tape & head to East Lab "Mailbox" Bench.',
          timestampSec: sim.elapsedSec,
        };
        return {
          handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: 'Migración a Aquarius (12 A / 336 W · 3.3 °C · Ración 0.2 L/día) completada — Construye el "Mailbox"',
          msgEn: 'Migrated to Aquarius (12 A / 336 W · 3.3 °C · 0.2 L/d ration) — Assemble the "Mailbox" CO₂ adapter',
        };
      }
      if (!sim.objectives.a13MailboxInstalled) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Instala primero el adaptador LiOH "Mailbox" en Lab Este para reducir CO₂ (14.9→1.2 mmHg)',
          msgEn: 'Assemble & install the East Lab "Mailbox" LiOH adapter first (CO₂ 14.9→1.2 mmHg)',
        };
      }
      sim.objectives.a13ColdPowerup = true;
      sim.lightingMode = 'day';
      sim.tempCelsius = 17.5;
      sim.powerKwe = 1.85;
      st.done = true;
      st.progress = 100;
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: '¡Reencendido en frío del Módulo de Mando completado! Cápsula Sur lista para amerizaje en el Pacífico',
        msgEn: 'Cold CSM power-up procedure complete! South Capsule cleared for Pacific splashdown',
      };
    }

    case 'a13_mailbox_bench': {
      if (sim.objectives.a13MailboxInstalled) {
        return {
          handItem,
          animType: 'reach',
          tone: 'ok',
          msgEs: 'Adaptador "Mailbox" activo — CO₂ reducido a 1.2 mmHg. Vuelve al Puente MEDS para reencendido en frío',
          msgEn: '"Mailbox" adapter online — CO₂ down to 1.2 mmHg. Head to North MEDS for cold power-up',
        };
      }
      if (handItem?.itemKey === 'DA_MailboxAdapter') {
        sim.objectives.a13MailboxInstalled = true;
        sim.co2Ppm = 1580;
        st.done = true;
        st.progress = 100;
        purgeWorldItemKey(sim, 'DA_FlightPlanCard');
        purgeWorldItemKey(sim, 'DA_SuitHose');
        purgeWorldItemKey(sim, 'DA_DuctTapeKit');
        sim.activeRadio = {
          speakerId: 'LOVELL',
          textEs: '¡"Mailbox" sellado en tambor Aquarius! CO₂ bajó de 14.9 a 1.2 mmHg. Sube al Puente MEDS para el reencendido en frío.',
          textEn: '"Mailbox" sealed onto Aquarius canister! CO₂ dropped from 14.9 to 1.2 mmHg. Head to North MEDS for cold power-up.',
          timestampSec: sim.elapsedSec,
        };
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: 'Adaptador "Mailbox" instalado: CO₂ descendió de 14.9 a 1.2 mmHg',
          msgEn: '"Mailbox" LiOH adapter installed: CO₂ scrubbed from 14.9 down to 1.2 mmHg',
        };
      }
      let nextHand = handItem;
      if (handItem?.itemKey === 'DA_FlightPlanCard' && !sim.a13MailboxParts.card) {
        sim.a13MailboxParts.card = true;
        nextHand = null;
      } else if (handItem?.itemKey === 'DA_SuitHose' && !sim.a13MailboxParts.hose) {
        sim.a13MailboxParts.hose = true;
        nextHand = null;
      } else if (handItem?.itemKey === 'DA_DuctTapeKit' && !sim.a13MailboxParts.tape) {
        sim.a13MailboxParts.tape = true;
        nextHand = null;
      }
      const count = [sim.a13MailboxParts.card, sim.a13MailboxParts.hose, sim.a13MailboxParts.tape].filter(Boolean).length;
      st.progress = Math.round((count / 3) * 85);
      if (sim.a13MailboxParts.card && sim.a13MailboxParts.hose && sim.a13MailboxParts.tape && !nextHand) {
        return {
          handItem: { uid: `mailbox_${Date.now()}`, itemKey: 'DA_MailboxAdapter', charge: 100, clean: true, ammo: 0 },
          animType: 'use',
          tone: 'ok',
          msgEs: '¡Adaptador "Mailbox" ensamblado (3/3)! Pulsa [E]/Clic aquí otra vez para conectarlo y bajar CO₂',
          msgEn: '"Mailbox" LiOH Adapter assembled (3/3)! Press [E]/Click here again to couple it & scrub CO₂',
        };
      }
      if (count > 0 && nextHand === null && handItem !== null) {
        return {
          handItem: null,
          animType: 'use',
          tone: 'ok',
          msgEs: `Pieza acoplada en Banco "Mailbox" (${count}/3). Falta: ${!sim.a13MailboxParts.card ? 'Plan Vuelo ' : ''}${!sim.a13MailboxParts.hose ? 'Manguera ' : ''}${!sim.a13MailboxParts.tape ? 'Cinta Duct Tape' : ''}`.trim(),
          msgEn: `Part added to "Mailbox" Bench (${count}/3). Needed: ${!sim.a13MailboxParts.card ? 'Flight Plan ' : ''}${!sim.a13MailboxParts.hose ? 'Hose ' : ''}${!sim.a13MailboxParts.tape ? 'Duct Tape' : ''}`.trim(),
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: 'warn',
        msgEs: `Banco "Mailbox" (${count}/3): trae en mano Cartón Plan de Vuelo, Manguera de Traje y Cinta Duct Tape`,
        msgEn: `"Mailbox" Bench (${count}/3): bring Flight Plan Card, Suit Hose & Duct Tape`,
      };
    }

    case 'sts120_array_console': {
      sim.objectives.stsArrayInspected = true;
      st.done = true;
      st.progress = 100;
      sim.activeRadio = {
        speakerId: 'CONRAD',
        textEs: 'Diagnóstico P6-4B: desgarro de 2.5 ft entre Bahías 29 y 30 en ala solar de 240 ft (160V DC activos). Ve al Lab Este a fabricar 5 Cufflinks de aluminio.',
        textEn: 'P6-4B Diagnostics: 2.5 ft tear across Bays 29–30 on 240 ft wing (160V DC live). Head to East Lab to craft 5 aluminum Cufflinks.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Ala P6-4B diagnosticada: desgarro 2.5 ft en Bahías 29–30 (160V DC vivos) — Fabrica 5 Cufflinks en Lab Este',
        msgEn: 'P6-4B Array diagnosed: 2.5 ft tear in Bays 29–30 (160V DC live) — Craft 5 Cufflinks in East Lab',
      };
    }

    case 'sts120_cufflink_bench': {
      if (!sim.objectives.stsArrayInspected) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Diagnostica primero la telemetría del ala P6-4B en MEDS Norte antes de fabricar Cufflinks',
          msgEn: 'Inspect P6-4B telemetry at North MEDS Deck before crafting Cufflinks',
        };
      }
      sim.objectives.stsCufflinksCrafted = true;
      st.done = true;
      st.progress = 100;
      const useTape = handItem?.itemKey === 'DA_DuctTapeKit';
      const nextHand =
        useTape || !handItem
          ? { uid: `cuff_${Date.now()}`, itemKey: 'DA_CufflinkKit', charge: 100, clean: true, ammo: 0 }
          : handItem;
      return {
        handItem: nextHand,
        animType: 'use',
        tone: 'ok',
        msgEs: '5 Cufflinks de aluminio fabricados — Ahora despresuriza Esclusa Quest (~2.1 kPa) y lleva Pinza Aislada HV al sitio OBSS',
        msgEn: '5 aluminum Cufflinks fabricated — Depressurize Quest Airlock (~2.1 kPa) & carry HV Cutter to OBSS worksite',
      };
    }

    case 'sts120_obss_repair': {
      if (!sim.objectives.stsCufflinksCrafted) {
        return {
          handItem,
          animType: 'reach',
          tone: 'warn',
          msgEs: 'Fabrica primero los 5 Cufflinks de aluminio en el Banco Truss del Lab Este',
          msgEn: 'Craft the 5 aluminum Cufflinks at the East Lab Truss Bench first',
        };
      }
      if (sim.airlockStep < 5 && sim.airlockPressureKpa > 5.0) {
        return {
          handItem,
          animType: 'reach',
          tone: 'err',
          msgEs: `Esclusa Quest presurizada (${sim.airlockPressureKpa.toFixed(1)} kPa) — Complétala en 5 pasos hasta ~2.1 kPa (MPEV) para salir por OBSS`,
          msgEn: `Quest Airlock pressurized (${sim.airlockPressureKpa.toFixed(1)} kPa) — Complete 5-step MPEV depress to ~2.1 kPa first`,
        };
      }
      if (!sim.objectives.stsWireSnipped) {
        if (handItem?.itemKey !== 'DA_InsulatedCutter') {
          return {
            handItem,
            animType: 'reach',
            tone: 'warn',
            msgEs: 'En Canadarm2 + 90 ft OBSS: equipa Pinza Aislada HV (160V DC) para cortar el cable enredado',
            msgEn: 'On Canadarm2 + 90 ft OBSS: hold HV Insulated Cutter (160V DC) to snip snagged guidewire',
          };
        }
        sim.objectives.stsWireSnipped = true;
        st.progress = 35;
        return {
          handItem: { uid: `cuff_eva_${Date.now()}`, itemKey: 'DA_CufflinkKit', charge: 100, clean: true, ammo: 0 },
          animType: 'use',
          tone: 'ok',
          msgEs: '¡Cable cortado con aislamiento 160V DC! Pulsa [E]/Clic otra vez para instalar 5 Cufflinks y desplegar por medias bahías [0/5]',
          msgEn: 'Snagged wire cut under 160V DC isolation! Press [E]/Click again to install 5 Cufflinks & deploy half-bay at a time [0/5]',
        };
      }
      if (sim.stsRedeploySteps < 5) {
        sim.stsRedeploySteps += 1;
        sim.powerKwe = 12.4 + sim.stsRedeploySteps * 5.2;
        st.progress = 35 + Math.round((sim.stsRedeploySteps / 5) * 65);
        if (sim.stsRedeploySteps >= 5) {
          sim.objectives.stsArrayDeployed = true;
          st.done = true;
          sim.lightingMode = 'day';
          purgeWorldItemKey(sim, 'DA_CufflinkKit');
          purgeWorldItemKey(sim, 'DA_InsulatedCutter');
          return {
            handItem: handItem?.itemKey === 'DA_CufflinkKit' ? null : handItem,
            animType: 'use',
            tone: 'ok',
            msgEs: `¡Ala P6-4B desplegada [5/5] con 5 Cufflinks! Potencia ISS restaurada (${sim.powerKwe.toFixed(1)} kWe) — Represuriza Esclusa o aborda Orion`,
            msgEn: `P6-4B Array fully deployed [5/5] with 5 Cufflinks! ISS bus restored (${sim.powerKwe.toFixed(1)} kWe) — Repressurize or board Orion`,
          };
        }
        return {
          handItem: handItem?.itemKey === 'DA_CufflinkKit' ? null : handItem,
          animType: 'use',
          tone: 'ok',
          msgEs: `Despliegue gradual P6-4B (${sim.stsRedeploySteps}/5 medias bahías · ${sim.powerKwe.toFixed(1)} kWe) — Vigila tensión de bisagras`,
          msgEn: `P6-4B half-bay deploy (${sim.stsRedeploySteps}/5 · ${sim.powerKwe.toFixed(1)} kWe) — Monitoring hinge tension`,
        };
      }
      return {
        handItem,
        animType: 'reach',
        tone: 'ok',
        msgEs: 'Ala solar P6-4B 100% operativa (240 ft · 160V DC estables)',
        msgEn: 'P6-4B Solar Array 100% nominal (240 ft · 160V DC stable)',
      };
    }
  }
  })();

  if (
    !res.trainingBriefKind &&
    !res.openCrewDialogue &&
    !res.openEndingModal &&
    !res.openLaunchTransit &&
    getStationTrainingBrief(st.kind)
  ) {
    return { ...res, trainingBriefKind: st.kind };
  }
  return res;
}

export function completeEngineeringCalibration(
  stationKind: RoomStationKind,
  sim: SpaceRoomState,
  handItem: HeldItem | null,
  option?: 'patch' | 'cdra' | 'krusty' | 'solar' | 'nominal'
): RoomInteractionResult {
  const st = sim.stations.find((s) => s.kind === stationKind);
  if (st) st.done = true;

  const res = ((): RoomInteractionResult => {
    switch (stationKind) {
    case 'skylab_thermal_station': {
      const usePatch = option !== 'cdra';
      sim.act1Decision = usePatch ? 'duct_tape_patch' : 'cdra_reroute';
      sim.objectives.thermalFixed = true;
      purgeWorldItemKey(sim, 'DA_DuctTapeKit');
      sim.tempCelsius = Math.max(21.4, sim.tempCelsius - 6.5);
      sim.internalHeatWm2 = 112;
      unlockNoteAndPaper(sim, 3, 1);
      sim.activeRadio = {
        speakerId: 'CONRAD',
        textEs: usePatch
          ? 'Parche Skylab/Apollo 13 (Kapton + Mylar) sellado a 163 W/m² → 112 W/m². Nota #3 desbloqueada.'
          : 'Desvío térmico CDRA equilibrado en circuito secundario. Nota #3 desbloqueada.',
        textEn: usePatch
          ? 'Skylab/Apollo 13 parasol patch (Kapton + Mylar) sealed: 163 W/m² → 112 W/m². Note #3 unlocked.'
          : 'Secondary CDRA thermal loop rerouted cleanly. Note #3 unlocked.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem: usePatch && handItem?.itemKey === 'DA_DuctTapeKit' ? null : handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: usePatch
          ? 'Escudo térmico Skylab calibrado y parcheado (112 W/m² · Nota #3)'
          : 'Circuito térmico CDRA estabilizado (Nota #3)',
        msgEn: usePatch
          ? 'Skylab thermal shield calibrated & patched (112 W/m² · Note #3)'
          : 'CDRA thermal loop stabilized (Note #3)',
      };
    }

    case 'spe_electrolyzer_station': {
      sim.waterLiters = Math.max(20, sim.waterLiters - 0.9);
      sim.o2Percent = Math.min(21.2, sim.o2Percent + 0.9);
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Electrólisis SPE calibrada: 2H₂O → 2H₂ + O₂ (66.7% potencia · +0.9% O₂)',
        msgEn: 'SPE Electrolysis calibrated: 2H₂O → 2H₂ + O₂ (66.7% power share · +0.9% O₂)',
      };
    }

    case 'krusty_reactor_station': {
      const useKrusty = option === 'krusty' || (option !== 'solar' && sim.powerChoice === 'fsp_40kw');
      sim.act2Decision = useKrusty ? 'krusty_spe' : 'solar_ration';
      sim.powerKwe = useKrusty ? NASA_CONSTANTS.POWER_AND_THERMAL.FSP_40_NET_KWE : 20.0;
      sim.batteryPercent = Math.min(100, sim.batteryPercent + (useKrusty ? 35 : 15));
      sim.objectives.powerBalanced = true;
      sim.lightingMode = useKrusty ? 'day' : 'circadian';
      purgeWorldItemKey(sim, 'DA_EmergencyFuse');
      unlockNoteAndPaper(sim, 4, 6);
      sim.activeRadio = {
        speakerId: 'CONRAD',
        textEs: useKrusty
          ? 'Reactor FSP KRUSTY 40 kWe Stirling estable en noche de 354 h (radiadores 133.4 / 216.2 m²). Nota #4 y Space Paper #6 desbloqueados.'
          : 'Modo Solar racionado activado en oscuridad: carga crítica de baterías. Nota #4 y Space Paper #6 desbloqueados.',
        textEn: useKrusty
          ? '40 kWe KRUSTY FSP Stirling locked in through 354 h darkness (133.4 / 216.2 m² radiators). Note #4 & Paper #6 unlocked.'
          : 'Solar emergency rationing set: battery reserves stretched. Note #4 & Paper #6 unlocked.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem: handItem?.itemKey === 'DA_EmergencyFuse' ? null : handItem,
        animType: 'use',
        tone: useKrusty ? 'ok' : 'warn',
        msgEs: useKrusty
          ? 'KRUSTY FSP 40 kWe calibrado (133.4 / 216.2 m² radiadores · Nota #4)'
          : 'Racionamiento solar calibrado (Nota #4 + Paper #6)',
        msgEn: useKrusty
          ? 'KRUSTY FSP 40 kWe calibrated (133.4 / 216.2 m² radiators · Note #4)'
          : 'Solar rationing calibrated (Note #4 + Paper #6)',
      };
    }

    case 'aph_chamber_station': {
      sim.objectives.aphHarvested = true;
      sim.foodKg += 2.6;
      sim.o2Percent = Math.min(21.2, sim.o2Percent + 0.3);
      unlockNoteAndPaper(sim, undefined, 3);
      sim.activeRadio = {
        speakerId: 'WHITSON',
        textEs: 'Cosecha VEG-05 (1,700 cm² · espectro 630+450 nm) recolectada. Ahora cierra la válvula del compostaje microbiano en el Lab Este.',
        textEn: 'VEG-05 tomato rack (1,700 cm² · 630+450 nm spectrum) harvested. Now isolate the microbial compost valve in the East Lab.',
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
        msgEs: 'Cosecha VEG-05 bajo 630+450 nm completada (+2.6 kg · Space Paper #3)',
        msgEn: 'VEG-05 tomatoes harvested under 630+450 nm glow (+2.6 kg · Space Paper #3)',
      };
    }

    case 'compost_valve_station': {
      sim.objectives.compostIsolated = true;
      sim.act3Decision = 'isolate_bios3';
      sim.co2Ppm = Math.max(520, sim.co2Ppm - 260);
      sim.o2Percent = Math.min(21.0, sim.o2Percent + 0.4);
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Válvula de compostaje aislada (detiene drenaje 0.022–0.153 L O₂/kg·min)',
        msgEn: 'Microbial compost valve isolated (halted 0.022–0.153 L O₂/kg·min draw)',
      };
    }

    case 'bios3_buffer_station': {
      sim.objectives.bios3Activated = true;
      sim.waterLiters = Math.min(103.0, sim.waterLiters + 14.0);
      purgeWorldItemKey(sim, 'DA_WaterJar');
      purgeWorldItemKey(sim, 'DA_ClayPillow');
      unlockNoteAndPaper(sim, 5, 3);
      sim.activeRadio = {
        speakerId: 'WHITSON',
        textEs: 'Tanque amortiguador BIOS-3 (1,000 L agua + 400 kg regolito · 95% rec. agua) activado. Nota #5 desbloqueada.',
        textEn: 'BIOS-3 buffer tank (1,000 L water + 400 kg regolith · 95% water recovery) active. Note #5 unlocked.',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem: handItem?.itemKey === 'DA_WaterJar' ? null : handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Protocolo BIOS-3 activado (95% recuperación agua · Nota #5)',
        msgEn: 'BIOS-3 protocol engaged (95% water recovery · Note #5)',
      };
    }

    case 'regolith_shield_station': {
      sim.objectives.regolithDeployed = true;
      sim.act4Decision = 'shield_2m_rover';
      purgeWorldItemKey(sim, 'DA_RegolithSample');
      sim.crewRadiationMsv = Math.max(38, sim.crewRadiationMsv - (handItem?.itemKey === 'DA_RegolithSample' ? 22 : 12));
      sim.lightingMode = 'day';
      unlockNoteAndPaper(sim, 6, undefined);
      sim.activeRadio = {
        speakerId: 'LOVELL',
        textEs: 'Blindaje de 2.0 m de regolito compactado (300 g/cm² · 400 t) operativo. ¡Camina al Terminal Norte para tu Veredicto Final!',
        textEn: '2.0 m compacted regolith shield (300 g/cm² · 400 t) locked! Head to North Deck Terminal for Final Mission Debrief!',
        timestampSec: sim.elapsedSec,
      };
      return {
        handItem: handItem?.itemKey === 'DA_RegolithSample' ? null : handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Blindaje 2.0 m regolito (300 g/cm² · 400 t) desplegado — Nota #6 desbloqueada',
        msgEn: '2.0 m regolith shield (300 g/cm² · 400 t) deployed — Note #6 unlocked',
      };
    }

    default:
      return {
        handItem,
        animType: 'use',
        tone: 'ok',
        msgEs: 'Calibración completada',
        msgEn: 'Calibration complete',
      };
  }
  })();

  return getStationTrainingBrief(stationKind)
    ? { ...res, trainingBriefKind: stationKind }
    : res;
}

export interface GuidedStepInfo {
  stepTitleEs: string;
  stepTitleEn: string;
  instructionEs: string;
  instructionEn: string;
  targetX: number;
  targetY: number;
  zoneId: RoomZoneId;
  zoneEs: string;
  zoneEn: string;
}

export function getCurrentGuidedStep(
  sim: SpaceRoomState,
  handItem: HeldItem | null,
  inventoryItems: (HeldItem | null)[] = []
): GuidedStepInfo {
  const makeStep = (
    x: number,
    y: number,
    stepTitleEs: string,
    stepTitleEn: string,
    instructionEs: string,
    instructionEn: string
  ): GuidedStepInfo => {
    const z = getRoomZoneAt(x, y);
    return {
      stepTitleEs,
      stepTitleEn,
      instructionEs,
      instructionEn,
      targetX: x,
      targetY: y,
      zoneId: z.id,
      zoneEs: z.nameEs,
      zoneEn: z.nameEn,
    };
  };

  const stPos = (kind: RoomStationKind, fallbackX = 10.0, fallbackY = 3.5) => {
    const s = sim.stations.find((st) => st.kind === kind);
    return s ? { x: s.x, y: s.y } : { x: fallbackX, y: fallbackY };
  };

  const hasInv = (key: string) => hasItemInSlots(key, handItem, inventoryItems);

  if (sim.currentMissionId === 'tutorial_hab') {
    if (!sim.objectives.powerRestored) {
      const box = sim.stations.find((s) => s.kind === 'power_box');
      const charger = sim.stations.find((s) => s.kind === 'power_charger');
      if (hasInv('DA_Battery')) {
        const invBat = collectInventoryKeys(handItem, inventoryItems).find((i) => i.itemKey === 'DA_Battery');
        const full = (invBat?.charge ?? 0) >= 95;
        const tgt = full ? stPos('power_box', 19.68, 4.85) : stPos('power_charger', 19.68, 5.45);
        return makeStep(
          tgt.x,
          tgt.y,
          'Fase 0 (1/10) · Energía FSP',
          'Phase 0 (1/10) · FSP Power',
          full
            ? 'Equipa la Batería (100%) con [1-5] e insértala en la Caja FSP del Lab Este.'
            : 'Equipa la Batería con [1-5] e insértala en el Cargador Li-Ion (Lab Este) hasta 100%.',
          full
            ? 'Equip the 100% Battery [1-5] and insert it into East Lab FSP Power Box.'
            : 'Equip Battery [1-5] and insert it into East Lab Li-Ion Charger until 100%.'
        );
      }
      if (charger?.hasBattery && !charger.done) {
        return makeStep(
          charger.x,
          charger.y,
          'Fase 0 (1/10) · Carga Li-Ion',
          'Phase 0 (1/10) · Li-Ion Charge',
          'Espera al 100% y recoge la Batería del Cargador en Lab Este.',
          'Wait for 100% charge and collect Battery from the East Lab Charger.'
        );
      }
      if (box && !box.hasBattery) {
        const batItem = sim.worldItems.find((w) => w.itemKey === 'DA_Battery');
        return makeStep(
          batItem?.x ?? 8.65,
          batItem?.y ?? 5.55,
          'Fase 0 (1/10) · Recoger Batería',
          'Phase 0 (1/10) · Grab Battery',
          'Recoge la Batería Li-Ion en la mesa del Pasillo Central [Clic / E] o en el Estante Noreste.',
          'Pick up a Li-Ion Battery at Central Hub bench [Click / E] or NE Supply Rack.'
        );
      }
      if (box && !box.hasFuse) {
        if (hasInv('DA_Fuse')) {
          return makeStep(
            box.x,
            box.y,
            'Fase 0 (1/10) · Insertar Fusible',
            'Phase 0 (1/10) · Insert Fuse',
            'Equipa el Fusible con [1-5] e insértalo en la Caja FSP del Lab Este.',
            'Equip the Fuse [1-5] and insert it into the East Lab FSP Power Box.'
          );
        }
        const fuseItem = sim.worldItems.find((w) => w.itemKey === 'DA_Fuse');
        return makeStep(
          fuseItem?.x ?? 8.65,
          fuseItem?.y ?? 4.82,
          'Fase 0 (1/10) · Recoger Fusible',
          'Phase 0 (1/10) · Grab Fuse',
          'Recoge el Fusible en el Pasillo Central (o pídeselo al Ing. Conrad).',
          'Pick up the Fuse on the Central Corridor bench (or ask Eng. Conrad).'
        );
      }
      const lever = stPos('power_lever', 19.68, 4.22);
      return makeStep(
        lever.x,
        lever.y,
        'Fase 0 (1/10) · Activar Bus FSP',
        'Phase 0 (1/10) · Throw Breaker',
        'Baja la Palanca de Potencia en el Lab Este para energizar toda la base.',
        'Pull the Cabin Power Breaker Lever in East Lab to energize the base.'
      );
    }

    if (!sim.objectives.eclssCleaned) {
      const vent = sim.stations.find((s) => s.kind === 'eclss_vent');
      if (vent && (vent.screwsLeft ?? 0) > 0) {
        if (hasInv('DA_ScrewDriver')) {
          return makeStep(
            vent.x,
            vent.y,
            `Fase 0 (2/10) · Tornillos CO₂ (${vent.screwsLeft} rest.)`,
            `Phase 0 (2/10) · CO₂ Duct (${vent.screwsLeft} left)`,
            'Equipa el Destornillador EVA [1-5] y úsalo en el Conducto CO₂ (Lab Este, pared Sur).',
            'Equip EVA Screwdriver [1-5] on East Lab CO₂ Vent Duct (South wall) until 0 screws remain.'
          );
        }
        const sdItem = sim.worldItems.find((w) => w.itemKey === 'DA_ScrewDriver');
        return makeStep(
          sdItem?.x ?? 8.65,
          sdItem?.y ?? 5.05,
          'Fase 0 (2/10) · Mantenimiento ECLSS',
          'Phase 0 (2/10) · ECLSS Repair',
          'Toma el Destornillador de la mesa central y abre el Conducto CO₂ en el Lab Este.',
          'Grab Screwdriver at Central bench and open CO₂ Vent Duct in East Lab.'
        );
      }
      const filterInv = collectInventoryKeys(handItem, inventoryItems).find((i) => i.itemKey === 'DA_VentFilter');
      if (filterInv) {
        const tgt = filterInv.clean ? stPos('eclss_vent', 15.60, 0.86) : stPos('filter_regenerator', 16.95, 0.86);
        return makeStep(
          tgt.x,
          tgt.y,
          'Fase 0 (2/10) · Cartucho LiOH 7.0 kg',
          'Phase 0 (2/10) · 7.0 kg LiOH Filter',
          filterInv.clean
            ? 'Equipa el Cartucho LiOH limpio [1-5] e insértalo en el Conducto CO₂ (Lab Este).'
            : 'Equipa el Cartucho LiOH sucio [1-5] y regénéralo en el Regenerador al lado.',
          filterInv.clean
            ? 'Equip clean LiOH Cartridge [1-5] and install into East Lab CO₂ Vent Duct.'
            : 'Equip dirty LiOH Cartridge [1-5] at the adjacent East Lab Regenerator.'
        );
      }
      const ventP = stPos('eclss_vent', 15.60, 0.86);
      return makeStep(
        ventP.x,
        ventP.y,
        'Fase 0 (2/10) · Extraer Cartucho LiOH',
        'Phase 0 (2/10) · Extract LiOH Filter',
        'Extrae o reinstala el cartucho del Conducto CO₂ en el Lab Este.',
        'Extract or reinstall the LiOH cartridge in East Lab CO₂ Vent Duct.'
      );
    }

    if (!sim.objectives.mealPrepared) {
      const heater = stPos('food_heater', 0.52, 1.38);
      return makeStep(
        heater.x,
        heater.y,
        'Fase 0 (3/10) · Nutrición BVAD Galley',
        'Phase 0 (3/10) · BVAD Galley Meal',
        'En Dormitorio Oeste: toma Ración + Agua (dispensadores) y calienta tu comida en el Galley.',
        'In West Hab: grab Ration + Water (dispensers) and heat your tray in the BVAD Galley.'
      );
    }

    if (!sim.objectives.exerciseCalibrated) {
      const tm = stPos('treadmill_station', 2.25, 5.05);
      return makeStep(
        tm.x,
        tm.y,
        'Fase 0 (4/10) · Caminadora ASCAN',
        'Phase 0 (4/10) · ASCAN Treadmill',
        'Calibra la Caminadora ASCAN en Dormitorio Oeste (2.0 h/día contra pérdida ósea).',
        'Calibrate ASCAN Treadmill in West Hab (2.0 h/day bone mitigation).'
      );
    }

    if (!sim.objectives.whcInspected) {
      const whc = stPos('whc_hygiene_station', 5.30, 6.16);
      return makeStep(
        whc.x,
        whc.y,
        'Fase 0 (5/10) · Inspección WHC (STS-126)',
        'Phase 0 (5/10) · WHC Inspection (STS-126)',
        'Inspecciona el Compartimento Higiene WHC en Dormitorio Oeste (esquina Noreste).',
        'Inspect the STS-126 WHC Hygiene Rack in West Hab (Northeast corner).'
      );
    }

    if (!sim.objectives.crisisSolved) {
      const cq = stPos('crisis_quiz_station', 8.92, 5.15);
      return makeStep(
        cq.x,
        cq.y,
        'Fase 0 (6/10) · Simulacro Crisis ECLSS',
        'Phase 0 (6/10) · ECLSS Crisis Drill',
        'Resuelve el Simulacro de Crisis de Agua en el Núcleo Central (y presiona Confirmar Decisión).',
        'Solve the Water Leak Crisis Simulator at Central Hub (click Confirm Decision).'
      );
    }

    if (!sim.objectives.nblCertified) {
      const nbl = stPos('nbl_pool_station', 3.85, -4.25);
      return makeStep(
        nbl.x,
        nbl.y,
        'Fase 0 (7/10) · Piscina NBL y Traje xEMU',
        'Phase 0 (7/10) · NBL Pool & xEMU Suit',
        'Cruza el Pasillo Suroeste desde Dormitorio hacia la Piscina NBL 61.5 m y calibra flotabilidad neutra.',
        'Walk through Southwest Corridor from Hab to 61.5 m NBL Pool and trim neutral buoyancy.'
      );
    }

    if (!sim.objectives.computerCertified) {
      const cmp = stPos('computer_formulas_station', 16.52, 12.85);
      return makeStep(
        cmp.x,
        cmp.y,
        'Fase 0 (8/10) · Lab Fórmulas NASA',
        'Phase 0 (8/10) · NASA Math Lab',
        'Sube desde Lab Este por el Pasillo Noreste al Lab de Cómputo y resuelve I=I₀/r², P=ρgh y Δv.',
        'Walk North from East Lab through NE Corridor to Compute Lab and solve I=I₀/r², P=ρgh & Δv.'
      );
    }

    if (!sim.objectives.centrifugeCertified) {
      const cen = stPos('centrifuge_station', 18.60, 11.45);
      return makeStep(
        cen.x,
        cen.y,
        'Fase 0 (9/10) · Centrífuga 4.5 G + AGSM',
        'Phase 0 (9/10) · 4.5 G Centrifuge + AGSM',
        'En el mismo Ala Noreste: entra en la Centrífuga 4.5 G y supera la carga con maniobra AGSM [ESPACIO].',
        'In NE Hall: enter the 4.5 G Human Centrifuge and sustain tolerance using AGSM [SPACE].'
      );
    }

    if (!sim.objectives.fireDrillCertified) {
      const fr = stPos('eclss_fire_station', 18.90, -6.88);
      return makeStep(
        fr.x,
        fr.y,
        'Fase 0 (10/10) · Incendio 0g ISS (Rack #2)',
        'Phase 0 (10/10) · ISS 0g Fire Drill',
        'Cruza desde Lab Este hacia la Cámara Sureste y completa los 5 pasos del fuego orbital (<15 ppm CO).',
        'Walk South from East Lab to SE Chamber and execute all 5 ISS fire suppression steps (<15 ppm CO).'
      );
    }

    const hatch = stPos('hatch_next_mission', 10.0, -7.12);
    return makeStep(
      hatch.x,
      hatch.y,
      'Fase 0 Lista · Abordar Cápsula Orion Sur',
      'Phase 0 Complete · Board South Orion',
      '¡Certificación JSC completa! Camina al Hangar Sur, entra en la Cápsula Orion y despega hacia Fase 1.',
      'JSC certification complete! Walk to South Hangar, board Orion Capsule & launch to Phase 1.'
    );
  }

  if (sim.currentMissionId === 'manifest_launch') {
    if (!sim.objectives.manifestConfigured) {
      const me = stPos('manifest_eclss', 9.25, 10.80);
      return makeStep(
        me.x,
        me.y,
        'Fase 1 (1/6) · Manifiesto SLS/Orion',
        'Phase 1 (1/6) · SLS Payload Manifest',
        'Sube al Puente Norte (MEDS) y selecciona arquitectura ECLSS, Reactor KRUSTY y Rover 6,000 kg.',
        'Go to North MEDS Deck and configure ISS ECLSS, 40 kWe KRUSTY & FSP Rover architectures.'
      );
    }
    if (!sim.objectives.preflightRepaired) {
      if (!hasInv('DA_CryoValve')) {
        const cryo = sim.worldItems.find((w) => w.itemKey === 'DA_CryoValve');
        if (cryo) {
          return makeStep(
            cryo.x,
            cryo.y,
            'Fase 1 (2/6) · Recoger Válvula Crio LOX/LH₂',
            'Phase 1 (2/6) · Collect Cryo Valve',
            'Ve al banco EVA de la Piscina NBL (Suroeste) y guarda la Válvula Criogénica LOX/LH₂.',
            'Walk to SW NBL EVA bench and collect the LOX/LH₂ Cryogenic Valve.'
          );
        }
      }
      if (!hasInv('DA_EmergencyFuse')) {
        const fuse = sim.worldItems.find((w) => w.itemKey === 'DA_EmergencyFuse');
        if (fuse) {
          return makeStep(
            fuse.x,
            fuse.y,
            'Fase 1 (2/6) · Recoger Fusible RS-25',
            'Phase 1 (2/6) · Collect RS-25 Fuse',
            'Recoge el Fusible de Emergencia RS-25 en la mesa del Núcleo Central.',
            'Pick up the RS-25 Emergency Fuse on the Central Hub tool bench.'
          );
        }
      }
      if (!hasInv('DA_TorqueWrench')) {
        const wr = sim.worldItems.find((w) => w.itemKey === 'DA_TorqueWrench');
        if (wr) {
          return makeStep(
            wr.x,
            wr.y,
            'Fase 1 (2/6) · Recoger Llave EVA',
            'Phase 1 (2/6) · Collect EVA Wrench',
            'Recoge la Llave Dinamométrica EVA en el Almacén Sureste (cámara de entrenamiento).',
            'Pick up the EVA Torque Wrench in the Southeast Storage Wing.'
          );
        }
      }
    }
    const hatchSt = stPos('orion_hatch', 10.00, -4.55);
    if (!sim.playerInsideOrion) {
      if (!sim.orionHatchOpen) {
        return makeStep(
          hatchSt.x,
          hatchSt.y,
          'Fase 1 (3/6) · Bahía de Lanzamiento -> Abrir Escotilla',
          'Phase 1 (3/6) · Launch Bay -> Open Hatch',
          'Camina por la pasarela de la Bahía de Lanzamiento (Hangar Sur) hasta la Escotilla Orion y ábrela [E / Clic].',
          'Walk along South Hangar Launch Bay Gantry to Orion Side Hatch and open it [E / Click].'
        );
      }
      return makeStep(
        10.00,
        -5.60,
        'Fase 1 (3/6) · Abordar Cápsula Orion',
        'Phase 1 (3/6) · Board Orion Capsule',
        'Camina hacia el interior de la Cápsula Orion por la escotilla abierta.',
        'Walk forward through the open hatch into the Orion Crew Module.'
      );
    }
    if (!sim.orionHatchSealed) {
      return makeStep(
        hatchSt.x,
        hatchSt.y,
        'Fase 1 (4/6) · Cerrar y Sellar Escotilla Orion',
        'Phase 1 (4/6) · Close & Seal Orion Hatch',
        'Da media vuelta y cierra la Escotilla de Orion atrás tuyo [E / Clic] para sellar la cabina a 101.3 kPa.',
        'Turn around and close the Orion Side Hatch behind you [E / Click] to seal cabin at 101.3 kPa.'
      );
    }
    if (!sim.objectives.preflightRepaired) {
      const faultSt = stPos('orion_fault_panel', 8.82, -6.10);
      return makeStep(
        faultSt.x,
        faultSt.y,
        'Fase 1 (5/6) · Reparar Falla Crio en Orion',
        'Phase 1 (5/6) · Repair Orion Cryo Fault',
        'Repara la falla Crio/RS-25 y aplica torque 28.5 N·m en el panel izquierdo de Orion.',
        'Repair the Cryo/RS-25 fault and torque 28.5 N·m on the Orion port bay panel.'
      );
    }
    if (!sim.objectives.preflightSystemsOn || !sim.orionLevelsChecked) {
      const pwrSt = stPos('orion_power_panel', 11.18, -6.10);
      return makeStep(
        pwrSt.x,
        pwrSt.y,
        'Fase 1 (5/6) · Comprobar Niveles y 5 Sistemas',
        'Phase 1 (5/6) · Verify Levels & 5 Buses',
        'Comprueba todos los niveles (O₂/CO₂/H₂O/kPa) y enciende los 5 interruptores en el panel derecho de Orion.',
        'Verify all telemetry levels (O₂/CO₂/H₂O/kPa) and switch ON all 5 buses on Orion starboard panel.'
      );
    }
    const seatSt = stPos('orion_pilot_seat', 10.00, -7.12);
    return makeStep(
      seatSt.x,
      seatSt.y,
      'Fase 1 (6/6) · Sentarse y Despegar en 3D',
      'Phase 1 (6/6) · Strap In & 3D Liftoff',
      'Siéntate en el Asiento del Comandante Orion (proa) para iniciar despegue, estabilización Max-Q y aterrizaje 3D.',
      'Sit in the forward Orion Commander Seat for 3D cockpit ascent, Max-Q stabilization & 3D landing.'
    );
  }

  if (sim.currentMissionId === 'act1_2_surface') {
    if (!sim.objectives.thermalFixed) {
      const th = stPos('skylab_thermal_station', 19.68, 2.05);
      return makeStep(
        th.x,
        th.y,
        'Acto 1–2 · Parche Térmico 163 W/m²',
        'Act 1–2 · 163 W/m² Thermal Patch',
        'Toma Kit Kapton / Destornillador (mesa Este o Conrad) y calibra el Escudo Térmico en Lab Este.',
        'Grab Kapton Kit / Screwdriver (East bench or Conrad) and calibrate East Lab Thermal Shield.'
      );
    }
    if (!sim.objectives.powerBalanced) {
      const kr = stPos('krusty_reactor_station', 16.25, 6.16);
      return makeStep(
        kr.x,
        kr.y,
        'Acto 1–2 · Reactor KRUSTY 40 kWe',
        'Act 1–2 · 40 kWe KRUSTY Core',
        'Calibra el Reactor KRUSTY Stirling y radiadores (133.4 / 216.2 m²) en el Lab Este (Norte).',
        'Calibrate KRUSTY Stirling FSP & radiators (133.4 / 216.2 m²) in East Lab (North).'
      );
    }
    const hatch = stPos('hatch_next_mission', 10.0, -7.12);
    return makeStep(
      hatch.x,
      hatch.y,
      'Acto 1–2 · Transición a Invernadero',
      'Act 1–2 · Advance to Greenhouse',
      'Sistemas estabilizados. Ve a la Cápsula Orion Sur para avanzar al Acto 3 (BLSS / BIOS-3).',
      'Systems nominal. Head to South Orion Capsule to advance to Act 3 (BLSS / BIOS-3).'
    );
  }

  if (sim.currentMissionId === 'act3_greenhouse') {
    if (!sim.objectives.aphHarvested) {
      const aph = stPos('aph_chamber_station', 17.35, 6.16);
      return makeStep(
        aph.x,
        aph.y,
        'Acto 3 · Cosecha APH (630+450 nm)',
        'Act 3 · APH Harvest (630+450 nm)',
        'Camina al Lab Este y calibra la cámara APH VEG-05 para cosechar tomates.',
        'Walk to East Lab and calibrate the APH VEG-05 rack to harvest fresh tomatoes.'
      );
    }
    if (!sim.objectives.compostIsolated) {
      const cmp = stPos('compost_valve_station', 14.85, 6.16);
      return makeStep(
        cmp.x,
        cmp.y,
        'Acto 3 · Aislamiento Compostaje',
        'Act 3 · Isolate Compost Loop',
        'Cierra la válvula de compostaje microbiano en el Lab Este para frenar pérdida de O₂.',
        'Seal the microbial compost valve in East Lab to stop O₂ biological drawdown.'
      );
    }
    if (!sim.objectives.bios3Activated) {
      const b3 = stPos('bios3_buffer_station', 19.68, 1.35);
      return makeStep(
        b3.x,
        b3.y,
        'Acto 3 · Tanque BIOS-3 (1,000 L)',
        'Act 3 · BIOS-3 Tank (1,000 L)',
        'Activa el Tanque Amortiguador BIOS-3 (95% recuperación agua) en el Lab Este.',
        'Activate the BIOS-3 Buffer Tank (95% water recovery) in the East Lab.'
      );
    }
    const hatch = stPos('hatch_next_mission', 10.0, -7.12);
    return makeStep(
      hatch.x,
      hatch.y,
      'Acto 3 · Preparar Acto 4 SPE',
      'Act 3 · Advance to Act 4 Storm',
      'Invernadero estable. Embarca en la Cápsula Orion Sur hacia el Acto 4 (Tormenta Solar SPE).',
      'Greenhouse nominal. Board South Orion Capsule to enter Act 4 (SPE Solar Storm).'
    );
  }

  if (sim.currentMissionId === 'apollo13_aquarius') {
    if (!sim.objectives.a13CryoDiagnosed) {
      const p = stPos('a13_cryo_stir_panel', 11.45, -5.80);
      return makeStep(
        p.x,
        p.y,
        'Apollo 13 (1/4) · Agitado Crio O₂',
        'Apollo 13 (1/4) · Cryo O₂ Stir',
        'Entra al Hangar Sur y activa el Panel SM Cryo O₂ para diagnosticar Tanque #2 (0 psia) y Buses A/B.',
        'Enter South Hangar and trigger SM Cryo O₂ Panel to log Tank #2 (0 psia) & Bus A/B voltage drop.'
      );
    }
    if (!sim.objectives.a13AquariusMigrated) {
      const a = stPos('a13_aquarius_transfer', 10.00, 12.60);
      return makeStep(
        a.x,
        a.y,
        'Apollo 13 (2/4) · Migrar a Aquarius',
        'Apollo 13 (2/4) · Shed to Aquarius',
        'Sube al Puente MEDS Norte para transferir energía a Aquarius (12 A / 336 W, 3.3 °C) y ración 0.2 L/día.',
        'Walk to North MEDS Deck to power down to LM Aquarius (12 A / 336 W, 3.3 °C) & 0.2 L/d ration.'
      );
    }
    if (!sim.objectives.a13MailboxInstalled) {
      const mb = stPos('a13_mailbox_bench', 17.35, 3.55);
      if (hasInv('DA_MailboxAdapter')) {
        return makeStep(
          mb.x,
          mb.y,
          'Apollo 13 (3/4) · Conectar "Mailbox"',
          'Apollo 13 (3/4) · Couple "Mailbox"',
          'Equipa el Adaptador "Mailbox" con [1-5] e instálalo en el Banco Lab Este (CO₂ 14.9→1.2 mmHg).',
          'Equip the "Mailbox" Adapter [1-5] and couple it at East Lab Bench (CO₂ 14.9→1.2 mmHg).'
        );
      }
      if (!sim.a13MailboxParts.card) {
        if (hasInv('DA_FlightPlanCard')) {
          return makeStep(mb.x, mb.y, 'Apollo 13 (3/4) · Cartón en Banco', 'Apollo 13 (3/4) · Place Card', 'Lleva el Cartón Plan de Vuelo al Banco "Mailbox" en Lab Este.', 'Bring Flight Plan Card to East Lab "Mailbox" Bench.');
        }
        const cardItem = sim.worldItems.find((w) => w.itemKey === 'DA_FlightPlanCard');
        return makeStep(cardItem?.x ?? 2.85, cardItem?.y ?? 6.55, 'Apollo 13 (3/4) · Recoger Plan Vuelo', 'Apollo 13 (3/4) · Grab Flight Plan', 'Recoge el Cartón Plan de Vuelo en el escritorio de Habitación Oeste.', 'Collect Flight Plan Cover at West Hab Desk.');
      }
      if (!sim.a13MailboxParts.hose) {
        if (hasInv('DA_SuitHose')) {
          return makeStep(mb.x, mb.y, 'Apollo 13 (3/4) · Manguera en Banco', 'Apollo 13 (3/4) · Place Hose', 'Lleva la Manguera Umbilical al Banco "Mailbox" en Lab Este.', 'Bring Suit Hose to East Lab "Mailbox" Bench.');
        }
        const hoseItem = sim.worldItems.find((w) => w.itemKey === 'DA_SuitHose');
        return makeStep(hoseItem?.x ?? 5.35, hoseItem?.y ?? -6.10, 'Apollo 13 (3/4) · Recoger Manguera', 'Apollo 13 (3/4) · Grab Suit Hose', 'Recoge la Manguera Umbilical en el banco Suroeste (NBL).', 'Collect Lunar Suit Hose at SW NBL Bench.');
      }
      if (!sim.a13MailboxParts.tape) {
        if (hasInv('DA_DuctTapeKit')) {
          return makeStep(mb.x, mb.y, 'Apollo 13 (3/4) · Cinta en Banco', 'Apollo 13 (3/4) · Place Duct Tape', 'Lleva la Cinta Duct Tape al Banco "Mailbox" en Lab Este.', 'Bring Duct Tape to East Lab "Mailbox" Bench.');
        }
        const tapeItem = sim.worldItems.find((w) => w.itemKey === 'DA_DuctTapeKit');
        return makeStep(tapeItem?.x ?? 8.65, tapeItem?.y ?? 5.10, 'Apollo 13 (3/4) · Recoger Duct Tape', 'Apollo 13 (3/4) · Grab Duct Tape', 'Recoge la Cinta Gris Duct Tape en el Núcleo Central.', 'Pick up Duct Tape Roll at Central Hub Bench.');
      }
      return makeStep(mb.x, mb.y, 'Apollo 13 (3/4) · Sellar Mailbox', 'Apollo 13 (3/4) · Seal Mailbox', 'Pulsa Banco "Mailbox" en Lab Este para acoplarlo al tambor LM.', 'Interact with East Lab "Mailbox" Bench to seal onto LM canister.');
    }
    if (!sim.objectives.a13ColdPowerup) {
      const a = stPos('a13_aquarius_transfer', 10.00, 12.60);
      return makeStep(
        a.x,
        a.y,
        'Apollo 13 (4/4) · Reencendido en Frío',
        'Apollo 13 (4/4) · Cold CSM Power-Up',
        'Sube al Puente MEDS Norte y ejecuta el reencendido en frío para preparar reentrada.',
        'Return to North MEDS Deck and run Cold CSM Power-Up before Earth entry.'
      );
    }
    const hatch = stPos('hatch_next_mission', 10.0, -7.12);
    return makeStep(
      hatch.x,
      hatch.y,
      'Apollo 13 · Amerizaje Pacífico → STS-120',
      'Apollo 13 · Splashdown → STS-120',
      'Entra en la Cápsula Sur para completar el regreso de Apollo 13 e iniciar STS-120 EVA-4.',
      'Board South Capsule to complete Apollo 13 & deploy STS-120 EVA-4.'
    );
  }

  if (sim.currentMissionId === 'sts120_p6_solar') {
    if (!sim.objectives.stsArrayInspected) {
      const a = stPos('sts120_array_console', 9.50, 12.58);
      return makeStep(
        a.x,
        a.y,
        'STS-120 (1/4) · Diagnóstico Ala P6-4B',
        'STS-120 (1/4) · P6-4B Array Diagnostics',
        'Sube a MEDS Norte para diagnosticar el desgarro de 2.5 ft (Bahías 29–30, 160V DC).',
        'Head to North MEDS Deck to diagnose the 2.5 ft tear (Bays 29–30, 160V DC).'
      );
    }
    if (!sim.objectives.stsCufflinksCrafted) {
      const cb = stPos('sts120_cufflink_bench', 17.35, 3.55);
      return makeStep(
        cb.x,
        cb.y,
        'STS-120 (2/4) · Fabricar 5 Cufflinks',
        'STS-120 (2/4) · Craft 5 Cufflinks',
        'Ve al Banco del Lab Este y fabrica las 5 férulas/bisagras Cufflinks de aluminio.',
        'Go to East Lab Fabrication Bench and craft all 5 aluminum Cufflinks.'
      );
    }
    if (sim.airlockStep < 5 && sim.airlockPressureKpa > 5.0) {
      const al = stPos('quest_airlock_console', 12.68, -2.55);
      return makeStep(
        al.x,
        al.y,
        `STS-120 (3/4) · Despresurizar Esclusa (${sim.airlockPressureKpa.toFixed(1)} kPa)`,
        `STS-120 (3/4) · Depress Quest (${sim.airlockPressureKpa.toFixed(1)} kPa)`,
        'Completa los 5 pasos en la Esclusa Quest (101.3→70.3→39.5→29.6→14→2.1 kPa MPEV).',
        'Cycle all 5 Quest Airlock depress stages (101.3→70.3→39.5→29.6→14→2.1 kPa MPEV).'
      );
    }
    if (!sim.objectives.stsWireSnipped && !hasInv('DA_InsulatedCutter')) {
      const cItem = sim.worldItems.find((w) => w.itemKey === 'DA_InsulatedCutter');
      return makeStep(
        cItem?.x ?? 5.35,
        cItem?.y ?? -6.20,
        'STS-120 (4/4) · Pinza Aislada 160V DC',
        'STS-120 (4/4) · Grab HV Cutter',
        'Recoge la Pinza Aislada HV (160V DC) en el Banco Suroeste (NBL) antes de salir por OBSS.',
        'Collect HV Insulated Cutter (160V DC) from SW Bench before moving onto OBSS.'
      );
    }
    if (!sim.objectives.stsArrayDeployed) {
      const obss = stPos('sts120_obss_repair', 12.35, -3.55);
      return makeStep(
        obss.x,
        obss.y,
        `STS-120 (4/4) · Canadarm2+OBSS (${sim.stsRedeploySteps}/5)`,
        `STS-120 (4/4) · Canadarm2+OBSS (${sim.stsRedeploySteps}/5)`,
        'Corta el alambre enredado con la Pinza HV, instala 5 Cufflinks y despliega por medias bahías [5/5].',
        'Snip snagged wire with HV Cutter, install 5 Cufflinks & redeploy half-bay at a time [5/5].'
      );
    }
    const hatch = stPos('hatch_next_mission', 10.0, -7.12);
    return makeStep(
      hatch.x,
      hatch.y,
      'STS-120 Completa · Regresar a Base',
      'STS-120 Complete · Return Home',
      'Ala P6-4B operativa (240 ft). Aborda la Cápsula Sur o cambia de misión desde el menú [ESC].',
      'P6-4B Solar Wing nominal (240 ft). Board South Capsule or select another mission via [ESC].'
    );
  }

  // act4_storm_rover
  if (!sim.objectives.roverReturned) {
    const rv = stPos('rover_cockpit_station', 10.85, 12.58);
    return makeStep(
      rv.x,
      rv.y,
      'Acto 4 · Acoplar Rover 6,000 kg',
      'Act 4 · Dock 6,000 kg Rover',
      'Sube al Puente Norte (MEDS) y acopla el Rover presurizado de 6,000 kg antes del pico SPE.',
      'Head up to North MEDS Deck and dock the 6,000 kg pressurized Rover ahead of SPE peak.'
    );
  }
  if (!sim.objectives.regolithDeployed) {
    const reg = stPos('regolith_shield_station', 19.68, 2.65);
    return makeStep(
      reg.x,
      reg.y,
      'Acto 4 · Blindaje Regolito 2.0 m',
      'Act 4 · 2.0 m Regolith Shield',
      'Ve al Lab Este y despliega el blindaje de regolito 2.0 m (300 g/cm² · 400 t).',
      'Go to East Lab and deploy the 2.0 m compacted regolith shield (300 g/cm² · 400 t).'
    );
  }
  const end = stPos('mission_ending_station', 10.0, 12.58);
  return makeStep(
    end.x,
    end.y,
    'Acto 4 · Veredicto Final NASA',
    'Act 4 · Final NASA Debrief',
    'Sube al Puente Norte (MEDS) y evalúa tu Veredicto Final de Supervivencia AETHER-4.',
    'Head up to North MEDS Deck to run your Final AETHER-4 Mission Evaluation.'
  );
}
