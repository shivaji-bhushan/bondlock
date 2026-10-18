import { Memory, CoupleProfile, SecuritySettings, Vault, VaultMember, UserAccount } from '../types/vault';
import { initialMemories, initialCoupleProfile } from '../data/initialMemories';

const STORAGE_KEYS = {
  MEMORIES: 'bondlock_vault_memories_v1',
  COUPLE: 'bondlock_vault_couple_v1',
  SECURITY: 'bondlock_vault_security_v1',
  IS_FROZEN: 'bondlock_vault_frozen_v1',
  VAULTS: 'bondlock_vaults_v2',
  VAULT_MEMBERS: 'bondlock_vault_members_v2',
  ACTIVE_USER: 'bondlock_active_user_v2',
};

const defaultSecuritySettings: SecuritySettings = {
  antiScreenshotWatermark: true,
  autoLockMinutes: 5,
  duressPinConfigured: true,
  biometricRequired: true,
  blurByDefault: true,
  soundEnabled: true,
};

const defaultVault: Vault = {
  id: 'vault_demo_1',
  name: "Aarav & Ananya's Sanctuary",
  inviteCode: '882104',
  createdAt: 1700000000000,
};

const defaultMembers: VaultMember[] = [
  { userId: 'user_aarav', vaultId: 'vault_demo_1', role: 'partner1', joinedAt: 1700000000000 },
  { userId: 'user_ananya', vaultId: 'vault_demo_1', role: 'partner2', joinedAt: 1700000000000 },
];

const defaultUsers: UserAccount[] = [
  {
    id: 'user_aarav',
    email: 'aarav@bondlock.vault',
    username: 'aarav',
    name: 'Aarav',
    avatar: initialCoupleProfile.partner1.avatar,
    pin: '1404',
    role: 'partner1',
    vaultId: 'vault_demo_1',
  },
  {
    id: 'user_ananya',
    email: 'ananya@bondlock.vault',
    username: 'ananya',
    name: 'Ananya',
    avatar: initialCoupleProfile.partner2.avatar,
    pin: '2512',
    role: 'partner2',
    vaultId: 'vault_demo_1',
  },
];

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

  // --- Vaults Management ---
  getVaults(): Vault[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VAULTS);
      return data ? JSON.parse(data) : [defaultVault];
    } catch {
      return [defaultVault];
    }
  },

  saveVaults(vaults: Vault[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULTS, JSON.stringify(vaults));
    } catch (e) {
      console.error('Failed to save vaults', e);
    }
  },

  getVaultById(id: string): Vault | null {
    const vaults = this.getVaults();
    return vaults.find((v) => v.id === id) || null;
  },

  getVaultByCode(code: string): Vault | null {
    const cleanCode = code.trim().toUpperCase();
    const vaults = this.getVaults();
    return vaults.find((v) => v.inviteCode.toUpperCase() === cleanCode) || null;
  },

  createVault(name: string, inviteCode?: string): Vault {
    const code = inviteCode ? inviteCode.trim().toUpperCase() : Math.floor(100000 + Math.random() * 900000).toString();
    const newVault: Vault = {
      id: `vault_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name || "Our Private Sanctuary",
      inviteCode: code,
      createdAt: Date.now(),
    };
    const vaults = this.getVaults();
    vaults.push(newVault);
    this.saveVaults(vaults);
    return newVault;
  },

  // --- Junction Relation: vault_members ---
  getVaultMembers(): VaultMember[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VAULT_MEMBERS);
      return data ? JSON.parse(data) : defaultMembers;
    } catch {
      return defaultMembers;
    }
  },

  saveVaultMembers(members: VaultMember[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULT_MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save vault members', e);
    }
  },

  getMemberVault(userId: string): Vault | null {
    const members = this.getVaultMembers();
    const membership = members.find((m) => m.userId === userId);
    if (!membership) return null;
    return this.getVaultById(membership.vaultId);
  },

  getVaultMembership(userId: string): VaultMember | null {
    const members = this.getVaultMembers();
    return members.find((m) => m.userId === userId) || null;
  },

  linkUserToVault(userId: string, vaultId: string, role: 'partner1' | 'partner2') {
    const members = this.getVaultMembers().filter((m) => m.userId !== userId);
    members.push({
      userId,
      vaultId,
      role,
      joinedAt: Date.now(),
    });
    this.saveVaultMembers(members);

    // Also update UserAccount record
    const user = this.getUserAccount(userId);
    if (user) {
      user.vaultId = vaultId;
      user.role = role;
      this.saveUserAccount(user);
    }
  },

  unlinkUserFromVault(userId: string) {
    const members = this.getVaultMembers().filter((m) => m.userId !== userId);
    this.saveVaultMembers(members);

    const user = this.getUserAccount(userId);
    if (user) {
      user.vaultId = null;
      this.saveUserAccount(user);
    }
  },

  // --- User Accounts ---
  getUserAccounts(): UserAccount[] {
    try {
      const data = localStorage.getItem('bondlock_registered_accounts_v2');
      return data ? JSON.parse(data) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  },

  saveUserAccounts(accounts: UserAccount[]) {
    try {
      localStorage.setItem('bondlock_registered_accounts_v2', JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts', e);
    }
  },

  getUserAccount(userId: string): UserAccount | null {
    const accounts = this.getUserAccounts();
    return accounts.find((a) => a.id === userId || a.username.toLowerCase() === userId.toLowerCase()) || null;
  },

  saveUserAccount(account: UserAccount) {
    const accounts = this.getUserAccounts().filter(
      (a) => a.id !== account.id && a.username.toLowerCase() !== account.username.toLowerCase()
    );
    accounts.push(account);
    this.saveUserAccounts(accounts);
  },

  getActiveUserId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    } catch {
      return null;
    }
  },

  setActiveUserId(userId: string | null) {
    try {
      if (userId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, userId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
      }
    } catch (e) {}
  },
};

