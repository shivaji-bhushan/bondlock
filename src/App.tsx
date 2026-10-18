import React, { useState, useEffect } from 'react';
import { DeviceFrame, ViewMode } from './components/Layout/DeviceFrame';
import { BottomNav, TabType } from './components/Layout/BottomNav';
import { LockScreen } from './components/LockScreen/LockScreen';
import { VaultFeed } from './components/Vault/VaultFeed';
import { VaultExplore } from './components/Vault/VaultExplore';
import { VaultLetters } from './components/Vault/VaultLetters';
import { VaultProfile } from './components/Vault/VaultProfile';
import { SecurityModal } from './components/Security/SecurityModal';
import { PartnerSettingsModal } from './components/Security/PartnerSettingsModal';
import { LoginPage } from './components/Auth/LoginPage';
import { PairingScreen } from './components/Auth/PairingScreen';
import { UserProfileModal } from './components/Security/UserProfileModal';
import { DevSwitcherToolbar } from './components/Dev/DevSwitcherToolbar';
import { storage } from './utils/storage';
import { Memory, CoupleProfile, SecuritySettings, VaultUnlockState, Vault, UserAccount } from './types/vault';
import { sound } from './utils/sound';
import { realtimeVault } from './utils/realtimeVault';
import { ShieldAlert, KeyRound } from 'lucide-react';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeTab, setActiveTab] = useState<TabType>('lock');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockState, setUnlockState] = useState<VaultUnlockState>('LOCKED');
  const [isFrozen, setIsFrozen] = useState(() => storage.getIsFrozen());
  const [memories, setMemories] = useState<Memory[]>(() => storage.getMemories());
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile>(() => storage.getCoupleProfile());
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => storage.getSecuritySettings());

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // User Authentication & Identity State
  const [authenticatedUser, setAuthenticatedUser] = useState<'partner1' | 'partner2' | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  // Real-time Room & Cross-Device Pairing State
  const [roomCode, setRoomCode] = useState<string>('882104');
  const [currentRole, setCurrentRole] = useState<'partner1' | 'partner2'>('partner1');
  const [partnerConnected, setPartnerConnected] = useState(false);

  // Vault membership sync trigger
  const [membershipSync, setMembershipSync] = useState(0);

  // Custom User ID state (stored in storage.getActiveUserId)
  const [customUserId, setCustomUserId] = useState<string | null>(() => storage.getActiveUserId());

  // Derive active user account
  const activeUserId = customUserId || (authenticatedUser === 'partner2' ? 'user_ananya' : 'user_aarav');
  const currentUserAccount: UserAccount = storage.getUserAccount(activeUserId) || {
    id: activeUserId,
    email: `${authenticatedUser || 'aarav'}@bondlock.vault`,
    username: authenticatedUser || 'aarav',
    name: authenticatedUser === 'partner2' ? coupleProfile.partner2.name : coupleProfile.partner1.name,
    avatar: authenticatedUser === 'partner2' ? coupleProfile.partner2.avatar : coupleProfile.partner1.avatar,
    pin: authenticatedUser === 'partner2' ? coupleProfile.partner2.pin : coupleProfile.partner1.pin,
    role: authenticatedUser || 'partner1',
    vaultId: 'vault_demo_1',
  };

  // Junction Relation Check: is current logged-in user linked to a shared vault?
  const memberVault: Vault | null = authenticatedUser ? storage.getMemberVault(activeUserId) : null;
  const isLinkedToVault = Boolean(memberVault);

  // Parse URL search parameters (?pair=882104&role=partner2)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pairParam = params.get('pair');
      const roleParam = params.get('role');

      const activeCode = pairParam ? pairParam.toUpperCase() : '882104';
      const activeRole = roleParam === 'partner2' ? 'partner2' : 'partner1';

      setRoomCode(activeCode);
      setCurrentRole(activeRole);

      realtimeVault.initialize(activeCode, activeRole);
    } catch (e) {
      realtimeVault.initialize('882104', 'partner1');
    }

    return () => realtimeVault.cleanup();
  }, []);

  // Listen for Real-Time synchronization messages
  useEffect(() => {
    const unsubscribe = realtimeVault.onMessage((msg) => {
      if (msg.type === 'PARTNER_JOINED') {
        setPartnerConnected(true);
        // Sync our couple profile to the newly joined partner's phone
        realtimeVault.sendSyncProfile(coupleProfile);
      } else if (msg.type === 'SYNC_PROFILE' && msg.payload) {
        sound.playSoftClick();
        setCoupleProfile(msg.payload);
        storage.saveCoupleProfile(msg.payload);
        setPartnerConnected(true);
      } else if (msg.type === 'UNLOCK_REQUESTED' && msg.payload?.unlockState) {
        sound.playPartnerApproved();
        setUnlockState(msg.payload.unlockState);
      } else if (msg.type === 'UNLOCK_STATE_CHANGED' && msg.payload?.unlockState) {
        setUnlockState(msg.payload.unlockState);
        if (msg.payload.unlockState === 'FULLY_UNLOCKED') {
          sound.playVaultUnlocked();
          setIsUnlocked(true);
          setActiveTab('home');
        }
      } else if (msg.type === 'VAULT_UNLOCKED') {
        sound.playVaultUnlocked();
        setUnlockState('FULLY_UNLOCKED');
        setIsUnlocked(true);
        setActiveTab('home');
      } else if (msg.type === 'PANIC_LOCK') {
        sound.playPanicLock();
        setIsUnlocked(false);
        setUnlockState('LOCKED');
        setActiveTab('lock');
      } else if (msg.type === 'PARTNER_LINKED') {
        setMembershipSync((k) => k + 1);
        setPartnerConnected(true);
      } else if (msg.type === 'NEW_MEMORY' && msg.payload) {
        sound.playPartnerApproved();
        setMemories((prev) => {
          const exists = prev.some((m) => m.id === msg.payload.id);
          if (exists) return prev;
          const updated = [msg.payload, ...prev];
          storage.saveMemories(updated);
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, [coupleProfile]);

  // Sync mute state on mount
  useEffect(() => {
    sound.setMuted(!securitySettings.soundEnabled);
  }, [securitySettings.soundEnabled]);

  const handleUnlockVault = () => {
    if (isFrozen) return;
    setUnlockState('FULLY_UNLOCKED');
    setIsUnlocked(true);
    setActiveTab('home');
  };

  const handlePanicLock = () => {
    setIsUnlocked(false);
    setUnlockState('LOCKED');
    setActiveTab('lock');
    realtimeVault.sendPanicLock();
  };

  const handleSessionExpired = () => {
    sound.playPanicLock();
    setIsUnlocked(false);
    setUnlockState('LOCKED');
    setActiveTab('lock');
    realtimeVault.sendPanicLock();
  };

  const handleAddMemory = (newMemory: Memory) => {
    const updated = [newMemory, ...memories];
    setMemories(updated);
    storage.saveMemories(updated);
    realtimeVault.sendNewMemory(newMemory);
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    storage.saveMemories(updated);
  };

  const handleSaveProfile = (profile: CoupleProfile) => {
    setCoupleProfile(profile);
    storage.saveCoupleProfile(profile);
    realtimeVault.sendSyncProfile(profile);
  };

  const handleSaveSecuritySettings = (settings: SecuritySettings) => {
    setSecuritySettings(settings);
    storage.saveSecuritySettings(settings);
  };

  const handleFreezeVault = () => {
    setIsFrozen(true);
    setIsUnlocked(false);
    setUnlockState('LOCKED');
    storage.setFrozen(true);
    realtimeVault.sendPanicLock();
  };

  const handleUnfreeze = () => {
    sound.playSoftClick();
    setIsFrozen(false);
    storage.setFrozen(false);
  };

  const handleResetData = () => {
    storage.resetVault();
    setMemories(storage.getMemories());
    setCoupleProfile(storage.getCoupleProfile());
    setSecuritySettings(storage.getSecuritySettings());
    setIsFrozen(false);
    setIsUnlocked(false);
    setUnlockState('LOCKED');
    setActiveTab('lock');
  };

  const handleLoginSuccess = (partnerId: 'partner1' | 'partner2', targetRoomCode?: string, userId?: string) => {
    const code = (targetRoomCode || roomCode).toUpperCase().trim();
    setAuthenticatedUser(partnerId);
    setCurrentRole(partnerId);
    setRoomCode(code);
    const resolvedUserId = userId || (partnerId === 'partner2' ? 'user_ananya' : 'user_aarav');
    setCustomUserId(resolvedUserId);
    storage.setActiveUserId(resolvedUserId);
    realtimeVault.initialize(code, partnerId);
    try {
      localStorage.setItem('bondlock_auth_user', partnerId);
      localStorage.setItem('bondlock_room_code', code);
    } catch (e) {}
    setMembershipSync((k) => k + 1);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('bondlock_auth_user');
    } catch (e) {}
    storage.setActiveUserId(null);
    setCustomUserId(null);
    setAuthenticatedUser(null);
    setIsUnlocked(false);
    setUnlockState('LOCKED');
    setActiveTab('lock');
    setIsUserProfileOpen(false);
    setMembershipSync((k) => k + 1);
  };

  const handleChangeRole = (newRole: 'partner1' | 'partner2') => {
    setCurrentRole(newRole);
    setAuthenticatedUser(newRole);
    const roleUserId = newRole === 'partner2' ? 'user_ananya' : 'user_aarav';
    setCustomUserId(roleUserId);
    storage.setActiveUserId(roleUserId);
    try {
      localStorage.setItem('bondlock_auth_user', newRole);
    } catch (e) {}
    realtimeVault.setRole(newRole);
    setMembershipSync((k) => k + 1);
  };

  // Developer Switcher: Instant switch between Partner A and Partner B without wiping storage
  const handleSwitchDevPartner = (newRole: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    setCurrentRole(newRole);
    setAuthenticatedUser(newRole);
    const devUserId = newRole === 'partner1' ? 'user_aarav' : 'user_ananya';
    setCustomUserId(devUserId);
    storage.setActiveUserId(devUserId);
    try {
      localStorage.setItem('bondlock_auth_user', newRole);
    } catch (e) {}
    realtimeVault.setRole(newRole);
    setMembershipSync((k) => k + 1);
  };

  // Developer Switcher: Toggle unlinking/linking to test the Onboarding Pairing Screen
  const handleToggleUnlinkVault = () => {
    sound.playSoftClick();
    if (isLinkedToVault) {
      storage.unlinkUserFromVault(activeUserId);
    } else {
      const demoVault = storage.getVaultById('vault_demo_1') || storage.createVault("Aarav & Ananya's Sanctuary", '882104');
      storage.linkUserToVault(activeUserId, demoVault.id, currentRole);
      realtimeVault.initialize(demoVault.inviteCode, currentRole);
    }
    setMembershipSync((k) => k + 1);
  };

  // Callback when user completes pairing screen
  const handlePairingComplete = (vault: Vault, role: 'partner1' | 'partner2') => {
    setRoomCode(vault.inviteCode);
    setCurrentRole(role);
    setMembershipSync((k) => k + 1);
  };

  // Render the current view in Single Device Mode
  const renderCurrentScreen = () => {
    // 1. Onboarding check: Not logged in
    if (!authenticatedUser) {
      return (
        <LoginPage
          coupleProfile={coupleProfile}
          onLoginSuccess={handleLoginSuccess}
          onUpdateCoupleProfile={handleSaveProfile}
          currentRoomCode={roomCode}
          onUpdateRoomCode={(newCode) => {
            setRoomCode(newCode);
            realtimeVault.initialize(newCode, currentRole);
          }}
        />
      );
    }

    // 2. Onboarding check: Logged in, but NOT linked to a vault
    if (!isLinkedToVault) {
      return (
        <PairingScreen
          currentUser={currentUserAccount}
          coupleProfile={coupleProfile}
          onPairingComplete={handlePairingComplete}
          onLogout={handleLogout}
        />
      );
    }

    // 3. Vault is frozen
    if (isFrozen) {
      return (
        <div className="min-h-full flex flex-col items-center justify-center p-6 text-center select-none ambient-app-canvas text-stone-200">
          <div className="w-20 h-20 rounded-full bg-panicRed/15 border-2 border-panicRed/40 flex items-center justify-center text-panicRed mb-6 shadow-panic-glow animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <span className="px-3 py-1 rounded-full bg-panicRed/20 text-panicRed text-xs font-mono font-bold tracking-widest uppercase mb-2">
            Status: Lockdown Active
          </span>

          <h2 className="font-serif text-3xl text-stone-100 font-bold mb-3">
            Vault Cryptographically Frozen
          </h2>

          <p className="text-stone-400 text-sm max-w-sm mb-6 leading-relaxed font-sans">
            Duress freeze protocol was executed. Ephemeral encryption keys have been scrubbed from memory. Reconstitution requires physical 2-of-2 paper recovery seed keys.
          </p>

          <button
            onClick={handleUnfreeze}
            className="px-6 py-3 rounded-full btn-neon-pink text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-pink-glow hover:opacity-95 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Restore with Emergency Paper Seeds</span>
          </button>
        </div>
      );
    }

    // 4. Linked Vault Dashboard: Locked Screen (Two-Step Dual Passkey Unlock Flow)
    if (!isUnlocked && activeTab !== 'lock') {
      return (
        <LockScreen
          coupleProfile={coupleProfile}
          onUnlockVault={handleUnlockVault}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenUserProfile={() => setIsUserProfileOpen(true)}
          currentRole={currentRole}
          onChangeRole={handleChangeRole}
          roomCode={memberVault?.inviteCode || roomCode}
          partnerConnected={partnerConnected}
          unlockState={unlockState}
          onUpdateUnlockState={setUnlockState}
          onPanicLock={handlePanicLock}
        />
      );
    }

    // 5. Unlocked Vault Views (Session Bar 5:00 min active countdown + Panic Lock)
    switch (activeTab) {
      case 'home':
        return (
          <VaultFeed
            coupleProfile={coupleProfile}
            memories={memories}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onPanicLock={handlePanicLock}
            onSessionExpired={handleSessionExpired}
            onOpenSecurity={() => setIsSecurityModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        );
      case 'explore':
        return (
          <VaultExplore
            coupleProfile={coupleProfile}
            memories={memories}
            onDeleteMemory={handleDeleteMemory}
          />
        );
      case 'notes':
        return (
          <VaultLetters
            coupleProfile={coupleProfile}
            memories={memories}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
          />
        );
      case 'profile':
        return (
          <VaultProfile
            coupleProfile={coupleProfile}
            securitySettings={securitySettings}
            onOpenSecurity={() => setIsSecurityModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onBackToFeed={() => setActiveTab('home')}
            onFreezeVault={handleFreezeVault}
            authenticatedUser={authenticatedUser}
            onOpenUserProfile={() => setIsUserProfileOpen(true)}
            onLogout={handleLogout}
          />
        );
      case 'lock':
      default:
        return (
          <LockScreen
            coupleProfile={coupleProfile}
            onUnlockVault={handleUnlockVault}
            onOpenSecurity={() => setIsSecurityModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenUserProfile={() => setIsUserProfileOpen(true)}
            currentRole={currentRole}
            onChangeRole={handleChangeRole}
            roomCode={memberVault?.inviteCode || roomCode}
            partnerConnected={partnerConnected}
            unlockState={unlockState}
            onUpdateUnlockState={setUnlockState}
            onPanicLock={handlePanicLock}
          />
        );
    }
  };

  // Render 3-Screen Panorama Content
  const renderPanoramaContent = () => {
    return (
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 overflow-x-auto py-4 px-2 select-none">
        
        {/* Screen 1: Welcome / Dual Lock */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-mono font-bold text-[#FF4D9D] mb-2 tracking-wider uppercase">
            Screen 1 • Dual-Approval Hero Lock
          </span>
          <div className="relative w-[340px] sm:w-[360px] h-[720px] bg-[#120317] rounded-[48px] shadow-phone-frame border-[7px] border-[#380E45] flex flex-col overflow-hidden ring-1 ring-white/20">
            <div className="flex items-center justify-between px-6 pt-2.5 pb-1 select-none">
              <span className="text-[11px] font-semibold text-stone-200">9:41</span>
              <div className="w-20 h-4 rounded-full bg-black border border-white/10" />
              <div className="text-[10px] text-stone-300 font-mono">5G 100%</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
              <LockScreen
                coupleProfile={coupleProfile}
                onUnlockVault={handleUnlockVault}
                onOpenSecurity={() => setIsSecurityModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenUserProfile={() => setIsUserProfileOpen(true)}
                currentRole={currentRole}
                onChangeRole={handleChangeRole}
                roomCode={memberVault?.inviteCode || roomCode}
                partnerConnected={partnerConnected}
                unlockState={unlockState}
                onUpdateUnlockState={setUnlockState}
                onPanicLock={handlePanicLock}
              />
            </div>
            <div className="flex justify-center pb-1.5 pt-1 bg-[#16051C]">
              <div className="w-28 h-1 rounded-full bg-white/25" />
            </div>
          </div>
        </div>

        {/* Screen 2: Feed / Explore */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-mono font-bold text-[#FF4D9D] mb-2 tracking-wider uppercase">
            Screen 2 • Precious Moments Feed
          </span>
          <div className="relative w-[340px] sm:w-[360px] h-[720px] bg-[#120317] rounded-[48px] shadow-phone-frame border-[7px] border-[#380E45] flex flex-col overflow-hidden ring-1 ring-white/20">
            <div className="flex items-center justify-between px-6 pt-2.5 pb-1 select-none">
              <span className="text-[11px] font-semibold text-stone-200">9:41</span>
              <div className="w-20 h-4 rounded-full bg-black border border-white/10" />
              <div className="text-[10px] text-stone-300 font-mono">5G 100%</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
              <VaultFeed
                coupleProfile={coupleProfile}
                memories={memories}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
                onPanicLock={handlePanicLock}
                onSessionExpired={handleSessionExpired}
                onOpenSecurity={() => setIsSecurityModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
              />
            </div>
            <BottomNav
              activeTab="home"
              onSelectTab={(t) => setActiveTab(t)}
              isUnlocked={isUnlocked}
            />
            <div className="flex justify-center pb-1.5 pt-1 bg-[#16051C]">
              <div className="w-28 h-1 rounded-full bg-white/25" />
            </div>
          </div>
        </div>

        {/* Screen 3: Profile & Security */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-mono font-bold text-[#FF4D9D] mb-2 tracking-wider uppercase">
            Screen 3 • Security & Trust Profile
          </span>
          <div className="relative w-[340px] sm:w-[360px] h-[720px] bg-[#120317] rounded-[48px] shadow-phone-frame border-[7px] border-[#380E45] flex flex-col overflow-hidden ring-1 ring-white/20">
            <div className="flex items-center justify-between px-6 pt-2.5 pb-1 select-none">
              <span className="text-[11px] font-semibold text-stone-200">9:41</span>
              <div className="w-20 h-4 rounded-full bg-black border border-white/10" />
              <div className="text-[10px] text-stone-300 font-mono">5G 100%</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
              <VaultProfile
                coupleProfile={coupleProfile}
                securitySettings={securitySettings}
                onOpenSecurity={() => setIsSecurityModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onBackToFeed={() => setActiveTab('home')}
                onFreezeVault={handleFreezeVault}
                authenticatedUser={authenticatedUser || 'partner1'}
                onOpenUserProfile={() => setIsUserProfileOpen(true)}
                onLogout={handleLogout}
              />
            </div>
            <BottomNav
              activeTab="profile"
              onSelectTab={(t) => setActiveTab(t)}
              isUnlocked={isUnlocked}
            />
            <div className="flex justify-center pb-1.5 pt-1 bg-[#16051C]">
              <div className="w-28 h-1 rounded-full bg-white/25" />
            </div>
          </div>
        </div>

      </div>
    );
  };

  // If not authenticated, render LoginPage
  if (!authenticatedUser) {
    return (
      <>
        {/* Persistent Dev Switcher Toolbar */}
        <DevSwitcherToolbar
          currentRole={currentRole}
          partner1Name={coupleProfile.partner1.name}
          partner2Name={coupleProfile.partner2.name}
          isLinkedToVault={isLinkedToVault}
          onSwitchPartner={handleSwitchDevPartner}
          onToggleUnlinkVault={handleToggleUnlinkVault}
          vaultCode={memberVault?.inviteCode || roomCode}
        />

        <LoginPage
          coupleProfile={coupleProfile}
          onLoginSuccess={handleLoginSuccess}
          onUpdateCoupleProfile={handleSaveProfile}
          currentRoomCode={roomCode}
          onUpdateRoomCode={(newCode) => {
            setRoomCode(newCode);
            realtimeVault.initialize(newCode, currentRole);
          }}
        />
      </>
    );
  }

  return (
    <>
      {/* Persistent Dev Switcher Toolbar */}
      <DevSwitcherToolbar
        currentRole={currentRole}
        partner1Name={coupleProfile.partner1.name}
        partner2Name={coupleProfile.partner2.name}
        isLinkedToVault={isLinkedToVault}
        onSwitchPartner={handleSwitchDevPartner}
        onToggleUnlinkVault={handleToggleUnlinkVault}
        vaultCode={memberVault?.inviteCode || roomCode}
      />

      <DeviceFrame
        partner1Name={coupleProfile.partner1.name}
        partner2Name={coupleProfile.partner2.name}
        watermarkActive={securitySettings.antiScreenshotWatermark && isUnlocked}
        onResetData={handleResetData}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        panoramaContent={renderPanoramaContent()}
      >
        <div className="flex-1 flex flex-col overflow-y-auto pt-6 sm:pt-4">
          {renderCurrentScreen()}
        </div>

        {/* Bottom Nav Bar (Dock) when Unlocked in Single Mobile View */}
        {viewMode === 'single' && !isFrozen && isUnlocked && isLinkedToVault && (
          <BottomNav
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
            }}
            isUnlocked={isUnlocked}
            onPanicLock={handlePanicLock}
          />
        )}

        {/* Security Architecture & Shamir Graph Modal */}
        <SecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          coupleProfile={coupleProfile}
          securitySettings={securitySettings}
          onUpdateSecuritySettings={handleSaveSecuritySettings}
          onFreezeVault={handleFreezeVault}
        />

        {/* Couple Preferences & Partner Names Modal */}
        <PartnerSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          coupleProfile={coupleProfile}
          onSaveProfile={handleSaveProfile}
          securitySettings={securitySettings}
          onSaveSecuritySettings={handleSaveSecuritySettings}
        />

        {/* Identified Partner Profile Modal */}
        {authenticatedUser && (
          <UserProfileModal
            isOpen={isUserProfileOpen}
            onClose={() => setIsUserProfileOpen(false)}
            partner={authenticatedUser === 'partner2' ? coupleProfile.partner2 : coupleProfile.partner1}
            coupleProfile={coupleProfile}
            onLogout={handleLogout}
          />
        )}
      </DeviceFrame>
    </>
  );
}

export default App;
