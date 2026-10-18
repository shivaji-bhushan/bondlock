import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  Lock, 
  KeyRound, 
  ScanFace, 
  Sparkles, 
  User, 
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
  Shield, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Check
} from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { verifyPasskey, isPlatformAuthenticatorAvailable } from '../../utils/webAuthn';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
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
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [signInUser, setSignInUser] = useState('Aarav');
  const [signInPin, setSignInPin] = useState('1404');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    yourName: '',
    yourPin: '',
    partnerName: '',
    partnerPin: '',
    vaultName: 'Our Secret Haven',
  });
  const [signUpError, setSignUpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;

  // 1-Tap Partner Selection
  const handleSelectPartner = (role: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    if (role === 'partner1') {
      setSignInUser(partner1.name);
      setSignInPin(partner1.pin || '1404');
    } else {
      setSignInUser(partner2.name);
      setSignInPin(partner2.pin || '2512');
    }
    setSignInError('');
  };

  // 1-Tap Instant Login
  const handleInstantLogin = (role: 'partner1' | 'partner2') => {
    sound.playPartnerApproved();
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    onLoginSuccess(role);
  };

  // Sign In Submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setSignInError('');

    const query = signInUser.trim().toLowerCase();
    const pin = signInPin.trim();

    if (!query) {
      setSignInError('Please enter your username or email.');
      sound.playPanicLock();
      return;
    }

    if (!pin) {
      setSignInError('Please enter your 4-digit security PIN.');
      sound.playPanicLock();
      return;
    }

    // Check saved accounts
    const accounts = storage.getAccounts();
    const matchedAccount = accounts.find(
      (a) =>
        a.username.toLowerCase() === query ||
        a.email.toLowerCase() === query ||
        a.profile.partner1.name.toLowerCase() === query ||
        a.profile.partner2.name.toLowerCase() === query
    );

    const isP1 =
      query.includes('aarav') ||
      query === partner1.name.toLowerCase() ||
      query === 'partner1' ||
      (matchedAccount && matchedAccount.role === 'partner1');

    const isP2 =
      query.includes('ananya') ||
      query === partner2.name.toLowerCase() ||
      query === 'partner2' ||
      (matchedAccount && matchedAccount.role === 'partner2');

    let expectedPin = '';
    let targetRole: 'partner1' | 'partner2' = 'partner1';

    if (isP1) {
      expectedPin = partner1.pin || '1404';
      targetRole = 'partner1';
    } else if (isP2) {
      expectedPin = partner2.pin || '2512';
      targetRole = 'partner2';
    } else if (matchedAccount) {
      expectedPin = matchedAccount.pin;
      targetRole = matchedAccount.role;
    } else {
      // Default to partner1
      expectedPin = partner1.pin || '1404';
      targetRole = 'partner1';
    }

    // Accept expected PIN or demo PIN 1234 or universal match
    if (pin === expectedPin || pin === '1234' || pin === '1404' || pin === '2512') {
      if (matchedAccount && onUpdateCoupleProfile) {
        onUpdateCoupleProfile(matchedAccount.profile);
      }

      sound.playPartnerApproved();
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      setTimeout(() => {
        onLoginSuccess(targetRole);
      }, 250);
    } else {
      sound.playPanicLock();
      setSignInError(`Incorrect PIN. (Default: Aarav is 1404, Ananya is 2512, or demo 1234)`);
    }
  };

  // Sign Up Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setSignUpError('');

    const p1Name = signUpData.yourName.trim();
    const p1Pin = signUpData.yourPin.trim();
    const p2Name = signUpData.partnerName.trim();
    const p2Pin = signUpData.partnerPin.trim();

    if (!p1Name || !p2Name) {
      setSignUpError('Please enter both your name and your partner’s name.');
      sound.playPanicLock();
      return;
    }

    if (p1Pin.length !== 4 || p2Pin.length !== 4) {
      setSignUpError('Both security PINs must be exactly 4 digits.');
      sound.playPanicLock();
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const share1 = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();
    const share2 = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();

    const newProfile: CoupleProfile = {
      partner1: {
        id: 'partner1',
        name: p1Name,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        role: `${p1Name} • Key Share 1`,
        biometricType: 'Face ID',
        deviceInfo: 'Enclave Secured Phone',
        keyShareId: share1,
        pin: p1Pin,
      },
      partner2: {
        id: 'partner2',
        name: p2Name,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        role: `${p2Name} • Key Share 2`,
        biometricType: 'Touch ID',
        deviceInfo: 'Partner Paired Device',
        keyShareId: share2,
        pin: p2Pin,
      },
      anniversaryDate: new Date().toISOString().split('T')[0],
      vaultName: signUpData.vaultName.trim() || `${p1Name} & ${p2Name}’s Vault`,
    };

    // Save to storage
    storage.saveCoupleProfile(newProfile);
    storage.saveAccount({
      email: `${p1Name.toLowerCase()}@bondlock.vault`,
      username: p1Name.toLowerCase(),
      pin: p1Pin,
      role: 'partner1',
      profile: newProfile,
    });
    storage.saveAccount({
      email: `${p2Name.toLowerCase()}@bondlock.vault`,
      username: p2Name.toLowerCase(),
      pin: p2Pin,
      role: 'partner2',
      profile: newProfile,
    });

    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(newProfile);
    }

    setIsSubmitting(false);
    sound.playVaultUnlocked();

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    // Automatically log in as the creator (partner1)
    onLoginSuccess('partner1');
  };

  // Hardware Biometric / Face ID
  const handleBiometricAuth = async () => {
    sound.playBiometricScan();
    const hasHardware = await isPlatformAuthenticatorAvailable();
    if (hasHardware) {
      const auth = await verifyPasskey('partner1');
      if (auth.success) {
        sound.playVaultUnlocked();
        onLoginSuccess('partner1');
        return;
      }
    }
    setSignInError('Biometric passkey unavailable. Please use your 4-digit PIN.');
  };

  // Reset demo
  const handleResetDemo = () => {
    sound.playSoftClick();
    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(initialCoupleProfile);
    }
    setSignInUser('Aarav');
    setSignInPin('1404');
    setSignInError('');
    setAuthTab('signin');
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF5F7] flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans selection:bg-[#FF2E93] selection:text-white select-none relative overflow-x-hidden">
      
      {/* Subtle Background Floating Heart Orbs */}
      <div className="absolute top-10 left-12 w-64 h-64 rounded-full bg-pink-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-12 w-80 h-80 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />

      {/* Main Wide Hero Card (Exact Shape from Reference Screenshot) */}
      <div className="relative w-full max-w-5xl xl:max-w-6xl min-h-[620px] md:h-[84vh] max-h-[780px] bg-white rounded-[36px] sm:rounded-[44px] shadow-2xl border border-rose-100/80 overflow-hidden flex flex-col justify-between">
        
        {/* Top-Left Red Swoosh with "B" Heart Badge */}
        <div className="absolute top-0 left-0 w-28 sm:w-36 h-28 sm:h-36 bg-gradient-to-br from-[#FF2E93] via-[#E11D74] to-[#BE185D] rounded-br-[85px] sm:rounded-br-[100px] flex items-start justify-start p-4 sm:p-5 z-20 shadow-md">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#E11D74]">
            <Heart className="w-5 h-5 fill-[#E11D74]" />
          </div>
        </div>

        {/* Top Navigation Bar */}
        <header className="w-full flex items-center justify-between pl-32 sm:pl-40 pr-6 sm:pr-10 pt-5 pb-3 z-10 text-xs sm:text-sm font-medium text-stone-600">
          <div className="hidden sm:flex items-center gap-6 sm:gap-8 font-sans">
            <span className="text-[#E11D74] font-bold border-b-2 border-[#E11D74] pb-0.5 cursor-pointer">
              Home
            </span>
            <span className="hover:text-stone-900 cursor-pointer transition-colors">
              Better half
            </span>
            <span className="hover:text-stone-900 cursor-pointer transition-colors">
              Memories
            </span>
            <span className="hover:text-stone-900 cursor-pointer transition-colors">
              Zero-Knowledge
            </span>
          </div>

          {/* Top Right Mini Partner Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200/80 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-stone-700">
              {coupleProfile.vaultName.split('’')[0]}
            </span>
          </div>
        </header>

        {/* ================= HERO CONTENT & FLOATING AUTH CARD ================= */}
        <div className="relative flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-12 md:px-16 py-4 overflow-y-auto">
          
          {/* LEFT HERO TEXT: "ALL U NEED IS LOVE." */}
          <div className="z-10 flex flex-col items-start max-w-sm mb-6 lg:mb-0">
            <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-stone-900 leading-[1.05]">
              ALL U<br />
              NEED IS<br />
              <span className="text-stone-900">
                LOVE<span className="text-[#FF2E93]">.</span>
              </span>
            </h1>

            {/* Glowing Pill Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectPartner('partner1')}
              className="mt-6 px-7 py-3 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#E11D74] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-[#FF2E93]/30 hover:opacity-95 transition-all flex items-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>ENTER VAULT</span>
            </motion.button>
          </div>

          {/* CENTER ROMANTIC COUPLE ARTWORK & FLOATING HEARTS */}
          <div className="relative flex items-center justify-center my-4 lg:my-0">
            {/* Halo Background Backdrop */}
            <div className="w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full bg-gradient-to-tr from-pink-100/80 via-rose-50/60 to-purple-50/40 flex items-center justify-center relative shadow-inner">
              
              {/* Couple Silhouette / Vector Illustration */}
              <div className="relative flex flex-col items-center">
                <svg className="w-48 sm:w-56 md:w-64 h-auto drop-shadow-md" viewBox="0 0 200 240" fill="none">
                  {/* Man lifting Woman illustration */}
                  <circle cx="95" cy="50" r="14" fill="#292524" />
                  <circle cx="112" cy="35" r="13" fill="#292524" />
                  {/* Woman Hair bun */}
                  <circle cx="118" cy="26" r="6" fill="#292524" />
                  {/* Man Body */}
                  <path d="M85 64 Q95 64 105 64 L105 130 Q95 135 85 130 Z" fill="#1C1917" />
                  {/* Man Legs (Blue Trousers) */}
                  <path d="M86 130 L82 195 L92 195 L96 140 L100 195 L110 195 L104 130 Z" fill="#2563EB" />
                  {/* Woman Body & Dress (Dark Top, Coral Pink Pants) */}
                  <path d="M104 48 Q115 50 120 70 L115 105 Q105 105 100 85 Z" fill="#1C1917" />
                  <path d="M115 105 L145 135 L140 145 L110 115 Z" fill="#FB7185" />
                  <path d="M110 105 L118 160 L110 160 L102 110 Z" fill="#FB7185" />
                  {/* Shoes */}
                  <rect x="78" y="193" width="16" height="6" rx="3" fill="#1C1917" />
                  <rect x="100" y="193" width="16" height="6" rx="3" fill="#1C1917" />
                </svg>

                {/* Romantic Stream of Floating Red Hearts (From Screenshot) */}
                <div className="absolute right-[-15px] top-[-10px] pointer-events-none">
                  {[
                    { x: 0, y: 0, size: 22, delay: 0 },
                    { x: 18, y: -25, size: 16, delay: 0.2 },
                    { x: -10, y: -45, size: 20, delay: 0.4 },
                    { x: 25, y: -70, size: 18, delay: 0.6 },
                    { x: 5, y: -95, size: 24, delay: 0.8 },
                    { x: 30, y: -120, size: 16, delay: 1.0 },
                  ].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [h.y, h.y - 8, h.y],
                        rotate: [0, 8, -8, 0],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: h.delay,
                      }}
                      style={{
                        position: 'absolute',
                        left: `${h.x}px`,
                        top: `${h.y}px`,
                      }}
                    >
                      <Heart
                        className="fill-[#EF4444] text-[#EF4444] drop-shadow-md"
                        style={{ width: h.size, height: h.size }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT FLOATING CARD (From Screenshot) ================= */}
          <div className="z-20 w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl shadow-2xl border border-stone-200/70 p-5 sm:p-6 flex flex-col justify-between my-2">
            
            {/* Card Header & Brand */}
            <div>
              <div className="text-center mb-3">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                  BondLock<span className="text-[#FF2E93]">,</span>
                </h2>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  {authTab === 'signin' ? 'Sign in to access your locker' : 'Create 2-of-2 couple sanctuary'}
                </p>
              </div>

              {/* Segmented Tab Switcher (Sign In vs Sign Up) */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-100 border border-stone-200 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setAuthTab('signin');
                    setSignInError('');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    authTab === 'signin'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setAuthTab('signup');
                    setSignUpError('');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    authTab === 'signup'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {authTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-2.5">
                
                {/* 1-Tap Partner Quick-Select Chips */}
                <div className="flex items-center gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPartner('partner1')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      signInUser.toLowerCase().includes(partner1.name.toLowerCase())
                        ? 'bg-[#FF2E93]/10 border-[#FF2E93] text-[#E11D74] font-bold shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <span>{partner1.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">(1404)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPartner('partner2')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      signInUser.toLowerCase().includes(partner2.name.toLowerCase())
                        ? 'bg-[#A855F7]/10 border-[#A855F7] text-[#9333EA] font-bold shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <span>{partner2.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">(2512)</span>
                  </button>
                </div>

                {/* Input 1: Username / Email Pill with Chevron */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Username or Email"
                    value={signInUser}
                    onChange={(e) => {
                      setSignInUser(e.target.value);
                      setSignInError('');
                    }}
                    className="w-full px-4 py-2.5 rounded-full bg-white border border-stone-300 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#E11D74] transition-all pr-8 shadow-2xs"
                  />
                  <ChevronRight className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>

                {/* Input 2: 4-Digit Security PIN Pill with Eye */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={4}
                    placeholder="4-Digit Security PIN"
                    value={signInPin}
                    onChange={(e) => {
                      setSignInPin(e.target.value.replace(/\D/g, ''));
                      setSignInError('');
                    }}
                    className="w-full px-4 py-2.5 rounded-full bg-white border border-stone-300 text-stone-900 placeholder-stone-400 font-mono text-xs focus:outline-none focus:border-[#E11D74] transition-all pr-9 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Error Banner */}
                {signInError && (
                  <p className="text-[11px] text-rose-600 font-sans text-center font-medium">
                    {signInError}
                  </p>
                )}

                {/* Dark Pill Submit Button (Exact Style from Screenshot) */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.99] mt-1"
                >
                  Sign In
                </button>

                {/* 1-Tap Biometric Button */}
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  className="w-full py-2 px-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
                >
                  <ScanFace className="w-3.5 h-3.5 text-[#E11D74]" />
                  <span>Face ID / Passkey</span>
                </button>
              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {authTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={signUpData.yourName}
                    onChange={(e) => setSignUpData({ ...signUpData, yourName: e.target.value })}
                    className="w-full px-3 py-2 rounded-full bg-white border border-stone-300 text-stone-900 text-xs focus:outline-none focus:border-[#E11D74]"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Your PIN (4-digit)"
                    value={signUpData.yourPin}
                    onChange={(e) => setSignUpData({ ...signUpData, yourPin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 rounded-full bg-white border border-stone-300 text-stone-900 font-mono text-center text-xs focus:outline-none focus:border-[#E11D74]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Partner Name"
                    value={signUpData.partnerName}
                    onChange={(e) => setSignUpData({ ...signUpData, partnerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-full bg-white border border-stone-300 text-stone-900 text-xs focus:outline-none focus:border-[#E11D74]"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Partner PIN (4-digit)"
                    value={signUpData.partnerPin}
                    onChange={(e) => setSignUpData({ ...signUpData, partnerPin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 rounded-full bg-white border border-stone-300 text-stone-900 font-mono text-center text-xs focus:outline-none focus:border-[#E11D74]"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Vault Name (e.g. Our Sanctuary)"
                  value={signUpData.vaultName}
                  onChange={(e) => setSignUpData({ ...signUpData, vaultName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-full bg-white border border-stone-300 text-stone-900 text-xs focus:outline-none focus:border-[#E11D74]"
                />

                {signUpError && (
                  <p className="text-[11px] text-rose-600 font-sans text-center font-medium">
                    {signUpError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.99] mt-1"
                >
                  {isSubmitting ? 'Creating Vault...' : 'Create Couple Vault'}
                </button>
              </form>
            )}

            {/* Quick Demo Reset Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-mono mt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#E11D74]" />
                <span>2-of-2 SSS</span>
              </span>
              <button
                type="button"
                onClick={handleResetDemo}
                className="hover:text-stone-700 underline transition-colors"
              >
                Reset Demo
              </button>
            </div>

          </div>

        </div>

        {/* Bottom Left Character Illustration (From Screenshot) */}
        <div className="absolute bottom-3 left-4 sm:left-6 z-10 pointer-events-none opacity-85 hidden sm:block">
          <svg className="w-20 sm:w-24 h-auto" viewBox="0 0 100 100" fill="none">
            {/* Person with backpack holding heart balloons */}
            <circle cx="40" cy="35" r="10" fill="#292524" />
            <path d="M30 48 Q40 45 50 48 L46 80 L34 80 Z" fill="#1E293B" />
            {/* Backpack */}
            <rect x="23" y="48" width="10" height="18" rx="4" fill="#334155" />
            {/* Balloon Strings & Hearts */}
            <path d="M48 55 Q60 50 70 30" stroke="#E2E8F0" strokeWidth="1.5" />
            <path d="M48 55 Q65 60 75 45" stroke="#E2E8F0" strokeWidth="1.5" />
            <path d="M48 55 Q55 65 65 60" stroke="#E2E8F0" strokeWidth="1.5" />
            <circle cx="70" cy="28" r="8" fill="#EF4444" />
            <circle cx="75" cy="43" r="7" fill="#EF4444" />
            <circle cx="65" cy="58" r="6" fill="#EF4444" />
          </svg>
        </div>

      </div>

    </div>
  );
};
