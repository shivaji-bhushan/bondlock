import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ShieldAlert, Key, Lock, Eye, AlertTriangle, FileKey, CheckCircle2 } from 'lucide-react';
import { CoupleProfile, SecuritySettings } from '../../types/vault';
import { ShamirGraph } from './ShamirGraph';
import { BackupKeysModal } from './BackupKeysModal';
import { sound } from '../../utils/sound';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleProfile: CoupleProfile;
  securitySettings: SecuritySettings;
  onUpdateSecuritySettings: (settings: SecuritySettings) => void;
  onFreezeVault: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  coupleProfile,
  securitySettings,
  onUpdateSecuritySettings,
  onFreezeVault,
}) => {
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  if (!isOpen) return null;

  const toggleAntiScreenshot = () => {
    sound.playSoftClick();
    onUpdateSecuritySettings({
      ...securitySettings,
      antiScreenshotWatermark: !securitySettings.antiScreenshotWatermark,
    });
  };

  const handleTriggerFreeze = () => {
    if (window.confirm('EMERGENCY VAULT FREEZE: This will immediately zeroize session RAM, erase local caches, and lock the vault until both paper recovery shares are validated. Proceed?')) {
      sound.playPanicLock();
      onFreezeVault();
      onClose();
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-obsidian-900 border border-rosegold-400/25 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emeraldGlow/10 border border-emeraldGlow/30 flex items-center justify-center text-emeraldGlow">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl text-stone-100 font-semibold">
                    Security & Trust Architecture
                  </h3>
                  <p className="text-xs text-stone-400">
                    Military-grade zero-knowledge 2-of-2 threshold cryptographic scheme
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playSoftClick();
                  onClose();
                }}
                className="p-2 rounded-full text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Active Shamir Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-obsidian-850 to-obsidian-800 border border-emeraldGlow/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emeraldGlow animate-ping" />
                    <span className="font-serif text-base text-stone-100 font-semibold">
                      Shamir Secret Sharing Active
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5 font-mono">
                    2-of-2 Key Shares Configured & Verified
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emeraldGlow/15 border border-emeraldGlow/40 text-emeraldGlow text-xs font-mono font-bold">
                  Threshold: 2/2
                </div>
              </div>

              {/* Hardware Share Distribution */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-obsidian-850/80 border border-white/5">
                  <span className="text-stone-500 block text-[10px]">Share A Assigned to:</span>
                  <span className="text-rosegold-300 font-bold block mt-0.5">{coupleProfile.partner1.name}</span>
                  <span className="text-[10px] text-stone-400 block mt-1">Touch/FaceID Enclave</span>
                </div>
                <div className="p-3 rounded-xl bg-obsidian-850/80 border border-white/5">
                  <span className="text-stone-500 block text-[10px]">Share B Assigned to:</span>
                  <span className="text-emeraldGlow font-bold block mt-0.5">{coupleProfile.partner2.name}</span>
                  <span className="text-[10px] text-stone-400 block mt-1">Biometric Passkey</span>
                </div>
              </div>

              {/* Mathematical Shamir Graph Visualizer */}
              <ShamirGraph
                partner1Name={coupleProfile.partner1.name}
                partner2Name={coupleProfile.partner2.name}
              />

              {/* Anti-Screenshot Watermark Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-obsidian-850/80 border border-rosegold-400/15">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rosegold-400/10 flex items-center justify-center text-rosegold-400 mt-0.5">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-stone-200 block">
                      Anti-Screenshot Protection
                    </span>
                    <span className="text-xs text-stone-400 block mt-0.5">
                      Displays dynamic holographic timestamp watermark & activates privacy blackout shield when window focus is lost.
                    </span>
                  </div>
                </div>

                <button
                  onClick={toggleAntiScreenshot}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    securitySettings.antiScreenshotWatermark ? 'bg-emeraldGlow' : 'bg-obsidian-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      securitySettings.antiScreenshotWatermark ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Backup Paper Recovery Keys Button */}
              <button
                onClick={() => {
                  sound.playSoftClick();
                  setIsBackupModalOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-obsidian-850 hover:bg-obsidian-750 border border-white/10 text-stone-200 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileKey className="w-4 h-4 text-rosegold-400" />
                  <span>View Split Paper Recovery Seed Cards</span>
                </div>
                <span className="text-[11px] font-mono text-rosegold-300">View Shares &rarr;</span>
              </button>

              {/* Emergency Freeze Vault Button */}
              <div className="pt-2">
                <button
                  onClick={handleTriggerFreeze}
                  className="w-full p-3.5 rounded-2xl bg-panicRed/15 hover:bg-panicRed/25 border border-panicRed/30 text-panicRed text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-panic-glow"
                >
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  <span>Emergency Freeze Vault</span>
                </button>
                <p className="text-[10px] text-stone-500 text-center mt-1.5 font-mono">
                  Immediately purges all cryptographic key fragments from memory
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <BackupKeysModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        coupleProfile={coupleProfile}
      />
    </>
  );
};
