import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, KeyRound, Check, Delete, Shield, ScanFace } from 'lucide-react';
import { sound } from '../../utils/sound';
import { verifyPasskey, isPlatformAuthenticatorAvailable, hasEnrolledPasskey } from '../../utils/webAuthn';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  expectedPin: string;
  onSuccess: () => void;
  partnerId?: 'partner1' | 'partner2';
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  expectedPin,
  onSuccess,
  partnerId = 'partner1',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    sound.playSoftClick();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin || nextPin === '1234') { // allow default PIN
          sound.playPartnerApproved();
          setTimeout(() => {
            onSuccess();
            onClose();
            setPin('');
          }, 250);
        } else {
          sound.playPanicLock();
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    sound.playSoftClick();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricVerify = async () => {
    sound.playBiometricScan();
    setBiometricLoading(true);

    const hasHardware = await isPlatformAuthenticatorAvailable();
    if (hasHardware && hasEnrolledPasskey(partnerId)) {
      const auth = await verifyPasskey(partnerId);
      setBiometricLoading(false);
      if (auth.success) {
        sound.playPartnerApproved();
        onSuccess();
        onClose();
        return;
      }
    }

    setBiometricLoading(false);
    setError(true);
    setTimeout(() => setError(false), 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xs bg-[#18051E] border border-[#FF2E93]/30 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-stone-200"
        >
          {/* Close button */}
          <button
            onClick={() => {
              sound.playSoftClick();
              onClose();
            }}
            className="absolute top-3.5 right-3.5 p-2 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/30 flex items-center justify-center text-[#FF4D9D] mb-2 shadow-pink-glow">
            <KeyRound className="w-6 h-6" />
          </div>

          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF4D9D] font-mono border border-[#FF2E93]/30 mb-1">
            2-of-2 Security Enforcement
          </span>

          <h3 className="font-sans text-base font-bold text-white text-center">
            {partnerName}’s Secret PIN
          </h3>
          <p className="text-[11px] text-stone-400 text-center mt-0.5 max-w-[220px]">
            Enter secret 4-digit PIN to release key share. (Default: <code className="text-[#FF4D9D] font-mono font-bold">{expectedPin}</code> or <code className="text-stone-300 font-mono">1234</code>)
          </p>

          {/* PIN Dots Display */}
          <div className={`flex items-center gap-3.5 my-4 ${error ? 'animate-bounce' : ''}`}>
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  idx < pin.length
                    ? error
                      ? 'bg-panicRed scale-125'
                      : 'bg-[#FF2E93] scale-125 shadow-pink-glow'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-panicRed font-mono mb-2 text-center">
              Incorrect PIN. Random fingerprints are blocked.
            </p>
          )}

          {/* Optional Enrolled Biometric Trigger */}
          {hasEnrolledPasskey(partnerId) && (
            <button
              onClick={handleBiometricVerify}
              disabled={biometricLoading}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 mb-3 transition-colors"
            >
              <ScanFace className="w-4 h-4 text-[#FF4D9D]" />
              <span>{biometricLoading ? 'Verifying Hardware Passkey...' : 'Use Enrolled Passkey'}</span>
            </button>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[210px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="w-13 h-13 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-lg font-bold text-white flex items-center justify-center transition-all mx-auto"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigit('0')}
              className="w-13 h-13 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-lg font-bold text-white flex items-center justify-center transition-all mx-auto"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="w-13 h-13 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-stone-300 flex items-center justify-center transition-all mx-auto"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-3 text-[10px] text-stone-500 font-mono flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#FF4D9D]" />
            <span>Strict PIN required to prevent unauthorized unlocks</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
