import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ShieldCheck, Key, LogOut, ScanFace, Smartphone, Calendar, Heart } from 'lucide-react';
import { CoupleProfile, Partner } from '../../types/vault';
import { hasEnrolledPasskey } from '../../utils/webAuthn';
import { sound } from '../../utils/sound';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner;
  coupleProfile: CoupleProfile;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  partner,
  coupleProfile,
  onLogout,
}) => {
  if (!isOpen) return null;

  const isEnrolled = hasEnrolledPasskey(partner.id);
  const otherPartner = partner.id === 'partner1' ? coupleProfile.partner2 : coupleProfile.partner1;

  const handleLogoutClick = () => {
    sound.playSoftClick();
    onLogout();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm bg-[#18051E] border border-[#FF2E93]/25 rounded-3xl p-6 shadow-2xl flex flex-col text-stone-200 select-none overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-mono font-bold text-[#FF4D9D] uppercase tracking-wider">
              Identified User Profile
            </span>
            <button
              onClick={() => {
                sound.playSoftClick();
                onClose();
              }}
              className="p-1.5 rounded-full text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Card */}
          <div className="flex flex-col items-center my-4 text-center">
            <div className="relative w-22 h-22 rounded-full p-1 bg-gradient-to-tr from-[#FF2E93] to-[#A855F7] shadow-pink-glow mb-2.5">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="w-full h-full object-cover rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emeraldGlow border-2 border-[#120317] flex items-center justify-center text-[9px] font-bold text-black">
                ✓
              </span>
            </div>

            <h3 className="font-sans text-xl font-bold text-white flex items-center gap-1.5">
              <span>{partner.name}</span>
              <span className="w-4 h-4 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold">
                ✓
              </span>
            </h3>

            <p className="text-xs text-stone-400 font-sans mt-0.5">
              {partner.role} • {coupleProfile.vaultName}
            </p>
          </div>

          {/* Identity & Cryptographic Badges */}
          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-300">
                <Key className="w-4 h-4 text-[#FF4D9D]" />
                <span>Assigned Key Share</span>
              </div>
              <span className="text-white font-bold">{partner.keyShareId}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-300">
                <ScanFace className="w-4 h-4 text-[#A855F7]" />
                <span>Hardware Biometrics</span>
              </div>
              <span className={isEnrolled ? 'text-emeraldGlow font-bold' : 'text-amber-400'}>
                {isEnrolled ? 'Passkey Enrolled' : 'PIN Protected'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-300">
                <Heart className="w-4 h-4 text-[#FF2E93]" />
                <span>Coupled With</span>
              </div>
              <span className="text-white font-sans font-bold">{otherPartner.name}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={handleLogoutClick}
              className="w-full py-2.5 px-4 rounded-xl bg-panicRed/15 hover:bg-panicRed/25 border border-panicRed/30 text-panicRed text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out & Switch Partner</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
