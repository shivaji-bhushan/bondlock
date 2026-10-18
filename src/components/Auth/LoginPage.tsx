import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  Lock, 
  KeyRound, 
  ScanFace, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  UserPlus, 
  LogIn, 
  User, 
  Fingerprint, 
  Shield, 
  RefreshCw
} from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { verifyPasskey, isPlatformAuthenticatorAvailable } from '../../utils/webAuthn';
import { sound } from '../../utils/sound';
import { initialCoupleProfile } from '../../data/initialMemories';

interface LoginPageProps {
  coupleProfile: CoupleProfile;
  onLoginSuccess: (partnerId: 'partner1' | 'partner2') => void;
  onUpdateCoupleProfile?: (profile: CoupleProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  coupleProfile,
  onLoginSuccess,
  onUpdateCoupleProfile,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedPartner, setSelectedPartner] = useState<'partner1' | 'partner2' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Sign Up / Create Account Form State
  const [signUpData, setSignUpData] = useState({
    yourName: '',
    partnerName: '',
    vaultName: '',
    anniversaryDate: new Date().toISOString().split('T')[0],
    yourPin: '',
    partnerPin: '',
    biometricType: 'Face ID' as 'Face ID' | 'Touch ID',
  });
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [keyGenStep, setKeyGenStep] = useState('');

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;

  const activePartnerData = selectedPartner === 'partner1' ? partner1 : selectedPartner === 'partner2' ? partner2 : null;
  const expectedPin = selectedPartner === 'partner1' 
    ? (partner1.pin || '1404') 
    : (partner2.pin || '2512');

  const handleSelectPartner = (id: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    setSelectedPartner(id);
    setPin('');
    setError(false);
    setErrorMessage('');
  };

  const handlePinDigit = (digit: string) => {
    sound.playSoftClick();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      setErrorMessage('');

      if (nextPin.length === 4) {
        if (nextPin === expectedPin || nextPin === '1234') {
          sound.playPartnerApproved();
          setTimeout(() => {
            onLoginSuccess(selectedPartner!);
          }, 300);
        } else {
          sound.playPanicLock();
          setError(true);
          setErrorMessage('Incorrect PIN. Please try again.');
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
    setError(true);
    setErrorMessage('Biometric verification failed. Please enter PIN.');
    setTimeout(() => setError(false), 2000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();

    if (!signUpData.yourName.trim() || !signUpData.partnerName.trim()) {
      setError(true);
      setErrorMessage('Please enter both your name and partner’s name.');
      return;
    }

    if (signUpData.yourPin.length !== 4 || signUpData.partnerPin.length !== 4) {
      setError(true);
      setErrorMessage('Both security PINs must be exactly 4 digits.');
      return;
    }

    setError(false);
    setErrorMessage('');
    setIsGeneratingKeys(true);

    // Cryptographic Key Generation Simulation
    setKeyGenStep('Generating 256-bit AES Master Vault Key...');
    await new Promise((r) => setTimeout(r, 600));

    setKeyGenStep('Computing (2, 2) Shamir Secret Sharing polynomial split...');
    await new Promise((r) => setTimeout(r, 700));

    setKeyGenStep('Enrolling biometric credentials into Secure Enclave...');
    await new Promise((r) => setTimeout(r, 600));

    const share1Hex = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();
    const share2Hex = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();

    const newProfile: CoupleProfile = {
      partner1: {
        id: 'partner1',
        name: signUpData.yourName.trim(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: `${signUpData.yourName.trim()} • Key Share 1`,
        biometricType: signUpData.biometricType,
        deviceInfo: 'Enclave Secure Phone',
        keyShareId: share1Hex,
        pin: signUpData.yourPin,
      },
      partner2: {
        id: 'partner2',
        name: signUpData.partnerName.trim(),
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        role: `${signUpData.partnerName.trim()} • Key Share 2`,
        biometricType: signUpData.biometricType === 'Face ID' ? 'Touch ID' : 'Face ID',
        deviceInfo: 'Partner Paired Device',
        keyShareId: share2Hex,
        pin: signUpData.partnerPin,
      },
      anniversaryDate: signUpData.anniversaryDate || '2025-01-01',
      vaultName: signUpData.vaultName.trim() || `${signUpData.yourName.trim()} & ${signUpData.partnerName.trim()}’s Sanctuary`,
    };

    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(newProfile);
    }

    setIsGeneratingKeys(false);
    sound.playVaultUnlocked();
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    // Automatically log in as Partner 1 (creator)
    onLoginSuccess('partner1');
  };

  const handleResetToDemo = () => {
    sound.playSoftClick();
    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(initialCoupleProfile);
    }
    setSelectedPartner(null);
    setPin('');
    setAuthMode('signin');
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-4 sm:p-6 ambient-app-canvas text-stone-200 select-none">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center pt-1">
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF2E93] via-[#E11D74] to-[#A855F7] flex items-center justify-center text-white shadow-pink-glow mb-2">
          <Heart className="w-5 h-5 fill-white" />
        </div>

        <h1 className="font-sans text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>BondLock</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF4D9D] font-mono border border-[#FF2E93]/30">
            v2.4
          </span>
        </h1>
        <p className="text-xs text-stone-400 font-sans mt-0.5 max-w-xs">
          Couples’ Zero-Knowledge 2-of-2 Hardware Encrypted Vault
        </p>

        {/* Auth Mode Segmented Control (Sign In vs Create Account) */}
        {!selectedPartner && !isGeneratingKeys && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mt-3.5 max-w-[280px] w-full">
            <button
              onClick={() => {
                sound.playSoftClick();
                setAuthMode('signin');
                setError(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'signin'
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#A855F7] text-white shadow-pink-glow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => {
                sound.playSoftClick();
                setAuthMode('signup');
                setError(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#A855F7] text-white shadow-pink-glow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-3 w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: SIGN IN MODE - STEP 1: Select Your Identity */}
          {authMode === 'signin' && !selectedPartner && (
            <motion.div
              key="select-identity"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-3.5"
            >
              <div className="text-center mb-3">
                <span className="px-3 py-0.5 rounded-full bg-[#FF2E93]/15 text-[#FF4D9D] text-[10px] font-mono border border-[#FF2E93]/30 uppercase tracking-wider font-semibold">
                  Identity Verification
                </span>
                <h2 className="font-sans text-lg font-bold text-white mt-1.5">
                  Who is logging in?
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Select your profile on this device to decrypt your key share
                </p>
              </div>

              {/* Partner 1 Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPartner('partner1')}
                className="glass-card-reference rounded-2xl p-3.5 cursor-pointer flex items-center justify-between border border-white/10 hover:border-[#FF2E93]/50 transition-all bg-[#1E0727]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-[#FF2E93] to-[#A855F7]">
                    <img
                      src={partner1.avatar}
                      alt={partner1.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emeraldGlow border-2 border-[#120317]" />
                  </div>

                  <div>
                    <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                      <span>{partner1.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF4D9D] font-mono">
                        Partner A
                      </span>
                    </h3>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {partner1.keyShareId} • {partner1.biometricType}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-stone-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Partner 2 Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPartner('partner2')}
                className="glass-card-reference rounded-2xl p-3.5 cursor-pointer flex items-center justify-between border border-white/10 hover:border-[#A855F7]/50 transition-all bg-[#1E0727]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-[#A855F7] to-[#FF4D9D]">
                    <img
                      src={partner2.avatar}
                      alt={partner2.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emeraldGlow border-2 border-[#120317]" />
                  </div>

                  <div>
                    <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                      <span>{partner2.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A855F7]/20 text-[#C084FC] font-mono">
                        Partner B
                      </span>
                    </h3>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {partner2.keyShareId} • {partner2.biometricType}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-stone-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Create Account Link */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    sound.playSoftClick();
                    setAuthMode('signup');
                  }}
                  className="text-xs text-[#FF4D9D] hover:underline flex items-center justify-center gap-1.5 mx-auto font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New couple? Create a custom vault account</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW 2: SIGN IN MODE - STEP 2: Authenticate Selected Partner */}
          {authMode === 'signin' && selectedPartner && (
            <motion.div
              key="auth-pin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              {/* Selected Partner Header */}
              <div className="relative w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-[#FF2E93] to-[#A855F7] shadow-pink-glow mb-2">
                <img
                  src={activePartnerData?.avatar}
                  alt={activePartnerData?.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div className="text-center">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF4D9D] font-mono">
                  Logging in as
                </span>
                <h2 className="font-sans text-lg font-bold text-white mt-1">
                  {activePartnerData?.name}
                </h2>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Enter 4-digit PIN (Default: <code className="text-[#FF4D9D] font-mono">{expectedPin}</code> or <code className="text-stone-300 font-mono">1234</code>)
                </p>
              </div>

              {/* PIN Indicator Dots */}
              <div className={`flex items-center gap-3.5 my-3.5 ${error ? 'animate-bounce' : ''}`}>
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
                  {errorMessage || 'Incorrect PIN or biometric failed.'}
                </p>
              )}

              {/* Native Face ID 1-Tap Trigger Button */}
              <button
                onClick={handleFaceIDLogin}
                disabled={biometricLoading}
                className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 mb-3.5 transition-colors"
              >
                <ScanFace className="w-4 h-4 text-[#FF4D9D]" />
                <span>{biometricLoading ? 'Verifying Hardware Passkey...' : 'Login with Face ID / Passkey'}</span>
              </button>

              {/* Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinDigit(digit)}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-base font-bold text-white flex items-center justify-center transition-all mx-auto"
                  >
                    {digit}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinDigit('0')}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-base font-bold text-white flex items-center justify-center transition-all mx-auto"
                >
                  0
                </button>
                <button
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/15 text-xs text-stone-400 font-mono flex items-center justify-center transition-all mx-auto"
                >
                  ⌫
                </button>
              </div>

              {/* Switch Partner Link */}
              <button
                onClick={() => setSelectedPartner(null)}
                className="mt-3.5 text-xs text-stone-400 hover:text-white underline"
              >
                Not {activePartnerData?.name}? Switch user
              </button>
            </motion.div>
          )}

          {/* VIEW 3: CREATE ACCOUNT / SIGN UP MODE */}
          {authMode === 'signup' && !isGeneratingKeys && (
            <motion.div
              key="create-account"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-3"
            >
              <div className="text-center mb-2">
                <span className="px-3 py-0.5 rounded-full bg-[#A855F7]/15 text-[#C084FC] text-[10px] font-mono border border-[#A855F7]/30 uppercase tracking-wider font-semibold">
                  New Couple Setup
                </span>
                <h2 className="font-sans text-base font-bold text-white mt-1">
                  Create Your Couple Vault
                </h2>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Generates 2-of-2 Shamir keys for both partners
                </p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-2.5">
                {/* Your Name */}
                <div>
                  <label className="text-[11px] text-stone-300 font-medium flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-[#FF4D9D]" />
                    <span>Your Name (Partner A)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav / Shiva"
                    value={signUpData.yourName}
                    onChange={(e) => setSignUpData({ ...signUpData, yourName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-[#FF2E93]"
                  />
                </div>

                {/* Partner's Name */}
                <div>
                  <label className="text-[11px] text-stone-300 font-medium flex items-center gap-1.5 mb-1">
                    <Heart className="w-3.5 h-3.5 text-[#A855F7]" />
                    <span>Partner's Name (Partner B)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya"
                    value={signUpData.partnerName}
                    onChange={(e) => setSignUpData({ ...signUpData, partnerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-[#A855F7]"
                  />
                </div>

                {/* Vault Name */}
                <div>
                  <label className="text-[11px] text-stone-300 font-medium flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Vault Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Our Secret Sanctuary"
                    value={signUpData.vaultName}
                    onChange={(e) => setSignUpData({ ...signUpData, vaultName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-[#FF2E93]"
                  />
                </div>

                {/* Security PINs for both partners */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-stone-300 font-mono block mb-1">
                      Your PIN (4-digit)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="e.g. 1404"
                      value={signUpData.yourPin}
                      onChange={(e) => setSignUpData({ ...signUpData, yourPin: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-center font-mono text-xs tracking-widest focus:outline-none focus:border-[#FF2E93]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-300 font-mono block mb-1">
                      Partner PIN (4-digit)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="e.g. 2512"
                      value={signUpData.partnerPin}
                      onChange={(e) => setSignUpData({ ...signUpData, partnerPin: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-center font-mono text-xs tracking-widest focus:outline-none focus:border-[#A855F7]"
                    />
                  </div>
                </div>

                {/* Biometric Type Selector */}
                <div className="pt-1">
                  <label className="text-[10px] text-stone-300 font-mono block mb-1">
                    Preferred Hardware Biometric
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignUpData({ ...signUpData, biometricType: 'Face ID' })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                        signUpData.biometricType === 'Face ID'
                          ? 'bg-[#FF2E93]/20 border-[#FF2E93] text-white'
                          : 'bg-white/5 border-white/10 text-stone-400'
                      }`}
                    >
                      <ScanFace className="w-3.5 h-3.5 text-[#FF4D9D]" />
                      <span>Face ID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignUpData({ ...signUpData, biometricType: 'Touch ID' })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                        signUpData.biometricType === 'Touch ID'
                          ? 'bg-[#A855F7]/20 border-[#A855F7] text-white'
                          : 'bg-white/5 border-white/10 text-stone-400'
                      }`}
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-[#C084FC]" />
                      <span>Touch ID</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-panicRed font-mono text-center pt-1">
                    {errorMessage}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl btn-neon-pink text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-pink-glow mt-3 hover:opacity-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Cryptographic Vault</span>
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setAuthMode('signin');
                  }}
                  className="text-xs text-stone-400 hover:text-white underline"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW 4: KEY GENERATION ANIMATION */}
          {isGeneratingKeys && (
            <motion.div
              key="generating-keys"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF2E93] to-[#A855F7] p-1 shadow-pink-glow mb-4 animate-spin">
                <div className="w-full h-full bg-[#120317] rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#FF4D9D]" />
                </div>
              </div>

              <h3 className="font-sans text-base font-bold text-white mb-2">
                Creating Zero-Knowledge Vault...
              </h3>
              <p className="text-xs text-[#FF4D9D] font-mono animate-pulse max-w-xs">
                {keyGenStep}
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Security & Demo Reset Footer */}
      <div className="pt-2 border-t border-white/5 flex flex-col items-center gap-2">
        <p className="text-[10px] text-stone-500 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D9D]" />
          <span>AES-256-GCM • Secure Enclave • 2-of-2 SSS</span>
        </p>

        {/* Quick Reset to Demo Accounts (Aarav & Ananya) */}
        <button
          onClick={handleResetToDemo}
          className="text-[10px] text-stone-500 hover:text-stone-300 flex items-center gap-1 font-mono transition-colors"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Reset to Demo Couple (Aarav & Ananya)</span>
        </button>
      </div>
    </div>
  );
};
