import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ScanFace, Fingerprint, ShieldCheck, Check, Trash2, Smartphone, AlertCircle, Sparkles } from 'lucide-react';
import {
  enrollPasskey,
  verifyPasskey,
  hasEnrolledPasskey,
  removePasskey,
  isPlatformAuthenticatorAvailable,
} from '../../utils/webAuthn';
import { CoupleProfile } from '../../types/vault';
import { sound } from '../../utils/sound';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleProfile: CoupleProfile;
  currentRole: 'partner1' | 'partner2';
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({
  isOpen,
  onClose,
  coupleProfile,
  currentRole,
}) => {
  const [platformSupported, setPlatformSupported] = useState<boolean | null>(null);
  const [hasPasskey1, setHasPasskey1] = useState(false);
  const [hasPasskey2, setHasPasskey2] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      isPlatformAuthenticatorAvailable().then((supported) => {
        setPlatformSupported(supported);
      });
      setHasPasskey1(hasEnrolledPasskey('partner1'));
      setHasPasskey2(hasEnrolledPasskey('partner2'));
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnroll = async (partnerId: 'partner1' | 'partner2', name: string) => {
    sound.playSoftClick();
    setIsProcessing(true);
    setStatusMessage('Triggering device biometric prompt (Face ID / Touch ID)...');

    const result = await enrollPasskey(partnerId, name);
    setIsProcessing(false);

    if (result.success) {
      sound.playPartnerApproved();
      setStatusMessage(`✓ Hardware Passkey for ${name} successfully enrolled in Secure Enclave!`);
      if (partnerId === 'partner1') setHasPasskey1(true);
      if (partnerId === 'partner2') setHasPasskey2(true);
    } else {
      sound.playSoftClick();
      setStatusMessage(`Notice: ${result.error || 'Biometric scan was not completed'}`);
    }
  };

  const handleTestVerify = async (partnerId: 'partner1' | 'partner2', name: string) => {
    sound.playSoftClick();
    setIsProcessing(true);
    setStatusMessage('Look at your camera or place finger on sensor...');

    const result = await verifyPasskey(partnerId);
    setIsProcessing(false);

    if (result.success) {
      sound.playVaultUnlocked();
      setStatusMessage(`✓ Face ID verified successfully for ${name}!`);
    } else {
      sound.playSoftClick();
      setStatusMessage(`Scan failed or cancelled: ${result.error}`);
    }
  };

  const handleRemove = (partnerId: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    removePasskey(partnerId);
    if (partnerId === 'partner1') setHasPasskey1(false);
    if (partnerId === 'partner2') setHasPasskey2(false);
    setStatusMessage('Passkey removed from local storage');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#18051E] border border-[#FF2E93]/25 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-stone-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF2E93]/15 border border-[#FF2E93]/30 flex items-center justify-center text-[#FF4D9D]">
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans text-xl font-bold text-white">
                  Hardware Face ID & Passkeys
                </h3>
                <p className="text-xs text-stone-400">
                  Native Apple Face ID, Touch ID & Android Biometrics
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playSoftClick();
                onClose();
              }}
              className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4 overflow-y-auto flex-1">
            {/* Sensor Detection Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
              platformSupported
                ? 'bg-emeraldGlow/10 border-emeraldGlow/30 text-emeraldGlow'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}>
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div>
                <strong className="block font-sans">
                  {platformSupported
                    ? 'Hardware Biometric Sensor Detected'
                    : 'Standard Platform Sensor Mode'}
                </strong>
                <span className="text-[11px] text-stone-300">
                  {platformSupported
                    ? 'Apple Secure Enclave / Android Biometric Prompt is ready.'
                    : 'If testing on PC without Windows Hello, smooth simulated biometrics will run automatically.'}
                </span>
              </div>
            </div>

            {/* Status Feedback Message */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-200 font-mono text-center"
              >
                {statusMessage}
              </motion.div>
            )}

            {/* Partner 1 Hardware Passkey */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#FF2E93]/40">
                    <img src={coupleProfile.partner1.avatar} alt={coupleProfile.partner1.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{coupleProfile.partner1.name} (Partner A)</h4>
                    <span className="text-[11px] font-mono text-stone-400">
                      {hasPasskey1 ? '🔒 Passkey Enrolled in Device' : 'Passkey Not Yet Created'}
                    </span>
                  </div>
                </div>

                {hasPasskey1 ? (
                  <span className="px-2.5 py-1 rounded-full bg-emeraldGlow/15 border border-emeraldGlow/30 text-emeraldGlow text-[10px] font-bold">
                    ✓ Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-stone-400 text-[10px]">
                    Optional
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {hasPasskey1 ? (
                  <>
                    <button
                      onClick={() => handleTestVerify('partner1', coupleProfile.partner1.name)}
                      disabled={isProcessing}
                      className="flex-1 py-2 px-3 rounded-xl btn-neon-pink text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>Test Scan Face ID</span>
                    </button>
                    <button
                      onClick={() => handleRemove('partner1')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-panicRed/20 text-stone-400 hover:text-panicRed transition-colors"
                      title="Remove passkey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEnroll('partner1', coupleProfile.partner1.name)}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#A855F7] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>Enroll Real Face ID / Passkey</span>
                  </button>
                )}
              </div>
            </div>

            {/* Partner 2 Hardware Passkey */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#A855F7]/40">
                    <img src={coupleProfile.partner2.avatar} alt={coupleProfile.partner2.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{coupleProfile.partner2.name} (Partner B)</h4>
                    <span className="text-[11px] font-mono text-stone-400">
                      {hasPasskey2 ? '🔒 Passkey Enrolled in Device' : 'Passkey Not Yet Created'}
                    </span>
                  </div>
                </div>

                {hasPasskey2 ? (
                  <span className="px-2.5 py-1 rounded-full bg-emeraldGlow/15 border border-emeraldGlow/30 text-emeraldGlow text-[10px] font-bold">
                    ✓ Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-stone-400 text-[10px]">
                    Optional
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {hasPasskey2 ? (
                  <>
                    <button
                      onClick={() => handleTestVerify('partner2', coupleProfile.partner2.name)}
                      disabled={isProcessing}
                      className="flex-1 py-2 px-3 rounded-xl btn-neon-pink text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>Test Scan Face ID</span>
                    </button>
                    <button
                      onClick={() => handleRemove('partner2')}
                      className="p-2 rounded-xl bg-white/5 hover:bg-panicRed/20 text-stone-400 hover:text-panicRed transition-colors"
                      title="Remove passkey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEnroll('partner2', coupleProfile.partner2.name)}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF2E93] to-[#A855F7] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>Enroll Real Face ID / Passkey</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
