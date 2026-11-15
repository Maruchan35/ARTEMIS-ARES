import * as THREE from 'three';

export interface PbrMaterialMaps {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export interface SpaceTextureSet {
  paddedWall: PbrMaterialMaps;
  metalBulkhead: PbrMaterialMaps;
  isogridFloor: PbrMaterialMaps;
  ceilingPanel: PbrMaterialMaps;
  bedFabric: PbrMaterialMaps;
  spaceBackdrop: THREE.CanvasTexture;
  medsGlassCockpit: THREE.CanvasTexture;
  aphBotanicalRack: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context for procedural PBR textures');
  }
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createPaddedWallMaps(aniso: number): PbrMaterialMaps {
  const S = 512;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  // Base Beta-Cloth NASA acoustic off-white / cool slate ivory
  xCol.fillStyle = '#dde5ee';
  xCol.fillRect(0, 0, S, S);
  xBmp.fillStyle = '#d4d4d4';
  xBmp.fillRect(0, 0, S, S);
  xRgh.fillStyle = '#cfcfcf';
  xRgh.fillRect(0, 0, S, S);

  // Subtle vertical structural framing strips (2 panels per tile)
  for (const px of [0, S / 2]) {
    xCol.fillStyle = '#475569';
    xCol.fillRect(px, 0, 14, S);
    xCol.fillStyle = '#64748b';
    xCol.fillRect(px + 14, 0, 4, S);

    xBmp.fillStyle = '#555555';
    xBmp.fillRect(px, 0, 16, S);
    xRgh.fillStyle = '#5a5a5a';
    xRgh.fillRect(px, 0, 16, S);
  }

  // Soft diamond acoustic pillowing inside each panel
  const step = 64;
  for (let row = 0; row <= S / step; row++) {
    for (let col = 0; col <= S / step; col++) {
      const cx = col * step;
      const cy = row * step;
      const grad = xCol.createRadialGradient(cx + step / 2, cy + step / 2, 2, cx + step / 2, cy + step / 2, step * 0.6);
      grad.addColorStop(0, 'rgba(255,255,255,0.22)');
      grad.addColorStop(1, 'rgba(148,163,184,0.16)');
      xCol.fillStyle = grad;
      xCol.fillRect(cx, cy, step, step);
    }
  }

  xCol.strokeStyle = 'rgba(100, 116, 139, 0.45)';
  xCol.lineWidth = 2;
  xBmp.strokeStyle = '#686868';
  xBmp.lineWidth = 3;

  for (let i = -S; i <= S * 2; i += step) {
    for (const ctx of [xCol, xBmp]) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + S, S);
      ctx.moveTo(i + S, 0);
      ctx.lineTo(i, S);
      ctx.stroke();
    }
  }

  // Tufted fastener rivets at intersections
  for (let y = step / 2; y < S; y += step) {
    for (let x = step / 2; x < S; x += step) {
      if (Math.abs(x - 0) < 22 || Math.abs(x - S / 2) < 22) continue;
      xCol.fillStyle = '#94a3b8';
      xCol.beginPath();
      xCol.arc(x, y, 4, 0, Math.PI * 2);
      xCol.fill();

      xBmp.fillStyle = '#ffffff';
      xBmp.beginPath();
      xBmp.arc(x, y, 5, 0, Math.PI * 2);
      xBmp.fill();
    }
  }

  // Bottom scuff bumper & top Velcro/handrail trim (Navy #0F2547 + Crimson #D93025 warning accents)
  xCol.fillStyle = '#0F2547';
  xCol.fillRect(0, S - 42, S, 42);
  xCol.fillStyle = '#F4F6F8';
  xCol.fillRect(0, S - 45, S, 3);
  xCol.fillStyle = '#D93025';
  xCol.fillRect(28, S - 30, 44, 10);
  xCol.fillRect(S / 2 + 28, S - 30, 44, 10);
  // Stencil module numbers '4' & '6' from MEDS/ISS hardware guidelines
  xCol.fillStyle = '#080A0F';
  xCol.font = 'bold 26px monospace';
  xCol.fillText('04', 28, 42);
  xCol.fillText('06', S / 2 + 28, 42);
  // Exposed navy + red cable harness in top track
  xCol.fillStyle = '#7A8288';
  xCol.fillRect(0, 0, S, 16);
  xCol.fillStyle = '#0F2547';
  xCol.fillRect(0, 4, S, 5);
  xCol.fillStyle = '#D93025';
  xCol.fillRect(0, 10, S, 2);

  return {
    map: finalizeTexture(cCol, true, 1, 1, aniso),
    bumpMap: finalizeTexture(cBmp, false, 1, 1, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 1, 1, aniso),
  };
}

function createMetalBulkheadMaps(aniso: number): PbrMaterialMaps {
  const S = 512;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  xCol.fillStyle = '#3b485b';
  xCol.fillRect(0, 0, S, S);
  xBmp.fillStyle = '#a0a0a0';
  xBmp.fillRect(0, 0, S, S);
  xRgh.fillStyle = '#707070';
  xRgh.fillRect(0, 0, S, S);

  // Subtle brushed aluminum horizontal grain
  for (let y = 0; y < S; y += 3) {
    const v = 50 + ((y * 37) % 18);
    xCol.fillStyle = `rgba(${v + 40}, ${v + 55}, ${v + 75}, 0.14)`;
    xCol.fillRect(0, y, S, 1);
  }

  // Panel seam bevels
  xCol.strokeStyle = '#1e293b';
  xCol.lineWidth = 4;
  xCol.strokeRect(4, 4, S - 8, S / 2 - 8);
  xCol.strokeRect(4, S / 2 + 4, S - 8, S / 2 - 8);

  xBmp.strokeStyle = '#303030';
  xBmp.lineWidth = 5;
  xBmp.strokeRect(4, 4, S - 8, S / 2 - 8);
  xBmp.strokeRect(4, S / 2 + 4, S - 8, S / 2 - 8);

  // Corner hex bolts
  const bolts: [number, number][] = [
    [20, 20], [S - 20, 20], [20, S / 2 - 20], [S - 20, S / 2 - 20],
    [20, S / 2 + 20], [S - 20, S / 2 + 20], [20, S - 20], [S - 20, S - 20],
  ];
  for (const [bx, by] of bolts) {
    xCol.fillStyle = '#94a3b8';
    xCol.beginPath();
    xCol.arc(bx, by, 5, 0, Math.PI * 2);
    xCol.fill();
    xBmp.fillStyle = '#ffffff';
    xBmp.beginPath();
    xBmp.arc(bx, by, 6, 0, Math.PI * 2);
    xBmp.fill();
    xRgh.fillStyle = '#383838';
    xRgh.beginPath();
    xRgh.arc(bx, by, 6, 0, Math.PI * 2);
    xRgh.fill();
  }

  // Navy conduit harnesses & crimson valve stencil on bulkhead
  xCol.fillStyle = '#0F2547';
  xCol.fillRect(42, 34, S - 84, 10);
  xCol.fillStyle = '#D93025';
  xCol.fillRect(S - 96, 32, 36, 14);
  xCol.fillStyle = '#F4F6F8';
  xCol.font = 'bold 18px monospace';
  xCol.fillText('NASA · ISS-RACK', 46, S / 2 - 26);

  // Caution stripe near bottom flange (Navy/Crimson/Black industrial trim)
  xCol.save();
  xCol.beginPath();
  xCol.rect(0, S - 28, S, 24);
  xCol.clip();
  xCol.fillStyle = '#D93025';
  xCol.fillRect(0, S - 28, S, 24);
  xCol.fillStyle = '#080A0F';
  for (let x = -40; x < S + 40; x += 32) {
    xCol.beginPath();
    xCol.moveTo(x, S - 28);
    xCol.lineTo(x + 16, S - 28);
    xCol.lineTo(x + 4, S - 4);
    xCol.lineTo(x - 12, S - 4);
    xCol.closePath();
    xCol.fill();
  }
  xCol.restore();

  return {
    map: finalizeTexture(cCol, true, 1, 1, aniso),
    bumpMap: finalizeTexture(cBmp, false, 1, 1, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 1, 1, aniso),
  };
}

function createIsogridFloorMaps(aniso: number): PbrMaterialMaps {
  const S = 512;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  // Non-slip dark slate blue/charcoal deck plating
  xCol.fillStyle = '#1f2937';
  xCol.fillRect(0, 0, S, S);
  xBmp.fillStyle = '#707070';
  xBmp.fillRect(0, 0, S, S);
  xRgh.fillStyle = '#999999';
  xRgh.fillRect(0, 0, S, S);

  // Raised machined floor tiles (2x2 grid)
  const half = S / 2;
  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const ox = gx * half;
      const oy = gy * half;
      xCol.fillStyle = '#283548';
      xCol.fillRect(ox + 6, oy + 6, half - 12, half - 12);
      xBmp.fillStyle = '#b8b8b8';
      xBmp.fillRect(ox + 6, oy + 6, half - 12, half - 12);
      xRgh.fillStyle = '#787878';
      xRgh.fillRect(ox + 6, oy + 6, half - 12, half - 12);

      // Machined anti-slip tread ribs
      xCol.fillStyle = '#334155';
      xBmp.fillStyle = '#ffffff';
      for (let ry = oy + 24; ry < oy + half - 20; ry += 22) {
        for (let rx = ox + 22; rx < ox + half - 24; rx += 34) {
          xCol.fillRect(rx, ry, 20, 6);
          xBmp.fillRect(rx, ry, 20, 6);
        }
      }

      // Tie-down seat-track ring at center
      xCol.strokeStyle = '#475569';
      xCol.lineWidth = 3;
      xCol.beginPath();
      xCol.arc(ox + half / 2, oy + half / 2, 18, 0, Math.PI * 2);
      xCol.stroke();

      xCol.fillStyle = '#0ea5e9';
      xCol.fillRect(ox + 14, oy + 14, 14, 3);
    }
  }

  return {
    map: finalizeTexture(cCol, true, 4, 3.5, aniso),
    bumpMap: finalizeTexture(cBmp, false, 4, 3.5, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 4, 3.5, aniso),
  };
}

function createCeilingPanelMaps(aniso: number): PbrMaterialMaps {
  const S = 512;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  xCol.fillStyle = '#cbd5e1';
  xCol.fillRect(0, 0, S, S);
  xBmp.fillStyle = '#c8c8c8';
  xBmp.fillRect(0, 0, S, S);
  xRgh.fillStyle = '#b4b4b4';
  xRgh.fillRect(0, 0, S, S);

  // Structural ribs
  xCol.strokeStyle = '#475569';
  xCol.lineWidth = 10;
  xCol.strokeRect(5, 5, S - 10, S - 10);
  xCol.beginPath();
  xCol.moveTo(S / 2, 0);
  xCol.lineTo(S / 2, S);
  xCol.moveTo(0, S / 2);
  xCol.lineTo(S, S / 2);
  xCol.stroke();

  xBmp.strokeStyle = '#505050';
  xBmp.lineWidth = 12;
  xBmp.strokeRect(5, 5, S - 10, S - 10);
  xBmp.beginPath();
  xBmp.moveTo(S / 2, 0);
  xBmp.lineTo(S / 2, S);
  xBmp.moveTo(0, S / 2);
  xBmp.lineTo(S, S / 2);
  xBmp.stroke();

  // Micro-ventilation louver slats in one quadrant
  xCol.fillStyle = '#64748b';
  xBmp.fillStyle = '#383838';
  for (let y = 38; y < 220; y += 14) {
    xCol.fillRect(36, y, 180, 6);
    xBmp.fillRect(36, y, 180, 6);
  }

  return {
    map: finalizeTexture(cCol, true, 3, 3, aniso),
    bumpMap: finalizeTexture(cBmp, false, 3, 3, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 3, 3, aniso),
  };
}

function createBedFabricMaps(aniso: number): PbrMaterialMaps {
  const S = 512;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  // Rich quilted NASA sleep-station royal/slate blue textile
  xCol.fillStyle = '#1e40af';
  xCol.fillRect(0, 0, S, S);
  xBmp.fillStyle = '#d0d0d0';
  xBmp.fillRect(0, 0, S, S);
  xRgh.fillStyle = '#dfdfdf';
  xRgh.fillRect(0, 0, S, S);

  // Thermal baffle channels
  for (let y = 0; y < S; y += 64) {
    const grad = xCol.createLinearGradient(0, y, 0, y + 64);
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.5, '#2563eb');
    grad.addColorStop(1, '#1e3a8a');
    xCol.fillStyle = grad;
    xCol.fillRect(0, y, S, 64);

    xCol.fillStyle = '#0f172a';
    xCol.fillRect(0, y, S, 4);

    xBmp.fillStyle = '#555555';
    xBmp.fillRect(0, y, S, 5);
  }

  // Nylon restraint strap running down center
  xCol.fillStyle = '#cbd5e1';
  xCol.fillRect(0, S / 2 - 18, S, 36);
  xCol.fillStyle = '#334155';
  xCol.fillRect(S / 2 - 22, S / 2 - 22, 44, 44);
  xBmp.fillStyle = '#ffffff';
  xBmp.fillRect(S / 2 - 22, S / 2 - 22, 44, 44);

  return {
    map: finalizeTexture(cCol, true, 1, 1, aniso),
    bumpMap: finalizeTexture(cBmp, false, 1, 1, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 1, 1, aniso),
  };
}

function createSpaceBackdropTexture(aniso: number): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for space backdrop');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#020510');
  bg.addColorStop(0.7, '#061229');
  bg.addColorStop(1, '#0b1e3d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle Milky Way dust nebula
  const neb = ctx.createRadialGradient(W * 0.72, H * 0.35, 10, W * 0.72, H * 0.35, 340);
  neb.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
  neb.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
  neb.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, W, H);

  // Crisp stars (deterministic LCG)
  let seed = 42069;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 420; i++) {
    const x = rand() * W;
    const y = rand() * H * 0.85;
    const r = rand() < 0.12 ? 1.9 : rand() < 0.4 ? 1.2 : 0.75;
    const alpha = 0.45 + rand() * 0.55;
    ctx.fillStyle = rand() < 0.18 ? `rgba(186,230,253,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Earth / Blue Planet curved orbital limb at bottom-left
  ctx.save();
  const limbX = W * 0.38;
  const limbY = H * 1.48;
  const limbR = H * 0.95;
  const atmo = ctx.createRadialGradient(limbX, limbY, limbR - 8, limbX, limbY, limbR + 36);
  atmo.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
  atmo.addColorStop(0.45, 'rgba(96, 165, 250, 0.38)');
  atmo.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = atmo;
  ctx.beginPath();
  ctx.arc(limbX, limbY, limbR + 36, 0, Math.PI * 2);
  ctx.fill();

  const planetGrad = ctx.createRadialGradient(limbX - 120, limbY - 260, 40, limbX, limbY, limbR);
  planetGrad.addColorStop(0, '#38bdf8');
  planetGrad.addColorStop(0.45, '#1d4ed8');
  planetGrad.addColorStop(1, '#082f49');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(limbX, limbY, limbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Small distant Moon sphere at upper-right
  const mx = W * 0.78;
  const my = H * 0.28;
  const mGrad = ctx.createRadialGradient(mx - 10, my - 10, 4, mx, my, 36);
  mGrad.addColorStop(0, '#f1f5f9');
  mGrad.addColorStop(0.65, '#94a3b8');
  mGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = mGrad;
  ctx.beginPath();
  ctx.arc(mx, my, 36, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  tex.needsUpdate = true;
  return tex;
}

function createMedsCockpitTexture(aniso: number): THREE.CanvasTexture {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for MEDS texture');

  ctx.fillStyle = '#7A8288';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#080A0F';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Top labels '4' and '6' + matte toggle switch rows
  ctx.fillStyle = '#080A0F';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('MEDS-04', 18, 28);
  ctx.fillText('GLASS COCKPIT (11 LCD)', 135, 28);
  ctx.fillText('MEDS-06', W - 102, 28);

  // 5x2 primary LCD displays glowing deep navy (#0F2547) with cyan/white/crimson telemetry
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const dx = 18 + col * 96;
      const dy = 42 + row * 94;
      ctx.fillStyle = '#080A0F';
      ctx.fillRect(dx, dy, 88, 76);
      ctx.fillStyle = '#0F2547';
      ctx.fillRect(dx + 5, dy + 5, 78, 66);

      // Synthetic artificial horizon / orbit trace / bar graphs
      ctx.strokeStyle = col === 2 && row === 0 ? '#D93025' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx + 12, dy + 42);
      ctx.lineTo(dx + 32, dy + 24);
      ctx.lineTo(dx + 52, dy + 35);
      ctx.lineTo(dx + 74, dy + 16);
      ctx.stroke();

      ctx.fillStyle = '#F4F6F8';
      ctx.fillRect(dx + 10, dy + 54, 42, 6);
      ctx.fillStyle = row === 1 && col >= 3 ? '#D93025' : '#22c55e';
      ctx.fillRect(dx + 58, dy + 54, 18, 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  tex.needsUpdate = true;
  return tex;
}

function createAphBotanicalTexture(aniso: number): THREE.CanvasTexture {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S);

  // Dark gray + navy frame
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#0F2547';
  ctx.fillRect(16, 16, S - 32, S - 32);

  // APH/Veggie chamber glowing magenta-purple (630 nm red + 450 nm blue)
  const glow = ctx.createLinearGradient(0, 60, 0, 420);
  glow.addColorStop(0, '#f0abfc');
  glow.addColorStop(0.35, '#d946ef');
  glow.addColorStop(0.75, '#6b21a8');
  glow.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = glow;
  ctx.fillRect(36, 56, S - 72, 340);

  // Porous clay pillows & gray fabric wicks + dwarf tomato silhouettes
  for (let i = 0; i < 6; i++) {
    const px = 56 + i * 68;
    ctx.fillStyle = '#7A8288';
    ctx.fillRect(px, 342, 52, 26); // clay pillow
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(px + 20, 326, 12, 16); // gray wick
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(px + 26, 286 - (i % 2) * 18, 24, 0, Math.PI * 2);
    ctx.fill();
    // Dwarf VEG-05 tomatoes in crimson red
    ctx.fillStyle = '#D93025';
    ctx.beginPath();
    ctx.arc(px + 18, 290 - (i % 2) * 18, 5, 0, Math.PI * 2);
    ctx.arc(px + 34, 278 - (i % 2) * 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // White control strip with crimson indicators and blue water tubing
  ctx.fillStyle = '#F4F6F8';
  ctx.fillRect(24, 412, S - 48, 76);
  ctx.fillStyle = '#0F2547';
  ctx.fillRect(42, 434, 180, 14);
  ctx.fillStyle = '#D93025';
  ctx.fillRect(250, 430, 18, 18);
  ctx.fillRect(280, 430, 18, 18);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(310, 430, 18, 18);
  ctx.fillStyle = '#080A0F';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('APH 630nm+450nm · 180 SENS', 42, 472);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  tex.needsUpdate = true;
  return tex;
}

export function createSpaceTextureSet(renderer?: THREE.WebGLRenderer): SpaceTextureSet {
  const maxAniso = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  const paddedWall = createPaddedWallMaps(maxAniso);
  const metalBulkhead = createMetalBulkheadMaps(maxAniso);
  const isogridFloor = createIsogridFloorMaps(maxAniso);
  const ceilingPanel = createCeilingPanelMaps(maxAniso);
  const bedFabric = createBedFabricMaps(maxAniso);
  const spaceBackdrop = createSpaceBackdropTexture(maxAniso);
  const medsGlassCockpit = createMedsCockpitTexture(maxAniso);
  const aphBotanicalRack = createAphBotanicalTexture(maxAniso);

  const disposeMaps = (m: PbrMaterialMaps) => {
    m.map.dispose();
    m.bumpMap.dispose();
    m.roughnessMap.dispose();
  };

  return {
    paddedWall,
    metalBulkhead,
    isogridFloor,
    ceilingPanel,
    bedFabric,
    spaceBackdrop,
    medsGlassCockpit,
    aphBotanicalRack,
    dispose: () => {
      disposeMaps(paddedWall);
      disposeMaps(metalBulkhead);
      disposeMaps(isogridFloor);
      disposeMaps(ceilingPanel);
      disposeMaps(bedFabric);
      spaceBackdrop.dispose();
      medsGlassCockpit.dispose();
      aphBotanicalRack.dispose();
    },
  };
}
