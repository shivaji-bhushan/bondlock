import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, ShieldCheck, Key, Lock, Trash2, Download, Tag } from 'lucide-react';
import { Memory } from '../../types/vault';
import { AudioPlayer } from './AudioPlayer';
import { sound } from '../../utils/sound';

interface MemoryModalProps {
  memory: Memory | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memory,
  onClose,
  onDelete,
}) => {
  if (!memory) return null;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this precious memory? Both partners will lose access.')) {
      sound.playSoftClick();
      onDelete?.(memory.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-obsidian-900 border border-rosegold-400/30 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        >
          {/* Header Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-full bg-obsidian-900/80 backdrop-blur-md border border-white/10 text-stone-400 hover:text-panicRed hover:border-panicRed/40 transition-colors"
                title="Delete memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                sound.playSoftClick();
                onClose();
              }}
              className="p-2.5 rounded-full bg-obsidian-900/80 backdrop-blur-md border border-white/10 text-stone-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-5 sm:p-7">
            {/* Media presentation */}
            {memory.type === 'photo' && memory.mediaUrl && (
              <div className="relative rounded-2xl overflow-hidden bg-obsidian-950 mb-6 border border-white/10 shadow-xl max-h-[420px] flex items-center justify-center">
                <img
                  src={memory.mediaUrl}
                  alt={memory.title}
                  className="w-full h-auto max-h-[420px] object-contain rounded-2xl"
                />
              </div>
            )}

            {memory.type === 'audio' && (
              <div className="mb-6">
                <AudioPlayer waveform={memory.audioWaveform} duration={memory.audioDuration} title={memory.title} />
              </div>
            )}

            {/* Date & Location */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-rosegold-300/90 font-mono mb-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rosegold-400" />
                {memory.date}
              </span>
              {memory.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rosegold-400" />
                  {memory.location}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-100 font-bold tracking-wide mb-4">
              {memory.title}
            </h2>

            {/* Content / Love note body */}
            {memory.content && (
              <div className="bg-obsidian-850/80 rounded-2xl p-4 sm:p-5 border border-rosegold-400/15 mb-6">
                <p className="font-serif text-stone-200 text-base sm:text-lg leading-relaxed whitespace-pre-line italic">
                  {memory.content}
                </p>
              </div>
            )}

            {/* Tags */}
            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {memory.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-stone-300 text-xs font-sans"
                  >
                    <Tag className="w-3 h-3 text-rosegold-400/80" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Zero-Knowledge Decryption Certificate */}
            <div className="p-4 rounded-2xl bg-obsidian-950/90 border border-emeraldGlow/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emeraldGlow">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Decrypted in Browser RAM via 2-of-2 Shamir Keys</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400 bg-white/5 px-2 py-0.5 rounded">
                  {memory.cipherAlgorithm}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-stone-400">
                <div>
                  <span className="text-stone-500 block">Payload Cipher Hash:</span>
                  <span className="text-stone-300 truncate block">{memory.encryptedHash}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Key Reconstruction:</span>
                  <span className="text-emeraldGlow font-medium block">Lagrange Polynomial Verified</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Partner A Share:</span>
                  <span className="text-rosegold-300 truncate block">{memory.shamirShares[0]}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Partner B Share:</span>
                  <span className="text-rosegold-300 truncate block">{memory.shamirShares[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
