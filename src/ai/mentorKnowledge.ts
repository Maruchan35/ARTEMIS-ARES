// =============================================================================
// KATHERINE · Verified teaching cards
// Numbers come from src/data/nasaConstants.ts (the same data the simulation uses)
// and the history facts are well-documented NASA / spaceflight events.
// The server grounds the Gemma-4 AstroCopilot model on these cards + NASA RAG,
// and the game falls back to them when the model is offline.
// =============================================================================

import { NASA_CONSTANTS as C } from '../data/nasaConstants';
import type { Bilingual, MentorCard } from './mentorTypes';

const b = (es: string, en: string): Bilingual => ({ es, en });
const fmt = (n: number) => n.toLocaleString('en-US');

const ECL = C.ECLSS_ARCHITECTURES;
const PWR = C.POWER_AND_THERMAL;
const RAD = C.RADIATION_AND_SHIELDING;
const MED = C.MEDICAL_TWINS_STUDY;
const LAU = C.LAUNCH_STAGING_PROFILES;
const BOT = C.LIGHTING_AND_BOTANY_ISS;

const SURVIVAL_QUIZ = {
  q: b('Si todo falla al mismo tiempo, ¿qué se vuelve peligroso primero?', 'If everything fails at once, what becomes dangerous first?'),
  options: [b('Quedarse sin aire', 'Running out of air'), b('Quedarse sin comida', 'Running out of food')],
  correct: 0,
  why: b(
    'Sin aire aguantas minutos, sin agua unos días y sin comida varias semanas. Por eso el orden es aire → agua → comida.',
    'Without air you last minutes, without water a few days and without food several weeks. So the order is air → water → food.'
  ),
};

const SHIELD_QUIZ = {
  q: b('¿Qué te protege mejor de una tormenta solar?', 'What protects you best from a solar storm?'),
  options: [
    b('Una capa gruesa de material, como regolito o agua', 'A thick layer of material, like regolith or water'),
    b('Un traje más ligero para correr más rápido', 'A lighter suit so you can run faster'),
  ],
  correct: 0,
  why: b(
    'Las partículas del Sol chocan con el material y pierden energía: más gramos por cm² entre tú y la tormenta = menos dosis.',
    'Solar particles collide with matter and lose energy: more grams per cm² between you and the storm = less dose.'
  ),
};

const POWER_SIMPLE = b(
  'Los paneles solares son como un ventilador que se apaga cuando oscurece; el reactor es como estar conectado a la pared de tu casa.',
  'Solar panels are like a fan that switches off when it gets dark; the reactor is like being plugged into the wall at home.'
);

export const MENTOR_CARDS: Record<string, MentorCard> = {
  // ---------------------------------------------------------------- DECISIONS
  eclss_closed_regen: {
    id: 'eclss_closed_regen',
    tone: 'good',
    askCheck: true,
    say: b(
      `Elegiste ECLSS regenerativo de ciclo cerrado: el agua y el aire se reciclan. La unidad pesa unos ${ECL.REGEN_UNIT_MASS_KG} kg, pero solo gasta ~${ECL.REGEN_CONSUMABLES_KG_PER_PERSON_DAY} kg por persona al día, contra ${ECL.OPEN_LOOP_KG_PER_PERSON_DAY} kg del ciclo abierto.`,
      `You chose a closed-loop regenerative ECLSS: water and air get recycled. The unit weighs about ${ECL.REGEN_UNIT_MASS_KG} kg, but only uses ~${ECL.REGEN_CONSUMABLES_KG_PER_PERSON_DAY} kg per person per day, versus ${ECL.OPEN_LOOP_KG_PER_PERSON_DAY} kg for open loop.`
    ),
    fact: b(
      'En 2023 la ISS logró recuperar el 98% de su agua —incluida la orina y el sudor— con su Sistema de Recuperación de Agua.',
      'In 2023 the ISS reached 98% water recovery —including urine and sweat— with its Water Recovery System.'
    ),
    source: 'NASA ISS ECLSS (2023) · BVAD NASA/TP-2015-218570',
    simple: b(
      'Es como llevar una botella con filtro en lugar de cargar cien botellas: al inicio pesa más, pero en un viaje largo ganas por mucho.',
      'It is like carrying one filter bottle instead of a hundred bottles: heavier at first, but on a long trip you win by a lot.'
    ),
    quiz: {
      q: b('Si la misión dura muchos meses, ¿qué sistema termina pesando menos en total?', 'If the mission lasts many months, which system ends up lighter overall?'),
      options: [b('Ciclo cerrado (reciclar)', 'Closed loop (recycling)'), b('Ciclo abierto (cartuchos desechables)', 'Open loop (throw-away canisters)')],
      correct: 0,
      why: b(
        `Con una sola unidad, el reciclaje "se paga" a partir de ~${ECL.BREAKEVEN_DAYS_BY_REDUNDANCY[1]} días: después, cada día ahorra masa.`,
        `With a single unit, recycling "pays for itself" after ~${ECL.BREAKEVEN_DAYS_BY_REDUNDANCY[1]} days: after that, every day saves mass.`
      ),
    },
    ragQuery: 'ISS ECLSS closed loop water recovery regenerative CDRA WPA BVAD consumables open loop LiOH breakeven',
  },
  eclss_open_lioh: {
    id: 'eclss_open_lioh',
    tone: 'risky',
    askCheck: true,
    say: b(
      `Elegiste ciclo abierto con LiOH: cartuchos que atrapan el CO₂ y luego se tiran. Es simple, pero consume ~${ECL.OPEN_LOOP_KG_PER_PERSON_DAY} kg por persona al día: en un viaje largo, se acaba la carga.`,
      `You chose open-loop LiOH: canisters that trap CO₂ and then get thrown away. Simple, but it burns ~${ECL.OPEN_LOOP_KG_PER_PERSON_DAY} kg per person per day: on a long trip, you run out.`
    ),
    fact: b(
      'Las naves Apollo usaban cartuchos de hidróxido de litio (LiOH) que no se podían reutilizar. La ISS usa el CDRA, que limpia sus filtros calentándolos y mandando el CO₂ al vacío.',
      'Apollo spacecraft used lithium hydroxide (LiOH) canisters that could not be reused. The ISS uses the CDRA, which cleans its filters by heating them and venting the CO₂ to vacuum.'
    ),
    source: 'NASA Apollo ECS · ISS CDRA',
    simple: b(
      'Es como usar pañuelos desechables en vez de uno de tela: son prácticos, pero para dos años necesitarías una montaña de ellos.',
      'It is like using paper tissues instead of a cloth handkerchief: handy, but for two years you would need a mountain of them.'
    ),
    quiz: {
      q: b('¿Por qué el LiOH se vuelve un problema en misiones largas?', 'Why does LiOH become a problem on long missions?'),
      options: [b('Se gasta y hay que cargar más y más masa', 'It gets used up, so you must carry more and more mass'), b('Produce demasiado oxígeno', 'It produces too much oxygen')],
      correct: 0,
      why: b(
        'Cada cartucho atrapa una cantidad fija de CO₂ y ya no sirve: más días = más cartuchos = más peso al despegar.',
        'Each canister traps a fixed amount of CO₂ and is then spent: more days = more canisters = more launch mass.'
      ),
    },
    ragQuery: 'LiOH lithium hydroxide canister CO2 scrubber open loop Apollo consumables mass ECLSS',
  },
  power_fsp_40kw: {
    id: 'power_fsp_40kw',
    tone: 'good',
    askCheck: true,
    say: b(
      `Elegiste fisión (FSP ${PWR.FSP_40_NET_KWE} kWe): funciona igual de día que de noche. Pesa hasta ~${fmt(PWR.FSP_40_MASS_KG)} kg y necesita radiadores grandes: ${PWR.RADIATOR_AREA_MOON_POLE_M2} m² en el polo lunar.`,
      `You chose fission (FSP ${PWR.FSP_40_NET_KWE} kWe): it works the same day or night. It weighs up to ~${fmt(PWR.FSP_40_MASS_KG)} kg and needs big radiators: ${PWR.RADIATOR_AREA_MOON_POLE_M2} m² at the lunar pole.`
    ),
    fact: b(
      'En 2018 la NASA y el Departamento de Energía probaron el reactor KRUSTY en Nevada: funcionó a plena potencia 28 horas seguidas.',
      'In 2018 NASA and the Department of Energy tested the KRUSTY reactor in Nevada: it ran at full power for 28 hours straight.'
    ),
    source: 'NASA Kilopower / KRUSTY (2018)',
    simple: POWER_SIMPLE,
    quiz: {
      q: b('La noche lunar dura unas 354 horas (casi 15 días). ¿Qué fuente sigue dando energía todo ese tiempo?', 'The lunar night lasts about 354 hours (almost 15 days). Which source keeps producing power the whole time?'),
      options: [b('El reactor de fisión', 'The fission reactor'), b('Los paneles solares', 'The solar panels')],
      correct: 0,
      why: b('El reactor no necesita luz del Sol; los paneles casi no producen nada en la oscuridad.', 'The reactor does not need sunlight; panels produce almost nothing in the dark.'),
    },
    ragQuery: 'Fission Surface Power 40 kWe Kilopower KRUSTY Stirling radiator lunar night power',
  },
  power_solar_only: {
    id: 'power_solar_only',
    tone: 'risky',
    askCheck: true,
    say: b(
      `Elegiste solo energía solar (máx. ${PWR.SOLAR_MAX_KWE} kWe). Es ligera y sencilla, pero en la noche lunar de ~354 horas o en una tormenta de polvo dependes de baterías.`,
      `You chose solar only (max ${PWR.SOLAR_MAX_KWE} kWe). Light and simple, but during the ~354-hour lunar night or a dust storm you depend on batteries.`
    ),
    fact: b(
      'El rover Opportunity funcionó con energía solar en Marte casi 15 años, hasta que una tormenta de polvo global en 2018 tapó el Sol y ya no volvió a despertar.',
      'The Opportunity rover ran on solar power on Mars for almost 15 years, until a global dust storm in 2018 blocked the Sun and it never woke up again.'
    ),
    source: 'NASA JPL Mars Exploration Rovers (2004–2019)',
    simple: b(
      'Es como cargar tu celular solo con luz del día: si oscurece dos semanas seguidas, te quedas sin batería.',
      'It is like charging your phone only with daylight: if it gets dark for two weeks straight, you run out of battery.'
    ),
    quiz: {
      q: b('¿Qué les pasa a los paneles en la noche lunar o en una tormenta de polvo?', 'What happens to the panels during the lunar night or a dust storm?'),
      options: [b('Producen muy poca o nada de energía', 'They produce little or no power'), b('Producen todavía más energía', 'They produce even more power')],
      correct: 0,
      why: b('Sin luz no hay electricidad solar: por eso las bases solares necesitan baterías enormes o una fuente extra.', 'No light, no solar electricity: that is why solar bases need huge batteries or an extra source.'),
    },
    ragQuery: 'solar power lunar night dust storm Opportunity rover battery energy storage',
  },
  rover_kilopower_rover: {
    id: 'rover_kilopower_rover',
    tone: 'good',
    askCheck: true,
    say: b(
      `Elegiste el rover con fisión de ${PWR.FSP_10_KWE} kWe: unas ${PWR.ROVER_HOURS_FSP_10KW} h de autonomía para mover ${fmt(PWR.ROVER_MASS_KG)} kg (conducir pide ~${PWR.ROVER_DRIVE_POWER_KW} kWe).`,
      `You chose the ${PWR.FSP_10_KWE} kWe fission rover: about ${PWR.ROVER_HOURS_FSP_10KW} h of range to move ${fmt(PWR.ROVER_MASS_KG)} kg (driving needs ~${PWR.ROVER_DRIVE_POWER_KW} kWe).`
    ),
    fact: b(
      'En Apollo 15, 16 y 17 los astronautas manejaron el Rover Lunar con baterías no recargables, y tenían una regla: nunca alejarse más de lo que pudieran regresar caminando si el rover fallaba.',
      'On Apollo 15, 16 and 17 astronauts drove the Lunar Roving Vehicle on non-rechargeable batteries, with one rule: never drive farther than they could walk back if the rover failed.'
    ),
    source: 'NASA Apollo Lunar Surface Journal (LRV)',
    simple: b(
      'Es como un coche con el tanque lleno: puedes ir lejos y volver. Con poca energía, cada kilómetro de ida es uno que debes poder regresar.',
      'It is like a car with a full tank: you can go far and come back. With little energy, every kilometre out is one you must be able to return.'
    ),
    quiz: {
      q: b('¿Por qué los astronautas de Apollo no se alejaban demasiado con el rover?', 'Why did Apollo astronauts not drive too far with the rover?'),
      options: [b('Debían poder volver caminando si el rover fallaba', 'They had to be able to walk back if it failed'), b('El rover no podía dar vuelta', 'The rover could not turn')],
      correct: 0,
      why: b('Es la regla de "caminar de regreso": el oxígeno del traje limitaba cuánto podían caminar.', 'It is the "walkback" rule: suit oxygen limited how far they could walk.'),
    },
    ragQuery: 'Lunar Roving Vehicle Apollo walkback limit pressurized rover power kWe range',
  },
  rover_rtg_solar_rover: {
    id: 'rover_rtg_solar_rover',
    tone: 'risky',
    askCheck: true,
    say: b(
      `Elegiste el rover Solar/RTG. Un RTG da ~${PWR.RTG_UNIT_KWE} kWe; ni juntando varios (~${PWR.RTG_MAX_PRACTICAL_KWE} kWe) llegas a los ~${PWR.ROVER_DRIVE_POWER_KW} kWe que pide mover ${fmt(PWR.ROVER_MASS_KG)} kg: solo ~${PWR.ROVER_HOURS_RTG_3400W} h de manejo.`,
      `You chose the Solar/RTG rover. One RTG gives ~${PWR.RTG_UNIT_KWE} kWe; even stacking several (~${PWR.RTG_MAX_PRACTICAL_KWE} kWe) you do not reach the ~${PWR.ROVER_DRIVE_POWER_KW} kWe needed to move ${fmt(PWR.ROVER_MASS_KG)} kg: only ~${PWR.ROVER_HOURS_RTG_3400W} h of driving.`
    ),
    fact: b(
      'Curiosity y Perseverance usan un RTG que da unos 110 watts: perfecto para hacer ciencia lenta durante años, pero no para mover un camión de 6 toneladas.',
      'Curiosity and Perseverance use an RTG that gives about 110 watts: perfect for slow science over many years, not for moving a 6-ton truck.'
    ),
    source: 'NASA MMRTG · Mars Science Laboratory / Mars 2020',
    simple: b(
      'Un RTG es como una vela que dura años: constante pero débil. Para mover un camión necesitas una fogata.',
      'An RTG is like a candle that lasts for years: steady but weak. To move a truck you need a bonfire.'
    ),
    quiz: {
      q: b('¿Por qué un RTG no basta para el rover de 6 toneladas?', 'Why is an RTG not enough for the 6-ton rover?'),
      options: [b('Da muy poca potencia (cientos de watts)', 'It gives very little power (hundreds of watts)'), b('Se apaga de noche', 'It switches off at night')],
      correct: 0,
      why: b('El RTG no depende del Sol —funciona de noche—, su problema es que es débil.', 'The RTG does not depend on the Sun —it works at night—; its problem is that it is weak.'),
    },
    ragQuery: 'RTG MMRTG radioisotope power watts rover Curiosity Perseverance power limit',
  },
  crisis_water_priority: {
    id: 'crisis_water_priority',
    tone: 'good',
    askCheck: true,
    say: b(
      'Priorizaste el agua y el aire sobre la comida. Así se ordena la supervivencia: sin aire aguantas minutos, sin agua días, sin comida semanas.',
      'You prioritized water and air over food. That is the survival order: without air you last minutes, without water days, without food weeks.'
    ),
    fact: b(
      'En la ISS el sistema recicla la orina y el sudor en agua potable; los astronautas bromean que "el café de ayer se convierte en el café de mañana".',
      'On the ISS the system recycles urine and sweat into drinking water; astronauts joke that "yesterday\'s coffee becomes tomorrow\'s coffee".'
    ),
    source: 'NASA ISS Water Recovery System',
    simple: b(
      'Puedes saltarte la cena un día, pero no puedes dejar de respirar ni un minuto, ni pasar tres días sin agua.',
      'You can skip dinner for a day, but you cannot stop breathing for a minute, or go three days without water.'
    ),
    quiz: SURVIVAL_QUIZ,
    ragQuery: 'water recovery priority survival crew dehydration ECLSS consumables potable water',
  },
  crisis_food_priority: {
    id: 'crisis_food_priority',
    tone: 'risky',
    askCheck: true,
    say: b(
      `Priorizaste el horno y la comida sobre el agua, y perdimos agua potable. Perder cerca del ${C.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% del agua del cuerpo puede ser mortal; la comida podía esperar.`,
      `You prioritized the oven and food over water, and we lost drinking water. Losing about ${C.HABITAT_ATMOSPHERE.LETHAL_DEHYDRATION_BODY_PERCENT}% of your body water can be deadly; food could wait.`
    ),
    fact: b(
      'En Apollo 13 la tripulación tuvo que racionar el agua a unos 0.2 litros por persona al día; terminaron deshidratados y Fred Haise enfermó de una infección.',
      'On Apollo 13 the crew rationed water to about 0.2 litres per person per day; they ended up dehydrated and Fred Haise got an infection.'
    ),
    source: 'NASA Apollo 13 Mission Report (1970)',
    simple: b(
      'Es como elegir entre cargar tu consola o llenar tu botella antes de una caminata en el desierto: una es divertida, la otra te mantiene vivo.',
      'It is like choosing between charging your game console or filling your bottle before a desert hike: one is fun, the other keeps you alive.'
    ),
    quiz: SURVIVAL_QUIZ,
    ragQuery: 'Apollo 13 water rationing dehydration crew survival priority ECLSS',
  },
  act1_duct_tape_patch: {
    id: 'act1_duct_tape_patch',
    tone: 'good',
    askCheck: true,
    say: b(
      'Arreglaste el sobrecalentamiento con un parche improvisado. A veces la mejor ingeniería es la que funciona con lo que tienes a la mano.',
      'You fixed the overheating with an improvised patch. Sometimes the best engineering is whatever works with what you have.'
    ),
    fact: b(
      'En 1973 Skylab perdió su escudo térmico al despegar y por dentro superó los 50 °C. La tripulación de Pete Conrad sacó una sombrilla plegable por una escotilla pequeña y salvó la estación.',
      'In 1973 Skylab lost its heat shield during launch and the inside went above 50 °C. Pete Conrad\'s crew pushed a folding parasol out through a small airlock and saved the station.'
    ),
    source: 'NASA Skylab 2 (SL-2, 1973)',
    simple: b(
      'Es como poner un parasol en el parabrisas del coche en verano: bloqueas el Sol antes de que caliente el interior.',
      'It is like putting a sunshade on a car windshield in summer: you block the Sun before it heats the inside.'
    ),
    quiz: {
      q: b('¿Qué hacía la sombrilla de Skylab?', 'What did the Skylab parasol do?'),
      options: [b('Bloqueaba la luz del Sol para que la estación no se calentara', 'Blocked sunlight so the station would not overheat'), b('Generaba oxígeno para la tripulación', 'Generated oxygen for the crew')],
      correct: 0,
      why: b('La luz del Sol calentaba el casco sin protección; la sombra bajó la temperatura a niveles habitables.', 'Sunlight was heating the unprotected hull; the shade brought the temperature back to livable levels.'),
    },
    ragQuery: 'Skylab parasol thermal shield overheating repair Conrad Apollo 13 duct tape adapter',
  },
  act1_cdra_reroute: {
    id: 'act1_cdra_reroute',
    tone: 'neutral',
    askCheck: true,
    say: b(
      'Desviaste el circuito térmico: mueves el calor hacia donde se puede expulsar. Es la solución "de manual", aunque gasta energía.',
      'You rerouted the thermal loop: you move heat to where it can be rejected. It is the "by the book" fix, although it costs power.'
    ),
    fact: b(
      'La ISS no puede enfriarse con aire porque afuera hay vacío: usa circuitos de amoníaco que llevan el calor hasta radiadores gigantes que lo lanzan al espacio como luz infrarroja.',
      'The ISS cannot cool itself with air because outside is vacuum: ammonia loops carry heat to giant radiators that shed it into space as infrared light.'
    ),
    source: 'NASA ISS Active Thermal Control System',
    simple: b(
      'Funciona como el radiador de un coche: un líquido recoge el calor del motor y lo lleva a un panel donde se escapa.',
      'It works like a car radiator: a liquid picks up heat from the engine and carries it to a panel where it escapes.'
    ),
    quiz: {
      q: b('¿Por qué en el espacio el calor se expulsa con radiadores y no con ventiladores?', 'Why is heat rejected with radiators in space instead of fans?'),
      options: [b('Porque en el vacío no hay aire que se lleve el calor', 'Because in vacuum there is no air to carry heat away'), b('Porque los ventiladores hacen mucho ruido', 'Because fans are too noisy')],
      correct: 0,
      why: b('Sin aire no hay convección: la única salida del calor es irradiarlo como luz infrarroja.', 'No air means no convection: the only way out for heat is radiating it as infrared light.'),
    },
    ragQuery: 'thermal control radiator heat rejection vacuum ammonia loop ISS habitat heat W/m2',
  },
  act2_krusty_spe: {
    id: 'act2_krusty_spe',
    tone: 'good',
    askCheck: true,
    say: b(
      'Con el reactor de fisión la base sigue viva durante las ~354 horas de oscuridad lunar, y sobra energía para el electrolizador que convierte agua en oxígeno.',
      'With the fission reactor the base stays alive through the ~354 hours of lunar darkness, with power to spare for the electrolyzer that turns water into oxygen.'
    ),
    fact: b(
      'La NASA quiere llevar a la Luna un reactor de 40 kWe: según la agencia, eso alcanza para darle electricidad a unas 30 casas durante 10 años.',
      'NASA wants to send a 40 kWe reactor to the Moon: according to the agency, that is enough to power about 30 homes for 10 years.'
    ),
    source: 'NASA Fission Surface Power (2022)',
    simple: POWER_SIMPLE,
    quiz: {
      q: b('En el electrolizador, ¿de dónde sale el oxígeno?', 'In the electrolyzer, where does the oxygen come from?'),
      options: [b('Del agua: 2H₂O → 2H₂ + O₂', 'From water: 2H₂O → 2H₂ + O₂'), b('De las rocas calientes', 'From hot rocks')],
      correct: 0,
      why: b('La electricidad rompe la molécula de agua en hidrógeno y oxígeno. ¡Por eso la energía es vida!', 'Electricity splits the water molecule into hydrogen and oxygen. That is why power is life!'),
    },
    ragQuery: 'Fission Surface Power 40 kWe lunar night 354 hours electrolysis oxygen generation',
  },
  act2_solar_ration: {
    id: 'act2_solar_ration',
    tone: 'risky',
    askCheck: true,
    say: b(
      'Sin reactor, pasamos la noche racionando baterías. Sobrevivimos, pero con luces bajas y sistemas apagados.',
      'Without a reactor we spend the night rationing batteries. We survive, but with dim lights and systems switched off.'
    ),
    fact: b(
      'El módulo indio Vikram (Chandrayaan-3, 2023) funcionó con energía solar durante un día lunar completo —unos 14 días terrestres— y no volvió a despertar después de la noche lunar.',
      'India\'s Vikram lander (Chandrayaan-3, 2023) ran on solar power for one full lunar day —about 14 Earth days— and did not wake up after the lunar night.'
    ),
    source: 'ISRO Chandrayaan-3 (2023)',
    simple: b(
      'Es como pasar dos semanas sin luz con una sola power bank: tienes que elegir qué apagar.',
      'It is like spending two weeks without electricity with one power bank: you must choose what to switch off.'
    ),
    quiz: {
      q: b('Si solo tienes baterías durante la noche lunar, ¿qué conviene hacer?', 'If you only have batteries during the lunar night, what should you do?'),
      options: [b('Apagar lo que no sea vital y priorizar el soporte vital', 'Switch off non-vital loads and prioritize life support'), b('Usar todo normal y esperar a que amanezca', 'Use everything as usual and wait for sunrise')],
      correct: 0,
      why: b('Cada watt cuenta: primero aire, agua y calor; lo demás puede esperar al amanecer.', 'Every watt counts: air, water and heat first; the rest can wait for sunrise.'),
    },
    ragQuery: 'lunar night solar battery rationing power budget survive darkness',
  },
  act3_isolate_bios3: {
    id: 'act3_isolate_bios3',
    tone: 'good',
    askCheck: true,
    say: b(
      `Aislaste el compostaje. Los microbios del suelo respiran oxígeno (${BOT.SOIL_MICROBE_O2_DRAIN_MIN_L_KG_MIN}–${BOT.SOIL_MICROBE_O2_DRAIN_MAX_L_KG_MIN} L por kg por minuto) y en un hábitat cerrado le roban el aire a la tripulación.`,
      `You isolated the compost. Soil microbes breathe oxygen (${BOT.SOIL_MICROBE_O2_DRAIN_MIN_L_KG_MIN}–${BOT.SOIL_MICROBE_O2_DRAIN_MAX_L_KG_MIN} L per kg per minute) and in a closed habitat they steal the crew's air.`
    ),
    fact: b(
      'En Biosphere 2 (Arizona, 1991–1993) el oxígeno bajó de 20.9% a cerca de 14.5%: los microbios del suelo rico en compost lo consumían. Tuvieron que inyectar oxígeno desde afuera.',
      'In Biosphere 2 (Arizona, 1991–1993) oxygen fell from 20.9% to about 14.5%: microbes in the compost-rich soil were consuming it. Oxygen had to be pumped in from outside.'
    ),
    source: 'Biosphere 2 (1991–1993)',
    simple: b(
      'El compost es como una multitud invisible respirando en tu cuarto: si cierras la puerta, poco a poco se acaba el aire.',
      'Compost is like an invisible crowd breathing in your room: with the door shut, the air slowly runs out.'
    ),
    quiz: {
      q: b('¿Por qué bajó el oxígeno en Biosphere 2?', 'Why did oxygen drop in Biosphere 2?'),
      options: [b('Los microbios del suelo consumían oxígeno', 'Soil microbes were consuming oxygen'), b('Se escapaba por las ventanas', 'It leaked out through the windows')],
      correct: 0,
      why: b('Las plantas producen O₂, pero un suelo muy rico en materia orgánica tiene billones de microbios que lo respiran.', 'Plants make O₂, but very rich soil hosts trillions of microbes that breathe it.'),
    },
    ragQuery: 'Biosphere 2 oxygen decline soil microbes compost BIOS-3 closed ecological life support',
  },
  act3_vent_compost: {
    id: 'act3_vent_compost',
    tone: 'risky',
    askCheck: true,
    say: b(
      'Ventilaste el compost hacia afuera: quitas el problema de golpe, pero también tiras gases y nutrientes que el invernadero podía reciclar.',
      'You vented the compost outside: the problem disappears at once, but you also dump gases and nutrients the greenhouse could have recycled.'
    ),
    fact: b(
      `En BIOS-3 (Krasnoyarsk, Siberia) tres personas vivieron ${BOT.BIOS3_TEST_DAYS} días encerradas, con plantas y algas que reciclaban su aire y agua.`,
      `In BIOS-3 (Krasnoyarsk, Siberia) three people lived sealed inside for ${BOT.BIOS3_TEST_DAYS} days, with plants and algae recycling their air and water.`
    ),
    source: 'BIOS-3 (URSS / USSR, 1972–1973)',
    ragQuery: 'BIOS-3 closed ecological system compost venting nutrient recycling greenhouse',
  },
  act4_shield_2m_rover: {
    id: 'act4_shield_2m_rover',
    tone: 'good',
    askCheck: true,
    say: b(
      `Desplegaste ${RAD.GCR_REGOLITH_THICKNESS_M} m de regolito (~${RAD.GCR_REGOLITH_COLUMN_GCM2} g/cm²). Mucho material entre tú y el Sol detiene gran parte de las partículas de una tormenta solar.`,
      `You deployed ${RAD.GCR_REGOLITH_THICKNESS_M} m of regolith (~${RAD.GCR_REGOLITH_COLUMN_GCM2} g/cm²). Lots of material between you and the Sun stops most solar storm particles.`
    ),
    fact: b(
      'En agosto de 1972, entre las misiones Apollo 16 y 17, hubo una enorme tormenta solar. Si hubiera habido astronautas caminando en la Luna, habrían recibido una dosis peligrosa. Por suerte, no había nadie.',
      'In August 1972, between Apollo 16 and 17, a huge solar storm hit. Astronauts walking on the Moon would have received a dangerous dose. Luckily, nobody was there.'
    ),
    source: 'NASA Space Radiation · August 1972 SPE',
    simple: b(
      'Es como protegerte del granizo: un paraguas delgado no basta, pero bajo un techo grueso estás a salvo.',
      'It is like hiding from a hailstorm: a thin umbrella is not enough, but under a thick roof you are safe.'
    ),
    quiz: SHIELD_QUIZ,
    ragQuery: 'solar particle event SPE regolith shielding g/cm2 August 1972 radiation dose limit',
  },
  act4_unshielded_dash: {
    id: 'act4_unshielded_dash',
    tone: 'risky',
    askCheck: true,
    say: b(
      `Elegiste correr sin blindaje. Rápido, sí, pero el límite de 30 días es ${RAD.SPE_30_DAY_LIMIT_MSV} mSv y una tormenta solar puede acercarte a él en horas.`,
      `You chose to dash without shielding. Fast, yes, but the 30-day limit is ${RAD.SPE_30_DAY_LIMIT_MSV} mSv and a solar storm can push you toward it in hours.`
    ),
    fact: b(
      'Cuando hay una tormenta solar, los astronautas de la ISS se refugian en las zonas de la estación que tienen más blindaje hasta que pasa.',
      'When a solar storm hits, ISS astronauts shelter in the most heavily shielded parts of the station until it passes.'
    ),
    source: 'NASA Space Radiation Analysis Group',
    simple: b(
      'Es como salir corriendo bajo el granizo para llegar más rápido: llegas, pero lleno de golpes.',
      'It is like running through hail to get there faster: you arrive, but covered in bruises.'
    ),
    quiz: SHIELD_QUIZ,
    ragQuery: 'solar particle event shelter radiation dose limit 30 day mSv EVA abort',
  },

  // --------------------------------------------------------------- OBJECTIVES
  obj_sleepCompleted: {
    id: 'obj_sleepCompleted',
    tone: 'neutral',
    say: b(
      'Ciclo de sueño completo. Un cerebro descansado calcula mejor que cualquier computadora… bueno, casi tan bien como yo.',
      'Sleep cycle complete. A rested brain computes better than any computer… well, almost as well as me.'
    ),
    fact: b(
      `En la ISS se programan ${MED.SLEEP_RECOMMENDED_HOURS} horas de sueño. Los astronautas duermen en sacos de dormir sujetos a la pared para no salir flotando.`,
      `The ISS schedule gives ${MED.SLEEP_RECOMMENDED_HOURS} hours of sleep. Astronauts sleep in sleeping bags strapped to the wall so they do not float away.`
    ),
    source: 'NASA Human Research Program',
    ragQuery: 'sleep 8.5 hours ISS crew circadian lighting fatigue',
  },
  obj_exerciseCalibrated: {
    id: 'obj_exerciseCalibrated',
    tone: 'neutral',
    askCheck: true,
    say: b('Signos vitales calibrados en la caminadora. Tu corazón también es un músculo que hay que entrenar.', 'Vitals calibrated on the treadmill. Your heart is a muscle that needs training too.'),
    fact: b(
      `Sin gravedad, los huesos pierden entre 1% y ${MED.BONE_LOSS_PERCENT_PER_MONTH}% de su masa cada mes. Por eso en la ISS se ejercitan unas ${MED.EXERCISE_DAILY_HOURS} horas diarias en caminadora, bicicleta y una máquina de pesas.`,
      `Without gravity, bones lose between 1% and ${MED.BONE_LOSS_PERCENT_PER_MONTH}% of their mass each month. That is why ISS crews exercise about ${MED.EXERCISE_DAILY_HOURS} hours a day on a treadmill, a bike and a weight machine.`
    ),
    source: 'NASA Twins Study / HRP',
    simple: b(
      'Tus huesos son como un equipo que solo se mantiene fuerte si entrena: sin gravedad no tienen "peso" contra el cual trabajar.',
      'Your bones are like a team that only stays strong if it trains: without gravity there is no "weight" to work against.'
    ),
    quiz: {
      q: b('¿Por qué los astronautas hacen ejercicio todos los días?', 'Why do astronauts exercise every day?'),
      options: [b('Para que sus huesos y músculos no se debiliten sin gravedad', 'So their bones and muscles do not weaken without gravity'), b('Solo para no aburrirse', 'Just to avoid getting bored')],
      correct: 0,
      why: b(`Sin ejercicio, la pantorrilla puede perder hasta ${MED.CALF_MUSCLE_LOSS_PERCENT}% de músculo en una misión larga.`, `Without exercise, the calf can lose up to ${MED.CALF_MUSCLE_LOSS_PERCENT}% of its muscle on a long mission.`),
    },
    ragQuery: 'bone loss microgravity exercise ARED treadmill 2 hours per day muscle atrophy',
  },
  obj_whcInspected: {
    id: 'obj_whcInspected',
    tone: 'neutral',
    say: b('Compartimento de higiene revisado. Sí, los héroes también revisan el baño.', 'Hygiene compartment inspected. Yes, heroes check the bathroom too.'),
    fact: b(
      'En el espacio el inodoro usa succión de aire en lugar de gravedad, y la orina se recicla en agua potable para la tripulación.',
      'In space the toilet uses air suction instead of gravity, and urine is recycled into drinking water for the crew.'
    ),
    source: 'NASA ISS WHC / UWMS',
    ragQuery: 'waste hygiene compartment toilet airflow urine processor water recovery',
  },
  obj_evaChecked: {
    id: 'obj_evaChecked',
    tone: 'neutral',
    say: b(
      `Traje EVA listo: unas ${C.EVA_SUIT.MAX_AUTONOMY_HOURS} h de autonomía y ${C.EVA_SUIT.WATER_BAG_LITERS} L de agua en la bolsa de bebida.`,
      `EVA suit ready: about ${C.EVA_SUIT.MAX_AUTONOMY_HOURS} h of autonomy and ${C.EVA_SUIT.WATER_BAG_LITERS} L of water in the drink bag.`
    ),
    fact: b(
      'La caminata espacial más larga duró 8 horas y 56 minutos: la hicieron Susan Helms y Jim Voss en 2001.',
      'The longest spacewalk lasted 8 hours and 56 minutes: Susan Helms and Jim Voss did it in 2001.'
    ),
    source: 'NASA EVA History (STS-102, 2001)',
    ragQuery: 'EVA spacewalk suit autonomy 8 hours drink bag EMU NBL training',
  },
  obj_powerRestored: {
    id: 'obj_powerRestored',
    tone: 'neutral',
    say: b('Energía restaurada en la cabina. Batería, fusible y palanca: en ese orden se hace en la vida real.', 'Cabin power restored. Battery, fuse, lever: that is the real-life order too.'),
    fact: b(
      'En 1969 un rayo golpeó dos veces al Apollo 12 durante el despegue. El controlador John Aaron recordó un interruptor poco conocido, "SCE a AUX", y Alan Bean lo activó para recuperar los datos.',
      'In 1969 lightning struck Apollo 12 twice during launch. Flight controller John Aaron remembered an obscure switch, "SCE to AUX", and Alan Bean flipped it to bring the data back.'
    ),
    source: 'NASA Apollo 12 (1969)',
    ragQuery: 'power bus restore battery fuse electrical fault Apollo 12 lightning SCE to AUX',
  },
  obj_eclssCleaned: {
    id: 'obj_eclssCleaned',
    tone: 'neutral',
    askCheck: true,
    say: b('Filtro de CO₂ cambiado. El aire vuelve a ser respirable.', 'CO₂ filter replaced. The air is breathable again.'),
    fact: b(
      'En Apollo 13 el CO₂ subía porque los filtros cuadrados del módulo de mando no cabían en los receptáculos redondos del módulo lunar. En Houston armaron un adaptador con bolsas de plástico, cartón y cinta adhesiva, y le dictaron las instrucciones a la tripulación por radio.',
      'On Apollo 13 CO₂ kept rising because the command module\'s square filters did not fit the lunar module\'s round sockets. Houston built an adapter from plastic bags, cardboard and duct tape, and read the instructions to the crew over the radio.'
    ),
    source: 'NASA Apollo 13 Mission Report (1970)',
    simple: b(
      `Tu cuerpo exhala CO₂ todo el tiempo (~${C.METABOLIC_DAILY_82KG.OUTPUT_CO2_KG} kg al día). En una nave cerrada, si nadie lo atrapa, se acumula como el humo en un cuarto sin ventanas.`,
      `Your body exhales CO₂ all the time (~${C.METABOLIC_DAILY_82KG.OUTPUT_CO2_KG} kg a day). In a sealed ship, if nothing traps it, it builds up like smoke in a room with no windows.`
    ),
    quiz: {
      q: b('¿Qué pasa si el CO₂ se acumula en una nave cerrada?', 'What happens if CO₂ builds up in a sealed ship?'),
      options: [b('Causa dolor de cabeza, confusión y puede ser peligroso', 'It causes headaches, confusion and can be dangerous'), b('Hace que el aire huela mejor', 'It makes the air smell better')],
      correct: 0,
      why: b('Por eso un filtro de CO₂ es tan vital como el tanque de oxígeno.', 'That is why a CO₂ filter is as vital as the oxygen tank.'),
    },
    ragQuery: 'Apollo 13 LiOH canister adapter CO2 scrubber square round mailbox duct tape',
  },
  obj_mealPrepared: {
    id: 'obj_mealPrepared',
    tone: 'neutral',
    say: b(
      `Comida lista: unos ${C.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg de comida deshidratada por persona al día, más el agua para rehidratarla.`,
      `Meal ready: about ${C.METABOLIC_DAILY_82KG.FOOD_DEHYDRATED_KG} kg of dehydrated food per person per day, plus the water to rehydrate it.`
    ),
    fact: b(
      'En 1965 John Young llevó a escondidas un sándwich a Gemini 3 y sus migajas flotantes preocuparon a la NASA. Hoy se usan tortillas porque no sueltan migajas: ¡las llevó al espacio el astronauta mexicano Rodolfo Neri Vela en 1985!',
      'In 1965 John Young smuggled a sandwich onto Gemini 3 and its floating crumbs worried NASA. Today crews use tortillas because they do not crumble: Mexican astronaut Rodolfo Neri Vela took them to space in 1985!'
    ),
    source: 'NASA Space Food History · STS-61-B (1985)',
    ragQuery: 'space food dehydrated rehydration BVAD 0.8 kg tortilla crumbs Gemini',
  },
  obj_viewportOpened: {
    id: 'obj_viewportOpened',
    tone: 'neutral',
    say: b('Ventanal abierto. Tómate un segundo para mirar.', 'Viewport open. Take a second to look.'),
    fact: b(
      'Muchos astronautas describen el "efecto perspectiva" (overview effect) al ver la Tierra desde el espacio: un planeta frágil, sin fronteras visibles.',
      'Many astronauts describe the "overview effect" when they see Earth from space: a fragile planet with no visible borders.'
    ),
    source: 'Frank White, The Overview Effect (1987)',
    ragQuery: 'overview effect astronaut psychology Earth view morale',
  },
  obj_launchCompleted: {
    id: 'obj_launchCompleted',
    tone: 'good',
    say: b(
      `Lanzamiento completado. Presión dinámica máxima a T+${LAU.STS_MAX_Q_S} s, separación de cohetes y órbita: sobreviviste a la parte más violenta del viaje.`,
      `Launch complete. Max-Q at T+${LAU.STS_MAX_Q_S} s, booster separation and orbit: you survived the most violent part of the trip.`
    ),
    fact: b(
      `Artemis I (2022) voló unos ${fmt(LAU.ARTEMIS1_DISTANCE_MILES)} millas y la cápsula Orion regresó a ~${fmt(LAU.ORION_REENTRY_MPH)} mph, unas ${LAU.ORION_REENTRY_MACH} veces la velocidad del sonido.`,
      `Artemis I (2022) flew about ${fmt(LAU.ARTEMIS1_DISTANCE_MILES)} miles and the Orion capsule came home at ~${fmt(LAU.ORION_REENTRY_MPH)} mph, about Mach ${LAU.ORION_REENTRY_MACH}.`
    ),
    source: 'NASA Artemis I (2022) · STS timeline',
    ragQuery: 'launch max q SRB separation MECO Artemis I Orion reentry SLS timeline',
  },
  obj_aphHarvested: {
    id: 'obj_aphHarvested',
    tone: 'neutral',
    say: b(
      `Cosecha lista bajo luz de ${BOT.APH_PAR_RED_NM} + ${BOT.APH_PAR_BLUE_NM} nm. Rojo y azul son los colores que más usan las plantas para hacer fotosíntesis; por eso todo se ve magenta.`,
      `Harvest ready under ${BOT.APH_PAR_RED_NM} + ${BOT.APH_PAR_BLUE_NM} nm light. Red and blue are the colors plants use most for photosynthesis; that is why everything looks magenta.`
    ),
    fact: b(
      'En 2015 los astronautas de la ISS comieron por primera vez lechuga cultivada en el espacio (romana roja, en el sistema Veggie). En 2021 cosecharon chiles en el APH… ¡y prepararon tacos espaciales!',
      'In 2015 ISS astronauts ate space-grown lettuce for the first time (red romaine, in the Veggie system). In 2021 they harvested chile peppers in the APH… and made space tacos!'
    ),
    source: 'NASA Veggie (2015) · APH PH-04 (2021)',
    ragQuery: 'Veggie APH plant growth red blue LED lettuce chile peppers ISS harvest',
  },
  obj_bios3Activated: {
    id: 'obj_bios3Activated',
    tone: 'neutral',
    say: b(
      `Tanque amortiguador en línea: recuperamos ~${Math.round(BOT.BIOS3_WATER_RECOVERY * 100)}% del agua, como en BIOS-3.`,
      `Buffer tank online: we recover ~${Math.round(BOT.BIOS3_WATER_RECOVERY * 100)}% of the water, like BIOS-3.`
    ),
    fact: b(
      `En BIOS-3 (Krasnoyarsk, Siberia) tres personas vivieron ${BOT.BIOS3_TEST_DAYS} días encerradas, con plantas y algas que reciclaban su aire y agua.`,
      `In BIOS-3 (Krasnoyarsk, Siberia) three people lived sealed inside for ${BOT.BIOS3_TEST_DAYS} days, with plants and algae recycling their air and water.`
    ),
    source: 'BIOS-3 (URSS / USSR, 1972–1973)',
    ragQuery: 'BIOS-3 Krasnoyarsk closed ecological system water recovery algae crew 180 days',
  },
  obj_roverReturned: {
    id: 'obj_roverReturned',
    tone: 'neutral',
    say: b('Rover acoplado en la esclusa. Ahora, el escudo.', 'Rover docked at the airlock. Now, the shield.'),
    fact: b(
      'En Apollo 17, Gene Cernan y Harrison Schmitt recorrieron unos 36 km con el Rover Lunar: el récord de todas las misiones Apollo.',
      'On Apollo 17, Gene Cernan and Harrison Schmitt drove about 36 km with the Lunar Roving Vehicle: the record of all Apollo missions.'
    ),
    source: 'NASA Apollo 17 (1972)',
    ragQuery: 'Apollo 17 Lunar Roving Vehicle traverse distance Cernan Schmitt',
  },

  // ------------------------------------------------------------------ ALARMS
  alarm_co2: {
    id: 'alarm_co2',
    tone: 'alarm',
    say: b('El CO₂ está subiendo.', 'CO₂ is rising.'),
    fact: b(
      'En la ISS la NASA mantiene el CO₂ por debajo de ~3 mmHg (unos 4,000 ppm), porque niveles altos causan dolor de cabeza y cansancio.',
      'On the ISS, NASA keeps CO₂ below ~3 mmHg (about 4,000 ppm), because high levels cause headaches and fatigue.'
    ),
    source: 'NASA-STD-3001',
    ragQuery: 'ppCO2 limit mmHg CO2 headache ISS crew health ECLSS scrubber',
  },
  alarm_o2: {
    id: 'alarm_o2',
    tone: 'alarm',
    say: b(
      `Oxígeno bajando: por debajo de ${C.HABITAT_ATMOSPHERE.HYPOXIA_THRESHOLD_PERCENT}% empieza la hipoxia.`,
      `Oxygen dropping: below ${C.HABITAT_ATMOSPHERE.HYPOXIA_THRESHOLD_PERCENT}% hypoxia begins.`
    ),
    fact: b(
      'En la ISS el oxígeno se fabrica rompiendo agua con electricidad en el Sistema Generador de Oxígeno.',
      'On the ISS, oxygen is made by splitting water with electricity in the Oxygen Generation System.'
    ),
    source: 'NASA ISS OGS',
    ragQuery: 'oxygen hypoxia ppO2 threshold oxygen generation electrolysis habitat',
  },
  alarm_temp: {
    id: 'alarm_temp',
    tone: 'alarm',
    say: b('La temperatura de cabina está muy alta.', 'Cabin temperature is very high.'),
    fact: b(
      'En 1973 el interior de Skylab superó los 50 °C hasta que su tripulación instaló una sombrilla térmica.',
      'In 1973 Skylab\'s interior went above 50 °C until its crew installed a thermal parasol.'
    ),
    source: 'NASA Skylab 2 (1973)',
    ragQuery: 'cabin temperature overheating Skylab parasol heat rejection habitat',
  },
  alarm_radiation: {
    id: 'alarm_radiation',
    tone: 'alarm',
    say: b(
      `La dosis de radiación sube rápido. El límite de 30 días es ${RAD.SPE_30_DAY_LIMIT_MSV} mSv.`,
      `Radiation dose is climbing fast. The 30-day limit is ${RAD.SPE_30_DAY_LIMIT_MSV} mSv.`
    ),
    fact: b(
      'En agosto de 1972 una gran tormenta solar ocurrió entre Apollo 16 y 17: habría sido peligrosa para astronautas en la Luna.',
      'In August 1972 a major solar storm happened between Apollo 16 and 17: it would have been dangerous for astronauts on the Moon.'
    ),
    source: 'NASA Space Radiation · August 1972 SPE',
    ragQuery: 'solar particle event dose limit 250 mSv 30 day shelter regolith',
  },
  alarm_battery: {
    id: 'alarm_battery',
    tone: 'alarm',
    say: b('Las baterías se están agotando.', 'Batteries are running low.'),
    fact: b(
      'Opportunity sobrevivió muchos inviernos marcianos ahorrando energía, pero la tormenta de polvo de 2018 dejó sus baterías sin carga.',
      'Opportunity survived many Martian winters by saving energy, but the 2018 dust storm drained its batteries.'
    ),
    source: 'NASA JPL Opportunity (2018)',
    ragQuery: 'battery depletion solar power rationing lunar night dust storm',
  },
  alarm_water: {
    id: 'alarm_water',
    tone: 'alarm',
    say: b('La reserva de agua está bajando.', 'Water reserve is dropping.'),
    fact: b(
      'En Apollo 13 racionaron el agua a unos 0.2 litros por persona al día para llegar a casa.',
      'On Apollo 13 the crew rationed water to about 0.2 litres per person per day to make it home.'
    ),
    source: 'NASA Apollo 13 Mission Report (1970)',
    ragQuery: 'potable water reserve rationing dehydration ECLSS water recovery',
  },

  // ----------------------------------------------------------------- MISSIONS
  mission_tutorial_hab: {
    id: 'mission_tutorial_hab',
    tone: 'neutral',
    say: b(
      'Bienvenido a Houston, Cadete. Soy KATHERINE, tu IA mentora. Antes de dejar la Tierra vas a entrenar como los astronautas de verdad: descanso, ejercicio, energía, aire y comida.',
      'Welcome to Houston, Cadet. I am KATHERINE, your mentor AI. Before leaving Earth you will train like real astronauts: rest, exercise, power, air and food.'
    ),
    fact: b(
      `Los astronautas ensayan caminatas espaciales bajo el agua en el Laboratorio de Flotabilidad Neutra de la NASA: una alberca de ${LAU.NBL_POOL_LENGTH_M} m de largo y ${LAU.NBL_POOL_DEPTH_M} m de profundidad.`,
      `Astronauts rehearse spacewalks underwater at NASA's Neutral Buoyancy Laboratory: a pool ${LAU.NBL_POOL_LENGTH_M} m long and ${LAU.NBL_POOL_DEPTH_M} m deep.`
    ),
    source: 'NASA JSC Neutral Buoyancy Laboratory',
    ragQuery: 'astronaut training Neutral Buoyancy Laboratory JSC Houston crew quarters',
  },
  mission_manifest_launch: {
    id: 'mission_manifest_launch',
    tone: 'neutral',
    say: b(
      'Fase 1: el manifiesto. Lo que elijas aquí —aire, energía y rover— te acompañará toda la misión. Piensa como ingeniero: ¿qué pesa menos a largo plazo?',
      'Phase 1: the manifest. What you pick here —air, power and rover— stays with you for the whole mission. Think like an engineer: what is lighter in the long run?'
    ),
    fact: b(
      `La cabina de vidrio MEDS del transbordador reemplazó ${LAU.MEDS_REPLACED_GAUGES} indicadores y ${LAU.MEDS_REPLACED_CRT} pantallas CRT por ${LAU.MEDS_LCD_COUNT} pantallas LCD.`,
      `The Shuttle's MEDS glass cockpit replaced ${LAU.MEDS_REPLACED_GAUGES} gauges and ${LAU.MEDS_REPLACED_CRT} CRT screens with ${LAU.MEDS_LCD_COUNT} LCD displays.`
    ),
    source: 'NASA Space Shuttle MEDS',
    ragQuery: 'mission manifest ECLSS power rover trade study equivalent system mass',
  },
  mission_act1_2_surface: {
    id: 'mission_act1_2_surface',
    tone: 'neutral',
    say: b(
      'Llegamos a la superficie. Dos problemas a la vez: calor que sube y energía que baja. Prioriza: ¿qué te pone en peligro primero?',
      'We are on the surface. Two problems at once: rising heat and falling power. Prioritize: which one endangers you first?'
    ),
    fact: b(
      `En la Luna la gravedad es ${C.GRAVITY.MOON.value} m/s², un sexto de la Tierra: tu peso baja, pero tu masa y tu inercia siguen siendo las mismas.`,
      `On the Moon gravity is ${C.GRAVITY.MOON.value} m/s², one sixth of Earth: your weight drops, but your mass and inertia stay exactly the same.`
    ),
    source: 'NASA ESDMD-001 Moon to Mars',
    ragQuery: 'lunar gravity 1.62 inertia mass weight thermal power surface habitat',
  },
  mission_act3_greenhouse: {
    id: 'mission_act3_greenhouse',
    tone: 'neutral',
    say: b(
      'Invernadero. Las plantas nos dan comida y oxígeno… pero el suelo también respira. Vigila el O₂.',
      'Greenhouse. Plants give us food and oxygen… but the soil breathes too. Watch the O₂.'
    ),
    fact: b(
      `En sistemas tipo BIOS se calculan unos ${C.BLSS_GREENHOUSE.MIN_AREA_PER_PERSON_M2} m² de cultivo por persona para cerrar el ciclo del aire.`,
      `BIOS-style systems budget about ${C.BLSS_GREENHOUSE.MIN_AREA_PER_PERSON_M2} m² of crops per person to close the air loop.`
    ),
    source: 'BLSS / BIOS-3 · APH',
    ragQuery: 'bioregenerative life support greenhouse area per person oxygen crops BIOS',
  },
  mission_act4_storm_rover: {
    id: 'mission_act4_storm_rover',
    tone: 'neutral',
    say: b(
      'Tormenta solar en camino y un rover afuera. Regla de oro: primero el refugio, después la ciencia.',
      'Solar storm incoming and a rover outside. Golden rule: shelter first, science later.'
    ),
    fact: b(
      'En agosto de 1972, entre Apollo 16 y 17, una gran tormenta solar habría sido peligrosa para astronautas en la Luna. Por suerte, no había nadie.',
      'In August 1972, between Apollo 16 and 17, a big solar storm would have been dangerous for astronauts on the Moon. Luckily, nobody was there.'
    ),
    source: 'NASA Space Radiation · August 1972 SPE',
    ragQuery: 'solar particle event warning rover return shelter regolith shielding',
  },

  // ----------------------------------------------------------------- ENDINGS
  end_ending_3_interplanetary_cradle: {
    id: 'end_ending_3_interplanetary_cradle',
    tone: 'good',
    say: b(
      'Veredicto: Cuna Interplanetaria. Elegiste sistemas que se sostienen solos: así se planea vivir en Marte.',
      'Verdict: Interplanetary Cradle. You chose self-sustaining systems: that is how living on Mars is planned.'
    ),
    fact: b(
      `Una misión de referencia a Marte dura unos ${C.ESM_FACTORS_2022.MARS_MISSION_DAYS} días (360 de viaje + 600 en la superficie): reciclar y tener energía constante no es opcional.`,
      `A reference Mars mission lasts about ${C.ESM_FACTORS_2022.MARS_MISSION_DAYS} days (360 in transit + 600 on the surface): recycling and steady power are not optional.`
    ),
    source: 'NASA ESM / Mars reference architecture',
    ragQuery: 'Mars mission duration closed loop life support fission power sustainability',
  },
  end_ending_1_duct_tape: {
    id: 'end_ending_1_duct_tape',
    tone: 'risky',
    say: b(
      'Veredicto: Cinta Adhesiva. Sobreviviste improvisando, como Apollo 13… pero una colonia no puede vivir de parches.',
      'Verdict: Duct Tape. You survived by improvising, like Apollo 13… but a colony cannot live on patches.'
    ),
    fact: b(
      'A Apollo 13 se le llama "un fracaso exitoso": no llegó a la Luna, pero la tripulación regresó a salvo gracias al trabajo en equipo.',
      'Apollo 13 is called "a successful failure": it never reached the Moon, but teamwork brought the crew home safely.'
    ),
    source: 'NASA Apollo 13 (1970)',
    ragQuery: 'Apollo 13 successful failure improvisation teamwork mission control',
  },
  end_ending_2_silent_bunker: {
    id: 'end_ending_2_silent_bunker',
    tone: 'neutral',
    say: b(
      'Veredicto: Búnker Silencioso. Sobrevivieron, pero apenas. Revisa qué decisión te dejó sin margen.',
      'Verdict: Silent Bunker. You survived, barely. Review which decision left you without margin.'
    ),
    fact: b(
      'La NASA compara sistemas con la "masa equivalente" (ESM): cuánto pesan, cuánta energía usan y cuánto calor generan. Elegir bien desde el inicio vale más que reparar después.',
      'NASA compares systems with "equivalent system mass" (ESM): how much they weigh, how much power they use and how much heat they make. Choosing well up front beats repairing later.'
    ),
    source: 'NASA ESM methodology',
    ragQuery: 'equivalent system mass ESM trade study life support power thermal',
  },
};

/** Idle hints (teacher guidance) for the next pending objective, Socratic style. */
export const OBJECTIVE_HINTS: Record<string, Bilingual> = {
  sleepCompleted: b(
    'Llevas rato despierto, Cadete. La Litera te espera: ¿cómo crees que el cansancio afecta tus decisiones?',
    'You have been awake a while, Cadet. The Bunk is waiting: how do you think fatigue affects your decisions?'
  ),
  exerciseCalibrated: b(
    'La Caminadora ASCAN sigue libre. Pista: sin ejercicio, ¿qué les pasa a los huesos en el espacio?',
    'The ASCAN Treadmill is still free. Hint: without exercise, what happens to bones in space?'
  ),
  whcInspected: b(
    'Falta revisar el Compartimento de Higiene WHC. Sí, los astronautas también revisan el baño.',
    'The WHC Hygiene Compartment still needs a check. Yes, astronauts inspect the bathroom too.'
  ),
  evaChecked: b(
    'El Vestidor EVA está pendiente. ¿Cuántas horas crees que aguanta un traje espacial afuera?',
    'The EVA Locker is pending. How many hours do you think a spacesuit lasts outside?'
  ),
  powerRestored: b(
    'La cabina tiene poca energía. Carga la batería, ponla con el fusible en la Caja de Distribución y baja la Palanca de Potencia.',
    'The cabin is low on power. Charge the battery, put it in the Distribution Box with the fuse, then pull the Power Lever.'
  ),
  eclssCleaned: b(
    'El CO₂ no se va solo. Toma un destornillador, abre el Conducto de Ventilación (4 tornillos) y cambia el filtro LiOH.',
    'CO₂ does not leave by itself. Grab a screwdriver, open the Vent Duct (4 screws) and swap the LiOH filter.'
  ),
  mealPrepared: b(
    'Hora de comer: ración deshidratada + agua potable + Calentador Galley. ¿Por qué crees que la comida espacial viaja seca?',
    'Meal time: dehydrated ration + drinking water + Galley Heater. Why do you think space food travels dry?'
  ),
  crisisSolved: b(
    'El Simulador de Crisis de Fuga de Agua te espera. Piensa: ¿qué se acaba primero, el aire, el agua o la comida?',
    'The Water Leak Crisis Simulator is waiting. Think: what runs out first, air, water or food?'
  ),
  manifestConfigured: b(
    'Configura el manifiesto: ECLSS, energía y rover. Si dudas entre dos opciones, pregúntame con [T].',
    'Configure the manifest: ECLSS, power and rover. If you are torn between two options, ask me with [T].'
  ),
  launchCompleted: b('La Consola MEDS está lista. Ejecuta las 5 etapas del lanzamiento.', 'The MEDS Console is ready. Run the 5 launch stages.'),
  thermalFixed: b(
    'La temperatura sigue subiendo. El Panel Térmico necesita cinta o destornillador… ¿qué hizo la tripulación de Skylab en 1973?',
    'Temperature keeps rising. The Thermal Panel needs tape or a screwdriver… what did the Skylab crew do in 1973?'
  ),
  powerBalanced: b('El reactor KRUSTY espera. Sin energía estable, la noche lunar es muy larga.', 'The KRUSTY reactor is waiting. Without steady power, the lunar night is very long.'),
  aphHarvested: b(
    'La Cámara APH tiene cosecha lista. ¿Sabes por qué la luz es magenta?',
    'The APH Chamber has a harvest ready. Do you know why the light is magenta?'
  ),
  compostIsolated: b(
    'El O₂ baja en el invernadero. ¿Qué ser vivo invisible podría estar respirando aquí dentro?',
    'O₂ is dropping in the greenhouse. What invisible living thing could be breathing in here?'
  ),
  bios3Activated: b('Activa el Tanque Amortiguador BIOS-3 para recuperar agua y estabilizar el aire.', 'Activate the BIOS-3 Buffer Tank to recover water and stabilize the air.'),
  roverReturned: b('El rover sigue afuera y viene una tormenta solar. Regrésalo a la esclusa.', 'The rover is still outside and a solar storm is coming. Bring it back to the airlock.'),
  regolithDeployed: b('Despliega el Blindaje de Regolito antes de que suba la radiación.', 'Deploy the Regolith Shield before radiation climbs.'),
};

/** Mission-specific "do this now" action for crisis alarms (command-first mode). */
export function alarmAction(alarmId: string, missionId: string, lang: 'es' | 'en'): string {
  const table: Record<string, Record<string, Bilingual>> = {
    alarm_co2: {
      tutorial_hab: b('Usa el destornillador en el Conducto de Ventilación de CO₂ y cambia el filtro LiOH.', 'Use the screwdriver on the CO₂ Vent Duct and swap the LiOH filter.'),
      act3_greenhouse: b('Cierra la Válvula de Compostaje: los microbios están consumiendo el aire.', 'Close the Compost Valve: microbes are eating the air.'),
    },
    alarm_o2: {
      act3_greenhouse: b('Cierra la Válvula de Compostaje y activa el Tanque BIOS-3.', 'Close the Compost Valve and activate the BIOS-3 Tank.'),
      act1_2_surface: b('Activa el Electrolizador SPE para producir oxígeno.', 'Run the SPE Electrolyzer to make oxygen.'),
    },
    alarm_temp: {
      act1_2_surface: b('Ve al Panel Térmico Skylab con la cinta adhesiva o el destornillador.', 'Go to the Skylab Thermal Panel with the duct tape or screwdriver.'),
    },
    alarm_radiation: {
      act4_storm_rover: b('Regresa el rover a la esclusa y despliega el Blindaje de Regolito.', 'Return the rover to the airlock and deploy the Regolith Shield.'),
    },
    alarm_battery: {
      act1_2_surface: b('Estabiliza el Reactor KRUSTY o apaga lo que no sea vital.', 'Stabilize the KRUSTY Reactor or shut down non-vital loads.'),
    },
    alarm_water: {
      tutorial_hab: b('Resuelve el Simulador de Crisis de agua: el agua va antes que la comida.', 'Solve the water Crisis Simulator: water comes before food.'),
    },
  };
  const fallback = b('Revisa la Terminal de Diagnóstico y estabiliza el sistema.', 'Check the Diagnostic Terminal and stabilize the system.');
  return (table[alarmId]?.[missionId] ?? fallback)[lang];
}
