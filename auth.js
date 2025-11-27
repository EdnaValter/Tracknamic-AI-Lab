const SESSION_KEY = 'ai-lab-session';
const USERS_KEY = 'ai-lab-users';
const ALLOWED_DOMAINS = ['tracknamic.com', 'tracknamic.ai'];
const memoryStore = { [SESSION_KEY]: null, [USERS_KEY]: [] };

const hasLocalStorage = () => typeof localStorage !== 'undefined';
const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

function readStore(key, fallback) {
  if (hasLocalStorage()) {
    const raw = localStorage.getItem(key);
    if (!raw) return clone(fallback);
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('Failed to parse auth store', error);
      return clone(fallback);
    }
  }
  return clone(memoryStore[key] ?? fallback);
}

function writeStore(key, value) {
  if (hasLocalStorage()) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  memoryStore[key] = value;
}

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function deriveNameFromEmail(email) {
  const [username] = email.split('@');
  if (!username) return 'Tracknamic Teammate';
  return username
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function createUserRecord(email, name) {
  const normalizedEmail = normalizeEmail(email);
  return {
    id: `user-${crypto.randomUUID()}`,
    email: normalizedEmail,
    name: name?.trim() || deriveNameFromEmail(normalizedEmail),
    createdAt: Date.now(),
    source: 'Tracknamic SSO',
  };
}

function getUsers() {
  return readStore(USERS_KEY, []);
}

function saveUsers(users) {
  writeStore(USERS_KEY, users);
}

function setSession(userId) {
  writeStore(SESSION_KEY, userId);
}

function getSessionUserId() {
  return readStore(SESSION_KEY, null);
}

export function getCurrentUser() {
  const sessionId = getSessionUserId();
  if (!sessionId) return null;
  return getUsers().find((u) => u.id === sessionId) ?? null;
}

export function authenticateUser({ email, name }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');
  const [, domain] = normalizedEmail.split('@');
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    throw new Error('Use your Tracknamic email to sign in.');
  }

  const users = getUsers();
  const existing = users.find((u) => u.email === normalizedEmail);
  const user = existing ?? createUserRecord(normalizedEmail, name);

  if (!existing) {
    saveUsers([user, ...users]);
  }
  setSession(user.id);
  return user;
}

export function logoutUser() {
  setSession(null);
}

export function requireAuth(redirectPath = '/login.html') {
  const current = getCurrentUser();
  if (!current && typeof window !== 'undefined') {
    const target = new URL(redirectPath, window.location.origin);
    if (window.location.pathname !== target.pathname) {
      target.searchParams.set('returnTo', window.location.pathname);
    }
    window.location.replace(target.toString());
  }
  return current;
}

export function renderUserControls(options = {}) {
  if (typeof document === 'undefined') return;
  const user = getCurrentUser();
  if (!user) return;
  const {
    containerId = 'user-chip',
    nameId = 'user-name',
    emailId = 'user-email',
    logoutId = 'logout-button',
  } = options;

  const container = document.getElementById(containerId);
  const nameEl = document.getElementById(nameId);
  const emailEl = document.getElementById(emailId);
  const logoutBtn = document.getElementById(logoutId);

  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (container) container.hidden = false;

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutUser();
      if (typeof window !== 'undefined') {
        window.location.replace('/login.html');
      }
    });
  }
}

export function getUserApiShape() {
  const user = getCurrentUser();
  if (!user) return null;
  const { id, name, email } = user;
  return { id, name, email };
}
