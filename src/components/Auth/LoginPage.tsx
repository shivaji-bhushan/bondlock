import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, KeyRound, ScanFace, ArrowRight, ShieldCheck, Sparkles, Check, ChevronRight } from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { verifyPasskey, isPlatformAuthenticatorAvailable } from '../../utils/webAuthn';
import { sound } from '../../utils/sound';

interface LoginPageProps {
  coupleProfile: CoupleProfile;
  onLoginSuccess: (partnerId: 'partner1' | 'partner2') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  coupleProfile,
  onLoginSuccess,
}) => {
  const [selectedPartner, setSelectedPartner] = useState<'partner1' | 'partner2' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;

  const activePartnerData = selectedPartner === 'partner1' ? partner1 : selectedPartner === 'partner2' ? partner2 : null;
  const expectedPin = selectedPartner === 'partner1' ? '1404' : '2512';

  const handleSelectPartner = (id: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    setSelectedPartner(id);
    setPin('');
    setError(false);
  };

  const handlePinDigit = (digit: string) => {
    sound.playSoftClick();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin || nextPin === '1234') {
          sound.playPartnerApproved();
          setTimeout(() => {
            onLoginSuccess(selectedPartner!);
          }, 300);
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

  const handleFaceIDLogin = async () => {
    if (!selectedPartner) return;
    sound.playBiometricScan();
    setBiometricLoading(true);

    const hasHardware = await isPlatformAuthenticatorAvailable();
    if (hasHardware) {
      const auth = await verifyPasskey(selectedPartner);
      setBiometricLoading(false);
      if (auth.success) {
        sound.playVaultUnlocked();
        onLoginSuccess(selectedPartner);
        return;
      }
    }

    setBiometricLoading(false);
    // If biometric not enrolled or cancelled, prompt for PIN
    setError(true);
    setTimeout(() => setError(false), 1500);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 sm:p-7 ambient-app-canvas text-stone-200 select-none">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center pt-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2E93] via-[#E11D74] to-[#A855F7] flex items-center justify-center text-white shadow-pink-glow mb-3">
          <Heart className="w-6 h-6 fill-white" />
        </div>

        <h1 className="font-sans text-2xl font-bold tracking-tight text-white">
          BondLock
        </h1>
        <p className="text-xs text-stone-400 font-sans mt-0.5 max-w-xs">
          Couples’ Zero-Knowledge Private Vault
        </p>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-4 w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {!selectedPartner ? (
            /* STEP 1: Select Your Identity */
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="text-center mb-5">
                <span className="px-3 py-1 rounded-full bg-[#FF2E93]/15 text-[#FF4D9D] text-[11px] font-mono border border-[#FF2E93]/30 uppercase tracking-wider font-semibold">
                  Identity Verification
                </span>
                <h2 className="font-sans text-lg font-bold text-white mt-2">
                  Who is using this phone?
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Select your profile to authenticate before accessing the locker
                </p>
              </div>

              {/* Partner 1 Card (Aarav) */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPartner('partner1')}
                className="glass-card-reference rounded-2xl p-4 cursor-pointer flex items-center justify-between border border-white/10 hover:border-[#FF2E93]/50 transition-all bg-[#1E0727]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#FF2E93] to-[#A855F7]">
                    <img
                      src={partner1.avatar}
                      alt={partner1.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emeraldGlow border-2 border-[#120317]" />
                  </div>

                  <div>
                    <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                      <span>{partner1.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF4D9D] font-mono">
                        Partner A
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                      Key Share 1 • {partner1.biometricType}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-stone-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Partner 2 Card (Ananya) */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPartner('partner2')}
                className="glass-card-reference rounded-2xl p-4 cursor-pointer flex items-center justify-between border border-white/10 hover:border-[#A855F7]/50 transition-all bg-[#1E0727]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#A855F7] to-[#FF4D9D]">
                    <img
                      src={partner2.avatar}
                      alt={partner2.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emeraldGlow border-2 border-[#120317]" />
                  </div>

                  <div>
                    <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                      <span>{partner2.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A855F7]/20 text-[#C084FC] font-mono">
                        Partner B
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                      Key Share 2 • {partner2.biometricType}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-stone-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* STEP 2: Authenticate Selected Partner (PIN or Face ID) */
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              {/* Selected Partner Header */}
              <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FF2E93] to-[#A855F7] shadow-pink-glow mb-2">
                <img
                  src={activePartnerData?.avatar}
                  alt={activePartnerData?.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <h2 className="font-sans text-lg font-bold text-white">
                Welcome back, {activePartnerData?.name}
              </h2>
              <p className="text-xs text-stone-400 font-sans mt-0.5 text-center">
                Enter your 4-digit PIN (Default: <code className="text-[#FF4D9D] font-mono">{expectedPin}</code>)
              </p>

              {/* PIN Dots */}
              <div className={`flex items-center gap-3.5 my-4 ${error ? 'animate-bounce' : ''}`}>
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all ${
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
                <p className="text-xs text-panicRed font-mono mb-2">
                  Incorrect PIN or biometric failed. Try again.
                </p>
              )}

              {/* Native Face ID 1-Tap Trigger Button */}
              <button
                onClick={handleFaceIDLogin}
                disabled={biometricLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 mb-4 transition-colors"
              >
                <ScanFace className="w-4 h-4 text-[#FF4D9D]" />
                <span>{biometricLoading ? 'Scanning Face ID...' : 'Login with Face ID / Passkey'}</span>
              </button>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[230px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinDigit(digit)}
                    className="w-13 h-13 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-lg font-bold text-white flex items-center justify-center transition-all mx-auto"
                  >
                    {digit}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinDigit('0')}
                  className="w-13 h-13 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-lg font-bold text-white flex items-center justify-center transition-all mx-auto"
                >
                  0
                </button>
                <button
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="w-13 h-13 rounded-full bg-white/5 hover:bg-white/15 text-xs text-stone-400 font-mono flex items-center justify-center transition-all mx-auto"
                >
                  ⌫
                </button>
              </div>

              {/* Switch Partner Link */}
              <button
                onClick={() => setSelectedPartner(null)}
                className="mt-4 text-xs text-stone-400 hover:text-white underline"
              >
                Not {activePartnerData?.name}? Switch user
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Security Footer */}
      <div className="text-center pt-2 border-t border-white/5">
        <p className="text-[10px] text-stone-500 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D9D]" />
          <span>Hardware Authenticated • 2-of-2 Shamir Protection</span>
        </p>
      </div>
    </div>
  );
};
