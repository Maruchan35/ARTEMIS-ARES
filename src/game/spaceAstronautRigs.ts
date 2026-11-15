import * as THREE from 'three';
import { SUIT_COLORS, VISOR_FACES } from '../data/lockdownProtocolBlueprintCatalog';

export interface ChibiAstronautRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  eyeL: THREE.Mesh;
  eyeR: THREE.Mesh;
  shoulderL: THREE.Group;
  forearmL: THREE.Group;
  shoulderR: THREE.Group;
  forearmR: THREE.Group;
  handRMount: THREE.Group;
  hipL: THREE.Group;
  calfL: THREE.Group;
  hipR: THREE.Group;
  calfR: THREE.Group;
  heldKey: string | null;
}

export interface ChibiAnimParams {
  timeSec: number;
  moveSpeedMs: number;
  sprinting: boolean;
  grounded: boolean;
  interactPulse: number;
  usePulse: number;
  sleeping: boolean;
  heldItemKey: string | null;
  waveMode?: boolean;
  crouching?: boolean;
  exercising?: boolean;
}

export interface FirstPersonHandsRig {
  root: THREE.Group;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  leftIndexFinger: THREE.Group;
  leftCurlFingers: THREE.Group[];
  rightCurlFingers: THREE.Group[];
  heldItemMount: THREE.Group;
  heldKey: string | null;
  swayX: number;
  swayY: number;
  walkPhase: number;
}

export interface FirstPersonHandsAnimParams {
  timeSec: number;
  dt: number;
  moveSpeedMs: number;
  sprinting: boolean;
  crouching: boolean;
  yawDeltaDeg: number;
  pitchDeltaDeg: number;
  reachPulse: number; // 0..1 when pressing button/bed/station
  usePulse: number; // 0..1 when twisting screwdriver / using / throwing
  swapPulse: number; // 0..1 when swapping hand <-> bag
  consumePulse?: number; // 0..1 when drinking / eating toward helmet
  exercising?: boolean;
  heldItemKey: string | null;
}

function stdMat(color: number | string, roughness = 0.45, metalness = 0.2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function basicMat(color: number | string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color });
}

/**
 * Rich multi-part 3D NASA hardware & survival item models (workbench pickups, floor drops, and 1P/3P hand grips).
 */
export function createDetailedItemMesh(itemKey: string): THREE.Group {
  const g = new THREE.Group();

  if (itemKey === 'DA_ScrewDriver') {
    // Ergonomic ribbed EVA torque driver with collar, magnetic bit, and torque LED
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.022, 0.145, 14), stdMat(0xd97706, 0.42, 0.15));
    handle.rotation.x = Math.PI / 2;
    const gripBand = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.055, 14), stdMat(0x0f2547, 0.72, 0.1));
    gripBand.rotation.x = Math.PI / 2;
    gripBand.position.z = 0.01;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.027, 0.028, 14), stdMat(0x1e293b, 0.35, 0.65));
    collar.rotation.x = Math.PI / 2;
    collar.position.z = -0.072;
    const torqueLed = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.018), basicMat(0x22c55e));
    torqueLed.position.set(0, 0.029, -0.072);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.18, 12), stdMat(0xf1f5f9, 0.18, 0.92));
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = -0.165;
    const tipA = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.005, 0.032), stdMat(0x64748b, 0.25, 0.9));
    tipA.position.z = -0.26;
    const tipB = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.018, 0.032), stdMat(0x64748b, 0.25, 0.9));
    tipB.position.z = -0.26;
    g.add(handle, gripBand, collar, torqueLed, shaft, tipA, tipB);
    return g;
  }

  if (itemKey === 'DA_Battery') {
    // NASA Li-Ion pack with thermal cooling fins, bail handle, copper terminals & 3-bar LED gauge
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.22, 18), stdMat(0x0f2547, 0.38, 0.42));
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.071, 0.071, 0.12, 18), stdMat(0x16a34a, 0.4, 0.25));
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.073, 0.034, 18), stdMat(0x1e293b, 0.35, 0.78));
    capTop.position.y = 0.11;
    const capBot = capTop.clone();
    capBot.position.y = -0.11;
    const finRing = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.006, 8, 18), stdMat(0x94a3b8, 0.25, 0.85));
    finRing.rotation.x = Math.PI / 2;
    finRing.position.y = 0.07;
    const posTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.028, 12), stdMat(0xfacc15, 0.2, 0.92));
    posTerm.position.set(0.022, 0.135, 0);
    const negTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.028, 12), stdMat(0xd93025, 0.25, 0.7));
    negTerm.position.set(-0.022, 0.135, 0);
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.032, 0.016), basicMat(0x4ade80));
    bar1.position.set(0, 0.036, 0.068);
    const bar2 = bar1.clone();
    bar2.position.y = 0;
    const bar3 = bar1.clone();
    bar3.position.y = -0.036;
    g.add(body, sleeve, capTop, capBot, finRing, posTerm, negTerm, bar1, bar2, bar3);
    return g;
  }

  if (itemKey === 'DA_Fuse' || itemKey === 'DA_EmergencyFuse') {
    // High-voltage glass fuse with glowing helical core, copper ferrules, and crimson danger collar
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.145, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.48, roughness: 0.12, metalness: 0.1 })
    );
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 12), basicMat(0xfacc15));
    const helix = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 6, 14), basicMat(0xfef08a));
    helix.rotation.x = Math.PI / 2;
    const endA = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.050, 0.042, 16), stdMat(0xd97706, 0.22, 0.88));
    endA.position.y = 0.085;
    const endB = endA.clone();
    endB.position.y = -0.085;
    const redBand = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.016, 16), basicMat(0xd93025));
    redBand.position.y = 0.056;
    g.add(glass, core, helix, endA, endB, redBand);
    return g;
  }

  if (itemKey === 'DA_VentFilter') {
    // 7.0 kg NASA LiOH Cartridge with perforated canister mesh, sealing gasket, crimson valve & tag
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.095, 0.22), stdMat(0x94a3b8, 0.4, 0.72));
    const gasket = new THREE.Mesh(new THREE.BoxGeometry(0.272, 0.022, 0.232), stdMat(0x080a0f, 0.75, 0.1));
    gasket.position.y = -0.03;
    const pleatCore = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.105, 0.18), stdMat(0xe2e8f0, 0.55, 0.2));
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.235), stdMat(0x0f2547, 0.45, 0.4));
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.032, 12), basicMat(0xd93025));
    valve.position.set(0.085, 0.058, 0.06);
    g.add(shell, gasket, pleatCore, latch, valve);
    return g;
  }

  if (itemKey === 'DA_Rice') {
    // NASA Freeze-Dried Pouch (0.80 kg BVAD) with septum port, foil rim & navy/red stripe
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.215, 0.058), stdMat(0xf4f6f8, 0.45, 0.25));
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.062), stdMat(0x0f2547, 0.4, 0.2));
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.038, 12), stdMat(0x7a8288, 0.3, 0.8));
    port.position.set(0.04, 0.115, 0);
    const seal = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.022, 0.065), basicMat(0xd93025));
    seal.position.y = 0.082;
    g.add(pouch, label, port, seal);
    return g;
  }

  if (itemKey === 'DA_Fish' || itemKey === 'DA_WaterPouch' || itemKey === 'DA_WaterJar') {
    // NASA 1.0 L Potable EVA Hydration Bag with bite valve, straw & blue graduated gauge
    const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.072, 0.20, 14), stdMat(0x0284c7, 0.28, 0.25));
    bag.scale.z = 0.62;
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.024, 0.092), stdMat(0x0f2547, 0.4, 0.5));
    clamp.position.y = 0.095;
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.012, 0.075, 10), stdMat(0xf8fafc, 0.3, 0.1));
    straw.position.set(0.015, 0.132, 0);
    const biteValve = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.024, 10), basicMat(0xd93025));
    biteValve.position.set(0.015, 0.168, 0);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.055, 0.094), basicMat(0x38bdf8));
    g.add(bag, clamp, straw, biteValve, band);
    return g;
  }

  if (itemKey === 'DA_Pizzushi' || itemKey === 'DA_CookedRice') {
    // Thermal ISS Galley Meal Tray with snap utensil clip & hot food cells
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.20), stdMat(0x0f2547, 0.35, 0.65));
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.258, 0.012, 0.208), stdMat(0x94a3b8, 0.25, 0.85));
    rim.position.y = 0.016;
    const mealA = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.032, 14), stdMat(0xd93025, 0.45, 0.1));
    mealA.position.set(-0.045, 0.026, 0);
    const mealB = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.026, 0.115), stdMat(0xfef08a, 0.45, 0.1));
    mealB.position.set(0.06, 0.024, 0);
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.01, 0.14), stdMat(0xe2e8f0, 0.2, 0.9));
    fork.position.set(0.06, 0.04, 0.06);
    g.add(tray, rim, mealA, mealB, fork);
    return g;
  }

  if (itemKey === 'DA_Sample' || itemKey === 'DA_ClayPillow') {
    // APH / VEG-05 Porous Clay Pillow & Dwarf Tomato Botanical Specimen
    const pot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.065, 0.13), stdMat(0x7a8288, 0.72, 0.15));
    pot.position.y = -0.055;
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.05, 10), stdMat(0xcbd5e1, 0.8, 0.05));
    wick.position.y = -0.012;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.10, 8), stdMat(0x16a34a, 0.5, 0.05));
    stem.position.y = 0.035;
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.052, 0), stdMat(0x22c55e, 0.6, 0.05));
    canopy.position.y = 0.085;
    const tom1 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), basicMat(0xd93025));
    tom1.position.set(0.035, 0.075, 0.028);
    const tom2 = tom1.clone();
    tom2.position.set(-0.032, 0.095, 0.025);
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.072, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0xf0abfc, transparent: true, opacity: 0.28, roughness: 0.1 })
    );
    glass.position.y = 0.02;
    g.add(pot, wick, stem, canopy, tom1, tom2, glass);
    return g;
  }

  if (itemKey === 'DA_DuctTapeKit') {
    // Apollo 13 / Skylab improvised LiOH duct-tape + cardboard square + hose adapter
    const tapeRoll = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.026, 12, 20), stdMat(0x94a3b8, 0.35, 0.35));
    tapeRoll.rotation.x = Math.PI / 2;
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.054, 14), stdMat(0x78350f, 0.8, 0.05));
    const adapter = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.11), stdMat(0xd6d3d1, 0.85, 0.05));
    adapter.position.y = -0.045;
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), basicMat(0xd93025));
    clip.position.set(0.06, 0.02, 0);
    g.add(tapeRoll, core, adapter, clip);
    return g;
  }

  if (itemKey === 'DA_RegolithSample') {
    // Sealed 300 g/cm² compacted regolith core canister
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.18, 16), stdMat(0x64748b, 0.4, 0.75));
    const dustCore = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.11, 16), stdMat(0x475569, 0.95, 0.05));
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 16), basicMat(0xd93025));
    seal.position.y = 0.075;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.028, 16), stdMat(0x0f2547, 0.35, 0.6));
    cap.position.y = -0.09;
    g.add(tube, dustCore, seal, cap);
    return g;
  }

  if (itemKey === 'DA_TorqueWrench') {
    // NASA EVA Ratchet Torque Wrench with digital N·m dial and socket head
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.024, 0.28), stdMat(0xe2e8f0, 0.22, 0.92));
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.024, 0.11, 14), stdMat(0x0f2547, 0.65, 0.15));
    grip.rotation.x = Math.PI / 2;
    grip.position.z = 0.085;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.042, 16), stdMat(0x64748b, 0.25, 0.9));
    head.position.z = -0.145;
    const dial = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.045), basicMat(0x22c55e));
    dial.position.set(0, 0.016, -0.02);
    g.add(beam, grip, head, dial);
    return g;
  }

  if (itemKey === 'DA_FireExtinguisher') {
    // ISS Portable Fire Extinguisher (PFE) 2.7 kg CO2 cylinder + nozzle cone
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.28, 16), stdMat(0xd93025, 0.32, 0.45));
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.055, 14), stdMat(0xe2e8f0, 0.25, 0.85));
    neck.position.y = 0.165;
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.11, 14), stdMat(0x18181b, 0.7, 0.1));
    horn.rotation.x = -Math.PI / 2;
    horn.position.set(0.045, 0.15, -0.085);
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 12), basicMat(0x4ade80));
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0, 0.16, 0.04);
    g.add(tank, neck, horn, gauge);
    return g;
  }

  if (itemKey === 'DA_PbaMask') {
    // ISS Portable Breathing Apparatus (PBA) 15-min O2 bottle + sealed hood
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 14), stdMat(0xf1f5f9, 0.45, 0.15));
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.075, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, transparent: true, opacity: 0.72, roughness: 0.12, metalness: 0.35 })
    );
    visor.position.set(0, 0.015, -0.065);
    const o2Bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.14, 12), stdMat(0x16a34a, 0.3, 0.7));
    o2Bottle.rotation.z = Math.PI / 2;
    o2Bottle.position.set(0, -0.085, 0);
    g.add(hood, visor, o2Bottle);
    return g;
  }

  if (itemKey === 'DA_CryoValve') {
    // SLS/Orion RS-25 Cryogenic LOX/LH2 Solenoid Seal & Valve Core
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.16, 16), stdMat(0x94a3b8, 0.25, 0.88));
    const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 10, 18), stdMat(0xf59e0b, 0.35, 0.4));
    handwheel.rotation.x = Math.PI / 2;
    handwheel.position.y = 0.095;
    const cryoStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.061, 0.061, 0.032, 16), basicMat(0x38bdf8));
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.022, 16), stdMat(0x1e293b, 0.35, 0.8));
    flange.position.y = -0.068;
    g.add(body, handwheel, cryoStripe, flange);
    return g;
  }

  if (itemKey === 'DA_FlightPlanCard') {
    // Apollo 13 Flight Plan cardboard cover used to build the Mailbox CO2 adapter
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.24), stdMat(0xe2e8f0, 0.72, 0.05));
    const diagram = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.16), basicMat(0x0b3d91));
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.03), basicMat(0xff4f00));
    tab.position.set(0.04, 0, -0.09);
    g.add(card, diagram, tab);
    return g;
  }

  if (itemKey === 'DA_SuitHose') {
    // Coiled lunar suit & O2 umbilical hose
    const coilA = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.018, 8, 16), stdMat(0x334155, 0.65, 0.25));
    coilA.rotation.x = Math.PI / 2;
    const couplerL = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.05, 10), stdMat(0x38bdf8, 0.35, 0.75));
    couplerL.position.set(-0.082, 0.015, 0);
    const couplerR = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.05, 10), stdMat(0xff4f00, 0.35, 0.75));
    couplerR.position.set(0.082, 0.015, 0);
    g.add(coilA, couplerL, couplerR);
    return g;
  }

  if (itemKey === 'DA_DuctTapeKit') {
    // NASA Apollo grey duct tape roll + plastic bag
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.052, 16), stdMat(0x94a3b8, 0.55, 0.2));
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.056, 12), stdMat(0x1e293b, 0.7, 0.1));
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.12), stdMat(0xcbd5e1, 0.3, 0.1));
    bag.position.set(0, -0.036, 0);
    g.add(outer, core, bag);
    return g;
  }

  if (itemKey === 'DA_MailboxAdapter') {
    // Assembled Apollo 13 square LiOH canister "Mailbox" contraption
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), stdMat(0xe2e8f0, 0.5, 0.25));
    const tapeBand = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 0.19), stdMat(0x64748b, 0.55, 0.2));
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.12, 12), stdMat(0x334155, 0.6, 0.3));
    snout.rotation.z = Math.PI / 2;
    snout.position.set(0.12, 0, 0);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.02), basicMat(0x22c55e));
    grille.position.set(0, 0, -0.092);
    g.add(box, tapeBand, snout, grille);
    return g;
  }

  if (itemKey === 'DA_CufflinkKit') {
    // STS-120 5 improvised aluminum + Kapton-wrapped hinge cufflinks on EVA tether ring
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.024, 0.13), stdMat(0x1e293b, 0.45, 0.65));
    for (let i = 0; i < 5; i++) {
      const link = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.045, 0.06), stdMat(0xe2e8f0, 0.25, 0.85));
      link.position.set(-0.068 + i * 0.034, 0.026, 0);
      const kapton = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.062), basicMat(0xf59e0b));
      kapton.position.set(-0.068 + i * 0.034, 0.026, 0);
      g.add(link, kapton);
    }
    g.add(tray);
    return g;
  }

  if (itemKey === 'DA_InsulatedCutter') {
    // High-voltage Kapton/polyurethane insulated EVA shears (160V DC P6-4B safe)
    const gripL = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.12, 0.026), stdMat(0xf59e0b, 0.4, 0.1));
    gripL.position.set(-0.022, -0.04, 0);
    gripL.rotation.z = -0.18;
    const gripR = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.12, 0.026), stdMat(0xff4f00, 0.4, 0.1));
    gripR.position.set(0.022, -0.04, 0);
    gripR.rotation.z = 0.18;
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.085, 0.016), stdMat(0xcbd5e1, 0.22, 0.9));
    jaw.position.set(0, 0.055, 0);
    g.add(gripL, gripR, jaw);
    return g;
  }

  if (itemKey === 'DA_WaterPouch') {
    // ISS WRS/PWA potable drink pouch with straw valve
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.045), stdMat(0xe2e8f0, 0.28, 0.55));
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, 0.048), basicMat(0x0284c7));
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.065, 8), basicMat(0x38bdf8));
    straw.position.set(0.025, 0.105, 0);
    g.add(pouch, label, straw);
    return g;
  }

  if (itemKey === 'DA_LegacyTablet') {
    // Glowing blue Legacy Note / SPACE PAPER electronic tablet
    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.022), stdMat(0x1e293b, 0.35, 0.75));
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.20, 0.024), basicMat(0x38bdf8));
    const redMark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.026), basicMat(0xd93025));
    redMark.position.set(-0.04, 0.075, 0);
    g.add(casing, screen, redMark);
    return g;
  }

  // DA_AccessCard / Commander Pass fallback
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.092), stdMat(0xf4f6f8, 0.3, 0.35));
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.016, 0.026), basicMat(0x0f2547));
  stripe.position.z = -0.02;
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.017, 0.022), basicMat(0xd93025));
  badge.position.set(0.045, 0, 0.022);
  g.add(card, stripe, badge);
  return g;
}

/**
 * Articulated Friendly Chibi Astronaut (LOCKDOWN Protocol inspired proportions:
 * chunky helmet + expressive visor eyes, DCM chest unit, twin-tank PLSS pack,
 * shoulder/elbow/wrist arms with thumbs + hip/knee/boot legs).
 */
export function createChibiAstronautRig(suitColorIdx: number, visorFaceIdx: number): ChibiAstronautRig {
  const suit = SUIT_COLORS[suitColorIdx % SUIT_COLORS.length];
  const face = VISOR_FACES[visorFaceIdx % VISOR_FACES.length];

  const primaryMat = stdMat(suit.primaryHex, 0.42, 0.14);
  const accentMat = stdMat(suit.accentHex, 0.46, 0.25);
  const jointMat = stdMat(0x334155, 0.65, 0.2);
  const metalMat = stdMat(0x94a3b8, 0.28, 0.8);
  const whiteTrimMat = stdMat(0xe2e8f0, 0.45, 0.18);
  const bootMat = stdMat(0x1e293b, 0.72, 0.22);

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.60;
  root.add(hips);

  // Pelvis belt
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.16, 16), accentMat);
  pelvis.castShadow = true;
  hips.add(pelvis);

  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.14), metalMat);
  beltBuckle.position.set(0.24, 0, 0);
  hips.add(beltBuckle);

  // Torso group attached at hip base
  const torso = new THREE.Group();
  torso.position.y = 0.06;
  hips.add(torso);

  const chestMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.265, 0.30, 8, 16), primaryMat);
  chestMesh.position.y = 0.28;
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torso.add(chestMesh);

  // Neck metallic ring
  const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.036, 10, 22), metalMat);
  neckRing.rotation.x = Math.PI / 2;
  neckRing.position.y = 0.56;
  torso.add(neckRing);

  // Chest DCM Control Box (+X forward)
  const dcm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.17, 0.22), whiteTrimMat);
  dcm.position.set(0.25, 0.32, 0);
  const dcmBtnA = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.05), basicMat(0x38bdf8));
  dcmBtnA.position.set(0.292, 0.35, -0.05);
  const dcmBtnB = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.05), basicMat(0x22c55e));
  dcmBtnB.position.set(0.292, 0.35, 0.04);
  const dcmBar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.14), basicMat(0xf59e0b));
  dcmBar.position.set(0.292, 0.28, 0);
  torso.add(dcm, dcmBtnA, dcmBtnB, dcmBar);

  // PLSS Backpack (-X rear) with twin O2 bottles
  const plssBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.38), whiteTrimMat);
  plssBody.position.set(-0.27, 0.31, 0);
  plssBody.castShadow = true;
  const tankGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.36, 14);
  const tankL = new THREE.Mesh(tankGeo, metalMat);
  tankL.position.set(-0.36, 0.30, -0.10);
  const tankR = tankL.clone();
  tankR.position.z = 0.10;
  const plssLed = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.04), basicMat(0x38bdf8));
  plssLed.position.set(-0.395, 0.33, 0);
  torso.add(plssBody, tankL, tankR, plssLed);

  // Helmet & Expressive Visor (big charming chibi head)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.59;
  torso.add(headGroup);

  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), whiteTrimMat);
  helmetShell.position.y = 0.24;
  helmetShell.castShadow = true;
  helmetShell.receiveShadow = true;
  headGroup.add(helmetShell);

  // Accent stripe along top crest of helmet
  const crest = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.032, 8, 22, Math.PI), primaryMat);
  crest.position.y = 0.24;
  headGroup.add(crest);

  // Side comms pods & tiny antenna
  const earGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.06, 14);
  const earL = new THREE.Mesh(earGeo, accentMat);
  earL.rotation.x = Math.PI / 2;
  earL.position.set(-0.02, 0.23, -0.34);
  const earR = earL.clone();
  earR.position.z = 0.34;
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.16, 8), metalMat);
  antenna.position.set(-0.04, 0.39, 0.33);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), basicMat(0x38bdf8));
  antTip.position.set(-0.04, 0.47, 0.33);
  headGroup.add(earL, earR, antenna, antTip);

  // Dark glossy curved visor (+X)
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: suit.visorTintHex,
    roughness: 0.12,
    metalness: 0.65,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const visorDome = new THREE.Mesh(new THREE.SphereGeometry(0.285, 22, 16), visorMat);
  visorDome.scale.set(0.62, 0.72, 0.94);
  visorDome.position.set(0.18, 0.23, 0);
  headGroup.add(visorDome);

  // Expressive Visor Eyes driven by VISOR_FACES
  const eyeColor =
    face.expression === 'cheeky'
      ? 0xfacc15
      : face.expression === 'starry'
      ? 0xf472b6
      : face.expression === 'cool'
      ? 0x22d3ee
      : face.expression === 'determined'
      ? 0xf97316
      : 0x38bdf8;
  const eyeGeo =
    face.expression === 'cool'
      ? new THREE.BoxGeometry(0.03, 0.045, 0.09)
      : new THREE.SphereGeometry(0.038, 12, 10);
  const eyeL = new THREE.Mesh(eyeGeo, basicMat(eyeColor));
  eyeL.position.set(0.335, 0.255, -0.09);
  eyeL.scale.set(0.45, face.expression === 'sleepy' ? 0.55 : 1.15, 1.0);
  const eyeR = eyeL.clone();
  eyeR.position.z = 0.09;
  headGroup.add(eyeL, eyeR);

  // Helper to construct Left (-1) and Right (+1) Articulated Arms
  const buildArm = (sideSign: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.02, 0.44, sideSign * 0.31);
    torso.add(shoulder);

    const shBall = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), jointMat);
    shoulder.add(shBall);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.18, 6, 12), primaryMat);
    upperArm.position.y = -0.13;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const forearm = new THREE.Group();
    forearm.position.y = -0.27;
    shoulder.add(forearm);

    const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), jointMat);
    forearm.add(elbowBall);

    const lowerArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.17, 6, 12), primaryMat);
    lowerArm.position.y = -0.13;
    lowerArm.castShadow = true;
    forearm.add(lowerArm);

    const wristRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.016, 8, 16), metalMat);
    wristRing.rotation.x = Math.PI / 2;
    wristRing.position.y = -0.24;
    forearm.add(wristRing);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), accentMat);
    glove.scale.set(1.1, 1.0, 0.9);
    glove.position.set(0.02, -0.30, 0);
    forearm.add(glove);

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.05, 4, 8), accentMat);
    thumb.position.set(0.06, -0.28, -sideSign * 0.055);
    thumb.rotation.z = -0.45;
    forearm.add(thumb);

    const mount = new THREE.Group();
    mount.position.set(0.07, -0.31, 0);
    forearm.add(mount);

    return { shoulder, forearm, mount };
  };

  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Helper to construct Left (-1) and Right (+1) Articulated Legs
  const buildLeg = (sideSign: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(0, -0.06, sideSign * 0.145);
    hips.add(hip);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.19, 6, 12), primaryMat);
    thigh.position.y = -0.15;
    thigh.castShadow = true;
    hip.add(thigh);

    const calf = new THREE.Group();
    calf.position.y = -0.28;
    hip.add(calf);

    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.13), jointMat);
    kneePad.position.set(0.06, 0, 0);
    calf.add(kneePad);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.17, 6, 12), whiteTrimMat);
    shin.position.y = -0.14;
    shin.castShadow = true;
    calf.add(shin);

    const bootMain = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.11, 0.16), bootMat);
    bootMain.position.set(0.05, -0.27, 0);
    bootMain.castShadow = true;
    const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.032, 0.175), metalMat);
    bootSole.position.set(0.05, -0.32, 0);
    calf.add(bootMain, bootSole);

    return { hip, calf };
  };

  const legL = buildLeg(-1);
  const legR = buildLeg(1);

  return {
    root,
    hips,
    torso,
    headGroup,
    eyeL,
    eyeR,
    shoulderL: armL.shoulder,
    forearmL: armL.forearm,
    shoulderR: armR.shoulder,
    forearmR: armR.forearm,
    handRMount: armR.mount,
    hipL: legL.hip,
    calfL: legL.calf,
    hipR: legR.hip,
    calfR: legR.calf,
    heldKey: null,
  };
}

export function updateChibiAstronautRig(rig: ChibiAstronautRig, params: ChibiAnimParams): void {
  const { timeSec, moveSpeedMs, sprinting, grounded, interactPulse, usePulse, sleeping, heldItemKey, waveMode, crouching } =
    params;

  // Sync held 3D item in right hand
  if (rig.heldKey !== heldItemKey) {
    rig.heldKey = heldItemKey;
    rig.handRMount.clear();
    if (heldItemKey) {
      const m = createDetailedItemMesh(heldItemKey);
      m.rotation.set(0.4, 0, Math.PI / 2);
      rig.handRMount.add(m);
    }
  }

  // Periodic automatic eye blink
  const blinkCycle = timeSec % 3.6;
  const eyeY = blinkCycle > 3.44 ? 0.12 : sleeping ? 0.25 : 1.05;
  rig.eyeL.scale.y = eyeY;
  rig.eyeR.scale.y = eyeY;

  if (sleeping) {
    // Resting flat pose for bunk sleep cycle
    rig.root.rotation.set(0, 0, Math.PI / 2);
    rig.hips.position.y = 0.60;
    rig.torso.rotation.set(0, 0, 0);
    rig.headGroup.rotation.set(0, 0, 0.08);
    rig.shoulderL.rotation.set(0, 0, 0.15);
    rig.forearmL.rotation.set(0, 0, 0.4);
    rig.shoulderR.rotation.set(0, 0, 0.15);
    rig.forearmR.rotation.set(0, 0, 0.4);
    rig.hipL.rotation.set(0, 0, 0);
    rig.hipR.rotation.set(0, 0, 0);
    rig.calfL.rotation.set(0, 0, 0);
    rig.calfR.rotation.set(0, 0, 0);
    return;
  }

  rig.root.rotation.z = 0;

  if (waveMode) {
    // Cheerful menu showcase pose: friendly wave with right arm + breathing
    const breath = Math.sin(timeSec * 2.4) * 0.015;
    rig.hips.position.y = 0.60 + breath;
    rig.torso.rotation.set(0, Math.sin(timeSec * 0.9) * 0.06, 0);
    rig.headGroup.rotation.set(Math.sin(timeSec * 1.4) * 0.04, Math.sin(timeSec * 0.8) * 0.12, 0.04);

    rig.shoulderL.rotation.set(0.08, 0, 0.12);
    rig.forearmL.rotation.set(0, 0, 0.25);

    rig.shoulderR.rotation.set(-2.35 + Math.sin(timeSec * 5.2) * 0.22, 0, 0.25);
    rig.forearmR.rotation.set(-0.35 + Math.sin(timeSec * 5.2) * 0.20, 0, 0.35);

    rig.hipL.rotation.set(0, 0, 0.04);
    rig.hipR.rotation.set(0, 0, -0.04);
    rig.calfL.rotation.set(0, 0, 0);
    rig.calfR.rotation.set(0, 0, 0);
    return;
  }

  const effSpeed = params.exercising ? 6.2 : moveSpeedMs;
  const speedNorm = Math.min(1.4, effSpeed / 6.0);
  const strideFreq = sprinting || params.exercising ? 13.4 : 8.8;
  const stridePhase = timeSec * strideFreq;
  const swing = speedNorm * Math.sin(stridePhase);
  const crouchDrop = crouching ? -0.18 : 0;

  // Vertical gait bounce & organic torso lean
  const bounce = speedNorm > 0.06 && grounded ? Math.abs(Math.sin(stridePhase)) * 0.06 * speedNorm : Math.sin(timeSec * 2.2) * 0.014;
  rig.hips.position.y = 0.60 + bounce + crouchDrop;
  rig.torso.rotation.set(0, swing * 0.085, -0.065 * speedNorm - (crouching ? 0.22 : 0));
  rig.headGroup.rotation.set(Math.sin(timeSec * 1.1) * 0.025, -swing * 0.045, crouching ? 0.14 : 0.03 * speedNorm);

  // Legs (axis Z rotation swings limbs forward +X / backward -X!)
  const legSwing = grounded ? swing * 0.78 : -0.25;
  rig.hipL.rotation.set(0, 0, legSwing);
  rig.hipR.rotation.set(0, 0, -legSwing);
  rig.calfL.rotation.set(0, 0, grounded ? -Math.max(0, -Math.cos(stridePhase)) * 0.62 * speedNorm : -0.4);
  rig.calfR.rotation.set(0, 0, grounded ? -Math.max(0, Math.cos(stridePhase)) * 0.62 * speedNorm : -0.2);

  // Left arm: swings opposite right leg, or reaches forward (+Z rot -> +X) during interactPulse
  const interactArm = Math.sin(interactPulse * Math.PI);
  rig.shoulderL.rotation.set(-0.14 * interactArm, 0, -legSwing * 0.85 + interactArm * 1.15);
  rig.forearmL.rotation.set(0, 0, 0.32 + Math.max(0, swing) * 0.28 + interactArm * 0.35);

  // Right arm: swings with walk, raises slightly when carrying an item, twists & thrusts on usePulse
  const carryRaise = heldItemKey ? 0.76 : 0;
  const useSwing = Math.sin(usePulse * Math.PI) * 0.68;
  rig.shoulderR.rotation.set(
    heldItemKey ? 0.16 + Math.sin(usePulse * Math.PI * 2) * 0.25 : 0,
    0,
    (heldItemKey ? 0.16 : legSwing * 0.85) + carryRaise + useSwing
  );
  rig.forearmR.rotation.set(0, 0, heldItemKey ? 0.72 + Math.sin(usePulse * Math.PI) * 0.25 : 0.32 + Math.max(0, -swing) * 0.28);
}

/**
 * Dual-Hand First-Person Viewmodel attached cleanly to Camera.
 * Built with segmented forearms, crimson mission cuffs, metallic EVA disconnect rings,
 * padded palms, thumbs, and 2-phalanx articulated 4-finger groups.
 */
export function createFirstPersonHandsRig(suitColorIdx: number): FirstPersonHandsRig {
  const suit = SUIT_COLORS[suitColorIdx % SUIT_COLORS.length];
  const sleeveMat = stdMat(suit.primaryHex, 0.45, 0.12);
  const gloveMat = stdMat(suit.accentHex, 0.42, 0.25);
  const fingerTipMat = stdMat(0xf4f6f8, 0.35, 0.28);
  const ringMat = stdMat(0x94a3b8, 0.25, 0.85);
  const crimsonMat = basicMat(0xd93025);
  const ledMat = basicMat(0x38bdf8);

  const root = new THREE.Group();

  const buildFpArm = (sideSign: -1 | 1) => {
    const shoulder = new THREE.Group();
    const handGroup = new THREE.Group();
    shoulder.add(handGroup);

    // Forearm receding toward viewer (+Z is behind camera) + crimson mission stripe cuff
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.054, 0.26, 6, 12), sleeveMat);
    forearm.rotation.x = Math.PI / 2;
    forearm.position.set(0, -0.01, 0.15);
    handGroup.add(forearm);

    const crimsonBand = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.018, 16), crimsonMat);
    crimsonBand.rotation.x = Math.PI / 2;
    crimsonBand.position.set(0, -0.006, 0.055);
    handGroup.add(crimsonBand);

    // Metallic EVA wrist disconnect collar + status LED
    const wristRing = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.011, 8, 18), ringMat);
    wristRing.position.set(0, 0, 0.01);
    handGroup.add(wristRing);

    const wristLed = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.022), ledMat);
    wristLed.position.set(-sideSign * 0.02, 0.056, 0.02);
    handGroup.add(wristLed);

    // Padded glove palm + knuckle armor facing forward (-Z)
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.044, 0.095), gloveMat);
    palm.position.set(0, 0.002, -0.055);
    handGroup.add(palm);

    const knuckleBar = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.016, 0.022), stdMat(0x0f2547, 0.35, 0.5));
    knuckleBar.position.set(0, 0.024, -0.092);
    handGroup.add(knuckleBar);

    // Thumb angled inward toward center of screen
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.048, 4, 8), fingerTipMat);
    thumb.position.set(-sideSign * 0.052, 0.01, -0.068);
    thumb.rotation.set(Math.PI / 2.6, sideSign * 0.45, 0);
    handGroup.add(thumb);

    // 4 Articulated 2-phalanx finger groups extending -Z from palm
    const fingers: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const fPivot = new THREE.Group();
      const offsetX = (-0.03 + i * 0.02) * sideSign;
      fPivot.position.set(offsetX, 0.006, -0.098);

      const proximalLen = i === 1 || i === 2 ? 0.034 : 0.028;
      const prox = new THREE.Mesh(new THREE.CapsuleGeometry(0.0115, proximalLen, 4, 8), fingerTipMat);
      prox.rotation.x = Math.PI / 2;
      prox.position.set(0, 0, -proximalLen * 0.55);

      const distal = new THREE.Mesh(new THREE.CapsuleGeometry(0.010, 0.022, 4, 8), gloveMat);
      distal.rotation.x = Math.PI / 2.1;
      distal.position.set(0, -0.003, -proximalLen - 0.016);

      fPivot.add(prox, distal);
      handGroup.add(fPivot);
      fingers.push(fPivot);
    }

    return { shoulder, handGroup, fingers };
  };

  const left = buildFpArm(-1);
  const right = buildFpArm(1);

  left.shoulder.position.set(-0.26, -0.23, -0.38);
  right.shoulder.position.set(0.27, -0.22, -0.38);

  const heldItemMount = new THREE.Group();
  heldItemMount.position.set(-0.02, 0.045, -0.105);
  right.handGroup.add(heldItemMount);

  root.add(left.shoulder, right.shoulder);

  return {
    root,
    leftShoulder: left.shoulder,
    rightShoulder: right.shoulder,
    leftHand: left.handGroup,
    rightHand: right.handGroup,
    leftIndexFinger: left.fingers[0],
    leftCurlFingers: left.fingers,
    rightCurlFingers: right.fingers,
    heldItemMount,
    heldKey: null,
    swayX: 0,
    swayY: 0,
    walkPhase: 0,
  };
}

export function updateFirstPersonHandsRig(rig: FirstPersonHandsRig, params: FirstPersonHandsAnimParams): void {
  const {
    timeSec,
    dt,
    moveSpeedMs,
    sprinting,
    crouching,
    yawDeltaDeg,
    pitchDeltaDeg,
    reachPulse,
    usePulse,
    swapPulse,
    consumePulse = 0,
    exercising = false,
    heldItemKey,
  } = params;

  // Swap 3D held mesh cleanly when inventory Hand changes
  if (rig.heldKey !== heldItemKey) {
    rig.heldKey = heldItemKey;
    rig.heldItemMount.clear();
    if (heldItemKey) {
      const m = createDetailedItemMesh(heldItemKey);
      m.scale.setScalar(0.95);
      m.rotation.set(0.25, -0.35, 0.18);
      rig.heldItemMount.add(m);
    }
  }

  // Advance locomotion swing phase proportionally to travel speed or treadmill sprint
  const effSpeed = exercising ? 6.5 : moveSpeedMs;
  const speedRatio = Math.min(1.5, effSpeed / 6.0);
  if (speedRatio > 0.05) {
    rig.walkPhase += dt * (sprinting || exercising ? 12.8 : 8.8) * Math.max(0.55, speedRatio);
  }

  // Smooth spring-damped look inertia sway
  const targetSwayX = Math.max(-0.055, Math.min(0.055, -yawDeltaDeg * 0.0048));
  const targetSwayY = Math.max(-0.05, Math.min(0.05, pitchDeltaDeg * 0.0048));
  const swayAlpha = Math.min(1, dt * 11);
  rig.swayX += (targetSwayX - rig.swayX) * swayAlpha;
  rig.swayY += (targetSwayY - rig.swayY) * swayAlpha;

  const idleBreathY = Math.sin(timeSec * 2.1) * 0.010;
  const idleBreathX = Math.cos(timeSec * 1.4) * 0.007;

  // Pronounced figure-eight arm pumping on walk / sprint / treadmill
  const pumpAmpY = 0.042 * speedRatio;
  const pumpAmpZ = 0.058 * speedRatio;
  const leftSwingSin = Math.sin(rig.walkPhase);
  const rightSwingSin = Math.sin(rig.walkPhase + Math.PI);

  const reachCurve = Math.sin(reachPulse * Math.PI);
  const useCurve = Math.sin(usePulse * Math.PI);
  const swapCurve = Math.sin(swapPulse * Math.PI);
  const consumeCurve = Math.sin(consumePulse * Math.PI);
  const crouchShift = crouching ? 0.03 : 0;

  // Apply Left Hand transform (reaches out to press cockpit switches, bed, buttons, valves)
  rig.leftShoulder.position.set(
    -0.25 + rig.swayX * 0.9 - idleBreathX + reachCurve * 0.17,
    -0.22 + rig.swayY + idleBreathY + Math.abs(leftSwingSin) * pumpAmpY + reachCurve * 0.12 - crouchShift - swapCurve * 0.16,
    -0.38 + leftSwingSin * pumpAmpZ - reachCurve * 0.24
  );
  rig.leftHand.rotation.set(
    0.16 + leftSwingSin * 0.26 * speedRatio + reachCurve * 0.18,
    0.18 + rig.swayX * 2.1 - reachCurve * 0.24,
    -0.18 - reachCurve * 0.14
  );

  // Curl / extend Left phalanges cleanly (index extends stiffly when pushing buttons)
  rig.leftCurlFingers.forEach((f, idx) => {
    const isIndex = idx === 0;
    const baseAngle = -0.18 + Math.sin(timeSec * 2.1 + idx * 0.35) * 0.05;
    if (isIndex && reachCurve > 0.05) {
      f.rotation.x = 0.06 * reachCurve;
    } else {
      f.rotation.x = baseAngle - reachCurve * 0.85;
    }
  });

  // Apply Right Hand transform (tool grip, screwdriver twist, or drink/eat gesture toward helmet)
  const holdBiasX = heldItemKey ? -0.045 : 0;
  const holdBiasY = heldItemKey ? 0.032 : 0;
  const holdBiasZ = heldItemKey ? -0.058 : 0;
  const isTwistTool = heldItemKey === 'DA_ScrewDriver' || heldItemKey === 'DA_DuctTapeKit';
  const twistRoll = isTwistTool ? Math.sin(usePulse * Math.PI * 2.0) * 0.72 : useCurve * 0.48;

  rig.rightShoulder.position.set(
    0.26 + rig.swayX * 0.9 + idleBreathX + holdBiasX - useCurve * 0.065 - consumeCurve * 0.14,
    -0.21 +
      rig.swayY +
      idleBreathY +
      Math.abs(rightSwingSin) * pumpAmpY +
      holdBiasY +
      useCurve * 0.06 +
      consumeCurve * 0.16 -
      crouchShift -
      swapCurve * 0.18,
    -0.37 + rightSwingSin * pumpAmpZ + holdBiasZ - useCurve * 0.16 + consumeCurve * 0.08
  );
  rig.rightHand.rotation.set(
    0.15 + rightSwingSin * 0.26 * speedRatio + (heldItemKey ? 0.22 : 0) - useCurve * 0.55 + consumeCurve * 0.45,
    -0.22 + rig.swayX * 2.1 + (heldItemKey ? 0.28 : 0) + consumeCurve * 0.4,
    0.20 + twistRoll
  );

  // Curl Right phalanges firmly around gripped tool
  rig.rightCurlFingers.forEach((f, idx) => {
    const gripOffset = heldItemKey ? -0.92 : -0.18 + Math.sin(timeSec * 2.1 + idx * 0.35) * 0.05;
    f.rotation.x = gripOffset;
  });
}
