// =============================================================================
// VERIFIED UE5 RUNTIME & GEOMETRY EXTRACT — LOCKDOWN PROTOCOL (Build 0)
// Generated via REA Frida runtime inspection from LockdownProtocol-Win64-Shipping.exe
// Coordinates converted strictly from UE5 centimeters (/100) -> meters [X, Y_northsouth, Z_up]
// =============================================================================

export type Box2DM = [minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, src: string];
export type FloorRectM = [minX: number, minY: number, maxX: number, maxY: number, zone: string];
export interface VerifiedActor { n: string; p: [number, number, number]; yaw: number; pitch?: number; sector?: number; }

export const VERIFIED_SECTOR_NAMES: readonly string[] = [
  'Camera', 'Bureau', 'Botanic', 'Resto', 'Hopital', 'Stockage', 'Machine', 'Center'
] as const;

export const VERIFIED_MPC_SECTORS = [
  {
    "name": "Camera",
    "val": 0.1
  },
  {
    "name": "Bureau",
    "val": 0.1
  },
  {
    "name": "Botanic",
    "val": 0.1
  },
  {
    "name": "Resto",
    "val": 0.1
  },
  {
    "name": "Hopital",
    "val": 0.1
  },
  {
    "name": "Stockage",
    "val": 0.1
  },
  {
    "name": "Machine",
    "val": 0.1
  }
] as const;

export const VERIFIED_PAWN_COLLIDER = {
  "class": "Mec_C (AsyncTickPawn)",
  "asyncDeltaSec": 0.0025,
  "rootSphereRadiusCm": 10,
  "bodyCapsuleHalfHeightCm": 70,
  "bodyCapsuleRadiusCm": 40,
  "bodyCapsuleRelZCm": 115,
  "headSphereRadiusCm": 40,
  "headSphereRelZCm": 145,
  "cameraFovDeg": 103,
  "cameraRelZCm": 160,
  "centerOfMassZCm": 86.6667,
  "baseEyeHeightCm": 64
} as const;

export const VERIFIED_PLAYER_STATS = {
  "defaultSpeedCm": 600,
  "speedTiersCm": [
    700,
    800,
    1000
  ],
  "slowTiersCm": [
    500,
    400,
    200
  ],
  "maxHp": 100,
  "bodyArmor": [
    5,
    5,
    9
  ],
  "headArmor": [
    0,
    0,
    0
  ],
  "weakness": [
    0,
    0,
    0
  ],
  "runCost": 5,
  "minRegen": 10,
  "maxRegen": 40,
  "regenHpSpeed": 2,
  "jumpStamina": 20,
  "fallStamina": [
    0,
    10,
    30,
    60,
    100,
    190,
    1000
  ],
  "lightCd": -0.1,
  "exhaustCd": -1.5,
  "debugHealHit": 10,
  "debugStaminaHit": 10,
  "debugStun": 0.5,
  "playerMapAnchors": {
    "locX": [
      2550,
      11550
    ],
    "locY": [
      2750,
      11950
    ],
    "resX": [
      576,
      -515
    ],
    "resY": [
      -564,
      551
    ]
  }
} as const;

export const VERIFIED_GUNS = {
  "DA_Pistol": {
    "id": "DA_Pistol",
    "damage": 5,
    "crit": 10,
    "staminaDamage": 30,
    "critStamina": 50,
    "fireRate": 0.15,
    "auto": false,
    "capacity": 12,
    "stun": 0.5,
    "staminaUsage": 8,
    "canInventory": true,
    "standPrecision": 0,
    "walkPrecision": 0.1,
    "runPrecision": 2,
    "airPrecision": 6,
    "recoilSpread": 0.5,
    "recoilElevation": 0.5,
    "jumpFactor": 1,
    "handling": 100,
    "throwForce": 1000,
    "throwType": "DA_Drop_Guns (Data_ItemThrowType_C)",
    "useName": "FIRE"
  },
  "DA_Revolver": {
    "id": "DA_Revolver",
    "damage": 25,
    "crit": 75,
    "staminaDamage": 25,
    "critStamina": 25,
    "fireRate": 0.4,
    "auto": false,
    "capacity": 6,
    "stun": 0.3,
    "staminaUsage": 15,
    "canInventory": true,
    "standPrecision": 0,
    "walkPrecision": 1.5,
    "runPrecision": 4,
    "airPrecision": 8,
    "recoilSpread": 3,
    "recoilElevation": 4,
    "jumpFactor": 1,
    "handling": 80,
    "throwForce": 1000,
    "throwType": "DA_Drop_Guns (Data_ItemThrowType_C)",
    "useName": "FIRE"
  },
  "DA_Rifle": {
    "id": "DA_Rifle",
    "damage": 20,
    "crit": 40,
    "staminaDamage": 10,
    "critStamina": 10,
    "fireRate": 0.12,
    "auto": true,
    "capacity": 20,
    "stun": 0.2,
    "staminaUsage": 5,
    "canInventory": false,
    "standPrecision": 0,
    "walkPrecision": 1,
    "runPrecision": 3,
    "airPrecision": 7,
    "recoilSpread": 0.4,
    "recoilElevation": 1,
    "jumpFactor": 1,
    "handling": 40,
    "throwForce": 1000,
    "throwType": "DA_Drop_Rifles (Data_ItemThrowType_C)",
    "useName": "FIRE"
  },
  "DA_Shorty": {
    "id": "DA_Shorty",
    "damage": 2,
    "crit": 15,
    "staminaDamage": 4,
    "critStamina": 15,
    "fireRate": 0.4,
    "auto": false,
    "capacity": 4,
    "stun": -0.025,
    "staminaUsage": 25,
    "canInventory": true,
    "standPrecision": 20,
    "walkPrecision": 30,
    "runPrecision": 40,
    "airPrecision": 0.6,
    "recoilSpread": 0.2,
    "recoilElevation": 10,
    "jumpFactor": 2,
    "handling": 60,
    "throwForce": 1000,
    "throwType": "DA_Drop_Guns (Data_ItemThrowType_C)",
    "useName": "FIRE"
  },
  "DA_Shotgun": {
    "id": "DA_Shotgun",
    "damage": 2,
    "crit": 6,
    "staminaDamage": 6,
    "critStamina": 4,
    "fireRate": 0.3,
    "auto": true,
    "capacity": 10,
    "stun": -0.02,
    "staminaUsage": 8,
    "canInventory": false,
    "standPrecision": 1.8,
    "walkPrecision": 2,
    "runPrecision": 5,
    "airPrecision": 1,
    "recoilSpread": 0.3,
    "recoilElevation": 3,
    "jumpFactor": 1,
    "handling": 60,
    "throwForce": 1000,
    "throwType": "DA_Drop_Rifles (Data_ItemThrowType_C)",
    "useName": "FIRE"
  },
  "DA_SMG": {
    "id": "DA_SMG",
    "damage": 5,
    "crit": 5,
    "staminaDamage": 20,
    "critStamina": 45,
    "fireRate": 0.1,
    "auto": true,
    "capacity": 30,
    "stun": 0.75,
    "staminaUsage": 3,
    "canInventory": false,
    "standPrecision": 0,
    "walkPrecision": 0.25,
    "runPrecision": 1,
    "airPrecision": 4,
    "recoilSpread": 0.4,
    "recoilElevation": 0.4,
    "jumpFactor": 1,
    "handling": 80,
    "throwForce": 1000,
    "throwType": "DA_Drop_Rifles (Data_ItemThrowType_C)",
    "useName": "FIRE"
  }
} as const;

export const VERIFIED_MELEE_TYPES = {
  "DA_Melee_Sharp": {
    "id": "DA_Melee_Sharp",
    "heal": 10,
    "stamina": 10,
    "stun": -0.3,
    "critHeal": 20,
    "critStamina": 20,
    "critStun": -0.1,
    "cost": 20,
    "castTime": 0.1,
    "recoverTime": 0.4,
    "rangeCm": 130,
    "selfStun": -0.3
  },
  "DA_Melee_Blunt": {
    "id": "DA_Melee_Blunt",
    "heal": 5,
    "stamina": 30,
    "stun": -0.6,
    "critHeal": 20,
    "critStamina": 80,
    "critStun": -0.5,
    "cost": 25,
    "castTime": 0.2,
    "recoverTime": 0.7,
    "rangeCm": 130,
    "selfStun": -0.5
  },
  "DA_Melee_Cookie": {
    "id": "DA_Melee_Cookie",
    "heal": -20,
    "stamina": 20,
    "stun": -0.3,
    "critHeal": 10,
    "critStamina": 20,
    "critStun": -0.3,
    "cost": 20,
    "castTime": 0.2,
    "recoverTime": 0.25,
    "rangeCm": 130,
    "selfStun": -0.2
  },
  "DA_Melee_Heavy": {
    "id": "DA_Melee_Heavy",
    "heal": 10,
    "stamina": 70,
    "stun": -1,
    "critHeal": 10,
    "critStamina": 70,
    "critStun": -1,
    "cost": 50,
    "castTime": 0.3,
    "recoverTime": 1.0,
    "rangeCm": 180,
    "selfStun": -0.7
  },
  "DA_Melee_Knife": {
    "id": "DA_Melee_Knife",
    "heal": 40,
    "stamina": 10,
    "stun": 0.2,
    "critHeal": 70,
    "critStamina": 20,
    "critStun": 0.7,
    "cost": 30,
    "castTime": 0.2,
    "recoverTime": 0.6,
    "rangeCm": 130,
    "selfStun": -0.4
  },
  "DA_Melee_Nerf": {
    "id": "DA_Melee_Nerf",
    "heal": 5,
    "stamina": 10,
    "stun": -0.3,
    "critHeal": 10,
    "critStamina": 20,
    "critStun": -0.3,
    "cost": 20,
    "castTime": 0.2,
    "recoverTime": 0.25,
    "rangeCm": 130,
    "selfStun": -0.2
  },
  "DA_Melee_Rez": {
    "id": "DA_Melee_Rez",
    "heal": 10,
    "stamina": 30,
    "stun": -0.8,
    "critHeal": 10,
    "critStamina": 50,
    "critStun": -0.8,
    "cost": 40,
    "castTime": 0.2,
    "recoverTime": 0.8,
    "rangeCm": 180,
    "selfStun": -0.5
  },
  "DA_Melee_Fish": {
    "id": "DA_Melee_Fish",
    "heal": 20,
    "stamina": 50,
    "stun": -1,
    "critHeal": 20,
    "critStamina": 80,
    "critStun": -1,
    "cost": 40,
    "castTime": 0.2,
    "recoverTime": 0.7,
    "rangeCm": 130,
    "selfStun": -1
  },
  "DA_Melee_Candy": {
    "id": "DA_Melee_Candy",
    "heal": 5,
    "stamina": 30,
    "stun": -0.6,
    "critHeal": 20,
    "critStamina": 80,
    "critStun": -0.5,
    "cost": 25,
    "castTime": 0.2,
    "recoverTime": 0.6,
    "rangeCm": 130,
    "selfStun": -0.5
  }
} as const;

export const VERIFIED_THROW_TYPES = {
  "DA_Drop_Sample": {
    "id": "DA_Drop_Sample",
    "throwForce": 800,
    "verticalForce": 200,
    "verticalOffset": -20,
    "restitution": 1,
    "gravity": -1000,
    "drag": 0,
    "radius": 15
  },
  "DA_Drop_Gaz": {
    "id": "DA_Drop_Gaz",
    "throwForce": 450,
    "verticalForce": 300,
    "verticalOffset": -50,
    "restitution": 0.6,
    "gravity": -1000,
    "drag": 0,
    "radius": 20
  },
  "DA_Drop_Guns": {
    "id": "DA_Drop_Guns",
    "throwForce": 800,
    "verticalForce": 200,
    "verticalOffset": -20,
    "restitution": 1,
    "gravity": -1000,
    "drag": 0,
    "radius": 9
  },
  "DA_Drop_Rice": {
    "id": "DA_Drop_Rice",
    "throwForce": 450,
    "verticalForce": 300,
    "verticalOffset": -50,
    "restitution": 0.6,
    "gravity": -1000,
    "drag": 0,
    "radius": 15
  },
  "DA_Drop_Rifles": {
    "id": "DA_Drop_Rifles",
    "throwForce": 800,
    "verticalForce": 200,
    "verticalOffset": -20,
    "restitution": 0.5,
    "gravity": -1000,
    "drag": 0,
    "radius": 12
  },
  "DA_Drop_Package": {
    "id": "DA_Drop_Package",
    "throwForce": 200,
    "verticalForce": 300,
    "verticalOffset": -50,
    "restitution": 0.4,
    "gravity": -1000,
    "drag": 0,
    "radius": 10
  },
  "DA_Drop_Little": {
    "id": "DA_Drop_Little",
    "throwForce": 800,
    "verticalForce": 200,
    "verticalOffset": -20,
    "restitution": 1,
    "gravity": -1000,
    "drag": 0,
    "radius": 8
  }
} as const;

export const VERIFIED_ITEMS = {
  "DA_Fish": {
    "id": "DA_Fish",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Fish",
    "throwType": "DA_Drop_Little",
    "useName": "BONK",
    "logic": 9,
    "mesh": "SM_Salmon",
    "handling": 60,
    "jumpFactor": 1
  },
  "DA_Mug": {
    "id": "DA_Mug",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 18,
    "mesh": "SM_Mug",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Grenade": {
    "id": "DA_Grenade",
    "cls": "Data_Grenade_C",
    "canInventory": true,
    "meleeType": null,
    "throwType": "DA_Drop_Little",
    "useName": "ACTIVATE",
    "logic": 14,
    "mesh": "SM_Grenade_V2",
    "handling": 100,
    "jumpFactor": 1
  },
  "DA_Cookie": {
    "id": "DA_Cookie",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Cookie",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 17,
    "mesh": "SM_Cookie_V2",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Rez": {
    "id": "DA_Rez",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Rez",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 13,
    "mesh": "SM_Defibrilator2",
    "handling": 80,
    "jumpFactor": 2
  },
  "DA_Package": {
    "id": "DA_Package",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Heavy",
    "throwType": "DA_Drop_Package",
    "useName": "PUSH",
    "logic": 5,
    "mesh": "package_brown",
    "handling": 40,
    "jumpFactor": 2
  },
  "DA_Battery": {
    "id": "DA_Battery",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "battery",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Popsicle": {
    "id": "DA_Popsicle",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Cookie",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 17,
    "mesh": "SM_Popsicle",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_EasterEgg": {
    "id": "DA_EasterEgg",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 4,
    "mesh": "EasterEgg",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Medication_B1": {
    "id": "DA_Medication_B1",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 4,
    "mesh": "SM_Medication_B",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_MeasuringTape": {
    "id": "DA_MeasuringTape",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 4,
    "mesh": "SM_MeasuringTape",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Marker_Office": {
    "id": "DA_Marker_Office",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 4,
    "mesh": "SM_Marker",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_TapeRoll": {
    "id": "DA_TapeRoll",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 4,
    "mesh": "SM_TapeRoll",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Fuse": {
    "id": "DA_Fuse",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 4,
    "mesh": "Fuse",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Music": {
    "id": "DA_Music",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 16,
    "mesh": "Cassette_V2",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_AccessCard": {
    "id": "DA_AccessCard",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Nerf",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_AccessCard_V2",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_C4": {
    "id": "DA_C4",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 11,
    "mesh": "C4_Explosive",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_VentFilter": {
    "id": "DA_VentFilter",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Heavy",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 7,
    "mesh": "Filter",
    "handling": 50,
    "jumpFactor": 2
  },
  "DA_ScrewDriver": {
    "id": "DA_ScrewDriver",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Sharp",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "screwdriver",
    "handling": 100,
    "jumpFactor": 3
  },
  "DA_Detonator": {
    "id": "DA_Detonator",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "ACTIVATE",
    "logic": 12,
    "mesh": "C4_Detonator",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Knife": {
    "id": "DA_Knife",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Knife",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "knife",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Rice": {
    "id": "DA_Rice",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Heavy",
    "throwType": "DA_Drop_Rice",
    "useName": "PUSH",
    "logic": 8,
    "mesh": "RiceBag",
    "handling": 50,
    "jumpFactor": 2
  },
  "DA_Container": {
    "id": "DA_Container",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 1,
    "mesh": "sampleContainer",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Sample": {
    "id": "DA_Sample",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Sample",
    "useName": "MELEE",
    "logic": 2,
    "mesh": "sample_V2",
    "handling": 80,
    "jumpFactor": 2
  },
  "DA_GazBottle": {
    "id": "DA_GazBottle",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Heavy",
    "throwType": "DA_Drop_Gaz",
    "useName": "MELEE",
    "logic": 6,
    "mesh": "PressureBottle",
    "handling": 50,
    "jumpFactor": 2
  },
  "DA_Jerrican": {
    "id": "DA_Jerrican",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Heavy",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 7,
    "mesh": "SM_Jerrican",
    "handling": 50,
    "jumpFactor": 2
  },
  "DA_CandyCane": {
    "id": "DA_CandyCane",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Candy",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 17,
    "mesh": "SM_CandyCane",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_HardDrive": {
    "id": "DA_HardDrive",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_HardDrive",
    "handling": 100,
    "jumpFactor": 1
  },
  "DA_MachinePart_A": {
    "id": "DA_MachinePart_A",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Sharp",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_MachinePart_A",
    "handling": 100,
    "jumpFactor": 3
  },
  "DA_FoodCan": {
    "id": "DA_FoodCan",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_FoodCan",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_MachinePart_B": {
    "id": "DA_MachinePart_B",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_MachinePart_B",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Scalpel": {
    "id": "DA_Scalpel",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Knife",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_Scalpel",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Pizzushi": {
    "id": "DA_Pizzushi",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Heavy",
    "throwType": "DA_Drop_Gaz",
    "useName": "PUSH",
    "logic": 10,
    "mesh": "PIzzushi_Box",
    "handling": 40,
    "jumpFactor": 2
  },
  "DA_MachinePart_D": {
    "id": "DA_MachinePart_D",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_MachinePart_D",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_ComputerMouse": {
    "id": "DA_ComputerMouse",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_ComputerMouse",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Medication_A": {
    "id": "DA_Medication_A",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Blunt",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_Medication_A",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_Pencil": {
    "id": "DA_Pencil",
    "cls": "Data_Melee_C",
    "canInventory": true,
    "meleeType": "DA_Melee_Sharp",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 0,
    "mesh": "SM_Pencil",
    "handling": 100,
    "jumpFactor": 1.5
  },
  "DA_MachinePart_C": {
    "id": "DA_MachinePart_C",
    "cls": "Data_Melee_C",
    "canInventory": false,
    "meleeType": "DA_Melee_Heavy",
    "throwType": "DA_Drop_Little",
    "useName": "MELEE",
    "logic": 7,
    "mesh": "SM_MachinePart_C",
    "handling": 50,
    "jumpFactor": 2
  }
} as const;

export const VERIFIED_GAME_RULES = [
  {
    "key": "SessionTimer",
    "name": "SESSION TIME LIMIT",
    "easy": 0,
    "default": 10,
    "min": 1,
    "max": 60,
    "valueMax": 60,
    "type": 0
  },
  {
    "key": "DissidentCount",
    "name": "DISSIDENTS COUNT",
    "easy": 0,
    "default": 1,
    "min": 0,
    "max": 8,
    "valueMax": 8,
    "type": 0
  },
  {
    "key": "TaskCount",
    "name": "TASKS COUNT",
    "easy": 0,
    "default": 3,
    "min": 1,
    "max": 8,
    "valueMax": 8,
    "type": 0
  },
  {
    "key": "DeliveryCount",
    "name": "DELIVERY PACKAGES",
    "easy": 3,
    "default": 6,
    "min": 0,
    "max": 6,
    "valueMax": 6,
    "type": 0
  },
  {
    "key": "PowerCount",
    "name": "POWER SLOTS",
    "easy": 1,
    "default": 2,
    "min": 0,
    "max": 7,
    "valueMax": 7,
    "type": 0
  },
  {
    "key": "VentCount",
    "name": "VENTS TO CLEAN",
    "easy": 1,
    "default": 3,
    "min": 0,
    "max": 7,
    "valueMax": 7,
    "type": 0
  },
  {
    "key": "ComputerCount",
    "name": "COMPUTERS TO UPDATE",
    "easy": 1,
    "default": 3,
    "min": 0,
    "max": 5,
    "valueMax": 5,
    "type": 0
  },
  {
    "key": "PressureCount",
    "name": "PRESSURE TASK",
    "easy": 0,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "AnalysisCount",
    "name": "SAMPLES TO ANALYSIS",
    "easy": 3,
    "default": 6,
    "min": 0,
    "max": 8,
    "valueMax": 8,
    "type": 0
  },
  {
    "key": "PizzushiCount",
    "name": "PIZZUSHI TO MAKE",
    "easy": 0,
    "default": 2,
    "min": 0,
    "max": 5,
    "valueMax": 5,
    "type": 0
  },
  {
    "key": "ScannerCount",
    "name": "SCANNER TASK",
    "easy": 4,
    "default": 8,
    "min": 0,
    "max": 8,
    "valueMax": 8,
    "type": 0
  },
  {
    "key": "GunSpawn",
    "name": "GUN SPAWN",
    "easy": 0,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "KnifeSpawn",
    "name": "KNIFE SPAWN",
    "easy": 4,
    "default": 3,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "C4Spawn",
    "name": "DETONATOR SPAWN",
    "easy": 1,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "Alarm",
    "name": "ALARMS",
    "easy": 0,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "CardSpawn",
    "name": "ACCESS CARD SPAWN",
    "easy": 0,
    "default": 4,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "WeaponLoader",
    "name": "GUN RELOAD STATION",
    "easy": 0,
    "default": 2,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "DefibMap",
    "name": "MEDICAL DEFIBRILLATOR",
    "easy": 0,
    "default": 6,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "DefibRoom",
    "name": "EMERGENCY ROOM DEFIBRILLATOR",
    "easy": 6,
    "default": 4,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "SpawnType",
    "name": "PLAYERS SPAWN LOCATION",
    "easy": 0,
    "default": 0,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "HeavyWeapon",
    "name": "heavy weapon SPAWN",
    "easy": 0,
    "default": 2,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "HeavyAmmo",
    "name": "heavy weapon AMMO",
    "easy": 0,
    "default": 4,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "HeavySelection",
    "name": "heavy weapon selection",
    "easy": 0,
    "default": 0,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "BatterySpeed",
    "name": "battery charge speed",
    "easy": 2,
    "default": 2,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "riflespawn",
    "name": "rifle spawn",
    "easy": 0,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "shotgunspawn",
    "name": "shotgun spawn",
    "easy": 0,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "SMGspawn",
    "name": "SMG spawn",
    "easy": 0,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "maptheme",
    "name": "map theme",
    "easy": 0,
    "default": 0,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "Armory",
    "name": "Armory room",
    "easy": 1,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "researchCorridor",
    "name": "research corridor",
    "easy": 1,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "emergencyRoom",
    "name": "emergency room",
    "easy": 1,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  },
  {
    "key": "machineSupply",
    "name": "Machine supply",
    "easy": 1,
    "default": 1,
    "min": 0,
    "max": 0,
    "valueMax": 0,
    "type": 1
  }
] as const;

export const VERIFIED_MUSICS = [
  {
    "key": "KHARMA",
    "title": "KHARMA",
    "artists": "Christopher Damas"
  },
  {
    "key": "WhoAmI",
    "title": "Who Am I",
    "artists": "Yanvince"
  },
  {
    "key": "BurningWish",
    "title": "Burning Wish",
    "artists": "Naeleck, Roniit"
  },
  {
    "key": "Cake",
    "title": "Cake",
    "artists": "RetroVision"
  },
  {
    "key": "Puzzle",
    "title": "Puzzle",
    "artists": "RetroVision"
  },
  {
    "key": "Sun",
    "title": "Sun",
    "artists": "Raude"
  },
  {
    "key": "Worship",
    "title": "Worship",
    "artists": "Diamond Eyes"
  },
  {
    "key": "Royalty",
    "title": "Royalty (Instrumental)",
    "artists": "Egzod, Maestro Chives, Neoni"
  },
  {
    "key": "GRAVE",
    "title": "GRAVE",
    "artists": "HOWL, Idle Days"
  }
] as const;

export const VERIFIED_TASK_CDOS = {
  "Task_C": {
    "Name": "TASK",
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 0,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [],
    "Tuto Pages": [],
    "Tuto Link": "",
    "Difficulty": 0,
    "Rule Ref": "None"
  },
  "Task_DelivryIn_C": {
    "Cases": [],
    "Task Cases": [],
    "Packages Count": 1,
    "Max Packages": 5,
    "Sectors List": [
      1,
      2,
      3,
      4,
      5,
      7
    ],
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 6,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [],
    "Tuto Pages": [
      "TaskTuto_Delivery_1 (Texture2D)",
      "TaskTuto_Delivery_2 (Texture2D)"
    ],
    "Tuto Link": "https://www.youtube.com/watch?v=ufXx42Q95eg",
    "Tutorial Video": "Delivery_montage (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "DeliveryCount"
  },
  "Task_Vents_C": {
    "Vents": [],
    "Out Actors": [],
    "Task Vents": [],
    "Min Vents": 4,
    "ScrewDriver Count": 4,
    "Max Vents": 6,
    "Charge Speed": 5,
    "Filter Cleaners": [],
    "Sectors List": [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 3,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [
      {
        "X": 5150,
        "Y": 10150,
        "Z": 100
      }
    ],
    "Tuto Pages": [
      "TaskTuto_Ventilation_1 (Texture2D)",
      "TaskTuto_Ventilation_2 (Texture2D)",
      "TaskTuto_Ventilation_3 (Texture2D)",
      "TaskTuto_Ventilation_4 (Texture2D)"
    ],
    "Tuto Link": "https://www.youtube.com/watch?v=EtqwHdDhB4A",
    "Tutorial Video": "Vents_montage (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "VentCount"
  },
  "Task_PlantAnalysis_C": {
    "Plants": [],
    "Min Plants": 6,
    "Max Plants": 5,
    "Containers": 2,
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 6,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [
      {
        "X": 8700,
        "Y": 3450,
        "Z": 100
      },
      {
        "X": 8700,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 8700,
        "Y": 3950,
        "Z": 100
      },
      {
        "X": 9500,
        "Y": 3450,
        "Z": 100
      },
      {
        "X": 9500,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 9500,
        "Y": 3950,
        "Z": 100
      },
      {
        "X": 10100,
        "Y": 3450,
        "Z": 100
      },
      {
        "X": 10100,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 10100,
        "Y": 3950,
        "Z": 100
      },
      {
        "X": 10800,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 7300,
        "Y": 4700,
        "Z": 100
      },
      {
        "X": 9700,
        "Y": 5000,
        "Z": 100
      },
      {
        "X": 9500,
        "Y": 5000,
        "Z": 100
      },
      {
        "X": 9050,
        "Y": 5000,
        "Z": 100
      }
    ],
    "Tuto Pages": [
      "TaskTuto_Analysis_1 (Texture2D)",
      "TaskTuto_Analysis_2 (Texture2D)",
      "TaskTuto_Analysis_3 (Texture2D)",
      "TaskTuto_Analysis_4 (Texture2D)",
      "TaskTuto_Analysis_5 (Texture2D)",
      "TaskTuto_Analysis_6 (Texture2D)",
      "TaskTuto_Analysis_7 (Texture2D)"
    ],
    "Tuto Link": "https://www.youtube.com/watch?v=ufXx42Q95eg",
    "Tutorial Video": "Analysis_montage (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "AnalysisCount"
  },
  "Task_Data_C": {
    "Source PC": [],
    "Target PC": [],
    "Task Source PC": [],
    "Task Target PC": [],
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 3,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [],
    "Tuto Pages": [
      "TaskTuto_Computer_1 (Texture2D)"
    ],
    "Tuto Link": "https://youtu.be/DfQaZh6GK1Q",
    "Tutorial Video": "Tutorial_Computer_v2 (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "ComputerCount"
  },
  "Task_Machine_C": {
    "Placed": 2,
    "Random": 3,
    "Bottles": [],
    "Task Bottles": [],
    "Machines": [],
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 1,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [
      {
        "X": 3500,
        "Y": 10000,
        "Z": 1
      },
      {
        "X": 3800,
        "Y": 10000,
        "Z": 1
      },
      {
        "X": 3500,
        "Y": 10900,
        "Z": 1
      },
      {
        "X": 3800,
        "Y": 10900,
        "Z": 1
      }
    ],
    "Tuto Pages": [
      "TaskTuto_Pressure_1 (Texture2D)",
      "TaskTuto_Pressure_2 (Texture2D)",
      "TaskTuto_Pressure_3 (Texture2D)",
      "TaskTuto_Pressure_4 (Texture2D)",
      "TaskTuto_Pressure_5 (Texture2D)"
    ],
    "Tuto Link": "https://www.youtube.com/watch?v=iGmN9oDGZfA",
    "Tutorial Video": "Pressure_montage (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "PressureCount"
  },
  "Task_Scanner_C": {
    "Placed": 5,
    "Random": 3,
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 8,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [
      {
        "X": 6550,
        "Y": 5250,
        "Z": 1
      },
      {
        "X": 6350,
        "Y": 4650,
        "Z": 1
      }
    ],
    "Tuto Pages": [
      "TaskTuto_Scanner_1 (Texture2D)",
      "TaskTuto_Scanner_2 (Texture2D)"
    ],
    "Tuto Link": "https://www.youtube.com/watch?v=jCGVPt0BePM",
    "Tutorial Video": "Scanner_montage (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "ScannerCount"
  },
  "Task_Alim_C": {
    "Vents": [],
    "Out Actors": [],
    "Task Vents": [],
    "Alims Count": 1,
    "Batteries Rab": 1,
    "Charge Speed": 5,
    "Alims": [],
    "Task Alims": [],
    "Fuses Rab": 2,
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 2,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [],
    "Tuto Pages": [
      "TaskTuto_Alim_1 (Texture2D)",
      "TaskTuto_Alim_2 (Texture2D)",
      "TaskTuto_Alim_3 (Texture2D)",
      "TaskTuto_Alim_4 (Texture2D)",
      "TaskTuto_Alim_5 (Texture2D)"
    ],
    "Tuto Link": "https://youtu.be/t-sCuk1TBR0",
    "Tutorial Video": "Alim_montage (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "PowerCount"
  },
  "Task_Pizzushi_C": {
    "Placed": 5,
    "Random": 3,
    "Tables": [],
    "Task Tables": [],
    "Count": 3,
    "Containers": 2,
    "Time Value": 0,
    "In Task": false,
    "Rule Value": 2,
    "Default Value": 0,
    "Setting Name": "TASK",
    "Max Rule Value": 0,
    "MapDots": [
      {
        "X": 8700,
        "Y": 3450,
        "Z": 100
      },
      {
        "X": 8700,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 8700,
        "Y": 3950,
        "Z": 100
      },
      {
        "X": 9500,
        "Y": 3450,
        "Z": 100
      },
      {
        "X": 9500,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 9500,
        "Y": 3950,
        "Z": 100
      },
      {
        "X": 10100,
        "Y": 3450,
        "Z": 100
      },
      {
        "X": 10100,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 10100,
        "Y": 3950,
        "Z": 100
      },
      {
        "X": 10800,
        "Y": 2950,
        "Z": 100
      },
      {
        "X": 7300,
        "Y": 4700,
        "Z": 100
      },
      {
        "X": 6900,
        "Y": 6600,
        "Z": 100
      },
      {
        "X": 7100,
        "Y": 6400,
        "Z": 100
      }
    ],
    "Tuto Pages": [
      "TaskTuto_Pizzushi_1 (Texture2D)",
      "TaskTuto_Pizzushi_2 (Texture2D)",
      "TaskTuto_Pizzushi_3 (Texture2D)",
      "TaskTuto_Pizzushi_4 (Texture2D)",
      "TaskTuto_Pizzushi_5 (Texture2D)",
      "TaskTuto_Pizzushi_6 (Texture2D)",
      "TaskTuto_Pizzushi_7 (Texture2D)",
      "TaskTuto_Pizzushi_8 (Texture2D)",
      "TaskTuto_Pizzushi_9 (Texture2D)",
      "TaskTuto_Pizzushi_10 (Texture2D)",
      "TaskTuto_Pizzushi_11 (Texture2D)",
      "TaskTuto_Pizzushi_12 (Texture2D)"
    ],
    "Tuto Link": "https://www.youtube.com/watch?v=ufXx42Q95eg",
    "Tutorial Video": "Tutorial_Pizzushi (FileMediaSource)",
    "Difficulty": 0,
    "Rule Ref": "PizzushiCount"
  }
} as const;

// Verified lower-deck solid walls (thickness <= 35cm, floor-level doorway arches carved; glass sills maxZ<=1.2m preserved)
export const VERIFIED_LOWER_WALLS: Box2DM[] = [[83.961, 43.999, -0.001, 84.016, 48.001, 4.001, "BotanicsGreenhouse_Wall_S_V2"], [83.961, 33.999, -0.001, 84.016, 38.001, 4.001, "BotanicsGreenhouse_Wall_S_V2"], [83.961, 29.999, -0.001, 84.016, 34.001, 4.001, "BotanicsGreenhouse_Wall_S_V2"], [111.935, 26.851, -0.005, 112.0, 27.852, 3.995, "BotanicsGreenhouse_Wall_N"], [111.873, 27.849, -0.005, 112.039, 28.854, 3.995, "BotanicsGreenhouse_Wall_N"], [111.946, 46.749, -0.0, 112.0, 47.251, 4.0, "BotanicsGreenhouse_Wall_N"], [93.999, 105.961, -0.001, 98.001, 106.016, 4.001, "SurvellianceCamera_Wall_W"], [97.999, 105.961, -0.001, 102.001, 106.016, 4.001, "SurvellianceCamera_Wall_W"], [100.499, 105.961, -0.001, 101.001, 106.127, 4.001, "SurvellianceCamera_Wall_W"], [96.999, 105.961, -0.001, 97.501, 106.127, 4.001, "SurvellianceCamera_Wall_W"], [93.499, 106.0, -0.0, 94.001, 106.054, 4.0, "SurvellianceCamera_Wall_W"], [96.499, 105.961, -0.001, 97.001, 106.127, 4.001, "SurvellianceCamera_Wall_W"], [94.999, 105.961, -0.001, 95.501, 106.127, 4.001, "SurvellianceCamera_Wall_W"], [94.0, 117.999, -0.001, 94.03, 120.001, 4.001, "SurvellianceCamera_Wall_S"], [94.0, 116.0, -0.005, 94.013, 118.0, 1.0, "SurvellianceCamera_Wall_S"], [93.961, 107.499, -0.001, 94.127, 108.001, 4.001, "SurvellianceCamera_Wall_S"], [93.961, 111.999, -0.001, 94.127, 112.501, 4.001, "SurvellianceCamera_Wall_S"], [93.961, 105.999, -0.001, 94.127, 106.501, 4.001, "SurvellianceCamera_Wall_S"], [94.0, 112.499, -0.0, 94.014, 113.001, 4.0, "SurvellianceCamera_Wall_S"], [94.0, 114.999, -0.0, 94.014, 115.501, 4.0, "SurvellianceCamera_Wall_S"], [94.0, 106.498, -0.0, 94.014, 107.502, 4.0, "SurvellianceCamera_Wall_S"], [93.998, 119.999, -0.001, 102.002, 120.001, 4.001, "SurvellianceCamera_Wall_E"], [101.499, 115.373, -0.001, 102.001, 115.539, 4.001, "SurvellianceCamera_Wall_E"], [98.999, 115.373, -0.001, 99.501, 115.539, 4.001, "SurvellianceCamera_Wall_E"], [93.999, 115.373, -0.001, 94.501, 115.539, 4.001, "SurvellianceCamera_Wall_E"], [101.468, 115.499, -0.001, 101.51, 116.001, 4.001, "SurvellianceCamera_Wall_E"], [99.49, 115.499, -0.001, 99.532, 116.001, 4.001, "SurvellianceCamera_Wall_E"], [101.499, 115.961, -0.001, 102.001, 116.127, 4.001, "SurvellianceCamera_Wall_E"], [98.999, 115.961, -0.001, 99.501, 116.127, 4.001, "SurvellianceCamera_Wall_E"], [93.999, 115.961, -0.001, 94.501, 116.127, 4.001, "SurvellianceCamera_Wall_E"], [94.349, 115.935, -0.005, 99.151, 116.001, 0.886, "SurvellianceCamera_Wall_E"], [94.349, 115.499, -0.005, 99.151, 115.565, 0.886, "SurvellianceCamera_Wall_E"], [79.62, 21.58, -0.001, 82.321, 21.646, 4.001, "MedicalCorridor_Surfaces2"], [82.984, 23.999, -0.001, 83.039, 28.001, 4.001, "MedicalCorridor_Surfaces2"], [82.984, 19.999, -0.001, 83.039, 24.001, 4.001, "MedicalCorridor_Surfaces2"], [79.0, 26.499, -0.0, 79.054, 27.001, 4.0, "MedicalCorridor_Surfaces2"], [78.961, 21.749, -0.001, 79.016, 26.751, 4.001, "MedicalCorridor_Surfaces2"], [79.0, 30.999, -0.0, 79.054, 31.501, 4.0, "MedicalCorridor_Surfaces2"], [79.0, 31.499, -0.0, 79.054, 32.001, 4.0, "MedicalCorridor_Surfaces2"], [79.0, 31.999, -0.0, 79.054, 32.501, 4.0, "MedicalCorridor_Surfaces2"], [107.999, 46.984, -0.001, 112.001, 47.039, 4.001, "BotanicsGreenhouse_OuterRoom3"], [103.499, 46.984, -0.001, 107.501, 47.039, 4.001, "BotanicsGreenhouse_OuterRoom3"], [102.961, 42.999, -0.001, 103.016, 47.001, 4.001, "BotanicsGreenhouse_OuterRoom3"], [107.499, 46.873, -0.001, 108.001, 47.039, 4.001, "BotanicsGreenhouse_OuterRoom3"], [102.999, 46.873, -0.001, 103.501, 47.039, 4.001, "BotanicsGreenhouse_OuterRoom3"], [102.499, 46.946, -0.0, 103.001, 47.0, 4.0, "BotanicsGreenhouse_OuterRoom3"], [101.987, 41.85, -0.001, 102.215, 42.016, 4.001, "BotanicsGreenhouse_OuterRoom3"], [100.998, 43.936, -0.001, 102.002, 44.019, 4.001, "BotanicsGreenhouse_OuterRoom3"], [111.499, 46.873, -0.001, 112.001, 47.039, 4.001, "BotanicsGreenhouse_OuterRoom3"], [35.499, 61.961, -0.001, 36.001, 62.127, 4.001, "Storage_Wall_W_V2"], [31.999, 61.961, -0.001, 36.001, 62.016, 4.001, "Storage_Wall_W_V2"], [35.999, 61.961, -0.001, 40.001, 62.016, 4.001, "Storage_Wall_W_V2"], [23.999, 61.961, -0.001, 28.001, 62.016, 4.001, "Storage_Wall_W_V2"], [51.999, 62.0, -0.0, 52.501, 62.054, 4.0, "Storage_Wall_W_V2"], [45.499, 62.0, -0.0, 46.001, 62.054, 4.0, "Storage_Wall_W_V2"], [78.961, 47.999, -0.001, 79.016, 52.001, 4.001, "WestCorridorBotanics_Wall_S_V2"], [79.0, 33.249, -0.0, 79.054, 33.751, 4.0, "WestCorridorBotanics_Wall_S_V2"], [79.0, 32.749, -0.0, 79.054, 33.251, 4.0, "WestCorridorBotanics_Wall_S_V2"], [78.961, 47.999, -0.001, 79.127, 48.501, 4.001, "WestCorridorBotanics_Wall_S_V2"], [78.961, 42.499, -0.001, 79.127, 43.001, 4.001, "WestCorridorBotanics_Wall_S_V2"], [78.961, 41.999, -0.001, 79.127, 42.501, 4.001, "WestCorridorBotanics_Wall_S_V2"], [82.984, 43.999, -0.001, 83.039, 48.001, 4.001, "WestCorridorBotanics_Wall_N_V2"], [82.984, 33.999, -0.001, 83.039, 38.001, 4.001, "WestCorridorBotanics_Wall_N_V2"], [82.984, 29.999, -0.001, 83.039, 34.001, 4.001, "WestCorridorBotanics_Wall_N_V2"], [82.865, 47.499, -0.001, 83.031, 48.001, 4.001, "WestCorridorBotanics_Wall_N_V2"], [82.865, 37.499, -0.001, 83.031, 38.001, 4.001, "WestCorridorBotanics_Wall_N_V2"], [82.865, 43.999, -0.001, 83.031, 44.501, 4.001, "WestCorridorBotanics_Wall_N_V2"], [82.865, 55.499, -0.005, 83.031, 56.001, 1.132, "WestCorridorBotanics_Wall_N_V2"], [69.999, 55.984, -0.001, 70.069, 56.039, 4.001, "RestaurantCubby_Wall"], [74.931, 55.984, -0.001, 76.001, 56.039, 4.001, "RestaurantCubby_Wall"], [69.961, 51.999, -0.001, 70.016, 56.001, 4.001, "RestaurantCubby_Wall"], [69.961, 47.999, -0.001, 70.016, 52.001, 4.001, "RestaurantCubby_Wall"], [77.984, 48.999, -0.001, 78.039, 53.001, 4.001, "RestaurantCubby_Wall"], [77.984, 52.999, -0.001, 78.039, 56.001, 4.001, "RestaurantCubby_Wall"], [69.999, 49.961, -0.001, 74.001, 50.016, 4.001, "RestaurantCubby_Wall"], [73.999, 49.961, -0.001, 78.001, 50.016, 4.001, "RestaurantCubby_Wall"], [75.749, 55.984, -0.001, 78.751, 56.039, 4.001, "RestaurantCubby_Wall"], [69.999, 49.961, -0.001, 70.501, 50.127, 4.001, "RestaurantCubby_Wall"], [69.999, 55.873, -0.001, 70.501, 56.039, 4.001, "RestaurantCubby_Wall"], [77.499, 55.873, -0.001, 78.001, 56.039, 4.001, "RestaurantCubby_Wall"], [77.999, 55.946, -0.0, 78.501, 56.0, 4.0, "RestaurantCubby_Wall"], [77.499, 49.961, -0.001, 78.001, 50.127, 4.001, "RestaurantCubby_Wall"], [69.499, 55.946, -0.0, 70.001, 56.0, 4.0, "RestaurantCubby_Wall"], [77.999, 50.0, -0.0, 78.501, 50.054, 4.0, "RestaurantCubby_Wall"], [69.499, 50.0, -0.0, 70.001, 50.054, 4.0, "RestaurantCubby_Wall"], [75.499, 55.873, -0.001, 76.001, 56.039, 4.001, "RestaurantCubby_Wall"], [84.499, 46.984, -0.001, 88.501, 47.039, 4.001, "BotanicsGreenhouse_Wall_E"], [98.499, 46.984, -0.001, 102.501, 47.039, 4.001, "BotanicsGreenhouse_Wall_E"], [100.984, 44.499, -0.001, 101.039, 48.501, 4.001, "BotanicsGreenhouse_Wall_E"], [88.999, 46.935, -0.001, 93.001, 47.0, 1.001, "BotanicsGreenhouse_Wall_E"], [92.999, 46.935, -0.001, 98.001, 47.0, 1.001, "BotanicsGreenhouse_Wall_E"], [83.999, 46.873, -0.001, 84.501, 47.039, 4.001, "BotanicsGreenhouse_Wall_E"], [88.499, 46.873, -0.001, 89.001, 47.039, 4.001, "BotanicsGreenhouse_Wall_E"], [97.999, 46.873, -0.001, 98.501, 47.039, 4.001, "BotanicsGreenhouse_Wall_E"], [83.499, 46.946, -0.0, 84.001, 47.0, 4.0, "BotanicsGreenhouse_Wall_E"], [100.873, 46.499, -0.001, 101.039, 47.001, 4.001, "BotanicsGreenhouse_Wall_E"], [100.873, 43.999, -0.001, 101.039, 44.501, 4.001, "BotanicsGreenhouse_Wall_E"], [84.0, 24.999, 0.999, 84.065, 26.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [107.949, 11.0, 0.999, 109.051, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [83.961, 20.999, 0.999, 84.016, 25.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [83.961, 16.999, 0.999, 84.016, 21.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [83.961, 12.999, 0.999, 84.016, 17.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [83.961, 8.999, 0.999, 84.016, 13.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [83.999, 10.961, 0.999, 88.001, 11.016, 4.5, "BotanicsGreenhouse_OuterRoom1"], [87.999, 10.961, 0.999, 92.001, 11.016, 4.5, "BotanicsGreenhouse_OuterRoom1"], [91.999, 10.961, 0.999, 96.001, 11.016, 4.5, "BotanicsGreenhouse_OuterRoom1"], [95.999, 10.961, 0.999, 100.001, 11.016, 4.5, "BotanicsGreenhouse_OuterRoom1"], [99.999, 10.961, 0.999, 104.001, 11.016, 4.5, "BotanicsGreenhouse_OuterRoom1"], [103.999, 10.961, 0.999, 108.001, 11.016, 4.5, "BotanicsGreenhouse_OuterRoom1"], [108.999, 10.961, 0.999, 113.001, 11.016, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.984, 9.999, 0.999, 111.039, 14.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.984, 13.999, 0.999, 111.039, 18.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.984, 17.999, 0.999, 111.039, 22.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.984, 21.999, 0.999, 111.039, 26.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [24.499, 86.961, -0.001, 28.501, 87.016, 4.001, "MachineShortcut_Wall_W"], [28.499, 86.961, -0.001, 32.501, 87.016, 4.001, "MachineShortcut_Wall_W"], [32.499, 86.961, -0.001, 33.001, 87.127, 4.001, "MachineShortcut_Wall_W"], [23.999, 86.961, -0.001, 24.501, 87.127, 4.001, "MachineShortcut_Wall_W"], [19.999, 81.961, -0.001, 24.001, 82.016, 4.001, "MachineShortcut_Wall_W"], [19.961, 81.999, -0.001, 20.016, 86.001, 4.001, "MachineShortcut_Wall_W"], [18.999, 86.961, -0.001, 19.501, 87.127, 4.001, "MachineShortcut_Wall_W"], [19.499, 86.961, -0.001, 20.001, 87.127, 4.001, "MachineShortcut_Wall_W"], [20.0, 81.749, -0.0, 20.054, 82.251, 4.0, "MachineShortcut_Wall_W"], [33.961, 93.998, -0.001, 34.127, 95.002, 4.001, "CorridorSouth_Wall_S_V2"], [33.961, 86.998, -0.001, 34.127, 88.002, 4.001, "CorridorSouth_Wall_S_V2"], [99.984, 47.999, -0.001, 100.039, 52.001, 4.001, "BotanicsLab_Wall_N"], [99.946, 55.999, -0.0, 100.0, 56.501, 4.0, "BotanicsLab_Wall_N"], [99.984, 51.999, -0.001, 100.039, 56.001, 4.001, "BotanicsLab_Wall_N"], [99.946, 47.499, -0.0, 100.0, 48.001, 4.0, "BotanicsLab_Wall_N"], [84.0, 55.999, -0.0, 84.054, 56.501, 4.0, "BotanicsLab_Wall_S"], [84.0, 47.499, -0.0, 84.054, 48.001, 4.0, "BotanicsLab_Wall_S"], [83.961, 47.999, -0.001, 84.127, 48.501, 4.001, "BotanicsLab_Wall_S"], [83.961, 51.999, -0.001, 84.016, 56.001, 4.001, "BotanicsLab_Wall_S"], [83.961, 47.999, -0.001, 84.016, 52.001, 4.001, "BotanicsLab_Wall_S"], [83.961, 55.499, -0.001, 84.127, 56.001, 4.001, "BotanicsLab_Wall_S"], [88.499, 47.961, -0.001, 89.001, 48.127, 4.001, "BotanicsLab_Wall_W"], [97.999, 47.961, -0.001, 98.501, 48.127, 4.001, "BotanicsLab_Wall_W"], [97.999, 47.961, 0.249, 101.001, 48.016, 4.251, "BotanicsLab_Wall_W"], [83.999, 47.961, -0.001, 84.501, 48.127, 4.001, "BotanicsLab_Wall_W"], [84.499, 47.961, 0.249, 88.501, 48.016, 4.251, "BotanicsLab_Wall_W"], [70.961, 36.999, -0.001, 71.016, 41.001, 4.001, "BotanicsCubby_Wall_S"], [70.961, 44.999, -0.001, 71.016, 49.001, 4.001, "BotanicsCubby_Wall_S"], [70.961, 40.999, -0.001, 71.016, 45.001, 4.001, "BotanicsCubby_Wall_S"], [70.961, 40.999, -0.001, 71.127, 41.501, 4.001, "BotanicsCubby_Wall_S"], [70.961, 48.499, -0.001, 71.127, 49.001, 4.001, "BotanicsCubby_Wall_S"], [77.984, 42.999, -0.001, 78.039, 44.069, 4.001, "BotanicsCubby_Wall_N"], [77.984, 48.931, -0.001, 78.039, 49.001, 4.001, "BotanicsCubby_Wall_N"], [77.984, 39.999, -0.001, 78.039, 43.001, 4.001, "BotanicsCubby_Wall_N"], [77.873, 39.999, -0.001, 78.039, 40.501, 4.001, "BotanicsCubby_Wall_N"], [77.946, 39.499, -0.0, 78.0, 40.001, 4.0, "BotanicsCubby_Wall_N"], [77.873, 42.499, -0.001, 78.039, 43.001, 4.001, "BotanicsCubby_Wall_N"], [77.873, 48.499, -0.001, 78.039, 49.001, 4.001, "BotanicsCubby_Wall_N"], [77.946, 48.999, -0.0, 78.0, 49.501, 4.0, "BotanicsCubby_Wall_N"], [53.961, 105.999, -0.001, 54.016, 118.001, 4.001, "SurvellianceArmory_Wall_S2_V2"], [54.0, 105.999, -0.0, 54.054, 106.501, 4.0, "SurvellianceArmory_Wall_S2_V2"], [54.0, 117.749, -0.0, 54.054, 118.251, 4.0, "SurvellianceArmory_Wall_S2_V2"], [74.961, 111.749, -0.001, 75.016, 115.751, 4.001, "SurvellianceArmory_Wall_S_V2"], [74.961, 115.749, -0.001, 75.016, 119.751, 4.001, "SurvellianceArmory_Wall_S_V2"], [74.946, 105.499, -0.0, 75.0, 106.001, 4.0, "SurvellianceArmory_Wall_S_V2"], [75.061, 111.971, -0.001, 75.939, 112.095, 4.001, "SurvellianceArmory_Wall_S_V2"], [75.061, 109.841, -0.001, 75.939, 110.049, 4.001, "SurvellianceArmory_Wall_S_V2"], [74.249, 109.946, -0.0, 74.751, 110.0, 4.0, "SurvellianceArmory_Wall_S_V2"], [73.999, 109.946, -0.0, 74.251, 110.0, 4.0, "SurvellianceArmory_Wall_S_V2"], [74.749, 109.946, -0.0, 75.001, 110.0, 4.0, "SurvellianceArmory_Wall_S_V2"], [73.946, 111.0, -0.001, 74.0, 111.25, 4.5, "SurvellianceArmory_Wall_S_V2"], [73.946, 117.75, -0.0, 74.0, 118.0, 4.0, "SurvellianceArmory_Wall_S_V2"], [73.873, 110.499, -0.001, 74.039, 111.001, 4.5, "SurvellianceArmory_Wall_S_V2"], [73.873, 109.999, -0.001, 74.039, 110.501, 4.5, "SurvellianceArmory_Wall_S_V2"], [73.946, 118.0, -0.0, 74.0, 118.25, 4.0, "SurvellianceArmory_Wall_S_V2"], [83.984, 116.999, -0.001, 84.039, 121.001, 4.001, "SurvellianceArmory_Wall_N_V2"], [83.984, 108.999, -0.001, 84.039, 113.001, 4.001, "SurvellianceArmory_Wall_N_V2"], [83.984, 104.999, -0.001, 84.039, 109.001, 4.001, "SurvellianceArmory_Wall_N_V2"], [23.999, 60.984, -0.001, 28.001, 61.039, 4.001, "MedicalBackroom_Corridor"], [32.499, 60.984, -0.001, 36.501, 61.039, 4.001, "MedicalBackroom_Corridor"], [31.999, 60.873, -0.001, 32.501, 61.039, 4.001, "MedicalBackroom_Corridor"], [36.498, 60.873, -0.001, 37.502, 61.039, 4.001, "MedicalBackroom_Corridor"], [31.999, 56.961, -0.001, 36.001, 57.016, 4.001, "MedicalBackroom_Corridor"], [35.999, 56.961, -0.001, 40.001, 57.016, 4.001, "MedicalBackroom_Corridor"], [24.998, 56.961, -0.001, 26.002, 57.127, 4.001, "MedicalBackroom_Corridor"], [24.625, 57.124, -0.001, 24.69, 60.876, 4.001, "MedicalBackroom_Corridor"], [52.499, 60.984, -0.001, 56.501, 61.039, 4.001, "CorridorWestA_Wall_E"], [41.499, 60.984, -0.001, 45.501, 61.039, 4.001, "CorridorWestA_Wall_E"], [37.499, 60.984, -0.001, 41.501, 61.039, 4.001, "CorridorWestA_Wall_E"], [56.499, 60.984, -0.001, 59.501, 61.039, 4.001, "CorridorWestA_Wall_E"], [45.499, 60.873, -0.001, 46.001, 61.039, 4.001, "CorridorWestA_Wall_E"], [51.999, 60.873, -0.001, 52.501, 61.039, 4.001, "CorridorWestA_Wall_E"], [40.249, 60.873, -0.001, 40.751, 61.039, 4.001, "CorridorWestA_Wall_E"], [58.999, 60.873, -0.001, 59.501, 61.039, 4.001, "CorridorWestA_Wall_E"], [39.749, 60.985, -0.001, 40.251, 61.101, 4.001, "CorridorWestA_Wall_S_V2"], [39.749, 56.899, -0.001, 40.251, 57.015, 4.001, "CorridorWestA_Wall_S_V2"], [39.999, 56.961, -0.001, 44.001, 57.016, 4.001, "CorridorWestA_Wall_W"], [43.999, 56.961, -0.001, 48.001, 57.016, 4.001, "CorridorWestA_Wall_W"], [48.499, 56.961, -0.001, 52.501, 57.016, 4.001, "CorridorWestA_Wall_W"], [51.164, 56.879, -0.001, 59.722, 57.02, 4.001, "CorridorWestA_Wall_W"], [40.249, 56.961, -0.001, 40.751, 57.127, 4.001, "CorridorWestA_Wall_W"], [47.999, 56.961, -0.001, 48.501, 57.127, 4.001, "CorridorWestA_Wall_W"], [111.999, 27.0, -0.001, 112.501, 27.054, 4.5, "BotanicsGreenhouse_Wall_W"], [86.999, 26.961, -0.001, 91.001, 27.016, 4.001, "BotanicsGreenhouse_Wall_W"], [102.499, 26.961, -0.001, 106.501, 27.016, 4.001, "BotanicsGreenhouse_Wall_W"], [107.999, 26.961, -0.001, 112.001, 27.016, 4.001, "BotanicsGreenhouse_Wall_W"], [91.499, 26.961, -0.001, 95.501, 27.016, 4.001, "BotanicsGreenhouse_Wall_W"], [90.999, 26.961, -0.001, 91.501, 27.127, 4.001, "BotanicsGreenhouse_Wall_W"], [97.999, 56.985, -0.001, 110.001, 57.039, 4.001, "CorridorWestC_Wall_W"], [86.999, 56.961, -0.001, 91.001, 57.016, 4.001, "CorridorWestC_Wall_W"], [90.999, 56.961, -0.001, 95.001, 57.016, 4.001, "CorridorWestC_Wall_W"], [82.999, 56.961, -0.001, 87.001, 57.016, 4.001, "CorridorWestC_Wall_W"], [83.005, 56.961, -0.001, 83.507, 57.127, 4.001, "CorridorWestC_Wall_W"], [92.499, 60.984, -0.001, 96.501, 61.039, 4.001, "CorridorWestC_Wall_E"], [105.249, 60.984, -0.001, 109.251, 61.039, 4.001, "CorridorWestC_Wall_E"], [82.449, 60.984, -0.001, 86.051, 61.039, 4.001, "CorridorWestC_Wall_E"], [78.499, 60.984, -0.001, 82.501, 61.039, 4.001, "CorridorWestC_Wall_E"], [96.499, 60.984, -0.001, 100.501, 61.039, 4.001, "CorridorWestC_Wall_E"], [91.999, 60.873, -0.001, 92.501, 61.039, 4.001, "CorridorWestC_Wall_E"], [108.249, 60.873, -0.001, 108.751, 61.039, 4.001, "CorridorWestC_Wall_E"], [104.499, 60.873, -0.001, 105.251, 61.039, 4.001, "CorridorWestC_Wall_E"], [96.124, 60.873, -0.001, 96.626, 61.039, 4.001, "CorridorWestC_Wall_E"], [83.005, 60.873, -0.001, 83.507, 61.039, 4.001, "CorridorWestC_Wall_E"], [33.999, 86.985, -0.001, 38.163, 87.039, 4.001, "CorridorSouth_Wall_W"], [45.839, 86.985, -0.001, 46.001, 87.039, 4.001, "CorridorSouth_Wall_W"], [52.895, 86.961, -0.001, 56.898, 87.016, 4.001, "CorridorSouth_Wall_W"], [51.996, 86.961, -0.001, 52.811, 87.127, 4.001, "CorridorSouth_Wall_W"], [56.998, 86.961, -0.001, 58.002, 87.127, 4.001, "CorridorSouth_Wall_W"], [45.499, 86.961, -0.001, 46.001, 87.127, 4.001, "CorridorSouth_Wall_W"], [33.999, 86.961, -0.001, 34.501, 87.127, 4.001, "CorridorSouth_Wall_W"], [33.499, 87.0, -0.0, 34.001, 87.054, 4.0, "CorridorSouth_Wall_W"], [24.999, 85.984, -0.001, 27.001, 86.039, 4.001, "Storage_Wall_E_V2"], [27.499, 85.984, -0.001, 31.501, 86.039, 4.001, "Storage_Wall_E_V2"], [35.999, 85.984, -0.001, 40.001, 86.039, 4.001, "Storage_Wall_E_V2"], [31.999, 85.984, -0.001, 36.001, 86.039, 4.001, "Storage_Wall_E_V2"], [51.999, 85.946, -0.0, 52.501, 86.0, 4.0, "Storage_Wall_E_V2"], [34.749, 85.873, -0.001, 35.251, 86.039, 4.001, "Storage_Wall_E_V2"], [31.499, 85.873, -0.001, 32.001, 86.039, 4.001, "Storage_Wall_E_V2"], [26.999, 85.873, -0.001, 27.501, 86.039, 4.001, "Storage_Wall_E_V2"], [45.499, 85.946, -0.0, 46.001, 86.0, 4.0, "Storage_Wall_E_V2"], [24.499, 85.946, -0.0, 25.001, 86.0, 4.0, "Storage_Wall_E_V2"], [91.998, 51.873, -0.001, 93.002, 52.039, 4.001, "BotanicsLab_Wall_E"], [91.984, 51.999, -0.001, 92.039, 56.001, 4.001, "BotanicsLab_Wall_E"], [88.499, 55.984, -0.001, 92.501, 56.039, 4.001, "BotanicsLab_Wall_E"], [99.499, 55.873, -0.001, 100.001, 56.039, 4.001, "BotanicsLab_Wall_E"], [87.999, 55.946, -0.0, 88.501, 56.0, 4.0, "BotanicsLab_Wall_E"], [83.999, 55.984, -0.001, 88.001, 56.039, 4.001, "BotanicsLab_Wall_E"], [88.961, 51.999, -0.001, 89.016, 56.001, 4.001, "BotanicsLab_Wall_E"], [92.999, 55.984, -0.001, 94.847, 56.039, 4.001, "BotanicsLab_Wall_E"], [98.153, 55.984, -0.001, 100.001, 56.039, 4.001, "BotanicsLab_Wall_E"], [92.999, 55.873, -0.001, 93.501, 56.039, 4.001, "BotanicsLab_Wall_E"], [92.961, 51.995, -0.001, 93.127, 52.372, 4.001, "BotanicsLab_Wall_E"], [87.873, 51.995, -0.001, 88.039, 52.372, 4.001, "BotanicsLab_Wall_E"], [92.961, 51.999, -0.001, 93.016, 56.001, 4.001, "BotanicsLab_Wall_E"], [87.984, 51.999, -0.001, 88.039, 56.001, 4.001, "BotanicsLab_Wall_E"], [92.499, 55.946, -0.0, 93.001, 56.0, 4.0, "BotanicsLab_Wall_E"], [91.873, 52.012, -0.001, 92.039, 52.388, 4.001, "BotanicsLab_Wall_E"], [87.998, 51.873, -0.001, 89.002, 52.039, 4.001, "BotanicsLab_Wall_E"], [88.961, 52.012, -0.001, 89.127, 52.388, 4.001, "BotanicsLab_Wall_E"], [102.0, 115.999, -0.001, 102.0, 120.001, 4.001, "SurvellianceCamera_Wall_N"], [101.984, 112.499, -0.001, 102.039, 115.501, 4.001, "SurvellianceCamera_Wall_N"], [101.984, 108.499, -0.001, 102.039, 112.501, 4.001, "SurvellianceCamera_Wall_N"], [101.984, 105.499, -0.001, 102.039, 108.501, 4.001, "SurvellianceCamera_Wall_N"], [101.873, 114.999, -0.001, 102.039, 115.501, 4.001, "SurvellianceCamera_Wall_N"], [101.946, 112.749, -0.0, 102.0, 113.251, 4.0, "SurvellianceCamera_Wall_N"], [100.873, 112.749, -0.001, 101.039, 113.251, 4.001, "SurvellianceCamera_Wall_N"], [101.873, 108.499, -0.001, 102.039, 109.001, 4.001, "SurvellianceCamera_Wall_N"], [74.999, 56.961, -0.001, 79.001, 57.016, 4.001, "CorridorWestB_Wall_W"], [78.496, 56.961, -0.001, 78.998, 57.127, 4.001, "CorridorWestB_Wall_W"], [74.999, 56.961, -0.001, 75.501, 57.127, 4.001, "CorridorWestB_Wall_W"], [69.749, 56.961, -0.001, 70.251, 57.127, 4.001, "CorridorWestB_Wall_W"], [59.67, 56.978, -0.001, 70.126, 57.013, 4.001, "CorridorWestB_Wall_W"], [59.499, 56.961, -0.001, 60.001, 57.127, 4.001, "CorridorWestB_Wall_W"], [88.999, 120.185, -0.001, 92.001, 120.25, 4.001, "Center_Surfaces"], [85.999, 120.185, -0.001, 89.001, 120.25, 4.001, "Center_Surfaces"], [91.999, 119.935, -0.001, 93.001, 120.0, 4.001, "Center_Surfaces"], [84.999, 119.935, -0.001, 86.001, 120.0, 4.001, "Center_Surfaces"], [85.624, 120.071, -0.0, 86.126, 120.125, 4.0, "Center_Surfaces"], [91.874, 120.071, -0.0, 92.376, 120.125, 4.0, "Center_Surfaces"], [115.935, 76.624, -0.005, 116.0, 77.376, 3.501, "Center_Surfaces"], [77.917, 104.957, -0.001, 80.083, 105.265, 3.133, "Center_Surfaces"], [75.735, 99.917, -0.001, 76.043, 102.083, 3.133, "Center_Surfaces"], [58.961, 86.998, -0.001, 59.127, 88.002, 4.001, "Center_Surfaces"], [58.961, 93.998, -0.001, 59.127, 95.002, 4.001, "Center_Surfaces"], [91.999, 61.961, -0.001, 92.501, 62.127, 4.001, "Center_Surfaces"], [85.499, 61.961, -0.001, 86.001, 62.127, 4.001, "Center_Surfaces"], [59.874, 84.5, -0.001, 64.126, 84.565, 3.001, "Center_Surfaces"], [59.874, 84.185, -0.001, 64.126, 84.25, 3.001, "Center_Surfaces"], [32.873, 86.998, -0.001, 33.039, 88.002, 4.001, "MachineShortcut_WallCorridor"], [32.873, 93.998, -0.001, 33.039, 95.002, 4.001, "MachineShortcut_WallCorridor"], [27.999, 94.984, -0.001, 32.001, 95.039, 4.001, "MachineShortcut_WallCorridor"], [31.499, 94.873, -0.001, 32.001, 95.039, 4.001, "MachineShortcut_WallCorridor"], [18.961, 93.998, -0.001, 19.127, 95.002, 4.001, "MachineShortcut_WallCorridor"], [18.961, 86.998, -0.001, 19.127, 88.002, 4.001, "MachineShortcut_WallCorridor"], [16.874, 94.984, -0.001, 20.876, 95.039, 4.001, "MachineShortcut_WallCorridor"], [18.625, 91.249, -0.001, 18.69, 96.251, 4.001, "MachineShortcut_WallCorridor"], [18.625, 85.749, -0.001, 18.69, 90.751, 4.001, "MachineShortcut_WallCorridor"], [73.999, 39.961, -0.001, 78.001, 40.016, 4.001, "BotanicsCubby_Wall_W"], [69.999, 39.961, -0.001, 74.001, 40.016, 4.001, "BotanicsCubby_Wall_W"], [57.873, 86.998, -0.001, 58.039, 88.002, 4.001, "CorridorSouth_Wall_N_V3"], [57.873, 93.998, -0.001, 58.039, 95.002, 4.001, "CorridorSouth_Wall_N_V3"], [57.946, 86.499, -0.0, 58.0, 87.001, 4.0, "CorridorSouth_Wall_N_V3"], [57.873, 94.999, -0.001, 58.039, 95.501, 4.001, "CorridorSouth_Wall_N_V3"], [57.873, 102.499, -0.001, 58.039, 103.001, 4.001, "CorridorSouth_Wall_N_V3"], [57.984, 99.499, -0.001, 58.039, 102.501, 4.001, "CorridorSouth_Wall_N_V3"], [57.873, 98.999, -0.001, 58.039, 99.501, 4.001, "CorridorSouth_Wall_N_V3"], [57.984, 102.499, -0.001, 58.039, 105.501, 4.001, "CorridorSouth_Wall_N_V3"], [73.999, 48.984, -0.001, 78.001, 49.039, 4.001, "BotanicsCubby_Wall_E"], [69.999, 48.984, -0.001, 74.001, 49.039, 4.001, "BotanicsCubby_Wall_E"], [36.749, 55.984, -0.001, 40.751, 56.039, 4.001, "MedicalBackroom_Wall_E"], [32.749, 55.984, -0.001, 36.751, 56.039, 4.001, "MedicalBackroom_Wall_E"], [32.249, 55.946, -0.001, 32.751, 56.0, 4.5, "MedicalBackroom_Wall_E"], [40.499, 55.946, -0.001, 41.001, 56.0, 4.5, "MedicalBackroom_Wall_E"], [25.249, 55.946, -0.001, 25.751, 56.0, 4.5, "MedicalBackroom_Wall_E"], [24.749, 55.946, -0.001, 25.251, 56.0, 4.5, "MedicalBackroom_Wall_E"], [28.999, 33.985, -0.001, 41.001, 34.039, 4.001, "MedicalBackroom_Wall_W"], [24.999, 33.961, -0.001, 29.001, 34.016, 4.001, "MedicalBackroom_Wall_W"], [28.961, 95.999, -0.001, 29.016, 100.001, 4.001, "Machine_Wall_S_V2"], [28.999, 95.961, -0.001, 29.501, 96.127, 4.001, "Machine_Wall_S_V2"], [28.961, 100.499, -0.001, 29.016, 104.501, 4.001, "Machine_Wall_S_V2"], [28.961, 112.499, -0.001, 29.127, 113.001, 4.001, "Machine_Wall_S_V2"], [28.961, 99.999, -0.001, 29.127, 100.501, 4.001, "Machine_Wall_S_V2"], [28.961, 104.499, -0.001, 29.127, 105.001, 4.001, "Machine_Wall_S_V2"], [29.0, 112.999, -0.0, 29.054, 113.501, 4.0, "Machine_Wall_S_V2"], [29.0, 110.999, -0.001, 29.065, 112.001, 4.001, "Machine_Wall_S_V2"], [29.0, 111.999, -0.0, 29.054, 112.501, 4.0, "Machine_Wall_S_V2"], [28.999, 102.312, -0.005, 29.108, 102.688, 4.5, "Machine_Wall_S_V2"], [27.998, 113.961, -0.001, 29.002, 114.127, 4.001, "MachineShortcut_Wall_M"], [20.999, 121.961, -0.001, 33.001, 122.015, 4.001, "MachineShortcut_Wall_E"], [32.984, 113.999, -0.001, 33.039, 118.001, 4.001, "MachineShortcut_Wall_E"], [32.873, 113.999, -0.001, 33.039, 114.501, 4.001, "MachineShortcut_Wall_E"], [32.873, 117.499, -0.001, 33.039, 118.001, 4.001, "MachineShortcut_Wall_E"], [32.946, 117.999, -0.0, 33.0, 118.501, 4.0, "MachineShortcut_Wall_E"], [32.984, 118.499, -0.001, 33.039, 122.501, 4.001, "MachineShortcut_Wall_E"], [52.984, 96.999, -0.001, 53.039, 101.001, 4.001, "Machine_Wall_N"], [52.984, 104.999, -0.001, 53.039, 109.001, 4.001, "Machine_Wall_N"], [52.984, 108.999, -0.001, 53.039, 113.001, 4.001, "Machine_Wall_N"], [52.984, 100.999, -0.001, 53.039, 105.001, 4.001, "Machine_Wall_N"], [52.873, 95.999, -0.001, 53.039, 96.501, 4.001, "Machine_Wall_N"], [52.873, 96.499, -0.001, 53.039, 97.001, 4.001, "Machine_Wall_N"], [52.946, 95.499, -0.0, 53.0, 96.001, 4.0, "Machine_Wall_N"], [52.873, 112.499, -0.001, 53.039, 113.001, 4.001, "Machine_Wall_N"], [52.873, 107.249, -0.001, 53.039, 107.751, 4.001, "Machine_Wall_N"], [52.873, 100.999, -0.005, 53.039, 101.501, 3.251, "Machine_Wall_N"], [41.961, 113.999, -0.001, 42.016, 118.001, 4.001, "Machine_Wall_C_V3"], [48.999, 117.984, -0.001, 53.001, 118.039, 4.001, "Machine_Wall_C_V3"], [44.999, 117.984, -0.001, 49.001, 118.039, 4.001, "Machine_Wall_C_V3"], [52.984, 113.999, -0.001, 53.039, 118.001, 4.001, "Machine_Wall_C_V3"], [50.124, 113.961, -0.001, 53.126, 114.016, 4.001, "Machine_Wall_C_V3"], [52.873, 113.949, -0.001, 53.039, 114.451, 4.001, "Machine_Wall_C_V3"], [52.873, 117.549, -0.001, 53.039, 118.051, 4.001, "Machine_Wall_C_V3"], [40.999, 117.984, -0.001, 45.001, 118.039, 4.001, "Machine_Wall_C_V3"], [45.984, 99.999, -0.001, 46.039, 104.001, 4.001, "Machine_Wall_C_V3"], [45.984, 104.499, -0.001, 46.039, 108.501, 4.001, "Machine_Wall_C_V3"], [45.984, 108.499, -0.001, 46.039, 112.501, 4.001, "Machine_Wall_C_V3"], [46.961, 108.999, -0.001, 47.016, 113.001, 4.001, "Machine_Wall_C_V3"], [46.961, 104.999, -0.001, 47.016, 109.001, 4.001, "Machine_Wall_C_V3"], [46.961, 100.499, -0.001, 47.016, 104.501, 4.001, "Machine_Wall_C_V3"], [45.873, 103.999, -0.001, 46.039, 104.501, 4.001, "Machine_Wall_C_V3"], [45.873, 112.499, -0.001, 46.039, 113.001, 4.001, "Machine_Wall_C_V3"], [46.961, 104.499, -0.001, 47.127, 105.001, 4.001, "Machine_Wall_C_V3"], [46.961, 99.999, -0.001, 47.127, 100.501, 4.001, "Machine_Wall_C_V3"], [52.946, 112.999, -0.0, 53.0, 113.501, 4.0, "Machine_Wall_C_V3"], [45.998, 99.873, -0.001, 47.002, 100.039, 3.999, "Machine_Wall_C_V3"], [45.998, 113.961, -0.001, 47.002, 114.127, 4.001, "Machine_Wall_C_V3"], [52.946, 117.999, -0.0, 53.0, 118.501, 4.0, "Machine_Wall_C_V3"], [27.961, 94.999, -0.001, 28.015, 105.001, 4.001, "MachineShortcut_Wall_N"], [27.984, 110.999, -0.001, 28.039, 114.001, 4.001, "MachineShortcut_Wall_N"], [20.961, 113.999, -0.001, 21.016, 118.001, 4.001, "MachineShortcut_Wall_S"], [20.961, 109.999, -0.001, 21.016, 114.001, 4.001, "MachineShortcut_Wall_S"], [20.961, 105.999, -0.001, 21.016, 110.001, 4.001, "MachineShortcut_Wall_S"], [20.961, 117.499, -0.001, 21.127, 118.001, 4.001, "MachineShortcut_Wall_S"], [21.0, 117.999, -0.0, 21.054, 118.501, 4.0, "MachineShortcut_Wall_S"], [20.961, 96.499, -0.001, 21.016, 100.501, 4.001, "MachineShortcut_Wall_S"], [20.961, 100.999, -0.001, 21.016, 105.001, 4.001, "MachineShortcut_Wall_S"], [20.961, 100.499, -0.001, 21.127, 101.001, 4.001, "MachineShortcut_Wall_S"], [20.961, 95.999, -0.001, 21.127, 96.501, 4.001, "MachineShortcut_Wall_S"], [20.999, 103.946, -0.0, 21.501, 104.0, 4.0, "MachineShortcut_Wall_S"], [20.961, 118.236, -0.001, 21.016, 122.264, 4.401, "MachineShortcut_Wall_S"], [32.999, 112.984, -0.001, 37.001, 113.039, 4.001, "Machine_Wall_E_V2"], [36.999, 112.984, -0.001, 41.001, 113.039, 4.001, "Machine_Wall_E_V2"], [40.499, 112.873, -0.001, 41.001, 113.039, 4.001, "Machine_Wall_E_V2"], [40.999, 112.965, -0.001, 42.001, 113.03, 4.5, "Machine_Wall_E_V2"], [24.961, 76.249, -0.001, 25.127, 76.751, 4.001, "Storage_Wall_S_V2"], [24.961, 74.249, -0.001, 25.127, 74.751, 4.001, "Storage_Wall_S_V2"], [24.961, 61.499, -0.001, 25.016, 65.501, 4.001, "Storage_Wall_S_V2"], [24.961, 71.249, -0.001, 25.127, 71.751, 4.001, "Storage_Wall_S_V2"], [24.961, 65.499, -0.001, 25.127, 66.001, 4.001, "Storage_Wall_S_V2"], [24.961, 61.999, -0.001, 25.127, 62.501, 4.001, "Storage_Wall_S_V2"], [24.961, 79.249, -0.001, 25.127, 79.751, 4.001, "Storage_Wall_S_V2"], [24.961, 74.499, -0.001, 25.016, 76.501, 4.001, "Storage_Wall_S_V2"], [24.961, 79.549, -0.001, 25.016, 81.951, 4.001, "Storage_Wall_S_V2"], [24.961, 70.749, -0.001, 25.127, 71.251, 4.001, "Storage_Wall_S_V2"], [49.999, 94.984, -0.001, 54.001, 95.039, 4.001, "CorridorSouth_Wall_E_V3"], [31.499, 94.984, -0.001, 35.501, 95.039, 4.001, "CorridorSouth_Wall_E_V3"], [53.961, 94.999, -0.001, 54.127, 95.501, 4.001, "CorridorSouth_Wall_E_V3"], [53.961, 102.499, -0.001, 54.127, 103.001, 4.001, "CorridorSouth_Wall_E_V3"], [53.961, 102.499, -0.001, 54.016, 105.501, 4.001, "CorridorSouth_Wall_E_V3"], [53.961, 95.499, -0.001, 54.016, 99.501, 4.001, "CorridorSouth_Wall_E_V3"], [53.961, 99.499, -0.001, 54.016, 102.501, 4.001, "CorridorSouth_Wall_E_V3"], [53.961, 95.999, -0.001, 54.127, 96.501, 4.001, "CorridorSouth_Wall_E_V3"], [39.499, 94.873, -0.001, 40.001, 95.039, 4.001, "CorridorSouth_Wall_E_V3"], [45.999, 94.873, -0.001, 46.501, 95.039, 4.001, "CorridorSouth_Wall_E_V3"], [45.999, 94.984, -0.001, 50.001, 95.039, 4.001, "CorridorSouth_Wall_E_V3"], [35.499, 94.984, -0.001, 39.501, 95.039, 4.001, "CorridorSouth_Wall_E_V3"], [53.499, 94.873, -0.001, 54.001, 95.039, 4.001, "CorridorSouth_Wall_E_V3"], [66.999, 60.961, -0.001, 79.001, 61.015, 4.001, "CorridorWestB_Wall_E_V2"], [58.999, 60.984, -0.001, 61.001, 61.039, 4.001, "CorridorWestB_Wall_E_V2"], [65.423, 60.946, -0.001, 68.085, 61.0, 4.001, "CorridorWestB_Wall_E_V2"], [78.491, 60.873, -0.001, 78.993, 61.039, 4.001, "CorridorWestB_Wall_E_V2"], [68.002, 60.873, -0.001, 68.504, 61.039, 4.001, "CorridorWestB_Wall_E_V2"], [64.999, 60.873, -0.001, 65.501, 61.039, 4.001, "CorridorWestB_Wall_E_V2"], [59.499, 60.873, -0.001, 60.001, 61.039, 4.001, "CorridorWestB_Wall_E_V2"], [75.999, 105.961, -0.001, 80.001, 106.016, 4.001, "SurvellianceArmory_Wall_W_V2"], [79.999, 105.961, -0.001, 84.001, 106.016, 4.001, "SurvellianceArmory_Wall_W_V2"], [70.999, 105.961, -0.001, 75.001, 106.016, 4.001, "SurvellianceArmory_Wall_W_V2"], [73.974, 114.05, -0.001, 74.001, 114.95, 1.923, "SurvellianceArmory_Wall_W_V2"], [73.974, 112.55, -0.001, 74.001, 113.45, 1.923, "SurvellianceArmory_Wall_W_V2"], [75.061, 105.951, -0.001, 75.939, 106.159, 4.001, "SurvellianceArmory_Wall_W_V2"], [58.999, 105.985, -0.001, 71.001, 106.039, 4.001, "SurvellianceArmory_Wall_W_V2"], [57.999, 105.961, -0.001, 58.501, 106.127, 4.001, "SurvellianceArmory_Wall_W_V2"], [58.499, 106.0, -0.0, 59.001, 106.054, 4.0, "SurvellianceArmory_Wall_W_V2"], [73.974, 115.55, -0.001, 74.001, 116.45, 1.923, "SurvellianceArmory_Wall_W_V2"], [73.972, 111.069, -0.001, 74.102, 117.931, 4.5, "SurvellianceArmory_Wall_W_V2"], [25.0, 33.999, -0.001, 25.054, 34.501, 4.5, "MedicalBackroom_Wall_S"], [25.0, 33.499, -0.001, 25.054, 34.001, 4.5, "MedicalBackroom_Wall_S"], [24.961, 34.249, -0.001, 25.016, 38.251, 4.001, "MedicalBackroom_Wall_S"], [25.0, 38.499, -0.001, 25.054, 39.001, 4.5, "MedicalBackroom_Wall_S"], [25.0, 37.999, -0.001, 25.054, 38.501, 4.5, "MedicalBackroom_Wall_S"], [25.0, 55.499, -0.001, 25.054, 56.001, 4.5, "MedicalBackroom_Wall_S"], [25.0, 38.999, -0.001, 25.054, 39.501, 4.5, "MedicalBackroom_Wall_S"], [25.0, 51.499, -0.001, 25.054, 52.001, 4.5, "MedicalBackroom_Wall_S"], [24.961, 51.749, -0.001, 25.016, 55.751, 4.001, "MedicalBackroom_Wall_S"], [25.0, 47.249, -0.001, 25.054, 47.751, 4.5, "MedicalBackroom_Wall_S"], [25.0, 43.249, -0.001, 25.054, 43.751, 4.5, "MedicalBackroom_Wall_S"], [63.999, 26.961, -0.001, 64.501, 27.127, 4.001, "MedicalCorridor_Surfaces"], [77.499, 26.961, -0.001, 78.001, 27.127, 4.001, "MedicalCorridor_Surfaces"], [69.499, 26.961, -0.001, 73.501, 27.016, 4.001, "MedicalCorridor_Surfaces"], [73.499, 26.961, -0.001, 77.501, 27.016, 4.001, "MedicalCorridor_Surfaces"], [68.499, 26.961, -0.001, 69.001, 27.127, 4.001, "MedicalCorridor_Surfaces"], [68.999, 27.0, -0.0, 69.501, 27.054, 4.0, "MedicalCorridor_Surfaces"], [64.499, 30.961, -0.001, 76.501, 31.015, 4.001, "MedicalCorridor_Surfaces"], [63.999, 30.873, -0.001, 64.501, 31.039, 4.001, "MedicalCorridor_Surfaces"], [77.499, 30.873, -0.001, 78.001, 31.039, 4.001, "MedicalCorridor_Surfaces"], [76.435, 30.999, -0.001, 77.565, 31.043, 4.001, "MedicalCorridor_Surfaces"], [63.973, 30.999, -0.0, 64.0, 31.251, 4.0, "MedicalCorridor_Surfaces"], [63.973, 26.749, -0.0, 64.0, 27.001, 4.0, "MedicalCorridor_Surfaces"], [60.62, 21.584, -0.001, 63.321, 21.649, 4.001, "MedicalCorridor_Surfaces"]];

// Overhead doorway lintel headers (Z=2.35m..4.0m)
export const VERIFIED_DOOR_LINTELS: Box2DM[] = [[112.0, 28.749, 2.35, 113.0, 34.751, 4.0, "BotanicsGreenhouse_Wall_N"], [112.0, 34.749, 2.35, 113.0, 40.751, 4.0, "BotanicsGreenhouse_Wall_N"], [112.0, 40.749, 2.35, 113.0, 46.751, 4.0, "BotanicsGreenhouse_Wall_N"], [78.999, 31.941, 2.35, 83.001, 33.059, 4.0, "WestCorridorBotanics_Wall_W_V2"], [78.999, 20.941, 2.35, 83.001, 22.059, 4.0, "MedicalCorridor_Surfaces2"], [82.965, 27.861, 2.35, 84.035, 30.139, 3.194, "MedicalCorridor_Surfaces2"], [51.984, 61.999, 2.35, 52.876, 86.001, 4.0, "Storage_Wall_N"], [101.999, 41.952, 2.35, 103.001, 43.001, 4.0, "BotanicsGreenhouse_OuterRoom3"], [37.983, 60.984, 2.35, 46.019, 62.001, 4.0, "Storage_Wall_W_V2"], [78.931, 43.889, 2.35, 80.069, 49.111, 4.0, "WestCorridorBotanics_Wall_S_V2"], [78.999, 33.725, 2.35, 79.501, 42.275, 4.0, "WestCorridorBotanics_Wall_S_V2"], [78.6, 51.999, 2.35, 79.123, 56.001, 4.0, "WestCorridorBotanics_Wall_S_V2"], [82.499, 47.977, 2.35, 83.001, 56.023, 4.0, "WestCorridorBotanics_Wall_N_V2"], [82.941, 37.999, 2.35, 84.059, 44.001, 4.0, "WestCorridorBotanics_Wall_N_V2"], [19.87, 85.955, 2.35, 24.073, 87.045, 4.0, "MachineShortcut_Wall_W"], [23.941, 56.999, 2.35, 25.059, 61.001, 4.0, "MedicalBackroom_Corridor"], [45.999, 60.941, 2.35, 52.001, 62.059, 4.0, "CorridorWestA_Wall_E"], [39.191, 56.999, 2.35, 40.309, 61.001, 4.0, "CorridorWestA_Wall_S_V2"], [37.983, 67.999, 2.35, 46.019, 69.016, 4.0, "Storage_Wall_M"], [37.983, 79.999, 2.35, 46.019, 81.016, 4.0, "Storage_Wall_M"], [37.983, 73.999, 2.35, 46.019, 75.016, 4.0, "Storage_Wall_M"], [54.701, 55.934, 2.35, 59.299, 57.066, 3.286, "CorridorWestA_Wall_W"], [108.941, 56.999, 2.35, 109.358, 61.001, 4.0, "CorridorWestC_Wall_N"], [78.927, 55.955, 2.35, 83.13, 57.045, 4.0, "CorridorWestC_Wall_W"], [94.667, 56.931, 2.35, 98.333, 58.069, 4.0, "CorridorWestC_Wall_W"], [85.999, 60.941, 2.35, 92.001, 62.059, 4.0, "CorridorWestC_Wall_E"], [100.499, 60.877, 2.35, 104.501, 61.4, 4.0, "CorridorWestC_Wall_E"], [45.999, 85.941, 2.35, 52.001, 87.059, 4.0, "CorridorSouth_Wall_W"], [37.983, 85.999, 2.35, 46.019, 87.016, 4.0, "Storage_Wall_E_V2"], [69.889, 55.931, 2.35, 75.111, 57.069, 4.0, "CorridorWestB_Wall_W"], [85.999, 119.941, 2.35, 92.001, 121.059, 4.0, "Center_Surfaces"], [58.999, 85.099, 2.35, 66.201, 85.901, 4.0, "Center_Surfaces"], [59.974, 83.989, 2.35, 64.026, 85.011, 3.001, "Center_Surfaces"], [77.861, 75.965, 2.35, 80.139, 77.035, 3.194, "Center_Surfaces"], [92.965, 63.792, 2.35, 94.035, 67.208, 3.194, "Center_Surfaces"], [32.941, 87.999, 2.35, 34.059, 94.001, 4.0, "MachineShortcut_WallCorridor"], [17.941, 87.999, 2.35, 19.059, 94.001, 4.0, "MachineShortcut_WallCorridor"], [20.772, 94.955, 2.35, 28.128, 96.045, 4.0, "MachineShortcut_WallCorridor"], [57.941, 87.999, 2.35, 59.059, 94.001, 4.0, "CorridorSouth_Wall_N_V3"], [57.877, 95.499, 2.35, 58.4, 99.501, 4.0, "CorridorSouth_Wall_N_V3"], [32.999, 47.499, 2.35, 34.001, 51.501, 4.0, "MedicalBackroom_Wall_E"], [32.999, 39.499, 2.35, 34.001, 43.501, 4.0, "MedicalBackroom_Wall_E"], [25.584, 55.965, 2.35, 32.416, 57.035, 4.0, "MedicalBackroom_Wall_E"], [41.892, 112.92, 2.35, 53.001, 114.069, 4.0, "Machine_Wall_C_V3"], [27.975, 104.999, 2.35, 29.025, 111.001, 4.0, "MachineShortcut_Wall_N"], [20.999, 103.999, 2.35, 22.048, 105.001, 4.0, "MachineShortcut_Wall_S"], [23.931, 76.499, 2.35, 25.069, 79.501, 4.0, "Storage_Wall_S_V2"], [23.931, 71.499, 2.35, 25.069, 74.501, 4.0, "Storage_Wall_S_V2"], [23.931, 65.889, 2.35, 25.069, 71.111, 4.0, "Storage_Wall_S_V2"], [16.487, 76.947, 2.35, 32.001, 79.053, 4.0, "Storage_Wall_S_V2"], [16.487, 71.947, 2.35, 32.001, 74.053, 4.0, "Storage_Wall_S_V2"], [16.487, 66.947, 2.35, 32.001, 69.053, 4.0, "Storage_Wall_S_V2"], [39.999, 94.941, 2.35, 46.001, 96.059, 4.0, "CorridorSouth_Wall_E_V3"], [60.927, 60.955, 2.35, 65.13, 62.045, 4.0, "CorridorWestB_Wall_E_V2"], [64.499, 26.6, 2.35, 68.501, 27.123, 4.0, "MedicalCorridor_Surfaces"], [59.999, 20.941, 2.35, 64.001, 22.059, 4.0, "MedicalCorridor_Surfaces"]];

// Verified lower-deck solid furniture & lab counters
export const VERIFIED_LOWER_FURN: Box2DM[] = [[81.904, 37.694, 0.0, 82.769, 38.558, 0.826, "WestCorridorBotanics_Furnitures_V2"], [80.903, 35.459, -0.001, 83.041, 37.541, 2.001, "WestCorridorBotanics_Furnitures_V2"], [82.391, 44.474, -0.001, 83.025, 45.108, 0.834, "WestCorridorBotanics_Furnitures_V2"], [82.344, 45.048, -0.001, 82.996, 45.7, 0.834, "WestCorridorBotanics_Furnitures_V2"], [82.473, 46.689, -0.001, 83.124, 47.341, 0.834, "WestCorridorBotanics_Furnitures_V2"], [41.999, 39.0, -0.0, 46.001, 40.04, 2.0, "Medical_Furnitures2_V2"], [29.249, 85.773, -0.001, 31.251, 86.025, 2.001, "Storage_Furnitures2_V2"], [29.249, 85.523, -0.001, 31.251, 85.775, 2.001, "Storage_Furnitures2_V2"], [29.249, 84.994, -0.003, 31.251, 85.537, 2.011, "Storage_Furnitures2_V2"], [35.999, 73.773, -0.001, 38.001, 74.025, 2.001, "Storage_Furnitures2_V2"], [35.999, 73.523, -0.001, 38.001, 73.775, 2.001, "Storage_Furnitures2_V2"], [35.999, 72.994, -0.003, 38.001, 73.537, 2.011, "Storage_Furnitures2_V2"], [33.352, 84.911, -0.004, 34.341, 85.735, 0.579, "Storage_Furnitures_V2"], [37.159, 67.393, 0.0, 37.974, 68.208, 0.826, "Storage_Furnitures_V2"], [37.163, 85.147, 0.0, 37.97, 85.953, 0.826, "Storage_Furnitures_V2"], [36.933, 77.049, 0.999, 38.094, 79.098, 2.001, "Storage_Furnitures_V2"], [32.791, 85.187, -0.001, 33.221, 85.617, 0.561, "Storage_Furnitures_V2"], [32.734, 84.993, -0.001, 35.736, 85.995, 1.001, "Storage_Furnitures_V2"], [37.219, 78.987, 0.002, 38.029, 79.919, 1.477, "Storage_Furnitures_V2"], [25.053, 76.123, 0.002, 25.985, 76.934, 1.477, "Storage_Furnitures_V2"], [91.214, 110.11, -0.005, 92.142, 110.992, 2.203, "Center_Furnitures2_V2"], [85.897, 104.572, -0.005, 86.755, 105.436, 2.203, "Center_Furnitures2_V2"], [92.681, 108.23, -0.005, 93.057, 109.234, 0.658, "Center_Furnitures2_V2"], [85.078, 110.121, -0.001, 85.879, 112.55, 0.484, "Center_Furnitures2_V2"], [85.018, 119.046, -0.002, 85.925, 119.954, 0.824, "Center_Furnitures2_V2"], [70.051, 55.152, 0.121, 70.948, 55.848, 0.704, "RestaurantCubby_Furnitures"], [70.047, 54.378, 0.121, 70.995, 55.142, 0.704, "RestaurantCubby_Furnitures"], [70.051, 53.694, 0.121, 70.952, 54.395, 0.704, "RestaurantCubby_Furnitures"], [70.269, 52.165, 0.124, 70.918, 53.372, 0.726, "RestaurantCubby_Furnitures"], [73.499, 49.999, -0.001, 75.501, 51.001, 1.001, "RestaurantCubby_Furnitures"], [69.999, 49.999, -0.001, 71.06, 52.001, 1.001, "RestaurantCubby_Furnitures"], [75.999, 54.94, -0.001, 78.001, 56.001, 1.001, "RestaurantCubby_Furnitures"], [98.999, 48.999, -0.001, 100.001, 51.001, 1.001, "BotanicsLab_Furnitures"], [89.999, 47.999, -0.001, 92.001, 49.001, 1.001, "BotanicsLab_Furnitures"], [98.999, 50.999, -0.001, 100.001, 53.001, 1.193, "BotanicsLab_Furnitures"], [98.999, 52.999, -0.001, 100.001, 54.001, 1.001, "BotanicsLab_Furnitures"], [87.999, 47.999, -0.001, 90.001, 49.001, 1.001, "BotanicsLab_Furnitures"], [92.999, 47.999, -0.001, 96.001, 49.001, 1.001, "BotanicsLab_Furnitures"], [85.999, 47.999, -0.001, 88.001, 49.001, 1.193, "BotanicsLab_Furnitures"], [84.999, 47.999, -0.001, 86.001, 49.001, 1.001, "BotanicsLab_Furnitures"], [91.999, 47.999, -0.001, 93.001, 49.001, 1.001, "BotanicsLab_Furnitures"], [95.999, 47.999, -0.001, 99.001, 49.001, 1.001, "BotanicsLab_Furnitures"], [98.999, 53.999, -0.001, 100.001, 56.001, 1.001, "BotanicsLab_Furnitures"], [98.999, 47.999, -0.001, 100.001, 49.046, 1.001, "BotanicsLab_Furnitures"], [88.999, 54.999, -0.001, 92.001, 56.001, 1.001, "BotanicsLab_Furnitures"], [99.552, 49.845, 0.999, 99.855, 50.351, 1.531, "BotanicsLab_Furnitures"], [52.379, 59.727, -0.002, 53.945, 61.075, 1.179, "CorridorWestA_Furnitures"], [45.528, 59.984, 0.002, 46.397, 60.96, 1.477, "CorridorWestA_Furnitures"], [84.139, 33.617, -0.004, 84.964, 34.605, 0.579, "BotanicsGreenhouse_Furnitures_V2"], [99.918, 45.56, -0.004, 100.77, 46.567, 0.579, "BotanicsGreenhouse_Furnitures_V2"], [97.169, 46.217, 0.0, 97.968, 47.016, 0.826, "BotanicsGreenhouse_Furnitures_V2"], [110.99, 45.94, -0.001, 112.01, 46.959, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [102.999, 43.999, -0.001, 104.001, 45.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [96.999, 42.999, -0.001, 98.001, 44.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [83.979, 43.966, -0.001, 85.048, 45.034, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [91.978, 30.982, -0.001, 93.014, 32.018, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [91.998, 27.001, -0.001, 93.05, 28.053, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [102.999, 30.999, -0.001, 104.06, 33.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [102.999, 35.999, -0.001, 105.001, 37.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [108.999, 45.999, -0.001, 111.001, 47.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [83.999, 44.999, -0.001, 85.001, 47.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [102.999, 26.999, -0.001, 105.001, 28.06, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [96.999, 40.999, -0.001, 98.06, 43.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [88.999, 36.999, -0.001, 91.001, 38.06, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [87.999, 45.94, -0.001, 90.001, 47.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [92.936, 40.943, 0.999, 94.002, 42.009, 2.001, "BotanicsGreenhouse_Furnitures_V2"], [89.999, 26.999, -0.001, 92.001, 28.06, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [88.931, 26.978, -0.001, 89.989, 28.078, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [92.98, 40.911, -0.001, 94.038, 42.011, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [109.927, 41.984, -0.001, 112.016, 44.016, 2.001, "BotanicsGreenhouse_Furnitures_V2"], [102.985, 41.999, -0.001, 107.037, 44.001, 2.501, "BotanicsGreenhouse_Furnitures_V2"], [109.374, 35.366, -0.001, 110.025, 36.017, 0.834, "BotanicsGreenhouse_Furnitures_V2"], [84.227, 30.222, -0.001, 84.873, 30.868, 0.834, "BotanicsGreenhouse_Furnitures_V2"], [92.378, 31.979, -0.001, 93.021, 32.623, 0.834, "BotanicsGreenhouse_Furnitures_V2"], [84.257, 33.056, -0.001, 84.688, 33.486, 0.561, "BotanicsGreenhouse_Furnitures_V2"], [91.963, 41.879, -0.002, 94.037, 43.033, 2.001, "BotanicsGreenhouse_Furnitures_V2"], [88.989, 35.904, -0.002, 90.981, 37.012, 1.921, "BotanicsGreenhouse_Furnitures_V2"], [90.941, 35.956, -0.002, 92.995, 37.185, 1.921, "BotanicsGreenhouse_Furnitures_V2"], [99.999, 43.999, -0.001, 101.0, 47.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [84.0, 32.999, -0.001, 85.001, 36.001, 1.001, "BotanicsGreenhouse_Furnitures_V2"], [115.17, 82.47, -0.001, 115.974, 84.901, 0.484, "Center_Furnitures"], [91.531, 94.19, -0.005, 93.454, 96.679, 0.395, "Center_Furnitures"], [92.068, 62.108, 0.0, 92.954, 62.993, 0.826, "Center_Furnitures"], [85.074, 62.076, 0.0, 85.951, 62.954, 0.826, "Center_Furnitures"], [65.111, 86.099, 0.0, 65.934, 86.922, 0.826, "Center_Furnitures"], [59.119, 93.127, -0.005, 60.582, 94.464, 2.482, "Center_Furnitures"], [60.153, 92.445, -0.0, 60.933, 93.147, 0.377, "Center_Furnitures"], [59.491, 88.055, -0.002, 60.783, 89.589, 1.179, "Center_Furnitures"], [59.253, 87.115, 0.002, 60.197, 87.942, 1.477, "Center_Furnitures"], [109.374, 62.281, 0.0, 110.206, 63.113, 0.826, "OfficeN_Furnitures"], [94.074, 70.181, 0.0, 94.906, 71.013, 0.826, "OfficeN_Furnitures"], [108.983, 62.078, -0.005, 109.328, 63.084, 0.661, "OfficeN_Furnitures"], [115.071, 70.061, 0.0, 115.903, 70.893, 0.826, "OfficeN_Furnitures"], [107.083, 75.42, 0.0, 107.914, 76.251, 0.826, "OfficeN_Furnitures"], [106.58, 75.323, -0.001, 106.862, 76.098, 0.713, "OfficeN_Furnitures"], [106.244, 75.316, -0.001, 106.578, 76.106, 0.713, "OfficeN_Furnitures"], [105.172, 75.358, 0.0, 106.285, 76.127, 0.564, "OfficeN_Furnitures"], [104.13, 75.377, -0.001, 104.664, 76.109, 0.39, "OfficeN_Furnitures"], [104.663, 75.379, -0.001, 105.188, 76.106, 0.39, "OfficeN_Furnitures"], [104.389, 75.54, 0.376, 105.177, 76.161, 0.767, "OfficeN_Furnitures"], [110.617, 75.27, 0.0, 111.749, 76.219, 0.564, "OfficeN_Furnitures"], [111.76, 75.657, -0.001, 112.132, 76.028, 0.551, "OfficeN_Furnitures"], [97.513, 75.323, -0.001, 97.795, 76.098, 0.713, "OfficeN_Furnitures"], [97.827, 75.315, -0.001, 98.409, 76.031, 0.388, "OfficeN_Furnitures"], [93.499, 67.999, -0.001, 94.501, 69.001, 1.0, "OfficeN_Furnitures"], [115.499, 63.919, -0.001, 116.501, 67.911, 1.0, "OfficeN_Furnitures"], [96.499, 61.499, -0.001, 100.501, 62.501, 2.0, "OfficeN_Furnitures"], [103.499, 61.499, -0.001, 106.501, 62.501, 1.0, "OfficeN_Furnitures"], [102.499, 61.999, -0.001, 103.501, 63.001, 1.0, "OfficeN_Furnitures"], [106.499, 61.999, -0.001, 107.501, 63.001, 1.0, "OfficeN_Furnitures"], [107.028, 61.999, 0.01, 107.685, 62.618, 2.109, "OfficeN_Furnitures"], [103.79, 74.54, 0.0, 104.682, 75.432, 1.307, "OfficeN_Furnitures"], [98.293, 74.77, 0.0, 99.206, 75.683, 1.307, "OfficeN_Furnitures"], [111.364, 74.819, 0.0, 112.136, 75.589, 1.307, "OfficeN_Furnitures"], [95.499, 75.25, -0.0, 99.501, 76.25, 1.0, "OfficeN_Furnitures"], [109.499, 75.25, -0.0, 113.501, 76.25, 1.0, "OfficeN_Furnitures"], [103.999, 75.249, -0.001, 107.001, 76.251, 1.0, "OfficeN_Furnitures"], [115.008, 64.414, 0.999, 116.005, 67.127, 1.814, "OfficeN_Furnitures"], [61.387, 57.016, 0.0, 62.078, 57.666, 2.407, "CorridorWestB_Furnitures"], [59.841, 57.067, -0.002, 61.721, 58.549, 1.254, "CorridorWestB_Furnitures"], [60.818, 57.274, 0.31, 61.416, 58.006, 0.699, "CorridorWestB_Furnitures"], [48.598, 33.999, -0.001, 52.402, 34.771, 0.9, "MedicalBackroom_Furnitures"], [38.999, 43.999, -0.001, 41.001, 45.001, 0.531, "MedicalBackroom_Furnitures"], [38.999, 45.999, -0.001, 41.001, 47.001, 0.531, "MedicalBackroom_Furnitures"], [38.999, 48.499, -0.001, 41.001, 49.501, 0.531, "MedicalBackroom_Furnitures"], [21.999, 40.999, -0.0, 24.001, 42.001, 0.751, "MedicalBackroom_Furnitures"], [21.999, 48.999, -0.0, 24.001, 50.001, 0.751, "MedicalBackroom_Furnitures"], [21.999, 44.999, -0.0, 24.001, 46.001, 0.751, "MedicalBackroom_Furnitures"], [52.642, 34.042, 0.0, 53.436, 34.836, 0.826, "MedicalBackroom_Furnitures"], [40.145, 34.042, 0.0, 40.939, 34.836, 0.826, "MedicalBackroom_Furnitures"], [47.704, 34.079, -0.005, 48.386, 34.722, 2.367, "MedicalBackroom_Furnitures"], [36.982, 55.303, 0.0, 37.634, 55.986, 2.407, "MedicalBackroom_Furnitures"], [40.276, 46.953, 0.0, 40.966, 47.603, 2.407, "MedicalBackroom_Furnitures"], [48.085, 36.394, -0.002, 49.956, 37.857, 1.254, "MedicalBackroom_Furnitures"], [39.505, 40.351, -0.002, 41.016, 42.242, 1.254, "MedicalBackroom_Furnitures"], [32.999, 54.999, -0.001, 37.001, 56.001, 2.0, "MedicalBackroom_Furnitures"], [42.499, 33.499, -0.001, 45.501, 34.501, 1.0, "MedicalBackroom_Furnitures"], [40.611, 40.499, -0.005, 40.962, 40.85, 0.348, "MedicalBackroom_Furnitures"], [49.52, 37.588, -0.005, 49.87, 37.939, 0.348, "MedicalBackroom_Furnitures"], [60.229, 50.098, -0.001, 61.001, 53.902, 0.9, "Medical_Furnitures_V2"], [49.481, 55.057, 0.0, 50.367, 55.943, 0.826, "Medical_Furnitures_V2"], [48.142, 39.1, 0.0, 48.936, 39.895, 0.826, "Medical_Furnitures_V2"], [60.073, 45.052, 0.0, 60.902, 45.881, 0.826, "Medical_Furnitures_V2"], [53.361, 42.288, 0.0, 54.052, 42.938, 2.407, "Medical_Furnitures_V2"], [46.242, 45.199, 0.0, 46.949, 45.9, 2.407, "Medical_Furnitures_V2"], [68.291, 48.048, 0.0, 68.963, 48.762, 2.407, "Medical_Furnitures_V2"], [52.461, 40.835, -0.002, 54.378, 42.422, 1.254, "Medical_Furnitures_V2"], [50.499, 54.999, -0.001, 53.501, 56.001, 1.0, "Medical_Furnitures_V2"], [41.499, 39.499, -0.001, 42.501, 42.501, 1.0, "Medical_Furnitures_V2"], [46.499, 48.499, -0.001, 47.501, 51.501, 1.0, "Medical_Furnitures_V2"], [41.666, 55.499, -0.001, 43.667, 56.501, 1.0, "Medical_Furnitures_V2"], [68.499, 45.499, -0.001, 69.501, 48.501, 1.0, "Medical_Furnitures_V2"], [67.999, 43.999, -0.001, 69.001, 45.001, 1.0, "Medical_Furnitures_V2"], [50.084, 43.605, 1.001, 50.446, 43.947, 1.358, "Medical_Furnitures_V2"], [51.535, 50.543, 1.0, 51.95, 51.237, 1.631, "Medical_Furnitures_V2"], [55.999, 45.0, -0.0, 58.001, 48.0, 0.508, "Medical_Furnitures_V2"], [62.999, 45.999, -0.001, 67.001, 47.001, 1.001, "Medical_Furnitures_V2"], [53.356, 41.283, 0.31, 54.125, 42.114, 0.699, "Medical_Furnitures_V2"], [59.65, 55.735, 0.287, 60.35, 55.998, 1.416, "Medical_Furnitures_V2"], [60.382, 48.171, 0.01, 61.001, 48.829, 2.109, "Medical_Furnitures_V2"], [63.873, 44.037, -0.005, 64.875, 45.357, 0.818, "Medical_Furnitures_V2"], [59.191, 39.186, 0.003, 59.809, 39.725, 1.503, "Medical_Furnitures_V2"], [83.339, 58.036, -0.005, 83.707, 58.442, 0.375, "CorridorWestC_Furnitures"], [83.169, 57.112, 0.0, 84.001, 57.944, 0.826, "CorridorWestC_Furnitures"], [102.153, 56.959, -0.001, 104.291, 59.041, 2.001, "CorridorWestC_Furnitures"], [101.473, 56.939, -0.001, 102.124, 57.591, 0.834, "CorridorWestC_Furnitures"], [84.072, 56.847, -0.002, 86.2, 58.104, 2.001, "CorridorWestC_Furnitures"], [98.034, 110.036, -0.004, 98.931, 110.731, 0.579, "SurvellianceCamera_Furnitures_V2"], [101.013, 106.805, -0.004, 101.773, 107.749, 0.579, "SurvellianceCamera_Furnitures_V2"], [94.093, 118.129, -0.004, 95.024, 118.87, 0.579, "SurvellianceCamera_Furnitures_V2"], [94.269, 118.848, -0.001, 94.974, 119.413, 0.388, "SurvellianceCamera_Furnitures_V2"], [94.233, 119.405, -0.001, 94.981, 119.962, 0.39, "SurvellianceCamera_Furnitures_V2"], [101.001, 108.736, -0.005, 101.704, 109.002, 0.531, "SurvellianceCamera_Furnitures_V2"], [101.111, 106.504, -0.001, 101.882, 106.774, 0.713, "SurvellianceCamera_Furnitures_V2"], [101.176, 109.501, 0.999, 101.948, 109.776, 1.712, "SurvellianceCamera_Furnitures_V2"], [101.181, 109.77, 0.999, 101.96, 110.066, 1.712, "SurvellianceCamera_Furnitures_V2"], [101.181, 106.031, 0.999, 101.96, 106.327, 1.712, "SurvellianceCamera_Furnitures_V2"], [101.182, 106.391, 0.999, 101.959, 106.677, 1.712, "SurvellianceCamera_Furnitures_V2"], [99.999, 118.999, -0.001, 102.001, 120.001, 0.531, "SurvellianceCamera_Furnitures_V2"], [93.988, 114.988, -0.001, 94.512, 115.512, 0.787, "SurvellianceCamera_Furnitures_V2"], [93.999, 107.999, -0.001, 95.001, 111.001, 1.001, "SurvellianceCamera_Furnitures_V2"], [93.999, 110.995, -0.001, 95.001, 112.997, 1.001, "SurvellianceCamera_Furnitures_V2"], [93.999, 105.999, -0.001, 95.001, 108.001, 1.001, "SurvellianceCamera_Furnitures_V2"], [99.05, 109.604, 0.0, 99.939, 110.492, 1.307, "SurvellianceCamera_Furnitures_V2"], [100.631, 107.98, 0.0, 101.504, 108.854, 1.307, "SurvellianceCamera_Furnitures_V2"], [93.999, 117.999, -0.001, 95.001, 122.001, 1.001, "SurvellianceCamera_Furnitures_V2"], [54.071, 97.085, -0.004, 54.866, 98.054, 0.579, "CorridorSouth_Furnitures_V3"], [54.135, 103.131, 0.0, 54.951, 103.947, 0.826, "CorridorSouth_Furnitures_V3"], [52.906, 94.074, 0.0, 53.703, 94.871, 0.826, "CorridorSouth_Furnitures_V3"], [53.959, 94.904, -0.001, 56.041, 97.041, 2.001, "CorridorSouth_Furnitures_V3"], [54.376, 98.083, -0.001, 54.806, 98.514, 0.561, "CorridorSouth_Furnitures_V3"], [53.979, 96.984, -0.001, 54.981, 99.986, 1.001, "CorridorSouth_Furnitures_V3"], [53.954, 102.074, -0.005, 55.249, 103.15, 2.482, "CorridorSouth_Furnitures_V3"], [54.05, 101.426, -0.0, 54.591, 102.176, 0.377, "CorridorSouth_Furnitures_V3"], [40.034, 94.211, -0.0, 40.813, 94.856, 0.377, "CorridorSouth_Furnitures_V3"], [41.716, 86.996, 0.002, 42.555, 87.95, 1.477, "CorridorSouth_Furnitures_V3"], [51.896, 98.379, -0.004, 52.721, 99.368, 0.579, "Machine_Furnitures_V2"], [38.031, 104.989, 0.999, 39.065, 106.022, 2.001, "Machine_Furnitures_V2"], [42.217, 116.985, 0.999, 43.028, 117.9, 1.762, "Machine_Furnitures_V2"], [52.059, 115.028, 0.113, 52.905, 115.783, 0.756, "Machine_Furnitures_V2"], [31.031, 95.989, -0.001, 32.065, 97.022, 1.001, "Machine_Furnitures_V2"], [37.999, 104.999, -0.001, 40.001, 106.06, 1.001, "Machine_Furnitures_V2"], [42.206, 117.005, 0.118, 42.984, 117.813, 0.85, "Machine_Furnitures_V2"], [52.012, 114.178, 0.118, 52.819, 114.956, 0.85, "Machine_Furnitures_V2"], [45.0, 116.982, 0.121, 46.398, 117.733, 0.817, "Machine_Furnitures_V2"], [29.028, 96.004, -0.001, 31.032, 97.069, 1.001, "Machine_Furnitures_V2"], [52.069, 116.462, 0.124, 52.851, 117.875, 0.821, "Machine_Furnitures_V2"], [30.275, 96.004, 0.99, 30.752, 96.248, 1.364, "Machine_Furnitures_V2"], [52.172, 99.499, -0.001, 52.603, 99.929, 0.561, "Machine_Furnitures_V2"], [35.999, 104.999, -0.001, 38.001, 105.251, 2.001, "Machine_Furnitures_V2"], [35.999, 105.249, -0.001, 38.001, 105.501, 2.001, "Machine_Furnitures_V2"], [35.999, 105.487, -0.003, 38.001, 106.03, 2.011, "Machine_Furnitures_V2"], [51.979, 96.984, -0.001, 52.98, 99.986, 1.001, "Machine_Furnitures_V2"], [46.998, 116.992, -0.005, 48.29, 118.064, 2.482, "Machine_Furnitures_V2"], [26.896, 112.379, -0.004, 27.721, 113.368, 0.579, "MachineShortcut_Furnitures"], [27.172, 113.499, -0.001, 27.603, 113.929, 0.561, "MachineShortcut_Furnitures"], [27.761, 97.386, -0.001, 28.013, 99.388, 2.001, "MachineShortcut_Furnitures"], [27.511, 97.386, -0.001, 27.763, 99.388, 2.001, "MachineShortcut_Furnitures"], [26.982, 97.386, -0.003, 27.525, 99.388, 2.011, "MachineShortcut_Furnitures"], [26.979, 110.984, -0.001, 27.98, 113.986, 1.001, "MachineShortcut_Furnitures"], [21.002, 112.4, 0.287, 21.265, 113.1, 1.416, "MachineShortcut_Furnitures"], [23.441, 121.462, -0.001, 23.978, 122.0, 0.787, "MachineShortcut_Furnitures"], [19.122, 93.577, -0.005, 20.566, 94.879, 2.482, "MachineShortcut_Furnitures"], [19.206, 93.068, -0.0, 19.977, 93.675, 0.377, "MachineShortcut_Furnitures"], [31.367, 93.673, -0.002, 32.9, 94.965, 1.179, "MachineShortcut_Furnitures"], [30.814, 94.281, -0.001, 31.459, 94.925, 0.834, "MachineShortcut_Furnitures"], [32.323, 121.394, -0.001, 32.975, 122.046, 0.834, "MachineShortcut_Furnitures"], [31.711, 121.397, -0.001, 32.358, 122.043, 0.834, "MachineShortcut_Furnitures"], [31.095, 121.396, -0.001, 31.741, 122.043, 0.834, "MachineShortcut_Furnitures"], [20.795, 121.006, -0.005, 21.519, 121.94, 2.603, "MachineShortcut_Furnitures"], [35.985, 102.999, -0.001, 40.037, 105.001, 2.501, "Machine_Furnitures2"], [55.285, 71.704, 0.109, 56.79, 73.19, 2.636, "Restaurant_Aquarium"], [55.134, 67.442, 0.917, 56.48, 68.72, 1.541, "Restaurant_Aquarium"], [58.093, 69.999, 0.852, 58.92, 70.934, 1.453, "Restaurant_Aquarium"], [57.559, 69.26, 1.108, 58.79, 70.801, 1.596, "Restaurant_Aquarium"], [57.318, 73.206, 1.007, 58.13, 74.187, 1.381, "Restaurant_Aquarium"], [56.203, 71.74, 0.882, 57.547, 73.422, 1.414, "Restaurant_Aquarium"], [55.96, 68.687, 0.977, 56.815, 69.559, 1.578, "Restaurant_Aquarium"], [54.967, 74.325, 0.911, 55.969, 75.27, 2.58, "Restaurant_Aquarium"], [55.851, 72.668, 1.051, 56.709, 73.6, 1.679, "Restaurant_Aquarium"], [57.139, 76.108, 0.962, 58.652, 77.375, 1.574, "Restaurant_Aquarium"], [57.635, 75.589, 1.007, 58.36, 76.596, 1.381, "Restaurant_Aquarium"], [55.642, 77.275, 0.911, 56.645, 78.221, 2.58, "Restaurant_Aquarium"], [54.043, 71.74, 1.13, 55.401, 73.422, 1.795, "Restaurant_Aquarium"], [76.112, 62.112, 0.0, 76.944, 62.944, 0.826, "OfficeS_Furnitures"], [82.051, 70.05, 0.0, 83.006, 71.005, 0.826, "OfficeS_Furnitures"], [75.499, 72.499, -0.001, 76.501, 75.501, 1.0, "OfficeS_Furnitures"], [81.818, 75.068, 0.0, 82.71, 75.96, 1.307, "OfficeS_Furnitures"], [81.818, 66.79, 0.0, 82.71, 67.682, 1.307, "OfficeS_Furnitures"], [79.79, 63.068, 0.0, 80.682, 63.96, 1.307, "OfficeS_Furnitures"], [82.999, 71.999, -0.001, 84.001, 76.001, 1.001, "OfficeS_Furnitures"], [79.999, 67.999, -0.001, 84.001, 69.001, 1.001, "OfficeS_Furnitures"], [79.999, 62.0, -0.0, 84.001, 63.0, 1.0, "OfficeS_Furnitures"], [81.056, 68.004, -0.004, 81.752, 68.901, 0.579, "OfficeS_Furnitures"], [81.785, 67.626, -0.004, 82.543, 68.569, 0.579, "OfficeS_Furnitures"], [82.514, 68.0, -0.004, 83.223, 68.906, 0.579, "OfficeS_Furnitures"], [83.552, 68.004, 0.0, 83.805, 68.497, 0.532, "OfficeS_Furnitures"], [83.303, 68.009, -0.001, 83.531, 68.492, 0.531, "OfficeS_Furnitures"], [83.35, 75.11, -0.004, 84.058, 76.016, 0.579, "OfficeS_Furnitures"], [82.641, 75.11, -0.004, 83.349, 76.016, 0.579, "OfficeS_Furnitures"], [80.396, 62.068, 0.005, 80.706, 63.065, 0.688, "OfficeS_Furnitures"], [80.134, 62.184, -0.001, 80.405, 62.955, 0.713, "OfficeS_Furnitures"], [81.741, 62.337, -0.001, 81.997, 62.83, 0.531, "OfficeS_Furnitures"], [81.502, 62.158, -0.001, 81.738, 62.645, 0.531, "OfficeS_Furnitures"], [80.686, 68.64, -0.001, 81.05, 69.005, 0.528, "OfficeS_Furnitures"], [65.096, 68.596, 0.0, 65.96, 69.46, 0.826, "Restaurant_Furnitures"], [74.002, 84.934, 0.0, 74.866, 85.798, 0.826, "Restaurant_Furnitures"], [59.091, 83.042, 0.0, 59.955, 83.906, 0.826, "Restaurant_Furnitures"], [64.081, 83.063, 0.0, 64.904, 83.886, 0.826, "Restaurant_Furnitures"], [65.653, 75.66, -0.0, 66.285, 76.292, 1.213, "Restaurant_Furnitures"], [65.653, 76.684, -0.0, 66.285, 77.317, 1.213, "Restaurant_Furnitures"], [62.403, 75.66, -0.0, 63.035, 76.292, 1.213, "Restaurant_Furnitures"], [62.407, 76.684, -0.0, 63.04, 77.317, 1.213, "Restaurant_Furnitures"], [62.879, 72.434, -0.0, 63.511, 73.067, 1.213, "Restaurant_Furnitures"], [63.903, 72.434, -0.0, 64.535, 73.067, 1.213, "Restaurant_Furnitures"], [68.434, 72.958, -0.0, 69.066, 73.59, 1.213, "Restaurant_Furnitures"], [68.438, 71.934, -0.0, 69.07, 72.566, 1.213, "Restaurant_Furnitures"], [69.938, 72.958, -0.0, 70.57, 73.59, 1.213, "Restaurant_Furnitures"], [69.938, 71.934, -0.0, 70.57, 72.566, 1.213, "Restaurant_Furnitures"], [71.438, 72.958, -0.0, 72.07, 73.59, 1.213, "Restaurant_Furnitures"], [71.438, 71.934, -0.0, 72.07, 72.566, 1.213, "Restaurant_Furnitures"], [72.938, 72.958, -0.0, 73.57, 73.59, 1.213, "Restaurant_Furnitures"], [72.938, 71.934, -0.0, 73.57, 72.566, 1.213, "Restaurant_Furnitures"], [71.438, 76.17, -0.0, 72.07, 76.802, 1.213, "Restaurant_Furnitures"], [71.438, 75.146, -0.0, 72.07, 75.778, 1.213, "Restaurant_Furnitures"], [72.938, 76.17, -0.0, 73.57, 76.802, 1.213, "Restaurant_Furnitures"], [72.938, 75.146, -0.0, 73.57, 75.778, 1.213, "Restaurant_Furnitures"], [70.934, 81.208, -0.0, 71.566, 81.84, 1.213, "Restaurant_Furnitures"], [70.934, 80.184, -0.0, 71.566, 80.816, 1.213, "Restaurant_Furnitures"], [72.434, 81.208, -0.0, 73.066, 81.84, 1.213, "Restaurant_Furnitures"], [72.434, 80.184, -0.0, 73.066, 80.816, 1.213, "Restaurant_Furnitures"], [73.934, 81.208, -0.0, 74.566, 81.84, 1.213, "Restaurant_Furnitures"], [73.934, 80.184, -0.0, 74.566, 80.816, 1.213, "Restaurant_Furnitures"], [67.448, 84.458, -0.0, 68.081, 85.09, 1.213, "Restaurant_Furnitures"], [67.448, 83.434, -0.0, 68.081, 84.066, 1.213, "Restaurant_Furnitures"], [71.958, 84.87, -0.0, 72.59, 85.503, 1.213, "Restaurant_Furnitures"], [70.934, 84.87, -0.0, 71.566, 85.503, 1.213, "Restaurant_Furnitures"], [59.407, 81.208, -0.0, 60.04, 81.84, 1.213, "Restaurant_Furnitures"], [59.407, 80.184, -0.0, 60.04, 80.816, 1.213, "Restaurant_Furnitures"], [70.999, 71.999, -0.001, 74.001, 73.501, 0.901, "Restaurant_Furnitures"], [67.999, 71.999, -0.001, 71.001, 73.501, 0.901, "Restaurant_Furnitures"], [70.999, 75.211, -0.001, 74.001, 76.713, 0.901, "Restaurant_Furnitures"], [71.999, 80.249, -0.001, 75.001, 81.751, 0.901, "Restaurant_Furnitures"], [62.999, 71.991, -0.001, 64.501, 73.493, 0.901, "Restaurant_Furnitures"], [61.999, 75.749, -0.001, 63.501, 77.251, 0.901, "Restaurant_Furnitures"], [65.249, 75.749, -0.001, 66.751, 77.251, 0.901, "Restaurant_Furnitures"], [70.499, 80.249, -0.001, 72.001, 81.751, 0.901, "Restaurant_Furnitures"], [70.999, 84.435, -0.001, 72.501, 85.938, 0.901, "Restaurant_Furnitures"], [67.014, 83.499, -0.001, 68.516, 85.001, 0.901, "Restaurant_Furnitures"], [58.999, 80.249, -0.001, 60.501, 81.751, 0.901, "Restaurant_Furnitures"], [59.707, 68.214, 0.003, 60.278, 68.786, 0.807, "Restaurant_Furnitures"], [59.714, 69.214, 0.003, 60.286, 69.786, 0.807, "Restaurant_Furnitures"], [59.714, 76.214, 0.003, 60.286, 76.786, 0.807, "Restaurant_Furnitures"], [59.714, 70.214, 0.003, 60.286, 70.786, 0.807, "Restaurant_Furnitures"], [59.714, 75.214, 0.003, 60.286, 75.786, 0.807, "Restaurant_Furnitures"], [59.714, 73.214, 0.003, 60.286, 73.786, 0.807, "Restaurant_Furnitures"]];

// Verified lower-deck floor plates
export const VERIFIED_LOWER_FLOORS: FloorRectM[] = [[78.999, 32.123, 83.001, 32.877, "WestCorridorBotanics_Wall_W_V2"], [93.998, 105.999, 102.001, 115.132, "SurvellianceCamera"], [93.998, 115.999, 102.002, 120.001, "SurvellianceCamera"], [98.999, 115.447, 102.001, 116.053, "SurvellianceCamera"], [78.999, 24.0, 83.001, 30.0, "MedicalCorridor_Surfaces2"], [78.999, 18.0, 83.001, 24.0, "MedicalCorridor_Surfaces2"], [78.999, 21.186, 83.001, 21.814, "MedicalCorridor_Surfaces2"], [78.999, 29.999, 83.001, 30.501, "MedicalCorridor_Surfaces2"], [51.999, 61.998, 52.501, 86.002, "Storage_Wall_N"], [75.35, 52.85, 78.65, 56.15, "RestaurantCubby"], [72.35, 52.85, 75.65, 56.15, "RestaurantCubby"], [75.35, 49.85, 78.65, 53.15, "RestaurantCubby"], [72.35, 49.85, 75.65, 53.15, "RestaurantCubby"], [69.35, 52.85, 72.65, 56.15, "RestaurantCubby"], [69.35, 49.85, 72.65, 53.15, "RestaurantCubby"], [96.85, 51.85, 101.15, 56.15, "BotanicsLab"], [92.468, 47.249, 93.032, 52.251, "BotanicsLab"], [92.85, 51.85, 97.15, 56.15, "BotanicsLab"], [92.85, 47.85, 97.15, 52.15, "BotanicsLab"], [96.85, 47.85, 101.15, 52.15, "BotanicsLab"], [88.35, 47.85, 92.65, 52.15, "BotanicsLab"], [88.85, 51.85, 92.15, 55.15, "BotanicsLab"], [88.499, 54.935, 92.501, 56.065, "BotanicsLab"], [87.968, 47.249, 88.532, 52.251, "BotanicsLab"], [83.85, 47.85, 88.15, 52.15, "BotanicsLab"], [83.85, 51.85, 88.15, 56.15, "BotanicsLab"], [53.999, 92.999, 58.001, 95.215, "CorridorSouth_V3"], [53.999, 86.785, 58.001, 89.001, "CorridorSouth_V3"], [49.999, 92.999, 54.001, 95.215, "CorridorSouth_V3"], [49.999, 86.785, 54.001, 89.001, "CorridorSouth_V3"], [45.999, 92.999, 50.001, 95.215, "CorridorSouth_V3"], [45.999, 86.785, 50.001, 89.001, "CorridorSouth_V3"], [41.999, 92.999, 46.001, 95.215, "CorridorSouth_V3"], [41.999, 86.785, 46.001, 89.001, "CorridorSouth_V3"], [37.999, 92.999, 42.001, 95.215, "CorridorSouth_V3"], [37.999, 86.785, 42.001, 89.001, "CorridorSouth_V3"], [33.999, 92.999, 38.001, 95.215, "CorridorSouth_V3"], [33.999, 86.785, 38.001, 89.001, "CorridorSouth_V3"], [53.499, 102.999, 58.501, 105.215, "CorridorSouth_V3"], [53.499, 94.935, 58.501, 96.065, "CorridorSouth_V3"], [53.999, 96.5, 58.001, 102.5, "CorridorSouth_V3"], [49.999, 88.896, 58.001, 93.104, "CorridorSouth_V3"], [41.999, 88.896, 50.001, 93.104, "CorridorSouth_V3"], [33.999, 88.896, 42.001, 93.104, "CorridorSouth_V3"], [54.0, 96.0, 58.0, 96.5, "CorridorSouth_V3"], [54.0, 102.5, 58.0, 103.0, "CorridorSouth_V3"], [73.85, 45.35, 78.15, 49.65, "BotanicsCubby"], [69.85, 45.35, 74.15, 49.65, "BotanicsCubby"], [73.85, 41.35, 78.15, 45.65, "BotanicsCubby"], [69.85, 41.35, 74.15, 45.65, "BotanicsCubby"], [73.85, 37.35, 78.15, 41.65, "BotanicsCubby"], [69.85, 37.35, 74.15, 41.65, "BotanicsCubby"], [27.499, 56.896, 35.501, 61.104, "MedicalBackroom_Corridor"], [19.499, 56.896, 27.501, 61.104, "MedicalBackroom_Corridor"], [24.186, 56.999, 24.814, 61.001, "MedicalBackroom_Corridor"], [39.436, 56.999, 40.064, 61.001, "MedicalBackroom_Corridor"], [35.499, 56.896, 43.501, 61.104, "CorridorWestA"], [43.499, 56.896, 51.501, 61.104, "CorridorWestA"], [51.499, 56.896, 59.501, 61.104, "CorridorWestA"], [108.748, 56.999, 109.752, 61.001, "CorridorWestC_Wall_N"], [60.499, 56.896, 68.501, 61.104, "CorridorWestB"], [68.499, 56.896, 76.501, 61.104, "CorridorWestB"], [59.499, 57.0, 60.501, 61.0, "CorridorWestB"], [77.999, 57.0, 79.001, 61.0, "CorridorWestB"], [76.403, 56.999, 78.097, 61.001, "CorridorWestB"], [83.999, 26.999, 112.001, 47.001, "BotanicsGreenhouse"], [100.999, 38.0, 102.001, 42.0, "BotanicsGreenhouse"], [101.999, 37.999, 102.501, 42.001, "BotanicsGreenhouse"], [24.999, 61.999, 52.001, 86.001, "Storage"], [18.312, 88.499, 18.814, 93.501, "MachineShortcut_WallCorridor"], [78.999, 56.896, 87.001, 61.104, "CorridorWestC"], [86.999, 56.896, 95.001, 61.104, "CorridorWestC"], [94.999, 56.896, 103.001, 61.104, "CorridorWestC"], [102.999, 56.896, 111.001, 61.104, "CorridorWestC"], [53.012, 104.7, 53.514, 109.5, "Machine_Wall_N"], [40.999, 95.935, 46.001, 97.065, "Machine"], [45.935, 95.999, 47.065, 100.001, "Machine"], [39.935, 95.999, 41.065, 101.001, "Machine"], [39.935, 100.999, 41.065, 106.001, "Machine"], [39.935, 105.999, 41.065, 111.001, "Machine"], [39.935, 110.999, 41.065, 116.001, "Machine"], [40.999, 110.87, 46.001, 113.13, "Machine"], [40.999, 95.996, 46.001, 113.004, "Machine"], [45.999, 109.0, 46.501, 113.0, "Machine"], [47.5, 117.999, 51.5, 118.501, "Machine"], [28.999, 96.0, 53.001, 118.001, "Machine"], [40.999, 99.0, 46.001, 101.0, "Machine2"], [40.999, 97.0, 46.001, 99.0, "Machine2"], [40.999, 101.0, 46.001, 103.0, "Machine2"], [40.999, 103.0, 46.001, 105.0, "Machine2"], [40.999, 105.0, 46.001, 107.0, "Machine2"], [40.999, 107.0, 46.001, 109.0, "Machine2"], [40.999, 109.0, 46.001, 111.0, "Machine2"], [28.999, 92.999, 33.001, 95.215, "MachineShortcut2"], [28.999, 86.785, 33.001, 89.001, "MachineShortcut2"], [24.999, 92.999, 29.001, 95.215, "MachineShortcut2"], [24.999, 86.785, 29.001, 89.001, "MachineShortcut2"], [20.999, 92.999, 25.001, 95.215, "MachineShortcut2"], [20.999, 86.785, 25.001, 89.001, "MachineShortcut2"], [16.999, 92.999, 21.001, 95.215, "MachineShortcut2"], [16.999, 86.785, 21.001, 89.001, "MachineShortcut2"], [24.999, 88.896, 33.001, 93.104, "MachineShortcut2"], [16.999, 88.896, 25.001, 93.104, "MachineShortcut2"], [19.999, 81.999, 24.001, 86.001, "MachineShortcut2"], [78.999, 50.0, 83.001, 56.0, "WestCorridorBotanics"], [78.999, 43.0, 83.001, 49.0, "WestCorridorBotanics"], [78.999, 37.0, 83.001, 43.0, "WestCorridorBotanics"], [78.999, 30.5, 83.001, 36.5, "WestCorridorBotanics"], [79.0, 48.999, 83.0, 50.001, "WestCorridorBotanics"], [78.999, 36.499, 83.001, 37.001, "WestCorridorBotanics"], [78.999, 55.749, 83.001, 56.251, "WestCorridorBotanics"], [73.999, 106.0, 75.001, 110.0, "SurvellianceArmory2_V2"], [69.999, 109.785, 74.001, 112.001, "SurvellianceArmory2_V2"], [66.0, 105.999, 72.0, 110.001, "SurvellianceArmory2_V2"], [60.0, 105.999, 66.0, 110.001, "SurvellianceArmory2_V2"], [65.999, 109.785, 70.001, 112.001, "SurvellianceArmory2_V2"], [61.999, 109.785, 66.001, 112.001, "SurvellianceArmory2_V2"], [57.999, 109.785, 62.001, 112.001, "SurvellianceArmory2_V2"], [54.0, 105.999, 60.0, 110.001, "SurvellianceArmory2_V2"], [71.785, 105.999, 74.001, 110.001, "SurvellianceArmory2_V2"], [53.999, 109.785, 58.001, 112.001, "SurvellianceArmory2_V2"], [53.999, 111.999, 74.001, 118.001, "SurvellianceArmory2_V2"], [73.999, 109.999, 74.501, 118.001, "SurvellianceArmory2_V2"], [53.499, 105.999, 54.001, 118.001, "SurvellianceArmory2_V2"], [27.999, 114.0, 29.001, 118.0, "MachineShortcut1"], [28.999, 113.999, 33.001, 118.001, "MachineShortcut1"], [21.998, 110.499, 28.002, 111.001, "MachineShortcut1"], [20.998, 102.999, 28.002, 103.501, "MachineShortcut1"], [20.997, 117.999, 33.003, 118.501, "MachineShortcut1"], [28.85, 118.35, 33.15, 122.65, "MachineShortcut1"], [24.85, 118.35, 29.15, 122.65, "MachineShortcut1"], [20.85, 118.35, 25.15, 122.65, "MachineShortcut1"], [20.319, 110.649, 28.021, 118.351, "MachineShortcut1"], [20.649, 95.999, 28.351, 103.001, "MachineShortcut1"], [20.649, 103.499, 28.351, 110.501, "MachineShortcut1"], [63.999, 26.999, 64.501, 31.001, "MedicalCorridor_Surfaces"], [64.35, 26.85, 68.65, 31.15, "MedicalCorridor_Surfaces"], [68.35, 26.85, 72.65, 31.15, "MedicalCorridor_Surfaces"], [72.35, 26.85, 76.65, 31.15, "MedicalCorridor_Surfaces"], [77.499, 26.999, 78.001, 31.001, "MedicalCorridor_Surfaces"]];

// Verified Upper Deck / Lobby (Z=5.0m) walls & walkable floors
export const VERIFIED_UPPER_WALLS: Box2DM[] = [[101.998, 55.999, 4.999, 111.002, 56.001, 4.5, "BotanicsGreenhouse_OuterRoom2"], [110.999, 42.999, 4.999, 111.001, 49.001, 4.5, "BotanicsGreenhouse_OuterRoom2"], [102.0, 45.998, 4.999, 102.0, 56.002, 4.5, "BotanicsGreenhouse_OuterRoom2"], [110.935, 53.998, 4.999, 111.0, 56.002, 4.5, "BotanicsGreenhouse_OuterRoom2"], [101.999, 43.0, 4.999, 105.001, 43.065, 4.5, "BotanicsGreenhouse_OuterRoom2"], [102.0, 42.999, 4.999, 102.065, 46.001, 4.5, "BotanicsGreenhouse_OuterRoom2"], [107.199, 43.0, 4.999, 110.801, 43.065, 4.5, "BotanicsGreenhouse_OuterRoom2"], [110.749, 43.0, 5.0, 111.251, 43.054, 4.5, "BotanicsGreenhouse_OuterRoom2"], [84.0, 32.999, 4.999, 84.065, 34.001, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [84.0, 44.999, 4.999, 84.065, 46.001, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [83.961, 45.936, 4.999, 84.127, 46.564, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [84.0, 42.999, 4.999, 84.121, 45.001, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [84.0, 30.999, 4.999, 84.121, 33.001, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [84.0, 33.999, 4.999, 84.121, 36.001, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [84.0, 25.999, 4.999, 84.065, 31.001, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [84.0, 37.999, 4.999, 84.065, 43.001, 4.5, "BotanicsGreenhouse_Wall_S_V2"], [111.879, 26.851, 3.993, 112.0, 28.852, 4.5, "BotanicsGreenhouse_Wall_N"], [116.984, 132.999, 4.999, 117.039, 137.001, 4.5, "Lobby_CorridorSurfaces2_V3"], [112.999, 120.961, 4.999, 117.001, 121.016, 4.5, "Lobby_CorridorSurfaces2_V3"], [102.999, 121.0, 4.999, 104.001, 121.065, 4.5, "Lobby_CorridorSurfaces2_V3"], [108.999, 121.0, 4.999, 110.001, 121.065, 4.5, "Lobby_CorridorSurfaces2_V3"], [116.946, 120.499, 5.0, 117.0, 121.001, 4.5, "Lobby_CorridorSurfaces2_V3"], [98.999, 120.961, 4.999, 103.001, 121.016, 4.5, "Lobby_CorridorSurfaces2_V3"], [94.999, 120.961, 4.999, 99.001, 121.016, 4.5, "Lobby_CorridorSurfaces2_V3"], [90.999, 120.961, 4.999, 95.001, 121.016, 4.5, "Lobby_CorridorSurfaces2_V3"], [102.499, 120.961, 4.999, 103.001, 121.127, 4.5, "Lobby_CorridorSurfaces2_V3"], [80.999, 120.961, 4.999, 81.501, 121.127, 4.5, "Lobby_CorridorSurfaces2_V3"], [81.499, 120.961, 4.999, 82.001, 121.127, 4.5, "Lobby_CorridorSurfaces2_V3"], [86.999, 120.961, 4.999, 91.001, 121.016, 4.5, "Lobby_CorridorSurfaces2_V3"], [82.999, 120.961, 4.999, 87.001, 121.016, 4.5, "Lobby_CorridorSurfaces2_V3"], [81.999, 121.0, 4.999, 83.001, 121.065, 4.5, "Lobby_CorridorSurfaces2_V3"], [82.999, 120.961, 4.999, 83.501, 121.127, 4.5, "Lobby_CorridorSurfaces2_V3"], [51.935, 68.499, 4.999, 52.0, 69.501, 4.5, "Storage_Wall_N"], [51.935, 81.999, 4.999, 52.0, 83.001, 4.5, "Storage_Wall_N"], [51.879, 66.499, 4.999, 52.0, 68.501, 4.5, "Storage_Wall_N"], [51.935, 61.499, 4.999, 52.0, 66.501, 4.5, "Storage_Wall_N"], [51.935, 69.499, 4.999, 52.0, 73.001, 4.5, "Storage_Wall_N"], [111.999, 41.999, 3.999, 112.001, 48.001, 4.5, "BotanicsGreenhouse_OuterRoom3"], [104.998, 43.0, 4.999, 107.252, 43.065, 4.5, "BotanicsGreenhouse_OuterRoom3"], [44.999, 61.5, 4.999, 47.001, 61.621, 4.5, "Storage_Wall_W_V2"], [35.999, 61.5, 4.999, 40.001, 61.621, 4.5, "Storage_Wall_W_V2"], [31.249, 61.5, 4.999, 33.251, 61.621, 4.5, "Storage_Wall_W_V2"], [46.999, 61.5, 4.999, 52.001, 61.565, 4.5, "Storage_Wall_W_V2"], [39.999, 61.5, 4.999, 45.001, 61.565, 4.5, "Storage_Wall_W_V2"], [27.249, 61.5, 4.999, 31.251, 61.565, 4.5, "Storage_Wall_W_V2"], [34.0, 61.5, 4.999, 36.0, 61.565, 4.5, "Storage_Wall_W_V2"], [33.749, 61.961, 4.999, 34.251, 62.127, 4.5, "Storage_Wall_W_V2"], [39.749, 62.211, 4.999, 40.251, 62.377, 4.5, "Storage_Wall_W_V2"], [42.749, 62.211, 4.999, 43.251, 62.377, 4.5, "Storage_Wall_W_V2"], [33.123, 61.499, 5.0, 33.877, 61.635, 4.5, "Storage_Wall_W_V2"], [97.499, 46.356, 6.25, 100.501, 46.478, 4.5, "BotanicsGreenhouse_Wall_E"], [90.999, 11.0, 4.999, 92.001, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [96.999, 11.0, 4.999, 98.001, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [109.999, 11.0, 4.999, 111.001, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [102.999, 11.0, 4.999, 105.001, 11.121, 4.5, "BotanicsGreenhouse_OuterRoom1"], [88.999, 11.0, 4.999, 91.001, 11.121, 4.5, "BotanicsGreenhouse_OuterRoom1"], [84.0, 20.999, 4.999, 84.065, 26.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [84.0, 15.999, 4.999, 84.065, 21.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [84.0, 10.999, 4.999, 84.065, 16.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.935, 10.999, 4.999, 111.0, 16.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.935, 15.999, 4.999, 111.0, 21.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.935, 20.999, 4.999, 111.0, 26.001, 4.5, "BotanicsGreenhouse_OuterRoom1"], [83.999, 11.0, 4.999, 89.001, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [97.999, 11.0, 4.999, 103.001, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [91.999, 11.0, 4.999, 97.001, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [104.999, 11.0, 4.999, 110.001, 11.065, 4.5, "BotanicsGreenhouse_OuterRoom1"], [110.999, 27.0, 3.999, 112.001, 27.065, 4.5, "BotanicsGreenhouse_Wall_W"], [82.999, 27.0, 5.999, 85.001, 27.121, 4.5, "BotanicsGreenhouse_Wall_W"], [51.499, 85.873, 4.999, 52.001, 86.039, 4.5, "Storage_Wall_E_V2"], [45.999, 85.873, 4.999, 46.501, 86.039, 4.5, "Storage_Wall_E_V2"], [41.499, 85.873, 4.999, 42.001, 86.039, 4.5, "Storage_Wall_E_V2"], [27.999, 85.873, 4.999, 28.501, 86.039, 4.5, "Storage_Wall_E_V2"], [37.499, 85.984, 4.999, 41.501, 86.039, 4.5, "Storage_Wall_E_V2"], [41.999, 85.984, 4.999, 46.001, 86.039, 4.5, "Storage_Wall_E_V2"], [46.499, 85.984, 4.999, 51.501, 86.039, 4.5, "Storage_Wall_E_V2"], [28.499, 85.984, 4.999, 32.501, 86.039, 4.5, "Storage_Wall_E_V2"], [32.499, 85.984, 4.999, 37.501, 86.039, 4.5, "Storage_Wall_E_V2"], [104.499, 148.873, 4.999, 105.001, 149.039, 4.5, "Lobby_CorridorSurfaces_V3"], [80.999, 124.961, 4.999, 93.001, 125.015, 4.5, "Lobby_CorridorSurfaces_V3"], [100.999, 148.984, 4.999, 105.001, 149.039, 4.5, "Lobby_CorridorSurfaces_V3"], [116.499, 148.873, 4.998, 117.001, 149.039, 4.5, "Lobby_CorridorSurfaces_V3"], [104.999, 148.873, 4.998, 105.501, 149.039, 4.5, "Lobby_CorridorSurfaces_V3"], [100.961, 124.999, 4.999, 101.127, 125.501, 4.5, "Lobby_CorridorSurfaces_V3"], [100.961, 134.999, 4.999, 101.016, 139.001, 4.5, "Lobby_CorridorSurfaces_V3"], [96.999, 124.984, 4.999, 101.001, 125.039, 4.5, "Lobby_CorridorSurfaces_V3"], [92.999, 124.984, 4.999, 97.001, 125.039, 4.5, "Lobby_CorridorSurfaces_V3"], [100.999, 148.873, 4.999, 101.501, 149.039, 4.5, "Lobby_CorridorSurfaces_V3"], [100.961, 138.499, 4.999, 101.127, 139.001, 4.5, "Lobby_CorridorSurfaces_V3"], [101.009, 125.249, 4.999, 101.244, 138.251, 4.5, "Lobby_CorridorSurfaces_V3"], [28.999, 55.961, 3.999, 41.001, 56.015, 4.5, "MedicalBackroom_Wall_E"], [24.999, 55.984, 3.999, 29.001, 56.039, 4.5, "MedicalBackroom_Wall_E"], [29.998, 34.0, 4.999, 36.002, 34.065, 4.5, "MedicalBackroom_Wall_W"], [23.998, 34.0, 4.999, 30.002, 34.065, 4.5, "MedicalBackroom_Wall_W"], [35.998, 34.0, 4.999, 42.001, 34.065, 4.5, "MedicalBackroom_Wall_W"], [29.0, 107.999, 5.149, 29.065, 113.001, 4.5, "Machine_Wall_S_V2"], [29.0, 95.999, 5.149, 29.065, 101.001, 4.5, "Machine_Wall_S_V2"], [29.0, 100.998, 4.749, 29.0, 108.002, 4.5, "Machine_Wall_S_V2"], [28.961, 103.999, 4.749, 29.127, 104.501, 4.5, "Machine_Wall_S_V2"], [29.0, 107.519, 5.024, 29.027, 113.001, 4.5, "Machine_Wall_S_V2"], [29.0, 95.879, 5.024, 29.027, 105.001, 4.5, "Machine_Wall_S_V2"], [29.0, 112.999, 5.0, 29.054, 113.501, 4.5, "Machine_Wall_S_V2"], [32.499, 113.961, 3.999, 33.001, 114.127, 4.5, "MachineShortcut_Wall_M"], [26.999, 113.961, 3.999, 27.501, 114.127, 4.5, "MachineShortcut_Wall_M"], [25.935, 113.956, 3.999, 27.065, 114.001, 4.5, "MachineShortcut_Wall_M"], [32.999, 114.0, 4.0, 33.501, 114.054, 4.5, "MachineShortcut_Wall_M"], [20.999, 114.0, 3.999, 26.001, 114.065, 4.5, "MachineShortcut_Wall_M"], [21.874, 111.935, 3.999, 28.126, 112.0, 4.5, "MachineShortcut_Wall_M"], [27.499, 114.0, 3.999, 32.501, 114.065, 4.5, "MachineShortcut_Wall_M"], [32.984, 113.999, 4.999, 33.039, 118.001, 4.5, "MachineShortcut_Wall_E"], [32.946, 117.999, 5.0, 33.0, 118.501, 4.5, "MachineShortcut_Wall_E"], [28.999, 121.984, 4.999, 33.001, 122.039, 4.5, "MachineShortcut_Wall_E"], [24.999, 121.984, 4.999, 29.001, 122.039, 4.5, "MachineShortcut_Wall_E"], [20.999, 121.984, 4.999, 25.001, 122.039, 4.5, "MachineShortcut_Wall_E"], [32.984, 118.499, 4.999, 33.039, 122.501, 4.5, "MachineShortcut_Wall_E"], [53.0, 105.748, 4.999, 53.0, 112.752, 4.5, "Machine_Wall_N"], [53.0, 95.748, 4.999, 53.0, 104.752, 4.5, "Machine_Wall_N"], [52.928, 94.249, 5.249, 52.994, 99.251, 4.5, "Machine_Wall_N"], [52.928, 99.249, 5.249, 52.994, 104.251, 4.5, "Machine_Wall_N"], [52.928, 104.25, 4.999, 52.994, 106.25, 4.5, "Machine_Wall_N"], [52.935, 114.0, 4.999, 53.0, 116.0, 4.5, "Machine_Wall_N"], [52.935, 116.0, 4.999, 53.0, 118.0, 4.5, "Machine_Wall_N"], [52.967, 109.749, 5.099, 53.0, 112.751, 4.5, "Machine_Wall_N"], [52.935, 112.529, 4.499, 53.0, 114.031, 4.5, "Machine_Wall_N"], [41.997, 118.0, 4.999, 53.003, 118.0, 4.5, "Machine_Wall_C_V3"], [42.0, 113.999, 4.999, 42.0, 118.001, 4.5, "Machine_Wall_C_V3"], [41.999, 114.0, 4.999, 47.001, 114.0, 4.5, "Machine_Wall_C_V3"], [23.499, 98.0, 6.0, 28.501, 98.065, 4.5, "MachineShortcut_Wall_N"], [18.499, 98.0, 6.0, 23.501, 98.065, 4.5, "MachineShortcut_Wall_N"], [27.935, 96.749, 3.999, 28.0, 101.751, 4.5, "MachineShortcut_Wall_N"], [27.935, 101.749, 3.999, 28.0, 106.751, 4.5, "MachineShortcut_Wall_N"], [27.935, 107.749, 3.999, 28.0, 112.751, 4.5, "MachineShortcut_Wall_N"], [27.935, 106.749, 3.999, 28.0, 107.751, 4.5, "MachineShortcut_Wall_N"], [21.961, 107.999, 3.999, 22.016, 112.001, 4.5, "MachineShortcut_Wall_S"], [21.961, 103.999, 3.999, 22.016, 108.001, 4.5, "MachineShortcut_Wall_S"], [21.961, 103.999, 3.999, 22.127, 104.501, 4.5, "MachineShortcut_Wall_S"], [21.499, 103.873, 3.999, 22.001, 104.039, 4.5, "MachineShortcut_Wall_S"], [20.999, 103.946, 4.0, 21.501, 104.0, 4.5, "MachineShortcut_Wall_S"], [20.961, 100.499, 3.999, 21.127, 101.001, 4.5, "MachineShortcut_Wall_S"], [21.0, 100.999, 3.999, 21.065, 106.001, 4.5, "MachineShortcut_Wall_S"], [21.0, 95.499, 3.999, 21.065, 100.501, 4.5, "MachineShortcut_Wall_S"], [21.0, 113.999, 3.999, 21.065, 119.001, 4.5, "MachineShortcut_Wall_S"], [21.0, 118.999, 3.999, 21.065, 124.001, 4.5, "MachineShortcut_Wall_S"], [41.999, 113.05, 4.748, 46.001, 113.05, 4.5, "Machine_Wall_E_V2"], [45.731, 113.094, 4.236, 46.234, 113.149, 4.5, "Machine_Wall_E_V2"], [41.731, 113.094, 4.236, 42.234, 113.149, 4.5, "Machine_Wall_E_V2"], [35.999, 112.935, 5.0, 41.001, 113.0, 4.5, "Machine_Wall_E_V2"], [30.999, 112.935, 5.0, 36.001, 113.0, 4.5, "Machine_Wall_E_V2"], [25.999, 112.935, 5.0, 31.001, 113.0, 4.5, "Machine_Wall_E_V2"], [41.999, 112.935, 5.399, 46.001, 113.0, 4.5, "Machine_Wall_E_V2"], [41.999, 112.935, 4.25, 46.001, 113.0, 4.5, "Machine_Wall_E_V2"], [40.999, 112.965, 4.999, 42.001, 113.03, 4.5, "Machine_Wall_E_V2"], [27.961, 60.999, 4.999, 28.016, 65.001, 4.5, "Storage_Wall_S_V2"], [27.981, 78.999, 4.999, 28.008, 81.001, 4.5, "Storage_Wall_S_V2"], [27.961, 80.999, 4.999, 28.016, 87.001, 4.5, "Storage_Wall_S_V2"], [27.735, 82.948, 4.999, 28.043, 85.052, 4.5, "Storage_Wall_S_V2"], [25.0, 43.5, 5.999, 25.054, 47.5, 4.5, "MedicalBackroom_Wall_S"], [94.999, 143.284, 5.788, 95.03, 143.802, 4.5, "Museum_A"], [94.999, 143.784, 5.788, 95.03, 144.302, 4.5, "Museum_A"], [86.0, 152.0, 5.0, 88.0, 152.25, 4.5, "Museum_A"], [71.75, 144.0, 5.0, 72.0, 149.0, 4.5, "Museum_A"], [94.999, 144.284, 5.788, 95.03, 144.802, 4.5, "Museum_A"], [81.249, 151.946, 5.0, 81.751, 152.0, 4.5, "Museum_A"], [71.499, 140.946, 4.999, 72.001, 141.0, 4.5, "Museum_A"], [80.999, 145.0, 4.999, 81.501, 145.054, 4.5, "Museum_A"], [94.249, 151.946, 5.0, 94.751, 152.0, 4.5, "Museum_A"], [88.199, 151.952, 6.275, 89.601, 152.001, 4.5, "Museum_A"], [88.2, 151.995, 6.28, 89.6, 151.995, 4.5, "Museum_A"], [89.888, 151.912, 5.822, 92.012, 152.088, 4.5, "Museum_A"], [88.156, 151.912, 5.48, 89.644, 152.088, 4.5, "Museum_A"], [72.0, 150.044, 5.611, 72.027, 150.956, 4.5, "Museum_A"], [84.303, 151.912, 5.872, 85.897, 152.088, 4.5, "Museum_A"], [94.999, 138.961, 4.999, 100.001, 139.016, 4.5, "Museum_A"], [94.999, 138.961, 4.999, 95.501, 139.127, 4.5, "Museum_A"], [99.499, 138.961, 4.999, 100.001, 139.127, 4.5, "Museum_A"], [63.437, 130.132, 5.651, 63.563, 130.91, 4.5, "Museum_D_Details"], [50.0, 134.998, 5.0, 50.027, 136.002, 4.5, "Museum_D_Details"], [80.499, 121.0, 4.999, 81.001, 121.054, 4.5, "Museum_D_Details"], [80.973, 124.999, 4.999, 81.0, 125.501, 4.5, "Museum_D_Details"], [59.384, 121.01, 5.994, 62.616, 121.01, 4.5, "Museum_D_Details"], [59.346, 121.01, 5.967, 62.654, 121.047, 4.5, "Museum_D_Details"], [64.132, 121.01, 5.967, 66.868, 121.047, 4.5, "Museum_D_Details"], [64.155, 121.01, 5.994, 66.845, 121.01, 4.5, "Museum_D_Details"], [50.793, 124.999, 5.276, 51.707, 125.034, 4.5, "Museum_D_Details"], [58.0, 122.43, 5.551, 58.027, 123.57, 4.5, "Museum_D_Details"], [59.938, 120.912, 5.486, 62.062, 121.088, 4.5, "Museum_D_Details"], [64.438, 120.912, 5.486, 66.562, 121.088, 4.5, "Museum_D_Details"]];
export const VERIFIED_UPPER_FLOORS: FloorRectM[] = [[101.998, 42.997, 111.002, 56.003, "BotanicsGreenhouse_OuterRoom2"], [94.0, 120.999, 100.0, 125.001, "Lobby_CorridorSurfaces2_V3"], [88.0, 120.999, 94.0, 125.001, "Lobby_CorridorSurfaces2_V3"], [82.0, 120.999, 88.0, 125.001, "Lobby_CorridorSurfaces2_V3"], [81.998, 120.499, 101.002, 121.001, "Lobby_CorridorSurfaces2_V3"], [112.85, 132.85, 117.15, 137.15, "Lobby_CorridorFloor2_V2"], [108.85, 132.85, 113.15, 137.15, "Lobby_CorridorFloor2_V2"], [104.85, 132.85, 109.15, 137.15, "Lobby_CorridorFloor2_V2"], [112.85, 136.85, 117.15, 141.15, "Lobby_CorridorFloor2_V2"], [108.85, 136.85, 113.15, 141.15, "Lobby_CorridorFloor2_V2"], [104.85, 136.85, 109.15, 141.15, "Lobby_CorridorFloor2_V2"], [112.85, 140.85, 117.15, 145.15, "Lobby_CorridorFloor2_V2"], [108.85, 140.85, 113.15, 145.15, "Lobby_CorridorFloor2_V2"], [104.85, 140.85, 109.15, 145.15, "Lobby_CorridorFloor2_V2"], [112.85, 144.85, 117.15, 149.15, "Lobby_CorridorFloor2_V2"], [108.85, 144.85, 113.15, 149.15, "Lobby_CorridorFloor2_V2"], [104.85, 144.85, 109.15, 149.15, "Lobby_CorridorFloor2_V2"], [42.999, 61.436, 52.001, 62.064, "Storage_Wall_W_V2"], [33.749, 61.436, 42.751, 62.064, "Storage_Wall_W_V2"], [25.749, 61.436, 33.751, 62.064, "Storage_Wall_W_V2"], [102.999, 95.999, 116.001, 120.001, "Lobby_FloorCeiling_V2"], [93.899, 103.999, 102.001, 119.636, "Lobby_FloorCeiling_V2"], [81.998, 124.999, 101.002, 125.501, "Lobby_CorridorSurfaces_V3"], [57.499, 124.999, 58.001, 135.001, "Museum_D"], [48.749, 122.999, 57.751, 135.001, "Museum_D"], [93.999, 150.0, 95.001, 154.0, "Museum_A_Floor"], [93.999, 146.0, 95.001, 150.0, "Museum_A_Floor"], [80.999, 149.5, 82.001, 154.5, "Museum_A_Floor"], [80.999, 145.0, 82.001, 149.5, "Museum_A_Floor"], [75.999, 140.999, 81.001, 142.001, "Museum_A_Floor"], [72.0, 140.999, 76.0, 142.001, "Museum_A_Floor"], [81.999, 144.999, 94.001, 154.001, "Museum_A_Floor"], [94.813, 138.813, 100.187, 144.187, "Museum_A_Floor"], [94.813, 143.813, 100.187, 149.187, "Museum_A_Floor"], [94.813, 148.813, 100.187, 154.187, "Museum_A_Floor"], [77.85, 150.85, 81.15, 154.15, "Museum_A_Floor"], [74.85, 150.85, 78.15, 154.15, "Museum_A_Floor"], [71.85, 150.85, 75.15, 154.15, "Museum_A_Floor"], [77.85, 147.85, 81.15, 151.15, "Museum_A_Floor"], [74.85, 147.85, 78.15, 151.15, "Museum_A_Floor"], [71.85, 147.85, 75.15, 151.15, "Museum_A_Floor"], [77.85, 144.85, 81.15, 148.15, "Museum_A_Floor"], [74.85, 144.85, 78.15, 148.15, "Museum_A_Floor"], [71.85, 144.85, 75.15, 148.15, "Museum_A_Floor"], [77.85, 141.85, 81.15, 145.15, "Museum_A_Floor"], [74.85, 141.85, 78.15, 145.15, "Museum_A_Floor"], [71.85, 141.85, 75.15, 145.15, "Museum_A_Floor"], [99.935, 139.499, 101.065, 143.501, "Museum_A_Floor"], [112.85, 120.85, 117.15, 125.15, "Lobby_CorridorFloor_V2"], [108.85, 120.85, 113.15, 125.15, "Lobby_CorridorFloor_V2"], [104.85, 120.85, 109.15, 125.15, "Lobby_CorridorFloor_V2"], [112.85, 124.85, 117.15, 129.15, "Lobby_CorridorFloor_V2"], [108.85, 124.85, 113.15, 129.15, "Lobby_CorridorFloor_V2"], [104.85, 124.85, 109.15, 129.15, "Lobby_CorridorFloor_V2"], [112.85, 128.85, 117.15, 133.15, "Lobby_CorridorFloor_V2"], [108.85, 128.85, 113.15, 133.15, "Lobby_CorridorFloor_V2"], [104.85, 128.85, 109.15, 133.15, "Lobby_CorridorFloor_V2"], [100.999, 120.999, 105.001, 149.001, "Lobby_CorridorFloor_V2"], [38.999, 131.999, 81.001, 154.001, "Museum_B_Surfaces"], [20.999, 121.999, 25.001, 123.001, "MachineShortcut_Wall_E"], [24.999, 121.999, 29.001, 123.001, "MachineShortcut_Wall_E"], [28.999, 121.999, 33.001, 123.001, "MachineShortcut_Wall_E"], [52.999, 95.997, 53.501, 108.003, "Machine_Wall_N"], [41.997, 113.999, 53.003, 118.001, "Machine_Wall_C_V3"], [46.732, 113.897, 53.533, 114.399, "Machine_Wall_C_V3"], [28.999, 112.999, 41.001, 113.501, "Machine_Wall_E_V2"]];

export const VERIFIED_ACTORS: Record<string, VerifiedActor[]> = {
  "AlimBox_C": [{"n": "AlimBox_C_0", "p": [72.0, 50.0, 0.0], "yaw": -90.0}, {"n": "AlimBox_C_1", "p": [53.0, 104.5, 0.0], "yaw": 0.0}, {"n": "AlimBox_C_3", "p": [111.5, 62.0, 0.0], "yaw": -90.0}, {"n": "AlimBox_C_4", "p": [105.5, 47.0, 0.0], "yaw": 90.0}, {"n": "AlimBox_C_5", "p": [102.0, 113.75, 0.0], "yaw": 0.0}, {"n": "AlimBox_C_6", "p": [67.0, 36.0, 0.0], "yaw": -90.0}, {"n": "AlimBox_C_8", "p": [25.0, 64.5, 0.0], "yaw": 180.0}],
  "BatteryCharger_C": [{"n": "BatteryCharger_C_2", "p": [47.0, 103.5, 1.5], "yaw": 0.0}, {"n": "BatteryCharger_C_4", "p": [47.0, 106.5, 1.5], "yaw": 0.0}, {"n": "BatteryCharger_C_5", "p": [47.0, 105.5, 1.5], "yaw": 0.0}, {"n": "BatteryCharger_C_0", "p": [28.0, 102.25, 1.5], "yaw": 180.0}, {"n": "BatteryCharger_C_1", "p": [28.0, 101.25, 1.5], "yaw": 180.0}],
  "Plant_C": [{"n": "Plant_C_0", "p": [88.106, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_1", "p": [86.88, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_10", "p": [96.338, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_11", "p": [102.086, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_12", "p": [99.613, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_13", "p": [100.848, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_14", "p": [102.099, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_15", "p": [100.904, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_16", "p": [99.687, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_17", "p": [102.137, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_2", "p": [85.665, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_3", "p": [88.002, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_4", "p": [86.807, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_43", "p": [85.669, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_44", "p": [87.918, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_45", "p": [86.832, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_46", "p": [88.04, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_47", "p": [85.633, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_48", "p": [96.368, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_49", "p": [95.124, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_5", "p": [86.762, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_50", "p": [93.935, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_54", "p": [100.91, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_55", "p": [99.656, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_56", "p": [107.9, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_57", "p": [106.685, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_6", "p": [88.157, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_60", "p": [109.131, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_61", "p": [99.644, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_64", "p": [102.131, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_65", "p": [100.905, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_66", "p": [95.116, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_67", "p": [93.932, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_68", "p": [96.378, 32.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_7", "p": [86.887, 27.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_73", "p": [95.125, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_74", "p": [93.912, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_76", "p": [96.371, 37.5, 1.4], "yaw": 90.0}, {"n": "Plant_C_78", "p": [93.869, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_79", "p": [95.095, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_8", "p": [93.859, 31.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_80", "p": [96.33, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_81", "p": [99.621, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_82", "p": [100.863, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_83", "p": [102.089, 36.5, 1.4], "yaw": -90.0}, {"n": "Plant_C_9", "p": [95.087, 31.5, 1.4], "yaw": -90.0}],
  "Centrifuge_C": [{"n": "Centrifuge_C_0", "p": [94.75, 48.0, 1.0], "yaw": 90.0}],
  "Analyzer_C": [{"n": "Analyzer_C_1", "p": [91.35, 48.55, 1.0], "yaw": 90.0}],
  "Analysis_PC_C": [{"n": "Analysis_PC_C_0", "p": [90.216, 48.568, 1.0], "yaw": 75.0}],
  "DeliveryCase_C": [{"n": "DeliveryCase_C_10", "p": [93.5, 57.0, 1.5], "yaw": 90.0}, {"n": "DeliveryCase_C_11", "p": [97.5, 69.0, 1.5], "yaw": -90.0}, {"n": "DeliveryCase_C_12", "p": [102.5, 69.0, 1.5], "yaw": -90.0}, {"n": "DeliveryCase_C_13", "p": [108.0, 64.0, 1.5], "yaw": -180.0}, {"n": "DeliveryCase_C_14", "p": [109.0, 63.5, 1.5], "yaw": 0.0}, {"n": "DeliveryCase_C_15", "p": [112.5, 69.0, 1.5], "yaw": -90.0}, {"n": "DeliveryCase_C_16", "p": [76.0, 67.5, 1.5], "yaw": 0.0}, {"n": "DeliveryCase_C_17", "p": [76.0, 71.5, 1.5], "yaw": 0.0}, {"n": "DeliveryCase_C_19", "p": [75.0, 66.5, 1.5], "yaw": -180.0}, {"n": "DeliveryCase_C_2", "p": [46.5, 96.0, 1.5], "yaw": 90.0}, {"n": "DeliveryCase_C_21", "p": [102.0, 111.75, 1.5], "yaw": -180.0}, {"n": "DeliveryCase_C_3", "p": [42.0, 45.55, 1.5], "yaw": 0.0}, {"n": "DeliveryCase_C_5", "p": [48.0, 41.5, 1.5], "yaw": 0.0}, {"n": "DeliveryCase_C_6", "p": [67.5, 43.0, 1.5], "yaw": -90.0}, {"n": "DeliveryCase_C_7", "p": [78.0, 53.0, 1.5], "yaw": -180.0}, {"n": "DeliveryCase_C_8", "p": [71.0, 46.0, 1.5], "yaw": 0.0}, {"n": "DeliveryCase_C_9", "p": [86.5, 47.0, 1.5], "yaw": -90.0}],
  "Data_PC_C": [{"n": "Data_PC_C_9", "p": [33.516, 85.439, 1.0], "yaw": -81.7}, {"n": "Data_PC_C_11", "p": [52.392, 98.909, 1.0], "yaw": -170.1}, {"n": "Data_PC_C_1", "p": [98.0, 75.679, 1.0], "yaw": -84.1}, {"n": "Data_PC_C_10", "p": [98.764, 110.412, 1.0], "yaw": -84.9}, {"n": "Data_PC_C_12", "p": [90.0, 55.444, 1.0], "yaw": -74.8}, {"n": "Data_PC_C_2", "p": [105.0, 75.681, 1.0], "yaw": -90.0}, {"n": "Data_PC_C_3", "p": [113.0, 75.67, 1.0], "yaw": -90.0}, {"n": "Data_PC_C_5", "p": [81.0, 62.538, 1.0], "yaw": 90.0}, {"n": "Data_PC_C_6", "p": [83.5, 74.0, 1.0], "yaw": -180.0}, {"n": "Data_PC_C_7", "p": [67.0, 69.5, 1.0], "yaw": 90.0}, {"n": "Data_PC_C_8", "p": [51.479, 45.0, 1.0], "yaw": 179.6}],
  "MachinePannel_C": [{"n": "MachinePannel_C_2", "p": [33.0, 97.5, 1.0], "yaw": -180.0}, {"n": "MachinePannel_C_3", "p": [33.0, 111.5, 1.0], "yaw": -180.0}],
  "BottleSlot_C": [{"n": "BottleSlot_C_0", "p": [38.0, 110.5, 1.0], "yaw": -90.0}, {"n": "BottleSlot_C_1", "p": [38.0, 98.5, 1.0], "yaw": 90.0}, {"n": "BottleSlot_C_10", "p": [37.0, 110.5, 1.0], "yaw": -90.0}, {"n": "BottleSlot_C_11", "p": [36.0, 110.5, 1.0], "yaw": -90.0}, {"n": "BottleSlot_C_12", "p": [35.0, 110.5, 1.0], "yaw": -90.0}, {"n": "BottleSlot_C_7", "p": [35.0, 98.5, 1.0], "yaw": 90.0}, {"n": "BottleSlot_C_8", "p": [36.0, 98.5, 1.0], "yaw": 90.0}, {"n": "BottleSlot_C_9", "p": [37.0, 98.5, 1.0], "yaw": 90.0}],
  "Pizzushi_Table_C": [{"n": "Pizusshi_Table_C_0", "p": [67.5, 84.25, 0.875], "yaw": -90.0}, {"n": "Pizusshi_Table_C_1", "p": [71.75, 85.5, 0.875], "yaw": 180.0}, {"n": "Pizusshi_Table_C_2", "p": [69.0, 72.75, 0.875], "yaw": 90.0}, {"n": "Pizusshi_Table_C_3", "p": [71.5, 81.0, 0.875], "yaw": 90.0}, {"n": "Pizusshi_Table_C_4", "p": [65.75, 76.5, 0.875], "yaw": -90.0}],
  "Pizzushi_Machine_C": [{"n": "Pizzushi_Machine_C_2", "p": [71.0, 62.5, 1.0], "yaw": 90.0}],
  "Rice_Machine_C": [{"n": "Rice_Machine_C_1", "p": [67.5, 67.25, 1.0], "yaw": 0.0}, {"n": "Rice_Machine_C_2", "p": [67.5, 66.25, 1.0], "yaw": 0.0}, {"n": "Rice_Machine_C_3", "p": [67.5, 64.5, 1.0], "yaw": 0.0}],
  "Fish_Machine_C": [{"n": "Fish_Machine_C_3", "p": [61.0, 65.94, 1.5], "yaw": 0.0}],
  "Scanner_Machine_C": [{"n": "Scanner_Machine_C_1", "p": [65.5, 52.5, 0.0], "yaw": 0.0}],
  "Scanner_PC_C": [{"n": "Scanner_PC_C_1", "p": [64.5, 46.0, 1.0], "yaw": -180.0}],
  "Scanner_Screen_C": [{"n": "Scanner_Screen_C_1", "p": [64.427, 47.584, 1.5], "yaw": -157.4}],
  "Vent_C": [{"n": "Vent_C_14", "p": [75.0, 70.0, 1.5], "yaw": 0.0}, {"n": "Vent_C_15", "p": [72.5, 40.0, 1.5], "yaw": -90.0}, {"n": "Vent_C_17", "p": [98.0, 120.0, 1.5], "yaw": 90.0}, {"n": "Vent_C_18", "p": [50.0, 118.0, 1.5], "yaw": 90.0}, {"n": "Vent_C_19", "p": [66.0, 66.0, 1.5], "yaw": 0.0}, {"n": "Vent_C_21", "p": [36.5, 86.0, 1.5], "yaw": 90.0}, {"n": "Vent_C_23", "p": [101.0, 62.0, 1.5], "yaw": -90.0}, {"n": "Vent_C_25", "p": [61.0, 44.0, 1.5], "yaw": 0.0}, {"n": "Vent_C_26", "p": [62.0, 45.0, 1.5], "yaw": -180.0}, {"n": "Vent_C_27", "p": [79.0, 69.5, 1.5], "yaw": 0.0}, {"n": "Vent_C_28", "p": [96.0, 106.0, 1.5], "yaw": -90.0}, {"n": "Vent_C_6", "p": [36.5, 62.0, 1.5], "yaw": -90.0}, {"n": "Vent_C_8", "p": [87.0, 56.0, 1.5], "yaw": 90.0}, {"n": "Vent_C_9", "p": [52.0, 68.5, 1.5], "yaw": 0.0}, {"n": "Vent_C_0", "p": [52.0, 79.5, 1.5], "yaw": 0.0}, {"n": "Vent_C_1", "p": [25.0, 75.5, 1.5], "yaw": -180.0}, {"n": "Vent_C_2", "p": [29.0, 99.5, 1.5], "yaw": -180.0}],
  "FilterCleaner_C": [{"n": "FilterCleaner_C_0", "p": [52.5, 101.5, 0.25], "yaw": -180.0}, {"n": "FilterCleaner_C_1", "p": [52.5, 100.5, 0.25], "yaw": -180.0}, {"n": "FilterCleaner_C_2", "p": [52.5, 102.5, 0.25], "yaw": -180.0}],
  "Locked_Door_C": [{"n": "Locked_Door_C_3", "p": [24.5, 84.0, 0.0], "yaw": 180.0}, {"n": "Locked_Door_C_4", "p": [31.0, 113.5, 0.0], "yaw": -90.0}, {"n": "Locked_Door_C_2", "p": [59.5, 36.0, 0.0], "yaw": 180.0}, {"n": "Locked_Door_C_5", "p": [62.0, 33.5, 0.0], "yaw": -90.0}, {"n": "Locked_Door_C_6", "p": [30.0, 61.5, 0.0], "yaw": -90.0}, {"n": "Locked_Door_C_7", "p": [78.5, 29.0, 0.0], "yaw": 180.0}, {"n": "Locked_Door_C_1", "p": [56.0, 105.5, 0.0], "yaw": -90.0}, {"n": "Locked_Door_C_8", "p": [84.5, 115.0, 0.0], "yaw": 0.0}, {"n": "Locked_Door_C_0", "p": [100.5, 123.0, 5.0], "yaw": 0.0}],
  "Door_Unlocker_C": [{"n": "Door_Unlocker_C_1", "p": [25.0, 81.5, 1.5], "yaw": 0.0}, {"n": "Door_Unlocker_C_2", "p": [29.0, 112.25, 1.5], "yaw": 0.0}, {"n": "Door_Unlocker_C_4", "p": [64.0, 35.0, 1.5], "yaw": 180.0}, {"n": "Door_Unlocker_C_5", "p": [60.5, 38.0, 1.5], "yaw": -90.0}, {"n": "Door_Unlocker_C_6", "p": [79.0, 26.75, 1.5], "yaw": 0.0}, {"n": "Door_Unlocker_C_7", "p": [27.5, 62.0, 1.5], "yaw": 90.0}, {"n": "Door_Unlocker_C_0", "p": [58.0, 104.0, 1.5], "yaw": -180.0}, {"n": "Door_Unlocker_C_3", "p": [85.0, 117.5, 1.5], "yaw": 0.0}],
  "AlarmButton_C": [{"n": "AlarmButton_C_0", "p": [79.0, 49.5, 1.5], "yaw": 0.0}, {"n": "AlarmButton_C_1", "p": [71.5, 68.0, 1.5], "yaw": -90.0}, {"n": "AlarmButton_C_2", "p": [62.0, 48.125, 1.5], "yaw": 0.0}, {"n": "AlarmButton_C_3", "p": [101.0, 69.0, 1.5], "yaw": -90.0}, {"n": "AlarmButton_C_4", "p": [52.0, 74.0, 1.5], "yaw": -180.0}, {"n": "AlarmButton_C_5", "p": [46.0, 109.825, 1.5], "yaw": 180.0}],
  "RezCharger_C": [{"n": "RezCharger_C_0", "p": [26.75, 34.0, 1.5], "yaw": 90.0}, {"n": "RezCharger_C_1", "p": [47.0, 42.5, 1.5], "yaw": 180.0}, {"n": "RezCharger_C_2", "p": [28.75, 34.0, 1.5], "yaw": 90.0}, {"n": "RezCharger_C_3", "p": [30.75, 34.0, 1.5], "yaw": 90.0}],
  "WeaponCaseBox_C": [{"n": "WeaponCaseBox_C_0", "p": [54.65, 99.1, 1.0], "yaw": -1.8}, {"n": "WeaponCaseBox_C_1", "p": [28.874, 80.22, 1.0], "yaw": 4.4}, {"n": "WeaponCaseBox_C_2", "p": [104.649, 62.649, 1.0], "yaw": 91.1}, {"n": "WeaponCaseBox_C_3", "p": [97.618, 43.419, 1.0], "yaw": -9.0}, {"n": "WeaponCaseBox_C_4", "p": [42.69, 42.509, 1.0], "yaw": -1.1}, {"n": "WeaponCaseBox_C_5", "p": [77.451, 55.346, 1.0], "yaw": -93.0}, {"n": "WeaponCaseBox_C_7", "p": [94.692, 108.967, 1.0], "yaw": -2.1}],
  "WeaponCaseCode_C": [{"n": "WeaponCaseCode_C_1", "p": [28.858, 79.396, 1.0], "yaw": -1.2}, {"n": "WeaponCaseCode_C_2", "p": [54.606, 98.237, 1.0], "yaw": -2.5}, {"n": "WeaponCaseCode_C_3", "p": [105.551, 62.631, 1.0], "yaw": 98.3}, {"n": "WeaponCaseCode_C_4", "p": [97.594, 42.545, 1.0], "yaw": 2.1}, {"n": "WeaponCaseCode_C_5", "p": [42.639, 41.642, 1.0], "yaw": 1.1}, {"n": "WeaponCaseCode_C_6", "p": [76.524, 55.338, 1.0], "yaw": -85.7}, {"n": "WeaponCaseCode_C_8", "p": [94.65, 108.101, 1.0], "yaw": 3.8}],
  "WeaponCase_Unlocker_C": [{"n": "WeaponCase_Unlocker_C_1", "p": [75.488, 113.761, 1.0], "yaw": 7.8}],
  "HeavyWeaponCase_C": [{"n": "HeavyWeaponCase_C_1", "p": [75.5, 115.0, 1.0], "yaw": -8.2}],
  "WeaponLoader_C": [{"n": "WeaponLoader_C_2", "p": [81.0, 118.0, 0.0], "yaw": -90.0}],
  "PC_Cameras_C": [{"n": "PC_Cameras_C_1", "p": [101.5, 107.25, 1.0], "yaw": 177.8}],
  "RoomCamera_C": [{"n": "Camera_C_0", "p": [42.75, 116.5, 3.5], "yaw": -15.0, "pitch": -30.0}, {"n": "Camera_C_1", "p": [99.5, 48.5, 3.5], "yaw": 150.0, "pitch": -30.0}, {"n": "Camera_C_10", "p": [25.5, 84.25, 3.5], "yaw": -15.0, "pitch": -15.0}, {"n": "Camera_C_11", "p": [60.25, 39.5, 4.5], "yaw": 150.0, "pitch": -30.0}, {"n": "Camera_C_12", "p": [68.5, 48.75, 3.5], "yaw": -135.0, "pitch": -30.0}, {"n": "Camera_C_13", "p": [101.5, 102.5, 4.75], "yaw": -135.0, "pitch": -15.0}, {"n": "Camera_C_14", "p": [64.5, 57.5, 3.5], "yaw": 105.0, "pitch": -30.0}, {"n": "Camera_C_16", "p": [59.5, 94.0, 3.75], "yaw": -60.0, "pitch": -15.0}, {"n": "Camera_C_2", "p": [84.5, 27.5, 7.25], "yaw": 45.0, "pitch": -30.0}, {"n": "Camera_C_3", "p": [71.5, 48.5, 3.5], "yaw": -45.0, "pitch": -30.0}, {"n": "Camera_C_4", "p": [28.5, 62.5, 8.5], "yaw": 45.0, "pitch": -30.0}, {"n": "Camera_C_5", "p": [52.5, 49.5, 4.5], "yaw": 15.0, "pitch": -30.0}, {"n": "Camera_C_6", "p": [52.0, 96.75, 8.75], "yaw": 135.0, "pitch": -30.0}, {"n": "Camera_C_8", "p": [34.75, 87.5, 3.5], "yaw": 45.0, "pitch": -15.0}, {"n": "Camera_C_9", "p": [51.0, 82.25, 8.5], "yaw": -135.0, "pitch": -30.0}],
  "PlayerSpawn_C": [{"n": "PlayerSpawnTest_C_0", "p": [109.25, 111.25, 5.0], "yaw": -180.0}, {"n": "PlayerSpawnTest_C_1", "p": [89.0, 91.0, 0.0], "yaw": -180.0}],
  "JoinSpawn_C": [{"n": "JoinSpawn_C_1", "p": [114.5, 125.0, 5.0], "yaw": -90.0}, {"n": "JoinSpawn_C_0", "p": [112.0, 128.0, 5.0], "yaw": -15.0}, {"n": "JoinSpawn_C_2", "p": [107.607, 122.437, 5.0], "yaw": 75.0}, {"n": "JoinSpawn_C_3", "p": [103.131, 123.119, 5.0], "yaw": 90.0}, {"n": "JoinSpawn_C_4", "p": [105.631, 125.119, 5.0], "yaw": 60.0}, {"n": "JoinSpawn_C_5", "p": [103.234, 129.967, 5.0], "yaw": 30.0}, {"n": "JoinSpawn_C_6", "p": [103.1, 132.199, 5.0], "yaw": -45.0}, {"n": "JoinSpawn_C_7", "p": [102.746, 138.209, 5.0], "yaw": -15.0}, {"n": "JoinSpawn_C_8", "p": [105.559, 146.773, 5.0], "yaw": -60.0}, {"n": "JoinSpawn_C_9", "p": [110.389, 148.407, 5.0], "yaw": -75.0}, {"n": "JoinSpawn_C_10", "p": [107.008, 147.501, 5.0], "yaw": -15.0}, {"n": "JoinSpawn_C_11", "p": [109.871, 144.664, 5.0], "yaw": -105.0}, {"n": "JoinSpawn_C_12", "p": [115.089, 144.818, 5.0], "yaw": -105.0}, {"n": "JoinSpawn_C_13", "p": [115.856, 139.954, 5.0], "yaw": -120.0}, {"n": "JoinSpawn_C_14", "p": [113.539, 134.941, 5.0], "yaw": -45.0}, {"n": "JoinSpawn_C_15", "p": [114.246, 132.112, 5.0], "yaw": -105.0}, {"n": "JoinSpawn_C_16", "p": [106.798, 133.528, 5.0], "yaw": -30.0}],
  "MapSpawn_C": [{"n": "MapSpawn_C_1", "p": [100.1, 107.456, 0.0], "yaw": 150.1, "sector": 0}, {"n": "MapSpawn_C_2", "p": [100.432, 111.952, 0.0], "yaw": 168.8, "sector": 0}, {"n": "MapSpawn_C_3", "p": [96.519, 119.013, 0.0], "yaw": -93.2, "sector": 0}, {"n": "MapSpawn_C_4", "p": [101.177, 118.374, 0.0], "yaw": -142.2, "sector": 0}, {"n": "MapSpawn_C_5", "p": [86.268, 118.103, 0.0], "yaw": -69.1, "sector": 0}, {"n": "MapSpawn_C_6", "p": [91.656, 108.352, 0.0], "yaw": -116.0, "sector": 0}, {"n": "MapSpawn_C_7", "p": [86.687, 107.232, 0.0], "yaw": -61.3, "sector": 0}, {"n": "MapSpawn_C_8", "p": [91.194, 118.264, 0.0], "yaw": -109.9, "sector": 0}, {"n": "MapSpawn_C_9", "p": [89.112, 114.945, 0.0], "yaw": -93.2, "sector": 0}, {"n": "MapSpawn_C_10", "p": [85.813, 115.129, 0.0], "yaw": -36.6, "sector": 0}, {"n": "MapSpawn_C_11", "p": [95.878, 112.007, 0.0], "yaw": -146.5, "sector": 0}, {"n": "MapSpawn_C_12", "p": [111.15, 71.889, 0.0], "yaw": 80.8, "sector": 0}, {"n": "MapSpawn_C_13", "p": [114.944, 71.754, 0.0], "yaw": 112.8, "sector": 0}, {"n": "MapSpawn_C_15", "p": [109.772, 63.803, 0.0], "yaw": 15.2, "sector": 0}, {"n": "MapSpawn_C_16", "p": [107.003, 64.069, 0.0], "yaw": 171.8, "sector": 0}, {"n": "MapSpawn_C_17", "p": [106.052, 68.137, 0.0], "yaw": -122.3, "sector": 0}, {"n": "MapSpawn_C_18", "p": [108.1, 71.7, 0.0], "yaw": 128.6, "sector": 0}, {"n": "MapSpawn_C_19", "p": [103.132, 71.094, 0.0], "yaw": 68.0, "sector": 0}, {"n": "MapSpawn_C_20", "p": [100.186, 70.83, 0.0], "yaw": 128.4, "sector": 0}, {"n": "MapSpawn_C_21", "p": [83.159, 63.829, 0.0], "yaw": 126.8, "sector": 0}, {"n": "MapSpawn_C_22", "p": [78.214, 63.046, 0.0], "yaw": 45.9, "sector": 0}, {"n": "MapSpawn_C_23", "p": [77.024, 71.91, 0.0], "yaw": 22.2, "sector": 0}, {"n": "MapSpawn_C_24", "p": [80.342, 75.15, 0.0], "yaw": -54.1, "sector": 0}, {"n": "MapSpawn_C_25", "p": [76.974, 69.606, 0.0], "yaw": -42.8, "sector": 0}, {"n": "MapSpawn_C_26", "p": [101.474, 58.662, 0.0], "yaw": -173.0, "sector": 0}, {"n": "MapSpawn_C_27", "p": [98.368, 55.071, 0.0], "yaw": -113.0, "sector": 0}, {"n": "MapSpawn_C_28", "p": [93.803, 54.767, 0.0], "yaw": -48.1, "sector": 0}, {"n": "MapSpawn_C_29", "p": [98.633, 49.599, 0.0], "yaw": 169.3, "sector": 0}, {"n": "MapSpawn_C_30", "p": [96.373, 53.126, 0.0], "yaw": -109.1, "sector": 0}, {"n": "MapSpawn_C_31", "p": [91.007, 53.918, 0.0], "yaw": -94.3, "sector": 0}, {"n": "MapSpawn_C_32", "p": [90.25, 51.528, 0.0], "yaw": -94.3, "sector": 0}, {"n": "MapSpawn_C_33", "p": [85.709, 49.524, 0.0], "yaw": 16.6, "sector": 0}, {"n": "MapSpawn_C_34", "p": [85.847, 54.966, 0.0], "yaw": -71.5, "sector": 0}, {"n": "MapSpawn_C_35", "p": [87.245, 54.966, 0.0], "yaw": -86.1, "sector": 0}, {"n": "MapSpawn_C_36", "p": [84.972, 39.615, 0.0], "yaw": -0.8, "sector": 0}, {"n": "MapSpawn_C_37", "p": [86.361, 40.649, 0.0], "yaw": 46.5, "sector": 0}, {"n": "MapSpawn_C_38", "p": [86.303, 45.262, 0.0], "yaw": -29.5, "sector": 0}, {"n": "MapSpawn_C_39", "p": [109.474, 32.513, 0.0], "yaw": -17.6, "sector": 0}, {"n": "MapSpawn_C_40", "p": [73.239, 45.73, 0.0], "yaw": 2.7, "sector": 0}, {"n": "MapSpawn_C_41", "p": [79.983, 38.112, 0.0], "yaw": 78.2, "sector": 0}, {"n": "MapSpawn_C_42", "p": [72.049, 50.805, 0.0], "yaw": 86.1, "sector": 0}, {"n": "MapSpawn_C_43", "p": [72.487, 54.81, 0.0], "yaw": -91.2, "sector": 0}, {"n": "MapSpawn_C_44", "p": [72.741, 53.021, 0.0], "yaw": 87.2, "sector": 0}, {"n": "MapSpawn_C_46", "p": [75.804, 51.752, 0.0], "yaw": 134.9, "sector": 0}, {"n": "MapSpawn_C_47", "p": [63.158, 62.596, 0.0], "yaw": 91.4, "sector": 0}, {"n": "MapSpawn_C_48", "p": [65.094, 63.276, 0.0], "yaw": 114.0, "sector": 0}, {"n": "MapSpawn_C_49", "p": [61.388, 67.632, 0.0], "yaw": 114.0, "sector": 0}, {"n": "MapSpawn_C_50", "p": [61.316, 68.805, 0.0], "yaw": 41.2, "sector": 0}, {"n": "MapSpawn_C_51", "p": [61.037, 76.511, 0.0], "yaw": -57.0, "sector": 0}, {"n": "MapSpawn_C_52", "p": [73.157, 83.017, 0.0], "yaw": 33.2, "sector": 0}, {"n": "MapSpawn_C_53", "p": [69.632, 84.299, 0.0], "yaw": -100.2, "sector": 0}, {"n": "MapSpawn_C_54", "p": [68.411, 76.714, 0.0], "yaw": -108.8, "sector": 0}, {"n": "MapSpawn_C_55", "p": [72.751, 74.411, 0.0], "yaw": 177.6, "sector": 0}, {"n": "MapSpawn_C_56", "p": [73.559, 70.23, 0.0], "yaw": 144.6, "sector": 0}, {"n": "MapSpawn_C_57", "p": [73.129, 64.144, 0.0], "yaw": 150.7, "sector": 0}, {"n": "MapSpawn_C_58", "p": [69.045, 63.977, 0.0], "yaw": 81.9, "sector": 0}, {"n": "MapSpawn_C_59", "p": [71.485, 70.745, 0.0], "yaw": 166.1, "sector": 0}, {"n": "MapSpawn_C_60", "p": [64.396, 76.507, 0.0], "yaw": -106.5, "sector": 0}, {"n": "MapSpawn_C_61", "p": [101.02, 63.07, 0.0], "yaw": 87.5, "sector": 0}, {"n": "MapSpawn_C_62", "p": [95.864, 70.83, 0.0], "yaw": 73.0, "sector": 0}, {"n": "MapSpawn_C_63", "p": [95.994, 107.007, 0.0], "yaw": 83.5, "sector": 0}, {"n": "MapSpawn_C_64", "p": [99.292, 113.786, 0.0], "yaw": -174.7, "sector": 0}, {"n": "MapSpawn_C_65", "p": [49.028, 54.519, 0.0], "yaw": -20.5, "sector": 0}, {"n": "MapSpawn_C_66", "p": [54.551, 54.519, 0.0], "yaw": -81.9, "sector": 0}, {"n": "MapSpawn_C_67", "p": [59.83, 54.669, 0.0], "yaw": -121.1, "sector": 0}, {"n": "MapSpawn_C_68", "p": [48.697, 44.924, 0.0], "yaw": 23.5, "sector": 0}, {"n": "MapSpawn_C_69", "p": [48.755, 50.586, 0.0], "yaw": -49.0, "sector": 0}, {"n": "MapSpawn_C_70", "p": [48.755, 48.027, 0.0], "yaw": -21.3, "sector": 0}, {"n": "MapSpawn_C_71", "p": [49.815, 40.278, 0.0], "yaw": 42.5, "sector": 0}, {"n": "MapSpawn_C_72", "p": [58.469, 39.944, 0.0], "yaw": 96.9, "sector": 0}, {"n": "MapSpawn_C_73", "p": [55.351, 39.944, 0.0], "yaw": 85.2, "sector": 0}, {"n": "MapSpawn_C_74", "p": [56.943, 39.944, 0.0], "yaw": 89.7, "sector": 0}, {"n": "MapSpawn_C_75", "p": [67.817, 39.87, 0.0], "yaw": 170.8, "sector": 0}, {"n": "MapSpawn_C_76", "p": [67.817, 54.786, 0.0], "yaw": -108.4, "sector": 0}, {"n": "MapSpawn_C_77", "p": [63.492, 54.282, 0.0], "yaw": -149.2, "sector": 0}, {"n": "MapSpawn_C_78", "p": [43.049, 53.99, 0.0], "yaw": -149.2, "sector": 0}, {"n": "MapSpawn_C_79", "p": [43.705, 40.877, 0.0], "yaw": 90.2, "sector": 0}, {"n": "MapSpawn_C_80", "p": [46.189, 40.877, 0.0], "yaw": 144.0, "sector": 0}, {"n": "MapSpawn_C_81", "p": [42.784, 44.015, 0.0], "yaw": 31.7, "sector": 0}, {"n": "MapSpawn_C_82", "p": [49.572, 46.735, 0.0], "yaw": 3.9, "sector": 0}, {"n": "MapSpawn_C_83", "p": [25.996, 63.216, 0.0], "yaw": 44.8, "sector": 0}, {"n": "MapSpawn_C_84", "p": [26.185, 70.505, 0.0], "yaw": -1.6, "sector": 0}, {"n": "MapSpawn_C_85", "p": [26.727, 75.514, 0.0], "yaw": -22.9, "sector": 0}, {"n": "MapSpawn_C_86", "p": [26.727, 84.528, 0.0], "yaw": -36.5, "sector": 0}, {"n": "MapSpawn_C_87", "p": [34.035, 83.111, 0.0], "yaw": -92.5, "sector": 0}, {"n": "MapSpawn_C_88", "p": [38.58, 83.111, 0.0], "yaw": 2.5, "sector": 0}, {"n": "MapSpawn_C_89", "p": [48.921, 83.111, 0.0], "yaw": -89.2, "sector": 0}, {"n": "MapSpawn_C_90", "p": [48.921, 63.605, 0.0], "yaw": 90.7, "sector": 0}, {"n": "MapSpawn_C_91", "p": [50.617, 69.418, 0.0], "yaw": 158.3, "sector": 0}, {"n": "MapSpawn_C_92", "p": [50.617, 77.431, 0.0], "yaw": 174.8, "sector": 0}, {"n": "MapSpawn_C_93", "p": [39.873, 75.962, 0.0], "yaw": 16.1, "sector": 0}, {"n": "MapSpawn_C_94", "p": [40.476, 77.691, 0.0], "yaw": -7.6, "sector": 0}, {"n": "MapSpawn_C_95", "p": [44.825, 71.052, 0.0], "yaw": -178.1, "sector": 0}, {"n": "MapSpawn_C_96", "p": [38.52, 70.122, 0.0], "yaw": 148.1, "sector": 0}, {"n": "MapSpawn_C_97", "p": [39.84, 71.41, 0.0], "yaw": -16.8, "sector": 0}, {"n": "MapSpawn_C_98", "p": [45.385, 83.941, 0.0], "yaw": -64.3, "sector": 0}, {"n": "MapSpawn_C_99", "p": [43.157, 82.438, 0.0], "yaw": 36.9, "sector": 0}, {"n": "MapSpawn_C_100", "p": [46.753, 62.855, 0.0], "yaw": -30.0, "sector": 0}, {"n": "MapSpawn_C_101", "p": [35.835, 93.286, 0.0], "yaw": -2.4, "sector": 0}, {"n": "MapSpawn_C_102", "p": [36.298, 89.126, 0.0], "yaw": 13.0, "sector": 0}, {"n": "MapSpawn_C_103", "p": [55.667, 103.762, 0.0], "yaw": -82.2, "sector": 0}, {"n": "MapSpawn_C_104", "p": [56.788, 101.704, 0.0], "yaw": -100.7, "sector": 0}, {"n": "MapSpawn_C_105", "p": [50.714, 96.927, 0.0], "yaw": 122.6, "sector": 0}, {"n": "MapSpawn_C_106", "p": [49.272, 97.912, 0.0], "yaw": 177.7, "sector": 0}, {"n": "MapSpawn_C_107", "p": [50.516, 98.79, 0.0], "yaw": 99.1, "sector": 0}, {"n": "MapSpawn_C_108", "p": [48.267, 104.644, 0.0], "yaw": -41.1, "sector": 0}, {"n": "MapSpawn_C_109", "p": [51.904, 111.866, 0.0], "yaw": -109.7, "sector": 0}, {"n": "MapSpawn_C_110", "p": [51.139, 105.158, 0.0], "yaw": 109.1, "sector": 0}, {"n": "MapSpawn_C_111", "p": [51.037, 117.124, 0.0], "yaw": -138.9, "sector": 0}, {"n": "MapSpawn_C_112", "p": [51.034, 115.018, 0.0], "yaw": 0.7, "sector": 0}, {"n": "MapSpawn_C_113", "p": [42.768, 116.218, 0.0], "yaw": -8.9, "sector": 0}, {"n": "MapSpawn_C_114", "p": [44.018, 116.218, 0.0], "yaw": -90.2, "sector": 0}, {"n": "MapSpawn_C_115", "p": [44.696, 110.368, 0.0], "yaw": -153.7, "sector": 0}, {"n": "MapSpawn_C_116", "p": [44.631, 107.546, 0.0], "yaw": 179.0, "sector": 0}, {"n": "MapSpawn_C_117", "p": [44.387, 101.008, 0.0], "yaw": 179.0, "sector": 0}, {"n": "MapSpawn_C_118", "p": [41.024, 97.434, 0.0], "yaw": -48.1, "sector": 0}, {"n": "MapSpawn_C_119", "p": [39.44, 102.153, 0.0], "yaw": -114.5, "sector": 0}, {"n": "MapSpawn_C_120", "p": [39.535, 106.693, 0.0], "yaw": 135.4, "sector": 0}, {"n": "MapSpawn_C_121", "p": [30.174, 111.791, 0.0], "yaw": -62.1, "sector": 0}, {"n": "MapSpawn_C_122", "p": [31.814, 111.791, 0.0], "yaw": -93.5, "sector": 0}, {"n": "MapSpawn_C_123", "p": [29.761, 106.047, 0.0], "yaw": 19.6, "sector": 0}, {"n": "MapSpawn_C_124", "p": [30.189, 101.251, 0.0], "yaw": -0.4, "sector": 0}, {"n": "MapSpawn_C_125", "p": [29.99, 97.96, 0.0], "yaw": 74.9, "sector": 0}, {"n": "MapSpawn_C_126", "p": [60.575, 86.262, 0.0], "yaw": 40.9, "sector": 0}, {"n": "MapSpawn_C_127", "p": [60.575, 91.053, 0.0], "yaw": 0.0, "sector": 0}, {"n": "MapSpawn_C_128", "p": [68.925, 93.986, 0.0], "yaw": -28.1, "sector": 0}, {"n": "MapSpawn_C_129", "p": [79.788, 100.87, 0.0], "yaw": -38.2, "sector": 0}, {"n": "MapSpawn_C_130", "p": [98.152, 90.674, 0.0], "yaw": -161.3, "sector": 0}, {"n": "MapSpawn_C_131", "p": [98.753, 81.23, 0.0], "yaw": 43.1, "sector": 0}, {"n": "MapSpawn_C_132", "p": [108.545, 83.273, 0.0], "yaw": 90.0, "sector": 0}, {"n": "MapSpawn_C_133", "p": [105.784, 88.508, 0.0], "yaw": -19.2, "sector": 0}, {"n": "MapSpawn_C_134", "p": [88.939, 63.069, 0.0], "yaw": 90.0, "sector": 0}, {"n": "MapSpawn_C_135", "p": [86.035, 69.236, 0.0], "yaw": 71.2, "sector": 0}, {"n": "MapSpawn_C_136", "p": [79.008, 82.063, 0.0], "yaw": 40.4, "sector": 0}, {"n": "MapSpawn_C_137", "p": [81.001, 59.012, 0.0], "yaw": -90.0, "sector": 0}, {"n": "MapSpawn_C_138", "p": [84.619, 59.012, 0.0], "yaw": 180.0, "sector": 0}, {"n": "MapSpawn_C_139", "p": [70.416, 59.012, 0.0], "yaw": 180.0, "sector": 0}, {"n": "MapSpawn_C_140", "p": [41.414, 59.012, 0.0], "yaw": 0.0, "sector": 0}, {"n": "MapSpawn_C_141", "p": [52.704, 59.012, 0.0], "yaw": 0.0, "sector": 0}, {"n": "MapSpawn_C_142", "p": [97.537, 102.016, 0.0], "yaw": -123.2, "sector": 0}, {"n": "MapSpawn_C_143", "p": [98.826, 98.952, 0.0], "yaw": 163.0, "sector": 0}, {"n": "MapSpawn_C_144", "p": [88.345, 94.439, 0.0], "yaw": -161.9, "sector": 0}, {"n": "MapSpawn_C_145", "p": [91.422, 87.187, 0.0], "yaw": 170.6, "sector": 0}],
  "Item_Spawner_C": [{"n": "Item_Spawner_C_0", "p": [42.75, 40.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_10", "p": [43.5, 62.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_101", "p": [46.25, 50.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_102", "p": [73.5, 81.5, 0.9], "yaw": -90.0}, {"n": "Item_Spawner_C_103", "p": [46.25, 49.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_105", "p": [46.25, 48.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_107", "p": [91.25, 55.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_108", "p": [97.5, 110.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_11", "p": [42.5, 62.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_111", "p": [43.5, 39.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_114", "p": [44.5, 39.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_117", "p": [45.5, 39.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_12", "p": [39.5, 62.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_124", "p": [53.121, 41.461, 1.019], "yaw": 110.8}, {"n": "Item_Spawner_C_13", "p": [40.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_132", "p": [44.5, 79.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_133", "p": [43.5, 79.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_134", "p": [42.5, 79.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_135", "p": [39.5, 79.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_136", "p": [44.5, 79.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_137", "p": [43.5, 79.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_138", "p": [42.5, 79.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_139", "p": [39.5, 79.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_14", "p": [40.5, 62.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_140", "p": [40.5, 79.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_141", "p": [40.5, 79.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_147", "p": [44.5, 80.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_148", "p": [43.5, 80.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_149", "p": [42.5, 80.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_15", "p": [52.25, 64.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_150", "p": [39.5, 80.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_151", "p": [44.5, 80.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_152", "p": [43.5, 80.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_153", "p": [42.5, 80.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_154", "p": [39.5, 80.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_155", "p": [40.5, 80.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_156", "p": [40.5, 80.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_16", "p": [52.25, 64.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_162", "p": [44.5, 85.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_163", "p": [43.5, 85.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_164", "p": [42.5, 85.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_165", "p": [39.5, 85.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_166", "p": [44.5, 85.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_167", "p": [43.5, 85.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_168", "p": [42.5, 85.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_169", "p": [39.5, 85.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_17", "p": [52.25, 66.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_170", "p": [40.5, 85.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_171", "p": [40.5, 85.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_173", "p": [45.75, 80.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_174", "p": [45.75, 80.5, 0.125], "yaw": 180.0}, {"n": "Item_Spawner_C_176", "p": [45.75, 79.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_177", "p": [45.75, 79.5, 0.125], "yaw": 180.0}, {"n": "Item_Spawner_C_179", "p": [45.75, 74.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_18", "p": [52.25, 66.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_180", "p": [45.75, 74.5, 0.125], "yaw": 180.0}, {"n": "Item_Spawner_C_182", "p": [45.75, 73.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_183", "p": [45.75, 73.5, 0.125], "yaw": 180.0}, {"n": "Item_Spawner_C_185", "p": [45.75, 68.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_186", "p": [45.75, 68.5, 0.125], "yaw": 180.0}, {"n": "Item_Spawner_C_188", "p": [45.75, 67.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_189", "p": [45.75, 67.5, 0.125], "yaw": 180.0}, {"n": "Item_Spawner_C_19", "p": [52.25, 71.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_191", "p": [59.75, 67.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_192", "p": [59.75, 68.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_193", "p": [59.75, 69.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_194", "p": [59.75, 70.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_195", "p": [59.75, 71.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_196", "p": [59.75, 72.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_197", "p": [59.75, 73.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_198", "p": [59.75, 74.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_199", "p": [59.75, 75.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_20", "p": [44.5, 67.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_200", "p": [59.75, 76.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_201", "p": [59.75, 77.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_202", "p": [63.75, 72.5, 0.9], "yaw": 90.0}, {"n": "Item_Spawner_C_204", "p": [63.0, 76.5, 0.9], "yaw": 180.0}, {"n": "Item_Spawner_C_206", "p": [72.5, 73.0, 0.9], "yaw": -90.0}, {"n": "Item_Spawner_C_207", "p": [71.0, 72.5, 0.9], "yaw": 90.0}, {"n": "Item_Spawner_C_209", "p": [71.5, 76.0, 0.9], "yaw": 0.0}, {"n": "Item_Spawner_C_21", "p": [43.5, 67.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_212", "p": [74.25, 74.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_215", "p": [74.25, 77.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_216", "p": [71.5, 69.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_217", "p": [70.5, 69.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_218", "p": [69.5, 69.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_219", "p": [68.5, 69.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_22", "p": [42.5, 67.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_222", "p": [83.25, 72.75, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_225", "p": [83.25, 75.25, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_226", "p": [81.5, 70.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_227", "p": [80.5, 70.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_23", "p": [39.5, 67.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_232", "p": [76.75, 73.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_234", "p": [76.75, 74.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_236", "p": [76.75, 75.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_24", "p": [44.5, 67.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_249", "p": [82.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_25", "p": [43.5, 67.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_250", "p": [83.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_253", "p": [96.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_256", "p": [97.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_258", "p": [98.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_26", "p": [42.5, 67.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_260", "p": [99.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_266", "p": [102.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_27", "p": [39.5, 67.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_270", "p": [106.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_272", "p": [115.25, 63.75, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_276", "p": [115.25, 65.75, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_278", "p": [115.25, 66.75, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_28", "p": [40.5, 67.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_280", "p": [111.5, 68.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_282", "p": [110.5, 68.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_29", "p": [40.5, 67.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_297", "p": [99.0, 75.5, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_3", "p": [52.25, 65.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_30", "p": [90.5, 37.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_300", "p": [106.5, 75.5, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_31", "p": [52.25, 114.75, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_313", "p": [110.5, 75.5, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_314", "p": [111.5, 75.5, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_318", "p": [100.5, 110.5, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_319", "p": [101.5, 110.5, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_32", "p": [52.25, 115.75, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_326", "p": [97.5, 110.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_33", "p": [52.25, 116.75, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_337", "p": [94.75, 106.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_34", "p": [82.5, 68.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_341", "p": [94.75, 110.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_342", "p": [94.75, 111.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_343", "p": [94.75, 112.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_344", "p": [94.75, 118.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_345", "p": [94.75, 119.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_349", "p": [87.5, 48.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_35", "p": [43.5, 117.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_350", "p": [99.25, 55.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_352", "p": [96.0, 48.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_353", "p": [85.5, 48.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_356", "p": [93.0, 48.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_357", "p": [88.5, 48.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_358", "p": [99.25, 54.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_359", "p": [86.5, 48.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_36", "p": [83.5, 68.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_361", "p": [99.25, 52.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_365", "p": [84.75, 54.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_366", "p": [84.75, 55.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_367", "p": [84.75, 49.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_369", "p": [99.25, 53.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_37", "p": [74.25, 67.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_371", "p": [99.25, 51.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_373", "p": [99.25, 49.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_375", "p": [98.5, 48.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_38", "p": [44.5, 117.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_386", "p": [43.5, 55.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_387", "p": [42.5, 55.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_39", "p": [44.0, 117.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_4", "p": [52.25, 65.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_40", "p": [43.75, 117.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_401", "p": [70.75, 55.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_404", "p": [70.75, 54.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_407", "p": [70.75, 53.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_409", "p": [70.75, 52.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_41", "p": [43.25, 117.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_411", "p": [70.75, 51.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_412", "p": [70.75, 50.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_414", "p": [75.0, 50.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_416", "p": [74.0, 50.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_417", "p": [77.5, 48.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_418", "p": [77.5, 48.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_42", "p": [52.25, 71.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_429", "p": [76.5, 48.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_43", "p": [52.25, 70.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_430", "p": [76.5, 48.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_432", "p": [75.5, 48.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_433", "p": [75.5, 48.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_435", "p": [74.5, 48.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_436", "p": [74.5, 48.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_439", "p": [68.25, 44.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_44", "p": [52.25, 70.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_441", "p": [77.5, 43.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_442", "p": [76.5, 43.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_443", "p": [75.5, 43.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_444", "p": [74.5, 43.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_446", "p": [77.25, 42.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_448", "p": [77.25, 41.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_45", "p": [52.25, 72.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_450", "p": [77.25, 40.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_457", "p": [100.25, 46.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_459", "p": [100.25, 45.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_46", "p": [52.25, 72.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_461", "p": [100.25, 44.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_464", "p": [97.75, 41.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_468", "p": [84.75, 45.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_47", "p": [52.25, 76.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_470", "p": [84.75, 44.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_472", "p": [84.75, 46.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_473", "p": [89.5, 37.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_474", "p": [92.25, 31.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_475", "p": [84.75, 35.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_477", "p": [84.75, 34.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_479", "p": [84.75, 33.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_48", "p": [52.25, 76.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_489", "p": [89.5, 27.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_49", "p": [52.25, 75.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_490", "p": [90.5, 27.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_491", "p": [91.5, 27.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_492", "p": [92.5, 27.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_493", "p": [68.25, 45.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_495", "p": [103.75, 32.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_496", "p": [103.75, 31.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_497", "p": [68.25, 46.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_499", "p": [68.25, 47.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_5", "p": [44.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_50", "p": [44.5, 68.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_500", "p": [103.75, 27.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_501", "p": [104.5, 27.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_502", "p": [106.25, 32.75, 0.5], "yaw": 0.0}, {"n": "Item_Spawner_C_503", "p": [107.75, 32.75, 0.5], "yaw": 180.0}, {"n": "Item_Spawner_C_504", "p": [107.75, 31.25, 0.5], "yaw": 180.0}, {"n": "Item_Spawner_C_505", "p": [106.25, 31.25, 0.5], "yaw": 0.0}, {"n": "Item_Spawner_C_506", "p": [111.5, 46.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_508", "p": [110.5, 46.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_51", "p": [43.5, 68.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_510", "p": [109.5, 46.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_518", "p": [103.75, 44.5, 1.0], "yaw": 180.0}, {"n": "Item_Spawner_C_52", "p": [42.5, 68.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_520", "p": [88.5, 46.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_521", "p": [89.5, 46.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_53", "p": [39.5, 68.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_536", "p": [52.0, 55.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_538", "p": [51.0, 55.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_539", "p": [51.25, 49.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_54", "p": [44.5, 68.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_540", "p": [51.25, 48.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_541", "p": [51.25, 47.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_542", "p": [51.25, 46.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_546", "p": [56.25, 46.5, 0.5], "yaw": 0.0}, {"n": "Item_Spawner_C_547", "p": [57.75, 46.5, 0.5], "yaw": 180.0}, {"n": "Item_Spawner_C_548", "p": [57.75, 47.75, 0.5], "yaw": -90.0}, {"n": "Item_Spawner_C_549", "p": [56.25, 47.75, 0.5], "yaw": -90.0}, {"n": "Item_Spawner_C_55", "p": [43.5, 68.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_550", "p": [56.25, 45.25, 0.5], "yaw": 90.0}, {"n": "Item_Spawner_C_551", "p": [57.75, 45.25, 0.5], "yaw": 90.0}, {"n": "Item_Spawner_C_558", "p": [46.0, 117.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_559", "p": [45.5, 117.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_56", "p": [42.5, 68.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_560", "p": [45.0, 117.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_562", "p": [46.5, 117.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_563", "p": [44.75, 117.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_564", "p": [44.25, 117.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_565", "p": [52.25, 117.25, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_566", "p": [52.25, 116.25, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_567", "p": [52.25, 115.25, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_57", "p": [39.5, 68.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_58", "p": [40.5, 68.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_59", "p": [40.5, 68.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_6", "p": [43.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_60", "p": [52.25, 75.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_61", "p": [52.25, 77.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_62", "p": [52.25, 77.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_63", "p": [52.25, 82.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_64", "p": [52.25, 82.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_65", "p": [44.5, 73.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_66", "p": [43.5, 73.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_67", "p": [42.5, 73.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_68", "p": [39.5, 73.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_69", "p": [44.5, 73.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_7", "p": [42.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_70", "p": [43.5, 73.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_71", "p": [42.5, 73.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_72", "p": [39.5, 73.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_73", "p": [40.5, 73.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_74", "p": [40.5, 73.25, 0.125], "yaw": 90.0}, {"n": "Item_Spawner_C_75", "p": [52.25, 81.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_76", "p": [52.25, 81.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_77", "p": [52.25, 83.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_78", "p": [52.25, 83.5, 0.125], "yaw": 0.0}, {"n": "Item_Spawner_C_79", "p": [74.25, 66.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_8", "p": [39.5, 62.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_80", "p": [44.5, 74.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_81", "p": [43.5, 74.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_82", "p": [42.5, 74.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_83", "p": [39.5, 74.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_84", "p": [44.5, 74.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_85", "p": [43.5, 74.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_86", "p": [42.5, 74.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_87", "p": [39.5, 74.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_88", "p": [40.5, 74.75, 1.0], "yaw": -90.0}, {"n": "Item_Spawner_C_89", "p": [40.5, 74.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_9", "p": [44.5, 62.75, 0.125], "yaw": -90.0}, {"n": "Item_Spawner_C_90", "p": [70.25, 68.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_91", "p": [74.25, 63.5, 1.0], "yaw": 0.0}, {"n": "Item_Spawner_C_92", "p": [67.75, 63.5, 1.0], "yaw": -180.0}, {"n": "Item_Spawner_C_93", "p": [67.75, 65.5, 1.0], "yaw": -180.0}, {"n": "Item_Spawner_C_94", "p": [81.5, 68.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_95", "p": [45.5, 55.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_96", "p": [80.5, 68.25, 1.0], "yaw": 90.0}, {"n": "Item_Spawner_C_98", "p": [44.5, 55.25, 1.0], "yaw": 90.0}],
  "Tuto_Button_C": [{"n": "Tuto_Button_C_0", "p": [111.5, 192.0, 6.5], "yaw": -90.0}, {"n": "Tuto_Button_C_1", "p": [112.5, 192.0, 6.5], "yaw": -90.0}, {"n": "Tuto_Button_C_2", "p": [110.5, 192.0, 6.5], "yaw": -90.0}, {"n": "Tuto_Button_C_3", "p": [110.5, 201.0, 6.5], "yaw": -90.0}, {"n": "Tuto_Button_C_4", "p": [117.5, 192.0, 6.5], "yaw": -90.0}, {"n": "Tuto_Button_C_5", "p": [97.0, 197.5, 6.5], "yaw": 0.0}, {"n": "Tuto_Button_C_6", "p": [99.5, 212.0, 6.5], "yaw": -90.0}, {"n": "Tuto_Button_C_7", "p": [81.0, 198.5, 6.5], "yaw": 0.0}, {"n": "Tuto_Button_C_8", "p": [76.5, 197.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_9", "p": [56.5, 197.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_10", "p": [77.5, 197.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_11", "p": [41.0, 183.0, 6.5], "yaw": 0.0}, {"n": "Tuto_Button_C_12", "p": [44.5, 173.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_13", "p": [56.5, 173.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_14", "p": [64.5, 173.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_15", "p": [76.5, 173.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_16", "p": [41.0, 198.5, 6.5], "yaw": 0.0}, {"n": "Tuto_Button_C_17", "p": [41.0, 190.0, 6.5], "yaw": 0.0}, {"n": "Tuto_Button_C_18", "p": [51.0, 190.0, 6.5], "yaw": -180.0}, {"n": "Tuto_Button_C_19", "p": [49.5, 181.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_20", "p": [51.0, 194.5, 4.5], "yaw": -180.0}, {"n": "Tuto_Button_C_21", "p": [43.0, 173.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_22", "p": [63.0, 173.0, 6.5], "yaw": 90.0}, {"n": "Tuto_Button_C_23", "p": [88.0, 184.0, 6.5], "yaw": -90.0}],
  "Tuto_ItemSpawn_C": [{"n": "Tuto_ItemSpawn_C_0", "p": [96.81, 196.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_1", "p": [116.5, 201.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_10", "p": [80.75, 210.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_11", "p": [80.75, 209.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_12", "p": [80.75, 208.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_13", "p": [103.0, 212.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_14", "p": [102.0, 212.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_15", "p": [101.0, 212.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_16", "p": [80.75, 207.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_17", "p": [80.75, 206.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_18", "p": [80.75, 211.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_19", "p": [85.5, 196.75, 6.0], "yaw": -90.0}, {"n": "Tuto_ItemSpawn_C_2", "p": [115.5, 201.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_20", "p": [87.5, 196.75, 6.0], "yaw": -90.0}, {"n": "Tuto_ItemSpawn_C_21", "p": [84.5, 196.75, 6.0], "yaw": -90.0}, {"n": "Tuto_ItemSpawn_C_22", "p": [83.5, 196.75, 6.0], "yaw": -90.0}, {"n": "Tuto_ItemSpawn_C_24", "p": [86.5, 196.75, 6.0], "yaw": -90.0}, {"n": "Tuto_ItemSpawn_C_27", "p": [85.5, 184.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_29", "p": [84.5, 184.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_3", "p": [114.5, 201.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_30", "p": [83.5, 184.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_31", "p": [82.5, 184.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_4", "p": [113.5, 201.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_5", "p": [96.81, 195.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_6", "p": [96.81, 194.0, 6.0], "yaw": 180.0}, {"n": "Tuto_ItemSpawn_C_7", "p": [108.5, 201.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_8", "p": [107.5, 201.25, 6.0], "yaw": 90.0}, {"n": "Tuto_ItemSpawn_C_9", "p": [106.5, 201.25, 6.0], "yaw": 90.0}],
  "Tuto_Door_C": [{"n": "Tuto_Door_C_0", "p": [104.5, 196.5, 5.0], "yaw": 0.0}, {"n": "Tuto_Door_C_1", "p": [100.5, 204.5, 5.0], "yaw": -90.0}, {"n": "Tuto_Door_C_2", "p": [115.5, 192.5, 5.0], "yaw": -90.0}, {"n": "Tuto_Door_C_3", "p": [90.5, 208.5, 5.0], "yaw": 0.0}, {"n": "Tuto_Door_C_4", "p": [80.5, 200.5, 5.0], "yaw": 0.0}, {"n": "Tuto_Door_C_5", "p": [51.5, 200.5, 5.0], "yaw": 0.0}, {"n": "Tuto_Door_C_6", "p": [44.5, 180.5, 5.0], "yaw": 90.0}, {"n": "Tuto_Door_C_7", "p": [60.5, 176.5, 5.0], "yaw": 180.0}, {"n": "Tuto_Door_C_8", "p": [80.5, 176.5, 5.0], "yaw": 180.0}, {"n": "Tuto_Door_C_9", "p": [97.5, 176.5, 5.0], "yaw": 180.0}],
  "Tuto_AlimBox_C": [{"n": "Tuto_AlimBox_C_1", "p": [97.5, 212.0, 5.0], "yaw": 90.0}],
  "Tuto_Screw_C": [{"n": "Tuto_Screw_C_1", "p": [97.0, 201.5, 6.5], "yaw": 0.0}, {"n": "Tuto_Screw_C_2", "p": [97.0, 200.5, 6.5], "yaw": 0.0}, {"n": "Tuto_Screw_C_3", "p": [97.0, 199.5, 6.5], "yaw": 0.0}],
};
