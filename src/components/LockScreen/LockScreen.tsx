import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, QrCode, ScanFace, Check, KeyRound, Lock, Unlock, Sparkles, Smartphone, ArrowRightLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { CoupleProfile, VaultUnlockState } from '../../types/vault';
import { DualDeviceModal } from './DualDeviceModal';
import { PairDeviceModal } from './PairDeviceModal';
import { PasskeyModal } from '../Security/PasskeyModal';
import { PinModal } from './PinModal';
import { SimulatedBiometricModal } from './SimulatedBiometricModal';
import { realtimeVault } from '../../utils/realtimeVault';
import { sound } from '../../utils/sound';

interface LockScreenProps {
  coupleProfile: CoupleProfile;
  onUnlockVault: () => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
  onOpenUserProfile?: () => void;
  currentRole?: 'partner1' | 'partner2';
  onChangeRole?: (role: 'partner1' | 'partner2') => void;
  roomCode?: string;
  partnerConnected?: boolean;
  unlockState?: VaultUnlockState;
  onUpdateUnlockState?: (state: VaultUnlockState) => void;
  onPanicLock?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  coupleProfile,
  onUnlockVault,
  onOpenSecurity,
  onOpenSettings,
  onOpenUserProfile,
  currentRole = 'partner1',
  onChangeRole = () => {},
  roomCode = 'BOND-8821',
  partnerConnected = false,
  unlockState: propUnlockState,
  onUpdateUnlockState,
  onPanicLock,
}) => {
  // Local unlock state synced with prop
  const [internalUnlockState, setInternalUnlockState] = useState<VaultUnlockState>('LOCKED');
  const currentUnlockState = propUnlockState !== undefined ? propUnlockState : internalUnlockState;

  const updateUnlockState = (state: VaultUnlockState) => {
    setInternalUnlockState(state);
    if (onUpdateUnlockState) {
      onUpdateUnlockState(state);
    }
  };

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isDualModalOpen, setIsDualModalOpen] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);

  // Active Partner Data for this phone
  const isPartner1 = currentRole === 'partner1';
  const myPartner = isPartner1 ? coupleProfile.partner1 : coupleProfile.partner2;
  const otherPartner = isPartner1 ? coupleProfile.partner2 : coupleProfile.partner1;

  // Derived verified states
  const partner1Verified = currentUnlockState === 'PARTNER_A_VERIFIED' || currentUnlockState === 'FULLY_UNLOCKED';
  const partner2Verified = currentUnlockState === 'PARTNER_B_VERIFIED' || currentUnlockState === 'FULLY_UNLOCKED';
  const myVerified = isPartner1 ? partner1Verified : partner2Verified;
  const otherVerified = isPartner1 ? partner2Verified : partner1Verified;
  const bothVerified = currentUnlockState === 'FULLY_UNLOCKED' || (partner1Verified && partner2Verified);

  // Dynamic PINs from couple profile (with defaults)
  const myExpectedPin = isPartner1
    ? (coupleProfile.partner1.pin || '1404')
    : (coupleProfile.partner2.pin || '2512');

  // Subscribe to real-time events across physical devices
  useEffect(() => {
    const unsubscribe = realtimeVault.onMessage((msg) => {
      if (msg.type === 'UNLOCK_REQUESTED' && msg.payload?.unlockState) {
        sound.playPartnerApproved();
        updateUnlockState(msg.payload.unlockState);
      } else if (msg.type === 'UNLOCK_STATE_CHANGED' && msg.payload?.unlockState) {
        if (msg.payload.unlockState === 'FULLY_UNLOCKED') {
          triggerFullUnlock();
        } else {
          updateUnlockState(msg.payload.unlockState);
        }
      } else if (msg.type === 'VAULT_UNLOCKED') {
        triggerFullUnlock();
      } else if (msg.type === 'CONSENT_GRANTED') {
        sound.playPartnerApproved();
        if (msg.partnerId === 'partner1') {
          updateUnlockState('PARTNER_A_VERIFIED');
        } else {
          updateUnlockState('PARTNER_B_VERIFIED');
        }
      } else if (msg.type === 'CONSENT_REVOKED') {
        sound.playSoftClick();
        updateUnlockState('LOCKED');
      } else if (msg.type === 'PANIC_LOCK') {
        sound.playPanicLock();
        updateUnlockState('LOCKED');
        setIsBiometricModalOpen(false);
        setIsPinModalOpen(false);
      }
    });

    return () => unsubscribe();
  }, [isPartner1]);

  // Full Unlock Handler
  const triggerFullUnlock = () => {
    updateUnlockState('FULLY_UNLOCKED');
    sound.playVaultUnlocked();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#FF2E93', '#E11D74', '#A855F7', '#FFFFFF', '#F5D6B4'],
        ticks: 200,
        gravity: 0.85,
      });
    } catch {}

    setTimeout(() => {
      onUnlockVault();
    }, 1100);
  };

  // 60-second security window when only one partner is verified
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      (currentUnlockState === 'PARTNER_A_VERIFIED' || currentUnlockState === 'PARTNER_B_VERIFIED') &&
      !bothVerified
    ) {
      setTimeRemaining(60);
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            updateUnlockState('LOCKED');
            realtimeVault.sendUnlockState('LOCKED');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeRemaining(null);
    }

    return () => clearInterval(timer);
  }, [currentUnlockState, bothVerified]);

  // Handle clicking the Locked Vault Card
  const handleLockedCardClick = () => {
    if (bothVerified) return;

    sound.playSoftClick();
    if (myVerified) {
      // Allow revoking if desired
      updateUnlockState('LOCKED');
      realtimeVault.sendUnlockState('LOCKED');
      return;
    }

    // Trigger local biometric/Passkey authentication (prompt simulated biometric modal)
    setIsBiometricModalOpen(true);
  };

  // When Biometric / Passkey Verification Succeeds
  const handleBiometricSuccess = () => {
    sound.playPartnerApproved();

    if (isPartner1) {
      if (currentUnlockState === 'PARTNER_B_VERIFIED') {
        // Both authenticated!
        triggerFullUnlock();
        realtimeVault.sendUnlockState('FULLY_UNLOCKED');
      } else {
        // Partner A verified
        updateUnlockState('PARTNER_A_VERIFIED');
        realtimeVault.sendUnlockRequest('PARTNER_A_VERIFIED');
      }
    } else {
      if (currentUnlockState === 'PARTNER_A_VERIFIED') {
        // Both authenticated!
        triggerFullUnlock();
        realtimeVault.sendUnlockState('FULLY_UNLOCKED');
      } else {
        // Partner B verified
        updateUnlockState('PARTNER_B_VERIFIED');
        realtimeVault.sendUnlockRequest('PARTNER_B_VERIFIED');
      }
    }
  };

  return (
    <div className="relative min-h-full flex flex-col justify-between py-3 px-4 sm:px-6 select-none ambient-app-canvas text-stone-200">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10 pt-1">
        <button
          onClick={onOpenSecurity}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
          title="Security Architecture"
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* Real-Time Sync Status Pill */}
        <button
          onClick={() => {
            sound.playSoftClick();
            setIsPairModalOpen(true);
          }}
          className={`px-3 py-1 rounded-full text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
            partnerConnected
              ? 'bg-emeraldGlow/15 border-emeraldGlow/40 text-emeraldGlow'
              : 'bg-[#FF2E93]/15 border-[#FF2E93]/40 text-[#FF4D9D] hover:bg-[#FF2E93]/25'
          }`}
          title="Pair Real Phone via QR / WhatsApp"
        >
          <span className={`w-2 h-2 rounded-full ${partnerConnected ? 'bg-emeraldGlow' : 'bg-[#FF2E93] animate-ping'}`} />
          <span>{partnerConnected ? 'Live Synced' : 'Pair Real Phone'}</span>
          <QrCode className="w-3 h-3 ml-0.5" />
        </button>

        {/* Identified User Profile Button */}
        {onOpenUserProfile ? (
          <button
            onClick={() => {
              sound.playSoftClick();
              onOpenUserProfile();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-[#FF2E93]/40 transition-all text-xs"
            title="View Identified Profile & Key Share"
          >
            <img
              src={myPartner.avatar}
              alt={myPartner.name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-[#FF2E93]"
            />
            <span className="font-sans font-semibold text-white text-[11px] max-w-[65px] truncate">{myPartner.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emeraldGlow shrink-0" />
          </button>
        ) : (
          <button
            onClick={() => {
              sound.playSoftClick();
              setIsPasskeyModalOpen(true);
            }}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
            title="Hardware Face ID & Passkeys Settings"
          >
            <ScanFace className="w-4 h-4 text-neonPink-400" />
          </button>
        )}
      </div>

      {/* Hero Visual Area: The Locked Vault Card */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-2 z-10 w-full max-w-sm mx-auto">
        
        {/* Clickable Vault Card Container */}
        <motion.div
          onClick={handleLockedCardClick}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full rounded-3xl p-4 border transition-all cursor-pointer group shadow-2xl relative overflow-hidden ${
            bothVerified
              ? 'bg-emeraldGlow/10 border-emeraldGlow/50 shadow-[0_0_30px_rgba(78,204,163,0.3)]'
              : myVerified
                ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : otherVerified
                  ? 'bg-[#FF2E93]/15 border-[#FF2E93]/50 shadow-pink-glow animate-pulse'
                  : 'bg-black/40 border-white/15 hover:border-[#FF2E93]/40 hover:bg-black/50'
          }`}
          title="Click to authenticate with your passkey"
        >
          {/* Subtle top indicator */}
          <div className="flex items-center justify-between text-[10px] font-mono mb-3 text-stone-400 px-1">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#FF4D9D]" />
              <span>{coupleProfile.vaultName}</span>
            </span>
            <span className="uppercase tracking-wider font-semibold text-[#FF4D9D]">
              {currentUnlockState.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Couple Avatars & Central Lock Visual */}
          <div className="flex items-center justify-between px-1 mb-2">
            
            {/* Partner 1 (Partner A) Avatar */}
            <div className="flex flex-col items-center">
              <span className="glass-pill px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold text-stone-200 mb-1.5 flex items-center gap-1">
                <span>❤️</span>
                <span>{coupleProfile.partner1.name}</span>
              </span>

              <div className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full p-0.5 border-2 transition-all duration-300 ${
                partner1Verified
                  ? 'border-emeraldGlow shadow-[0_0_20px_rgba(78,204,163,0.5)]'
                  : 'border-[#FF2E93]/60'
              }`}>
                <img
                  src={coupleProfile.partner1.avatar}
                  alt={coupleProfile.partner1.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-[#120317] ${
                  partner1Verified ? 'bg-emeraldGlow text-black' : 'bg-black/80 text-stone-400'
                }`}>
                  {partner1Verified ? '✓' : '1'}
                </div>
              </div>

              <span className={`text-[10px] font-mono mt-1 ${partner1Verified ? 'text-emeraldGlow font-bold' : 'text-stone-400'}`}>
                {partner1Verified ? 'Passkey Verified' : 'Share 1 (A)'}
              </span>
            </div>

            {/* Interlocking Central Heart / Lock */}
            <div className="flex-1 flex flex-col items-center px-1">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <motion.div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 ${
                    bothVerified
                      ? 'bg-[#FF2E93] text-white border-white shadow-pink-glow scale-110'
                      : myVerified || otherVerified
                        ? 'bg-black/60 text-emeraldGlow border-emeraldGlow shadow-[0_0_15px_rgba(78,204,163,0.3)] animate-pulse'
                        : 'bg-black/40 text-[#FF4D9D] border-white/10 group-hover:border-[#FF2E93]'
                  }`}
                >
                  {bothVerified ? (
                    <Unlock className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <Lock className="w-6 h-6 stroke-[2]" />
                  )}
                </motion.div>
              </div>
              <span className="text-[10px] font-mono text-[#FF4D9D] uppercase tracking-wider">
                2/2 SSS Lock
              </span>
            </div>

            {/* Partner 2 (Partner B) Avatar */}
            <div className="flex flex-col items-center">
              <span className="glass-pill px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold text-stone-200 mb-1.5 flex items-center gap-1">
                <span>✨</span>
                <span>{coupleProfile.partner2.name}</span>
              </span>

              <div className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full p-0.5 border-2 transition-all duration-300 ${
                partner2Verified
                  ? 'border-emeraldGlow shadow-[0_0_20px_rgba(78,204,163,0.5)]'
                  : 'border-[#A855F7]/60'
              }`}>
                <img
                  src={coupleProfile.partner2.avatar}
                  alt={coupleProfile.partner2.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-[#120317] ${
                  partner2Verified ? 'bg-emeraldGlow text-black' : 'bg-black/80 text-stone-400'
                }`}>
                  {partner2Verified ? '✓' : '2'}
                </div>
              </div>

              <span className={`text-[10px] font-mono mt-1 ${partner2Verified ? 'text-emeraldGlow font-bold' : 'text-stone-400'}`}>
                {partner2Verified ? 'Passkey Verified' : 'Share 2 (B)'}
              </span>
            </div>

          </div>

          {/* Live Mutual Status Alert Area */}
          <div className="mt-3 pt-3 border-t border-white/10">
            {bothVerified ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emeraldGlow">
                <Sparkles className="w-4 h-4 text-emeraldGlow animate-spin" />
                <span>Both Partners Authenticated • Decrypting Vault...</span>
              </div>
            ) : myVerified && !otherVerified ? (
              /* EXACT REQUIRED STRING 3: "You are authenticated • Waiting for partner's passkey to unlock..." */
              <div className="text-center py-1">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span className="font-semibold text-amber-200">
                    You are authenticated • Waiting for partner's passkey to unlock...
                  </span>
                </div>
                {timeRemaining !== null && (
                  <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                    Security window: {timeRemaining}s remaining (Tap card to cancel)
                  </span>
                )}
              </div>
            ) : !myVerified && otherVerified ? (
              /* EXACT REQUIRED STRING 4: "Partner requested to unlock vault. Authenticate with your passkey" */
              <div className="text-center py-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#FF4D9D]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4D9D] animate-pulse" />
                  <span>Partner requested to unlock vault. Authenticate with your passkey</span>
                </div>
                {timeRemaining !== null && (
                  <span className="text-[10px] text-stone-300 font-mono mt-0.5 block">
                    {timeRemaining}s remaining • Tap below to scan
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center py-0.5">
                <span className="text-xs font-semibold text-stone-200 block">
                  Dual-Approval Required
                </span>
                <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                  Click locked vault card to authenticate with your passkey
                </span>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Control Area for THIS Device */}
      <div className="text-center px-2 pb-1 z-10 flex flex-col items-center">
        
        {/* Device Identity Badge */}
        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-stone-400">
          <span>Active Phone: <strong className="text-white">{myPartner.name} (Device {isPartner1 ? '1' : '2'})</strong></span>
          {onOpenUserProfile && (
            <button
              onClick={() => {
                sound.playSoftClick();
                onOpenUserProfile();
              }}
              className="text-[#FF4D9D] hover:underline flex items-center gap-0.5 font-semibold text-[11px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-full border border-white/10 transition-colors"
              title="View profile and assigned key share"
            >
              <span>Profile</span>
            </button>
          )}
          <span className="text-stone-600">•</span>
          <button
            onClick={() => {
              sound.playSoftClick();
              onChangeRole(isPartner1 ? 'partner2' : 'partner1');
            }}
            className="text-stone-400 hover:text-stone-200 flex items-center gap-0.5 text-[11px]"
            title="Switch phone role"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Switch Role</span>
          </button>
        </div>

        {/* Primary Action Button */}
        <motion.button
          onClick={handleLockedCardClick}
          disabled={bothVerified}
          whileTap={{ scale: 0.96 }}
          className={`w-full max-w-xs py-3.5 px-6 rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mb-2.5 ${
            bothVerified
              ? 'bg-emeraldGlow/25 text-emeraldGlow border border-emeraldGlow'
              : myVerified
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : otherVerified
                  ? 'btn-neon-pink text-white shadow-pink-glow animate-pulse'
                  : 'btn-neon-pink text-white shadow-pink-glow'
          }`}
        >
          {bothVerified ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Vault Unlocked</span>
            </>
          ) : myVerified ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>You Authenticated (Tap to Cancel)</span>
            </>
          ) : otherVerified ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Authenticate with Passkey</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Authenticate Passkey as {myPartner.name}</span>
            </>
          )}
        </motion.button>

        {/* Security Notice */}
        <p className="text-[10px] text-stone-400 font-mono text-center flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-[#FF4D9D]" />
          <span>Strict 2FA: Both passkeys required to release Shamir Key Shares</span>
        </p>

        {/* Fallback & Helper links */}
        <div className="flex items-center justify-center gap-3 text-xs text-stone-400 mt-2">
          {!myVerified && (
            <>
              <button
                onClick={() => setIsPinModalOpen(true)}
                className="text-stone-300 hover:text-white flex items-center gap-1 font-mono text-[11px]"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Enter PIN Code</span>
              </button>
              <span>•</span>
            </>
          )}
          <button
            onClick={() => setIsPairModalOpen(true)}
            className="text-[#FF4D9D] hover:underline font-semibold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Pair Another Phone</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setIsDualModalOpen(true)}
            className="hover:text-stone-200"
          >
            Simulation
          </button>
        </div>
      </div>

      {/* Simulated Biometric / Passkey Prompt Modal */}
      <SimulatedBiometricModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        partnerName={myPartner.name}
        partnerAvatar={myPartner.avatar}
        keyShareId={myPartner.keyShareId}
        biometricType={myPartner.biometricType}
        expectedPin={myExpectedPin}
        onSuccess={handleBiometricSuccess}
      />

      {/* Security PIN Entry Modal Fallback */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        partnerName={myPartner.name}
        expectedPin={myExpectedPin}
        onSuccess={handleBiometricSuccess}
      />

      {/* Real Hardware Face ID / Passkey Modal */}
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        coupleProfile={coupleProfile}
        currentRole={currentRole}
      />

      {/* Real Device Pairing QR & Supabase Modal */}
      <PairDeviceModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        roomCode={roomCode}
        coupleProfile={coupleProfile}
        currentRole={currentRole}
        onChangeRole={onChangeRole}
        partnerConnected={partnerConnected}
      />

      {/* 2-Device Simulation Modal */}
      <DualDeviceModal
        isOpen={isDualModalOpen}
        onClose={() => setIsDualModalOpen(false)}
        partner1={coupleProfile.partner1}
        partner2={coupleProfile.partner2}
        partner1Approved={partner1Verified}
        partner2Approved={partner2Verified}
        onApprovePartner1={() => {
          updateUnlockState('PARTNER_A_VERIFIED');
          realtimeVault.sendUnlockRequest('PARTNER_A_VERIFIED');
        }}
        onApprovePartner2={() => {
          updateUnlockState('PARTNER_B_VERIFIED');
          realtimeVault.sendUnlockRequest('PARTNER_B_VERIFIED');
        }}
        onUnlockVault={onUnlockVault}
      />
    </div>
  );
};
