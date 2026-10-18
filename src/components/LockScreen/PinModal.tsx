import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, KeyRound, Check, Delete } from 'lucide-react';
import { sound } from '../../utils/sound';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  expectedPin: string;
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  expectedPin,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xs bg-[#18051E] border border-[#FF2E93]/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-stone-200 select-none"
        >
          {/* Close button */}
          <button
            onClick={() => {
              sound.playSoftClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-[#FF2E93]/15 border border-[#FF2E93]/30 flex items-center justify-center text-[#FF4D9D] mb-3">
            <KeyRound className="w-6 h-6" />
          </div>

          <h3 className="font-sans text-base font-bold text-white text-center">
            {partnerName}’s Security PIN
          </h3>
          <p className="text-[11px] text-stone-400 text-center mt-1">
            Enter 4-digit partner passcode (Default: <code className="text-[#FF4D9D]">{expectedPin}</code>)
          </p>

          {/* PIN Dots Display */}
          <div className={`flex items-center gap-3 my-6 ${error ? 'animate-bounce' : ''}`}>
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
            <p className="text-xs text-panicRed font-mono mb-3">
              Incorrect passcode. Try again.
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-lg font-bold text-white flex items-center justify-center transition-all mx-auto"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigit('0')}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-lg font-bold text-white flex items-center justify-center transition-all mx-auto"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-stone-300 flex items-center justify-center transition-all mx-auto"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
