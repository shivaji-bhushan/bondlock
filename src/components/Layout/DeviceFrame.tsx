import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, LayoutGrid, Volume2, VolumeX, RotateCcw, ShieldCheck, Heart } from 'lucide-react';
import { WatermarkLayer } from './WatermarkLayer';
import { sound } from '../../utils/sound';

export type ViewMode = 'single' | 'panorama' | 'desktop';

interface DeviceFrameProps {
  children: React.ReactNode;
  partner1Name: string;
  partner2Name: string;
  watermarkActive: boolean;
  onResetData: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  panoramaContent?: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  partner1Name,
  partner2Name,
  watermarkActive,
  onResetData,
  viewMode,
  onChangeViewMode,
  panoramaContent,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    sound.setMuted(newMuted);
    if (!newMuted) {
      sound.playSoftClick();
    }
  };

  return (
    <div className="min-h-[100dvh] ambient-mulberry-bg text-stone-200 flex flex-col items-center justify-between font-sans relative selection:bg-[#FF2E93] selection:text-white overflow-x-hidden">
      
      {/* Top Controls Ribbon (Compact & Responsive) */}
      <header className="w-full max-w-6xl px-3 py-2 flex items-center justify-between text-xs border-b border-white/10 z-40 bg-[#16051C]/90 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF2E93] to-[#A855F7] flex items-center justify-center text-white shadow-sm shrink-0">
            <Heart className="w-3.5 h-3.5 fill-white" />
          </div>
          <div>
            <span className="font-sans font-bold text-sm tracking-wide text-white">
              BondLock
            </span>
            <span className="hidden md:inline ml-2 px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF4D9D] text-[10px] font-mono border border-[#FF2E93]/30">
              Zero-Knowledge Dual Vault
            </span>
          </div>
        </div>

        {/* View Mode & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl bg-black/40 p-0.5 border border-white/10">
            <button
              onClick={() => {
                sound.playSoftClick();
                onChangeViewMode('single');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold ${
                viewMode === 'single'
                  ? 'btn-neon-pink text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Interactive Mobile Frame"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Phone</span>
            </button>

            <button
              onClick={() => {
                sound.playSoftClick();
                onChangeViewMode('panorama');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold ${
                viewMode === 'panorama'
                  ? 'btn-neon-pink text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="3-Device Panorama Mode"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3-Screens</span>
            </button>

            <button
              onClick={() => {
                sound.playSoftClick();
                onChangeViewMode('desktop');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all text-xs font-semibold ${
                viewMode === 'desktop'
                  ? 'btn-neon-pink text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Fluid Fullscreen Responsive Mode"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-black/30 border-white/10 text-stone-500'
                : 'bg-black/30 border-[#FF2E93]/40 text-[#FF4D9D]'
            }`}
            title={isMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Demo */}
          <button
            onClick={() => {
              if (window.confirm('Reset vault memories and state back to default?')) {
                sound.playSoftClick();
                onResetData();
              }
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-black/30 border border-white/10 text-stone-400 hover:text-stone-200 hover:border-white/20 transition-colors"
            title="Reset vault state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="w-full flex-1 flex items-center justify-center p-0 sm:p-3 md:p-6 overflow-hidden relative">
        <WatermarkLayer
          partner1Name={partner1Name}
          partner2Name={partner2Name}
          active={watermarkActive}
        />

        {viewMode === 'panorama' ? (
          /* 3-Device Panorama Mode */
          <div className="w-full max-w-7xl flex items-center justify-center py-4 px-2 overflow-x-auto">
            {panoramaContent}
          </div>
        ) : viewMode === 'single' ? (
          /* Single Mobile Phone Mockup */
          <div className="relative w-full sm:max-w-[400px] h-[100dvh] sm:h-[min(820px,92vh)] bg-[#120317] sm:rounded-[48px] shadow-phone-frame sm:border-[8px] sm:border-[#380E45] flex flex-col overflow-hidden sm:ring-1 sm:ring-white/20">
            
            {/* Dynamic Island / iOS Notch */}
            <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 select-none z-30 shrink-0">
              <span className="text-xs font-semibold text-stone-200 tracking-tight font-sans">
                {currentTime}
              </span>
              <div className="w-24 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center gap-1.5 px-2">
                <span className="w-2 h-2 rounded-full bg-[#FF2E93] animate-pulse" />
                <span className="text-[9px] font-mono text-stone-400 tracking-wider">BondLock</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-300 text-xs font-mono">
                <span className="text-[10px]">5G</span>
                <div className="w-5 h-2.5 rounded-sm border border-stone-300 p-0.5 flex items-center">
                  <div className="w-full h-full bg-[#FF2E93] rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Inner App Canvas */}
            <div className="flex-1 overflow-y-auto relative scrollbar-none flex flex-col min-h-0">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="hidden sm:flex justify-center pb-2 pt-1 select-none pointer-events-none z-30 bg-[#16051C]/90 shrink-0">
              <div className="w-32 h-1 rounded-full bg-white/25" />
            </div>
          </div>
        ) : (
          /* Fluid Edge-to-Edge Desktop Mode */
          <div className="w-full max-w-4xl min-h-[82vh] bg-[#120317] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative my-2">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full py-2 text-center text-[11px] text-stone-500 font-mono border-t border-white/5 select-none z-20">
        <span>BondLock Zero-Knowledge Cryptographic Locker • 2-of-2 Dual-Device Protection</span>
      </footer>
    </div>
  );
};
