import React from 'react';
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { C, CLAMP, EASE, EASE_IN, MONO, ORBITRON } from '../theme';
import { CornerFrame } from '../hud';

// Real log lines from this project's build + KATHERINE bridge startup.
const LOG: { text: string; color: string }[] = [
  { text: '$ npm run build', color: C.cyan },
  { text: 'tsc && vite build', color: C.dim },
  { text: '✓ src/game/spaceRoomSimulation.ts', color: C.white },
  { text: '✓ src/ai/mentorDirector.ts · tick 400 ms', color: C.white },
  { text: '✓ src/components/MentorHologram.tsx', color: C.white },
  { text: '✓ built in 5.50s', color: C.ok },
  { text: '$ python ai_bridge/mentor_server.py', color: C.cyan },
  { text: '[rag] NASA Hybrid RAG ready: 387,730 documents', color: '#7fb2ff' },
  { text: '[hf] unsloth/gemma-4-E4B-it + astrocopilot_gemma4_lora', color: '#7fb2ff' },
  { text: '[voice] Supertonic 3 ready · voices F1–F5, M1–M5', color: '#7fb2ff' },
  { text: '[mentor] KATHERINE listening on :8765', color: C.white },
  { text: 'MENTOR_SERVER_READY', color: C.ok },
  { text: 'stepSpaceRoomSimulation() ▸ running', color: C.cyan },
  { text: 'AETHER-4 · boot sequence engaged', color: C.white },
];
const MODULES = [
  'mentorKnowledge.ts',
  'offlineMentor.ts',
  'mentorClient.ts',
  'mentorVoice.ts',
  'nasaConstants.ts',
  'SpaceSinglePlayerGame.tsx',
  'mentor_voice.py',
  'nasa_rag_engine.py',
];

const LogLine: React.FC<{ index: number; text: string; color: string }> = ({ index, text, color }) => {
  const frame = useCurrentFrame();
  const start = 15 + index * 6.45;
  const chars = Math.floor(interpolate(frame, [start, start + 5], [0, text.length], CLAMP));
  if (frame < start) return null;
  return (
    <div style={{ color, whiteSpace: 'pre', textShadow: `0 0 8px ${color}66` }}>
      {text.slice(0, chars)}
      {chars < text.length && <span style={{ color: C.cyan }}>▌</span>}
    </div>
  );
};

export const CompileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const collapse = interpolate(frame, [4.2 * fps, 4.55 * fps], [1, 0.012], { ...CLAMP, easing: EASE_IN });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.blue}14 1px, transparent 1px), linear-gradient(90deg, ${C.blue}14 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          scale: interpolate(frame, [0, 4.6 * fps], [1.08, 1], CLAMP),
          opacity: interpolate(frame, [0, 12], [0, 1], CLAMP),
        }}
      />
      <AbsoluteFill
        style={{
          scale: `1 ${collapse}`,
          filter: `brightness(${interpolate(frame, [4.2 * fps, 4.55 * fps], [1, 3], CLAMP)})`,
        }}
      >
        {/* terminal */}
        <div
          style={{
            position: 'absolute',
            left: 140,
            top: 190,
            width: 1060,
            height: 620,
            background: C.panel,
            border: `1px solid ${C.cyan}66`,
            boxShadow: `0 0 40px ${C.blue}33`,
            opacity: interpolate(frame, [4, 14], [0, 1], CLAMP),
            translate: interpolate(frame, [4, 18], ['0px 30px', '0px 0px'], { ...CLAMP, easing: EASE }),
          }}
        >
          <div style={{ height: 44, borderBottom: `1px solid ${C.cyan}33`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
            {[C.alert, '#ffcf4d', C.ok].map((c) => (
              <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85 }} />
            ))}
            <div style={{ fontFamily: MONO, fontSize: 18, color: C.dim, marginLeft: 14 }}>codecraft@aether-4: ~/orbital-quarters</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 25, lineHeight: '38px', padding: '16px 26px' }}>
            {LOG.map((l, i) => (
              <LogLine key={l.text} index={i} text={l.text} color={l.color} />
            ))}
          </div>
        </div>
        {/* build progress + modules */}
        <div
          style={{
            position: 'absolute',
            left: 1270,
            top: 190,
            width: 510,
            opacity: interpolate(frame, [8, 18], [0, 1], CLAMP),
          }}
        >
          <div style={{ fontFamily: ORBITRON, fontSize: 26, letterSpacing: 6, color: C.cyan }}>COMPILANDO · CODECRAFT</div>
          <div style={{ marginTop: 18, height: 10, background: `${C.blue}33` }}>
            <div
              style={{
                height: '100%',
                width: `${interpolate(frame, [12, 4.15 * fps], [0, 100], { ...CLAMP, easing: EASE })}%`,
                background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`,
                boxShadow: `0 0 16px ${C.cyan}`,
              }}
            />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.white, marginTop: 10 }}>
            {Math.round(interpolate(frame, [12, 4.15 * fps], [0, 100], { ...CLAMP, easing: EASE }))}%
          </div>
          <div style={{ marginTop: 34, fontFamily: MONO, fontSize: 21, lineHeight: '40px' }}>
            {MODULES.map((m, i) => (
              <div key={m} style={{ color: frame > 20 + i * 12 ? C.white : `${C.dim}66`, display: 'flex', gap: 14 }}>
                <span style={{ color: frame > 20 + i * 12 ? C.ok : `${C.dim}44` }}>{frame > 20 + i * 12 ? '■' : '□'}</span>
                {m}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
      {/* collapse scanline */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            height: 3,
            width: `${interpolate(frame, [4.1 * fps, 4.5 * fps], [0, 100], { ...CLAMP, easing: EASE })}%`,
            background: C.white,
            boxShadow: `0 0 30px 8px ${C.cyan}, 0 0 80px 20px ${C.blue}`,
            opacity: interpolate(frame, [4.1 * fps, 4.2 * fps], [0, 1], CLAMP),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const BootScene: React.FC = () => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [0, 11], [50, 0], { ...CLAMP, easing: EASE });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          clipPath: `inset(${open}% 0 ${open}% 0)`,
          filter: `brightness(${interpolate(frame, [0, 14], [2.2, 1], CLAMP)}) saturate(1.1)`,
          scale: interpolate(frame, [0, 72], [1.0, 1.07], CLAMP),
        }}
      >
        <Video src={staticFile('clips/menu_idle.mp4')} muted trimBefore={12} objectFit="cover" style={{ width: '100%', height: '100%' }} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.blue}22, transparent 40%, ${C.bg}88)` }} />
      </AbsoluteFill>
      {/* white-hot line that splits open */}
      <AbsoluteFill style={{ justifyContent: 'center' }}>
        <div
          style={{
            height: 3,
            background: C.white,
            boxShadow: `0 0 30px 8px ${C.cyan}`,
            translate: `0px ${interpolate(frame, [0, 11], [0, 540], { ...CLAMP, easing: EASE })}px`,
            opacity: interpolate(frame, [0, 12], [1, 0], CLAMP),
          }}
        />
      </AbsoluteFill>
      <CornerFrame delay={16} />
      <div
        style={{
          position: 'absolute',
          left: 92,
          top: 86,
          fontFamily: MONO,
          fontSize: 24,
          letterSpacing: 4,
          color: C.cyan,
          opacity: interpolate(frame, [18, 26], [0, 1], CLAMP),
          textShadow: `0 0 10px ${C.cyan}`,
        }}
      >
        SISTEMA ▸ EN LÍNEA · CODECRAFT
      </div>
      <div
        style={{
          position: 'absolute',
          right: 92,
          bottom: 170,
          fontFamily: ORBITRON,
          fontSize: 30,
          letterSpacing: 8,
          color: C.white,
          opacity: interpolate(frame, [26, 36], [0, 1], CLAMP),
          translate: interpolate(frame, [26, 40], ['30px 0px', '0px 0px'], { ...CLAMP, easing: EASE }),
          textShadow: `0 0 14px ${C.cyan}`,
        }}
      >
        ORBITAL QUARTERS · 3D EN TIEMPO REAL
      </div>
    </AbsoluteFill>
  );
};
