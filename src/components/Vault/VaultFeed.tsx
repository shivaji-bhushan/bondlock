import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, SlidersHorizontal, ArrowUpRight, Plus, Eye, EyeOff, ShieldAlert, Sparkles, Heart, Lock, Search } from 'lucide-react';
import { Memory, CoupleProfile } from '../../types/vault';
import { SessionBar } from './SessionBar';
import { MemoryModal } from './MemoryModal';
import { AddMemoryModal } from './AddMemoryModal';
import { sound } from '../../utils/sound';

interface VaultFeedProps {
  coupleProfile: CoupleProfile;
  memories: Memory[];
  onAddMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
  onPanicLock: () => void;
  onSessionExpired: () => void;
  onOpenSecurity: () => void;
  onOpenSettings: () => void;
}

export const VaultFeed: React.FC<VaultFeedProps> = ({
  coupleProfile,
  memories,
  onAddMemory,
  onDeleteMemory,
  onPanicLock,
  onSessionExpired,
  onOpenSecurity,
  onOpenSettings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [globalBlur, setGlobalBlur] = useState(true);
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find a hero featured memory
  const heroMemory = memories.find((m) => m.type === 'photo') || memories[0];

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory =
      selectedCategory === 'all' ? true : mem.type === selectedCategory;

    const matchesQuery =
      searchQuery.trim() === ''
        ? true
        : mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mem.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="relative min-h-full flex flex-col p-4 sm:p-5 pb-24 ambient-app-canvas text-stone-200">
      
      {/* Top Header matching reference center phone: Avatar + Name + 2 Circular Frosted Buttons */}
      <div className="flex items-center justify-between pt-1 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar with hot magenta story ring */}
          <div className="relative cursor-pointer" onClick={onOpenSettings}>
            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#FF2E93] via-[#A855F7] to-[#FF4D9D] shadow-pink-subtle">
              <img
                src={coupleProfile.partner2.avatar}
                alt="Couple Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emeraldGlow border-2 border-[#120317]" />
          </div>

          <div>
            <h2 className="font-sans text-base font-bold text-white flex items-center gap-1.5 leading-tight">
              <span>{coupleProfile.partner1.name} & {coupleProfile.partner2.name}</span>
            </h2>
            <p className="text-[11px] text-stone-400 font-sans">
              Welcome to Sanctuary
            </p>
          </div>
        </div>

        {/* Right Action Icons: Bell + Sliders */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPanicLock();
              onPanicLock();
            }}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-panicRed hover:bg-white/15 transition-colors"
            title="Instant Panic Lock"
          >
            <ShieldAlert className="w-4 h-4 text-panicRed" />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/15 transition-colors"
            title="Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Session Security Bar */}
      <SessionBar
        totalSeconds={300}
        onTimeExpired={onSessionExpired}
        onPanicLock={onPanicLock}
      />

      {/* Hero Featured Card matching reference center phone */}
      {heroMemory && (
        <div
          onClick={() => {
            sound.playSoftClick();
            setActiveMemory(heroMemory);
          }}
          className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-3xl overflow-hidden cursor-pointer shadow-2xl mb-6 group border border-white/10"
        >
          <img
            src={heroMemory.mediaUrl || 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=85'}
            alt={heroMemory.title}
            className={`w-full h-full object-cover transition-all duration-700 ${
              globalBlur ? 'blur-md scale-105 group-hover:blur-none group-hover:scale-100' : 'blur-none scale-100'
            }`}
          />
          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-4">
            <span className="self-start px-2.5 py-1 rounded-full bg-[#FF2E93]/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider mb-1.5 shadow-sm">
              Long-term Sanctuary
            </span>
            <h3 className="font-sans text-lg sm:text-xl font-bold text-white group-hover:text-[#FF4D9D] transition-colors leading-snug">
              {heroMemory.title}
            </h3>
            <p className="text-xs text-stone-300 font-sans line-clamp-1 mt-0.5">
              {heroMemory.location || 'Encrypted Moment'} • Tap to reveal
            </p>
          </div>
        </div>
      )}

      {/* Section Header: "goal- driven dating" -> "Curated Moments" with "view all" & Filter Pills */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-sans text-sm font-bold text-white lowercase tracking-wide">
          curated precious moments
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playSoftClick();
              setGlobalBlur(!globalBlur);
            }}
            className="text-[11px] text-[#FF4D9D] hover:underline flex items-center gap-1 font-medium"
          >
            {globalBlur ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{globalBlur ? 'unmask all' : 'mask'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills matching reference */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-3">
        {[
          { id: 'all', label: 'All Vault' },
          { id: 'photo', label: 'Photos & Videos' },
          { id: 'note', label: 'Secret Notes' },
          { id: 'audio', label: 'Audio Memos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sound.playSoftClick();
              setSelectedCategory(tab.id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-white text-black shadow-md'
                : 'glass-pill text-stone-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2-Column Grid Matching Reference Image Exactly */}
      <div className="grid grid-cols-2 gap-3">
        {filteredMemories.map((mem) => {
          return (
            <motion.div
              key={mem.id}
              whileHover={{ y: -3 }}
              onClick={() => {
                sound.playSoftClick();
                setActiveMemory(mem);
              }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10 group flex flex-col justify-between p-3 bg-[#1C0824]"
            >
              {/* Background media / gradient */}
              {mem.mediaUrl ? (
                <img
                  src={mem.mediaUrl}
                  alt={mem.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                    globalBlur ? 'blur-md scale-110 group-hover:blur-none group-hover:scale-100' : 'blur-none'
                  }`}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D0B38] via-[#1B0623] to-[#110316]" />
              )}

              {/* Dark Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

              {/* Top Row: Badge + Arrow */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="glass-pill px-2 py-0.5 rounded-full text-[10px] font-mono text-stone-200 flex items-center gap-1">
                  <span>🔒</span>
                  <span>2/2 SSS</span>
                </span>
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#FF2E93] transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Bottom Content */}
              <div className="relative z-10">
                <h4 className="font-sans text-sm font-bold text-white group-hover:text-[#FF4D9D] transition-colors line-clamp-1">
                  {mem.title}
                </h4>
                <p className="text-[11px] text-stone-300 font-sans line-clamp-1 mt-0.5">
                  {mem.type === 'audio' ? '🎵 Voice Recording' : mem.location || 'Secret Note'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Add Memory Button */}
      <button
        onClick={() => {
          sound.playSoftClick();
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-20 right-6 z-40 w-12 h-12 rounded-full btn-neon-pink flex items-center justify-center text-white shadow-pink-glow cursor-pointer hover:scale-105 transition-all"
        title="Add Memory"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Detail Modal Lightbox */}
      <MemoryModal
        memory={activeMemory}
        onClose={() => setActiveMemory(null)}
        onDelete={onDeleteMemory}
      />

      {/* Add Memory Modal with AES-256 Progress Indicator */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMemory={onAddMemory}
      />
    </div>
  );
};
