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
  Users,
  AtSign,
  Fingerprint,
  Dices,
  Smartphone
} from 'lucide-react';
import { CoupleProfile, Vault, UserAccount } from '../../types/vault';
import { verifyPasskey, isPlatformAuthenticatorAvailable } from '../../utils/webAuthn';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { initialCoupleProfile } from '../../data/initialMemories';

interface LoginPageProps {
  coupleProfile: CoupleProfile;
  onLoginSuccess: (partnerId: 'partner1' | 'partner2', targetRoomCode?: string, userId?: string) => void;
  onUpdateCoupleProfile?: (profile: CoupleProfile) => void;
  currentRoomCode?: string;
  onUpdateRoomCode?: (newCode: string) => void;
}

// Preset Avatars for Profile Photo
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
];

// Romantic Vault Name Suggestions
const VAULT_NAME_SUGGESTIONS = [
  '🌸 Our Forever Haven',
  '✨ Two Hearts Locker',
  '💍 Eternal Sanctuary',
  '🌴 Positano Sunset Vault',
];

export const LoginPage: React.FC<LoginPageProps> = ({
  coupleProfile,
  onLoginSuccess,
  onUpdateCoupleProfile,
  currentRoomCode = '882104',
  onUpdateRoomCode,
}) => {
  // Screen state: 'login' | 'signup'
  const [screenMode, setScreenMode] = useState<'login' | 'signup'>('login');

  // Vault Connection & Role Selection
  const [selectedRole, setSelectedRole] = useState<'partner1' | 'partner2'>('partner1');
  const [vaultRoomCode, setVaultRoomCode] = useState(currentRoomCode);
  const [copiedLink, setCopiedLink] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('aarav');
  const [loginPassword, setLoginPassword] = useState('1404');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dynamically detected Vault Name when signing in
  const [detectedVault, setDetectedVault] = useState<Vault | null>(null);
  const [detectedAccount, setDetectedAccount] = useState<UserAccount | null>(null);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpLoginId, setSignUpLoginId] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string>(PRESET_AVATARS[0]);
  const [signUpError, setSignUpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sign Up: Vault Creation Options
  const [vaultOption, setVaultOption] = useState<'create' | 'join'>('create');
  const [newVaultName, setNewVaultName] = useState("Our Secret Sanctuary");
  const [newVaultCode, setNewVaultCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [joinPartnerCode, setJoinPartnerCode] = useState('');

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;

  // Real-time detection of user's linked vault as they type their Login ID in Sign In
  useEffect(() => {
    const query = loginIdentifier.trim();
    if (!query) {
      setDetectedVault(null);
      setDetectedAccount(null);
      return;
    }

    const account = storage.getUserAccount(query);
    setDetectedAccount(account);

    if (account) {
      const vault = storage.getMemberVault(account.id);
      setDetectedVault(vault);
    } else {
      if (query.toLowerCase().includes('aarav')) {
        setDetectedVault(storage.getMemberVault('user_aarav'));
      } else if (query.toLowerCase().includes('ananya')) {
        setDetectedVault(storage.getMemberVault('user_ananya'));
      } else {
        setDetectedVault(null);
      }
    }
  }, [loginIdentifier]);

  // Check URL params (?role=partner2&pair=XXXXXX) on load
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
        setLoginIdentifier('ananya');
        setLoginPassword(coupleProfile.partner2.pin || '2512');
      }
    } catch (e) {}
  }, [coupleProfile]);

  // Handle quick partner chip selection
  const handleSelectRole = (role: 'partner1' | 'partner2') => {
    sound.playSoftClick();
    setSelectedRole(role);
    if (role === 'partner1') {
      setLoginIdentifier('aarav');
      setLoginPassword(partner1.pin || '1404');
    } else {
      setLoginIdentifier('ananya');
      setLoginPassword(partner2.pin || '2512');
    }
    setLoginError('');
  };

  // Copy Partner Invite Link
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

  // Check unique Login ID availability
  const cleanSignUpLoginId = signUpLoginId.trim().toLowerCase().replace(/^@/, '');
  const isLoginIdValid = cleanSignUpLoginId.length >= 3 && /^[a-z0-9_]+$/.test(cleanSignUpLoginId);
  const isLoginIdAvailable = isLoginIdValid && !storage.isLoginIdTaken(cleanSignUpLoginId);

  // Sign In Submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setLoginError('');

    const query = loginIdentifier.trim().toLowerCase().replace(/^@/, '');
    const pin = loginPassword.trim();

    if (!pin) {
      setLoginError('Please enter your 4-digit security PIN or password.');
      sound.playPanicLock();
      return;
    }

    const account = storage.getUserAccount(query);
    const expectedPin = account?.pin || (selectedRole === 'partner1' ? (partner1.pin || '1404') : (partner2.pin || '2512'));

    if (pin === expectedPin || pin === '1234' || pin === '1404' || pin === '2512') {
      sound.playPartnerApproved();
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      const effectiveRole = account ? account.role : selectedRole;
      const effectiveUserId = account ? account.id : (selectedRole === 'partner1' ? 'user_aarav' : 'user_ananya');
      const targetCode = detectedVault?.inviteCode || vaultRoomCode;

      if (onUpdateRoomCode) onUpdateRoomCode(targetCode);

      setTimeout(() => {
        onLoginSuccess(effectiveRole, targetCode, effectiveUserId);
      }, 250);
    } else {
      sound.playPanicLock();
      setLoginError(`Incorrect security PIN. (Demo: Aarav is 1404, Ananya is 2512, or test 1234)`);
    }
  };

  // Sign Up Submission with Vault Creation
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSoftClick();
    setSignUpError('');

    const name = signUpName.trim() || 'Partner A';
    const loginId = cleanSignUpLoginId;
    const pin = signUpPassword.trim();

    if (!isLoginIdValid) {
      setSignUpError('Login ID must be at least 3 alphanumeric characters (letters, numbers, underscores).');
      sound.playPanicLock();
      return;
    }

    if (!isLoginIdAvailable) {
      setSignUpError(`Login ID @${loginId} is already taken. Please choose another unique handle.`);
      sound.playPanicLock();
      return;
    }

    if (!pin || pin.length !== 4) {
      setSignUpError('Security PIN must be exactly 4 digits.');
      sound.playPanicLock();
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    const newUserId = `user_${loginId}`;

    let assignedVaultId = 'vault_demo_1';
    let assignedRoomCode = currentRoomCode;
    let assignedRole: 'partner1' | 'partner2' = 'partner1';
    let finalVaultName = newVaultName.trim() || `${name}'s Private Sanctuary`;

    if (vaultOption === 'create') {
      const createdVault = storage.createVault(finalVaultName, newVaultCode);
      assignedVaultId = createdVault.id;
      assignedRoomCode = createdVault.inviteCode;
      assignedRole = 'partner1';
      storage.linkUserToVault(newUserId, assignedVaultId, 'partner1');
    } else {
      const code = joinPartnerCode.trim().toUpperCase();
      let existingVault = storage.getVaultByCode(code);
      if (!existingVault) {
        existingVault = storage.createVault("Connected Couple's Sanctuary", code || '882104');
      }
      assignedVaultId = existingVault.id;
      assignedRoomCode = existingVault.inviteCode;
      assignedRole = 'partner2';
      finalVaultName = existingVault.name;
      storage.linkUserToVault(newUserId, assignedVaultId, 'partner2');
    }

    const newUserAccount: UserAccount = {
      id: newUserId,
      email: signUpEmail.trim() || `${loginId}@bondlock.vault`,
      username: loginId,
      name: name,
      avatar: profilePhoto,
      pin: pin,
      role: assignedRole,
      vaultId: assignedVaultId,
    };
    storage.saveUserAccount(newUserAccount);

    const newProfile: CoupleProfile = {
      ...coupleProfile,
      partner1: assignedRole === 'partner1' ? {
        ...coupleProfile.partner1,
        name: name,
        avatar: profilePhoto,
        pin: pin,
        role: `${name} • Key Share 1`,
      } : coupleProfile.partner1,
      partner2: assignedRole === 'partner2' ? {
        ...coupleProfile.partner2,
        name: name,
        avatar: profilePhoto,
        pin: pin,
        role: `${name} • Key Share 2`,
      } : coupleProfile.partner2,
      vaultName: finalVaultName,
    };

    storage.saveCoupleProfile(newProfile);
    if (onUpdateCoupleProfile) {
      onUpdateCoupleProfile(newProfile);
    }

    if (onUpdateRoomCode) onUpdateRoomCode(assignedRoomCode);

    setIsSubmitting(false);
    sound.playVaultUnlocked();

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    onLoginSuccess(assignedRole, assignedRoomCode, newUserId);
  };

  // Hardware Biometric / Face ID / Apple Passkey
  const handleBiometricAuth = async () => {
    sound.playBiometricScan();
    try {
      const isAvail = await isPlatformAuthenticatorAvailable();
      if (isAvail) {
        const auth = await verifyPasskey(selectedRole);
        if (auth.success) {
          sound.playVaultUnlocked();
          onLoginSuccess(selectedRole, vaultRoomCode);
          return;
        }
      }
    } catch (e) {}
    setLoginError('Biometric passkey not available on this device. Please enter your 4-digit PIN.');
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 font-sans selection:bg-[#6C5DD3] selection:text-white select-none">
      
      {/* Responsive Main Container (Auto-adapts between Phone & Desktop) */}
      <div className="w-full max-w-6xl min-h-[640px] lg:min-h-[720px] bg-white rounded-3xl lg:rounded-[40px] shadow-2xl border border-stone-100 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        
        {/* ================= LEFT COLUMN: Clean White Auth Form (Reference Image) ================= */}
        <div className="flex-1 p-6 sm:p-10 lg:p-14 flex flex-col justify-between overflow-y-auto">
          
          <div>
            {/* Top Brand Logo pill */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-[#6C5DD3] flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="font-extrabold text-stone-900 tracking-tight text-lg font-sans">
                  BondLock
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6C5DD3]/10 text-[#6C5DD3] font-semibold border border-[#6C5DD3]/20">
                  Zero-Knowledge Dual Locker
                </span>
              </div>

              {/* Segmented [ Log in ] [ Sign up ] pill */}
              <div className="p-0.5 rounded-full bg-stone-100 flex items-center border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setScreenMode('login');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    screenMode === 'login'
                      ? 'bg-[#6C5DD3] text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setScreenMode('signup');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    screenMode === 'signup'
                      ? 'bg-[#6C5DD3] text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Sign up
                </button>
              </div>
            </div>

            {/* Heading Typography matching Reference Image */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                {screenMode === 'login' ? (
                  <>
                    Holla,<br />
                    Welcome Back
                  </>
                ) : (
                  <>
                    Create Account,<br />
                    Build Your Vault
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-sans mt-2">
                {screenMode === 'login' 
                  ? "Hey, welcome back to your special place" 
                  : "Register a unique ID and create or join your shared vault"}
              </p>
            </div>

            {/* ================= SCREEN 1: SIGN IN ================= */}
            {screenMode === 'login' && (
              <motion.div
                key="login-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Quick Account Chips */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('partner1')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                      selectedRole === 'partner1'
                        ? 'bg-purple-50 border-[#6C5DD3] text-[#6C5DD3] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <img src={partner1.avatar} alt="P1" className="w-5 h-5 rounded-full object-cover" />
                    <span>@{partner1.name.toLowerCase()}</span>
                    <span className="text-[10px] text-stone-400 font-mono">(1404)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('partner2')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                      selectedRole === 'partner2'
                        ? 'bg-purple-50 border-[#6C5DD3] text-[#6C5DD3] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <img src={partner2.avatar} alt="P2" className="w-5 h-5 rounded-full object-cover" />
                    <span>@{partner2.name.toLowerCase()}</span>
                    <span className="text-[10px] text-stone-400 font-mono">(2512)</span>
                  </button>
                </div>

                {/* Dynamic Linked Vault Detection Card */}
                {detectedVault && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-[#6C5DD3]/30 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#6C5DD3] flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-[#6C5DD3] font-bold uppercase tracking-wider block">
                          🔒 Linked Vault Detected
                        </span>
                        <span className="text-xs font-bold text-stone-900 truncate block">
                          {detectedVault.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-full text-emerald-600 font-bold border border-emerald-300 shrink-0">
                      Code: {detectedVault.inviteCode}
                    </span>
                  </motion.div>
                )}

                {/* Form Inputs matching screenshot */}
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  {/* Email / Login ID Field */}
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="stanley@gmail.com or unique Login ID"
                        value={loginIdentifier}
                        onChange={(e) => {
                          setLoginIdentifier(e.target.value);
                          setLoginError('');
                        }}
                        className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/15 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password / 4-Digit Security PIN */}
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        maxLength={4}
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value.replace(/\D/g, ''));
                          setLoginError('');
                        }}
                        className="w-full px-4 pr-11 py-3 sm:py-3.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 font-mono text-sm tracking-widest focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/15 transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Row: Remember me + Forgot Password */}
                  <div className="flex items-center justify-between text-xs text-stone-600 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-[#6C5DD3] focus:ring-[#6C5DD3] accent-[#6C5DD3]"
                      />
                      <span className="font-medium text-stone-700">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => alert(`Default Demo PINs: ${partner1.name}: 1404, ${partner2.name}: 2512, or test 1234`)}
                      className="text-stone-500 hover:text-[#6C5DD3] font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Error Banner */}
                  {loginError && (
                    <p className="text-xs text-rose-600 font-sans text-center font-medium">
                      {loginError}
                    </p>
                  )}

                  {/* Primary Button: Solid Purple matching reference image */}
                  <button
                    type="submit"
                    className="w-full py-3.5 sm:py-4 rounded-xl bg-[#6C5DD3] hover:bg-[#5C4DCE] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#6C5DD3]/25 transition-all mt-2"
                  >
                    Sign In
                  </button>

                  {/* Apple Continue Button */}
                  <button
                    type="button"
                    onClick={handleBiometricAuth}
                    className="w-full py-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.91-12.03-14.49-6.03-9.14-10.82-20.08-14.37-32.8-3.55-12.72-5.32-24.52-5.32-35.4 0-14.6 3.69-26.65 11.08-36.14 7.39-9.49 16.5-14.36 27.34-14.61 5.35 0 11.26 1.41 17.73 4.23 6.47 2.82 10.59 4.31 12.35 4.47 1.45 0 5.86-1.61 13.23-4.83 7.37-3.22 13.54-4.53 18.52-3.92 13.73 1.09 24.32 6.51 31.78 16.27-12.28 7.4-18.3 17.43-18.06 30.1.24 9.9 4.08 18.15 11.51 24.76 7.43 6.61 16.32 10.37 26.67 11.27-2.3 7.08-5.29 14.54-8.97 22.37zM119.22 31.84c0-7.2 2.66-14.07 7.99-20.61 5.33-6.54 11.97-10.65 19.92-12.33.24 1.46.36 2.79.36 3.99 0 7.23-2.85 14.12-8.55 20.67-5.7 6.55-12.44 10.45-20.22 11.7-.24-1.34-.36-2.48-.36-3.42z" />
                    </svg>
                    <span>Continue with Face ID / Apple Passkey</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* ================= SCREEN 2: SIGN UP & CREATE VAULT ================= */}
            {screenMode === 'signup' && (
              <motion.div
                key="signup-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3.5"
              >
                {/* Profile Photo Set Option */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-stone-50 border border-stone-200">
                  <div 
                    className="relative group cursor-pointer shrink-0" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload profile photo"
                  >
                    <img
                      src={profilePhoto}
                      alt="Profile Avatar"
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-[#6C5DD3]"
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#6C5DD3] border border-white flex items-center justify-center text-white">
                      <Camera className="w-2 h-2" />
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
                    <span className="text-[11px] font-bold text-stone-800 block truncate">
                      Profile Avatar
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {PRESET_AVATARS.slice(0, 4).map((av, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setProfilePhoto(av)}
                          className={`w-5 h-5 rounded-full overflow-hidden border ${
                            profilePhoto === av ? 'border-[#6C5DD3] ring-1 ring-[#6C5DD3]' : 'border-stone-300'
                          }`}
                        >
                          <img src={av} alt="avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-[#6C5DD3] font-semibold underline ml-1"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-2.5">
                  {/* Name Input */}
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-[#6C5DD3] shadow-xs"
                  />

                  {/* Unique Login ID with Live Availability Indicator */}
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Unique Login ID (e.g. rohan_01)"
                        value={signUpLoginId}
                        onChange={(e) => {
                          setSignUpLoginId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                          setSignUpError('');
                        }}
                        className={`w-full px-4 pr-10 py-2.5 sm:py-3 rounded-xl bg-white border text-xs sm:text-sm focus:outline-none transition-all shadow-xs ${
                          cleanSignUpLoginId.length >= 3
                            ? isLoginIdAvailable
                              ? 'border-emerald-500 focus:border-emerald-500'
                              : 'border-rose-500 focus:border-rose-500'
                            : 'border-stone-200 focus:border-[#6C5DD3]'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                        {cleanSignUpLoginId.length >= 3 && (
                          isLoginIdAvailable ? (
                            <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Uniqueness feedback */}
                    <div className="px-1 pt-1">
                      {cleanSignUpLoginId.length >= 3 ? (
                        isLoginIdAvailable ? (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            ✓ Unique Login ID @{cleanSignUpLoginId} is available!
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-600 font-medium">
                            ❌ Login ID @{cleanSignUpLoginId} is already taken!
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-stone-400 font-mono">
                          Unique ID handle (letters, numbers, underscores)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4-digit Security PIN */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={4}
                      placeholder="4-digit Security PIN"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 pr-10 py-2.5 sm:py-3 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 font-mono text-xs sm:text-sm focus:outline-none focus:border-[#6C5DD3] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* ====== CREATE VAULT CONFIGURATION ====== */}
                  <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-50/90 to-indigo-50/90 border border-[#6C5DD3]/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                      <span className="flex items-center gap-1.5 text-[#6C5DD3]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Vault Configuration</span>
                      </span>
                      <span className="text-stone-500 font-mono text-[10px]">2-of-2 SSS</span>
                    </div>

                    {/* Mode Toggle [ Create New Vault ] vs [ Join Partner ] */}
                    <div className="grid grid-cols-2 p-0.5 rounded-xl bg-white/90 border border-stone-200">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playSoftClick();
                          setVaultOption('create');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          vaultOption === 'create'
                            ? 'bg-[#6C5DD3] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        🏰 Create New Vault
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playSoftClick();
                          setVaultOption('join');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          vaultOption === 'join'
                            ? 'bg-[#6C5DD3] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        🔗 Join Existing
                      </button>
                    </div>

                    {vaultOption === 'create' ? (
                      <div className="space-y-1.5 pt-0.5">
                        <input
                          type="text"
                          required
                          placeholder="Vault Name (e.g. Our Sanctuary)"
                          value={newVaultName}
                          onChange={(e) => setNewVaultName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs font-semibold focus:outline-none focus:border-[#6C5DD3]"
                        />

                        {/* Name suggestions */}
                        <div className="flex flex-wrap gap-1">
                          {VAULT_NAME_SUGGESTIONS.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewVaultName(sug)}
                              className="text-[10px] bg-white text-stone-600 px-2 py-0.5 rounded-lg border border-stone-200 hover:border-[#6C5DD3]"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>

                        {/* 6-Digit Code display */}
                        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                          <span className="text-stone-500 font-mono">6-Digit Code:</span>
                          <div className="flex items-center gap-2 font-mono font-bold text-[#6C5DD3]">
                            <span className="tracking-widest">{newVaultCode}</span>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playSoftClick();
                                setNewVaultCode(Math.floor(100000 + Math.random() * 900000).toString());
                              }}
                              className="text-stone-400 hover:text-stone-800 p-0.5"
                              title="Randomize Code"
                            >
                              <Dices className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-0.5">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter Partner's 6-digit Code"
                          value={joinPartnerCode}
                          onChange={(e) => setJoinPartnerCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs font-mono font-bold text-center tracking-widest focus:outline-none focus:border-[#6C5DD3]"
                        />
                      </div>
                    )}
                  </div>

                  {signUpError && (
                    <p className="text-xs text-rose-600 font-sans text-center font-medium">
                      {signUpError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || (cleanSignUpLoginId.length >= 3 && !isLoginIdAvailable)}
                    className="w-full py-3.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5C4DCE] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#6C5DD3]/25 transition-all disabled:opacity-50 mt-1"
                  >
                    {isSubmitting ? 'Configuring Vault...' : vaultOption === 'create' ? 'Create Account & Vault' : 'Join Partner’s Vault'}
                  </button>
                </form>
              </motion.div>
            )}
          </div>

          {/* Footer Link: Don't have an account? Sign Up */}
          <div className="pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            {screenMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setScreenMode('signup');
                  }}
                  className="font-bold text-[#6C5DD3] hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftClick();
                    setScreenMode('login');
                  }}
                  className="font-bold text-[#6C5DD3] hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="text-[#6C5DD3] hover:underline font-semibold flex items-center gap-1 font-mono text-[11px]"
            >
              <Share2 className="w-3 h-3" />
              <span>{copiedLink ? 'Link Copied!' : 'Invite Partner'}</span>
            </button>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: Artwork & Floating Biometric Phone (Exact Match to Reference Screenshot) ================= */}
        <div className="relative min-h-[360px] lg:min-h-full rounded-2xl lg:rounded-[36px] m-2 lg:m-3 bg-gradient-to-br from-[#745FF2] via-[#654EE8] to-[#5037D8] p-6 lg:p-10 flex items-center justify-center overflow-hidden shadow-inner">
          
          {/* Fluffy White SVG Clouds in Background */}
          {/* Top Left Cloud */}
          <div className="absolute top-2 left-[-20px] opacity-90 pointer-events-none">
            <svg width="220" height="110" viewBox="0 0 220 110" fill="none">
              <path d="M40 90C17.9 90 0 72.1 0 50C0 30.5 13.9 14.2 32.5 10.7C39.4 4.2 48.7 0 59 0C74.6 0 87.7 9.8 92.5 23.5C98.4 21.2 104.9 20 111.7 20C134.4 20 153.2 36.8 155.8 58.7C162.7 54.4 170.8 52 179.5 52C201.9 52 220 70.1 220 92.5C220 94 219.9 95.5 219.7 97H40V90Z" fill="white" />
            </svg>
          </div>

          {/* Top Right Cloud */}
          <div className="absolute top-[-10px] right-[-30px] opacity-80 pointer-events-none">
            <svg width="240" height="130" viewBox="0 0 240 130" fill="none">
              <path d="M45 110C20.1 110 0 89.9 0 65C0 42.9 15.9 24.5 37 20.7C44.9 8.2 58.8 0 75 0C93.4 0 109.1 10.6 116.5 26.2C123.7 23.4 131.6 22 139.7 22C167.3 22 190.1 42.5 193.1 69.2C201.2 64.1 210.8 61.2 221 61.2C231.8 61.2 240 69.4 240 80.2V110H45Z" fill="white" />
            </svg>
          </div>

          {/* Bottom Fluffy Clouds */}
          <div className="absolute bottom-[-20px] inset-x-0 flex justify-between opacity-95 pointer-events-none">
            <svg width="260" height="120" viewBox="0 0 260 120" fill="none">
              <path d="M30 110C13.4 110 0 96.6 0 80C0 64.9 11.2 52.4 25.8 50.4C30.9 22.3 55.4 1 85 1C107.5 1 126.9 14.1 135.5 33.2C142.3 29.8 150 28 158.1 28C182.4 28 202.8 45.4 207.2 68.7C214.2 64.4 222.4 62 231.2 62C247.1 62 260 74.9 260 90.8V110H30Z" fill="white" />
            </svg>
            <svg width="240" height="110" viewBox="0 0 240 110" fill="none" className="hidden sm:block">
              <path d="M25 100C11.2 100 0 88.8 0 75C0 62.4 9.3 52 21.5 50.3C25.8 26.9 46.2 9 70.8 9C89.5 9 105.7 19.9 112.9 35.8C118.6 32.9 125 31.4 131.8 31.4C152 31.4 169 45.9 172.7 65.3C178.5 61.7 185.3 59.7 192.7 59.7C206 59.7 216.7 70.4 216.7 83.7V100H25Z" fill="white" />
            </svg>
          </div>

          {/* Centerpiece Container with Floating Elements */}
          <div className="relative z-10 flex items-center justify-center">
            
            {/* Top-Left Floating Speech Bubble with Checkmark (Exact Match to Screenshot) */}
            <motion.div
              animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              className="absolute -top-10 -left-6 sm:-top-12 sm:-left-12 z-30 bg-white rounded-full p-3 sm:p-4 shadow-2xl flex items-center justify-center border-4 border-white/60"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#6C5DD3] to-[#A855F7] flex items-center justify-center text-white shadow-md">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
              </div>
            </motion.div>

            {/* Right Floating 3D Padlock (Exact Match to Screenshot) */}
            <motion.div
              animate={{ y: [6, -6, 6], rotate: [2, -2, 2] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute -bottom-8 -right-6 sm:-bottom-10 sm:-right-10 z-30 flex flex-col items-center"
            >
              {/* Shackle */}
              <div className="w-10 sm:w-12 h-10 sm:h-12 border-4 sm:border-[5px] border-white rounded-t-full mb-[-5px] shadow-sm" />
              {/* Body */}
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center border-4 border-white/60">
                <div className="flex flex-col items-center">
                  <div className="w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-[#6C5DD3]" />
                  <div className="w-1.5 sm:w-2 h-3.5 sm:h-4 bg-[#6C5DD3] rounded-b-sm" />
                </div>
              </div>
            </motion.div>

            {/* Floating 3D Smartphone (Exact Match to Screenshot) */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="relative w-[230px] sm:w-[270px] h-[450px] sm:h-[500px] rounded-[44px] bg-[#170520] border-[7px] border-stone-900 shadow-2xl flex flex-col overflow-hidden p-3.5 select-none"
            >
              {/* Phone Speaker & Front Camera Hole */}
              <div className="w-full flex items-center justify-center mb-4 pt-1">
                <div className="w-3 h-3 rounded-full bg-black border border-white/20" />
              </div>

              {/* Glowing Phone Screen Content */}
              <div className="flex-1 rounded-[30px] bg-gradient-to-b from-[#F16298] via-[#BF4CD0] to-[#7B59EC] p-4 flex flex-col items-center justify-between text-center relative overflow-hidden text-white shadow-inner">
                
                {/* Status Bar inside phone */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono opacity-80 pt-1">
                  <span>9:41</span>
                  <span>5G 100%</span>
                </div>

                {/* Center Biometric Scanning Ring with 4 Corners */}
                <div className="my-auto flex flex-col items-center">
                  <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                    {/* 4 bracket scan corners */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-lg" />

                    {/* Fingerprint / Face ID icon */}
                    <motion.div
                      animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg"
                    >
                      <Fingerprint className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Animated Scanning Beam */}
                    <motion.div
                      animate={{ y: [-40, 40, -40] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_rgba(103,232,249,0.8)]"
                    />
                  </div>

                  {/* Holographic Cyan Progress Bar */}
                  <div className="w-32 h-1.5 rounded-full bg-black/25 overflow-hidden mb-3">
                    <motion.div
                      animate={{ x: [-120, 120] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-20 h-full bg-gradient-to-r from-cyan-300 via-white to-pink-300 rounded-full"
                    />
                  </div>

                  <p className="text-[11px] font-sans font-medium text-white/95 leading-tight max-w-[150px]">
                    Please tap your finger or passkey to your phone
                  </p>
                </div>

                {/* Bottom Home Indicator on Phone Screen */}
                <div className="w-20 h-1 rounded-full bg-white/40 mb-1" />
              </div>
            </motion.div>

          </div>

        </div>

      </div>

    </div>
  );
};
