import { NASA_CONSTANTS } from './nasaConstants';

/**
 * REA (Reverse Engineer Anything) Blueprint & Archetype Catalog
 * Extracted from local installation:
 *   D:\SteamLibrary\steamapps\common\LOCKDOWN Protocol
 * Primary shipping binary verified via `inspect_pe_imports`:
 *   LockdownProtocol-Win64-Shipping.exe (PE32+ amd64, 148,534,272 bytes)
 *   SHA-256: 87817dd585341867bee4cf65fc564a15d1eaf1a9f1dc4128b3fb8fd43abf2ea9
 * Adapted 1:1 to NASA Space Apps 2026 real engineering constants (`NASA_CONSTANTS`).
 */

export const REA_LOCKDOWN_BINARY_METADATA = {
  executable: 'LockdownProtocol-Win64-Shipping.exe',
  format: 'PE32+ (x86_64)',
  sizeBytes: 148534272,
  sha256: '87817dd585341867bee4cf65fc564a15d1eaf1a9f1dc4128b3fb8fd43abf2ea9',
  engine: 'Unreal Engine (Win64 · D3D12Core.dll · Vulkan SM5)',
  networking: ['EOSSDK-Win64-Shipping.dll', 'steam_api64.dll', 'msquic.dll', 'WS2_32.dll'],
  spatialAudio: ['SteamAudio (phonon.dll)', 'TrueAudioNext.dll', 'xaudio2_9redist.dll', 'DSOUND.dll'],
  sourceManifests: ['Manifest_NonUFSFiles_Win64.txt', 'Manifest_UFSFiles_Win64.txt'],
} as const;

export interface SuitColorDef {
  id: string;
  nameEs: string;
  nameEn: string;
  primaryHex: string;
  accentHex: string;
  visorTintHex: string;
}

/** Mapped from `LockdownProtocol/Content/Gameplay/E_ColorsRepartition.uasset` */
export const SUIT_COLORS: SuitColorDef[] = [
  { id: 'red', nameEs: 'Rojo Misión', nameEn: 'Mission Red', primaryHex: '#ef4444', accentHex: '#991b1b', visorTintHex: '#0f172a' },
  { id: 'blue', nameEs: 'Azul ASCAN', nameEn: 'ASCAN Blue', primaryHex: '#2563eb', accentHex: '#1e3a8a', visorTintHex: '#0b192c' },
  { id: 'emerald', nameEs: 'Verde BLSS', nameEn: 'BLSS Emerald', primaryHex: '#10b981', accentHex: '#065f46', visorTintHex: '#091f1a' },
  { id: 'amber', nameEs: 'Ámbar Solar', nameEn: 'Solar Amber', primaryHex: '#f59e0b', accentHex: '#92400e', visorTintHex: '#1c1917' },
  { id: 'white', nameEs: 'Blanco EVA', nameEn: 'EVA White', primaryHex: '#e2e8f0', accentHex: '#64748b', visorTintHex: '#0f172a' },
  { id: 'cyan', nameEs: 'Cian Criogénico', nameEn: 'Cryo Cyan', primaryHex: '#06b6d4', accentHex: '#155e75', visorTintHex: '#082f49' },
  { id: 'orange', nameEs: 'Naranja SLS', nameEn: 'SLS Orange', primaryHex: '#f97316', accentHex: '#9a3412', visorTintHex: '#1c1917' },
  { id: 'pink', nameEs: 'Rosa Botánico', nameEn: 'Botanic Pink', primaryHex: '#ec4899', accentHex: '#9d174d', visorTintHex: '#1f1024' },
];

export interface VisorFaceDef {
  id: string;
  uasset: string;
  labelEs: string;
  labelEn: string;
  expression: 'happy' | 'focused' | 'cheeky' | 'surprised' | 'cool' | 'sleepy' | 'determined' | 'starry';
}

/** Mapped from `LockdownProtocol/Content/Character/Astronaut/Face/Face_000..007` + `E_EyeState.uasset` */
export const VISOR_FACES: VisorFaceDef[] = [
  { id: 'face_000', uasset: 'Face_000/DA_Face_000.uasset', labelEs: 'Alegre', labelEn: 'Happy', expression: 'happy' },
  { id: 'face_001', uasset: 'Face_001/DA_Face_001.uasset', labelEs: 'Enfocado', labelEn: 'Focused', expression: 'focused' },
  { id: 'face_002', uasset: 'Face_002/DA_Face_002.uasset', labelEs: 'Travieso', labelEn: 'Cheeky', expression: 'cheeky' },
  { id: 'face_003', uasset: 'Face_003/DA_Face_003.uasset', labelEs: 'Asombrado', labelEn: 'Surprised', expression: 'surprised' },
  { id: 'face_004', uasset: 'Face_004/DA_Face_004.uasset', labelEs: 'Fresco (Gafas)', labelEn: 'Cool', expression: 'cool' },
  { id: 'face_005', uasset: 'Face_005/DA_Face_005.uasset', labelEs: 'Sueño LEO', labelEn: 'Sleepy', expression: 'sleepy' },
  { id: 'face_006', uasset: 'Face_006/DA_Face_006.uasset', labelEs: 'Decidido', labelEn: 'Determined', expression: 'determined' },
  { id: 'face_007', uasset: 'Face_007/DA_Face_007.uasset', labelEs: 'Estelar', labelEn: 'Starry', expression: 'starry' },
];

/**
 * Verified at runtime from `LockdownProtocol-Win64-Shipping.exe` via REA Frida inspection:
 * `Mec_C` (`AsyncTickPawn`, AsyncDelta = 0.0025s), `DA_PlayerStats` (`Data_Player_C`),
 * and `DA_Drop_*` (`Data_ItemThrowType_C`).
 */
export const LOCOMOTION_CONFIG = {
  walkSpeedMs: 6.0, // DA_PlayerStats Default Speed = 600 cm/s
  sprintMultiplier: 800 / 600, // Speed 2 = 800 cm/s (Speed 1=700, Speed 3=1000)
  crouchMultiplier: 400 / 600, // Slow 2 = 400 cm/s (Slow 1=500, Slow 3=200)
  staminaMax: 100, // DA_PlayerStats Max HP / Stamina scale = 100
  staminaDrainPerSec: 20, // DA_PlayerStats Run Cost = 5 / tick scaling
  staminaRegenPerSec: 25, // DA_PlayerStats Min Regen = 10, Max Regen = 40
  exhaustionRecoveryThreshold: 25, // Exhaust CD = -1.5s recovery gate
  jumpVelocityMs: 4.9, // Capsule Jump Stamina = 20, Gravity = -1000 cm/s²
  standingEyeHeightM: 1.60, // Mec_C cameraRelZCm = 160 cm (FOV = 103 deg)
  crouchEyeHeightM: 1.05,
  throwSpeedMs: 8.0, // DA_Drop_Sample / DA_Drop_Guns = 800 cm/s
  throwUpwardMs: 2.0, // DA_Drop_* vertical launch = 200..300 cm/s
  itemBounceRestitution: 0.6, // DA_Drop_Gaz / DA_Drop_Rice restitution = 0.6
  asyncTickSec: 0.0025, // AsyncTickPawn AsyncDelta
  capsuleRadiusM: 0.40, // bodyCapsuleRadiusCm = 40 cm
  capsuleHalfHeightM: 0.70, // bodyCapsuleHalfHeightCm = 70 cm
  cameraFovDeg: 103, // cameraFovDeg = 103 deg
} as const;

export type LockdownItemKind =
  | 'screwdriver'
  | 'battery'
  | 'fuse'
  | 'gaz_bottle'
  | 'vent_filter'
  | 'sample_container'
  | 'rice_bag'
  | 'pizzushi_ration'
  | 'hard_drive'
  | 'cargo_package'
  | 'medkit_soms';

export interface LockdownItemArchetype {
  id: LockdownItemKind;
  uasset: string;
  nameEs: string;
  nameEn: string;
  colorHex: string;
  accentHex: string;
  nasaMassKg: number;
  nasaNoteEs: string;
  nasaNoteEn: string;
}

export const LOCKDOWN_ITEMS: Record<LockdownItemKind, LockdownItemArchetype> = {
  screwdriver: {
    id: 'screwdriver',
    uasset: 'Items/Melee/ScrewDriver/DA_ScrewDriver.uasset',
    nameEs: 'Destornillador EVA',
    nameEn: 'EVA Screwdriver',
    colorHex: '#f59e0b',
    accentHex: '#94a3b8',
    nasaMassKg: 0.45,
    nasaNoteEs: 'Herramienta de torsión EVA para pernos de escotillas y filtros CDRA.',
    nasaNoteEn: 'EVA torque driver for hatch bolts and CDRA scrubber panels.',
  },
  battery: {
    id: 'battery',
    uasset: 'Items/Melee/Battery/DA_Battery.uasset',
    nameEs: 'Celda de Batería',
    nameEn: 'Battery Cell',
    colorHex: '#22c55e',
    accentHex: '#1e293b',
    nasaMassKg: 14.0,
    nasaNoteEs: 'Módulo Li-Ion recargable en BatteryCharger para distribución FSP.',
    nasaNoteEn: 'Rechargeable Li-Ion cell charged in BatteryCharger for FSP bus.',
  },
  fuse: {
    id: 'fuse',
    uasset: 'Items/Melee/Fuze/DA_Fuse.uasset',
    nameEs: 'Fusible Stirling',
    nameEn: 'Stirling Fuse',
    colorHex: '#eab308',
    accentHex: '#cbd5e1',
    nasaMassKg: 1.2,
    nasaNoteEs: 'Cartucho limitador para alternadores Stirling FSP 40 kWe (NTRS 20220004670).',
    nasaNoteEn: 'Limiter cartridge for 40 kWe FSP Stirling alternators (NTRS 20220004670).',
  },
  gaz_bottle: {
    id: 'gaz_bottle',
    uasset: 'Items/Melee/GazBottle/DA_GazBottle.uasset',
    nameEs: 'Tanque COPV O₂/N₂',
    nameEn: 'COPV O₂/N₂ Tank',
    colorHex: '#06b6d4',
    accentHex: '#e2e8f0',
    nasaMassKg: NASA_CONSTANTS.HABITAT_ATMOSPHERE.O2_TANK_CAPACITY_KG,
    nasaNoteEs: 'Botella COPV de 35.4 kg O₂ (seca 12.7 kg) para 101.3 kPa / 21% O₂ (BVAD).',
    nasaNoteEn: '35.4 kg O₂ COPV cylinder (12.7 kg dry) for 101.3 kPa / 21% O₂ (BVAD).',
  },
  vent_filter: {
    id: 'vent_filter',
    uasset: 'Items/Melee/VentFilter/DA_VentFilter.uasset',
    nameEs: 'Cartucho Filtro LiOH',
    nameEn: 'LiOH Filter Cartridge',
    colorHex: '#e2e8f0',
    accentHex: '#38bdf8',
    nasaMassKg: NASA_CONSTANTS.HABITAT_ATMOSPHERE.LIOH_CANISTER_MASS_KG,
    nasaNoteEs: 'Cartucho LiOH de 7.0 kg (4 días-persona) para depuración CO₂ (1.08 kg/d).',
    nasaNoteEn: '7.0 kg LiOH cartridge (4 person-days) scrubbing 1.08 kg/d CO₂ per crew.',
  },
  sample_container: {
    id: 'sample_container',
    uasset: 'Items/Melee/SampleContainer/DA_Container.uasset',
    nameEs: 'Contenedor Muestra',
    nameEn: 'Sample Container',
    colorHex: '#a855f7',
    accentHex: '#f8fafc',
    nasaMassKg: 1.8,
    nasaNoteEs: 'Cápsula estéril para muestras botánicas BLSS y lixiviación 1,200 L.',
    nasaNoteEn: 'Sterile capsule for BLSS botanical samples and 1,200 L leaching.',
  },
  rice_bag: {
    id: 'rice_bag',
    uasset: 'Items/Melee/Rice/DA_Rice.uasset',
    nameEs: 'Ración Base BVAD',
    nameEn: 'BVAD Dry Ration',
    colorHex: '#fef3c7',
    accentHex: '#d97706',
    nasaMassKg: NASA_CONSTANTS.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG,
    nasaNoteEs: '0.80 kg/día comida deshidratada + 0.50 kg/día agua rehidratación (BVAD).',
    nasaNoteEn: '0.80 kg/day dehydrated ration + 0.50 kg/day rehydration water (BVAD).',
  },
  pizzushi_ration: {
    id: 'pizzushi_ration',
    uasset: 'Items/Melee/Pizusshi/DA_Pizzushi.uasset',
    nameEs: 'Ración Hidratada',
    nameEn: 'Hydrated Ration',
    colorHex: '#fb7185',
    accentHex: '#fef08a',
    nasaMassKg: 1.3,
    nasaNoteEs: 'Ración nutricional completa lista para mesa de tripulación (82 kg BVAD).',
    nasaNoteEn: 'Complete crew nutrition tray ready for galley delivery (82 kg BVAD).',
  },
  hard_drive: {
    id: 'hard_drive',
    uasset: 'Items/Melee/HardDrive/DA_HardDrive.uasset',
    nameEs: 'Disco Telemetría',
    nameEn: 'Telemetry Drive',
    colorHex: '#3b82f6',
    accentHex: '#0f172a',
    nasaMassKg: 0.6,
    nasaNoteEs: 'Unidad de datos sincronizada entre terminales con retardo luz (1.28 s / 14 min).',
    nasaNoteEn: 'Data drive synced across terminals accounting for light-time comms delay.',
  },
  cargo_package: {
    id: 'cargo_package',
    uasset: 'Items/Melee/Package/DA_Package.uasset',
    nameEs: 'Bloque Blindaje',
    nameEn: 'Shielding Crate',
    colorHex: '#b45309',
    accentHex: '#f59e0b',
    nasaMassKg: 400,
    nasaNoteEs: 'Módulo compactado de regolito (1,500 kg/m³) para meta 2.0 m / 300 g/cm² GCR.',
    nasaNoteEn: 'Compacted regolith module (1,500 kg/m³) toward 2.0 m / 300 g/cm² GCR shield.',
  },
  medkit_soms: {
    id: 'medkit_soms',
    uasset: 'Items/Melee/Medication/DA_Medication_A.uasset',
    nameEs: 'Kit Médico SOMS',
    nameEn: 'SOMS Medkit',
    colorHex: '#f43f5e',
    accentHex: '#ffffff',
    nasaMassKg: 3.5,
    nasaNoteEs: 'Botiquín orbital NASA SOMS + contramedidas Twins Study.',
    nasaNoteEn: 'NASA SOMS medical kit + Twins Study clinical countermeasures.',
  },
};

export type LockdownTaskId =
  | 'task_alim'
  | 'task_pressure'
  | 'task_vents'
  | 'task_plants'
  | 'task_pizzushi'
  | 'task_scanner'
  | 'task_datas'
  | 'task_delivery';

export interface SectorTaskBlueprint {
  id: LockdownTaskId;
  sectorId: string;
  sectorNameEs: string;
  sectorNameEn: string;
  uassetSource: string;
  colorHex: string;
  mapPos: { x: number; z: number };
  nasaSystemEs: string;
  nasaSystemEn: string;
  stepsEs: string[];
  stepsEn: string[];
}

/**
 * 8 Connected Sectors & Multi-Step Tasks mapped from:
 * `LockdownProtocol/Content/World/Tasks/` & `MiniMap_V3_Sectors.uasset`
 */
export const SECTOR_TASK_BLUEPRINTS: SectorTaskBlueprint[] = [
  {
    id: 'task_alim',
    sectorId: 'power',
    sectorNameEs: 'Sector 1: Planta FSP & Energía',
    sectorNameEn: 'Sector 1: FSP Power Plant',
    uassetSource: 'World/Tasks/Task_Alim/Task_Alim.uasset + AlimBox.uasset + BatteryCharger.uasset',
    colorHex: '#eab308',
    mapPos: { x: -16, z: -14 },
    nasaSystemEs: 'Reactor Stirling FSP 40 kWe (18.1% ef., 126.4 kWth rechazo térmico)',
    nasaSystemEn: '40 kWe FSP Stirling Reactor (18.1% eff, 126.4 kWth heat rejection)',
    stepsEs: [
      'Recoge la Batería y cárgala en BatteryCharger',
      'Inserta Batería cargada y Fusible en AlimBox',
      'Pulsa el botón interruptor para activar los 4 Stirling',
    ],
    stepsEn: [
      'Pick up Battery and charge it in BatteryCharger',
      'Insert charged Battery and Fuse into AlimBox',
      'Press breaker button to restore all 4 Stirling engines',
    ],
  },
  {
    id: 'task_pressure',
    sectorId: 'atmosphere',
    sectorNameEs: 'Sector 2: Presión & O₂ ECLSS',
    sectorNameEn: 'Sector 2: ECLSS Pressure & O₂',
    uassetSource: 'World/Tasks/Task_Machine/Task_Machine.uasset + BottleSlot.uasset + MachinePannel.uasset',
    colorHex: '#06b6d4',
    mapPos: { x: 0, z: -18 },
    nasaSystemEs: 'Atmósfera Hábitat 101.3 kPa / 21.0% O₂ con tanques COPV 35.4 kg',
    nasaSystemEn: 'Habitat Atmosphere 101.3 kPa / 21.0% O₂ via 35.4 kg COPV tanks',
    stepsEs: [
      'Toma un tanque COPV O₂/N₂ e insértalo en BottleSlot',
      'Pulsa la válvula en MachinePannel para presurizar a 101.3 kPa',
    ],
    stepsEn: [
      'Grab a COPV O₂/N₂ bottle and insert it into BottleSlot',
      'Press MachinePannel valve to stabilize at 101.3 kPa',
    ],
  },
  {
    id: 'task_vents',
    sectorId: 'vents',
    sectorNameEs: 'Sector 3: Ventilación CDRA / LiOH',
    sectorNameEn: 'Sector 3: CDRA / LiOH Ventilation',
    uassetSource: 'World/Tasks/Task_Vents/Task_Vents.uasset + Vent.uasset + Screw.uasset + FilterCleaner.uasset',
    colorHex: '#38bdf8',
    mapPos: { x: 16, z: -14 },
    nasaSystemEs: 'Depurador CO₂ CDRA y cartuchos LiOH 7.0 kg (1.08 kg CO₂/día)',
    nasaSystemEn: 'CDRA CO₂ Scrubber & 7.0 kg LiOH canisters (1.08 kg CO₂/day)',
    stepsEs: [
      'Desatornilla los 4 pernos de Vent con Destornillador EVA',
      'Retira el filtro sucio y límpialo en FilterCleaner',
      'Reinstala el filtro limpio en Vent para limpiar CO₂',
    ],
    stepsEn: [
      'Unscrew all 4 Vent bolts with EVA Screwdriver',
      'Pull dirty filter and cycle it through FilterCleaner',
      'Reinsert clean filter into Vent to scrub CO₂',
    ],
  },
  {
    id: 'task_plants',
    sectorId: 'botanical',
    sectorNameEs: 'Sector 4: Invernadero BLSS & Lab',
    sectorNameEn: 'Sector 4: BLSS Greenhouse & Lab',
    uassetSource: 'World/Tasks/Task_Plants/Task_PlantAnalysis.uasset + ContainerCleaner + Centrifuge + Mixer + Analyzer',
    colorHex: '#22c55e',
    mapPos: { x: 18, z: 0 },
    nasaSystemEs: 'Invernadero BLSS (25 m²/persona) + tanque lixiviación 1,200 L',
    nasaSystemEn: 'BLSS Greenhouse (25 m²/person) + 1,200 L leaching tank',
    stepsEs: [
      'Lava el Contenedor en ContainerCleaner',
      'Recolecta muestra en Plantas y procésala en Centrífuga + Mezclador',
      'Analiza en Analyzer y confirma en Analysis_PC (+18 kg comida)',
    ],
    stepsEn: [
      'Wash Sample Container in ContainerCleaner',
      'Harvest Plant sample and run Centrifuge + Mixer',
      'Insert into Analyzer and confirm on Analysis_PC (+18 kg food)',
    ],
  },
  {
    id: 'task_pizzushi',
    sectorId: 'galley',
    sectorNameEs: 'Sector 5: Cocina Metabólica BVAD',
    sectorNameEn: 'Sector 5: BVAD Metabolic Galley',
    uassetSource: 'World/Tasks/Task_Pizzushi/Task_Pizzushi.uasset + Rice_Machine + Fish_Machine + Pizzushi_Machine',
    colorHex: '#fb7185',
    mapPos: { x: 16, z: 14 },
    nasaSystemEs: 'Balance metabólico BVAD 82 kg (0.80 kg comida + 0.50 kg agua rehidrat.)',
    nasaSystemEn: '82 kg BVAD Metabolic Ration (0.80 kg food + 0.50 kg rehydration water)',
    stepsEs: [
      'Carga Ración Base en Rice_Machine y actívala',
      'Combina suplemento en Fish_Machine y prensa en Pizzushi_Machine',
      'Entrega la Ración Hidratada en Pizzushi_Table',
    ],
    stepsEn: [
      'Load Dry Ration into Rice_Machine and run cycle',
      'Combine supplement at Fish_Machine and press in Pizzushi_Machine',
      'Deliver Hydrated Ration to Pizzushi_Table',
    ],
  },
  {
    id: 'task_scanner',
    sectorId: 'medbay',
    sectorNameEs: 'Sector 6: Enfermería SOMS & Escáner',
    sectorNameEn: 'Sector 6: SOMS MedBay & Scanner',
    uassetSource: 'World/Tasks/Scanner_Calibration/Task_Scanner.uasset + Scanner_Machine + W_Scanner_TargetDot',
    colorHex: '#f43f5e',
    mapPos: { x: 0, z: 18 },
    nasaSystemEs: 'Medicina NASA Twins Study (ARED 2 h/d, sueño 8.5 h, límite 250 mSv SPE)',
    nasaSystemEn: 'NASA Twins Study Medicine (2 h/d ARED, 8.5 h sleep, 250 mSv SPE limit)',
    stepsEs: [
      'Aplica Kit Médico SOMS en Scanner_Machine',
      'Calibra los puntos de dosimetría en Scanner_PC (W_Scanner_TargetDot)',
    ],
    stepsEn: [
      'Apply SOMS Medkit at Scanner_Machine',
      'Calibrate dosimetry target dots on Scanner_PC (W_Scanner_TargetDot)',
    ],
  },
  {
    id: 'task_datas',
    sectorId: 'comms',
    sectorNameEs: 'Sector 7: Telemetría & Cámaras',
    sectorNameEn: 'Sector 7: Deep Space Telemetry & CCTV',
    uassetSource: 'World/Tasks/Task_Datas/Task_Data.uasset + Data_PC.uasset + Cameras/PC_Cameras.uasset',
    colorHex: '#3b82f6',
    mapPos: { x: -16, z: 14 },
    nasaSystemEs: 'Enlace Tierra-Misión (1.28 s Luna / 14 min Marte) + monitoreo CCTV',
    nasaSystemEn: 'Earth-Outpost Link (1.28 s Moon / 14 min Mars) + sector CCTV',
    stepsEs: [
      'Extrae Disco de Telemetría de Data_PC Origen',
      'Insértalo en Data_PC Enlace Houston y pulsa Transmitir',
    ],
    stepsEn: [
      'Pull Telemetry Drive from Source Data_PC',
      'Insert into Houston Link Data_PC and press Transmit',
    ],
  },
  {
    id: 'task_delivery',
    sectorId: 'airlock',
    sectorNameEs: 'Sector 8: Esclusa EVA & Blindaje',
    sectorNameEn: 'Sector 8: EVA Airlock & Regolith Cargo',
    uassetSource: 'World/Tasks/Task_Delivery/Task_DelivryIn.uasset + DeliveryCase.uasset + Locked_Door.uasset',
    colorHex: '#f97316',
    mapPos: { x: -18, z: 0 },
    nasaSystemEs: 'Traje EVA 8.0 h + Carga de regolito WASM (P = ρ·g·h, meta 300 g/cm²)',
    nasaSystemEn: '8.0 h EVA Suit + WASM Regolith Shielding (P = ρ·g·h, target 300 g/cm²)',
    stepsEs: [
      'Equipa el Traje EVA en el casillero de Esclusa',
      'Inserta Bloque de Blindaje en DeliveryCase y pulsa Sellar Bóveda',
    ],
    stepsEn: [
      'Equip EVA Suit at Airlock locker',
      'Load Shielding Crate into DeliveryCase and press Seal Vault',
    ],
  },
];


/**
 * Verified EnhancedInput bindings extracted from `IMC_CharacterDefault` in
 * `LockdownProtocol-Win64-Shipping.exe` runtime memory via REA Step 4.
 */
export const IMC_CHARACTER_DEFAULT = [
  { key: 'W', action: 'IA_MoveF', labelEs: 'Avanzar', labelEn: 'Move Forward' },
  { key: 'S', action: 'IA_MoveB', labelEs: 'Retroceder', labelEn: 'Move Back' },
  { key: 'D', action: 'IA_MoveR', labelEs: 'Derecha', labelEn: 'Strafe Right' },
  { key: 'A', action: 'IA_MoveL', labelEs: 'Izquierda', labelEn: 'Strafe Left' },
  { key: 'LeftShift', action: 'IA_Run', labelEs: 'Correr', labelEn: 'Sprint' },
  { key: 'LeftControl', action: 'IA_Walk', labelEs: 'Caminar lento (mantener)', labelEn: 'Slow Walk (Hold)' },
  { key: 'Z', action: 'IA_ToggleWalk', labelEs: 'Alternar caminar lento', labelEn: 'Toggle Slow Walk' },
  { key: 'E', action: 'IA_Inventory', labelEs: 'Alternar Mano / Mochila', labelEn: 'Swap Hand / Bag' },
  { key: 'Q', action: 'IA_Info', labelEs: 'Tableta / Mapa Táctico', labelEn: 'Body Tablet / Map' },
  { key: 'MouseScrollUp', action: 'IA_NavigationUp', labelEs: 'Pestaña Tablet Anterior', labelEn: 'Tablet Tab Prev' },
  { key: 'MouseScrollDown', action: 'IA_NavigationDown', labelEs: 'Pestaña Tablet Siguiente', labelEn: 'Tablet Tab Next' },
  { key: 'F', action: 'IA_Surrender', labelEs: 'Levantar Manos', labelEn: 'Hands Up / Surrender' },
  { key: 'T', action: 'IA_ToogleMic', labelEs: 'Alternar Micrófono', labelEn: 'Toggle Mic' },
  { key: 'V', action: 'IA_HoldMic', labelEs: 'Pulsar para Hablar', labelEn: 'Push to Talk' },
  { key: 'X', action: 'IA_EyeL', labelEs: 'Guiño / Ojo Izq.', labelEn: 'Left Eye Expression' },
  { key: 'C', action: 'IA_EyeR', labelEs: 'Guiño / Ojo Der.', labelEn: 'Right Eye Expression' },
  { key: 'U', action: 'IA_HUD', labelEs: 'Mostrar / Ocultar HUD', labelEn: 'Toggle HUD' },
] as const;

export const TASK_TUTORIAL_MOVIES: Record<LockdownTaskId, string> = {
  task_alim: '/lockdown_movies/Alim_montage.mp4',
  task_pressure: '/lockdown_movies/Pressure_montage.mp4',
  task_vents: '/lockdown_movies/Vents_montage.mp4',
  task_plants: '/lockdown_movies/Analysis_montage.mp4',
  task_pizzushi: '/lockdown_movies/Tutorial_Pizzushi.mp4',
  task_scanner: '/lockdown_movies/Scanner_montage.mp4',
  task_datas: '/lockdown_movies/Tutorial_Computer_v2.mp4',
  task_delivery: '/lockdown_movies/Delivery_montage.mp4',
};
