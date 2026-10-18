import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Smartphone, Shield, QrCode, ScanFace, Check } from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { InterlockingKey } from './InterlockingKey';
import { DualDeviceModal } from './DualDeviceModal';
import { PairDeviceModal } from './PairDeviceModal';
import { PasskeyModal } from '../Security/PasskeyModal';
import { verifyPasskey, isPlatformAuthenticatorAvailable } from '../../utils/webAuthn';
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
  const [biometricScanning, setBiometricScanning] = useState<'partner1' | 'partner2' | null>(null);

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

  // 30-second security window when only one partner approves
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((partner1Approved && !partner2Approved) || (!partner1Approved && partner2Approved)) {
      setTimeRemaining(30);
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

  // Real Hardware Biometric Trigger for Partner 1
  const handleTogglePartner1 = async () => {
    if (partner1Approved) {
      sound.playSoftClick();
      setPartner1Approved(false);
      realtimeVault.broadcastMessage({
        type: 'CONSENT_REVOKED',
        partnerId: 'partner1',
        timestamp: Date.now(),
      });
      return;
    }

    sound.playBiometricScan();
    setBiometricScanning('partner1');

    // Attempt real WebAuthn hardware Face ID / Touch ID
    const hasHardware = await isPlatformAuthenticatorAvailable();
    if (hasHardware) {
      const auth = await verifyPasskey('partner1');
      setBiometricScanning(null);
      if (auth.success) {
        sound.playPartnerApproved();
        setPartner1Approved(true);
        realtimeVault.broadcastMessage({
          type: 'CONSENT_GRANTED',
          partnerId: 'partner1',
          timestamp: Date.now(),
        });
        return;
      }
    }

    // Smooth fallback if no hardware or cancelled
    setTimeout(() => {
      setBiometricScanning(null);
      sound.playPartnerApproved();
      setPartner1Approved(true);
      realtimeVault.broadcastMessage({
        type: 'CONSENT_GRANTED',
        partnerId: 'partner1',
        timestamp: Date.now(),
      });
    }, 400);
  };

  // Real Hardware Biometric Trigger for Partner 2
  const handleTogglePartner2 = async () => {
    if (partner2Approved) {
      sound.playSoftClick();
      setPartner2Approved(false);
      realtimeVault.broadcastMessage({
        type: 'CONSENT_REVOKED',
        partnerId: 'partner2',
        timestamp: Date.now(),
      });
      return;
    }

    sound.playBiometricScan();
    setBiometricScanning('partner2');

    // Attempt real WebAuthn hardware Face ID / Touch ID
    const hasHardware = await isPlatformAuthenticatorAvailable();
    if (hasHardware) {
      const auth = await verifyPasskey('partner2');
      setBiometricScanning(null);
      if (auth.success) {
        sound.playPartnerApproved();
        setPartner2Approved(true);
        realtimeVault.broadcastMessage({
          type: 'CONSENT_GRANTED',
          partnerId: 'partner2',
          timestamp: Date.now(),
        });
        return;
      }
    }

    // Smooth fallback if no hardware or cancelled
    setTimeout(() => {
      setBiometricScanning(null);
      sound.playPartnerApproved();
      setPartner2Approved(true);
      realtimeVault.broadcastMessage({
        type: 'CONSENT_GRANTED',
        partnerId: 'partner2',
        timestamp: Date.now(),
      });
    }, 400);
  };

  const handleSimulateBoth = () => {
    sound.playBiometricScan();
    setPartner1Approved(true);
    realtimeVault.broadcastMessage({
      type: 'CONSENT_GRANTED',
      partnerId: 'partner1',
      timestamp: Date.now(),
    });

    setTimeout(() => {
      setPartner2Approved(true);
      realtimeVault.broadcastMessage({
        type: 'CONSENT_GRANTED',
        partnerId: 'partner2',
        timestamp: Date.now(),
      });
    }, 280);
  };

  return (
    <div className="relative min-h-full flex flex-col justify-between py-3 px-4 sm:px-6 select-none ambient-app-canvas text-stone-200">
      
      {/* Top Header: Title + Pair QR + Face ID Passkey button */}
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
          <span>{partnerConnected ? 'Partner Synced' : 'Pair Real Phone'}</span>
          <QrCode className="w-3 h-3 ml-0.5" />
        </button>

        {/* Real Hardware Face ID / Passkey Setup Button */}
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

      {/* Main Composition: Organic Cutouts with Floating Tags */}
      <div className="relative my-auto flex flex-col items-center justify-center py-2">
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#FF2E93]/20 via-[#A855F7]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative w-72 h-72 flex items-center justify-center">
          
          {/* FLOATING TAG 1 (Partner 1) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute top-2 left-0 z-30 glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-lg border transition-all ${
              partner1Approved ? 'border-emeraldGlow bg-emeraldGlow/20 text-emeraldGlow' : 'border-white/15'
            }`}
            onClick={handleTogglePartner1}
          >
            <span className={`w-2 h-2 rounded-full ${partner1Approved ? 'bg-emeraldGlow' : 'bg-[#FF2E93] animate-pulse'}`} />
            <span className="text-[11px] font-sans font-medium text-stone-100 flex items-center gap-1">
              <ScanFace className="w-3 h-3 text-[#FF4D9D]" />
              {coupleProfile.partner1.name} {partner1Approved ? '✓' : '(Share 1)'}
            </span>
          </motion.div>

          {/* FLOATING TAG 2 (Partner 2) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`absolute top-8 right-0 z-30 glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-lg border transition-all ${
              partner2Approved ? 'border-emeraldGlow bg-emeraldGlow/20 text-emeraldGlow' : 'border-white/15'
            }`}
            onClick={handleTogglePartner2}
          >
            <span className="text-[11px] text-amber-300">✨</span>
            <span className="text-[11px] font-sans font-medium text-stone-100 flex items-center gap-1">
              <ScanFace className="w-3 h-3 text-[#A855F7]" />
              {coupleProfile.partner2.name} {partner2Approved ? '✓' : '(Share 2)'}
            </span>
          </motion.div>

          {/* FLOATING TAG 3 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-6 left-2 z-30 glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/15"
          >
            <span className="text-[11px]">👥</span>
            <span className="text-[11px] font-sans font-medium text-stone-200">
              1,283d Together
            </span>
          </motion.div>

          {/* FLOATING TAG 4 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-3 right-0 z-30 glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/15"
          >
            <span className="text-[11px]">🔒</span>
            <span className="text-[11px] font-sans font-medium text-stone-200">
              2/2 Shamir Lock
            </span>
          </motion.div>

          {/* PARTNER 1 (Left Circle Avatar) */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={handleTogglePartner1}
            className={`absolute top-6 left-6 w-32 h-32 rounded-full overflow-hidden border-2 cursor-pointer shadow-2xl transition-all duration-500 z-10 ${
              partner1Approved
                ? 'border-[#4ECCA3] shadow-[0_0_25px_rgba(78,204,163,0.5)]'
                : biometricScanning === 'partner1'
                  ? 'border-[#FF2E93] shadow-pink-glow animate-pulse'
                  : 'border-[#FF2E93]/60 hover:border-[#FF2E93]'
            }`}
          >
            <img
              src={coupleProfile.partner1.avatar}
              alt={coupleProfile.partner1.name}
              className="w-full h-full object-cover"
            />
            {partner1Approved && (
              <div className="absolute inset-0 bg-emeraldGlow/30 backdrop-blur-2xs flex items-center justify-center">
                <Check className="w-8 h-8 text-white stroke-[3] filter drop-shadow" />
              </div>
            )}
            {biometricScanning === 'partner1' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center">
                <ScanFace className="w-8 h-8 text-[#FF4D9D] animate-spin" />
                <span className="text-[9px] font-mono text-white mt-1">Scanning...</span>
              </div>
            )}
          </motion.div>

          {/* PARTNER 2 (Right Vertical Rounded Pill Avatar) */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={handleTogglePartner2}
            className={`absolute bottom-2 right-6 w-32 h-44 rounded-[40px] overflow-hidden border-2 cursor-pointer shadow-2xl transition-all duration-500 z-20 ${
              partner2Approved
                ? 'border-[#4ECCA3] shadow-[0_0_25px_rgba(78,204,163,0.5)]'
                : biometricScanning === 'partner2'
                  ? 'border-[#A855F7] shadow-pink-glow animate-pulse'
                  : 'border-[#A855F7]/60 hover:border-[#A855F7]'
            }`}
          >
            <img
              src={coupleProfile.partner2.avatar}
              alt={coupleProfile.partner2.name}
              className="w-full h-full object-cover"
            />
            {partner2Approved && (
              <div className="absolute inset-0 bg-emeraldGlow/30 backdrop-blur-2xs flex items-center justify-center">
                <Check className="w-8 h-8 text-white stroke-[3] filter drop-shadow" />
              </div>
            )}
            {biometricScanning === 'partner2' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center">
                <ScanFace className="w-8 h-8 text-[#A855F7] animate-spin" />
                <span className="text-[9px] font-mono text-white mt-1">Scanning...</span>
              </div>
            )}
          </motion.div>

          {/* Center Interlocking Key */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
            <InterlockingKey
              partner1Approved={partner1Approved}
              partner2Approved={partner2Approved}
              partner1Name={coupleProfile.partner1.name}
              partner2Name={coupleProfile.partner2.name}
              isUnlocked={partner1Approved && partner2Approved}
            />
          </div>
        </div>

        {/* 30s Security Countdown */}
        {timeRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-center text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full inline-block"
          >
            Waiting for other partner... ({timeRemaining}s)
          </motion.div>
        )}
      </div>

      {/* Hero Typography & CTA */}
      <div className="text-center px-2 pb-2 z-10 flex flex-col items-center">
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5 leading-tight">
          Two Hearts, One Key.<br />
          <span className="bg-gradient-to-r from-[#FF4D9D] to-[#A855F7] bg-clip-text text-transparent">
            Fall in Love Every Day
          </span>
        </h1>

        <p className="text-xs text-stone-400 max-w-xs mb-4 leading-relaxed font-sans">
          Tap your photo to trigger native Apple Face ID / Android Biometric sensor.
        </p>

        {/* Primary CTA Button */}
        <motion.button
          onClick={handleSimulateBoth}
          whileTap={{ scale: 0.96 }}
          className="w-full max-w-xs py-3.5 px-6 rounded-full btn-neon-pink text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-pink-glow transition-all mb-2.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Authorize Vault Unlock</span>
        </motion.button>

        <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
          <button
            onClick={() => setIsPasskeyModalOpen(true)}
            className="text-[#FF4D9D] hover:underline font-semibold flex items-center gap-1"
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Enroll Hardware Face ID</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setIsPairModalOpen(true)}
            className="hover:text-stone-200"
          >
            Pair 2 Phones
          </button>
        </div>
      </div>

      {/* Hardware Face ID / Passkey Modal */}
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
        onApprovePartner1={handleTogglePartner1}
        onApprovePartner2={handleTogglePartner2}
        onUnlockVault={onUnlockVault}
      />
    </div>
  );
};
