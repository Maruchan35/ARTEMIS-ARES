import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  BookOpen,
  Camera,
  ClipboardList,
  Compass,
  DoorOpen,
  Layers,
  Moon,
  Newspaper,
  Package,
  Radio,
  Rocket,
  Sparkles,
  Sun,
  User,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { NASA_CONSTANTS } from '../data/nasaConstants';
import {
  AETHER4_MISSIONS,
  CREW_COMPANIONS,
  EndingId,
  LAUNCH_STAGING_EVENTS,
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
  createInitialSpaceRoomState,
  createRoomSpawnPlayer,
  findRoomLookTarget,
  interactRoomStation,
  LightingMode,
  ROOM_BOUNDS,
  RoomCarryState,
  RoomLookTarget,
  SpaceRoomState,
  stepSpaceRoomPlayer,
  stepSpaceRoomSimulation,
} from '../game/spaceRoomSimulation';
import { soundEngine } from '../audio/soundEngine';
import { SpacePaperCodexModal } from './SpacePaperCodexModal';
import { MentorHologram } from './MentorHologram';
import {
  CrisisSimulatorModal,
  EndingDebriefModal,
  MissionChecklistModal,
  TenVariableTelemetryModal,
} from './SpaceMissionModals';

type ScreenMode = 'menu' | 'room';
type CameraMode = 'first' | 'third';
type LangMode = 'es' | 'en';
type MenuDrawer = 'home' | 'missions' | 'customize';
type RoomModal = null | 'checklist' | 'spawner' | 'terminal' | 'mirror' | 'codex' | 'crisis' | 'ending';

const SPACE_ITEM_LABELS: Record<string, { es: string; en: string }> = {
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
};

function getSpaceItemName(itemKey: string, lang: LangMode): string {
  const custom = SPACE_ITEM_LABELS[itemKey];
  if (custom) return custom[lang];
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
    ],
    manifest_launch: [obj.manifestConfigured, obj.launchCompleted],
    act1_2_surface: [obj.thermalFixed, obj.powerBalanced],
    act3_greenhouse: [obj.aphHarvested, obj.compostIsolated, obj.bios3Activated],
    act4_storm_rover: [obj.roverReturned, obj.regolithDeployed],
  };
  const arr = map[missionId];
  return { done: arr.filter(Boolean).length, total: arr.length };
}

export const SpaceSinglePlayerGame: React.FC = () => {
  const [screen, setScreen] = useState<ScreenMode>('menu');
  const [lang, setLang] = useState<LangMode>('es');
  const [audioOn, setAudioOn] = useState(soundEngine.enabled);
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

  const [codexInit, setCodexInit] = useState<{ tab: 'papers' | 'notes'; paperId: number; noteId: number }>({
    tab: 'papers',
    paperId: 1,
    noteId: 1,
  });
  const [endingIdModal, setEndingIdModal] = useState<EndingId>('ending_3_interplanetary_cradle');

  const [pointerLocked, setPointerLocked] = useState(false);
  const [banner, setBanner] = useState<{ text: string; tone: 'ok' | 'warn' | 'err' } | null>(null);
  const [lookTarget, setLookTarget] = useState<RoomLookTarget>({ kind: null, id: '', labelEs: '', labelEn: '' });

  // Core simulation refs (60fps loop)
  const playerRef = useRef<PlayerPhysicsState>(createRoomSpawnPlayer());
  const simRef = useRef<SpaceRoomState>(createInitialSpaceRoomState('tutorial_hab'));
  const handItemRef = useRef<HeldItem | null>(null);
  const bagItemRef = useRef<HeldItem | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const jumpQueueRef = useRef(false);
  const lookDeltaRef = useRef({ yaw: 0, pitch: 0 });
  const animPulsesRef = useRef({ reach: 0, use: 0, swap: 0, consume: 0 });
  const bannerTimerRef = useRef<number | null>(null);

  const panoramaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const menuMountRef = useRef<HTMLDivElement | null>(null);
  const roomMountRef = useRef<HTMLDivElement | null>(null);

  const [hud, setHud] = useState(() => ({
    currentMissionId: simRef.current.currentMissionId,
    x: playerRef.current.x,
    y: playerRef.current.y,
    hp: playerRef.current.hp,
    stamina: playerRef.current.stamina,
    crouching: false,
    sprinting: false,
    pressureKpa: simRef.current.cabinPressureKpa,
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
    eclssChoice: simRef.current.eclssChoice,
    powerChoice: simRef.current.powerChoice,
    roverChoice: simRef.current.roverChoice,
    objectives: { ...simRef.current.objectives },
    unlockedNotes: [...simRef.current.unlockedLegacyNotes],
    unlockedPapers: [...simRef.current.unlockedNewspapers],
    activeRadio: { ...simRef.current.activeRadio },
    handItem: null as HeldItem | null,
    bagItem: null as HeldItem | null,
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
      hp: p.hp,
      stamina: p.stamina,
      crouching: p.crouching,
      sprinting: p.sprinting,
      pressureKpa: s.cabinPressureKpa,
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
      eclssChoice: s.eclssChoice,
      powerChoice: s.powerChoice,
      roverChoice: s.roverChoice,
      objectives: { ...s.objectives },
      unlockedNotes: [...s.unlockedLegacyNotes],
      unlockedPapers: [...s.unlockedNewspapers],
      activeRadio: { ...s.activeRadio },
      handItem: handItemRef.current ? { ...handItemRef.current } : null,
      bagItem: bagItemRef.current ? { ...bagItemRef.current } : null,
      chargerPct: charger?.hasBattery ? Math.round(charger.progress) : 0,
      heaterPct: heater?.hasRice && heater?.hasWater ? Math.round(heater.progress) : 0,
    });
  }, []);

  const enterMission = useCallback(
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
      simRef.current = createInitialSpaceRoomState(missionId, carry);
      handItemRef.current = null;
      bagItemRef.current = null;
      setActiveMissionKey(missionId);
      setActiveModal(null);
      setCameraMode('first');
      setScreen('room');
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

  // Swap Hand <-> Bag [E]
  const handleSwapInventory = useCallback(() => {
    const h = handItemRef.current;
    const b = bagItemRef.current;
    if (h && !canItemStoreInBag(h.itemKey)) {
      soundEngine.playAlarm();
      pushBanner(
        lang === 'es'
          ? `${getSpaceItemName(h.itemKey, 'es')} es demasiado grande para la mochila`
          : `${getSpaceItemName(h.itemKey, 'en')} cannot fit in Bag Slot`,
        'warn'
      );
      return;
    }
    handItemRef.current = b;
    bagItemRef.current = h;
    playerRef.current.slowTier = getItemSlowTier(handItemRef.current?.itemKey ?? null);
    animPulsesRef.current.swap = 1.0;
    soundEngine.playClick();
    syncHudNow();
  }, [lang, pushBanner, syncHudNow]);

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

    simRef.current.worldItems.push({
      uid: h.uid,
      itemKey: h.itemKey,
      category: 'task',
      x: Math.max(0.3, Math.min(7.7, p.x + fx * 0.55)),
      y: Math.max(0.3, Math.min(6.7, p.y + fy * 0.55)),
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
    handItemRef.current = null;
    playerRef.current.slowTier = 0;
    animPulsesRef.current.use = 1.0;
    soundEngine.playClick();
    syncHudNow();
  }, [syncHudNow]);

  // Primary Action [LMB / Enter / HUD Button]
  const handlePrimaryAction = useCallback(() => {
    const sim = simRef.current;
    const target = findRoomLookTarget(playerRef.current, sim);

    // Consume hydrated meal / VEG-05 tomatoes / water pouch / tablet when not aiming at a station/pickup
    if (!target.kind && handItemRef.current) {
      const hk = handItemRef.current.itemKey;
      if (hk === 'DA_Pizzushi' || hk === 'DA_CookedRice' || hk === 'DA_WaterPouch') {
        handItemRef.current = null;
        playerRef.current.hp = Math.min(100, playerRef.current.hp + 20);
        playerRef.current.stamina = 100;
        playerRef.current.slowTier = 0;
        if (hk === 'DA_WaterPouch') {
          sim.waterLiters = Math.min(103, sim.waterLiters + 0.5);
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

      if (handItemRef.current) {
        if (!bagItemRef.current && canItemStoreInBag(handItemRef.current.itemKey)) {
          bagItemRef.current = handItemRef.current;
          handItemRef.current = null;
        } else {
          soundEngine.playAlarm();
          pushBanner(
            lang === 'es' ? 'Mano y Mochila ocupadas — Suelta con Clic Derecho' : 'Both Hand and Bag full — Drop with Right Click',
            'warn'
          );
          return;
        }
      }

      sim.worldItems.splice(idx, 1);
      handItemRef.current = {
        uid: it.uid,
        itemKey: it.itemKey,
        charge: it.charge,
        clean: it.clean ?? true,
        ammo: it.ammo ?? 0,
      };
      playerRef.current.slowTier = getItemSlowTier(it.itemKey);
      animPulsesRef.current.reach = 1.0;
      soundEngine.playClick();
      pushBanner(
        lang === 'es' ? `Recogido: ${getSpaceItemName(it.itemKey, 'es')}` : `Picked up: ${getSpaceItemName(it.itemKey, 'en')}`,
        'ok'
      );
      syncHudNow();
      return;
    }

    if (target.kind === 'station') {
      const res = interactRoomStation(target.id, sim, handItemRef.current);
      handItemRef.current = res.handItem;
      playerRef.current.slowTier = getItemSlowTier(res.handItem?.itemKey ?? null);

      if (res.consumeFoodAnim) animPulsesRef.current.consume = 1.0;
      else if (res.animType === 'use') animPulsesRef.current.use = 1.0;
      else animPulsesRef.current.reach = 1.0;

      if (res.tone === 'err') soundEngine.playAlarm();
      else if (res.animType === 'use') soundEngine.playTool('wrench');
      else soundEngine.playClick();

      if (res.advanceMission) {
        enterMission(res.advanceMission, true);
        return;
      }

      if (res.openTerminalModal) {
        document.exitPointerLock?.();
        setActiveModal('terminal');
      } else if (res.openMirrorModal) {
        document.exitPointerLock?.();
        setActiveModal('mirror');
      } else if (res.openCrisisModal) {
        document.exitPointerLock?.();
        setActiveModal('crisis');
      } else if (res.openLegacyNoteId) {
        document.exitPointerLock?.();
        setCodexInit({ tab: 'notes', paperId: 1, noteId: res.openLegacyNoteId });
        setActiveModal('codex');
      } else if (res.openNewspaperId) {
        document.exitPointerLock?.();
        setCodexInit({ tab: 'papers', paperId: res.openNewspaperId, noteId: 1 });
        setActiveModal('codex');
      } else if (res.openEndingModal) {
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
        document.exitPointerLock?.();
        setActiveModal((m) => (m === 'checklist' ? null : 'checklist'));
      } else if (e.code === 'KeyP') {
        document.exitPointerLock?.();
        setActiveModal((m) => (m === 'codex' ? null : 'codex'));
      } else if (e.code === 'KeyK') {
        document.exitPointerLock?.();
        setActiveModal((m) => (m === 'spawner' ? null : 'spawner'));
      } else if (e.code === 'KeyV') {
        setCameraMode((prev) => (prev === 'first' ? 'third' : 'first'));
        soundEngine.playClick();
      } else if (e.code === 'KeyE' && !activeModalRef.current) {
        handleSwapInventory();
      } else if (e.code === 'Enter' && !activeModalRef.current) {
        handlePrimaryAction();
      } else if (e.code === 'Space') {
        jumpQueueRef.current = true;
      } else if (e.code === 'Escape') {
        if (activeModalRef.current) setActiveModal(null);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== roomMountRef.current) return;
      if (activeModalRef.current) return;
      const dYaw = e.movementX * 0.14;
      const dPitch = -e.movementY * 0.14;
      playerRef.current.yawDeg = (playerRef.current.yawDeg + dYaw + 360) % 360;
      playerRef.current.pitchDeg = Math.max(-80, Math.min(80, playerRef.current.pitchDeg + dPitch));
      lookDeltaRef.current.yaw += dYaw;
      lookDeltaRef.current.pitch += dPitch;
    };

    const onPointerLockChange = () => {
      setPointerLocked(document.pointerLockElement === roomMountRef.current);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [handlePrimaryAction, handleSwapInventory, screen]);

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

    // Dynamic Interior Spectral Lighting
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.95);
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.58);
    const mainLight = new THREE.PointLight(0xf8fafc, 16, 18, 1.4);
    mainLight.position.set(4.0, 3.18, 3.5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);

    const bunkLamp = new THREE.PointLight(0xfde68a, 4.0, 6.5, 1.6);
    bunkLamp.position.set(0.75, 1.68, 4.8);

    const workLight = new THREE.PointLight(0xbae6fd, 6.0, 8.5, 1.5);
    workLight.position.set(4.0, 2.75, 3.65);

    const aphGlowLight = new THREE.PointLight(0xe879f9, 0, 7.5, 1.4);
    aphGlowLight.position.set(6.25, 2.25, 6.35);

    scene.add(hemiLight, ambientLight, mainLight, bunkLamp, workLight, aphGlowLight);

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

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

    // Floor & Acoustic Ceiling + 4 Spectral LED Troffers
    addBox(4.0, -0.08, 3.5, 8.3, 0.16, 7.3, floorMat, false);
    addBox(4.0, ROOM_BOUNDS.heightM + 0.08, 3.5, 8.3, 0.16, 7.3, ceilingMat, false);
    const ledCeilMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    for (const [lx, ly] of [
      [2.2, 2.0],
      [5.8, 2.0],
      [2.2, 5.0],
      [5.8, 5.0],
    ]) {
      const troffer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.7), ledCeilMat);
      troffer.position.set(lx, ROOM_BOUNDS.heightM - 0.02, ly);
      roomGroup.add(troffer);
    }

    // Perimeter Hermetic Walls
    addBox(-0.12, 1.7, 3.5, 0.24, 3.4, 7.2, wallPaddedMat, false);
    addBox(0.02, 0.45, 3.5, 0.06, 0.9, 7.0, wallMetalMat, true);
    addBox(8.12, 1.7, 3.5, 0.24, 3.4, 7.2, wallPaddedMat, false);
    addBox(7.98, 0.45, 3.5, 0.06, 0.9, 7.0, wallMetalMat, true);
    addBox(4.0, 1.7, -0.12, 8.2, 3.4, 0.24, wallPaddedMat, false);
    addBox(4.0, 0.45, 0.02, 8.0, 0.9, 0.06, wallMetalMat, true);

    // North Wall & Panoramic Viewport
    addBox(1.1, 1.7, 7.12, 2.2, 3.4, 0.24, wallPaddedMat, false);
    addBox(6.9, 1.7, 7.12, 2.2, 3.4, 0.24, wallPaddedMat, false);
    addBox(4.0, 0.525, 7.12, 3.6, 1.05, 0.24, wallMetalMat, true);
    addBox(4.0, 2.975, 7.12, 3.6, 0.85, 0.24, wallPaddedMat, false);
    addBox(4.0, 1.06, 7.04, 3.7, 0.08, 0.34, wallMetalMat);
    addBox(4.0, 2.54, 7.04, 3.7, 0.08, 0.34, wallMetalMat);
    addBox(2.22, 1.80, 7.04, 0.1, 1.5, 0.34, wallMetalMat);
    addBox(5.78, 1.80, 7.04, 0.1, 1.5, 0.34, wallMetalMat);
    addBox(4.0, 1.80, 7.08, 0.07, 1.48, 0.24, wallMetalMat);

    // Exterior Celestial Vista (Earth / Launch Stack / Moon / Mars depending on Mission!)
    const vistaBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 3.0),
      new THREE.MeshBasicMaterial({ map: tex.spaceBackdrop })
    );
    vistaBackdrop.position.set(4.0, 1.85, 8.25);
    vistaBackdrop.rotation.y = Math.PI;
    roomGroup.add(vistaBackdrop);

    const exteriorBodyMat = new THREE.MeshStandardMaterial({
      color:
        activeMissionKey === 'tutorial_hab'
          ? 0x1d4ed8
          : activeMissionKey === 'act3_greenhouse'
          ? 0x9a3412
          : activeMissionKey === 'manifest_launch'
          ? 0x0f2547
          : 0x475569,
      roughness: 0.7,
    });
    const exteriorPlanet = new THREE.Mesh(new THREE.SphereGeometry(2.6, 28, 20), exteriorBodyMat);
    exteriorPlanet.position.set(4.0, -0.5, 9.8);
    roomGroup.add(exteriorPlanet);

    // SLS / Shuttle Staging Wire Rocket outside Viewport during Manifest/Launch!
    const launchRocketGroup = new THREE.Group();
    launchRocketGroup.visible = activeMissionKey === 'manifest_launch';
    launchRocketGroup.position.set(4.0, 1.45, 7.85);
    const coreTank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.95, 16),
      new THREE.MeshBasicMaterial({ color: 0xf4f6f8 })
    );
    const srbL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.72, 12),
      new THREE.MeshBasicMaterial({ color: 0xd93025, wireframe: true })
    );
    srbL.position.set(-0.22, -0.08, 0);
    const srbR = srbL.clone();
    srbR.position.set(0.22, -0.08, 0);
    launchRocketGroup.add(coreTank, srbL, srbR);
    roomGroup.add(launchRocketGroup);

    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 1.44),
      new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.15,
        roughness: 0.05,
        metalness: 0.2,
        side: THREE.DoubleSide,
      })
    );
    windowGlass.position.set(4.0, 1.80, 7.10);
    roomGroup.add(windowGlass);

    const shutterLeft = new THREE.Mesh(new THREE.BoxGeometry(1.78, 1.45, 0.06), wallMetalMat);
    shutterLeft.position.set(2.2, 1.80, 7.02);
    const shutterRight = shutterLeft.clone();
    shutterRight.position.set(5.8, 1.80, 7.02);
    roomGroup.add(shutterLeft, shutterRight);

    // 4 Corner Pilasters + Handrails
    for (const [px, py] of [
      [0.16, 0.16],
      [7.84, 0.16],
      [0.16, 6.84],
      [7.84, 6.84],
    ]) {
      addBox(px, 1.7, py, 0.34, 3.4, 0.34, wallMetalMat);
    }
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3, metalness: 0.7 });
    addBox(0.06, 1.08, 3.25, 0.05, 0.05, 1.1, railMat);
    addBox(7.94, 1.08, 3.35, 0.05, 0.05, 1.0, railMat);

    const whiteFrameMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.45, metalness: 0.25 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.7 });
    const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xd93025, roughness: 0.35, metalness: 0.3 });
    const bluePipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.4 });
    const cyanLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const greenLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const amberLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Light Switch (`0.14, 3.50`) & Viewport Shutter Switch (`2.35, 6.86`)
    addBox(0.06, 1.32, 3.50, 0.08, 0.24, 0.18, darkMetalMat);
    const lightBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.10, 0.10), cyanLedMat);
    lightBtnMesh.position.set(0.11, 1.32, 3.50);
    roomGroup.add(lightBtnMesh);

    addBox(2.35, 1.32, 6.92, 0.20, 0.24, 0.08, darkMetalMat);
    const shutterBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.05), greenLedMat);
    shutterBtnMesh.position.set(2.35, 1.32, 6.87);
    roomGroup.add(shutterBtnMesh);

    // CIRCULAR AIRLOCK HATCH TO NEXT MISSION (`X=2.40, Y=0.04, Z=1.35`)
    const hatchGroup = new THREE.Group();
    hatchGroup.position.set(2.40, 1.35, 0.06);
    const hatchRim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.075, 14, 36), darkMetalMat);
    const hatchDoor = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.07, 28), whiteFrameMat);
    hatchDoor.rotation.x = Math.PI / 2;
    const hatchStripe = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.09, 0.09), crimsonMat);
    const hatchWheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 10, 20), crimsonMat);
    hatchWheel.position.z = 0.06;
    const hatchStatusLedMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const hatchLed = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), hatchStatusLedMat);
    hatchLed.position.set(0, 0.42, 0.06);
    hatchGroup.add(hatchRim, hatchDoor, hatchStripe, hatchWheel, hatchLed);
    roomGroup.add(hatchGroup);

    // CENTRAL ENGINEERING WORKBENCH (`4.0, 3.65`)
    addBox(4.0, 0.86, 3.65, 1.66, 0.08, 0.94, wallMetalMat);
    addBox(4.0, 0.905, 3.65, 1.45, 0.015, 0.75, new THREE.MeshStandardMaterial({ color: 0x0f2547, roughness: 0.8 }), false);
    for (const [lx, ly] of [
      [3.28, 3.25],
      [4.72, 3.25],
      [3.28, 4.05],
      [4.72, 4.05],
    ]) {
      addBox(lx, 0.42, ly, 0.09, 0.84, 0.09, darkMetalMat);
    }

    // NORTH DESK (`4.0, 6.62`) + MEDS / TERMINAL SCREEN
    addBox(4.0, 0.45, 6.62, 2.4, 0.90, 0.65, wallMetalMat);
    if (activeMissionKey === 'manifest_launch') {
      // Wide 11-LCD MEDS Glass Cockpit using generated texture
      addBox(4.0, 1.24, 6.68, 1.85, 0.56, 0.12, darkMetalMat);
      const medsFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.76, 0.48),
        new THREE.MeshStandardMaterial({
          map: tex.medsGlassCockpit,
          emissiveMap: tex.medsGlassCockpit,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.65,
          roughness: 0.25,
        })
      );
      medsFace.rotation.y = Math.PI;
      medsFace.position.set(4.0, 1.24, 6.61);
      roomGroup.add(medsFace);
      // Master Launch Red-Orange Stage Button
      const launchPad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.07, 16), crimsonMat);
      launchPad.position.set(4.0, 0.94, 6.38);
      roomGroup.add(launchPad);
    } else {
      addBox(4.0, 1.24, 6.66, 0.72, 0.44, 0.08, darkMetalMat);
      const termScreen = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.36, 0.02), cyanLedMat);
      termScreen.position.set(4.0, 1.24, 6.615);
      roomGroup.add(termScreen);
    }

    // EAST EVA SUIT MIRROR STATION (`7.6, 2.05`) + Live Mirrored Chibi
    addBox(7.58, 0.14, 2.05, 0.75, 0.28, 1.35, wallMetalMat);
    addBox(7.92, 1.35, 2.05, 0.08, 2.05, 1.18, darkMetalMat);
    const mirrorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.06, 1.90),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.9 })
    );
    mirrorGlass.rotation.y = -Math.PI / 2;
    mirrorGlass.position.set(7.87, 1.35, 2.05);
    roomGroup.add(mirrorGlass);

    const mirrorAstronaut: ChibiAstronautRig = createChibiAstronautRig(suitIdx, faceIdx);
    mirrorAstronaut.root.position.set(7.48, 0.28, 2.05);
    mirrorAstronaut.root.rotation.y = Math.PI;
    scene.add(mirrorAstronaut.root);

    // Tutorial Bunk Bed & West Galley / South ECLSS / East Power Racks (also shared silhouettes)
    addBox(0.68, 0.28, 4.85, 1.24, 0.56, 2.06, wallMetalMat);
    addBox(0.68, 0.65, 4.85, 1.18, 0.22, 1.98, bedFabricMat);
    addBox(0.68, 0.80, 5.58, 0.92, 0.14, 0.38, whiteFrameMat);
    addBox(0.14, 1.32, 4.85, 0.22, 1.48, 2.08, wallMetalMat);
    addBox(0.68, 2.15, 4.85, 1.22, 0.12, 2.08, wallMetalMat);

    // Dynamic Hardware Handles updated inside frame loop
    const chargerBayMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    const powerBoxLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leverPivot = new THREE.Group();
    const screwMeshes: THREE.Mesh[] = [];
    const heaterPadMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    let treadmillBeltMat: THREE.MeshBasicMaterial | null = null;
    let skylabPatchMesh: THREE.Mesh | null = null;
    let regolithDoorMesh: THREE.Mesh | null = null;
    let compostWheelMesh: THREE.Mesh | null = null;
    const holoOrbiters: THREE.Mesh[] = [];

    // EAST RACK (`7.55, 4.92`)
    addBox(7.55, 1.05, 4.92, 0.82, 2.1, 2.0, wallMetalMat);
    if (activeMissionKey === 'tutorial_hab' || activeMissionKey === 'act1_2_surface') {
      const chargerBay = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.22), chargerBayMat);
      chargerBay.position.set(7.13, 1.08, activeMissionKey === 'tutorial_hab' ? 5.45 : 5.75);
      roomGroup.add(chargerBay);
    }
    if (activeMissionKey === 'tutorial_hab') {
      const powerBoxLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.26), powerBoxLedMat);
      powerBoxLed.position.set(7.13, 1.48, 4.85);
      roomGroup.add(powerBoxLed);

      leverPivot.position.set(7.13, 1.30, 4.22);
      const leverRod = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.05), amberLedMat);
      leverRod.position.x = -0.10;
      leverPivot.add(leverRod);
      leverPivot.rotation.z = -0.55;
      roomGroup.add(leverPivot);
    }

    // SOUTH ECLSS RACK (`5.7, 0.44`)
    addBox(5.7, 1.05, 0.44, 1.65, 2.1, 0.84, wallMetalMat);
    if (activeMissionKey === 'tutorial_hab') {
      const ventGrille = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.05), darkMetalMat);
      ventGrille.position.set(5.25, 1.35, 0.87);
      roomGroup.add(ventGrille);
      for (const [sx, sy] of [
        [-0.22, -0.22],
        [0.22, -0.22],
        [-0.22, 0.22],
        [0.22, 0.22],
      ]) {
        const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 10), amberLedMat);
        sc.rotation.x = Math.PI / 2;
        sc.position.set(5.25 + sx, 1.35 + sy, 0.90);
        roomGroup.add(sc);
        screwMeshes.push(sc);
      }
      const regenDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.56, 18), bluePipeMat);
      regenDrum.position.set(6.12, 1.15, 0.72);
      roomGroup.add(regenDrum);
    }

    // WEST GALLEY COUNTER (`0.50, 1.95`)
    addBox(0.50, 0.46, 1.95, 0.95, 0.92, 1.75, wallMetalMat);
    if (activeMissionKey === 'tutorial_hab') {
      addBox(0.45, 1.12, 2.52, 0.42, 0.36, 0.36, whiteFrameMat);
      addBox(0.45, 1.15, 1.95, 0.38, 0.42, 0.32, bluePipeMat);
      const heaterPad = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.38), heaterPadMat);
      heaterPad.position.set(0.45, 1.06, 1.38);
      roomGroup.add(heaterPad);

      // ASCAN TREADMILL (`2.05, 5.55`)
      addBox(2.05, 0.08, 5.55, 0.72, 0.14, 1.38, darkMetalMat);
      treadmillBeltMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.03, 1.18), treadmillBeltMat);
      belt.position.set(2.05, 0.16, 5.55);
      roomGroup.add(belt);
      addBox(1.74, 0.56, 6.08, 0.06, 0.96, 0.06, whiteFrameMat);
      addBox(2.36, 0.56, 6.08, 0.06, 0.96, 0.06, whiteFrameMat);
      addBox(2.05, 1.05, 6.08, 0.68, 0.18, 0.18, darkMetalMat);

      // WHC HYGIENE BOOTH (`6.45, 6.65`)
      addBox(6.45, 1.15, 6.72, 0.92, 2.25, 0.55, wallMetalMat);
      const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 16, 1, true), whiteFrameMat);
      funnel.rotation.x = Math.PI;
      funnel.position.set(6.45, 1.05, 6.38);
      const whcHose = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 10), bluePipeMat);
      whcHose.rotation.z = 0.45;
      whcHose.position.set(6.22, 1.25, 6.42);
      const whcValve = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 16), crimsonMat);
      whcValve.position.set(6.14, 1.48, 6.42);
      roomGroup.add(funnel, whcHose, whcValve);

      // EVA Rule-of-8 Locker (`7.45, 2.72`)
      addBox(7.58, 1.35, 2.86, 0.65, 1.85, 0.52, whiteFrameMat);
      const evaOrangeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.65, 0.10), crimsonMat);
      evaOrangeStrip.position.set(7.24, 1.35, 2.86);
      roomGroup.add(evaOrangeStrip);
    } else if (activeMissionKey === 'manifest_launch') {
      // Holographic Manifest Spinners atop Center Table
      for (const [hx, col] of [
        [3.45, 0x38bdf8],
        [4.0, 0xf59e0b],
        [4.55, 0x22c55e],
      ] as [number, number][]) {
        const orb = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14, 0),
          new THREE.MeshBasicMaterial({ color: col, wireframe: true })
        );
        orb.position.set(hx, 1.14, 3.65);
        roomGroup.add(orb);
        holoOrbiters.push(orb);
      }
    } else if (activeMissionKey === 'act1_2_surface') {
      // Skylab Damaged Thermal Panel + Patch (`7.45, 5.15`)
      const breachGlow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.68), crimsonMat);
      breachGlow.position.set(7.12, 1.35, 5.15);
      roomGroup.add(breachGlow);
      skylabPatchMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.78, 0.74),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.25 })
      );
      skylabPatchMesh.position.set(7.10, 1.35, 5.15);
      skylabPatchMesh.visible = false;
      roomGroup.add(skylabPatchMesh);

      // KRUSTY 40 kWe Stirling & Radiator Umbrella (`4.0, 6.58`)
      const krustyCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.42, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f, roughness: 0.3, metalness: 0.7 })
      );
      krustyCore.position.set(4.0, 1.15, 6.48);
      const radUmbrella = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.14, 14), darkMetalMat);
      radUmbrella.rotation.x = Math.PI;
      radUmbrella.position.set(4.0, 1.42, 6.48);
      roomGroup.add(krustyCore, radUmbrella);

      // South SPE Electrolyzer glass bulbs (`5.45, 0.42`)
      for (const sx of [5.32, 5.58]) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), cyanLedMat);
        bulb.position.set(sx, 1.32, 0.86);
        roomGroup.add(bulb);
      }
    } else if (activeMissionKey === 'act3_greenhouse') {
      // APH / Veggie Quad-Locker Rack (`6.25, 6.55`) textured with tex.aphBotanicalRack
      addBox(6.25, 1.18, 6.66, 1.25, 1.88, 0.62, darkMetalMat);
      const aphFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.12, 1.72),
        new THREE.MeshStandardMaterial({
          map: tex.aphBotanicalRack,
          emissiveMap: tex.aphBotanicalRack,
          emissive: new THREE.Color(0xf0abfc),
          emissiveIntensity: 0.72,
          roughness: 0.35,
        })
      );
      aphFace.rotation.y = Math.PI;
      aphFace.position.set(6.25, 1.18, 6.34);
      roomGroup.add(aphFace);

      // South Compost Valve (`5.45, 0.42`)
      compostWheelMesh = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.032, 10, 18), crimsonMat);
      compostWheelMesh.position.set(5.45, 1.35, 0.89);
      roomGroup.add(compostWheelMesh);

      // West BIOS-3 1,000 L Water + Regolith Buffer Cylinder (`0.55, 2.05`)
      const bioTank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.85, 20),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55, roughness: 0.1 })
      );
      bioTank.position.set(0.55, 1.36, 2.05);
      roomGroup.add(bioTank);
    } else if (activeMissionKey === 'act4_storm_rover') {
      // Deployable 2 m Regolith Bulkhead Shield Plates (`7.45, 4.85`)
      regolithDoorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1.95, 1.78),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.2 })
      );
      regolithDoorMesh.position.set(7.15, 2.55, 4.85); // Drops down to Y=1.05 when deployed!
      roomGroup.add(regolithDoorMesh);
    }

    // Floating Station Objective Diamonds above active stations
    const beaconMap = new Map<string, { mesh: THREE.Mesh; baseZ: number }>();
    for (const st of simRef.current.stations) {
      if (['bunk_light_switch', 'window_shutter_button', 'suit_mirror_station'].includes(st.kind)) continue;
      const bMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.065, 0),
        new THREE.MeshBasicMaterial({ color: st.done ? 0x22c55e : 0x38bdf8 })
      );
      const baseZ = Math.min(2.6, st.z + 0.56);
      bMesh.position.set(st.x, baseZ, st.y);
      roomGroup.add(bMesh);
      beaconMap.set(st.id, { mesh: bMesh, baseZ });
    }

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
    const t0 = lastMs;

    const frame = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastMs) / 1000));
      const timeSec = (nowMs - t0) / 1000;
      lastMs = nowMs;

      const k = keysRef.current;
      const sim = simRef.current;
      const blocked = activeModalRef.current !== null || sim.sleeping;

      if (!blocked) {
        const forward = (k['KeyW'] ? 1 : 0) - (k['KeyS'] ? 1 : 0);
        const strafe = (k['KeyD'] ? 1 : 0) - (k['KeyA'] ? 1 : 0);

        if (k['ArrowLeft']) {
          playerRef.current.yawDeg = (playerRef.current.yawDeg - 135 * dt + 360) % 360;
          lookDeltaRef.current.yaw -= 135 * dt;
        }
        if (k['ArrowRight']) {
          playerRef.current.yawDeg = (playerRef.current.yawDeg + 135 * dt) % 360;
          lookDeltaRef.current.yaw += 135 * dt;
        }
        if (k['ArrowUp']) {
          playerRef.current.pitchDeg = Math.min(80, playerRef.current.pitchDeg + 90 * dt);
          lookDeltaRef.current.pitch += 90 * dt;
        }
        if (k['ArrowDown']) {
          playerRef.current.pitchDeg = Math.max(-80, playerRef.current.pitchDeg - 90 * dt);
          lookDeltaRef.current.pitch -= 90 * dt;
        }

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
          gravityMs2
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

      // Sync Spectral Lighting Modes (6,300 K SSLA / 2,700 K Circadian / 630+450 nm Magenta / #0F2547 Blueprint / Alert)
      if (sim.lightingMode === 'day') {
        mainLight.color.setHex(0xf4f9ff);
        mainLight.intensity = 16;
        ambientLight.color.setHex(0xdbeafe);
        ambientLight.intensity = 0.58;
        hemiLight.color.setHex(0xe0f2fe);
        hemiLight.groundColor.setHex(0x1e293b);
        hemiLight.intensity = 0.95;
        aphGlowLight.intensity = 0;
        ledCeilMat.color.setHex(0xe0f2fe);
        lightBtnMesh.material = cyanLedMat;
      } else if (sim.lightingMode === 'circadian') {
        mainLight.color.setHex(0xfdba74);
        mainLight.intensity = 11.5;
        ambientLight.color.setHex(0xfed7aa);
        ambientLight.intensity = 0.44;
        hemiLight.color.setHex(0xfed7aa);
        hemiLight.groundColor.setHex(0x1c1917);
        hemiLight.intensity = 0.65;
        aphGlowLight.intensity = 0;
        ledCeilMat.color.setHex(0xfde68a);
        lightBtnMesh.material = amberLedMat;
      } else if (sim.lightingMode === 'spectral_magenta') {
        mainLight.color.setHex(0xe879f9);
        mainLight.intensity = 12;
        ambientLight.color.setHex(0x86198f);
        ambientLight.intensity = 0.62;
        hemiLight.color.setHex(0xf0abfc);
        hemiLight.groundColor.setHex(0x2e1046);
        hemiLight.intensity = 0.85;
        aphGlowLight.intensity = 11.5;
        ledCeilMat.color.setHex(0xe879f9);
        lightBtnMesh.material = cyanLedMat;
      } else if (sim.lightingMode === 'blueprint_launch') {
        mainLight.color.setHex(0x93c5fd);
        mainLight.intensity = 14;
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
        mainLight.color.setHex(0xf87171);
        mainLight.intensity = 8.5 + pulse * 8.5;
        ambientLight.color.setHex(0x991b1b);
        ambientLight.intensity = 0.42;
        hemiLight.color.setHex(0xfca5a5);
        hemiLight.groundColor.setHex(0x1e1b18);
        hemiLight.intensity = 0.5;
        aphGlowLight.intensity = 0;
        ledCeilMat.color.setHex(0xf87171);
        lightBtnMesh.material = amberLedMat;
      }

      // Animate Shutters & Mission-Specific Dynamic Hardware
      const targetLeftX = sim.shutterOpen ? 1.35 : 3.1;
      const targetRightX = sim.shutterOpen ? 6.65 : 4.9;
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

      if (treadmillBeltMat) {
        treadmillBeltMat.color.setHex(sim.exercisingTimerSec > 0 ? 0x38bdf8 : sim.objectives.exerciseCalibrated ? 0x22c55e : 0x334155);
      }
      if (skylabPatchMesh) {
        skylabPatchMesh.visible = sim.objectives.thermalFixed;
      }
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

      for (const st of sim.stations) {
        const b = beaconMap.get(st.id);
        if (!b) continue;
        b.mesh.position.y = b.baseZ + Math.sin(timeSec * 3.2 + st.x) * 0.05;
        b.mesh.rotation.y += dt * 1.6;
        (b.mesh.material as THREE.MeshBasicMaterial).color.setHex(st.done ? 0x22c55e : 0x38bdf8);
      }

      const objSum = getMissionObjectiveSummary(sim.currentMissionId, sim.objectives);
      hatchStatusLedMat.color.setHex(objSum.done >= Math.min(2, objSum.total) ? 0x22c55e : 0xf59e0b);

      // Sync 3D Detailed Pickable Item Meshes
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

      const travelSpeed = Math.hypot(curP.vx, curP.vy);
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
        const camX = Math.max(0.35, Math.min(7.65, curP.x - fx * camDist));
        const camY = Math.max(0.35, Math.min(6.65, curP.y - fy * camDist));
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

      hudTimer += dt;
      if (hudTimer >= 0.1) {
        hudTimer = 0;
        const tgt = findRoomLookTarget(curP, sim);
        setLookTarget((prev) => (prev.id === tgt.id && prev.kind === tgt.kind ? prev : tgt));
        syncHudNow();
      }

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
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
  // RENDER 1: 1ST-VERSION BEVELED MAIN MENU + PANORAMA + LIVE 3D ASTRONAUT
  // ===========================================================================
  if (screen === 'menu') {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#040914] text-slate-100 select-none">
        {/* Animated Panoramic Space Backdrop */}
        <canvas ref={panoramaCanvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

        <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-stretch justify-between p-4 sm:p-6 gap-6 max-w-[1440px] mx-auto">
          {/* LEFT / CENTER COLUMN — 1st Version Minecraft/NASA Beveled Action Column */}
          <div className="w-full lg:w-[530px] shrink-0 flex flex-col justify-between space-y-4">
            {/* Top Utility Strip */}
            <div className="flex items-center justify-between gap-2">
              <div className="px-3 py-1 mc-panel text-[11px] font-black tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4F00]" />
                NASA BVAD / ESDMD-001 · SOLO LOCAL
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.enabled = !audioOn;
                    setAudioOn(!audioOn);
                    if (!audioOn) soundEngine.playClick();
                  }}
                  className="mc-btn px-2.5 py-1 text-xs font-black flex items-center gap-1"
                  title="Audio"
                >
                  {audioOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setLang((l) => (l === 'es' ? 'en' : 'es'));
                  }}
                  className="mc-btn px-3 py-1 text-xs font-black"
                >
                  {lang.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Iconic 1st-Version Title + Splash Badge */}
            <div className="relative py-2">
              <div className="inline-block mc-panel px-3 py-0.5 text-[10px] font-black tracking-widest text-[#FF4F00] mb-1">
                JUNIOR ASTRONAUT MISSION TRAINER · 2034
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_0_#090C12] leading-none">
                AETHER-4
              </h1>
              <div className="text-sm sm:text-base font-black text-cyan-300 tracking-wide mt-1">
                ARTEMIS-ARES · ORBITAL QUARTERS 3D
              </div>
              <div className="mc-splash inline-block mt-1 px-2.5 py-0.5 text-xs font-black text-amber-300">
                {lang === 'es' ? '¡100% Datos Reales NASA!' : '100% Real NASA Physics!'}
              </div>
            </div>

            {/* Dynamic Drawer Area */}
            {menuDrawer === 'home' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => enterMission('tutorial_hab', false)}
                  className="w-full py-3.5 px-4 mc-btn mc-btn-orange text-sm font-black tracking-wide flex items-center justify-center gap-2"
                >
                  <DoorOpen className="w-5 h-5" />
                  {lang === 'es'
                    ? 'INICIAR CAMPAÑA: FASE 0 (HABITACIÓN TUTORIAL)'
                    : 'START CAMPAIGN: PHASE 0 (TUTORIAL QUARTERS)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setMenuDrawer('missions');
                  }}
                  className="w-full py-3 px-4 mc-btn mc-btn-blue text-xs font-black tracking-wide flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  {lang === 'es' ? 'SELECCIONAR MISIÓN / FASE (FASES 0 A 4)' : 'SELECT MISSION / PHASE (PHASES 0 TO 4)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCodexInit({ tab: 'papers', paperId: 1, noteId: 1 });
                    setMenuCodexOpen(true);
                  }}
                  className="w-full py-3 px-4 mc-btn mc-btn-gold text-xs font-black tracking-wide flex items-center justify-center gap-2"
                >
                  <Newspaper className="w-4 h-4" />
                  {lang === 'es'
                    ? 'ARCHIVO SPACE PAPER DAILY REPORT & NOTAS DE LEGADO'
                    : 'SPACE PAPER DAILY REPORT & LEGACY NOTES'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setMenuDrawer('customize');
                  }}
                  className="w-full py-3 px-4 mc-btn text-xs font-black tracking-wide flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {lang === 'es'
                    ? 'PERSONALIZAR TRAJE EVA, VISOR Y HERRAMIENTAS'
                    : 'CUSTOMIZE EVA SUIT, VISOR & TOOLS'}
                </button>

                {/* Narrative Briefing Preview Box */}
                <div className="mc-panel p-3.5 text-xs space-y-2">
                  <div className="font-black text-cyan-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#FF4F00]" />
                    {lang === 'es' ? selectedMenuMission.badgeEs : selectedMenuMission.badgeEn}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {lang === 'es' ? selectedMenuMission.briefingEs : selectedMenuMission.briefingEn}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    {Object.values(CREW_COMPANIONS).map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-700"
                        style={{ color: c.accentHex }}
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
              <div className="mc-panel p-3.5 space-y-2.5 max-h-[68vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-xs font-black text-cyan-300">
                    {lang === 'es' ? 'TODAS LAS FASES AETHER-4' : 'ALL AETHER-4 MISSION PHASES'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuDrawer('home')}
                    className="mc-btn px-2.5 py-1 text-[11px] font-black"
                  >
                    ← {lang === 'es' ? 'Volver' : 'Back'}
                  </button>
                </div>

                <div className="space-y-2">
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
                        className={`w-full text-left p-2.5 mc-btn ${
                          selected ? 'mc-btn-blue ring-2 ring-white' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-black">
                          <span style={{ color: m.accentHex }}>{lang === 'es' ? m.badgeEs : m.badgeEn}</span>
                          <span className="text-slate-300">
                            {m.gravityMs2.toFixed(2)} m/s² · {m.kelvinLabel}
                          </span>
                        </div>
                        <div className="text-xs font-black text-white mt-0.5">
                          {lang === 'es' ? m.titleEs : m.titleEn}
                        </div>
                        <div className="text-[10px] text-slate-300 mt-0.5">
                          {lang === 'es' ? m.subtitleEs : m.subtitleEn}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => enterMission(selectedMenuMissionId, false)}
                  className="w-full py-3 px-4 mc-btn mc-btn-orange text-xs font-black flex items-center justify-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  {lang === 'es'
                    ? `DESPLEGAR EN: ${selectedMenuMission.badgeEs}`
                    : `LAUNCH: ${selectedMenuMission.badgeEn}`}
                </button>
              </div>
            )}

            {menuDrawer === 'customize' && (
              <div className="mc-panel p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-xs font-black text-cyan-300">
                    {lang === 'es' ? 'VESTIDOR CHIBI EVA & ANIMACIONES' : 'CHIBI EVA CUSTOMIZER & ANIMS'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuDrawer('home')}
                    className="mc-btn px-2.5 py-1 text-[11px] font-black"
                  >
                    ← {lang === 'es' ? 'Volver' : 'Back'}
                  </button>
                </div>

                <div>
                  <div className="text-[11px] text-slate-300 mb-1.5 font-bold">
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
                        className={`w-7 h-7 border-2 cursor-pointer ${
                          suitIdx === idx ? 'border-white scale-110 ring-2 ring-[#FF4F00]' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: c.primaryHex }}
                        title={lang === 'es' ? c.nameEs : c.nameEn}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-300 mb-1.5 font-bold">
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
                        className={`mc-btn px-2.5 py-1 text-[11px] font-bold ${
                          faceIdx === idx ? 'mc-btn-blue' : ''
                        }`}
                      >
                        {lang === 'es' ? f.labelEs : f.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-300 mb-1.5 font-bold">
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
                        className={`mc-btn px-2.5 py-1 text-[11px] font-bold ${
                          menuPreviewMode === mode ? 'mc-btn-gold' : ''
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[null, 'DA_ScrewDriver', 'DA_Battery', 'DA_DuctTapeKit', 'DA_ClayPillow', 'DA_RegolithSample'].map(
                      (key) => (
                        <button
                          key={String(key)}
                          type="button"
                          onClick={() => setMenuPreviewItem(key)}
                          className={`mc-btn px-2 py-1 text-[10px] font-bold ${
                            menuPreviewItem === key ? 'mc-btn-orange' : ''
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

            <div className="text-[10px] font-mono text-slate-400">
              SPACE APPS CHALLENGE · FASES AETHER-4 · WASD + RATÓN + [E] MOCHILA + [V] 1P/3P + [P] SPACE PAPER
            </div>
          </div>

          {/* RIGHT COLUMN — LIVE 3D CHIBI ASTRONAUT SHOWCASE */}
          <div className="relative flex-1 min-h-[380px] lg:min-h-[640px] flex flex-col">
            <div ref={menuMountRef} className="w-full h-full min-h-[380px]" />
            <div className="pointer-events-none absolute bottom-4 right-4 mc-panel px-3.5 py-2 text-xs text-slate-200">
              <span className="font-black text-cyan-300">CHIBI EVA RIG · 3D REAL TIME</span> ·{' '}
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
  // RENDER 2: SINGLE-PLAYER TEXTURED SPACE HABITATION & MULTI-PHASE MISSIONS
  // ===========================================================================
  const companion = CREW_COMPANIONS[hud.activeRadio.speakerId];

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 select-none font-sans"
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
          if (activeModal || hud.sleeping) return;
          if (e.button === 0) {
            if (document.pointerLockElement !== roomMountRef.current) {
              roomMountRef.current?.requestPointerLock?.();
            } else {
              handlePrimaryAction();
            }
          }
        }}
      />

      {/* Sleep Overlay Tint */}
      {hud.sleeping && (
        <div className="pointer-events-none fixed inset-0 bg-indigo-950/45 backdrop-blur-[2px] flex items-center justify-center z-30">
          <div className="px-6 py-4 mc-panel border-2 border-indigo-400 text-center space-y-1 shadow-2xl">
            <div className="flex items-center justify-center gap-2 text-indigo-300 font-black text-sm">
              <Moon className="w-4 h-4" />
              {lang === 'es' ? 'DESCANSO CIRCADIANO NASA (8.5 HORAS)' : 'NASA CIRCADIAN SLEEP CYCLE (8.5 H)'}
            </div>
            <div className="text-xs text-slate-300">
              {lang === 'es'
                ? `Estamina al 100% · Pulso ${Math.round(hud.bpm)} BPM · Quedan ${hud.sleepTimerSec.toFixed(1)}s`
                : `Stamina recovering to 100% · HR ${Math.round(hud.bpm)} BPM · ${hud.sleepTimerSec.toFixed(1)}s`}
            </div>
          </div>
        </div>
      )}

      {/* TOP HUD: 10-VARIABLE TELEMETRY BAR + RADIO + ACTION BUTTONS */}
      <div className="pointer-events-none fixed top-2.5 left-2.5 right-2.5 flex flex-col gap-2 z-20">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {/* Compact 10-Variable Strip */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 bg-[#0b1322]/95 backdrop-blur-md border-2 border-[#090C12] px-2.5 py-1.5 shadow-xl text-[11px] font-mono">
            <span
              className="font-black px-2 py-0.5 text-white"
              style={{ backgroundColor: activeMissionConfig.accentHex }}
            >
              {lang === 'es' ? activeMissionConfig.badgeEs : activeMissionConfig.badgeEn}
            </span>
            <span className={hud.o2Percent < 19.5 ? 'text-red-400 font-black' : 'text-cyan-300'}>
              O₂ {hud.o2Percent.toFixed(1)}%
            </span>
            <span className={hud.co2Ppm > 1200 ? 'text-amber-300 font-black' : 'text-slate-300'}>
              CO₂ {Math.round(hud.co2Ppm)}ppm
            </span>
            <span className="text-sky-300">H₂O {hud.waterLiters.toFixed(1)}L</span>
            <span className={hud.powerKwe < 5 ? 'text-red-400 font-black' : 'text-amber-300'}>
              {hud.powerKwe.toFixed(1)}kWe
            </span>
            <span className={hud.tempCelsius > 30 ? 'text-red-400 font-black' : 'text-emerald-300'}>
              {hud.tempCelsius.toFixed(1)}°C
            </span>
            <span className={hud.crewRadiationMsv >= 250 ? 'text-red-400 font-black' : 'text-slate-200'}>
              {Math.round(hud.crewRadiationMsv)}mSv
            </span>
            <span className="text-emerald-300 font-black">
              {objectiveProgress.done}/{objectiveProgress.total} OBJ
            </span>
            <span className="text-amber-200 flex items-center gap-1">
              {hud.lightingMode === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              {hud.lightingMode.toUpperCase()}
            </span>
          </div>

          {/* Right Menu Buttons */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCameraMode((m) => (m === 'first' ? 'third' : 'first'));
                soundEngine.playClick();
              }}
              className={`mc-btn px-2.5 py-1.5 text-xs font-black flex items-center gap-1 ${
                cameraMode === 'third' ? 'mc-btn-blue' : ''
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              [V] {cameraMode === 'first' ? '1P' : '3P'}
            </button>
            <button
              type="button"
              onClick={() => {
                document.exitPointerLock?.();
                setActiveModal((m) => (m === 'checklist' ? null : 'checklist'));
              }}
              className="mc-btn mc-btn-blue px-2.5 py-1.5 text-xs font-black flex items-center gap-1"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              [Q] {lang === 'es' ? 'Misión' : 'Mission'}
            </button>
            <button
              type="button"
              onClick={() => {
                document.exitPointerLock?.();
                setCodexInit({ tab: 'papers', paperId: hud.unlockedPapers[hud.unlockedPapers.length - 1] ?? 1, noteId: 1 });
                setActiveModal((m) => (m === 'codex' ? null : 'codex'));
              }}
              className="mc-btn mc-btn-gold px-2.5 py-1.5 text-xs font-black flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              [P] PAPER ({hud.unlockedPapers.length}/6)
            </button>
            <button
              type="button"
              onClick={() => {
                document.exitPointerLock?.();
                setActiveModal((m) => (m === 'spawner' ? null : 'spawner'));
              }}
              className="mc-btn px-2.5 py-1.5 text-xs font-black flex items-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5" />
              [K]
            </button>
            <button
              type="button"
              onClick={() => setLang((l) => (l === 'es' ? 'en' : 'es'))}
              className="mc-btn px-2 py-1.5 text-xs font-black"
            >
              {lang.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => {
                document.exitPointerLock?.();
                setScreen('menu');
              }}
              className="mc-btn mc-btn-orange px-2.5 py-1.5 text-xs font-black"
            >
              {lang === 'es' ? 'Menú' : 'Menu'}
            </button>
          </div>
        </div>

        {/* Tactical Crew Radio Strip */}
        <div className="pointer-events-auto max-w-2xl bg-[#0b1322]/95 border border-slate-700 border-l-4 px-3 py-1.5 text-[11px] flex items-center gap-2 shadow-lg" style={{ borderLeftColor: companion.accentHex }}>
          <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: companion.accentHex }} />
          <div>
            <span className="font-black mr-1.5" style={{ color: companion.accentHex }}>
              [{lang === 'es' ? companion.nameEs : companion.nameEn}]:
            </span>
            <span className="text-slate-100">{lang === 'es' ? hud.activeRadio.textEs : hud.activeRadio.textEn}</span>
          </div>
        </div>

        {/* Launch Staging Progress Bar during Phase 1 MEDS Cockpit */}
        {hud.currentMissionId === 'manifest_launch' && hud.launchStageIndex > 0 && (
          <div className="pointer-events-none max-w-xl bg-[#0F2547]/95 border border-cyan-400/50 px-3 py-1 text-[11px] font-mono text-cyan-200">
            STAGE {hud.launchStageIndex}/5:{' '}
            {lang === 'es'
              ? LAUNCH_STAGING_EVENTS[hud.launchStageIndex - 1]?.phaseEs
              : LAUNCH_STAGING_EVENTS[hud.launchStageIndex - 1]?.phaseEn}{' '}
            ({LAUNCH_STAGING_EVENTS[hud.launchStageIndex - 1]?.altitudeLabel})
          </div>
        )}
      </div>

      {/* Center Reticle + Context Prompt */}
      {!activeModal && !hud.sleeping && (
        <>
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-10">
            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(56,189,248,0.95)]" />
          </div>
          <div className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            {lookTarget.kind && (
              <div className="px-3.5 py-1.5 mc-panel border-2 border-cyan-400 text-xs font-black text-cyan-200 shadow-lg">
                [Clic / Enter] {lang === 'es' ? lookTarget.labelEs : lookTarget.labelEn}
              </div>
            )}
            {!pointerLocked && (
              <div className="mt-1.5 px-3 py-1 bg-slate-900/85 border border-slate-700 text-[11px] text-slate-300">
                {lang === 'es'
                  ? 'WASD mover · Clic en pantalla para mirar (o Flechas) · [V] Ver 3ª Persona · [P] Periódicos Space Paper'
                  : 'WASD move · Click viewport to look (or Arrows) · [V] 3rd Person · [P] Space Paper Codex'}
              </div>
            )}
          </div>
        </>
      )}

      {/* Feedback Banner */}
      {banner && (
        <div
          className={`fixed bottom-36 left-1/2 -translate-x-1/2 z-30 px-4 py-2 mc-panel text-xs font-black shadow-xl border-2 ${
            banner.tone === 'err'
              ? 'border-[#D93025] text-red-200'
              : banner.tone === 'warn'
              ? 'border-amber-400 text-amber-200'
              : 'border-emerald-400 text-emerald-200'
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Bottom Diegetic HUD (Vitals + 2-Slot Inventory) */}
      <div className="pointer-events-none fixed bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-3 z-20">
        <div className="pointer-events-auto mc-panel p-2.5 w-64 shadow-xl">
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-rose-400">HP {Math.round(hud.hp)}/100</span>
            <span className="text-slate-300 font-mono">
              {Math.round(hud.bpm)} BPM · {Math.round(hud.bpSys)}/{hud.bpDia}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 overflow-hidden mb-1.5">
            <div className="h-full bg-rose-500 transition-all" style={{ width: `${hud.hp}%` }} />
          </div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span className="text-cyan-400">STAMINA {Math.round(hud.stamina)}%</span>
            <span className="text-slate-400 text-[10px]">
              {hud.exercising ? 'ASCAN RUN' : hud.crouching ? '400 cm/s' : hud.sprinting ? '800 cm/s' : '600 cm/s'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${hud.stamina}%` }} />
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 mc-panel p-2.5 shadow-xl">
          <div className="w-[170px] px-3 py-1.5 bg-slate-900 border border-cyan-500/60">
            <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
              {lang === 'es' ? 'Mano (RMB Lanzar)' : 'Hand (RMB Throw)'}
            </div>
            <div className="text-xs font-bold text-white truncate">
              {hud.handItem
                ? `${getSpaceItemName(hud.handItem.itemKey, lang)}${
                    hud.handItem.itemKey === 'DA_Battery'
                      ? ` (${hud.handItem.charge}%)`
                      : hud.handItem.itemKey === 'DA_VentFilter'
                      ? hud.handItem.clean
                        ? ' (OK)'
                        : ' (Sucio)'
                      : ''
                  }`
                : lang === 'es'
                ? 'Vacía'
                : 'Empty'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwapInventory}
            className="mc-btn px-2.5 py-2 text-xs font-black"
            title="Intercambiar Mano / Mochila [E]"
          >
            [E] ⇄
          </button>

          <div className="w-[148px] px-3 py-1.5 bg-slate-900 border border-slate-600">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Package className="w-3 h-3" />
              {lang === 'es' ? 'Mochila (Bag)' : 'Bag Slot'}
            </div>
            <div className="text-xs font-semibold text-slate-200 truncate">
              {hud.bagItem ? getSpaceItemName(hud.bagItem.itemKey, lang) : lang === 'es' ? 'Vacía' : 'Empty'}
            </div>
          </div>

          {(lookTarget.kind ||
            hud.handItem?.itemKey === 'DA_Pizzushi' ||
            hud.handItem?.itemKey === 'DA_CookedRice' ||
            hud.handItem?.itemKey === 'DA_WaterPouch' ||
            hud.handItem?.itemKey === 'DA_LegacyTablet') && (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="mc-btn mc-btn-orange px-3 py-2 text-xs font-black"
            >
              {lookTarget.kind
                ? lang === 'es'
                  ? 'Usar'
                  : 'Use'
                : hud.handItem?.itemKey === 'DA_LegacyTablet'
                ? lang === 'es'
                  ? 'Leer Nota'
                  : 'Read Note'
                : lang === 'es'
                ? 'Consumir'
                : 'Consume'}
            </button>
          )}
        </div>
      </div>

      {/* KATHERINE · holographic mentor AI (ai_bridge/mentor_server.py + verified offline cards) */}
      <MentorHologram simRef={simRef} lang={lang} paused={!!activeModal || hud.sleeping} />

      {/* MODALS */}
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
          onRestartCampaign={() => enterMission('tutorial_hab', false)}
          onContinueExploring={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'spawner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl mc-panel border-2 border-cyan-500 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-cyan-300">
                {lang === 'es' ? 'EQUIPAR HERRAMIENTA EN MANO [K]' : 'EQUIP TOOL TO HAND [K]'}
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="mc-btn px-2.5 py-1 text-xs font-black">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[65vh] overflow-y-auto">
              {Object.keys(SPACE_ITEM_LABELS).map((itemKey) => (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => {
                    handItemRef.current = {
                      uid: `sp_${Date.now()}`,
                      itemKey,
                      charge: 100,
                      clean: true,
                      ammo: 0,
                    };
                    playerRef.current.slowTier = getItemSlowTier(itemKey);
                    animPulsesRef.current.swap = 1.0;
                    soundEngine.playClick();
                    setActiveModal(null);
                    syncHudNow();
                  }}
                  className="mc-btn p-2.5 text-left text-xs"
                >
                  <div className="font-bold text-white">{getSpaceItemName(itemKey, lang)}</div>
                  <div className="text-[10px] font-mono text-slate-400">{itemKey}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'mirror' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md mc-panel border-2 border-cyan-500 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-cyan-300 flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {lang === 'es' ? 'VESTIDOR DEL TRAJE EVA' : 'EVA SUIT CUSTOMIZER'}
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="mc-btn px-2.5 py-1 text-xs font-black">
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
                  className={`w-7 h-7 border-2 cursor-pointer ${suitIdx === idx ? 'border-white scale-110' : 'border-slate-700'}`}
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
                  className={`mc-btn px-2.5 py-1 text-xs font-bold ${
                    faceIdx === idx ? 'mc-btn-blue' : ''
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
