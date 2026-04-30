/**
 * Better Auth catch-all route handler.
 * Handles all /api/auth/* requests: sign-in, sign-up, sign-out,
 * session, organization, invitation, etc.
 */
import { auth } from '@pmg/auth/server';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
