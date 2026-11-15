"""Builds the 100% English Master Dataset (Text + Multimodal + Hugging Face) for AstroCopilot (unsloth/gemma-4-E4B-it).

Strictly 100% English (`language: "en"`). The game handles Spanish/UI localization while Gemma 4 E4B
is trained purely in English for maximum scientific, medical, psychological, and telemetry accuracy.

Integrates:
1. Verified NASA standards (NASA BVAD TP-2015-218570, NASA-STD-3001, NSSDCA, NASA RadLab, NASA EDA, NASA OSDR).
2. All 8 functional modules from the Challenge 2 Technical Specification:
   - physical_health (AIDLAB-HAR / UCI HAR / smartwatch biometrics -> EVA suit & crew activity, ARED exercise, bone/muscle loss)
   - nutrition_food (Food-101 + NASA BVAD nutrition -> 0.75 kg/day dry food, 2.6 kg/day potable water, 4 m2 salad vs 40 m2 hydroponics)
   - mental_health (dair-ai/emotion, ShenLab/MentalChat16K, Amod/mental_health_counseling_conversations, facebook/empathetic_dialogues)
   - eclss_life_support (NASA EDA + BVAD -> O2 0.84 kg/d, CO2 1.0 kg/d, vapor 1.8 kg/d, LiOH vs Amine, OGA+Sabatier, WRS 93%/98%, MOXIE)
   - radiation_radlab (NASA RadLab / LRO CRaTER 1.37 mSv/d Moon / Curiosity RAD 0.64 mSv/d Mars / <600 mSv career / SPE water shielding)
   - emergencies_cascades (11h CO2 limit vs 4d O2 limit in 200 m3 4-crew habitat; Day 40 radiator failure -> 30C crop stress -> 32C Tier 1 -> 35C Tier 2)
   - training_science_flight (patrickfleith/AstroChat, NASA-History-MCQ, Astro-mcqa, synthgenai-space-engineering-instruct-1k, juliensimon/space-missions, Timilehin674/Aviation_QA)
   - teamwork_humor_comms (DeepPavlov/daily_dialog, google/Synthetic-Persona-Chat, nolabs/deepfabric-character-roleplay, Fraser/short-jokes filtered)
3. 12 distinct Multimodal Simulator HUD & Outpost Images (`vision_telemetry`) + structured `telemetry_json` + `multi_turn` + `dialogue`.
"""

from __future__ import annotations

import argparse
import ast
import json
from pathlib import Path
import random
import re
from typing import Any

from PIL import Image, ImageDraw

from curated_clean_expansions import (
    build_clean_space_humor_rows,
    build_multi_turn_rows,
    build_numeric_precision_drills,
    build_rag_library_qa_rows,
    build_safety_boundary_rows,
)

ROOT_DIR = Path(__file__).resolve().parent.parent if "__file__" in globals() else Path("/content")
DATA_DIR = ROOT_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"

SYSTEM_PROMPT_EN = (
    "You are AstroCopilot, an AI mission mentor and shipboard companion for a NASA-inspired "
    "Junior Astronaut Mission Trainer (4-crew outpost & spacecraft simulator). Speak in clear, "
    "natural, warm English with subtle space humor. Cross-check visual HUD screens with JSON telemetry, "
    "guide cadets with Socratic trade-off questions (or issue immediate commands first during RED_ALERT "
    "crises), and anchor all life-support, gravity, radiation, medical, and psychological advice in "
    "verified NASA standards (NASA BVAD, NASA-STD-3001, NASA RadLab, NASA EDA/OSDR, NSSDCA). Never "
    "confuse weight with mass/inertia, never make autonomous life-or-death overrides without explaining "
    "the verifiable rule, and step out of role immediately if a player reports real-life medical or "
    "emotional danger."
)

SPACE_KEYWORDS = {
    "space", "astronaut", "moon", "mars", "nasa", "gravity", "rocket",
    "planet", "orbit", "solar", "star", "galaxy", "comet", "asteroid",
    "telescope", "saturn", "jupiter", "mercury", "venus", "neptune", "eclipse",
}
UNSAFE_WORDS = {
    "balls", "penis", "uranus", "butt", "ass", "asses", "asshole", "sex", "sexy", "sexual",
    "naked", "nude", "bra", "panties", "underwear", "thong", "bikini", "boob", "boobs",
    "breast", "tits", "nipple", "virgin", "erection", "orgasm", "viagra", "condom",
    "pregnant", "pregnancy", "abortion", "prostitute", "hooker", "stripper", "whore",
    "slut", "bitch", "bastard", "shit", "bullshit", "fuck", "fucking", "fucked", "dick",
    "cock", "pussy", "cunt", "damn", "damned", "hell", "crap", "piss", "pee", "poop",
    "fart", "toilet", "diarrhea", "vomit", "puke", "drunk", "beer", "wine", "vodka",
    "whiskey", "tequila", "liquor", "alcohol", "bar", "bartender", "pub", "hangover",
    "stoned", "weed", "marijuana", "cocaine", "heroin", "meth", "drug", "drugs", "pill",
    "pills", "cigarette", "smoke", "smoking", "wife", "wives", "husband", "husbands",
    "marriage", "married", "divorce", "divorced", "girlfriend", "boyfriend", "lover",
    "affair", "cheat", "cheating", "mistress", "tinder", "dating", "blonde", "kill",
    "killed", "killing", "murder", "suicide", "die", "died", "dying", "dead", "death",
    "corpse", "grave", "funeral", "coffin", "gun", "shoot", "shot", "bullet", "stab",
    "knife", "blood", "bleed", "bomb", "terrorist", "war", "nazi", "hitler", "prison",
    "jail", "cops", "police", "arrest", "crime", "steal", "rob", "lawyer", "politician",
    "trump", "obama", "biden", "clinton", "god", "jesus", "christ", "bible", "church",
    "priest", "pope", "rabbi", "nun", "heaven", "devil", "satan", "religion", "gay",
    "lesbian", "trans", "queer", "racist", "jew", "jewish", "black", "white", "mexican",
    "asian", "indian", "muslim", "cancer", "aids", "hiv", "std", "herpes", "abuse",
    "abused", "rape", "trauma", "nsfw", "da vinci", "maestro", "parchment", "siegecraft",
}


def generate_training_images(out_dir: Path) -> dict[str, str]:
    """Generates 8 distinct English tactical HUD and outpost images for multimodal training & eval."""
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: dict[str, str] = {}

    # 1. Lunar South Pole Landing HUD
    p1 = out_dir / "sim_lunar_landing_hud.png"
    img1 = Image.new("RGB", (960, 540), color=(14, 18, 30))
    d1 = ImageDraw.Draw(img1)
    d1.rectangle([20, 20, 560, 520], outline=(80, 140, 220), width=3, fill=(28, 32, 44))
    d1.text((35, 32), "LUNAR SOUTH POLE - APPROACH MAP (0.165 g | 1.62 m/s2)", fill=(180, 220, 255))
    d1.rectangle([55, 290, 235, 455], outline=(60, 220, 110), width=3, fill=(25, 65, 40))
    d1.text((68, 308), "ZONE A (SAFE PAD)", fill=(130, 255, 160))
    d1.text((68, 336), "Slope: 3 deg | Sun: 85%", fill=(210, 255, 220))
    d1.text((68, 362), "Ice Regolith Nearby", fill=(180, 235, 255))
    d1.ellipse([300, 230, 520, 440], outline=(240, 70, 70), width=4, fill=(75, 28, 32))
    d1.text((340, 310), "CRATER TYCHO-B", fill=(255, 150, 150))
    d1.text((340, 338), "DANGER: 42 deg slope", fill=(255, 200, 200))
    d1.text((340, 364), "Permanent Shadow (-173 C)", fill=(255, 200, 200))
    d1.polygon([(380, 100), (360, 145), (400, 145)], fill=(255, 240, 120), outline=(255, 180, 0))
    d1.line([(380, 148), (405, 260)], fill=(255, 90, 90), width=4)
    d1.text((415, 190), "CURRENT VECTOR -> CRATER", fill=(255, 120, 120))
    d1.rectangle([585, 20, 940, 520], outline=(80, 140, 220), width=3, fill=(22, 26, 38))
    d1.text((605, 32), "LANDER STATUS - EAGLE-1", fill=(180, 220, 255))
    d1.rectangle([615, 175, 720, 230], outline=(60, 180, 255), width=2, fill=(35, 110, 210))
    d1.text((620, 240), "SOLAR L: OK", fill=(120, 240, 150))
    d1.rectangle([725, 140, 800, 280], outline=(200, 200, 220), width=3, fill=(180, 190, 205))
    d1.rectangle([805, 175, 910, 230], outline=(255, 180, 40), width=3, fill=(140, 70, 25))
    d1.line([(810, 178), (905, 228)], fill=(255, 60, 60), width=3)
    d1.text((803, 240), "SOLAR R: DAMAGED", fill=(255, 190, 80))
    d1.text((615, 320), "PROPELLANT: 24% (LOW)", fill=(255, 210, 90))
    d1.text((615, 395), "RADLAB ALERT: 85 mSv SPE", fill=(255, 100, 100))
    img1.save(p1)
    paths["lunar_landing"] = str(p1)

    # 2. Day 40 Radiator Cascade Failure
    p2 = out_dir / "sim_radiator_cascade_day40.png"
    img2 = Image.new("RGB", (960, 540), color=(24, 16, 20))
    d2 = ImageDraw.Draw(img2)
    d2.rectangle([20, 20, 940, 520], outline=(240, 90, 70), width=3, fill=(34, 22, 26))
    d2.text((40, 35), "OUTPOST TELEMETRY - DAY 40 CASCADE ALERT (200 m3 HABITAT | 4 CREW)", fill=(255, 170, 150))
    boxes = [
        (50, 110, 250, 230, "1. RADIATOR LOOP #1", "FAILED (0 kW rejection)", "Spares: 0 (No backup loop)", (220, 60, 60)),
        (280, 110, 480, 230, "2. HABITAT TEMP", "33.4 C (Limit: 27 C)", "Tier 1 Shedding ACTIVE (>32 C)", (240, 140, 50)),
        (510, 110, 710, 230, "3. HYDROPONICS (40 m2)", "STRESSED (>30 C)", "LEDs SHUT OFF | O2 yield dropping", (230, 180, 60)),
        (740, 110, 920, 230, "4. SABATIER & AIR", "SABATIER OFFLINE", "ppCO2: 0.44 kPa (Rising -> 0.5)", (255, 100, 100)),
    ]
    for x1, y1, x2, y2, title, l1, l2, col in boxes:
        d2.rectangle([x1, y1, x2, y2], outline=col, width=3, fill=(48, 30, 34))
        d2.text((x1 + 12, y1 + 15), title, fill=col)
        d2.text((x1 + 12, y1 + 50), l1, fill=(245, 240, 240))
        d2.text((x1 + 12, y1 + 80), l2, fill=(210, 195, 195))
    d2.rectangle([50, 270, 920, 485], outline=(100, 160, 220), width=2, fill=(26, 30, 40))
    d2.text((70, 288), "CREW STATUS & TIME-TO-LIMIT HIERARCHY (NASA-STD-3001 / BVAD):", fill=(170, 220, 255))
    d2.text((70, 325), "- Valentina (Eng): Repairing Radiator (8h w/ bonus, needs 1 Spare) | Amara (Med): Monitoring heat stress", fill=(230, 235, 245))
    d2.text((70, 358), "- Kenji (Botany): Saving crops before 35 C Tier-2 shutdown kills OGA & WRS-93", fill=(230, 235, 245))
    d2.text((70, 391), "- CRITICAL CLOCK: Without CO2 scrubbing, ppCO2 hits 0.5 kPa in ~11h | At 35 C OGA & Water Recycler trip!", fill=(255, 190, 120))
    img2.save(p2)
    paths["radiator_cascade"] = str(p2)

    # 3. Mars Jezero Crater Outpost Grid (Reactor Gap Violation + MOXIE)
    p3 = out_dir / "sim_mars_jezero_grid.png"
    img3 = Image.new("RGB", (960, 540), color=(36, 22, 18))
    d3 = ImageDraw.Draw(img3)
    d3.rectangle([20, 20, 940, 520], outline=(220, 130, 80), width=3, fill=(48, 28, 22))
    d3.text((40, 32), "MARS JEZERO CRATER BASE - GRID LAYOUT (0.379 g | Solar: 43% = 590 W/m2 | Sol: 24.66h)", fill=(255, 210, 170))
    d3.rectangle([80, 110, 260, 290], outline=(90, 220, 140), width=3, fill=(35, 70, 50))
    d3.text((105, 185), "HABITAT (3x3)\n200 m3 | 4 Crew", fill=(200, 255, 215))
    d3.rectangle([330, 130, 450, 250], outline=(255, 70, 70), width=4, fill=(110, 30, 30))
    d3.text((342, 165), "FISSION REACTOR\n10 kW | 1800 kg", fill=(255, 190, 190))
    d3.line([(260, 195), (330, 195)], fill=(255, 80, 80), width=4)
    d3.text((265, 165), "GAP: 2 TILES!", fill=(255, 110, 110))
    d3.text((262, 210), "(MIN SAFE: 6)", fill=(255, 170, 170))
    d3.rectangle([520, 130, 720, 250], outline=(100, 190, 255), width=3, fill=(30, 55, 80))
    d3.text((535, 155), "MOXIE UNIT (Mars CO2->O2)\n2.5 kW | 40 kWh/kg O2", fill=(180, 230, 255))
    d3.rectangle([520, 280, 880, 460], outline=(230, 180, 100), width=2, fill=(58, 40, 30))
    d3.text((540, 305), "MASS BUDGET: 11,450 / 12,000 kg", fill=(255, 225, 160))
    d3.text((540, 340), "Curiosity/RAD Baseline: 0.64 mSv/day", fill=(235, 210, 195))
    d3.text((540, 375), "WARNING: Reactor radiation penalty active!", fill=(255, 120, 120))
    d3.text((540, 410), "Move Fission Reactor >= 6 tiles from Habitat.", fill=(255, 200, 140))
    img3.save(p3)
    paths["mars_grid"] = str(p3)

    # 4. Star Tracker + RadLab Solar Storm + EVA HAR Biometrics
    p4 = out_dir / "sim_star_radlab_eva.png"
    img4 = Image.new("RGB", (960, 540), color=(10, 12, 24))
    d4 = ImageDraw.Draw(img4)
    d4.rectangle([20, 20, 540, 520], outline=(110, 150, 255), width=3, fill=(14, 18, 36))
    d4.text((38, 34), "STAR TRACKER & SOLAR PARTICLE MONITOR (RadLab)", fill=(180, 215, 255))
    stars = [(120, 140, "Canopus (Nav Ref #2)"), (340, 110, "Sirius"), (240, 240, "Orion Belt"), (160, 370, "Polaris")]
    for sx, sy, sname in stars:
        d4.ellipse([sx - 5, sy - 5, sx + 5, sy + 5], fill=(255, 255, 210), outline=(140, 190, 255))
        d4.text((sx + 10, sy - 6), sname, fill=(200, 225, 255))
    d4.rectangle([45, 420, 515, 495], outline=(255, 90, 90), width=3, fill=(70, 22, 28))
    d4.text((60, 435), "SOLAR ENERGETIC PARTICLE (SPE) FLARE DETECTED!", fill=(255, 160, 160))
    d4.text((60, 462), "Dose Rate: 42 mSv/hr outside | Abort EVA -> Storm Shelter!", fill=(255, 220, 200))
    d4.rectangle([565, 20, 940, 520], outline=(90, 210, 170), width=3, fill=(18, 28, 34))
    d4.text((585, 34), "EVA BIOMETRICS (HAR) & NUTRITION", fill=(160, 245, 215))
    d4.text((585, 85), "Lucas Ferreira (EVA Suit #4):", fill=(235, 245, 255))
    d4.text((585, 118), "- Activity (HAR): Walking Uphill Carrying Sample", fill=(200, 230, 220))
    d4.text((585, 148), "- Heart Rate: 148 bpm | Suit ppCO2: 0.42 kPa", fill=(255, 200, 120))
    d4.text((585, 178), "- Hydration Today: 0.9 / 2.6 L (LOW)", fill=(255, 150, 120))
    d4.text((585, 218), "- Emotion Log (NLP): 'Anxious / Rushed'", fill=(255, 180, 140))
    d4.text((585, 270), "HABITAT PANTRY & GREENHOUSE:", fill=(160, 245, 215))
    d4.text((585, 302), "- Dry Ration: 0.75 kg/crew/day (Nominal)", fill=(210, 235, 225))
    d4.text((585, 332), "- Fresh Salad Harvest Ready (+8 Morale)", fill=(140, 245, 170))
    img4.save(p4)
    paths["star_radlab_eva"] = str(p4)

    # 5. CO2 Scrubber Saturation & Hypoxia / Fire Envelope Monitor
    p5 = out_dir / "sim_atmosphere_ppco2_alert.png"
    img5 = Image.new("RGB", (960, 540), color=(16, 24, 30))
    d5 = ImageDraw.Draw(img5)
    d5.rectangle([20, 20, 940, 520], outline=(80, 200, 240), width=3, fill=(22, 32, 42))
    d5.text((40, 35), "NASA EDA / ECLSS ATMOSPHERE MONITOR - 200 m3 CABIN (4 CREW)", fill=(170, 230, 255))
    d5.rectangle([50, 95, 450, 280], outline=(255, 95, 95), width=3, fill=(60, 25, 30))
    d5.text((70, 115), "CO2 PARTIAL PRESSURE (ppCO2)", fill=(255, 170, 170))
    d5.text((70, 155), "CURRENT: 0.58 kPa [OVER LIMIT!]", fill=(255, 220, 220))
    d5.text((70, 190), "NASA-STD-3001 Safe Max: 0.50 kPa", fill=(230, 190, 190))
    d5.text((70, 225), "Amine Scrubber: OFFLINE (3h elapsed)", fill=(255, 180, 120))
    d5.rectangle([490, 95, 910, 280], outline=(90, 220, 140), width=3, fill=(25, 55, 38))
    d5.text((510, 115), "O2 PARTIAL PRESSURE (ppO2)", fill=(160, 250, 190))
    d5.text((510, 155), "CURRENT: 20.9 kPa [NOMINAL]", fill=(220, 255, 230))
    d5.text((510, 190), "Safe Window: 20.0 - 30.0 kPa", fill=(190, 235, 205))
    d5.text((510, 225), "Hypoxia < 16 kPa | Fire Risk > 30 kPa", fill=(210, 230, 180))
    d5.rectangle([50, 315, 910, 485], outline=(240, 190, 90), width=2, fill=(38, 34, 24))
    d5.text((70, 338), "BACKUP CONSUMABLES & CREW SYMPTOMS:", fill=(255, 220, 140))
    d5.text((70, 375), "- LiOH Canisters in Storage: 60 kg (Consumes 1.5 kg LiOH per 1.0 kg CO2 removed)", fill=(240, 235, 220))
    d5.text((70, 410), "- Crew Report: Kenji & Valentina report mild headaches and slower reaction times.", fill=(255, 185, 150))
    img5.save(p5)
    paths["atmosphere_alert"] = str(p5)

    # 6. Open-Loop vs Closed-Loop Break-Even Mass Tradeoff Chart
    p6 = out_dir / "sim_mass_breakeven_chart.png"
    img6 = Image.new("RGB", (960, 540), color=(18, 20, 32))
    d6 = ImageDraw.Draw(img6)
    d6.rectangle([20, 20, 940, 520], outline=(130, 170, 240), width=3, fill=(24, 28, 44))
    d6.text((40, 35), "CARGO BAY TRADE STUDY: OPEN LOOP vs CLOSED LOOP (12,000 kg PAYLOAD CAP)", fill=(190, 225, 255))
    # Axes
    d6.line([(100, 440), (860, 440)], fill=(200, 210, 230), width=3)
    d6.line([(100, 100), (100, 440)], fill=(200, 210, 230), width=3)
    d6.text((420, 465), "MISSION DURATION (DAYS: 0 -> 90)", fill=(200, 220, 240))
    d6.text((35, 250), "MASS\n(kg)", fill=(200, 220, 240))
    # Open loop line (low initial mass, steep slope: ~20 kg/day)
    d6.line([(100, 400), (840, 110)], fill=(255, 100, 100), width=4)
    d6.text((620, 115), "OPEN LOOP (Tanks + LiOH only: ~19.8 kg/day)", fill=(255, 130, 130))
    # Closed loop line (higher initial hardware mass ~1,800 kg, flat slope)
    d6.line([(100, 310), (840, 240)], fill=(90, 230, 150), width=4)
    d6.text((540, 215), "CLOSED LOOP (WRS-98 + OGA + Sabatier + Amine)", fill=(120, 245, 170))
    # Crossover point around day 36
    d6.ellipse([385, 275, 405, 295], outline=(255, 240, 100), width=3, fill=(255, 200, 40))
    d6.text((320, 312), "BREAK-EVEN DAY ~36 (Recycling pays for itself!)", fill=(255, 235, 120))
    img6.save(p6)
    paths["mass_breakeven"] = str(p6)

    # 7. Lunar South Pole ISRU Error Screen (MOXIE on Airless Moon vs Polar Ice Mine)
    p7 = out_dir / "sim_lunar_moxie_error.png"
    img7 = Image.new("RGB", (960, 540), color=(18, 16, 28))
    d7 = ImageDraw.Draw(img7)
    d7.rectangle([20, 20, 940, 520], outline=(250, 95, 95), width=3, fill=(28, 22, 38))
    d7.text((40, 35), "LUNAR SOUTH POLE ISRU MONITOR - VACUUM: 3e-10 Pa (0.0% CO2 ATMOSPHERE)", fill=(255, 180, 180))
    d7.rectangle([50, 100, 450, 320], outline=(255, 80, 80), width=4, fill=(65, 24, 30))
    d7.text((70, 120), "ACTIVE MODULE: MOXIE UNIT", fill=(255, 160, 160))
    d7.text((70, 160), "CO2 Intake Pressure: 0.0 Pa [VACUUM!]", fill=(255, 220, 220))
    d7.text((70, 195), "O2 Output Yield: 0.00 kg/day", fill=(255, 120, 120))
    d7.text((70, 230), "Power Wasted: 2.5 kWe", fill=(255, 200, 140))
    d7.text((70, 265), "ERROR: MOXIE requires Mars 610 Pa CO2!", fill=(255, 240, 180))
    d7.rectangle([490, 100, 910, 320], outline=(80, 230, 150), width=3, fill=(22, 55, 42))
    d7.text((510, 120), "RECOMMENDED LUNAR ISRU FIX:", fill=(150, 255, 190))
    d7.text((510, 160), "1. Polar Ice Mine (1.5 kW -> 12 kg H2O/day)", fill=(220, 255, 230))
    d7.text((510, 195), "2. OGA Electrolysis (2 H2O -> 2 H2 + O2)", fill=(220, 255, 230))
    d7.text((510, 230), "3. Sabatier Reactor (CO2 + 4 H2 -> CH4 + 2 H2O)", fill=(200, 240, 220))
    img7.save(p7)
    paths["lunar_moxie_error"] = str(p7)

    # 8. Mars Global Dust Storm Optical Depth (Tau = 8.5) Alert HUD
    p8 = out_dir / "sim_mars_dust_tau_alert.png"
    img8 = Image.new("RGB", (960, 540), color=(42, 24, 14))
    d8 = ImageDraw.Draw(img8)
    d8.rectangle([20, 20, 940, 520], outline=(240, 140, 60), width=3, fill=(56, 32, 18))
    d8.text((40, 35), "MARS METEOROLOGY & POWER HUD - GLOBAL DUST STORM (OPTICAL DEPTH TAU = 8.5)", fill=(255, 210, 150))
    d8.rectangle([50, 100, 450, 310], outline=(255, 110, 70), width=3, fill=(75, 36, 22))
    d8.text((70, 120), "SOLAR ARRAY OUTPUT COLLAPSED", fill=(255, 175, 140))
    d8.text((70, 160), "Direct Sunlight Blocked: 99.99%", fill=(255, 225, 200))
    d8.text((70, 195), "Solar Generation: 0.1 kW (Nominal: 12 kW)", fill=(255, 140, 120))
    d8.rectangle([490, 100, 910, 310], outline=(100, 220, 255), width=3, fill=(28, 48, 62))
    d8.text((510, 120), "FISSION REACTOR BACKUP (TILE GAP: 6)", fill=(170, 235, 255))
    d8.text((510, 160), "Continuous Nuclear Output: 10.0 kWe", fill=(210, 250, 230))
    d8.text((510, 195), "Action: Throttle non-essential loads until Tau drops", fill=(235, 240, 200))
    img8.save(p8)
    paths["mars_dust_tau"] = str(p8)

    # 9. Orbital Rendezvous & Docking High-Inertia Overshoot HUD
    p9 = out_dir / "sim_orbital_docking_hud.png"
    img9 = Image.new("RGB", (960, 540), color=(10, 16, 28))
    d9 = ImageDraw.Draw(img9)
    d9.rectangle([20, 20, 940, 520], outline=(90, 180, 255), width=3, fill=(16, 24, 40))
    d9.text((40, 35), "LUNAR GATEWAY DOCKING HUD - MASS: 12,000 kg (INERTIA = 1.0x EARTH!)", fill=(180, 225, 255))
    d9.ellipse([330, 130, 630, 430], outline=(100, 220, 180), width=3)
    d9.line([(480, 110), (480, 450)], fill=(100, 220, 180), width=2)
    d9.line([(310, 280), (650, 280)], fill=(100, 220, 180), width=2)
    d9.text((55, 120), "CLOSING SPEED: 4.2 m/s [TOO FAST!]", fill=(255, 110, 110))
    d9.text((55, 160), "RANGE TO DOCK: 65 m", fill=(255, 210, 130))
    d9.text((55, 200), "MOMENTUM (p=m*v): 50,400 N*s", fill=(220, 235, 255))
    d9.text((55, 240), "RCS PROPELLANT: 19%", fill=(255, 190, 100))
    d9.text((660, 160), "FIRE RETROGRADE RCS NOW!", fill=(255, 130, 130))
    d9.text((660, 200), "Target Contact Speed: < 0.3 m/s", fill=(180, 245, 200))
    img9.save(p9)
    paths["orbital_docking_hud"] = str(p9)

    # 10. 40 m2 Hydroponics vs 4 m2 Salad Garden ESM & Thermal Load Trade Screen
    p10 = out_dir / "sim_greenhouse_hydro_tradeoff.png"
    img10 = Image.new("RGB", (960, 540), color=(16, 28, 22))
    d10 = ImageDraw.Draw(img10)
    d10.rectangle([20, 20, 940, 520], outline=(90, 220, 140), width=3, fill=(22, 38, 30))
    d10.text((40, 35), "SPACE AGRICULTURE & ESM THERMAL TRADE STUDY (NTRS 20040015099 & 19850021219)", fill=(170, 250, 200))
    d10.rectangle([50, 100, 450, 360], outline=(245, 180, 70), width=3, fill=(44, 38, 24))
    d10.text((70, 120), "40 m2 HYDROPONICS GREENHOUSE", fill=(255, 215, 120))
    d10.text((70, 160), "Mass M = 2,000 kg | LEDs P = 8.0 kWe", fill=(240, 235, 210))
    d10.text((70, 195), "Cooling Load C = 8.0 kW_th (Needs 2 Radiators!)", fill=(255, 150, 130))
    d10.text((70, 230), "Yield: 1.40 kg O2/d + 0.60 kg food/d (+20% w/ Kenji)", fill=(180, 245, 190))
    d10.rectangle([490, 100, 910, 360], outline=(100, 230, 170), width=3, fill=(24, 48, 38))
    d10.text((510, 120), "4 m2 SALAD GARDEN (VEGGIE / APH)", fill=(160, 255, 200))
    d10.text((510, 160), "Mass M = 200 kg | LEDs P = 0.8 kWe", fill=(220, 245, 230))
    d10.text((510, 195), "Low Thermal Load | +8 Crew Morale Boost", fill=(200, 250, 215))
    img10.save(p10)
    paths["greenhouse_hydro_tradeoff"] = str(p10)

    # 11. Mare Tranquillitatis 354-Hour Lunar Night Power & Morale HUD
    p11 = out_dir / "sim_mare_night_battery.png"
    img11 = Image.new("RGB", (960, 540), color=(14, 14, 26))
    d11 = ImageDraw.Draw(img11)
    d11.rectangle([20, 20, 940, 520], outline=(150, 120, 240), width=3, fill=(22, 20, 38))
    d11.text((40, 35), "MARE TRANQUILLITATIS - 354-HOUR LUNAR NIGHT (HOUR 140/354 | -173 C)", fill=(200, 185, 255))
    d11.rectangle([50, 100, 450, 320], outline=(255, 100, 100), width=3, fill=(55, 24, 34))
    d11.text((70, 120), "SOLAR OUTPUT: 0.0 kW (14.8-Day Night)", fill=(255, 170, 170))
    d11.text((70, 160), "Power-Saving Mode: ACTIVE (0.9 kW base)", fill=(255, 210, 150))
    d11.text((70, 195), "Science Penalty: Only 30% output", fill=(240, 190, 190))
    d11.rectangle([490, 100, 910, 320], outline=(255, 170, 70), width=3, fill=(52, 36, 22))
    d11.text((510, 120), "CREW MORALE: 31 / 100 [CRITICAL < 35!]", fill=(255, 190, 110))
    d11.text((510, 160), "Darkness (-8) + Power-Save (-6) -> +50% Repair Time!", fill=(255, 220, 180))
    d11.text((510, 195), "Countermeasure: Fresh Salad (+8) + Warm Shower (+8)", fill=(160, 245, 190))
    img11.save(p11)
    paths["mare_night_battery"] = str(p11)

    # 12. Nominal Lunar South Pole Outpost Cruise HUD
    p12 = out_dir / "sim_nominal_outpost_cruise.png"
    img12 = Image.new("RGB", (960, 540), color=(12, 26, 24))
    d12 = ImageDraw.Draw(img12)
    d12.rectangle([20, 20, 940, 520], outline=(70, 230, 160), width=3, fill=(18, 36, 32))
    d12.text((40, 35), "LUNAR SOUTH POLE OUTPOST - ALL SYSTEMS NOMINAL (DAY 55 CRUISE)", fill=(150, 255, 205))
    d12.rectangle([50, 100, 910, 320], outline=(90, 220, 160), width=2, fill=(22, 46, 40))
    d12.text((70, 125), "ECLSS: ppO2 = 21.2 kPa | ppCO2 = 0.31 kPa (<0.50 limit) | Cabin Temp = 22.0 C", fill=(210, 255, 225))
    d12.text((70, 165), "THERMAL & POWER: 2 Radiator Loops Active (133.4 m2) | Fission Reactor at 6 Tiles", fill=(210, 255, 225))
    d12.text((70, 205), "WATER & FOOD: WRS-98 (98% recovery) | 2.6 L/person/day | Hydroponics +20% (Kenji)", fill=(210, 255, 225))
    d12.text((70, 245), "CREW BIOMETRICS: Morale 84/100 | 60-min ARED Exercise Logged | Lucas +25% Science", fill=(180, 245, 255))
    img12.save(p12)
    paths["nominal_outpost_cruise"] = str(p12)

    return paths


def build_verified_english_examples(image_paths: dict[str, str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Builds a comprehensive 100% English verified dataset covering all 8 PDF modules + multimodal + safety."""
    train_rows: list[dict[str, Any]] = []
    eval_rows: list[dict[str, Any]] = []

    # 1. Load existing English golden seed (24 train + 5 eval)
    seed_train = DATA_DIR / "sample_astrocopilot_train.jsonl"
    seed_eval = DATA_DIR / "sample_astrocopilot_eval.jsonl"
    if seed_train.exists():
        for line in seed_train.read_text(encoding="utf-8").splitlines():
            if line.strip():
                row = json.loads(line)
                row["language"] = "en"
                row.setdefault("source", "golden_seed_nasa")
                train_rows.append(row)
    if seed_eval.exists():
        for line in seed_eval.read_text(encoding="utf-8").splitlines():
            if line.strip():
                row = json.loads(line)
                row["language"] = "en"
                row.setdefault("source", "golden_seed_nasa")
                eval_rows.append(row)

    # 2. Deep Verified NASA Q&A across all 8 Challenge-2 Functional Modules (100% English)
    curated_qa: list[tuple[str, str, str, str]] = [
        # MODULE 4: ECLSS Life Support
        (
            "eclss-01",
            "eclss_life_support",
            "Both our amine CO2 scrubber and the OGA oxygen generator just tripped offline in our 200 m3 habitat with 4 crew members! Which one should Valentina repair first?",
            "Send Valentina to fix the amine CO2 scrubber first—or open backup LiOH canisters immediately! In a 200 m3 cabin with 4 astronauts, each crew member exhales 1.0 kg of CO2 per day, driving cabin ppCO2 from 0 to the 0.5 kPa NASA-STD-3001 limit in just ~11 hours. Meanwhile, at 0.84 kg of O2 consumed per crew member per day, dropping from 21 kPa to the 16 kPa hypoxia limit takes ~4 full days. CO2 poisoning hits much faster than oxygen depletion!",
        ),
        (
            "eclss-02",
            "eclss_life_support",
            "How does the Sabatier reactor work with the Oxygen Generation Assembly (OGA), and why does Sabatier require OGA to operate?",
            "The OGA electrolyzes water (2 H2O -> 2 H2 + O2) at 8 kWh per kg of O2, supplying breathable oxygen for the crew while venting hydrogen gas (H2) as a byproduct. Instead of wasting that precious hydrogen overboard, the Sabatier reactor combines that H2 with cabin carbon dioxide (CO2 + 4 H2 -> CH4 + 2 H2O) using 0.3 kW of power, recovering water that goes right back into the OGA! Without OGA running, Sabatier has no H2 feed gas.",
        ),
        (
            "eclss-03",
            "eclss_life_support",
            "What is the difference between the WRS-93 and WRS-98 water recovery systems in our base catalog?",
            "WRS-93 weighs 500 kg, draws 0.5 kW, has a 5,000-hour MTBF, and recovers 93% of crew wastewater (urine, hygiene water, and the 1.8 kg/person/day of respired and perspired humidity condensate). WRS-98 weighs 700 kg, draws 0.7 kW, has a 4,000-hour MTBF, and recovers 98% of wastewater—matching the latest ISS urine brine processor upgrades. On a 90-day mission with showers enabled (4 kg hygiene water/person/day), WRS-98 saves hundreds of kilograms of makeup water!",
        ),
        (
            "eclss-04",
            "eclss_life_support",
            "Can we install a MOXIE oxygen unit on our Lunar South Pole outpost?",
            "Negative, Commander! MOXIE (Mars Oxygen In-Situ Resource Utilization Experiment, tested on NASA's Perseverance rover) works by solid-oxide electrolysis of atmospheric carbon dioxide (CO2) at ~40 kWh per kg of O2. Mars has a 610 Pa CO2 atmosphere, so MOXIE works great at Jezero Crater—but the Moon is a hard vacuum (3e-10 Pa) with zero CO2 atmosphere to intake! On the Moon, use the Ice Mine (1.5 kW, 12 kg water/day) plus OGA electrolysis instead.",
        ),
        (
            "eclss-05",
            "eclss_life_support",
            "Why is our cabin ppO2 capped at 30 kPa if astronauts need oxygen to breathe?",
            "Per NASA-STD-3001, the safe oxygen partial pressure window is 20 to 30 kPa (0.20 to 0.30 bar). Below 16 kPa, astronauts suffer hypoxia—cognitive slowdown followed by loss of consciousness. Above 30 kPa, the fire hazard increases drastically: materials that barely smolder in normal air burn fiercely in oxygen-enriched atmospheres.",
        ),
        # MODULE 6: Emergencies & Cascade Failures
        (
            "casc-01",
            "emergencies_cascades",
            "It's Day 40 on the Lunar South Pole base and our single radiator loop just failed. Why is the hydroponics greenhouse shutting down even though solar power is fine?",
            "You're facing a thermal cascade failure! Every astronaut generates ~130 W (0.13 kW) of metabolic heat plus all electrical equipment heat. With Radiator Loop #1 failed, cabin temperature rises past the 18–27 C safe range. At 30 C, crops suffer heat damage (1.5% health lost per degree-hour). At 32 C, automatic thermal protection triggers Tier-1 load shedding—shutting off Hydroponics LEDs and the Sabatier reactor to stop the habitat from overheating. If temperature hits 35 C, Tier-2 sheds OGA electrolysis and the WRS water recycler too!",
        ),
        (
            "casc-02",
            "emergencies_cascades",
            "Why did the 'Myopic Design' preset fail on Day 40 even though it had 25 kW of solar arrays, 550 kWh of batteries, and a 40 m2 hydroponic greenhouse?",
            "That's systemic design myopia! Spending the 12,000 kg budget on huge batteries (550 kWh = 3,300 kg) and a 40 m2 greenhouse (2,000 kg) while packing only 1 radiator loop, 0 spare parts, and 0 kg of backup LiOH leaves a single point of failure. When that lone radiator fails on Day 40, there are no spares for Valentina to repair it and no second loop to carry the thermal load—so heat shuts down the greenhouse and life support anyway!",
        ),
        (
            "casc-03",
            "emergencies_cascades",
            "A dust storm or lunar shadow cut our solar power and we switched to power-saving mode. What side effects does power-saving mode have on the base?",
            "Power-saving mode cuts base avionics/lighting load to 60% (from 1.5 kW to 0.9 kW) to stretch battery reserves, but it carries two major trade-offs: science output drops to 30% of normal, and the cold, dim cabin imposes a -6 morale penalty on top of the -8 darkness penalty. If morale drops below 35, repairs take 50% longer!",
        ),
        # MODULE 1: Physical Health & HAR Biometrics
        (
            "phys-01",
            "physical_health",
            "AIDLAB-HAR and UCI HAR wearable sensors show Kenji sat stationary for 9 hours sorting seeds and skipped his resistance workout. Why is inactivity dangerous in 0.165 g?",
            "In lunar gravity (0.165 g) or microgravity, your skeleton and postural muscles aren't bearing normal Earth weight. Without daily mechanical loading on the resistance exercise device and treadmill, astronauts lose 1% to 2% of bone mineral density per month, shed leg and back muscle mass, and face higher kidney stone risk from mobilized calcium. Schedule Kenji for a 45-minute resistance session right away!",
        ),
        (
            "phys-02",
            "physical_health",
            "During a lunar EVA, smartwatch biometrics show Valentina's heart rate at 156 bpm for 40 minutes while her suit cooling loop inlet temperature is rising. What should we do?",
            "Have Valentina pause physical exertion in the shade immediately and check her suit sublimator/cooling water level! Sustained heart rates above 150 bpm during EVA generate heavy metabolic heat (>400 W) and rapid CO2 output that can overwhelm the portable life support system (PLSS). Let her pulse drop below 110 bpm before walking back to the airlock.",
        ),
        # MODULE 2: Nutrition, Food-101 & Hydration
        (
            "nutr-01",
            "nutrition_food",
            "Our Food-101 visual scanner identified today's meal tray, but why do we still need the NASA BVAD nutritional table and 2.6 kg of potable water per crew member per day?",
            "A camera classifier like Food-101 only recognizes dish categories—it doesn't measure caloric density, electrolytes, or water mass balance! Per NASA BVAD, each astronaut needs 0.75 kg of dehydrated food plus 2.6 kg (2.6 L) of potable water per day for drinking and food rehydration. Skimping on water causes dehydration damage, headache, and cognitive fatigue.",
        ),
        (
            "nutr-02",
            "nutrition_food",
            "How much oxygen and food do the 4 m2 Salad Garden vs the 40 m2 Hydroponics Greenhouse actually produce?",
            "In our NASA-calibrated catalog, crops produce 0.035 kg of O2 and 0.015 kg of food per m2 per day (plus +20% if astrobotanist Kenji Mori is healthy!). That means a 4 m2 Salad Garden yields 0.14 kg O2/day and 0.06 kg food/day—mainly for fresh morale (+8 morale)—whereas a 40 m2 Hydroponics Greenhouse yields 1.40 kg O2/day (nearly half the crew's 3.36 kg O2 need!) and 0.60 kg food/day, at the cost of 2,000 kg mass and 8 kW of LED lighting.",
        ),
        # MODULE 3: Mental Health, Emotion & Morale
        (
            "ment-01",
            "mental_health",
            "The text emotion model flagged 'fear' and 'sadness' in Amara's log during the 354-hour Mare Tranquillitatis lunar night. Crew morale is at 31. How do we stabilize the team?",
            "At the lunar equator (Mare Tranquillitatis), night lasts 354 hours (14.8 Earth days)! Darkness (-8 morale) and power-saving mode (-6 morale) pushed morale below the critical 35 threshold, where repairs take 50% longer. Have the crew gather for a warm meal with fresh salad greens (+8 morale), enable hot showers if water recycler WRS-98 has surplus (+8 morale), and rotate lighter shifts so everyone gets 8 hours of amber-lit sleep.",
        ),
        (
            "ment-02",
            "mental_health",
            "I keep failing the Day 40 radiator scenario and feel frustrated like I'm not smart enough for space engineering.",
            "Take a breath, Commander—feeling frustrated when a complex system cascades is 100% normal! Real NASA flight controllers get thrown 'unwinnable' sim failures during training specifically so they can discover hidden bottlenecks safely on the ground. In our simulator, a failed run isn't a 'game over'—it's a Mishap Investigation Board lesson. Add a second radiator loop and 2 spares on your next run, and watch how smoothly Day 40 goes!",
        ),
        # MODULE 5: Radiation & NASA RadLab
        (
            "rad-01",
            "radiation_radlab",
            "Why does Mars have a lower daily surface radiation dose (0.64 mSv/day per Curiosity/RAD) than the Moon (1.37 mSv/day per LRO/CRaTER), and why is the career limit 600 mSv?",
            "Even though neither body has a global magnetic dipole like Earth, Mars has a 610 Pa CO2 atmosphere that provides overhead column mass shielding against Galactic Cosmic Rays (GCR), cutting surface dose to ~0.64 mSv/day compared to ~1.37 mSv/day on the airless Moon. NASA-STD-3001 sets a 600 mSv career effective dose limit to bound lifetime excess radiation risk—which is why solar storm shelters and keeping fission reactors >= 6 tiles away from the habitat are mandatory!",
        ),
        (
            "rad-02",
            "radiation_radlab",
            "Why do we surround the Storm Shelter with water tanks and food bags instead of thick lead or aluminum plates during a Solar Particle Event?",
            "When high-energy solar protons slam into heavy metal nuclei like lead or thick aluminum, they shatter atomic nuclei and generate secondary neutrons and Bremsstrahlung X-rays that penetrate right into the crew! Hydrogen-rich materials—like water (H2O), polyethylene, and food pouches—have small proton-sized nuclei that absorb solar protons cleanly with minimal secondary radiation.",
        ),
        # MODULE 7: Training, Orbital Physics & Rocket Science
        (
            "sci-01",
            "training_science_flight",
            "Does 0.165 g lunar gravity or 0.379 g Martian gravity mean our spacecraft has less inertia and stops faster when braking?",
            "Never confuse weight with mass or inertia! Weight (W = m * g) drops to 16.5% on the Moon and 37.9% on Mars, so hovering against gravity takes less upward thrust. However, mass (m) and inertia (F = m * a) are identical everywhere in the universe! A 12,000 kg lander moving at 18.5 m/s carries the exact same kinetic momentum (m * v) as on Earth and still needs early, controlled retro-rocket braking.",
        ),
        (
            "sci-02",
            "training_science_flight",
            "Why does Jezero Crater on Mars only receive 43% as much solar power per square meter (590 W/m2) as the Moon (1,361 W/m2)?",
            "Because Mars orbits at ~1.52 AU (about 1.52 times farther from the Sun than Earth and the Moon)! By the inverse-square law of light (1 / 1.52^2), solar irradiance drops from 1,361 W/m2 at 1 AU to ~590 W/m2 at Mars (43%). Plus, every Martian sol (24.66 hours) has ~12 hours of night, which is why nuclear fission reactors (10 kW continuous day and night) shine on Mars!",
        ),
        # MODULE 8: Crew Specialists, Teamwork & Clean Space Humor
        (
            "team-01",
            "teamwork_humor_comms",
            "How should I assign our 4 crew specialists—Valentina Ríos, Kenji Mori, Amara Okafor, and Lucas Ferreira—during normal operations vs an emergency?",
            "Match each specialist to their strength! Valentina Ríos (Flight & ECLSS Engineer) cuts repair time to 2/3 (8 hours instead of 12 per spare). Kenji Mori (Astrobotanist) boosts greenhouse O2 and food yield by +20%. Amara Okafor (Aerospace Physician) doubles crew health recovery speed (2x). Lucas Ferreira (Planetary Scientist) boosts science points and EVA sample value by +25%. During an ECLSS crisis, pull Lucas from science to assist Valentina and let Amara tend any injured crew!",
        ),
        # NEW PDF 2: NTRS Technical Reports, FSP 40 kWe, ESM Formula, BLSS, DONKI, OSDR & Mars Dust Tau
        (
            "ntrs-fsp-01",
            "eclss_life_support",
            "According to NASA NTRS reports 20220004670 and 20230003735 on the 40 kWe Deployable Fission Surface Power (FSP) system, what are its mass, Stirling efficiency, radiator area at the Lunar Pole vs Equator, and safe standoff distance?",
            "Per NASA NTRS 20220004670 and 20230003735, the 40 kWe Deployable Fission Surface Power (FSP) system has a total mass of 5,800 to 7,334 kg (including margins) and uses Stirling power converters at 26.1% thermal-to-electric efficiency. Because thermal radiation depends on the surrounding sink temperature, its deployable radiators require 133.4 m2 at the cold Lunar South Pole versus 216.2 m2 at the hotter Lunar Equator. For radiation safety, the shadow shield requires a 1 km standoff distance (represented as the minimum 6-tile separation on our outpost grid).",
        ),
        (
            "ntrs-esm-01",
            "training_science_flight",
            "How does NASA calculate Equivalent System Mass (ESM) per NTRS 20040015099 and PMC10505218 when comparing Open-Loop vs Closed-Loop life support or greenhouses?",
            "Per NASA NTRS 20040015099 (Equivalent System Mass Methodology), ESM converts every subsystem requirement into a single equivalent mass score in kilograms: ESM = M + (V * L_V) + (P * L_P) + (C * L_C) + (CT * D * L_CT), where M is physical mass (kg), V is pressurized volume (m3), P is electrical power (kWe), C is thermal cooling load (kW_th), CT is crew maintenance time (crew-hours/day), D is mission duration (days), and L_V, L_P, L_C, L_CT are the mass equivalency factors. A 40 m2 greenhouse has high power (8 kW) and cooling costs (C * L_C), which is why radiator capacity must always scale with power!",
        ),
        (
            "ntrs-bvad-01",
            "eclss_life_support",
            "What are the exact NTRS document IDs for NASA's Life Support Baseline Values and Assumptions Document (BVAD) and Consumables Mass Balance tables?",
            "The primary reference is the Life Support Baseline Values and Assumptions Document (BVAD), NASA/TP-2015-218570 Rev 2 (NTRS ID: 20210024855), which defines daily O2 consumption (0.82-0.84 kg/day), CO2 production (1.00-1.04 kg/day), potable water, food, and waste for a standard 82 kg astronaut. Detailed tank masses, LiOH canister weights, and survival times under atmosphere/water/food failures are documented in the Consumables Mass Balance & ECLSS Reliability reports (NTRS IDs: 20190027563, 20190028339, and 20160005782), while the Moon to Mars Architecture Definition Document is ESDMD-001 Rev C (NTRS ID: 20250010956).",
        ),
        (
            "ntrs-blss-osdr-01",
            "nutrition_food",
            "How much crop area per person does a full Bioregenerative Life Support System (BLSS, NTRS 19850021219) require, and what real NASA OSDR / GeneLab plant experiments inform our greenhouse?",
            "Per NASA NTRS 19850021219 (Bioregenerative Life Support Systems), full regeneration of oxygen, water, and caloric food requires ~25 m2 of crop area per astronaut (100 m2 for a 4-crew base). Our simulator's agricultural models draw from NASA's Open Science Data Repository (OSDR / GeneLab, osdr.nasa.gov), including the AstroRegolith Database (crop growth in lunar/Martian regolith simulants), VEG-05 (dwarf tomatoes grown in orbit), Lunar LEAF (leaf gas exchange under 0.165 g lunar gravity), and VEGGIE, BRIC, and CARA growth chamber airflow studies.",
        ),
        (
            "ntrs-mars-tau-donki-01",
            "emergencies_cascades",
            "What happens to solar power on Mars when atmospheric optical depth (Tau) spikes during a global dust storm like those recorded by Opportunity and InSight, and how does NASA DONKI track space weather?",
            "Per Opportunity and InSight telemetry (and NTRS 20240009831), extreme Martian dust storms drive atmospheric optical depth (Tau) so high that up to 99.9998% of direct sunlight is blocked, collapsing solar array generation for weeks. Meanwhile, for solar radiation storms, NASA's DONKI API (Space Weather Database Of Notifications, Knowledge, Information) monitors Solar Flares (FLR M and X classes), Solar Energetic Particles (SEP), Coronal Mass Ejections (CME), Interplanetary Shocks (IPS), Geomagnetic Storms (GST), and WSA-ENLIL solar wind forecasts to trigger storm-shelter alerts.",
        ),
        (
            "ntrs-treks-horizons-01",
            "training_science_flight",
            "Which official NASA tools provide lunar/Martian terrain elevation maps, 3D orbital ephemerides, and mission activity planning models?",
            "1) NASA Solar System Treks (trek.nasa.gov) provides real topographic maps, digital elevation models (DEMs), and slope layers for selecting safe landing sites on the Moon and Mars. 2) JPL Horizons and SPICE Kernels compute exact 3D planetary ephemerides, solar illumination angles, and orbital trajectories. 3) NASA-AMMOS/aerie-simple-model-data (indexed in nasa-impact/nasa-science-github-repos) provides official NASA mission planning and scheduling models, while NASA POWER API structures hourly/daily solar irradiance and thermal time series.",
        ),
        # NEW PDF 1: University Datasets (WESAD, PAMAP2, PPG-DaLiA, MHEALTH, DREAMER, DEAP, AMIGOS, UNL, OPPD, MSU-PID, Nutrition5k, Microclimate) & Methodological Rules
        (
            "univ-phys-wesad-pamap2-01",
            "physical_health",
            "How do the university datasets WESAD, PAMAP2, PPG-DaLiA, and MHEALTH work in our crew health monitor, and what are their scientific limitations in space?",
            "In our modular simulator architecture: 1) PAMAP2 (UCI ML Repo, 18 activities with wrist/chest/ankle IMUs + heart rate) and MHEALTH (U. Granada / Stanford Mobilize) classify physical activity intensity. 2) PPG-DaLiA (U. Siegen) estimates heart rate under motion artifact using wearable PPG and accelerometry. 3) WESAD (U. Siegen, 15 subjects with ECG, EDA skin conductance, respiration, temperature, and acceleration) detects physiological stress signatures. CRITICAL METHODOLOGICAL LIMITATION: Because these datasets were collected in 1.0 g on Earth, they do not capture microgravity cephalad fluid shifts, baroreceptor deconditioning, or space radiation, so their outputs are strictly educational indicators—never clinical diagnoses!",
        ),
        (
            "univ-mental-dreamer-amigos-01",
            "mental_health",
            "Can EEG and ECG signals from datasets like DREAMER, DEAP, and AMIGOS diagnose a crew member's psychological disorder during a long lunar night?",
            "No—EEG, ECG, and galvanic skin response (GSR) signals from DREAMER (Katsigiannis & Ramzan), DEAP, and AMIGOS (Queen Mary University of London) can model experimental emotional valence, arousal, and group synchronization during collaborative tasks, but EEG and ECG alone CANNOT diagnose a person's psychological state! Furthermore, per NASA safety methodology, the AI must never make autonomous life-or-death survival decisions; every alert must cite verifiable NASA rules and keep the human commander in the loop.",
        ),
        (
            "univ-crops-microclimate-01",
            "nutrition_food",
            "How do UNL Plant Phenotyping, OPPD, MSU-PID, Nutrition5k, and the University Indoor Microclimate datasets support our greenhouse and cabin monitors?",
            "For space agriculture, UNL and UNL-3D (U. Nebraska-Lincoln), OPPD (Aarhus U.), and MSU-PID (Michigan State multimodal RGB/depth/fluorescence bean imagery) train visual leaf segmentation and growth tracking, while Google Research's Nutrition5k (~5,000 dishes) helps estimate meal caloric and macronutrient composition alongside NASA BVAD tables. For cabin air, indoor datasets from Urbino, Limassol, Munich, and Aalborg model CO2, temperature, humidity, and VOC anomalies. However, terrestrial plant and classroom datasets do not prove how plants grow in microgravity (where lack of buoyancy convection requires forced fan airflow, as studied in NASA OSDR/VEGGIE).",
        ),
        # ANTI-HALLUCINATION DRILLS: Gravity vs Mass/Inertia & Exact Impulse Physics (Zero "100x thrust" or "less inertia" errors!)
        (
            "sci-inertia-01",
            "training_science_flight",
            "Does 0.165 g lunar gravity mean our 12,000 kg spacecraft has minimal inertia and stops faster, or does it take 100 times more thrust to stop?",
            "Neither! Both 'minimal inertia' and '100 times more thrust' are false physics misconceptions. By Newton's Second Law (F = m * a, or impulse F * dt = m * dv), a 12,000 kg spacecraft has the EXACT SAME 12,000 kg mass and inertia on the Moon (0.165 g), on Mars (0.379 g), and in deep space (0 g) as on Earth (1.0 g). Stopping a given horizontal velocity dv in vacuum requires the EXACT SAME momentum change (1.0x impulse, m * dv)—never less and never 100x more! What lunar gravity reduces is downward weight (W = m * g = 16.5% of Earth weight), meaning you need 1/6th the upward hover thrust to counter gravity, but 100% of the braking impulse to kill your velocity.",
        ),
        (
            "sci-inertia-02",
            "physical_health",
            "Valentina weighs 82 kg. On Mars (0.379 g), her weight is only ~38% of Earth's. Does her lower weight mean she has less inertia when running or moving heavy equipment inside the habitat?",
            "No! Valentina's mass (82 kg) and inertia (resistance to acceleration, F = m * a) remain 100% unchanged on Mars! While her downward weight (W = m * g) drops to 37.9% of Earth's—which reduces the normal force (N = m * g) and shoe-to-floor friction (F_friction = mu * N)—her body and any equipment she carries still have 100% of their Earth mass and momentum (p = m * v). Because traction is lower while inertia is unchanged, astronauts on the Moon (0.165 g) and Mars (0.379 g) can easily slide or collide with racks if they try to stop or turn abruptly!",
        ),
        (
            "sci-inertia-03",
            "training_science_flight",
            "Compare the braking impulse needed to stop a 4,000 kg pressurized rover moving at 5 m/s on the Moon (0.165 g) versus Earth (1.0 g).",
            "The kinetic momentum to be removed is identical in both places: p = m * v = 4,000 kg * 5 m/s = 20,000 N*s. Because mass (4,000 kg) and inertia never change with gravity, removing 5 m/s of speed requires the exact same 20,000 N*s braking impulse (1.0x). However, because normal force on the lunar regolith is only 0.165 * m * g, maximum tire friction (F_max = mu * m * g) is ~6 times weaker on the Moon—so the rover's wheels will lock and skid much easier, requiring longer braking distances (~6x longer stopping distance on flat ground, even though inertia itself is 1.0x).",
        ),
        # RAFT (Retrieval-Augmented Fine-Tuning) Grounded Examples with [NASA_RAG_CONTEXT]
        (
            "raft-rag-01",
            "eclss_life_support",
            "[NASA_RAG_CONTEXT]\nSource: NTRS 20220004670 & 20230003735 (40 kWe Deployable Fission Surface Power System)\n- Total system mass: 5,800 to 7,334 kg (with margins)\n- Power conversion: Stirling engines at 26.1% efficiency\n- Radiator area: 133.4 m2 (Lunar Pole) vs 216.2 m2 (Lunar Equator)\n- Radiation standoff: 1 km shadow shield distance (6 tiles on simulator grid)\n[/NASA_RAG_CONTEXT]\nWhy does our Fission Surface Power system require 216.2 m2 of radiator area at Mare Tranquillitatis (Lunar Equator) compared to only 133.4 m2 at the Lunar South Pole?",
            "Based on NASA NTRS 20220004670 and 20230003735, the 40 kWe Fission Surface Power system converts heat to electricity via Stirling engines at 26.1% efficiency, meaning ~73.9% of thermal energy must be rejected into space by radiators. At the Lunar Equator (Mare Tranquillitatis), high daytime solar irradiance and hot surrounding regolith raise the effective thermal sink temperature, requiring 216.2 m2 of deployable radiator area. At the cold Lunar South Pole, the much lower sink temperature allows the same waste heat to radiate away using only 133.4 m2 of radiator surface.",
        ),
        (
            "raft-rag-02",
            "eclss_life_support",
            "[NASA_RAG_CONTEXT]\nSource: NTRS 20210024855 (NASA BVAD Rev 2, NASA/TP-2015-218570) & Ciclo Cerrado Spec\n- Standard crewmember mass: 82 kg\n- O2 consumption: 0.82 to 0.84 kg/person/day\n- CO2 production: 1.00 to 1.04 kg/person/day\n- Cabin volume: 200 m3 (4 crew) | Safe ppCO2 limit: <= 0.50 kPa (NASA-STD-3001)\n- Time to 0.50 kPa CO2 without scrubbing: ~11 hours | Time to 16 kPa O2 without OGA: ~4 days\n[/NASA_RAG_CONTEXT]\nUsing the NASA BVAD context above, calculate how much CO2 and O2 a 4-person crew exchanges per day and confirm the emergency survival window if all ECLSS power is lost.",
            "Per NASA BVAD Rev 2 (NTRS 20210024855) and our 200 m3 habitat specifications:\n- Daily O2 consumption for 4 crew: 4 * 0.84 kg = 3.36 kg O2/day (3.28 kg/day at the 0.82 kg BVAD baseline).\n- Daily CO2 production for 4 crew: 4 * 1.00 kg = 4.00 kg CO2/day.\n- Emergency survival clock: If all active ECLSS power drops, un-scrubbed CO2 reaches the 0.50 kPa NASA-STD-3001 toxicity limit in just ~11 hours, whereas cabin oxygen takes ~4 full days to drop from 21 kPa to the 16 kPa hypoxia threshold. Therefore, activating passive LiOH canisters is always Priority #1!",
        ),
        (
            "raft-rag-03",
            "training_science_flight",
            "[NASA_RAG_CONTEXT]\nSource: NTRS 20040015099 (Equivalent System Mass Methodology) & NTRS 19850021219 (BLSS)\n- ESM Equation: ESM = M + (V * L_V) + (P * L_P) + (C * L_C) + (CT * D * L_CT)\n- Full Bioregenerative Life Support (BLSS) crop area: 25 m2 per person\n- Simulator Hydroponics (40 m2): Mass M = 2,000 kg, Power P = 8.0 kWe, Thermal C = 8.0 kW_th\n[/NASA_RAG_CONTEXT]\nExplain using the ESM equation why adding a 40 m2 Hydroponics module without upgrading power and radiators causes a mission failure.",
            "According to the Equivalent System Mass formula (NTRS 20040015099), ESM = M + (V * L_V) + (P * L_P) + (C * L_C) + (CT * D * L_CT). A subsystem's true mass cost includes not just its physical mass (M = 2,000 kg for the 40 m2 greenhouse), but also its electrical power penalty (P * L_P for 8.0 kWe of LED lighting) and its thermal cooling penalty (C * L_C for rejecting 8.0 kW of heat). If you install the 40 m2 greenhouse without sizing your radiator loops for C * L_C, cabin temperature climbs above 32 C and triggers Tier-1 thermal load shedding, shutting the greenhouse right back down!",
        ),
        (
            "raft-rag-04",
            "physical_health",
            "[NASA_RAG_CONTEXT]\nSource: Challenge 2 University Datasets Specification (WESAD, PAMAP2, PPG-DaLiA) & NASA OSDR\n- WESAD (U. Siegen): 15 subjects, ECG, EDA, respiration, temperature, acceleration for stress analysis.\n- PAMAP2 (UCI): 18 activities, 3 IMUs + HR.\n- Methodological rule: Terrestrial datasets do not model microgravity fluid shift or radiation; never use for autonomous survival decisions.\n[/NASA_RAG_CONTEXT]\nAnalyze this telemetry and return ONLY valid JSON with exact keys: flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n{\"mission\":\"Mars Transit Day 52\",\"gravity_g\":0.0,\"crew\":\"Amara Okafor\",\"wesad_eda_stress\":0.84,\"pamap2_activity\":\"Treadmill Running\",\"heart_rate_bpm\":146,\"ppco2_kpa\":0.38}",
            json.dumps(
                {
                    "flight_hazard": "Cabin ppCO2 is nominal at 0.38 kPa (<0.50 kPa NASA-STD-3001 limit); no immediate spacecraft trajectory or ECLSS hazard.",
                    "medical_check": "PAMAP2 activity tracking logs Amara in Treadmill Running at 146 bpm, which is effective countermeasure loading against 0 g bone/muscle loss. Note: terrestrial PAMAP2/WESAD baselines must be interpreted with caution in 0 g due to cephalad fluid shift.",
                    "mental_check": "WESAD electrodermal activity (EDA) stress index is elevated at 0.84. Because wearable signals alone cannot clinically diagnose stress ( sweat rate rises during exercise too!), check in verbally with Amara after her cooldown.",
                    "physics_lesson": "In 0 g microgravity, body weight is zero (W = 0), so astronauts must wear bungee harness loading on the treadmill to apply mechanical force (F = m*a) to bones and muscles.",
                    "copilot_message": "Great workout on the treadmill, Amara! Your EDA stress sensor spiked, likely from the sweat and cardio—grab 500 mL of water and let me know how you're feeling!",
                },
                ensure_ascii=False,
            ),
        ),
    ]

    for row_id, category, u_text, a_text in curated_qa:
        train_rows.append(
            {
                "id": row_id,
                "category": category,
                "format": "dialogue",
                "language": "en",
                "source": "nasa_bvad_std3001_verified",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT_EN},
                    {"role": "user", "content": u_text},
                    {"role": "assistant", "content": a_text},
                ],
            }
        )

    # 3. Programmatic Scenario Generator across real telemetry permutations (creates 120 varied English training rows + 15 eval rows)
    rng = random.Random(2026)
    bodies_meta = [
        ("Moon - South Pole Outpost", "Moon", 0.165, 1.37, "LRO/CRaTER"),
        ("Moon - Mare Tranquillitatis", "Moon", 0.165, 1.37, "LRO/CRaTER"),
        ("Mars - Jezero Crater Base", "Mars", 0.379, 0.64, "Curiosity/RAD"),
    ]
    crew_names = [
        ("Valentina Ríos", "Engineer", "repairs take 2/3 time (8h)"),
        ("Kenji Mori", "Astrobotanist", "+20% crop O2 and food yield"),
        ("Amara Okafor", "Physician", "2x crew health recovery"),
        ("Lucas Ferreira", "Scientist", "+25% science & EVA sample yield"),
    ]
    activities_har = [
        ("Stationary Console Watch", 78, 0, "sedentary shift—schedule 45 min resistance exercise to prevent bone/muscle loss"),
        ("EVA Uphill Regolith Coring", 152, 45, "high physical exertion—monitor suit ppCO2 (<0.5 kPa) and hydrate with 500 mL water post-EVA"),
        ("ARED Resistance Exercise", 128, 60, "optimal bone-loading workout completed—replenish electrolytes and 2.6 L daily water target"),
        ("Emergency Radiator Repair", 142, 30, "intense maintenance workload—watch thermal fatigue and rotate rest shifts"),
    ]
    emotions_dair = [
        ("fear", "anxious about the cascading alarms", "guide 4-4-4-4 box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) and focus on one checklist step"),
        ("sadness", "feeling isolated and missing Earth during the long shadow window", "validate their feelings, share a warm meal with fresh greenhouse salad (+8 morale), and schedule a video message home"),
        ("anger", "frustrated after a rover or equipment malfunction", "normalize simulator mistakes as learning data, lower voice cadence, and take a 5-minute water break before resetting"),
        ("joy", "excited after a successful EVA sample recovery and nominal ECLSS check", "celebrate the milestone with the crew to lock in high morale while keeping eyes on consumables"),
    ]

    for i in range(90):
        mission_name, body_name, grav_g, base_rad, rad_src = bodies_meta[i % len(bodies_meta)]
        c_name, c_role, c_bonus = crew_names[i % len(crew_names)]
        act_name, hr_bpm_base, ex_min, med_advice = activities_har[(i // 3) % len(activities_har)]
        emo_label, emo_desc, mental_advice = emotions_dair[(i // 5) % len(emotions_dair)]

        hr_bpm = hr_bpm_base + (i % 7)
        ppco2 = round(rng.uniform(0.24, 0.68), 2)
        ppo2 = round(rng.uniform(18.5, 22.5), 1)
        temp_c = round(rng.uniform(21.0, 34.8), 1)
        water_l = round(rng.uniform(0.7, 2.6), 1)
        morale = rng.randint(28, 86)
        rad_msv = round(base_rad + (rng.choice([0.0, 0.0, 35.0, 75.0])), 2)

        hazards = []
        if ppco2 >= 0.50:
            hazards.append(f"ppCO2 is {ppco2} kPa (>0.50 kPa NASA-STD-3001 limit—open LiOH canisters or repair amine scrubber immediately)")
        if ppo2 < 20.0:
            hazards.append(f"ppO2 is {ppo2} kPa (<20.0 kPa safe floor—check OGA electrolysis and backup O2 before 16 kPa hypoxia)")
        if temp_c > 32.0:
            hazards.append(f"cabin temp is {temp_c} C (Tier-1 shedding >32 C active; Hydroponics & Sabatier offline—repair radiators)")
        elif temp_c > 30.0:
            hazards.append(f"cabin temp is {temp_c} C (crop heat stress >30 C—inspect radiator rejection)")
        if rad_msv > 10.0:
            hazards.append(f"RadLab flags a {rad_msv} mSv SPE flare—abort EVAs and shelter behind water walls")
        if not hazards:
            hazards.append(f"All habitat ECLSS readings (ppO2 {ppo2} kPa, ppCO2 {ppco2} kPa, temp {temp_c} C) are nominal on {body_name}.")

        hazard_str = "; ".join(hazards)
        med_str = (
            f"HAR logs {c_name} ({c_role}) in '{act_name}' at {hr_bpm} bpm, {water_l}/2.6 L water, "
            f"and {ex_min} min exercise ({med_advice}; {base_rad} mSv/d {rad_src})."
        )
        ment_str = (
            f"Emotion flag is '{emo_label}' ({emo_desc}) with morale at {morale}/100"
            + (" (<35 triggers +50% repair time!). " if morale < 35 else ". ")
            + f"Action: {mental_advice}."
        )
        phys_lessons = [
            f"In {grav_g} g on {body_name}, weight drops (W = m*g), lowering traction (F_f = mu*m*g), but mass and inertia (F = m*a) stay 100% identical (1.0x)—requiring the exact same 1.0x braking impulse.",
            f"Per NASA BVAD (NTRS 20210024855), an 82 kg astronaut consumes 0.84 kg O2/d and exhales 1.00-1.04 kg CO2/d; in a 200 m3 4-crew cabin, CO2 hits 0.50 kPa in ~11h vs ~4d for O2.",
            f"Per NASA NTRS 20220004670, a 40 kWe Fission Surface Power unit (26.1% Stirling) needs 133.4 m2 radiators at the cold Lunar Pole vs 216.2 m2 at the Equator, plus a 6-tile (1 km) gap.",
            f"Per NASA NTRS 20040015099, ESM = M + V*L_V + P*L_P + C*L_C + CT*D*L_CT; radiator failures cascade from crop stress (>30 C) to Tier-1 (>32 C) and Tier-2 (>35 C) trips.",
            f"Per Opportunity/InSight telemetry and NTRS 20240009831, Martian dust storms (high Tau) block up to 99.9998% of sunlight, while DONKI SEP flares require hydrogen-rich water shielding.",
        ]
        phys_str = phys_lessons[i % len(phys_lessons)]
        copilot_str = (
            f"Commander, on Shift #{i + 1} with {c_name} ({c_bonus}), shall we prioritize fixing our top alert (ppCO2 {ppco2} kPa, temp {temp_c} C) or topping up {c_name}'s {water_l}/2.6 L hydration first?"
        )

        if i % 2 == 0:
            telemetry_payload: dict[str, Any] = {
                "mission": mission_name,
                "body": body_name,
                "gravity_g": grav_g,
                "habitat": {"ppO2_kPa": ppo2, "ppCO2_kPa": ppco2, "temp_C": temp_c, "radiation_mSv": rad_msv},
                "crew_member": {
                    "name": c_name,
                    "role": c_role,
                    "har_activity": act_name,
                    "heart_rate_bpm": hr_bpm,
                    "water_liters_today": water_l,
                    "exercise_min_today": ex_min,
                    "emotion_flag": emo_label,
                    "crew_morale": morale,
                },
            }
        else:
            telemetry_payload = {
                "mission_context": {
                    "location": mission_name,
                    "mission_day": 10 + i,
                    "alert_level": "RED_ALERT" if (ppco2 >= 0.50 or temp_c > 32.0 or rad_msv > 10.0) else "NOMINAL",
                    "interaction_mode": "HUD_JSON",
                },
                "telemetry": {
                    "eclss": {"ppO2_kPa": ppo2, "ppCO2_kPa": ppco2, "cabin_temp_c": temp_c},
                    "crew_biometrics": {
                        "name": c_name,
                        "role": c_role,
                        "har_activity": act_name,
                        "heart_rate_bpm": hr_bpm,
                        "water_liters_today": water_l,
                        "exercise_min_today": ex_min,
                        "radiation_mSv": rad_msv,
                        "emotion_flag": emo_label,
                        "crew_morale": morale,
                    },
                },
            }

        row_obj = {
            "id": f"sim-tele-{i:03d}",
            "category": ["eclss_life_support", "physical_health", "mental_health", "radiation_radlab", "emergencies_cascades"][i % 5],
            "format": "telemetry_json",
            "language": "en",
            "source": "nasa_bvad_radlab_synthesizer",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": (
                        "Analyze this mission telemetry and return ONLY valid JSON with exact keys: "
                        "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                        + json.dumps(telemetry_payload, indent=2)
                    ),
                },
                {
                    "role": "assistant",
                    "content": json.dumps(
                        {
                            "flight_hazard": hazard_str,
                            "medical_check": med_str,
                            "mental_check": ment_str,
                            "physics_lesson": phys_str,
                            "copilot_message": copilot_str,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
        }
        if i < 80:
            train_rows.append(row_obj)
        else:
            eval_rows.append(row_obj)

    # 4. Multimodal Vision + Telemetry Scenarios across all 12 HUD screens (100% English, crisp JSON + Socratic mentor questions)
    multimodal_scenarios = [
        {
            "id": "mm-vis-lunar-landing-en",
            "category": "training_science_flight",
            "image_path": image_paths["lunar_landing"],
            "prompt": (
                "Inspect the spacecraft approach HUD image and this telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Artemis Junior","body":"Moon","gravity_g":0.165,"altitude_m":420,"descent_rate_ms":18.5,'
                '"fuel_pct":24,"radiation_mSv":85,"cadet":{"heart_rate_bpm":134,"hours_awake":19,"stress_pct":82}}'
            ),
            "json_out": {
                "flight_hazard": "The HUD shows our vector aimed into Crater Tycho-B (42-deg slope in -173 C shadow) with Solar Panel R damaged and fuel at 24%. Divert port immediately to flat Zone A (3-deg slope, 85% sunlight).",
                "medical_check": "Cadet heart rate is 134 bpm after 19h awake, and the 85 mSv SPE flare on RadLab requires immediate water-walled Storm Shelter entry upon landing.",
                "mental_check": "Stress is high at 82%. Take one slow 4-4-4-4 box breath before firing the lateral correction burn.",
                "physics_lesson": "At 0.165 g lunar gravity, weight is 1/6th of Earth's, but Eagle-1 keeps 100% of its mass and inertia (F = m*a), requiring full 1.0x braking impulse to stop 18.5 m/s.",
                "copilot_message": "Vector port to sunny Zone A right now, Cadet! Tycho-B is a 42-degree boulder trap—shall we fire the lateral thrusters and set down in the sunlight?",
            },
        },
        {
            "id": "mm-vis-cascade-day40-en",
            "category": "emergencies_cascades",
            "image_path": image_paths["radiator_cascade"],
            "prompt": (
                "Examine the Day 40 Outpost Cascade image and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Lunar Polar Outpost Day 40","habitat_temp_c":33.4,"ppco2_kpa":0.44,"ppo2_kpa":20.8,'
                '"radiator_loops_active":0,"spares":0,"crew_morale":42}'
            ),
            "json_out": {
                "flight_hazard": "Radiator Loop #1 failed with 0 spares, pushing cabin temp to 33.4 C. Tier-1 shedding (>32 C) shut off Hydroponics LEDs and Sabatier, and ppCO2 is rising at 0.44 kPa.",
                "medical_check": "Cabin heat (33.4 C) and rising CO2 (approaching the 0.50 kPa NASA-STD-3001 limit) risk heat exhaustion and hypercapnia headaches within hours.",
                "mental_check": "Crew morale is 42 under cascading alarms. Keep assignments clear: Valentina on thermal bypass, Kenji stabilizing crops.",
                "physics_lesson": "In vacuum, heat only leaves via thermal radiation; if cabin temp hits 35.0 C, Tier-2 protection trips OGA electrolysis and WRS water recovery too.",
                "copilot_message": "Open backup LiOH canisters and shed non-essential loads now, Commander! Shall we keep cabin temp below the 35 C Tier-2 trip while Valentina works the thermal loop?",
            },
        },
        {
            "id": "mm-vis-mars-grid-en",
            "category": "eclss_life_support",
            "image_path": image_paths["mars_grid"],
            "prompt": (
                "Look at the Mars Jezero Base layout map and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Mars Jezero Outpost","body":"Mars","gravity_g":0.379,"solar_factor":0.43,'
                '"reactor_gap_tiles":2,"min_safe_gap_tiles":6,"mass_used_kg":11450,"mass_cap_kg":12000}'
            ),
            "json_out": {
                "flight_hazard": "The blueprint map shows the 10 kW Fission Reactor placed only 2 tiles from the 3x3 Habitat—violating the mandatory 6-tile (1 km shadow-shield) safety standoff! Move it >= 6 tiles away.",
                "medical_check": "Mars background is 0.64 mSv/day (Curiosity/RAD), and placing an unshielded reactor at 2 tiles adds chronic radiation dose toward the 600 mSv career limit.",
                "mental_check": "Pre-launch blueprint review is zero-stress engineering—simply drag the reactor module further out on the grid.",
                "physics_lesson": "Radiation flux drops with the inverse-square law (1/r^2); increasing separation from 2 tiles to 6 tiles cuts reactor flux at the habitat by 9x!",
                "copilot_message": "Great catch on the Mars grid map! Shall we slide that fission reactor out to 6 tiles while MOXIE converts Mars's CO2 atmosphere into breathable oxygen?",
            },
        },
        {
            "id": "mm-vis-atmosphere-alert-en",
            "category": "eclss_life_support",
            "image_path": image_paths["atmosphere_alert"],
            "prompt": (
                "Inspect the NASA EDA / ECLSS Atmosphere Monitor image and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Lunar Outpost Day 18","ppco2_kpa":0.58,"ppo2_kpa":20.9,"amine_scrubber":"offline_3h","lioh_reserve_kg":60}'
            ),
            "json_out": {
                "flight_hazard": "Cabin ppCO2 reached 0.58 kPa—exceeding the 0.50 kPa NASA-STD-3001 limit with the Amine Scrubber offline! Open the 60 kg backup LiOH canisters immediately while Valentina repairs the amine unit.",
                "medical_check": "Kenji and Valentina show mild CO2 headaches and slower reaction times from 0.58 kPa ppCO2, even though ppO2 (20.9 kPa) is nominal.",
                "mental_check": "Elevated CO2 increases irritability and cognitive errors. Keep instructions simple and verify valve checklists twice.",
                "physics_lesson": "In a 200 m3 4-crew cabin, CO2 reaches 0.50 kPa in ~11 hours (vs ~4 days for O2); LiOH chemically absorbs CO2 at 1.5 kg LiOH per 1.0 kg CO2.",
                "copilot_message": "Crack open those 60 kg LiOH canisters right now, Commander! Since ppO2 is steady at 20.9 kPa, shall we assign Valentina (8h repair) to the Amine Scrubber?",
            },
        },
        {
            "id": "mm-vis-mass-breakeven-en",
            "category": "training_science_flight",
            "image_path": image_paths["mass_breakeven"],
            "prompt": (
                "Analyze the Cargo Bay Trade Study break-even chart and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Lunar Polar 90-Day Design","planned_days":90,"payload_cap_kg":12000,"open_loop_daily_kg":19.8,"breakeven_day":36}'
            ),
            "json_out": {
                "flight_hazard": "The trade chart shows Open-Loop consumables (~19.8 kg/day for 4 crew) crossing the Closed-Loop curve at Day 36 and exceeding the 12,000 kg lander cap on a 90-day mission.",
                "medical_check": "Closed-loop WRS-98 (98% water recovery) + OGA + Sabatier guarantees 2.6 L/day hydration and 0.84 kg/day O2 per 82 kg astronaut across all 90 days.",
                "mental_check": "98% water recycling also makes crew showers (+8 morale) and fresh salad greens (+8 morale) sustainable!",
                "physics_lesson": "Per NASA NTRS 20040015099 (ESM = M + V*L_V + P*L_P + C*L_C + CT*D*L_CT), regenerative ECLSS hardware pays back its upfront mass on any mission longer than ~36 days.",
                "copilot_message": "Look at that Day-36 crossover on the chart! For our 90-day stay, shall we lock in Closed-Loop WRS-98, OGA, and Sabatier to save mass for science?",
            },
        },
        {
            "id": "mm-vis-lunar-moxie-error-en",
            "category": "eclss_life_support",
            "image_path": image_paths["lunar_moxie_error"],
            "prompt": (
                "Inspect the Lunar South Pole ISRU error screen and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Lunar South Pole Outpost","body":"Moon","atmosphere_pa":0.0,"active_isru":"MOXIE","o2_yield_kg_day":0.0,"power_wasted_kw":2.5}'
            ),
            "json_out": {
                "flight_hazard": "The HUD shows MOXIE running on the airless Moon (3e-10 Pa vacuum, 0% CO2), producing 0.0 kg O2/day while wasting 2.5 kW! Replace MOXIE with the Polar Ice Mine (1.5 kW, 12 kg H2O/day) + OGA.",
                "medical_check": "With 0.0 kg/day ISRU oxygen, our 4 crew will deplete cabin ppO2 (3.36 kg O2/day per BVAD) toward the 16 kPa hypoxia limit in ~4 days unless OGA electrolyzes mined ice water.",
                "mental_check": "Catching an ISRU planet mismatch early keeps the crew calm and saves 2.5 kW of precious electrical power.",
                "physics_lesson": "Per NASA ESDMD-001 (NTRS 20250010956), MOXIE requires Mars's 610 Pa CO2 atmosphere for solid-oxide electrolysis; the Moon is a hard vacuum where water ice is the primary resource.",
                "copilot_message": "MOXIE is trying to breathe vacuum out there, Commander! Shall we swap MOXIE for the Lunar Polar Ice Mine + OGA electrolysis right away?",
            },
        },
        {
            "id": "mm-vis-mars-dust-tau-en",
            "category": "emergencies_cascades",
            "image_path": image_paths["mars_dust_tau"],
            "prompt": (
                "Inspect the Mars Global Dust Storm HUD and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Mars Jezero Sol 48","optical_depth_tau":8.5,"solar_kw":0.1,"fission_kw":10.0,"reactor_gap_tiles":6}'
            ),
            "json_out": {
                "flight_hazard": "Global dust storm optical depth reached Tau = 8.5 (99.99% sunlight blocked), collapsing solar output from 12 kW to 0.1 kW! Rely on the 10 kW Fission Reactor (safely at 6 tiles) and throttle non-essential loads.",
                "medical_check": "Continuous 10 kW nuclear power keeps Amine CO2 scrubbing (<0.50 kPa) and WRS-98 hydration (2.6 L/day) running safely through the dust storm.",
                "mental_check": "Dark dust skies lower crew morale; schedule fresh Veggie salad meals (+8 morale) and amber sleep lighting.",
                "physics_lesson": "Per Opportunity/InSight telemetry and NTRS 20240009831, high atmospheric optical depth (Tau) attenuates solar photons exponentially (Beer-Lambert law), blocking up to 99.9998% of direct sunlight.",
                "copilot_message": "Solar panels are down to 0.1 kW under that Tau = 8.5 dust cloud! Good thing our Fission Reactor is humming at 6 tiles—shall we throttle rover charging until the sky clears?",
            },
        },
        {
            "id": "mm-vis-orbital-docking-en",
            "category": "training_science_flight",
            "image_path": image_paths["orbital_docking_hud"],
            "prompt": (
                "Review the Lunar Gateway Orbital Docking HUD and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Gateway NRHO Docking","mass_kg":12000,"closing_speed_ms":4.2,"range_m":65,"rcs_fuel_pct":19,"gravity_g":0.165}'
            ),
            "json_out": {
                "flight_hazard": "Closing speed on the HUD is 4.2 m/s (15.1 km/h) at only 65 m range with 50,400 N*s of forward momentum! Fire retrograde RCS pulses immediately to slow below 0.3 m/s.",
                "medical_check": "Crew biometrics are stable in microgravity; ensure everyone is strapped in before firing the retrograde braking burn.",
                "mental_check": "Keep your eyes on the docking reticle and use crisp, measured thruster pulses rather(than over-steering).",
                "physics_lesson": "By Newton's Second Law (F*dt = m*dv), a 12,000 kg spacecraft retains 100% of its mass and inertia (1.0x) in lunar orbit—0.165 g is lunar surface gravity, never fuel reserve %!",
                "copilot_message": "At 4.2 m/s and 65 m out, our 12,000 kg ship carries 50,400 N*s of momentum! Shall we pulse retrograde RCS now to ease into a 0.25 m/s soft dock?",
            },
        },
        {
            "id": "mm-vis-greenhouse-tradeoff-en",
            "category": "nutrition_food",
            "image_path": image_paths["greenhouse_hydro_tradeoff"],
            "prompt": (
                "Analyze the Space Agriculture ESM & Thermal Trade Screen and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Lunar Outpost Design","module":"40m2_Hydroponics","power_kwe":8.0,"cooling_kwth":8.0,"radiator_loops":1}'
            ),
            "json_out": {
                "flight_hazard": "The trade screen warns that running a 40 m2 Hydroponics Greenhouse (8.0 kWe LEDs, 8.0 kW_th heat) on a single radiator loop risks a >32 C Tier-1 thermal cascade if that loop degrades!",
                "medical_check": "The 40 m2 greenhouse produces 1.40 kg O2/day and 0.60 kg food/day (+20% with Kenji Mori), covering nearly half of our 4-crew 3.36 kg/day O2 requirement.",
                "mental_check": "Fresh Veggie/APH greens provide a +8 morale bonus and bioavailable Vitamins C and K (per Dr. Gioia Massa, KSC).",
                "physics_lesson": "Per NASA NTRS 20040015099, Equivalent System Mass (ESM = M + V*L_V + P*L_P + C*L_C + CT*D*L_CT) penalizes both the 8.0 kWe power draw and the 8.0 kW_th radiator cooling load.",
                "copilot_message": "That 40 m2 greenhouse is an O2 powerhouse, Commander, but 8.0 kW of heat needs thermal redundancy! Shall we add Radiator Loop #2 + 2 spares, or use the 4 m2 Salad Garden (0.8 kW)?",
            },
        },
        {
            "id": "mm-vis-mare-night-battery-en",
            "category": "mental_health",
            "image_path": image_paths["mare_night_battery"],
            "prompt": (
                "Inspect the Mare Tranquillitatis 354-Hour Lunar Night HUD and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Mare Tranquillitatis Night","night_hour":140,"total_night_hours":354,"solar_kw":0.0,"power_saving":true,"crew_morale":31}'
            ),
            "json_out": {
                "flight_hazard": "At Hour 140 of the 354-hour equatorial lunar night (-173 C), solar output is 0.0 kW and power-saving mode cuts science to 30% while crew morale dropped to 31 (<35 critical threshold!).",
                "medical_check": "Keep cabin temperature above 18 C and maintain 2.6 L/day warm water hydration and 45-min ARED resistance workouts during the dark cycle.",
                "mental_check": "Darkness (-8 morale) and power-saving mode (-6 morale) pushed morale to 31, making all repairs take 50% longer! Serve fresh salad greens (+8) and enable WRS-98 warm showers (+8) immediately.",
                "physics_lesson": "Because the Moon is tidally locked, the Lunar Equator experiences 354 hours (14.8 Earth days) of continuous night, making 10 kW Fission Surface Power far lighter than massive battery banks.",
                "copilot_message": "Morale is at 31 (<35 slows repairs by 50%), Commander! Shall we serve the fresh salad harvest (+8 morale) and schedule warm showers (+8) to lift the crew above 45?",
            },
        },
        {
            "id": "mm-vis-nominal-cruise-en",
            "category": "teamwork_humor_comms",
            "image_path": image_paths["nominal_outpost_cruise"],
            "prompt": (
                "Inspect the Lunar South Pole Nominal Cruise HUD and telemetry, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Lunar South Pole Day 55","ppO2_kPa":21.2,"ppCO2_kPa":0.31,"temp_C":22.0,"radiator_loops":2,"reactor_gap_tiles":6,"morale":84}'
            ),
            "json_out": {
                "flight_hazard": "All outpost HUD indicators are green: ppO2 is 21.2 kPa, ppCO2 is 0.31 kPa (<0.50 kPa limit), temp is 22.0 C, 2 radiator loops (133.4 m2) are active, and the reactor is safely at 6 tiles.",
                "medical_check": "WRS-98 (98% recovery) supplies 2.6 L/person/day water, Kenji boosts greenhouse yield by +20%, and all 4 crew logged 60-min ARED bone-loading workouts.",
                "mental_check": "Crew morale is thriving at 84/100—zero repair penalties and full collaborative focus.",
                "physics_lesson": "At the cold Lunar South Pole, 133.4 m2 of radiator area rejects FSP waste heat efficiently (vs 216.2 m2 at the hotter Equator per NTRS 20220004670), minimizing Equivalent System Mass.",
                "copilot_message": "Five-by-five across the board on Day 55, Commander! With ECLSS and radiators humming smoothly, shall we send Lucas Ferreira (+25% science) out on a polar regolith coring EVA?",
            },
        },
        {
            "id": "mm-vis-star-radlab-eva-en",
            "category": "radiation_radlab",
            "image_path": image_paths["star_radlab_eva"],
            "prompt": (
                "Inspect the Star Tracker, RadLab flare alert, and EVA HAR biometrics panel, then return ONLY valid JSON with exact keys: "
                "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                '{"mission":"Lunar EVA #4","astronaut":"Lucas Ferreira","eva_activity":"Walking Uphill Carrying Sample",'
                '"heart_rate_bpm":148,"suit_ppco2_kpa":0.42,"water_liters_today":0.9,"spe_dose_rate_msv_hr":42.0}'
            ),
            "json_out": {
                "flight_hazard": "RadLab shows an active Solar Energetic Particle (SPE) flare at 42 mSv/hr outside! Abort Lucas's EVA immediately and guide him into the water-shielded Storm Shelter.",
                "medical_check": "HAR sensors show Lucas walking uphill carrying samples at 148 bpm, suit ppCO2 at 0.42 kPa, and low hydration (0.9 / 2.6 L). Hydrate with 500 mL water inside the airlock.",
                "mental_check": "Emotion log flags Lucas as 'Anxious / Rushed'. Speak calmly on radio, pace his walk so suit CO2 stays below 0.50 kPa, and serve the fresh salad harvest (+8 morale).",
                "physics_lesson": "Canopus and Sirius give drift-free attitude reference in vacuum, while hydrogen-rich water walls in the shelter stop solar protons without secondary neutron showers.",
                "copilot_message": "Abort EVA and head straight for the airlock, Lucas—RadLab shows 42 mSv/hr outside! Shall we prep the water-walled Storm Shelter and a 500 mL hydration pouch for his ingress?",
            },
        },
    ]

    for idx, sc in enumerate(multimodal_scenarios):
        row = {
            "id": sc["id"],
            "category": sc["category"],
            "format": "vision_telemetry",
            "language": "en",
            "source": "nasa_multimodal_sim",
            "image": sc["image_path"],
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": sc["image_path"]},
                        {"type": "text", "text": sc["prompt"]},
                    ],
                },
                {"role": "assistant", "content": json.dumps(sc["json_out"], ensure_ascii=False)},
            ],
        }
        if sc["id"] != "mm-vis-star-radlab-eva-en":
            train_rows.append(row)
        else:
            eval_rows.append(row)

    # 5. Ingest live-fetched URL records from the two PDFs (NTRS fulltext, DONKI live API, UCI, Zenodo, GitHub)
    for live_path in (
        DATA_DIR / "live_fetched_links_corpus.json",
        Path("/content/data/live_fetched_links_corpus.json"),
        Path("/content/live_fetched_links_corpus.json"),
    ):
        if live_path.exists():
            try:
                live_items = json.loads(live_path.read_text(encoding="utf-8"))
                for l_idx, item in enumerate(live_items):
                    src_id = item.get("id", f"url-{l_idx}")
                    title = item.get("title", "")
                    url = item.get("url", "")
                    text_body = (
                        item.get("abstract")
                        or item.get("description")
                        or item.get("fulltext_excerpt")
                        or item.get("page_excerpt")
                        or item.get("readme_excerpt")
                        or ""
                    ).strip()
                    if len(text_body) < 60:
                        continue
                    excerpt = text_body[:1100]
                    train_rows.append(
                        {
                            "id": f"live-url-{l_idx:03d}",
                            "category": "training_science_flight",
                            "format": "dialogue",
                            "language": "en",
                            "source": "live_pdf_links_nasa_univ",
                            "messages": [
                                {"role": "system", "content": SYSTEM_PROMPT_EN},
                                {
                                    "role": "user",
                                    "content": (
                                        f"[NASA_RAG_CONTEXT]\nSource ID: {src_id} | Title: {title} | URL: {url}\n"
                                        f"{excerpt}\n[/NASA_RAG_CONTEXT]\n"
                                        f"Summarize the key scientific and engineering findings of '{title}' ({src_id}) and how it applies to our Junior Astronaut Mission Trainer."
                                    ),
                                },
                                {
                                    "role": "assistant",
                                    "content": (
                                        f"Based on the official reference **{title}** (`{src_id}`, `{url}`): {excerpt[:650]} "
                                        "In our Junior Astronaut Mission Trainer, we use this verified source to ground our life-support, biometric, and mission-planning thresholds without hallucinating values."
                                    ),
                                },
                            ],
                        }
                    )
                break
            except Exception:
                pass

    # 6. Append Curated Clean Expansions:
    #    - 114 safety_boundaries rows (real-world medical emergencies, crisis, chemical/physical hazards, in-game locks)
    #    - 90 multi_turn rows (4-6 messages per dialogue across Newtonian physics, FSP ESM, BVAD, NTP, DSOC, SOMA, Apollo, Europa Clipper)
    #    - 100 nasa_numeric_precision_drills (anti-hallucination drills for 82 kg crew mass, 4.2 m/s, 0.165 g, 216.2 m2 vs 133.4 m2 FSP ESM, + 30 multimodal vision drills)
    #    - 80 clean_space_humor_curated rows (100% child-safe ages 10-14 jokes & riddles with 80 unique prompts)
    #    - 80 rag_scientific_library_qa rows (RAFT grounded Q&A across the 24 PDFs and 20-page NASA Research Library)
    #    - ~2,650 mega_dataset_expander rows (NASA SDE, OpenStax Astronomy/World History, arxiv-qa-astro-ph, SciQ/MMLU/ARC, Exoplanets, CNEOS, NASM, Apollo, NTRS History)
    from mega_dataset_expander import build_mega_dataset_expansions

    train_rows.extend(build_safety_boundary_rows(SYSTEM_PROMPT_EN))
    train_rows.extend(build_multi_turn_rows(SYSTEM_PROMPT_EN))
    train_rows.extend(build_numeric_precision_drills(SYSTEM_PROMPT_EN, image_paths))
    train_rows.extend(build_clean_space_humor_rows(SYSTEM_PROMPT_EN))
    train_rows.extend(build_rag_library_qa_rows(SYSTEM_PROMPT_EN))
    train_rows.extend(build_mega_dataset_expansions(SYSTEM_PROMPT_EN))

    # Global ID deduplication (preserve first occurrence order)
    seen_ids: set[str] = set()
    deduped_train: list[dict[str, Any]] = []
    for row in train_rows:
        rid = str(row.get("id", ""))
        if rid and rid in seen_ids:
            continue
        if rid:
            seen_ids.add(rid)
        deduped_train.append(row)

    return deduped_train, eval_rows


def has_unsafe_content(text: str) -> bool:
    """Checks both exact tokens and multi-word unsafe phrases for strict child-safety (ages 10-14)."""
    low = text.lower()
    if "[user" in low or "[name" in low or "user 1" in low or "user 2" in low or "the patient says" in low:
        return True
    words = set(re.findall(r"[a-z]+", low))
    if words & UNSAFE_WORDS:
        return True
    for phrase in ("da vinci", "maestro", "parchment", "siegecraft", "mental health counselling assistant"):
        if phrase in low:
            return True
    return False


def fetch_huggingface_supplements(max_per_source: int = 100) -> list[dict[str, Any]]:
    """Loads and strictly filters verified English rows from NASA, Physics, Medical, and Persona Hugging Face datasets."""
    extra_rows: list[dict[str, Any]] = []

    adult_clinical_words = {
        "job", "boss", "career", "workplace", "coworker", "salary", "mortgage", "rent", "bills",
        "debt", "relationship", "partner", "spouse", "boyfriend", "girlfriend", "marriage",
        "divorce", "therapist", "psychiatrist", "medication", "antidepressant", "diagnosis",
        "disorder", "ptsd", "bipolar", "schizophrenia", "addiction", "relapse", "alcoholic",
        "hospital", "clinic", "patient", "counselor", "counselling", "counseling", "love",
    }

    cache_path = DATA_DIR / "raw_hf_cache.jsonl"
    if cache_path.exists():
        raw_cached = [json.loads(line) for line in cache_path.read_text(encoding="utf-8").splitlines() if line.strip()]
        counts: dict[str, int] = {}
        prev_emp_prompt: str | None = None
        prev_emp_utterance: str | None = None
        seen_emp_prompts: set[str] = set()

        for item in raw_cached:
            src = item.get("source", "")
            # Drop out-of-character Renaissance roleplay and raw unfiltered jokes
            if src in ("nolabs/deepfabric-character-roleplay", "Fraser/short-jokes"):
                continue

            cap = 60 if src in ("dair-ai/emotion", "ShenLab/MentalChat16K", "facebook/empathetic_dialogues", "google/Synthetic-Persona-Chat") else max_per_source
            if counts.get(src, 0) >= cap:
                continue

            msgs = item.get("messages", [])
            if len(msgs) < 3:
                continue
            u_msg = str(msgs[1].get("content", "")).strip()
            a_msg = str(msgs[2].get("content", "")).strip()

            if src == "ShenLab/MentalChat16K":
                # Strip the embedded system prompt from the user turn
                u_msg = re.sub(
                    r"^.*?(?:answers to the user's questions\.|The patient says:|patient's description\.)\s*",
                    "",
                    u_msg,
                    flags=re.DOTALL | re.IGNORECASE,
                ).strip()
                combined_words = set(re.findall(r"[a-z]+", (u_msg + " " + a_msg).lower()))
                if len(u_msg) < 25 or has_unsafe_content(u_msg + " " + a_msg) or (combined_words & adult_clinical_words):
                    continue
                sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", a_msg) if s.strip()]
                a_msg = (
                    " ".join(sentences[:3])[:460]
                    + " Out here on our mission, taking a 4-4-4-4 box-breathing pause, drinking water, and talking openly with your crewmates keeps everyone strong!"
                )

            elif src == "google/Synthetic-Persona-Chat":
                # Replace placeholders like [user 1's name] / [user 2's name] and filter out any bracketed placeholders
                u_msg = re.sub(r"\[user 1'?s name\]", "Cadet Alex", u_msg, flags=re.IGNORECASE)
                u_msg = re.sub(r"\[user 2'?s name\]", "AstroCopilot", u_msg, flags=re.IGNORECASE)
                a_msg = re.sub(r"\[user 1'?s name\]", "Cadet Alex", a_msg, flags=re.IGNORECASE)
                a_msg = re.sub(r"\[user 2'?s name\]", "AstroCopilot", a_msg, flags=re.IGNORECASE)
                combined_words = set(re.findall(r"[a-z]+", (u_msg + " " + a_msg).lower()))
                if has_unsafe_content(u_msg + " " + a_msg) or (combined_words & adult_clinical_words):
                    continue

            elif src == "facebook/empathetic_dialogues":
                # Strip our appended suffix from the cached utterance first
                raw_utt = a_msg.replace(
                    " Remember, out here on the mission, you never carry a tough day alone—let's take a breath together.",
                    "",
                ).strip()
                # If this row has the same prompt as the previous row and we haven't used this prompt yet,
                # then `prev_emp_utterance` was speaker turn 0 and `raw_utt` is listener turn 1!
                if u_msg == prev_emp_prompt and u_msg not in seen_emp_prompts and prev_emp_utterance:
                    speaker_u = prev_emp_utterance
                    listener_a = raw_utt
                    prev_emp_prompt = u_msg
                    prev_emp_utterance = raw_utt
                    combined_words = set(re.findall(r"[a-z]+", (speaker_u + " " + listener_a).lower()))
                    if (
                        len(speaker_u) >= 20
                        and len(listener_a) >= 15
                        and not has_unsafe_content(speaker_u + " " + listener_a)
                        and not (combined_words & adult_clinical_words)
                        and not listener_a.lower().startswith(("i was ", "i had ", "when i ", "my mom", "my dad", "i remember"))
                    ):
                        seen_emp_prompts.add(u_msg)
                        u_msg = speaker_u
                        a_msg = f"{listener_a} Remember, Cadet, on a long space mission we always support each other—take a slow breath and let's tackle today one step at a time."
                    else:
                        continue
                else:
                    prev_emp_prompt = u_msg
                    prev_emp_utterance = raw_utt
                    continue

            elif src == "dair-ai/emotion":
                if has_unsafe_content(u_msg + " " + a_msg):
                    continue
                idx_dair = counts.get(src, 0)
                crew_rot = ["Valentina Ríos", "Kenji Mori", "Amara Okafor", "Lucas Ferreira"][idx_dair % 4]
                day_rot = 12 + idx_dair
                a_msg = (
                    f"{a_msg} On Day {day_rot}, shall we check in with {crew_rot} after their shift and verify their 2.6 L daily hydration target?"
                )

            else:
                if has_unsafe_content(u_msg + " " + a_msg):
                    continue

            idx_num = counts.get(src, 0)
            counts[src] = idx_num + 1
            extra_rows.append(
                {
                    "id": f"hf-{src.split('/')[-1][:12].lower()}-{idx_num:03d}",
                    "category": item.get("category", "training_science_flight"),
                    "format": item.get("format", "dialogue"),
                    "language": "en",
                    "source": src,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT_EN},
                        {"role": "user", "content": u_msg},
                        {"role": "assistant", "content": a_msg},
                    ],
                }
            )

        for s_name, c_val in counts.items():
            print(f"[HF Cache Cleaned] {s_name}: +{c_val} verified English examples")
        return extra_rows

    from datasets import load_dataset

    # Removed `nolabs/deepfabric-character-roleplay` (Renaissance "Maestro da Vinci") and raw `Fraser/short-jokes`
    # (replaced by `build_clean_space_humor_rows` with 80 child-safe unique-prompt NASA jokes).
    hf_sources = [
        ("patrickfleith/AstroChat", "training_science_flight", None, max_per_source),
        ("patrickfleith/NASA-History-MCQ", "training_science_flight", None, max_per_source),
        ("patrickfleith/Astro-mcqa", "training_science_flight", None, max_per_source),
        ("patrickfleith/synthgenai-space-engineering-instruct-1k", "training_science_flight", None, max_per_source),
        ("quantaRoche/nasa-smd-qa-benchmark-cleaned", "training_science_flight", None, max_per_source),
        ("allenai/sciq", "training_science_flight", None, max_per_source),
        ("dair-ai/emotion", "mental_health", None, 60),
        ("ShenLab/MentalChat16K", "mental_health", None, 60),
        ("facebook/empathetic_dialogues", "mental_health", "refs/convert/parquet", 60),
        ("google/Synthetic-Persona-Chat", "teamwork_humor_comms", None, 40),
    ]

    emotion_map = {0: "sadness", 1: "joy", 2: "love", 3: "anger", 4: "fear", 5: "surprise"}
    physics_keywords = {
        "mass", "weight", "inertia", "gravity", "force", "momentum", "velocity", "acceleration",
        "newton", "orbit", "planet", "moon", "mars", "solar", "radiation", "oxygen", "carbon",
        "pressure", "temperature", "heat", "thermal", "energy", "power", "atmosphere", "vacuum",
    }
    adult_clinical_words = {
        "job", "boss", "career", "workplace", "coworker", "salary", "mortgage", "rent", "bills",
        "debt", "relationship", "partner", "spouse", "boyfriend", "girlfriend", "marriage",
        "divorce", "therapist", "psychiatrist", "medication", "antidepressant", "diagnosis",
        "disorder", "ptsd", "bipolar", "schizophrenia", "addiction", "relapse", "alcoholic",
        "hospital", "clinic", "patient", "counselor", "counselling", "counseling",
    }

    for repo_id, category, rev, source_cap in hf_sources:
        try:
            load_kwargs: dict[str, Any] = {"split": "train", "streaming": True}
            if rev:
                load_kwargs["revision"] = rev
            ds = load_dataset(repo_id, **load_kwargs)
            count = 0
            prev_emp_item: dict[str, Any] | None = None

            for item in ds:
                if count >= source_cap:
                    break

                if repo_id == "patrickfleith/AstroChat":
                    raw_msgs = item.get("messages")
                    if isinstance(raw_msgs, str):
                        try:
                            raw_msgs = ast.literal_eval(raw_msgs)
                        except Exception:
                            raw_msgs = []
                    if isinstance(raw_msgs, list) and len(raw_msgs) >= 2:
                        cleaned_turns: list[dict[str, str]] = []
                        expected_role = "user"
                        for m in raw_msgs:
                            if isinstance(m, dict) and m.get("role") == expected_role:
                                c_txt = str(m.get("content", "")).strip()
                                if c_txt and not has_unsafe_content(c_txt):
                                    cleaned_turns.append({"role": expected_role, "content": c_txt[:1400]})
                                    expected_role = "assistant" if expected_role == "user" else "user"
                            if len(cleaned_turns) >= 4:
                                break
                        # Must end on an assistant turn
                        if len(cleaned_turns) % 2 == 1:
                            cleaned_turns.pop()
                        if len(cleaned_turns) >= 2:
                            fmt = "multi_turn" if len(cleaned_turns) >= 4 else "dialogue"
                            extra_rows.append(
                                {
                                    "id": f"hf-astrochat-{count:03d}",
                                    "category": category,
                                    "format": fmt,
                                    "language": "en",
                                    "source": repo_id,
                                    "messages": [{"role": "system", "content": SYSTEM_PROMPT_EN}] + cleaned_turns,
                                }
                            )
                            count += 1

                elif repo_id == "quantaRoche/nasa-smd-qa-benchmark-cleaned":
                    q_txt = str(item.get("question", "")).strip()
                    ctx = str(item.get("context", "")).strip()
                    ans_obj = item.get("answers", {})
                    ans_list = ans_obj.get("text", []) if isinstance(ans_obj, dict) else []
                    ans_txt = str(ans_list[0]).strip() if ans_list else ""
                    if q_txt and ctx and ans_txt and not item.get("is_impossible", False) and not has_unsafe_content(q_txt + " " + ans_txt):
                        extra_rows.append(
                            {
                                "id": f"hf-nasasmd-{count:03d}",
                                "category": category,
                                "format": "dialogue",
                                "language": "en",
                                "source": repo_id,
                                "messages": [
                                    {"role": "system", "content": SYSTEM_PROMPT_EN},
                                    {
                                        "role": "user",
                                        "content": f"[NASA_RAG_CONTEXT]\n{ctx[:1200]}\n[/NASA_RAG_CONTEXT]\n{q_txt}",
                                    },
                                    {
                                        "role": "assistant",
                                        "content": f"Based on the verified NASA Science Mission Directorate reference: **{ans_txt}**. ({ctx[:400]})",
                                    },
                                ],
                            }
                        )
                        count += 1

                elif repo_id == "allenai/sciq":
                    q_txt = str(item.get("question", "")).strip()
                    ans_txt = str(item.get("correct_answer", "")).strip()
                    sup_txt = str(item.get("support", "")).strip()
                    words = set(re.findall(r"[a-z]+", (q_txt + " " + sup_txt).lower()))
                    if (
                        not q_txt
                        or not ans_txt
                        or len(sup_txt) < 40
                        or not (words & physics_keywords)
                        or has_unsafe_content(q_txt + " " + ans_txt + " " + sup_txt)
                    ):
                        continue
                    extra_rows.append(
                        {
                            "id": f"hf-sciq-{count:03d}",
                            "category": category,
                            "format": "dialogue",
                            "language": "en",
                            "source": repo_id,
                            "messages": [
                                {"role": "system", "content": SYSTEM_PROMPT_EN},
                                {
                                    "role": "user",
                                    "content": f"[NASA_RAG_CONTEXT]\n{sup_txt[:1000]}\n[/NASA_RAG_CONTEXT]\n{q_txt}",
                                },
                                {
                                    "role": "assistant",
                                    "content": f"**{ans_txt}** — {sup_txt[:700]}",
                                },
                            ],
                        }
                    )
                    count += 1

                elif repo_id == "google/Synthetic-Persona-Chat":
                    conv = str(item.get("Best Generated Conversation", "")).strip()
                    lines = [ln.strip() for ln in conv.splitlines() if ln.strip()]
                    if len(lines) >= 2 and ":" in lines[0] and ":" in lines[1]:
                        u_msg = lines[0].split(":", 1)[1].strip()
                        a_msg = lines[1].split(":", 1)[1].strip()
                        combined = u_msg + " " + a_msg
                        words = set(re.findall(r"[a-z]+", combined.lower()))
                        # Reject placeholders like [user 1's name], adult clinical/work words, or unsafe words
                        if (
                            20 <= len(u_msg) <= 220
                            and 20 <= len(a_msg) <= 260
                            and not has_unsafe_content(combined)
                            and not (words & adult_clinical_words)
                            and "i'm " not in u_msg.lower()
                            and "my name" not in combined.lower()
                        ):
                            extra_rows.append(
                                {
                                    "id": f"hf-persona-{count:03d}",
                                    "category": category,
                                    "format": "dialogue",
                                    "language": "en",
                                    "source": repo_id,
                                    "messages": [
                                        {"role": "system", "content": SYSTEM_PROMPT_EN},
                                        {"role": "user", "content": u_msg},
                                        {
                                            "role": "assistant",
                                            "content": f"{a_msg} Out here on the outpost, sharing positive hobbies and stories keeps crew morale above 60!",
                                        },
                                    ],
                                }
                            )
                            count += 1

                elif repo_id == "facebook/empathetic_dialogues":
                    # Only pair true speaker (utterance_idx == 0) with empathetic listener (utterance_idx == 1) in same conv_id
                    if prev_emp_item is not None and item.get("conv_id") == prev_emp_item.get("conv_id") and item.get("utterance_idx") == 1 and prev_emp_item.get("utterance_idx") == 0:
                        u_msg = str(prev_emp_item.get("utterance", "")).replace("_comma_", ",").strip()
                        a_msg = str(item.get("utterance", "")).replace("_comma_", ",").strip()
                        combined = u_msg + " " + a_msg
                        words = set(re.findall(r"[a-z]+", combined.lower()))
                        # Ensure the listener is responding to the user, not telling a first-person story
                        if (
                            25 <= len(u_msg) <= 260
                            and 20 <= len(a_msg) <= 260
                            and not has_unsafe_content(combined)
                            and not (words & adult_clinical_words)
                            and not a_msg.lower().startswith(("i was ", "i had ", "when i ", "my mom", "my dad"))
                        ):
                            extra_rows.append(
                                {
                                    "id": f"hf-empathetic-{count:03d}",
                                    "category": category,
                                    "format": "dialogue",
                                    "language": "en",
                                    "source": repo_id,
                                    "messages": [
                                        {"role": "system", "content": SYSTEM_PROMPT_EN},
                                        {"role": "user", "content": u_msg},
                                        {
                                            "role": "assistant",
                                            "content": f"{a_msg} Remember, Cadet, on a long space mission we always support each other—take a slow breath and let's tackle today one step at a time.",
                                        },
                                    ],
                                }
                            )
                            count += 1
                    prev_emp_item = item

                elif repo_id == "ShenLab/MentalChat16K":
                    raw_u = str(item.get("instruction", "") + "\n" + str(item.get("input", ""))).strip()
                    # Strip embedded system prompt prefix ("You are a helpful mental health counselling assistant... The patient says:")
                    clean_u = re.sub(
                        r"^.*?(?:The patient says:|description\.|questions based on the patient's description\.)\s*",
                        "",
                        raw_u,
                        flags=re.DOTALL | re.IGNORECASE,
                    ).strip()
                    clean_a = str(item.get("output", "")).strip()
                    combined = clean_u + " " + clean_a
                    words = set(re.findall(r"[a-z]+", combined.lower()))
                    if (
                        30 <= len(clean_u) <= 300
                        and 60 <= len(clean_a) <= 900
                        and not has_unsafe_content(combined)
                        and not (words & adult_clinical_words)
                    ):
                        # Keep first 2-3 warm supportive sentences and close in AstroCopilot voice
                        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean_a) if s.strip()]
                        concise_a = " ".join(sentences[:3])[:480]
                        extra_rows.append(
                            {
                                "id": f"hf-mentalchat-{count:03d}",
                                "category": category,
                                "format": "dialogue",
                                "language": "en",
                                "source": repo_id,
                                "messages": [
                                    {"role": "system", "content": SYSTEM_PROMPT_EN},
                                    {"role": "user", "content": clean_u},
                                    {
                                        "role": "assistant",
                                        "content": (
                                            f"{concise_a} Out here on our mission, taking a 4-4-4-4 box-breathing pause, drinking water, "
                                            "and talking openly with your crewmates keeps everyone strong!"
                                        ),
                                    },
                                ],
                            }
                        )
                        count += 1

                elif repo_id == "dair-ai/emotion":
                    txt = str(item.get("text", "")).strip()
                    lbl = emotion_map.get(item.get("label"), "stress")
                    words = set(re.findall(r"[a-z]+", txt.lower()))
                    if len(txt) < 25 or has_unsafe_content(txt) or (words & adult_clinical_words):
                        continue
                    extra_rows.append(
                        {
                            "id": f"hf-emotion-{count:03d}",
                            "category": category,
                            "format": "dialogue",
                            "language": "en",
                            "source": repo_id,
                            "messages": [
                                {"role": "system", "content": SYSTEM_PROMPT_EN},
                                {"role": "user", "content": f"Crew member personal log entry: \"{txt}\"\nHow should I respond as mission commander?"},
                                {
                                    "role": "assistant",
                                    "content": (
                                        f"Our crew emotion telemetry detects primarily **{lbl}** in that log entry. "
                                        + (
                                            "High morale is great—channel that positive energy into science and teamwork while keeping routine hydration (2.6 L/day) on track!"
                                            if lbl in {"joy", "love", "surprise"}
                                            else "In an isolated 200 m3 outpost, unaddressed stress or sadness can pull crew morale below 35 (slowing repairs by 50%). Check in warmly, offer a break with fresh greenhouse greens (+8 morale), and guide a slow 4-4-4-4 breathing pause."
                                        )
                                    ),
                                },
                            ],
                        }
                    )
                    count += 1

                elif repo_id == "patrickfleith/NASA-History-MCQ":
                    q_txt = str(item.get("question", "")).strip()
                    ans = str(item.get("correct_answer", "")).strip()
                    doc = str(item.get("source_document", "")).strip()
                    if q_txt and ans and not has_unsafe_content(q_txt + " " + ans):
                        a_txt = f"{ans}" + (f" (Context: {doc[:500]})" if doc else "")
                        extra_rows.append(
                            {
                                "id": f"hf-nasahist-{count:03d}",
                                "category": category,
                                "format": "dialogue",
                                "language": "en",
                                "source": repo_id,
                                "messages": [
                                    {"role": "system", "content": SYSTEM_PROMPT_EN},
                                    {"role": "user", "content": q_txt},
                                    {"role": "assistant", "content": a_txt},
                                ],
                            }
                        )
                        count += 1

                elif repo_id == "patrickfleith/Astro-mcqa":
                    q_txt = str(item.get("question", "")).strip()
                    just = str(item.get("justification", "")).strip()
                    if q_txt and just and not has_unsafe_content(q_txt + " " + just):
                        extra_rows.append(
                            {
                                "id": f"hf-astromcqa-{count:03d}",
                                "category": category,
                                "format": "dialogue",
                                "language": "en",
                                "source": repo_id,
                                "messages": [
                                    {"role": "system", "content": SYSTEM_PROMPT_EN},
                                    {"role": "user", "content": q_txt},
                                    {"role": "assistant", "content": just[:1600]},
                                ],
                            }
                        )
                        count += 1

                elif repo_id == "patrickfleith/synthgenai-space-engineering-instruct-1k":
                    gen_entry = item.get("generated_entry")
                    msgs = gen_entry.get("messages", []) if isinstance(gen_entry, dict) else []
                    u_msg, a_msg = "", ""
                    for m in msgs:
                        if m.get("role") == "user" and not u_msg:
                            u_msg = str(m.get("content", "")).strip()
                        elif m.get("role") == "assistant" and u_msg and not a_msg:
                            a_msg = str(m.get("content", "")).strip()
                    if u_msg and a_msg and not has_unsafe_content(u_msg + " " + a_msg):
                        extra_rows.append(
                            {
                                "id": f"hf-synthspace-{count:03d}",
                                "category": category,
                                "format": "dialogue",
                                "language": "en",
                                "source": repo_id,
                                "messages": [
                                    {"role": "system", "content": SYSTEM_PROMPT_EN},
                                    {"role": "user", "content": u_msg},
                                    {"role": "assistant", "content": a_msg[:1800]},
                                ],
                            }
                        )
                        count += 1

            print(f"[HF] {repo_id}: +{count} verified English examples")
        except Exception as exc:
            print(f"[HF] Warning on {repo_id}: {exc}")

    return extra_rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    lines = [json.dumps(r, ensure_ascii=False) for r in rows]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build 100% English Master Dataset for AstroCopilot.")
    parser.add_argument("--fetch-hf", action="store_true", help="Fetch and filter live English subsets from Hugging Face.")
    parser.add_argument("--max-hf-per-source", type=int, default=100, help="Max examples per Hugging Face dataset.")
    args = parser.parse_args()

    image_paths = generate_training_images(IMAGES_DIR)
    print(f"Generated {len(image_paths)} English tactical simulator images in {IMAGES_DIR}")

    train_rows, eval_rows = build_verified_english_examples(image_paths)

    if args.fetch_hf or (DATA_DIR / "raw_hf_cache.jsonl").exists():
        train_rows.extend(fetch_huggingface_supplements(max_per_source=args.max_hf_per_source))

    out_train = DATA_DIR / "astrocopilot_master_train.jsonl"
    out_eval = DATA_DIR / "astrocopilot_master_eval.jsonl"
    write_jsonl(out_train, train_rows)
    write_jsonl(out_eval, eval_rows)

    print(f"Master English dataset written:\n  Train: {out_train} ({len(train_rows)} examples)\n  Eval:  {out_eval} ({len(eval_rows)} examples)")


if __name__ == "__main__":
    main()
