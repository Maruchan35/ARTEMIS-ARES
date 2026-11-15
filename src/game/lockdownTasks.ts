import {
  Box2DM,
  VERIFIED_ACTORS,
  VERIFIED_GAME_RULES,
  VERIFIED_GUNS,
  VERIFIED_ITEMS,
  VERIFIED_MELEE_TYPES,
  VERIFIED_SECTOR_NAMES,
  VERIFIED_TASK_CDOS,
} from '../data/lockdownVerifiedWorldData';
import { LockdownTaskId } from '../data/lockdownProtocolBlueprintCatalog';
import { resolveCircleVsBoxes, WorldItemEntity } from './lockdownPhysics';

// =============================================================================
// LOCKDOWN PROTOCOL: 8-Task State Machines, Armory/Doors/Cameras, & Bot AI
// Derived strictly from REA Step 4 runtime CDOs & Actor placements.
// =============================================================================

export type StationKind =
  | 'alim_box'
  | 'battery_charger'
  | 'plant'
  | 'centrifuge'
  | 'analyzer'
  | 'analysis_pc'
  | 'delivery_case'
  | 'data_pc'
  | 'machine_pannel'
  | 'bottle_slot'
  | 'pizzushi_table'
  | 'pizzushi_machine'
  | 'rice_machine'
  | 'fish_machine'
  | 'scanner_machine'
  | 'scanner_pc'
  | 'vent'
  | 'filter_cleaner'
  | 'door_unlocker'
  | 'alarm_button'
  | 'rez_charger'
  | 'weapon_case_code'
  | 'weapon_case_unlocker'
  | 'heavy_weapon_case'
  | 'weapon_loader'
  | 'pc_cameras'
  | 'lobby_terminal'
  | 'tuto_button'
  | 'tuto_alim';

export interface StationActorState {
  id: string;
  kind: StationKind;
  deck: 'lobby' | 'station' | 'tuto';
  x: number;
  y: number;
  z: number;
  yawDeg: number;
  sectorName: string;
  activeForTask: boolean;
  done: boolean;
  progress: number; // 0..100
  screwsLeft?: number;
  hasBattery?: boolean;
  hasFuse?: boolean;
  hasCleanFilter?: boolean;
  hasDirtyFilter?: boolean;
  hasBottle?: boolean;
  hasPackage?: boolean;
  hasDrive?: boolean;
  pairCode?: string;
  pairedTargetId?: string;
  caseCode?: string;
  caseUnlocked?: boolean;
  doorIndex?: number;
}

export interface LockedDoorState {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yawDeg: number;
  open: boolean;
  locked: boolean;
  timerRemainingSec: number;
}

export interface HeldItem {
  uid: string;
  itemKey: string;
  charge: number;
  clean: boolean;
  ammo: number;
  dataCode?: string;
}

export interface TaskStateEntry {
  id: LockdownTaskId;
  active: boolean;
  completed: boolean;
  doneCount: number;
  targetCount: number;
  phaseLabelEs: string;
  phaseLabelEn: string;
  mapDots: { x: number; y: number; label: string }[];
}

export interface BotAgent {
  id: string;
  name: string;
  suitColorIdx: number;
  visorFaceIdx: number;
  role: 'employee' | 'dissident';
  x: number;
  y: number;
  z: number;
  yawDeg: number;
  hp: number;
  alive: boolean;
  stunTimer: number;
  carryingKey: string | null;
  pathQueue: string[];
  targetNode: string;
  actionTimer: number;
  attackCooldown: number;
  sabotageCooldown: number;
  stateLabelEs: string;
  stateLabelEn: string;
}

export interface ActiveModalState {
  type: 'lobby_rules' | 'weapon_numpad' | 'scanner_target_dot' | 'pc_cameras' | 'data_pc_info' | 'debug_spawner';
  stationId?: string;
  expectedCode?: string;
  cameraIdx?: number;
  infoTextEs?: string;
  infoTextEn?: string;
}

export interface MatchSimulationState {
  phase: 'lobby' | 'playing' | 'ended';
  winner: 'employees' | 'dissidents' | null;
  endReasonEs: string;
  endReasonEn: string;
  playerRole: 'employee' | 'dissident';
  timeLeftSec: number;
  alarmActive: boolean;
  lightsSabotaged: boolean;
  lightsRestoreTimer: number;
  stations: StationActorState[];
  doors: LockedDoorState[];
  tasks: Record<LockdownTaskId, TaskStateEntry>;
  worldItems: WorldItemEntity[];
  bots: BotAgent[];
  activeCameraIdx: number;
  armoryMasterCode: string;
  scannerBodyScanned: boolean;
  scannerSamplesCalibrated: number;
  plantContainerClean: boolean;
  plantSampleCentrifuged: boolean;
  plantSampleAnalyzed: boolean;
}

export type GameRulesConfig = Record<string, number>;

export function createDefaultGameRules(preset: 'default' | 'easy' = 'default'): GameRulesConfig {
  const cfg: GameRulesConfig = {};
  for (const r of VERIFIED_GAME_RULES) {
    cfg[r.key] = preset === 'easy' ? r.easy : r.default;
  }
  return cfg;
}

export function isGunKey(itemKey: string): itemKey is keyof typeof VERIFIED_GUNS {
  return itemKey in VERIFIED_GUNS;
}

export function getItemDisplayName(itemKey: string, lang: 'es' | 'en'): string {
  const esMap: Record<string, string> = {
    DA_Battery: 'Batería FSP',
    DA_Fuse: 'Fusible Alta Carga',
    DA_GazBottle: 'Tanque COPV O₂/N₂',
    DA_VentFilter: 'Filtro CDRA/LiOH',
    DA_ScrewDriver: 'Destornillador EVA',
    DA_Container: 'Contenedor Muestra',
    DA_Sample: 'Muestra Botánica',
    DA_Rice: 'Ración Base BVAD',
    DA_Fish: 'Suplemento Proteico',
    DA_Pizzushi: 'Pizzushi Hidratado',
    DA_HardDrive: 'Disco Telemetría',
    DA_Package: 'Carga Blindaje',
    DA_Medication_A: 'Kit Médico SOMS',
    DA_Medication_B1: 'Estimulante Adren.',
    DA_AccessCard: 'Tarjeta Acceso',
    DA_Rez: 'Desfibrilador REZ',
    DA_C4: 'Carga C4',
    DA_Detonator: 'Detonador',
    DA_Knife: 'Cuchillo',
    DA_Cookie: 'Galleta Espacial',
    DA_Pistol: 'Pistola Táctica',
    DA_Revolver: 'Revólver .357',
    DA_Shorty: 'Escopeta Shorty',
    DA_Rifle: 'Rifle de Asalto',
    DA_SMG: 'Subfusil SMG',
    DA_Shotgun: 'Escopeta Pesada',
  };
  const enMap: Record<string, string> = {
    DA_Battery: 'Battery',
    DA_Fuse: 'Fuse',
    DA_GazBottle: 'Gaz Pressure Bottle',
    DA_VentFilter: 'Vent Filter',
    DA_ScrewDriver: 'Screwdriver',
    DA_Container: 'Sample Container',
    DA_Sample: 'Botanical Sample',
    DA_Rice: 'Rice Bag',
    DA_Fish: 'Salmon Fillet',
    DA_Pizzushi: 'Pizzushi Ration',
    DA_HardDrive: 'Hard Drive',
    DA_Package: 'Cargo Package',
    DA_Medication_A: 'Medication SOMS',
    DA_Medication_B1: 'Stamina Booster',
    DA_AccessCard: 'Access Card',
    DA_Rez: 'Defibrillator REZ',
    DA_C4: 'C4 Explosive',
    DA_Detonator: 'Detonator',
    DA_Knife: 'Combat Knife',
    DA_Cookie: 'Space Cookie',
    DA_Pistol: 'Pistol',
    DA_Revolver: 'Revolver',
    DA_Shorty: 'Shorty',
    DA_Rifle: 'Assault Rifle',
    DA_SMG: 'SMG',
    DA_Shotgun: 'Heavy Shotgun',
  };
  const dict = lang === 'es' ? esMap : enMap;
  return dict[itemKey] ?? itemKey.replace(/^DA_/, '').replace(/_/g, ' ');
}

export function canItemStoreInBag(itemKey: string): boolean {
  if (isGunKey(itemKey)) {
    return VERIFIED_GUNS[itemKey].canInventory;
  }
  const meta = VERIFIED_ITEMS[itemKey as keyof typeof VERIFIED_ITEMS];
  if (meta) return meta.canInventory;
  return true;
}

export function getItemSlowTier(itemKey: string | null): 0 | 1 | 2 | 3 {
  if (!itemKey) return 0;
  if (!canItemStoreInBag(itemKey)) {
    if (itemKey === 'DA_Package' || itemKey === 'DA_Pizzushi') return 2;
    return 1;
  }
  return 0;
}

export function getItemMaxAmmo(itemKey: string): number {
  if (isGunKey(itemKey)) return VERIFIED_GUNS[itemKey].capacity;
  return 0;
}

export function inferSectorName(x: number, y: number): string {
  // Approximate sector centers matching VERIFIED_SECTOR_NAMES & MapSpawn_C
  if (x >= 93 && y >= 104) return 'Camera';
  if (x >= 77 && y >= 61 && y <= 87) return 'Bureau';
  if (x >= 78 && y <= 57) return 'Botanic';
  if (x >= 59 && x <= 80 && y >= 50 && y <= 88) return 'Resto';
  if (x <= 72 && y <= 61) return 'Hopital';
  if (x <= 56 && y >= 61 && y <= 92) return 'Stockage';
  if (x <= 55 && y >= 92) return 'Machine';
  return 'Center';
}

// =============================================================================
// Verified 37-Node Lower-Deck Navigation Graph (tested collision-free against walls)
// =============================================================================
export const STATION_WAYPOINTS: Record<string, { x: number; y: number; edges: string[] }> = {
  center_spawn: { x: 89.0, y: 91.0, edges: ['center_n', 'center_w', 'center_s', 'camera_door', 'office_n_entry', 'office_n', 'office_s', 'resto', 'corr_south_e', 'armory_e_out'] },
  center_n: { x: 92.0, y: 75.0, edges: ['center_spawn', 'center_w', 'office_n_entry', 'office_n', 'office_s', 'resto'] },
  center_w: { x: 83.0, y: 91.0, edges: ['center_spawn', 'center_n', 'center_s', 'camera_door', 'office_n_entry', 'office_n', 'office_s', 'resto', 'corr_south_e', 'armory_hall_n', 'armory_e_out'] },
  center_s: { x: 89.0, y: 108.0, edges: ['center_spawn', 'center_w', 'camera_door', 'camera_room', 'armory_e_out'] },
  camera_door: { x: 93.5, y: 114.0, edges: ['center_spawn', 'center_w', 'center_s', 'camera_room', 'armory_e', 'armory_e_out'] },
  camera_room: { x: 98.5, y: 109.5, edges: ['center_s', 'camera_door', 'armory_e'] },
  office_n_entry: { x: 98.0, y: 75.0, edges: ['center_spawn', 'center_n', 'center_w', 'office_n', 'office_s', 'resto'] },
  office_n: { x: 105.0, y: 68.0, edges: ['center_spawn', 'center_n', 'center_w', 'office_n_entry', 'office_s'] },
  office_s: { x: 81.5, y: 69.0, edges: ['center_spawn', 'center_n', 'center_w', 'office_n_entry', 'office_n', 'resto'] },
  corr_west_c_e: { x: 96.5, y: 59.0, edges: ['corr_west_c_w', 'botanics_lab', 'corr_west_b'] },
  corr_west_c_w: { x: 81.0, y: 59.0, edges: ['corr_west_c_e', 'west_corr_bot_s', 'corr_west_b', 'corr_west_a', 'west_corr_n'] },
  botanics_lab: { x: 95.5, y: 52.0, edges: ['corr_west_c_e'] },
  west_corr_bot_s: { x: 81.0, y: 41.0, edges: ['corr_west_c_w', 'botanics_green', 'west_corr_n'] },
  botanics_green: { x: 94.0, y: 35.0, edges: ['west_corr_bot_s'] },
  corr_west_b: { x: 72.5, y: 59.0, edges: ['corr_west_c_e', 'corr_west_c_w', 'corr_west_a'] },
  resto: { x: 68.0, y: 75.0, edges: ['center_spawn', 'center_n', 'center_w', 'office_n_entry', 'office_s', 'storage'] },
  corr_west_a: { x: 49.0, y: 59.0, edges: ['corr_west_c_w', 'corr_west_b', 'storage', 'corr_south_n', 'med_corr_w', 'med_back_n'] },
  medical: { x: 55.0, y: 45.0, edges: ['med_back_n', 'med_back', 'med_hall', 'med_east', 'med_corr_s'] },
  med_corridor_e: { x: 72.0, y: 24.0, edges: ['med_corr_s'] },
  storage: { x: 38.0, y: 74.0, edges: ['resto', 'corr_west_a', 'corr_south_n', 'machine_entry', 'machine', 'med_back_n'] },
  corr_south_n: { x: 49.0, y: 89.0, edges: ['corr_west_a', 'storage', 'corr_south_e', 'machine_entry'] },
  corr_south_e: { x: 58.0, y: 91.0, edges: ['center_spawn', 'center_w', 'corr_south_n', 'armory_hall_n', 'armory_door_s'] },
  armory_hall_n: { x: 56.0, y: 98.0, edges: ['center_w', 'corr_south_e', 'armory_door_s', 'armory_door'] },
  armory_door_s: { x: 56.0, y: 103.5, edges: ['corr_south_e', 'armory_hall_n', 'armory_door'] },
  armory_door: { x: 56.0, y: 107.5, edges: ['armory_hall_n', 'armory_door_s', 'armory'] },
  armory_e: { x: 81.0, y: 115.0, edges: ['camera_door', 'camera_room', 'armory_e_out'] },
  armory_e_out: { x: 87.5, y: 115.0, edges: ['center_spawn', 'center_w', 'center_s', 'camera_door', 'armory_e'] },
  machine_entry: { x: 43.0, y: 96.0, edges: ['storage', 'corr_south_n', 'machine'] },
  machine: { x: 45.0, y: 105.0, edges: ['storage', 'machine_entry'] },
  armory: { x: 68.0, y: 113.0, edges: ['armory_door'] },
  med_corr_w: { x: 38.0, y: 59.0, edges: ['corr_west_a', 'med_back_n'] },
  med_back_n: { x: 27.0, y: 58.0, edges: ['corr_west_a', 'medical', 'storage', 'med_corr_w', 'med_back', 'med_hall'] },
  med_back: { x: 27.0, y: 44.0, edges: ['medical', 'med_back_n', 'med_hall'] },
  med_hall: { x: 45.0, y: 45.0, edges: ['medical', 'med_back_n', 'med_back', 'med_east', 'med_corr_s'] },
  med_east: { x: 64.5, y: 48.0, edges: ['medical', 'med_hall'] },
  med_corr_s: { x: 64.5, y: 29.0, edges: ['medical', 'med_corridor_e', 'med_hall', 'west_corr_n'] },
  west_corr_n: { x: 81.0, y: 29.0, edges: ['corr_west_c_w', 'west_corr_bot_s', 'med_corr_s'] },
};

function nearestWaypoint(x: number, y: number): string {
  let best = 'center_spawn';
  let bestD2 = Infinity;
  for (const [k, wp] of Object.entries(STATION_WAYPOINTS)) {
    const d2 = (wp.x - x) ** 2 + (wp.y - y) ** 2;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = k;
    }
  }
  return best;
}

function findWaypointPath(fromX: number, fromY: number, toX: number, toY: number): string[] {
  const start = nearestWaypoint(fromX, fromY);
  const goal = nearestWaypoint(toX, toY);
  if (start === goal) return [goal];
  const prev: Record<string, string | null> = { [start]: null };
  const q: string[] = [start];
  while (q.length > 0) {
    const u = q.shift()!;
    if (u === goal) break;
    for (const v of STATION_WAYPOINTS[u]?.edges ?? []) {
      if (!(v in prev)) {
        prev[v] = u;
        q.push(v);
      }
    }
  }
  const path: string[] = [];
  let cur: string | null = goal;
  while (cur) {
    path.push(cur);
    cur = prev[cur] ?? null;
  }
  return path.reverse();
}

export function buildDoorBlockers(doors: LockedDoorState[]): Box2DM[] {
  const blockers: Box2DM[] = [];
  for (const d of doors) {
    if (d.open) continue;
    const isEW = Math.abs(Math.sin((d.yawDeg * Math.PI) / 180)) > 0.5;
    const hw = isEW ? 1.05 : 0.25;
    const hh = isEW ? 0.25 : 1.05;
    blockers.push([d.x - hw, d.y - hh, d.z, d.x + hw, d.y + hh, d.z + 2.8, d.name]);
  }
  return blockers;
}

export function createMatchState(
  rules: GameRulesConfig,
  phase: 'lobby' | 'playing' = 'lobby',
  playerRoleOverride?: 'employee' | 'dissident'
): MatchSimulationState {
  const stations: StationActorState[] = [];
  const pushActors = (
    cls: string,
    kind: StationKind,
    deckOverride?: 'lobby' | 'station' | 'tuto',
    limit?: number
  ) => {
    const list = VERIFIED_ACTORS[cls] ?? [];
    for (let i = 0; i < (limit ? Math.min(limit, list.length) : list.length); i++) {
      const a = list[i];
      stations.push({
        id: `${kind}_${a.n}`,
        kind,
        deck: deckOverride ?? (a.p[2] >= 4.0 && a.p[1] < 165 ? 'lobby' : a.p[1] >= 165 ? 'tuto' : 'station'),
        x: a.p[0],
        y: a.p[1],
        z: a.p[2],
        yawDeg: a.yaw,
        sectorName: a.sector !== undefined ? VERIFIED_SECTOR_NAMES[a.sector] ?? 'Center' : inferSectorName(a.p[0], a.p[1]),
        activeForTask: false,
        done: false,
        progress: 0,
      });
    }
  };

  // Lobby GameRules Terminal right next to PlayerSpawnTest_C_0 [109.25, 111.25, 5.0]
  stations.push({
    id: 'lobby_terminal_main',
    kind: 'lobby_terminal',
    deck: 'lobby',
    x: 109.25,
    y: 114.2,
    z: 5.0,
    yawDeg: -90,
    sectorName: 'Lobby',
    activeForTask: true,
    done: false,
    progress: 0,
  });

  pushActors('AlimBox_C', 'alim_box', 'station');
  pushActors('BatteryCharger_C', 'battery_charger', 'station');
  pushActors('Plant_C', 'plant', 'station');
  pushActors('Centrifuge_C', 'centrifuge', 'station');
  pushActors('Analyzer_C', 'analyzer', 'station');
  pushActors('Analysis_PC_C', 'analysis_pc', 'station');
  pushActors('DeliveryCase_C', 'delivery_case', 'station');
  pushActors('Data_PC_C', 'data_pc', 'station');
  pushActors('MachinePannel_C', 'machine_pannel', 'station');
  pushActors('BottleSlot_C', 'bottle_slot', 'station');
  pushActors('Pizzushi_Table_C', 'pizzushi_table', 'station');
  pushActors('Pizzushi_Machine_C', 'pizzushi_machine', 'station');
  pushActors('Rice_Machine_C', 'rice_machine', 'station');
  pushActors('Fish_Machine_C', 'fish_machine', 'station');
  pushActors('Scanner_Machine_C', 'scanner_machine', 'station');
  pushActors('Scanner_PC_C', 'scanner_pc', 'station');
  pushActors('Vent_C', 'vent', 'station');
  pushActors('FilterCleaner_C', 'filter_cleaner', 'station');
  pushActors('Door_Unlocker_C', 'door_unlocker', 'station');
  pushActors('AlarmButton_C', 'alarm_button', 'station');
  pushActors('RezCharger_C', 'rez_charger', 'station');
  pushActors('WeaponCaseCode_C', 'weapon_case_code', 'station');
  pushActors('WeaponCase_Unlocker_C', 'weapon_case_unlocker', 'station');
  pushActors('HeavyWeaponCase_C', 'heavy_weapon_case', 'station');
  pushActors('WeaponLoader_C', 'weapon_loader', 'station');
  pushActors('PC_Cameras_C', 'pc_cameras', 'station');
  pushActors('Tuto_Button_C', 'tuto_button', 'tuto', 12);
  pushActors('Tuto_AlimBox_C', 'tuto_alim', 'tuto');

  // Locked Doors
  const doors: LockedDoorState[] = (VERIFIED_ACTORS['Locked_Door_C'] ?? []).map((a, idx) => ({
    id: `door_${idx}`,
    name: a.n,
    x: a.p[0],
    y: a.p[1],
    z: a.p[2],
    yawDeg: a.yaw,
    open: a.p[2] >= 4.0 ? false : (rules['CardSpawn'] ?? 1) <= 0,
    locked: (rules['CardSpawn'] ?? 1) > 0,
    timerRemainingSec: 0,
  }));

  // Armory master code + per-case codes
  const armoryMasterCode = '4827';
  const caseCodes = ['1942', '3074', '5821', '7390', '8461', '2619', '6503'];
  stations
    .filter((s) => s.kind === 'weapon_case_code')
    .forEach((s, idx) => {
      s.caseCode = caseCodes[idx % caseCodes.length];
      s.caseUnlocked = false;
    });
  stations
    .filter((s) => s.kind === 'heavy_weapon_case')
    .forEach((s) => {
      s.caseCode = armoryMasterCode;
      s.caseUnlocked = false;
    });

  // Activate tasks according to DT_GameRules counts & VERIFIED_TASK_CDOS defaults
  const desiredTaskCount = Math.max(1, Math.min(8, rules['TaskCount'] ?? 6));
  const candidates: { id: LockdownTaskId; ruleKey: string; defaultTarget: number }[] = [
    { id: 'task_alim', ruleKey: 'PowerCount', defaultTarget: VERIFIED_TASK_CDOS.Task_Alim_C['Alims Count'] || 2 },
    { id: 'task_pressure', ruleKey: 'PressureCount', defaultTarget: VERIFIED_TASK_CDOS.Task_Machine_C.Placed || 2 },
    { id: 'task_vents', ruleKey: 'VentCount', defaultTarget: VERIFIED_TASK_CDOS.Task_Vents_C['Min Vents'] || 3 },
    { id: 'task_plants', ruleKey: 'AnalysisCount', defaultTarget: 1 },
    { id: 'task_pizzushi', ruleKey: 'PizzushiCount', defaultTarget: VERIFIED_TASK_CDOS.Task_Pizzushi_C.Count || 2 },
    { id: 'task_scanner', ruleKey: 'ScannerCount', defaultTarget: 1 },
    { id: 'task_datas', ruleKey: 'ComputerCount', defaultTarget: 2 },
    { id: 'task_delivery', ruleKey: 'DeliveryCount', defaultTarget: 2 },
  ];

  const tasks = {} as Record<LockdownTaskId, TaskStateEntry>;
  let activeAssigned = 0;

  for (const c of candidates) {
    const ruleVal = rules[c.ruleKey] ?? 1;
    const isActive = ruleVal > 0 && activeAssigned < desiredTaskCount;
    if (isActive) activeAssigned++;

    let target = c.defaultTarget;
    const dots: { x: number; y: number; label: string }[] = [];

    if (c.id === 'task_alim') {
      const boxes = stations.filter((s) => s.kind === 'alim_box').slice(0, Math.min(3, Math.max(1, c.defaultTarget)));
      target = boxes.length;
      boxes.forEach((b, i) => {
        b.activeForTask = isActive;
        b.hasBattery = false;
        b.hasFuse = false;
        dots.push({ x: b.x, y: b.y, label: `AlimBox #${i + 1} (${b.sectorName})` });
      });
    } else if (c.id === 'task_pressure') {
      const slots = stations.filter((s) => s.kind === 'bottle_slot').slice(0, 2);
      const panels = stations.filter((s) => s.kind === 'machine_pannel');
      target = 2; // Place 2 bottles + stabilize pressure at MachinePannel
      slots.forEach((s, i) => {
        s.activeForTask = isActive;
        dots.push({ x: s.x, y: s.y, label: `BottleSlot #${i + 1}` });
      });
      panels.forEach((p) => {
        p.activeForTask = isActive;
        dots.push({ x: p.x, y: p.y, label: 'MachinePannel' });
      });
    } else if (c.id === 'task_vents') {
      const vs = stations.filter((s) => s.kind === 'vent').filter((_, i) => i % 5 === 0).slice(0, 3);
      target = vs.length;
      vs.forEach((v, i) => {
        v.activeForTask = isActive;
        v.screwsLeft = VERIFIED_TASK_CDOS.Task_Vents_C['ScrewDriver Count']; // 4
        v.hasDirtyFilter = true;
        v.hasCleanFilter = false;
        dots.push({ x: v.x, y: v.y, label: `Vent #${i + 1} (${v.sectorName})` });
      });
      stations.filter((s) => s.kind === 'filter_cleaner').forEach((fc) => {
        fc.activeForTask = isActive;
        dots.push({ x: fc.x, y: fc.y, label: 'FilterCleaner' });
      });
    } else if (c.id === 'task_plants') {
      target = 1;
      stations.filter((s) => s.kind === 'plant').filter((_, i) => i % 10 === 0).slice(0, 4).forEach((p) => {
        p.activeForTask = isActive;
      });
      stations
        .filter((s) => s.kind === 'centrifuge' || s.kind === 'analyzer' || s.kind === 'analysis_pc')
        .forEach((s) => {
          s.activeForTask = isActive;
          dots.push({ x: s.x, y: s.y, label: s.kind.replace('_', ' ').toUpperCase() });
        });
    } else if (c.id === 'task_pizzushi') {
      const tables = stations.filter((s) => s.kind === 'pizzushi_table').slice(0, 2);
      target = tables.length;
      stations
        .filter((s) => s.kind === 'rice_machine' || s.kind === 'fish_machine' || s.kind === 'pizzushi_machine')
        .forEach((m) => (m.activeForTask = isActive));
      tables.forEach((t, i) => {
        t.activeForTask = isActive;
        dots.push({ x: t.x, y: t.y, label: `Pizzushi Table #${i + 1}` });
      });
    } else if (c.id === 'task_scanner') {
      target = 1;
      stations
        .filter((s) => s.kind === 'scanner_machine' || s.kind === 'scanner_pc')
        .forEach((s) => {
          s.activeForTask = isActive;
          dots.push({ x: s.x, y: s.y, label: s.kind === 'scanner_machine' ? 'Body Scanner' : 'Scanner PC' });
        });
    } else if (c.id === 'task_datas') {
      const pcs = stations.filter((s) => s.kind === 'data_pc');
      target = 2;
      if (pcs.length >= 4) {
        pcs[0].activeForTask = isActive;
        pcs[0].pairCode = '7104';
        pcs[0].pairedTargetId = pcs[1].id;
        pcs[1].activeForTask = isActive;
        pcs[1].pairCode = '7104';
        pcs[2].activeForTask = isActive;
        pcs[2].pairCode = '2958';
        pcs[2].pairedTargetId = pcs[3].id;
        pcs[3].activeForTask = isActive;
        pcs[3].pairCode = '2958';
        [pcs[0], pcs[1], pcs[2], pcs[3]].forEach((pc, idx) =>
          dots.push({ x: pc.x, y: pc.y, label: `DataPC ${idx % 2 === 0 ? 'SRC' : 'DST'} (${pc.sectorName})` })
        );
      }
    } else if (c.id === 'task_delivery') {
      const cases = stations.filter((s) => s.kind === 'delivery_case').filter((_, i) => i % 6 === 0).slice(0, 2);
      target = cases.length;
      cases.forEach((dc, i) => {
        dc.activeForTask = isActive;
        dots.push({ x: dc.x, y: dc.y, label: `DeliveryCase #${i + 1} (${dc.sectorName})` });
      });
    }

    tasks[c.id] = {
      id: c.id,
      active: isActive,
      completed: false,
      doneCount: 0,
      targetCount: target,
      phaseLabelEs: isActive ? 'En progreso' : 'Inactiva por regla',
      phaseLabelEn: isActive ? 'In progress' : 'Disabled by rule',
      mapDots: dots,
    };
  }

  // Spawn real floor items from verified Item_Spawner_C + essential task tools near Storage / Center / Lab / Machine / Medical
  const worldItems: WorldItemEntity[] = [];
  const spawnPreset: { itemKey: string; cat: WorldItemEntity['category']; x: number; y: number; z: number }[] = [
    // Essential tools right around Center & Storage & Sectors so player can finish all 8 tasks cleanly!
    { itemKey: 'DA_ScrewDriver', cat: 'utility', x: 86.5, y: 89.0, z: 0.05 },
    { itemKey: 'DA_ScrewDriver', cat: 'utility', x: 39.0, y: 72.5, z: 0.05 },
    { itemKey: 'DA_AccessCard', cat: 'utility', x: 88.2, y: 93.2, z: 0.05 },
    { itemKey: 'DA_Battery', cat: 'task', x: 48.0, y: 102.0, z: 0.05 },
    { itemKey: 'DA_Battery', cat: 'task', x: 70.0, y: 52.0, z: 0.05 },
    { itemKey: 'DA_Fuse', cat: 'task', x: 40.5, y: 74.0, z: 0.05 },
    { itemKey: 'DA_Fuse', cat: 'task', x: 85.0, y: 92.0, z: 0.05 },
    { itemKey: 'DA_Fuse', cat: 'task', x: 96.5, y: 54.0, z: 0.05 },
    { itemKey: 'DA_GazBottle', cat: 'task', x: 36.5, y: 76.0, z: 0.05 },
    { itemKey: 'DA_GazBottle', cat: 'task', x: 42.0, y: 101.0, z: 0.05 },
    { itemKey: 'DA_Container', cat: 'task', x: 92.0, y: 51.5, z: 0.05 },
    { itemKey: 'DA_Container', cat: 'task', x: 89.5, y: 40.0, z: 0.05 },
    { itemKey: 'DA_Package', cat: 'task', x: 37.5, y: 71.0, z: 0.05 },
    { itemKey: 'DA_Package', cat: 'task', x: 39.5, y: 76.5, z: 0.05 },
    { itemKey: 'DA_Medication_A', cat: 'utility', x: 56.0, y: 45.0, z: 0.05 },
    { itemKey: 'DA_Medication_B1', cat: 'utility', x: 53.0, y: 46.5, z: 0.05 },
    { itemKey: 'DA_Rez', cat: 'utility', x: 58.0, y: 44.0, z: 0.05 },
    { itemKey: 'DA_Pistol', cat: 'gun', x: 76.0, y: 113.5, z: 0.05 },
    { itemKey: 'DA_Knife', cat: 'melee', x: 84.0, y: 95.0, z: 0.05 },
    { itemKey: 'DA_Cookie', cat: 'utility', x: 67.5, y: 73.0, z: 0.05 },
    { itemKey: 'DA_HardDrive', cat: 'task', x: 82.0, y: 69.0, z: 0.05 },
  ];

  // Add sampled spawners from VERIFIED_ACTORS['Item_Spawner_C'] for authentic clutter & spare items
  const spawnerList = VERIFIED_ACTORS['Item_Spawner_C'] ?? [];
  const extraCycle = ['DA_Battery', 'DA_Fuse', 'DA_ScrewDriver', 'DA_Container', 'DA_Medication_A', 'DA_GazBottle', 'DA_Package', 'DA_Cookie'];
  for (let i = 0; i < Math.min(24, spawnerList.length); i++) {
    const sp = spawnerList[i * 12 % spawnerList.length];
    if (sp.p[2] > 3.0) continue;
    const ik = extraCycle[i % extraCycle.length];
    spawnPreset.push({ itemKey: ik, cat: 'task', x: sp.p[0], y: sp.p[1], z: 0.05 });
  }

  spawnPreset.forEach((sp, idx) => {
    worldItems.push({
      uid: `item_${idx}`,
      itemKey: sp.itemKey,
      category: sp.cat,
      x: sp.x,
      y: sp.y,
      z: sp.z,
      vx: 0,
      vy: 0,
      vz: 0,
      yawDeg: (idx * 47) % 360,
      thrownByPlayer: false,
      charge: sp.itemKey === 'DA_Battery' ? 15 : 100,
      clean: sp.itemKey !== 'DA_VentFilter',
      ammo: getItemMaxAmmo(sp.itemKey),
    });
  });

  // 5 Crew & Dissident AI Bots
  const dissidentTargetCount = Math.max(0, Math.min(2, rules['DissidentCount'] ?? 1));
  const playerRole: 'employee' | 'dissident' = playerRoleOverride ?? 'employee';
  const botDissidentCount = playerRole === 'dissident' ? Math.max(0, dissidentTargetCount - 1) : dissidentTargetCount;
  const botStartNodes = ['center_n', 'resto', 'office_s', 'storage', 'med_hall'];
  const botNames = ['AST-01 NOVA', 'AST-02 ORION', 'AST-03 LYRA', 'AST-04 VEGA', 'AST-05 KESTREL'];
  const bots: BotAgent[] = botNames.map((name, idx) => {
    const wp = STATION_WAYPOINTS[botStartNodes[idx % botStartNodes.length]];
    const isDiss = idx < botDissidentCount;
    return {
      id: `bot_${idx}`,
      name,
      suitColorIdx: (idx + 1) % 8,
      visorFaceIdx: (idx + 2) % 8,
      role: isDiss ? 'dissident' : 'employee',
      x: wp.x,
      y: wp.y,
      z: 0,
      yawDeg: (idx * 72) % 360,
      hp: 100,
      alive: true,
      stunTimer: 0,
      carryingKey: null,
      pathQueue: [],
      targetNode: botStartNodes[idx % botStartNodes.length],
      actionTimer: 1.5 + idx * 0.6,
      attackCooldown: 0,
      sabotageCooldown: 18 + idx * 5,
      stateLabelEs: 'Patrullando cubierta',
      stateLabelEn: 'Patrolling deck',
    };
  });

  const timerMinutes = Math.max(1, rules['SessionTimer'] ?? 10);

  return {
    phase,
    winner: null,
    endReasonEs: '',
    endReasonEn: '',
    playerRole,
    timeLeftSec: timerMinutes * 60,
    alarmActive: false,
    lightsSabotaged: false,
    lightsRestoreTimer: 0,
    stations,
    doors,
    tasks,
    worldItems,
    bots,
    activeCameraIdx: 0,
    armoryMasterCode,
    scannerBodyScanned: false,
    scannerSamplesCalibrated: 0,
    plantContainerClean: true,
    plantSampleCentrifuged: false,
    plantSampleAnalyzed: false,
  };
}

export interface InteractionResult {
  handled: boolean;
  feedbackEs: string;
  feedbackEn: string;
  newHandItem?: HeldItem | null;
  spawnFloorItem?: { itemKey: string; charge?: number; clean?: boolean; dataCode?: string };
  openModal?: ActiveModalState;
  sound?: 'click' | 'success' | 'alarm' | 'wrench';
  openDoorIndex?: number;
}

export function interactWithStationActor(
  sim: MatchSimulationState,
  station: StationActorState,
  handItem: HeldItem | null,
  playerPos: [number, number, number]
): InteractionResult {
  const mkItem = (itemKey: string, overrides?: Partial<HeldItem>): HeldItem => ({
    uid: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemKey,
    charge: 100,
    clean: true,
    ammo: getItemMaxAmmo(itemKey),
    ...overrides,
  });

  switch (station.kind) {
    case 'lobby_terminal':
      return {
        handled: true,
        feedbackEs: 'Abriendo Terminal DT_GameRules de la estación...',
        feedbackEn: 'Opening Station DT_GameRules Terminal...',
        openModal: { type: 'lobby_rules', stationId: station.id },
        sound: 'click',
      };

    case 'battery_charger': {
      if (handItem?.itemKey === 'DA_Battery') {
        if (handItem.charge >= 100) {
          return { handled: true, feedbackEs: 'Batería ya al 100% — insértala en AlimBox.', feedbackEn: 'Battery already at 100% — insert into AlimBox.', sound: 'click' };
        }
        return {
          handled: true,
          feedbackEs: 'Batería FSP recargada al 100%.',
          feedbackEn: 'FSP Battery charged to 100%.',
          newHandItem: { ...handItem, charge: 100 },
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Coloca una Batería (DA_Battery) en el cargador.',
        feedbackEn: 'Hold a Battery (DA_Battery) to charge it here.',
        sound: 'click',
      };
    }

    case 'alim_box': {
      if (station.done) {
        return { handled: true, feedbackEs: 'AlimBox ya energizado al 100%.', feedbackEn: 'AlimBox already online.', sound: 'click' };
      }
      if (!station.hasBattery && handItem?.itemKey === 'DA_Battery' && handItem.charge >= 80) {
        station.hasBattery = true;
        return {
          handled: true,
          feedbackEs: 'Batería cargada insertada. Ahora inserta un Fusible (DA_Fuse).',
          feedbackEn: 'Charged Battery inserted. Now insert a Fuse (DA_Fuse).',
          newHandItem: null,
          sound: 'wrench',
        };
      }
      if (station.hasBattery && !station.hasFuse && handItem?.itemKey === 'DA_Fuse') {
        station.hasFuse = true;
        station.done = true;
        station.progress = 100;
        const t = sim.tasks.task_alim;
        if (t.active) {
          t.doneCount = Math.min(t.targetCount, t.doneCount + 1);
          if (t.doneCount >= t.targetCount) {
            t.completed = true;
            t.phaseLabelEs = 'Energía restaurada';
            t.phaseLabelEn = 'Power restored';
          }
        }
        return {
          handled: true,
          feedbackEs: `AlimBox energizado (${t.doneCount}/${t.targetCount}).`,
          feedbackEn: `AlimBox online (${t.doneCount}/${t.targetCount}).`,
          newHandItem: null,
          sound: 'success',
        };
      }
      // Emergency recharge/backup restore if lights were sabotaged
      if (sim.lightsSabotaged && !handItem) {
        sim.lightsSabotaged = false;
        sim.lightsRestoreTimer = 0;
        return { handled: true, feedbackEs: 'Iluminación del hábitat restaurada.', feedbackEn: 'Habitat lighting restored.', sound: 'success' };
      }
      return {
        handled: true,
        feedbackEs: station.hasBattery
          ? 'Necesita DA_Fuse en la mano para activar AlimBox.'
          : 'Necesita DA_Battery al 100% en AlimBox.',
        feedbackEn: station.hasBattery
          ? 'Hold DA_Fuse to complete AlimBox.'
          : 'Insert charged DA_Battery into AlimBox first.',
        sound: 'click',
      };
    }

    case 'bottle_slot': {
      if (station.hasBottle) {
        return { handled: true, feedbackEs: 'Tanque COPV acoplado.', feedbackEn: 'COPV bottle locked in slot.', sound: 'click' };
      }
      if (handItem?.itemKey === 'DA_GazBottle') {
        station.hasBottle = true;
        station.done = true;
        const placedCount = sim.stations.filter((s) => s.kind === 'bottle_slot' && s.hasBottle).length;
        return {
          handled: true,
          feedbackEs: `Tanque COPV conectado (${placedCount}/2). Pulsa MachinePannel.`,
          feedbackEn: `COPV GazBottle docked (${placedCount}/2). Press MachinePannel.`,
          newHandItem: null,
          sound: 'wrench',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Trae un tanque DA_GazBottle y colócalo en este BottleSlot.',
        feedbackEn: 'Bring a DA_GazBottle and insert it into this BottleSlot.',
        sound: 'click',
      };
    }

    case 'machine_pannel': {
      const placed = sim.stations.filter((s) => s.kind === 'bottle_slot' && s.hasBottle).length;
      const t = sim.tasks.task_pressure;
      if (t.completed) {
        return { handled: true, feedbackEs: 'Presión nominal 101.3 kPa estabilizada.', feedbackEn: 'Pressure nominal at 101.3 kPa.', sound: 'click' };
      }
      if (placed >= 1) {
        t.doneCount = t.targetCount;
        t.completed = true;
        t.phaseLabelEs = '101.3 kPa estable';
        t.phaseLabelEn = '101.3 kPa Nominal';
        station.done = true;
        return {
          handled: true,
          feedbackEs: '¡Presión ECLSS estabilizada a 101.3 kPa!',
          feedbackEn: 'ECLSS Pressure stabilized at 101.3 kPa!',
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Conecta primero un tanque DA_GazBottle en BottleSlot.',
        feedbackEn: 'Insert a DA_GazBottle into a BottleSlot first.',
        sound: 'click',
      };
    }

    case 'vent': {
      if (station.done) {
        return { handled: true, feedbackEs: 'Ducto de ventilación limpio.', feedbackEn: 'Vent filter clean & sealed.', sound: 'click' };
      }
      const screws = station.screwsLeft ?? 4;
      if (screws > 0 && handItem?.itemKey === 'DA_ScrewDriver') {
        station.screwsLeft = screws - 1;
        return {
          handled: true,
          feedbackEs: `Perno retirado (${4 - station.screwsLeft}/4).`,
          feedbackEn: `Screw removed (${4 - station.screwsLeft}/4).`,
          sound: 'wrench',
        };
      }
      if (screws === 0 && station.hasDirtyFilter && !handItem) {
        station.hasDirtyFilter = false;
        return {
          handled: true,
          feedbackEs: 'Filtro sucio extraído — límpialo en FilterCleaner.',
          feedbackEn: 'Dirty VentFilter pulled — take to FilterCleaner.',
          newHandItem: mkItem('DA_VentFilter', { clean: false }),
          sound: 'wrench',
        };
      }
      if (screws === 0 && !station.hasDirtyFilter && handItem?.itemKey === 'DA_VentFilter' && handItem.clean) {
        station.hasCleanFilter = true;
        station.done = true;
        const t = sim.tasks.task_vents;
        if (t.active) {
          t.doneCount = Math.min(t.targetCount, t.doneCount + 1);
          if (t.doneCount >= t.targetCount) {
            t.completed = true;
            t.phaseLabelEs = 'Ventilación limpia';
            t.phaseLabelEn = 'CDRA Vents clean';
          }
        }
        return {
          handled: true,
          feedbackEs: `Filtro limpio instalado (${t.doneCount}/${t.targetCount}).`,
          feedbackEn: `Clean filter installed (${t.doneCount}/${t.targetCount}).`,
          newHandItem: null,
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: screws > 0 ? `Usa DA_ScrewDriver (${screws} tornillos restantes).` : 'Extrae filtro sucio con mano vacía o instala limpio.',
        feedbackEn: screws > 0 ? `Use DA_ScrewDriver (${screws} screws left).` : 'Pull dirty filter empty-handed or insert clean filter.',
        sound: 'click',
      };
    }

    case 'filter_cleaner': {
      if (handItem?.itemKey === 'DA_VentFilter') {
        return {
          handled: true,
          feedbackEs: 'Filtro CDRA/LiOH regenerado y limpio al 100%.',
          feedbackEn: 'Vent Filter scrubbed clean (100%).',
          newHandItem: { ...handItem, clean: true, charge: 100 },
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Sostén un VentFilter sucio para limpiarlo aquí.',
        feedbackEn: 'Hold a dirty DA_VentFilter to clean it.',
        sound: 'click',
      };
    }

    case 'plant': {
      if (handItem?.itemKey === 'DA_Container') {
        return {
          handled: true,
          feedbackEs: 'Muestra botánica recolectada — llévala a Centrifuge.',
          feedbackEn: 'Botanical Sample collected — take to Centrifuge.',
          newHandItem: mkItem('DA_Sample'),
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Usa DA_Container vacío en esta planta BLSS.',
        feedbackEn: 'Hold empty DA_Container to harvest plant sample.',
        sound: 'click',
      };
    }

    case 'centrifuge': {
      if (handItem?.itemKey === 'DA_Sample') {
        sim.plantSampleCentrifuged = true;
        return {
          handled: true,
          feedbackEs: 'Muestra centrifugada — ahora colócala en Analyzer.',
          feedbackEn: 'Sample centrifuged — now insert into Analyzer.',
          sound: 'wrench',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Inserta DA_Sample recolectado en la Centrífuga.',
        feedbackEn: 'Hold harvested DA_Sample to spin in Centrifuge.',
        sound: 'click',
      };
    }

    case 'analyzer': {
      if (handItem?.itemKey === 'DA_Sample' && sim.plantSampleCentrifuged) {
        sim.plantSampleAnalyzed = true;
        return {
          handled: true,
          feedbackEs: 'Muestra escaneada en Analyzer — confirma en Analysis_PC.',
          feedbackEn: 'Sample scanned in Analyzer — confirm at Analysis_PC.',
          newHandItem: null,
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: sim.plantSampleCentrifuged ? 'Inserta DA_Sample centrifugado.' : 'Primero centrifuga DA_Sample en Centrifuge.',
        feedbackEn: sim.plantSampleCentrifuged ? 'Insert centrifuged DA_Sample.' : 'Spin DA_Sample in Centrifuge first.',
        sound: 'click',
      };
    }

    case 'analysis_pc': {
      const t = sim.tasks.task_plants;
      if (t.completed) {
        return { handled: true, feedbackEs: 'Análisis BLSS completado.', feedbackEn: 'BLSS Analysis complete.', sound: 'click' };
      }
      if (sim.plantSampleAnalyzed) {
        t.doneCount = t.targetCount;
        t.completed = true;
        t.phaseLabelEs = 'Análisis verificado';
        t.phaseLabelEn = 'Analysis verified';
        station.done = true;
        return {
          handled: true,
          feedbackEs: '¡Análisis botánico BLSS transmitido y completado!',
          feedbackEn: 'BLSS Plant Analysis uploaded & completed!',
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Completa Centrifuge + Analyzer en el Lab antes de confirmar aquí.',
        feedbackEn: 'Complete Centrifuge + Analyzer before confirming here.',
        sound: 'click',
      };
    }

    case 'rice_machine': {
      if (!handItem) {
        return {
          handled: true,
          feedbackEs: 'Ración seca DA_Rice recogida (objeto pesado). Llévala a Pizzushi_Machine.',
          feedbackEn: 'Grabbed DA_Rice bag (heavy carry). Bring to Pizzushi_Machine.',
          newHandItem: mkItem('DA_Rice'),
          sound: 'click',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Vacía la mano (pulsa E o Clic Der.) para cargar DA_Rice.',
        feedbackEn: 'Free your hand (E or RMB) to pick up DA_Rice.',
        sound: 'click',
      };
    }

    case 'fish_machine': {
      if (!handItem) {
        return {
          handled: true,
          feedbackEs: 'Salmón DA_Fish recogido. Llévalo a Pizzushi_Machine.',
          feedbackEn: 'Grabbed DA_Fish fillet. Bring to Pizzushi_Machine.',
          newHandItem: mkItem('DA_Fish'),
          sound: 'click',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Vacía la mano para recoger Salmón.',
        feedbackEn: 'Empty hand required to pick up DA_Fish.',
        sound: 'click',
      };
    }

    case 'pizzushi_machine': {
      if (handItem?.itemKey === 'DA_Rice' || handItem?.itemKey === 'DA_Fish') {
        return {
          handled: true,
          feedbackEs: '¡Pizzushi preparado! Entrégalo en una Pizzushi_Table.',
          feedbackEn: 'Pizzushi prepared! Deliver it to a Pizzushi_Table.',
          newHandItem: mkItem('DA_Pizzushi'),
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Trae DA_Rice o DA_Fish para prensar Pizzushi.',
        feedbackEn: 'Bring DA_Rice or DA_Fish to craft Pizzushi.',
        sound: 'click',
      };
    }

    case 'pizzushi_table': {
      if (station.done) {
        return { handled: true, feedbackEs: 'Mesa servida.', feedbackEn: 'Table already served.', sound: 'click' };
      }
      if (handItem?.itemKey === 'DA_Pizzushi') {
        station.done = true;
        const t = sim.tasks.task_pizzushi;
        if (t.active) {
          t.doneCount = Math.min(t.targetCount, t.doneCount + 1);
          if (t.doneCount >= t.targetCount) {
            t.completed = true;
            t.phaseLabelEs = 'Mesas servidas';
            t.phaseLabelEn = 'Orders delivered';
          }
        }
        return {
          handled: true,
          feedbackEs: `Ración entregada en mesa (${t.doneCount}/${t.targetCount}).`,
          feedbackEn: `Pizzushi delivered to table (${t.doneCount}/${t.targetCount}).`,
          newHandItem: null,
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Sirve una caja DA_Pizzushi en esta mesa.',
        feedbackEn: 'Deliver a DA_Pizzushi box to this table.',
        sound: 'click',
      };
    }

    case 'scanner_machine': {
      sim.scannerBodyScanned = true;
      return {
        handled: true,
        feedbackEs: 'Escaneo biométrico completado — calibra W_Scanner_TargetDot en Scanner_PC.',
        feedbackEn: 'Body biometry scanned — calibrate W_Scanner_TargetDot on Scanner_PC.',
        sound: 'success',
      };
    }

    case 'scanner_pc': {
      if (sim.tasks.task_scanner.completed) {
        return { handled: true, feedbackEs: 'Dosimetría médica calibrada.', feedbackEn: 'Scanner calibration complete.', sound: 'click' };
      }
      if (!sim.scannerBodyScanned && Math.hypot(playerPos[0] - 65.5, playerPos[1] - 52.5) > 5) {
        sim.scannerBodyScanned = true;
      }
      return {
        handled: true,
        feedbackEs: 'Abriendo calibrador de puntos W_Scanner_TargetDot...',
        feedbackEn: 'Opening W_Scanner_TargetDot dosimetry calibrator...',
        openModal: { type: 'scanner_target_dot', stationId: station.id },
        sound: 'click',
      };
    }

    case 'data_pc': {
      const t = sim.tasks.task_datas;
      if (station.pairedTargetId && !station.done && !handItem) {
        station.done = true;
        return {
          handled: true,
          feedbackEs: `Disco extraído de Source PC (Código #${station.pairCode}). Llévalo al Target Data_PC.`,
          feedbackEn: `Pulled HardDrive from Source PC (Code #${station.pairCode}). Deliver to Target Data_PC.`,
          newHandItem: mkItem('DA_HardDrive', { dataCode: station.pairCode }),
          sound: 'wrench',
        };
      }
      if (!station.pairedTargetId && station.pairCode && !station.done && handItem?.itemKey === 'DA_HardDrive') {
        station.done = true;
        if (t.active) {
          t.doneCount = Math.min(t.targetCount, t.doneCount + 1);
          if (t.doneCount >= t.targetCount) {
            t.completed = true;
            t.phaseLabelEs = 'Telemetría sincronizada';
            t.phaseLabelEn = 'Telemetry synced';
          }
        }
        return {
          handled: true,
          feedbackEs: `¡Disco sincronizado en Target Data_PC (${t.doneCount}/${t.targetCount})!`,
          feedbackEn: `HardDrive synced to Target Data_PC (${t.doneCount}/${t.targetCount})!`,
          newHandItem: null,
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: station.pairedTargetId
          ? 'Vacía la mano para extraer el HardDrive origen.'
          : 'Inserta un DA_HardDrive en este terminal de enlace.',
        feedbackEn: station.pairedTargetId
          ? 'Free your hand to pull Source HardDrive.'
          : 'Insert a DA_HardDrive into this Target PC.',
        sound: 'click',
      };
    }

    case 'delivery_case': {
      if (station.done) {
        return { handled: true, feedbackEs: 'DeliveryCase sellado.', feedbackEn: 'DeliveryCase sealed.', sound: 'click' };
      }
      if (handItem?.itemKey === 'DA_Package') {
        station.hasPackage = true;
        station.done = true;
        const t = sim.tasks.task_delivery;
        if (t.active) {
          t.doneCount = Math.min(t.targetCount, t.doneCount + 1);
          if (t.doneCount >= t.targetCount) {
            t.completed = true;
            t.phaseLabelEs = 'Carga entregada';
            t.phaseLabelEn = 'Cargo delivered';
          }
        }
        return {
          handled: true,
          feedbackEs: `Carga sellada en DeliveryCase (${t.doneCount}/${t.targetCount}).`,
          feedbackEn: `Package sealed in DeliveryCase (${t.doneCount}/${t.targetCount}).`,
          newHandItem: null,
          sound: 'success',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Trae un DA_Package desde Storage para sellar este DeliveryCase.',
        feedbackEn: 'Bring a DA_Package from Storage to seal this DeliveryCase.',
        sound: 'click',
      };
    }

    case 'door_unlocker': {
      // Find nearest Locked_Door_C
      let bestDoorIdx = -1;
      let bestD2 = Infinity;
      sim.doors.forEach((d, idx) => {
        const d2 = (d.x - station.x) ** 2 + (d.y - station.y) ** 2;
        if (d2 < bestD2) {
          bestD2 = d2;
          bestDoorIdx = idx;
        }
      });
      if (bestDoorIdx >= 0) {
        const door = sim.doors[bestDoorIdx];
        if (!door.locked || handItem?.itemKey === 'DA_AccessCard') {
          door.locked = false;
          door.open = !door.open;
          return {
            handled: true,
            feedbackEs: `${door.name} ${door.open ? 'ABIERTA' : 'CERRADA'}`,
            feedbackEn: `${door.name} ${door.open ? 'OPENED' : 'CLOSED'}`,
            sound: 'click',
          };
        }
        return {
          handled: true,
          feedbackEs: 'Puerta bloqueada — requiere DA_AccessCard.',
          feedbackEn: 'Locked door — hold DA_AccessCard to unlock.',
          sound: 'alarm',
        };
      }
      return { handled: false, feedbackEs: '', feedbackEn: '' };
    }

    case 'alarm_button': {
      sim.alarmActive = !sim.alarmActive;
      return {
        handled: true,
        feedbackEs: sim.alarmActive ? '¡ALARMA DE EMERGENCIA ACTIVADA!' : 'Alarma silenciada.',
        feedbackEn: sim.alarmActive ? 'EMERGENCY ALARM TRIGGERED!' : 'Alarm reset.',
        sound: 'alarm',
      };
    }

    case 'rez_charger': {
      if (handItem?.itemKey === 'DA_Rez') {
        return {
          handled: true,
          feedbackEs: 'Desfibrilador REZ recargado al 100%.',
          feedbackEn: 'Defibrillator REZ recharged to 100%.',
          newHandItem: { ...handItem, charge: 100 },
          sound: 'success',
        };
      }
      if (!handItem) {
        return {
          handled: true,
          feedbackEs: 'Desfibrilador DA_Rez recogido del cargador.',
          feedbackEn: 'Picked up DA_Rez Defibrillator.',
          newHandItem: mkItem('DA_Rez', { charge: 100 }),
          sound: 'click',
        };
      }
      return {
        handled: true,
        feedbackEs: 'Sostén DA_Rez o vacía tu mano para recoger desfibrilador.',
        feedbackEn: 'Hold DA_Rez to charge, or empty hand to grab.',
        sound: 'click',
      };
    }

    case 'weapon_case_unlocker':
      return {
        handled: true,
        feedbackEs: `Armory Code Terminal: Código maestro ${sim.armoryMasterCode} / Cajas [1942, 3074, 5821]`,
        feedbackEn: `Armory Unlocker: Master Code ${sim.armoryMasterCode} / Side Cases [1942, 3074, 5821]`,
        openModal: {
          type: 'data_pc_info',
          stationId: station.id,
          infoTextEs: `CÓDIGO ARMERÍA PESADA (HeavyWeaponCase): ${sim.armoryMasterCode}\nCAJAS LATERALES (WeaponCaseCode): 1942 · 3074 · 5821 · 7390`,
          infoTextEn: `HEAVY ARMORY PASSCODE: ${sim.armoryMasterCode}\nSIDE WEAPON CASES: 1942 · 3074 · 5821 · 7390`,
        },
        sound: 'click',
      };

    case 'weapon_case_code':
    case 'heavy_weapon_case': {
      if (station.caseUnlocked) {
        if (!handItem) {
          const weaponKey = station.kind === 'heavy_weapon_case' ? 'DA_Rifle' : 'DA_Revolver';
          return {
            handled: true,
            feedbackEs: `${getItemDisplayName(weaponKey, 'es')} equipado desde caja de armas.`,
            feedbackEn: `Equipped ${getItemDisplayName(weaponKey, 'en')} from weapon case.`,
            newHandItem: mkItem(weaponKey),
            sound: 'success',
          };
        }
        return { handled: true, feedbackEs: 'Caja abierta (vacía la mano para recoger arma).', feedbackEn: 'Case unlocked (empty hand to pick up weapon).', sound: 'click' };
      }
      return {
        handled: true,
        feedbackEs: 'Introduce el código de 4 dígitos de la caja...',
        feedbackEn: 'Enter 4-digit weapon case code...',
        openModal: { type: 'weapon_numpad', stationId: station.id, expectedCode: station.caseCode ?? sim.armoryMasterCode },
        sound: 'click',
      };
    }

    case 'weapon_loader': {
      if (handItem && isGunKey(handItem.itemKey)) {
        return {
          handled: true,
          feedbackEs: `Munición recargada al 100% (${getItemMaxAmmo(handItem.itemKey)} balas).`,
          feedbackEn: `Magazine reloaded (${getItemMaxAmmo(handItem.itemKey)} rounds).`,
          newHandItem: { ...handItem, ammo: getItemMaxAmmo(handItem.itemKey) },
          sound: 'wrench',
        };
      }
      return { handled: true, feedbackEs: 'Sostén un arma de fuego para recargarla en WeaponLoader.', feedbackEn: 'Hold a firearm to reload at WeaponLoader.', sound: 'click' };
    }

    case 'pc_cameras':
      return {
        handled: true,
        feedbackEs: 'Conectando a red CCTV de 15 cámaras...',
        feedbackEn: 'Connecting to 15-RoomCamera CCTV network...',
        openModal: { type: 'pc_cameras', stationId: station.id, cameraIdx: sim.activeCameraIdx },
        sound: 'click',
      };

    case 'tuto_button':
    case 'tuto_alim':
      station.done = !station.done;
      return {
        handled: true,
        feedbackEs: `${station.id}: ${station.done ? 'Activado (Tutorial)' : 'Reiniciado'}`,
        feedbackEn: `${station.id}: ${station.done ? 'Triggered (Tutorial)' : 'Reset'}`,
        sound: 'success',
      };
  }
}

/**
 * Step AI bots cleanly along verified corridors + check task completion / win-loss timer.
 */
export function stepMatchSimulation(
  sim: MatchSimulationState,
  playerPos: [number, number, number],
  playerAlive: boolean,
  dtSec: number,
  onPlayerDamage: (hpLoss: number, stunSec: number) => void
): MatchSimulationState {
  if (sim.phase !== 'playing') return sim;
  const dt = Math.min(0.05, dtSec);
  const next = { ...sim };

  next.timeLeftSec = Math.max(0, next.timeLeftSec - dt);
  if (next.lightsSabotaged) {
    next.lightsRestoreTimer = Math.max(0, next.lightsRestoreTimer - dt);
    if (next.lightsRestoreTimer <= 0) {
      next.lightsSabotaged = false;
    }
  }

  // Re-evaluate win/loss conditions
  const activeTaskList = Object.values(next.tasks).filter((t) => t.active);
  const allTasksDone = activeTaskList.length > 0 && activeTaskList.every((t) => t.completed);
  const aliveDissidents = next.bots.filter((b) => b.alive && b.role === 'dissident').length + (next.playerRole === 'dissident' && playerAlive ? 1 : 0);
  const aliveEmployees = next.bots.filter((b) => b.alive && b.role === 'employee').length + (next.playerRole === 'employee' && playerAlive ? 1 : 0);

  if (allTasksDone) {
    next.phase = 'ended';
    next.winner = 'employees';
    next.endReasonEs = '¡Todas las tareas de la estación completadas a tiempo!';
    next.endReasonEn = 'All station engineering tasks completed!';
    return next;
  }
  if (aliveDissidents === 0 && next.bots.some((b) => b.role === 'dissident')) {
    next.phase = 'ended';
    next.winner = 'employees';
    next.endReasonEs = 'Todos los Disidentes neutralizados.';
    next.endReasonEn = 'All Dissidents neutralized.';
    return next;
  }
  if (aliveEmployees === 0 || next.timeLeftSec <= 0) {
    next.phase = 'ended';
    next.winner = 'dissidents';
    next.endReasonEs = next.timeLeftSec <= 0 ? 'Tiempo límite agotado — Sabotaje exitoso.' : 'Toda la tripulación fue eliminada.';
    next.endReasonEn = next.timeLeftSec <= 0 ? 'Session timer expired — Sabotage succeeded.' : 'All Employees eliminated.';
    return next;
  }

  const doorBlockers = buildDoorBlockers(next.doors);

  // Update AI bots
  next.bots = next.bots.map((bot) => {
    if (!bot.alive) return bot;
    const b = { ...bot };
    if (b.stunTimer > 0) {
      b.stunTimer = Math.max(0, b.stunTimer - dt);
      return b;
    }
    if (b.attackCooldown > 0) b.attackCooldown = Math.max(0, b.attackCooldown - dt);
    if (b.sabotageCooldown > 0) b.sabotageCooldown = Math.max(0, b.sabotageCooldown - dt);

    // Move along pathQueue
    if (b.pathQueue.length === 0) {
      b.actionTimer -= dt;
      if (b.actionTimer <= 0) {
        const wpKeys = Object.keys(STATION_WAYPOINTS);
        let dest = wpKeys[Math.floor(Math.random() * wpKeys.length)];

        // Dissident opportunistic sabotage / ambush
        if (b.role === 'dissident' && b.sabotageCooldown <= 0) {
          b.sabotageCooldown = 28;
          if (!next.lightsSabotaged && Math.random() < 0.6) {
            next.lightsSabotaged = true;
            next.lightsRestoreTimer = 25;
            b.stateLabelEs = 'Sabotaje eléctrico en curso';
            b.stateLabelEn = 'Sabotaging grid lights';
          } else {
            next.alarmActive = true;
            b.stateLabelEs = 'Activando falsa alarma';
            b.stateLabelEn = 'Triggering decoy alarm';
          }
        }

        // If employee sees active incomplete task, sometimes walk near it
        if (b.role === 'employee') {
          const incomplete = next.stations.filter((s) => s.activeForTask && !s.done);
          if (incomplete.length > 0 && Math.random() < 0.65) {
            const pick = incomplete[Math.floor(Math.random() * incomplete.length)];
            dest = nearestWaypoint(pick.x, pick.y);
            b.stateLabelEs = `En ruta a ${pick.sectorName}`;
            b.stateLabelEn = `Heading to ${pick.sectorName}`;
          }
        }
        b.pathQueue = findWaypointPath(b.x, b.y, STATION_WAYPOINTS[dest].x, STATION_WAYPOINTS[dest].y);
        b.actionTimer = 2.0 + Math.random() * 2.5;
      }
      return b;
    }

    // Dissident proximity ambush on isolated player (distance < 3.0m)
    if (b.role === 'dissident' && next.playerRole === 'employee' && playerAlive) {
      const distPlayer = Math.hypot(playerPos[0] - b.x, playerPos[1] - b.y);
      const witnesses = next.bots.filter((o) => o.id !== b.id && o.alive && Math.hypot(o.x - b.x, o.y - b.y) < 10.0).length;
      if (distPlayer < 2.2 && witnesses === 0 && b.attackCooldown <= 0) {
        b.attackCooldown = 2.4;
        const dmg = VERIFIED_MELEE_TYPES.DA_Melee_Blunt.heal;
        onPlayerDamage(dmg, Math.abs(VERIFIED_MELEE_TYPES.DA_Melee_Blunt.stun));
        b.stateLabelEs = 'Emboscando tripulante';
        b.stateLabelEn = 'Ambushing crewmate';
      }
    }

    const nextNodeKey = b.pathQueue[0];
    const wp = STATION_WAYPOINTS[nextNodeKey];
    if (!wp) {
      b.pathQueue = [];
      return b;
    }
    const dx = wp.x - b.x;
    const dy = wp.y - b.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.6) {
      b.pathQueue = b.pathQueue.slice(1);
      return b;
    }

    const speed = b.role === 'dissident' ? 4.4 : 3.8;
    const step = Math.min(dist, speed * dt);
    const nx = b.x + (dx / dist) * step;
    const ny = b.y + (dy / dist) * step;
    const [rx, ry] = resolveCircleVsBoxes(nx, ny, 0, 0.26, [], doorBlockers);
    b.x = rx;
    b.y = ry;
    b.yawDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return b;
  });

  return next;
}
