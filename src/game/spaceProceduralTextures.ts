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
  isprEclssRack: THREE.CanvasTexture;
  cbmHatchPanel: THREE.CanvasTexture;
  dispose: () => void;
}

// 4x4 Ordered Bayer matrix normalized [0..15] for crisp retro NASA Pixel Art shading
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

function makeCanvas(width: number, height = width): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(width);
  canvas.height = Math.floor(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context for procedural PBR textures');
  }
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

function pxRect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
}

function ditherRect(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  colA: string,
  colB: string,
  ratio: number,
  pixelSize = 1
): void {
  const ix0 = Math.floor(x0);
  const iy0 = Math.floor(y0);
  const iw = Math.floor(w);
  const ih = Math.floor(h);
  const step = Math.max(1, Math.floor(pixelSize));
  const threshold16 = Math.round(Math.max(0, Math.min(1, ratio)) * 16);
  for (let py = 0; py < ih; py += step) {
    const by = Math.floor(py / step) & 3;
    for (let px = 0; px < iw; px += step) {
      const bx = Math.floor(px / step) & 3;
      ctx.fillStyle = BAYER_4X4[by][bx] < threshold16 ? colB : colA;
      ctx.fillRect(ix0 + px, iy0 + py, step, step);
    }
  }
}

function pxCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
): void {
  const icx = Math.floor(cx);
  const icy = Math.floor(cy);
  const r = Math.floor(radius);
  const r2 = r * r;
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r2) {
        ctx.fillRect(icx + dx, icy + dy, 1, 1);
      }
    }
  }
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  repeatX: number,
  repeatY: number,
  _maxAnisotropy: number,
  clampEdge = false
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = clampEdge ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.wrapT = clampEdge ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Beta-Cloth NASA acoustic wall panels (128x128 Pixel Art, Bayer-dithered quilting, zero gradients)
function createPaddedWallMaps(aniso: number): PbrMaterialMaps {
  const S = 128;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  // Base Beta-Cloth NASA palette (#DDE5EE) + light Bayer weave
  ditherRect(xCol, 0, 0, S, S, '#dde5ee', '#cfd9e6', 0.25, 1);
  pxRect(xBmp, '#c8c8c8', 0, 0, S, S);
  pxRect(xRgh, '#d2d2d2', 0, 0, S, S);

  // Diamond Bayer acoustic quilt cushions (32x32 cells)
  const cell = 32;
  for (let gy = 0; gy < S; gy += cell) {
    for (let gx = 0; gx < S; gx += cell) {
      ditherRect(xCol, gx + 4, gy + 4, cell - 8, cell - 8, '#eef3f8', '#dde5ee', 0.35, 1);
      ditherRect(xBmp, gx + 4, gy + 4, cell - 8, cell - 8, '#ececec', '#c8c8c8', 0.3, 1);
      // Pixelated diamond seam stitch lines
      for (let d = 0; d < cell; d += 2) {
        pxRect(xCol, '#94a3b8', gx + d, gy + d, 1, 1);
        pxRect(xCol, '#94a3b8', gx + cell - 1 - d, gy + d, 1, 1);
        pxRect(xBmp, '#646464', gx + d, gy + d, 1, 1);
        pxRect(xBmp, '#646464', gx + cell - 1 - d, gy + d, 1, 1);
      }
      // Tufted fastener rivet in cell center
      pxRect(xCol, '#64748b', gx + cell / 2 - 1, gy + cell / 2 - 1, 3, 3);
      pxRect(xCol, '#cbd5e1', gx + cell / 2, gy + cell / 2, 1, 1);
      pxRect(xBmp, '#ffffff', gx + cell / 2 - 1, gy + cell / 2 - 1, 3, 3);
    }
  }

  // Structural ribs separating two 0.5m modules per 128px tile
  for (const rx of [0, 64]) {
    pxRect(xCol, '#1e293b', rx, 0, 4, S);
    pxRect(xCol, '#334155', rx + 4, 0, 2, S);
    pxRect(xBmp, '#505050', rx, 0, 5, S);
    pxRect(xRgh, '#686868', rx, 0, 5, S);
  }

  // Top Velcro + NASA utility rail (O2 green + 120VDC EVA orange/blue stripe)
  pxRect(xCol, '#334155', 0, 0, S, 7);
  pxRect(xCol, '#0b3d91', 0, 2, S, 2);
  pxRect(xCol, '#ff4f00', 0, 5, S, 1);

  // Scuff baseboard flange at bottom with EVA orange interlock blocks
  pxRect(xCol, '#0b3d91', 0, S - 12, S, 12);
  pxRect(xCol, '#dde5ee', 0, S - 13, S, 1);
  pxRect(xCol, '#ff4f00', 10, S - 8, 12, 3);
  pxRect(xCol, '#ff4f00', 74, S - 8, 12, 3);
  pxRect(xBmp, '#909090', 0, S - 12, S, 12);

  // Stencil module pixel markers ('04' & '06')
  pxRect(xCol, '#1e293b', 9, 10, 6, 8);
  pxRect(xCol, '#dde5ee', 11, 12, 2, 4);
  pxRect(xCol, '#1e293b', 73, 10, 6, 8);
  pxRect(xCol, '#dde5ee', 75, 12, 2, 4);

  return {
    map: finalizeTexture(cCol, true, 1, 1, aniso),
    bumpMap: finalizeTexture(cBmp, false, 1, 1, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 1, 1, aniso),
  };
}

// Machine Room Aluminum Bulkhead (128x128 Pixel Art, color-coded NASA pipe stripes O2/H2O/ATCS/120VDC)
function createMetalBulkheadMaps(aniso: number): PbrMaterialMaps {
  const S = 128;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  ditherRect(xCol, 0, 0, S, S, '#334155', '#1e293b', 0.35, 1);
  pxRect(xBmp, '#989898', 0, 0, S, S);
  pxRect(xRgh, '#686868', 0, 0, S, S);

  // Pixel horizontal metal grain bands
  for (let y = 0; y < S; y += 2) {
    if ((y * 7) % 5 === 0) {
      ditherRect(xCol, 0, y, S, 1, '#334155', '#475569', 0.45, 1);
    }
  }

  // Two stacked armored bulkhead cassettes with dark seams
  for (const py of [2, 66]) {
    pxRect(xCol, '#1e293b', 2, py, S - 4, 60);
    ditherRect(xCol, 4, py + 2, S - 8, 56, '#334155', '#475569', 0.25, 1);
    pxRect(xBmp, '#404040', 2, py, S - 4, 60);
    pxRect(xBmp, '#b4b4b4', 4, py + 2, S - 8, 56);
    // Corner hex rivets
    for (const [bx, by] of [
      [7, py + 5],
      [S - 9, py + 5],
      [7, py + 53],
      [S - 9, py + 53],
    ]) {
      pxRect(xCol, '#94a3b8', bx, by, 3, 3);
      pxRect(xBmp, '#ffffff', bx, by, 3, 3);
      pxRect(xRgh, '#303030', bx, by, 3, 3);
    }
  }

  // NASA coded utility pipe bundle along upper flange:
  // Green = O2 (OGA), Cyan = H2O (WRS), Amber = ATCS Ammonia, Orange = 120V DC MBSU/RPCM
  pxRect(xCol, '#0f172a', 12, 9, S - 24, 14);
  pxRect(xCol, '#22c55e', 14, 10, S - 28, 2); // O2 line
  pxRect(xCol, '#38bdf8', 14, 13, S - 28, 2); // Potable H2O line
  pxRect(xCol, '#f59e0b', 14, 16, S - 28, 2); // ATCS thermal loop
  pxRect(xCol, '#ff4f00', 14, 19, S - 28, 2); // 120V DC RPCM power bus
  pxRect(xBmp, '#dcdcdc', 12, 9, S - 24, 14);

  // Diagonal EVA hazard stripe at bottom flange
  for (let x = 0; x < S; x++) {
    for (let y = 0; y < 8; y++) {
      const band = Math.floor((x + y) / 8) % 2 === 0;
      pxRect(xCol, band ? '#ff4f00' : '#1e293b', x, S - 9 + y, 1, 1);
    }
  }

  return {
    map: finalizeTexture(cCol, true, 1, 1, aniso),
    bumpMap: finalizeTexture(cBmp, false, 1, 1, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 1, 1, aniso),
  };
}

// Perforated floor grate over under-deck O2/H2O/ATCS/120VDC subfloor conduits (128x128 Pixel Art)
function createIsogridFloorMaps(aniso: number): PbrMaterialMaps {
  const S = 128;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  // Deep subfloor bay revealing utility ducts underneath perforated floor tiles
  pxRect(xCol, '#0f172a', 0, 0, S, S);
  pxRect(xBmp, '#383838', 0, 0, S, S);
  pxRect(xRgh, '#999999', 0, 0, S, S);

  // Subfloor utility pipes visible through deck grating slots
  pxRect(xCol, '#0b3d91', 0, 22, S, 6);
  pxRect(xCol, '#0284c7', 0, 30, S, 4);
  pxRect(xCol, '#16a34a', 0, 86, S, 4);
  pxRect(xCol, '#ff4f00', 0, 94, S, 3);

  // 2x2 raised aluminum floor tiles (64x64 each)
  const half = S / 2;
  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const ox = gx * half;
      const oy = gy * half;
      pxRect(xCol, '#1e293b', ox + 1, oy + 1, half - 2, half - 2);
      ditherRect(xCol, ox + 2, oy + 2, half - 4, half - 4, '#334155', '#1e293b', 0.3, 1);
      pxRect(xBmp, '#b4b4b4', ox + 2, oy + 2, half - 4, half - 4);
      pxRect(xRgh, '#646464', ox + 2, oy + 2, half - 4, half - 4);

      // Perforated grate slots letting colored underfloor ducts peek through
      for (let sy = oy + 14; sy <= oy + half - 14; sy += 8) {
        for (let sx = ox + 8; sx <= ox + half - 14; sx += 10) {
          pxRect(xCol, '#0f172a', sx, sy, 6, 3);
          if (sy >= 20 && sy <= 34) pxRect(xCol, '#0284c7', sx + 1, sy + 1, 4, 1);
          if (sy >= 84 && sy <= 98) pxRect(xCol, sy < 90 ? '#22c55e' : '#ff4f00', sx + 1, sy + 1, 4, 1);
          pxRect(xBmp, '#303030', sx, sy, 6, 3);
        }
      }

      // Tie-down ring & blue seat-track alignment notch
      pxRect(xCol, '#475569', ox + half / 2 - 4, oy + half / 2 - 4, 8, 8);
      pxRect(xCol, '#1e293b', ox + half / 2 - 2, oy + half / 2 - 2, 4, 4);
      pxRect(xCol, '#38bdf8', ox + 4, oy + 4, 5, 2);
      pxRect(xCol, '#dde5ee', ox + half - 9, oy + half - 6, 5, 2);
    }
  }

  return {
    map: finalizeTexture(cCol, true, 4, 3.5, aniso),
    bumpMap: finalizeTexture(cBmp, false, 4, 3.5, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 4, 3.5, aniso),
  };
}

function createCeilingPanelMaps(aniso: number): PbrMaterialMaps {
  const S = 128;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  ditherRect(xCol, 0, 0, S, S, '#dde5ee', '#cbd5e1', 0.3, 1);
  pxRect(xBmp, '#c0c0c0', 0, 0, S, S);
  pxRect(xRgh, '#b4b4b4', 0, 0, S, S);

  // Crisp pixel structural grid ribs
  pxRect(xCol, '#334155', 0, 0, S, 3);
  pxRect(xCol, '#334155', 0, S - 3, S, 3);
  pxRect(xCol, '#334155', 0, 0, 3, S);
  pxRect(xCol, '#334155', S - 3, 0, 3, S);
  pxRect(xCol, '#475569', S / 2 - 1, 0, 2, S);
  pxRect(xCol, '#475569', 0, S / 2 - 1, S, 2);

  pxRect(xBmp, '#505050', 0, 0, S, 3);
  pxRect(xBmp, '#505050', S / 2 - 1, 0, 2, S);
  pxRect(xBmp, '#505050', 0, S / 2 - 1, S, 2);

  // Ventilation louver slats in quadrant 1
  for (let y = 10; y < 54; y += 5) {
    pxRect(xCol, '#475569', 10, y, 44, 2);
    pxRect(xBmp, '#383838', 10, y, 44, 2);
  }

  return {
    map: finalizeTexture(cCol, true, 3, 3, aniso),
    bumpMap: finalizeTexture(cBmp, false, 3, 3, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 3, 3, aniso),
  };
}

function createBedFabricMaps(aniso: number): PbrMaterialMaps {
  const S = 128;
  const [cCol, xCol] = makeCanvas(S);
  const [cBmp, xBmp] = makeCanvas(S);
  const [cRgh, xRgh] = makeCanvas(S);

  // NASA royal/slate quilted crew sleeping bag with Bayer 4x4 baffles
  pxRect(xCol, '#0b3d91', 0, 0, S, S);
  pxRect(xBmp, '#c8c8c8', 0, 0, S, S);
  pxRect(xRgh, '#dfdfdf', 0, 0, S, S);

  for (let y = 0; y < S; y += 16) {
    ditherRect(xCol, 0, y + 1, S, 6, '#0b3d91', '#1d4ed8', 0.45, 1);
    ditherRect(xCol, 0, y + 7, S, 8, '#1d4ed8', '#0b3d91', 0.35, 1);
    pxRect(xCol, '#0f172a', 0, y, S, 1);
    pxRect(xBmp, '#555555', 0, y, S, 2);
  }

  // Nylon zero-g restraint belt & NASA buckle
  pxRect(xCol, '#dde5ee', 0, S / 2 - 4, S, 8);
  pxRect(xCol, '#334155', S / 2 - 6, S / 2 - 6, 12, 12);
  pxRect(xCol, '#ff4f00', S / 2 - 2, S / 2 - 2, 4, 4);
  pxRect(xBmp, '#ffffff', S / 2 - 6, S / 2 - 6, 12, 12);

  return {
    map: finalizeTexture(cCol, true, 1, 1, aniso),
    bumpMap: finalizeTexture(cBmp, false, 1, 1, aniso),
    roughnessMap: finalizeTexture(cRgh, false, 1, 1, aniso),
  };
}

function createSpaceBackdropTexture(aniso: number): THREE.CanvasTexture {
  const W = 256;
  const H = 128;
  const [canvas, ctx] = makeCanvas(W, H);

  // Layered Bayer-dithered deep orbit gradient (no CanvasGradient)
  pxRect(ctx, '#020510', 0, 0, W, H);
  ditherRect(ctx, 0, 48, W, 38, '#020510', '#061229', 0.55, 2);
  ditherRect(ctx, 0, 86, W, 42, '#061229', '#0b1e3d', 0.65, 2);

  // Crisp 1px & 2px stars
  let seed = 42069;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 220; i++) {
    const sx = Math.floor(rand() * W);
    const sy = Math.floor(rand() * (H * 0.85));
    const sz = rand() < 0.14 ? 2 : 1;
    pxRect(ctx, rand() < 0.22 ? '#bae6fd' : '#dde5ee', sx, sy, sz, sz);
  }

  // Pixelated Blue Earth limb + stepped orbital atmosphere halo
  const limbX = Math.floor(W * 0.38);
  const limbY = Math.floor(H * 1.48);
  const limbR = Math.floor(H * 0.95);
  pxCircle(ctx, limbX, limbY, limbR + 7, '#0b3d91');
  pxCircle(ctx, limbX, limbY, limbR + 3, '#38bdf8');
  pxCircle(ctx, limbX, limbY, limbR, '#1d4ed8');
  // Earth cloud wisps in crisp pixel blocks
  for (let cx = 24; cx < 165; cx += 9) {
    const dy = Math.floor(H - 12 + Math.sin(cx * 0.14) * 5);
    if (dy < H) pxRect(ctx, '#dde5ee', cx, dy, 6, 2);
  }

  // Pixel Moon disc upper-right
  const mx = Math.floor(W * 0.78);
  const my = Math.floor(H * 0.28);
  pxCircle(ctx, mx, my, 10, '#334155');
  pxCircle(ctx, mx - 1, my - 1, 8, '#94a3b8');
  pxCircle(ctx, mx - 2, my - 2, 5, '#dde5ee');
  pxRect(ctx, '#64748b', mx + 2, my, 2, 2);
  pxRect(ctx, '#64748b', mx - 3, my + 2, 2, 1);

  return finalizeTexture(canvas, true, 1, 1, aniso, true);
}

function createMedsCockpitTexture(aniso: number): THREE.CanvasTexture {
  const W = 256;
  const H = 128;
  const [canvas, ctx] = makeCanvas(W, H);

  pxRect(ctx, '#334155', 0, 0, W, H);
  pxRect(ctx, '#1e293b', 3, 3, W - 6, H - 6);
  pxRect(ctx, '#dde5ee', 10, 6, 62, 6); // MEDS header tag
  pxRect(ctx, '#ff4f00', 78, 6, 20, 6);
  pxRect(ctx, '#0b3d91', W - 72, 6, 62, 6);

  // 5x2 NASA Glass Cockpit crisp pixel MFD displays
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const dx = 10 + col * 48;
      const dy = 18 + row * 52;
      pxRect(ctx, '#090d16', dx, dy, 44, 46);
      pxRect(ctx, '#0b3d91', dx + 2, dy + 2, 40, 42);
      // Artificial horizon / stepped orbital curve
      const traceCol = col === 2 && row === 0 ? '#ef4444' : '#38bdf8';
      pxRect(ctx, traceCol, dx + 5, dy + 24, 9, 2);
      pxRect(ctx, traceCol, dx + 13, dy + 17, 10, 2);
      pxRect(ctx, traceCol, dx + 22, dy + 21, 9, 2);
      pxRect(ctx, traceCol, dx + 30, dy + 12, 8, 2);
      // Telemetry bar readout + status square
      pxRect(ctx, '#dde5ee', dx + 5, dy + 34, 21, 4);
      pxRect(ctx, row === 1 && col >= 3 ? '#ff4f00' : '#22c55e', dx + 29, dy + 34, 10, 4);
    }
  }

  return finalizeTexture(canvas, true, 1, 1, aniso, true);
}

function createAphBotanicalTexture(aniso: number): THREE.CanvasTexture {
  const S = 128;
  const [canvas, ctx] = makeCanvas(S);

  pxRect(ctx, '#334155', 0, 0, S, S);
  pxRect(ctx, '#0b3d91', 4, 4, S - 8, S - 8);

  // 630nm + 450nm APH grow bay with Bayer 4x4 stepped spectral bands
  ditherRect(ctx, 10, 14, S - 20, 32, '#f0abfc', '#d946ef', 0.45, 1);
  ditherRect(ctx, 10, 46, S - 20, 34, '#d946ef', '#6b21a8', 0.55, 1);
  ditherRect(ctx, 10, 80, S - 20, 18, '#6b21a8', '#1e1b4b', 0.65, 1);

  // 5 Porous clay pillows + pixel dwarf tomato bushes + VEG-05 fruits
  for (let i = 0; i < 5; i++) {
    const px = 14 + i * 21;
    pxRect(ctx, '#64748b', px, 84, 15, 7);
    pxRect(ctx, '#dde5ee', px + 5, 80, 4, 4);
    pxCircle(ctx, px + 7, 70 - (i % 2) * 5, 7, '#15803d');
    pxCircle(ctx, px + 7, 68 - (i % 2) * 5, 4, '#22c55e');
    // VEG-05 crimson tomatoes
    pxRect(ctx, '#ef4444', px + 4, 70 - (i % 2) * 5, 2, 2);
    pxRect(ctx, '#ef4444', px + 9, 66 - (i % 2) * 5, 2, 2);
  }

  // White control plate + telemetry indicators
  pxRect(ctx, '#dde5ee', 6, 102, S - 12, 20);
  pxRect(ctx, '#0b3d91', 12, 108, 48, 5);
  pxRect(ctx, '#ff4f00', 68, 107, 6, 6);
  pxRect(ctx, '#ef4444', 78, 107, 6, 6);
  pxRect(ctx, '#22c55e', 88, 107, 6, 6);

  return finalizeTexture(canvas, true, 1, 1, aniso, true);
}

// Physical ISPR Rack texture (OGA / CDRA / Sabatier / WRS / MBSU-RPCM manifolds + dial gauges)
function createIsprEclssRackTexture(aniso: number): THREE.CanvasTexture {
  const W = 128;
  const H = 256;
  const [canvas, ctx] = makeCanvas(W, H);

  pxRect(ctx, '#1e293b', 0, 0, W, H);
  ditherRect(ctx, 4, 4, W - 8, H - 8, '#334155', '#1e293b', 0.35, 1);

  // Top ISPR header bar + latches
  pxRect(ctx, '#0b3d91', 6, 8, W - 12, 18);
  pxRect(ctx, '#dde5ee', 12, 14, 52, 5);
  pxRect(ctx, '#ff4f00', W - 26, 12, 14, 9);

  // 4 stacked instrumentation bays: Manometer Gauges, OGA/CDRA piping, RPCM breakers, LEDs
  for (let bay = 0; bay < 4; bay++) {
    const by = 32 + bay * 54;
    pxRect(ctx, '#0f172a', 8, by, W - 16, 48);
    pxRect(ctx, '#334155', 10, by + 2, W - 20, 44);

    // Circular pixel pressure manometer dial
    pxCircle(ctx, 26, by + 24, 11, '#090d16');
    pxCircle(ctx, 26, by + 24, 9, '#dde5ee');
    pxRect(ctx, '#ef4444', 26, by + 17, 2, 7); // kPa dial needle
    pxRect(ctx, '#1e293b', 25, by + 23, 3, 3);

    // 4 vertical breaker/valve rockers + LEDs
    for (let k = 0; k < 4; k++) {
      const kx = 46 + k * 17;
      pxRect(ctx, '#1e293b', kx, by + 14, 12, 22);
      pxRect(ctx, k === 2 && bay === 2 ? '#ff4f00' : '#22c55e', kx + 3, by + 8, 6, 4);
      pxRect(ctx, '#dde5ee', kx + 2, by + 18, 8, 9);
    }

    // Color-coded pipe bus across bay bottom
    const pipeCol = ['#22c55e', '#38bdf8', '#f59e0b', '#ff4f00'][bay];
    pxRect(ctx, pipeCol, 12, by + 40, W - 24, 4);
  }

  return finalizeTexture(canvas, true, 1, 1, aniso, true);
}

// ISS Common Berthing Mechanism (CBM) circular pressure hatch + handwheel (128x128 Pixel Art)
function createCbmHatchTexture(aniso: number): THREE.CanvasTexture {
  const S = 128;
  const [canvas, ctx] = makeCanvas(S);

  pxRect(ctx, '#1e293b', 0, 0, S, S);
  ditherRect(ctx, 3, 3, S - 6, S - 6, '#334155', '#1e293b', 0.25, 1);

  // Corner EVA caution stripes
  pxRect(ctx, '#ff4f00', 4, 4, 18, 5);
  pxRect(ctx, '#ff4f00', S - 22, 4, 18, 5);
  pxRect(ctx, '#ff4f00', 4, S - 9, 18, 5);
  pxRect(ctx, '#ff4f00', S - 22, S - 9, 18, 5);

  // Circular CBM hatch ring + radial latching lugs
  pxCircle(ctx, S / 2, S / 2, 52, '#0b3d91');
  pxCircle(ctx, S / 2, S / 2, 46, '#dde5ee');
  ditherRect(ctx, 26, 26, 76, 76, '#dde5ee', '#cbd5e1', 0.35, 1);

  // Clip / frame outer pixels cleanly back to ring
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x - S / 2;
      const dy = y - S / 2;
      const d = Math.hypot(dx, dy);
      if (d > 46 && d <= 52) pxRect(ctx, '#0b3d91', x, y, 1, 1);
      if (d > 52) {
        const checker = ((x >> 2) + (y >> 2)) % 2 === 0;
        pxRect(ctx, checker ? '#1e293b' : '#334155', x, y, 1, 1);
      }
    }
  }

  // 12 radial CBM perimeter bolts
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pxRect(ctx, '#1e293b', S / 2 + Math.cos(a) * 48 - 2, S / 2 + Math.sin(a) * 48 - 2, 4, 4);
  }

  // Center viewport + bright orange hatch handwheel
  pxCircle(ctx, S / 2, S / 2 - 16, 9, '#0b3d91');
  pxCircle(ctx, S / 2, S / 2 - 16, 6, '#38bdf8');
  pxCircle(ctx, S / 2, S / 2 + 12, 14, '#ff4f00');
  pxCircle(ctx, S / 2, S / 2 + 12, 8, '#dde5ee');
  pxRect(ctx, '#1e293b', S / 2 - 12, S / 2 + 11, 24, 3);
  pxRect(ctx, '#1e293b', S / 2 - 1, S / 2, 3, 24);

  return finalizeTexture(canvas, true, 1, 1, aniso, true);
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
  const isprEclssRack = createIsprEclssRackTexture(maxAniso);
  const cbmHatchPanel = createCbmHatchTexture(maxAniso);

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
    isprEclssRack,
    cbmHatchPanel,
    dispose: () => {
      disposeMaps(paddedWall);
      disposeMaps(metalBulkhead);
      disposeMaps(isogridFloor);
      disposeMaps(ceilingPanel);
      disposeMaps(bedFabric);
      spaceBackdrop.dispose();
      medsGlassCockpit.dispose();
      aphBotanicalRack.dispose();
      isprEclssRack.dispose();
      cbmHatchPanel.dispose();
    },
  };
}
