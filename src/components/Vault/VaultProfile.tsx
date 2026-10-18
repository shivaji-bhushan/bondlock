import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Settings, Check, Lock, Star, Zap, AlertTriangle, ArrowRight, Sparkles, LogOut, User } from 'lucide-react';
import { CoupleProfile, SecuritySettings } from '../../types/vault';
import { sound } from '../../utils/sound';

interface VaultProfileProps {
  coupleProfile: CoupleProfile;
  securitySettings: SecuritySettings;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
  onBackToFeed: () => void;
  onFreezeVault: () => void;
  authenticatedUser?: 'partner1' | 'partner2' | null;
  onOpenUserProfile?: () => void;
  onLogout?: () => void;
}

export const VaultProfile: React.FC<VaultProfileProps> = ({
  coupleProfile,
  securitySettings,
  onOpenSecurity,
  onOpenSettings,
  onBackToFeed,
  onFreezeVault,
  authenticatedUser,
  onOpenUserProfile,
  onLogout,
}) => {
  return (
    <div className="relative min-h-full flex flex-col p-4 sm:p-5 pb-24 ambient-app-canvas text-stone-200">
      
      {/* Top Header matching reference: < Profile with Shield & Gear */}
      <div className="flex items-center justify-between pt-1 mb-5">
        <button
          onClick={onBackToFeed}
          className="flex items-center gap-1 text-sm font-semibold text-stone-200 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5 text-stone-400" />
          <span>Profile</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSecurity}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-white"
            title="Cryptographic Architecture"
          >
            <Shield className="w-4 h-4 text-neonPink-400" />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-white"
            title="Edit Names & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Center Avatar with Glowing Pink Ring */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#FF2E93] via-[#A855F7] to-[#FF4D9D] shadow-pink-glow">
            <img
              src={coupleProfile.partner2.avatar}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <h3 className="font-sans text-xl font-bold text-white flex items-center gap-2">
          <span>{coupleProfile.partner1.name} & {coupleProfile.partner2.name}</span>
          <span className="w-4 h-4 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold">
            ✓
          </span>
        </h3>
        <p className="text-xs text-stone-400 font-mono mt-0.5">
          {coupleProfile.vaultName} • 2-of-2 SSS Active
        </p>

        {/* Identified User Pill */}
        {authenticatedUser && (
          <button
            onClick={() => {
              sound.playSoftClick();
              if (onOpenUserProfile) onOpenUserProfile();
            }}
            className="mt-2.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-[#FF2E93]/40 flex items-center gap-1.5 text-xs text-stone-200 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-[#FF4D9D]" />
            <span>Active Partner: <strong className="text-white">{authenticatedUser === 'partner1' ? coupleProfile.partner1.name : coupleProfile.partner2.name}</strong></span>
            <span className="text-[10px] text-[#FF4D9D] ml-0.5 underline">View Profile</span>
          </button>
        )}
      </div>

      {/* 100% Dual-Key Protected Card matching reference (50% complete card) */}
      <div className="glass-card-reference rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Progress circle */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#FF2E93]"
                strokeDasharray="100, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-white">
              100%
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white leading-tight">
              Dual-Key Synchronization
            </h4>
            <p className="text-[11px] text-stone-400">
              Both partner shares verified in memory
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-stone-200 border border-white/10 transition-colors"
        >
          Edit
        </button>
      </div>

      {/* BondLock Zero-Knowledge Tier Card matching reference (Tinder Gold upgrade card) */}
      <div className="glass-card-reference rounded-3xl p-5 mb-5 relative overflow-hidden bg-gradient-to-br from-[#2E0B38] via-[#1A0623] to-[#110316] border border-[#FF2E93]/25">
        
        {/* Top Tier Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FF2E93] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <span className="font-sans text-base font-bold text-white">
              BondLock Zero-Knowledge
            </span>
          </div>

          <span className="px-3 py-1 rounded-full btn-neon-pink text-[11px] font-bold text-white shadow-sm">
            Active
          </span>
        </div>

        {/* Feature Comparison Rows */}
        <div className="text-xs space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-white/5 pb-1 font-mono">
            <span>Security Architecture</span>
            <div className="flex items-center gap-4 text-stone-300">
              <span>Standard</span>
              <span className="text-[#FF4D9D] font-bold">BondLock</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-stone-200">
            <span>2-of-2 Shamir Secret Sharing</span>
            <div className="flex items-center gap-6">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <Check className="w-4 h-4 text-[#4ECCA3] stroke-[3]" />
            </div>
          </div>

          <div className="flex items-center justify-between text-stone-200">
            <span>Anti-Screenshot Holographic Shield</span>
            <div className="flex items-center gap-6">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <Check className="w-4 h-4 text-[#4ECCA3] stroke-[3]" />
            </div>
          </div>

          <div className="flex items-center justify-between text-stone-200">
            <span>Ephemeral RAM Key Zeroization</span>
            <div className="flex items-center gap-6">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <Check className="w-4 h-4 text-[#4ECCA3] stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Clickable footer */}
        <button
          onClick={onOpenSecurity}
          className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-between text-xs text-[#FF4D9D] font-bold hover:underline"
        >
          <span>See All Security Specs & Polynomial Graph</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action Cards matching reference (Super Likes / Boosts cards) */}
      <div className="space-y-2.5">
        <div
          onClick={onOpenSecurity}
          className="glass-card-reference rounded-2xl p-3.5 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7]">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Shamir Secret Key Curve</h5>
              <p className="text-[11px] text-stone-400">Zero bits revealed with 1 share</p>
            </div>
          </div>
          <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-stone-200 text-sm font-bold">
            +
          </span>
        </div>

        <div
          onClick={onOpenSecurity}
          className="glass-card-reference rounded-2xl p-3.5 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FF2E93]/20 border border-[#FF2E93]/30 flex items-center justify-center text-[#FF2E93]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Paper Recovery Seed Sheets</h5>
              <p className="text-[11px] text-stone-400">12-word physical backup keys</p>
            </div>
          </div>
          <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-stone-200 text-sm font-bold">
            +
          </span>
        </div>

        {/* Emergency Freeze Button */}
        <button
          onClick={() => {
            if (window.confirm('EMERGENCY VAULT FREEZE: Lockdown vault immediately?')) {
              sound.playPanicLock();
              onFreezeVault();
            }
          }}
          className="w-full mt-2 py-3 px-4 rounded-2xl bg-panicRed/15 border border-panicRed/30 text-panicRed text-xs font-bold flex items-center justify-center gap-2 hover:bg-panicRed/25 transition-all shadow-panic-glow"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Emergency Freeze Vault</span>
        </button>

        {/* Log Out Button */}
        {onLogout && (
          <button
            onClick={() => {
              if (window.confirm('Log out and lock vault?')) {
                sound.playSoftClick();
                onLogout();
              }
            }}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#FF4D9D]" />
            <span>Log Out & Switch Partner</span>
          </button>
        )}
      </div>
    </div>
  );
};
