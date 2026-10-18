import React, { useState, useRef } from 'react';
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
  Camera, 
  Upload, 
  Check, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight,
  AlertCircle
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

// Preset Aesthetic Avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
];

export const LoginPage: React.FC<LoginPageProps> = ({
  coupleProfile,
  onLoginSuccess,
  onUpdateCoupleProfile,
}) => {
  // Navigation: 'showcase' | 'login' | 'signup'
  const [currentScreen, setCurrentScreen] = useState<'showcase' | 'login' | 'signup'>('login');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('jaedoe75@gmail.com');
  const [loginPassword, setLoginPassword] = useState('1404');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRememberMe, setLoginRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Sign Up Form State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpYourName, setSignUpYourName] = useState('');
  const [signUpPartnerName, setSignUpPartnerName] = useState('');
  const [signUpPartnerPin, setSignUpPartnerPin] = useState('');
  const [signUpRememberMe, setSignUpRememberMe] = useState(true);
  const [signUpError, setSignUpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Photo Upload State (Partner 1 & Partner 2)
  const [myProfilePhoto, setMyProfilePhoto] = useState<string>(PRESET_AVATARS[0]);
  const [partnerProfilePhoto, setPartnerProfilePhoto] = useState<string>(PRESET_AVATARS[1]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const partnerFileInputRef = useRef<HTMLInputElement>(null);

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'me' | 'partner') => {
    const file = e.target.files?.[0];
    if (file) {
      sound.playSoftClick();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (target === 'me') {
            setMyProfilePhoto(reader.result);
          } else {
            setPartnerProfilePhoto(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick 1-Tap Partner Autofill in Sign In
  const handleQuickSelect = (role: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    if (role === 'partner1') {
      setLoginEmail('aarav@bondlock.vault');
      setLoginPassword(partner1.pin || '1404');
    } else {
      setLoginEmail('ananya@bondlock.vault');
      setLoginPassword(partner2.pin || '2512');
    }
    setLoginError('');
  };

  // Sign In Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setLoginError('');

    const query = loginEmail.trim().toLowerCase();
    const pin = loginPassword.trim();

    if (!query) {
      setLoginError('Please enter your email or username.');
      sound.playPanicLock();
      return;
    }

    if (!pin) {
      setLoginError('Please enter your 4-digit security PIN or password.');
      sound.playPanicLock();
      return;
    }

    // Match accounts
    const accounts = storage.getAccounts();
    const matched = accounts.find(
      (a) =>
        a.username.toLowerCase() === query ||
        a.email.toLowerCase() === query ||
        a.profile.partner1.name.toLowerCase() === query ||
        a.profile.partner2.name.toLowerCase() === query
    );

    const isP1 =
      query.includes('aarav') ||
      query.includes('jaedoe') ||
      query === partner1.name.toLowerCase() ||
      query === 'partner1' ||
      (matched && matched.role === 'partner1');

    const isP2 =
      query.includes('ananya') ||
      query === partner2.name.toLowerCase() ||
      query === 'partner2' ||
      (matched && matched.role === 'partner2');

    let expectedPin = '';
    let targetRole: 'partner1' | 'partner2' = 'partner1';

    if (isP1) {
      expectedPin = partner1.pin || '1404';
      targetRole = 'partner1';
    } else if (isP2) {
      expectedPin = partner2.pin || '2512';
      targetRole = 'partner2';
    } else if (matched) {
      expectedPin = matched.pin;
      targetRole = matched.role;
    } else {
      expectedPin = partner1.pin || '1404';
      targetRole = 'partner1';
    }

    // Forgiving match: expected PIN, demo 1234, 1404, or 2512
    if (pin === expectedPin || pin === '1234' || pin === '1404' || pin === '2512') {
      if (matched && onUpdateCoupleProfile) {
        onUpdateCoupleProfile(matchedAccountProfile(matched.profile));
      }

      sound.playPartnerApproved();
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}

      setTimeout(() => {
        onLoginSuccess(targetRole);
      }, 250);
    } else {
      sound.playPanicLock();
      setLoginError('Incorrect PIN. (Default: Aarav is 1404, Ananya is 2512, or demo 1234)');
    }
  };

  const matchedAccountProfile = (profile: CoupleProfile) => profile;

  // Sign Up Submit with Custom Profile Photo
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setSignUpError('');

    const yourName = signUpYourName.trim() || (signUpEmail.includes('@') ? signUpEmail.split('@')[0] : signUpEmail.trim()) || 'Partner A';
    const partnerName = signUpPartnerName.trim() || 'Partner B';
    const yourPin = signUpPassword.trim();
    const partnerPin = signUpPartnerPin.trim() || '2512';

    if (!yourPin || yourPin.length !== 4) {
      setSignUpError('Your security PIN must be exactly 4 digits.');
      sound.playPanicLock();
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const share1 = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();
    const share2 = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();

    // Construct profile using the user's uploaded / chosen profile photos!
    const newProfile: CoupleProfile = {
      partner1: {
        id: 'partner1',
        name: yourName,
        avatar: myProfilePhoto,
        role: `${yourName} • Key Share 1`,
        biometricType: 'Face ID',
        deviceInfo: 'Enclave Secured Phone',
        keyShareId: share1,
        pin: yourPin,
      },
      partner2: {
        id: 'partner2',
        name: partnerName,
        avatar: partnerProfilePhoto,
        role: `${partnerName} • Key Share 2`,
        biometricType: 'Touch ID',
        deviceInfo: 'Partner Paired Device',
        keyShareId: share2,
        pin: partnerPin,
      },
      anniversaryDate: new Date().toISOString().split('T')[0],
      vaultName: `${yourName} & ${partnerName}’s Sanctuary`,
    };

    storage.saveCoupleProfile(newProfile);
    storage.saveAccount({
      email: signUpEmail.trim() || `${yourName.toLowerCase()}@bondlock.vault`,
      username: yourName.toLowerCase(),
      pin: yourPin,
      role: 'partner1',
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

    // Automatically log in as Partner 1 (creator)
    onLoginSuccess('partner1');
  };

  // Biometric / Apple Login
  const handleAppleLogin = async () => {
    sound.playBiometricScan();
    const isAvail = await isPlatformAuthenticatorAvailable();
    if (isAvail) {
      const auth = await verifyPasskey('partner1');
      if (auth.success) {
        sound.playVaultUnlocked();
        onLoginSuccess('partner1');
        return;
      }
    }
    setLoginError('Biometric passkey unavailable. Please use PIN.');
  };

  const handleResetToDemo = () => {
    sound.playSoftClick();
    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(initialCoupleProfile);
    }
    setLoginEmail('aarav@bondlock.vault');
    setLoginPassword('1404');
    setMyProfilePhoto(PRESET_AVATARS[0]);
    setPartnerProfilePhoto(PRESET_AVATARS[1]);
    setLoginError('');
    setCurrentScreen('login');
  };

  return (
    <div className="min-h-screen w-full bg-[#1A0314] flex items-center justify-center p-0 sm:p-4 md:p-6 font-sans selection:bg-[#FF2E93] selection:text-white select-none">
      
      {/* Mobile Device Frame Container (Exact Match to Reference Screenshot) */}
      <div className="relative w-full max-w-[410px] h-[100dvh] sm:h-[840px] bg-gradient-to-b from-[#8B1A54] via-[#650E3B] to-[#3B0722] sm:rounded-[44px] shadow-2xl sm:border-[8px] sm:border-white/10 overflow-hidden flex flex-col justify-between text-white">
        
        {/* Ambient Floating Hearts Background Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
          <Heart className="w-16 h-16 fill-white absolute top-6 left-8 rotate-12" />
          <Heart className="w-12 h-12 fill-white absolute top-28 right-10 -rotate-12" />
          <Heart className="w-20 h-20 fill-white absolute top-48 left-16 rotate-45" />
          <Heart className="w-14 h-14 fill-white absolute top-72 right-12 -rotate-6" />
          <Heart className="w-24 h-24 fill-white absolute bottom-36 left-8 rotate-12" />
          <Heart className="w-16 h-16 fill-white absolute bottom-12 right-16 -rotate-12" />
        </div>

        {/* Top iOS Status Bar (11:30 | Signal, WiFi, Battery) */}
        <div className="relative z-20 flex items-center justify-between px-7 pt-4 pb-1 text-xs font-semibold text-white/90 shrink-0">
          <span>11:30</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-mono">5G</span>
            <div className="w-5 h-2.5 rounded-xs border border-white/80 p-0.5 flex items-center">
              <div className="w-full h-full bg-white rounded-2xs" />
            </div>
          </div>
        </div>

        {/* ================= SCREEN CONTENT AREA ================= */}
        <div className="relative z-10 flex-1 flex flex-col justify-between overflow-y-auto px-5 sm:px-6 pt-2 pb-5 scrollbar-none">
          <AnimatePresence mode="wait">

            {/* ----------------- SCREEN 1: SHOWCASE INTRO ----------------- */}
            {currentScreen === 'showcase' && (
              <motion.div
                key="showcase"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col justify-between py-4"
              >
                {/* Two Tilted Romantic Couple Cards with Heart Joining Them (From Screenshot) */}
                <div className="my-auto relative flex items-center justify-center pt-8 pb-4">
                  {/* Left Tilted Photo (Woman) */}
                  <motion.div
                    animate={{ rotate: [-6, -4, -6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-36 h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transform -rotate-6 -mr-4 z-10"
                  >
                    <img
                      src={partner1.avatar}
                      alt="Partner 1"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Center Floating Romantic Heart Connector */}
                  <div className="relative z-30 w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF2E93] to-[#EC4899] border-2 border-white flex items-center justify-center shadow-lg -mx-2">
                    <Heart className="w-6 h-6 fill-white text-white drop-shadow-sm" />
                  </div>

                  {/* Right Tilted Photo (Man) */}
                  <motion.div
                    animate={{ rotate: [6, 4, 6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-36 h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transform rotate-6 -ml-4 z-10"
                  >
                    <img
                      src={partner2.avatar}
                      alt="Partner 2"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                {/* Bottom Headline & Description */}
                <div className="pt-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    Where Matches Turn into{' '}
                    <span className="text-[#FF2E93] underline decoration-[#FF2E93] decoration-wavy">
                      Moments
                    </span>
                  </h2>
                  <p className="text-xs text-white/70 font-sans mt-2 leading-relaxed">
                    Discover meaningful connections that go beyond swipes. Chat, laugh, and lock your sacred memories together.
                  </p>

                  <button
                    onClick={() => {
                      sound.playSoftClick();
                      setCurrentScreen('login');
                    }}
                    className="w-full mt-6 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D946EF] via-[#EC4899] to-[#8B5CF6] text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-pink-glow transition-all flex items-center justify-center gap-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ----------------- SCREEN 2: LOGIN / WELCOME BACK ----------------- */}
            {currentScreen === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col justify-between"
              >
                {/* Top Glowing Heart Emblem with Couple Silhouette (From Screenshot) */}
                <div className="flex flex-col items-center text-center pt-2">
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
                    {/* Pulsing Back Halo */}
                    <div className="absolute inset-0 bg-[#FF2E93]/30 rounded-full blur-md animate-pulse" />
                    
                    {/* Center Layered Romantic Heart Emblem */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#FF2E93] via-[#E11D74] to-[#F472B6] border-2 border-white/40 flex items-center justify-center shadow-lg p-3">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-white drop-shadow-sm">
                        <path d="M50 88 Q10 55 10 30 A20 20 0 0 1 50 20 A20 20 0 0 1 90 30 Q90 55 50 88 Z" />
                        {/* Silhouette of lovers facing each other inside heart */}
                        <circle cx="43" cy="40" r="5" fill="#8B1A54" />
                        <circle cx="57" cy="40" r="5" fill="#8B1A54" />
                        <path d="M38 55 Q43 48 48 55 Z" fill="#8B1A54" />
                        <path d="M52 55 Q57 48 62 55 Z" fill="#8B1A54" />
                      </svg>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Welcome back !
                  </h1>
                  <p className="text-xs text-white/70 font-sans mt-0.5">
                    Login to continue.!!!
                  </p>
                </div>

                {/* Frosted Glass Auth Card (From Screenshot) */}
                <div className="my-auto py-2">
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    
                    {/* Quick 1-Tap Partner Chips */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickSelect('partner1')}
                        className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          loginEmail.includes('aarav') || loginEmail.includes('jaedoe')
                            ? 'bg-[#FF2E93]/30 border-[#FF2E93] text-white shadow-xs'
                            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/15'
                        }`}
                      >
                        <img src={partner1.avatar} alt="Aarav" className="w-4 h-4 rounded-full object-cover" />
                        <span>Aarav</span>
                        <span className="text-[10px] text-pink-300 font-mono">(1404)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickSelect('partner2')}
                        className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          loginEmail.includes('ananya')
                            ? 'bg-[#FF2E93]/30 border-[#FF2E93] text-white shadow-xs'
                            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/15'
                        }`}
                      >
                        <img src={partner2.avatar} alt="Ananya" className="w-4 h-4 rounded-full object-cover" />
                        <span>Ananya</span>
                        <span className="text-[10px] text-pink-300 font-mono">(2512)</span>
                      </button>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="text-xs text-white/80 font-medium block mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="jaedoe75@gmail.com"
                          value={loginEmail}
                          onChange={(e) => {
                            setLoginEmail(e.target.value);
                            setLoginError('');
                          }}
                          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/15 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FF2E93] focus:bg-white/25 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="text-xs text-white/80 font-medium block mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          placeholder="••••"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginError('');
                          }}
                          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/15 border border-white/20 text-white placeholder-white/40 font-mono text-xs focus:outline-none focus:border-[#FF2E93] focus:bg-white/25 transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forget Password Row (From Screenshot) */}
                    <div className="flex items-center justify-between text-xs text-white/80 pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={loginRememberMe}
                          onChange={(e) => setLoginRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-[#FF2E93]"
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => alert('Demo PINs: 1404 (Aarav), 2512 (Ananya), or 1234')}
                        className="hover:text-pink-300 transition-colors"
                      >
                        Forget password?
                      </button>
                    </div>

                    {/* Error Banner */}
                    {loginError && (
                      <div className="p-2.5 rounded-xl bg-panicRed/20 border border-panicRed/50 text-white text-xs font-mono flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    {/* Gradient CTA Button (From Screenshot) */}
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D946EF] via-[#EC4899] to-[#8B5CF6] text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-pink-glow transition-all active:scale-[0.99] mt-2"
                    >
                      Login
                    </button>
                  </form>

                  {/* Divider: "Or Sign up With" */}
                  <div className="relative my-4 text-center">
                    <span className="text-xs text-white/60 font-sans">
                      Or Sign up With
                    </span>
                  </div>

                  {/* 3 Social / Quick-Auth Circle Buttons (From Screenshot) */}
                  <div className="flex items-center justify-center gap-4">
                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('partner1')}
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all shadow-sm"
                      title="Quick Login as Partner 1"
                    >
                      <span className="font-bold text-sm">f</span>
                    </button>

                    {/* Google */}
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('partner1')}
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all shadow-sm"
                      title="Google Login"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </button>

                    {/* Apple / Face ID */}
                    <button
                      type="button"
                      onClick={handleAppleLogin}
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-all shadow-sm"
                      title="Face ID / Apple Passkey"
                    >
                      <svg className="w-4 h-4 fill-white" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.91-12.03-14.49-6.03-9.14-10.82-20.08-14.37-32.8-3.55-12.72-5.32-24.52-5.32-35.4 0-14.6 3.69-26.65 11.08-36.14 7.39-9.49 16.5-14.36 27.34-14.61 5.35 0 11.26 1.41 17.73 4.23 6.47 2.82 10.59 4.31 12.35 4.47 1.45 0 5.86-1.61 13.23-4.83 7.37-3.22 13.54-4.53 18.52-3.92 13.73 1.09 24.32 6.51 31.78 16.27-12.28 7.4-18.3 17.43-18.06 30.1.24 9.9 4.08 18.15 11.51 24.76 7.43 6.61 16.32 10.37 26.67 11.27-2.3 7.08-5.29 14.54-8.97 22.37zM119.22 31.84c0-7.2 2.66-14.07 7.99-20.61 5.33-6.54 11.97-10.65 19.92-12.33.24 1.46.36 2.79.36 3.99 0 7.23-2.85 14.12-8.55 20.67-5.7 6.55-12.44 10.45-20.22 11.7-.24-1.34-.36-2.48-.36-3.42z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bottom Toggle Link */}
                <div className="pt-2 text-center text-xs text-white/70">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSoftClick();
                      setCurrentScreen('signup');
                    }}
                    className="font-bold text-white hover:text-pink-300 underline"
                  >
                    Create an account
                  </button>
                </div>
              </motion.div>
            )}

            {/* ----------------- SCREEN 3: CREATE AN ACCOUNT (WITH PROFILE PHOTO UPLOAD) ----------------- */}
            {currentScreen === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col justify-between"
              >
                {/* Header (From Screenshot) */}
                <div className="flex flex-col items-center text-center pt-1">
                  {/* Glowing Couple Heart Emblem */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#FF2E93] via-[#E11D74] to-[#F472B6] border-2 border-white/40 flex items-center justify-center shadow-lg p-2.5 mb-1.5">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-white drop-shadow-sm">
                      <path d="M50 88 Q10 55 10 30 A20 20 0 0 1 50 20 A20 20 0 0 1 90 30 Q90 55 50 88 Z" />
                      <circle cx="43" cy="40" r="5" fill="#8B1A54" />
                      <circle cx="57" cy="40" r="5" fill="#8B1A54" />
                      <path d="M38 55 Q43 48 48 55 Z" fill="#8B1A54" />
                      <path d="M52 55 Q57 48 62 55 Z" fill="#8B1A54" />
                    </svg>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Create an account
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSoftClick();
                      setCurrentScreen('login');
                    }}
                    className="text-xs text-white/70 hover:text-white underline mt-0.5"
                  >
                    Already have an account
                  </button>
                </div>

                {/* Sign Up Form + PROFILE PHOTO SET OPTION */}
                <div className="my-auto py-1">
                  <form onSubmit={handleSignUpSubmit} className="space-y-2.5">
                    
                    {/* ====== PROFILE PHOTO UPLOADER (User's specific request) ====== */}
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center text-center">
                      <span className="text-[10px] text-pink-300 font-mono uppercase tracking-wider block mb-1.5 font-bold">
                        Set Your Profile Photo
                      </span>

                      <div className="relative group cursor-pointer mb-2" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#FF2E93] via-[#E11D74] to-[#A855F7] shadow-pink-glow">
                          <img
                            src={myProfilePhoto}
                            alt="Profile Avatar"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#FF2E93] border-2 border-white flex items-center justify-center text-white shadow-sm">
                          <Camera className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      {/* Hidden File Input for Device Image Upload */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, 'me')}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-white hover:text-pink-300 font-semibold underline flex items-center gap-1 mb-2"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload photo from phone</span>
                      </button>

                      {/* Preset Avatars Fast Selector */}
                      <div className="flex items-center gap-1.5">
                        {PRESET_AVATARS.map((avatarUrl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              sound.playSoftClick();
                              setMyProfilePhoto(avatarUrl);
                            }}
                            className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                              myProfilePhoto === avatarUrl
                                ? 'border-[#FF2E93] scale-110 shadow-pink-glow'
                                : 'border-white/30 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={avatarUrl} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="text-[11px] text-white/80 font-medium block mb-1">
                        Email
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="jaedoe75@gmail.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white/15 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FF2E93]"
                      />
                    </div>

                    {/* Password / PIN Input */}
                    <div>
                      <label className="text-[11px] text-white/80 font-medium block mb-1">
                        Password (4-digit PIN)
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        placeholder="•••• (e.g. 1404)"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white/15 border border-white/20 text-white placeholder-white/40 font-mono text-xs focus:outline-none focus:border-[#FF2E93]"
                      />
                    </div>

                    {/* Partner Name & PIN Inputs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/80 font-medium block mb-1">
                          Partner's Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ananya"
                          value={signUpPartnerName}
                          onChange={(e) => setSignUpPartnerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/15 border border-white/20 text-white text-xs focus:outline-none focus:border-[#FF2E93]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/80 font-medium block mb-1">
                          Partner's PIN
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="2512"
                          value={signUpPartnerPin}
                          onChange={(e) => setSignUpPartnerPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-xl bg-white/15 border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-[#FF2E93]"
                        />
                      </div>
                    </div>

                    {/* Remember me Checkbox (From Screenshot) */}
                    <div className="flex items-center text-xs text-white/80 pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signUpRememberMe}
                          onChange={(e) => setSignUpRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-[#FF2E93]"
                        />
                        <span>Remember me</span>
                      </label>
                    </div>

                    {/* Error message */}
                    {signUpError && (
                      <p className="text-[11px] text-red-300 font-sans text-center">
                        {signUpError}
                      </p>
                    )}

                    {/* Sign Up Button (From Screenshot) */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D946EF] via-[#EC4899] to-[#8B5CF6] text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-pink-glow transition-all active:scale-[0.99] mt-1"
                    >
                      {isSubmitting ? 'Creating Vault...' : 'Sign Up'}
                    </button>
                  </form>

                  {/* Divider: "Or Sign in With" */}
                  <div className="relative my-3 text-center">
                    <span className="text-[11px] text-white/60 font-sans">
                      Or Sign in With
                    </span>
                  </div>

                  {/* Social Circles */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('partner1')}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white"
                    >
                      <span className="font-bold text-xs">f</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSelect('partner1')}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleAppleLogin}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white"
                    >
                      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.91-12.03-14.49-6.03-9.14-10.82-20.08-14.37-32.8-3.55-12.72-5.32-24.52-5.32-35.4 0-14.6 3.69-26.65 11.08-36.14 7.39-9.49 16.5-14.36 27.34-14.61 5.35 0 11.26 1.41 17.73 4.23 6.47 2.82 10.59 4.31 12.35 4.47 1.45 0 5.86-1.61 13.23-4.83 7.37-3.22 13.54-4.53 18.52-3.92 13.73 1.09 24.32 6.51 31.78 16.27-12.28 7.4-18.3 17.43-18.06 30.1.24 9.9 4.08 18.15 11.51 24.76 7.43 6.61 16.32 10.37 26.67 11.27-2.3 7.08-5.29 14.54-8.97 22.37zM119.22 31.84c0-7.2 2.66-14.07 7.99-20.61 5.33-6.54 11.97-10.65 19.92-12.33.24 1.46.36 2.79.36 3.99 0 7.23-2.85 14.12-8.55 20.67-5.7 6.55-12.44 10.45-20.22 11.7-.24-1.34-.36-2.48-.36-3.42z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bottom Link back to Login */}
                <div className="pt-2 text-center text-xs text-white/70">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSoftClick();
                      setCurrentScreen('login');
                    }}
                    className="font-bold text-white hover:text-pink-300 underline"
                  >
                    Login here
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Navigation Bar (To switch between Showcase, Login, Sign Up & Reset Demo) */}
        <div className="relative z-20 px-6 py-2.5 bg-black/30 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playSoftClick();
                setCurrentScreen('showcase');
              }}
              className={`hover:text-white transition-colors ${currentScreen === 'showcase' ? 'text-pink-300 font-bold' : ''}`}
            >
              Showcase
            </button>
            <span>•</span>
            <button
              onClick={() => {
                sound.playSoftClick();
                setCurrentScreen('login');
              }}
              className={`hover:text-white transition-colors ${currentScreen === 'login' ? 'text-pink-300 font-bold' : ''}`}
            >
              Login
            </button>
            <span>•</span>
            <button
              onClick={() => {
                sound.playSoftClick();
                setCurrentScreen('signup');
              }}
              className={`hover:text-white transition-colors ${currentScreen === 'signup' ? 'text-pink-300 font-bold' : ''}`}
            >
              Sign Up
            </button>
          </div>

          <button
            onClick={handleResetToDemo}
            className="hover:text-white flex items-center gap-1 font-mono transition-colors"
            title="Reset to default Aarav & Ananya demo"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Reset Demo</span>
          </button>
        </div>

      </div>

    </div>
  );
};
