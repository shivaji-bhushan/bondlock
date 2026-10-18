import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Copy, Check, Share2, Database, ExternalLink, Sparkles, Wifi } from 'lucide-react';
import { getSavedSupabaseConfig, saveSupabaseConfig } from '../../utils/supabaseClient';
import { CoupleProfile } from '../../types/vault';
import { sound } from '../../utils/sound';

interface PairDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  coupleProfile: CoupleProfile;
  currentRole: 'partner1' | 'partner2';
  onChangeRole: (role: 'partner1' | 'partner2') => void;
  partnerConnected: boolean;
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  coupleProfile,
  currentRole,
  onChangeRole,
  partnerConnected,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);

  const initialConfig = getSavedSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(initialConfig.anonKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // The link for the OTHER partner to join
  const otherRole = currentRole === 'partner1' ? 'partner2' : 'partner1';
  const otherPartnerName = otherRole === 'partner1' ? coupleProfile.partner1.name : coupleProfile.partner2.name;
  const myPartnerName = currentRole === 'partner1' ? coupleProfile.partner1.name : coupleProfile.partner2.name;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bondlock.vercel.app';
  const pairUrl = `${baseUrl}/?pair=${roomCode}&role=${otherRole}`;

  const handleCopy = () => {
    sound.playSoftClick();
    navigator.clipboard?.writeText(pairUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    sound.playSoftClick();
    const text = encodeURIComponent(
      `💍 BondLock Vault Invitation from ${myPartnerName}:\nOpen this link on your phone to connect our zero-knowledge vault and unlock our memories:\n${pairUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSaveSupabase = () => {
    sound.playSoftClick();
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#18051E] border border-[#FF2E93]/25 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-stone-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF2E93]/15 border border-[#FF2E93]/30 flex items-center justify-center text-[#FF4D9D]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans text-xl font-bold text-white">
                  Real Device Pairing
                </h3>
                <p className="text-xs text-stone-400">
                  Connect both phones across the internet in real-time
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playSoftClick();
                onClose();
              }}
              className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4 overflow-y-auto flex-1">
            {/* Identity Switcher on THIS device */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span className="text-xs text-stone-400 font-sans">This Phone Belongs To:</span>
              <div className="flex rounded-xl bg-white/5 p-0.5 border border-white/10">
                <button
                  onClick={() => onChangeRole('partner1')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentRole === 'partner1'
                      ? 'btn-neon-pink text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {coupleProfile.partner1.name} (Share 1)
                </button>
                <button
                  onClick={() => onChangeRole('partner2')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentRole === 'partner2'
                      ? 'btn-neon-pink text-white shadow-sm'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {coupleProfile.partner2.name} (Share 2)
                </button>
              </div>
            </div>

            {/* Live Connection Status Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              partnerConnected
                ? 'bg-emeraldGlow/10 border-emeraldGlow/30 text-emeraldGlow'
                : 'bg-[#FF2E93]/10 border-[#FF2E93]/30 text-stone-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className={`w-2.5 h-2.5 rounded-full block ${
                    partnerConnected ? 'bg-emeraldGlow' : 'bg-[#FF2E93] animate-ping'
                  }`} />
                  <span className={`w-2.5 h-2.5 rounded-full absolute inset-0 ${
                    partnerConnected ? 'bg-emeraldGlow' : 'bg-[#FF2E93]'
                  }`} />
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    {partnerConnected ? `${otherPartnerName}'s Phone is Connected!` : `Waiting for ${otherPartnerName} to connect...`}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Room Code: <strong className="text-white">{roomCode}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
                <Wifi className="w-3.5 h-3.5 text-[#FF4D9D]" />
                <span>WebSockets</span>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white/5 border border-white/10">
              <p className="text-xs text-stone-300 font-sans mb-3 text-center">
                Scan with <strong>{otherPartnerName}’s Phone Camera</strong>:
              </p>

              <div className="p-3 bg-white rounded-2xl shadow-2xl mb-3">
                <QRCodeSVG
                  value={pairUrl}
                  size={160}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-[11px] text-stone-400 font-mono text-center max-w-xs truncate">
                {pairUrl}
              </p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emeraldGlow" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Pairing Link'}</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>
            </div>

            {/* Supabase Cloud Sync Config Section */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setShowSupabaseSettings(!showSupabaseSettings)}
                className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-white py-1"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#FF4D9D]" />
                  <span>Configure Private Supabase (100% Free Cloud Database)</span>
                </span>
                <span className="text-stone-500 font-mono">{showSupabaseSettings ? '▲' : '▼'}</span>
              </button>

              {showSupabaseSettings && (
                <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                    Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#FF4D9D] underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> and paste your Project URL & Anon Key to store encrypted photos in your own private cloud:
                  </p>

                  <div>
                    <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF2E93]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                      Supabase Anon / Public Key
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF2E93]"
                    />
                  </div>

                  <button
                    onClick={handleSaveSupabase}
                    className="w-full py-2 px-3 rounded-xl btn-neon-pink text-white text-xs font-bold"
                  >
                    {savedSuccess ? 'Connected Successfully!' : 'Save & Connect Supabase'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
