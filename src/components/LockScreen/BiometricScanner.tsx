import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, ScanFace, Check, Key } from 'lucide-react';
import { Partner } from '../../types/vault';
import { sound } from '../../utils/sound';

interface BiometricScannerProps {
  partner: Partner;
  isApproved: boolean;
  onApprove: () => void;
  onRevoke: () => void;
  waitingForOther: boolean;
  accentColor?: string;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  partner,
  isApproved,
  onApprove,
  onRevoke,
  waitingForOther,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleTriggerScan = () => {
    if (isApproved) {
      sound.playSoftClick();
      onRevoke();
      return;
    }

    setIsScanning(true);
    sound.playBiometricScan();

    setTimeout(() => {
      setIsScanning(false);
      sound.playPartnerApproved();
      onApprove();
    }, 700);
  };

  const isFaceID = partner.biometricType === 'Face ID';

  return (
    <div className="flex flex-col items-center w-full max-w-[170px] sm:max-w-[190px]">
      {/* Partner Avatar with Glowing Border */}
      <div className="relative group mb-3">
        {/* Pulsing ring when approved */}
        {isApproved && (
          <motion.div
            className="absolute -inset-1.5 rounded-full bg-emeraldGlow/40 blur-sm"
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.3, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        )}

        <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 transition-all duration-300 ${
          isApproved 
            ? 'border-2 border-emeraldGlow shadow-emerald-glow' 
            : isScanning
              ? 'border-2 border-rosegold-400 shadow-rosegold-glow'
              : 'border border-rosegold-400/30 group-hover:border-rosegold-400/60'
        }`}>
          <img
            src={partner.avatar}
            alt={partner.name}
            className="w-full h-full object-cover rounded-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
          />

          {/* Top-right Status Pip */}
          <div className={`absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-obsidian-900 text-xs shadow-md ${
            isApproved 
              ? 'bg-emeraldGlow text-obsidian-950' 
              : 'bg-obsidian-800 text-stone-400'
          }`}>
            {isApproved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Key className="w-3 h-3 text-rosegold-400/70" />}
          </div>
        </div>
      </div>

      {/* Name & Device Info */}
      <h3 className="font-serif text-lg sm:text-xl text-stone-100 font-semibold tracking-wide text-center">
        {partner.name}
      </h3>
      <p className="text-[11px] text-rosegold-300/80 font-mono tracking-tight text-center truncate max-w-full">
        {partner.keyShareId}
      </p>

      {/* Interactive Biometric Trigger Button */}
      <div className="w-full mt-3">
        <motion.button
          onClick={handleTriggerScan}
          disabled={isScanning}
          whileTap={{ scale: 0.96 }}
          className={`relative w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all duration-300 overflow-hidden ${
            isApproved
              ? 'bg-emeraldGlow/15 text-emeraldGlow border border-emeraldGlow/40 hover:bg-emeraldGlow/25 shadow-emerald-glow'
              : isScanning
                ? 'bg-rosegold-400/20 text-rosegold-300 border border-rosegold-400/60 animate-pulse'
                : 'bg-obsidian-800/90 text-stone-200 border border-rosegold-400/20 hover:border-rosegold-400/60 hover:bg-obsidian-750'
          }`}
        >
          {/* Scanning radar sweep animation */}
          {isScanning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-rosegold-400/25 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
            />
          )}

          {isApproved ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Share Active</span>
            </>
          ) : isScanning ? (
            <>
              {isFaceID ? <ScanFace className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4 animate-pulse" />}
              <span>Verifying...</span>
            </>
          ) : (
            <>
              {isFaceID ? <ScanFace className="w-4 h-4 text-rosegold-400" /> : <Fingerprint className="w-4 h-4 text-rosegold-400" />}
              <span>Scan {partner.biometricType}</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Subtle indicator message */}
      <div className="mt-1.5 text-center min-h-[1.2rem]">
        {isApproved ? (
          <span className="text-[10px] text-emeraldGlow/90 font-mono">
            {waitingForOther ? 'Waiting for partner…' : 'Consent confirmed'}
          </span>
        ) : (
          <span className="text-[10px] text-stone-400 font-mono">
            Requires {partner.name}
          </span>
        )}
      </div>
    </div>
  );
};
