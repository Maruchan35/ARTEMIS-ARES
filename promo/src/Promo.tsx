import React from 'react';
import { AbsoluteFill, Sequence, Track, staticFile, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { C } from './theme';
import { Caption, Overlays } from './hud';
import { BootScene, CompileScene } from './scenes/Intro';
import { KatherineScene, MissionsScene, OverclockScene, TelemetryScene } from './scenes/Action';
import { ComputeScene, CrisisScene, ResolutionScene } from './scenes/Climax';
import { OutroScene } from './scenes/Outro';

// 30.0 s promo · 4 blocks: hook 0-7 · action 7-17 · climax 17-25 · outro 25-30.
// VO start times must match VO[] in scripts/make_score.py (music ducks under them).
export const Promo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Track name="Escenas">
        <Sequence name="A1 · Compilación" durationInFrames={Math.round(4.6 * fps)}>
          <CompileScene />
        </Sequence>
        <Sequence name="A2 · Arranque" from={Math.round(4.6 * fps)} durationInFrames={Math.round(2.4 * fps)}>
          <BootScene />
        </Sequence>
        <Sequence name="B1 · Telemetría" from={7 * fps} durationInFrames={Math.round(3.2 * fps)}>
          <TelemetryScene />
        </Sequence>
        <Sequence name="B2 · KATHERINE" from={Math.round(10.2 * fps)} durationInFrames={Math.round(2.8 * fps)}>
          <KatherineScene />
        </Sequence>
        <Sequence name="B3 · Misiones" from={13 * fps} durationInFrames={Math.round(2.6 * fps)}>
          <MissionsScene />
        </Sequence>
        <Sequence name="B4 · Sobrecarga" from={Math.round(15.6 * fps)} durationInFrames={Math.round(1.4 * fps)}>
          <OverclockScene />
        </Sequence>
        <Sequence name="C1 · Crisis CO₂" from={17 * fps} durationInFrames={Math.round(2.6 * fps)}>
          <CrisisScene />
        </Sequence>
        <Sequence name="C2 · Carga máxima" from={Math.round(19.6 * fps)} durationInFrames={Math.round(2.8 * fps)}>
          <ComputeScene />
        </Sequence>
        <Sequence name="C3 · Resolución" from={Math.round(22.4 * fps)} durationInFrames={Math.round(2.6 * fps)}>
          <ResolutionScene />
        </Sequence>
        <Sequence name="D · Logo CodeCraft" from={25 * fps} durationInFrames={5 * fps}>
          <OutroScene />
        </Sequence>
      </Track>

      <Overlays />

      <Track name="Subtítulos">
        <Sequence name="Sub · Sistemas en línea" from={Math.round(5.1 * fps)} durationInFrames={Math.round(2.6 * fps)}>
          <Caption text="Sistemas en línea… ¡Hola, cadete!" />
        </Sequence>
        <Sequence name="Sub · Telemetría" from={Math.round(7.95 * fps)} durationInFrames={Math.round(3.5 * fps)}>
          <Caption text="Telemetría en tiempo real, con datos reales de la NASA." />
        </Sequence>
        <Sequence name="Sub · Cada decisión" from={Math.round(12.1 * fps)} durationInFrames={Math.round(2.9 * fps)}>
          <Caption text="Cada decisión cuenta. Y yo te explico por qué." />
        </Sequence>
        <Sequence name="Sub · Alerta" from={Math.round(17.4 * fps)} durationInFrames={Math.round(2.1 * fps)}>
          <Caption text="Alerta: el CO₂ está subiendo." />
        </Sequence>
        <Sequence name="Sub · Sin pánico" from={Math.round(21.45 * fps)} durationInFrames={Math.round(2.75 * fps)}>
          <Caption text="Sin pánico, cadete. Tú tienes el control." />
        </Sequence>
      </Track>

      <Audio name="Banda sonora" src={staticFile('audio/score.wav')} volume={0.4} />
      <Track name="Voz KATHERINE">
        {/* durationInFrames trims each file's trailing silence so the clips never overlap on the track */}
        <Audio volume={0.85} name="VO · Sistemas en línea" src={staticFile('audio/vo1.wav')} from={Math.round(4.75 * fps)} durationInFrames={Math.round(2.6 * fps)} />
        <Audio volume={0.85} name="VO · Telemetría" src={staticFile('audio/vo2.wav')} from={Math.round(7.45 * fps)} durationInFrames={Math.round(3.95 * fps)} />
        <Audio volume={0.85} name="VO · Cada decisión" src={staticFile('audio/vo3.wav')} from={Math.round(11.75 * fps)} durationInFrames={Math.round(3.2 * fps)} />
        <Audio volume={0.85} name="VO · Alerta CO₂" src={staticFile('audio/vo4.wav')} from={Math.round(16.95 * fps)} durationInFrames={Math.round(2.5 * fps)} />
        <Audio volume={0.85} name="VO · Sin pánico" src={staticFile('audio/vo5.wav')} from={21 * fps} durationInFrames={Math.round(3.1 * fps)} />
        <Audio volume={0.85} name="VO · CodeCraft presents" src={staticFile('audio/vo6.wav')} from={Math.round(25.75 * fps)} durationInFrames={Math.round(2.4 * fps)} />
      </Track>
    </AbsoluteFill>
  );
};
