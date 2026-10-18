import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Save, Sparkles, User, Calendar } from 'lucide-react';
import { CoupleProfile, SecuritySettings } from '../../types/vault';
import { sound } from '../../utils/sound';

interface PartnerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleProfile: CoupleProfile;
  onSaveProfile: (profile: CoupleProfile) => void;
  securitySettings: SecuritySettings;
  onSaveSecuritySettings: (settings: SecuritySettings) => void;
}

export const PartnerSettingsModal: React.FC<PartnerSettingsModalProps> = ({
  isOpen,
  onClose,
  coupleProfile,
  onSaveProfile,
  securitySettings,
  onSaveSecuritySettings,
}) => {
  const [partner1Name, setPartner1Name] = useState(coupleProfile.partner1.name);
  const [partner2Name, setPartner2Name] = useState(coupleProfile.partner2.name);
  const [vaultName, setVaultName] = useState(coupleProfile.vaultName);
  const [anniversaryDate, setAnniversaryDate] = useState(coupleProfile.anniversaryDate);
  const [autoLockMinutes, setAutoLockMinutes] = useState(securitySettings.autoLockMinutes);
  const [soundEnabled, setSoundEnabled] = useState(securitySettings.soundEnabled);

  if (!isOpen) return null;

  const handleSave = () => {
    sound.playSoftClick();
    const updatedProfile: CoupleProfile = {
      ...coupleProfile,
      vaultName: vaultName.trim() || coupleProfile.vaultName,
      anniversaryDate,
      partner1: {
        ...coupleProfile.partner1,
        name: partner1Name.trim() || coupleProfile.partner1.name,
      },
      partner2: {
        ...coupleProfile.partner2,
        name: partner2Name.trim() || coupleProfile.partner2.name,
      },
    };

    const updatedSecurity: SecuritySettings = {
      ...securitySettings,
      autoLockMinutes,
      soundEnabled,
    };

    sound.setMuted(!soundEnabled);
    onSaveProfile(updatedProfile);
    onSaveSecuritySettings(updatedSecurity);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-obsidian-900 border border-rosegold-400/25 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rosegold-400/10 border border-rosegold-400/30 flex items-center justify-center text-rosegold-400">
                <Heart className="w-5 h-5 fill-rosegold-400/20" />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-stone-100 font-semibold">
                  Couple Identity & Preferences
                </h3>
                <p className="text-xs text-stone-400">
                  Personalize your private vault experience
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
            {/* Vault Name */}
            <div>
              <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Vault Sanctuary Name
              </label>
              <input
                type="text"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Partner 1 & Partner 2 Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Partner A (Share 1)
                </label>
                <input
                  type="text"
                  value={partner1Name}
                  onChange={(e) => setPartner1Name(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 text-sm focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Partner B (Share 2)
                </label>
                <input
                  type="text"
                  value={partner2Name}
                  onChange={(e) => setPartner2Name(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Anniversary Date */}
            <div>
              <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Anniversary / Journey Start Date
              </label>
              <input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Auto Lock Timer */}
            <div>
              <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Inactivity Auto-Lock Timeout
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '1 Minute', val: 1 },
                  { label: '5 Minutes', val: 5 },
                  { label: '15 Minutes', val: 15 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      sound.playSoftClick();
                      setAutoLockMinutes(opt.val);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      autoLockMinutes === opt.val
                        ? 'bg-rosegold-400/20 text-rosegold-300 border-rosegold-400/50 shadow-sm'
                        : 'bg-obsidian-850 border-white/5 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Effects Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-obsidian-850 border border-white/5">
              <div>
                <span className="text-sm text-stone-200 font-medium block">
                  Acoustic Feedback & Chimes
                </span>
                <span className="text-xs text-stone-500">
                  Synthesized biometric beeps and harmonic vault unlock chords
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playSoftClick();
                  setSoundEnabled(!soundEnabled);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? 'bg-emeraldGlow' : 'bg-obsidian-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Save */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-end">
            <button
              onClick={handleSave}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rosegold-400 to-rosegold-500 text-obsidian-950 font-bold text-xs flex items-center gap-2 shadow-rosegold-glow hover:opacity-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
