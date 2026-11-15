import React from 'react';
import { AlertTriangle, CheckCircle2, Circle, Compass, Rocket, ShieldAlert, Trophy } from 'lucide-react';
import { NASA_CONSTANTS } from '../data/nasaConstants';
import {
  AETHER4_MISSIONS,
  CREW_COMPANIONS,
  EndingId,
  MISSION_ENDINGS,
  MissionId,
} from '../data/aether4StoryData';
import { RoomObjectiveProgress, SpaceRoomState } from '../game/spaceRoomSimulation';

export const CrisisSimulatorModal: React.FC<{
  lang: 'es' | 'en';
  onResolve: (choice: 'water_priority' | 'food_priority') => void;
  onClose: () => void;
}> = ({ lang, onResolve, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl mc-panel border-4 border-[#D93025] p-5 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#090C12] pb-2">
          <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-[#D93025]" />
            {lang === 'es'
              ? 'FASE 0 · SIMULADOR DE CRISIS ECLSS / WHC'
              : 'PHASE 0 · ECLSS / WHC CRISIS SIMULATOR'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mc-btn px-2.5 py-1 text-xs font-black"
          >
            ✕
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-200 bg-slate-900/90 p-3 border border-slate-700">
          {lang === 'es'
            ? `Fuga simulada en la línea del WHC y tanque de agua potable tras el día 80 de misión (límite de ciclo abierto). La IA KATHERINE pide priorizar los recursos siguiendo la ley biológica real NASA (BVAD):`
            : `Simulated leak in the WHC / potable water manifold past Day 80 (open-loop breakeven). Tactical AI KATHERINE prompts for emergency priority under real NASA physiological limits (BVAD):`}
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={() => onResolve('water_priority')}
            className="mc-btn mc-btn-blue p-3.5 text-left space-y-1"
          >
            <div className="text-xs font-black text-cyan-200">
              {lang === 'es'
                ? 'OPCIÓN A · Desviar Potencia al Reciclador WHC/WPA y Aire (Prioridad NASA)'
                : 'OPTION A · Route Power to WHC/WPA Water Recovery & O₂ (NASA Priority)'}
            </div>
            <div className="text-[11px] text-slate-200 font-normal">
              {lang === 'es'
                ? `“Sin atmósfera mueres en minutos; sin agua mueres en días (pérdida mortal del ${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% peso); sin comida resistes semanas.” Protege los 2.79 L/día potable + 0.84 kg/día O₂.`
                : `"Without atmosphere you die in minutes; without water in days (${NASA_CONSTANTS.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% lethal body loss); without food you survive weeks." Protects 2.79 L/d water + 0.84 kg/d O₂.`}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve('food_priority')}
            className="mc-btn p-3.5 text-left space-y-1"
          >
            <div className="text-xs font-black text-amber-300">
              {lang === 'es'
                ? 'OPCIÓN B · Mantener Horno de Comida Galley y Congelar Agua WHC'
                : 'OPTION B · Keep Galley Oven Heating & Throttle WHC Water Loop'}
            </div>
            <div className="text-[11px] text-slate-300 font-normal">
              {lang === 'es'
                ? 'Prioriza confort calórico (0.80 kg/día) permitiendo drenaje en el depósito hídrico de 103.0 kg.'
                : 'Prioritizes caloric comfort (0.80 kg/day) while allowing the 103.0 kg water reserve to drop.'}
            </div>
          </button>
        </div>
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
          { done: objectives.crisisSolved, es: 'Resolver Crisis de Fuga de Agua + Abrir Escotilla Sur', en: 'Solve Water Crisis + Open South Airlock' },
        ]
      : missionId === 'manifest_launch'
      ? [
          { done: objectives.manifestConfigured, es: 'Elegir ECLSS / Energía / Rover en Mesa Central', en: 'Choose ECLSS / Power / Rover on Center Table' },
          { done: objectives.launchCompleted, es: 'Completar 5 Etapas Despegue en Consola MEDS (11 LCD)', en: 'Complete 5 Launch Stages on MEDS Console' },
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
      : [
          { done: objectives.roverReturned, es: 'Piloto Consola Rover 6,000 kg de vuelta a Esclusa', en: 'Drive 6,000 kg Rover Console back to Base' },
          { done: objectives.regolithDeployed, es: 'Desplegar Blindaje Regolito 2 m (300 g/cm² · 400 t)', en: 'Deploy 2 m Regolith Shield (300 g/cm² · 400 t)' },
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
