"use client";

import { useSyncExternalStore } from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

// Module-level singleton (not React context) so components outside the
// dashboard's own subtree — like the globally-mounted HelpWidget in the
// root layout — can read the signed-in user without a client-side
// /api/auth/get-session fetch of their own. The (dashboard) layout already
// resolves the session server-side per request; SessionUserSync just
// publishes that into this store on mount.
let currentUser: SessionUser | null = null;
const listeners = new Set<() => void>();

function usersEqual(a: SessionUser | null, b: SessionUser | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.name === b.name && a.email === b.email;
}

export function setSessionUser(user: SessionUser | null) {
  if (usersEqual(currentUser, user)) return;
  currentUser = user;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentUser;
}

function getServerSnapshot() {
  return null;
}

export function useSessionUser() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
