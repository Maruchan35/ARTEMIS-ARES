import { NASA_CONSTANTS } from './nasaConstants';

export type MissionId =
  | 'tutorial_hab'
  | 'manifest_launch'
  | 'act1_2_surface'
  | 'act3_greenhouse'
  | 'act4_storm_rover';

export type EndingId =
  | 'ending_1_duct_tape'
  | 'ending_2_silent_bunker'
  | 'ending_3_interplanetary_cradle';

export interface CrewCompanion {
  id: 'KATHERINE' | 'WHITSON' | 'CONRAD' | 'LOVELL';
  nameEs: string;
  nameEn: string;
  roleEs: string;
  roleEn: string;
  tributeEs: string;
  tributeEn: string;
  accentHex: string;
}

export const CREW_COMPANIONS: Record<CrewCompanion['id'], CrewCompanion> = {
  KATHERINE: {
    id: 'KATHERINE',
    nameEs: 'KATHERINE (IA Táctica)',
    nameEn: 'KATHERINE (Tactical AI)',
    roleEs: 'Mecánica Orbital y Alertas de Soporte Vital',
    roleEn: 'Orbital Mechanics & Life-Support Alerts',
    tributeEs: 'Homenaje a Katherine Johnson (Mercury 11 y regreso seguro de Apollo 13).',
    tributeEn: 'Tribute to Katherine Johnson (Mercury orbital math & safe return of Apollo 13).',
    accentHex: '#38bdf8',
  },
  WHITSON: {
    id: 'WHITSON',
    nameEs: 'Dra. Whitson',
    nameEn: 'Dr. Whitson',
    roleEs: 'Bióloga y Especialista BIOS (25 m²/persona)',
    roleEn: 'Biologist & BIOS Specialist (25 m²/person)',
    tributeEs: 'Homenaje a Peggy Whitson, bioquímica récord de la ISS y experta en cultivos espaciales.',
    tributeEn: 'Tribute to Peggy Whitson, record-breaking ISS biochemist & space botany pioneer.',
    accentHex: '#d946ef',
  },
  CONRAD: {
    id: 'CONRAD',
    nameEs: 'Ing. Conrad',
    nameEn: 'Eng. Conrad',
    roleEs: 'Sistemas Eléctricos, Térmicos y FSP/SPE',
    roleEn: 'Electrical, Thermal & FSP/SPE Systems',
    tributeEs: 'Homenaje a Pete Conrad, comandante de Skylab 2 que lideró la reparación térmica de Skylab 1.',
    tributeEn: 'Tribute to Pete Conrad, Skylab 2 commander who led the Skylab 1 thermal repair.',
    accentHex: '#f59e0b',
  },
  LOVELL: {
    id: 'LOVELL',
    nameEs: 'Tte. Lovell',
    nameEn: 'Lt. Lovell',
    roleEs: 'Operaciones EVA y Rover de 6,000 kg',
    roleEn: 'EVA Operations & 6,000 kg Pressurized Rover',
    tributeEs: 'Homenaje a James Lovell, comandante de Apollo 13.',
    tributeEn: 'Tribute to James Lovell, Apollo 13 mission commander.',
    accentHex: '#22c55e',
  },
};

export interface MissionPhaseConfig {
  id: MissionId;
  order: number;
  badgeEs: string;
  badgeEn: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  environmentEs: string;
  environmentEn: string;
  gravityMs2: number;
  kelvinLabel: string;
  briefingEs: string;
  briefingEn: string;
  accentHex: string;
  iconBg: string;
  objectivesEs: string[];
  objectivesEn: string[];
}

export const AETHER4_MISSIONS: MissionPhaseConfig[] = [
  {
    id: 'tutorial_hab',
    order: 0,
    badgeEs: 'FASE 0 · INICIO DEL TUTORIAL',
    badgeEn: 'PHASE 0 · TUTORIAL START',
    titleEs: 'Camarote y Entrenamiento en Houston (Antes de Soltar la Tierra)',
    titleEn: 'Houston Crew Quarters & Training (Before Leaving Earth)',
    subtitleEs: 'Tierra · 9.81 m/s² · Piscina NBL 61.5 m · Regla del 8 · Higiene WHC',
    subtitleEn: 'Earth · 9.81 m/s² · 61.5 m NBL Pool · Rule of 8 · WHC Hygiene',
    environmentEs: 'Estación de Entrenamiento Presurizada JSC (6,300 K / Circadiana)',
    environmentEn: 'JSC Pressurized Training Quarters (6,300 K / Circadian)',
    gravityMs2: NASA_CONSTANTS.GRAVITY.EARTH.value,
    kelvinLabel: '6,300 K SSLA / Circadiano',
    briefingEs:
      'Año 2034. Antes de partir en AETHER-4 más allá de los 80 días, calibra tus signos vitales en la caminadora (82 kg), revisa el traje EVA (Regla del 8), usa el compartimento WHC, descansa en tu litera (8.5 h), estabiliza FSP/LiOH/Galley y resuelve la crisis simulada de agua potable.',
    briefingEn:
      'Year 2034. Before departing on AETHER-4 beyond the 80-day limit, calibrate vitals on the treadmill (82 kg), prep EVA Rule of 8 gear, inspect the WHC hygiene rack, complete an 8.5 h bunk rest, stabilize FSP/LiOH/Galley and solve the water crisis drill.',
    accentHex: '#38bdf8',
    iconBg: '#0F2547',
    objectivesEs: [
      'Completar ciclo de descanso en Litera (8.5 h) e interruptor circadiano',
      'Calibrar ejercicio en Caminadora ASCAN y Regla del 8 EVA',
      'Restaurar Energía FSP, Depuración LiOH y Nutrición BVAD',
      'Resolver Simulador de Crisis ECLSS / WHC y leer Nota de Legado #1',
    ],
    objectivesEn: [
      'Complete 8.5 h Bunk sleep cycle & circadian light switch',
      'Calibrate vitals on ASCAN Treadmill & EVA Rule of 8 locker',
      'Restore FSP Power Bus, LiOH CO₂ Scrubbing & BVAD Galley',
      'Resolve ECLSS/WHC Crisis Simulator & collect Legacy Note #1',
    ],
  },
  {
    id: 'manifest_launch',
    order: 1,
    badgeEs: 'FASE 1 · MANIFIESTO Y CABINA MEDS',
    badgeEn: 'PHASE 1 · MANIFEST & MEDS COCKPIT',
    titleEs: 'Manifiesto de Carga (12 t / 20 t) y Secuencia de Despegue Orbital',
    titleEn: 'Payload Manifest (12 t / 20 t) & Orbital Staging Ascent',
    subtitleEs: 'Glass Cockpit 11 LCD · STS / SLS Artemis I · Max-Q 52.8 s · Mach 32',
    subtitleEn: '11-LCD Glass Cockpit · STS / SLS Artemis I · Max-Q 52.8 s · Mach 32',
    environmentEs: 'Cabina de Mando MEDS & Plataforma LC-39B (Azul Marino #0F2547)',
    environmentEn: 'MEDS Flight Deck & Pad LC-39B (Navy Blueprint #0F2547)',
    gravityMs2: NASA_CONSTANTS.GRAVITY.EARTH.value,
    kelvinLabel: '6,300 K Glass Cockpit',
    briefingEs:
      'La escotilla está por cerrarse. Selecciona en la mesa holográfica tu arquitectura real de Soporte Vital (Ciclo Abierto LiOH 9.3 kg/d vs Reciclador ISS 730 kg), Energía (Solar 20 kWe vs FSP 40 kWe KRUSTY) y Movilidad (Rover Solar vs Kilopower), y ejecuta las 5 etapas de despegue en la cabina MEDS.',
    briefingEn:
      'Hatch closure imminent. Select real ECLSS (Open LiOH 9.3 kg/d vs ISS WPA/CDRA 730 kg), Power (Solar 20 kWe vs 40 kWe KRUSTY), and Rover options, then step through all 5 STS / SLS Artemis I launch & staging events.',
    accentHex: '#FF4F00',
    iconBg: '#7C2D12',
    objectivesEs: [
      'Definir Soporte Vital, Planta de Energía y Rover en el Manifiesto',
      'Ejecutar ignición, Max-Q, separación SRB/ET y corte ICPS en cabina MEDS',
      'Recuperar la Nota de Legado #2 y cruzar la escotilla hacia superficie',
    ],
    objectivesEn: [
      'Choose ECLSS, Power Plant & Mobility in Payload Manifest',
      'Execute Liftoff, Max-Q, SRB/ET separation & ICPS staging in MEDS deck',
      'Collect Legacy Note #2 and pass through the surface airlock hatch',
    ],
  },
  {
    id: 'act1_2_surface',
    order: 2,
    badgeEs: 'FASE 2 · ACTOS 1 Y 2',
    badgeEn: 'PHASE 2 · ACTS 1 & 2',
    titleEs: 'El Escudo Roto (Skylab 1 / Apollo 13) y La Gran Oscuridad (SPE / KRUSTY)',
    titleEn: 'The Broken Shield (Skylab 1 / Apollo 13) & The Long Dark (SPE / KRUSTY)',
    subtitleEs: 'Luna 1.62 m/s² / Marte 3.70 m/s² · Calor 163 W/m² · Noche 354 h · 2H₂O→2H₂+O₂',
    subtitleEn: 'Moon 1.62 m/s² / Mars 3.70 m/s² · Heat 163 W/m² · 354 h Night · 2H₂O→2H₂+O₂',
    environmentEs: 'Módulo de Superficie bajo Estrés Térmico y Oscuridad (2,700 K / Alerta)',
    environmentEn: 'Surface Module under Thermal Stress & Blackout (2,700 K / Alert)',
    gravityMs2: NASA_CONSTANTS.GRAVITY.MOON.value,
    kelvinLabel: '2,700 K Alerta / 6,300 K FSP',
    briefingEs:
      'Un fragmento daña el revestimiento térmico (163 W/m²) seguido de una oscuridad de 354 h o tormenta de polvo que bloquea 99.9998% del sol. Improvisa el adaptador Apollo 13 / Skylab o desvía fluidos al radiador y equilibra el reactor Stirling KRUSTY de 40 kWe con la electrólisis SPE.',
    briefingEn:
      'Ejecta damages the thermal shield (163 W/m²), followed by 354 h darkness or 99.9998% dust blackout. Rig an Apollo 13/Skylab patch or route CDRA cooling, then stabilize 40 kWe KRUSTY Stirling power and SPE water electrolysis.',
    accentHex: '#ef4444',
    iconBg: '#7F1D1D',
    objectivesEs: [
      'Acto 1: Reparar panel térmico o aislar circuito CDRA (Desbloquea Nota #3)',
      'Acto 2: Equilibrar electrólisis SPE (66.7% potencia) y FSP KRUSTY (Nota #4)',
      'Estabilizar temperatura y energía para abrir escotilla al Invernadero BLSS',
    ],
    objectivesEn: [
      'Act 1: Repair thermal panel or isolate CDRA loop (Unlocks Note #3)',
      'Act 2: Balance SPE electrolysis (66.7% power) & KRUSTY Stirling (Note #4)',
      'Stabilize thermal/power load to enter the BLSS Greenhouse',
    ],
  },
  {
    id: 'act3_greenhouse',
    order: 3,
    badgeEs: 'FASE 2 · ACTO 3',
    badgeEn: 'PHASE 2 · ACT 3',
    titleEs: 'El Jardín que Respira (Cámaras APH / Veggie & Protocolo BIOS-3)',
    titleEn: 'The Breathing Garden (APH / Veggie Chambers & BIOS-3 Protocol)',
    subtitleEs: '1,700 cm² · 180 Sensores · Luz Magenta 630+450 nm · 1,000 L Agua + 400 kg Regolito',
    subtitleEn: '1,700 cm² · 180 Sensors · 630+450 nm Magenta Glow · 1,000 L Water + 400 kg Regolith',
    environmentEs: 'Módulo Botánico BLSS bajo Iluminación Fotosintética Magenta/Púrpura',
    environmentEn: 'BLSS Botanical Bay under Intense Magenta/Purple GLA Grow Glow',
    gravityMs2: NASA_CONSTANTS.GRAVITY.MARS.value,
    kelvinLabel: '630 nm + 450 nm (Magenta)',
    briefingEs:
      'Aunque los cultivos VEG-05 lucen verdes bajo el resplandor magenta (630 nm rojo + 450 nm azul), el O₂ cae del 21% al 19%: los microbios del compostaje devoran 0.022–0.153 L O₂/kg-min. Aísla el compostaje, abre el tanque amortiguador de 1,000 L + 400 kg de regolito y cosecha en APH.',
    briefingEn:
      'VEG-05 crops glow under 630 nm + 450 nm LEDs while cabin O₂ quietly drops from 21% to 19%: soil microbes consume 0.022–0.153 L O₂/kg-min. Isolate composting, engage the 1,000 L + 400 kg regolith buffer tank and harvest APH.',
    accentHex: '#d946ef',
    iconBg: '#701a75',
    objectivesEs: [
      'Cosechar tomates enanos VEG-05 con almohadilla de arcilla en cámara APH',
      'Cerrar válvula de compostaje microbiano para frenar caída de O₂',
      'Activar tanque amortiguador BIOS-3 (1,000 L + 400 kg) y recoger Nota #5',
    ],
    objectivesEn: [
      'Harvest VEG-05 dwarf tomatoes & porous clay pillow in APH chamber',
      'Seal microbial compost loop to halt silent O₂ drawdown',
      'Activate BIOS-3 buffer tank (1,000 L + 400 kg) & collect Note #5',
    ],
  },
  {
    id: 'act4_storm_rover',
    order: 4,
    badgeEs: 'FASE 2 · ACTO 4 Y 3 FINALES',
    badgeEn: 'PHASE 2 · ACT 4 & 3 ENDINGS',
    titleEs: 'Tormenta Solar de Agosto (>250 mSv), Rover 6,000 kg y Resolución Final',
    titleEn: 'August Solar Storm (>250 mSv), 6,000 kg Rover & Final Outcome',
    subtitleEs: 'SPE 1972 · Regolito 2 m / 300 g/cm² (400 t) · Rover 17 h · 3 Finales Distintos',
    subtitleEn: '1972 SPE · 2 m Regolith / 300 g/cm² (400 t) · 17 h Rover · 3 Distinct Endings',
    environmentEs: 'Esclusa EVA y Puente del Rover Presurizado en Alerta de Radiación',
    environmentEn: 'EVA Airlock & Pressurized Rover Deck under SPE Radiation Alert',
    gravityMs2: NASA_CONSTANTS.GRAVITY.MOON.value,
    kelvinLabel: '2,700 K Alerta SPE >250 mSv',
    briefingEs:
      'KATHERINE emite alerta roja: eyección de masa coronal >250 mSv impactará en horas. Pilota el rover de 6,000 kg de vuelta a la base, despliega los 2 metros de regolito compactado (300 g/cm² · 400 toneladas) y sella el veredicto final de AETHER-4.',
    briefingEn:
      'KATHERINE triggers Red Alert: a >250 mSv coronal mass ejection hits in hours. Bring the 6,000 kg rover back, deploy the 2 m regolith shield (300 g/cm² · 400 tons) and lock in one of the 3 AETHER-4 mission endings.',
    accentHex: '#22c55e',
    iconBg: '#14532d',
    objectivesEs: [
      'Activar retorno en Consola Rover 6,000 kg (1 h Solar vs 17 h Kilopower)',
      'Desplegar blindaje de 2 m de regolito compactado (300 g/cm² / 400 t)',
      'Recuperar Nota de Legado #6 y evaluar Desenlace Final en Consola Central',
    ],
    objectivesEn: [
      'Run return trek on 6,000 kg Rover Console (1 h Solar vs 17 h Kilopower)',
      'Deploy 2 m compacted regolith shield (300 g/cm² / 400 t)',
      'Collect Legacy Note #6 and evaluate Final Ending at Central Console',
    ],
  },
];

export interface LaunchStageMilestone {
  step: number;
  phaseEs: string;
  phaseEn: string;
  stsTime: string;
  slsTime: string;
  eventEs: string;
  eventEn: string;
  visualEs: string;
  visualEn: string;
  altitudeLabel: string;
}

export const LAUNCH_STAGING_EVENTS: LaunchStageMilestone[] = [
  {
    step: 1,
    phaseEs: '1. Ignición y Despegue',
    phaseEn: '1. Ignition & Liftoff',
    stsTime: 'T-9.5 s a T+0.3 s',
    slsTime: 'T-00:00:00 (LC-39B)',
    eventEs: 'Apertura de pre-válvulas LH2, ignición de motores principales RS-25 y aceleradores sólidos.',
    eventEn: 'LH2 pre-valves open, RS-25 main engine & twin SRB ignition on Launch Complex 39B.',
    visualEs: 'Cielo azul marino crepuscular (#0F2547), torre de acero gris con reflectores rojo-ámbar y vapor blanco.',
    visualEn: 'Cold navy dusk sky (#0F2547), steel service tower lit by red-amber floodlights & white cryo vapor.',
    altitudeLabel: '0 km · LC-39B',
  },
  {
    step: 2,
    phaseEs: '2. Ascenso (Max-Q)',
    phaseEn: '2. Ascent (Max-Q)',
    stsTime: 'T+52.8 s (24,335 ft · 1,036.2 fps)',
    slsTime: 'Máxima presión dinámica',
    eventEs: 'El vehículo completo atraviesa la atmósfera densa controlando vibración y límite <= 3.8 g.',
    eventEn: 'Integrated stack punches through dense atmosphere keeping sustained load <= 3.8 g.',
    visualEs: 'Transición de cielo azul marino a negro vacío sobre el fuselaje blanco.',
    visualEn: 'Navy dusk sky transitions toward pitch black vacuum over the white hull.',
    altitudeLabel: '7.4 km · 580 lb/ft²',
  },
  {
    step: 3,
    phaseEs: '3. Separación SRB y LAS',
    phaseEn: '3. SRB & LAS Separation',
    stsTime: 'T+124 a 132 s (46 km / 150,000 ft)',
    slsTime: 'T+00:02:00 SRB / T+00:03:16 LAS',
    eventEs: 'Primer desarme: los 2 cohetes sólidos (SRB) se separan y la torre LAS se eyecta.',
    eventEn: 'First staging: twin Solid Rocket Boosters separate cleanly and LAS abort tower jettisons.',
    visualEs: 'Destello rojo/blanco de motores de separación + superposición Blueprint azul marino y alambre rojo.',
    visualEn: 'Red/white separation plume + navy blueprint overlay highlighting detached boosters in red wireframe.',
    altitudeLabel: '46 km · 150,000 ft',
  },
  {
    step: 4,
    phaseEs: '4. MECO y Etapa Central / ET',
    phaseEn: '4. MECO & Core Stage / ET',
    stsTime: 'T+480 a 510 s MECO (+18 s sep ET)',
    slsTime: 'T+00:08:03 (MECO & sep ICPS)',
    eventEs: 'Segundo desarme: corte de motores principales y maniobra RCS alejándose del Tanque Externo.',
    eventEn: 'Second staging: Main Engine Cutoff and RCS separation from External Tank / Core Stage.',
    visualEs: 'Tanque rojo/óxido cayendo sobre el horizonte azul marino en vacío negro.',
    visualEn: 'Rust-red tank drifting over dark navy Earth shadow under harsh vacuum sunlight.',
    altitudeLabel: '23,660 fps · Vacío',
  },
  {
    step: 5,
    phaseEs: '5. Inserción Orbital, Paneles y TLI',
    phaseEn: '5. Orbit Insertion, Arrays & TLI',
    stsTime: 'GET 00:45:52 (OMS-2, 150 n.mi.)',
    slsTime: 'T+00:18:09 Paneles · T+01:29:27 TLI',
    eventEs: 'Desarme final: despliegue de paneles solares Orion (12 min), inyección translunar TLI y reingreso Mach 32.',
    eventEn: 'Final staging: Orion solar array deploy, Trans-Lunar Injection & Mach 32 profile target.',
    visualEs: 'Luz estelar fría frente al paisaje galáctico brillante del espacio profundo.',
    visualEn: 'Cold starlight over arrays facing vibrant deep-field galaxies.',
    altitudeLabel: 'Órbita / Rumbo TLI',
  },
];

export interface LegacyNoteEntry {
  id: number;
  titleEs: string;
  titleEn: string;
  locationEs: string;
  locationEn: string;
  archiveEs: string;
  archiveEn: string;
  quoteEs: string;
  quoteEn: string;
}

export const LEGACY_NOTES: LegacyNoteEntry[] = [
  {
    id: 1,
    titleEs: 'Nota de Legado #1: Arquitectura ECLSS de la ISS',
    titleEn: 'Legacy Note #1: ISS ECLSS Architecture',
    locationEs: 'Consola de salida de Fase 0 (Entrenamiento)',
    locationEn: 'Phase 0 Training Exit Console',
    archiveEs: 'Archivo: ISS — Arquitectura ECLSS (1998–Presente)',
    archiveEn: 'Archive: ISS — ECLSS Architecture (1998–Present)',
    quoteEs:
      'En la Estación Espacial Internacional (ISS), el sistema ECLSS recupera la humedad condensada del sudor, la respiración e incluso la orina para convertirla en agua potable. Sin atmósfera mueres en minutos; sin agua mueres en días (al perder 20% de tu peso corporal); sin comida resistes semanas. La prioridad de supervivencia siempre protege el aire y el agua potable.',
    quoteEn:
      'Aboard the International Space Station (ISS), ECLSS recovers moisture condensed from sweat, breath, and even urine into potable water. Without atmosphere you die in minutes; without water you die in days (at 20% body weight loss); without food you survive weeks.',
  },
  {
    id: 2,
    titleEs: 'Nota de Legado #2: Ciclo Abierto vs Ciclo Cerrado',
    titleEn: 'Legacy Note #2: Open Loop vs Closed Loop',
    locationEs: 'Cabina de Mando MEDS tras completar Manifiesto y Despegue',
    locationEn: 'MEDS Flight Deck upon Staging',
    archiveEs: 'Archivos: Apollo 13 (11–17 abril 1970) & ISS (Nov 2000–Presente)',
    archiveEn: 'Archives: Apollo 13 (Apr 1970) & ISS (Nov 2000–Present)',
    quoteEs:
      'Apollo 13: "A las 56 h explotó un tanque de oxígeno en Odyssey. Sin recicladores, usaron Aquarius como bote salvavidas reduciendo energía, agua y O₂ al mínimo." — ISS: "La permanencia continua solo fue posible al integrar control de CO₂, electrólisis de agua y recuperación de líquidos en circuito cerrado las 24 h."',
    quoteEn:
      'Apollo 13: "At 56 h an O₂ tank ruptured on Odyssey; without recyclers, crew used Aquarius as a lifeboat." — ISS: "Continuous human presence required 24/7 closed-loop CO₂ scrubbing, water electrolysis, and liquid recovery."',
  },
  {
    id: 3,
    titleEs: 'Nota de Legado #3: El Milagro Térmico de Skylab y los Filtros de Apollo 13',
    titleEn: 'Legacy Note #3: Skylab 1 Thermal Repair & Apollo 13 Filters',
    locationEs: 'Junto a la escotilla tras resolver el Acto 1',
    locationEn: 'Airlock Hatch after resolving Act 1',
    archiveEs: 'Archivo: Skylab 1 (14 de mayo de 1973) & Apollo 13 (1970)',
    archiveEn: 'Archive: Skylab 1 (May 14, 1973) & Apollo 13 (1970)',
    quoteEs:
      'A los 63 segundos del lanzamiento de Skylab 1 se desprendió su escudo térmico y bloqueó un panel solar, elevando el calor interno a niveles extremos. La tripulación de Skylab 2 salió en EVA a instalar un parasol y liberar el panel, logrando estancias de 28, 59 y 84 días. En Apollo 13 unieron cartuchos cuadrados de LiOH con bolsas, cartón, mangueras y cinta adhesiva.',
    quoteEn:
      'At T+63 s, Skylab 1 lost its micrometeoroid/thermal shield and jammed a solar wing. Skylab 2 EVA astronauts deployed a parasol, enabling 28-, 59-, and 84-day stays. On Apollo 13, square LiOH cartridges were adapted to round hoses using plastic bags, cardboard, and duct tape.',
  },
  {
    id: 4,
    titleEs: 'Nota de Legado #4: Gran Oscuridad, Opportunity, SPE y Kilopower KRUSTY',
    titleEn: 'Legacy Note #4: Solar Blackout, Opportunity, SPE & KRUSTY',
    locationEs: 'Consola de Energía tras resolver el Acto 2',
    locationEn: 'Power Console after resolving Act 2',
    archiveEs: 'Archivo: Rover Opportunity (2004–2018), SPE (1970–1972) & Kilopower-KRUSTY (2018)',
    archiveEn: 'Archive: Opportunity (2004–2018), SPE (1970–1972) & KRUSTY (2018)',
    quoteEs:
      'Opportunity operó casi 15 años y 45.16 km en Marte, hasta que la tormenta global de polvo de junio de 2018 bloqueó la luz solar. En contraste, la electrólisis con electrolito polimérico sólido (2H₂O → 2H₂ + O₂) y el demostrador nuclear KRUSTY de la NASA/DOE (uranio-235 + tubos de calor de sodio + Stirling, probado 28 h) operan sin luz solar.',
    quoteEn:
      'Opportunity roved 45.16 km for nearly 15 years until the June 2018 global dust storm blocked sunlight. By contrast, Solid Polymer Electrolyte water electrolysis (2H₂O → 2H₂ + O₂) and the NASA/DOE 28-hour KRUSTY uranium-235 Stirling fission test self-regulate in total darkness.',
  },
  {
    id: 5,
    titleEs: 'Nota de Legado #5: Biosphere 2 vs. BIOS-3',
    titleEn: 'Legacy Note #5: Biosphere 2 vs. BIOS-3',
    locationEs: 'Junto al tanque de nutrientes del Invernadero BLSS',
    locationEn: 'By the BLSS Greenhouse Buffer Tank',
    archiveEs: 'Archivo: Biosphere 2 (1991–1993) vs. BIOS-3 (1972–1973)',
    archiveEn: 'Archive: Biosphere 2 (1991–1993) vs. BIOS-3 (1972–1973)',
    quoteEs:
      'En Biosphere 2 (Arizona, 8 participantes), el O₂ cayó del 20.9% al 16% porque los microbios del suelo rico en materia orgánica consumieron O₂ y el concreto atrapó el CO₂. En cambio, en BIOS-3 (Siberia, 315 m³), 3 investigadores vivieron 180 días logrando 95% de recuperación de agua y 50–70% de su dieta con trigo y vegetales.',
    quoteEn:
      'In Biosphere 2 (Arizona, 8 crew), O₂ fell from 20.9% to 16% as soil microbes consumed O₂ while bare concrete absorbed CO₂. In BIOS-3 (Siberia, 315 m³), 3 researchers lived 180 days with 95% water recovery and 50–70% crop nutrition.',
  },
  {
    id: 6,
    titleEs: 'Nota de Legado #6: Tormenta Solar de Agosto de 1972',
    titleEn: 'Legacy Note #6: August 1972 Solar Proton Event',
    locationEs: 'Caja Negra del Rover al concluir el Acto 4',
    locationEn: 'Rover Black Box upon Act 4 completion',
    archiveEs: 'Archivo: Tormenta Solar de Agosto de 1972 (Entre Apollo 16 y Apollo 17)',
    archiveEn: 'Archive: August 1972 Solar Storm (Between Apollo 16 & 17)',
    quoteEs:
      'En agosto de 1972 ocurrió una de las tormentas de protones solares más intensas jamás registradas, justo entre las misiones Apollo 16 y 17. Sin un refugio blindado con regolito compacto (300 g/cm², 2 m de espesor) o retorno veloz en rover, una tripulación expuesta habría recibido dosis superiores a 250–400 mSv en pocas horas.',
    quoteEn:
      'In August 1972 one of the strongest solar proton events ever recorded struck between Apollo 16 and 17. Without 300 g/cm² compacted regolith shielding (2 m thick) or rapid return, exposed astronauts would exceed 250–400 mSv within hours.',
  },
];

export interface SpacePaperEdition {
  id: number;
  dateBox: string;
  headlineFirstWord: string;
  headlineRest: string;
  subheadEs: string;
  subheadEn: string;
  col1Es: string;
  col1En: string;
  col2Es: string;
  col2En: string;
  circleNoteEs: string;
  circleNoteEn: string;
  tagLeft: string;
  tagRight: string;
  motif: 'meds' | 'whc' | 'aph' | 'nbl' | 'staging' | 'fsp';
}

export const SPACE_PAPER_EDITIONS: SpacePaperEdition[] = [
  {
    id: 1,
    dateBox: 'JUNE 18 1983',
    headlineFirstWord: 'WOMAN',
    headlineRest: 'IN SPACE!?',
    subheadEs: 'SALLY RIDE & STS-7 · EVOLUCIÓN A CABINA MEDS',
    subheadEn: 'SALLY RIDE & STS-7 · EVOLUTION TO MEDS GLASS COCKPIT',
    col1Es:
      'El 18 de junio de 1983, la física y astronauta Sally Ride hizo historia a bordo del transbordador Challenger (STS-7). En los primeros vuelos, la cabina empleaba más de 100 controles, 32 indicadores mecánicos y 4 pantallas CRT verdes monocromáticas.',
    col1En:
      'On June 18, 1983, physicist and astronaut Sally Ride made history aboard Challenger (STS-7). Early Shuttle decks used 100+ controls, 32 electromechanical gauges and 4 green monochrome CRT displays.',
    col2Es:
      'En mayo de 2000, el transbordador Atlantis estrenó la actualización Glass Cockpit MEDS ($9M): 11 pantallas LCD planas a color (9 frontales y 2 traseras) sin reflejos solares que reemplazaron los 32 relojes y 4 CRT, reduciendo peso y consumo.',
    col2En:
      'In May 2000, Atlantis debuted the $9M MEDS Glass Cockpit upgrade: 11 full-color LCDs (9 forward, 2 aft) replacing 32 gauges and 4 CRTs with lower mass and power.',
    circleNoteEs: 'CÍRCULO ROJO: Cabina de vuelo STS-7 y matriz de 11 pantallas LCD MEDS.',
    circleNoteEn: 'RED CIRCLE: STS-7 flight deck & 11-display MEDS LCD cockpit array.',
    tagLeft: '11 PANTALLAS LCD COLOR',
    tagRight: '-32 RELOJES / -4 CRT',
    motif: 'meds',
  },
  {
    id: 2,
    dateBox: 'NOV 14 2008',
    headlineFirstWord: 'WATER',
    headlineRest: 'FROM URINE!?',
    subheadEs: 'SISTEMA DE HIGIENE WHC EN LA ISS (STS-126)',
    subheadEn: 'ISS WASTE AND HYGIENE COMPARTMENT (STS-126)',
    col1Es:
      'Entregado en la misión STS-126 para los módulos Destiny y Tranquility, el Compartimento de Residuos e Higiene (WHC) integró el sistema ruso ACУ en un único bastidor estadounidense para soportar a 6 tripulantes.',
    col1En:
      'Delivered on STS-126 for Destiny and Tranquility, the Waste & Hygiene Compartment (WHC) integrated the Russian ACY unit inside a single US equipment rack supporting 6 crew.',
    col2Es:
      'Conectado directamente al sistema ECLSS bajo luz clínica fría de 6,300 K, recupera agua potable a partir de la orina y transpiración humana (parametrizada en astronauta estándar de 82 kg según BVAD: 1.75 kg orina y 2.53 kg vapor/día).',
    col2En:
      'Linked directly to ECLSS under 6,300 K SSLA clinical lighting, it reclaims potable water from urine and cabin condensate (modeled for NASA BVAD 82 kg crew: 1.75 kg urine & 2.53 kg vapor/day).',
    circleNoteEs: 'CÍRCULO ROJO: Embudo metálico de succión al vacío y válvula roja de agua.',
    circleNoteEn: 'RED CIRCLE: Metallic vacuum suction funnel & crimson water shut-off valve.',
    tagLeft: 'BASTIDOR WHC · 6 TRIPULANTES',
    tagRight: 'ECLSS 82 KG BVAD',
    motif: 'whc',
  },
  {
    id: 3,
    dateBox: 'APRIL 2018',
    headlineFirstWord: 'PURPLE',
    headlineRest: 'SPACE FARM!?',
    subheadEs: 'CULTIVOS ORBITALES VEGGIE & ADVANCED PLANT HABITAT (APH)',
    subheadEn: 'VEGGIE & ADVANCED PLANT HABITAT (APH) BOTANY',
    col1Es:
      'Las cámaras orbitales Veggie (6 plantas en almohadillas de arcilla porosa) y el bastidor quad-locker APH (1,700 cm² y 180 sensores) cultivan trigo y tomates enanos (VEG-05) para avanzar hacia granjas BLSS de 25 m²/persona.',
    col1En:
      'Orbital chambers Veggie (6 clay-pillow plants) and quad-locker APH (1,700 cm², 180 sensors) grow dwarf wheat and tomatoes (VEG-05), paving the way for 25 m²/person BLSS farms.',
    col2Es:
      'Su banco lumínico GLA proyecta hasta 1,000 µmol·m⁻²·s⁻¹ combinando LEDs rojos (630 nm) y azules (450 nm) que las plantas absorben mientras reflejan el verde, tiñendo el módulo con un intenso resplandor magenta y púrpura.',
    col2En:
      'The GLA array delivers up to 1,000 µmol·m⁻²·s⁻¹ using 630 nm red and 450 nm blue LEDs absorbed by leaves, bathing the cabin in dramatic magenta and purple glow.',
    circleNoteEs: 'CÍRCULO ROJO: Almohadillas de arcilla porosa con mechas grises y brotes VEG-05.',
    circleNoteEn: 'RED CIRCLE: Porous clay root pillows with gray wicks and VEG-05 sprouts.',
    tagLeft: '630nm ROJO + 450nm AZUL',
    tagRight: '1,700 cm² · 180 SENSORES',
    motif: 'aph',
  },
  {
    id: 4,
    dateBox: 'OCT 2020',
    headlineFirstWord: 'SPACE',
    headlineRest: 'UNDERWATER!?',
    subheadEs: 'LABORATORIO DE FLOTABILIDAD NEUTRA (NBL NASA · 6.2M GAL)',
    subheadEn: 'NASA NEUTRAL BUOYANCY LABORATORY (NBL · 6.2M GAL)',
    col1Es:
      'Frente a los 108 minutos del histórico vuelo de Yuri Gagarin, las expediciones en la ISS superan los 6 meses continuos. Preparar cada caminata espacial (EVA) requiere horas de entrenamiento bajo flotabilidad neutra en Houston.',
    col1En:
      'Compared to Yuri Gagarin’s 108-minute orbital flight, modern ISS expeditions last 6+ months. Rehearsing every EVA requires rigorous neutral-buoyancy training in Houston.',
    col2Es:
      'La piscina del NBL mide 202 pies (61.5 m) de largo, 102 pies (31.1 m) de ancho y 40 pies (12.2 m) de profundidad, albergando 6.2 millones de galones de agua azul marino con maquetas de la estación y líneas umbilicales de seguridad.',
    col2En:
      'NASA’s NBL indoor pool spans 202 ft (61.5 m) long, 102 ft (31.1 m) wide and 40 ft (12.2 m) deep—holding 6.2 million gallons with submerged station mockups and red safety tethers.',
    circleNoteEs: 'CÍRCULO ROJO: Astronauta en traje blanco EVA sumergido junto a maqueta modular.',
    circleNoteEn: 'RED CIRCLE: Astronaut in white EVA suit tethered beside submerged station mockup.',
    tagLeft: '61.5m x 31.1m x 12.2m',
    tagRight: '6.2 MILLONES GALONES',
    motif: 'nbl',
  },
  {
    id: 5,
    dateBox: 'NOV 16 2022',
    headlineFirstWord: 'ROCKET',
    headlineRest: 'IN PIECES!?',
    subheadEs: 'DESARME ORBITAL: TRANSBORDADOR STS & SLS ARTEMIS I',
    subheadEn: 'ORBITAL STAGING: SPACE SHUTTLE STS & ARTEMIS I SLS',
    col1Es:
      'Tanto el Transbordador Espacial como el SLS desprenden sus 2 aceleradores sólidos (SRB) alrededor de los 2 minutos de vuelo (T+124 s a 46 km en STS; T+120 s en Artemis I) y eyectan el Tanque Externo o etapa central cerca de T+08:03–08:30.',
    col1En:
      'Both Space Shuttle and SLS jettison twin Solid Rocket Boosters near 2 minutes (T+124 s at 46 km on STS; T+120 s on Artemis I) and separate the External Tank / Core Stage at ~8 min.',
    col2Es:
      'En Artemis I, la cápsula Orion desplegó sus paneles a T+18:09, ejecutó TLI a T+01:29:27 rumbo a la Luna, recorrió 1.4 millones de millas en vuelo sin precedentes y reingresó a la atmósfera a Mach 32 (24,581 mph).',
    col2En:
      'On Artemis I, Orion unfurled solar wings at T+18:09, executed TLI at T+01:29:27, logged 1.4 million miles around the Moon and reentered Earth’s atmosphere at Mach 32 (24,581 mph).',
    circleNoteEs: 'CÍRCULO ROJO: Motores de separación de los 2 SRB en el plano ortográfico azul.',
    circleNoteEn: 'RED CIRCLE: Twin SRB separation motors on the navy orthographic blueprint.',
    tagLeft: 'SRB 46 KM · ET +18s',
    tagRight: 'ORION MACH 32 (24,581 MPH)',
    motif: 'staging',
  },
  {
    id: 6,
    dateBox: 'MARS & MOON',
    headlineFirstWord: 'SOLAR',
    headlineRest: 'BLACKOUT!?',
    subheadEs: 'TORMENTAS GLOBALES DE POLVO Y REACTOR FSP DE 40 kWe',
    subheadEn: 'GLOBAL DUST STORMS & 40 kWe FISSION SURFACE POWER',
    col1Es:
      'Durante la noche lunar de 354 horas o las tormentas globales marcianas (Opportunity e InSight, 60–90 soles), la profundidad óptica Tau eleva la atenuación hasta bloquear el 99.9998% de la radiación solar disponible.',
    col1En:
      'Across a 354-hour lunar night or Mars global dust storms (Opportunity & InSight, 60–90 sols), atmospheric optical depth blocks up to 99.9998% of incoming solar flux.',
    col2Es:
      'Por ello la arquitectura NASA ESDMD-001 proyecta reactores nucleares de fisión FSP de 40 kWe (5,800–7,334 kg) instalados a 1 km del hábitat, con alas radiadoras negras desplegables de 133.4 m² en el polo lunar o 216.2 m² en el ecuador.',
    col2En:
      'To survive, NASA ESDMD-001 specifies 40 kWe Fission Surface Power reactors (5,800–7,334 kg) 1 km from the habitat with deployable 133.4 m² (lunar pole) to 216.2 m² (equator) black radiators.',
    circleNoteEs: 'CÍRCULO ROJO: Alas radiadoras desplegables de rechazo térmico del reactor FSP.',
    circleNoteEn: 'RED CIRCLE: Deployable black thermal rejection radiator wings on 40 kWe FSP.',
    tagLeft: '99.9998% BLOQUEO SOLAR',
    tagRight: '40 kWe · 133.4–216.2 m²',
    motif: 'fsp',
  },
];

export interface MissionEndingSummary {
  id: EndingId;
  titleEs: string;
  titleEn: string;
  missionsBase: string;
  toneEs: string;
  toneEn: string;
  summaryEs: string;
  summaryEn: string;
  accentHex: string;
}

export const MISSION_ENDINGS: Record<EndingId, MissionEndingSummary> = {
  ending_1_duct_tape: {
    id: 'ending_1_duct_tape',
    titleEs: 'FINAL 1: "EL MILAGRO DE CINTA ADHESIVA" (EVACUACIÓN ORBITAL)',
    titleEn: 'ENDING 1: "THE DUCT TAPE MIRACLE" (EMERGENCY EVACUATION)',
    missionsBase: 'Apollo 13 (1970) + Skylab 1 (1973)',
    toneEs: 'Tenso, caluroso, caótico, contrarreloj',
    toneEn: 'Tense, hot, chaotic, race against the clock',
    summaryEs:
      'La tripulación abandona la base en la cápsula de escape tras agotar el ciclo abierto de cartuchos LiOH y alcanzar carga térmica límite (163 W/m²), salvando sus vidas con adaptadores improvisados.',
    summaryEn:
      'The crew evacuates into the ascent capsule after exhausting open-loop LiOH canisters and hitting extreme 163 W/m² thermal loads, surviving via improvised hardware.',
    accentHex: '#f59e0b',
  },
  ending_2_silent_bunker: {
    id: 'ending_2_silent_bunker',
    titleEs: 'FINAL 2: "EL BÚNKER SILENCIOSO" (AISLAMIENTO BAJO TIERRA)',
    titleEn: 'ENDING 2: "THE SILENT BUNKER" (SUBSURFACE ISOLATION)',
    missionsBase: 'Opportunity (2018) + Biosphere 2 (1993) + Tormenta 1972',
    toneEs: 'Silencioso, frío, melancólico, claustrofóbico',
    toneEn: 'Quiet, cold, stark, confined',
    summaryEs:
      'La tripulación sobrevive refugiada junto a los tanques de reserva racionando comida y agua potable mientras las baterías, el invernadero (<19% O₂) o el rover sin blindaje quedan fuera de servicio.',
    summaryEn:
      'Astronauts survive confined beside reserve water tanks rationing rations as unshielded surface arrays, greenhouse O₂ (<19%) or the rover go offline.',
    accentHex: '#94a3b8',
  },
  ending_3_interplanetary_cradle: {
    id: 'ending_3_interplanetary_cradle',
    titleEs: 'FINAL 3: "CUNA INTERPLANETARIA" (COLONIA PERMANENTE)',
    titleEn: 'ENDING 3: "INTERPLANETARY CRADLE" (PERMANENT COLONY)',
    missionsBase: 'ISS + SPE + BIOS-3 + Kilopower-KRUSTY',
    toneEs: 'Luminoso, triunfal, colaborativo, esperanzador',
    toneEn: 'Luminous, triumphant, collaborative, permanent presence',
    summaryEs:
      'El reactor FSP KRUSTY (40 kWe), la electrólisis SPE, los recicladores WPA/CDRA, el invernadero BIOS-3/APH y los 2 metros de regolito (300 g/cm² · 400 t) protegen la base mientras aterriza una segunda nave con nuevos colonos.',
    summaryEn:
      '40 kWe KRUSTY fission power, SPE electrolysis, WPA/CDRA recovery, BIOS-3/APH crops and 2 m regolith (300 g/cm² · 400 t) protect a thriving habitat as a second lander arrives.',
    accentHex: '#22c55e',
  },
};
