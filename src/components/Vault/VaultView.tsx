import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, EyeOff, Search, Sparkles, Image as ImageIcon, FileText, Mic, Heart, Shield, Lock } from 'lucide-react';
import { Memory, MemoryType, CoupleProfile } from '../../types/vault';
import { SessionBar } from './SessionBar';
import { MemoryGrid } from './MemoryGrid';
import { MemoryModal } from './MemoryModal';
import { AddMemoryModal } from './AddMemoryModal';
import { sound } from '../../utils/sound';

interface VaultViewProps {
  coupleProfile: CoupleProfile;
  memories: Memory[];
  onAddMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
  onPanicLock: () => void;
  onSessionExpired: () => void;
  onOpenSecurity: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  coupleProfile,
  memories,
  onAddMemory,
  onDeleteMemory,
  onPanicLock,
  onSessionExpired,
  onOpenSecurity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalBlur, setGlobalBlur] = useState(true);
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter memories
  const filteredMemories = memories.filter((mem) => {
    const matchesCategory =
      selectedCategory === 'all' ? true : mem.type === selectedCategory;

    const matchesQuery =
      searchQuery.trim() === ''
        ? true
        : mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mem.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mem.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  const categories = [
    { id: 'all', label: 'All Precious Moments', count: memories.length, icon: Sparkles },
    { id: 'photo', label: 'Photos & Videos', count: memories.filter((m) => m.type === 'photo').length, icon: ImageIcon },
    { id: 'note', label: 'Secret Notes', count: memories.filter((m) => m.type === 'note').length, icon: FileText },
    { id: 'audio', label: 'Audio Memos', count: memories.filter((m) => m.type === 'audio').length, icon: Mic },
  ];

  return (
    <div className="relative min-h-full flex flex-col py-5 px-3 sm:px-6">
      {/* Top Session Bar (Countdown & Instant Panic Lock) */}
      <SessionBar
        totalSeconds={300}
        onTimeExpired={onSessionExpired}
        onPanicLock={onPanicLock}
      />

      {/* Vault Header & Profile Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-100 font-bold tracking-wide">
              {coupleProfile.vaultName}
            </h2>
            <button
              onClick={() => {
                sound.playSoftClick();
                onOpenSecurity();
              }}
              className="p-1 rounded-full text-rosegold-400 hover:text-rosegold-300"
              title="Shamir Threshold Status"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Decrypted feed for <span className="text-rosegold-300 font-medium">{coupleProfile.partner1.name}</span> & <span className="text-rosegold-300 font-medium">{coupleProfile.partner2.name}</span>
          </p>
        </div>

        {/* Action Controls: Blur Toggle & Add Memory */}
        <div className="flex items-center gap-2">
          {/* Global Privacy Blur Toggle */}
          <button
            onClick={() => {
              sound.playSoftClick();
              setGlobalBlur(!globalBlur);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              globalBlur
                ? 'bg-obsidian-800 text-stone-300 border border-white/10 hover:border-white/20'
                : 'bg-rosegold-400/20 text-rosegold-300 border border-rosegold-400/40 shadow-sm'
            }`}
            title={globalBlur ? 'Reveal all memories' : 'Blur all memories'}
          >
            {globalBlur ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{globalBlur ? 'Unmask All' : 'Privacy Blur On'}</span>
          </button>

          {/* Add New Memory Button */}
          <button
            onClick={() => {
              sound.playSoftClick();
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rosegold-400 to-rosegold-500 hover:to-rosegold-600 text-obsidian-950 font-bold text-xs flex items-center gap-1.5 shadow-rosegold-glow transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Seal Moment</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Memory Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playSoftClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-rosegold-400 text-obsidian-950 font-bold shadow-rosegold-subtle'
                    : 'bg-obsidian-850/80 text-stone-400 hover:text-stone-200 border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-obsidian-950/20 text-obsidian-950' : 'bg-white/10 text-stone-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search moments, tags, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400/50 text-stone-200 placeholder-stone-500 text-xs focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Main Precious Moments Masonry Feed */}
      <div className="flex-1 pb-10">
        <MemoryGrid
          memories={filteredMemories}
          onSelectMemory={(mem) => {
            sound.playSoftClick();
            setActiveMemory(mem);
          }}
          globalBlur={globalBlur}
        />
      </div>

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
