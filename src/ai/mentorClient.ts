// =============================================================================
// Client for the AstroCopilot mentor server (ai_bridge/mentor_server.py).
// URL priority: ?mentor=<url> → localStorage 'astro.mentorUrl' → VITE_MENTOR_URL → http://localhost:8765
// If the server is down the game keeps working with the verified offline cards.
// =============================================================================

import type { MentorReply, MentorRequest } from './mentorTypes';

export interface MentorServerStatus {
  online: boolean;
  backend: string;
  model?: string;
  ragDocs?: number;
  /** Neural voice offered by the bridge (Supertonic 3), see ai_bridge/mentor_voice.py. */
  voice?: { status: string; voices: string[]; default?: string; hint?: string };
}

const DEFAULT_URL = 'http://localhost:8765';

function readUrl(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('mentor');
    if (q) {
      localStorage.setItem('astro.mentorUrl', q);
      return q;
    }
    const saved = localStorage.getItem('astro.mentorUrl');
    if (saved) return saved;
  } catch {
    /* storage blocked: use defaults */
  }
  const env = import.meta.env.VITE_MENTOR_URL;
  return env || DEFAULT_URL;
}

export const mentorServerUrl = readUrl().replace(/\/+$/, '');

async function fetchJson<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${mentorServerUrl}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function checkMentorServer(): Promise<MentorServerStatus> {
  try {
    const h = await fetchJson<{ ok: boolean; backend: string; model?: string; rag_docs?: number; voice?: MentorServerStatus['voice'] }>(
      '/api/health',
      { method: 'GET' },
      2500
    );
    return { online: !!h.ok, backend: h.backend, model: h.model, ragDocs: h.rag_docs, voice: h.voice };
  } catch {
    return { online: false, backend: 'offline' };
  }
}

interface ServerReply {
  say: string;
  did_you_know?: string;
  check_question?: string;
  sources?: string[];
  mode?: MentorReply['mode'];
  origin?: MentorReply['origin'];
  latency_ms?: number;
}

/** Asks the model. `failed` = network/server error (mark offline); `reply` null = server had nothing useful. */
export async function askMentorServer(req: MentorRequest, timeoutMs = 35000): Promise<{ reply: MentorReply | null; failed: boolean }> {
  try {
    const r = await fetchJson<ServerReply>(
      '/api/mentor',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) },
      timeoutMs
    );
    if (!r || typeof r.say !== 'string' || !r.say.trim()) return { reply: null, failed: false };
    return {
      failed: false,
      reply: {
        say: r.say.trim(),
        didYouKnow: r.did_you_know?.trim() || undefined,
        check: r.check_question?.trim() || undefined,
        sources: r.sources ?? [],
        mode: r.mode ?? 'socratic',
        origin: r.origin ?? 'model',
        latencyMs: r.latency_ms,
      },
    };
  } catch {
    return { reply: null, failed: true };
  }
}
