
/**
 * Service Google Drive désactivé.
 * L'application utilise désormais uniquement la sauvegarde JSON manuelle.
 */
export const driveService = {
  isConfigured: () => false,
  init: () => {},
  signIn: async () => { throw new Error("Service désactivé"); },
  saveToCloud: async () => {},
  loadFromCloud: async () => null
};
