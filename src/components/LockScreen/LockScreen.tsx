import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, QrCode, ScanFace, Check, KeyRound, Lock, Unlock, Sparkles, Smartphone, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { InterlockingKey } from './InterlockingKey';
import { DualDeviceModal } from './DualDeviceModal';
import { PairDeviceModal } from './PairDeviceModal';
import { PasskeyModal } from '../Security/PasskeyModal';
import { PinModal } from './PinModal';
import { verifyPasskey, isPlatformAuthenticatorAvailable, hasEnrolledPasskey } from '../../utils/webAuthn';
import { realtimeVault } from '../../utils/realtimeVault';
import { sound } from '../../utils/sound';

interface LockScreenProps {
  coupleProfile: CoupleProfile;
  onUnlockVault: () => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
  currentRole?: 'partner1' | 'partner2';
  onChangeRole?: (role: 'partner1' | 'partner2') => void;
  roomCode?: string;
  partnerConnected?: boolean;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  coupleProfile,
  onUnlockVault,
  onOpenSecurity,
  onOpenSettings,
  currentRole = 'partner1',
  onChangeRole = () => {},
  roomCode = 'BOND-8821',
  partnerConnected = false,
}) => {
  const [partner1Approved, setPartner1Approved] = useState(false);
  const [partner2Approved, setPartner2Approved] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isDualModalOpen, setIsDualModalOpen] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  // Active Partner Data for this phone
  const isPartner1 = currentRole === 'partner1';
  const myPartner = isPartner1 ? coupleProfile.partner1 : coupleProfile.partner2;
  const otherPartner = isPartner1 ? coupleProfile.partner2 : coupleProfile.partner1;
  const myApproved = isPartner1 ? partner1Approved : partner2Approved;
  const otherApproved = isPartner1 ? partner2Approved : partner1Approved;

  // Expected PINs (Aarav: 1404, Ananya: 2512)
  const myExpectedPin = isPartner1 ? '1404' : '2512';

  // Subscribe to real-time events across physical devices
  useEffect(() => {
    const unsubscribe = realtimeVault.onMessage((msg) => {
      if (msg.type === 'CONSENT_GRANTED') {
        sound.playPartnerApproved();
        if (msg.partnerId === 'partner1') setPartner1Approved(true);
        if (msg.partnerId === 'partner2') setPartner2Approved(true);
      } else if (msg.type === 'CONSENT_REVOKED') {
        sound.playSoftClick();
        if (msg.partnerId === 'partner1') setPartner1Approved(false);
        if (msg.partnerId === 'partner2') setPartner2Approved(false);
      } else if (msg.type === 'PANIC_LOCK') {
        sound.playPanicLock();
        setPartner1Approved(false);
        setPartner2Approved(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 45-second security window when only one partner approves
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((partner1Approved && !partner2Approved) || (!partner1Approved && partner2Approved)) {
      setTimeRemaining(45);
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            setPartner1Approved(false);
            setPartner2Approved(false);
            realtimeVault.sendConsent(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeRemaining(null);
    }

    return () => clearInterval(timer);
  }, [partner1Approved, partner2Approved]);

  // When both partners approve: trigger celebration burst, sound, and unlock vault!
  useEffect(() => {
    if (partner1Approved && partner2Approved) {
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
      } catch {
        // Fallback
      }

      const timeout = setTimeout(() => {
        onUnlockVault();
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [partner1Approved, partner2Approved, onUnlockVault]);

  // Real Hardware Biometric Trigger for the active partner on this device
  const handleAuthorizeMyDevice = async () => {
    if (myApproved) {
      // Revoke consent
      sound.playSoftClick();
      if (isPartner1) setPartner1Approved(false);
      else setPartner2Approved(false);
      realtimeVault.sendConsent(false);
      return;
    }

    sound.playBiometricScan();
    setBiometricScanning(true);

    const hasHardware = await isPlatformAuthenticatorAvailable();
    if (hasHardware) {
      const auth = await verifyPasskey(currentRole);
      setBiometricScanning(false);
      if (auth.success) {
        sound.playPartnerApproved();
        if (isPartner1) setPartner1Approved(true);
        else setPartner2Approved(true);
        realtimeVault.sendConsent(true);
        return;
      }
    }

    setBiometricScanning(false);
    // If no hardware or user cancelled biometric, prompt for Passcode PIN modal
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    sound.playPartnerApproved();
    if (isPartner1) setPartner1Approved(true);
    else setPartner2Approved(true);
    realtimeVault.sendConsent(true);
  };

  const bothApproved = partner1Approved && partner2Approved;

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

        {/* Hardware Face ID / Passkey Setup Button */}
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
      </div>

      {/* Hero Visual Area: Nicely Structured (No Collisions!) */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-2 z-10">
        
        {/* Couple Avatars & Connection Bar */}
        <div className="w-full max-w-sm flex items-center justify-between px-2 mb-2">
          
          {/* Partner 1 Avatar Block */}
          <div className="flex flex-col items-center">
            <span className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold text-stone-200 mb-2 flex items-center gap-1">
              <span>❤️</span>
              <span>{coupleProfile.partner1.name}</span>
            </span>

            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 border-2 transition-all duration-300 ${
              partner1Approved
                ? 'border-emeraldGlow shadow-[0_0_20px_rgba(78,204,163,0.5)]'
                : 'border-[#FF2E93]/60'
            }`}>
              <img
                src={coupleProfile.partner1.avatar}
                alt={coupleProfile.partner1.name}
                className="w-full h-full object-cover rounded-full"
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-[#120317] ${
                partner1Approved ? 'bg-emeraldGlow text-black' : 'bg-black/80 text-stone-400'
              }`}>
                {partner1Approved ? '✓' : '1'}
              </div>
            </div>

            <span className={`text-[10px] font-mono mt-1.5 ${partner1Approved ? 'text-emeraldGlow font-bold' : 'text-stone-400'}`}>
              {partner1Approved ? 'Share 1 Active' : 'Key Share 1'}
            </span>
          </div>

          {/* Interlocking Heart / Key Animation in Center */}
          <div className="flex-1 flex flex-col items-center px-1">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <motion.div
                className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 ${
                  bothApproved
                    ? 'bg-[#FF2E93] text-white border-white shadow-pink-glow scale-110'
                    : partner1Approved || partner2Approved
                      ? 'bg-black/60 text-emeraldGlow border-emeraldGlow shadow-[0_0_15px_rgba(78,204,163,0.3)] animate-pulse'
                      : 'bg-black/40 text-[#FF4D9D] border-white/10'
                }`}
              >
                {bothApproved ? (
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

          {/* Partner 2 Avatar Block */}
          <div className="flex flex-col items-center">
            <span className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold text-stone-200 mb-2 flex items-center gap-1">
              <span>✨</span>
              <span>{coupleProfile.partner2.name}</span>
            </span>

            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 border-2 transition-all duration-300 ${
              partner2Approved
                ? 'border-emeraldGlow shadow-[0_0_20px_rgba(78,204,163,0.5)]'
                : 'border-[#A855F7]/60'
            }`}>
              <img
                src={coupleProfile.partner2.avatar}
                alt={coupleProfile.partner2.name}
                className="w-full h-full object-cover rounded-full"
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-[#120317] ${
                partner2Approved ? 'bg-emeraldGlow text-black' : 'bg-black/80 text-stone-400'
              }`}>
                {partner2Approved ? '✓' : '2'}
              </div>
            </div>

            <span className={`text-[10px] font-mono mt-1.5 ${partner2Approved ? 'text-emeraldGlow font-bold' : 'text-stone-400'}`}>
              {partner2Approved ? 'Share 2 Active' : 'Key Share 2'}
            </span>
          </div>

        </div>

        {/* Live Mutual Status Alert Card */}
        <div className="w-full max-w-sm mt-3 px-2">
          <div className={`p-3 rounded-2xl border text-center transition-all ${
            bothApproved
              ? 'bg-emeraldGlow/15 border-emeraldGlow/40 text-emeraldGlow'
              : myApproved && !otherApproved
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : !myApproved && otherApproved
                  ? 'bg-[#FF2E93]/15 border-[#FF2E93]/40 text-stone-200 animate-pulse'
                  : 'bg-black/30 border-white/10 text-stone-300'
          }`}>
            {bothApproved ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-emeraldGlow animate-spin" />
                <span>Both Partners Approved • Decrypting Vault...</span>
              </div>
            ) : myApproved && !otherApproved ? (
              <div className="text-xs">
                <span className="font-bold text-amber-300 block">
                  ✓ You ({myPartner.name}) Approved!
                </span>
                <span className="text-[11px] text-stone-400 font-mono mt-0.5 block">
                  Waiting for {otherPartner.name} to scan on Phone 2... ({timeRemaining}s)
                </span>
              </div>
            ) : !myApproved && otherApproved ? (
              <div className="text-xs">
                <span className="font-bold text-[#FF4D9D] block">
                  ⚡ {otherPartner.name} has Approved on their phone!
                </span>
                <span className="text-[11px] text-stone-300 mt-0.5 block">
                  Scan your Face ID below to unlock the vault. ({timeRemaining}s)
                </span>
              </div>
            ) : (
              <div className="text-xs">
                <span className="font-semibold text-stone-200 block">
                  Dual-Approval Required
                </span>
                <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                  Both partners must verify from their devices to decrypt
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Control Area for THIS Device */}
      <div className="text-center px-2 pb-1 z-10 flex flex-col items-center">
        
        {/* Device Identity Badge */}
        <div className="flex items-center gap-2 mb-3 text-xs text-stone-400">
          <span>This phone is: <strong className="text-white">{myPartner.name} (Phone {isPartner1 ? '1' : '2'})</strong></span>
          <button
            onClick={() => {
              sound.playSoftClick();
              onChangeRole(isPartner1 ? 'partner2' : 'partner1');
            }}
            className="text-[#FF4D9D] hover:underline flex items-center gap-0.5 font-semibold text-[11px]"
            title="Switch phone role"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Switch</span>
          </button>
        </div>

        {/* Primary Action Button (Only approves for THIS user!) */}
        <motion.button
          onClick={handleAuthorizeMyDevice}
          disabled={bothApproved || biometricScanning}
          whileTap={{ scale: 0.96 }}
          className={`w-full max-w-xs py-3.5 px-6 rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mb-2.5 ${
            myApproved
              ? 'bg-emeraldGlow/20 text-emeraldGlow border border-emeraldGlow/40 hover:bg-emeraldGlow/30'
              : 'btn-neon-pink text-white shadow-pink-glow'
          }`}
        >
          {biometricScanning ? (
            <>
              <ScanFace className="w-4 h-4 animate-spin" />
              <span>Scanning Face ID...</span>
            </>
          ) : myApproved ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>You Approved (Tap to Cancel)</span>
            </>
          ) : (
            <>
              <ScanFace className="w-4 h-4" />
              <span>Verify Face ID as {myPartner.name}</span>
            </>
          )}
        </motion.button>

        {/* Fallback & Helper links */}
        <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
          {!myApproved && (
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

      {/* Security PIN Entry Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        partnerName={myPartner.name}
        expectedPin={myExpectedPin}
        onSuccess={handlePinSuccess}
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
        partner1Approved={partner1Approved}
        partner2Approved={partner2Approved}
        onApprovePartner1={() => {
          setPartner1Approved(true);
          realtimeVault.broadcastMessage({ type: 'CONSENT_GRANTED', partnerId: 'partner1', senderDeviceId: 'sim', timestamp: Date.now() });
        }}
        onApprovePartner2={() => {
          setPartner2Approved(true);
          realtimeVault.broadcastMessage({ type: 'CONSENT_GRANTED', partnerId: 'partner2', senderDeviceId: 'sim', timestamp: Date.now() });
        }}
        onUnlockVault={onUnlockVault}
      />
    </div>
  );
};
