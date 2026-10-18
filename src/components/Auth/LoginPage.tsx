import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Copy,
  Share2,
  Zap,
  Users
} from 'lucide-react';
import { CoupleProfile } from '../../types/vault';
import { verifyPasskey, isPlatformAuthenticatorAvailable } from '../../utils/webAuthn';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { initialCoupleProfile } from '../../data/initialMemories';

interface LoginPageProps {
  coupleProfile: CoupleProfile;
  onLoginSuccess: (partnerId: 'partner1' | 'partner2', targetRoomCode?: string) => void;
  onUpdateCoupleProfile?: (profile: CoupleProfile) => void;
  currentRoomCode?: string;
  onUpdateRoomCode?: (newCode: string) => void;
}

// 3 Background Photos matching the 3 screens in the user's reference image
const SCREEN_PHOTOS = {
  login: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=85', // Indoor romantic couple looking lovingly
  welcome: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1000&q=85', // Sunset beach romantic embrace
  signup: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85', // Smiling happy outdoor couple
};

// Preset Avatars for Profile Photo
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
  currentRoomCode = 'BOND-8821',
  onUpdateRoomCode,
}) => {
  // Screen state: 'login' | 'signup' | 'welcome'
  const [screenMode, setScreenMode] = useState<'login' | 'signup' | 'welcome'>('login');

  // Vault Connection & Role Selection (Fix for connecting two accounts to 1 vault)
  const [selectedRole, setSelectedRole] = useState<'partner1' | 'partner2'>('partner1');
  const [vaultRoomCode, setVaultRoomCode] = useState(currentRoomCode);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check URL params (?role=partner2&pair=BOND-XXXX) on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pair = params.get('pair');
      const role = params.get('role');
      if (pair) {
        setVaultRoomCode(pair.toUpperCase());
        if (onUpdateRoomCode) onUpdateRoomCode(pair.toUpperCase());
      }
      if (role === 'partner2') {
        setSelectedRole('partner2');
        setLoginEmail(coupleProfile.partner2.name.toLowerCase() + '@bondlock.vault');
        setLoginPassword(coupleProfile.partner2.pin || '2512');
      }
    } catch (e) {}
  }, [coupleProfile]);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('aarav@bondlock.vault');
  const [loginPassword, setLoginPassword] = useState('1404');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string>(PRESET_AVATARS[0]);
  const [signUpError, setSignUpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;

  // Handle Role selection
  const handleSelectRole = (role: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    setSelectedRole(role);
    if (role === 'partner1') {
      setLoginEmail(partner1.name.toLowerCase() + '@bondlock.vault');
      setLoginPassword(partner1.pin || '1404');
    } else {
      setLoginEmail(partner2.name.toLowerCase() + '@bondlock.vault');
      setLoginPassword(partner2.pin || '2512');
    }
    setLoginError('');
  };

  // Copy Partner Invite Link (Links Phone 2 directly to this vault!)
  const handleCopyInviteLink = () => {
    sound.playSoftClick();
    const url = `${window.location.origin}/?pair=${vaultRoomCode}&role=partner2`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Profile Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sound.playSoftClick();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sign In Submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setLoginError('');

    const query = loginEmail.trim().toLowerCase();
    const pin = loginPassword.trim();

    if (!pin) {
      setLoginError('Please enter your 4-digit security PIN or password.');
      sound.playPanicLock();
      return;
    }

    const expectedPin = selectedRole === 'partner1' ? (partner1.pin || '1404') : (partner2.pin || '2512');

    // Forgiving validation: accepts partner PIN or universal test PIN 1234
    if (pin === expectedPin || pin === '1234' || pin === '1404' || pin === '2512') {
      sound.playPartnerApproved();
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      if (onUpdateRoomCode) onUpdateRoomCode(vaultRoomCode);

      setTimeout(() => {
        onLoginSuccess(selectedRole, vaultRoomCode);
      }, 250);
    } else {
      sound.playPanicLock();
      setLoginError(`Incorrect password. (Default: Aarav is 1404, Ananya is 2512, or demo 1234)`);
    }
  };

  // Sign Up Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setSignUpError('');

    const name = signUpName.trim() || 'Partner A';
    const pin = signUpPassword.trim();

    if (!pin || pin.length !== 4) {
      setSignUpError('Security PIN must be exactly 4 digits.');
      sound.playPanicLock();
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    // Update couple profile with the custom uploaded profile photo and name
    const newProfile: CoupleProfile = {
      ...coupleProfile,
      partner1: {
        ...coupleProfile.partner1,
        name: name,
        avatar: profilePhoto,
        pin: pin,
        role: `${name} • Key Share 1`,
      },
      vaultName: `${name} & Partner’s Vault`,
    };

    storage.saveCoupleProfile(newProfile);
    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(newProfile);
    }

    if (onUpdateRoomCode) onUpdateRoomCode(vaultRoomCode);

    setIsSubmitting(false);
    sound.playVaultUnlocked();

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    // Automatically log in as Partner 1 (creator)
    onLoginSuccess('partner1', vaultRoomCode);
  };

  // Hardware Biometric / Face ID / Apple Passkey
  const handleBiometricAuth = async () => {
    sound.playBiometricScan();
    const isAvail = await isPlatformAuthenticatorAvailable();
    if (isAvail) {
      const auth = await verifyPasskey(selectedRole);
      if (auth.success) {
        sound.playVaultUnlocked();
        onLoginSuccess(selectedRole, vaultRoomCode);
        return;
      }
    }
    setLoginError('Biometric passkey not available. Please enter your 4-digit PIN.');
  };

  // Reset Demo
  const handleResetDemo = () => {
    sound.playSoftClick();
    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(initialCoupleProfile);
    }
    setSelectedRole('partner1');
    setVaultRoomCode('BOND-8821');
    setLoginEmail('aarav@bondlock.vault');
    setLoginPassword('1404');
    setProfilePhoto(PRESET_AVATARS[0]);
    setLoginError('');
    setScreenMode('login');
  };

  // Active top image
  const activeImage = screenMode === 'signup' 
    ? SCREEN_PHOTOS.signup 
    : screenMode === 'welcome' 
      ? SCREEN_PHOTOS.welcome 
      : SCREEN_PHOTOS.login;

  return (
    <div className="min-h-screen w-full bg-[#FAF0F5] flex items-center justify-center p-0 sm:p-4 md:p-6 font-sans selection:bg-[#FF4B72] selection:text-white select-none relative">
      
      {/* Mobile Device Frame Container (Exact Match to Reference Screenshot) */}
      <div className="relative w-full max-w-[410px] h-[100dvh] sm:h-[840px] bg-white sm:rounded-[44px] shadow-2xl sm:border-[8px] sm:border-white/80 overflow-hidden flex flex-col justify-between text-stone-900">
        
        {/* ================= TOP HALF: Full-Bleed Romantic Photo ================= */}
        <div className="relative w-full h-[46%] sm:h-[48%] overflow-hidden bg-stone-900 shrink-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={screenMode}
              src={activeImage}
              alt="Romantic Couple"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full object-cover object-center"
            />
          </AnimatePresence>

          {/* iOS Top Status Bar (9:41, Signal, Battery - From Screenshot) */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-7 pt-3.5 text-xs font-semibold text-white drop-shadow-md">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-mono">5G</span>
              <div className="w-5 h-2.5 rounded-xs border border-white p-0.5 flex items-center">
                <div className="w-full h-full bg-white rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Soft vignette at bottom of photo to blend smoothly */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>

        {/* ================= BOTTOM HALF: Crisp Pure White Curved Sheet ================= */}
        <div className="relative -mt-8 z-20 flex-1 bg-white rounded-t-[36px] sm:rounded-t-[44px] shadow-2xl px-6 pt-5 pb-4 flex flex-col justify-between overflow-y-auto scrollbar-none">
          
          {/* ================= SCREEN 1: LOG IN ================= */}
          {screenMode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* Top Segmented Tab Switcher [ Log in ] [ Sign up ] (Exact from Screenshot) */}
              <div className="w-full p-1 rounded-full bg-stone-100 flex items-center border border-stone-200/60 mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setScreenMode('login')}
                  className="flex-1 py-1.5 rounded-full text-xs font-bold bg-white text-stone-900 shadow-xs transition-all text-center"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setScreenMode('signup');
                  }}
                  className="flex-1 py-1.5 rounded-full text-xs font-medium text-stone-500 hover:text-stone-900 transition-all text-center"
                >
                  Sign up
                </button>
              </div>

              {/* Header Texts */}
              <div className="mb-2">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                  <span>Welcome Back!</span>
                  <span>👋</span>
                </h2>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Let's start with sign in
                </p>
              </div>

              {/* ====== VAULT COUPLING SECTION: Connect Two Accounts to 1 Vault ====== */}
              <div className="p-2.5 rounded-2xl bg-pink-50/70 border border-pink-200/60 mb-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                  <span className="flex items-center gap-1 text-[#FF4B72]">
                    <Users className="w-3.5 h-3.5" />
                    <span>Who is on this phone?</span>
                  </span>

                  {/* Share Invite Link button so Partner 2 connects instantly! */}
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="text-[10px] text-[#FF4B72] hover:text-[#E11D74] flex items-center gap-1 font-mono font-bold underline"
                    title="Copy invite link for Partner 2 phone"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Invite Partner'}</span>
                  </button>
                </div>

                {/* Partner 1 vs Partner 2 Selection */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('partner1')}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                      selectedRole === 'partner1'
                        ? 'bg-white border-[#FF4B72] text-[#FF4B72] shadow-xs'
                        : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                    }`}
                  >
                    <img src={partner1.avatar} alt="P1" className="w-4 h-4 rounded-full object-cover" />
                    <span>{partner1.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">(1404)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('partner2')}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                      selectedRole === 'partner2'
                        ? 'bg-white border-[#A855F7] text-[#9333EA] shadow-xs'
                        : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                    }`}
                  >
                    <img src={partner2.avatar} alt="P2" className="w-4 h-4 rounded-full object-cover" />
                    <span>{partner2.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">(2512)</span>
                  </button>
                </div>
              </div>

              {/* Form Inputs (Exact Pill Style from Screenshot) */}
              <form onSubmit={handleSignIn} className="space-y-2.5">
                {/* Email Address Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter email address"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#FF4B72] transition-all shadow-2xs"
                  />
                </div>

                {/* Password / 4-Digit Security PIN Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={4}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value.replace(/\D/g, ''));
                      setLoginError('');
                    }}
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 font-mono text-xs focus:outline-none focus:border-[#FF4B72] transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password Link (From Screenshot) */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => alert(`Demo Passwords: ${partner1.name}: 1404, ${partner2.name}: 2512, or demo 1234`)}
                    className="text-[11px] font-bold text-stone-800 hover:text-[#FF4B72] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <p className="text-[11px] text-rose-600 font-sans text-center font-medium">
                    {loginError}
                  </p>
                )}

                {/* Primary Button: Coral-to-Pink Gradient Pill (From Screenshot) */}
                <button
                  type="submit"
                  className="w-full py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#FF5E8E] to-[#FF4B72] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#FF4B72]/25 transition-all active:scale-[0.99] mt-1"
                >
                  Sign In
                </button>
              </form>

              {/* OR Divider (From Screenshot) */}
              <div className="relative my-2 text-center">
                <span className="text-[10px] text-stone-400 font-sans uppercase font-bold tracking-wider">
                  OR
                </span>
              </div>

              {/* Apple Button: Clean White Pill with Apple Icon (From Screenshot) */}
              <button
                type="button"
                onClick={handleBiometricAuth}
                className="w-full py-2.5 sm:py-3 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.91-12.03-14.49-6.03-9.14-10.82-20.08-14.37-32.8-3.55-12.72-5.32-24.52-5.32-35.4 0-14.6 3.69-26.65 11.08-36.14 7.39-9.49 16.5-14.36 27.34-14.61 5.35 0 11.26 1.41 17.73 4.23 6.47 2.82 10.59 4.31 12.35 4.47 1.45 0 5.86-1.61 13.23-4.83 7.37-3.22 13.54-4.53 18.52-3.92 13.73 1.09 24.32 6.51 31.78 16.27-12.28 7.4-18.3 17.43-18.06 30.1.24 9.9 4.08 18.15 11.51 24.76 7.43 6.61 16.32 10.37 26.67 11.27-2.3 7.08-5.29 14.54-8.97 22.37zM119.22 31.84c0-7.2 2.66-14.07 7.99-20.61 5.33-6.54 11.97-10.65 19.92-12.33.24 1.46.36 2.79.36 3.99 0 7.23-2.85 14.12-8.55 20.67-5.7 6.55-12.44 10.45-20.22 11.7-.24-1.34-.36-2.48-.36-3.42z" />
                </svg>
                <span>Continue with apple</span>
              </button>
            </motion.div>
          )}

          {/* ================= SCREEN 3: SIGN UP ================= */}
          {screenMode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* Top Segmented Tab Switcher [ Log in ] [ Sign up ] (Sign up Active) */}
              <div className="w-full p-1 rounded-full bg-stone-100 flex items-center border border-stone-200/60 mb-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setScreenMode('login');
                  }}
                  className="flex-1 py-1.5 rounded-full text-xs font-medium text-stone-500 hover:text-stone-900 transition-all text-center"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => setScreenMode('signup')}
                  className="flex-1 py-1.5 rounded-full text-xs font-bold bg-white text-stone-900 shadow-xs transition-all text-center"
                >
                  Sign up
                </button>
              </div>

              {/* Title & Subtitle (From Screenshot) */}
              <div className="mb-2">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                  <span>Join BondLock Today</span>
                  <span>✨</span>
                </h2>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Create your account and start sparking connection today!
                </p>
              </div>

              {/* Profile Photo Set Option (User Request) */}
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-stone-50 border border-stone-200/70 mb-2">
                <div 
                  className="relative group cursor-pointer shrink-0" 
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile photo"
                >
                  <img
                    src={profilePhoto}
                    alt="Profile Avatar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#FF4B72]"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#FF4B72] border border-white flex items-center justify-center text-white">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-700 block truncate">
                    Set Profile Photo
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {PRESET_AVATARS.slice(0, 4).map((av, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProfilePhoto(av)}
                        className={`w-5 h-5 rounded-full overflow-hidden border ${
                          profilePhoto === av ? 'border-[#FF4B72] ring-1 ring-[#FF4B72]' : 'border-stone-300'
                        }`}
                      >
                        <img src={av} alt="avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[9px] text-[#FF4B72] font-semibold underline ml-1"
                    >
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign Up Form Inputs */}
              <form onSubmit={handleSignUp} className="space-y-2">
                {/* Input 1: Enter your name */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#FF4B72] shadow-2xs"
                  />
                </div>

                {/* Input 2: Enter email address */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter email address"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#FF4B72] shadow-2xs"
                  />
                </div>

                {/* Input 3: Enter your password (4-digit PIN) */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={4}
                    placeholder="Enter your 4-digit security PIN"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 font-mono text-xs focus:outline-none focus:border-[#FF4B72] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Checkbox: I agree to Terms & Conditions (From Screenshot) */}
                <div className="flex items-center text-xs text-stone-600 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-[#FF4B72]"
                    />
                    <span className="text-[11px]">I agree to BondLock Terms & Conditions.</span>
                  </label>
                </div>

                {signUpError && (
                  <p className="text-[11px] text-rose-600 font-sans text-center font-medium">
                    {signUpError}
                  </p>
                )}

                {/* Primary Button: Sign Up (From Screenshot) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF5E8E] to-[#FF4B72] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#FF4B72]/25 transition-all active:scale-[0.99] mt-1"
                >
                  {isSubmitting ? 'Creating Vault...' : 'Sign Up'}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative my-2 text-center">
                <span className="text-[10px] text-stone-400 font-sans uppercase font-bold tracking-wider">
                  OR
                </span>
              </div>

              {/* Apple Button */}
              <button
                type="button"
                onClick={handleBiometricAuth}
                className="w-full py-2.5 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.91-12.03-14.49-6.03-9.14-10.82-20.08-14.37-32.8-3.55-12.72-5.32-24.52-5.32-35.4 0-14.6 3.69-26.65 11.08-36.14 7.39-9.49 16.5-14.36 27.34-14.61 5.35 0 11.26 1.41 17.73 4.23 6.47 2.82 10.59 4.31 12.35 4.47 1.45 0 5.86-1.61 13.23-4.83 7.37-3.22 13.54-4.53 18.52-3.92 13.73 1.09 24.32 6.51 31.78 16.27-12.28 7.4-18.3 17.43-18.06 30.1.24 9.9 4.08 18.15 11.51 24.76 7.43 6.61 16.32 10.37 26.67 11.27-2.3 7.08-5.29 14.54-8.97 22.37zM119.22 31.84c0-7.2 2.66-14.07 7.99-20.61 5.33-6.54 11.97-10.65 19.92-12.33.24 1.46.36 2.79.36 3.99 0 7.23-2.85 14.12-8.55 20.67-5.7 6.55-12.44 10.45-20.22 11.7-.24-1.34-.36-2.48-.36-3.42z" />
                </svg>
                <span>Continue with apple</span>
              </button>
            </motion.div>
          )}

          {/* ================= SCREEN 2: WELCOME / INTRO (From Screenshot) ================= */}
          {screenMode === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between py-2 text-center"
            >
              {/* Center Lightning / Heart Badge (From Screenshot) */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF5E8E] to-[#FF4B72] flex items-center justify-center text-white shadow-md shadow-[#FF4B72]/30 mb-3">
                  <Zap className="w-7 h-7 fill-white text-white" />
                </div>

                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  Meet. Match. Chat.
                </h2>
                <p className="text-xs text-stone-500 font-sans mt-1 max-w-[240px]">
                  Connect with your partner around you - it's that easy.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setScreenMode('login');
                  }}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#FF5E8E] to-[#FF4B72] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all"
                >
                  Login with Your Email
                </button>

                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  className="w-full py-3 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.91-12.03-14.49-6.03-9.14-10.82-20.08-14.37-32.8-3.55-12.72-5.32-24.52-5.32-35.4 0-14.6 3.69-26.65 11.08-36.14 7.39-9.49 16.5-14.36 27.34-14.61 5.35 0 11.26 1.41 17.73 4.23 6.47 2.82 10.59 4.31 12.35 4.47 1.45 0 5.86-1.61 13.23-4.83 7.37-3.22 13.54-4.53 18.52-3.92 13.73 1.09 24.32 6.51 31.78 16.27-12.28 7.4-18.3 17.43-18.06 30.1.24 9.9 4.08 18.15 11.51 24.76 7.43 6.61 16.32 10.37 26.67 11.27-2.3 7.08-5.29 14.54-8.97 22.37zM119.22 31.84c0-7.2 2.66-14.07 7.99-20.61 5.33-6.54 11.97-10.65 19.92-12.33.24 1.46.36 2.79.36 3.99 0 7.23-2.85 14.12-8.55 20.67-5.7 6.55-12.44 10.45-20.22 11.7-.24-1.34-.36-2.48-.36-3.42z" />
                  </svg>
                  <span>Continue with apple</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Footer Controls & Reset Demo */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-mono mt-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScreenMode('login')}
                className={`hover:text-stone-700 ${screenMode === 'login' ? 'font-bold text-[#FF4B72]' : ''}`}
              >
                Log in
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setScreenMode('welcome')}
                className={`hover:text-stone-700 ${screenMode === 'welcome' ? 'font-bold text-[#FF4B72]' : ''}`}
              >
                Intro
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setScreenMode('signup')}
                className={`hover:text-stone-700 ${screenMode === 'signup' ? 'font-bold text-[#FF4B72]' : ''}`}
              >
                Sign up
              </button>
            </div>

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

    </div>
  );
};
