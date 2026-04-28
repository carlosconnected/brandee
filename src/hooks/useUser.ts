'use client';

import { useState, useEffect, startTransition } from 'react';

const STORAGE_KEY = 'brandee:user';
const MAX_NAME_LENGTH = 50;

export interface User {
  name: string;
  signedInAt: number;
}

function loadUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    return parsed && typeof parsed.name === 'string' && parsed.name.trim() ? parsed : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const stored = loadUser();
    if (stored) startTransition(() => setUser(stored));
    setHydrated(true);
  }, []);

  function signIn(rawName: string) {
    const name = rawName.replace(/[\n\r]/g, '').trim().slice(0, MAX_NAME_LENGTH);
    if (!name) return;
    const next: User = { name, signedInAt: Date.now() };
    setUser(next);
    persistUser(next);
  }

  function signOut() {
    setUser(null);
    persistUser(null);
  }

  return { user, hydrated, signIn, signOut };
}
