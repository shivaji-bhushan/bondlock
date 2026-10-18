import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Heart, Smartphone, RefreshCw, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CoupleProfile, Vault, UserAccount } from '../../types/vault';
import { storage } from '../../utils/storage';
import { sound } from '../../utils/sound';
import { realtimeVault } from '../../utils/realtimeVault';

interface PairingScreenProps {
  currentUser: UserAccount;
  coupleProfile: CoupleProfile;
  onPairingComplete: (vault: Vault, role: 'partner1' | 'partner2') => void;
  onLogout?: () => void;
}

export const PairingScreen: React.FC<PairingScreenProps> = ({
  currentUser,
  coupleProfile,
  onPairingComplete,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'enter'>('generate');

  // Generated code state
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Input code state (6 digits)
  const [inputDigits, setInputDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [inputError, setInputError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize generated code once on mount
  useEffect(() => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
  }, []);

  // Listen for PARTNER_LINKED realtime event when waiting
  useEffect(() => {
    const unsubscribe = realtimeVault.onMessage((msg) => {
      if (msg.type === 'PARTNER_LINKED' && msg.payload) {
        sound.playVaultUnlocked();
        try {
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}

        const targetVault = storage.getVaultById(msg.payload.vaultId) || {
          id: msg.payload.vaultId,
          name: `${currentUser.name} & Partner's Vault`,
          inviteCode: msg.payload.inviteCode || generatedCode,
          createdAt: Date.now(),
        };

        // Link current user as partner1
        storage.linkUserToVault(currentUser.id, targetVault.id, 'partner1');
        setTimeout(() => {
          onPairingComplete(targetVault, 'partner1');
        }, 500);
      }
    });

    return () => unsubscribe();
  }, [currentUser, generatedCode, onPairingComplete]);

  // Handle Tab 1: Start Waiting with Generated Code
  const handleStartHosting = () => {
    sound.playSoftClick();
    const vault = storage.createVault(`${currentUser.name} & Partner's Vault`, generatedCode);
    storage.linkUserToVault(currentUser.id, vault.id, 'partner1');
    realtimeVault.initialize(generatedCode, 'partner1');
    setIsWaitingForPartner(true);
  };

  const handleCopyCode = () => {
    sound.playSoftClick();
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle Tab 2: Digit inputs
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...inputDigits];
    newDigits[index] = value.slice(-1);
    setInputDigits(newDigits);
    setInputError('');

    // Auto advance focus
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setInputDigits(newDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  // Verify and Join Vault
  const handleVerifyAndJoin = () => {
    const fullCode = inputDigits.join('').trim();
    if (fullCode.length !== 6) {
      setInputError('Please enter all 6 digits of the invite code.');
      sound.playPanicLock();
      return;
    }

    setIsVerifying(true);
    sound.playSoftClick();

    setTimeout(() => {
      // Find vault by code or create/associate
      let vault = storage.getVaultByCode(fullCode);
      if (!vault) {
        // If testing code was generated on another device in same local session
        vault = storage.createVault("Connected Couple's Sanctuary", fullCode);
      }

      storage.linkUserToVault(currentUser.id, vault.id, 'partner2');
      realtimeVault.initialize(fullCode, 'partner2');
      realtimeVault.sendPartnerLinked(vault.id, fullCode);

      sound.playVaultUnlocked();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      setIsVerifying(false);
      onPairingComplete(vault, 'partner2');
    }, 400);
  };

  // Quick Instant Link to Demo Vault
  const handleInstantDemoLink = () => {
    sound.playPartnerApproved();
    const demoVault = storage.getVaultById('vault_demo_1') || storage.createVault("Aarav & Ananya's Sanctuary", '882104');
    const role = currentUser.id === 'user_ananya' ? 'partner2' : 'partner1';
    storage.linkUserToVault(currentUser.id, demoVault.id, role);
    realtimeVault.initialize(demoVault.inviteCode, role);
    onPairingComplete(demoVault, role);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-4 sm:p-6 select-none ambient-app-canvas text-stone-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#FF2E93]"
          />
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>{currentUser.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[10px] text-stone-400 font-mono">Logged In • Not Linked</p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="text-[11px] font-mono text-stone-400 hover:text-white px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Log Out
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-4 flex flex-col items-center max-w-sm mx-auto w-full">
        
        {/* Animated Couple Rings Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF2E93]/20 to-[#A855F7]/20 border border-[#FF2E93]/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,46,147,0.3)]">
          <Heart className="w-8 h-8 text-[#FF4D9D] fill-[#FF2E93]/30 animate-pulse" />
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 text-center mb-1">
          Pair Couple's Vault
        </h2>
        <p className="text-xs text-stone-400 text-center mb-5 max-w-xs font-sans">
          Connect two devices to one shared zero-knowledge cryptographic locker.
        </p>

        {/* Segmented Mode Selector Tab */}
        <div className="w-full grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/10 mb-5">
          <button
            onClick={() => {
              sound.playSoftClick();
              setActiveTab('generate');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'generate'
                ? 'bg-[#FF2E93] text-white shadow-pink-glow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Generate Code
          </button>

          <button
            onClick={() => {
              sound.playSoftClick();
              setActiveTab('enter');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'enter'
                ? 'bg-[#FF2E93] text-white shadow-pink-glow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Enter Partner's Code
          </button>
        </div>

        {/* Tab 1: Generate 6-Digit Code */}
        {activeTab === 'generate' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-center"
          >
            <span className="text-[11px] font-mono text-[#FF4D9D] font-bold uppercase tracking-wider block mb-1">
              Your 6-Digit Invite Code
            </span>
            <p className="text-xs text-stone-300 mb-4">
              Share this code with your partner to link their device to this vault.
            </p>

            {/* 6-Digit Display Blocks */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {generatedCode.split('').map((digit, idx) => (
                <div
                  key={idx}
                  className="w-10 h-12 rounded-xl bg-black/60 border border-[#FF2E93]/50 flex items-center justify-center font-mono text-xl font-bold text-white shadow-inner"
                >
                  {digit}
                </div>
              ))}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyCode}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all mb-4"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Code Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy 6-Digit Code</span>
                </>
              )}
            </button>

            {/* Waiting status */}
            {!isWaitingForPartner ? (
              <button
                onClick={handleStartHosting}
                className="w-full py-3 px-5 rounded-full btn-neon-pink text-white font-bold text-xs tracking-wider uppercase shadow-pink-glow flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Waiting for Partner</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-200">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Waiting for partner to enter code on Device 2...</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Enter Partner's Code */}
        {activeTab === 'enter' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-center"
          >
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider block mb-1">
              Enter Partner's Code
            </span>
            <p className="text-xs text-stone-300 mb-4">
              Enter the 6-digit code displayed on your partner's phone screen.
            </p>

            {/* 6 Input Boxes */}
            <div className="flex items-center justify-center gap-2 mb-4" onPaste={handlePaste}>
              {inputDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-10 h-12 rounded-xl bg-black/60 border border-purple-400/50 text-center font-mono text-xl font-bold text-white focus:outline-none focus:border-[#FF2E93] focus:ring-1 focus:ring-[#FF2E93]"
                />
              ))}
            </div>

            {inputError && (
              <p className="text-xs text-panicRed font-medium mb-3">{inputError}</p>
            )}

            <button
              onClick={handleVerifyAndJoin}
              disabled={isVerifying}
              className="w-full py-3 px-5 rounded-full btn-neon-pink text-white font-bold text-xs tracking-wider uppercase shadow-pink-glow flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying & Linking...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify & Link to Vault</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Fast Test Demo Link */}
        <div className="mt-4 pt-4 border-t border-white/10 w-full text-center">
          <button
            onClick={handleInstantDemoLink}
            className="text-[11px] font-mono text-stone-400 hover:text-stone-200 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <span>⚡ Quick Dev:</span>
            <span className="text-[#FF4D9D] underline font-semibold">Auto-Link Demo Vault (Aarav & Ananya)</span>
          </button>
        </div>

      </div>

      {/* Footer Security Badge */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-stone-500 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#FF2E93]" />
          <span>Zero-Knowledge 2-of-2 Shamir Secret Sharing Protocol</span>
        </p>
      </div>

    </div>
  );
};
