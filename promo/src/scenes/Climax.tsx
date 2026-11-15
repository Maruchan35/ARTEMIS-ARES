import React from 'react';
import { AbsoluteFill, Img, interpolate, interpolateColors, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { C, CLAMP, EASE, MONO, ORBITRON, SANS } from '../theme';
import { Chip, CornerFrame } from '../hud';

/** Polyline helper: values 0..1 over a w×h box, drawn up to `progress`. */
const Graph: React.FC<{ values: number[]; w: number; h: number; color: string; progress: number; width?: number }> = ({
  values,
  w,
  h,
  color,
  progress,
  width = 4,
}) => {
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - v * h}`).join(' ');
  const len = w * 1.6;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke={`${C.dim}33`} strokeDasharray="6 8" />
      ))}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={len}
        strokeDashoffset={len * (1 - progress)}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
};

// ------------------------------------------------------------------ C1 · crisis mode
const SPIKE = Array.from({ length: 30 }, (_, i) => (i < 12 ? 0.18 + random(`a${i}`) * 0.05 : 0.18 + ((i - 12) / 17) ** 1.7 * 0.78 + random(`b${i}`) * 0.03));

export const CrisisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 0.16 + 0.14 * Math.sin((frame / fps) * Math.PI * 4);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ scale: interpolate(frame, [0, 78], [1.12, 1.02], CLAMP) }}>
        <Video src={staticFile('clips/k_alarm_clip.mp4')} muted trimBefore={10} objectFit="cover" style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: C.alert, mixBlendMode: 'multiply', opacity: pulse + 0.12 }} />
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.bg}f0 0%, ${C.bg}aa 40%, transparent 62%)` }} />
      <div style={{ position: 'absolute', left: 90, top: 96 }}>
        <div style={{ fontFamily: ORBITRON, fontSize: 40, letterSpacing: 6, color: C.alert, textShadow: `0 0 20px ${C.alert}` }}>
          MODO CRISIS · ÓRDENES PRIMERO
        </div>
      </div>
      <div style={{ position: 'absolute', left: 90, top: 250 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.white, letterSpacing: 4 }}>CO₂ · CABINA</div>
        <div style={{ fontFamily: ORBITRON, fontSize: 150, fontWeight: 900, color: C.white, lineHeight: 1, textShadow: `0 0 34px ${C.alert}` }}>
          {Math.round(interpolate(frame, [4, 26], [1180, 1350], { ...CLAMP, easing: EASE })).toLocaleString('en-US')}
          <span style={{ fontSize: 52, color: C.alert, marginLeft: 18 }}>ppm ▲</span>
        </div>
        <div style={{ marginTop: 40 }}>
          <Graph values={SPIKE} w={720} h={260} color={C.alert} progress={interpolate(frame, [6, 40], [0, 1], { ...CLAMP, easing: EASE })} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 14 }}>umbral de alarma 1,200 ppm · límite ISS ~4,000 ppm (NASA-STD-3001)</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1010,
          top: 190,
          width: 830,
          opacity: interpolate(frame, [8, 18], [0, 1], CLAMP),
          translate: interpolate(frame, [8, 22], ['120px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
          boxShadow: `0 0 70px ${C.alert}66`,
        }}
      >
        <Img src={staticFile('shots/p_alarm_panel.png')} style={{ width: '100%', display: 'block' }} />
      </div>
      <AbsoluteFill style={{ backgroundColor: C.white, opacity: interpolate(frame, [0, 7], [1, 0], CLAMP) }} />
      <CornerFrame color={C.alert} inset={36} size={54} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C2 · peak computational load: hybrid RAG + model
const COLS = 64;
const ROWS = 16;
const HITS = [
  { id: 'NASA-STD-3001', title: 'Límites de CO₂ para la tripulación', score: 0.94, at: 24 },
  { id: 'NTRS-LIB-19950066496', title: 'Control ambiental y soporte vital de la ISS', score: 0.88, at: 34 },
  { id: 'NTRS-LIB-20050207456', title: 'Estado del soporte vital regenerativo de la ISS', score: 0.81, at: 45 },
];
const METERS = [
  { label: 'INFERENCIA · Gemma-4-E4B + LoRA r=32', to: 96 },
  { label: 'RECUPERACIÓN · BM25 + SQLite FTS5', to: 88 },
  { label: 'VOZ NEURAL · Supertonic 3', to: 72 },
];
const QUERY = 'co2 scrubber lioh iss eclss';

const DocGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const tick = Math.floor(frame / 2);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 14px)`, gap: 4 }}>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const hit = (i * 37) % 211 === 0 && frame > 22;
        const r = random(`d${i}-${tick}`);
        const on = hit || r > 0.86;
        return (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              background: hit ? C.ok : on ? C.cyan : `${C.blue}26`,
              opacity: hit ? 1 : on ? 0.55 + r * 0.45 : 1,
              boxShadow: hit ? `0 0 10px ${C.ok}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

export const ComputeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.floor(interpolate(frame, [3, 22], [0, QUERY.length], CLAMP));
  return (
    <AbsoluteFill style={{ backgroundColor: '#02050b' }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 40%, ${C.blue}22, transparent 60%)`,
        }}
      />
      <div style={{ position: 'absolute', left: 120, top: 80 }}>
        <div style={{ fontFamily: ORBITRON, fontSize: 52, fontWeight: 900, letterSpacing: 6, color: C.white, textShadow: `0 0 22px ${C.cyan}` }}>
          RAG HÍBRIDO DE LA NASA
        </div>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.cyan, marginTop: 6 }}>387,730 documentos · Tier-1 BM25 + Tier-2 SQLite FTS5</div>
      </div>
      <div style={{ position: 'absolute', left: 120, top: 220, opacity: interpolate(frame, [0, 6], [0, 1], CLAMP) }}>
        <DocGrid />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 540,
          width: 1150,
          fontFamily: MONO,
          fontSize: 28,
          color: C.white,
          background: C.panel,
          border: `1px solid ${C.cyan}66`,
          padding: '14px 22px',
        }}
      >
        <span style={{ color: C.cyan }}>consulta ▸ </span>
        {QUERY.slice(0, typed)}
        {typed < QUERY.length && <span style={{ color: C.cyan }}>▌</span>}
      </div>
      <div style={{ position: 'absolute', left: 120, top: 630, width: 1150 }}>
        {HITS.map((h) => (
          <div
            key={h.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              marginTop: 14,
              fontFamily: MONO,
              fontSize: 23,
              opacity: interpolate(frame, [h.at, h.at + 5], [0, 1], CLAMP),
              translate: interpolate(frame, [h.at, h.at + 9], ['-30px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
            }}
          >
            <span style={{ color: C.ok, width: 330 }}>{h.id}</span>
            <span style={{ color: C.white, flex: 1, fontFamily: SANS }}>{h.title}</span>
            <div style={{ width: 160, height: 8, background: `${C.blue}33` }}>
              <div style={{ width: `${h.score * 100}%`, height: '100%', background: C.ok, boxShadow: `0 0 10px ${C.ok}` }} />
            </div>
            <span style={{ color: C.dim, width: 60 }}>{h.score.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 110, top: 230, width: 480 }}>
        <div style={{ fontFamily: ORBITRON, fontSize: 24, letterSpacing: 5, color: C.cyan }}>CARGA DEL SISTEMA</div>
        {METERS.map((m, i) => {
          const fill = interpolate(frame, [6 + i * 6, 40 + i * 6], [0, m.to], { ...CLAMP, easing: EASE }) + (random(`m${i}-${frame}`) - 0.5) * 3;
          return (
            <div key={m.label} style={{ marginTop: 34 }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.white }}>{m.label}</div>
              <div style={{ marginTop: 10, height: 14, background: `${C.blue}33` }}>
                <div style={{ width: `${Math.max(0, fill)}%`, height: '100%', background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`, boxShadow: `0 0 14px ${C.cyan}` }} />
              </div>
              <div style={{ fontFamily: ORBITRON, fontSize: 30, color: C.white, marginTop: 6 }}>{Math.max(0, Math.round(fill))}%</div>
            </div>
          );
        })}
        <Chip color={C.ok} style={{ marginTop: 40, opacity: interpolate(frame, [52, 60], [0, 1], CLAMP) }}>
          ESTADO ▸ ESTABLE · 0 ERRORES
        </Chip>
      </div>
      <AbsoluteFill style={{ backgroundColor: C.cyan, opacity: interpolate(frame, [76, 84], [0, 0.55], CLAMP) }} />
      <CornerFrame inset={36} size={54} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ C3 · resolution: CO₂ back to nominal
const FALL = Array.from({ length: 34 }, (_, i) => 0.92 - (1 - Math.exp(-i / 7)) * 0.62 + random(`f${i}`) * 0.025);

export const ResolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const accent = interpolateColors(frame, [0, 26], [C.alert, C.cyan]);
  const ppm = Math.round(interpolate(frame, [0, 34], [1350, 612], { ...CLAMP, easing: EASE }));
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: 'hidden' }}>
      <Img
        src={staticFile('shots/p_correct_4k.png')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(10px) brightness(0.45) saturate(1.1)',
          scale: interpolate(frame, [0, 78], [1.06, 1.14], CLAMP),
        }}
      />
      <AbsoluteFill style={{ backgroundColor: C.cyan, mixBlendMode: 'soft-light', opacity: 0.25 }} />
      <div style={{ position: 'absolute', left: 100, top: 150 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.white, letterSpacing: 4 }}>CO₂ · CABINA</div>
        <div style={{ fontFamily: ORBITRON, fontSize: 140, fontWeight: 900, color: C.white, lineHeight: 1, textShadow: `0 0 34px ${accent}` }}>
          {ppm.toLocaleString('en-US')}
          <span style={{ fontSize: 50, color: accent, marginLeft: 18 }}>ppm</span>
        </div>
        <div style={{ marginTop: 34 }}>
          <Graph values={FALL} w={760} h={250} color={accent} progress={interpolate(frame, [0, 34], [0.05, 1], { ...CLAMP, easing: EASE })} />
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: ORBITRON,
            fontSize: 54,
            fontWeight: 900,
            letterSpacing: 8,
            color: C.ok,
            textShadow: `0 0 26px ${C.ok}`,
            opacity: interpolate(frame, [30, 38], [0, 1], CLAMP),
            scale: interpolate(frame, [30, 40], [1.25, 1], { ...CLAMP, easing: EASE }),
          }}
        >
          ESTABLE ✓
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 980,
          top: 300,
          width: 860,
          opacity: interpolate(frame, [12, 22], [0, 1], CLAMP),
          translate: interpolate(frame, [12, 26], ['120px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
          boxShadow: `0 0 60px ${C.cyan}55`,
        }}
      >
        <Img src={staticFile('shots/p_correct_panel.png')} style={{ width: '100%', display: 'block' }} />
      </div>
      <AbsoluteFill style={{ backgroundColor: C.white, opacity: interpolate(frame, [0, 6], [0.6, 0], CLAMP) }} />
      <CornerFrame inset={36} size={54} />
    </AbsoluteFill>
  );
};
