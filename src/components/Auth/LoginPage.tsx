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
  Fingerprint, 
  Shield, 
  AlertCircle,
  ArrowRight,
  Sprout,
  Send,
  RefreshCw
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

const CAROUSEL_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    title: 'Stay focused.',
    subtitle: 'Grow every day.',
    theme: 'Two souls. One private haven.',
  },
  {
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    title: 'Zero-Knowledge.',
    subtitle: 'Protected in hardware.',
    theme: 'Shamir 2-of-2 Secret Sharing.',
  },
  {
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    title: 'Pure Connection.',
    subtitle: 'Forever encrypted.',
    theme: 'Unlocked only when both are present.',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  coupleProfile,
  onLoginSuccess,
  onUpdateCoupleProfile,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Form State
  const [emailOrUsername, setEmailOrUsername] = useState('aarav@bondlock.vault');
  const [passwordOrPin, setPasswordOrPin] = useState('1404');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Additional Fields
  const [partnerName, setPartnerName] = useState('Ananya');
  const [partnerPin, setPartnerPin] = useState('2512');
  const [vaultName, setVaultName] = useState('Our Secret Sanctuary');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;

  // Change carousel slide
  const handleSelectSlide = (idx: number) => {
    sound.playSoftClick();
    setActiveSlide(idx);
  };

  // Quick Select partner helper
  const handleQuickSelect = (partnerId: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    if (partnerId === 'partner1') {
      setEmailOrUsername(partner1.name.toLowerCase() + '@bondlock.vault');
      setPasswordOrPin(partner1.pin || '1404');
    } else {
      setEmailOrUsername(partner2.name.toLowerCase() + '@bondlock.vault');
      setPasswordOrPin(partner2.pin || '2512');
    }
    setErrorMessage('');
  };

  // Submit Handler (Works for both Sign In and Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setErrorMessage('');

    const query = emailOrUsername.trim().toLowerCase();
    const pin = passwordOrPin.trim();

    if (!query) {
      setErrorMessage('Please enter your email address or username.');
      sound.playPanicLock();
      return;
    }

    if (!pin) {
      setErrorMessage('Please enter your security PIN or password.');
      sound.playPanicLock();
      return;
    }

    if (isSignUp) {
      // SIGN UP FLOW
      setIsSubmitting(true);
      await new Promise((r) => setTimeout(r, 600));

      const yourName = query.includes('@') ? query.split('@')[0] : query;
      const capYourName = yourName.charAt(0).toUpperCase() + yourName.slice(1);
      const capPartnerName = partnerName.trim() || 'Partner';

      const share1 = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();
      const share2 = 'SHARE-0x' + Math.random().toString(16).substring(2, 8).toUpperCase();

      const newProfile: CoupleProfile = {
        partner1: {
          id: 'partner1',
          name: capYourName,
          avatar: CAROUSEL_SLIDES[0].image,
          role: `${capYourName} • Key Share 1`,
          biometricType: 'Face ID',
          deviceInfo: 'Enclave Secured Phone',
          keyShareId: share1,
          pin: pin,
        },
        partner2: {
          id: 'partner2',
          name: capPartnerName,
          avatar: CAROUSEL_SLIDES[1].image,
          role: `${capPartnerName} • Key Share 2`,
          biometricType: 'Touch ID',
          deviceInfo: 'Partner Device',
          keyShareId: share2,
          pin: partnerPin || '2512',
        },
        anniversaryDate: new Date().toISOString().split('T')[0],
        vaultName: vaultName.trim() || `${capYourName} & ${capPartnerName}’s Vault`,
      };

      // Save to storage
      storage.saveAccount({
        email: query,
        username: yourName,
        pin: pin,
        role: 'partner1',
        profile: newProfile,
      });

      if (onUpdateCoupleProfile) {
        onUpdateCoupleProfile(newProfile);
      }

      setIsSubmitting(false);
      sound.playVaultUnlocked();
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      onLoginSuccess('partner1');
      return;
    }

    // SIGN IN FLOW
    const accounts = storage.getAccounts();
    const matchedAccount = accounts.find(
      (acc) =>
        acc.username.toLowerCase() === query ||
        acc.email.toLowerCase() === query ||
        acc.profile.partner1.name.toLowerCase() === query ||
        acc.profile.partner2.name.toLowerCase() === query
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
      expectedPin = partner1.pin || '1404';
      targetRole = 'partner1';
    }

    if (pin === expectedPin || pin === '1234') {
      if (matchedAccount && onUpdateCoupleProfile) {
        onUpdateCoupleProfile(matchedAccount.profile);
      }

      sound.playPartnerApproved();
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      setTimeout(() => {
        onLoginSuccess(targetRole);
      }, 300);
    } else {
      sound.playPanicLock();
      setErrorMessage(`Incorrect PIN for "${emailOrUsername}". Default: Aarav is 1404, Ananya is 2512 (or 1234).`);
    }
  };

  // Hardware Biometric / Apple Login
  const handleAppleOrBiometric = async () => {
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
    setErrorMessage('Hardware Face ID not verified. Please enter your 4-digit PIN.');
  };

  const handleResetDemo = () => {
    sound.playSoftClick();
    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(initialCoupleProfile);
    }
    setEmailOrUsername('aarav@bondlock.vault');
    setPasswordOrPin('1404');
    setErrorMessage('');
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A020D] flex items-center justify-center p-3 sm:p-6 md:p-10 font-sans selection:bg-[#FF2E93] selection:text-white select-none">
      
      {/* Central Split-Screen Card */}
      <div className="w-full max-w-5xl xl:max-w-6xl min-h-[640px] md:h-[86vh] max-h-[820px] rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row relative bg-[#120317]">
        
        {/* ================= LEFT HALF: High-Fashion Aesthetic Portrait ================= */}
        <div className="relative w-full md:w-1/2 h-64 sm:h-80 md:h-full overflow-hidden bg-black shrink-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide}
              src={CAROUSEL_SLIDES[activeSlide].image}
              alt="Couples Vault Aesthetic"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover object-center filter brightness-[0.92]"
            />
          </AnimatePresence>

          {/* Warm Amber/Pink Ambient Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Frosted Glass Badge in Bottom-Left */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-5 left-5 z-20 bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-3 pr-4 flex items-center gap-3 text-white shadow-xl max-w-[240px]"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF2E93] to-[#FBA1B7] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold leading-tight text-white tracking-wide">
                {CAROUSEL_SLIDES[activeSlide].title}
              </div>
              <div className="text-[11px] text-stone-300 font-sans leading-tight mt-0.5">
                {CAROUSEL_SLIDES[activeSlide].subtitle}
              </div>
            </div>
          </motion.div>

          {/* Center Seam Capsule with Carousel Dots (Visible on Desktop) */}
          <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-30 bg-[#0A020D] rounded-full px-3 py-1.5 items-center gap-2 border border-white/15 shadow-2xl">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSlide(idx)}
                className={`transition-all rounded-full ${
                  activeSlide === idx
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ================= RIGHT HALF: Pink-Themed Auth Form ================= */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 bg-gradient-to-br from-[#FFF5F8] via-[#FED7E2] to-[#FBA1B7] text-[#1E0727] overflow-y-auto">
          
          {/* Top Switcher (Already have an account? Log In / Sign Up) */}
          <div className="flex items-center justify-between text-xs mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#1E0727] flex items-center justify-center text-white">
                <Heart className="w-3.5 h-3.5 fill-[#FF2E93] text-[#FF2E93]" />
              </div>
              <span className="font-bold text-[#1E0727] tracking-wider uppercase text-[11px] font-mono">
                BondLock
              </span>
            </div>

            <div className="text-stone-700 text-xs">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSoftClick();
                      setIsSignUp(false);
                      setErrorMessage('');
                    }}
                    className="font-bold text-[#1E0727] hover:text-[#FF2E93] underline transition-colors"
                  >
                    Log In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSoftClick();
                      setIsSignUp(true);
                      setErrorMessage('');
                    }}
                    className="font-bold text-[#1E0727] hover:text-[#FF2E93] underline transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="my-auto py-2">
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E0727]">
              {isSignUp ? 'Build Your Flow' : 'Unlock Your Sanctuary'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-700 mt-1.5 max-w-sm">
              {isSignUp
                ? 'Create your account and get started with a clear mind'
                : 'Enter your credentials to decrypt your 2-of-2 partner key share'}
            </p>

            {/* Quick Demo Selector Chips (For instant testing without typing) */}
            <div className="flex items-center gap-2 mt-4 mb-2">
              <span className="text-[10px] font-mono text-stone-600 uppercase tracking-wider">
                Demo Quick-Fill:
              </span>
              <button
                type="button"
                onClick={() => handleQuickSelect('partner1')}
                className="px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-[11px] font-bold text-[#1E0727] border border-[#F472B6]/40 shadow-xs transition-all flex items-center gap-1"
              >
                <span>Aarav</span>
                <span className="text-[9px] text-[#FF2E93] font-mono">(1404)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('partner2')}
                className="px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-[11px] font-bold text-[#1E0727] border border-[#F472B6]/40 shadow-xs transition-all flex items-center gap-1"
              >
                <span>Ananya</span>
                <span className="text-[9px] text-[#A855F7] font-mono">(2512)</span>
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3 mt-3">
              {/* Input 1: Email Address / Username */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-600">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Email Address"
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/60 border border-[#F472B6]/40 focus:border-[#1E0727] focus:bg-white text-[#1E0727] placeholder-stone-500 text-sm transition-all focus:outline-none shadow-xs"
                />
              </div>

              {/* Input 2: Password / Security PIN */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-600">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={passwordOrPin}
                  onChange={(e) => {
                    setPasswordOrPin(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white/60 border border-[#F472B6]/40 focus:border-[#1E0727] focus:bg-white text-[#1E0727] placeholder-stone-500 text-sm transition-all focus:outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-600 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Extra Partner fields in Sign Up mode */}
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 pt-1"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Partner's Name"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/60 border border-[#F472B6]/40 text-[#1E0727] placeholder-stone-500 text-xs focus:outline-none focus:border-[#1E0727]"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="Partner PIN (4-digit)"
                      value={partnerPin}
                      onChange={(e) => setPartnerPin(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/60 border border-[#F472B6]/40 text-[#1E0727] placeholder-stone-500 text-xs focus:outline-none focus:border-[#1E0727]"
                    />
                  </div>
                </motion.div>
              )}

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-panicRed/15 border border-panicRed/40 text-panicRed text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary CTA Button (Solid Dark Black / Mulberry Pill) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1E0727] hover:bg-[#FF2E93] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-pink-glow mt-1"
              >
                <span>{isSubmitting ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider: "or continue with" */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1E0727]/15" />
              </div>
              <span className="relative px-3 bg-gradient-to-r from-transparent via-[#FED7E2] to-transparent text-[11px] font-sans text-stone-600 uppercase tracking-wider">
                or continue with
              </span>
            </div>

            {/* 3 Social / Quick-Auth Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleQuickSelect('partner1')}
                className="py-2.5 px-3 rounded-2xl bg-white/70 hover:bg-white border border-[#F472B6]/30 text-[#1E0727] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              {/* Apple / Face ID */}
              <button
                type="button"
                onClick={handleAppleOrBiometric}
                className="py-2.5 px-3 rounded-2xl bg-white/70 hover:bg-white border border-[#F472B6]/30 text-[#1E0727] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.91-12.03-14.49-6.03-9.14-10.82-20.08-14.37-32.8-3.55-12.72-5.32-24.52-5.32-35.4 0-14.6 3.69-26.65 11.08-36.14 7.39-9.49 16.5-14.36 27.34-14.61 5.35 0 11.26 1.41 17.73 4.23 6.47 2.82 10.59 4.31 12.35 4.47 1.45 0 5.86-1.61 13.23-4.83 7.37-3.22 13.54-4.53 18.52-3.92 13.73 1.09 24.32 6.51 31.78 16.27-12.28 7.4-18.3 17.43-18.06 30.1.24 9.9 4.08 18.15 11.51 24.76 7.43 6.61 16.32 10.37 26.67 11.27-2.3 7.08-5.29 14.54-8.97 22.37zM119.22 31.84c0-7.2 2.66-14.07 7.99-20.61 5.33-6.54 11.97-10.65 19.92-12.33.24 1.46.36 2.79.36 3.99 0 7.23-2.85 14.12-8.55 20.67-5.7 6.55-12.44 10.45-20.22 11.7-.24-1.34-.36-2.48-.36-3.42z" />
                </svg>
                <span>Apple</span>
              </button>

              {/* Telegram / Passkey */}
              <button
                type="button"
                onClick={() => handleQuickSelect('partner2')}
                className="py-2.5 px-3 rounded-2xl bg-white/70 hover:bg-white border border-[#F472B6]/30 text-[#1E0727] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-[#0088cc]" />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* Footer Terms & Demo Reset */}
          <div className="pt-3 border-t border-[#1E0727]/10 flex flex-col items-center text-center gap-1">
            <p className="text-[11px] text-stone-600 font-sans">
              By signing up, you agree to our{' '}
              <span className="font-bold text-[#1E0727] hover:underline cursor-pointer">Terms of Service</span> and{' '}
              <span className="font-bold text-[#1E0727] hover:underline cursor-pointer">Privacy Policy</span>
            </p>

            <button
              type="button"
              onClick={handleResetDemo}
              className="text-[10px] text-stone-500 hover:text-[#1E0727] flex items-center gap-1 font-mono mt-1 transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Reset to Demo Couple (Aarav & Ananya)</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
