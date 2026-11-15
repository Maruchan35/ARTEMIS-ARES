import {
  Box2DM,
  FloorRectM,
  VERIFIED_LOWER_FLOORS,
  VERIFIED_LOWER_FURN,
  VERIFIED_LOWER_WALLS,
  VERIFIED_PAWN_COLLIDER,
  VERIFIED_PLAYER_STATS,
  VERIFIED_THROW_TYPES,
  VERIFIED_UPPER_FLOORS,
  VERIFIED_UPPER_WALLS,
} from '../data/lockdownVerifiedWorldData';

// =============================================================================
// AsyncTickPawn (Mec_C) & DA_PlayerStats Physics + Item Ballistics Module
// All units strictly in SI meters / seconds (UE5 cm / 100).
// =============================================================================

export type DeckZone = 'lobby' | 'station' | 'tuto';

export interface PlayerPhysicsState {
  x: number; // UE X (m)
  y: number; // UE Y (m)
  z: number; // UE Z up (m)
  vx: number;
  vy: number;
  vz: number;
  yawDeg: number; // 0 = +X, 90 = +Y
  pitchDeg: number; // -82..+82
  hp: number;
  stamina: number;
  exhausted: boolean;
  exhaustCooldown: number;
  grounded: boolean;
  crouching: boolean;
  sprinting: boolean;
  handsUp: boolean;
  stunTimer: number;
  speedBoostTier: 0 | 1 | 2 | 3; // DA_PlayerStats Speed 1/2/3
  slowTier: 0 | 1 | 2 | 3; // Heavy carry / injury Slow 1/2/3
  deck: DeckZone;
}

export interface PlayerMoveInput {
  forward: number; // -1..+1 (W/S)
  strafe: number; // -1..+1 (D/A)
  sprint: boolean;
  crouch: boolean;
  jumpPressed: boolean;
}

export interface ThrowProfile {
  speedMs: number;
  verticalMs: number;
  zOffsetM: number;
  restitution: number;
  radiusM: number;
  gravityMs2: number;
}

export interface WorldItemEntity {
  uid: string;
  itemKey: string; // e.g. 'DA_Battery', 'DA_Fuse', 'DA_Pistol', etc.
  category: 'gun' | 'melee' | 'utility' | 'task';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yawDeg: number;
  thrownByPlayer: boolean;
  charge: number; // 0..100 (battery/container/filter state)
  clean?: boolean;
  ammo?: number;
  screwsLeft?: number;
}

export const PAWN_CONSTANTS = {
  asyncDeltaSec: VERIFIED_PAWN_COLLIDER.asyncDeltaSec, // 0.0025s
  capsuleRadiusM: VERIFIED_PAWN_COLLIDER.bodyCapsuleRadiusCm / 100, // 0.40m
  collisionRadiusM: 0.34, // slightly inset inside 40cm outer capsule so 90cm corridors glide smoothly
  capsuleHalfHeightM: VERIFIED_PAWN_COLLIDER.bodyCapsuleHalfHeightCm / 100, // 0.70m
  cameraFovDeg: VERIFIED_PAWN_COLLIDER.cameraFovDeg, // 103 deg
  eyeHeightStandingM: VERIFIED_PAWN_COLLIDER.cameraRelZCm / 100, // 1.60m
  eyeHeightCrouchingM: 1.02,
  walkSpeedMs: VERIFIED_PLAYER_STATS.defaultSpeedCm / 100, // 6.0 m/s
  speedTiersMs: VERIFIED_PLAYER_STATS.speedTiersCm.map((v) => v / 100), // [7.0, 8.0, 10.0]
  slowTiersMs: VERIFIED_PLAYER_STATS.slowTiersCm.map((v) => v / 100), // [5.0, 4.0, 2.0]
  maxHp: VERIFIED_PLAYER_STATS.maxHp, // 100
  jumpVelocityMs: 4.85,
  gravityMs2: 10.0, // DA_Drop_* Gravity: -1000 cm/s²
} as const;

export function createInitialPlayerState(
  x: number,
  y: number,
  z: number,
  yawDeg: number,
  deck: DeckZone
): PlayerPhysicsState {
  return {
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    yawDeg,
    pitchDeg: 0,
    hp: PAWN_CONSTANTS.maxHp,
    stamina: 100,
    exhausted: false,
    exhaustCooldown: 0,
    grounded: true,
    crouching: false,
    sprinting: false,
    handsUp: false,
    stunTimer: 0,
    speedBoostTier: 0,
    slowTier: 0,
    deck,
  };
}

export function getThrowProfile(itemKey: string): ThrowProfile {
  let key: keyof typeof VERIFIED_THROW_TYPES = 'DA_Drop_Little';
  if (itemKey.includes('Sample') || itemKey.includes('Container')) key = 'DA_Drop_Sample';
  else if (itemKey.includes('Gaz') || itemKey.includes('Bottle')) key = 'DA_Drop_Gaz';
  else if (itemKey.includes('Rice') || itemKey.includes('Pizzushi') || itemKey.includes('Fish')) key = 'DA_Drop_Rice';
  else if (itemKey.includes('Package')) key = 'DA_Drop_Package';
  else if (itemKey.includes('Rifle') || itemKey.includes('Shotgun') || itemKey.includes('SMG')) key = 'DA_Drop_Rifles';
  else if (itemKey.includes('Pistol') || itemKey.includes('Revolver') || itemKey.includes('Shorty')) key = 'DA_Drop_Guns';

  const raw = VERIFIED_THROW_TYPES[key];
  return {
    speedMs: raw.throwForce / 100,
    verticalMs: raw.verticalForce / 100,
    zOffsetM: raw.verticalOffset / 100,
    restitution: raw.restitution,
    radiusM: raw.radius / 100,
    gravityMs2: Math.abs(raw.gravity) / 100,
  };
}

function getDeckColliders(deck: DeckZone): Box2DM[] {
  if (deck === 'lobby') return VERIFIED_UPPER_WALLS;
  if (deck === 'station') return [...VERIFIED_LOWER_WALLS, ...VERIFIED_LOWER_FURN];
  // TutoRoom perimeter box around [41..119m, 172..215m]
  return [
    [40.0, 171.5, 4.9, 120.0, 172.0, 8.9, 'TutoWall_S'],
    [40.0, 214.0, 4.9, 120.0, 214.5, 8.9, 'TutoWall_N'],
    [40.0, 172.0, 4.9, 40.5, 214.5, 8.9, 'TutoWall_W'],
    [119.5, 172.0, 4.9, 120.0, 214.5, 8.9, 'TutoWall_E'],
  ];
}

function getDeckBaseZ(deck: DeckZone): number {
  return deck === 'station' ? 0.0 : 5.0;
}

export function resolveCircleVsBoxes(
  x: number,
  y: number,
  z: number,
  radius: number,
  colliders: Box2DM[],
  extraBlockers: Box2DM[] = []
): [number, number] {
  let px = x;
  let py = y;
  const footZ = z + 0.18;
  const headZ = z + 1.55;
  const all = extraBlockers.length > 0 ? [...colliders, ...extraBlockers] : colliders;

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < all.length; i++) {
      const b = all[i];
      if (b[5] < footZ || b[2] > headZ) continue;
      // Closest point on AABB to circle center
      const cx = px < b[0] ? b[0] : px > b[3] ? b[3] : px;
      const cy = py < b[1] ? b[1] : py > b[4] ? b[4] : py;
      const dx = px - cx;
      const dy = py - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 >= radius * radius) continue;

      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        const push = radius - d;
        px += (dx / d) * push;
        py += (dy / d) * push;
      } else {
        // Center strictly inside AABB: push out along nearest edge
        const toMinX = Math.abs(px - b[0]);
        const toMaxX = Math.abs(b[3] - px);
        const toMinY = Math.abs(py - b[1]);
        const toMaxY = Math.abs(b[4] - py);
        const minEdge = Math.min(toMinX, toMaxX, toMinY, toMaxY);
        if (minEdge === toMinX) px = b[0] - radius;
        else if (minEdge === toMaxX) px = b[3] + radius;
        else if (minEdge === toMinY) py = b[1] - radius;
        else py = b[4] + radius;
      }
    }
  }
  return [px, py];
}

export function stepPlayerAsyncTick(
  state: PlayerPhysicsState,
  input: PlayerMoveInput,
  dtSec: number,
  extraBlockers: Box2DM[] = []
): PlayerPhysicsState {
  const next = { ...state };
  const clampedDt = Math.min(0.05, Math.max(0.001, dtSec));
  // Fixed-step AsyncTickPawn accumulation (0.0025s nominal; aggregate to <= 8 substeps per render frame for browser efficiency)
  const subCount = Math.min(8, Math.max(1, Math.round(clampedDt / (PAWN_CONSTANTS.asyncDeltaSec * 2))));
  const h = clampedDt / subCount;
  const colliders = getDeckColliders(next.deck);
  const floorZ = getDeckBaseZ(next.deck);

  if (next.stunTimer > 0) {
    next.stunTimer = Math.max(0, next.stunTimer - clampedDt);
  }
  if (next.exhaustCooldown > 0) {
    next.exhaustCooldown = Math.max(0, next.exhaustCooldown - clampedDt);
    if (next.exhaustCooldown === 0 && next.stamina >= 25) {
      next.exhausted = false;
    }
  }

  // Compute movement speed from DA_PlayerStats tiers
  const movingInput = Math.abs(input.forward) > 0.05 || Math.abs(input.strafe) > 0.05;
  const canSprint = input.sprint && !input.crouch && !next.exhausted && !next.handsUp && movingInput && next.stamina > 2;
  next.sprinting = canSprint;
  next.crouching = input.crouch;

  let targetSpeed = PAWN_CONSTANTS.walkSpeedMs;
  if (next.stunTimer > 0) {
    targetSpeed = PAWN_CONSTANTS.slowTiersMs[2]; // 2.0 m/s stunned
  } else if (next.slowTier > 0) {
    targetSpeed = PAWN_CONSTANTS.slowTiersMs[next.slowTier - 1];
  } else if (input.crouch || next.handsUp) {
    targetSpeed = PAWN_CONSTANTS.slowTiersMs[1]; // 4.0 m/s
  } else if (canSprint) {
    targetSpeed = next.speedBoostTier > 0
      ? PAWN_CONSTANTS.speedTiersMs[next.speedBoostTier - 1]
      : PAWN_CONSTANTS.speedTiersMs[1]; // 8.0 m/s standard sprint
  }

  // Stamina update using DA_PlayerStats Run Cost (5) / Min-Max Regen (10..40) / Exhaust CD (-1.5s)
  if (canSprint) {
    next.stamina = Math.max(0, next.stamina - 22 * clampedDt);
    if (next.stamina <= 0.5) {
      next.exhausted = true;
      next.exhaustCooldown = Math.abs(VERIFIED_PLAYER_STATS.exhaustCd); // 1.5s
    }
  } else {
    const regenRate = movingInput ? VERIFIED_PLAYER_STATS.minRegen * 1.4 : VERIFIED_PLAYER_STATS.maxRegen * 0.7;
    next.stamina = Math.min(100, next.stamina + regenRate * clampedDt);
    if (next.exhausted && next.exhaustCooldown <= 0 && next.stamina >= 25) {
      next.exhausted = false;
    }
  }

  // Passive HP regeneration per DA_PlayerStats.regenHpSpeed (only minor recovery above threshold)
  if (next.hp > 0 && next.hp < PAWN_CONSTANTS.maxHp && next.stamina > 60) {
    next.hp = Math.min(PAWN_CONSTANTS.maxHp, next.hp + VERIFIED_PLAYER_STATS.regenHpSpeed * 0.25 * clampedDt);
  }

  // Forward / right unit vectors from UE5 yawDeg (0 = +X, 90 = +Y)
  const yawRad = (next.yawDeg * Math.PI) / 180;
  const fx = Math.cos(yawRad);
  const fy = Math.sin(yawRad);
  const rx = -fy;
  const ry = fx;

  let wantVx = fx * input.forward + rx * input.strafe;
  let wantVy = fy * input.forward + ry * input.strafe;
  const mag = Math.hypot(wantVx, wantVy);
  if (mag > 1e-4) {
    wantVx = (wantVx / mag) * targetSpeed;
    wantVy = (wantVy / mag) * targetSpeed;
  } else {
    wantVx = 0;
    wantVy = 0;
  }

  if (input.jumpPressed && next.grounded && next.stamina >= VERIFIED_PLAYER_STATS.jumpStamina) {
    next.vz = PAWN_CONSTANTS.jumpVelocityMs;
    next.grounded = false;
    next.stamina = Math.max(0, next.stamina - VERIFIED_PLAYER_STATS.jumpStamina);
  }

  for (let s = 0; s < subCount; s++) {
    // High-responsiveness ground acceleration, damped air control
    const accelAlpha = next.grounded ? Math.min(1, h * 18) : Math.min(1, h * 5);
    next.vx += (wantVx - next.vx) * accelAlpha;
    next.vy += (wantVy - next.vy) * accelAlpha;

    const candX = next.x + next.vx * h;
    const candY = next.y + next.vy * h;
    const [rxPos, ryPos] = resolveCircleVsBoxes(
      candX,
      candY,
      next.z,
      PAWN_CONSTANTS.collisionRadiusM,
      colliders,
      extraBlockers
    );
    next.x = rxPos;
    next.y = ryPos;

    if (!next.grounded || next.vz > 0) {
      next.vz -= PAWN_CONSTANTS.gravityMs2 * h;
      next.z += next.vz * h;
      if (next.z <= floorZ) {
        // Apply fallStamina impact penalty if falling fast (>6 m/s)
        const fallSpeed = Math.abs(next.vz);
        if (fallSpeed > 6.0) {
          const tier = Math.min(VERIFIED_PLAYER_STATS.fallStamina.length - 1, Math.floor((fallSpeed - 5.0) * 1.2));
          next.stamina = Math.max(0, next.stamina - VERIFIED_PLAYER_STATS.fallStamina[tier]);
        }
        next.z = floorZ;
        next.vz = 0;
        next.grounded = true;
      }
    } else {
      next.z = floorZ;
    }

    // Clamp softly within playable deck bounds so escaping out-of-bounds is impossible
    if (next.deck === 'station') {
      next.x = Math.max(17.5, Math.min(117.5, next.x));
      next.y = Math.max(15.5, Math.min(121.5, next.y));
    } else if (next.deck === 'lobby') {
      next.x = Math.max(19.0, Math.min(117.5, next.x));
      next.y = Math.max(96.5, Math.min(152.0, next.y));
    } else {
      next.x = Math.max(41.0, Math.min(119.0, next.x));
      next.y = Math.max(172.5, Math.min(213.5, next.y));
    }
  }

  return next;
}

export function stepWorldItems(
  items: WorldItemEntity[],
  deck: DeckZone,
  dtSec: number,
  extraBlockers: Box2DM[] = []
): WorldItemEntity[] {
  const colliders = getDeckColliders(deck);
  const floorZ = getDeckBaseZ(deck);
  const dt = Math.min(0.05, dtSec);
  let changed = false;

  const updated = items.map((it) => {
    const moving = Math.abs(it.vx) > 0.03 || Math.abs(it.vy) > 0.03 || Math.abs(it.vz) > 0.03 || it.z > floorZ + 0.05;
    if (!moving) return it;
    changed = true;
    const prof = getThrowProfile(it.itemKey);
    let nx = it.x + it.vx * dt;
    let ny = it.y + it.vy * dt;
    let nz = it.z + it.vz * dt;
    let nvx = it.vx;
    let nvy = it.vy;
    let nvz = it.vz - prof.gravityMs2 * dt;

    const [px, py] = resolveCircleVsBoxes(nx, ny, nz, prof.radiusM, colliders, extraBlockers);
    if (Math.abs(px - nx) > 0.002) nvx = -nvx * prof.restitution;
    if (Math.abs(py - ny) > 0.002) nvy = -nvy * prof.restitution;
    nx = px;
    ny = py;

    if (nz <= floorZ + 0.04) {
      nz = floorZ + 0.04;
      if (Math.abs(nvz) > 0.6) {
        nvz = -nvz * prof.restitution;
        nvx *= 0.8;
        nvy *= 0.8;
      } else {
        nvz = 0;
        nvx *= 0.65;
        nvy *= 0.65;
      }
    }

    if (Math.hypot(nvx, nvy) < 0.05 && nvz === 0 && nz <= floorZ + 0.05) {
      nvx = 0;
      nvy = 0;
    }
    return { ...it, x: nx, y: ny, z: nz, vx: nvx, vy: nvy, vz: nvz };
  });

  return changed ? updated : items;
}

/**
 * Ray-AABB intersection in UE5 meters (used for hitscan guns and wall occlusion checks).
 * Returns distance in meters to closest wall hit, or `maxDistM` if clear.
 */
export function raycastColliders(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDistM: number,
  deck: DeckZone,
  extraBlockers: Box2DM[] = []
): number {
  const colliders = getDeckColliders(deck);
  const all = extraBlockers.length > 0 ? [...colliders, ...extraBlockers] : colliders;
  let closest = maxDistM;

  for (let i = 0; i < all.length; i++) {
    const b = all[i];
    let tmin = 0;
    let tmax = closest;

    const axes: [number, number, number, number][] = [
      [ox, dx, b[0], b[3]],
      [oy, dy, b[1], b[4]],
      [oz, dz, b[2], b[5]],
    ];
    let hit = true;
    for (let a = 0; a < 3; a++) {
      const [o, d, bmin, bmax] = axes[a];
      if (Math.abs(d) < 1e-6) {
        if (o < bmin || o > bmax) {
          hit = false;
          break;
        }
      } else {
        let t1 = (bmin - o) / d;
        let t2 = (bmax - o) / d;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
        }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) {
          hit = false;
          break;
        }
      }
    }
    if (hit && tmin >= 0 && tmin < closest) {
      closest = tmin;
    }
  }
  return closest;
}

/**
 * Exact `W_MapPlayer_C` affine projection verified from memory:
 * Location X [2550..11550] -> Result X [576..-515]
 * Location Y [2750..11950] -> Result Y [-564..551]
 * Returns both raw UMG widget pixel offset (`umgX, umgY` in [-600..+600])
 * AND normalized 0..1 coordinates (`uNorm, vNorm`) for 2D Tactical Canvas minimap.
 */
export function projectWorldToPlayerMap(worldXM: number, worldYM: number): {
  umgX: number;
  umgY: number;
  uNorm: number;
  vNorm: number;
} {
  const { locX, locY, resX, resY } = VERIFIED_PLAYER_STATS.playerMapAnchors;
  const xCm = worldXM * 100;
  const yCm = worldYM * 100;
  const tx = (xCm - locX[0]) / (locX[1] - locX[0]);
  const ty = (yCm - locY[0]) / (locY[1] - locY[0]);
  const umgX = resX[0] + tx * (resX[1] - resX[0]);
  const umgY = resY[0] + ty * (resY[1] - resY[0]);
  // Normalize UMG [-600..+600] into [0..1] canvas coordinates
  return {
    umgX,
    umgY,
    uNorm: (umgX + 600) / 1200,
    vNorm: (umgY + 600) / 1200,
  };
}

/**
 * Resolve floor height helper for external queries.
 */
export function isPointOnWalkableFloor(worldXM: number, worldYM: number, deck: DeckZone): boolean {
  if (deck === 'tuto') return worldXM >= 40 && worldXM <= 120 && worldYM >= 172 && worldYM <= 214.5;
  const floors: FloorRectM[] = deck === 'lobby' ? VERIFIED_UPPER_FLOORS : VERIFIED_LOWER_FLOORS;
  return floors.some((f) => worldXM >= f[0] - 0.5 && worldXM <= f[2] + 0.5 && worldYM >= f[1] - 0.5 && worldYM <= f[3] + 0.5);
}
