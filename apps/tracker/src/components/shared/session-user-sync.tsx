'use client';

import { useEffect } from 'react';
import { setSessionUser, type SessionUser } from '@/lib/client-session-store';

export function SessionUserSync({ user }: { user: SessionUser | null }) {
  useEffect(() => {
    setSessionUser(user);
    return () => setSessionUser(null);
  }, [user]);

  return null;
}
