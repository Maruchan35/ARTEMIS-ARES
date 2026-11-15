import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, CLAMP, EASE, MONO, SANS } from './theme';

/** Four L-shaped HUD brackets that grow in from the corners. */
export const CornerFrame: React.FC<{ inset?: number; color?: string; delay?: number; size?: number }> = ({
  inset = 48,
  color = C.cyan,
  delay = 0,
  size = 70,
}) => {
  const frame = useCurrentFrame();
  const len = interpolate(frame, [delay, delay + 14], [0, size], { ...CLAMP, easing: EASE });
  const b = `2px solid ${color}`;
  const common: React.CSSProperties = { position: 'absolute', width: len, height: len, filter: `drop-shadow(0 0 6px ${color})` };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ ...common, left: inset, top: inset, borderLeft: b, borderTop: b }} />
      <div style={{ ...common, right: inset, top: inset, borderRight: b, borderTop: b }} />
      <div style={{ ...common, left: inset, bottom: inset, borderLeft: b, borderBottom: b }} />
      <div style={{ ...common, right: inset, bottom: inset, borderRight: b, borderBottom: b }} />
    </AbsoluteFill>
  );
};

/** Scrolling telemetry trace (deterministic). */
export const Sparkline: React.FC<{ seed: number; w: number; h: number; color?: string; speed?: number; amp?: number }> = ({
  seed,
  w,
  h,
  color = C.cyan,
  speed = 0.6,
  amp = 0.35,
}) => {
  const frame = useCurrentFrame();
  const n = 40;
  const pts = Array.from({ length: n }, (_, i) => {
    const k = i + frame * speed;
    const v = 0.5 + amp * Math.sin(k / 3.1 + seed) * 0.6 + amp * (random(`${seed}-${Math.floor(k)}`) - 0.5) * 0.7;
    return `${(i / (n - 1)) * w},${h - Math.min(1, Math.max(0, v)) * h}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.cyan, style }) => (
  <div
    style={{
      display: 'inline-block',
      fontFamily: MONO,
      fontSize: 22,
      letterSpacing: 1,
      color,
      border: `1px solid ${color}`,
      background: 'rgba(4, 20, 40, 0.65)',
      padding: '8px 16px',
      boxShadow: `0 0 18px ${color}44, inset 0 0 12px ${color}22`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Film grain + scanlines + vignette over the whole film. */
export const Overlays: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)',
          mixBlendMode: 'overlay',
        }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.07, mixBlendMode: 'screen' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)' }} />
    </AbsoluteFill>
  );
};

/** Subtitle for one KATHERINE line; fades with its own Sequence. */
export const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 72 }}>
      <div
        style={{
          opacity: interpolate(frame, [0, 6, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], CLAMP),
          translate: interpolate(frame, [0, 8], ['0px 14px', '0px 0px'], { ...CLAMP, easing: EASE }),
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 38,
          color: C.white,
          background: 'rgba(3, 10, 22, 0.72)',
          border: `1px solid ${C.cyan}55`,
          padding: '14px 28px',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 24, color: C.cyan, marginRight: 16, letterSpacing: 2 }}>KATHERINE ▸</span>
        {text}
      </div>
    </AbsoluteFill>
  );
};
