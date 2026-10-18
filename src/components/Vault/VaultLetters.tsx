import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Eye, EyeOff, Lock, Heart, Calendar } from 'lucide-react';
import { Memory, CoupleProfile } from '../../types/vault';
import { MemoryModal } from './MemoryModal';
import { AddMemoryModal } from './AddMemoryModal';
import { sound } from '../../utils/sound';

interface VaultLettersProps {
  coupleProfile: CoupleProfile;
  memories: Memory[];
  onAddMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
}

export const VaultLetters: React.FC<VaultLettersProps> = ({
  coupleProfile,
  memories,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [unblurredIds, setUnblurredIds] = useState<Record<string, boolean>>({});

  const letterMemories = memories.filter((m) => m.type === 'note');

  const toggleBlur = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSoftClick();
    setUnblurredIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative min-h-full flex flex-col p-4 sm:p-5 pb-24 ambient-app-canvas text-stone-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pt-1 mb-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
            <span>Secret Sealed Letters</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FF2E93]/20 text-[#FF4D9D] text-xs font-mono">
              {letterMemories.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 font-sans">
            Encrypted thoughts only unlocked by dual consent
          </p>
        </div>

        <button
          onClick={() => {
            sound.playSoftClick();
            setIsAddModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-full btn-neon-pink text-xs font-bold text-white flex items-center gap-1.5 shadow-pink-glow"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Write Letter</span>
        </button>
      </div>

      {/* Letters List */}
      <div className="space-y-3.5">
        {letterMemories.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Heart className="w-8 h-8 text-[#FF2E93] mx-auto mb-2 opacity-60" />
            <p className="text-sm">No letters written yet.</p>
            <p className="text-xs text-stone-500 mt-1">Write your first sealed letter for your partner.</p>
          </div>
        ) : (
          letterMemories.map((note) => {
            const isRevealed = !!unblurredIds[note.id];
            return (
              <motion.div
                key={note.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  sound.playSoftClick();
                  setActiveMemory(note);
                }}
                className="glass-card-reference rounded-2xl p-4.5 cursor-pointer relative overflow-hidden bg-gradient-to-br from-[#200A28] via-[#16051C] to-[#0F0314] border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#FF4D9D]">
                    <FileText className="w-4 h-4" />
                    <span>Sealed Love Letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {note.date}
                    </span>
                    <button
                      onClick={(e) => toggleBlur(note.id, e)}
                      className="p-1 rounded-full text-stone-400 hover:text-white"
                      title={isRevealed ? 'Mask' : 'Reveal'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <h4 className="font-serif text-lg font-bold text-white mb-2 line-clamp-1">
                  {note.title}
                </h4>

                <div className={`relative ${isRevealed ? '' : 'filter blur-sm select-none'}`}>
                  <p className="font-serif italic text-stone-300 text-sm leading-relaxed line-clamp-3">
                    "{note.content}"
                  </p>
                </div>

                {!isRevealed && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center pointer-events-none">
                    <span className="glass-pill px-3 py-1 rounded-full text-xs font-serif text-white flex items-center gap-1.5 shadow-lg">
                      <Lock className="w-3.5 h-3.5 text-[#FF2E93]" />
                      <span>Tap to Read Letter</span>
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <MemoryModal
        memory={activeMemory}
        onClose={() => setActiveMemory(null)}
        onDelete={onDeleteMemory}
      />

      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMemory={onAddMemory}
      />
    </div>
  );
};
