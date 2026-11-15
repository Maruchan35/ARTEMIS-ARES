import React, { useState } from 'react';
import { BookOpen, Newspaper, ShieldCheck, Unlock, Lock } from 'lucide-react';
import { LEGACY_NOTES, SPACE_PAPER_EDITIONS, SpacePaperEdition } from '../data/aether4StoryData';
import { NASA_REFERENCES } from '../data/nasaConstants';

interface SpacePaperCodexModalProps {
  lang: 'es' | 'en';
  unlockedPapers: number[];
  unlockedNotes: number[];
  initialTab?: 'papers' | 'notes';
  initialPaperId?: number;
  initialNoteId?: number;
  onClose: () => void;
}

const EditionVectorDiagram: React.FC<{ motif: SpacePaperEdition['motif'] }> = ({ motif }) => {
  switch (motif) {
    case 'meds':
      return (
        <svg viewBox="0 0 280 128" className="w-full h-28 border-2 border-[#0F2547] bg-[#F4F6F8]">
          <rect x="6" y="6" width="268" height="116" fill="#e2e8f0" stroke="#0F2547" strokeWidth="2" />
          {/* 11 LCD glass cockpit screens grid */}
          {[22, 72, 122, 172, 222].map((x) => (
            <rect key={x} x={x} y="16" width="38" height="28" fill="#0F2547" stroke="#1e293b" strokeWidth="2" />
          ))}
          {[22, 72, 122, 172].map((x) => (
            <rect key={`b${x}`} x={x} y="54" width="38" height="28" fill="#0F2547" stroke="#1e293b" strokeWidth="2" />
          ))}
          <rect x="222" y="54" width="38" height="28" fill="#1e293b" stroke="#0F2547" strokeWidth="2" />
          {/* HUD vectors inside screens */}
          <path d="M27 30 L55 30 M41 20 L41 40" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M77 32 Q91 18 105 32" stroke="#22c55e" strokeWidth="1.5" fill="none" />
          <rect x="128" y="23" width="26" height="14" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
          {/* Flight stick + glare shield base */}
          <path d="M12 96 L268 96 L252 116 L28 116 Z" fill="#7A8288" stroke="#0F2547" strokeWidth="2" />
          {/* Hand-drawn crimson circle highlighting LCD matrix */}
          <ellipse cx="116" cy="48" rx="92" ry="38" fill="none" stroke="#D93025" strokeWidth="3.2" strokeDasharray="340 12" transform="rotate(-2 116 48)" />
        </svg>
      );
    case 'whc':
      return (
        <svg viewBox="0 0 280 128" className="w-full h-28 border-2 border-[#0F2547] bg-[#F4F6F8]">
          <rect x="6" y="6" width="268" height="116" fill="#edf2f7" stroke="#0F2547" strokeWidth="2" />
          {/* Aluminum rack body */}
          <rect x="28" y="16" width="110" height="96" fill="#cbd5e1" stroke="#0F2547" strokeWidth="2" />
          <rect x="150" y="16" width="98" height="96" fill="#e2e8f0" stroke="#0F2547" strokeWidth="2" />
          {/* Blue hoses */}
          <path d="M98 42 C130 42, 130 84, 175 84" stroke="#0284c7" strokeWidth="7" fill="none" />
          <path d="M98 42 C130 42, 130 84, 175 84" stroke="#0F2547" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
          {/* Ceramic suction funnel */}
          <polygon points="175,42 225,42 212,78 188,78" fill="#ffffff" stroke="#0F2547" strokeWidth="2.5" />
          {/* Crimson shut-off valve */}
          <circle cx="118" cy="36" r="10" fill="#D93025" stroke="#0F2547" strokeWidth="2" />
          <line x1="110" y1="36" x2="126" y2="36" stroke="#ffffff" strokeWidth="2" />
          <ellipse cx="195" cy="58" rx="46" ry="34" fill="none" stroke="#D93025" strokeWidth="3.2" />
        </svg>
      );
    case 'aph':
      return (
        <svg viewBox="0 0 280 128" className="w-full h-28 border-2 border-[#0F2547] bg-[#1e0b2e]">
          <rect x="6" y="6" width="268" height="116" fill="#2e1046" stroke="#0F2547" strokeWidth="2" />
          {/* GLA Magenta + Blue LED Strip */}
          <rect x="30" y="14" width="220" height="10" fill="#e879f9" stroke="#ffffff" strokeWidth="1" />
          <polygon points="35,24 245,24 260,112 20,112" fill="#d946ef" opacity="0.22" />
          {/* Porous clay pillows & VEG-05 shoots */}
          {[55, 115, 175, 225].map((x) => (
            <g key={x}>
              <rect x={x - 16} y="88" width="32" height="16" rx="4" fill="#94a3b8" stroke="#0F2547" strokeWidth="2" />
              <path d={`M${x} 88 L${x} 52`} stroke="#4ade80" strokeWidth="3" />
              <ellipse cx={x - 9} cy="64" rx="8" ry="4" fill="#22c55e" />
              <ellipse cx={x + 9} cy="58" rx="8" ry="4" fill="#22c55e" />
              <circle cx={x + 4} cy="72" r="4" fill="#ef4444" />
            </g>
          ))}
          <ellipse cx="175" cy="74" rx="68" ry="38" fill="none" stroke="#D93025" strokeWidth="3.2" />
        </svg>
      );
    case 'nbl':
      return (
        <svg viewBox="0 0 280 128" className="w-full h-28 border-2 border-[#0F2547] bg-[#0F2547]">
          <rect x="6" y="6" width="268" height="116" fill="#0F2547" stroke="#ffffff" strokeWidth="1.5" />
          {/* Submerged ISS truss grid */}
          <line x1="20" y1="88" x2="260" y2="88" stroke="#38bdf8" strokeWidth="2" />
          <rect x="36" y="54" width="84" height="34" fill="none" stroke="#93c5fd" strokeWidth="2" />
          {/* Tether + EVA diver silhouette */}
          <path d="M120 70 Q150 40 182 54" stroke="#D93025" strokeWidth="2.2" fill="none" strokeDasharray="5 3" />
          <rect x="180" y="34" width="26" height="34" rx="7" fill="#F4F6F8" stroke="#080A0F" strokeWidth="2" />
          <circle cx="193" cy="30" r="10" fill="#F4F6F8" stroke="#080A0F" strokeWidth="2" />
          <rect x="186" y="25" width="14" height="8" rx="3" fill="#f59e0b" />
          {/* Depth text */}
          <text x="20" y="26" fill="#bae6fd" fontSize="9" fontWeight="bold" fontFamily="monospace">
            61.5m x 31.1m x 12.2m (6.2M GAL)
          </text>
          <ellipse cx="192" cy="48" rx="40" ry="36" fill="none" stroke="#D93025" strokeWidth="3.2" />
        </svg>
      );
    case 'staging':
      return (
        <svg viewBox="0 0 280 128" className="w-full h-28 border-2 border-[#0F2547] bg-[#0F2547]">
          <rect x="6" y="6" width="268" height="116" fill="#0F2547" stroke="#ffffff" strokeWidth="1.5" />
          {/* Blueprint orthogonal grid */}
          <path d="M0 32 H280 M0 64 H280 M0 96 H280 M70 0 V128 M140 0 V128 M210 0 V128" stroke="#38bdf8" strokeOpacity="0.22" strokeWidth="1" />
          {/* Core stage */}
          <rect x="128" y="18" width="24" height="82" fill="#F4F6F8" stroke="#080A0F" strokeWidth="2" />
          <polygon points="128,18 140,6 152,18" fill="#D93025" />
          {/* Separating twin SRBs in wireframe dashed crimson */}
          <rect x="78" y="38" width="14" height="66" fill="#7A8288" stroke="#D93025" strokeWidth="2" strokeDasharray="4 2" transform="rotate(-14 85 70)" />
          <rect x="188" y="38" width="14" height="66" fill="#7A8288" stroke="#D93025" strokeWidth="2" strokeDasharray="4 2" transform="rotate(14 195 70)" />
          <ellipse cx="195" cy="70" rx="34" ry="44" fill="none" stroke="#D93025" strokeWidth="3.2" />
          <text x="16" y="24" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="monospace">
            STS T+124s / SLS T+120s
          </text>
        </svg>
      );
    case 'fsp':
      return (
        <svg viewBox="0 0 280 128" className="w-full h-28 border-2 border-[#0F2547] bg-[#1e1b18]">
          <rect x="6" y="6" width="268" height="116" fill="#271914" stroke="#0F2547" strokeWidth="2" />
          {/* Darkened solar sun blocked */}
          <circle cx="242" cy="28" r="11" fill="#78350f" opacity="0.55" />
          <text x="14" y="24" fill="#fca5a5" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
            99.9998% SOLAR BLOCKOUT · 40 kWe FSP
          </text>
          {/* KRUSTY Reactor Core + Umbrella Radiator Wings */}
          <rect x="130" y="64" width="20" height="46" fill="#7A8288" stroke="#F4F6F8" strokeWidth="1.5" />
          <polygon points="50,64 230,64 205,40 75,40" fill="#0F2547" stroke="#F4F6F8" strokeWidth="2" />
          <circle cx="140" cy="86" r="6" fill="#fbbf24" />
          <ellipse cx="140" cy="54" rx="94" ry="26" fill="none" stroke="#D93025" strokeWidth="3.2" />
        </svg>
      );
  }
};

export const SpacePaperCodexModal: React.FC<SpacePaperCodexModalProps> = ({
  lang,
  unlockedPapers,
  unlockedNotes,
  initialTab = 'papers',
  initialPaperId = 1,
  initialNoteId = 1,
  onClose,
}) => {
  const [tab, setTab] = useState<'papers' | 'notes'>(initialTab);
  const [selectedPaperId, setSelectedPaperId] = useState<number>(initialPaperId);
  const [selectedNoteId, setSelectedNoteId] = useState<number>(initialNoteId);

  const activePaper = SPACE_PAPER_EDITIONS.find((p) => p.id === selectedPaperId) ?? SPACE_PAPER_EDITIONS[0];
  const activeNote = LEGACY_NOTES.find((n) => n.id === selectedNoteId) ?? LEGACY_NOTES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto mc-panel p-4 sm:p-5 space-y-4">
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#090C12] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('papers')}
              className={`mc-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 ${
                tab === 'papers' ? 'mc-btn-orange' : ''
              }`}
            >
              <Newspaper className="w-4 h-4" />
              SPACE PAPER DAILY REPORT ({unlockedPapers.length}/6)
            </button>
            <button
              type="button"
              onClick={() => setTab('notes')}
              className={`mc-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 ${
                tab === 'notes' ? 'mc-btn-blue' : ''
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {lang === 'es' ? `NOTAS DE LEGADO (${unlockedNotes.length}/6)` : `LEGACY NOTES (${unlockedNotes.length}/6)`}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mc-btn px-3 py-1.5 text-xs font-black bg-[#D93025] hover:bg-red-600"
          >
            {lang === 'es' ? 'CERRAR [ESC]' : 'CLOSE [ESC]'}
          </button>
        </div>

        {tab === 'papers' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
            {/* Edition Selector List */}
            <div className="space-y-1.5">
              {SPACE_PAPER_EDITIONS.map((ed) => {
                const isUnlocked = unlockedPapers.includes(ed.id);
                const selected = ed.id === selectedPaperId;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => setSelectedPaperId(ed.id)}
                    className={`w-full text-left p-2.5 mc-btn text-xs transition ${
                      selected ? 'mc-btn-gold ring-2 ring-white' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold opacity-85">
                      <span>ED. #{ed.id} · {ed.dateBox}</span>
                      {isUnlocked ? <Unlock className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 opacity-60" />}
                    </div>
                    <div className="font-black tracking-tight mt-0.5">
                      {ed.headlineFirstWord} {ed.headlineRest}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Authentic Folded 1983 Newsprint Card (imagen_f345a0.jpg layout) */}
            <div className="space-paper-card border-4 border-[#080A0F] p-5 shadow-2xl space-y-3 text-[#080A0F]">
              {/* Top Masthead */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#080A0F] pb-2">
                <div className="px-2.5 py-1 border-2 border-[#080A0F] font-mono text-[11px] font-black tracking-wider bg-white/70">
                  {activePaper.dateBox}
                </div>
                <div className="text-2xl sm:text-3xl font-black tracking-widest uppercase font-serif">
                  SPACE PAPER
                </div>
                <div className="px-2.5 py-1 border-2 border-[#D93025] text-[#D93025] font-mono text-[11px] font-black tracking-widest bg-white/80">
                  DAILY REPORT
                </div>
              </div>

              {/* Crimson Double Divider + Headline with Signature Red Underline on First Word */}
              <div className="border-t-2 border-[#D93025] pt-2">
                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none">
                  <span className="inline-block border-b-4 border-[#D93025] pb-0.5 mr-2">
                    {activePaper.headlineFirstWord}
                  </span>
                  <span>{activePaper.headlineRest}</span>
                </h2>
                <div className="mt-1.5 text-[11px] font-black tracking-widest uppercase text-[#0F2547]">
                  {lang === 'es' ? activePaper.subheadEs : activePaper.subheadEn}
                </div>
              </div>

              {/* Technical Line-Art Diagram + Classic NASA Stamp */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_118px] gap-3 items-center">
                <div>
                  <EditionVectorDiagram motif={activePaper.motif} />
                  <div className="mt-1 text-[10px] font-bold text-[#D93025]">
                    {lang === 'es' ? activePaper.circleNoteEs : activePaper.circleNoteEn}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 border-2 border-dashed border-[#0F2547] bg-white/60 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#0F2547] border-4 border-[#D93025] flex flex-col items-center justify-center text-white font-black shadow-md">
                    <span className="text-[11px] tracking-widest">NASA</span>
                    <span className="text-[8px] text-[#38bdf8]">BVAD · REAL</span>
                  </div>
                  <div className="text-[9px] font-black mt-1 text-[#0F2547] uppercase">
                    ARCHIVO HISTÓRICO #0{activePaper.id}
                  </div>
                </div>
              </div>

              {/* Two Justified Editorial Newsprint Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-justify border-t-2 border-b-2 border-[#080A0F] py-3 font-serif">
                <p>{lang === 'es' ? activePaper.col1Es : activePaper.col1En}</p>
                <p>{lang === 'es' ? activePaper.col2Es : activePaper.col2En}</p>
              </div>

              {/* Bottom Engineering Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono font-black">
                <span className="px-2.5 py-1 bg-[#0F2547] text-white">{activePaper.tagLeft}</span>
                <span className="px-2.5 py-1 bg-[#D93025] text-white">{activePaper.tagRight}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-4">
            {/* Legacy Note Selector */}
            <div className="space-y-1.5">
              {LEGACY_NOTES.map((note) => {
                const isUnlocked = unlockedNotes.includes(note.id);
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`w-full text-left p-2.5 mc-btn text-xs ${
                      selectedNoteId === note.id ? 'mc-btn-blue ring-2 ring-white' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>NOTA #{note.id}</span>
                      {isUnlocked ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <span className="text-[9px] text-slate-300 opacity-75">ARCHIVO</span>
                      )}
                    </div>
                    <div className="font-bold mt-0.5 line-clamp-2">
                      {lang === 'es' ? note.titleEs : note.titleEn}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Legacy Note Detail Card */}
            <div className="mc-panel-white border-4 border-[#080A0F] p-5 space-y-4">
              <div className="border-b-2 border-[#0F2547] pb-2">
                <div className="text-[11px] font-black text-[#D93025] uppercase tracking-wider">
                  {lang === 'es' ? activeNote.archiveEs : activeNote.archiveEn}
                </div>
                <h3 className="text-xl font-black text-[#0F2547] mt-1">
                  {lang === 'es' ? activeNote.titleEs : activeNote.titleEn}
                </h3>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  📍 {lang === 'es' ? activeNote.locationEs : activeNote.locationEn}
                </div>
              </div>
              <blockquote className="p-4 bg-white/80 border-l-4 border-[#0F2547] text-sm leading-relaxed text-[#111827] font-serif">
                “{lang === 'es' ? activeNote.quoteEs : activeNote.quoteEn}”
              </blockquote>
              <div className="pt-2 border-t border-slate-300 text-[10px] font-mono text-slate-700 space-y-1">
                <div className="font-bold text-[#0F2547]">
                  {lang === 'es' ? 'FUENTES CIENTÍFICAS VERIFICADAS (NASA / BVAD):' : 'VERIFIED NASA SCIENTIFIC SOURCES:'}
                </div>
                {NASA_REFERENCES.slice(0, 3).map((ref) => (
                  <div key={ref.id}>
                    • <strong>{ref.id}:</strong> {ref.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
