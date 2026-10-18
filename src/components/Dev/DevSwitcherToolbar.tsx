import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Users, Unlink, Link2, Sparkles, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { sound } from '../../utils/sound';

interface DevSwitcherToolbarProps {
  currentRole: 'partner1' | 'partner2';
  partner1Name: string;
  partner2Name: string;
  isLinkedToVault: boolean;
  onSwitchPartner: (role: 'partner1' | 'partner2') => void;
  onToggleUnlinkVault: () => void;
  vaultCode?: string;
}

export const DevSwitcherToolbar: React.FC<DevSwitcherToolbarProps> = ({
  currentRole,
  partner1Name,
  partner2Name,
  isLinkedToVault,
  onSwitchPartner,
  onToggleUnlinkVault,
  vaultCode = '882104',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isPartnerA = currentRole === 'partner1';

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-lg pointer-events-auto">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="backdrop-blur-xl bg-black/85 border border-white/20 rounded-2xl shadow-2xl p-2 text-white select-none transition-all ring-1 ring-white/10"
      >
        <div className="flex items-center justify-between px-2 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-amber-300 flex items-center gap-1">
              <span>🛠️ DEV SWITCHER</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
              (Multi-Device Testing)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
              Active: <strong className={isPartnerA ? 'text-emerald-400' : 'text-purple-400'}>
                {isPartnerA ? `${partner1Name} (Dev 1)` : `${partner2Name} (Dev 2)`}
              </strong>
            </span>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              title={isCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10">
                {/* Switch to Partner A (Device 1) */}
                <button
                  onClick={() => {
                    sound.playSoftClick();
                    onSwitchPartner('partner1');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isPartnerA
                      ? 'bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'bg-white/5 border border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isPartnerA ? 'bg-emerald-400' : 'bg-stone-500'}`} />
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="truncate">Partner A (Device 1)</span>
                </button>

                {/* Switch to Partner B (Device 2) */}
                <button
                  onClick={() => {
                    sound.playSoftClick();
                    onSwitchPartner('partner2');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                    !isPartnerA
                      ? 'bg-purple-500/25 border border-purple-400/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 border border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!isPartnerA ? 'bg-purple-400' : 'bg-stone-500'}`} />
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate">Partner B (Device 2)</span>
                </button>
              </div>

              {/* Utility row: Toggle Pairing/Unlink Screen */}
              <div className="mt-1.5 pt-1.5 flex items-center justify-between gap-2 text-[10px] text-stone-400 border-t border-white/5 px-1 font-mono">
                <span className="flex items-center gap-1">
                  <span>Vault Code:</span>
                  <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">{vaultCode}</span>
                </span>

                <button
                  onClick={() => {
                    sound.playSoftClick();
                    onToggleUnlinkVault();
                  }}
                  className={`px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                    isLinkedToVault
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  }`}
                  title={isLinkedToVault ? 'Test onboarding screen (Unlink vault)' : 'Relink to demo vault'}
                >
                  {isLinkedToVault ? (
                    <>
                      <Unlink className="w-3 h-3" />
                      <span>Test Pairing Screen (Unlink)</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" />
                      <span>Relink to Vault</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
