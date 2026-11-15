import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, CLAMP, EASE, MONO, ORBITRON } from '../theme';

/** CodeCraft mark: < > brackets around a crafted crystal, drawn as strokes. */
const Mark: React.FC<{ draw: number; glow: number }> = ({ draw, glow }) => {
  const len = 420;
  const stroke = (color: string, delay: number): React.SVGProps<SVGPathElement> => ({
    fill: 'none',
    stroke: color,
    strokeWidth: 9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: len,
    strokeDashoffset: len * (1 - Math.min(1, Math.max(0, draw * 1.3 - delay))),
  });
  return (
    <svg width={260} height={200} viewBox="0 0 260 200" style={{ filter: `drop-shadow(0 0 ${8 + glow * 22}px ${C.cyan})` }}>
      <path d="M70 40 L20 100 L70 160" {...stroke(C.cyan, 0)} />
      <path d="M190 40 L240 100 L190 160" {...stroke(C.cyan, 0.1)} />
      <path d="M130 38 L168 100 L130 162 L92 100 Z" {...stroke(C.white, 0.25)} />
      <path d="M92 100 L168 100 M130 38 L130 162" {...stroke(`${C.blue}`, 0.35)} strokeWidth={4} />
    </svg>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sweep = interpolate(frame, [30, 58], [-30, 130], CLAMP);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, #0d1a2e 0%, #050a14 55%, #010205 100%)', overflow: 'hidden' }}>
      {/* brushed-metal floor grid */}
      <AbsoluteFill style={{ perspective: 900 }}>
        <div
          style={{
            position: 'absolute',
            left: '-50%',
            right: '-50%',
            bottom: -260,
            height: 700,
            backgroundImage: `linear-gradient(${C.cyan}22 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}22 1px, transparent 1px)`,
            backgroundSize: '90px 90px',
            backgroundPosition: `0px ${frame * 1.5}px`,
            rotate: 'x 72deg',
            maskImage: 'linear-gradient(0deg, black 10%, transparent 80%)',
            opacity: 0.7,
          }}
        />
      </AbsoluteFill>
      {/* particles */}
      {Array.from({ length: 70 }, (_, i) => {
        const x = random(`px${i}`) * 1920;
        const y = (random(`py${i}`) * 1180 - frame * (0.6 + random(`ps${i}`) * 1.4) + 1180) % 1180;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (8 + random(`pt${i}`) * 14) + i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 3,
              height: 3,
              borderRadius: 2,
              background: i % 5 ? C.cyan : C.white,
              opacity: tw * 0.6,
              boxShadow: `0 0 8px ${C.cyan}`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', translate: '0px -40px' }}>
        <Mark draw={interpolate(frame, [4, 30], [0, 1], { ...CLAMP, easing: EASE })} glow={interpolate(frame, [26, 40, 90], [0, 1, 0.55], CLAMP)} />
        <div
          style={{
            position: 'relative',
            marginTop: 24,
            fontFamily: ORBITRON,
            fontWeight: 900,
            fontSize: 132,
            color: C.white,
            letterSpacing: `${interpolate(frame, [10, 40], [0.5, 0.08], { ...CLAMP, easing: EASE })}em`,
            opacity: interpolate(frame, [10, 24], [0, 1], CLAMP),
            textShadow: `0 0 30px ${C.cyan}cc, 0 0 80px ${C.blue}88`,
            backgroundImage: `linear-gradient(100deg, ${C.white} ${sweep - 12}%, #ffffff ${sweep}%, ${C.cyan} ${sweep + 1}%, ${C.white} ${sweep + 14}%)`,
            WebkitBackgroundClip: 'text',
          }}
        >
          CodeCraft
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: ORBITRON,
            fontSize: 34,
            letterSpacing: 10,
            color: C.cyan,
            opacity: interpolate(frame, [38, 50], [0, 1], CLAMP),
            translate: interpolate(frame, [38, 54], ['0px 16px', '0px 0px'], { ...CLAMP, easing: EASE }),
          }}
        >
          AETHER-4 · ORBITAL QUARTERS · v1.0
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: MONO,
            fontSize: 22,
            letterSpacing: 2,
            color: C.dim,
            opacity: interpolate(frame, [52, 64], [0, 1], CLAMP),
          }}
        >
          KATHERINE AI v3.0 · Gemma-4 + LoRA · NASA Hybrid RAG 387k · Supertonic 3
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: interpolate(frame, [durationInFrames - 22, durationInFrames], [0, 1], CLAMP) }} />
    </AbsoluteFill>
  );
};
