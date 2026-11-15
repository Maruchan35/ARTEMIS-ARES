export type DestinationId = 'moon_pole' | 'moon_equator' | 'mars';

export interface NasaConstantMeta {
  value: number;
  unit: string;
  source: string;
}

export const NASA_CONSTANTS = {
  GRAVITY: {
    EARTH: { value: 9.80665, unit: 'm/s²', source: 'NASA HIDH / Standard Gravity' },
    MOON: { value: 1.62, unit: 'm/s²', source: 'NASA Moon to Mars ESDMD-001 (≈1/6 g · 0.165 g)' },
    MARS: { value: 3.70, unit: 'm/s²', source: 'NASA Moon to Mars ESDMD-001 (≈3/8 g · 0.377 g)' },
    JUPITER: { value: 24.79, unit: 'm/s²', source: 'NASA Planetary Fact Sheet (≈2.528 g cloud-top)' },
    MICROGRAVITY_ORBIT: { value: 0.00001, unit: 'm/s²', source: 'NASA HIDH NASA/SP-2010-3407 (ISS LEO / Cislunar Free-Fall Microgravity ≈10⁻⁶ g₀)' },
  },
  ASTROPHYSICS_AND_COSMOS: {
    ASTRONOMICAL_UNIT_KM: 149597870.7, // 1 AU (IAU / NASA JPL)
    SPEED_OF_LIGHT_KMS: 299792.458, // c (NIST / NASA)
    LIGHT_YEAR_KM: 9.4607e12, // 1 ly in km (NASA Cosmic Distances)
    EARTH_LEO_ORBITAL_VELOCITY_KMS: 7.8, // ISS 400 km orbit
    EARTH_ESCAPE_VELOCITY_KMS: 11.186, // NASA Earth Fact Sheet
    MOON_ESCAPE_VELOCITY_KMS: 2.38, // NASA Moon Fact Sheet
    MARS_ESCAPE_VELOCITY_KMS: 5.03, // NASA Mars Fact Sheet
    JUPITER_ESCAPE_VELOCITY_KMS: 59.5, // NASA Jupiter Fact Sheet
    SOLAR_IRRADIANCE_1AU_WM2: 1361, // NASA SORCE TSI at Earth (1.0 AU)
    SOLAR_IRRADIANCE_MARS_MEAN_WM2: 586, // NASA Mars Fact Sheet at 1.524 AU (~43.1% of 1 AU)
    SOLAR_IRRADIANCE_JUPITER_WM2: 50.5, // NASA Jupiter Fact Sheet at 5.204 AU (~3.7% of 1 AU)
    MARS_AU: 1.524,
    JUPITER_AU: 5.204,
    LEO_ORBIT_PERIOD_MIN: 90, // ISS orbital period
    LEO_SUNRISES_PER_DAY: 16, // ISS circadian cycles per 24 h
    ENTRY_CORRIDOR_EARTH_MIN_DEG: 5.2, // Apollo Atmospheric Entry Corridor min
    ENTRY_CORRIDOR_EARTH_MAX_DEG: 7.2, // Apollo Atmospheric Entry Corridor max
    PREFLIGHT_NOMINAL_HR_BPM: 68, // ASCAN Pre-Flight baseline
    PREFLIGHT_NOMINAL_BP_SYS: 118,
    PREFLIGHT_NOMINAL_BP_DIA: 76,
    MAX_SUSTAINED_LAUNCH_G: 3.8, // Nominal crewed +Gx ascent ceiling
  },
  ENVIRONMENT: {
    LUNAR_SYNODIC_NIGHT_HOURS: 354, // 14.5 Earth days
    LUNAR_SYNODIC_NIGHT_DAYS: 14.5,
    LUNAR_POLE_TEMP_MIN_K: 50,
    LUNAR_POLE_TEMP_MAX_K: 220,
    MARS_SOL_HOURS: 24.6,
    MARS_DUST_STORM_MIN_SOLS: 60,
    MARS_DUST_STORM_MAX_SOLS: 90,
    MARS_DUST_STORM_SOLAR_REMAINING_FRACTION: 0.000002, // 0.0002% irradiance (99.9998% blocked)
    EARTH_COMMS_DELAY_MOON_S: 1.28,
    EARTH_COMMS_DELAY_MARS_AVG_MIN: 14, // 4 to 24 min one-way depending on opposition/conjunction
  },
  ORBITAL: {
    PERILUNE_CYCLE_DAYS: 27.3,
    L2_PARKING_HOURS: 36,
    LUNAR_DESCENT_HOURS: 8,
    SPACE_DEBRIS_VELOCITY_KMH: 25000,
    LanderMaxPayloadKg: {
      moon_pole: 12000, // 12 metric tons lunar cargo lander
      moon_equator: 12000,
      mars: 20000, // 20 metric tons Mars reference architecture
    },
  },
  METABOLIC_DAILY_82KG: {
    // NASA BVAD (NASA/TP-2015-218570) & HIDH — 82 kg crew member with exercise
    DRINKING_WATER_EXERCISE_KG: 2.79,
    DRINKING_WATER_REST_KG: 2.00,
    OXYGEN_NOMINAL_KG: 0.84, // 0.835 - 0.895 kg/d
    OXYGEN_EXERCISE_KG: 0.89,
    FOOD_DEHYDRATED_KG: 0.80, // 3 meals x ~0.27 kg
    FOOD_REHYDRATION_WATER_KG: 0.50,
    HYGIENE_WATER_MIN_KG: 0.70,
    HYGIENE_SHOWER_KG: 2.73,
    HYGIENE_LAUNDRY_KG: 2.80,
    HYGIENE_DISHWASH_KG: 5.45,
    TOTAL_INPUT_KG: 5.68,
    OUTPUT_VAPOR_KG: 2.53,
    OUTPUT_URINE_KG: 1.75, // 1.39 - 2.11 kg/d
    OUTPUT_CO2_KG: 1.08, // 1.00 - 1.08 kg/d
    OUTPUT_SWEAT_KG: 0.51,
    OUTPUT_FECAL_KG: 0.08, // 0.02 - 0.13 kg/d
    TOTAL_OUTPUT_KG: 5.95,
  },
  HABITAT_ATMOSPHERE: {
    NOMINAL_PRESSURE_KPA: 101.3,
    NOMINAL_O2_PERCENT: 21.0,
    HYPOXIA_THRESHOLD_PERCENT: 19.0,
    MODULE_N2_KG: 79,
    MODULE_O2_KG: 21,
    O2_TANK_DRY_KG: 12.7,
    O2_TANK_CAPACITY_KG: 35.4,
    WATER_TANK_DRY_KG: 21.2,
    WATER_TANK_CAPACITY_KG: 103.0,
    LIOH_CANISTER_MASS_KG: 7.0,
    LIOH_PERSON_DAYS: 4.0, // 1.75 kg/day
    LETHAL_DEHYDRATION_BODY_PERCENT: 20,
  },
  EVA_SUIT: {
    MAX_AUTONOMY_HOURS: 8.0, // Apollo 15-17, ISS EMU, Orlan
    WATER_BAG_LITERS: 1.0, // 0.95 to 1.0 L
    FOOD_BARS: 1,
  },
  ECLSS_ARCHITECTURES: {
    OPEN_LOOP_KG_PER_PERSON_DAY: 9.3,
    REGEN_UNIT_MASS_KG: 730, // WPA + CDRA
    REGEN_CONSUMABLES_KG_PER_PERSON_DAY: 0.2,
    BREAKEVEN_DAYS_BY_REDUNDANCY: {
      1: 80,
      2: 180,
      3: 240,
      4: 300,
    } as Record<number, number>,
    CREW_MAINTENANCE_HOURS_PER_PERSON_WEEK: 3.93,
  },
  POWER_AND_THERMAL: {
    SOLAR_MAX_KWE: 20,
    RTG_UNIT_KWE: 0.5,
    RTG_MAX_PRACTICAL_KWE: 3.4,
    FSP_10_KWE: 10,
    FSP_10_MASS_KG: 2000,
    FSP_40_NET_KWE: 40,
    FSP_40_GROSS_KWE: 48, // 4 x 12 kWe Stirling
    FSP_40_MASS_KG: 5800, // 4100 - 5800 kg (up to 7334 MGA)
    FSP_40_EFFICIENCY: 0.181,
    FSP_40_HEAT_REJECT_KWTH: 126.4,
    FSP_40_ELECTRONICS_HEAT_KWTH: 5.1,
    RADIATOR_INLET_K: 420,
    RADIATOR_OUTLET_K: 370,
    RADIATOR_AREA_MOON_POLE_M2: 133.4,
    RADIATOR_AREA_MOON_EQUATOR_M2: 216.2, // +62%
    HAB_INTERNAL_HEAT_MAX_WM2: 163,
    MARS_ELECTROLYSIS_SHARE: 0.667, // ~26.7 kWe
    MARS_BIOTIC_SHARE: 0.095, // ~4 kWe
    MARS_HABITAT_SHARE: 0.238,
    ROVER_MASS_KG: 6000,
    ROVER_DRIVE_POWER_KW: 13.44, // 12.26 - 13.44 kWe
    ROVER_HOURS_RTG_3400W: 1,
    ROVER_HOURS_FSP_10KW: 17,
  },
  RADIATION_AND_SHIELDING: {
    SPE_30_DAY_LIMIT_MSV: 250,
    SPE_MIN_SHIELD_GCM2: 30,
    SECONDARY_NEUTRON_FRACTION: 0.20,
    REGOLITH_DENSITY_KGM3: 1500,
    GCR_REGOLITH_THICKNESS_M: 2.0,
    GCR_REGOLITH_COLUMN_GCM2: 300,
    REGOLITH_MASS_PER_HAB_TONS: 400, // 5x15m cylinder
    MARS_MAX_VAULT_PRESSURE_KPA: 11.1,
    FSP_SURFACE_SAFE_DISTANCE_M: 1000,
    FSP_BURIED_SAFE_DISTANCE_M: 100,
    ANNUAL_REACTOR_DOSE_LIMIT_MSV: 50, // 5 rem/year = 0.05 Sv/yr = 50 mSv/yr
  },
  BLSS_GREENHOUSE: {
    MIN_AREA_PER_PERSON_M2: 25,
    CLOSED_TEST_DAYS: 105,
    O2_RECYCLE_RATIO: 1.0,
    WATER_RECYCLE_RATIO: 1.0,
    FOOD_REGEN_RATIO: 0.55,
    LEACHING_TANK_LITERS: 1200, // 1000L water + 400kg regolith
  },
  MEDICAL_TWINS_STUDY: {
    BONE_LOSS_PERCENT_PER_MONTH: 1.5, // 1.0 - 1.5%/mo
    CALF_MUSCLE_LOSS_PERCENT: 16.0, // 10 - 16%
    THIGH_MUSCLE_LOSS_PERCENT: 7.0, // 4 - 7%
    HYPOVOLEMIA_PERCENT: 15.0, // 10 - 15%
    CARDIAC_ATROPHY_PERCENT: 12.0,
    ORTHOSTATIC_INTOLERANCE_PERCENT: 20.0,
    SLEEP_RECOMMENDED_HOURS: 8.5,
    EXERCISE_DAILY_HOURS: 2.0,
    PRELAUNCH_QUARANTINE_DAYS: 14,
  },
  ESM_FACTORS_2022: {
    GAMMA_V_RIGID_2015: 215.5,
    GAMMA_V_INFLATABLE_2022: 79.3, // kg_eq / m^3
    GAMMA_P_2022: 162.0, // kg_eq / kWe
    GAMMA_C_2022: 96.0, // kg_eq / kWth
    WASTE_STORAGE_KGEQ_PER_KG: 0.93,
    WATER_TREATMENT_KGEQ_PER_KG: 0.30,
    COLD_STORAGE_KGEQ_PER_KG: 0.21,
    MARS_MISSION_DAYS: 960, // 360 transit + 600 surface
  },
  LSMAC_WEIGHTS: {
    ESM_INVERTED: 40,
    SAFETY: 2.5,
    RADIATION: 20,
    TRL: 7.5,
    COST: 2.5,
    HUMAN_FACTORS: 10,
    RELIABILITY: 15,
    MAINTAINABILITY: 2.5,
  },
  LIGHTING_AND_BOTANY_ISS: {
    // NASA ISS SSLA Circadian & Solid-State Lighting + Veggie / APH (GLA) + BIOS-3 / Biosphere 2
    SSLA_CLINICAL_KELVIN: 6300,
    WARM_ALERT_KELVIN: 2700,
    APH_WHITE_KELVIN: 4000,
    APH_PAR_RED_NM: 630, // 630-640 nm up to 600 umol m^-2 s^-1
    APH_PAR_BLUE_NM: 450, // 450-455 nm up to 400 umol m^-2 s^-1
    APH_GREEN_NM: 525, // 525-530 nm
    APH_FAR_RED_NM: 735,
    APH_NIR_NM: 850,
    APH_MAX_PPFD_UMOL_M2_S: 1000,
    APH_AREA_CM2: 1700,
    APH_SENSORS_COUNT: 180,
    VEGGIE_PILLOWS_COUNT: 6,
    SOIL_MICROBE_O2_DRAIN_MIN_L_KG_MIN: 0.022,
    SOIL_MICROBE_O2_DRAIN_MAX_L_KG_MIN: 0.153,
    BIOS3_VOLUME_M3: 315,
    BIOS3_TEST_DAYS: 180,
    BIOS3_WATER_RECOVERY: 0.95,
  },
  LAUNCH_STAGING_PROFILES: {
    // NASA NBL, Space Shuttle (STS), MEDS Glass Cockpit, & SLS Artemis I Timeline
    NBL_POOL_LENGTH_M: 61.5, // 202 ft
    NBL_POOL_WIDTH_M: 31.1, // 102 ft
    NBL_POOL_DEPTH_M: 12.2, // 40 ft
    NBL_WATER_GALLONS: 6200000,
    MEDS_LCD_COUNT: 11,
    MEDS_REPLACED_GAUGES: 32,
    MEDS_REPLACED_CRT: 4,
    STS_PREVALVE_S: -9.5,
    STS_LIFTOFF_S: 0.3,
    STS_MAX_Q_S: 52.8,
    STS_MAX_Q_ALT_FT: 24335,
    STS_MAX_Q_VEL_FPS: 1036.2,
    STS_SRB_SEP_S: 124,
    STS_SRB_SEP_ALT_KM: 46,
    STS_MECO_S: 510,
    STS_ET_SEP_OFFSET_S: 18,
    STS_OMS2_ORBIT_NMI: 150,
    SLS_SRB_SEP_S: 120,
    SLS_LAS_JETTISON_S: 196, // T+00:03:16
    SLS_MECO_ICPS_SEP_S: 483, // T+00:08:03
    SLS_ORION_SOLAR_ARRAY_S: 1089, // T+00:18:09
    SLS_TLI_S: 5367, // T+01:29:27
    SLS_ICPS_FINAL_SEP_S: 7200, // ~T+02:00:00
    ARTEMIS1_DISTANCE_MILES: 1400000,
    ORION_REENTRY_MACH: 32,
    ORION_REENTRY_MPH: 24581,
  },

  QUEST_AIRLOCK_EVA: {
    CABIN_NOMINAL_KPA: 101.3,
    CABIN_NOMINAL_PSI: 14.7,
    CAMPOUT_O2_PURGE_KPA: 70.3,
    CAMPOUT_O2_PURGE_PSI: 10.2,
    SCAVENGE_MID_KPA: 39.5,
    EMU_SUIT_OP_KPA: 29.6,
    EMU_SUIT_OP_PSI: 4.3,
    SCAVENGE_CUTOFF_KPA: 14.0,
    SCAVENGE_CUTOFF_PSI: 2.0,
    MPEV_VENT_SAFE_KPA: 2.1,
    SUIT_O2_DRAIN_PER_MIN_PCT: 0.45,
    SOURCE: 'NASA SSP-50261 Quest Joint Airlock Depress/Repress & EMU 4.3 psi Operations Manual',
  },

  ISS_ECLSS_MBSU_RPCM: {
    SOLAR_PRIMARY_BUS_VDC: 160,
    SECONDARY_MBSU_RPCM_VDC: 120,
    RPCM_BUS_TRIP_LIMIT_KWE: 6.2,
    OGA_POWER_KWE: 1.35,
    CDRA_POWER_KWE: 1.15,
    WRS_POWER_KWE: 0.95,
    ATCS_PUMP_POWER_KWE: 1.05,
    SABATIER_REACTOR_TEMP_C: 400,
    WRS_WATER_RECOVERY_PCT: 98.0,
    CREW_HYDRATION_L_PER_DAY: 2.79,
    CREW_HYDRATION_MIN_L_PER_DAY: 2.0,
    ATCS_LOOP_HOT_K: 420,
    ATCS_LOOP_NOMINAL_K: 277,
    SOURCE: 'NASA ISS Power Architecture (160/120V DC MBSU-RPCM) & BVAD NASA/TP-2015-218570 Rev 2022',
  },

  APOLLO_13_AQUARIUS_1970: {
    O2_TANK2_NOMINAL_PSIA: 1008,
    O2_TANK2_FAULT_PSIA: 0,
    O2_TANK1_LEAK_INIT_PSIA: 781.9,
    MAIN_BUS_A_DROP_V: 28.5,
    MAIN_BUS_B_DROP_V: 29.0,
    AQUARIUS_LIFEBOAT_AMPS: 12,
    AQUARIUS_LIFEBOAT_WATTS: 336,
    CO2_PEAK_MMHG: 14.9,
    CO2_SAFE_POST_MAILBOX_MMHG: 1.2,
    WATER_RATION_L_PER_DAY: 0.2,
    COLD_SOAK_CABIN_C: 3.3,
    SOURCE: 'NASA Apollo 13 Mission Report MSC-02680 / NASA-TM-X-66449 (April 1970)',
  },

  STS_120_P6_4B_2007: {
    TOTAL_ARRAY_SPAN_FT: 240,
    SINGLE_WING_LENGTH_FT: 115,
    TEAR_LENGTH_FT: 2.5,
    TORN_BAYS_RANGE: '29-30',
    CUFFLINKS_REQUIRED: 5,
    REDEPLOY_HALF_BAY_STEPS: 5,
    CANADARM2_PLUS_OBSS_FT: 90,
    LIVE_ARRAY_VOLTAGE_VDC: 160,
    SOURCE: 'NASA STS-120 / Expedition 16 EVA-4 P6-4B Solar Array Wing Repair Report (Nov 2007)',
  },
} as const;

export const NASA_REFERENCES = [
  {
    id: 'BVAD',
    title: 'Life Support Baseline Values and Assumptions Document (NASA/TP-2015-218570 & Rev 2022)',
    url: 'https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf',
    summaryEs: 'Balance metabólico de 82 kg, consumo de 0.84 kg/d O2, 2.79 kg/d agua potable, 1.08 kg/d CO2 y factores ESM.',
    summaryEn: '82 kg crew metabolic balance: 0.84 kg/d O2, 2.79 kg/d drinking water, 1.08 kg/d CO2 and ESM equivalency factors.',
  },
  {
    id: 'ESDMD-001',
    title: 'Moon to Mars Architecture Definition Document (ESDMD-001 Rev C)',
    url: 'https://ntrs.nasa.gov/api/citations/20250010956/downloads/20250010956.pdf',
    summaryEs: 'Regímenes de gravedad (1.62 vs 3.70 m/s²), ciclo lunar de 354 h de oscuridad, rovers presurizados y logística de carga.',
    summaryEn: 'Gravity regimes (1.62 vs 3.70 m/s²), 354 h lunar night cycle, pressurized rovers, and surface cargo constraints.',
  },
  {
    id: 'FSP-40KW',
    title: 'A Deployable 40 kWe Lunar Fission Surface Power Concept (NTRS 20220004670)',
    url: 'https://ntrs.nasa.gov/api/citations/20220004670/downloads/40%20kW%20Deployable%20FSP%20Paper_FINAL.pdf',
    summaryEs: 'Reactor nuclear Stirling 40 kWe (eficiencia 18.1%), rechazo térmico de 126.4 kWth y radiadores de 133.4 vs 216.2 m².',
    summaryEn: '40 kWe Stirling fission reactor (18.1% eff), 126.4 kWth thermal rejection, and 133.4 vs 216.2 m² radiator sizing.',
  },
  {
    id: 'MASS-BALANCE',
    title: 'Astronaut Mass Balance & High Reliability Life Support (NTRS 20190027563 / 20190028339)',
    url: 'https://ntrs.nasa.gov/api/citations/20190027563/downloads/20190027563.pdf',
    summaryEs: 'Curva de equilibrio Ciclo Abierto (9.3 kg/d) vs Regenerativo (730 kg) a 80, 180, 240 y 300 días; letalidad asimétrica.',
    summaryEn: 'Open-loop (9.3 kg/d) vs regenerative (730 kg) break-even at 80, 180, 240, and 300 days; asymmetric lethality windows.',
  },
  {
    id: 'TWINS-MED',
    title: 'NASA Twins Study & Aerospace Clinical Medicine (IJEPH 2025 / NTRS HRP)',
    url: 'https://www.nasa.gov/humans-in-space/twins-study/',
    summaryEs: 'Pérdida ósea 1.5%/mes, atrofia muscular 10–16%, hipovolemia 15%, intolerancia ortostática 20% y sueño de 8.5 h.',
    summaryEn: '1.5%/mo bone loss, 10–16% calf atrophy, 15% hypovolemia, 20% orthostatic intolerance, and 8.5 h sleep standard.',
  },
  {
    id: 'MARS-RAD',
    title: 'The Martian Radiation Environment & Human Health Risks (NTRS 20240009831)',
    url: 'https://ntrs.nasa.gov/api/citations/20240009831/downloads/NAS%20BPS%20Simonsen%20v4%20strives.pdf',
    summaryEs: 'Límite SPE de 250 mSv en 30 días, blindaje >30 g/cm², neutrones secundarios (>20%) y 300 g/cm² de regolito para GCR.',
    summaryEn: '30-day SPE limit of 250 mSv, >30 g/cm² shielding, >20% secondary neutrons, and 300 g/cm² GCR regolith cover.',
  },
  {
    id: 'JPL-FACT-SHEET',
    title: 'NASA NSSDC Planetary Fact Sheets & SORCE Total Solar Irradiance (1 AU)',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    summaryEs: 'Gravedades reales (Tierra 9.81, Luna 1.62, Marte 3.70, Júpiter 24.79 m/s²), velocidades de escape, 1 UA e irradiancia solar 1361 W/m² (1/r²).',
    summaryEn: 'Official gravities (Earth 9.81, Moon 1.62, Mars 3.70, Jupiter 24.79 m/s²), escape velocities, 1 AU, and 1361 W/m² solar irradiance (1/r²).',
  },
  {
    id: 'SSP-50261',
    title: 'NASA ISS Quest Joint Airlock Operations & 160V/120V DC MBSU/RPCM Power Distribution',
    url: 'https://ntrs.nasa.gov/',
    summaryEs: 'Secuencia EVA real 101.3 → 70.3 → 39.5 → 29.6 → 14.0 → 2.1 kPa (MPEV), buses primarios 160V DC y secundarios 120V DC (RPCM).',
    summaryEn: 'Real EVA depress sequence 101.3 → 70.3 → 39.5 → 29.6 → 14.0 → 2.1 kPa (MPEV), 160V DC primary truss & 120V DC MBSU/RPCM buses.',
  },
  {
    id: 'MSC-02680',
    title: 'Apollo 13 Mission Report (NASA MSC-02680 / NASA-TM-X-66449)',
    url: 'https://ntrs.nasa.gov/',
    summaryEs: 'Anomalía Tanque O2 #2 (1008→0 psia), Bus A 28.5V, bote salvavidas Aquarius 12 A (336 W), adaptador Mailbox (14.9→1.2 mmHg CO2) y 0.2 L/día agua.',
    summaryEn: 'O2 Tank #2 failure (1008→0 psia), Bus A 28.5V, Aquarius 12 A (336 W) lifeboat, Mailbox CO2 adapter (14.9→1.2 mmHg), 0.2 L/day water.',
  },
  {
    id: 'STS-120-EVA4',
    title: 'STS-120 / Expedition 16 P6-4B Solar Array Wing Emergency EVA-4 Report',
    url: 'https://www.nasa.gov/mission_pages/shuttle/shuttlemissions/sts120/',
    summaryEs: 'Desgarro 2.5 ft entre bahías 29-30 del ala 240 ft (160V DC vivos), 5 mancuernillas (cufflinks) instaladas con Canadarm2 + OBSS.',
    summaryEn: '2.5 ft tear between Bays 29-30 on 240 ft wing (live 160V DC), 5 improvised cufflinks installed via Canadarm2 + OBSS.',
  },
] as const;
