import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Smartphone, Shield, ScanFace, Fingerprint, Check, Info, Lock } from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { InterlockingKey } from './InterlockingKey';
import { DualDeviceModal } from './DualDeviceModal';
import { sound } from '../../utils/sound';

interface LockScreenProps {
  coupleProfile: CoupleProfile;
  onUnlockVault: () => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  coupleProfile,
  onUnlockVault,
  onOpenSecurity,
  onOpenSettings,
}) => {
  const [partner1Approved, setPartner1Approved] = useState(false);
  const [partner2Approved, setPartner2Approved] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isDualModalOpen, setIsDualModalOpen] = useState(false);

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

  const handleSimulateBoth = () => {
    sound.playBiometricScan();
    setPartner1Approved(true);
    setTimeout(() => {
      setPartner2Approved(true);
    }, 280);
  };

  const handleTogglePartner1 = () => {
    if (partner1Approved) {
      sound.playSoftClick();
      setPartner1Approved(false);
    } else {
      sound.playBiometricScan();
      setTimeout(() => {
        sound.playPartnerApproved();
        setPartner1Approved(true);
      }, 350);
    }
  };

  const handleTogglePartner2 = () => {
    if (partner2Approved) {
      sound.playSoftClick();
      setPartner2Approved(false);
    } else {
      sound.playBiometricScan();
      setTimeout(() => {
        sound.playPartnerApproved();
        setPartner2Approved(true);
      }, 350);
    }
  };

  return (
    <div className="relative min-h-full flex flex-col justify-between py-4 px-4 sm:px-6 select-none ambient-app-canvas text-stone-200">
      
      {/* Top Header matching reference image: Title 'BondLock' */}
      <div className="flex items-center justify-between z-10 pt-1">
        <button
          onClick={onOpenSecurity}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/15 transition-colors"
          title="Security Specs"
        >
          <Shield className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h2 className="font-sans text-sm font-semibold tracking-wide text-white/90">
            BondLock
          </h2>
          <span className="text-[10px] text-pink-400/90 font-mono">
            Zero-Knowledge Dual Vault
          </span>
        </div>

        <button
          onClick={() => {
            sound.playSoftClick();
            setIsDualModalOpen(true);
          }}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/15 transition-colors"
          title="Dual Phone Simulator"
        >
          <Smartphone className="w-4 h-4 text-neonPink-400" />
        </button>
      </div>

      {/* Main Composition Matching Reference Left Phone: Organic Pill/Circle Avatars with Floating Tags */}
      <div className="relative my-auto flex flex-col items-center justify-center py-4">
        
        {/* Glow backdrop aura */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#FF2E93]/20 via-[#A855F7]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative w-72 h-72 flex items-center justify-center">
          
          {/* FLOATING TAG 1 (Top Left of Partner 1) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 left-0 z-30 glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-lg border border-white/15"
            onClick={handleTogglePartner1}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF2E93] animate-pulse" />
            <span className="text-[11px] font-sans font-medium text-stone-100">
              ❤️ {coupleProfile.partner1.name} (Share 1)
            </span>
          </motion.div>

          {/* FLOATING TAG 2 (Top Right of Partner 2) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-8 right-0 z-30 glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-lg border border-white/15"
            onClick={handleTogglePartner2}
          >
            <span className="text-[11px] text-amber-300">✨</span>
            <span className="text-[11px] font-sans font-medium text-stone-100">
              Face ID Active
            </span>
          </motion.div>

          {/* FLOATING TAG 3 (Bottom Left) */}
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

          {/* FLOATING TAG 4 (Bottom Right) */}
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
          </motion.div>

          {/* PARTNER 2 (Right Vertical Rounded Pill Avatar) */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={handleTogglePartner2}
            className={`absolute bottom-2 right-6 w-32 h-44 rounded-[40px] overflow-hidden border-2 cursor-pointer shadow-2xl transition-all duration-500 z-20 ${
              partner2Approved
                ? 'border-[#4ECCA3] shadow-[0_0_25px_rgba(78,204,163,0.5)]'
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
          </motion.div>

          {/* Center Intersecting Energy Key Ring */}
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

        {/* 30s Timeout Indicator */}
        {timeRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-center text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block"
          >
            Waiting for other partner... ({timeRemaining}s)
          </motion.div>
        )}
      </div>

      {/* Hero Typography & CTA matching reference image */}
      <div className="text-center px-2 pb-3 z-10 flex flex-col items-center">
        
        {/* Headline */}
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
          Two Hearts, One Key.<br />
          <span className="bg-gradient-to-r from-[#FF4D9D] to-[#A855F7] bg-clip-text text-transparent">
            Fall in Love Every Day
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs text-stone-400 max-w-xs mb-5 leading-relaxed font-sans">
          Your precious moments are locked with 2-of-2 zero-knowledge encryption. Neither partner can unlock it alone.
        </p>

        {/* Primary Glowing Gradient CTA Button */}
        <motion.button
          onClick={handleSimulateBoth}
          whileTap={{ scale: 0.96 }}
          className="w-full max-w-xs py-3.5 px-6 rounded-full btn-neon-pink text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-pink-glow transition-all mb-3 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Authorize Vault Unlock</span>
        </motion.button>

        {/* Secondary Sub-action links */}
        <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
          <span>Tap avatars to scan individually</span>
          <span>•</span>
          <button
            onClick={() => setIsDualModalOpen(true)}
            className="text-[#FF4D9D] hover:underline font-semibold"
          >
            2 Devices Mode
          </button>
        </div>
      </div>

      {/* Dual Device Modal */}
      <DualDeviceModal
        isOpen={isDualModalOpen}
        onClose={() => setIsDualModalOpen(false)}
        partner1={coupleProfile.partner1}
        partner2={coupleProfile.partner2}
        partner1Approved={partner1Approved}
        partner2Approved={partner2Approved}
        onApprovePartner1={() => setPartner1Approved(true)}
        onApprovePartner2={() => setPartner2Approved(true)}
        onUnlockVault={onUnlockVault}
      />
    </div>
  );
};
