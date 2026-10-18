import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Timer, Lock, RefreshCw } from 'lucide-react';
import { sound } from '../../utils/sound';

interface SessionBarProps {
  totalSeconds: number;
  onTimeExpired: () => void;
  onPanicLock: () => void;
}

export const SessionBar: React.FC<SessionBarProps> = ({
  totalSeconds,
  onTimeExpired,
  onPanicLock,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeExpired]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    sound.playSoftClick();
    setSecondsLeft((prev) => Math.min(prev + 300, 1800)); // +5 minutes
  };

  const percentage = (secondsLeft / totalSeconds) * 100;
  const isUrgent = secondsLeft < 60;

  return (
    <div className="w-full glass-panel rounded-2xl p-3 sm:p-4 mb-5 border border-rosegold-400/20 shadow-lg relative overflow-hidden">
      {/* Background countdown line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-obsidian-800">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-panicRed animate-pulse' : 'bg-gradient-to-r from-rosegold-400 to-emeraldGlow'
          }`}
          style={{ width: `${Math.max(percentage, 0)}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Cryptographic Session Badge */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emeraldGlow animate-ping absolute inset-0 opacity-75" />
            <div className="w-2.5 h-2.5 rounded-full bg-emeraldGlow relative" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-xs font-semibold text-stone-200">
                Decrypted Ephemeral Session
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emeraldGlow/10 text-emeraldGlow border border-emeraldGlow/30">
                2/2 Shares in RAM
              </span>
            </div>
            <p className="text-[10px] text-stone-400 font-mono">
              AES-256-GCM symmetric key reconstructed
            </p>
          </div>
        </div>

        {/* Right: Countdown Timer & Panic Lock Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Countdown Indicator */}
          <div
            onClick={handleExtendSession}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-colors ${
              isUrgent
                ? 'bg-panicRed/15 border-panicRed/40 text-panicRed animate-pulse'
                : 'bg-obsidian-850/80 border-rosegold-400/20 text-rosegold-300 hover:border-rosegold-400/40'
            }`}
            title="Click to add +5 minutes to session"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="font-mono text-xs font-bold tracking-wider">
              {formatTime(secondsLeft)}
            </span>
            <RefreshCw className="w-3 h-3 text-stone-500 hover:text-stone-300 ml-0.5" />
          </div>

          {/* Prominent Instant Panic Lock Button */}
          <motion.button
            onClick={() => {
              sound.playPanicLock();
              onPanicLock();
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-panicRed/20 hover:bg-panicRed text-panicRed hover:text-white border border-panicRed/40 font-semibold text-xs tracking-wide transition-all shadow-panic-glow"
          >
            <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
            <span className="font-bold">Instant Panic Lock</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
