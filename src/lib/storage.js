const STORAGE_KEY = 'lazyprompter.sessions.v1';

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isMessage = (value) =>
  value &&
  typeof value.id === 'string' &&
  (value.role === 'user' || value.role === 'assistant') &&
  typeof value.content === 'string';

const isSession = (value) =>
  value &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  Array.isArray(value.messages) &&
  // Validating the contents too: a session holding a malformed message would
  // otherwise render as a broken bubble with no way back.
  value.messages.every(isMessage);

export const createSession = () => ({
  id: makeId(),
  title: 'New chat',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
});

export const createMessage = (role, content) => ({
  id: makeId(),
  role,
  content,
  createdAt: Date.now(),
  status: role === 'assistant' ? 'pending' : 'done',
});

// Titles come from what the user actually typed. Nothing is invented.
export const titleFrom = (text) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return 'New chat';
  return flat.length > 42 ? `${flat.slice(0, 42).trimEnd()}...` : flat;
};

export const loadState = () => {
  const fallback = { sessions: [createSession()], activeId: null };
  fallback.activeId = fallback.sessions[0].id;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const sessions = Array.isArray(parsed?.sessions) ? parsed.sessions.filter(isSession) : [];

    if (sessions.length === 0) return fallback;

    // An activeId pointing at a deleted session would render an empty screen.
    const activeId = sessions.some((s) => s.id === parsed.activeId)
      ? parsed.activeId
      : sessions[0].id;

    return { sessions, activeId };
  } catch {
    return fallback;
  }
};

export const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode: the session still works for this tab */
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
};