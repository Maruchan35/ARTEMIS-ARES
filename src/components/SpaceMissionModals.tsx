import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Camera,
  CheckCircle2,
  Circle,
  Compass,
  Flame,
  Gauge,
  Globe,
  Home,
  Info,
  Lightbulb,
  LogOut,
  MapPin,
  MessageSquare,
  Power,
  Radio,
  Rocket,
  Shield,
  ShieldAlert,
  Sliders,
  Sprout,
  Trophy,
  UserCheck,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { NASA_CONSTANTS } from '../data/nasaConstants';
import {
  AETHER4_MISSIONS,
  CREW_COMPANIONS,
  CrewCompanion,
  EndingId,
  MISSION_ENDINGS,
  MissionId,
} from '../data/aether4StoryData';
import {
  GuidedStepInfo,
  LightingMode,
  RoomObjectiveProgress,
  RoomStationKind,
  SPACE_ROOM_COLLIDERS,
  STATION_FLOOR_RECTS,
  SpaceRoomState,
  STATION_ZONES,
  WALL_COLLIDER_COUNT,
  computeStationPathWaypoints,
  getRoomZoneAt,
  getStationTrainingBrief,
} from '../game/spaceRoomSimulation';
import { soundEngine } from '../audio/soundEngine';

export const CrisisSimulatorModal: React.FC<{
  lang: 'es' | 'en';
  onResolve: (choice: 'water_priority' | 'food_priority') => void;
  onClose: () => void;
}> = ({ lang, onResolve, onClose }) => {
  const [selected, setSelected] = useState<'water_priority' | 'food_priority' | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-500/45 p-5 space-y-4 text-zinc-100">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold tracking-wider text-xs uppercase">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            {lang === 'es'
              ? 'FASE 0 · SIMULADOR DE CRISIS ECLSS / WHC'
              : 'PHASE 0 · ECLSS / WHC CRISIS SIMULATOR'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lp-btn px-2.5 py-1 text-xs"
          >
            ✕
          </button>
        </div>

        <p className="text-xs leading-relaxed text-zinc-200 bg-white/[0.06] p-3 rounded border border-white/15">
          {lang === 'es'
            ? `Fuga simulada en la línea del WHC y tanque de agua potable tras el día 80 de misión (límite de ciclo abierto). La IA KATHERINE pide priorizar los recursos siguiendo la ley biológica real NASA (BVAD):`
            : `Simulated leak in the WHC / potable water manifold past Day 80 (open-loop breakeven). Tactical AI KATHERINE prompts for emergency priority under real NASA physiological limits (BVAD):`}
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSelected('water_priority');
            }}
            className={`p-3.5 rounded-lg text-left space-y-1 transition-all border ${
              selected === 'water_priority'
                ? 'bg-emerald-500/20 border-emerald-300 ring-1 ring-emerald-300'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-sky-200">
              <span>
                {lang === 'es'
                  ? 'OPCIÓN A · Desviar Potencia al Reciclador WHC/WPA y Aire (Prioridad NASA)'
                  : 'OPTION A · Route Power to WHC/WPA Water Recovery & O₂ (NASA Priority)'}
              </span>
              {selected === 'water_priority' && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
            </div>
            <div className="text-[11px] text-zinc-300 leading-relaxed">
              {lang === 'es'
                ? `“Sin atmósfera mueres en minutos; sin agua mueres en días (pérdida mortal del ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% peso); sin comida resistes semanas.” Protege 2.79 L/día potable + 0.84 kg/día O₂.`
                : `"Without atmosphere you die in minutes; without water in days (${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% lethal body loss); without food you survive weeks." Protects 2.79 L/d water + 0.84 kg/d O₂.`}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSelected('food_priority');
            }}
            className={`p-3.5 rounded-lg text-left space-y-1 transition-all border ${
              selected === 'food_priority'
                ? 'bg-amber-500/20 border-amber-300 ring-1 ring-amber-300'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-amber-200">
              <span>
                {lang === 'es'
                  ? 'OPCIÓN B · Mantener Horno de Comida Galley y Congelar Agua WHC'
                  : 'OPTION B · Keep Galley Oven Heating & Throttle WHC Water Loop'}
              </span>
              {selected === 'food_priority' && <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />}
            </div>
            <div className="text-[11px] text-zinc-300 leading-relaxed">
              {lang === 'es'
                ? 'Prioriza confort calórico (0.80 kg/día) permitiendo drenaje en el depósito hídrico de 103.0 kg.'
                : 'Prioritizes caloric comfort (0.80 kg/day) while allowing the 103.0 kg water reserve to drop.'}
            </div>
          </button>
        </div>

        {selected && (
          <div className="bg-white/[0.08] border border-white/25 rounded-lg p-3 space-y-2">
            <div className="text-[11px] font-mono text-zinc-100">
              {selected === 'water_priority'
                ? lang === 'es'
                  ? 'VEREDICTO BVAD: ÓPTIMO — La recuperación hídrica WPA/WHC evita deshidratación letal (-20% masa corporal en <5 días).'
                  : 'BVAD VERDICT: OPTIMAL — WPA/WHC water loop preservation prevents lethal dehydration (-20% body mass in <5 days).'
                : lang === 'es'
                ? 'ALERTA BVAD: SUBÓPTIMO — Sin recuperación hídrica WHC, la reserva de 103.0 kg cae por debajo del umbral crítico.'
                : 'BVAD WARNING: SUBOPTIMAL — Without WHC recovery, the 103.0 kg water reserve degrades rapidly.'}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  onResolve(selected);
                }}
                className="lp-btn-accent px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {lang === 'es' ? 'CONFIRMAR DECISIÓN Y AVANZAR' : 'CONFIRM DECISION & CONTINUE'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const EndingDebriefModal: React.FC<{
  lang: 'es' | 'en';
  endingId: EndingId;
  sim: SpaceRoomState;
  onRestartCampaign: () => void;
  onContinueExploring: () => void;
}> = ({ lang, endingId, sim, onRestartCampaign, onContinueExploring }) => {
  const summary = MISSION_ENDINGS[endingId];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl mc-panel border-4 p-5 space-y-4"
        style={{ borderColor: summary.accentHex }}
      >
        <div className="flex items-center justify-between border-b-2 border-[#090C12] pb-2">
          <div className="flex items-center gap-2 font-black text-sm" style={{ color: summary.accentHex }}>
            {endingId === 'ending_3_interplanetary_cradle' ? (
              <Trophy className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
            {lang === 'es' ? summary.titleEs : summary.titleEn}
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300">
            {summary.missionsBase}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-slate-100 bg-slate-900/90 p-3.5 border border-slate-700">
          {lang === 'es' ? summary.summaryEs : summary.summaryEn}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="p-2 bg-slate-900 border border-slate-700">
            <div className="text-slate-400">O₂ CABINA</div>
            <div className="font-black text-cyan-300">{sim.o2Percent.toFixed(1)}%</div>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-700">
            <div className="text-slate-400">ENERGÍA FSP</div>
            <div className="font-black text-amber-300">{sim.powerKwe.toFixed(1)} kWe</div>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-700">
            <div className="text-slate-400">DOSIS SPE</div>
            <div className={`font-black ${sim.crewRadiationMsv < 250 ? 'text-emerald-400' : 'text-red-400'}`}>
              {sim.crewRadiationMsv.toFixed(1)} mSv
            </div>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-700">
            <div className="text-slate-400">NOTAS LEGADO</div>
            <div className="font-black text-white">{sim.unlockedLegacyNotes.length} / 6</div>
          </div>
        </div>

        <div className="text-[11px] text-slate-300">
          <strong>{lang === 'es' ? 'Tono histórico:' : 'Tone:'}</strong>{' '}
          {lang === 'es' ? summary.toneEs : summary.toneEn} · ECLSS:{' '}
          <span className="text-cyan-300">{sim.eclssChoice}</span> · Power:{' '}
          <span className="text-amber-300">{sim.powerChoice}</span> · Shield 2m:{' '}
          <span className={sim.objectives.regolithDeployed ? 'text-emerald-400' : 'text-red-400'}>
            {sim.objectives.regolithDeployed ? 'OK (300 g/cm²)' : 'NO'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <button type="button" onClick={onContinueExploring} className="mc-btn px-3.5 py-2 text-xs font-black">
            {lang === 'es' ? 'SEGUIR EXPLORANDO MÓDULO' : 'CONTINUE EXPLORING'}
          </button>
          <button
            type="button"
            onClick={onRestartCampaign}
            className="mc-btn mc-btn-orange px-4 py-2 text-xs font-black flex items-center gap-1.5"
          >
            <Rocket className="w-4 h-4" />
            {lang === 'es' ? 'REINICIAR CAMPAÑA AETHER-4' : 'RESTART AETHER-4 CAMPAIGN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TenVariableTelemetryModal: React.FC<{
  lang: 'es' | 'en';
  sim: SpaceRoomState;
  pos: { x: number; y: number };
  onClose: () => void;
}> = ({ lang, sim, pos, onClose }) => {
  const rows: [string, string, string][] = [
    ['1. O₂ % (BVAD 21.0% / Hipoxia <19%)', `${sim.o2Percent.toFixed(2)}%`, sim.o2Percent >= 19.5 ? 'text-emerald-300' : 'text-red-400'],
    ['2. CO₂ ppm (Eliminación 1.08 kg/d)', `${Math.round(sim.co2Ppm)} ppm`, sim.co2Ppm < 1000 ? 'text-emerald-300' : 'text-amber-300'],
    ['3. Agua Reserva (Capacidad 103 kg)', `${sim.waterLiters.toFixed(1)} L`, 'text-cyan-300'],
    ['4. Energía Neta (FSP 40 / Solar 20 kWe)', `${sim.powerKwe.toFixed(1)} kWe`, sim.powerKwe >= 10 ? 'text-amber-300' : 'text-red-400'],
    ['5. Temp. Cabina (Máx 163 W/m²)', `${sim.tempCelsius.toFixed(1)} °C`, sim.tempCelsius < 28 ? 'text-emerald-300' : 'text-red-400'],
    ['6. Humedad Relativa (Sudor/Vapor)', `${sim.humidityPercent.toFixed(0)}%`, 'text-cyan-200'],
    ['7. Alimento Seco (0.80 kg/p/día)', `${sim.foodKg.toFixed(1)} kg`, 'text-emerald-200'],
    ['8. Batería Auxiliar', `${Math.round(sim.batteryPercent)}%`, 'text-amber-200'],
    ['9. Radiación (Límite SPE 250 mSv)', `${sim.crewRadiationMsv.toFixed(1)} mSv`, sim.crewRadiationMsv < 250 ? 'text-emerald-300' : 'text-red-400'],
    ['10. Residuos + Moral (1.75L orina + 0.08kg)', `${sim.wasteKg.toFixed(2)} kg · ${Math.round(sim.crewMoralePercent)}%`, 'text-slate-200'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl mc-panel border-2 border-emerald-500 p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <span className="font-black text-emerald-300">
            MEDS / BVAD — 10 VARIABLES NASA ({sim.currentMissionId.toUpperCase()})
          </span>
          <button type="button" onClick={onClose} className="mc-btn px-2.5 py-0.5 text-xs font-black">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map(([label, val, cls]) => (
            <div key={label} className="p-2 bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400">{label}</span>
              <span className={`font-black text-xs mt-0.5 ${cls}`}>{val}</span>
            </div>
          ))}
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div>
            PRESIÓN: {sim.cabinPressureKpa.toFixed(1)} kPa · CALOR INTERNO: {sim.internalHeatWm2} W/m² · BPM:{' '}
            {Math.round(sim.heartRateBpm)} ({Math.round(sim.bpSys)}/{sim.bpDia})
          </div>
          <div>
            ARQUITECTURA: ECLSS={sim.eclssChoice} · POWER={sim.powerChoice} · ROVER={sim.roverChoice} · POS=({pos.x.toFixed(1)}, {pos.y.toFixed(1)}m)
          </div>
          <div className="text-cyan-300">
            {lang === 'es' ? CREW_COMPANIONS.KATHERINE.tributeEs : CREW_COMPANIONS.KATHERINE.tributeEn}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MissionChecklistModal: React.FC<{
  lang: 'es' | 'en';
  missionId: MissionId;
  objectives: RoomObjectiveProgress;
  onSelectMission: (m: MissionId) => void;
  onClose: () => void;
}> = ({ lang, missionId, objectives, onSelectMission, onClose }) => {
  const missionCfg = AETHER4_MISSIONS.find((m) => m.id === missionId) ?? AETHER4_MISSIONS[0];

  const objectiveRows: { done: boolean; es: string; en: string }[] =
    missionId === 'tutorial_hab'
      ? [
          { done: objectives.sleepCompleted, es: 'Litera Tripulante (8.5 h ciclo NASA)', en: 'Crew Bunk Rest (8.5 h NASA cycle)' },
          { done: objectives.exerciseCalibrated, es: 'Caminadora ASCAN (2.0 h/día · 82 kg)', en: 'ASCAN Treadmill (2.0 h/d · 82 kg)' },
          { done: objectives.whcInspected, es: 'Compartimento Higiene WHC STS-126', en: 'WHC Hygiene Rack Inspection' },
          { done: objectives.evaChecked, es: 'Vestidor EVA Regla del 8 (8h · 1L)', en: 'EVA Locker Rule of 8 (8h · 1L)' },
          { done: objectives.powerRestored, es: 'Energía FSP (Batería 100% + Fusible + Palanca)', en: 'FSP Power (100% Battery + Fuse + Lever)' },
          { done: objectives.eclssCleaned, es: 'Conducto ECLSS (4 Tornillos + Regenerar LiOH)', en: 'ECLSS Vent (4 Screws + Clean LiOH)' },
          { done: objectives.mealPrepared, es: 'Nutrición Galley BVAD (Ración + Agua)', en: 'BVAD Galley Meal (Ration + Water)' },
          { done: objectives.crisisSolved, es: 'Simulacro Crisis Agua ECLSS/WHC', en: 'ECLSS/WHC Water Leak Crisis Drill' },
          { done: objectives.nblCertified, es: 'Certificación Piscina NBL (61.5 m · xEMU 29.6 kPa)', en: 'NBL Pool Certification (61.5 m · xEMU 29.6 kPa)' },
          { done: objectives.computerCertified, es: 'Examen Fórmulas NASA (I=I₀/r², P=ρgh, Δv)', en: 'NASA Formula Exam (I=I₀/r², P=ρgh, Δv)' },
          { done: objectives.centrifugeCertified, es: 'Centrífuga 4.5 G (Traje 52% + AGSM)', en: '4.5 G Centrifuge Drill (52% Suit + AGSM)' },
          { done: objectives.fireDrillCertified, es: 'Simulacro Incendio 0g ISS Rack #2 (<15 ppm CO)', en: 'ISS 0g Rack #2 Fire Drill (<15 ppm CO)' },
        ]
      : missionId === 'manifest_launch'
      ? [
          { done: objectives.manifestConfigured, es: 'Configurar Manifiesto MEDS en Cubierta Norte', en: 'Configure MEDS Manifest on North Deck' },
          { done: objectives.preflightRepaired, es: 'Reparar Falla Criogénica + Bus RS-25 dentro de Orion', en: 'Repair Cryo Valve + RS-25 Fuse inside Orion' },
          { done: objectives.preflightSystemsOn, es: 'Encender 5 Sistemas Overhead y Verificar Suministros', en: 'Switch 5 Overhead Systems & Verify Supplies' },
          { done: objectives.launchCompleted, es: 'Sentarse en Asiento Comandante y Completar Vuelo 3D', en: 'Sit in Commander Seat & Complete 3D Flight/Landing' },
        ]
      : missionId === 'act1_2_surface'
      ? [
          { done: objectives.thermalFixed, es: 'Acto 1: Reparar Panel Térmico Skylab/Apollo 13 (Pared Este)', en: 'Act 1: Patch Skylab/Apollo 13 Thermal Panel (East)' },
          { done: objectives.powerBalanced, es: 'Acto 2: Equilibrar Reactor KRUSTY 40 kWe + Electrólisis SPE', en: 'Act 2: Balance 40 kWe KRUSTY + SPE Electrolysis' },
        ]
      : missionId === 'act3_greenhouse'
      ? [
          { done: objectives.aphHarvested, es: 'Cosechar VEG-05 en Cámara Magenta APH (630+450 nm)', en: 'Harvest VEG-05 in APH Magenta Chamber (630+450 nm)' },
          { done: objectives.compostIsolated, es: 'Cerrar Válvula Compostaje Microbiano (Pared Sur)', en: 'Seal Microbial Compost Valve (South Rack)' },
          { done: objectives.bios3Activated, es: 'Activar Tanque BIOS-3 (1,000 L Agua + 400 kg Regolito)', en: 'Activate BIOS-3 Tank (1,000 L + 400 kg Regolith)' },
        ]
      : missionId === 'act4_storm_rover'
      ? [
          { done: objectives.roverReturned, es: 'Piloto Consola Rover 6,000 kg de vuelta a Esclusa', en: 'Drive 6,000 kg Rover Console back to Base' },
          { done: objectives.regolithDeployed, es: 'Desplegar Blindaje Regolito 2 m (300 g/cm² · 400 t)', en: 'Deploy 2 m Regolith Shield (300 g/cm² · 400 t)' },
        ]
      : missionId === 'apollo13_aquarius'
      ? [
          { done: objectives.a13CryoDiagnosed, es: '1) Agitado Crio O₂ SM (Tanque #2=0 psia · Buses A/B)', en: '1) SM Cryo O₂ Stir (Tank #2=0 psia · Bus A/B drop)' },
          { done: objectives.a13AquariusMigrated, es: '2) Migrar a Aquarius LM (12 A / 336 W · 3.3 °C)', en: '2) Shed Power to Aquarius LM (12 A / 336 W · 3.3 °C)' },
          { done: objectives.a13MailboxInstalled, es: '3) Armar e Instalar "Mailbox" LiOH (CO₂ 14.9→1.2 mmHg)', en: '3) Build & Install "Mailbox" LiOH Adapter (14.9→1.2 mmHg)' },
          { done: objectives.a13ColdPowerup, es: '4) Ración 0.2 L/día y Reencendido en Frío Reentrada', en: '4) 0.2 L/day Water Ration & Cold CSM Power-Up' },
        ]
      : [
          { done: objectives.stsArrayInspected, es: '1) Diagnosticar Desgarro 2.5 ft P6-4B (Bahías 29–30 · 160V DC)', en: '1) Diagnose P6-4B 2.5 ft Tear (Bays 29–30 · 160V DC)' },
          { done: objectives.stsCufflinksCrafted, es: '2) Fabricar 5 Férulas Aluminio Cufflinks (Lab Este)', en: '2) Craft 5 Aluminum Cufflink Hinges (East Lab)' },
          { done: objectives.stsWireSnipped, es: '3) Despresurizar Esclusa Quest (2.1 kPa) y Cortar Cable HV OBSS', en: '3) Depress Quest Airlock (2.1 kPa) & Snip HV Wire on OBSS' },
          { done: objectives.stsArrayDeployed, es: '4) Instalar 5 Cufflinks y Desplegar Ala por Medias Bahías [5/5]', en: '4) Install 5 Cufflinks & Half-Bay Deploy Array [5/5]' },
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto mc-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#090C12] pb-2">
          <div>
            <div className="text-[10px] font-black text-[#FF4F00]">
              {lang === 'es' ? missionCfg.badgeEs : missionCfg.badgeEn}
            </div>
            <h3 className="text-sm font-black text-white">
              {lang === 'es' ? missionCfg.titleEs : missionCfg.titleEn}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="mc-btn px-3 py-1 text-xs font-black">
            ✕
          </button>
        </div>

        <div className="space-y-1.5 text-xs">
          {objectiveRows.map((o) => (
            <div
              key={o.es}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900/90 border border-slate-700"
            >
              {o.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className={o.done ? 'line-through text-slate-400' : 'text-slate-100 font-semibold'}>
                {lang === 'es' ? o.es : o.en}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-[#090C12] pt-3 space-y-2">
          <div className="text-[11px] font-black uppercase text-cyan-300 flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            {lang === 'es' ? 'SELECTOR DIRECTO DE MISIONES AETHER-4 (TODAS LAS FASES)' : 'AETHER-4 DIRECT PHASE SELECTOR'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {AETHER4_MISSIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMission(m.id)}
                className={`mc-btn p-2.5 text-left text-[11px] ${
                  m.id === missionId ? 'mc-btn-orange ring-2 ring-white' : 'mc-btn-blue'
                }`}
              >
                <div className="font-black">{lang === 'es' ? m.badgeEs : m.badgeEn}</div>
                <div className="text-[10px] opacity-90 line-clamp-2 mt-0.5">
                  {lang === 'es' ? m.titleEs : m.titleEn}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface LaunchStageFrame {
  labelEs: string;
  labelEn: string;
  altKm: number;
  velKms: number;
  gLoad: number;
  qKpa: number;
  skyTop: string;
  skyBottom: string;
  rocketYPercent: number;
  plumeScale: number;
  noteEs: string;
  noteEn: string;
}

const ASCENT_FRAMES: LaunchStageFrame[] = [
  {
    labelEs: 'T-00:09.5 · PLATAFORMA 39B KSC (TIERRA 1G)',
    labelEn: 'T-00:09.5 · KSC PAD 39B (EARTH 1G)',
    altKm: 0.0,
    velKms: 0.0,
    gLoad: 1.0,
    qKpa: 0.0,
    skyTop: '#0ea5e9',
    skyBottom: '#7dd3fc',
    rocketYPercent: 72,
    plumeScale: 0.35,
    noteEs: 'Pre-ignición RS-25 y purga hidrógeno en Tierra (9.81 m/s²).',
    noteEn: 'RS-25 main engine pre-start & pad acoustic deluge on Earth (9.81 m/s²).',
  },
  {
    labelEs: 'T+00:52.8 · MAX-Q AERODINÁMICO (7.4 km)',
    labelEn: 'T+00:52.8 · MAX-Q PRESSURE PEAK (7.4 km)',
    altKm: 7.4,
    velKms: 0.32,
    gLoad: 1.85,
    qKpa: 33.9,
    skyTop: '#1d4ed8',
    skyBottom: '#38bdf8',
    rocketYPercent: 54,
    plumeScale: 1.0,
    noteEs: `Estrés dinámico pico (24,335 ft · ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_MAX_Q_VEL_FPS} ft/s NASA).`,
    noteEn: `Peak aerodynamic pressure (24,335 ft · ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_MAX_Q_VEL_FPS} ft/s NASA).`,
  },
  {
    labelEs: 'T+02:00 · SEPARACIÓN SRB SÓLIDOS (46 km)',
    labelEn: 'T+02:00 · SRB BOOSTER SEPARATION (46 km)',
    altKm: 46.0,
    velKms: 1.65,
    gLoad: 2.6,
    qKpa: 2.1,
    skyTop: '#020617',
    skyBottom: '#1e3a8a',
    rocketYPercent: 38,
    plumeScale: 1.15,
    noteEs: `Separación pirotécnica SRB a ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_SRB_SEP_ALT_KM} km sobre la atmósfera azul.`,
    noteEn: `Pyrotechnic SRB separation at ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.STS_SRB_SEP_ALT_KM} km entering upper mesosphere.`,
  },
  {
    labelEs: 'T+08:03 · MECO & DESACOPLAMIENTO ICPS (LEO)',
    labelEn: 'T+08:03 · MECO & ICPS STAGING (LEO ORBIT)',
    altKm: 400.0,
    velKms: NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_LEO_ORBITAL_VELOCITY_KMS,
    gLoad: 3.1,
    qKpa: 0.0,
    skyTop: '#020617',
    skyBottom: '#0f172a',
    rocketYPercent: 25,
    plumeScale: 0.75,
    noteEs: `Órbita Baja 400 km a ${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_LEO_ORBITAL_VELOCITY_KMS} km/s (periodo 90 min).`,
    noteEn: `400 km Low Earth Orbit at ${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_LEO_ORBITAL_VELOCITY_KMS} km/s (90 min orbit).`,
  },
  {
    labelEs: 'T+01:29:27 · INSERCIÓN TLI / TRÁNSITO ESPACIAL',
    labelEn: 'T+01:29:27 · TLI BURN & DEEP SPACE ARRIVAL',
    altKm: 384400,
    velKms: NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_ESCAPE_VELOCITY_KMS,
    gLoad: 0.16,
    qKpa: 0.0,
    skyTop: '#000000',
    skyBottom: '#090d16',
    rocketYPercent: 18,
    plumeScale: 0.5,
    noteEs: `Acople completado en estación destino (${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_ESCAPE_VELOCITY_KMS} km/s ref. escape).`,
    noteEn: `Orbital/surface docking ready (${NASA_CONSTANTS.ASTROPHYSICS_AND_COSMOS.EARTH_ESCAPE_VELOCITY_KMS} km/s escape velocity ref.).`,
  },
];

export const LaunchTransitModal: React.FC<{
  lang: 'es' | 'en';
  fromMissionId: MissionId;
  toMissionId: MissionId;
  onComplete: () => void;
  onCancel: () => void;
}> = ({ lang, fromMissionId, toMissionId, onComplete, onCancel }) => {
  const targetMission = AETHER4_MISSIONS.find((m) => m.id === toMissionId) ?? AETHER4_MISSIONS[1];
  const fromMission = AETHER4_MISSIONS.find((m) => m.id === fromMissionId) ?? AETHER4_MISSIONS[0];
  const needsSurfaceLanding =
    toMissionId === 'act1_2_surface' || toMissionId === 'act3_greenhouse' || toMissionId === 'act4_storm_rover';
  const targetG = targetMission.gravityMs2;

  const [phase, setPhase] = useState<'ascent' | 'descent' | 'landed'>('ascent');
  const [ignited, setIgnited] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [camView, setCamView] = useState<'cockpit' | 'exterior'>('cockpit');
  const [throttle, setThrottle] = useState(92);
  const [pitchErr, setPitchErr] = useState(0);
  const [yawErr, setYawErr] = useState(0);
  const [descentAltM, setDescentAltM] = useState(180);
  const [descentVelMs, setDescentVelMs] = useState(28);
  const [retroActive, setRetroActive] = useState(false);
  const [landingMsg, setLandingMsg] = useState<string | null>(null);

  const canvasMountRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef({
    phase: 'ascent' as 'ascent' | 'descent' | 'landed',
    ignited: false,
    stageIdx: 0,
    camView: 'cockpit' as 'cockpit' | 'exterior',
    throttle: 92,
    pitchErr: 0,
    yawErr: 0,
    descentAltM: 180,
    descentVelMs: 28,
    retroActive: false,
    keys: new Set<string>(),
    steerCmdX: 0,
    steerCmdY: 0,
  });

  useEffect(() => {
    simRef.current.phase = phase;
    simRef.current.ignited = ignited;
    simRef.current.stageIdx = stageIdx;
    simRef.current.camView = camView;
    simRef.current.throttle = throttle;
    simRef.current.retroActive = retroActive;
  }, [phase, ignited, stageIdx, camView, throttle, retroActive]);

  // Keyboard bindings for V camera, WASD/Arrows stabilization, and SPACE retro-burn
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyV') {
        e.preventDefault();
        setCamView((c) => (c === 'cockpit' ? 'exterior' : 'cockpit'));
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setRetroActive(true);
      }
      simRef.current.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setRetroActive(false);
      simRef.current.keys.delete(e.code);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Ascent stage cadence
  useEffect(() => {
    if (phase !== 'ascent') return;
    if (!ignited) {
      soundEngine.setRocketThruster(0);
      return;
    }
    soundEngine.setRocketThruster((stageIdx >= 4 ? 0.35 : 0.78) * (throttle / 100));
    if (stageIdx >= 4) {
      if (needsSurfaceLanding) {
        const dTimer = window.setTimeout(() => {
          soundEngine.playStagePyro();
          setPhase('descent');
          setDescentAltM(180);
          setDescentVelMs(26);
          setPitchErr(0);
          setYawErr(0);
        }, 1400);
        return () => window.clearTimeout(dTimer);
      }
      return () => soundEngine.setRocketThruster(0);
    }
    const timer = window.setTimeout(() => {
      soundEngine.playStagePyro();
      setStageIdx((prev) => Math.min(4, prev + 1));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [phase, ignited, stageIdx, needsSurfaceLanding, throttle]);

  // Physics loop for attitude stabilization & powered planetary landing
  useEffect(() => {
    let last = performance.now();
    let syncAcc = 0;
    const iv = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      const s = simRef.current;

      // Pitch / Yaw input from WASD / Arrows / UI RCS pads
      let pxIn = s.steerCmdX;
      let pyIn = s.steerCmdY;
      if (s.keys.has('KeyA') || s.keys.has('ArrowLeft')) pxIn -= 1;
      if (s.keys.has('KeyD') || s.keys.has('ArrowRight')) pxIn += 1;
      if (s.keys.has('KeyW') || s.keys.has('ArrowUp')) pyIn -= 1;
      if (s.keys.has('KeyS') || s.keys.has('ArrowDown')) pyIn += 1;

      if (s.phase === 'ascent' && s.ignited && s.stageIdx < 4) {
        // Aerodynamic disturbance strongest at Max-Q (stage 1) & SRB sep (stage 2)
        const turb = s.stageIdx === 1 ? 7.5 : s.stageIdx === 2 ? 5.2 : 2.8;
        const driftX = Math.sin(now * 0.0021) * turb;
        const driftY = Math.cos(now * 0.0017) * (turb * 0.85);
        s.yawErr = Math.max(-24, Math.min(24, s.yawErr + (driftX + pxIn * 18) * dt));
        s.pitchErr = Math.max(-24, Math.min(24, s.pitchErr + (driftY + pyIn * 18) * dt));
      } else if (s.phase === 'descent') {
        s.yawErr = Math.max(-18, Math.min(18, s.yawErr * 0.94 + pxIn * 15 * dt));
        s.pitchErr = Math.max(-18, Math.min(18, s.pitchErr * 0.94 + pyIn * 15 * dt));

        // 1D Vertical Descent under real destination gravity (Moon 1.62 / Mars 3.70 m/s^2)
        const retroAccel = s.retroActive ? targetG * 2.95 + 3.8 : 0;
        const netAccel = targetG - retroAccel;
        s.descentVelMs = Math.max(-2.5, Math.min(48, s.descentVelMs + netAccel * dt));
        s.descentAltM = Math.max(0, s.descentAltM - s.descentVelMs * dt);
        soundEngine.setRocketThruster(s.retroActive ? 0.72 : 0.18);

        if (s.descentAltM <= 0.01) {
          if (Math.abs(s.descentVelMs) <= 6.2) {
            s.phase = 'landed';
            soundEngine.setRocketThruster(0);
            soundEngine.playSuccess();
            setPhase('landed');
            setLandingMsg(null);
          } else {
            // NASA Go-Around abort back to 58 m so pilot retries retro-thrust cleanly
            const hitVel = Math.abs(s.descentVelMs);
            soundEngine.playAlarm();
            s.descentAltM = 58;
            s.descentVelMs = 14;
            setLandingMsg(
              lang === 'es'
                ? `Velocidad de contacto alta (${hitVel.toFixed(1)} m/s > 6.2 m/s). Retropropulsores [ESPACIO] activados para reintento a 58 m.`
                : `Touchdown speed too fast (${hitVel.toFixed(1)} m/s > 6.2 m/s). Go-around burn engaged at 58 m — hold [SPACE] to brake.`
            );
          }
        }
      }

      syncAcc += dt;
      if (syncAcc >= 0.08) {
        syncAcc = 0;
        setPitchErr(s.pitchErr);
        setYawErr(s.yawErr);
        setDescentAltM(s.descentAltM);
        setDescentVelMs(s.descentVelMs);
      }
    }, 33);
    return () => {
      window.clearInterval(iv);
      soundEngine.setRocketThruster(0);
    };
  }, [targetG, lang]);

  // Live 3D Three.js Orion MEDS Cockpit + Detailed SLS/Orion Multi-Stage Rocket + Launch Tower & Planetary Surface
  useEffect(() => {
    const canvas = canvasMountRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(canvas.clientWidth || 720, canvas.clientHeight || 360, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b3b6e);
    scene.fog = new THREE.FogExp2(0x0b3b6e, 0.0022);

    const camera = new THREE.PerspectiveCamera(60, (canvas.clientWidth || 720) / (canvas.clientHeight || 360), 0.06, 950);

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.1);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfffbeb, 2.0);
    sun.position.set(24, 38, 28);
    scene.add(sun);
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    fillLight.position.set(-18, 12, -10);
    scene.add(fillLight);

    // ---- Crisp Pixel-Art 3D Procedural Textures (NearestFilter, Integer Grid) ----
    const createdTextures: THREE.CanvasTexture[] = [];
    const mkPixelTex = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      draw(ctx);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      createdTextures.push(tex);
      return tex;
    };

    // 1. SLS Core Stage Cryogenic SOFI Foam + Intertank Roll Pattern + USA Decal
    const coreTankTex = mkPixelTex(128, 256, (ctx) => {
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(0, 0, 128, 256);
      for (let y = 0; y < 256; y += 2) {
        for (let x = 0; x < 128; x += 2) {
          const bayer = ((x >> 1) + (y >> 1)) % 3;
          ctx.fillStyle = bayer === 0 ? '#ea580c' : bayer === 1 ? '#b43c0b' : '#d95416';
          ctx.fillRect(x, y, 2, 2);
        }
      }
      // Vertical structural stringers
      ctx.fillStyle = '#9a3412';
      for (let sx = 0; sx < 128; sx += 8) ctx.fillRect(sx, 0, 2, 256);
      // Black & White SLS/Saturn Intertank telemetry roll pattern band
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 48, 128, 26);
      ctx.fillStyle = '#0f172a';
      for (let bx = 0; bx < 128; bx += 16) ctx.fillRect(bx, 48, 8, 26);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 186, 128, 12);
      ctx.fillStyle = '#0b3d91';
      ctx.fillRect(0, 198, 128, 6);
      // NASA USA stencil block
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('USA', 20, 122);
      ctx.fillText('NASA', 74, 122);
      ctx.fillStyle = '#ff4f00';
      ctx.fillRect(18, 130, 92, 4);
    });

    // 2. Twin 5-Segment Solid Rocket Booster Casing Texture
    const srbTex = mkPixelTex(64, 256, (ctx) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 64, 256);
      for (let y = 0; y < 256; y += 4) {
        ctx.fillStyle = y % 8 === 0 ? '#f8fafc' : '#cbd5e1';
        ctx.fillRect(0, y, 64, 2);
      }
      // 5 segment black field joints + red safety bands
      for (const jy of [38, 86, 134, 182, 224]) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, jy, 64, 6);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, jy - 4, 64, 3);
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(26, 48, 12, 30);
    });

    // 3. Orion TPS Ceramic Tile + Cockpit Window Texture
    const orionTpsTex = mkPixelTex(128, 128, (ctx) => {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#cbd5e1';
      for (let y = 0; y < 128; y += 8) ctx.fillRect(0, y, 128, 1);
      for (let x = 0; x < 128; x += 8) ctx.fillRect(x, 0, 1, 128);
      // Carbon Avcoat base shield collar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 102, 128, 26);
      // Forward flight-deck windows
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, 50, 26, 16);
      ctx.fillRect(50, 50, 28, 16);
      ctx.fillRect(84, 50, 26, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(21, 53, 20, 10);
      ctx.fillRect(53, 53, 22, 10);
      ctx.fillRect(87, 53, 20, 10);
    });

    // 4. Orion ESM Cruciform Photovoltaic Solar Wing Texture
    const solarWingTex = mkPixelTex(128, 64, (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = '#1d4ed8';
      for (let y = 4; y < 60; y += 10) {
        for (let x = 4; x < 124; x += 14) {
          ctx.fillRect(x, y, 11, 7);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(x + 2, y + 2, 7, 3);
          ctx.fillStyle = '#1d4ed8';
        }
      }
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, 128, 3);
      ctx.fillRect(0, 61, 128, 3);
    });

    // 5. Cratered Moon / Mars Surface Pixel-Art Texture
    const isMars = toMissionId === 'act3_greenhouse';
    const terrainTex = mkPixelTex(256, 256, (ctx) => {
      ctx.fillStyle = isMars ? '#7c2d12' : '#475569';
      ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 4) {
        for (let x = 0; x < 256; x += 4) {
          const n = ((x * 37 + y * 91) ^ (x * y)) & 7;
          ctx.fillStyle = isMars
            ? n < 3 ? '#9a3412' : n < 6 ? '#6c240c' : '#b45309'
            : n < 3 ? '#64748b' : n < 6 ? '#334155' : '#94a3b8';
          ctx.fillRect(x, y, 4, 4);
        }
      }
      // Subtle pixel crater rings
      const craters = [[52, 58, 22], [184, 72, 28], [88, 188, 32], [198, 196, 18]];
      for (const [cx, cy, cr] of craters) {
        ctx.strokeStyle = isMars ? '#451a03' : '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    terrainTex.wrapS = THREE.RepeatWrapping;
    terrainTex.wrapT = THREE.RepeatWrapping;
    terrainTex.repeat.set(6, 6);

    // 6. Earth Horizon Texture (Ocean, Continents, Clouds)
    const earthTex = mkPixelTex(256, 128, (ctx) => {
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#1d4ed8';
      for (let y = 0; y < 128; y += 4) {
        for (let x = 0; x < 256; x += 4) {
          if (((x + y * 3) & 15) < 6) ctx.fillRect(x, y, 4, 4);
        }
      }
      // Continents
      ctx.fillStyle = '#15803d';
      ctx.fillRect(36, 24, 52, 34);
      ctx.fillRect(142, 30, 66, 42);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(156, 40, 26, 16);
      // Swirling cloud bands
      ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
      for (let cy = 8; cy < 120; cy += 18) {
        ctx.fillRect((cy * 3) % 180, cy, 74, 6);
      }
    });

    // 7. Cockpit Overhead Switch & Circuit Breaker Panel Texture
    const cockpitPanelTex = mkPixelTex(256, 128, (ctx) => {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 248, 120);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          const sx = 16 + c * 28;
          const sy = 18 + r * 26;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx, sy, 20, 18);
          ctx.fillStyle = (r + c) % 4 === 0 ? '#22c55e' : (r + c) % 3 === 0 ? '#f59e0b' : '#38bdf8';
          ctx.fillRect(sx + 4, sy + 3, 12, 4);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(sx + 8, sy + 10, 4, 6);
        }
      }
    });

    // ---- Live CanvasTextures for 3 Cockpit MFDs + Translucent HUD Reticle ----
    const mkMfdTex = (w = 320, h = 220) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      createdTextures.push(tex);
      return { c, ctx, tex };
    };
    const leftMfd = mkMfdTex(320, 220);
    const midMfd = mkMfdTex(320, 220);
    const rightMfd = mkMfdTex(320, 220);
    const hudCombiner = mkMfdTex(320, 180);

    // ---- Detailed 3D MEDS Glass Cockpit Interior ----
    const cockpitGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.48, metalness: 0.65 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.32, metalness: 0.82 });
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.72 });
    const panelBayMat = new THREE.MeshStandardMaterial({ map: cockpitPanelTex, roughness: 0.45, metalness: 0.55 });
    const cautionLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    // Angled flight deck dash & bolsters
    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.48, 0.64), frameMat);
    dash.position.set(0, 0.70, -0.78);
    dash.rotation.x = 0.24;
    const glareShield = new THREE.Mesh(new THREE.BoxGeometry(2.10, 0.09, 0.38), trimMat);
    glareShield.position.set(0, 1.00, -0.76);
    cockpitGroup.add(dash, glareShield);

    // Center & side console trays
    const centerPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.82), frameMat);
    centerPedestal.position.set(0, 0.52, -0.34);
    const sideBayL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.92), panelBayMat);
    sideBayL.position.set(-0.98, 0.76, -0.40);
    sideBayL.rotation.z = -0.25;
    const sideBayR = sideBayL.clone();
    sideBayR.position.x = 0.98;
    sideBayR.rotation.z = 0.25;
    cockpitGroup.add(centerPedestal, sideBayL, sideBayR);

    // Recessed metallic MFD Bezels + crisp 320x220 Screens
    const mkScreenUnit = (tex: THREE.CanvasTexture, x: number) => {
      const grp = new THREE.Group();
      grp.position.set(x, 0.80, -0.52);
      grp.rotation.x = -0.30;
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.04), bezelMat);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.33), new THREE.MeshBasicMaterial({ map: tex }));
      screen.position.z = 0.022;
      grp.add(bezel, screen);
      return grp;
    };
    cockpitGroup.add(mkScreenUnit(leftMfd.tex, -0.60));
    cockpitGroup.add(mkScreenUnit(midMfd.tex, 0));
    cockpitGroup.add(mkScreenUnit(rightMfd.tex, 0.60));

    // Glare-shield Master Caution / Warn annunciator bar
    const cautionBar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.045, 0.04), cautionLedMat);
    cautionBar.position.set(0, 1.02, -0.58);
    cockpitGroup.add(cautionBar);

    // Translucent holographic HUD combiner glass mounted ahead of center pilot line of sight
    const hudGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.38),
      new THREE.MeshBasicMaterial({
        map: hudCombiner.tex,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    hudGlass.position.set(0, 1.24, -0.62);
    const hudFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.025, 0.03), trimMat);
    hudFrame.position.set(0, 1.05, -0.62);
    cockpitGroup.add(hudGlass, hudFrame);

    // 6-pane Orion/Shuttle Canopy Mullions + Overhead Breaker Bay
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.38, 0.11), trimMat);
    pillarL.position.set(-0.96, 1.44, -0.68);
    pillarL.rotation.z = -0.22;
    const pillarR = pillarL.clone();
    pillarR.position.x = 0.96;
    pillarR.rotation.z = 0.22;
    const pillarDiagL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.24, 0.08), frameMat);
    pillarDiagL.position.set(-0.46, 1.48, -0.74);
    pillarDiagL.rotation.z = -0.06;
    const pillarDiagR = pillarDiagL.clone();
    pillarDiagR.position.x = 0.46;
    pillarDiagR.rotation.z = 0.06;
    const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 0.48), panelBayMat);
    eyebrow.position.set(0, 1.98, -0.60);
    eyebrow.rotation.x = 0.35;
    cockpitGroup.add(pillarL, pillarR, pillarDiagL, pillarDiagR, eyebrow);

    // Dual Rotational Hand Controllers (RHC) + Abort/Throttle Lever
    const stick = new THREE.Group();
    stick.position.set(0.18, 0.68, -0.34);
    const stickShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.22, 10), trimMat);
    stickShaft.position.y = 0.11;
    const stickGrip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.075), frameMat);
    stickGrip.position.y = 0.22;
    stick.add(stickShaft, stickGrip);
    const abortLever = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.04), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
    abortLever.position.set(-0.18, 0.72, -0.38);
    cockpitGroup.add(stick, abortLever);
    scene.add(cockpitGroup);

    // ---- Detailed Multi-Stage NASA SLS / Orion Rocket Group ----
    const rocketGroup = new THREE.Group();
    const coreMat = new THREE.MeshStandardMaterial({ map: coreTankTex, roughness: 0.52, metalness: 0.18 });
    const whiteStageMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.34, metalness: 0.32 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.78 });
    const goldFoilMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });
    const nozzleGlowMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });

    // Core Stage (SOFI orange cryo tank + tapered LOX nose + white/black ICPS adapter)
    const coreTank = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 3.6, 24), coreMat);
    const coreNoseCone = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 0.58, 24), coreMat);
    coreNoseCone.position.y = 2.09;
    const icpsStage = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.35, 0.62, 24), whiteStageMat);
    icpsStage.position.y = 2.66;
    const boattail = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.40, 0.42, 24), whiteStageMat);
    boattail.position.y = -2.01;
    rocketGroup.add(coreTank, coreNoseCone, icpsStage, boattail);

    // 4 Gimbaled RS-25 Core Engine Bells + Inner Mach Glow
    for (const [ex, ez] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.32, 12), darkSteelMat);
      bell.position.set(ex, -2.30, ez);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 10), nozzleGlowMat);
      inner.rotation.x = Math.PI;
      inner.position.set(ex, -2.42, ez);
      rocketGroup.add(bell, inner);
    }

    // Orion Service Module (ESM) + Cruciform Solar Arrays + Crew Capsule + Heatshield
    const upperCraftGrp = new THREE.Group();
    upperCraftGrp.position.y = 3.22;
    const esmBody = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.52, 20), darkSteelMat);
    const esmBand = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.14, 20), whiteStageMat);
    esmBand.position.y = 0.08;
    const crewCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.40, 0.68, 20),
      new THREE.MeshStandardMaterial({ map: orionTpsTex, roughness: 0.35, metalness: 0.25 })
    );
    crewCone.position.y = 0.60;
    const heatshield = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.37, 0.09, 20), goldFoilMat);
    heatshield.position.y = 0.24;
    upperCraftGrp.add(esmBody, esmBand, crewCone, heatshield);

    // 4 Cruciform Orion ESM Photovoltaic Solar Wings (unfold after booster separation)
    const solarMat = new THREE.MeshStandardMaterial({ map: solarWingTex, roughness: 0.25, metalness: 0.72, side: THREE.DoubleSide });
    const solarWings: THREE.Mesh[] = [];
    for (let wi = 0; wi < 4; wi++) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.03, 0.34), solarMat);
      const ang = (wi * Math.PI) / 2 + Math.PI / 4;
      wing.position.set(Math.cos(ang) * 0.85, 0.02, Math.sin(ang) * 0.85);
      wing.rotation.y = -ang;
      wing.scale.set(0.05, 1, 0.4);
      upperCraftGrp.add(wing);
      solarWings.push(wing);
    }

    // Launch Abort System (LAS) Tower on top of Orion Capsule
    const lasGrp = new THREE.Group();
    lasGrp.position.y = 1.18;
    const lasCone = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.52, 14), whiteStageMat);
    const lasSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.075, 0.62, 12), whiteStageMat);
    lasSpire.position.y = 0.56;
    const lasAbortRing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xff4f00 }));
    lasAbortRing.position.y = 0.24;
    lasGrp.add(lasCone, lasSpire, lasAbortRing);
    upperCraftGrp.add(lasGrp);
    rocketGroup.add(upperCraftGrp);

    // Twin 5-Segment Solid Rocket Boosters (SRB Left & Right with nosecones, struts, nozzles & plumes)
    const srbBodyMat = new THREE.MeshStandardMaterial({ map: srbTex, roughness: 0.35, metalness: 0.35 });
    const mkSrbAssembly = (sideSign: number) => {
      const g = new THREE.Group();
      g.position.set(sideSign * 0.72, -0.45, 0);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 3.05, 16), srbBodyMat);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.56, 16), whiteStageMat);
      nose.position.y = 1.80;
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.25, 0.34, 16), darkSteelMat);
      skirt.position.y = -1.68;
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.21, 0.28, 14), darkSteelMat);
      nozzle.position.y = -1.96;
      const strutTop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.10), darkSteelMat);
      strutTop.position.set(-sideSign * 0.22, 1.15, 0);
      const strutBot = strutTop.clone();
      strutBot.position.y = -1.15;
      const srbPlume = new THREE.Mesh(
        new THREE.ConeGeometry(0.26, 2.2, 14),
        new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.92 })
      );
      srbPlume.rotation.x = Math.PI;
      srbPlume.position.y = -3.15;
      g.add(body, nose, skirt, nozzle, strutTop, strutBot, srbPlume);
      return { g, srbPlume };
    };
    const srbLeft = mkSrbAssembly(-1);
    const srbRight = mkSrbAssembly(1);
    rocketGroup.add(srbLeft.g, srbRight.g);

    // Lander Descent Legs (extended during Lunar/Mars powered touchdown)
    const landerLegsGrp = new THREE.Group();
    landerLegsGrp.position.y = -1.95;
    for (let li = 0; li < 4; li++) {
      const la = (li * Math.PI) / 2 + Math.PI / 4;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.35, 8), goldFoilMat);
      strut.position.set(Math.cos(la) * 0.72, -0.35, Math.sin(la) * 0.72);
      strut.rotation.z = Math.cos(la) * 0.55;
      strut.rotation.x = -Math.sin(la) * 0.55;
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.06, 12), darkSteelMat);
      pad.position.set(Math.cos(la) * 1.05, -0.92, Math.sin(la) * 1.05);
      landerLegsGrp.add(strut, pad);
    }
    landerLegsGrp.visible = false;
    rocketGroup.add(landerLegsGrp);

    // Volumetric Multi-Layer Main Exhaust Plume + Shock Diamonds + Vapor Collar + Nozzle Light
    const plumeGrp = new THREE.Group();
    plumeGrp.position.y = -2.48;
    const plumeCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 2.8, 16),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.95 })
    );
    plumeCore.rotation.x = Math.PI;
    plumeCore.position.y = -1.4;
    const plumeOuter = new THREE.Mesh(
      new THREE.ConeGeometry(0.56, 3.8, 18),
      new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    plumeOuter.rotation.x = Math.PI;
    plumeOuter.position.y = -1.9;
    const plumePuffs: THREE.Mesh[] = [];
    for (let pi = 0; pi < 6; pi++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.32 + pi * 0.09, 10, 8),
        new THREE.MeshBasicMaterial({ color: pi < 2 ? 0xfef08a : 0xf97316, transparent: true, opacity: 0.55 - pi * 0.07 })
      );
      puff.position.y = -0.6 - pi * 0.55;
      plumeGrp.add(puff);
      plumePuffs.push(puff);
    }
    const engineLight = new THREE.PointLight(0xff9e2c, 3.5, 28);
    engineLight.position.set(0, -1.2, 0.8);
    plumeGrp.add(plumeCore, plumeOuter, engineLight);
    rocketGroup.add(plumeGrp);

    // Max-Q Prandtl-Glauert Vapor Condensation Cone
    const maxQHalo = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 0.95, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false })
    );
    maxQHalo.position.y = 2.6;
    maxQHalo.visible = false;
    rocketGroup.add(maxQHalo);
    scene.add(rocketGroup);

    // ---- Stars, Detailed LC-39B Truss Tower, Steam Clouds, Earth Horizon & Textured Terrain ----
    const starPositions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const r = 130 + Math.random() * 170;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xf8fafc, size: 1.25, transparent: true, opacity: 0.0 });
    scene.add(new THREE.Points(starGeo, starMat));

    const padGroup = new THREE.Group();
    const padConcrete = new THREE.Mesh(
      new THREE.CircleGeometry(96, 40),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.94 })
    );
    padConcrete.rotation.x = -Math.PI / 2;
    padConcrete.position.y = -4.2;
    const flameTrench = new THREE.Mesh(new THREE.BoxGeometry(10, 1.0, 26), darkSteelMat);
    flameTrench.position.set(0, -4.1, -18);
    padGroup.add(padConcrete, flameTrench);

    // Structural Truss Umbilical Tower ML-1 + Retracting Crew Access Arm
    const towerGrp = new THREE.Group();
    towerGrp.position.set(-2.6, 0.8, -18);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.7 });
    for (const [cx, cz] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.14, 11.5, 0.14), towerMat);
      col.position.set(cx, 0.2, cz);
      towerGrp.add(col);
    }
    for (let dy = -4.5; dy <= 5.5; dy += 1.6) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.12, 1.48), towerMat);
      deck.position.y = dy;
      towerGrp.add(deck);
    }
    const towerBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    towerBeacon.position.y = 6.2;
    const swingArmPivot = new THREE.Group();
    swingArmPivot.position.set(0.65, 2.4, 0.55);
    const swingArm = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 0.28), whiteStageMat);
    swingArm.position.x = 1.05;
    swingArmPivot.add(swingArm);
    towerGrp.add(towerBeacon, swingArmPivot);
    padGroup.add(towerGrp);

    // Pad water-suppression steam cloud puffs at T-0
    const steamClouds: THREE.Mesh[] = [];
    for (let si = 0; si < 10; si++) {
      const st = new THREE.Mesh(
        new THREE.SphereGeometry(0.85 + (si % 3) * 0.35, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.48 })
      );
      const ang = (si / 10) * Math.PI * 2;
      st.position.set(Math.cos(ang) * 2.2, -3.5, -18 + Math.sin(ang) * 1.8);
      padGroup.add(st);
      steamClouds.push(st);
    }
    scene.add(padGroup);

    // Earth Curvature + Atmospheric Blue Limb Halo
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -86, -48);
    const earthSphere = new THREE.Mesh(
      new THREE.SphereGeometry(72, 40, 28),
      new THREE.MeshStandardMaterial({ map: earthTex, emissive: 0x0c4a6e, emissiveIntensity: 0.25, roughness: 0.72 })
    );
    const earthAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(74.4, 36, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending })
    );
    earthGroup.add(earthSphere, earthAtmo);
    scene.add(earthGroup);

    // Textured Cratered Planetary Landing Surface + Beacon Pad
    const surfGeo = new THREE.PlaneGeometry(360, 360, 44, 44);
    surfGeo.rotateX(-Math.PI / 2);
    const posAttr = surfGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const d = Math.hypot(vx, vz);
      const crater = Math.sin(vx * 0.14) * Math.cos(vz * 0.14) * 2.3 + (d < 16 ? 0 : Math.sin(d * 0.25) * 1.4);
      posAttr.setY(i, crater);
    }
    surfGeo.computeVertexNormals();
    const surfaceGroup = new THREE.Group();
    const surfMesh = new THREE.Mesh(surfGeo, new THREE.MeshStandardMaterial({ map: terrainTex, roughness: 0.92 }));
    const padBeacon = new THREE.Mesh(
      new THREE.RingGeometry(4.5, 5.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    padBeacon.rotation.x = -Math.PI / 2;
    padBeacon.position.y = 0.25;
    const padCenterCross = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 2.0, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    padCenterCross.rotation.x = -Math.PI / 2;
    padCenterCross.position.y = 0.28;
    surfaceGroup.add(surfMesh, padBeacon, padCenterCross);
    surfaceGroup.visible = false;
    scene.add(surfaceGroup);

    const drawMfd = (tSec: number) => {
      const s = simRef.current;
      const frame = ASCENT_FRAMES[s.stageIdx];
      const stable = Math.abs(s.pitchErr) < 9 && Math.abs(s.yawErr) < 9;

      // 1. Left MFD (320x220): Elevation Trajectory & Staging Profile
      {
        const { ctx, tex } = leftMfd;
        ctx.fillStyle = '#040d1a';
        ctx.fillRect(0, 0, 320, 220);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.lineWidth = 1;
        for (let g = 20; g < 320; g += 28) {
          ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, 220); ctx.stroke();
        }
        for (let g = 20; g < 220; g += 26) {
          ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(320, g); ctx.stroke();
        }
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(s.phase === 'ascent' ? 'ASCENT TRAJECTORY CURVE' : 'RADAR DESCENT PROFILE', 14, 22);

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (s.phase === 'ascent') {
          ctx.moveTo(24, 182);
          ctx.quadraticCurveTo(135, 162, 294, 40);
        } else {
          ctx.moveTo(26, 42);
          ctx.quadraticCurveTo(165, 160, 294, 182);
        }
        ctx.stroke();

        const pct =
          s.phase === 'ascent'
            ? (s.stageIdx + (s.ignited ? 0.5 : 0)) / 4.5
            : 1 - Math.min(1, s.descentAltM / 180);
        const cx = 24 + Math.min(1, pct) * 268;
        const cy = s.phase === 'ascent' ? 182 - Math.pow(Math.min(1, pct), 1.15) * 140 : 44 + Math.min(1, pct) * 136;
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.strokeRect(cx - 11, cy - 11, 22, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(
          s.phase === 'ascent' ? `ALT ${frame.altKm} km · ${frame.velKms.toFixed(2)} km/s` : `ALT ${s.descentAltM.toFixed(0)} m · Vz -${s.descentVelMs.toFixed(1)} m/s`,
          14,
          208
        );
        tex.needsUpdate = true;
      }

      // 2. Center MFD (320x220): FDAI Artificial Horizon & Ladder
      {
        const { ctx, tex } = midMfd;
        ctx.fillStyle = '#061221';
        ctx.fillRect(0, 0, 320, 220);
        ctx.save();
        ctx.translate(160, 114);
        ctx.rotate((s.yawErr * Math.PI) / 180);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(-170, -170 + s.pitchErr * 2.4, 340, 170);
        ctx.fillStyle = s.phase === 'ascent' ? '#14532d' : '#451a03';
        ctx.fillRect(-170, s.pitchErr * 2.4, 340, 170);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-135, s.pitchErr * 2.4); ctx.lineTo(135, s.pitchErr * 2.4); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.5;
        for (const pStep of [-40, -20, 20, 40]) {
          ctx.beginPath();
          ctx.moveTo(-45, s.pitchErr * 2.4 + pStep);
          ctx.lineTo(45, s.pitchErr * 2.4 + pStep);
          ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = stable ? '#22c55e' : '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(136, 90, 48, 48);
        ctx.fillStyle = stable ? '#4ade80' : '#fb7185';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(stable ? 'FDAI GUIDANCE: NOMINAL' : 'DRIFT ALERT · CORRECT', 16, 22);
        ctx.fillText(`PITCH ${s.pitchErr.toFixed(1)}°  YAW ${s.yawErr.toFixed(1)}°`, 16, 206);
        tex.needsUpdate = true;
      }

      // 3. Right MFD (320x220): RS-25 + SRB + Propellant Telemetry Bargraphs
      {
        const { ctx, tex } = rightMfd;
        ctx.fillStyle = '#040d1a';
        ctx.fillRect(0, 0, 320, 220);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('MEDS PROPULSION & RCS', 14, 22);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`THRUST: ${s.phase === 'descent' ? (s.retroActive ? '100% RETRO' : '20% RCS') : `${s.throttle}%`}`, 14, 52);
        ctx.fillStyle = '#facc15';
        ctx.fillText(`STAGE ${s.stageIdx + 1}/5  |  SRB: ${s.stageIdx < 2 ? 'ACTIVE' : 'SEP'}`, 14, 78);
        ctx.fillStyle = '#4ade80';
        ctx.fillText(`LOAD: ${s.phase === 'ascent' ? frame.gLoad.toFixed(2) : (targetG / 9.81).toFixed(2)} G  ·  Q: ${s.phase === 'ascent' ? frame.qKpa.toFixed(1) : '0.0'} kPa`, 14, 104);
        // Fuel / LOX bars
        const loxPct = s.phase === 'ascent' ? Math.max(0.12, 1 - s.stageIdx * 0.18) : 0.45;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(14, 128, 288, 16);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(14, 128, Math.round(288 * loxPct), 16);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`LOX/LH2 CORE ${Math.round(loxPct * 100)}%`, 20, 140);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`TARGET GRAV: ${targetG.toFixed(2)} m/s²`, 14, 204);
        tex.needsUpdate = true;
      }

      // 4. Translucent Holographic HUD Windshield Overlay
      {
        const { ctx, tex } = hudCombiner;
        ctx.clearRect(0, 0, 320, 180);
        const col = stable ? '#4ade80' : '#fb7185';
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = 2;
        const vx = 160 + s.yawErr * 3;
        const vy = 90 + s.pitchErr * 2;
        ctx.beginPath();
        ctx.arc(vx, vy, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(vx - 24, vy); ctx.lineTo(vx - 12, vy);
        ctx.moveTo(vx + 12, vy); ctx.lineTo(vx + 24, vy);
        ctx.moveTo(vx, vy - 20); ctx.lineTo(vx, vy - 12);
        ctx.stroke();
        ctx.font = 'bold 12px monospace';
        ctx.fillText(s.phase === 'ascent' ? `STG ${s.stageIdx + 1} · Q ${frame.qKpa.toFixed(1)}kPa` : `RETRO ALT ${s.descentAltM.toFixed(0)}m`, 14, 22);
        ctx.fillText(`V ${s.phase === 'ascent' ? `${frame.velKms.toFixed(2)}km/s` : `-${s.descentVelMs.toFixed(1)}m/s`}`, 215, 22);
        tex.needsUpdate = true;
      }
      void tSec;
    };

    let srbSepFrac = 0;
    let lasSepFrac = 0;
    let raf = 0;
    const t0 = performance.now();
    const renderLoop = () => {
      raf = window.requestAnimationFrame(renderLoop);
      const tSec = (performance.now() - t0) / 1000;
      const s = simRef.current;

      drawMfd(tSec);

      const stable = Math.abs(s.pitchErr) < 9 && Math.abs(s.yawErr) < 9;
      cautionLedMat.color.setHex(!stable ? (Math.floor(tSec * 6) % 2 === 0 ? 0xf43f5e : 0x7f1d1d) : s.stageIdx === 1 && s.ignited ? 0xf59e0b : 0x22c55e);

      if (s.phase === 'ascent') {
        surfaceGroup.visible = false;
        landerLegsGrp.visible = false;
        const climbFrac = s.ignited ? Math.min(1, s.stageIdx / 3.5 + 0.08) : 0;
        const skyColor = new THREE.Color(s.stageIdx === 0 ? 0x0b4f8c : s.stageIdx === 1 ? 0x091e42 : 0x020617);
        (scene.background as THREE.Color).lerp(skyColor, 0.08);
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.copy(scene.background as THREE.Color);
          scene.fog.density = s.stageIdx <= 1 ? 0.0022 : 0.0002;
        }
        starMat.opacity = s.stageIdx >= 2 ? 0.96 : s.ignited ? 0.35 : 0;

        padGroup.visible = s.stageIdx <= 1;
        padGroup.position.y = -s.stageIdx * 34 - (s.ignited ? Math.min(28, (tSec % 4) * 5.2) : 0);
        swingArmPivot.rotation.y = s.ignited ? -1.15 : 0;
        for (let si = 0; si < steamClouds.length; si++) {
          const st = steamClouds[si];
          const pulse = s.ignited ? 1.15 + Math.sin(tSec * 8 + si) * 0.25 : 0.6;
          st.scale.setScalar(pulse);
          st.visible = s.stageIdx === 0 || (s.ignited && s.stageIdx === 1);
        }

        earthGroup.visible = s.stageIdx >= 2;
        earthGroup.position.y = -86 - (s.stageIdx - 2) * 10;
        earthSphere.rotation.y = tSec * 0.03;

        // Animated Twin SRB Separation at Stage 2+ & LAS Tower Jettison at Stage 3+
        if (s.stageIdx >= 2) {
          srbSepFrac = Math.min(1, srbSepFrac + 0.018);
          srbLeft.g.position.set(-0.72 - srbSepFrac * 3.8, -0.45 - srbSepFrac * 4.5, -srbSepFrac * 2.2);
          srbLeft.g.rotation.z = srbSepFrac * 0.55;
          srbRight.g.position.set(0.72 + srbSepFrac * 3.8, -0.45 - srbSepFrac * 4.5, -srbSepFrac * 2.2);
          srbRight.g.rotation.z = -srbSepFrac * 0.55;
          srbLeft.g.visible = srbSepFrac < 0.98;
          srbRight.g.visible = srbSepFrac < 0.98;
        } else {
          srbSepFrac = 0;
          srbLeft.g.position.set(-0.72, -0.45, 0);
          srbLeft.g.rotation.z = 0;
          srbRight.g.position.set(0.72, -0.45, 0);
          srbRight.g.rotation.z = 0;
          srbLeft.g.visible = true;
          srbRight.g.visible = true;
        }
        srbLeft.srbPlume.visible = s.ignited && s.stageIdx < 2;
        srbRight.srbPlume.visible = s.ignited && s.stageIdx < 2;
        srbLeft.srbPlume.scale.setScalar(0.9 + Math.sin(tSec * 36) * 0.14);
        srbRight.srbPlume.scale.setScalar(0.9 + Math.cos(tSec * 36) * 0.14);

        // Unfold Orion ESM 4 cruciform solar arrays cleanly once out of lower atmosphere
        const wingDeploy = s.stageIdx >= 2 ? 1.0 : 0.06;
        for (const w of solarWings) w.scale.set(wingDeploy, 1, s.stageIdx >= 2 ? 1 : 0.35);

        if (s.stageIdx >= 3) {
          lasSepFrac = Math.min(1, lasSepFrac + 0.025);
          lasGrp.position.set(lasSepFrac * 3.5, 1.18 + lasSepFrac * 4.2, 0);
          lasGrp.rotation.z = -lasSepFrac * 0.6;
          lasGrp.visible = lasSepFrac < 0.95;
        } else {
          lasSepFrac = 0;
          lasGrp.position.set(0, 1.18, 0);
          lasGrp.rotation.z = 0;
          lasGrp.visible = true;
        }

        plumeGrp.visible = s.ignited;
        maxQHalo.visible = s.ignited && s.stageIdx === 1;
        maxQHalo.scale.setScalar(0.95 + Math.sin(tSec * 18) * 0.08);
        plumeGrp.scale.set(1, (0.78 + Math.sin(tSec * 32) * 0.15) * (s.throttle / 100), 1);
        for (let pi = 0; pi < plumePuffs.length; pi++) {
          const cycle = ((tSec * 7 + pi * 0.28) % 1.4);
          plumePuffs[pi].position.y = -0.5 - cycle * 3.4;
          plumePuffs[pi].scale.setScalar(0.75 + cycle * 0.9);
        }

        rocketGroup.position.set(s.yawErr * 0.03, Math.sin(tSec * 3) * 0.04, -17.5 + climbFrac * 1.8);
        rocketGroup.rotation.set(s.pitchErr * 0.015, Math.sin(tSec * 0.4) * 0.08, -s.yawErr * 0.015);
      } else {
        (scene.background as THREE.Color).set(isMars ? 0x2a1006 : 0x020617);
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.copy(scene.background as THREE.Color);
          scene.fog.density = isMars ? 0.0028 : 0.0002;
        }
        starMat.opacity = isMars ? 0.35 : 0.96;
        padGroup.visible = false;
        earthGroup.visible = false;
        surfaceGroup.visible = true;
        srbLeft.g.visible = false;
        srbRight.g.visible = false;
        lasGrp.visible = false;
        maxQHalo.visible = false;
        landerLegsGrp.visible = true;
        for (const w of solarWings) w.scale.set(1, 1, 1);

        plumeGrp.visible = s.retroActive;
        plumeGrp.scale.set(0.85, 0.8 + Math.sin(tSec * 28) * 0.15, 0.85);
        surfaceGroup.position.set(0, -(s.descentAltM * 0.32 + 2.2), -24);
        rocketGroup.position.set(0, 1.8, -14);
        rocketGroup.rotation.set(s.pitchErr * 0.015, tSec * 0.25, -s.yawErr * 0.015);
      }

      if (s.camView === 'cockpit') {
        cockpitGroup.visible = true;
        rocketGroup.visible = false;
        stick.rotation.set(s.pitchErr * 0.018, 0, -s.yawErr * 0.018);
        const vib = (s.ignited && s.stageIdx === 1) || s.retroActive ? Math.sin(tSec * 45) * 0.009 : 0;
        camera.position.set(vib, 1.18 + vib * 0.5, 0.16);
        const lookY = s.phase === 'descent' ? 0.72 - s.pitchErr * 0.015 : 1.24 - s.pitchErr * 0.015;
        camera.lookAt(s.yawErr * 0.02, lookY, -14);
      } else {
        cockpitGroup.visible = false;
        rocketGroup.visible = true;
        camera.position.set(6.2, 2.6, -9.8);
        camera.lookAt(rocketGroup.position.x, rocketGroup.position.y + 0.5, rocketGroup.position.z);
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      window.cancelAnimationFrame(raf);
      createdTextures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, [toMissionId]);

  const frame = ASCENT_FRAMES[stageIdx];
  const attitudeOk = Math.abs(pitchErr) < 9 && Math.abs(yawErr) < 9;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-3">
      <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-500/45 p-4 space-y-3 text-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-zinc-100">
            <Rocket className="w-4 h-4 text-sky-300" />
            {phase === 'ascent'
              ? lang === 'es'
                ? `CABINA 3D ORION · DESPEGUE Y ESTABILIZACIÓN (${targetMission.badgeEs})`
                : `ORION 3D COCKPIT · ASCENT & STABILIZATION (${targetMission.badgeEn})`
              : lang === 'es'
              ? `DESCENSO PLANETARIO 3D (${targetMission.gravityMs2.toFixed(2)} m/s²)`
              : `3D POWERED PLANETARY LANDING (${targetMission.gravityMs2.toFixed(2)} m/s²)`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCamView((c) => (c === 'cockpit' ? 'exterior' : 'cockpit'))}
              className="lp-btn px-3 py-1 text-[11px] flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-sky-800" />
              {camView === 'cockpit'
                ? lang === 'es' ? 'CABINA [V]' : 'COCKPIT [V]'
                : lang === 'es' ? 'EXTERIOR 3D [V]' : 'EXTERIOR 3D [V]'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.setRocketThruster(0);
                onCancel();
              }}
              className="lp-btn px-2.5 py-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Real 3D Three.js Canvas (In-Cockpit MFD Screens + External Rocket/Terrain) */}
        <div className="relative rounded-lg overflow-hidden border border-white/25 bg-black">
          <canvas ref={canvasMountRef} className="w-full h-[310px] sm:h-[360px] block" />
          <div className="pointer-events-none absolute top-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
            <span className="bg-black/60 backdrop-blur px-2.5 py-1 rounded border border-white/25 text-zinc-100">
              {phase === 'ascent'
                ? lang === 'es' ? frame.labelEs : frame.labelEn
                : phase === 'descent'
                ? lang === 'es' ? `DESCENSO ACTIVO · g = ${targetG.toFixed(2)} m/s²` : `POWERED DESCENT · g = ${targetG.toFixed(2)} m/s²`
                : lang === 'es' ? 'ATERRIZAJE COMPLETADO — CONTACTO CONFIRMADO' : 'TOUCHDOWN CONFIRMED — SURFACE LOCK'}
            </span>
            <span className={`px-2.5 py-1 rounded border font-semibold ${attitudeOk ? 'bg-emerald-500/20 border-emerald-300/60 text-emerald-200' : 'bg-rose-500/30 border-rose-300 text-rose-200'}`}>
              {attitudeOk
                ? lang === 'es' ? 'ACTITUD ESTABLE' : 'ATTITUDE NOMINAL'
                : lang === 'es' ? 'CORREGIR DERIVA [WASD]' : 'CORRECT DRIFT [WASD]'}
            </span>
          </div>
        </div>

        {landingMsg && (
          <div className="bg-rose-500/20 border border-rose-300/60 rounded px-3 py-1.5 text-[11px] text-rose-100 font-mono">
            {landingMsg}
          </div>
        )}

        {/* Interactive Flight Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-white/[0.06] border border-white/20 rounded-lg p-3 text-xs">
          <div className="md:col-span-5 grid grid-cols-3 gap-2 font-mono text-center">
            <div className="bg-white/[0.06] border border-white/15 rounded p-2">
              <div className="text-[10px] text-zinc-400">{phase === 'ascent' ? (lang === 'es' ? 'ALTITUD' : 'ALTITUDE') : 'RADAR ALT'}</div>
              <div className="font-semibold text-sky-300">
                {phase === 'ascent' ? `${frame.altKm.toLocaleString()} km` : `${descentAltM.toFixed(1)} m`}
              </div>
            </div>
            <div className="bg-white/[0.06] border border-white/15 rounded p-2">
              <div className="text-[10px] text-zinc-400">{phase === 'ascent' ? 'VELOCIDAD' : 'DESC RATE'}</div>
              <div className="font-semibold text-emerald-300">
                {phase === 'ascent' ? `${frame.velKms.toFixed(2)} km/s` : `-${descentVelMs.toFixed(1)} m/s`}
              </div>
            </div>
            <div className="bg-white/[0.06] border border-white/15 rounded p-2">
              <div className="text-[10px] text-zinc-400">ACEL (+G)</div>
              <div className="font-semibold text-amber-300">
                {phase === 'ascent' ? `${frame.gLoad.toFixed(2)} G` : `${(targetG / 9.81).toFixed(2)} G`}
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-zinc-300 mr-1">RCS [WASD]:</span>
            <button type="button" onMouseDown={() => (simRef.current.steerCmdX = -1)} onMouseUp={() => (simRef.current.steerCmdX = 0)} onMouseLeave={() => (simRef.current.steerCmdX = 0)} className="lp-btn px-2 py-1 text-[11px]">←</button>
            <button type="button" onMouseDown={() => (simRef.current.steerCmdY = -1)} onMouseUp={() => (simRef.current.steerCmdY = 0)} onMouseLeave={() => (simRef.current.steerCmdY = 0)} className="lp-btn px-2 py-1 text-[11px]">↑</button>
            <button type="button" onMouseDown={() => (simRef.current.steerCmdY = 1)} onMouseUp={() => (simRef.current.steerCmdY = 0)} onMouseLeave={() => (simRef.current.steerCmdY = 0)} className="lp-btn px-2 py-1 text-[11px]">↓</button>
            <button type="button" onMouseDown={() => (simRef.current.steerCmdX = 1)} onMouseUp={() => (simRef.current.steerCmdX = 0)} onMouseLeave={() => (simRef.current.steerCmdX = 0)} className="lp-btn px-2 py-1 text-[11px]">→</button>
          </div>

          <div className="md:col-span-3 flex flex-wrap justify-end gap-2">
            {phase === 'ascent' && !ignited && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playStagePyro();
                  setStageIdx(1);
                  setIgnited(true);
                }}
                className="lp-btn-accent px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                {lang === 'es' ? 'IGNICIÓN SLS' : 'SLS IGNITION'}
              </button>
            )}
            {phase === 'ascent' && ignited && stageIdx < 4 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playStagePyro();
                  setThrottle((t) => (t < 100 ? 100 : 88));
                  setStageIdx((s) => Math.min(4, s + 1));
                }}
                className="lp-btn px-3 py-2 text-xs"
              >
                {lang === 'es' ? `SIGUIENTE ETAPA (${stageIdx + 1}/5)` : `NEXT STAGE (${stageIdx + 1}/5)`}
              </button>
            )}
            {phase === 'descent' && (
              <button
                type="button"
                onMouseDown={() => setRetroActive(true)}
                onMouseUp={() => setRetroActive(false)}
                onMouseLeave={() => setRetroActive(false)}
                onTouchStart={() => setRetroActive(true)}
                onTouchEnd={() => setRetroActive(false)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold border ${
                  retroActive ? 'bg-amber-400 text-zinc-950 border-white' : 'bg-white/20 text-white border-white/50'
                }`}
              >
                <Flame className="w-3.5 h-3.5 inline mr-1" />
                {lang === 'es' ? 'RETRO-FRENO [ESPACIO]' : 'RETRO-BURN [SPACE]'}
              </button>
            )}
            {(phase === 'landed' || (!needsSurfaceLanding && stageIdx >= 4)) && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.setRocketThruster(0);
                  soundEngine.playSuccess();
                  onComplete();
                }}
                className="lp-btn-accent px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {lang === 'es' ? 'DESEMBARCAR EN ESTACIÓN' : 'DISEMBARK AT STATION'}
              </button>
            )}
          </div>
        </div>
        <div className="text-[10px] text-zinc-400 flex flex-wrap justify-between">
          <span>{lang === 'es' ? `Origen: ${fromMission.badgeEs}` : `Origin: ${fromMission.badgeEn}`} → <b>{lang === 'es' ? targetMission.titleEs : targetMission.titleEn}</b></span>
          <span>{lang === 'es' ? 'Pantallas MFD 3D en cabina muestran elevación, horizonte FDAI y propulsión en tiempo real.' : 'In-cockpit 3D MFD screens render live trajectory, FDAI attitude & propulsion telemetry.'}</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Phase 0 Adapted NASA Tests Modal (NBL Pool, Math Lab, 4.5G Centrifuge, 0g Fire)
// =============================================================================
export const AscanTrainingModal: React.FC<{
  lang: 'es' | 'en';
  mode: 'nbl' | 'computer' | 'centrifuge' | 'fire';
  onComplete: (mode: 'nbl' | 'computer' | 'centrifuge' | 'fire') => void;
  onClose: () => void;
}> = ({ lang, mode, onComplete, onClose }) => {
  // NBL state
  const [nblHatchSealed, setNblHatchSealed] = useState(false);
  const [nblTrim, setNblTrim] = useState(2); // -3..+3 target 0
  const [nblValves, setNblValves] = useState([false, false, false]);

  // Computer Formulas state
  const [ansSolar, setAnsSolar] = useState<string>('');
  const [ansHydro, setAnsHydro] = useState<string>('');
  const [ansDv, setAnsDv] = useState<string>('');

  // Centrifuge state
  const [antiGValve, setAntiGValve] = useState(false);
  const [spinActive, setSpinActive] = useState(false);
  const [gForce, setGForce] = useState(1.0);
  const [agsmHold, setAgsmHold] = useState(false);
  const [perfusion, setPerfusion] = useState(98);
  const [peakTimeSec, setPeakTimeSec] = useState(0);

  // Fire 0g state
  const [fireStep, setFireStep] = useState(0); // 0..5
  const [fireErr, setFireErr] = useState<string | null>(null);
  const coPpm = fireStep >= 5 ? 8 : fireStep === 4 ? 32 : 95;

  useEffect(() => {
    if (mode !== 'centrifuge') return;
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setAgsmHold(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setAgsmHold(false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'centrifuge' || !spinActive) return;
    const iv = window.setInterval(() => {
      setGForce((g) => Math.min(4.5, g + 0.14));
      setPerfusion((p) => {
        const gPenalty = gForce > 4.0 ? (gForce - 3.2) * 14 : 2;
        const mit = (antiGValve ? 0.52 : 0) + (agsmHold ? 0.42 : 0);
        const delta = (mit * 14 - gPenalty) * 0.12;
        return Math.max(15, Math.min(100, p + delta));
      });
      if (gForce >= 4.2 && perfusion >= 40) {
        setPeakTimeSec((t) => Math.min(6.0, t + 0.12));
      }
    }, 120);
    return () => window.clearInterval(iv);
  }, [mode, spinActive, gForce, antiGValve, agsmHold, perfusion]);

  const nblDone = nblHatchSealed && nblTrim === 0 && nblValves.every(Boolean);
  const compDone = ansSolar === '586' && ansHydro === '4860' && ansDv === '4061';
  const centDone = peakTimeSec >= 6.0;
  const fireDone = fireStep >= 5;

  const tryFireAction = (stepIdx: number) => {
    if (fireStep !== stepIdx) {
      soundEngine.playAlarm();
      setFireErr(
        lang === 'es'
          ? 'Orden incorrecto ISS 0g: 1. Máscara PBA -> 2. Cerrar IMV -> 3. Cortar Disyuntor -> 4. Extintor CO₂ -> 5. Purgar LiOH.'
          : 'Wrong ISS 0g sequence: 1. PBA Mask -> 2. Shut IMV -> 3. Cut Breaker -> 4. PFE CO₂ -> 5. LiOH Purge.'
      );
      return;
    }
    soundEngine.playClick();
    setFireErr(null);
    setFireStep(stepIdx + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-500/45 p-5 space-y-4 text-zinc-100">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-sky-200">
            <Compass className="w-4 h-4 text-sky-300" />
            {mode === 'nbl' && (lang === 'es' ? 'FASE 0 · PISCINA NBL 61.5 m & TRAJE xEMU' : 'PHASE 0 · 61.5 m NBL POOL & xEMU SUIT')}
            {mode === 'computer' && (lang === 'es' ? 'FASE 0 · PIZARRA DE FÓRMULAS Y CÓMPUTO NASA' : 'PHASE 0 · NASA SPACEFLIGHT MATH LAB')}
            {mode === 'centrifuge' && (lang === 'es' ? 'FASE 0 · CENTRÍFUGA HUMANA 4.5 G + AGSM' : 'PHASE 0 · 4.5 G CENTRIFUGE + AGSM DRILL')}
            {mode === 'fire' && (lang === 'es' ? 'FASE 0 · PROTOCOLO ISS DE INCENDIO 0g (RACK #2)' : 'PHASE 0 · ISS 0g RACK #2 FIRE PROTOCOL')}
          </div>
          <button type="button" onClick={onClose} className="lp-btn px-2.5 py-1 text-xs">✕</button>
        </div>

        {mode === 'nbl' && (
          <div className="space-y-3 text-xs">
            <div className="bg-white/[0.06] border border-white/15 rounded p-3 text-zinc-300">
              {lang === 'es'
                ? `Tanque Neutral Buoyancy Lab (${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_LENGTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_WIDTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_DEPTH_M} m · 6.2M gal). Sella la escotilla a ΔP 29.6 kPa, ajusta flotabilidad neutra a 0 kg y acciona las 3 válvulas ISS.`
                : `NBL Facility (${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_LENGTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_WIDTH_M} × ${NASA_CONSTANTS.LAUNCH_STAGING_PROFILES.NBL_POOL_DEPTH_M} m · 6.2M gal). Latch suit ΔP 29.6 kPa, trim neutral buoyancy to 0 kg & actuate all 3 ISS valves.`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { soundEngine.playClick(); setNblHatchSealed(true); }}
                className={`p-3 rounded border text-left ${nblHatchSealed ? 'bg-emerald-500/20 border-emerald-300' : 'bg-white/[0.06] border-white/20'}`}
              >
                <div className="font-semibold text-sky-200">{lang === 'es' ? '1. Presurización xEMU (ΔP 29.6 kPa)' : '1. xEMU Seal (ΔP 29.6 kPa)'}</div>
                <div className="text-[11px] text-zinc-300 mt-1">{nblHatchSealed ? '29.6 kPa LOCKED' : (lang === 'es' ? 'Clic para sellar casco/escotilla' : 'Click to pressurize suit')}</div>
              </button>
              <div className="p-3 rounded border bg-white/[0.06] border-white/20 space-y-1.5">
                <div className="font-semibold text-sky-200">{lang === 'es' ? `2. Lastre Plomo / Espuma: ${nblTrim > 0 ? `+${nblTrim} Pesado` : nblTrim < 0 ? `${nblTrim} Flota` : '0 NEUTRO'}` : `2. Lead/Foam Trim: ${nblTrim}`}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNblTrim((v) => Math.max(-3, v - 1))} className="lp-btn px-2.5 py-1">-1 Foam</button>
                  <button type="button" onClick={() => setNblTrim((v) => Math.min(3, v + 1))} className="lp-btn px-2.5 py-1">+1 Plomo</button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Válvula P6 Cooling', 'Garra MBS Truss', 'Seguro Giroscopio Z1'].map((lbl, idx) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setNblValves((arr) => arr.map((v, i) => (i === idx ? true : v)));
                  }}
                  className={`flex-1 p-2.5 rounded border text-center font-semibold ${nblValves[idx] ? 'bg-emerald-500/20 border-emerald-300 text-emerald-200' : 'bg-white/[0.06] border-white/20'}`}
                >
                  {nblValves[idx] ? '✓ ' : ''}{lbl}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!nblDone}
                onClick={() => { soundEngine.playSuccess(); onComplete('nbl'); }}
                className={`px-4 py-2 text-xs ${nblDone ? 'lp-btn-accent' : 'lp-btn opacity-45 cursor-not-allowed'}`}
              >
                {lang === 'es' ? 'CERTIFICAR PISCINA NBL' : 'CERTIFY NBL TEST'}
              </button>
            </div>
          </div>
        )}

        {mode === 'computer' && (
          <div className="space-y-3 text-xs">
            <div className="bg-white/[0.06] border border-white/15 rounded p-3 space-y-2">
              <div className="font-semibold text-sky-200">1. Irradiancia Solar en Marte: I = I₀ / r² (I₀ = 1,361 W/m² · r = 1.524 UA)</div>
              <div className="flex gap-2">
                {['340', '586', '1361'].map((opt) => (
                  <button key={opt} type="button" onClick={() => setAnsSolar(opt)} className={`flex-1 py-1.5 rounded border font-mono ${ansSolar === opt ? 'bg-emerald-500/25 border-emerald-300' : 'bg-white/[0.06] border-white/20'}`}>{opt} W/m²</button>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.06] border border-white/15 rounded p-3 space-y-2">
              <div className="font-semibold text-sky-200">2. Presión Hidrostática Lunar (h = 3 m · ρ = 1,000 kg/m³ · g = 1.62 m/s²): P = ρ·g·h</div>
              <div className="flex gap-2">
                {['4860', '29430', '1620'].map((opt) => (
                  <button key={opt} type="button" onClick={() => setAnsHydro(opt)} className={`flex-1 py-1.5 rounded border font-mono ${ansHydro === opt ? 'bg-emerald-500/25 border-emerald-300' : 'bg-white/[0.06] border-white/20'}`}>{opt} Pa</button>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.06] border border-white/15 rounded p-3 space-y-2">
              <div className="font-semibold text-sky-200">3. Ecuación Tsiolkovsky RS-25: Δv = 452 s × 9.80665 × ln(2.5)</div>
              <div className="flex gap-2">
                {['2410', '4061', '7800'].map((opt) => (
                  <button key={opt} type="button" onClick={() => setAnsDv(opt)} className={`flex-1 py-1.5 rounded border font-mono ${ansDv === opt ? 'bg-emerald-500/25 border-emerald-300' : 'bg-white/[0.06] border-white/20'}`}>{opt} m/s</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!compDone}
                onClick={() => { soundEngine.playSuccess(); onComplete('computer'); }}
                className={`px-4 py-2 text-xs ${compDone ? 'lp-btn-accent' : 'lp-btn opacity-45 cursor-not-allowed'}`}
              >
                {lang === 'es' ? 'VALIDAR CÁLCULOS NASA' : 'CERTIFY MATH LAB'}
              </button>
            </div>
          </div>
        )}

        {mode === 'centrifuge' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="bg-white/[0.06] border border-white/15 rounded p-2">
                <div className="text-[10px] text-zinc-400">CARGA ACTUAL</div>
                <div className={`font-semibold text-sm ${gForce > 4.0 ? 'text-amber-300' : 'text-sky-300'}`}>{gForce.toFixed(2)} G / 4.50 G</div>
              </div>
              <div className="bg-white/[0.06] border border-white/15 rounded p-2">
                <div className="text-[10px] text-zinc-400">PERFUSIÓN CEREBRAL</div>
                <div className={`font-semibold text-sm ${perfusion < 42 ? 'text-rose-400' : 'text-emerald-300'}`}>{Math.round(perfusion)}%</div>
              </div>
              <div className="bg-white/[0.06] border border-white/15 rounded p-2">
                <div className="text-[10px] text-zinc-400">SOSTENER PICO 4.5G</div>
                <div className="font-semibold text-sm text-zinc-100">{peakTimeSec.toFixed(1)} / 6.0 s</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { soundEngine.playClick(); setAntiGValve(true); }}
                className={`flex-1 p-2.5 rounded border font-semibold ${antiGValve ? 'bg-emerald-500/20 border-emerald-300' : 'bg-white/[0.06] border-white/20'}`}
              >
                {antiGValve ? '✓ Válvula Anti-G (52% Prot.) ON' : '1. Activar Válvula Traje Anti-G (52%)'}
              </button>
              <button
                type="button"
                onClick={() => setSpinActive((s) => !s)}
                className="lp-btn px-4 py-2"
              >
                {spinActive ? 'FRENAR ROTOR' : '2. INICIAR ROTACIÓN 4.5 G'}
              </button>
            </div>
            <button
              type="button"
              onMouseDown={() => setAgsmHold(true)}
              onMouseUp={() => setAgsmHold(false)}
              onMouseLeave={() => setAgsmHold(false)}
              onTouchStart={() => setAgsmHold(true)}
              onTouchEnd={() => setAgsmHold(false)}
              className={`w-full py-3 rounded border font-semibold ${agsmHold ? 'bg-sky-400 text-zinc-950 border-white' : 'bg-white/[0.10] border-white/30 text-white'}`}
            >
              {lang === 'es' ? 'MANTENER PULSADO: MANIOBRA AGSM [ESPACIO]' : 'HOLD TO STRAIN: AGSM MANEUVER [SPACE]'}
            </button>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!centDone}
                onClick={() => { soundEngine.playSuccess(); onComplete('centrifuge'); }}
                className={`px-4 py-2 text-xs ${centDone ? 'lp-btn-accent' : 'lp-btn opacity-45 cursor-not-allowed'}`}
              >
                {lang === 'es' ? 'CERTIFICAR CENTRÍFUGA 4.5G' : 'CERTIFY 4.5G CENTRIFUGE'}
              </button>
            </div>
          </div>
        )}

        {mode === 'fire' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-white/[0.06] border border-white/15 rounded p-2.5 font-mono">
              <span>{lang === 'es' ? 'NIVEL MONÓXIDO DE CARBONO (CO):' : 'CABIN CO LEVEL:'}</span>
              <span className={coPpm <= 15 ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>{coPpm} ppm (Límite &lt;15 ppm)</span>
            </div>
            {fireErr && <div className="bg-rose-500/20 border border-rose-300/60 rounded p-2 text-rose-100">{fireErr}</div>}
            <div className="space-y-1.5">
              {[
                '1. Colocar Máscara O₂ Portátil PBA (15 min)',
                '2. Cerrar Válvula Ventilación IMV (Cortar Oxígeno al Fuego)',
                '3. Cortar Disyuntor Eléctrico Rack #2 (28 VDC)',
                '4. Descargar Extintor CO₂ PFE (2.7 kg · 3 zonas Rack #2)',
                '5. Depurar Aire con Cartucho LiOH (7.0 kg) hasta CO < 15 ppm',
              ].map((lbl, idx) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => tryFireAction(idx)}
                  className={`w-full p-2.5 rounded border text-left flex items-center justify-between ${
                    fireStep > idx ? 'bg-emerald-500/20 border-emerald-300 text-emerald-100' : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/20'
                  }`}
                >
                  <span>{lbl}</span>
                  {fireStep > idx && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!fireDone}
                onClick={() => { soundEngine.playSuccess(); onComplete('fire'); }}
                className={`px-4 py-2 text-xs ${fireDone ? 'lp-btn-accent' : 'lp-btn opacity-45 cursor-not-allowed'}`}
              >
                {lang === 'es' ? 'CERTIFICAR EXTINCIÓN ISS 0g' : 'CERTIFY ISS FIRE DRILL'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// NASA Wall Manual Reference Board Modal
// =============================================================================
export const WallManualPopupModal: React.FC<{
  lang: 'es' | 'en';
  onClose: () => void;
}> = ({ lang, onClose }) => {
  const [tab, setTab] = useState<'nbl' | 'math' | 'centrifuge' | 'fire' | 'quest_rpcm' | 'historical'>('math');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-500/45 p-5 space-y-3.5 text-zinc-100 text-xs">
        <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
          <div className="font-semibold tracking-wider uppercase flex items-center gap-2 text-sky-200">
            <BookOpen className="w-4 h-4" />
            {lang === 'es' ? 'MANUAL DE INGENIERÍA NASA (DATOS REALES)' : 'NASA ENGINEERING WALL MANUAL (VERIFIED DATA)'}
          </div>
          <button type="button" onClick={onClose} className="lp-btn px-2.5 py-1 text-xs">✕</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([
            ['math', 'Fórmulas'],
            ['nbl', 'Piscina NBL'],
            ['centrifuge', 'Centrífuga 4.5G'],
            ['fire', 'Fuego ISS 0g'],
            ['quest_rpcm', 'Quest / 120V RPCM'],
            ['historical', 'Apollo 13 / STS-120'],
          ] as const).map(([k, lbl]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-1 rounded text-[11px] border ${tab === k ? 'bg-white/25 border-white text-white font-semibold' : 'bg-white/[0.06] border-white/20 text-zinc-200'}`}>{lbl}</button>
          ))}
        </div>
        <div className="bg-white/[0.06] border border-white/15 rounded p-3.5 leading-relaxed space-y-1.5 font-mono">
          {tab === 'math' && (
            <>
              <div>• Ley Inverso Cuadrado: <b>I = I₀ / r²</b> (I₀ = 1,361 W/m² → Marte 1.524 UA ≈ 586 W/m²)</div>
              <div>• Presión Hidrostática: <b>P = ρ · g · h</b> (Luna g = 1.62 m/s² → 3 m agua = 4,860 Pa)</div>
              <div>• Tsiolkovsky: <b>Δv = Isp · g₀ · ln(m₀ / mf)</b> (RS-25 vac Isp 452 s · g₀ = 9.80665 m/s²)</div>
            </>
          )}
          {tab === 'nbl' && (
            <>
              <div>• Dimensiones NBL Houston: <b>61.5 × 31.1 × 12.2 m</b> · 6.2 millones de galones</div>
              <div>• Traje xEMU: presión diferencial operativa <b>ΔP = 29.6 kPa</b> (4.3 psi)</div>
              <div>• Calibración neutral: peso de plomo - empuje espuma = 0.0 kg neto</div>
            </>
          )}
          {tab === 'centrifuge' && (
            <>
              <div>• Carga nominal tripulada +Gx: máx. <b>3.8 G</b> · Entrenamiento pico: <b>4.5 G</b></div>
              <div>• Traje Anti-G infla vejigas neumáticas reduciendo estasis venosa (~52% protección)</div>
              <div>• Maniobra AGSM: tensión muscular + ciclo respiratorio cada 3 s mantiene perfusión &gt;35%</div>
            </>
          )}
          {tab === 'fire' && (
            <>
              <div>• Orden obligatorio 0g: <b>PBA O₂ → Cerrar IMV → Cortar Bus → CO₂ PFE → Purgar LiOH</b></div>
              <div>• Cartucho LiOH de 7.0 kg adsorbe gases ácidos y CO hasta umbral seguro <b>&lt; 15 ppm</b></div>
            </>
          )}
          {tab === 'quest_rpcm' && (
            <>
              <div>• Esclusa Quest SSP-50261: <b>101.3 → 70.3 (Campout) → 39.5 (Scavenge) → 29.6 (Leak Check) → 14.0 → 2.1 kPa (MPEV)</b></div>
              <div>• MBSU / RPCM ISS: bus secundario <b>120 V DC</b> (límite disparo ~<b>6.2 kWe</b> · primario 160 V DC)</div>
              <div>• Radiadores ATCS (Amoníaco NH₃): disipación de <b>420 K → 277 K</b> sumidero espacial</div>
            </>
          )}
          {tab === 'historical' && (
            <>
              <div>• <b>Apollo 13 (1970)</b>: Tanque O₂ #2=0 psia, #1=781.9 psia · LM Aquarius <b>12 A / 336 W · 3.3 °C · 0.2 L/d</b> · "Mailbox" CO₂ <b>14.9→1.2 mmHg</b></div>
              <div>• <b>STS-120 EVA-4 (2007)</b>: Desgarro <b>2.5 ft</b> Bahías 29–30 en ala P6-4B (<b>240 ft · 160 V DC</b>) · <b>5 Cufflinks</b> + Pinza HV en OBSS 90 ft</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Phase 1 Orion Pre-Flight Repair Bay & 5-Switch Overhead Panel Modal
// =============================================================================
export const OrionPreFlightModal: React.FC<{
  lang: 'es' | 'en';
  mode: 'fault_repair' | 'power_switches';
  sim: SpaceRoomState;
  inventoryKeys: string[];
  onComplete: (mode: 'fault_repair' | 'power_switches') => void;
  onClose: () => void;
}> = ({ lang, mode, sim, inventoryKeys, onComplete, onClose }) => {
  const [cryoPurged, setCryoPurged] = useState(false);
  const [fuseReplaced, setFuseReplaced] = useState(false);
  const [flangeTorqued, setFlangeTorqued] = useState(false);
  const [emergencyKitBypass, setEmergencyKitBypass] = useState(false);

  const [switches, setSwitches] = useState([false, false, false, false, false]);
  const switchNames = [
    '1. BAT BUS MAIN (28 VDC)',
    '2. IMU / GNC FLIGHT COMPUTERS',
    '3. CABIN O₂ / ECLSS REGULATOR (21%)',
    '4. RS-25 LOX/LH₂ PREVALVES OPEN',
    '5. SRB & LAS PYRO IGNITION ARM',
  ];

  const hasCryo = inventoryKeys.includes('DA_CryoValve') || emergencyKitBypass;
  const hasFuse = inventoryKeys.includes('DA_EmergencyFuse') || emergencyKitBypass;
  const hasWrench = inventoryKeys.includes('DA_TorqueWrench') || emergencyKitBypass;
  const repairReady = cryoPurged && fuseReplaced && flangeTorqued;
  const allSwitchesOn = switches.every(Boolean);
  const suppliesOk = sim.o2Percent >= 19.5 && sim.waterLiters >= 10 && sim.foodKg >= 2 && sim.objectives.manifestConfigured && sim.objectives.preflightRepaired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-500/45 p-5 space-y-4 text-zinc-100 text-xs">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="font-semibold tracking-wider uppercase flex items-center gap-2 text-amber-200">
            {mode === 'fault_repair' ? <Wrench className="w-4 h-4 text-amber-300" /> : <Power className="w-4 h-4 text-sky-300" />}
            {mode === 'fault_repair'
              ? lang === 'es' ? 'CÁPSULA ORION · BAHÍA CRIO / FUSIBLE RS-25' : 'ORION MODULE · CRYO & RS-25 REPAIR BAY'
              : lang === 'es' ? 'CÁPSULA ORION · PANEL SUPERIOR 5 INTERRUPTORES' : 'ORION MODULE · 5-SWITCH OVERHEAD PANEL'}
          </div>
          <button type="button" onClick={onClose} className="lp-btn px-2.5 py-1 text-xs">✕</button>
        </div>

        {mode === 'fault_repair' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div className={`p-2 rounded border ${hasCryo ? 'bg-emerald-500/15 border-emerald-300/60 text-emerald-200' : 'bg-rose-500/15 border-rose-300/60 text-rose-200'}`}>
                Válvula Crio: {hasCryo ? 'LISTA' : 'EN PISCINA SW'}
              </div>
              <div className={`p-2 rounded border ${hasFuse ? 'bg-emerald-500/15 border-emerald-300/60 text-emerald-200' : 'bg-rose-500/15 border-rose-300/60 text-rose-200'}`}>
                Fusible RS-25: {hasFuse ? 'LISTO' : 'EN HUB CENTRAL'}
              </div>
              <div className={`p-2 rounded border ${hasWrench ? 'bg-emerald-500/15 border-emerald-300/60 text-emerald-200' : 'bg-rose-500/15 border-rose-300/60 text-rose-200'}`}>
                Llave 28.5 N·m: {hasWrench ? 'LISTA' : 'EN ALMACÉN SE'}
              </div>
            </div>

            {(!hasCryo || !hasFuse || !hasWrench) && (
              <div className="bg-amber-500/15 border border-amber-300/50 rounded p-2.5 flex items-center justify-between gap-2">
                <span>
                  {lang === 'es'
                    ? 'Falta equipo en tu inventario. Recógelo en las salas indicadas o solicita kit de reserva a Ground Control.'
                    : 'Missing hardware in inventory. Collect from indicated wings or request Ground Control backup kit.'}
                </span>
                <button type="button" onClick={() => setEmergencyKitBypass(true)} className="lp-btn px-2.5 py-1 shrink-0">
                  {lang === 'es' ? 'Kit Ground' : 'Ground Kit'}
                </button>
              </div>
            )}

            <div className="space-y-2">
              <button type="button" disabled={!hasCryo} onClick={() => { soundEngine.playClick(); setCryoPurged(true); }} className={`w-full p-2.5 rounded border text-left flex justify-between ${cryoPurged ? 'bg-emerald-500/20 border-emerald-300' : hasCryo ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/25' : 'opacity-40 cursor-not-allowed border-white/10'}`}>
                <span>1. Instalar Válvula Crio LOX/LH₂ y Purgar Hielo (&lt;0.1 kPa/min)</span>
                {cryoPurged && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              </button>
              <button type="button" disabled={!hasFuse} onClick={() => { soundEngine.playClick(); setFuseReplaced(true); }} className={`w-full p-2.5 rounded border text-left flex justify-between ${fuseReplaced ? 'bg-emerald-500/20 border-emerald-300' : hasFuse ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/25' : 'opacity-40 cursor-not-allowed border-white/10'}`}>
                <span>2. Sustituir Fusible Maestro HV en Bus RS-25 (28 VDC)</span>
                {fuseReplaced && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              </button>
              <button type="button" disabled={!hasWrench} onClick={() => { soundEngine.playClick(); setFlangeTorqued(true); }} className={`w-full p-2.5 rounded border text-left flex justify-between ${flangeTorqued ? 'bg-emerald-500/20 border-emerald-300' : hasWrench ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/25' : 'opacity-40 cursor-not-allowed border-white/10'}`}>
                <span>3. Aplicar Torque Exacto 28.5 N·m con Llave Dinamométrica EVA</span>
                {flangeTorqued && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button type="button" disabled={!repairReady} onClick={() => { soundEngine.playSuccess(); onComplete('fault_repair'); }} className={`px-4 py-2 ${repairReady ? 'lp-btn-accent' : 'lp-btn opacity-45 cursor-not-allowed'}`}>
                {lang === 'es' ? 'SELLAR BAHÍA ORION' : 'SEAL ORION SERVICE BAY'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center text-[11px]">
              <div className="bg-white/[0.06] border border-white/15 rounded p-2">O₂ {sim.o2Percent.toFixed(1)}%</div>
              <div className="bg-white/[0.06] border border-white/15 rounded p-2">CO₂ {Math.round(sim.co2Ppm)} ppm</div>
              <div className="bg-white/[0.06] border border-white/15 rounded p-2">H₂O {sim.waterLiters.toFixed(1)} L</div>
              <div className={`border rounded p-2 ${suppliesOk ? 'bg-emerald-500/20 border-emerald-300 text-emerald-200' : 'bg-rose-500/20 border-rose-300 text-rose-200'}`}>
                {suppliesOk ? 'CARGA OK' : 'FALTA MANIFIESTO'}
              </div>
            </div>
            <div className="space-y-1.5">
              {switchNames.map((sw, idx) => (
                <button
                  key={sw}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSwitches((arr) => arr.map((v, i) => (i === idx ? !v : v)));
                  }}
                  className={`w-full p-2.5 rounded border flex items-center justify-between ${
                    switches[idx] ? 'bg-emerald-500/20 border-emerald-300 text-emerald-100' : 'bg-white/[0.06] border-white/20 text-zinc-200'
                  }`}
                >
                  <span className="font-mono">{sw}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${switches[idx] ? 'bg-emerald-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                    {switches[idx] ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="button" disabled={!allSwitchesOn} onClick={() => { soundEngine.playSuccess(); onComplete('power_switches'); }} className={`px-4 py-2 ${allSwitchesOn ? 'lp-btn-accent' : 'lp-btn opacity-45 cursor-not-allowed'}`}>
                {lang === 'es' ? 'CABINA ORION ENERGIZADA · IR AL ASIENTO' : 'ORION POWERED · PROCEED TO SEAT'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const EngineeringCalibrationModal: React.FC<{
  lang: 'es' | 'en';
  stationKind: RoomStationKind;
  sim: SpaceRoomState;
  hasHandTool: string | null;
  onConfirm: (option?: 'patch' | 'cdra' | 'krusty' | 'solar' | 'nominal') => void;
  onClose: () => void;
}> = ({ lang, stationKind, sim, hasHandTool, onConfirm, onClose }) => {
  const [sliderA, setSliderA] = useState(50);
  const [sliderB, setSliderB] = useState(40);
  const [modeChoice, setModeChoice] = useState<'patch' | 'cdra' | 'krusty' | 'solar' | 'nominal'>(
    stationKind === 'krusty_reactor_station'
      ? sim.powerChoice === 'fsp_40kw'
        ? 'krusty'
        : 'solar'
      : stationKind === 'skylab_thermal_station'
      ? hasHandTool === 'DA_DuctTapeKit' || hasHandTool === 'DA_ScrewDriver'
        ? 'patch'
        : 'cdra'
      : 'nominal'
  );

  let titleEs = 'CALIBRACIÓN SUBSISTEMA NASA';
  let titleEn = 'NASA SUBSYSTEM CALIBRATION';
  let descEs = '';
  let descEn = '';
  let metricALabel = '';
  let metricBLabel = '';
  let metricAVal = '';
  let metricBVal = '';
  let inSpec = false;

  if (stationKind === 'skylab_thermal_station') {
    titleEs = 'ESCUDO TÉRMICO SKYLAB 2 / APOLLO 13 (163 W/m²)';
    titleEn = 'SKYLAB 2 / APOLLO 13 THERMAL SHIELD (163 W/m²)';
    descEs =
      'Reduce el flujo térmico interno bajo el límite máximo NASA de 163 W/m² tensando la lámina reflectante Mylar/Kapton (>= 75%).';
    descEn =
      'Lower internal thermal load below NASA 163 W/m² ceiling by tensioning reflective Mylar/Kapton parasol (>= 75%).';
    const heatWm2 = Math.round(182 - sliderA * 0.72);
    metricALabel = lang === 'es' ? 'Tensión Escudo Kapton' : 'Kapton Tension';
    metricAVal = `${sliderA}%`;
    metricBLabel = lang === 'es' ? 'Flujo Térmico' : 'Thermal Flux';
    metricBVal = `${heatWm2} W/m² (<= 163)`;
    inSpec = sliderA >= 75;
  } else if (stationKind === 'spe_electrolyzer_station') {
    titleEs = 'ELECTROLIZADOR DE AGUA SPE (2H₂O → 2H₂ + O₂)';
    titleEn = 'SPE WATER ELECTROLYZER (2H₂O → 2H₂ + O₂)';
    descEs =
      'Ajusta el reparto de potencia del reactor hacia la hidrólisis a 66.7% (26.7 kWe NASA Marte) para producir O₂ respirable.';
    descEn =
      'Dial electrolyzer bus allocation around NASA Mars reference share (66.7% · 26.7 kWe) to generate breathable O₂.';
    const share = (40 + sliderA * 0.4).toFixed(1);
    metricALabel = lang === 'es' ? 'Potencia Electrolizador' : 'Electrolyzer Power Share';
    metricAVal = `${share}% (Ref 66.7%)`;
    metricBLabel = lang === 'es' ? 'Producción O₂' : 'O₂ Yield';
    metricBVal = `+${(0.4 + sliderA * 0.008).toFixed(2)}%/ciclo`;
    inSpec = Number(share) >= 60 && Number(share) <= 74;
  } else if (stationKind === 'krusty_reactor_station') {
    titleEs = 'REACTOR STIRLING KRUSTY 40 kWe Y RADIADORES';
    titleEn = 'KRUSTY 40 kWe STIRLING CORE & RADIATORS';
    descEs =
      'Abre el área de radiadores NaK (133.4 m² Polo / 216.2 m² Ecuador · rechazo 126.4 kWth) para sostener los 354 h de noche lunar.';
    descEn =
      'Deploy NaK thermal radiator wings (133.4 m² Pole / 216.2 m² Equator · 126.4 kWth heat rejection) for 354 h lunar night.';
    const radM2 = Math.round(60 + sliderA * 1.7);
    metricALabel = lang === 'es' ? 'Área Radiadores Desplegada' : 'Deployed Radiator Area';
    metricAVal = `${radM2} m² (Ref 133.4–216.2)`;
    metricBLabel = lang === 'es' ? 'Potencia Neta Stirling' : 'Net Stirling Power';
    metricBVal = modeChoice === 'krusty' ? '40.0 kWe (18.1% eff)' : '20.0 kWe Solar Ration';
    inSpec = radM2 >= 133;
  } else if (stationKind === 'aph_chamber_station') {
    titleEs = 'CÁMARA BOTÁNICA APH · COSECHA VEG-05 (1,700 cm²)';
    titleEn = 'APH BOTANY CHAMBER · VEG-05 HARVEST (1,700 cm²)';
    descEs =
      'Sintoniza la matriz LED roja (630 nm) y azul (450 nm) para alcanzar flujo PAR fotosintético óptimo (>= 750 µmol/m²·s) y cosechar tomates VEG-05.';
    descEn =
      'Tune 630 nm Red & 450 nm Blue LED arrays to reach optimal PPFD (>= 750 µmol/m²·s) before harvesting VEG-05 tomatoes.';
    const red = Math.round(sliderA * 6.0);
    const blue = Math.round(sliderB * 4.0);
    metricALabel = 'LED Rojo 630 nm + Azul 450 nm';
    metricAVal = `${red} + ${blue} = ${red + blue} µmol/m²·s`;
    metricBLabel = lang === 'es' ? 'Área Cultivo APH' : 'APH Grow Area';
    metricBVal = '1,700 cm² · 180 sensores';
    inSpec = red + blue >= 750;
  } else if (stationKind === 'compost_valve_station') {
    titleEs = 'AISLAMIENTO VÁLVULA COMPOSTAJE MICROBIANO (BLSS)';
    titleEn = 'MICROBIAL COMPOST LOOP ISOLATION VALVE (BLSS)';
    descEs =
      'Cierra al 100% la admisión microbiana para detener el consumo biológico de O₂ (0.022–0.153 L O₂/kg·min NASA).';
    descEn =
      'Seal the microbial compost intake to 100% closed to stop biological O₂ drawdown (0.022–0.153 L O₂/kg·min NASA).';
    const seal = sliderA;
    const drain = ((1 - seal / 100) * 0.153).toFixed(3);
    metricALabel = lang === 'es' ? 'Cierre Válvula' : 'Valve Closure';
    metricAVal = `${seal}%`;
    metricBLabel = lang === 'es' ? 'Fuga Microbiana O₂' : 'Microbial O₂ Draw';
    metricBVal = `${drain} L/kg·min`;
    inSpec = seal >= 92;
  } else if (stationKind === 'bios3_buffer_station') {
    titleEs = 'TANQUE AMORTIGUADOR BIOS-3 (1,000 L + 400 kg REGOLITO)';
    titleEn = 'BIOS-3 BUFFER TANK (1,000 L + 400 kg REGOLITH)';
    descEs =
      'Ajusta la recuperación de condensado transpirado al estándar BIOS-3 (95%) para equilibrar el bucle hídrico de 315 m³.';
    descEn =
      'Calibrate condensate water recovery loop to BIOS-3 spec (95%) across the 315 m³ closed greenhouse volume.';
    const rec = Math.round(60 + sliderA * 0.38);
    metricALabel = lang === 'es' ? 'Recuperación Hídrica' : 'Water Recovery Rate';
    metricAVal = `${rec}% (Target >= 94%)`;
    metricBLabel = lang === 'es' ? 'Lixiviación Mezcla' : 'Buffer Slurry';
    metricBVal = '1,000 L H₂O + 400 kg reg.';
    inSpec = rec >= 94;
  } else if (stationKind === 'regolith_shield_station') {
    titleEs = 'BLINDAJE RADIACIÓN GCR/SPE · REGOLITO COMPACTADO';
    titleEn = 'GCR/SPE RADIATION SHIELD · COMPACTED REGOLITH';
    descEs =
      'Apila al menos 2.0 m de espesor (300 g/cm² · 400 toneladas métricas a 1,500 kg/m³) sobre el hábitat antes del pico solar.';
    descEn =
      'Compact at least 2.0 m regolith overburden (300 g/cm² · 400 t at 1,500 kg/m³) over habitat pressure shell.';
    const depthM = +(sliderA * 0.025).toFixed(2);
    const colGcm2 = Math.round(depthM * 150);
    metricALabel = lang === 'es' ? 'Espesor Regolito' : 'Regolith Depth';
    metricAVal = `${depthM.toFixed(2)} m (Min 2.00 m)`;
    metricBLabel = lang === 'es' ? 'Columna Másica' : 'Areal Density';
    metricBVal = `${colGcm2} g/cm²`;
    inSpec = depthM >= 2.0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl mc-panel border-4 border-cyan-500 p-5 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#090C12] pb-2">
          <div className="flex items-center gap-2 text-cyan-300 font-black text-sm">
            <Sliders className="w-5 h-5 text-cyan-400" />
            {lang === 'es' ? titleEs : titleEn}
          </div>
          <button type="button" onClick={onClose} className="mc-btn px-2.5 py-1 text-xs font-black">
            ✕
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-200 bg-slate-900/90 p-3 border border-slate-700">
          {lang === 'es' ? descEs : descEn}
        </p>

        {(() => {
          const brief = getStationTrainingBrief(stationKind);
          if (!brief) return null;
          return (
            <div className="bg-zinc-800/70 border border-sky-400/35 rounded-lg p-2.5 text-[11px] space-y-1">
              <div className="font-bold text-sky-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {lang === 'es' ? brief.titleEs : brief.titleEn}
              </div>
              <p className="text-zinc-200 leading-snug">
                {lang === 'es' ? brief.purposeEs : brief.purposeEn}
              </p>
              <div className="text-[10px] font-mono text-amber-300/95">
                NASA: {lang === 'es' ? brief.nasaDataEs : brief.nasaDataEn} · {brief.sourceDoc}
              </div>
            </div>
          );
        })()}

        {stationKind === 'krusty_reactor_station' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModeChoice('krusty')}
              className={`mc-btn p-2.5 text-xs font-black ${
                modeChoice === 'krusty' ? 'mc-btn-green ring-2 ring-emerald-300' : 'mc-btn-blue'
              }`}
            >
              KRUSTY FSP 40 kWe (354 h)
            </button>
            <button
              type="button"
              onClick={() => setModeChoice('solar')}
              className={`mc-btn p-2.5 text-xs font-black ${
                modeChoice === 'solar' ? 'mc-btn-orange ring-2 ring-amber-300' : 'mc-btn-blue'
              }`}
            >
              {lang === 'es' ? 'Racionar Solar 20 kWe' : 'Ration 20 kWe Solar'}
            </button>
          </div>
        )}

        <div className="space-y-3 bg-slate-950/90 p-3.5 border border-slate-700 text-xs">
          <div>
            <div className="flex justify-between font-bold mb-1">
              <span className="text-slate-300">{metricALabel}</span>
              <span className={inSpec ? 'text-emerald-400 font-black' : 'text-amber-300 font-black'}>
                {metricAVal}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderA}
              onChange={(e) => setSliderA(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {stationKind === 'aph_chamber_station' && (
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-slate-300">LED Azul 450 nm PPFD</span>
                <span className="text-sky-300 font-black">{Math.round(sliderB * 4)} µmol/m²·s</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliderB}
                onChange={(e) => setSliderB(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-800 pt-2">
            <span className="text-slate-400">{metricBLabel}</span>
            <span className="font-mono font-black text-cyan-200">{metricBVal}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-black ${inSpec ? 'text-emerald-400' : 'text-amber-300'}`}>
            {inSpec
              ? lang === 'es'
                ? '✓ DENTRO DE ESPECIFICACIÓN NASA'
                : '✓ WITHIN REAL NASA SPEC'
              : lang === 'es'
              ? 'Ajusta el deslizador al rango objetivo NASA...'
              : 'Slide control into NASA target spec...'}
          </span>
          <button
            type="button"
            disabled={!inSpec}
            onClick={() => {
              soundEngine.playSuccess();
              onConfirm(modeChoice);
            }}
            className={`mc-btn px-4 py-2 text-xs font-black ${
              inSpec ? 'mc-btn-green' : 'opacity-45 cursor-not-allowed'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 inline mr-1.5" />
            {lang === 'es' ? 'APLICAR Y BLOQUEAR TELEMETRÍA' : 'APPLY & LOCK TELEMETRY'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CrewDialogueModal: React.FC<{
  lang: 'es' | 'en';
  crewId: keyof typeof CREW_COMPANIONS;
  guidedStep: GuidedStepInfo;
  giftEs?: string;
  giftEn?: string;
  onAcceptMission: () => void;
  onClose: () => void;
}> = ({ lang, crewId, guidedStep, giftEs, giftEn, onAcceptMission, onClose }) => {
  const crew: CrewCompanion = CREW_COMPANIONS[crewId] ?? CREW_COMPANIONS.CONRAD;
  const [stage, setStage] = useState<'intro' | 'briefing'>('intro');
  const [charCount, setCharCount] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);

  const introFullText =
    lang === 'es'
      ? `¡Hola, cadete! Soy ${crew.nameEs} (${crew.roleEs}). ${crew.tributeEs}`
      : `Greetings, cadet! I am ${crew.nameEn} (${crew.roleEn}). ${crew.tributeEn}`;

  const missionFullText =
    lang === 'es'
      ? `${giftEs ? `${giftEs} ` : ''}Objetivo actual — ${guidedStep.stepTitleEs}: ${guidedStep.instructionEs} (Destino: ${guidedStep.zoneEs}). He trazado la línea punteada amarilla y el rombo ◆ en tu mapa y en el suelo.`
      : `${giftEn ? `${giftEn} ` : ''}Current Objective — ${guidedStep.stepTitleEn}: ${guidedStep.instructionEn} (Destination: ${guidedStep.zoneEn}). I marked the yellow dotted route and diamond ◆ on your map and floor.`;

  const activeText = stage === 'intro' ? introFullText : missionFullText;

  useEffect(() => {
    setCharCount(0);
    const id = window.setInterval(() => {
      setCharCount((c) => {
        if (c >= activeText.length) return c;
        return c + 2;
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [stage, activeText]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPulseTick((t) => (t + 1) % 60);
    }, 110);
    return () => window.clearInterval(id);
  }, []);

  const typingDone = charCount >= activeText.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-3 sm:p-5">
      <div className="w-full max-w-2xl bg-zinc-900/82 backdrop-blur-xl border border-zinc-300/35 rounded-xl shadow-2xl p-4 sm:p-5 space-y-4 text-zinc-100">
        {/* Top Crew Header */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-400/20 pb-3">
          <div className="flex items-center gap-3">
            {/* Animated EVA Visor Avatar */}
            <div
              className="relative w-14 h-14 rounded-xl flex items-center justify-center border-2 shrink-0 transition-transform duration-300"
              style={{
                borderColor: crew.accentHex,
                backgroundColor: `${crew.accentHex}22`,
                transform: `translateY(${Math.sin(pulseTick * 0.45) * 2.5}px)`,
              }}
            >
              <div
                className="w-9 h-7 rounded-md border border-white/60 flex items-center justify-center shadow-inner"
                style={{ background: `linear-gradient(135deg, #1e293b, ${crew.accentHex})` }}
              >
                <span className="text-[11px] font-black tracking-wider text-white">
                  {crew.id.slice(0, 3)}
                </span>
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-900"
                style={{ backgroundColor: typingDone ? '#10b981' : '#facc15' }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-300" />
                <span className="text-sm font-black tracking-wide text-white">
                  {lang === 'es' ? crew.nameEs : crew.nameEn}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/70 border border-zinc-400/30 text-zinc-200 font-bold">
                  {stage === 'intro'
                    ? lang === 'es'
                      ? 'Presentación Tripulación'
                      : 'Crew Introduction'
                    : lang === 'es'
                      ? 'Asignación de Misión'
                      : 'Mission Briefing'}
                </span>
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">
                {lang === 'es' ? crew.roleEs : crew.roleEn}
              </div>
              {/* Animated voice waveform bars */}
              <div className="flex items-end gap-1 mt-1.5 h-2.5">
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                  const h = typingDone
                    ? 3
                    : 3 + Math.round(Math.abs(Math.sin(pulseTick * 0.8 + idx * 0.9)) * 7);
                  return (
                    <span
                      key={idx}
                      className="w-1 rounded-full transition-all duration-100"
                      style={{ height: `${h}px`, backgroundColor: crew.accentHex }}
                    />
                  );
                })}
                <span className="text-[9px] text-zinc-400 font-mono ml-1.5">
                  {typingDone ? (lang === 'es' ? 'TRANSMISIÓN EN ESPERA' : 'COMMS READY') : 'NASA VHF TX...'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-zinc-700/70 hover:bg-zinc-600/80 border border-zinc-300/25 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Animated Typewriter Speech Box */}
        <div className="bg-zinc-800/65 border border-zinc-400/25 rounded-lg p-3.5 min-h-[108px] text-xs sm:text-sm leading-relaxed text-zinc-100">
          {activeText.slice(0, charCount)}
          {!typingDone && <span className="inline-block w-1.5 h-4 ml-1 bg-amber-300 animate-pulse align-middle" />}
        </div>

        {stage === 'briefing' && (
          <div className="bg-zinc-800/70 border border-yellow-400/40 rounded-lg p-3 text-xs space-y-1">
            <div className="font-black text-yellow-300 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rotate-45 bg-yellow-400" />
              {lang === 'es' ? guidedStep.stepTitleEs : guidedStep.stepTitleEn}
            </div>
            <div className="text-zinc-200">
              {lang === 'es' ? guidedStep.instructionEs : guidedStep.instructionEn}
            </div>
            <div className="text-[10px] font-mono text-sky-300">
              {lang === 'es' ? `Módulo: ${guidedStep.zoneEs}` : `Module: ${guidedStep.zoneEn}`}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {!typingDone ? (
            <button
              type="button"
              onClick={() => setCharCount(activeText.length)}
              className="px-3 py-1.5 rounded-lg bg-zinc-700/80 hover:bg-zinc-600/80 border border-zinc-400/30 text-xs font-bold"
            >
              {lang === 'es' ? 'Completar texto' : 'Finish text'}
            </button>
          ) : (
            <div className="text-[11px] text-zinc-400 font-mono">
              {stage === 'intro'
                ? lang === 'es'
                  ? 'Paso 1/2: Presentación completa'
                  : 'Step 1/2: Introduction complete'
                : lang === 'es'
                  ? 'Paso 2/2: Objetivo asignado ◆'
                  : 'Step 2/2: Objective ready ◆'}
            </div>
          )}

          {stage === 'intro' ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStage('briefing');
              }}
              className="px-4 py-2 rounded-lg bg-sky-600/90 hover:bg-sky-500 border border-sky-300/40 text-xs font-black text-white"
            >
              {lang === 'es' ? 'Siguiente: Instrucción de Misión →' : 'Next: Mission Briefing →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccess();
                onAcceptMission();
              }}
              className="px-4 py-2 rounded-lg bg-amber-500/90 hover:bg-amber-400 border border-yellow-200/50 text-xs font-black text-zinc-950"
            >
              {lang === 'es'
                ? '◆ Aceptar Misión y Trazar Ruta Punteada'
                : '◆ Accept Mission & Plot Dotted Route'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const EscTacticalMenuModal: React.FC<{
  lang: 'es' | 'en';
  sim: SpaceRoomState;
  playerX: number;
  playerY: number;
  playerYawDeg: number;
  guidedStep: GuidedStepInfo;
  cameraMode: '1p' | '3p';
  musicOn: boolean;
  ambientOn: boolean;
  onToggleCamera: () => void;
  onToggleMusic: () => void;
  onToggleAmbient: () => void;
  onToggleLang: () => void;
  onCycleLighting: () => void;
  onCycleThrowMode?: () => void;
  onResetRpcm?: () => void;
  onSelectMission: (id: MissionId) => void;
  onOpenTerminal: () => void;
  onOpenPapers: () => void;
  onOpenMirror: () => void;
  onReturnMainMenu: () => void;
  onClose: () => void;
}> = ({
  lang,
  sim,
  playerX,
  playerY,
  playerYawDeg,
  guidedStep,
  cameraMode,
  musicOn,
  ambientOn,
  onToggleCamera,
  onToggleMusic,
  onToggleAmbient,
  onToggleLang,
  onCycleLighting,
  onCycleThrowMode,
  onResetRpcm,
  onSelectMission,
  onOpenTerminal,
  onOpenPapers,
  onOpenMirror,
  onReturnMainMenu,
  onClose,
}) => {
  const [tab, setTab] = useState<'map_ops' | 'telemetry' | 'phases_settings'>('map_ops');
  const distToTargetM = Math.hypot(guidedStep.targetX - playerX, guidedStep.targetY - playerY).toFixed(1);
  const currentZone = getRoomZoneAt(playerX, playerY);

  const allObjectiveRows = [
    { group: 'aether4', done: sim.objectives.powerRestored, es: 'Bus FSP (Cargador + Batería + Fusible + Palanca)', en: 'FSP Bus (Charger + Battery + Fuse + Breaker)' },
    { group: 'aether4', done: sim.objectives.eclssCleaned, es: 'Conducto CO₂ (4 Tornillos + Cartucho LiOH 7.0 kg)', en: 'CO₂ Duct (4 Screws + 7.0 kg LiOH Filter)' },
    { group: 'aether4', done: sim.objectives.mealPrepared, es: 'Galley BVAD (Ración + Agua 0.50 L + Calentador)', en: 'BVAD Galley (Ration + 0.50 L Water + Heater)' },
    { group: 'aether4', done: sim.objectives.exerciseCalibrated, es: 'Caminadora ASCAN (2.0 h/día)', en: 'ASCAN Treadmill (2.0 h/day)' },
    { group: 'aether4', done: sim.objectives.whcInspected, es: 'Inspección WHC (STS-126)', en: 'WHC Inspection (STS-126)' },
    { group: 'aether4', done: sim.objectives.evaChecked, es: 'Vestidor EVA (Regla del 8: 8 h · 1 L)', en: 'EVA Locker (Rule of 8: 8 h · 1 L)' },
    { group: 'aether4', done: sim.objectives.crisisSolved, es: 'Simulacro Crisis Agua', en: 'Water Leak Crisis Drill' },
    { group: 'aether4', done: sim.objectives.nblCertified, es: 'Piscina NBL (61.5 m · xEMU 29.6 kPa)', en: 'NBL Pool (61.5 m · xEMU 29.6 kPa)' },
    { group: 'aether4', done: sim.objectives.computerCertified, es: 'Fórmulas NASA (I=I₀/r², P=ρgh, Δv)', en: 'NASA Formulas (I=I₀/r², P=ρgh, Δv)' },
    { group: 'aether4', done: sim.objectives.centrifugeCertified, es: 'Centrífuga 4.5 G (Traje 52% + AGSM)', en: '4.5 G Centrifuge (52% Suit + AGSM)' },
    { group: 'aether4', done: sim.objectives.fireDrillCertified, es: 'Incendio 0g ISS Rack #2 (<15 ppm CO)', en: 'ISS 0g Rack #2 Fire (<15 ppm CO)' },
    { group: 'aether4', done: sim.objectives.manifestConfigured, es: 'Manifiesto MEDS (Cubierta Norte)', en: 'MEDS Manifest (North Deck)' },
    { group: 'aether4', done: sim.objectives.preflightRepaired, es: 'Pre-Vuelo Orion: Falla Crio + Fusible RS-25', en: 'Orion Pre-Flight: Cryo + RS-25 Repair' },
    { group: 'aether4', done: sim.objectives.preflightSystemsOn, es: 'Pre-Vuelo Orion: 5 Sistemas + Suministros', en: 'Orion Pre-Flight: 5 Overhead Systems' },
    { group: 'aether4', done: sim.objectives.launchCompleted, es: 'Despegue y Aterrizaje 3D Orion MEDS', en: 'Orion MEDS 3D Takeoff & Landing' },
    { group: 'aether4', done: sim.objectives.thermalFixed, es: 'Parche Térmico Skylab 163 W/m²', en: 'Skylab Thermal Patch 163 W/m²' },
    { group: 'aether4', done: sim.objectives.powerBalanced, es: 'Reactor KRUSTY 40 kWe Stirling', en: '40 kWe KRUSTY Stirling Reactor' },
    { group: 'aether4', done: sim.objectives.aphHarvested, es: 'Botánica APH VEG-05 (630+450 nm)', en: 'APH VEG-05 Harvest (630+450 nm)' },
    { group: 'aether4', done: sim.objectives.bios3Activated, es: 'Tanque Amortiguador BIOS-3 (95% agua)', en: 'BIOS-3 Buffer Tank (95% water)' },
    { group: 'aether4', done: sim.objectives.roverReturned, es: 'Acoplamiento Rover 6,000 kg', en: '6,000 kg Rover Docking' },
    { group: 'aether4', done: sim.objectives.regolithDeployed, es: 'Blindaje Regolito 2.0 m (300 g/cm²)', en: '2.0 m Regolith Shield (300 g/cm²)' },
    { group: 'apollo13_aquarius', done: sim.objectives.a13CryoDiagnosed, es: 'Apollo 13: Agitado Crio O₂ SM (0 / 781.9 psia)', en: 'Apollo 13: SM Cryo O₂ Stir (0 / 781.9 psia)' },
    { group: 'apollo13_aquarius', done: sim.objectives.a13AquariusMigrated, es: 'Apollo 13: Migrar a Aquarius LM (12 A / 336 W)', en: 'Apollo 13: Shed to Aquarius LM (12 A / 336 W)' },
    { group: 'apollo13_aquarius', done: sim.objectives.a13MailboxInstalled, es: 'Apollo 13: Adaptador "Mailbox" CO₂ (14.9→1.2 mmHg)', en: 'Apollo 13: "Mailbox" CO₂ Adapter (14.9→1.2 mmHg)' },
    { group: 'apollo13_aquarius', done: sim.objectives.a13ColdPowerup, es: 'Apollo 13: Reencendido en Frío Reentrada', en: 'Apollo 13: Cold Entry Power-Up' },
    { group: 'sts120_p6_solar', done: sim.objectives.stsArrayInspected, es: 'STS-120: Diagnóstico P6-4B (2.5 ft · 160V DC)', en: 'STS-120: P6-4B Diagnostics (2.5 ft · 160V DC)' },
    { group: 'sts120_p6_solar', done: sim.objectives.stsCufflinksCrafted, es: 'STS-120: Fabricar 5 Cufflinks Aluminio', en: 'STS-120: Craft 5 Aluminum Cufflinks' },
    { group: 'sts120_p6_solar', done: sim.objectives.stsWireSnipped, es: 'STS-120: Esclusa 2.1 kPa + Cortar Cable OBSS', en: 'STS-120: Quest 2.1 kPa + Snip OBSS Wire' },
    { group: 'sts120_p6_solar', done: sim.objectives.stsArrayDeployed, es: 'STS-120: Desplegar P6-4B Medias Bahías [5/5]', en: 'STS-120: P6-4B Half-Bay Deploy [5/5]' },
  ];
  const objectiveRows =
    sim.currentMissionId === 'apollo13_aquarius' || sim.currentMissionId === 'sts120_p6_solar'
      ? allObjectiveRows.filter((r) => r.group === sim.currentMissionId)
      : allObjectiveRows.filter((r) => r.group === 'aether4');

  // SVG viewport maps X: -1.4..23.0 (width 24.4) and Y: -9.4..16.2 (height 25.6), flipped vertically so North (Y+) is UP
  const toSvgX = (wx: number) => (wx + 1.4) * 18;
  const toSvgY = (wy: number) => (16.2 - wy) * 18;
  const pathPoints = computeStationPathWaypoints(playerX, playerY, guidedStep.targetX, guidedStep.targetY);
  const pathPointsStr = pathPoints.map((p) => `${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`).join(' ');

  const lightLabels: Record<LightingMode, string> = {
    day: 'SSLA 6300K',
    circadian: '2700K Night',
    spectral_magenta: 'APH 630+450nm',
    blueprint_launch: 'MEDS Blueprint',
    alert: 'SPE Red Alert',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto lp-panel-solid rounded-xl shadow-2xl p-4 sm:p-5 space-y-3.5 text-slate-900">
        {/* Header + Immediate Quick-Access Exit/Resume Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900/15 pb-3">
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-900 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-sky-600" />
              {lang === 'es' ? 'MENÚ RÁPIDO Y MAPA DE ESTACIÓN [ESC]' : 'QUICK MENU & STATION TACTICAL MAP [ESC]'}
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              {lang === 'es' ? currentZone.nameEs : currentZone.nameEn} · ({playerX.toFixed(1)}m, {playerY.toFixed(1)}m)
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onReturnMainMenu}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 border border-rose-700/30 text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Salir al Menú Principal' : 'Exit to Main Menu'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="lp-btn lp-btn-accent px-3.5 py-1.5 rounded-lg text-xs"
            >
              {lang === 'es' ? 'REANUDAR [ESC]' : 'RESUME [ESC]'}
            </button>
          </div>
        </div>

        {/* Always-Visible Quick Access Strip */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/55 border border-slate-900/12 rounded-lg p-2 text-[11px]">
          <button
            type="button"
            onClick={onToggleCamera}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            {cameraMode.toUpperCase()} [V]
          </button>
          <button
            type="button"
            onClick={onCycleLighting}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            {lightLabels[sim.lightingMode]}
          </button>
          <button
            type="button"
            onClick={onToggleMusic}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            {musicOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-600" />}
            {lang === 'es' ? 'Música' : 'Music'}
          </button>
          <button
            type="button"
            onClick={onToggleAmbient}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            {ambientOn ? <Volume2 className="w-3.5 h-3.5 text-sky-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-600" />}
            {lang === 'es' ? 'Cabina' : 'Cabin'}
          </button>
          <button
            type="button"
            onClick={onToggleLang}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-slate-700" />
            {lang.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={onOpenTerminal}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            [K]
          </button>
          <button
            type="button"
            onClick={onOpenPapers}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            [P]
          </button>
          <button
            type="button"
            onClick={onOpenMirror}
            className="lp-btn px-2.5 py-1 rounded flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            [C]
          </button>
          {onCycleThrowMode && (
            <button
              type="button"
              onClick={onCycleThrowMode}
              className="lp-btn px-2.5 py-1 rounded flex items-center gap-1 font-mono"
            >
              {lang === 'es' ? 'Física' : 'Physics'}: {sim.throwPhysicsMode.toUpperCase()}
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('map_ops')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
              tab === 'map_ops'
                ? 'lp-btn-accent'
                : 'lp-btn text-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {lang === 'es' ? 'MAPA DE ESTACIÓN Y RUTA' : 'STATION FLOORPLAN & ROUTE'}
          </button>
          <button
            type="button"
            onClick={() => setTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
              tab === 'telemetry'
                ? 'lp-btn-accent'
                : 'lp-btn text-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {lang === 'es' ? '10 VARIABLES NASA + MÉDICA' : '10 NASA TELEMETRY + MEDICAL'}
          </button>
          <button
            type="button"
            onClick={() => setTab('phases_settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
              tab === 'phases_settings'
                ? 'lp-btn-accent'
                : 'lp-btn text-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {lang === 'es' ? 'CAMBIAR FASE AETHER-4' : 'SWITCH AETHER-4 PHASE'}
          </button>
        </div>

        {/* Tab 1: Interactive 2D Station Blueprint Map + Guided Checklist */}
        {tab === 'map_ops' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-slate-900/95 border border-slate-900/20 rounded-lg p-3 space-y-2 text-zinc-100">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide text-sky-300">
                <span>{lang === 'es' ? 'PLANO ARQUITECTÓNICO (8 MÓDULOS + 7 PASILLOS + ORION)' : 'ARCHITECTURAL STATION BLUEPRINT (8 MODULES + 7 CORRIDORS)'}</span>
                <span className="text-yellow-300">
                  {sim.missionAssigned
                    ? lang === 'es'
                      ? `◆ Misión Activa: ${distToTargetM} m`
                      : `◆ Active Goal: ${distToTargetM} m`
                    : lang === 'es'
                      ? `Disponibles (Azul) · ${distToTargetM} m`
                      : `Available (Blue) · ${distToTargetM} m`}
                </span>
              </div>
              <svg viewBox="0 0 440 462" className="w-full h-auto bg-zinc-950/95 border border-zinc-500/35 rounded">
                {/* 2m Blueprint Grid */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((gi) => (
                  <g key={gi} opacity="0.14">
                    <line x1={gi * 36} y1={0} x2={gi * 36} y2={462} stroke="#94a3b8" strokeWidth="1" />
                    <line x1={0} y1={gi * 36} x2={440} y2={gi * 36} stroke="#94a3b8" strokeWidth="1" />
                  </g>
                ))}
                {/* Connected Room & Corridor Floor Rectangles */}
                {STATION_FLOOR_RECTS.map((r) => {
                  const z = STATION_ZONES.find((sz) => sz.id === r.zoneId);
                  const x1 = toSvgX(r.minX);
                  const y1 = toSvgY(r.maxY);
                  const w = toSvgX(r.maxX) - x1;
                  const h = toSvgY(r.minY) - y1;
                  const active = r.zoneId === currentZone.id;
                  return (
                    <rect
                      key={r.id}
                      x={x1}
                      y={y1}
                      width={w}
                      height={h}
                      fill={active ? `${z?.accentHex ?? '#38bdf8'}26` : '#18181b'}
                      stroke={z?.accentHex ?? '#52525b'}
                      strokeOpacity={r.id.startsWith('corr_') ? 0.55 : 0.85}
                      strokeWidth={active ? 1.8 : 1.0}
                    />
                  );
                })}
                {/* Architectural Module Landmarks */}
                <rect x={toSvgX(0.15)} y={toSvgY(-3.9)} width={3.3 * 18} height={3.8 * 18} fill="#0284c744" stroke="#38bdf8" strokeWidth="1.2" rx="3" />
                <line x1={toSvgX(0.5)} y1={toSvgY(-4.5)} x2={toSvgX(3.1)} y2={toSvgY(-7.1)} stroke="#facc15" strokeWidth="1.4" opacity="0.7" />
                <circle cx={toSvgX(10.0)} cy={toSvgY(-6.1)} r={20} fill="#f8fafc18" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx={toSvgX(10.0)} cy={toSvgY(-6.1)} r={8} fill="#38bdf833" stroke="#f8fafc" strokeWidth="0.9" />
                <circle cx={toSvgX(18.8)} cy={toSvgY(12.8)} r={24} fill="none" stroke="#a855f7" strokeWidth="1.6" strokeDasharray="4 3" />
                <path d={`M ${toSvgX(8.2)} ${toSvgY(12.2)} Q ${toSvgX(10.0)} ${toSvgY(13.1)} ${toSvgX(11.8)} ${toSvgY(12.2)}`} fill="none" stroke="#ff4f00" strokeWidth="2.8" />
                <rect x={toSvgX(15.8)} y={toSvgY(6.3)} width={3.2 * 18} height={1.4 * 18} fill="#10b98138" stroke="#22c55e" strokeWidth="1.1" />
                <rect x={toSvgX(18.0)} y={toSvgY(-4.4)} width={2.8 * 18} height={2.4 * 18} fill="#ef444428" stroke="#f87171" strokeWidth="1.1" />
                <rect x={toSvgX(0.4)} y={toSvgY(6.2)} width={1.2 * 18} height={2.5 * 18} fill="#38bdf824" stroke="#38bdf8" strokeWidth="1.0" />

                {/* Zone Labels */}
                {STATION_ZONES.map((z) => {
                  const cx = toSvgX((z.minX + z.maxX) * 0.5);
                  const cy = toSvgY(z.maxY) + 12;
                  return (
                    <text
                      key={z.id}
                      x={cx}
                      y={cy}
                      fill={z.accentHex}
                      fontSize="8.5"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {(lang === 'es' ? z.nameEs : z.nameEn).split('(')[0].trim()}
                    </text>
                  );
                })}

                {/* Walls (highlighting North Viewport Window in cyan) */}
                {SPACE_ROOM_COLLIDERS.slice(0, WALL_COLLIDER_COUNT).map((b) => {
                  const x1 = toSvgX(b[0]);
                  const y1 = toSvgY(b[4]);
                  const w = Math.max(2, toSvgX(b[3]) - x1);
                  const h = Math.max(2, toSvgY(b[1]) - y1);
                  const isWin = b[6] === 'Wall_WestHab_N_Win';
                  return (
                    <rect
                      key={b[6]}
                      x={x1}
                      y={y1}
                      width={w}
                      height={h}
                      fill={isWin ? '#38bdf8' : '#a1a1aa'}
                    />
                  );
                })}

                {/* 4 Automatic Bulkhead Doors */}
                {sim.doors.map((d) => {
                  const span = 1.1;
                  const halfW = d.axis === 'x' ? 0.14 : span * (1 - d.openProgress * 0.82);
                  const halfH = d.axis === 'y' ? 0.14 : span * (1 - d.openProgress * 0.82);
                  const x1 = toSvgX(d.x - halfW);
                  const y1 = toSvgY(d.y + halfH);
                  const w = Math.max(2, toSvgX(d.x + halfW) - x1);
                  const h = Math.max(2, toSvgY(d.y - halfH) - y1);
                  return (
                    <rect
                      key={d.id}
                      x={x1}
                      y={y1}
                      width={w}
                      height={h}
                      fill={d.openProgress > 0.5 ? '#10b981' : '#f59e0b'}
                      stroke="#09090b"
                      strokeWidth="0.7"
                    />
                  );
                })}

                {/* Yellow Dotted Route Line when mission assigned */}
                {sim.missionAssigned && (
                  <polyline
                    points={pathPointsStr}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="2.4"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                )}

                {/* Station Pins: Blue for Available Missions, Purple NPCs, Emerald Completed */}
                {sim.stations.map((st) => {
                  const isNpc = st.kind === 'npc_crew';
                  const isUtilityOnly = st.kind === 'bunk_light_switch' || st.kind === 'window_shutter_button';
                  return (
                    <g key={st.id}>
                      <circle
                        cx={toSvgX(st.x)}
                        cy={toSvgY(st.y)}
                        r={isNpc ? 4.4 : isUtilityOnly ? 2.4 : 3.6}
                        fill={isNpc ? '#c084fc' : st.done ? '#10b981' : '#38bdf8'}
                        stroke="#09090b"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {/* Active Objective Marker: Blue Pulse before assignment -> Yellow Diamond ◆ once assigned/item picked up */}
                {sim.missionAssigned ? (
                  <g transform={`translate(${toSvgX(guidedStep.targetX)}, ${toSvgY(guidedStep.targetY)})`}>
                    <polygon points="0,-10 10,0 0,10 -10,0" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="2 2" />
                    <polygon points="0,-6.5 6.5,0 0,6.5 -6.5,0" fill="#facc15" stroke="#09090b" strokeWidth="1.2" />
                  </g>
                ) : (
                  <g transform={`translate(${toSvgX(guidedStep.targetX)}, ${toSvgY(guidedStep.targetY)})`}>
                    <circle r="8.5" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 2" />
                    <circle r="4" fill="#38bdf8" />
                  </g>
                )}

                {/* Player Position + Heading Arrow */}
                <g transform={`translate(${toSvgX(playerX)}, ${toSvgY(playerY)}) rotate(${-playerYawDeg})`}>
                  <polygon points="8,0 -5,-4.5 -3,0 -5,4.5" fill="#22c55e" stroke="#ffffff" strokeWidth="1" />
                </g>
              </svg>
              <div className="flex flex-wrap gap-3 text-[10px] text-zinc-300">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block bg-emerald-400" /> {lang === 'es' ? 'Tú' : 'You'}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block bg-sky-400 rounded-full" /> {lang === 'es' ? 'Misión Disponible' : 'Available Mission'}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block rotate-45 bg-yellow-400" /> {lang === 'es' ? 'Objetivo + Ruta Punteada' : 'Active Target + Dotted Path'}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block bg-purple-400 rounded-full" /> {lang === 'es' ? 'Tripulación' : 'Crew'}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block bg-amber-400" /> {lang === 'es' ? 'Puertas Auto.' : 'Auto Doors'}</span>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2.5">
              <div className="bg-amber-50/90 border border-amber-500/40 rounded-lg p-3 space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-800 tracking-wide">
                  ◆ {lang === 'es' ? guidedStep.stepTitleEs : guidedStep.stepTitleEn}
                </div>
                <p className="text-xs text-slate-800 leading-snug">
                  {lang === 'es' ? guidedStep.instructionEs : guidedStep.instructionEn}
                </p>
                <div className="text-[10px] text-sky-700 font-mono">
                  {lang === 'es' ? `Módulo destino: ${guidedStep.zoneEs}` : `Target Zone: ${guidedStep.zoneEn}`} ({distToTargetM} m)
                </div>
              </div>

              <div className="bg-white/70 border border-slate-900/12 rounded-lg p-3 space-y-1.5 max-h-60 overflow-y-auto text-[11px]">
                <div className="font-semibold text-slate-700 tracking-wide mb-1">
                  {lang === 'es' ? 'LISTA DE OBJETIVOS REALES' : 'REAL MISSION CHECKLIST'}
                </div>
                {objectiveRows.map((o) => (
                  <div key={o.es} className="flex items-center gap-2">
                    {o.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    )}
                    <span className={o.done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                      {lang === 'es' ? o.es : o.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full 10 NASA Variables + Medical Twins Study */}
        {tab === 'telemetry' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">O₂ (19–21%)</div>
                <div className="font-black text-cyan-300">{sim.o2Percent.toFixed(1)}%</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">CO₂ (&lt;1500 ppm)</div>
                <div className="font-black text-emerald-300">{Math.round(sim.co2Ppm)} ppm</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Presión kPa' : 'Pressure'}</div>
                <div className="font-black text-slate-100">{sim.cabinPressureKpa.toFixed(1)} kPa</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Agua Potable' : 'Water'}</div>
                <div className="font-black text-sky-300">{sim.waterLiters.toFixed(1)} L</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Potencia kWe' : 'Power kWe'}</div>
                <div className="font-black text-amber-300">{sim.powerKwe.toFixed(1)} kWe</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Temp Cabina' : 'Cabin Temp'}</div>
                <div className="font-black text-orange-300">{sim.tempCelsius.toFixed(1)} °C</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Humedad Rel.' : 'Humidity'}</div>
                <div className="font-black text-teal-300">{sim.humidityPercent.toFixed(0)}%</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Víveres BVAD' : 'BVAD Food'}</div>
                <div className="font-black text-lime-300">{sim.foodKg.toFixed(1)} kg</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Dosis / 250 mSv' : 'Dose / 250 mSv'}</div>
                <div className="font-black text-rose-300">{sim.crewRadiationMsv.toFixed(1)} mSv</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Pulso / PA ASCAN' : 'HR / BP ASCAN'}</div>
                <div className="font-black text-pink-300">
                  {Math.round(sim.heartRateBpm)} bpm · {Math.round(sim.bpSys)}/{Math.round(sim.bpDia)}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'O₂ Traje (29.6 kPa)' : 'Suit O₂ (29.6 kPa)'}</div>
                <div className="font-black text-sky-300">{Math.round(sim.suitO2Percent)}%</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Hidratación BVAD' : 'BVAD Hydration'}</div>
                <div className="font-black text-emerald-300">{Math.round(sim.hydrationPercent)}%</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">{lang === 'es' ? 'Esclusa Quest MPEV' : 'Quest Airlock MPEV'}</div>
                <div className="font-black text-amber-300">{sim.airlockPressureKpa.toFixed(1)} kPa ({sim.airlockStep}/5)</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">MBSU / RPCM 120V DC</div>
                <div className={`font-black ${sim.rpcmTripped ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {sim.rpcmLoadKwe.toFixed(1)} / 6.2 kWe {sim.rpcmTripped ? '(TRIP)' : ''}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-2.5">
                <div className="text-[10px] text-slate-400">ATCS Radiadores</div>
                <div className="font-black text-teal-300">{Math.round(sim.atcsLoopTempK)} K</div>
              </div>
            </div>

            {onResetRpcm && sim.rpcmTripped && (
              <div className="flex items-center justify-between bg-rose-950/90 border border-rose-500/60 p-2.5 rounded text-xs text-rose-100">
                <span>{lang === 'es' ? '¡Disyuntor RPCM 120V DC disparado por sobrecarga (>6.2 kWe)!' : '120V DC RPCM breaker tripped (>6.2 kWe overload)!'}</span>
                <button type="button" onClick={onResetRpcm} className="lp-btn-accent px-3 py-1 text-[11px]">
                  {lang === 'es' ? 'Rearmar RPCM' : 'Reset RPCM'}
                </button>
              </div>
            )}

            <div className="bg-slate-900/90 border border-slate-700 p-3 text-xs space-y-1.5">
              <div className="font-black text-purple-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                {lang === 'es' ? 'COMUNICACIONES TRIPULACIÓN' : 'CREW RADIO DISPATCH'}
              </div>
              <div className="text-slate-200">
                <b>{CREW_COMPANIONS[sim.activeRadio.speakerId]?.[lang === 'es' ? 'nameEs' : 'nameEn']}:</b>{' '}
                {lang === 'es' ? sim.activeRadio.textEs : sim.activeRadio.textEn}
              </div>
              <div className="text-[10px] text-slate-400 pt-1 flex flex-wrap gap-3">
                <span>BVAD 82kg: 0.84 kg O₂/d · 2.79 L H₂O/d · 1.08 kg CO₂/d</span>
                <span><Sprout className="w-3 h-3 inline text-emerald-400" /> APH VEG-05: 630+450 nm · 1,700 cm²</span>
                <span><Shield className="w-3 h-3 inline text-amber-400" /> {NASA_CONSTANTS.RADIATION_AND_SHIELDING.GCR_REGOLITH_THICKNESS_M}m = 300 g/cm²</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onOpenTerminal} className="mc-btn mc-btn-blue px-3 py-1.5 text-xs font-black">
                <Sliders className="w-3.5 h-3.5 inline mr-1" />
                {lang === 'es' ? 'Abrir Terminal Telemetría [K]' : 'Open Telemetry Terminal [K]'}
              </button>
              <button type="button" onClick={onOpenPapers} className="mc-btn mc-btn-blue px-3 py-1.5 text-xs font-black">
                <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                {lang === 'es' ? 'Códice Space Papers y Notas [P]' : 'Space Papers & Notes Codex [P]'}
              </button>
              <button type="button" onClick={onOpenMirror} className="mc-btn mc-btn-blue px-3 py-1.5 text-xs font-black">
                <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                {lang === 'es' ? 'Traje EVA / Espejo [C]' : 'EVA Suit Mirror [C]'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Direct Phases, Audio, Lighting, Camera, Language & Return Menu */}
        {tab === 'phases_settings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button type="button" onClick={onToggleCamera} className="mc-btn mc-btn-blue p-2.5 font-black flex items-center justify-center gap-1.5">
                <Camera className="w-4 h-4" />
                {lang === 'es' ? `Cámara: ${cameraMode.toUpperCase()} [V]` : `Camera: ${cameraMode.toUpperCase()} [V]`}
              </button>
              <button type="button" onClick={onCycleLighting} className="mc-btn mc-btn-blue p-2.5 font-black flex items-center justify-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                {lightLabels[sim.lightingMode]}
              </button>
              <button type="button" onClick={onToggleMusic} className="mc-btn mc-btn-blue p-2.5 font-black flex items-center justify-center gap-1.5">
                {musicOn ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                {lang === 'es' ? `Música: ${musicOn ? 'ON' : 'OFF'}` : `Music: ${musicOn ? 'ON' : 'OFF'}`}
              </button>
              <button type="button" onClick={onToggleAmbient} className="mc-btn mc-btn-blue p-2.5 font-black flex items-center justify-center gap-1.5">
                {ambientOn ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                {lang === 'es' ? `Ruido Cabina: ${ambientOn ? 'ON' : 'OFF'}` : `Ambient Noise: ${ambientOn ? 'ON' : 'OFF'}`}
              </button>
              <button type="button" onClick={onToggleLang} className="mc-btn mc-btn-blue p-2.5 font-black flex items-center justify-center gap-1.5">
                <Globe className="w-4 h-4" />
                {lang === 'es' ? 'Idioma: ESPAÑOL' : 'Language: ENGLISH'}
              </button>
              {onCycleThrowMode && (
                <button type="button" onClick={onCycleThrowMode} className="mc-btn mc-btn-blue p-2.5 font-black flex items-center justify-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-300" />
                  {lang === 'es' ? `Lanzamiento: ${sim.throwPhysicsMode.toUpperCase()}` : `Throw: ${sim.throwPhysicsMode.toUpperCase()}`}
                </button>
              )}
              <button type="button" onClick={onReturnMainMenu} className="mc-btn mc-btn-orange p-2.5 font-black flex items-center justify-center gap-1.5">
                <Home className="w-4 h-4" />
                {lang === 'es' ? 'Menú Principal' : 'Main Menu'}
              </button>
            </div>

            <div className="border-t border-slate-700 pt-3 space-y-2">
              <div className="text-[11px] font-black uppercase text-cyan-300 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-[#FF4F00]" />
                {lang === 'es' ? 'SALTAR / DESPLEGAR FASE DE MISIÓN AETHER-4' : 'JUMP / LAUNCH AETHER-4 MISSION PHASE'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {AETHER4_MISSIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMission(m.id)}
                    className={`mc-btn p-2.5 text-left text-[11px] ${
                      m.id === sim.currentMissionId ? 'mc-btn-orange ring-2 ring-white' : 'mc-btn-blue'
                    }`}
                  >
                    <div className="font-black">{lang === 'es' ? m.badgeEs : m.badgeEn}</div>
                    <div className="text-[10px] opacity-90 line-clamp-2 mt-0.5">
                      {lang === 'es' ? m.titleEs : m.titleEn}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
