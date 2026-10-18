import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, QrCode, Copy, Check, ShieldCheck, Share2, Sparkles } from 'lucide-react';
import { Partner } from '../../types/vault';
import { sound } from '../../utils/sound';

interface DualDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner1: Partner;
  partner2: Partner;
  partner1Approved: boolean;
  partner2Approved: boolean;
  onApprovePartner1: () => void;
  onApprovePartner2: () => void;
  onUnlockVault: () => void;
}

export const DualDeviceModal: React.FC<DualDeviceModalProps> = ({
  isOpen,
  onClose,
  partner1,
  partner2,
  partner1Approved,
  partner2Approved,
  onApprovePartner1,
  onApprovePartner2,
  onUnlockVault,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const inviteUrl = `https://bondlock.app/session/${Math.random().toString(36).substring(2, 9)}`;

  const handleCopyLink = () => {
    sound.playSoftClick();
    navigator.clipboard?.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  const bothApproved = partner1Approved && partner2Approved;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-obsidian-900 border border-rosegold-400/25 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rosegold-400/10 border border-rosegold-400/30 flex items-center justify-center text-rosegold-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-stone-100 font-semibold">
                  Dual-Device Authorization Simulator
                </h3>
                <p className="text-xs text-stone-400">
                  Simulate remote approvals across two physical devices in real-time
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

          {/* Interactive Dual Screens Simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 overflow-y-auto">
            {/* Device A (Partner 1) */}
            <div className="bg-obsidian-850/90 rounded-2xl p-4 border border-white/5 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-[11px] text-stone-400 font-mono mb-3">
                <span className="flex items-center gap-1.5 text-rosegold-300">
                  <span className="w-2 h-2 rounded-full bg-rosegold-400" />
                  {partner1.name}’s Device
                </span>
                <span>iOS 18.2</span>
              </div>

              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rosegold-400/40 mb-3 shadow-md">
                <img src={partner1.avatar} alt={partner1.name} className="w-full h-full object-cover" />
              </div>

              <p className="font-serif text-lg text-stone-200 font-medium">{partner1.name}</p>
              <p className="text-[10px] text-stone-400 font-mono mb-4">{partner1.keyShareId}</p>

              <button
                onClick={() => {
                  sound.playBiometricScan();
                  onApprovePartner1();
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  partner1Approved
                    ? 'bg-emeraldGlow text-obsidian-950 font-bold shadow-emerald-glow'
                    : 'bg-obsidian-800 text-stone-200 border border-rosegold-400/30 hover:border-rosegold-400'
                }`}
              >
                {partner1Approved ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approved & Holding Share 1</span>
                  </>
                ) : (
                  <span>Authorize from {partner1.name}’s Screen</span>
                )}
              </button>
            </div>

            {/* Device B (Partner 2) */}
            <div className="bg-obsidian-850/90 rounded-2xl p-4 border border-white/5 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-[11px] text-stone-400 font-mono mb-3">
                <span className="flex items-center gap-1.5 text-emeraldGlow">
                  <span className="w-2 h-2 rounded-full bg-emeraldGlow" />
                  {partner2.name}’s Device
                </span>
                <span>iOS 18.2</span>
              </div>

              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emeraldGlow/40 mb-3 shadow-md">
                <img src={partner2.avatar} alt={partner2.name} className="w-full h-full object-cover" />
              </div>

              <p className="font-serif text-lg text-stone-200 font-medium">{partner2.name}</p>
              <p className="text-[10px] text-stone-400 font-mono mb-4">{partner2.keyShareId}</p>

              <button
                onClick={() => {
                  sound.playBiometricScan();
                  onApprovePartner2();
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  partner2Approved
                    ? 'bg-emeraldGlow text-obsidian-950 font-bold shadow-emerald-glow'
                    : 'bg-obsidian-800 text-stone-200 border border-rosegold-400/30 hover:border-rosegold-400'
                }`}
              >
                {partner2Approved ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approved & Holding Share 2</span>
                  </>
                ) : (
                  <span>Authorize from {partner2.name}’s Screen</span>
                )}
              </button>
            </div>
          </div>

          {/* Real-World Pairing Link & QR */}
          <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="p-2 rounded-lg bg-obsidian-800 border border-white/10 text-rosegold-400">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-stone-400 truncate text-[11px] max-w-[220px]">
                {inviteUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 transition-colors"
                title="Copy Invite Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emeraldGlow" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {bothApproved && (
              <button
                onClick={() => {
                  onClose();
                  onUnlockVault();
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-rosegold-400 to-rosegold-500 text-obsidian-950 font-bold text-xs flex items-center justify-center gap-2 shadow-rosegold-glow animate-pulse"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enter Decrypted Vault</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
