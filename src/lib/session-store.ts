// In-memory session store (subject -> cookies)
// In production, use Redis or similar persistent store
const sessionStore = new Map<string, string>();

export { sessionStore };
