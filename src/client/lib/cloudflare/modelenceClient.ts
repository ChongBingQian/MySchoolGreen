import { ReactNode, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';

type SessionUser = {
  id: string;
  email: string;
  handle: string;
};

type RenderOptions = {
  routesElement: ReactNode;
  errorHandler?: (error: Error) => void;
  loadingElement?: ReactNode;
  favicon?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  email: string;
  password: string;
};

type StoredUser = SessionUser & {
  password: string;
};

const USERS_KEY = 'cloudflare:users';
const SESSION_KEY = 'cloudflare:session';
const SESSION_EVENT = 'cloudflare:session-updated';

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    const seeded: StoredUser[] = [
      {
        id: crypto.randomUUID(),
        email: 'demo@myschoolgreen.app',
        password: 'demo1234',
        handle: 'demo-user',
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    localStorage.removeItem(USERS_KEY);
    return readUsers();
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(user: SessionUser | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function sanitizeHandle(email: string): string {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '-') || 'user';
}

export function renderApp(options: RenderOptions) {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Missing #root element');
  }

  if (options.favicon) {
    const existing = document.querySelector('link[rel="icon"]');
    if (existing) {
      existing.setAttribute('href', options.favicon);
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = options.favicon;
      document.head.appendChild(link);
    }
  }

  if (options.errorHandler) {
    window.addEventListener('error', (event) => {
      options.errorHandler?.(event.error ?? new Error(event.message));
    });
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason));
      options.errorHandler?.(err);
    });
  }

  createRoot(root).render(options.routesElement);
}

export function getConfig(path: string): unknown {
  const values: Record<string, unknown> = {
    '_system.env.type': 'cloudflare',
    'example.modelenceDemoUsername': 'demo@myschoolgreen.app',
    'example.modelenceDemoPassword': 'demo1234',
  };
  return values[path];
}

export async function loginWithPassword(input: LoginInput): Promise<SessionUser> {
  const users = readUsers();
  const match = users.find((user) => user.email === input.email && user.password === input.password);
  if (!match) {
    throw new Error('Invalid email or password');
  }

  const sessionUser: SessionUser = { id: match.id, email: match.email, handle: match.handle };
  writeSession(sessionUser);
  return sessionUser;
}

export async function signupWithPassword(input: SignupInput): Promise<SessionUser> {
  const users = readUsers();
  if (users.some((user) => user.email === input.email)) {
    throw new Error('An account with this email already exists');
  }

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email: input.email,
    password: input.password,
    handle: sanitizeHandle(input.email),
  };

  users.push(newUser);
  writeUsers(users);

  const sessionUser: SessionUser = { id: newUser.id, email: newUser.email, handle: newUser.handle };
  writeSession(sessionUser);
  return sessionUser;
}

export async function logout(): Promise<void> {
  writeSession(null);
}

export function useSession() {
  const user = useSyncExternalStore(
    (onStoreChange) => {
      const handler = () => onStoreChange();
      window.addEventListener(SESSION_EVENT, handler);
      return () => window.removeEventListener(SESSION_EVENT, handler);
    },
    () => ({ user: readSession() }),
    () => ({ user: null })
  );

  return user;
}
