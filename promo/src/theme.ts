import { Easing } from 'remotion';
import { loadFont as loadOrbitron } from '@remotion/google-fonts/Orbitron';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

export const ORBITRON = loadOrbitron('normal', { weights: ['500', '700', '900'], subsets: ['latin'] }).fontFamily;
export const MONO = loadMono('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily;
export const SANS = loadInter('normal', { weights: ['400', '600', '800'], subsets: ['latin'] }).fontFamily;

/** CodeCraft palette: cyan / electric blue / white on near-black, red only for the crisis beat. */
export const C = {
  bg: '#03060d',
  panel: 'rgba(6, 18, 34, 0.78)',
  cyan: '#38e1ff',
  blue: '#2f6bff',
  white: '#eaf6ff',
  dim: '#7c93b3',
  alert: '#ff4d6d',
  ok: '#4dffb5',
};

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
