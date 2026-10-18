import { Memory, CoupleProfile, SecuritySettings } from '../types/vault';
import { initialMemories, initialCoupleProfile } from '../data/initialMemories';

const STORAGE_KEYS = {
  MEMORIES: 'bondlock_vault_memories_v1',
  COUPLE: 'bondlock_vault_couple_v1',
  SECURITY: 'bondlock_vault_security_v1',
  IS_FROZEN: 'bondlock_vault_frozen_v1',
};

const defaultSecuritySettings: SecuritySettings = {
  antiScreenshotWatermark: true,
  autoLockMinutes: 5,
  duressPinConfigured: true,
  biometricRequired: true,
  blurByDefault: true,
  soundEnabled: true,
};

export const storage = {
  getMemories(): Memory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : initialMemories;
    } catch {
      return initialMemories;
    }
  },

  saveMemories(memories: Memory[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save memories to storage', e);
    }
  },

  getCoupleProfile(): CoupleProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COUPLE);
      return data ? JSON.parse(data) : initialCoupleProfile;
    } catch {
      return initialCoupleProfile;
    }
  },

  saveCoupleProfile(profile: CoupleProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  getSecuritySettings(): SecuritySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SECURITY);
      return data ? { ...defaultSecuritySettings, ...JSON.parse(data) } : defaultSecuritySettings;
    } catch {
      return defaultSecuritySettings;
    }
  },

  saveSecuritySettings(settings: SecuritySettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  getIsFrozen(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_FROZEN) === 'true';
  },

  setFrozen(frozen: boolean) {
    if (frozen) {
      localStorage.setItem(STORAGE_KEYS.IS_FROZEN, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.IS_FROZEN);
    }
  },

  resetVault() {
    localStorage.removeItem(STORAGE_KEYS.MEMORIES);
    localStorage.removeItem(STORAGE_KEYS.IS_FROZEN);
  },
};
