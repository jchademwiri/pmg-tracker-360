import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

const ADMIN_PRODUCTION_URL = 'https://admin.tendertrack360.co.za';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_ADMIN_URL ||
        process.env.ADMIN_PUBLIC_URL ||
        (process.env.NODE_ENV === 'production'
          ? ADMIN_PRODUCTION_URL
          : 'http://localhost:3001'),
  plugins: [magicLinkClient()],
});
