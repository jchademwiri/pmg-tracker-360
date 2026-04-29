// Auth stub — replace with @pmg/auth in Phase 4
// This allows the app to build and run without auth configured

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
    emailVerified?: boolean;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    activeOrganizationId?: string | null;
  };
};

export type User = Session['user'];

export const auth = {
  api: {
    getSession: async (_opts: { headers: Headers }): Promise<Session | null> => {
      return null;
    },
    hasPermission: async (_opts: {
      headers: Headers;
      body: { permissions: Record<string, string[]> };
    }): Promise<{ success: boolean; error?: string }> => {
      return { success: true }; // Allow all in stub mode
    },
    signInEmail: async (_opts: unknown): Promise<null> => null,
    signUpEmail: async (_opts: unknown): Promise<null> => null,
    acceptInvitation: async (_opts: unknown): Promise<null> => null,
    updateUser: async (_opts: unknown): Promise<null> => null,
    sendVerificationEmail: async (_opts: unknown): Promise<null> => null,
    changePassword: async (_opts: unknown): Promise<null> => null,
    addMember: async (_opts: unknown): Promise<null> => null,
  },
};
