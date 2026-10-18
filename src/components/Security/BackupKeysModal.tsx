import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Key, Printer, Download, Check, Copy } from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { sound } from '../../utils/sound';

interface BackupKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleProfile: CoupleProfile;
}

export const BackupKeysModal: React.FC<BackupKeysModalProps> = ({
  isOpen,
  onClose,
  coupleProfile,
}) => {
  const [copiedShareA, setCopiedShareA] = useState(false);
  const [copiedShareB, setCopiedShareB] = useState(false);

  if (!isOpen) return null;

  const mnemonicA = "velvet amber whisper eclipse ember canyon horizon beacon pulse marble sanctuary summit";
  const mnemonicB = "sapphire harbor promise midnight solstice nebula lantern cascade prism refuge zenith meadow";

  const handleCopyA = () => {
    sound.playSoftClick();
    navigator.clipboard?.writeText(mnemonicA);
    setCopiedShareA(true);
    setTimeout(() => setCopiedShareA(false), 2000);
  };

  const handleCopyB = () => {
    sound.playSoftClick();
    navigator.clipboard?.writeText(mnemonicB);
    setCopiedShareB(true);
    setTimeout(() => setCopiedShareB(false), 2000);
  };

  const handlePrint = () => {
    sound.playSoftClick();
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-obsidian-900 border border-rosegold-400/25 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rosegold-400/10 border border-rosegold-400/30 flex items-center justify-center text-rosegold-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-stone-100 font-semibold">
                  Emergency Paper Backup Shares
                </h3>
                <p className="text-xs text-stone-400">
                  Keep these 12-word recovery shares in separate private safes
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
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                <strong>Never store both shares in the same place.</strong> Partner A holds Share 1; Partner B holds Share 2. If a device is lost or destroyed, combining both paper sheets restores vault access.
              </p>
            </div>

            {/* Share 1 (Partner A) */}
            <div className="p-4 rounded-2xl bg-obsidian-850/80 border border-rosegold-400/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rosegold-400" />
                  <span className="font-serif text-base text-stone-200 font-semibold">
                    Share #1 • For {coupleProfile.partner1.name} Only
                  </span>
                </div>
                <button
                  onClick={handleCopyA}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-stone-300 flex items-center gap-1.5 transition-colors"
                >
                  {copiedShareA ? <Check className="w-3.5 h-3.5 text-emeraldGlow" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedShareA ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2">
                {mnemonicA.split(' ').map((word, i) => (
                  <div key={i} className="p-2 rounded-lg bg-obsidian-900 border border-white/5 text-center">
                    <span className="text-[10px] text-stone-500 font-mono block">{i + 1}</span>
                    <span className="text-xs font-mono text-rosegold-300 font-medium">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share 2 (Partner B) */}
            <div className="p-4 rounded-2xl bg-obsidian-850/80 border border-emeraldGlow/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emeraldGlow" />
                  <span className="font-serif text-base text-stone-200 font-semibold">
                    Share #2 • For {coupleProfile.partner2.name} Only
                  </span>
                </div>
                <button
                  onClick={handleCopyB}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-stone-300 flex items-center gap-1.5 transition-colors"
                >
                  {copiedShareB ? <Check className="w-3.5 h-3.5 text-emeraldGlow" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedShareB ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-2">
                {mnemonicB.split(' ').map((word, i) => (
                  <div key={i} className="p-2 rounded-lg bg-obsidian-900 border border-white/5 text-center">
                    <span className="text-[10px] text-stone-500 font-mono block">{i + 1}</span>
                    <span className="text-xs font-mono text-emeraldGlow font-medium">{word}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 border border-white/10 text-stone-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-rosegold-400" />
              <span>Print Secure Couple Cards</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
