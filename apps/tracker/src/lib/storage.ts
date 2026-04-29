// Storage stub — Cloudflare R2 integration planned for a later phase
// All methods are no-ops that return safe defaults

export const StorageService = {
  uploadFile: async (_buffer: Buffer, key: string, _contentType: string): Promise<string> => {
    console.warn('[StorageService] uploadFile called but storage is not configured. Key:', key);
    return key;
  },

  getSignedUrl: async (key: string): Promise<string> => {
    // If it's already a full URL, return as-is
    if (key.startsWith('http')) return key;
    // Otherwise return empty string — no image will show
    return '';
  },

  deleteFile: async (key: string): Promise<void> => {
    console.warn('[StorageService] deleteFile called but storage is not configured. Key:', key);
  },
};
