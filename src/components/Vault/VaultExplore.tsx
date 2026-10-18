import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight, Search, Sparkles, Filter, Lock } from 'lucide-react';
import { Memory, CoupleProfile } from '../../types/vault';
import { MemoryModal } from './MemoryModal';
import { sound } from '../../utils/sound';

interface VaultExploreProps {
  coupleProfile: CoupleProfile;
  memories: Memory[];
  onDeleteMemory: (id: string) => void;
}

export const VaultExplore: React.FC<VaultExploreProps> = ({
  coupleProfile,
  memories,
  onDeleteMemory,
}) => {
  const [filter, setFilter] = useState('all');
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);

  const chips = [
    { id: 'all', label: 'All Vault' },
    { id: 'travel', label: 'Travel & Trips' },
    { id: 'romance', label: 'Milestones' },
    { id: 'audio', label: 'Voice Notes' },
  ];

  const filtered = memories.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'audio') return m.type === 'audio';
    if (filter === 'travel') return m.tags.some((t) => ['travel', 'positano', 'florence', 'manali'].includes(t.toLowerCase()));
    if (filter === 'romance') return m.tags.some((t) => ['proposal', 'milestone', 'first date'].includes(t.toLowerCase()));
    return true;
  });

  return (
    <div className="relative min-h-full flex flex-col p-4 sm:p-5 pb-24 ambient-app-canvas text-stone-200">
      
      {/* Header matching reference 2: Discover + Bell + Message */}
      <div className="flex items-center justify-between pt-1 mb-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-white tracking-tight">
            Discover Memories
          </h2>
          <p className="text-xs text-stone-400 font-sans">
            Visual timeline of your journey together
          </p>
        </div>

        <span className="glass-pill px-3 py-1 rounded-full text-xs font-mono text-[#FF4D9D]">
          {filtered.length} Moments
        </span>
      </div>

      {/* Pill Filters matching Reference 2: Near by, Online now, New profile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-4">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => {
              sound.playSoftClick();
              setFilter(chip.id);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === chip.id
                ? 'bg-white text-black shadow-md'
                : 'glass-pill text-stone-300 hover:text-white'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 2-Column Grid matching reference 2 */}
      <div className="grid grid-cols-2 gap-3.5">
        {filtered.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -3 }}
            onClick={() => {
              sound.playSoftClick();
              setActiveMemory(item);
            }}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10 group flex flex-col justify-between p-3 bg-[#1C0824]"
          >
            {item.mediaUrl ? (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#300C3C] via-[#1B0523] to-[#0E0213]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

            {/* Top row */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-300 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                {item.date}
              </span>
              <button
                className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 hover:bg-[#FF2E93] hover:text-white transition-colors"
                title="Favorite"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Bottom info matching reference image: Title + time left / location */}
            <div className="relative z-10">
              <h4 className="font-sans text-sm font-bold text-white group-hover:text-[#FF4D9D] transition-colors line-clamp-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-stone-300 font-sans line-clamp-1 mt-0.5">
                {item.location || 'Encrypted Sanctuary'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <MemoryModal
        memory={activeMemory}
        onClose={() => setActiveMemory(null)}
        onDelete={onDeleteMemory}
      />
    </div>
  );
};
