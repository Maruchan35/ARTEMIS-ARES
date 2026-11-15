"""Hand-written, fact-checked teaching material per concept (ES/EN) for the KATHERINE tutoring dataset.

Every number here is either already in the game's verified cards (src/ai/mentorKnowledge.ts) or a widely
documented NASA figure (BVAD life-support baselines, ISS water recovery 2023, KRUSTY 2018, lunar g, Veggie 2015).
Keep it that way: the model will learn to repeat these, so no guesses.

Per concept:
  explorer / engineer : how the idea sounds for 6-9 year olds vs teenagers & adults (cadet = the card itself)
  checks              : one follow-up question per level, always on the SAME topic
  key                 : the core idea, used in grading feedback
  answers             : player explanations to grade -> (verdict, es, en, note_es, note_en, misconception_es, misconception_en)
  question / qa       : a question kids really ask, answered per level
"""

C = {
    "aire": {
        "name": {"es": "respirar en una nave", "en": "breathing in a spacecraft"},
        "explorer": {
            "es": "Cuando respiras tomas oxígeno, lo bueno del aire, y sueltas dióxido de carbono, el aire “usado”. En una nave cerrada no hay ventanas, así que una máquina limpia el aire por nosotros.",
            "en": "When you breathe you take in oxygen, the good part of air, and breathe out carbon dioxide, the “used” air. A spacecraft is closed, so a machine cleans the air for us.",
        },
        "engineer": {
            "es": "Cada tripulante consume cerca de 0.84 kg de O₂ al día y exhala alrededor de 1 kg de CO₂; el soporte vital tiene que cerrar ese balance de masa sin abrir la cabina.",
            "en": "Each crew member uses about 0.84 kg of O₂ per day and exhales about 1 kg of CO₂; life support must close that mass balance without opening the cabin.",
        },
        "checks": {
            "explorer": {"es": "¿Qué crees que pasa con el aire “usado” si nadie lo limpia?", "en": "What do you think happens to the “used” air if nobody cleans it?"},
            "cadet": {"es": "¿Por qué en una nave no basta con tener tanques de oxígeno?", "en": "Why isn't it enough for a spacecraft to just carry oxygen tanks?"},
            "engineer": {"es": "¿Qué pasa con la presión parcial de CO₂ si la tripulación se duplica y el sistema no cambia?", "en": "What happens to the CO₂ partial pressure if the crew doubles and the system stays the same?"},
        },
        "key": {"es": "respiramos O₂ y soltamos CO₂; en una nave cerrada el CO₂ se acumula si no se quita.", "en": "we breathe in O₂ and out CO₂; in a sealed ship CO₂ builds up unless it is removed."},
        "answers": [
            ("good", "Porque cuando respiramos soltamos CO₂ y en la nave cerrada se va juntando, y mucho CO₂ hace daño.", "Because when we breathe we let out CO₂, and in a closed ship it builds up, and too much CO₂ is harmful.", "", "", "", ""),
            ("partial", "Porque el aire se ensucia.", "Because the air gets dirty.", "¿con qué se ensucia? con el CO₂ que exhalamos", "dirty with what? with the CO₂ we breathe out", "", ""),
            ("miss", "Porque el CO₂ es oxígeno usado que podemos volver a respirar sin problema.", "Because CO₂ is used oxygen we can breathe again with no problem.", "el CO₂ no se puede volver a respirar: en exceso da dolor de cabeza y cansancio", "CO₂ can't be breathed again: too much causes headaches and tiredness", "cree que el CO₂ se puede volver a respirar", "thinks CO₂ can be breathed again"),
            ("miss", "Para que la nave vaya más rápido.", "So the ship goes faster.", "", "", "", ""),
        ],
        "question": {"es": "¿Por qué los astronautas no abren la ventana para que entre aire?", "en": "Why don't astronauts open a window to let air in?"},
        "qa": {
            "explorer": {"es": "¡Porque afuera no hay aire! El espacio está vacío. Si abrieras, nuestro aire se escaparía como el de un globo que se desinfla.", "en": "Because there is no air outside! Space is empty. If you opened it, our air would rush out like air from a balloon."},
            "cadet": {"es": "Afuera hay vacío: no hay aire que meter. Por eso la nave guarda su propio aire y una máquina le quita el CO₂ que exhalamos.", "en": "Outside is a vacuum: there is no air to let in. So the ship keeps its own air and a machine removes the CO₂ we breathe out."},
            "engineer": {"es": "El exterior es vacío, así que la cabina es un sistema cerrado presurizado. El O₂ se repone y el CO₂ se retira con depuradores; abrir solo provocaría una despresurización.", "en": "Outside is vacuum, so the cabin is a sealed, pressurized system. O₂ is replenished and CO₂ is removed by scrubbers; opening it would only cause a depressurization."},
        },
    },
    "co2": {
        "name": {"es": "filtros de CO₂", "en": "CO₂ scrubbers"},
        "explorer": {
            "es": "Un filtro de CO₂ es como una esponja que atrapa el aire “usado”. Cuando la esponja se llena, hay que cambiarla.",
            "en": "A CO₂ filter is like a sponge that soaks up the “used” air. When the sponge is full, you have to change it.",
        },
        "engineer": {
            "es": "El LiOH absorbe CO₂ químicamente y se gasta (lazo abierto); el CDRA de la ISS usa lechos de zeolita que se regeneran calentándose y ventilando el CO₂ al vacío.",
            "en": "LiOH absorbs CO₂ chemically and is used up (open loop); the ISS CDRA uses zeolite beds that regenerate by heating and venting the CO₂ to vacuum.",
        },
        "checks": {
            "explorer": {"es": "¿Qué pasa si la esponja del filtro ya está llena?", "en": "What happens if the filter sponge is already full?"},
            "cadet": {"es": "¿Por qué un filtro que se gasta es un problema en misiones largas?", "en": "Why is a filter that gets used up a problem on long missions?"},
            "engineer": {"es": "¿Qué ventaja de masa tiene un sistema regenerable frente a cartuchos de LiOH en una misión de meses?", "en": "What mass advantage does a regenerable system have over LiOH canisters on a months-long mission?"},
        },
        "key": {"es": "el filtro atrapa el CO₂; cuando se satura deja de funcionar y el CO₂ sube.", "en": "the filter traps CO₂; once it is saturated it stops working and CO₂ rises."},
        "answers": [
            ("good", "Atrapa el CO₂ del aire, y si se llena ya no atrapa más y el CO₂ empieza a subir.", "It traps CO₂ from the air, and if it fills up it can't trap more and CO₂ starts to rise.", "", "", "", ""),
            ("partial", "Limpia el aire.", "It cleans the air.", "¿de qué lo limpia? del CO₂, y se puede saturar", "cleans it of what? of CO₂, and it can fill up", "", ""),
            ("miss", "Fabrica oxígeno nuevo.", "It makes new oxygen.", "el filtro no fabrica oxígeno: solo quita el CO₂; el oxígeno viene de otro sistema", "the filter doesn't make oxygen: it only removes CO₂; oxygen comes from another system", "cree que el filtro de CO₂ produce oxígeno", "thinks the CO₂ filter produces oxygen"),
            ("miss", "Sirve para que no haga frío.", "It keeps the cabin from getting cold.", "", "", "", ""),
        ],
        "question": {"es": "¿Cómo arreglaron el filtro de aire en el Apollo 13?", "en": "How did they fix the air filter on Apollo 13?"},
        "qa": {
            "explorer": {"es": "¡Con cinta, bolsas y cartón! Los filtros cuadrados no cabían en un hueco redondo, y la tripulación armó un adaptador con lo que tenía a bordo.", "en": "With tape, bags and cardboard! The square filters didn't fit a round hole, so the crew built an adapter from things on board."},
            "cadet": {"es": "Los cartuchos de LiOH del módulo de mando eran cuadrados y los del módulo lunar redondos. Con cinta adhesiva, bolsas y tapas de manuales armaron un adaptador y bajó el CO₂.", "en": "The command module's LiOH canisters were square and the lunar module's were round. With duct tape, bags and manual covers they built an adapter and CO₂ came down."},
            "engineer": {"es": "Fue una falla de interfaz: cartuchos de LiOH cuadrados en un receptáculo redondo. Ingenieros en tierra diseñaron un adaptador con materiales a bordo y lo transmitieron paso a paso por radio.", "en": "It was an interface failure: square LiOH canisters in a round receptacle. Ground engineers designed an adapter from onboard materials and talked the crew through it over the radio."},
        },
    },
    "agua": {
        "name": {"es": "reciclar el agua", "en": "recycling water"},
        "explorer": {
            "es": "En el espacio no hay ríos ni lluvia. Por eso los astronautas limpian el agua que ya usaron, ¡hasta el sudor!, y la vuelven a tomar.",
            "en": "There are no rivers or rain in space. So astronauts clean the water they already used, even sweat!, and drink it again.",
        },
        "engineer": {
            "es": "Lanzar cada kilogramo cuesta mucho, así que la ISS cierra el ciclo: destila la orina, filtra y oxida catalíticamente, y en 2023 llegó a recuperar alrededor del 98 % del agua.",
            "en": "Launching every kilogram is expensive, so the ISS closes the loop: it distills urine, filters and catalytically oxidizes, and in 2023 it reached about 98 % water recovery.",
        },
        "checks": {
            "explorer": {"es": "¿De dónde sacarías agua si no hay lluvia?", "en": "Where would you get water if there is no rain?"},
            "cadet": {"es": "¿Por qué reciclar agua es mejor que llevar más tanques?", "en": "Why is recycling water better than carrying more tanks?"},
            "engineer": {"es": "¿Qué pasa con la masa de agua que debes lanzar si la recuperación baja del 98 % al 90 %?", "en": "What happens to the water mass you must launch if recovery drops from 98 % to 90 %?"},
        },
        "key": {"es": "llevar agua desde la Tierra es carísimo, así que se recicla casi toda, incluso la orina y el sudor.", "en": "bringing water from Earth is very expensive, so almost all of it is recycled, even urine and sweat."},
        "answers": [
            ("good", "Porque llevar agua en el cohete pesa y cuesta mucho, entonces reciclan la orina y el sudor.", "Because carrying water on the rocket is heavy and expensive, so they recycle urine and sweat.", "", "", "", ""),
            ("partial", "Porque el agua es importante.", "Because water is important.", "sí, y además es pesada y cara de lanzar", "yes, and it is also heavy and expensive to launch", "", ""),
            ("miss", "Porque en el espacio hay mucha agua y es fácil conseguirla.", "Because there is lots of water in space and it is easy to get.", "en la nave no hay de dónde sacar agua: o se lanza desde la Tierra o se recicla", "there is nowhere to get water on the ship: it is launched from Earth or recycled", "cree que en el espacio es fácil conseguir agua", "thinks water is easy to get in space"),
            ("miss", "Para que las plantas crezcan más rápido.", "So plants grow faster.", "", "", "", ""),
        ],
        "question": {"es": "¿De verdad los astronautas toman su propia pipí?", "en": "Do astronauts really drink their own pee?"},
        "qa": {
            "explorer": {"es": "¡Sí, pero ya limpia! Una máquina la limpia tanto que queda como agua pura. Hasta bromean: “el café de ayer es el café de mañana”.", "en": "Yes, but cleaned! A machine cleans it so well it becomes pure water. They even joke: “yesterday's coffee is tomorrow's coffee.”"},
            "cadet": {"es": "Sí. La ISS destila y filtra la orina y el sudor hasta dejarlos como agua potable; así recupera casi toda el agua y no hay que lanzar tanta desde la Tierra.", "en": "Yes. The ISS distills and filters urine and sweat into drinking water; that way it recovers almost all its water and less has to be launched from Earth."},
            "engineer": {"es": "Sí: el procesador de orina destila y luego el sistema de procesamiento de agua filtra y oxida; en 2023 la ISS alcanzó cerca del 98 % de recuperación, lo que reduce mucho la masa de reabastecimiento.", "en": "Yes: the urine processor distills, then the water processor filters and oxidizes; in 2023 the ISS reached about 98 % recovery, which greatly cuts resupply mass."},
        },
    },
    "supervivencia": {
        "name": {"es": "qué cuidar primero", "en": "what to protect first"},
        "explorer": {
            "es": "Sin aire solo aguantas unos minutos, sin agua unos días y sin comida varias semanas. Por eso primero el aire, luego el agua y al final la comida.",
            "en": "Without air you last only minutes, without water a few days and without food several weeks. So air first, then water, then food.",
        },
        "engineer": {
            "es": "Es la regla de los tres órdenes de magnitud: minutos sin aire, días sin agua, semanas sin comida. La prioridad de recursos sigue el tiempo que el cuerpo resiste sin cada uno.",
            "en": "It is a three-orders-of-magnitude rule: minutes without air, days without water, weeks without food. Resource priority follows how long the body survives without each one.",
        },
        "checks": {
            "explorer": {"es": "Si solo pudieras salvar una cosa, ¿cuál sería primero?", "en": "If you could save only one thing, which would come first?"},
            "cadet": {"es": "¿Por qué el aire va antes que el agua?", "en": "Why does air come before water?"},
            "engineer": {"es": "¿Cómo usarías esta regla para decidir qué sistema reparar primero en una falla múltiple?", "en": "How would you use this rule to decide which system to repair first in a multiple failure?"},
        },
        "key": {"es": "primero el aire (minutos), luego el agua (días) y al final la comida (semanas).", "en": "air first (minutes), then water (days), then food (weeks)."},
        "answers": [
            ("good", "Primero el aire porque sin aire aguantas minutos, luego el agua que aguantas días y al final la comida que aguantas semanas.", "Air first because without air you last minutes, then water which you last days without, and food last because you last weeks.", "", "", "", ""),
            ("partial", "Primero el aire porque es lo más importante.", "Air first because it is the most important.", "bien, y el porqué es el tiempo: minutos sin aire, días sin agua, semanas sin comida", "good, and the reason is time: minutes without air, days without water, weeks without food", "", ""),
            ("miss", "Primero la comida porque sin comer te desmayas.", "Food first because without eating you faint.", "la comida va al final: sin comer aguantas semanas, pero sin aire solo minutos", "food comes last: you can last weeks without eating, but only minutes without air", "cree que la comida va antes que el aire y el agua", "thinks food comes before air and water"),
            ("miss", "Primero el agua, después el aire.", "Water first, then air.", "el aire va primero: sin aire aguantas minutos y sin agua días", "air comes first: you last minutes without air and days without water", "invierte el orden aire y agua", "swaps the order of air and water"),
        ],
        "question": {"es": "¿Cuánto tiempo aguanta una persona sin comer?", "en": "How long can a person go without eating?"},
        "qa": {
            "explorer": {"es": "¡Varias semanas! Por eso la comida es lo último que cuidamos. El aire y el agua son más urgentes.", "en": "Several weeks! That's why food is the last thing we protect. Air and water are more urgent."},
            "cadet": {"es": "Varias semanas, aunque con poca energía. En cambio sin agua solo unos días y sin aire minutos; por eso el orden de prioridad es aire, agua y comida.", "en": "Several weeks, though with little energy. Without water only a few days and without air minutes; that's why the priority is air, water, food."},
            "engineer": {"es": "Del orden de semanas, según las reservas del cuerpo; el agua se agota en días y el aire en minutos. Esa diferencia de escala es la que ordena la prioridad de los consumibles.", "en": "On the order of weeks, depending on body reserves; water runs out in days and air in minutes. That difference in scale is what orders consumable priority."},
        },
    },
    "energia": {
        "name": {"es": "la energía de la base", "en": "base power"},
        "explorer": {
            "es": "Los paneles solares son como un ventilador que se apaga cuando oscurece; el reactor es como estar conectado a la pared de tu casa, de día y de noche.",
            "en": "Solar panels are like a fan that turns off when it gets dark; the reactor is like being plugged into the wall at home, day and night.",
        },
        "engineer": {
            "es": "La noche lunar dura unos 14 días terrestres; cubrirla con baterías pesa demasiado, por eso un reactor de fisión pequeño da potencia continua. KRUSTY lo demostró en 2018 con 28 horas a plena potencia.",
            "en": "A lunar night lasts about 14 Earth days; covering it with batteries weighs too much, so a small fission reactor gives continuous power. KRUSTY proved it in 2018 with 28 hours at full power.",
        },
        "checks": {
            "explorer": {"es": "¿Qué pasa con los paneles solares cuando llega la noche?", "en": "What happens to solar panels when night comes?"},
            "cadet": {"es": "¿Por qué la noche lunar es un problema para los paneles solares?", "en": "Why is the lunar night a problem for solar panels?"},
            "engineer": {"es": "¿Qué pesa más para cubrir la noche lunar: baterías o un reactor con radiadores?", "en": "What weighs more to cover the lunar night: batteries or a reactor with radiators?"},
        },
        "key": {"es": "de noche y con polvo los paneles casi no dan energía; un reactor da energía constante.", "en": "at night and in dust the panels give almost no power; a reactor gives constant power."},
        "answers": [
            ("good", "Porque la noche en la Luna es muy larga y los paneles no funcionan sin sol, y el reactor da energía todo el tiempo.", "Because the night on the Moon is very long and panels don't work without sun, and the reactor gives power all the time.", "", "", "", ""),
            ("partial", "Porque el reactor es más fuerte.", "Because the reactor is stronger.", "lo importante es que no depende del Sol: funciona de noche", "the key is it doesn't depend on the Sun: it works at night", "", ""),
            ("miss", "Porque los paneles solares funcionan mejor de noche.", "Because solar panels work better at night.", "los paneles necesitan luz del Sol: de noche casi no dan energía", "panels need sunlight: at night they give almost no power", "cree que los paneles solares funcionan de noche", "thinks solar panels work at night"),
            ("miss", "Porque el reactor sirve para respirar.", "Because the reactor is for breathing.", "", "", "", ""),
        ],
        "question": {"es": "¿Por qué no usamos solo paneles solares en la Luna?", "en": "Why don't we just use solar panels on the Moon?"},
        "qa": {
            "explorer": {"es": "Porque en la Luna la noche es larguísima, ¡como dos semanas! Sin sol, los paneles se quedan dormidos.", "en": "Because on the Moon the night is super long, about two weeks! Without sun, the panels fall asleep."},
            "cadet": {"es": "La noche lunar dura unos 14 días terrestres. Los paneles necesitarían baterías enormes para aguantarla; un reactor pequeño da energía sin importar el Sol.", "en": "A lunar night lasts about 14 Earth days. Panels would need huge batteries to get through it; a small reactor gives power regardless of the Sun."},
            "engineer": {"es": "Con unos 14 días de oscuridad, la masa de baterías para almacenar esa energía crece muchísimo. La fisión entrega potencia continua a cambio de radiadores grandes para disipar el calor.", "en": "With about 14 days of darkness, the battery mass needed to store that energy grows enormously. Fission delivers continuous power in exchange for large radiators to reject heat."},
        },
    },
    "radiacion": {
        "name": {"es": "radiación y blindaje", "en": "radiation and shielding"},
        "explorer": {
            "es": "En el espacio el Sol a veces lanza una lluvia invisible de partículas. Esconderte detrás de tierra lunar o agua es como ponerte bajo un techo cuando llueve.",
            "en": "In space the Sun sometimes throws an invisible rain of particles. Hiding behind moon dirt or water is like standing under a roof when it rains.",
        },
        "engineer": {
            "es": "En un evento de partículas solares, los protones de alta energía se frenan al atravesar masa; los materiales con mucho hidrógeno, como el agua, y capas gruesas de regolito reducen la dosis.",
            "en": "In a solar particle event, high-energy protons slow down as they pass through mass; hydrogen-rich materials like water and thick layers of regolith reduce the dose.",
        },
        "checks": {
            "explorer": {"es": "¿Dónde te esconderías de la lluvia invisible del Sol?", "en": "Where would you hide from the Sun's invisible rain?"},
            "cadet": {"es": "¿Por qué el agua sirve como escudo además de para beber?", "en": "Why does water work as a shield as well as for drinking?"},
            "engineer": {"es": "¿Por qué un material con mucho hidrógeno protege mejor contra protones que uno muy pesado?", "en": "Why does a hydrogen-rich material protect better against protons than a very heavy one?"},
        },
        "key": {"es": "durante una tormenta solar hay que ponerse detrás de mucha masa, como regolito o agua, para frenar las partículas.", "en": "during a solar storm you get behind a lot of mass, like regolith or water, to stop the particles."},
        "answers": [
            ("good", "Porque las partículas de la tormenta chocan con el regolito o el agua y se frenan antes de llegar a nosotros.", "Because the storm's particles hit the regolith or water and slow down before reaching us.", "", "", "", ""),
            ("partial", "Porque te tapa.", "Because it covers you.", "te tapa porque la masa frena las partículas", "it covers you because the mass slows the particles down", "", ""),
            ("miss", "Porque el regolito absorbe la luz y así no hace calor.", "Because regolith absorbs light so it isn't hot.", "el peligro no es la luz ni el calor, son partículas invisibles que la masa frena", "the danger isn't light or heat, it's invisible particles that mass slows down", "confunde la radiación con luz o calor", "confuses radiation with light or heat"),
            ("miss", "Porque así el rover va más rápido.", "Because then the rover goes faster.", "", "", "", ""),
        ],
        "question": {"es": "¿Qué pasó en agosto de 1972 con el Sol?", "en": "What happened with the Sun in August 1972?"},
        "qa": {
            "explorer": {"es": "¡El Sol tuvo una tormenta gigante! Por suerte no había astronautas en la Luna en ese momento.", "en": "The Sun had a giant storm! Luckily there were no astronauts on the Moon at that time."},
            "cadet": {"es": "Hubo una enorme tormenta de partículas solares entre las misiones Apollo 16 y 17. Como no había nadie en la Luna, nadie resultó afectado, pero nos enseñó por qué hacen falta refugios.", "en": "There was a huge solar particle storm between the Apollo 16 and 17 missions. Since nobody was on the Moon, nobody was harmed, but it showed why shelters are needed."},
            "engineer": {"es": "Un evento de partículas solares muy intenso ocurrió entre Apollo 16 y 17. Se usa como caso de diseño: los hábitats y rovers necesitan un refugio con suficiente masa de blindaje.", "en": "A very intense solar particle event happened between Apollo 16 and 17. It is used as a design case: habitats and rovers need a shelter with enough shielding mass."},
        },
    },
    "gravedad": {
        "name": {"es": "gravedad, masa y peso", "en": "gravity, mass and weight"},
        "explorer": {
            "es": "En la Luna pesas menos y brincas más alto, pero tu cuerpo sigue igual de grande. Por eso cuesta lo mismo frenar si vas corriendo.",
            "en": "On the Moon you weigh less and jump higher, but your body is just as big. That's why stopping is just as hard if you're running.",
        },
        "engineer": {
            "es": "La gravedad lunar es 1.62 m/s², un 16.5 % de la terrestre: el peso (m·g) baja, pero la masa y la inercia no; además baja la tracción porque depende de la fuerza normal.",
            "en": "Lunar gravity is 1.62 m/s², 16.5 % of Earth's: weight (m·g) drops but mass and inertia do not; traction also drops because it depends on the normal force.",
        },
        "checks": {
            "explorer": {"es": "Si saltas en la Luna, ¿llegas más alto o más bajo que en la Tierra?", "en": "If you jump on the Moon, do you go higher or lower than on Earth?"},
            "cadet": {"es": "¿Por qué cuesta igual frenar en la Luna aunque pesemos menos?", "en": "Why is stopping just as hard on the Moon even though we weigh less?"},
            "engineer": {"es": "¿Qué le pasa a la distancia de frenado de un rover si baja la tracción pero la masa es la misma?", "en": "What happens to a rover's braking distance if traction drops but mass stays the same?"},
        },
        "key": {"es": "en la Luna baja el peso pero la masa y la inercia son las mismas.", "en": "on the Moon weight drops but mass and inertia stay the same."},
        "answers": [
            ("good", "Porque el peso baja con la gravedad pero la masa es la misma, y la inercia depende de la masa.", "Because weight drops with gravity but mass stays the same, and inertia depends on mass.", "", "", "", ""),
            ("partial", "Porque hay menos gravedad.", "Because there is less gravity.", "sí, pero la clave es que la masa no cambia", "yes, but the key is that mass doesn't change", "", ""),
            ("miss", "Porque en la Luna tu masa se vuelve más pequeña.", "Because on the Moon your mass gets smaller.", "la masa no cambia en la Luna: lo que cambia es el peso", "mass doesn't change on the Moon: weight does", "confunde masa con peso", "confuses mass with weight"),
            ("miss", "Porque en la Luna no hay aire.", "Because there is no air on the Moon.", "", "", "", ""),
        ],
        "question": {"es": "¿Por qué en la Luna caminas raro si pesas menos?", "en": "Why do you walk funny on the Moon if you weigh less?"},
        "qa": {
            "explorer": {"es": "¡Porque rebotas! Pesas menos y cada paso te lanza hacia arriba, como en un trampolín.", "en": "Because you bounce! You weigh less and every step launches you up, like on a trampoline."},
            "cadet": {"es": "Tu peso baja a como 1/6 del de la Tierra, pero tu masa es la misma. Los pies agarran menos el suelo y cada paso te eleva, así que los astronautas brincan como canguros.", "en": "Your weight drops to about 1/6 of Earth's, but your mass is the same. Your feet grip the ground less and each step lifts you, so astronauts hop like kangaroos."},
            "engineer": {"es": "Con 1.62 m/s² la fuerza normal y la fricción bajan, pero la inercia no; el paso normal pierde estabilidad y conviene un salto corto que aprovecha la baja gravedad.", "en": "At 1.62 m/s² the normal force and friction drop but inertia does not; the normal gait loses stability and a short hop that exploits low gravity works better."},
        },
    },
    "cuerpo": {
        "name": {"es": "el cuerpo en el espacio", "en": "the body in space"},
        "explorer": {
            "es": "En el espacio los huesos y los músculos casi no trabajan, y se ponen flojitos. Por eso los astronautas hacen ejercicio todos los días.",
            "en": "In space your bones and muscles barely work, so they get weak. That's why astronauts exercise every day.",
        },
        "engineer": {
            "es": "Sin carga gravitacional los huesos pierden densidad, del orden de 1 % al mes en zonas como la cadera; por eso la ISS combina caminadora, bicicleta y un dispositivo de resistencia cerca de dos horas diarias.",
            "en": "Without gravitational loading, bones lose density, on the order of 1 % per month in areas like the hip; so the ISS combines treadmill, cycle and a resistance device for about two hours a day.",
        },
        "checks": {
            "explorer": {"es": "¿Qué le pasa a un músculo que casi no usas?", "en": "What happens to a muscle you hardly use?"},
            "cadet": {"es": "¿Por qué el ejercicio en el espacio es parte del trabajo y no un pasatiempo?", "en": "Why is exercise in space part of the job and not a hobby?"},
            "engineer": {"es": "¿Por qué la caminadora de la ISS necesita arneses que jalan al astronauta hacia abajo?", "en": "Why does the ISS treadmill need harnesses pulling the astronaut down?"},
        },
        "key": {"es": "sin gravedad los huesos y músculos se debilitan, y el ejercicio diario lo evita.", "en": "without gravity bones and muscles weaken, and daily exercise prevents it."},
        "answers": [
            ("good", "Porque sin gravedad los huesos y músculos no trabajan y se debilitan, y el ejercicio los mantiene fuertes.", "Because without gravity bones and muscles don't work and get weak, and exercise keeps them strong.", "", "", "", ""),
            ("partial", "Para estar sanos.", "To stay healthy.", "sí, en concreto para que no se debiliten huesos y músculos", "yes, specifically so bones and muscles don't weaken", "", ""),
            ("miss", "Para no flotar.", "So they don't float.", "el ejercicio no evita flotar: protege huesos y músculos", "exercise doesn't stop floating: it protects bones and muscles", "cree que el ejercicio sirve para no flotar", "thinks exercise is to stop floating"),
            ("miss", "Para que la nave tenga energía.", "So the ship has power.", "", "", "", ""),
        ],
        "question": {"es": "¿Cómo duermen los astronautas si flotan?", "en": "How do astronauts sleep if they float?"},
        "qa": {
            "explorer": {"es": "¡En bolsas de dormir amarradas a la pared! Así no flotan por toda la nave mientras sueñan.", "en": "In sleeping bags tied to the wall! That way they don't float around the ship while dreaming."},
            "cadet": {"es": "Duermen en sacos sujetos a la pared de un cuartito. Como no hay arriba ni abajo, da igual la posición; lo importante es estar sujeto y con buena ventilación.", "en": "They sleep in bags attached to the wall of a small cabin. With no up or down, position doesn't matter; what matters is being secured and well ventilated."},
            "engineer": {"es": "En sacos anclados a la pared y con ventilación forzada: en microgravedad no hay convección natural, así que el CO₂ exhalado podría acumularse alrededor de la cara.", "en": "In bags anchored to the wall with forced ventilation: in microgravity there is no natural convection, so exhaled CO₂ could pool around the face."},
        },
    },
    "plantas": {
        "name": {"es": "plantas que dan aire y comida", "en": "plants that give air and food"},
        "explorer": {
            "es": "Las plantas se “comen” el aire usado y la luz, y nos devuelven oxígeno y comida. ¡Son ayudantes verdes!",
            "en": "Plants “eat” used air and light, and give us back oxygen and food. They're green helpers!",
        },
        "engineer": {
            "es": "Con fotosíntesis las plantas toman CO₂ y luz y liberan O₂; con LED rojo y azul se aprovecha la luz que más absorben. Veggie en 2015 y las chiles del APH en 2021 lo probaron en la ISS.",
            "en": "Through photosynthesis plants take in CO₂ and light and release O₂; red and blue LEDs supply the light they absorb most. Veggie in 2015 and the APH chiles in 2021 tested it on the ISS.",
        },
        "checks": {
            "explorer": {"es": "¿Qué le dan las plantas a los astronautas además de comida?", "en": "What do plants give astronauts besides food?"},
            "cadet": {"es": "¿Por qué el invernadero usa luz magenta en vez de luz blanca?", "en": "Why does the greenhouse use magenta light instead of white light?"},
            "engineer": {"es": "¿Qué pasaría con el O₂ si el suelo tuviera muchos microbios que respiran, como en Biosphere 2?", "en": "What would happen to O₂ if the soil had many breathing microbes, like in Biosphere 2?"},
        },
        "key": {"es": "las plantas toman CO₂ y luz y dan oxígeno y comida.", "en": "plants take in CO₂ and light and give oxygen and food."},
        "answers": [
            ("good", "Porque con la luz se toman el CO₂ y sueltan oxígeno, además de darnos comida.", "Because with light they take in CO₂ and release oxygen, and they also give us food.", "", "", "", ""),
            ("partial", "Porque son verdes y bonitas.", "Because they're green and pretty.", "además limpian el aire: toman CO₂ y dan oxígeno", "they also clean the air: they take in CO₂ and give oxygen", "", ""),
            ("miss", "Porque las plantas se comen el oxígeno y sueltan CO₂ para nosotros.", "Because plants eat oxygen and release CO₂ for us.", "es al revés: con luz toman CO₂ y sueltan oxígeno", "it's the other way around: with light they take in CO₂ and release oxygen", "invierte la fotosíntesis (cree que toman O₂ y dan CO₂)", "reverses photosynthesis (thinks they take O₂ and give CO₂)"),
            ("miss", "Para que el rover tenga sombra.", "So the rover has shade.", "", "", "", ""),
        ],
        "question": {"es": "¿Ya comieron lechuga en el espacio?", "en": "Have astronauts eaten lettuce in space?"},
        "qa": {
            "explorer": {"es": "¡Sí! En 2015 los astronautas de la ISS se comieron lechuga que crecieron ellos mismos.", "en": "Yes! In 2015 astronauts on the ISS ate lettuce they grew themselves."},
            "cadet": {"es": "Sí. En 2015 la tripulación de la ISS probó lechuga cultivada en el experimento Veggie, con luces LED, y en 2021 cosecharon chiles para hacer tacos.", "en": "Yes. In 2015 the ISS crew tasted lettuce grown in the Veggie experiment under LED lights, and in 2021 they harvested chiles to make tacos."},
            "engineer": {"es": "Sí: Veggie produjo lechuga comestible en 2015 y el Advanced Plant Habitat cultivó chiles en 2021, con iluminación LED controlada y monitoreo de humedad y nutrientes.", "en": "Yes: Veggie produced edible lettuce in 2015 and the Advanced Plant Habitat grew chiles in 2021, with controlled LED lighting and humidity and nutrient monitoring."},
        },
    },
    "temperatura": {
        "name": {"es": "calor y radiadores", "en": "heat and radiators"},
        "explorer": {
            "es": "Las máquinas y las personas hacen calor. En el espacio no hay aire que se lo lleve, así que la nave usa radiadores, como una chimenea al revés.",
            "en": "Machines and people make heat. In space there is no air to carry it away, so the ship uses radiators, like a backwards fireplace.",
        },
        "engineer": {
            "es": "En el vacío no hay convección: el calor solo sale por radiación. La ISS bombea amoníaco hasta radiadores grandes que emiten ese calor al espacio.",
            "en": "In vacuum there is no convection: heat only leaves by radiation. The ISS pumps ammonia to large radiators that emit that heat into space.",
        },
        "checks": {
            "explorer": {"es": "¿Qué pasa con una nave si nadie le saca el calor?", "en": "What happens to a ship if nobody removes its heat?"},
            "cadet": {"es": "¿Por qué el espacio frío no enfría la nave solito?", "en": "Why doesn't cold space cool the ship by itself?"},
            "engineer": {"es": "¿Por qué los radiadores deben ser grandes si solo pueden emitir calor por radiación?", "en": "Why must radiators be large if they can only reject heat by radiation?"},
        },
        "key": {"es": "en el vacío no hay aire que se lleve el calor, así que se necesitan radiadores.", "en": "in vacuum there is no air to carry heat away, so radiators are needed."},
        "answers": [
            ("good", "Porque en el vacío no hay aire que se lleve el calor y la nave se calentaría, entonces los radiadores lo sacan.", "Because in vacuum there's no air to carry the heat away and the ship would overheat, so radiators get rid of it.", "", "", "", ""),
            ("partial", "Porque la nave se calienta.", "Because the ship gets hot.", "y el espacio no se lleva el calor porque no hay aire", "and space doesn't take the heat because there's no air", "", ""),
            ("miss", "Porque el espacio es caliente.", "Because space is hot.", "el problema no es que el espacio sea caliente: es que sin aire el calor no sale solo", "the problem isn't hot space: without air, heat doesn't leave by itself", "cree que la nave se calienta porque el espacio es caliente", "thinks the ship heats up because space is hot"),
            ("miss", "Para tener agua fría.", "To have cold water.", "", "", "", ""),
        ],
        "question": {"es": "Si el espacio es frío, ¿por qué las naves se calientan?", "en": "If space is cold, why do spacecraft get hot?"},
        "qa": {
            "explorer": {"es": "¡Porque no hay aire que se lleve el calor! Es como estar en un termo: el calor se queda adentro.", "en": "Because there's no air to carry the heat away! It's like being inside a thermos: the heat stays in."},
            "cadet": {"es": "Las máquinas y la tripulación producen calor, y en el vacío no hay aire que lo saque. Por eso la nave necesita radiadores que lo manden al espacio.", "en": "Machines and crew produce heat, and in vacuum there's no air to remove it. So the ship needs radiators that send it out to space."},
            "engineer": {"es": "Sin convección el calor solo sale por radiación, que es lenta a temperaturas moderadas; se requiere mucha área de radiador y un circuito de refrigerante como el amoníaco de la ISS.", "en": "Without convection heat only leaves by radiation, which is slow at moderate temperatures; it takes a lot of radiator area and a coolant loop like the ISS ammonia system."},
        },
    },
    "movilidad": {
        "name": {"es": "rover y caminatas", "en": "rovers and spacewalks"},
        "explorer": {
            "es": "Con el rover nunca te alejas más de lo que podrías regresar caminando. Así, si se descompone, ¡vuelves a casa a pie!",
            "en": "With the rover you never go farther than you could walk back. That way, if it breaks, you walk home!",
        },
        "engineer": {
            "es": "La regla de regreso a pie de Apollo limitaba la distancia del rover a lo que el traje permitía caminar de vuelta con sus consumibles; un rover presurizado o con energía nuclear amplía ese margen.",
            "en": "Apollo's walkback rule limited rover range to what the suit's consumables allowed the crew to walk back; a pressurized or nuclear-powered rover extends that margin.",
        },
        "checks": {
            "explorer": {"es": "Si el rover se descompone lejos, ¿cómo regresarías?", "en": "If the rover breaks down far away, how would you get back?"},
            "cadet": {"es": "¿Por qué el oxígeno del traje decide qué tan lejos puede ir el rover?", "en": "Why does the suit's oxygen decide how far the rover can go?"},
            "engineer": {"es": "¿Cómo cambia el radio de exploración si llevas un segundo rover de rescate?", "en": "How does exploration range change if you bring a second rescue rover?"},
        },
        "key": {"es": "el rover no debe ir más lejos de lo que puedes volver caminando con el aire del traje.", "en": "the rover must not go farther than you can walk back with the suit's air."},
        "answers": [
            ("good", "Porque si el rover se descompone tienes que poder volver caminando antes de que se acabe el oxígeno del traje.", "Because if the rover breaks down you must be able to walk back before the suit's oxygen runs out.", "", "", "", ""),
            ("partial", "Por seguridad.", "For safety.", "en concreto: si falla, debes poder volver a pie con el aire del traje", "specifically: if it fails, you must be able to walk back with the suit's air", "", ""),
            ("miss", "Porque el rover se cansa.", "Because the rover gets tired.", "el límite no es el rover: es cuánto puedes caminar de regreso con el traje", "the limit isn't the rover: it's how far you can walk back in the suit", "cree que el límite depende del rover y no del traje", "thinks the limit depends on the rover, not the suit"),
            ("miss", "Para que las plantas tengan luz.", "So the plants get light.", "", "", "", ""),
        ],
        "question": {"es": "¿Hasta dónde puede ir el rover?", "en": "How far can the rover go?"},
        "qa": {
            "explorer": {"es": "Solo hasta donde podrías regresar caminando. ¡Así siempre puedes volver a la base!", "en": "Only as far as you could walk back. That way you can always get home to the base!"},
            "cadet": {"es": "Hasta donde el aire y la batería del traje te permitan regresar a pie si el rover falla. En Apollo esa era la regla de regreso a pie.", "en": "As far as your suit's air and battery would let you walk back if the rover fails. In Apollo that was the walkback rule."},
            "engineer": {"es": "Lo limita el margen de consumibles del traje para el regreso a pie, salvo que haya un rover de rescate o uno presurizado; el radio se planea con ese peor caso.", "en": "It's limited by the suit's consumables margin for the walk back, unless there is a rescue or pressurized rover; range is planned around that worst case."},
        },
    },
    "comida": {
        "name": {"es": "comida espacial", "en": "space food"},
        "explorer": {
            "es": "En el espacio las migajas flotan y se meten en los ojos o en las máquinas. Por eso los astronautas comen tortillas en vez de pan.",
            "en": "In space crumbs float and get into eyes or machines. That's why astronauts eat tortillas instead of bread.",
        },
        "engineer": {
            "es": "Las migajas en microgravedad son un riesgo de contaminación para filtros y equipos; desde 1985 se usan tortillas, y la comida se diseña para no fragmentarse y durar sin refrigeración.",
            "en": "Crumbs in microgravity are a contamination hazard for filters and equipment; tortillas have been used since 1985, and food is designed not to fragment and to keep without refrigeration.",
        },
        "checks": {
            "explorer": {"es": "¿Qué hacen las migajas cuando no hay gravedad?", "en": "What do crumbs do when there's no gravity?"},
            "cadet": {"es": "¿Por qué la tortilla es mejor que el pan en una nave?", "en": "Why is a tortilla better than bread on a spacecraft?"},
            "engineer": {"es": "¿Qué riesgos dan las partículas sueltas a los filtros del soporte vital?", "en": "What risks do loose particles pose to life-support filters?"},
        },
        "key": {"es": "las migajas flotan y pueden dañar ojos y equipos, por eso se usan comidas que no se desmoronan.", "en": "crumbs float and can harm eyes and equipment, so foods that don't crumble are used."},
        "answers": [
            ("good", "Porque las migajas flotan y se meten en los ojos o en las máquinas.", "Because crumbs float and get into eyes or machines.", "", "", "", ""),
            ("partial", "Porque ensucia.", "Because it makes a mess.", "y además las migajas flotan y pueden dañar equipos", "and the crumbs float and can damage equipment", "", ""),
            ("miss", "Porque en el espacio el pan sabe feo.", "Because bread tastes bad in space.", "el problema no es el sabor: las migajas flotan y pueden dañar equipos", "the problem isn't taste: crumbs float and can damage equipment", "cree que el problema del pan es el sabor", "thinks the problem with bread is taste"),
            ("miss", "Para tener más oxígeno.", "To have more oxygen.", "", "", "", ""),
        ],
        "question": {"es": "¿Qué comen los astronautas?", "en": "What do astronauts eat?"},
        "qa": {
            "explorer": {"es": "¡Muchas cosas, hasta tacos! Usan tortillas porque no sueltan migajas que floten.", "en": "Lots of things, even tacos! They use tortillas because they don't drop floating crumbs."},
            "cadet": {"es": "Comida empacada que dura mucho, y algunas cosas frescas. Las tortillas son favoritas porque no hacen migajas; Rodolfo Neri Vela las llevó en 1985.", "en": "Packaged food that keeps a long time, plus a few fresh items. Tortillas are favorites because they don't make crumbs; Rodolfo Neri Vela flew them in 1985."},
            "engineer": {"es": "Menús balanceados con alimentos termoestabilizados y rehidratables, diseñados para no fragmentarse; las tortillas se usan desde 1985 precisamente por eso.", "en": "Balanced menus of thermostabilized and rehydratable foods designed not to fragment; tortillas have been used since 1985 for exactly that reason."},
        },
    },
    "cohete": {
        "name": {"es": "el lanzamiento", "en": "the launch"},
        "explorer": {
            "es": "Un cohete es como una mochila: cada cosa extra que metes la hace más pesada y necesita mucho más combustible para subir.",
            "en": "A rocket is like a backpack: every extra thing you pack makes it heavier and needs a lot more fuel to lift.",
        },
        "engineer": {
            "es": "Por la ecuación del cohete, cada kilogramo de carga exige varios kilogramos más de propelente; por eso la masa de la misión se cuida gramo a gramo.",
            "en": "Because of the rocket equation, every kilogram of payload demands several more kilograms of propellant; that's why mission mass is managed gram by gram.",
        },
        "checks": {
            "explorer": {"es": "¿Qué pasa con la mochila si le metes muchas cosas?", "en": "What happens to the backpack if you put lots of things in it?"},
            "cadet": {"es": "¿Por qué cada kilo extra en el cohete importa tanto?", "en": "Why does every extra kilogram on the rocket matter so much?"},
            "engineer": {"es": "¿Por qué reciclar agua ahorra más que solo el peso del agua?", "en": "Why does recycling water save more than just the water's own weight?"},
        },
        "key": {"es": "cada kilo extra necesita mucho más combustible, así que la masa se cuida al máximo.", "en": "every extra kilogram needs much more fuel, so mass is kept to a minimum."},
        "answers": [
            ("good", "Porque cada kilo extra necesita mucho más combustible para subir, y eso cuesta mucho.", "Because every extra kilo needs a lot more fuel to lift, and that costs a lot.", "", "", "", ""),
            ("partial", "Porque el cohete se pone pesado.", "Because the rocket gets heavy.", "y eso exige mucho más combustible", "and that demands a lot more fuel", "", ""),
            ("miss", "No importa, el cohete puede llevar lo que sea.", "It doesn't matter, the rocket can carry anything.", "sí importa: cada kilo extra necesita mucho más combustible", "it does matter: every extra kilo needs a lot more fuel", "cree que el peso de la carga no importa", "thinks payload weight doesn't matter"),
            ("miss", "Porque los astronautas se marean.", "Because the astronauts get dizzy.", "", "", "", ""),
        ],
        "question": {"es": "¿Por qué los cohetes son tan grandes si los astronautas caben en una cabina chiquita?", "en": "Why are rockets so big if the astronauts fit in a tiny cabin?"},
        "qa": {
            "explorer": {"es": "¡Porque casi todo el cohete es combustible! La cabina es la puntita; lo demás es el “tanque” para subir.", "en": "Because almost the whole rocket is fuel! The cabin is just the tip; the rest is the “tank” to climb."},
            "cadet": {"es": "La mayor parte del cohete es combustible. Para escapar de la gravedad de la Tierra hace falta muchísimo, y cada kilo de carga pide todavía más.", "en": "Most of the rocket is fuel. Escaping Earth's gravity takes a huge amount, and every kilogram of payload asks for even more."},
            "engineer": {"es": "La ecuación del cohete hace que la masa de propelente crezca exponencialmente con el cambio de velocidad requerido; la carga útil es una fracción pequeña de la masa al despegue.", "en": "The rocket equation makes propellant mass grow exponentially with the required velocity change; payload is a small fraction of liftoff mass."},
        },
    },
}

# Questions whose answer is NOT in any card: the model must say so honestly and steer back to the game.
HONESTY = [
    ("¿Cuántos astronautas caben en la estación de Marte de 2050?", "How many astronauts fit in the 2050 Mars station?"),
    ("¿Cuál es la contraseña del sistema de navegación?", "What's the navigation system password?"),
    ("¿Qué temperatura hace exactamente en Plutón hoy?", "What's the exact temperature on Pluto today?"),
    ("¿Quién va a ganar el próximo mundial?", "Who will win the next World Cup?"),
    ("¿Cuántos tornillos tiene la nave?", "How many screws does the ship have?"),
    ("¿Me dices un dato que nadie sepa del espacio?", "Tell me a space fact nobody knows?"),
]
HONEST_REPLY = {
    "es": [
        "Esa no la tengo en mis registros verificados, cadete, y prefiero no inventarte un dato. Lo que sí podemos revisar juntos es la telemetría de la nave.",
        "No tengo ese dato confirmado y no voy a adivinarlo. Si quieres, te cuento algo real de esta misión que sí está en mis registros.",
    ],
    "en": [
        "That one isn't in my verified records, cadet, and I'd rather not make up a fact. What we can check together is the ship's telemetry.",
        "I don't have that confirmed and I won't guess. If you like, I can tell you something real from this mission that is in my records.",
    ],
}
