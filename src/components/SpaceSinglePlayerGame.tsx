import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Compass,
  DoorOpen,
  Info,
  Layers,
  MapPin,
  Moon,
  Newspaper,
  Package,
  Rocket,
  Sliders,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { NASA_CONSTANTS } from '../data/nasaConstants';
import {
  AETHER4_MISSIONS,
  CREW_COMPANIONS,
  EndingId,
  MissionId,
} from '../data/aether4StoryData';
import { getThrowProfile, PAWN_CONSTANTS, PlayerPhysicsState } from '../game/lockdownPhysics';
import { SUIT_COLORS, VISOR_FACES } from '../data/lockdownProtocolBlueprintCatalog';
import { canItemStoreInBag, getItemDisplayName, getItemSlowTier, HeldItem } from '../game/lockdownTasks';
import {
  ChibiAstronautRig,
  createChibiAstronautRig,
  createDetailedItemMesh,
  createFirstPersonHandsRig,
  FirstPersonHandsRig,
  updateChibiAstronautRig,
  updateFirstPersonHandsRig,
} from '../game/spaceAstronautRigs';
import { createSpaceTextureSet } from '../game/spaceProceduralTextures';
import {
  clampToWalkableStation,
  completeEngineeringCalibration,
  computeStationPathWaypoints,
  createInitialSpaceRoomState,
  createRoomSpawnPlayer,
  findRoomLookTarget,
  getCurrentGuidedStep,
  getRoomZoneAt,
  getSpaceItemLabel,
  getStationTrainingBrief,
  interactRoomStation,
  LightingMode,
  ROOM_BOUNDS,
  RoomCarryState,
  RoomLookTarget,
  RoomStationKind,
  SPACE_ITEM_LABELS,
  SPACE_ROOM_COLLIDERS,
  SpaceRoomState,
  STATION_FLOOR_RECTS,
  STATION_ZONES,
  StationTrainingBrief,
  stepSpaceRoomPlayer,
  stepSpaceRoomSimulation,
  ThrowPhysicsMode,
  WALL_COLLIDER_COUNT,
} from '../game/spaceRoomSimulation';
import { soundEngine } from '../audio/soundEngine';
import { SpacePaperCodexModal } from './SpacePaperCodexModal';
import { MentorHologram } from './MentorHologram';
import {
  AscanTrainingModal,
  CrewDialogueModal,
  CrisisSimulatorModal,
  EndingDebriefModal,
  EngineeringCalibrationModal,
  EscTacticalMenuModal,
  LaunchTransitModal,
  MissionChecklistModal,
  OrionPreFlightModal,
  TenVariableTelemetryModal,
  WallManualPopupModal,
} from './SpaceMissionModals';

type ScreenMode = 'menu' | 'room';
type CameraMode = 'first' | 'third';
type LangMode = 'es' | 'en';
type MenuDrawer = 'home' | 'missions' | 'customize';
type RoomModal =
  | null
  | 'checklist'
  | 'spawner'
  | 'terminal'
  | 'mirror'
  | 'codex'
  | 'crisis'
  | 'ending'
  | 'esc_menu'
  | 'engineering'
  | 'launch_transit'
  | 'crew_dialogue'
  | 'ascan_modal'
  | 'wall_manual'
  | 'orion_preflight';

function getSpaceItemName(itemKey: string, lang: LangMode): string {
  if (SPACE_ITEM_LABELS[itemKey]) return getSpaceItemLabel(itemKey, lang);
  return getItemDisplayName(itemKey, lang);
}

function getMissionObjectiveSummary(missionId: MissionId, obj: SpaceRoomState['objectives']): { done: number; total: number } {
  const map: Record<MissionId, boolean[]> = {
    tutorial_hab: [
      obj.sleepCompleted,
      obj.exerciseCalibrated,
      obj.whcInspected,
      obj.evaChecked,
      obj.powerRestored,
      obj.eclssCleaned,
      obj.mealPrepared,
      obj.crisisSolved,
      obj.nblCertified,
      obj.computerCertified,
      obj.centrifugeCertified,
      obj.fireDrillCertified,
    ],
    manifest_launch: [
      obj.manifestConfigured,
      obj.preflightRepaired,
      obj.preflightSystemsOn,
      obj.launchCompleted,
    ],
    act1_2_surface: [obj.thermalFixed, obj.powerBalanced],
    act3_greenhouse: [obj.aphHarvested, obj.compostIsolated, obj.bios3Activated],
    act4_storm_rover: [obj.roverReturned, obj.regolithDeployed],
    apollo13_aquarius: [
      obj.a13CryoDiagnosed,
      obj.a13AquariusMigrated,
      obj.a13MailboxInstalled,
      obj.a13ColdPowerup,
    ],
    sts120_p6_solar: [
      obj.stsArrayInspected,
      obj.stsCufflinksCrafted,
      obj.stsWireSnipped,
      obj.stsArrayDeployed,
    ],
  };
  const arr = map[missionId];
  return { done: arr.filter(Boolean).length, total: arr.length };
}

export const SpaceSinglePlayerGame: React.FC = () => {
  const [screen, setScreen] = useState<ScreenMode>('menu');
  const [lang, setLang] = useState<LangMode>('es');
  const [audioOn, setAudioOn] = useState(soundEngine.enabled);
  const [musicOn, setMusicOn] = useState(soundEngine.musicEnabled);
  const [ambientOn, setAmbientOn] = useState(soundEngine.ambientEnabled);
  const [menuDrawer, setMenuDrawer] = useState<MenuDrawer>('home');
  const [selectedMenuMissionId, setSelectedMenuMissionId] = useState<MissionId>('tutorial_hab');
  const [activeMissionKey, setActiveMissionKey] = useState<MissionId>('tutorial_hab');

  const [suitIdx, setSuitIdx] = useState(1); // NASA Deep Blue
  const [faceIdx, setFaceIdx] = useState(0); // Happy LED eyes
  const [menuPreviewMode, setMenuPreviewMode] = useState<'wave' | 'walk' | 'exercise'>('wave');
  const [menuPreviewItem, setMenuPreviewItem] = useState<string | null>('DA_ScrewDriver');
  const [menuCodexOpen, setMenuCodexOpen] = useState(false);

  const [cameraMode, setCameraMode] = useState<CameraMode>('first');
  const cameraModeRef = useRef<CameraMode>('first');
  cameraModeRef.current = cameraMode;

  const [activeModal, setActiveModal] = useState<RoomModal>(null);
  const activeModalRef = useRef<RoomModal>(null);
  activeModalRef.current = activeModal;

  const [engineeringKind, setEngineeringKind] = useState<RoomStationKind>('skylab_thermal_station');
  const [ascanMode, setAscanMode] = useState<'nbl' | 'computer' | 'centrifuge' | 'fire'>('nbl');
  const [orionPreflightMode, setOrionPreflightMode] = useState<'fault_repair' | 'power_switches'>('fault_repair');
  const [backpackOpen, setBackpackOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const [launchTransitTarget, setLaunchTransitTarget] = useState<{
    from: MissionId;
    to: MissionId;
    preserveCarry: boolean;
  } | null>(null);

  const [codexInit, setCodexInit] = useState<{ tab: 'papers' | 'notes'; paperId: number; noteId: number }>({
    tab: 'papers',
    paperId: 1,
    noteId: 1,
  });
  const [endingIdModal, setEndingIdModal] = useState<EndingId>('ending_3_interplanetary_cradle');

  const [pointerLocked, setPointerLocked] = useState(false);
  const [banner, setBanner] = useState<{ text: string; tone: 'ok' | 'warn' | 'err' } | null>(null);
  const [lookTarget, setLookTarget] = useState<RoomLookTarget>({ kind: null, id: '', labelEs: '', labelEn: '' });
  const lookTargetRef = useRef<RoomLookTarget>({ kind: null, id: '', labelEs: '', labelEn: '' });
  const [crewDialogue, setCrewDialogue] = useState<{
    crewId: keyof typeof CREW_COMPANIONS;
    stationId: string;
    giftEs?: string;
    giftEn?: string;
  } | null>(null);
  const [trainingBrief, setTrainingBrief] = useState<StationTrainingBrief | null>(null);

  // Core simulation refs (60fps loop)
  const playerRef = useRef<PlayerPhysicsState>(createRoomSpawnPlayer());
  const simRef = useRef<SpaceRoomState>(createInitialSpaceRoomState('tutorial_hab'));
  const hotbarRef = useRef<(HeldItem | null)[]>([null, null, null, null, null]);
  const activeSlotRef = useRef<number>(0);
  const backpackRef = useRef<(HeldItem | null)[]>([null, null, null, null, null, null]);
  const handItemRef = useRef<HeldItem | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const jumpQueueRef = useRef(false);
  const lookDeltaRef = useRef({ yaw: 0, pitch: 0 });
  const targetYawRef = useRef<number>(playerRef.current.yawDeg);
  const targetPitchRef = useRef<number>(playerRef.current.pitchDeg);
  const lockAcquiredAtMsRef = useRef<number>(0);
  const lastEscOpenMsRef = useRef<number>(0);
  const isDraggingLookRef = useRef<boolean>(false);
  const doorWasOpenRef = useRef<Record<string, boolean>>({});
  const animPulsesRef = useRef({ reach: 0, use: 0, swap: 0, consume: 0 });
  const bannerTimerRef = useRef<number | null>(null);
  const ignoreNextUnlockRef = useRef(false);
  const lastZoneIdRef = useRef<string>('west_hab');

  const panoramaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const menuMountRef = useRef<HTMLDivElement | null>(null);
  const roomMountRef = useRef<HTMLDivElement | null>(null);

  const [hud, setHud] = useState(() => ({
    currentMissionId: simRef.current.currentMissionId,
    x: playerRef.current.x,
    y: playerRef.current.y,
    yawDeg: playerRef.current.yawDeg,
    hp: playerRef.current.hp,
    stamina: playerRef.current.stamina,
    crouching: false,
    sprinting: false,
    pressureKpa: simRef.current.cabinPressureKpa,
    suitO2Percent: simRef.current.suitO2Percent,
    hydrationPercent: simRef.current.hydrationPercent,
    airlockStep: simRef.current.airlockStep,
    airlockPressureKpa: simRef.current.airlockPressureKpa,
    rpcmLoadKwe: simRef.current.rpcmLoadKwe,
    rpcmTripped: simRef.current.rpcmTripped,
    atcsLoopTempK: simRef.current.atcsLoopTempK,
    stsRedeploySteps: simRef.current.stsRedeploySteps,
    throwPhysicsMode: simRef.current.throwPhysicsMode as ThrowPhysicsMode,
    o2Percent: simRef.current.o2Percent,
    co2Ppm: simRef.current.co2Ppm,
    waterLiters: simRef.current.waterLiters,
    powerKwe: simRef.current.powerKwe,
    tempCelsius: simRef.current.tempCelsius,
    humidityPercent: simRef.current.humidityPercent,
    foodKg: simRef.current.foodKg,
    batteryPercent: simRef.current.batteryPercent,
    crewRadiationMsv: simRef.current.crewRadiationMsv,
    crewMoralePercent: simRef.current.crewMoralePercent,
    wasteKg: simRef.current.wasteKg,
    bpm: simRef.current.heartRateBpm,
    bpSys: simRef.current.bpSys,
    bpDia: simRef.current.bpDia,
    lightingMode: simRef.current.lightingMode as LightingMode,
    shutterOpen: simRef.current.shutterOpen,
    sleeping: simRef.current.sleeping,
    sleepTimerSec: simRef.current.sleepTimerSec,
    exercising: false,
    launchStageIndex: simRef.current.launchStageIndex,
    missionAssigned: simRef.current.missionAssigned,
    eclssChoice: simRef.current.eclssChoice,
    powerChoice: simRef.current.powerChoice,
    roverChoice: simRef.current.roverChoice,
    objectives: { ...simRef.current.objectives },
    unlockedNotes: [...simRef.current.unlockedLegacyNotes],
    unlockedPapers: [...simRef.current.unlockedNewspapers],
    activeRadio: { ...simRef.current.activeRadio },
    handItem: null as HeldItem | null,
    bagItem: null as HeldItem | null,
    hotbar: [null, null, null, null, null] as (HeldItem | null)[],
    backpack: [null, null, null, null, null, null] as (HeldItem | null)[],
    activeSlot: 0,
    chargerPct: 0,
    heaterPct: 0,
  }));

  const pushBanner = useCallback((text: string, tone: 'ok' | 'warn' | 'err' = 'ok') => {
    setBanner({ text, tone });
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setBanner(null), 4000);
  }, []);

  const syncHudNow = useCallback(() => {
    const p = playerRef.current;
    const s = simRef.current;
    const charger = s.stations.find((st) => st.kind === 'power_charger');
    const heater = s.stations.find((st) => st.kind === 'food_heater');
    setHud({
      currentMissionId: s.currentMissionId,
      x: p.x,
      y: p.y,
      yawDeg: p.yawDeg,
      hp: p.hp,
      stamina: p.stamina,
      crouching: p.crouching,
      sprinting: p.sprinting,
      pressureKpa: s.cabinPressureKpa,
      suitO2Percent: s.suitO2Percent,
      hydrationPercent: s.hydrationPercent,
      airlockStep: s.airlockStep,
      airlockPressureKpa: s.airlockPressureKpa,
      rpcmLoadKwe: s.rpcmLoadKwe,
      rpcmTripped: s.rpcmTripped,
      atcsLoopTempK: s.atcsLoopTempK,
      stsRedeploySteps: s.stsRedeploySteps,
      throwPhysicsMode: s.throwPhysicsMode,
      o2Percent: s.o2Percent,
      co2Ppm: s.co2Ppm,
      waterLiters: s.waterLiters,
      powerKwe: s.powerKwe,
      tempCelsius: s.tempCelsius,
      humidityPercent: s.humidityPercent,
      foodKg: s.foodKg,
      batteryPercent: s.batteryPercent,
      crewRadiationMsv: s.crewRadiationMsv,
      crewMoralePercent: s.crewMoralePercent,
      wasteKg: s.wasteKg,
      bpm: s.heartRateBpm,
      bpSys: s.bpSys,
      bpDia: s.bpDia,
      lightingMode: s.lightingMode,
      shutterOpen: s.shutterOpen,
      sleeping: s.sleeping,
      sleepTimerSec: s.sleepTimerSec,
      exercising: s.exercisingTimerSec > 0,
      launchStageIndex: s.launchStageIndex,
      missionAssigned: s.missionAssigned,
      eclssChoice: s.eclssChoice,
      powerChoice: s.powerChoice,
      roverChoice: s.roverChoice,
      objectives: { ...s.objectives },
      unlockedNotes: [...s.unlockedLegacyNotes],
      unlockedPapers: [...s.unlockedNewspapers],
      activeRadio: { ...s.activeRadio },
      handItem: handItemRef.current ? { ...handItemRef.current } : null,
      bagItem: backpackRef.current[0] ? { ...backpackRef.current[0] } : null,
      hotbar: hotbarRef.current.map((it) => (it ? { ...it } : null)),
      backpack: backpackRef.current.map((it) => (it ? { ...it } : null)),
      activeSlot: activeSlotRef.current,
      chargerPct: charger?.hasBattery ? Math.round(charger.progress) : 0,
      heaterPct: heater?.hasRice && heater?.hasWater ? Math.round(heater.progress) : 0,
    });
  }, []);

  const handleCycleThrowMode = useCallback(() => {
    const modes: ThrowPhysicsMode[] = ['earth_1g', 'low_g', 'dense_atmo', 'zero_g'];
    const s = simRef.current;
    const next = modes[(modes.indexOf(s.throwPhysicsMode) + 1) % modes.length];
    s.throwPhysicsMode = next;
    soundEngine.playClick();
    const labels: Record<ThrowPhysicsMode, string> = {
      earth_1g: '1G Tierra (9.81 m/s²)',
      low_g: 'Low-G Lunar/Orbital',
      dense_atmo: 'Atmósfera Densa',
      zero_g: 'Microgravedad 0G (Vuelo Suspendido)',
    };
    pushBanner(
      lang === 'es' ? `Física de lanzamiento: ${labels[next]}` : `Throw physics: ${next.toUpperCase()}`,
      'ok'
    );
    syncHudNow();
  }, [lang, pushBanner, syncHudNow]);

  const handleResetRpcm = useCallback(() => {
    const s = simRef.current;
    for (const b of s.rpcmBreakers) {
      if (b.id === 'PAYLOAD') {
        b.closed = false;
        b.tripped = false;
      } else {
        b.closed = true;
        b.tripped = false;
      }
    }
    s.rpcmTripped = false;
    s.rpcmLoadKwe = Number(s.rpcmBreakers.reduce((sum, b) => sum + (b.closed ? b.loadKwe : 0), 0).toFixed(2));
    soundEngine.playSuccess();
    pushBanner(
      lang === 'es'
        ? `RPCM 120V DC rearmado: ${s.rpcmLoadKwe.toFixed(1)} / 6.2 kWe`
        : `120V DC RPCM reset: ${s.rpcmLoadKwe.toFixed(1)} / 6.2 kWe`,
      'ok'
    );
    syncHudNow();
  }, [lang, pushBanner, syncHudNow]);

  const applyMissionLoad = useCallback(
    (missionId: MissionId, preserveCarry = false) => {
      const cur = simRef.current;
      const carry: RoomCarryState | undefined = preserveCarry
        ? {
            eclssChoice: cur.eclssChoice,
            powerChoice: cur.powerChoice,
            roverChoice: cur.roverChoice,
            unlockedLegacyNotes: [...cur.unlockedLegacyNotes],
            unlockedNewspapers: [...cur.unlockedNewspapers],
            crisisDecision: cur.crisisDecision,
            act1Decision: cur.act1Decision,
            act2Decision: cur.act2Decision,
            act3Decision: cur.act3Decision,
            act4Decision: cur.act4Decision,
            waterLiters: cur.waterLiters,
            foodKg: cur.foodKg,
            crewRadiationMsv: cur.crewRadiationMsv,
            crewMoralePercent: cur.crewMoralePercent,
          }
        : undefined;

      playerRef.current = createRoomSpawnPlayer();
      targetYawRef.current = playerRef.current.yawDeg;
      targetPitchRef.current = playerRef.current.pitchDeg;
      lastZoneIdRef.current = getRoomZoneAt(playerRef.current.x, playerRef.current.y).id;
      simRef.current = createInitialSpaceRoomState(missionId, carry);
      hotbarRef.current = [null, null, null, null, null];
      activeSlotRef.current = 0;
      setActiveSlot(0);
      backpackRef.current = [null, null, null, null, null, null];
      handItemRef.current = null;
      setBackpackOpen(false);
      doorWasOpenRef.current = {};
      setCrewDialogue(null);
      setTrainingBrief(null);
      setLaunchTransitTarget(null);
      setActiveMissionKey(missionId);
      setActiveModal(null);
      setCameraMode('first');
      setScreen('room');
      soundEngine.unlock();
      soundEngine.setAmbientEnvironment(
        missionId === 'tutorial_hab'
          ? 'earth_jsc'
          : missionId === 'act4_storm_rover'
          ? 'surface_alert'
          : 'orbital_iss'
      );
      soundEngine.playSuccess();
      syncHudNow();
      const mCfg = AETHER4_MISSIONS.find((m) => m.id === missionId);
      if (mCfg) {
        pushBanner(
          `${lang === 'es' ? mCfg.badgeEs : mCfg.badgeEn}: ${lang === 'es' ? mCfg.titleEs : mCfg.titleEn}`,
          'ok'
        );
      }
    },
    [lang, pushBanner, syncHudNow]
  );

  const enterMission = useCallback(
    (missionId: MissionId, preserveCarry = false) => {
      soundEngine.unlock();
      if (missionId === 'tutorial_hab') {
        applyMissionLoad('tutorial_hab', false);
        return;
      }
      const fromId = simRef.current.currentMissionId;
      ignoreNextUnlockRef.current = true;
      document.exitPointerLock?.();
      setScreen('room');
      setLaunchTransitTarget({ from: fromId, to: missionId, preserveCarry });
      setActiveModal('launch_transit');
    },
    [applyMissionLoad]
  );

  const commitHandToSlot = useCallback((nextItem: HeldItem | null, slotIdx = activeSlotRef.current) => {
    hotbarRef.current[slotIdx] = nextItem;
    if (slotIdx === activeSlotRef.current) {
      handItemRef.current = nextItem;
      playerRef.current.slowTier = getItemSlowTier(nextItem?.itemKey ?? null);
    }
  }, []);

  const selectHotbarSlot = useCallback(
    (slotIdx: number) => {
      const clamped = ((slotIdx % 5) + 5) % 5;
      activeSlotRef.current = clamped;
      setActiveSlot(clamped);
      handItemRef.current = hotbarRef.current[clamped];
      playerRef.current.slowTier = getItemSlowTier(handItemRef.current?.itemKey ?? null);
      animPulsesRef.current.swap = 0.7;
      soundEngine.playClick();
      syncHudNow();
    },
    [syncHudNow]
  );

  // Move or swap a quick-bar slot <-> any of the 6 backpack slots
  const swapHotbarWithBagSlot = useCallback(
    (hotbarIdx: number, bagIdx: number) => {
      const h = hotbarRef.current[hotbarIdx];
      const b = backpackRef.current[bagIdx];
      if (h && !canItemStoreInBag(h.itemKey)) {
        soundEngine.playAlarm();
        pushBanner(
          lang === 'es'
            ? `${getSpaceItemName(h.itemKey, 'es')} es demasiado grande para la mochila`
            : `${getSpaceItemName(h.itemKey, 'en')} cannot fit in Backpack`,
          'warn'
        );
        return;
      }
      hotbarRef.current[hotbarIdx] = b;
      backpackRef.current[bagIdx] = h;
      if (hotbarIdx === activeSlotRef.current) {
        handItemRef.current = b;
        playerRef.current.slowTier = getItemSlowTier(b?.itemKey ?? null);
      }
      animPulsesRef.current.swap = 1.0;
      soundEngine.playClick();
      syncHudNow();
    },
    [lang, pushBanner, syncHudNow]
  );

  // Quick Swap Active Hotbar Slot <-> Backpack [R]
  const handleSwapInventory = useCallback(() => {
    const slot = activeSlotRef.current;
    const h = hotbarRef.current[slot];
    if (h) {
      if (!canItemStoreInBag(h.itemKey)) {
        soundEngine.playAlarm();
        pushBanner(
          lang === 'es'
            ? `${getSpaceItemName(h.itemKey, 'es')} es demasiado grande para la mochila`
            : `${getSpaceItemName(h.itemKey, 'en')} cannot fit in Backpack`,
          'warn'
        );
        return;
      }
      const occupiedBagIdx = backpackRef.current.findIndex((it) => it !== null);
      const emptyBagIdx = backpackRef.current.findIndex((it) => it === null);
      const targetBagIdx = emptyBagIdx !== -1 ? emptyBagIdx : occupiedBagIdx !== -1 ? occupiedBagIdx : 0;
      swapHotbarWithBagSlot(slot, targetBagIdx);
      return;
    }
    const firstInBag = backpackRef.current.findIndex((it) => it !== null);
    if (firstInBag !== -1) {
      swapHotbarWithBagSlot(slot, firstInBag);
      return;
    }
    setBackpackOpen((b) => !b);
  }, [lang, pushBanner, swapHotbarWithBagSlot]);

  // Throw / Drop Hand Item [RMB] with real physics bounce
  const handleThrowHandItem = useCallback(() => {
    const h = handItemRef.current;
    if (!h) return;
    const p = playerRef.current;
    const prof = getThrowProfile(h.itemKey);
    const yawRad = (p.yawDeg * Math.PI) / 180;
    const pitchRad = (p.pitchDeg * Math.PI) / 180;
    const fx = Math.cos(pitchRad) * Math.cos(yawRad);
    const fy = Math.cos(pitchRad) * Math.sin(yawRad);
    const fz = Math.sin(pitchRad);
    const [throwX, throwY] = clampToWalkableStation(
      p.x + fx * 0.55,
      p.y + fy * 0.55,
      p.x,
      p.y,
      0.16,
      simRef.current.doors
    );

    simRef.current.worldItems.push({
      uid: h.uid,
      itemKey: h.itemKey,
      category: 'task',
      x: throwX,
      y: throwY,
      z: Math.max(0.25, p.z + 1.2 + prof.zOffsetM),
      vx: fx * prof.speedMs * 0.65 + p.vx * 0.3,
      vy: fy * prof.speedMs * 0.65 + p.vy * 0.3,
      vz: Math.max(0.5, fz * prof.speedMs * 0.4 + prof.verticalMs * 0.7),
      yawDeg: p.yawDeg,
      thrownByPlayer: true,
      charge: h.charge,
      clean: h.clean,
      ammo: h.ammo,
    });
    commitHandToSlot(null);
    animPulsesRef.current.use = 1.0;
    soundEngine.playItemThrow();
    syncHudNow();
  }, [commitHandToSlot, syncHudNow]);

  // Primary Action [LMB / Enter / HUD Button]
  const handlePrimaryAction = useCallback(() => {
    soundEngine.unlock();
    const sim = simRef.current;
    const target = findRoomLookTarget(playerRef.current, sim);

    // Consume hydrated meal / VEG-05 tomatoes / water pouch / tablet when not aiming at a station/pickup
    if (!target.kind && handItemRef.current) {
      const hk = handItemRef.current.itemKey;
      if (hk === 'DA_Pizzushi' || hk === 'DA_CookedRice' || hk === 'DA_WaterPouch') {
        commitHandToSlot(null);
        playerRef.current.hp = Math.min(100, playerRef.current.hp + 20);
        playerRef.current.stamina = 100;
        if (hk === 'DA_WaterPouch') {
          sim.waterLiters = Math.min(103, sim.waterLiters + 0.5);
          sim.hydrationPercent = 100;
          sim.heartRateBpm = Math.max(66, sim.heartRateBpm - 6);
        } else {
          sim.crewMoralePercent = Math.min(100, sim.crewMoralePercent + 4);
        }
        animPulsesRef.current.consume = 1.0;
        soundEngine.playSuccess();
        pushBanner(
          lang === 'es'
            ? `${getSpaceItemName(hk, 'es')} consumido (+Estamina & Vitals BVAD)`
            : `${getSpaceItemName(hk, 'en')} consumed (+Stamina & BVAD Vitals)`,
          'ok'
        );
        syncHudNow();
        return;
      }
      if (hk === 'DA_LegacyTablet') {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setCodexInit({ tab: 'notes', paperId: 1, noteId: 1 });
        setActiveModal('codex');
        return;
      }
    }

    if (target.kind === 'item') {
      const idx = sim.worldItems.findIndex((i) => i.uid === target.id);
      if (idx === -1) return;
      const it = sim.worldItems[idx];

      const picked: HeldItem = {
        uid: it.uid,
        itemKey: it.itemKey,
        charge: it.charge,
        clean: it.clean ?? true,
        ammo: it.ammo ?? 0,
      };

      let targetBannerEs = `Recogido [${activeSlotRef.current + 1}]: ${getSpaceItemName(it.itemKey, 'es')}`;
      let targetBannerEn = `Picked up [${activeSlotRef.current + 1}]: ${getSpaceItemName(it.itemKey, 'en')}`;

      if (!hotbarRef.current[activeSlotRef.current]) {
        commitHandToSlot(picked);
      } else {
        const emptyHotbar = hotbarRef.current.findIndex((x) => !x);
        if (emptyHotbar !== -1) {
          activeSlotRef.current = emptyHotbar;
          setActiveSlot(emptyHotbar);
          commitHandToSlot(picked, emptyHotbar);
          targetBannerEs = `Recogido en casilla [${emptyHotbar + 1}]: ${getSpaceItemName(it.itemKey, 'es')}`;
          targetBannerEn = `Picked up in slot [${emptyHotbar + 1}]: ${getSpaceItemName(it.itemKey, 'en')}`;
        } else if (canItemStoreInBag(it.itemKey)) {
          const emptyBag = backpackRef.current.findIndex((x) => !x);
          if (emptyBag !== -1) {
            backpackRef.current[emptyBag] = picked;
            targetBannerEs = `Guardado en Mochila #${emptyBag + 1}: ${getSpaceItemName(it.itemKey, 'es')}`;
            targetBannerEn = `Stored in Backpack #${emptyBag + 1}: ${getSpaceItemName(it.itemKey, 'en')}`;
          } else {
            soundEngine.playAlarm();
            pushBanner(
              lang === 'es' ? 'Acceso rápido 1–5 y Mochila llenos — Suelta con Clic Derecho' : 'Slots 1–5 & Backpack full — Right Click to Drop',
              'warn'
            );
            return;
          }
        } else {
          soundEngine.playAlarm();
          pushBanner(
            lang === 'es' ? 'Casillas 1–5 ocupadas — Suelta un objeto con Clic Derecho' : 'Quick slots 1–5 full — Right Click to drop item',
            'warn'
          );
          return;
        }
      }

      sim.worldItems.splice(idx, 1);
      sim.missionAssigned = true;
      animPulsesRef.current.reach = 1.0;
      soundEngine.playClick();
      pushBanner(lang === 'es' ? targetBannerEs : targetBannerEn, 'ok');
      syncHudNow();
      return;
    }

    if (target.kind === 'station' || target.kind === 'npc') {
      const carriedAll = [...hotbarRef.current, ...backpackRef.current];
      const res = interactRoomStation(target.id, sim, handItemRef.current, carriedAll);
      commitHandToSlot(res.handItem);

      if (res.consumeFoodAnim) animPulsesRef.current.consume = 1.0;
      else if (res.animType === 'use') animPulsesRef.current.use = 1.0;
      else animPulsesRef.current.reach = 1.0;

      if (res.tone === 'err') soundEngine.playAlarm();
      else if (res.animType === 'use') soundEngine.playTool('wrench');
      else soundEngine.playClick();

      if (res.trainingBriefKind) {
        const brief = getStationTrainingBrief(res.trainingBriefKind);
        if (brief) setTrainingBrief(brief);
      }

      if (res.openCrewDialogue) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setCrewDialogue(res.openCrewDialogue);
        setActiveModal('crew_dialogue');
        syncHudNow();
        return;
      }

      if (res.openLaunchTransit) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setLaunchTransitTarget({
          from: res.openLaunchTransit.from,
          to: res.openLaunchTransit.to,
          preserveCarry: true,
        });
        setActiveModal('launch_transit');
        return;
      }

      if (res.advanceMission) {
        enterMission(res.advanceMission, true);
        return;
      }

      if (res.openTerminalModal) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal('terminal');
      } else if (res.openMirrorModal) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal('mirror');
      } else if (res.openCrisisModal) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal('crisis');
      } else if (res.openEngineeringModal) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setEngineeringKind(res.openEngineeringModal);
        setActiveModal('engineering');
      } else if (res.openAscanModal) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setAscanMode(res.openAscanModal);
        setActiveModal('ascan_modal');
      } else if (res.openWallManual) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal('wall_manual');
      } else if (res.openOrionPreflight) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setOrionPreflightMode(res.openOrionPreflight);
        setActiveModal('orion_preflight');
      } else if (res.openLegacyNoteId) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setCodexInit({ tab: 'notes', paperId: 1, noteId: res.openLegacyNoteId });
        setActiveModal('codex');
      } else if (res.openNewspaperId) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setCodexInit({ tab: 'papers', paperId: res.openNewspaperId, noteId: 1 });
        setActiveModal('codex');
      } else if (res.openEndingModal) {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setEndingIdModal(res.openEndingModal);
        setActiveModal('ending');
      }
      pushBanner(lang === 'es' ? res.msgEs : res.msgEn, res.tone);
      syncHudNow();
    }
  }, [enterMission, lang, pushBanner, syncHudNow]);

  // ===========================================================================
  // 1ST-VERSION STYLE ANIMATED PANORAMA CANVAS IN MAIN MENU
  // ===========================================================================
  useEffect(() => {
    if (screen !== 'menu') return;
    const canvas = panoramaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const stars = Array.from({ length: 140 }, (_, i) => ({
      x: (i * 97) % 1000,
      y: (i * 53) % 600,
      size: i % 6 === 0 ? 3 : 2,
      speed: 8 + (i % 5) * 6,
      tint: i % 11 === 0 ? '#38bdf8' : i % 13 === 0 ? '#fbbf24' : '#e2e8f0',
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const t = now * 0.001;
      const w = canvas.width;
      const h = canvas.height;

      // Deep Navy Space Backdrop (#040914 -> #0F2547 horizon glow)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#040812');
      grad.addColorStop(0.55, '#0b1830');
      grad.addColorStop(1, '#102446');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle Blueprint drafting grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 1;
      const step = 44;
      const offsetX = (t * 14) % step;
      for (let gx = -offsetX; gx < w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Crisp pixel stars drifting horizontally
      for (const s of stars) {
        const sx = ((s.x / 1000) * w - t * s.speed + w * 4) % w;
        const sy = (s.y / 600) * h;
        const alpha = 0.45 + 0.5 * Math.sin(t * 2 + s.x);
        ctx.fillStyle = s.tint;
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), s.size, s.size);
      }
      ctx.globalAlpha = 1;

      // Curved Lunar / Mars orbital limb horizon at bottom
      ctx.save();
      ctx.beginPath();
      ctx.arc(w * 0.65, h * 1.92, h * 1.15, Math.PI * 1.15, Math.PI * 1.85);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
      ctx.fillStyle = '#0a1426';
      ctx.fill();
      ctx.restore();

      // Subtle pixel telemetry wave at bottom-left
      const ry = h - 90;
      ctx.strokeStyle = 'rgba(255, 79, 0, 0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, ry - 48, 220, 74);
      ctx.fillStyle = '#FF4F00';
      ctx.fillRect(Math.floor(24 + ((t * 48) % 204)), Math.floor(ry - 12 + Math.sin(t * 4) * 14), 5, 5);

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [screen]);

  // ===========================================================================
  // LIVE 3D CHIBI ASTRONAUT SHOWCASE IN MAIN MENU
  // ===========================================================================
  useEffect(() => {
    if (screen !== 'menu') return;
    const container = menuMountRef.current;
    if (!container) return;

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(320, container.clientHeight);
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(2.35, 1.48, 2.35);
    camera.lookAt(0, 0.92, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const tex = createSpaceTextureSet(renderer);

    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.05));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(3.5, 4.5, 3.0);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const missionAccent =
      AETHER4_MISSIONS.find((m) => m.id === selectedMenuMissionId)?.accentHex ?? '#38bdf8';
    const rimLight = new THREE.PointLight(missionAccent, 5.2, 12);
    rimLight.position.set(-2.0, 2.4, -1.5);
    scene.add(rimLight);

    // Metallic pedestal with PBR bulkhead top + illuminated mission accent ring
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.12, 1.26, 0.24, 36),
      new THREE.MeshStandardMaterial({
        map: tex.metalBulkhead.map,
        bumpMap: tex.metalBulkhead.bumpMap,
        bumpScale: 0.015,
        roughness: 0.35,
        metalness: 0.65,
      })
    );
    pedestal.position.y = -0.12;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.025, 12, 48),
      new THREE.MeshBasicMaterial({ color: missionAccent })
    );
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.005;
    scene.add(glowRing);

    const astronaut: ChibiAstronautRig = createChibiAstronautRig(suitIdx, faceIdx);
    astronaut.root.rotation.y = -0.45;
    scene.add(astronaut.root);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(320, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let rafId = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const timeSec = (now - t0) / 1000;
      astronaut.root.rotation.y = -0.55 + Math.sin(timeSec * 0.45) * 0.35;
      updateChibiAstronautRig(astronaut, {
        timeSec,
        moveSpeedMs: menuPreviewMode === 'walk' ? 4.4 : 0,
        sprinting: menuPreviewMode === 'exercise',
        grounded: true,
        interactPulse: 0,
        usePulse: 0,
        sleeping: false,
        exercising: menuPreviewMode === 'exercise',
        heldItemKey: menuPreviewItem,
        waveMode: menuPreviewMode === 'wave',
      });
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      tex.dispose();
      renderer.dispose();
    };
  }, [faceIdx, menuPreviewItem, menuPreviewMode, screen, selectedMenuMissionId, suitIdx]);

  // ===========================================================================
  // KEYBOARD + MOUSE INPUT BINDINGS IN ROOM MODE
  // ===========================================================================
  useEffect(() => {
    if (screen !== 'room') return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Typing to KATHERINE (mentor chat) must not move the astronaut or trigger actions.
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
      keysRef.current[e.code] = true;
      if (e.code === 'KeyQ') {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal((m) => (m === 'esc_menu' ? null : 'esc_menu'));
      } else if (e.code === 'KeyP') {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal((m) => (m === 'codex' ? null : 'codex'));
      } else if (e.code === 'KeyK') {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal((m) => (m === 'terminal' ? null : 'terminal'));
      } else if (e.code === 'KeyC') {
        ignoreNextUnlockRef.current = true;
        document.exitPointerLock?.();
        setActiveModal((m) => (m === 'mirror' ? null : 'mirror'));
      } else if (e.code === 'KeyV') {
        setCameraMode((prev) => (prev === 'first' ? 'third' : 'first'));
        soundEngine.playClick();
      } else if (e.code === 'KeyG' && !activeModalRef.current) {
        handleThrowHandItem();
      } else if (e.code === 'KeyE' && !activeModalRef.current) {
        if (lookTargetRef.current.kind !== null) {
          handlePrimaryAction();
        } else {
          handleSwapInventory();
        }
      } else if (e.code === 'KeyR' && !activeModalRef.current) {
        handleSwapInventory();
      } else if (e.code === 'KeyB' && !activeModalRef.current) {
        setBackpackOpen((prev) => {
          const next = !prev;
          if (next) {
            ignoreNextUnlockRef.current = true;
            document.exitPointerLock?.();
          }
          soundEngine.playClick();
          return next;
        });
      } else if (
        !activeModalRef.current &&
        (e.code === 'Digit1' ||
          e.code === 'Digit2' ||
          e.code === 'Digit3' ||
          e.code === 'Digit4' ||
          e.code === 'Digit5')
      ) {
        selectHotbarSlot(Number(e.code.replace('Digit', '')) - 1);
      } else if (e.code === 'Enter' && !activeModalRef.current) {
        handlePrimaryAction();
      } else if (e.code === 'Space') {
        jumpQueueRef.current = true;
      }
    };

    const onEscapeCapture = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      if (performance.now() - lastEscOpenMsRef.current < 260) return;
      lastEscOpenMsRef.current = performance.now();
      if (activeModalRef.current !== null) {
        e.preventDefault();
        e.stopPropagation();
        setActiveModal(null);
        return;
      }
      if (document.pointerLockElement !== roomMountRef.current) {
        e.preventDefault();
        setActiveModal('esc_menu');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const onMouseUp = () => {
      isDraggingLookRef.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const locked = document.pointerLockElement === roomMountRef.current;
      if (!locked && !isDraggingLookRef.current) return;
      if (activeModalRef.current) return;
      if (locked && performance.now() - lockAcquiredAtMsRef.current < 65) return;
      if (Math.abs(e.movementX) > 120 || Math.abs(e.movementY) > 120) return;
      const clampedX = Math.max(-45, Math.min(45, e.movementX));
      const clampedY = Math.max(-45, Math.min(45, e.movementY));
      const dYaw = clampedX * 0.095;
      const dPitch = -clampedY * 0.095;
      targetYawRef.current += dYaw;
      targetPitchRef.current = Math.max(-78, Math.min(78, targetPitchRef.current + dPitch));
      lookDeltaRef.current.yaw += dYaw;
      lookDeltaRef.current.pitch += dPitch;
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === roomMountRef.current;
      setPointerLocked(locked);
      if (locked) {
        lockAcquiredAtMsRef.current = performance.now();
      } else {
        isDraggingLookRef.current = false;
        const wasProgrammatic = ignoreNextUnlockRef.current;
        ignoreNextUnlockRef.current = false;
        if (!wasProgrammatic && activeModalRef.current === null) {
          lastEscOpenMsRef.current = performance.now();
          setActiveModal('esc_menu');
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (activeModalRef.current || simRef.current.sleeping) return;
      if (Math.abs(e.deltaY) < 4) return;
      selectHotbarSlot(activeSlotRef.current + (e.deltaY > 0 ? 1 : -1));
    };

    window.addEventListener('keydown', onEscapeCapture, { capture: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel, { passive: true });
    document.addEventListener('pointerlockchange', onPointerLockChange);
    return () => {
      window.removeEventListener('keydown', onEscapeCapture, { capture: true });
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [handlePrimaryAction, handleSwapInventory, handleThrowHandItem, screen, selectHotbarSlot]);

  // ===========================================================================
  // HERMETIC TEXTURED SPACE ROOM SCENE + PER-MISSION 3D HARDWARE + 1P HANDS / 3P RIG
  // ===========================================================================
  useEffect(() => {
    if (screen !== 'room') return;
    const container = roomMountRef.current;
    if (!container) return;

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(320, container.clientHeight);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(PAWN_CONSTANTS.cameraFovDeg, width / height, 0.06, 80);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const tex = createSpaceTextureSet(renderer);

    const wallPaddedMat = new THREE.MeshStandardMaterial({
      map: tex.paddedWall.map,
      bumpMap: tex.paddedWall.bumpMap,
      bumpScale: 0.022,
      roughnessMap: tex.paddedWall.roughnessMap,
      roughness: 0.85,
      metalness: 0.08,
    });
    const wallMetalMat = new THREE.MeshStandardMaterial({
      map: tex.metalBulkhead.map,
      bumpMap: tex.metalBulkhead.bumpMap,
      bumpScale: 0.02,
      roughnessMap: tex.metalBulkhead.roughnessMap,
      roughness: 0.45,
      metalness: 0.62,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: tex.isogridFloor.map,
      bumpMap: tex.isogridFloor.bumpMap,
      bumpScale: 0.018,
      roughnessMap: tex.isogridFloor.roughnessMap,
      roughness: 0.52,
      metalness: 0.55,
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: tex.ceilingPanel.map,
      bumpMap: tex.ceilingPanel.bumpMap,
      bumpScale: 0.015,
      roughnessMap: tex.ceilingPanel.roughnessMap,
      roughness: 0.72,
      metalness: 0.25,
    });
    const bedFabricMat = new THREE.MeshStandardMaterial({
      map: tex.bedFabric.map,
      bumpMap: tex.bedFabric.bumpMap,
      bumpScale: 0.025,
      roughnessMap: tex.bedFabric.roughnessMap,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Dynamic Multi-Module Interior Spectral Lighting
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.95);
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.62);
    const mainLight = new THREE.PointLight(0xf8fafc, 15, 16, 1.35);
    mainLight.position.set(10.0, 3.12, 3.5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);

    const westLight = new THREE.PointLight(0xf8fafc, 14, 14, 1.3);
    westLight.position.set(3.1, 3.05, 3.5);

    const eastLight = new THREE.PointLight(0xf8fafc, 14, 14, 1.3);
    eastLight.position.set(17.2, 3.05, 3.5);

    const northLight = new THREE.PointLight(0xbae6fd, 11, 11, 1.35);
    northLight.position.set(10.0, 3.02, 10.9);

    const southLight = new THREE.PointLight(0xfde68a, 10, 11, 1.35);
    southLight.position.set(10.0, 3.02, -3.2);

    const bunkLamp = new THREE.PointLight(0xfde68a, 3.8, 5.5, 1.6);
    bunkLamp.position.set(0.75, 1.68, 4.8);

    const aphGlowLight = new THREE.PointLight(0xe879f9, 0, 8.5, 1.35);
    aphGlowLight.position.set(18.6, 2.25, 5.8);

    scene.add(hemiLight, ambientLight, mainLight, westLight, eastLight, northLight, southLight, bunkLamp, aphGlowLight);

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);
    const dynamicTextures: THREE.Texture[] = [];

    const addBox = (
      cx: number,
      czUp: number,
      cy: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      shadow = true
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(cx, czUp, cy);
      m.castShadow = shadow;
      m.receiveShadow = true;
      roomGroup.add(m);
      return m;
    };

    const addSignPlate = (text: string, hexColor: string, cx: number, czUp: number, cy: number, rotY: number) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 56;
      const g = c.getContext('2d');
      if (g) {
        g.fillStyle = '#090f1d';
        g.fillRect(0, 0, 256, 56);
        g.strokeStyle = hexColor;
        g.lineWidth = 4;
        g.strokeRect(3, 3, 250, 50);
        g.fillStyle = '#f8fafc';
        g.font = 'bold 21px monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(text, 128, 29);
      }
      const stex = new THREE.CanvasTexture(c);
      stex.colorSpace = THREE.SRGBColorSpace;
      dynamicTextures.push(stex);
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(1.48, 0.32),
        new THREE.MeshBasicMaterial({ map: stex, side: THREE.FrontSide })
      );
      plate.position.set(cx, czUp, cy);
      plate.rotation.y = rotY;
      roomGroup.add(plate);
    };

    const ledCeilMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const whiteFrameMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.45, metalness: 0.25 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.7 });
    const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xd93025, roughness: 0.35, metalness: 0.3 });
    const bluePipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.4 });
    const isprRackMat = new THREE.MeshStandardMaterial({
      map: tex.isprEclssRack,
      roughness: 0.42,
      metalness: 0.58,
    });
    const cbmHatchMat = new THREE.MeshStandardMaterial({
      map: tex.cbmHatchPanel,
      roughness: 0.38,
      metalness: 0.65,
    });
    const cyanLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const greenLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const amberLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Non-overlapping Floors, Ceilings & Zone LED Troffers for all 8 Modules + 7 Corridors
    for (const r of STATION_FLOOR_RECTS) {
      const cx = (r.minX + r.maxX) / 2;
      const cy = (r.minY + r.maxY) / 2;
      const w = r.maxX - r.minX + 0.02;
      const d = r.maxY - r.minY + 0.02;
      addBox(cx, -0.08, cy, w, 0.16, d, floorMat, false);
      addBox(cx, ROOM_BOUNDS.heightM + 0.08, cy, w, 0.16, d, ceilingMat, false);

      const troffer = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(1.6, w * 0.45), 0.05, Math.min(0.65, d * 0.45)),
        ledCeilMat
      );
      troffer.position.set(cx, ROOM_BOUNDS.heightM - 0.02, cy);
      roomGroup.add(troffer);
    }

    // Colored Floor Navigation Stripes along Elongated Corridors
    const stripCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const stripGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const stripOrange = new THREE.MeshBasicMaterial({ color: 0xff4f00 });
    const stripAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const stripPurple = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const stripCrimson = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    addBox(7.2, 0.008, 3.5, 4.6, 0.014, 0.14, stripCyan, false); // West Hab -> Hub
    addBox(12.8, 0.008, 3.5, 4.8, 0.014, 0.14, stripGreen, false); // Hub -> East Lab
    addBox(10.0, 0.008, 7.2, 0.14, 0.014, 5.4, stripOrange, false); // Hub -> North MEDS
    addBox(10.0, 0.008, -0.4, 0.14, 0.014, 6.2, stripAmber, false); // Hub -> South Airlock
    addBox(3.1, 0.008, -1.2, 0.14, 0.014, 3.2, stripCyan, false); // West Hab -> SW NBL Pool
    addBox(19.3, 0.008, 8.2, 0.14, 0.014, 3.2, stripPurple, false); // East Lab -> NE Centrifuge
    addBox(19.3, 0.008, -1.2, 0.14, 0.014, 3.2, stripCrimson, false); // East Lab -> SE Fire Chamber

    // Render Non-overlapping Outer & Interior Bulkhead Partitions directly from colliders (skip Wall_WestHab_N_Win for viewport cutout!)
    for (const b of SPACE_ROOM_COLLIDERS.slice(0, WALL_COLLIDER_COUNT)) {
      if (b[6] === 'Wall_WestHab_N_Win') continue;
      const cx = (b[0] + b[3]) / 2;
      const cy = (b[1] + b[4]) / 2;
      const w = b[3] - b[0];
      const d = b[4] - b[1];
      addBox(cx, 1.7, cy, w, 3.4, d, wallPaddedMat, false);
      addBox(cx, 0.45, cy, w + 0.02, 0.9, d + 0.02, wallMetalMat, true);
    }

    // North West-Hab Wall with Impenetrable Panoramic Viewport Window (X=0..6.45, Y=7.0..7.25, centered X=3.20)
    addBox(0.925, 1.7, 7.12, 1.85, 3.4, 0.25, wallPaddedMat, false);
    addBox(0.925, 0.45, 7.12, 1.88, 0.9, 0.28, wallMetalMat, true);
    addBox(5.50, 1.7, 7.12, 1.90, 3.4, 0.25, wallPaddedMat, false);
    addBox(5.50, 0.45, 7.12, 1.93, 0.9, 0.28, wallMetalMat, true);
    addBox(3.20, 0.525, 7.12, 2.70, 1.05, 0.25, wallMetalMat, true);
    addBox(3.20, 2.975, 7.12, 2.70, 0.85, 0.25, wallPaddedMat, false);
    addBox(3.20, 1.06, 7.04, 2.76, 0.08, 0.34, wallMetalMat);
    addBox(3.20, 2.54, 7.04, 2.76, 0.08, 0.34, wallMetalMat);
    addBox(1.86, 1.80, 7.04, 0.1, 1.5, 0.34, wallMetalMat);
    addBox(4.54, 1.80, 7.04, 0.1, 1.5, 0.34, wallMetalMat);
    addBox(3.20, 1.80, 7.08, 0.07, 1.48, 0.24, wallMetalMat);

    // 14 Portal Lintels + Overhead Signage between Modules and Corridors
    const doorways: Array<{ cx: number; cy: number; alongX: boolean; hex: number; signA: string; signB: string }> = [
      { cx: 6.32, cy: 3.5, alongX: false, hex: 0x38bdf8, signA: 'CORREDOR OESTE →', signB: '← DORM / GALLEY' },
      { cx: 8.28, cy: 3.5, alongX: false, hex: 0x38bdf8, signA: 'NÚCLEO CENTRAL →', signB: '← CORREDOR OESTE' },
      { cx: 11.72, cy: 3.5, alongX: false, hex: 0x22c55e, signA: 'CORREDOR ESTE →', signB: '← NÚCLEO CENTRAL' },
      { cx: 13.68, cy: 3.5, alongX: false, hex: 0x22c55e, signA: 'LAB INGENIERÍA →', signB: '← CORREDOR ESTE' },
      { cx: 10.0, cy: 5.92, alongX: true, hex: 0xff4f00, signA: '↑ CORREDOR NORTE', signB: '↓ NÚCLEO CENTRAL' },
      { cx: 10.0, cy: 8.28, alongX: true, hex: 0xff4f00, signA: '↑ PUENTE MEDS', signB: '↓ CORREDOR NORTE' },
      { cx: 10.0, cy: 1.08, alongX: true, hex: 0xf59e0b, signA: '↑ NÚCLEO CENTRAL', signB: '↓ CORREDOR SUR' },
      { cx: 10.0, cy: -1.28, alongX: true, hex: 0xf59e0b, signA: '↑ CORREDOR SUR', signB: '↓ HANGAR ORION' },
      { cx: 3.10, cy: -0.08, alongX: true, hex: 0x06b6d4, signA: '↑ DORM / GALLEY', signB: '↓ CORREDOR NBL' },
      { cx: 3.10, cy: -2.32, alongX: true, hex: 0x06b6d4, signA: '↑ CORREDOR NBL', signB: '↓ PISCINA NBL' },
      { cx: 19.30, cy: 7.08, alongX: true, hex: 0xa855f7, signA: '↑ CORREDOR 4.5G', signB: '↓ LAB ESTE' },
      { cx: 19.30, cy: 9.32, alongX: true, hex: 0xa855f7, signA: '↑ CENTRÍFUGA 4.5G', signB: '↓ CORREDOR 4.5G' },
      { cx: 19.30, cy: -0.08, alongX: true, hex: 0xf43f5e, signA: '↑ LAB ESTE', signB: '↓ CORREDOR FUEGO 0g' },
      { cx: 19.30, cy: -2.32, alongX: true, hex: 0xf43f5e, signA: '↑ CORREDOR FUEGO 0g', signB: '↓ CÁMARA ISS RACK #2' },
    ];
    for (const dw of doorways) {
      const trimMat = new THREE.MeshBasicMaterial({ color: dw.hex });
      if (dw.alongX) {
        addBox(dw.cx, 2.92, dw.cy, 2.20, 0.96, 0.22, wallMetalMat, false);
        addBox(dw.cx, 2.45, dw.cy, 2.20, 0.06, 0.26, trimMat, false);
        addBox(dw.cx - 1.08, 1.22, dw.cy, 0.08, 2.44, 0.26, darkMetalMat, false);
        addBox(dw.cx + 1.08, 1.22, dw.cy, 0.08, 2.44, 0.26, darkMetalMat, false);
        addSignPlate(dw.signA, `#${dw.hex.toString(16).padStart(6, '0')}`, dw.cx, 2.75, dw.cy - 0.13, Math.PI);
        addSignPlate(dw.signB, `#${dw.hex.toString(16).padStart(6, '0')}`, dw.cx, 2.75, dw.cy + 0.13, 0);
      } else {
        addBox(dw.cx, 2.92, dw.cy, 0.22, 0.96, 2.20, wallMetalMat, false);
        addBox(dw.cx, 2.45, dw.cy, 0.26, 0.06, 2.20, trimMat, false);
        addBox(dw.cx, 1.22, dw.cy - 1.08, 0.26, 2.44, 0.08, darkMetalMat, false);
        addBox(dw.cx, 1.22, dw.cy + 1.08, 0.26, 2.44, 0.08, darkMetalMat, false);
        addSignPlate(dw.signA, `#${dw.hex.toString(16).padStart(6, '0')}`, dw.cx - 0.13, 2.75, dw.cy, -Math.PI / 2);
        addSignPlate(dw.signB, `#${dw.hex.toString(16).padStart(6, '0')}`, dw.cx + 0.13, 2.75, dw.cy, Math.PI / 2);
      }

      // Circular CBM bulkhead flange bezel + manual latch wheel on portal archways
      const archRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 18), darkMetalMat);
      archRing.position.set(dw.cx, 2.52, dw.cy);
      if (!dw.alongX) archRing.rotation.y = Math.PI / 2;
      const wheelBoss = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 6, 12), crimsonMat);
      wheelBoss.position.set(dw.cx + (dw.alongX ? 0.94 : 0), 1.38, dw.cy + (dw.alongX ? 0 : 0.94));
      if (!dw.alongX) wheelBoss.rotation.y = Math.PI / 2;
      roomGroup.add(archRing, wheelBoss);
    }

    // Crisp Pixel-Art 3D Architectural Rib Columns (every ~1.75 m), Kickplates, Perforated Grating & EVA/IVA Handrails
    const ribSpots: Array<[number, number, boolean]> = [
      [1.00, 0.05, true], [5.30, 0.05, true],
      [0.05, 1.75, false], [0.05, 3.50, false], [0.05, 5.25, false],
      [14.75, 0.05, true], [16.50, 0.05, true], [14.75, 6.95, true], [16.50, 6.95, true],
      [20.55, 1.75, false], [20.55, 3.50, false], [20.55, 5.25, false],
      [7.25, 9.60, false], [7.25, 11.40, false], [12.75, 9.60, false], [12.75, 11.40, false],
      [6.85, -2.50, false], [6.85, -4.25, false], [13.15, -2.50, false], [13.15, -4.25, false],
      [15.25, -3.50, false], [15.25, -5.25, false], [21.75, -3.50, false], [21.75, -5.25, false],
    ];
    for (const [rx, ry, alongX] of ribSpots) {
      addBox(rx, 1.70, ry, alongX ? 0.14 : 0.12, 3.35, alongX ? 0.12 : 0.14, darkMetalMat, false);
      addBox(rx, 0.10, ry, alongX ? 1.55 : 0.16, 0.20, alongX ? 0.16 : 1.55, darkMetalMat, false);
      addBox(rx, 3.30, ry, alongX ? 1.55 : 0.16, 0.16, alongX ? 0.16 : 1.55, darkMetalMat, false);
    }

    // Continuous EVA/IVA Wall Handrails mounted flush along solid bulkhead walls (never crossing corridors or room centers)
    const evaHandrailRuns: Array<[number, number, number, boolean, THREE.Material]> = [
      [7.30, 4.52, 1.5, true, bluePipeMat],
      [7.30, 2.48, 1.5, true, crimsonMat],
      [12.70, 4.52, 1.5, true, bluePipeMat],
      [12.70, 2.48, 1.5, true, crimsonMat],
      [8.98, 7.10, 1.8, false, bluePipeMat],
      [11.02, 7.10, 1.8, false, crimsonMat],
      [8.98, -0.10, 1.8, false, crimsonMat],
      [11.02, -0.10, 1.8, false, bluePipeMat],
      [15.90, 6.92, 3.6, true, bluePipeMat],
      [7.28, 10.90, 3.6, false, bluePipeMat],
      [12.72, 10.90, 3.6, false, crimsonMat],
      [13.12, -4.80, 4.2, false, crimsonMat],
    ];
    for (const [hx, hy, hLen, alongX, railMat] of evaHandrailRuns) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, hLen, 8), railMat);
      bar.rotation.z = alongX ? Math.PI / 2 : 0;
      bar.rotation.x = alongX ? 0 : Math.PI / 2;
      bar.position.set(hx, 1.06, hy);
      roomGroup.add(bar);
    }
    const floorConduitMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65, metalness: 0.78 });
    addBox(10.0, 0.004, 3.5, 1.15, 0.01, 4.0, floorConduitMat, false);
    addBox(17.2, 0.004, 3.5, 1.10, 0.01, 5.2, floorConduitMat, false);
    addBox(18.5, 0.004, -5.2, 1.10, 0.01, 4.4, floorConduitMat, false);

    // 4 Animated Automatic Sliding Bulkhead Doors inside Corridors
    const doorVisuals: Array<{
      id: string;
      axis: 'x' | 'y';
      cx: number;
      cy: number;
      leafA: THREE.Group;
      leafB: THREE.Group;
      ledMat: THREE.MeshBasicMaterial;
    }> = [];
    for (const d of simRef.current.doors) {
      const leafA = new THREE.Group();
      const leafB = new THREE.Group();
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const glassStripMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      if (d.axis === 'x') {
        addBox(d.x, 2.92, d.y, 0.20, 0.96, 2.20, wallMetalMat, false);
        const pA = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.40, 1.08), wallMetalMat);
        const gA = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.90, 0.18), glassStripMat);
        gA.position.set(0, 0.15, 0.34);
        leafA.add(pA, gA);
        const pB = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.40, 1.08), wallMetalMat);
        const gB = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.90, 0.18), glassStripMat);
        gB.position.set(0, 0.15, -0.34);
        leafB.add(pB, gB);
        leafA.position.set(d.x, 1.20, d.y - 0.54);
        leafB.position.set(d.x, 1.20, d.y + 0.54);
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.36), ledMat);
        led.position.set(d.x, 2.50, d.y);
        roomGroup.add(leafA, leafB, led);
      } else {
        addBox(d.x, 2.92, d.y, 2.20, 0.96, 0.20, wallMetalMat, false);
        const pA = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.40, 0.11), wallMetalMat);
        const gA = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.90, 0.13), glassStripMat);
        gA.position.set(0.34, 0.15, 0);
        leafA.add(pA, gA);
        const pB = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.40, 0.11), wallMetalMat);
        const gB = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.90, 0.13), glassStripMat);
        gB.position.set(-0.34, 0.15, 0);
        leafB.add(pB, gB);
        leafA.position.set(d.x - 0.54, 1.20, d.y);
        leafB.position.set(d.x + 0.54, 1.20, d.y);
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.24), ledMat);
        led.position.set(d.x, 2.50, d.y);
        roomGroup.add(leafA, leafB, led);
      }
      doorVisuals.push({ id: d.id, axis: d.axis, cx: d.x, cy: d.y, leafA, leafB, ledMat });
    }

    // 7 Rotating Ceiling Ventilation Fans (Environmental Life across all wings!)
    const ventFans: THREE.Group[] = [];
    for (const [fx, fy] of [
      [3.1, 3.5],
      [10.0, 3.5],
      [17.2, 3.5],
      [10.0, 10.9],
      [2.8, -5.4],
      [18.8, 12.3],
      [18.5, -5.3],
    ]) {
      const fanHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), darkMetalMat);
      fanHousing.position.set(fx, ROOM_BOUNDS.heightM - 0.06, fy);
      roomGroup.add(fanHousing);
      const rotor = new THREE.Group();
      rotor.position.set(fx, ROOM_BOUNDS.heightM - 0.11, fy);
      const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.015, 0.07), whiteFrameMat);
      const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.54), whiteFrameMat);
      rotor.add(bladeA, bladeB);
      roomGroup.add(rotor);
      ventFans.push(rotor);
    }

    // 240 Subtle Drifting Cabin Airflow Motes across 8 Modules
    const moteCount = 240;
    const motePositions = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePositions[i * 3 + 0] = 0.2 + ((i * 73) % 212) * 0.1;
      motePositions[i * 3 + 1] = 0.25 + ((i * 41) % 28) * 0.1;
      motePositions[i * 3 + 2] = -7.8 + ((i * 59) % 224) * 0.1;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.028, transparent: true, opacity: 0.45 });
    const airMotes = new THREE.Points(moteGeo, moteMat);
    roomGroup.add(airMotes);

    // Exterior Viewport Scene centered at X=3.20: Earth Daylight Base (Phase 0) vs Deep Space / Moon / Mars (Phases 1-4)
    const launchRocketGroup = new THREE.Group();
    const srbL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.72, 12),
      new THREE.MeshBasicMaterial({ color: 0xd93025, wireframe: true })
    );
    const srbR = srbL.clone();
    if (activeMissionKey === 'tutorial_hab') {
      const skyC = document.createElement('canvas');
      skyC.width = 256;
      skyC.height = 128;
      const sg = skyC.getContext('2d');
      if (sg) {
        const grad = sg.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.65, '#7dd3fc');
        grad.addColorStop(1, '#e0f2fe');
        sg.fillStyle = grad;
        sg.fillRect(0, 0, 256, 128);
        sg.fillStyle = 'rgba(255,255,255,0.75)';
        sg.fillRect(28, 34, 48, 14);
        sg.fillRect(156, 22, 62, 16);
      }
      const skyTex = new THREE.CanvasTexture(skyC);
      skyTex.colorSpace = THREE.SRGBColorSpace;
      dynamicTextures.push(skyTex);
      const earthSky = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.4), new THREE.MeshBasicMaterial({ map: skyTex }));
      earthSky.position.set(3.2, 2.3, 11.4);
      earthSky.rotation.y = Math.PI;
      const earthLawn = new THREE.Mesh(
        new THREE.PlaneGeometry(10.0, 6.0),
        new THREE.MeshBasicMaterial({ color: 0x15803d, side: THREE.DoubleSide })
      );
      earthLawn.rotation.x = Math.PI / 2;
      earthLawn.position.set(3.2, 0.0, 9.6);
      const padConcrete = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.4), whiteFrameMat);
      padConcrete.position.set(3.2, 0.05, 9.2);
      const distantTower = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.2, 0.32), crimsonMat);
      distantTower.position.set(4.4, 1.1, 10.1);
      roomGroup.add(earthSky, earthLawn, padConcrete, distantTower);
      launchRocketGroup.visible = false;
    } else {
      const vistaBackdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(6.8, 3.4),
        new THREE.MeshBasicMaterial({ map: tex.spaceBackdrop })
      );
      vistaBackdrop.position.set(3.2, 1.9, 8.65);
      vistaBackdrop.rotation.y = Math.PI;
      roomGroup.add(vistaBackdrop);

      const exteriorPlanet = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 28, 20),
        new THREE.MeshStandardMaterial({
          color:
            activeMissionKey === 'act3_greenhouse'
              ? 0x9a3412
              : activeMissionKey === 'manifest_launch'
              ? 0x1d4ed8
              : 0x475569,
          roughness: 0.7,
        })
      );
      exteriorPlanet.position.set(3.2, -0.5, 10.2);
      roomGroup.add(exteriorPlanet);

      launchRocketGroup.visible = activeMissionKey === 'manifest_launch';
      launchRocketGroup.position.set(3.2, 1.45, 7.95);
      const coreTank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.95, 16),
        new THREE.MeshBasicMaterial({ color: 0xf4f6f8 })
      );
      srbL.position.set(-0.22, -0.08, 0);
      srbR.position.set(0.22, -0.08, 0);
      launchRocketGroup.add(coreTank, srbL, srbR);
      roomGroup.add(launchRocketGroup);
    }

    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.66, 1.44),
      new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.16,
        roughness: 0.05,
        metalness: 0.2,
        side: THREE.DoubleSide,
      })
    );
    windowGlass.position.set(3.2, 1.80, 7.10);
    roomGroup.add(windowGlass);

    const shutterLeft = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.45, 0.06), wallMetalMat);
    shutterLeft.position.set(1.55, 1.80, 7.02);
    const shutterRight = shutterLeft.clone();
    shutterRight.position.set(4.85, 1.80, 7.02);
    roomGroup.add(shutterLeft, shutterRight);

    // Switches in West Hab
    addBox(0.06, 1.32, 3.45, 0.08, 0.24, 0.18, darkMetalMat);
    const lightBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.10, 0.10), cyanLedMat);
    lightBtnMesh.position.set(0.11, 1.32, 3.45);
    roomGroup.add(lightBtnMesh);

    addBox(1.95, 1.32, 6.94, 0.20, 0.24, 0.08, darkMetalMat);
    const shutterBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.05), greenLedMat);
    shutterBtnMesh.position.set(1.95, 1.32, 6.89);
    roomGroup.add(shutterBtnMesh);

    // =========================================================================
    // WEST HAB FURNITURE & STATIONS (0..6.2, 0..7.0)
    // =========================================================================
    // Bunk Bed (0.68, 4.85)
    addBox(0.68, 0.28, 4.85, 1.24, 0.56, 2.06, wallMetalMat);
    addBox(0.68, 0.65, 4.85, 1.18, 0.22, 1.98, bedFabricMat);
    addBox(0.68, 0.80, 5.58, 0.92, 0.14, 0.38, whiteFrameMat);
    addBox(0.14, 1.32, 4.85, 0.22, 1.48, 2.08, wallMetalMat);
    addBox(0.68, 2.15, 4.85, 1.22, 0.12, 2.08, wallMetalMat);

    // Galley Counter (0.50, 1.95)
    addBox(0.50, 0.46, 1.95, 0.95, 0.92, 1.75, wallMetalMat);
    addBox(0.45, 1.12, 2.52, 0.42, 0.36, 0.36, whiteFrameMat);
    addBox(0.45, 1.15, 1.95, 0.38, 0.42, 0.32, bluePipeMat);
    const heaterPadMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    const heaterPad = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.38), heaterPadMat);
    heaterPad.position.set(0.45, 1.06, 1.38);
    roomGroup.add(heaterPad);

    // West North Desk (3.20, 6.60)
    addBox(3.20, 0.45, 6.60, 2.10, 0.90, 0.62, wallMetalMat);
    addBox(3.20, 1.22, 6.64, 0.72, 0.44, 0.08, darkMetalMat);
    const westScreen = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.36, 0.02), cyanLedMat);
    westScreen.position.set(3.20, 1.22, 6.59);
    roomGroup.add(westScreen);

    // Treadmill (`2.25, 5.05`) & WHC Booth (`5.35, 6.58`) in West Hab
    addBox(2.25, 0.08, 5.05, 0.72, 0.14, 1.38, darkMetalMat);
    const treadmillBeltMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.03, 1.18), treadmillBeltMat);
    belt.position.set(2.25, 0.16, 5.05);
    roomGroup.add(belt);
    addBox(1.94, 0.56, 5.58, 0.06, 0.96, 0.06, whiteFrameMat);
    addBox(2.56, 0.56, 5.58, 0.06, 0.96, 0.06, whiteFrameMat);
    addBox(2.25, 1.05, 5.58, 0.68, 0.18, 0.18, darkMetalMat);

    // WHC Booth (`5.35, 6.58`)
    addBox(5.35, 1.12, 6.58, 0.96, 2.22, 0.54, wallMetalMat);
    const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 16, 1, true), whiteFrameMat);
    funnel.rotation.x = Math.PI;
    funnel.position.set(5.35, 1.05, 6.22);
    const whcHose = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 10), bluePipeMat);
    whcHose.rotation.z = 0.45;
    whcHose.position.set(5.12, 1.25, 6.24);
    roomGroup.add(funnel, whcHose);

    // EVA Suit Mirror & Locker along East wall of West Hab (`5.75, 0.78..1.45`)
    addBox(5.72, 0.14, 1.25, 0.75, 0.28, 1.55, wallMetalMat);
    addBox(6.14, 1.35, 1.45, 0.08, 2.05, 1.05, darkMetalMat);
    const mirrorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 1.90),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.24, roughness: 0.05, metalness: 0.9 })
    );
    mirrorGlass.rotation.y = -Math.PI / 2;
    mirrorGlass.position.set(6.08, 1.35, 1.45);
    roomGroup.add(mirrorGlass);
    addBox(5.75, 1.35, 0.68, 0.60, 1.85, 0.46, whiteFrameMat);
    const evaStrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.65, 0.09), crimsonMat);
    evaStrip.position.set(5.44, 1.35, 0.68);
    roomGroup.add(evaStrip);

    const mirrorAstronaut: ChibiAstronautRig = createChibiAstronautRig(suitIdx, faceIdx);
    mirrorAstronaut.root.position.set(5.48, 0.28, 1.45);
    mirrorAstronaut.root.rotation.y = Math.PI;
    scene.add(mirrorAstronaut.root);

    // =========================================================================
    // CENTRAL HUB BENCH & CRISIS TERMINAL (`8.65, 5.24`)
    // =========================================================================
    addBox(8.65, 0.46, 5.24, 0.46, 0.92, 1.04, wallMetalMat);
    addBox(8.46, 1.15, 5.15, 0.10, 0.46, 0.56, darkMetalMat);
    const crisisScr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.46), amberLedMat);
    crisisScr.position.set(8.52, 1.15, 5.15);
    roomGroup.add(crisisScr);

    // =========================================================================
    // EAST ENGINEERING & BOTANY LAB (`13.8..20.6, 0..7`)
    // =========================================================================
    // Center Lab Workbench (`17.35, 3.55`)
    addBox(17.35, 0.46, 3.55, 1.60, 0.92, 1.00, wallMetalMat);
    addBox(17.35, 0.925, 3.55, 1.42, 0.015, 0.82, new THREE.MeshStandardMaterial({ color: 0x0f2547, roughness: 0.8 }), false);

    // East Wall Power Rack (`20.14, 4.92`) & Thermal Rack (`20.14, 2.25`)
    addBox(20.14, 1.05, 4.92, 0.86, 2.1, 2.0, wallMetalMat);
    addBox(20.14, 1.05, 2.25, 0.86, 2.1, 2.4, wallMetalMat);
    // South Wall ECLSS Rack (`16.10, 0.48`) — clear of X=18.2..20.4 SE doorway
    addBox(16.10, 1.05, 0.48, 3.60, 2.1, 0.72, wallMetalMat);
    // North Wall Botany / KRUSTY Rack (`16.05, 6.52`) — clear of X=18.2..20.4 NE doorway
    addBox(16.05, 1.05, 6.52, 3.60, 2.1, 0.68, wallMetalMat);

    // Dynamic Hardware Indicators inside East Lab
    const chargerBayMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    const powerBoxLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leverPivot = new THREE.Group();
    const screwMeshes: THREE.Mesh[] = [];
    let skylabPatchMesh: THREE.Mesh | null = null;
    let regolithDoorMesh: THREE.Mesh | null = null;
    let compostWheelMesh: THREE.Mesh | null = null;
    const holoOrbiters: THREE.Mesh[] = [];

    if (activeMissionKey === 'tutorial_hab' || activeMissionKey === 'act1_2_surface') {
      const chargerBay = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.22), chargerBayMat);
      chargerBay.position.set(19.70, 1.08, 5.45);
      roomGroup.add(chargerBay);
    }
    if (activeMissionKey === 'tutorial_hab') {
      const powerBoxLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.26), powerBoxLedMat);
      powerBoxLed.position.set(19.70, 1.48, 4.85);
      roomGroup.add(powerBoxLed);

      leverPivot.position.set(19.70, 1.30, 4.22);
      const leverRod = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.05), amberLedMat);
      leverRod.position.x = -0.10;
      leverPivot.add(leverRod);
      leverPivot.rotation.z = -0.55;
      roomGroup.add(leverPivot);

      const ventGrille = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.05), darkMetalMat);
      ventGrille.position.set(16.20, 1.35, 0.86);
      roomGroup.add(ventGrille);
      for (const [sx, sy] of [
        [-0.22, -0.22],
        [0.22, -0.22],
        [-0.22, 0.22],
        [0.22, 0.22],
      ]) {
        const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 10), amberLedMat);
        sc.rotation.x = Math.PI / 2;
        sc.position.set(16.20 + sx, 1.35 + sy, 0.89);
        roomGroup.add(sc);
        screwMeshes.push(sc);
      }
      const regenDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.56, 18), bluePipeMat);
      regenDrum.position.set(17.55, 1.15, 0.84);
      roomGroup.add(regenDrum);
    } else if (activeMissionKey === 'act1_2_surface') {
      const breachGlow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.68), crimsonMat);
      breachGlow.position.set(19.70, 1.35, 2.05);
      roomGroup.add(breachGlow);
      skylabPatchMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.78, 0.74),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.25 })
      );
      skylabPatchMesh.position.set(19.68, 1.35, 2.05);
      skylabPatchMesh.visible = false;
      roomGroup.add(skylabPatchMesh);

      const krustyCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.42, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f, roughness: 0.3, metalness: 0.7 })
      );
      krustyCore.position.set(17.15, 1.15, 6.16);
      const radUmbrella = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.14, 14), darkMetalMat);
      radUmbrella.rotation.x = Math.PI;
      radUmbrella.position.set(17.15, 1.42, 6.16);
      roomGroup.add(krustyCore, radUmbrella);

      for (const sx of [15.26, 15.54]) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), cyanLedMat);
        bulb.position.set(sx, 1.32, 0.88);
        roomGroup.add(bulb);
      }
    } else if (activeMissionKey === 'act3_greenhouse') {
      const aphFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.18, 1.72),
        new THREE.MeshStandardMaterial({
          map: tex.aphBotanicalRack,
          emissiveMap: tex.aphBotanicalRack,
          emissive: new THREE.Color(0xf0abfc),
          emissiveIntensity: 0.75,
          roughness: 0.35,
        })
      );
      aphFace.rotation.y = Math.PI;
      aphFace.position.set(17.05, 1.22, 6.15);
      roomGroup.add(aphFace);

      compostWheelMesh = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.032, 10, 18), crimsonMat);
      compostWheelMesh.position.set(15.60, 1.35, 6.15);
      roomGroup.add(compostWheelMesh);

      const bioTank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.85, 20),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55, roughness: 0.1 })
      );
      bioTank.position.set(19.70, 1.36, 1.35);
      roomGroup.add(bioTank);
    } else if (activeMissionKey === 'act4_storm_rover') {
      regolithDoorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1.95, 1.78),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.2 })
      );
      regolithDoorMesh.position.set(19.68, 2.55, 2.65);
      roomGroup.add(regolithDoorMesh);
    }

    // =========================================================================
    // NORTH MEDS FLIGHT DECK (`7.2..12.8, 8.4..13.4`)
    // =========================================================================
    addBox(10.00, 0.46, 12.95, 3.45, 0.92, 0.72, wallMetalMat);
    addBox(10.00, 0.46, 10.80, 2.25, 0.92, 0.86, wallMetalMat);
    addBox(10.00, 1.26, 13.02, 2.05, 0.62, 0.12, darkMetalMat);
    const medsFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.94, 0.54),
      new THREE.MeshStandardMaterial({
        map: tex.medsGlassCockpit,
        emissiveMap: tex.medsGlassCockpit,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.68,
        roughness: 0.25,
      })
    );
    medsFace.rotation.y = Math.PI;
    medsFace.position.set(10.00, 1.26, 12.94);
    roomGroup.add(medsFace);

    if (activeMissionKey === 'manifest_launch') {
      const launchPad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.07, 16), crimsonMat);
      launchPad.position.set(10.00, 0.96, 12.60);
      roomGroup.add(launchPad);
      for (const [hx, col] of [
        [9.25, 0x38bdf8],
        [10.00, 0xf59e0b],
        [10.75, 0x22c55e],
      ] as [number, number][]) {
        const orb = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14, 0),
          new THREE.MeshBasicMaterial({ color: col, wireframe: true })
        );
        orb.position.set(hx, 1.15, 10.80);
        roomGroup.add(orb);
        holoOrbiters.push(orb);
      }
    }

    // =========================================================================
    // SOUTH HANGAR: WALKABLE 3D ORION CREW MODULE (`6.8..13.2, -8.2..-1.4`)
    // =========================================================================
    const hatchStatusLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const orionFaultLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const orionPowerLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const orionTileMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.45 });
    const orionShellMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.4 });
    // Port & Starboard pressure fuselage walls matching Furn_OrionHull_W/E
    addBox(7.535, 1.32, -6.365, 1.43, 2.64, 3.63, orionShellMat);
    addBox(12.465, 1.32, -6.365, 1.43, 2.64, 3.63, orionShellMat);
    // Thermal TPS base ring + aft bulkhead + walkable capsule ceiling canopy
    addBox(10.00, 2.68, -6.365, 5.20, 0.24, 3.65, orionTileMat, false);
    addBox(10.00, 1.32, -8.04, 3.50, 2.64, 0.28, darkMetalMat, false);
    // Overhead docking ring archway over capsule entry (Z=-4.55, clearance Y=2.22m so astronaut walks inside!)
    addBox(10.00, 2.50, -4.55, 3.55, 0.56, 0.28, orionTileMat, false);
    const orionRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.09, 12, 32), amberLedMat);
    orionRing.position.set(10.00, 1.68, -4.46);
    roomGroup.add(orionRing);

    // Port Console (`orion_fault_panel` at 8.82, -6.10): Cryo Manifold + RS-25 Fuse Box
    addBox(8.515, 0.60, -6.15, 0.53, 1.20, 1.80, wallMetalMat);
    const cryoManifold = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.62, 12), cyanLedMat);
    cryoManifold.position.set(8.68, 1.26, -6.30);
    const orionFaultLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.26), orionFaultLedMat);
    orionFaultLed.position.set(8.78, 1.36, -6.10);
    roomGroup.add(cryoManifold, orionFaultLed);

    // Starboard Console (`orion_power_panel` at 11.18, -6.10): Overhead Switch Bus + Supply Gauges
    addBox(11.485, 0.60, -6.15, 0.53, 1.20, 1.80, wallMetalMat);
    const orionPowerLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.26), orionPowerLedMat);
    orionPowerLed.position.set(11.22, 1.36, -6.10);
    const hatchLed = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), hatchStatusLedMat);
    hatchLed.position.set(10.00, 2.25, -4.40);
    roomGroup.add(orionPowerLed, hatchLed);

    // Forward Reclined Commander Seat (`orion_pilot_seat` at 10.00, -7.12) + 3-Panel MEDS Glass Cockpit
    addBox(10.00, 0.36, -7.56, 0.92, 0.72, 0.64, darkMetalMat);
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.88, 0.14), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 }));
    seatBack.rotation.x = 0.24;
    seatBack.position.set(10.00, 0.96, -7.72);
    const orionMedsPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.90, 0.60),
      new THREE.MeshStandardMaterial({
        map: tex.medsGlassCockpit,
        emissiveMap: tex.medsGlassCockpit,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.78,
        roughness: 0.2,
      })
    );
    orionMedsPanel.position.set(10.00, 1.48, -7.86);
    roomGroup.add(seatBack, orionMedsPanel);
    addSignPlate('CABINA ORION · PRE-VUELO Y DESPEGUE', '#ff4f00', 10.00, 2.52, -4.38, 0);

    // =========================================================================
    // SOUTHWEST WING: NBL IMMERSION POOL & EVA PREP (`-0.4..5.8, -8.4..-2.4`)
    // =========================================================================
    const nblLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    // Pool outer concrete/steel basin (`Furn_NBL_PoolBasin` [0.15..-7.85 .. 3.65..-4.35])
    addBox(1.90, 0.42, -6.10, 3.50, 0.84, 3.50, wallMetalMat);
    const nblWater = new THREE.Mesh(
      new THREE.PlaneGeometry(3.15, 3.15),
      new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, emissive: 0x0369a1, emissiveIntensity: 0.35, transparent: true, opacity: 0.68, roughness: 0.12 })
    );
    nblWater.rotation.x = -Math.PI / 2;
    nblWater.position.set(1.90, 0.85, -6.10);
    // Submerged yellow ISS truss structure visible inside NBL pool
    const nblTruss = new THREE.Mesh(
      new THREE.BoxGeometry(1.80, 0.26, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45, metalness: 0.4 })
    );
    nblTruss.position.set(1.90, 0.48, -6.10);
    nblTruss.rotation.y = 0.42;
    roomGroup.add(nblWater, nblTruss);
    const nblBubbles: THREE.Mesh[] = [];
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.72 });
    for (let bi = 0; bi < 10; bi++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (bi % 3) * 0.012, 8, 8), bubbleMat);
      b.position.set(1.1 + ((bi * 37) % 16) * 0.1, 0.35 + (bi % 5) * 0.11, -6.9 + ((bi * 53) % 16) * 0.1);
      roomGroup.add(b);
      nblBubbles.push(b);
    }
    // NBL Diver Telemetry Podium (`3.85, -4.25`) + EVA Tool Prep Bench (`5.35, -6.32`)
    addBox(5.35, 0.46, -6.32, 0.80, 0.92, 2.25, wallMetalMat);
    addBox(3.85, 0.56, -4.25, 0.65, 1.12, 0.55, darkMetalMat);
    const nblBeaconLed = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.06), nblLedMat);
    nblBeaconLed.position.set(3.85, 1.24, -4.25);
    roomGroup.add(nblBeaconLed);
    addSignPlate('PISCINA NBL HOUSTON · 61.5×31.1×12.2 m', '#06b6d4', 3.10, 2.55, -2.55, 0);

    // =========================================================================
    // NORTHEAST WING: NASA FORMULA DESK & 4.5G CENTRIFUGE (`15.6..22.0, 9.4..15.2`)
    // =========================================================================
    const cenLedMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    // Compute Desk & Supply Rack
    addBox(16.05, 0.475, 12.85, 0.80, 0.95, 2.90, wallMetalMat);
    addBox(21.55, 0.46, 10.55, 0.80, 0.92, 1.80, wallMetalMat);
    // NASA Wall Chalkboard at X=15.66 showing official orbital/solar/hydrostatic formulas + Wall Manual
    const boardC = document.createElement('canvas');
    boardC.width = 512;
    boardC.height = 256;
    const bg = boardC.getContext('2d');
    if (bg) {
      bg.fillStyle = '#0f172a';
      bg.fillRect(0, 0, 512, 256);
      bg.strokeStyle = '#38bdf8';
      bg.lineWidth = 5;
      bg.strokeRect(8, 8, 496, 240);
      bg.fillStyle = '#7dd3fc';
      bg.font = 'bold 24px monospace';
      bg.fillText('NASA JSC · ECUACIONES VERIFICADAS', 22, 42);
      bg.fillStyle = '#e2e8f0';
      bg.font = 'bold 21px monospace';
      bg.fillText('1) I = I₀ / r²  → 1361 / 1.524² = 586 W/m²', 22, 92);
      bg.fillText('2) P = ρ · g · h → ~4860 Pa (NBL 0.50 m)', 22, 134);
      bg.fillText('3) Δv = Isp · g₀ · ln(m₀/mf) = 4,061 m/s', 22, 176);
      bg.fillStyle = '#facc15';
      bg.font = 'bold 18px monospace';
      bg.fillText('[E] LEER MANUAL COMPLETO / EXAMEN CÓMPUTO', 22, 224);
    }
    const boardTex = new THREE.CanvasTexture(boardC);
    boardTex.colorSpace = THREE.SRGBColorSpace;
    dynamicTextures.push(boardTex);
    const formulaBoardMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 1.25),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    formulaBoardMesh.rotation.y = Math.PI / 2;
    formulaBoardMesh.position.set(15.72, 1.82, 12.60);
    roomGroup.add(formulaBoardMesh);

    // 4.5 G Centrifuge Pedestal (`19.75, 12.95`) + Rotating Boom & Gondola
    addBox(19.75, 0.24, 12.95, 2.25, 0.48, 2.25, darkMetalMat);
    const cenCoreLed = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.42, 16), cenLedMat);
    cenCoreLed.position.set(19.75, 0.68, 12.95);
    roomGroup.add(cenCoreLed);
    const centrifugeBoom = new THREE.Group();
    centrifugeBoom.position.set(19.75, 1.02, 12.95);
    const boomArm = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.14, 0.18), whiteFrameMat);
    const gondola = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xff4f00, roughness: 0.3, metalness: 0.45 })
    );
    gondola.position.x = 1.15;
    centrifugeBoom.add(boomArm, gondola);
    roomGroup.add(centrifugeBoom);
    addSignPlate('LAB CÓMPUTO & CENTRÍFUGA 4.5 G', '#a855f7', 19.30, 2.55, 9.55, Math.PI);

    // =========================================================================
    // SOUTHEAST WING: ISS 0g FIRE RACK #2 & STORAGE (`15.2..21.8, -8.2..-2.4`)
    // =========================================================================
    const fireLedMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    addBox(18.90, 1.075, -7.45, 2.50, 2.15, 1.00, wallMetalMat); // Furn_SE_FireRack2
    addBox(15.65, 0.46, -5.75, 0.80, 0.92, 2.90, wallMetalMat); // Furn_SE_StorageRackW
    addBox(21.35, 0.46, -4.50, 0.80, 0.92, 2.20, wallMetalMat); // Furn_SE_StorageRackE
    const fireLedMesh = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.12, 0.08), fireLedMat);
    fireLedMesh.position.set(18.90, 1.92, -6.92);
    roomGroup.add(fireLedMesh);
    const fireGlowGroup = new THREE.Group();
    fireGlowGroup.position.set(18.90, 1.18, -6.90);
    for (let fi = 0; fi < 4; fi++) {
      const fOrb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11 + (fi % 2) * 0.05, 0),
        new THREE.MeshBasicMaterial({ color: fi % 2 === 0 ? 0xf97316 : 0xef4444, wireframe: true })
      );
      fOrb.position.set((fi - 1.5) * 0.22, (fi % 2) * 0.16, 0.04);
      fireGlowGroup.add(fOrb);
    }
    roomGroup.add(fireGlowGroup);
    addSignPlate('CÁMARA INCENDIO 0g ISS RACK #2', '#f43f5e', 19.30, 2.55, -2.55, 0);

    // =========================================================================
    // NODE 3 ECLSS MACHINE RACKS, MBSU/RPCM 120V DC PANEL, QUEST AIRLOCK & HISTORICAL 3D PROPS
    // =========================================================================
    const ogaLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const wrsLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cdraLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const atcsLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const airlockLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const a13CryoLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const stsConsoleLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const rpcmLedMats: THREE.MeshBasicMaterial[] = [
      new THREE.MeshBasicMaterial({ color: 0x22c55e }),
      new THREE.MeshBasicMaterial({ color: 0x22c55e }),
      new THREE.MeshBasicMaterial({ color: 0x22c55e }),
      new THREE.MeshBasicMaterial({ color: 0x22c55e }),
      new THREE.MeshBasicMaterial({ color: 0x22c55e }),
    ];

    // OGA O2 Rack (15.65, -4.20) + Suit Umbilical Hose
    addBox(15.65, 1.38, -4.20, 0.44, 0.96, 0.64, isprRackMat);
    const ogaLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.24), ogaLedMat);
    ogaLed.position.set(15.90, 1.56, -4.20);
    const ogaHose = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), cyanLedMat);
    ogaHose.position.set(15.95, 1.08, -4.20);
    roomGroup.add(ogaLed, ogaHose);

    // WRS Potable Water Rack (15.65, -7.10)
    addBox(15.65, 1.38, -7.10, 0.44, 0.96, 0.64, isprRackMat);
    const wrsLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.24), wrsLedMat);
    wrsLed.position.set(15.90, 1.52, -7.10);
    roomGroup.add(wrsLed);

    // CDRA + Sabatier 400C Reactor (17.35, -7.25)
    addBox(17.35, 1.15, -7.45, 0.72, 1.80, 0.46, isprRackMat);
    const sabatierCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.54, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.75 })
    );
    sabatierCore.position.set(17.35, 1.28, -7.14);
    const cdraLed = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.06), cdraLedMat);
    cdraLed.position.set(17.35, 1.72, -7.18);
    roomGroup.add(sabatierCore, cdraLed);

    // MBSU / RPCM 120V DC Breaker Panel (21.25, -6.20) with 5 individual bus indicators
    addBox(21.25, 1.35, -6.20, 0.42, 1.05, 0.76, isprRackMat);
    for (let bi = 0; bi < 5; bi++) {
      const bLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.10, 0.09), rpcmLedMats[bi]);
      bLed.position.set(21.02, 1.48, -6.44 + bi * 0.12);
      roomGroup.add(bLed);
    }

    // ATCS Ammonia Thermal Loop Valve + Handwheel (21.25, -3.50)
    addBox(21.25, 1.35, -3.50, 0.42, 0.96, 0.64, isprRackMat);
    const atcsLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.24), atcsLedMat);
    atcsLed.position.set(21.02, 1.60, -3.50);
    const atcsWheelMesh = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 8, 16), bluePipeMat);
    atcsWheelMesh.rotation.y = Math.PI / 2;
    atcsWheelMesh.position.set(20.96, 1.24, -3.50);
    roomGroup.add(atcsLed, atcsWheelMesh);

    // Quest Airlock CBM Bezel + MPEV Handwheel + Pressure LED (12.95, -2.55)
    addBox(13.02, 1.28, -2.55, 0.34, 1.45, 0.95, cbmHatchMat);
    const mpevWheelMesh = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 16), crimsonMat);
    mpevWheelMesh.rotation.y = Math.PI / 2;
    mpevWheelMesh.position.set(12.82, 1.18, -2.55);
    const airlockLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.32), airlockLedMat);
    airlockLed.position.set(12.82, 1.66, -2.55);
    roomGroup.add(mpevWheelMesh, airlockLed);
    addSignPlate('ESCLUSA QUEST · MPEV (kPa)', '#f59e0b', 12.82, 2.25, -2.55, -Math.PI / 2);

    // Apollo 13 SM Cryo Panel + East Lab "Mailbox" Co2 Bench LEDs (active during Apollo 13)
    const a13MailboxLedMats = [
      new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
    ];
    if (activeMissionKey === 'apollo13_aquarius') {
      addBox(11.45, 1.22, -5.80, 0.42, 0.84, 0.62, isprRackMat);
      const a13Led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.24), a13CryoLedMat);
      a13Led.position.set(11.22, 1.42, -5.80);
      roomGroup.add(a13Led);
      for (let mi = 0; mi < 3; mi++) {
        const ml = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.09), a13MailboxLedMats[mi]);
        ml.position.set(17.10 + mi * 0.25, 0.96, 3.85);
        roomGroup.add(ml);
      }
    }

    // STS-120 Canadarm2 + 90 ft OBSS Worksite + P6-4B Torn Wing Blanket
    const p6WingGroup = new THREE.Group();
    if (activeMissionKey === 'sts120_p6_solar') {
      addBox(12.65, 1.15, -3.70, 0.56, 1.30, 0.72, isprRackMat);
      const obssArm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.12), whiteFrameMat);
      obssArm.position.set(12.15, 1.62, -3.70);
      obssArm.rotation.z = 0.22;
      const stsLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.24), stsConsoleLedMat);
      stsLed.position.set(12.34, 1.46, -3.70);
      roomGroup.add(obssArm, stsLed);

      p6WingGroup.position.set(11.70, 1.75, -3.70);
      const pvMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3, metalness: 0.65 });
      const tearMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const bayA = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.65), pvMat);
      const bayTear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.22), tearMat);
      bayTear.position.set(0, 0.08, 0.14);
      p6WingGroup.add(bayA, bayTear);
      roomGroup.add(p6WingGroup);
    }

    // =========================================================================
    // LIVE 3D CREW COMPANION NPCs + OBJECTIVE BEACON
    // =========================================================================
    const npcEntries: Array<{ stId: string; rig: ChibiAstronautRig; homeX: number; homeY: number; homeYawRad: number }> = [];
    const npcSuitMap: Record<string, number> = { WHITSON: 0, CONRAD: 3, LOVELL: 2 };
    const npcFaceMap: Record<string, number> = { WHITSON: 1, CONRAD: 0, LOVELL: 2 };
    for (const st of simRef.current.stations) {
      if (st.kind !== 'npc_crew') continue;
      const crewId = st.value ?? 'CONRAD';
      const rig = createChibiAstronautRig(npcSuitMap[crewId] ?? 1, npcFaceMap[crewId] ?? 0);
      rig.root.position.set(st.x, 0, st.y);
      const homeYawRad = (-st.yawDeg * Math.PI) / 180;
      rig.root.rotation.y = homeYawRad;
      scene.add(rig.root);
      npcEntries.push({ stId: st.id, rig, homeX: st.x, homeY: st.y, homeYawRad });
    }

    // Floating Station Diamonds + Active Step Guide Ring
    const beaconMap = new Map<string, { mesh: THREE.Mesh; baseZ: number }>();
    for (const st of simRef.current.stations) {
      if (['bunk_light_switch', 'window_shutter_button', 'suit_mirror_station'].includes(st.kind)) continue;
      const bMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.065, 0),
        new THREE.MeshBasicMaterial({ color: st.kind === 'npc_crew' ? 0xc084fc : st.done ? 0x22c55e : 0x38bdf8 })
      );
      const baseZ = Math.min(2.6, st.z + 0.56);
      bMesh.position.set(st.x, baseZ, st.y);
      roomGroup.add(bMesh);
      beaconMap.set(st.id, { mesh: bMesh, baseZ });
    }

    const guideRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const guideFloorRing = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.44, 24), guideRingMat);
    guideFloorRing.rotation.x = -Math.PI / 2;
    const guideDiamondMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const guideDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), guideDiamondMat);
    const guideDottedGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(3.15, 0.035, 3.2),
      new THREE.Vector3(6.2, 0.035, 3.5),
    ]);
    const guideDottedMat = new THREE.LineDashedMaterial({
      color: 0xfacc15,
      dashSize: 0.24,
      gapSize: 0.16,
      transparent: true,
      opacity: 0.95,
    });
    const guideDottedLine = new THREE.Line(guideDottedGeo, guideDottedMat);
    guideDottedLine.computeLineDistances();
    guideDottedLine.visible = false;
    roomGroup.add(guideFloorRing, guideDiamond, guideDottedLine);

    // Player 3rd-Person Chibi & Dual 1st-Person Hands
    const playerAstronaut: ChibiAstronautRig = createChibiAstronautRig(suitIdx, faceIdx);
    playerAstronaut.root.visible = false;
    scene.add(playerAstronaut.root);

    const fpHands: FirstPersonHandsRig = createFirstPersonHandsRig(suitIdx);
    camera.add(fpHands.root);
    scene.add(camera);

    const itemsGroup = new THREE.Group();
    scene.add(itemsGroup);
    const itemMeshes = new Map<string, THREE.Group>();

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(320, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const gravityMs2 =
      AETHER4_MISSIONS.find((m) => m.id === activeMissionKey)?.gravityMs2 ?? NASA_CONSTANTS.GRAVITY.EARTH.value;

    let rafId = 0;
    let lastMs = performance.now();
    let hudTimer = 0;
    let footstepTimer = 0;
    const t0 = lastMs;

    const frame = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastMs) / 1000));
      const timeSec = Math.max(0, (nowMs - t0) / 1000);
      lastMs = nowMs;

      const k = keysRef.current;
      const sim = simRef.current;
      const blocked = activeModalRef.current !== null || sim.sleeping;

      if (!blocked) {
        const forward = (k['KeyW'] ? 1 : 0) - (k['KeyS'] ? 1 : 0);
        const strafe = (k['KeyD'] ? 1 : 0) - (k['KeyA'] ? 1 : 0);

        if (k['ArrowLeft']) {
          targetYawRef.current -= 135 * dt;
          lookDeltaRef.current.yaw -= 135 * dt;
        }
        if (k['ArrowRight']) {
          targetYawRef.current += 135 * dt;
          lookDeltaRef.current.yaw += 135 * dt;
        }
        if (k['ArrowUp']) {
          targetPitchRef.current = Math.min(78, targetPitchRef.current + 90 * dt);
          lookDeltaRef.current.pitch += 90 * dt;
        }
        if (k['ArrowDown']) {
          targetPitchRef.current = Math.max(-78, targetPitchRef.current - 90 * dt);
          lookDeltaRef.current.pitch -= 90 * dt;
        }

        // Smooth camera orientation toward unwrapped target (eliminates pointer-lock cuts)
        const lookLerp = 1 - Math.exp(-dt * 30);
        let diffYaw = targetYawRef.current - playerRef.current.yawDeg;
        while (diffYaw > 180) diffYaw -= 360;
        while (diffYaw < -180) diffYaw += 360;
        playerRef.current.yawDeg = (playerRef.current.yawDeg + diffYaw * lookLerp + 360) % 360;
        playerRef.current.pitchDeg += (targetPitchRef.current - playerRef.current.pitchDeg) * lookLerp;

        playerRef.current = stepSpaceRoomPlayer(
          playerRef.current,
          {
            forward,
            strafe,
            sprint: Boolean(k['ShiftLeft'] || k['ShiftRight']),
            crouch: Boolean(k['ControlLeft'] || k['ControlRight']),
            jumpPressed: jumpQueueRef.current,
          },
          dt,
          gravityMs2,
          sim.doors
        );
      }
      jumpQueueRef.current = false;

      const pAnim = animPulsesRef.current;
      pAnim.reach = Math.max(0, pAnim.reach - dt * 2.6);
      pAnim.use = Math.max(0, pAnim.use - dt * 2.5);
      pAnim.swap = Math.max(0, pAnim.swap - dt * 3.4);
      pAnim.consume = Math.max(0, pAnim.consume - dt * 2.2);

      const curP = playerRef.current;
      stepSpaceRoomSimulation(sim, curP, dt);

      // Animate 4 Automatic Corridor Bulkhead Doors & play door slide audio
      for (const dv of doorVisuals) {
        const ds = sim.doors.find((d) => d.id === dv.id);
        if (!ds) continue;
        const isOpenNow = ds.openProgress > 0.08;
        if (isOpenNow && !doorWasOpenRef.current[ds.id]) {
          soundEngine.playDoorSlide();
        }
        doorWasOpenRef.current[ds.id] = isOpenNow;
        const shift = ds.openProgress * 1.04;
        if (dv.axis === 'x') {
          dv.leafA.position.z = dv.cy - 0.54 - shift;
          dv.leafB.position.z = dv.cy + 0.54 + shift;
        } else {
          dv.leafA.position.x = dv.cx - 0.54 - shift;
          dv.leafB.position.x = dv.cx + 0.54 + shift;
        }
        dv.ledMat.color.setHex(ds.openProgress > 0.5 ? 0x10b981 : 0xf59e0b);
      }

      // Ambient Sound, Music, Doorway Audio & Footstep Cadence
      const envKind =
        sim.currentMissionId === 'tutorial_hab'
          ? 'earth_jsc'
          : sim.currentMissionId === 'act4_storm_rover' || sim.lightingMode === 'alert'
          ? 'surface_alert'
          : 'orbital_iss';
      soundEngine.stepAmbientMusic(timeSec, envKind);

      const zoneNow = getRoomZoneAt(curP.x, curP.y);
      if (zoneNow.id !== lastZoneIdRef.current) {
        lastZoneIdRef.current = zoneNow.id;
        soundEngine.playDoorSlide();
      }

      const travelSpeed = Math.hypot(curP.vx, curP.vy);
      if (!blocked && curP.grounded && travelSpeed > 1.25) {
        footstepTimer += dt;
        const interval = curP.sprinting ? 0.28 : 0.42;
        if (footstepTimer >= interval) {
          footstepTimer = 0;
          soundEngine.playFootstep(curP.sprinting, false);
        }
      } else {
        footstepTimer = 0.25;
      }

      // Spin 4 Ventilation Fans & Drift Cabin Airflow Motes
      for (const vf of ventFans) {
        vf.rotation.y += dt * 5.4;
      }
      const mPos = moteGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < moteCount; i++) {
        let mx = mPos.getX(i) + dt * 0.14;
        if (mx > 20.2) mx = 0.4;
        const my = mPos.getY(i) + Math.sin(timeSec * 0.9 + i) * dt * 0.03;
        mPos.setXY(i, mx, Math.max(0.25, Math.min(3.15, my)));
      }
      mPos.needsUpdate = true;

      // Sync Spectral Lighting Modes across all 5 modules
      const applyZoneLightHex = (hex: number, mult = 1.0) => {
        mainLight.color.setHex(hex);
        mainLight.intensity = 14 * mult;
        westLight.color.setHex(hex);
        westLight.intensity = 13.5 * mult;
        eastLight.color.setHex(hex);
        eastLight.intensity = 13.5 * mult;
        northLight.color.setHex(hex);
        northLight.intensity = 10.5 * mult;
        southLight.color.setHex(hex);
        southLight.intensity = 9.5 * mult;
      };

      if (sim.lightingMode === 'day') {
        applyZoneLightHex(0xf4f9ff, 1.05);
        ambientLight.color.setHex(0xdbeafe);
        ambientLight.intensity = 0.62;
        hemiLight.color.setHex(0xe0f2fe);
        hemiLight.groundColor.setHex(0x1e293b);
        hemiLight.intensity = 0.95;
        aphGlowLight.intensity = 0;
        ledCeilMat.color.setHex(0xe0f2fe);
        lightBtnMesh.material = cyanLedMat;
      } else if (sim.lightingMode === 'circadian') {
        applyZoneLightHex(0xfdba74, 0.78);
        ambientLight.color.setHex(0xfed7aa);
        ambientLight.intensity = 0.46;
        hemiLight.color.setHex(0xfed7aa);
        hemiLight.groundColor.setHex(0x1c1917);
        hemiLight.intensity = 0.68;
        aphGlowLight.intensity = 0;
        ledCeilMat.color.setHex(0xfde68a);
        lightBtnMesh.material = amberLedMat;
      } else if (sim.lightingMode === 'spectral_magenta') {
        applyZoneLightHex(0xe879f9, 0.85);
        ambientLight.color.setHex(0x86198f);
        ambientLight.intensity = 0.62;
        hemiLight.color.setHex(0xf0abfc);
        hemiLight.groundColor.setHex(0x2e1046);
        hemiLight.intensity = 0.85;
        aphGlowLight.intensity = 11.5;
        ledCeilMat.color.setHex(0xe879f9);
        lightBtnMesh.material = cyanLedMat;
      } else if (sim.lightingMode === 'blueprint_launch') {
        applyZoneLightHex(0x93c5fd, 0.92);
        ambientLight.color.setHex(0x1e3a8a);
        ambientLight.intensity = 0.65;
        hemiLight.color.setHex(0xbfdbfe);
        hemiLight.groundColor.setHex(0x0f2547);
        hemiLight.intensity = 0.9;
        aphGlowLight.intensity = 0;
        ledCeilMat.color.setHex(0x93c5fd);
        lightBtnMesh.material = cyanLedMat;
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(timeSec * 6.0);
        applyZoneLightHex(0xf87171, 0.58 + pulse * 0.58);
        ambientLight.color.setHex(0x991b1b);
        ambientLight.intensity = 0.44;
        hemiLight.color.setHex(0xfca5a5);
        hemiLight.groundColor.setHex(0x1e1b18);
        hemiLight.intensity = 0.52;
        aphGlowLight.intensity = 0;
        ledCeilMat.color.setHex(0xf87171);
        lightBtnMesh.material = amberLedMat;
      }

      // Animate Shutters centered around X=3.20 & Mission-Specific Hardware
      const targetLeftX = sim.shutterOpen ? 1.55 : 2.52;
      const targetRightX = sim.shutterOpen ? 4.85 : 3.88;
      shutterLeft.position.x += (targetLeftX - shutterLeft.position.x) * Math.min(1, dt * 6);
      shutterRight.position.x += (targetRightX - shutterRight.position.x) * Math.min(1, dt * 6);
      shutterBtnMesh.material = sim.shutterOpen ? greenLedMat : amberLedMat;

      if (launchRocketGroup.visible) {
        const stage = sim.launchStageIndex;
        const spread = stage >= 3 ? Math.min(0.85, (stage - 2) * 0.28) : 0;
        srbL.position.x = -0.22 - spread;
        srbR.position.x = 0.22 + spread;
        srbL.rotation.z = spread * 0.35;
        srbR.rotation.z = -spread * 0.35;
        launchRocketGroup.position.y = 1.45 + (stage >= 2 ? 0.14 : 0) + Math.sin(timeSec * 2) * 0.03;
      }

      const charger = sim.stations.find((s) => s.kind === 'power_charger');
      chargerBayMat.color.setStyle(charger?.hasBattery ? (charger.progress >= 95 ? '#22c55e' : '#eab308') : '#475569');
      const pbox = sim.stations.find((s) => s.kind === 'power_box');
      powerBoxLedMat.color.setStyle(sim.objectives.powerRestored ? '#22c55e' : pbox?.done ? '#38bdf8' : '#ef4444');
      leverPivot.rotation.z += ((sim.objectives.powerRestored ? 0.55 : -0.55) - leverPivot.rotation.z) * Math.min(1, dt * 8);

      const vent = sim.stations.find((s) => s.kind === 'eclss_vent');
      const screws = vent?.screwsLeft ?? 0;
      screwMeshes.forEach((m, i) => {
        m.visible = i < screws;
      });

      const heater = sim.stations.find((s) => s.kind === 'food_heater');
      heaterPadMat.color.setStyle(heater?.foodReady ? '#22c55e' : heater?.hasRice || heater?.hasWater ? '#f59e0b' : '#475569');

      treadmillBeltMat.color.setHex(sim.exercisingTimerSec > 0 ? 0x38bdf8 : sim.objectives.exerciseCalibrated ? 0x22c55e : 0x334155);
      if (skylabPatchMesh) skylabPatchMesh.visible = sim.objectives.thermalFixed;
      if (compostWheelMesh) {
        const targetRot = sim.objectives.compostIsolated ? Math.PI : 0;
        compostWheelMesh.rotation.z += (targetRot - compostWheelMesh.rotation.z) * Math.min(1, dt * 5);
      }
      if (regolithDoorMesh) {
        const targetY = sim.objectives.regolithDeployed ? 1.05 : 2.55;
        regolithDoorMesh.position.y += (targetY - regolithDoorMesh.position.y) * Math.min(1, dt * 3.5);
      }

      for (const orb of holoOrbiters) {
        orb.rotation.y += dt * 1.4;
        orb.rotation.x += dt * 0.7;
      }

      // Animate 3 New Wing Modules (NBL Bubbles, 4.5G Centrifuge Rotor, 0g Fire Arc, Orion Consoles)
      nblLedMat.color.setHex(sim.objectives.nblCertified ? 0x22c55e : 0x38bdf8);
      for (let bi = 0; bi < nblBubbles.length; bi++) {
        const b = nblBubbles[bi];
        b.position.y += dt * (0.28 + (bi % 3) * 0.12);
        if (b.position.y > 0.84) b.position.y = 0.25;
      }
      cenLedMat.color.setHex(sim.objectives.centrifugeCertified ? 0x22c55e : 0xa855f7);
      centrifugeBoom.rotation.y += dt * (sim.objectives.centrifugeCertified ? 0.6 : 2.6);
      fireLedMat.color.setHex(sim.objectives.fireDrillCertified ? 0x22c55e : 0xf43f5e);
      fireGlowGroup.visible = !sim.objectives.fireDrillCertified;
      if (fireGlowGroup.visible) {
        fireGlowGroup.rotation.z = Math.sin(timeSec * 9.0) * 0.12;
        fireGlowGroup.scale.setScalar(0.9 + 0.22 * Math.sin(timeSec * 14));
      }
      orionFaultLedMat.color.setHex(sim.objectives.preflightRepaired ? 0x22c55e : 0xef4444);
      orionPowerLedMat.color.setHex(sim.objectives.preflightSystemsOn ? 0x22c55e : 0xf59e0b);

      // Drive Machine-Room 3D Gauges, Breakers, MPEV Handwheels & Historical Props
      ogaLedMat.color.setHex(sim.suitO2Percent >= 75 ? 0x22c55e : 0xf59e0b);
      wrsLedMat.color.setHex(sim.hydrationPercent >= 65 ? 0x38bdf8 : 0xf59e0b);
      cdraLedMat.color.setHex(sim.co2Ppm <= 1200 ? 0x22c55e : 0xef4444);
      sim.rpcmBreakers.forEach((b, idx) => {
        if (rpcmLedMats[idx]) {
          rpcmLedMats[idx].color.setHex(b.tripped ? 0xef4444 : b.closed ? 0x22c55e : 0x64748b);
        }
      });
      atcsLedMat.color.setHex(sim.atcsLoopTempK <= 310 ? 0x38bdf8 : 0xef4444);
      atcsWheelMesh.rotation.x += ((sim.atcsLoopTempK <= 310 ? Math.PI : 0) - atcsWheelMesh.rotation.x) * Math.min(1, dt * 4);
      airlockLedMat.color.setHex(sim.airlockStep === 5 ? 0x22c55e : sim.airlockStep > 0 ? 0x38bdf8 : 0xf59e0b);
      mpevWheelMesh.rotation.x += (sim.airlockStep * 0.9 - mpevWheelMesh.rotation.x) * Math.min(1, dt * 5);

      if (activeMissionKey === 'apollo13_aquarius') {
        a13CryoLedMat.color.setHex(sim.objectives.a13CryoDiagnosed ? 0x22c55e : 0xef4444);
        a13MailboxLedMats[0].color.setHex(sim.a13MailboxParts.card ? 0x22c55e : 0xf59e0b);
        a13MailboxLedMats[1].color.setHex(sim.a13MailboxParts.hose ? 0x22c55e : 0xf59e0b);
        a13MailboxLedMats[2].color.setHex(sim.a13MailboxParts.tape ? 0x22c55e : 0xf59e0b);
      }
      if (activeMissionKey === 'sts120_p6_solar') {
        stsConsoleLedMat.color.setHex(sim.objectives.stsArrayDeployed ? 0x22c55e : sim.objectives.stsWireSnipped ? 0x38bdf8 : 0xf59e0b);
        const spanScale = 0.5 + sim.stsRedeploySteps * 0.18;
        p6WingGroup.scale.set(1, spanScale, 1);
      }

      for (const st of sim.stations) {
        const b = beaconMap.get(st.id);
        if (!b) continue;
        b.mesh.position.y = b.baseZ + Math.sin(timeSec * 3.2 + st.x) * 0.05;
        b.mesh.rotation.y += dt * 1.6;
        (b.mesh.material as THREE.MeshBasicMaterial).color.setHex(
          st.kind === 'npc_crew' ? 0xc084fc : st.done ? 0x22c55e : 0x38bdf8
        );
      }

      // Update Live Guided Step Beacon & 3D Dotted Path Line
      const carriedList = [...hotbarRef.current, ...backpackRef.current];
      const stepGuide = getCurrentGuidedStep(sim, handItemRef.current, carriedList);
      const isRouteAssigned = sim.missionAssigned || carriedList.some(Boolean);
      const beaconColorHex = isRouteAssigned ? 0xfacc15 : 0x38bdf8;
      guideRingMat.color.setHex(beaconColorHex);
      guideDiamondMat.color.setHex(beaconColorHex);
      guideFloorRing.position.set(stepGuide.targetX, 0.025, stepGuide.targetY);
      const pulseScale = 0.85 + 0.25 * Math.sin(timeSec * 4.5);
      guideFloorRing.scale.set(pulseScale, pulseScale, 1);
      guideDiamond.position.set(stepGuide.targetX, 1.95 + Math.sin(timeSec * 3.5) * 0.09, stepGuide.targetY);
      guideDiamond.rotation.y += dt * 2.4;

      guideDottedLine.visible = isRouteAssigned;
      if (isRouteAssigned) {
        const wps = computeStationPathWaypoints(curP.x, curP.y, stepGuide.targetX, stepGuide.targetY);
        const pts = wps.map((p) => new THREE.Vector3(p.x, 0.035, p.y));
        guideDottedGeo.setFromPoints(pts);
        guideDottedLine.computeLineDistances();
      }

      const objSum = getMissionObjectiveSummary(sim.currentMissionId, sim.objectives);
      hatchStatusLedMat.color.setHex(objSum.done >= Math.min(2, objSum.total) ? 0x22c55e : 0xf59e0b);

      // Animate Crew NPCs turning smoothly & greeting when nearby
      for (const npc of npcEntries) {
        const dx = curP.x - npc.homeX;
        const dy = curP.y - npc.homeY;
        const dist = Math.hypot(dx, dy);
        const wantYaw = dist < 4.5 ? -Math.atan2(dy, dx) : npc.homeYawRad;
        let diff = wantYaw - npc.rig.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        npc.rig.root.rotation.y += diff * Math.min(1, dt * 4.5);
        updateChibiAstronautRig(npc.rig, {
          timeSec: timeSec + npc.homeX,
          moveSpeedMs: 0,
          sprinting: false,
          grounded: true,
          interactPulse: dist < 2.8 ? 0.38 + 0.25 * Math.sin(timeSec * 3.5) : 0,
          usePulse: 0,
          sleeping: false,
          exercising: false,
          heldItemKey: null,
        });
      }

      // Sync 3D Pickable Item Meshes
      const activeIds = new Set(sim.worldItems.map((i) => i.uid));
      for (const [uid, grp] of itemMeshes.entries()) {
        if (!activeIds.has(uid)) {
          itemsGroup.remove(grp);
          itemMeshes.delete(uid);
        }
      }
      for (const it of sim.worldItems) {
        let grp = itemMeshes.get(it.uid);
        if (!grp) {
          grp = createDetailedItemMesh(it.itemKey);
          itemsGroup.add(grp);
          itemMeshes.set(it.uid, grp);
        }
        grp.position.set(it.x, it.z, it.y);
        grp.rotation.y = (-it.yawDeg * Math.PI) / 180;
      }

      const heldKey = handItemRef.current?.itemKey ?? null;
      const isExercising = sim.exercisingTimerSec > 0;

      // Mirror Astronaut reflection
      updateChibiAstronautRig(mirrorAstronaut, {
        timeSec,
        moveSpeedMs: sim.sleeping ? 0 : isExercising ? 6.5 : travelSpeed,
        sprinting: curP.sprinting || isExercising,
        grounded: curP.grounded,
        interactPulse: pAnim.reach,
        usePulse: pAnim.use,
        sleeping: false,
        exercising: isExercising,
        heldItemKey: heldKey,
        crouching: curP.crouching,
      });

      const isThirdOrSleeping = cameraModeRef.current === 'third' || sim.sleeping;
      playerAstronaut.root.visible = isThirdOrSleeping;
      fpHands.root.visible = !isThirdOrSleeping;

      const yawRad = (curP.yawDeg * Math.PI) / 180;
      const pitchRad = (curP.pitchDeg * Math.PI) / 180;

      if (sim.sleeping) {
        playerAstronaut.root.position.set(0.75, 0.85, 5.45);
        playerAstronaut.root.rotation.y = Math.PI / 2;
        updateChibiAstronautRig(playerAstronaut, {
          timeSec,
          moveSpeedMs: 0,
          sprinting: false,
          grounded: true,
          interactPulse: 0,
          usePulse: 0,
          sleeping: true,
          exercising: false,
          heldItemKey: null,
        });
        camera.position.set(2.55, 1.85, 4.45);
        camera.lookAt(0.75, 0.90, 4.85);
      } else if (cameraModeRef.current === 'third') {
        playerAstronaut.root.position.set(curP.x, curP.z, curP.y);
        playerAstronaut.root.rotation.y = -yawRad;
        updateChibiAstronautRig(playerAstronaut, {
          timeSec,
          moveSpeedMs: isExercising ? 6.2 : travelSpeed,
          sprinting: curP.sprinting || isExercising,
          grounded: curP.grounded,
          interactPulse: pAnim.reach,
          usePulse: pAnim.use,
          sleeping: false,
          exercising: isExercising,
          heldItemKey: heldKey,
          crouching: curP.crouching,
        });

        const camDist = 2.45;
        const fx = Math.cos(yawRad);
        const fy = Math.sin(yawRad);
        const camX = Math.max(0.35, Math.min(20.25, curP.x - fx * camDist));
        const camY = Math.max(-4.65, Math.min(13.05, curP.y - fy * camDist));
        const camZ = Math.min(3.05, Math.max(0.95, curP.z + 2.05 - Math.sin(pitchRad) * 0.7));
        camera.position.set(camX, camZ, camY);
        camera.lookAt(curP.x + fx * 0.8, curP.z + 1.25 + Math.sin(pitchRad) * 0.6, curP.y + fy * 0.8);
      } else {
        const eyeH = curP.crouching ? PAWN_CONSTANTS.eyeHeightCrouchingM : PAWN_CONSTANTS.eyeHeightStandingM;
        const headBob =
          isExercising
            ? Math.sin(timeSec * 15) * 0.045
            : curP.grounded && travelSpeed > 0.4
            ? Math.sin(timeSec * (curP.sprinting ? 12.2 : 8.8)) * 0.032
            : 0;
        const fx = Math.cos(pitchRad) * Math.cos(yawRad);
        const fy = Math.cos(pitchRad) * Math.sin(yawRad);
        const fz = Math.sin(pitchRad);

        camera.position.set(curP.x, curP.z + eyeH + headBob, curP.y);
        camera.lookAt(curP.x + fx, curP.z + eyeH + headBob + fz, curP.y + fy);

        updateFirstPersonHandsRig(fpHands, {
          timeSec,
          dt,
          moveSpeedMs: isExercising ? 6.2 : travelSpeed,
          sprinting: curP.sprinting || isExercising,
          crouching: curP.crouching,
          yawDeltaDeg: lookDeltaRef.current.yaw,
          pitchDeltaDeg: lookDeltaRef.current.pitch,
          reachPulse: pAnim.reach,
          usePulse: pAnim.use,
          swapPulse: pAnim.swap,
          consumePulse: pAnim.consume,
          exercising: isExercising,
          heldItemKey: heldKey,
        });
      }

      lookDeltaRef.current.yaw = 0;
      lookDeltaRef.current.pitch = 0;

      renderer.render(scene, camera);

      const tgtNow = findRoomLookTarget(curP, sim);
      lookTargetRef.current = tgtNow;

      hudTimer += dt;
      if (hudTimer >= 0.1) {
        hudTimer = 0;
        setLookTarget((prev) =>
          prev.id === tgtNow.id && prev.kind === tgtNow.kind && prev.labelEs === tgtNow.labelEs ? prev : tgtNow
        );
        syncHudNow();
      }

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      soundEngine.stopAmbientEnvironment();
      for (const dt of dynamicTextures) dt.dispose();
      tex.dispose();
      renderer.dispose();
    };
  }, [activeMissionKey, faceIdx, screen, suitIdx, syncHudNow]);

  const activeMissionConfig = useMemo(
    () => AETHER4_MISSIONS.find((m) => m.id === hud.currentMissionId) ?? AETHER4_MISSIONS[0],
    [hud.currentMissionId]
  );

  const selectedMenuMission = useMemo(
    () => AETHER4_MISSIONS.find((m) => m.id === selectedMenuMissionId) ?? AETHER4_MISSIONS[0],
    [selectedMenuMissionId]
  );

  const objectiveProgress = useMemo(
    () => getMissionObjectiveSummary(hud.currentMissionId, hud.objectives),
    [hud.currentMissionId, hud.objectives]
  );

  // ===========================================================================
  // RENDER 1: MINIMALIST LOCKDOWN FROSTED MAIN MENU + LIVE 3D ASTRONAUT
  // ===========================================================================
  if (screen === 'menu') {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#060d18] text-slate-900 select-none lp-grid-bg">
        {/* Subtle Animated Panoramic Orbital Canvas */}
        <canvas ref={panoramaCanvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-85" />

        <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-stretch justify-between p-5 sm:p-8 gap-6 max-w-[1440px] mx-auto">
          {/* LEFT COMMAND CARD — Minimalist Lockdown Translucent-White Frosted UI */}
          <div className="w-full lg:w-[475px] shrink-0 lp-panel rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-2xl">
            {/* Minimalist Top Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-900/12">
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-slate-600">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                NASA BVAD · ESDMD-001
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.enabled = !audioOn;
                    setAudioOn(!audioOn);
                    if (!audioOn) soundEngine.playClick();
                  }}
                  className="lp-btn px-2.5 py-1 rounded-lg text-xs flex items-center gap-1"
                  title="Audio"
                >
                  {audioOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setLang((l) => (l === 'es' ? 'en' : 'es'));
                  }}
                  className="lp-btn px-3 py-1 rounded-lg text-[11px] font-mono font-semibold"
                >
                  {lang.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Minimalist Editorial Title Block */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-sky-700 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                JUNIOR ASTRONAUT MISSION TRAINER · 2034
              </div>
              <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-950 leading-none">
                AETHER<span className="font-semibold text-sky-700">-4</span>
              </h1>
              <div className="text-xs font-mono tracking-[0.18em] text-slate-600 uppercase">
                ARTEMIS–ARES · ORBITAL QUARTERS 3D
              </div>
            </div>

            {/* Dynamic Drawer Area */}
            {menuDrawer === 'home' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => enterMission('tutorial_hab', false)}
                  className="w-full py-3.5 px-4 lp-btn lp-btn-accent rounded-xl text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm"
                >
                  <DoorOpen className="w-4 h-4" />
                  {lang === 'es'
                    ? 'INICIAR CAMPAÑA: FASE 0 (BASE J.S.C. TIERRA)'
                    : 'START CAMPAIGN: PHASE 0 (JSC EARTH BASE)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setMenuDrawer('missions');
                  }}
                  className="w-full py-2.5 px-4 lp-btn rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4 text-sky-700" />
                  {lang === 'es' ? 'Seleccionar Fase de Misión (0 – 4)' : 'Select Mission Phase (0 – 4)'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCodexInit({ tab: 'papers', paperId: 1, noteId: 1 });
                      setMenuCodexOpen(true);
                    }}
                    className="py-2.5 px-3 lp-btn rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5"
                  >
                    <Newspaper className="w-3.5 h-3.5 text-amber-600" />
                    {lang === 'es' ? 'Archivo NASA' : 'NASA Papers'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setMenuDrawer('customize');
                    }}
                    className="py-2.5 px-3 lp-btn rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    {lang === 'es' ? 'Personalizar xEMU' : 'Customize xEMU'}
                  </button>
                </div>

                {/* Minimalist Mission Brief Card */}
                <div className="bg-white/60 border border-slate-900/12 rounded-xl p-3.5 text-xs space-y-2">
                  <div className="font-semibold text-sky-800 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-amber-600" />
                      {lang === 'es' ? selectedMenuMission.badgeEs : selectedMenuMission.badgeEn}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedMenuMission.gravityMs2.toFixed(2)} m/s²
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {lang === 'es' ? selectedMenuMission.briefingEs : selectedMenuMission.briefingEn}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    {Object.values(CREW_COMPANIONS).map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 rounded bg-slate-900/90 text-white border border-slate-900/15"
                        style={{ borderLeftColor: c.accentHex, borderLeftWidth: '3px' }}
                        title={lang === 'es' ? c.tributeEs : c.tributeEn}
                      >
                        {c.id}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {menuDrawer === 'missions' && (
              <div className="bg-white/65 border border-slate-900/12 rounded-xl p-3.5 space-y-2.5 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-900/12 pb-2">
                  <span className="text-xs font-semibold tracking-wide text-slate-800">
                    {lang === 'es' ? 'FASES AETHER-4 (REALISMO NASA)' : 'AETHER-4 PHASES'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuDrawer('home')}
                    className="lp-btn px-2.5 py-1 rounded-lg text-[11px]"
                  >
                    ← {lang === 'es' ? 'Volver' : 'Back'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {AETHER4_MISSIONS.map((m) => {
                    const selected = m.id === selectedMenuMissionId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedMenuMissionId(m.id);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition ${
                          selected
                            ? 'bg-sky-600/15 border-sky-600/60 ring-1 ring-sky-600/40'
                            : 'bg-white/60 border-slate-900/12 hover:bg-white/85'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-semibold">
                          <span style={{ color: m.accentHex }}>{lang === 'es' ? m.badgeEs : m.badgeEn}</span>
                          <span className="text-slate-600">
                            {m.gravityMs2.toFixed(2)} m/s² · {m.kelvinLabel}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 mt-0.5">
                          {lang === 'es' ? m.titleEs : m.titleEn}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {lang === 'es' ? m.subtitleEs : m.subtitleEn}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => enterMission(selectedMenuMissionId, false)}
                  className="w-full py-3 px-4 lp-btn lp-btn-accent rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  {lang === 'es'
                    ? `DESPLEGAR EN: ${selectedMenuMission.badgeEs}`
                    : `LAUNCH: ${selectedMenuMission.badgeEn}`}
                </button>
              </div>
            )}

            {menuDrawer === 'customize' && (
              <div className="bg-white/65 border border-slate-900/12 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900/12 pb-2">
                  <span className="text-xs font-semibold text-slate-800">
                    {lang === 'es' ? 'VESTIDOR CHIBI EVA & POSE 3D' : 'CHIBI EVA CUSTOMIZER & POSES'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuDrawer('home')}
                    className="lp-btn px-2.5 py-1 rounded-lg text-[11px]"
                  >
                    ← {lang === 'es' ? 'Volver' : 'Back'}
                  </button>
                </div>

                <div>
                  <div className="text-[11px] text-slate-700 mb-1.5 font-medium">
                    {lang === 'es' ? 'Color del Traje' : 'Suit Color'}:{' '}
                    {SUIT_COLORS[suitIdx][lang === 'es' ? 'nameEs' : 'nameEn']}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUIT_COLORS.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSuitIdx(idx);
                          soundEngine.playClick();
                        }}
                        className={`w-7 h-7 rounded-md border-2 cursor-pointer transition ${
                          suitIdx === idx ? 'border-sky-600 scale-110 ring-2 ring-sky-400/50' : 'border-slate-400/60'
                        }`}
                        style={{ backgroundColor: c.primaryHex }}
                        title={lang === 'es' ? c.nameEs : c.nameEn}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-700 mb-1.5 font-medium">
                    {lang === 'es' ? 'Ojos LED del Visor' : 'LED Visor Face'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VISOR_FACES.map((f, idx) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFaceIdx(idx);
                          soundEngine.playClick();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                          faceIdx === idx ? 'lp-btn-accent font-semibold' : 'lp-btn text-slate-700'
                        }`}
                      >
                        {lang === 'es' ? f.labelEs : f.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-700 mb-1.5 font-medium">
                    {lang === 'es' ? 'Animación & Herramienta 3D' : '3D Pose & Tool Preview'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      ['wave', lang === 'es' ? 'Saludo' : 'Wave'],
                      ['walk', lang === 'es' ? 'Caminata' : 'Walk'],
                      ['exercise', lang === 'es' ? 'Trote ASCAN' : 'ASCAN Treadmill'],
                    ].map(([mode, lbl]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setMenuPreviewMode(mode as 'wave' | 'walk' | 'exercise')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                          menuPreviewMode === mode ? 'lp-btn-accent font-semibold' : 'lp-btn text-slate-700'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[null, 'DA_ScrewDriver', 'DA_Battery', 'DA_TorqueWrench', 'DA_CryoValve', 'DA_FireExtinguisher'].map(
                      (key) => (
                        <button
                          key={String(key)}
                          type="button"
                          onClick={() => setMenuPreviewItem(key)}
                          className={`px-2 py-1 rounded-md text-[10px] border ${
                            menuPreviewItem === key ? 'lp-btn-accent font-semibold' : 'lp-btn text-slate-700'
                          }`}
                        >
                          {key ? getSpaceItemName(key, lang) : lang === 'es' ? 'Vacía' : 'Empty'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] font-mono text-slate-600 pt-2 border-t border-slate-900/10 flex flex-wrap gap-2">
              <span>[WASD] MOVER</span>·<span>[1-5] CASILLAS</span>·<span>[B] MOCHILA</span>·<span>[ESC] MENÚ</span>
            </div>
          </div>

          {/* RIGHT COLUMN — LIVE 3D CHIBI ASTRONAUT SHOWCASE */}
          <div className="relative flex-1 min-h-[380px] lg:min-h-[640px] flex flex-col">
            <div ref={menuMountRef} className="w-full h-full min-h-[380px]" />
            <div className="pointer-events-none absolute bottom-4 right-4 lp-panel rounded-xl px-4 py-2 text-xs text-slate-800 shadow-lg">
              <span className="font-mono font-semibold text-sky-700">xEMU 3D RIG</span> ·{' '}
              {SUIT_COLORS[suitIdx][lang === 'es' ? 'nameEs' : 'nameEn']}
            </div>
          </div>
        </div>

        {menuCodexOpen && (
          <SpacePaperCodexModal
            lang={lang}
            unlockedPapers={hud.unlockedPapers}
            unlockedNotes={hud.unlockedNotes}
            initialTab={codexInit.tab}
            initialPaperId={codexInit.paperId}
            initialNoteId={codexInit.noteId}
            onClose={() => setMenuCodexOpen(false)}
          />
        )}
      </div>
    );
  }

  // ===========================================================================
  // RENDER 2: CLEAN LOCKDOWN TRANSLUCENT-WHITE HUD + HOTBAR 1-5 + BACKPACK
  // ===========================================================================
  const currentZone = getRoomZoneAt(hud.x, hud.y);
  const allCarriedHud = [...hud.hotbar, ...hud.backpack];
  const guidedStep = getCurrentGuidedStep(simRef.current, hud.handItem, allCarriedHud);
  const distToGuideM = Math.hypot(guidedStep.targetX - hud.x, guidedStep.targetY - hud.y).toFixed(1);
  const miniRouteAssigned = hud.missionAssigned || allCarriedHud.some(Boolean);
  const miniPathPtsStr = computeStationPathWaypoints(hud.x, hud.y, guidedStep.targetX, guidedStep.targetY)
    .map((pt) => `${((pt.x + 1.4) * 18).toFixed(1)},${((16.2 - pt.y) * 18).toFixed(1)}`)
    .join(' ');
  const bagFilledCount = hud.backpack.filter(Boolean).length;

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-900 select-none font-sans"
      onContextMenu={(e) => {
        e.preventDefault();
        if (!activeModal && !hud.sleeping) handleThrowHandItem();
      }}
    >
      {/* 3D WebGL Viewport */}
      <div
        ref={roomMountRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={(e) => {
          soundEngine.unlock();
          if (activeModal || hud.sleeping) return;
          if (e.button === 0) {
            if (document.pointerLockElement !== roomMountRef.current) {
              roomMountRef.current?.requestPointerLock?.();
              return;
            }
            isDraggingLookRef.current = true;
            handlePrimaryAction();
          }
        }}
      />

      {/* Sleep Overlay Tint */}
      {hud.sleeping && (
        <div className="pointer-events-none fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center z-30">
          <div className="px-6 py-4 lp-panel-solid rounded-xl text-center space-y-1 shadow-2xl">
            <div className="flex items-center justify-center gap-2 text-indigo-700 font-semibold text-sm">
              <Moon className="w-4 h-4" />
              {lang === 'es' ? 'DESCANSO CIRCADIANO NASA (8.5 HORAS)' : 'NASA CIRCADIAN SLEEP CYCLE (8.5 H)'}
            </div>
            <div className="text-xs text-slate-600">
              {lang === 'es'
                ? `Estamina al 100% · Pulso ${Math.round(hud.bpm)} BPM · Quedan ${hud.sleepTimerSec.toFixed(1)}s`
                : `Stamina recovering to 100% · HR ${Math.round(hud.bpm)} BPM · ${hud.sleepTimerSec.toFixed(1)}s`}
            </div>
          </div>
        </div>
      )}

      {/* COMPACT LOCKDOWN TRANSLUCENT-WHITE TOP HUD */}
      <div className="pointer-events-none fixed top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2 z-20">
        {/* Top-Left Compact Translucent Guided Step & Core Telemetry Card */}
        <div className="pointer-events-auto max-w-[325px] lp-panel rounded-lg px-2.5 py-1.5 shadow-lg space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono">
            <span
              className="font-semibold px-1.5 py-0.5 rounded text-white leading-none"
              style={{ backgroundColor: activeMissionConfig.accentHex }}
            >
              {lang === 'es' ? activeMissionConfig.badgeEs : activeMissionConfig.badgeEn}
            </span>
            <span className="flex items-center gap-1 font-semibold truncate" style={{ color: currentZone.accentHex }}>
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {lang === 'es' ? currentZone.nameEs : currentZone.nameEn}
            </span>
          </div>

          <div className="text-[11px] leading-tight text-slate-900">
            <span className={`font-semibold mr-1 ${miniRouteAssigned ? 'text-amber-800' : 'text-sky-900'}`}>
              {miniRouteAssigned ? '◆ ' : '● '}
              {lang === 'es' ? guidedStep.stepTitleEs : guidedStep.stepTitleEn} ({distToGuideM} m):
            </span>
            <span className="text-slate-800">{lang === 'es' ? guidedStep.instructionEs : guidedStep.instructionEn}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-mono pt-1 border-t border-slate-900/15">
            <span className={hud.o2Percent < 19.5 ? 'text-rose-700 font-bold' : 'text-sky-900 font-semibold'}>
              O₂ {hud.o2Percent.toFixed(1)}%
            </span>
            <span className={hud.co2Ppm > 1200 ? 'text-amber-800 font-bold' : 'text-slate-800'}>
              CO₂ {Math.round(hud.co2Ppm)}ppm
            </span>
            <span className={hud.powerKwe < 5 ? 'text-rose-700 font-bold' : 'text-amber-800 font-semibold'}>
              {hud.powerKwe.toFixed(1)}kWe
            </span>
            <span className={hud.hp < 50 ? 'text-rose-700 font-bold' : 'text-emerald-800 font-semibold'}>
              HP {Math.round(hud.hp)}
            </span>
            <span className={hud.suitO2Percent < 55 ? 'text-rose-700 font-bold' : 'text-cyan-900 font-semibold'}>
              {lang === 'es' ? 'Traje' : 'Suit'} {Math.round(hud.suitO2Percent)}%
            </span>
            <span className={hud.hydrationPercent < 55 ? 'text-rose-700 font-bold' : 'text-emerald-900 font-semibold'}>
              H₂O {Math.round(hud.hydrationPercent)}%
            </span>
            <span className={hud.airlockStep === 5 ? 'text-emerald-800 font-bold' : 'text-slate-800'}>
              {hud.airlockPressureKpa.toFixed(1)}kPa
            </span>
            <span className={hud.rpcmTripped ? 'text-rose-700 font-bold' : 'text-slate-800'}>
              120V:{hud.rpcmLoadKwe.toFixed(1)}kW{hud.rpcmTripped ? '!' : ''}
            </span>
          </div>
        </div>

        {/* Top-Right Compact [ESC] Button + Detailed Architectural Mini-Map */}
        <div className="pointer-events-auto flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              ignoreNextUnlockRef.current = true;
              document.exitPointerLock?.();
              lastEscOpenMsRef.current = performance.now();
              setActiveModal((m) => (m === 'esc_menu' ? null : 'esc_menu'));
            }}
            className="lp-btn px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-md"
          >
            <Sliders className="w-3 h-3 text-sky-700" />
            <span>
              [ESC] {lang === 'es' ? 'Menú' : 'Menu'} ({objectiveProgress.done}/{objectiveProgress.total})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              ignoreNextUnlockRef.current = true;
              document.exitPointerLock?.();
              lastEscOpenMsRef.current = performance.now();
              setActiveModal('esc_menu');
            }}
            title={lang === 'es' ? 'Ampliar Mapa Táctico [ESC]' : 'Expand Tactical Map [ESC]'}
            className="lp-panel hover:bg-white/75 rounded-lg p-1 shadow-lg text-left transition"
          >
            <svg viewBox="0 0 440 462" className="w-[126px] h-[132px] bg-slate-950/88 rounded border border-slate-400/35">
              {/* Subtle 2m radar grid */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((gi) => (
                <g key={gi} opacity="0.16">
                  <line x1={gi * 36} y1={0} x2={gi * 36} y2={462} stroke="#94a3b8" strokeWidth="1" />
                  <line x1={0} y1={gi * 36} x2={440} y2={gi * 36} stroke="#94a3b8" strokeWidth="1" />
                </g>
              ))}
              {/* Zone floor rectangles with active room tint */}
              {STATION_FLOOR_RECTS.map((r) => {
                const z = STATION_ZONES.find((sz) => sz.id === r.zoneId);
                const active = r.zoneId === currentZone.id;
                return (
                  <rect
                    key={r.id}
                    x={(r.minX + 1.4) * 18}
                    y={(16.2 - r.maxY) * 18}
                    width={(r.maxX - r.minX) * 18}
                    height={(r.maxY - r.minY) * 18}
                    fill={active ? `${z?.accentHex ?? '#38bdf8'}30` : `${z?.accentHex ?? '#475569'}10`}
                    stroke={z?.accentHex ?? '#64748b'}
                    strokeOpacity={r.id.startsWith('corr_') ? 0.55 : 0.85}
                    strokeWidth={active ? '2.2' : '1.4'}
                  />
                );
              })}
              {/* Architectural landmarks inside modules */}
              {/* SW NBL Pool water basin + submerged ISS truss */}
              <rect x={(0.15 + 1.4) * 18} y={(16.2 - -3.9) * 18} width={3.3 * 18} height={3.8 * 18} fill="#0284c755" stroke="#38bdf8" strokeWidth="1.2" rx="3" />
              <line x1={(0.5 + 1.4) * 18} y1={(16.2 - -4.5) * 18} x2={(3.1 + 1.4) * 18} y2={(16.2 - -7.1) * 18} stroke="#facc15" strokeWidth="1.5" opacity="0.7" />
              {/* South Orion Capsule & docking collar */}
              <circle cx={(10.0 + 1.4) * 18} cy={(16.2 - -6.1) * 18} r={22} fill="#f8fafc22" stroke="#f59e0b" strokeWidth="1.6" />
              <circle cx={(10.0 + 1.4) * 18} cy={(16.2 - -6.1) * 18} r={9} fill="#38bdf844" stroke="#f8fafc" strokeWidth="1" />
              {/* NE 4.5G Centrifuge track & compute racks */}
              <circle cx={(18.8 + 1.4) * 18} cy={(16.2 - 12.8) * 18} r={25} fill="none" stroke="#a855f7" strokeWidth="1.8" strokeDasharray="5 3" />
              <circle cx={(18.8 + 1.4) * 18} cy={(16.2 - 12.8) * 18} r={7} fill="#a855f766" />
              {/* North MEDS 3-MFD Cockpit Arc */}
              <path
                d={`M ${(8.2 + 1.4) * 18} ${(16.2 - 12.2) * 18} Q ${(10.0 + 1.4) * 18} ${(16.2 - 13.1) * 18} ${(11.8 + 1.4) * 18} ${(16.2 - 12.2) * 18}`}
                fill="none"
                stroke="#ff4f00"
                strokeWidth="3.2"
              />
              {/* East Lab APH Botanical Bed + Workbenches */}
              <rect x={(15.8 + 1.4) * 18} y={(16.2 - 6.3) * 18} width={3.2 * 18} height={1.4 * 18} fill="#10b98144" stroke="#22c55e" strokeWidth="1.2" />
              {/* SE 0g Fire Chamber + Machine Racks */}
              <rect x={(18.0 + 1.4) * 18} y={(16.2 - -4.4) * 18} width={2.8 * 18} height={2.4 * 18} fill="#ef444438" stroke="#f87171" strokeWidth="1.2" />
              {/* West Hab Bunks */}
              <rect x={(0.4 + 1.4) * 18} y={(16.2 - 6.2) * 18} width={1.2 * 18} height={2.5 * 18} fill="#38bdf833" stroke="#38bdf8" strokeWidth="1.2" />
              {/* Compact module acronyms */}
              {[
                { label: 'HAB', x: 3.1, y: 1.6, col: '#7dd3fc' },
                { label: 'HUB', x: 10.0, y: 3.4, col: '#cbd5e1' },
                { label: 'MEDS', x: 10.0, y: 10.2, col: '#fdba74' },
                { label: 'LAB', x: 17.2, y: 2.0, col: '#86efac' },
                { label: 'NBL', x: 2.8, y: -2.9, col: '#38bdf8' },
                { label: 'ORION', x: 10.0, y: -3.2, col: '#fcd34d' },
                { label: '4.5G', x: 18.8, y: 10.3, col: '#d8b4fe' },
                { label: 'ECLSS', x: 17.2, y: -6.8, col: '#fca5a5' },
              ].map((lbl) => (
                <text
                  key={lbl.label}
                  x={(lbl.x + 1.4) * 18}
                  y={(16.2 - lbl.y) * 18}
                  fill={lbl.col}
                  fontSize="13"
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity="0.88"
                >
                  {lbl.label}
                </text>
              ))}
              {/* Exterior bulkhead walls + cyan panoramic viewport */}
              {SPACE_ROOM_COLLIDERS.slice(0, WALL_COLLIDER_COUNT).map((b) => (
                <rect
                  key={b[6]}
                  x={(b[0] + 1.4) * 18}
                  y={(16.2 - b[4]) * 18}
                  width={Math.max(3, (b[3] - b[0]) * 18)}
                  height={Math.max(3, (b[4] - b[1]) * 18)}
                  fill={b[6] === 'Wall_WestHab_N_Win' ? '#38bdf8' : '#94a3b8'}
                  opacity="0.82"
                />
              ))}
              {/* Automatic sliding doors */}
              {simRef.current.doors.map((d) => (
                <rect
                  key={d.id}
                  x={(d.x - (d.axis === 'x' ? 0.2 : 1.0) + 1.4) * 18}
                  y={(16.2 - (d.y + (d.axis === 'y' ? 0.2 : 1.0))) * 18}
                  width={(d.axis === 'x' ? 0.4 : 2.0) * 18}
                  height={(d.axis === 'y' ? 0.4 : 2.0) * 18}
                  fill={d.openProgress > 0.5 ? '#10b981' : '#f59e0b'}
                />
              ))}
              {/* Loose world pickup items */}
              {simRef.current.worldItems.map((wi) => (
                <rect
                  key={wi.uid}
                  x={(wi.x + 1.4) * 18 - 2.5}
                  y={(16.2 - wi.y) * 18 - 2.5}
                  width="5"
                  height="5"
                  fill={wi.category === 'task' ? '#fde047' : '#e2e8f0'}
                  opacity="0.85"
                />
              ))}
              {/* Guided yellow dashed route */}
              {miniRouteAssigned && (
                <polyline
                  points={miniPathPtsStr}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="4.2"
                  strokeDasharray="6 6"
                />
              )}
              {/* Station pins */}
              {simRef.current.stations.map((st) => (
                <circle
                  key={st.id}
                  cx={(st.x + 1.4) * 18}
                  cy={(16.2 - st.y) * 18}
                  r={st.kind === 'npc_crew' ? 6.2 : 4.8}
                  fill={st.kind === 'npc_crew' ? '#c084fc' : st.done ? '#10b981' : '#38bdf8'}
                  stroke="#020617"
                  strokeWidth="1.2"
                />
              ))}
              {/* Target highlight */}
              {miniRouteAssigned ? (
                <g transform={`translate(${(guidedStep.targetX + 1.4) * 18}, ${(16.2 - guidedStep.targetY) * 18})`}>
                  <polygon points="0,-11 11,0 0,11 -11,0" fill="#facc15" stroke="#09090b" strokeWidth="2" />
                </g>
              ) : (
                <circle
                  cx={(guidedStep.targetX + 1.4) * 18}
                  cy={(16.2 - guidedStep.targetY) * 18}
                  r="8.5"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.6"
                />
              )}
              {/* Player FOV cone + directional arrow */}
              <g
                transform={`translate(${(hud.x + 1.4) * 18}, ${(16.2 - hud.y) * 18}) rotate(${-hud.yawDeg})`}
              >
                <polygon points="0,0 44,-24 44,24" fill="#22c55e" opacity="0.22" />
                <polygon points="11,0 -6,-6.5 -3,0 -6,6.5" fill="#22c55e" stroke="#ffffff" strokeWidth="1.6" />
              </g>
            </svg>
          </button>
        </div>
      </div>

      {/* Center Reticle + Strict Proximity-Only Context Prompt */}
      {!activeModal && !hud.sleeping && (
        <>
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(14,165,233,0.95)]" />
          </div>
          <div className="pointer-events-none fixed bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            {lookTarget.kind && (
              <div className="px-3 py-1 lp-panel rounded-md text-[11px] font-semibold text-slate-900 shadow-md">
                {lang === 'es' ? lookTarget.labelEs : lookTarget.labelEn}
              </div>
            )}
            {!pointerLocked && (
              <div className="mt-1 px-2.5 py-0.5 lp-panel rounded text-[10px] font-mono text-slate-800">
                {lang === 'es'
                  ? 'WASD mover · Clic mirar · [1-5] Casillas · [B] Mochila · [E] Usar · [ESC] Menú'
                  : 'WASD move · Click look · [1-5] Slots · [B] Bag · [E] Use · [ESC] Menu'}
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom-Left Compact Floating NASA Junior Astronaut Training Info Panel */}
      {trainingBrief && !activeModal && !hud.sleeping && (
        <div className="fixed bottom-2.5 left-2.5 z-20 max-w-[260px] lp-panel rounded-lg p-2 shadow-lg space-y-1 text-slate-900">
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-900 leading-tight">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'es' ? trainingBrief.titleEs : trainingBrief.titleEn}</span>
            </div>
            <button
              type="button"
              onClick={() => setTrainingBrief(null)}
              className="text-[10px] px-1 py-0.5 rounded bg-slate-900/15 hover:bg-slate-900/25 text-slate-800 font-semibold leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] leading-snug text-slate-800">
            {lang === 'es' ? trainingBrief.purposeEs : trainingBrief.purposeEn}
          </p>
          <div className="text-[9.5px] font-mono text-amber-800 pt-1 border-t border-slate-900/15">
            {lang === 'es' ? trainingBrief.nasaDataEs : trainingBrief.nasaDataEn}
            <div className="text-slate-700 mt-0.5">{trainingBrief.sourceDoc}</div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {banner && (
        <div
          className={`fixed bottom-20 right-2.5 z-30 px-2.5 py-1.5 lp-panel-solid rounded-md text-[11px] font-semibold shadow-lg border max-w-sm ${
            banner.tone === 'err'
              ? 'border-rose-500/70 text-rose-800'
              : banner.tone === 'warn'
              ? 'border-amber-500/70 text-amber-900'
              : 'border-emerald-500/70 text-emerald-900'
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* COMPACT LOCKDOWN-STYLE 5-SLOT QUICK HOTBAR [1–5] + EXPANDABLE 6-SLOT BACKPACK [B] */}
      <div className="pointer-events-none fixed bottom-2.5 right-2.5 z-20 flex flex-col items-end gap-1.5">
        {backpackOpen && (
          <div className="pointer-events-auto lp-panel-solid rounded-lg p-2 shadow-xl w-[264px] space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-900/15 pb-1">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-800 flex items-center gap-1">
                <Package className="w-3 h-3 text-sky-700" />
                {lang === 'es' ? `MOCHILA EVA (${bagFilledCount}/6) → [${activeSlot + 1}]` : `EVA BAG (${bagFilledCount}/6) → [${activeSlot + 1}]`}
              </span>
              <button
                type="button"
                onClick={() => setBackpackOpen(false)}
                className="text-[10px] px-1 py-0.5 rounded bg-slate-900/15 hover:bg-slate-900/25 text-slate-800 font-semibold leading-none"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {hud.backpack.map((item, bi) => (
                <button
                  key={bi}
                  type="button"
                  onClick={() => swapHotbarWithBagSlot(activeSlot, bi)}
                  className="lp-slot h-11 px-1.5 py-0.5 rounded text-left flex flex-col justify-between transition"
                  title={lang === 'es' ? `Intercambiar con casilla [${activeSlot + 1}]` : `Swap with slot [${activeSlot + 1}]`}
                >
                  <div className="text-[8.5px] font-mono text-slate-600 flex items-center justify-between">
                    <span>#{bi + 1}</span>
                    {item?.itemKey === 'DA_Battery' && <span className="text-sky-800">{item.charge}%</span>}
                  </div>
                  <div className="text-[9.5px] font-semibold text-slate-900 truncate">
                    {item ? getSpaceItemName(item.itemKey, lang) : '—'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pointer-events-auto lp-panel rounded-lg p-1 shadow-lg flex items-center gap-1">
          {/* 5 Compact Quick-Access Hotbar Slots [1]..[5] */}
          <div className="flex items-center gap-1">
            {hud.hotbar.map((item, slotIdx) => {
              const isSelected = slotIdx === hud.activeSlot;
              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => selectHotbarSlot(slotIdx)}
                  className={`w-[56px] sm:w-[64px] h-[38px] px-1.5 py-0.5 rounded-md text-left flex flex-col justify-between transition ${
                    isSelected ? 'lp-slot-active' : 'lp-slot'
                  }`}
                  title={
                    lang === 'es'
                      ? `Casilla rápida [${slotIdx + 1}] · Clic o Rueda ratón`
                      : `Quick slot [${slotIdx + 1}] · Click or Wheel`
                  }
                >
                  <div className="flex items-center justify-between text-[8.5px] font-mono leading-none">
                    <span className={isSelected ? 'text-sky-900 font-bold' : 'text-slate-600'}>
                      [{slotIdx + 1}]
                    </span>
                    {item?.itemKey === 'DA_Battery' ? (
                      <span className="text-sky-800 font-semibold">{item.charge}%</span>
                    ) : item?.itemKey === 'DA_VentFilter' ? (
                      <span className={item.clean ? 'text-emerald-800' : 'text-amber-800'}>
                        {item.clean ? 'OK' : 'DIRTY'}
                      </span>
                    ) : null}
                  </div>
                  <div className={`text-[9.5px] leading-tight truncate ${isSelected ? 'font-semibold text-slate-950' : 'text-slate-800'}`}>
                    {item ? getSpaceItemName(item.itemKey, lang) : '—'}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSwapInventory}
            className="lp-btn px-1.5 py-1.5 rounded-md text-[10px] font-mono font-semibold"
            title={lang === 'es' ? 'Guardar / Sacar rápido [R]' : 'Quick Stash / Swap [R]'}
          >
            [R] ⇄
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setBackpackOpen((b) => !b);
            }}
            className={`px-2 py-1.5 rounded-md text-[10px] font-mono font-semibold border flex items-center gap-1 ${
              backpackOpen ? 'lp-btn-accent' : 'lp-btn'
            }`}
            title={lang === 'es' ? 'Abrir / Cerrar Mochila 6 Ranuras [B]' : 'Toggle 6-Slot Backpack [B]'}
          >
            <Package className="w-3 h-3" />
            [B] {bagFilledCount}/6
          </button>

          {(lookTarget.kind ||
            hud.handItem?.itemKey === 'DA_Pizzushi' ||
            hud.handItem?.itemKey === 'DA_CookedRice' ||
            hud.handItem?.itemKey === 'DA_WaterPouch' ||
            hud.handItem?.itemKey === 'DA_LegacyTablet') && (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="lp-btn-accent px-2 py-1.5 rounded-md text-[10.5px] font-semibold"
            >
              {lookTarget.kind
                ? lang === 'es'
                  ? 'Usar [E]'
                  : 'Use [E]'
                : hud.handItem?.itemKey === 'DA_LegacyTablet'
                ? lang === 'es'
                  ? 'Leer'
                  : 'Read'
                : hud.handItem?.itemKey === 'DA_WaterPouch'
                ? lang === 'es'
                  ? 'Beber'
                  : 'Drink'
                : lang === 'es'
                ? 'Comer'
                : 'Consume'}
            </button>
          )}

          {hud.handItem && (
            <button
              type="button"
              onClick={handleThrowHandItem}
              className="lp-btn px-2 py-1.5 rounded-md text-[10px] font-mono font-semibold"
              title={lang === 'es' ? 'Lanzar objeto equipado [G] / [Clic Derecho]' : 'Throw equipped item [G] / [RMB]'}
            >
              {lang === 'es' ? 'Lanzar [G]' : 'Throw [G]'}
            </button>
          )}

          <button
            type="button"
            onClick={handleCycleThrowMode}
            className="lp-btn px-1.5 py-1.5 rounded-md text-[9.5px] font-mono font-semibold"
            title={lang === 'es' ? 'Cambiar gravedad de lanzamiento (1G / LowG / Denso / 0G)' : 'Cycle throw gravity mode'}
          >
            {hud.throwPhysicsMode === 'earth_1g'
              ? '1G'
              : hud.throwPhysicsMode === 'low_g'
              ? 'LowG'
              : hud.throwPhysicsMode === 'dense_atmo'
              ? 'Dense'
              : '0G'}
          </button>
        </div>
      </div>

      {/* KATHERINE · holographic mentor AI (ai_bridge/mentor_server.py + verified offline cards) */}
      <MentorHologram simRef={simRef} lang={lang} paused={!!activeModal || hud.sleeping} />

      {/* MODALS */}
      {activeModal === 'crew_dialogue' && crewDialogue && (
        <CrewDialogueModal
          lang={lang}
          crewId={crewDialogue.crewId}
          guidedStep={guidedStep}
          giftEs={crewDialogue.giftEs}
          giftEn={crewDialogue.giftEn}
          onAcceptMission={() => {
            simRef.current.missionAssigned = true;
            setCrewDialogue(null);
            setActiveModal(null);
            syncHudNow();
          }}
          onClose={() => {
            setCrewDialogue(null);
            setActiveModal(null);
            syncHudNow();
          }}
        />
      )}
      {activeModal === 'esc_menu' && (
        <EscTacticalMenuModal
          lang={lang}
          sim={simRef.current}
          playerX={hud.x}
          playerY={hud.y}
          playerYawDeg={hud.yawDeg}
          guidedStep={guidedStep}
          cameraMode={cameraMode === 'first' ? '1p' : '3p'}
          musicOn={musicOn}
          ambientOn={ambientOn}
          onToggleCamera={() => {
            setCameraMode((m) => (m === 'first' ? 'third' : 'first'));
            soundEngine.playClick();
          }}
          onToggleMusic={() => {
            soundEngine.unlock();
            const next = !musicOn;
            soundEngine.musicEnabled = next;
            setMusicOn(next);
            soundEngine.playClick();
          }}
          onToggleAmbient={() => {
            soundEngine.unlock();
            const next = !ambientOn;
            soundEngine.ambientEnabled = next;
            setAmbientOn(next);
            if (!next) {
              soundEngine.stopAmbientEnvironment();
            } else {
              soundEngine.setAmbientEnvironment(
                simRef.current.currentMissionId === 'tutorial_hab'
                  ? 'earth_jsc'
                  : simRef.current.currentMissionId === 'act4_storm_rover'
                  ? 'surface_alert'
                  : 'orbital_iss'
              );
            }
            soundEngine.playClick();
          }}
          onToggleLang={() => setLang((l) => (l === 'es' ? 'en' : 'es'))}
          onCycleLighting={() => {
            const order: LightingMode[] = ['day', 'circadian', 'spectral_magenta', 'blueprint_launch', 'alert'];
            simRef.current.lightingMode =
              order[(order.indexOf(simRef.current.lightingMode) + 1) % order.length];
            soundEngine.playClick();
            syncHudNow();
          }}
          onCycleThrowMode={handleCycleThrowMode}
          onResetRpcm={handleResetRpcm}
          onSelectMission={(mId) => enterMission(mId, true)}
          onOpenTerminal={() => setActiveModal('terminal')}
          onOpenPapers={() => {
            setCodexInit({
              tab: 'papers',
              paperId: hud.unlockedPapers[hud.unlockedPapers.length - 1] ?? 1,
              noteId: 1,
            });
            setActiveModal('codex');
          }}
          onOpenMirror={() => setActiveModal('mirror')}
          onReturnMainMenu={() => {
            soundEngine.stopAmbientEnvironment();
            setActiveModal(null);
            setScreen('menu');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'launch_transit' && launchTransitTarget && (
        <LaunchTransitModal
          lang={lang}
          fromMissionId={launchTransitTarget.from}
          toMissionId={launchTransitTarget.to}
          onComplete={() => applyMissionLoad(launchTransitTarget.to, launchTransitTarget.preserveCarry)}
          onCancel={() => {
            setLaunchTransitTarget(null);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'engineering' && (
        <EngineeringCalibrationModal
          lang={lang}
          stationKind={engineeringKind}
          sim={simRef.current}
          hasHandTool={handItemRef.current?.itemKey ?? null}
          onConfirm={(opt) => {
            const res = completeEngineeringCalibration(engineeringKind, simRef.current, handItemRef.current, opt);
            commitHandToSlot(res.handItem);
            animPulsesRef.current.use = 1.0;
            setActiveModal(null);
            if (res.trainingBriefKind) {
              const brief = getStationTrainingBrief(res.trainingBriefKind);
              if (brief) setTrainingBrief(brief);
            }
            pushBanner(lang === 'es' ? res.msgEs : res.msgEn, res.tone);
            syncHudNow();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'ascan_modal' && (
        <AscanTrainingModal
          lang={lang}
          mode={ascanMode}
          onComplete={(mode) => {
            const sim = simRef.current;
            const kindMap: Record<typeof mode, RoomStationKind> = {
              nbl: 'nbl_pool_station',
              computer: 'computer_formulas_station',
              centrifuge: 'centrifuge_station',
              fire: 'eclss_fire_station',
            };
            if (mode === 'nbl') sim.objectives.nblCertified = true;
            if (mode === 'computer') sim.objectives.computerCertified = true;
            if (mode === 'centrifuge') sim.objectives.centrifugeCertified = true;
            if (mode === 'fire') sim.objectives.fireDrillCertified = true;
            const st = sim.stations.find((s) => s.kind === kindMap[mode]);
            if (st) st.done = true;
            sim.missionAssigned = true;
            const brief = getStationTrainingBrief(kindMap[mode]);
            if (brief) setTrainingBrief(brief);
            soundEngine.playSuccess();
            pushBanner(
              lang === 'es'
                ? `Prueba NASA (${mode.toUpperCase()}) certificada al 100%`
                : `NASA ${mode.toUpperCase()} certification completed 100%`,
              'ok'
            );
            setActiveModal(null);
            syncHudNow();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'wall_manual' && (
        <WallManualPopupModal lang={lang} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'orion_preflight' && (
        <OrionPreFlightModal
          lang={lang}
          mode={orionPreflightMode}
          sim={simRef.current}
          inventoryKeys={allCarriedHud.filter((i): i is HeldItem => Boolean(i)).map((i) => i.itemKey)}
          onComplete={(mode) => {
            const sim = simRef.current;
            const kind: RoomStationKind = mode === 'fault_repair' ? 'orion_fault_panel' : 'orion_power_panel';
            if (mode === 'fault_repair') sim.objectives.preflightRepaired = true;
            if (mode === 'power_switches') sim.objectives.preflightSystemsOn = true;
            const st = sim.stations.find((s) => s.kind === kind);
            if (st) st.done = true;
            const brief = getStationTrainingBrief(kind);
            if (brief) setTrainingBrief(brief);
            soundEngine.playSuccess();
            pushBanner(
              lang === 'es'
                ? mode === 'fault_repair'
                  ? 'Pre-vuelo Orion: Falla criogénica y bus RS-25 reparados!'
                  : 'Pre-vuelo Orion: 5 sistemas encendidos y suministros OK! Siéntate en Asiento Comandante.'
                : mode === 'fault_repair'
                ? 'Orion Pre-Flight: Cryo leak & RS-25 bus repaired!'
                : 'Orion Pre-Flight: All 5 overhead systems ON! Board Commander Seat.',
              'ok'
            );
            setActiveModal(null);
            syncHudNow();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'checklist' && (
        <MissionChecklistModal
          lang={lang}
          missionId={hud.currentMissionId}
          objectives={hud.objectives}
          onSelectMission={(mId) => enterMission(mId, true)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'terminal' && (
        <TenVariableTelemetryModal
          lang={lang}
          sim={simRef.current}
          pos={{ x: hud.x, y: hud.y }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'codex' && (
        <SpacePaperCodexModal
          lang={lang}
          unlockedPapers={hud.unlockedPapers}
          unlockedNotes={hud.unlockedNotes}
          initialTab={codexInit.tab}
          initialPaperId={codexInit.paperId}
          initialNoteId={codexInit.noteId}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'crisis' && (
        <CrisisSimulatorModal
          lang={lang}
          onResolve={(choice) => {
            simRef.current.crisisDecision = choice;
            simRef.current.objectives.crisisSolved = true;
            const st = simRef.current.stations.find((s) => s.kind === 'crisis_quiz_station');
            if (st) st.done = true;
            if (!simRef.current.unlockedLegacyNotes.includes(1)) simRef.current.unlockedLegacyNotes.push(1);
            if (choice === 'water_priority') {
              simRef.current.waterLiters = Math.min(103, simRef.current.waterLiters + 4.5);
              simRef.current.activeRadio = {
                speakerId: 'KATHERINE',
                textEs: 'Decisión óptima NASA (Nota #1): Priorizaste agua potable y aire sobre el horno. ¡Escotilla Sur desbloqueada!',
                textEn: 'Optimal NASA choice (Note #1): Water recovery & air protected over oven. South Airlock hatch ready!',
                timestampSec: simRef.current.elapsedSec,
              };
              pushBanner(lang === 'es' ? 'Crisis resuelta: Agua & Aire protegidos (+Nota #1)' : 'Crisis solved: Water & Air protected (+Note #1)', 'ok');
            } else {
              simRef.current.waterLiters = Math.max(40, simRef.current.waterLiters - 12);
              pushBanner(lang === 'es' ? 'Advertencia: Pérdida hídrica por priorizar horno (Nota #1 desbloqueada)' : 'Warning: Water loss from prioritizing oven (Note #1 unlocked)', 'warn');
            }
            setActiveModal(null);
            soundEngine.playSuccess();
            syncHudNow();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'ending' && (
        <EndingDebriefModal
          lang={lang}
          endingId={endingIdModal}
          sim={simRef.current}
          onRestartCampaign={() => applyMissionLoad('tutorial_hab', false)}
          onContinueExploring={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'spawner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl lp-panel-solid rounded-xl p-5 space-y-3 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-900/12 pb-2">
              <h3 className="text-sm font-semibold text-sky-800">
                {lang === 'es' ? `EQUIPAR EN CASILLA [${activeSlot + 1}]` : `EQUIP TO SLOT [${activeSlot + 1}]`}
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="lp-btn px-2.5 py-1 rounded text-xs font-semibold">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[65vh] overflow-y-auto">
              {Object.keys(SPACE_ITEM_LABELS).map((itemKey) => (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => {
                    commitHandToSlot({
                      uid: `sp_${Date.now()}`,
                      itemKey,
                      charge: 100,
                      clean: true,
                      ammo: 0,
                    });
                    animPulsesRef.current.swap = 1.0;
                    soundEngine.playClick();
                    setActiveModal(null);
                    syncHudNow();
                  }}
                  className="lp-btn p-2.5 rounded-lg text-left text-xs"
                >
                  <div className="font-semibold text-slate-900">{getSpaceItemName(itemKey, lang)}</div>
                  <div className="text-[10px] font-mono text-slate-500">{itemKey}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'mirror' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-md p-4">
          <div className="w-full max-w-md lp-panel-solid rounded-xl p-5 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-900/12 pb-2">
              <h3 className="text-sm font-semibold text-sky-800 flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {lang === 'es' ? 'VESTIDOR DEL TRAJE EVA' : 'EVA SUIT CUSTOMIZER'}
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="lp-btn px-2.5 py-1 rounded text-xs font-semibold">
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUIT_COLORS.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSuitIdx(idx);
                    soundEngine.playClick();
                  }}
                  className={`w-7 h-7 rounded-md border-2 cursor-pointer transition ${
                    suitIdx === idx ? 'border-sky-600 scale-110 ring-2 ring-sky-400/50' : 'border-slate-400/60'
                  }`}
                  style={{ backgroundColor: c.primaryHex }}
                  title={lang === 'es' ? c.nameEs : c.nameEn}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VISOR_FACES.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFaceIdx(idx);
                    soundEngine.playClick();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs border ${
                    faceIdx === idx ? 'lp-btn-accent font-semibold' : 'lp-btn text-slate-700'
                  }`}
                >
                  {lang === 'es' ? f.labelEs : f.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceSinglePlayerGame;
