'use server';

// Auth stub — all permission checks return true until Phase 4
export const checkIfAdmin = async () => true;

export const checkPermission = async (
  _resource: string,
  _action: string
): Promise<boolean> => true;
