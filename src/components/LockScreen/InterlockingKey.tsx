import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Sparkles, ShieldCheck } from 'lucide-react';

interface InterlockingKeyProps {
  partner1Approved: boolean;
  partner2Approved: boolean;
  partner1Name: string;
  partner2Name: string;
  isUnlocked: boolean;
}

export const InterlockingKey: React.FC<InterlockingKeyProps> = ({
  partner1Approved,
  partner2Approved,
  partner1Name,
  partner2Name,
  isUnlocked,
}) => {
  const bothApproved = partner1Approved && partner2Approved;

  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Outer ambient glow field */}
      <div 
        className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
          bothApproved 
            ? 'bg-rosegold-400/25 scale-125' 
            : partner1Approved || partner2Approved
              ? 'bg-emeraldGlow/20 scale-110'
              : 'bg-obsidian-700/40 scale-95'
        }`}
      />

      {/* Main Interlocking Rings SVG Container */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        
        {/* Orbital connection trajectory line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 240 240">
          <defs>
            <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0A96D" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#4ECCA3" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#E0A96D" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dotted orbital trajectory */}
          <circle
            cx="120"
            cy="120"
            r="82"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            className="animate-spin-slow origin-center opacity-40"
          />
        </svg>

        {/* LEFT KEY HALF (Partner A) */}
        <motion.div
          className="absolute left-1/2 -ml-16 z-20 origin-right"
          animate={{
            x: bothApproved ? -10 : partner1Approved ? -16 : -28,
            scale: bothApproved ? 1.05 : partner1Approved ? 1.02 : 1,
            rotate: bothApproved ? 0 : partner1Approved ? 2 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 240,
            damping: 20,
          }}
        >
          <div className="relative w-28 h-40 flex items-center justify-center">
            {/* Pulsing glow when partner 1 approved */}
            {partner1Approved && !bothApproved && (
              <motion.div
                className="absolute inset-0 rounded-full bg-emeraldGlow/20 blur-md"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              />
            )}

            <svg viewBox="0 0 100 140" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(224,169,109,0.35)]">
              <defs>
                <linearGradient id="partnerAGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={partner1Approved ? '#72DEC2' : '#F5D6B4'} />
                  <stop offset="50%" stopColor={partner1Approved ? '#4ECCA3' : '#E0A96D'} />
                  <stop offset="100%" stopColor={partner1Approved ? '#2EB872' : '#B8742E'} />
                </linearGradient>
              </defs>

              {/* Interlocking Arch / Half-Ring */}
              <path
                d="M 50 15 C 20 15 12 40 12 70 C 12 100 20 125 50 125 C 65 125 76 115 82 102 C 68 100 58 87 58 70 C 58 53 68 40 82 38 C 76 25 65 15 50 15 Z"
                fill="none"
                stroke="url(#partnerAGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Inner Key Notch Teeth */}
              <path
                d="M 58 60 L 72 60 L 72 66 L 58 66 Z M 58 74 L 76 74 L 76 80 L 58 80 Z"
                fill={partner1Approved ? '#4ECCA3' : '#E0A96D'}
                opacity={0.9}
              />

              {/* Share 1 Monogram / Pip */}
              <circle
                cx="35"
                cy="70"
                r="6"
                fill={partner1Approved ? '#4ECCA3' : '#E0A96D'}
                className={partner1Approved ? 'animate-pulse' : ''}
              />
            </svg>
          </div>
        </motion.div>

        {/* RIGHT KEY HALF (Partner B) */}
        <motion.div
          className="absolute right-1/2 -mr-16 z-20 origin-left"
          animate={{
            x: bothApproved ? 10 : partner2Approved ? 16 : 28,
            scale: bothApproved ? 1.05 : partner2Approved ? 1.02 : 1,
            rotate: bothApproved ? 0 : partner2Approved ? -2 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 240,
            damping: 20,
          }}
        >
          <div className="relative w-28 h-40 flex items-center justify-center">
            {/* Pulsing glow when partner 2 approved */}
            {partner2Approved && !bothApproved && (
              <motion.div
                className="absolute inset-0 rounded-full bg-emeraldGlow/20 blur-md"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              />
            )}

            <svg viewBox="0 0 100 140" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(224,169,109,0.35)]">
              <defs>
                <linearGradient id="partnerBGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={partner2Approved ? '#72DEC2' : '#F5D6B4'} />
                  <stop offset="50%" stopColor={partner2Approved ? '#4ECCA3' : '#E0A96D'} />
                  <stop offset="100%" stopColor={partner2Approved ? '#2EB872' : '#B8742E'} />
                </linearGradient>
              </defs>

              {/* Interlocking Arch / Half-Ring */}
              <path
                d="M 50 15 C 80 15 88 40 88 70 C 88 100 80 125 50 125 C 35 125 24 115 18 102 C 32 100 42 87 42 70 C 42 53 32 40 18 38 C 24 25 35 15 50 15 Z"
                fill="none"
                stroke="url(#partnerBGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interlocking Notch Slots */}
              <path
                d="M 42 56 L 28 56 L 28 62 L 42 62 Z M 42 70 L 24 70 L 24 76 L 42 76 Z"
                fill={partner2Approved ? '#4ECCA3' : '#E0A96D'}
                opacity={0.9}
              />

              {/* Share 2 Monogram / Pip */}
              <circle
                cx="65"
                cy="70"
                r="6"
                fill={partner2Approved ? '#4ECCA3' : '#E0A96D'}
                className={partner2Approved ? 'animate-pulse' : ''}
              />
            </svg>
          </div>
        </motion.div>

        {/* Central Core Emblem (Interlocking Union Heart / Padlock) */}
        <div className="absolute z-30 flex items-center justify-center">
          <motion.div
            className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 ${
              bothApproved
                ? 'bg-rosegold-400 text-obsidian-950 border-rosegold-200 shadow-rosegold-glow'
                : partner1Approved || partner2Approved
                  ? 'bg-obsidian-800/90 text-emeraldGlow border-emeraldGlow/50 shadow-emerald-glow'
                  : 'bg-obsidian-850/80 text-rosegold-400/60 border-rosegold-400/20'
            }`}
            animate={{
              scale: bothApproved ? [1, 1.25, 1.1] : [1, 1.04, 1],
            }}
            transition={{
              repeat: bothApproved ? 0 : Infinity,
              duration: bothApproved ? 0.6 : 3,
              ease: 'easeInOut',
            }}
          >
            <AnimatePresence mode="wait">
              {bothApproved ? (
                <motion.div
                  key="unlocked"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className="flex items-center justify-center"
                >
                  <Unlock className="w-6 h-6 stroke-[2.5]" />
                </motion.div>
              ) : partner1Approved || partner2Approved ? (
                <motion.div
                  key="half-approved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex items-center justify-center"
                >
                  <Lock className="w-6 h-6 stroke-[2]" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emeraldGlow animate-ping" />
                </motion.div>
              ) : (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <Lock className="w-6 h-6 stroke-[1.75]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Merged Rose-Gold Particle Burst Flare */}
        <AnimatePresence>
          {bothApproved && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full border-2 border-rosegold-300 pointer-events-none z-40 bg-gradient-to-r from-rosegold-300/40 via-champagne/30 to-rosegold-500/40 blur-sm"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Visual Status Feedback */}
      <div className="mt-3 text-center min-h-[3.25rem] flex flex-col items-center justify-center">
        {bothApproved ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-rosegold-300 font-serif text-lg tracking-wide font-medium"
          >
            <Sparkles className="w-4 h-4 text-rosegold-400 animate-spin-slow" />
            <span>Dual Keys Interlocked • Decrypting Vault...</span>
          </motion.div>
        ) : partner1Approved && !partner2Approved ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-2 text-emeraldGlow font-sans text-sm font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emeraldGlow animate-ping" />
              <span>{partner1Name} Approved • Waiting for {partner2Name}...</span>
            </div>
            <p className="text-stone-400 text-xs mt-1 font-mono">
              Key Share 1 injected • Share 2 required to reconstruct secret
            </p>
          </motion.div>
        ) : !partner1Approved && partner2Approved ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-2 text-emeraldGlow font-sans text-sm font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emeraldGlow animate-ping" />
              <span>{partner2Name} Approved • Waiting for {partner1Name}...</span>
            </div>
            <p className="text-stone-400 text-xs mt-1 font-mono">
              Key Share 2 injected • Share 1 required to reconstruct secret
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-stone-400 font-sans text-xs uppercase tracking-widest font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-rosegold-400/80" />
              <span>2-of-2 Cryptographic Threshold Lock</span>
            </div>
            <p className="text-stone-400 text-xs mt-1">
              Both partners must grant biometric consent simultaneously
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
