// Auth stub — replace with @pmg/auth in Phase 4
// This allows the app to build and run without auth configured

export const auth = {
  api: {
    getSession: async (_opts: { headers: Headers }) => {
      // Return null session — all protected routes will redirect to login
      return null;
    },
    hasPermission: async (_opts: {
      headers: Headers;
      body: { permissions: Record<string, string[]> };
    }) => {
      // Return false for all permissions in stub mode
      return { success: false };
    },
    signUpEmail: async (_opts: unknown) => {
      return null;
    },
    acceptInvitation: async (_opts: unknown) => {
      return null;
    },
    updateUser: async (_opts: unknown) => {
      return null;
    },
    sendVerificationEmail: async (_opts: unknown) => {
      return null;
    },
    changePassword: async (_opts: unknown) => {
      return null;
    },
  },
};

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

export type User = Session['user'];
