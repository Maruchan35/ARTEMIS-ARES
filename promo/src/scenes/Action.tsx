import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { C, CLAMP, EASE, EASE_IN, MONO, ORBITRON, SANS } from '../theme';
import { Chip, CornerFrame, Sparkline } from '../hud';

// ------------------------------------------------------------------ B1 · live telemetry
const CARDS = [
  { label: 'O₂', value: 21.0, unit: '%', jitter: 0.05, digits: 1 },
  { label: 'CO₂', value: 582, unit: 'ppm', jitter: 4, digits: 0 },
  { label: 'H₂O', value: 103.0, unit: 'L', jitter: 0.1, digits: 1 },
  { label: 'POTENCIA', value: 10.0, unit: 'kWe', jitter: 0.08, digits: 1 },
  { label: 'TEMP', value: 22.0, unit: '°C', jitter: 0.05, digits: 1 },
];
const EVENTS = ['ciclo ▸ Δ telemetría', 'objetivo ▸ dormir completado', 'decisión ▸ priorizar el agua', 'mentora ▸ "¿Entiendes la idea?"'];

const TelemetryCard: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const c = CARDS[i];
  const v = c.value + (random(`v${i}-${Math.floor(frame / 4)}`) - 0.5) * 2 * c.jitter;
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 220 + i * 142,
        width: 470,
        height: 120,
        background: C.panel,
        borderLeft: `3px solid ${C.cyan}`,
        boxShadow: `0 0 24px ${C.blue}33`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        gap: 18,
        opacity: interpolate(frame, [4 + i * 5, 12 + i * 5], [0, 1], CLAMP),
        translate: interpolate(frame, [4 + i * 5, 16 + i * 5], ['-50px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
      }}
    >
      <div style={{ width: 190 }}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, letterSpacing: 2 }}>{c.label}</div>
        <div style={{ fontFamily: ORBITRON, fontSize: 40, color: C.white, fontWeight: 700 }}>
          {v.toFixed(c.digits)}
          <span style={{ fontSize: 20, color: C.cyan, marginLeft: 8 }}>{c.unit}</span>
        </div>
      </div>
      <Sparkline seed={i * 7 + 3} w={220} h={64} speed={0.7} />
    </div>
  );
};

export const TelemetryScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill style={{ scale: interpolate(frame, [0, 96], [1.1, 1.0], CLAMP) }}>
        <Video src={staticFile('clips/m0_pan.mp4')} muted trimBefore={8} objectFit="cover" style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.bg}ee 0%, ${C.bg}88 32%, transparent 55%, ${C.bg}88 100%)` }} />
      <div style={{ position: 'absolute', left: 80, top: 92, opacity: interpolate(frame, [0, 8], [0, 1], CLAMP) }}>
        <div style={{ fontFamily: ORBITRON, fontSize: 44, letterSpacing: 6, color: C.white, textShadow: `0 0 18px ${C.cyan}` }}>TELEMETRÍA EN TIEMPO REAL</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.cyan, marginTop: 8, letterSpacing: 2 }}>NASA BVAD · ECLSS · stepSpaceRoomSimulation() · 400 ms</div>
      </div>
      {CARDS.map((c, i) => (
        <TelemetryCard key={c.label} i={i} />
      ))}
      <div style={{ position: 'absolute', right: 90, top: 250, width: 560, fontFamily: MONO, fontSize: 22, lineHeight: '46px' }}>
        <div style={{ color: C.cyan, letterSpacing: 4, fontFamily: ORBITRON, fontSize: 22, opacity: interpolate(frame, [18, 26], [0, 1], CLAMP) }}>
          DIRECTOR DE MENTORÍA
        </div>
        {EVENTS.map((e, i) => (
          <div
            key={e}
            style={{
              color: i === 2 ? C.ok : C.white,
              opacity: interpolate(frame, [26 + i * 12, 32 + i * 12], [0, 1], CLAMP),
              translate: interpolate(frame, [26 + i * 12, 36 + i * 12], ['24px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
              background: 'rgba(3, 12, 26, 0.7)',
              borderLeft: `2px solid ${i === 2 ? C.ok : C.cyan}`,
              padding: '0 14px',
              marginTop: 10,
            }}
          >
            {e}
          </div>
        ))}
      </div>
      <CornerFrame delay={2} inset={36} size={54} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B2 · KATHERINE explains the decision
const POINTS = ['Explica cada decisión con datos NASA', '“¿Sabías que…?” de astronautas reales', '“¿Entiendes la idea?” + quiz socrático'];

export const KatherineScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      <Img
        src={staticFile('shots/p_decision_4k.png')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(14px) brightness(0.42) saturate(1.2)',
          scale: interpolate(frame, [0, 84], [1.18, 1.08], CLAMP),
        }}
      />
      <div style={{ position: 'absolute', left: 110, top: 270, width: 720 }}>
        <div
          style={{
            fontFamily: ORBITRON,
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: interpolate(frame, [0, 20], [30, 10], { ...CLAMP, easing: EASE }),
            color: C.cyan,
            textShadow: `0 0 28px ${C.cyan}aa`,
            opacity: interpolate(frame, [0, 10], [0, 1], CLAMP),
          }}
        >
          KATHERINE
        </div>
        <div style={{ fontFamily: SANS, fontSize: 36, color: C.white, marginTop: 6, opacity: interpolate(frame, [6, 14], [0, 1], CLAMP) }}>
          IA mentora · AstroCopilot
        </div>
        <div style={{ marginTop: 36 }}>
          {POINTS.map((p, i) => (
            <div
              key={p}
              style={{
                fontFamily: SANS,
                fontSize: 31,
                color: C.white,
                marginTop: 18,
                opacity: interpolate(frame, [14 + i * 9, 22 + i * 9], [0, 1], CLAMP),
                translate: interpolate(frame, [14 + i * 9, 26 + i * 9], ['-30px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
              }}
            >
              <span style={{ color: C.cyan, marginRight: 16 }}>◆</span>
              {p}
            </div>
          ))}
        </div>
        <Chip style={{ marginTop: 40, opacity: interpolate(frame, [46, 54], [0, 1], CLAMP) }}>Gemma-4-E4B + LoRA · RAG 387,730 docs</Chip>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 900,
          top: 150,
          width: 925,
          opacity: interpolate(frame, [0, 12], [0, 1], CLAMP),
          translate: interpolate(frame, [0, 16], ['140px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
          scale: interpolate(frame, [0, 84], [0.97, 1.02], CLAMP),
          boxShadow: `0 0 60px ${C.cyan}55, 0 30px 80px rgba(0,0,0,0.6)`,
        }}
      >
        <Img src={staticFile('shots/p_decision_panel.png')} style={{ width: '100%', display: 'block' }} />
        {/* scan highlight sweeping down the panel */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 90,
            top: `${interpolate(frame, [18, 66], [0, 100], CLAMP)}%`,
            translate: '0px -45px',
            background: `linear-gradient(180deg, transparent, ${C.cyan}33, transparent)`,
            opacity: interpolate(frame, [18, 24, 60, 66], [0, 1, 1, 0], CLAMP),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ B3 · mission montage (whip cuts on the beat)
const MissionShot: React.FC<{ clip: string; tag: string; title: string; metric: string; accent: string }> = ({ clip, tag, title, metric, accent }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          translate: interpolate(frame, [0, 5], ['240px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
          filter: `blur(${interpolate(frame, [0, 5], [16, 0], CLAMP)}px)`,
          scale: interpolate(frame, [0, 20], [1.12, 1.04], CLAMP),
        }}
      >
        <Video src={staticFile(`clips/${clip}.mp4`)} muted trimBefore={30} objectFit="cover" style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(0deg, ${C.bg}ee 0%, transparent 45%)` }} />
      <div style={{ position: 'absolute', left: 90, bottom: 190, opacity: interpolate(frame, [2, 6], [0, 1], CLAMP) }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: accent }}>{tag}</div>
        <div style={{ fontFamily: ORBITRON, fontSize: 60, fontWeight: 900, color: C.white, textShadow: `0 0 22px ${accent}` }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: C.white, marginTop: 6 }}>{metric}</div>
      </div>
      <AbsoluteFill style={{ backgroundColor: C.white, opacity: interpolate(frame, [0, 3], [0.35, 0], CLAMP) }} />
    </AbsoluteFill>
  );
};

export const MissionsScene: React.FC = () => (
  <AbsoluteFill>
    <Sequence name="Cabina MEDS" durationInFrames={20}>
      <MissionShot clip="m1_cockpit_pan" tag="FASE 1" title="CABINA MEDS" metric="Manifiesto de carga · 9.81 m/s²" accent={C.cyan} />
    </Sequence>
    <Sequence name="Superficie lunar" from={20} durationInFrames={19}>
      <MissionShot clip="m2_surface_3p_pan" tag="FASE 2 · ACTOS 1-2" title="SUPERFICIE LUNAR" metric="Gravedad 1.62 m/s² · traje espacial" accent="#ffb36b" />
    </Sequence>
    <Sequence name="Invernadero" from={39} durationInFrames={20}>
      <MissionShot clip="m3_greenhouse_pan" tag="ACTO 3" title="EL JARDÍN QUE RESPIRA" metric="Luz 630 + 450 nm · 3.70 m/s²" accent="#e879f9" />
    </Sequence>
    <Sequence name="Tormenta solar" from={59} durationInFrames={19}>
      <MissionShot clip="m4_storm_3p_pan" tag="ACTO 4" title="TORMENTA SOLAR" metric="Tormenta > 250 mSv · rover blindado" accent={C.alert} />
    </Sequence>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ B4 · overclock into the climax
export const OverclockScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = frame / durationInFrames;
  const shake = 14 * k * k;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, durationInFrames], [1.02, 1.38], { ...CLAMP, easing: EASE_IN }),
          translate: `${(random(`sx${frame}`) - 0.5) * shake}px ${(random(`sy${frame}`) - 0.5) * shake}px`,
        }}
      >
        <Video src={staticFile('clips/m4_storm_pan.mp4')} muted trimBefore={45} objectFit="cover" style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: C.alert, mixBlendMode: 'multiply', opacity: interpolate(frame, [0, durationInFrames], [0, 0.45], CLAMP) }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: C.white }}>RADIACIÓN · TRIPULACIÓN</div>
        <div style={{ fontFamily: ORBITRON, fontSize: 150, fontWeight: 900, color: C.white, textShadow: `0 0 40px ${C.alert}` }}>
          {Math.round(interpolate(frame, [0, durationInFrames - 4], [118, 252], { ...CLAMP, easing: EASE_IN }))}
          <span style={{ fontSize: 54, marginLeft: 16 }}>mSv</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: C.white, opacity: interpolate(frame, [durationInFrames - 6, durationInFrames], [0, 1], CLAMP) }} />
    </AbsoluteFill>
  );
};
