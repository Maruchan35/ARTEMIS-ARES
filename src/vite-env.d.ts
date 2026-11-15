/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional URL of the KATHERINE mentor bridge (ai_bridge/mentor_server.py). */
  readonly VITE_MENTOR_URL?: string;
}
