// In-memory session store (subject -> session data)
// In production, use Redis or similar persistent store

export interface SessionData {
  cookies: string;
  email: string;
}

// Use globalThis to persist across HMR in dev mode
const globalForStore = globalThis as unknown as {
  sessionStore: Map<string, SessionData>;
};

const sessionStore =
  globalForStore.sessionStore ?? new Map<string, SessionData>();
globalForStore.sessionStore = sessionStore;

export { sessionStore };
