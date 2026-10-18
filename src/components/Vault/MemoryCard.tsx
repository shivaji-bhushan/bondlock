import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, MapPin, Calendar, Lock, Unlock, FileText, Image as ImageIcon, Mic, Sparkles } from 'lucide-react';
import { Memory } from '../../types/vault';
import { AudioPlayer } from './AudioPlayer';
import { sound } from '../../utils/sound';

interface MemoryCardProps {
  memory: Memory;
  onSelect: (memory: Memory) => void;
  globalBlur: boolean;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onSelect,
  globalBlur,
}) => {
  // Card-specific blur state, initialized from globalBlur
  const [isLocallyUnblurred, setIsLocallyUnblurred] = useState(false);

  // If globalBlur is true, it remains blurred unless locally unblurred
  // If globalBlur is false, it is unblurred
  const isBlurred = globalBlur ? !isLocallyUnblurred : false;

  const toggleLocalBlur = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSoftClick();
    setIsLocallyUnblurred(!isLocallyUnblurred);
  };

  const getIcon = () => {
    switch (memory.type) {
      case 'photo':
        return <ImageIcon className="w-3.5 h-3.5 text-rosegold-400" />;
      case 'note':
        return <FileText className="w-3.5 h-3.5 text-rosegold-400" />;
      case 'audio':
        return <Mic className="w-3.5 h-3.5 text-rosegold-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-rosegold-400" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(memory)}
      className="glass-card-interactive rounded-2xl overflow-hidden cursor-pointer flex flex-col group relative"
    >
      {/* Top Media / Thumbnail Section */}
      {memory.type === 'photo' && memory.mediaUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-obsidian-950">
          <img
            src={memory.mediaUrl}
            alt={memory.title}
            className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
              isBlurred ? 'blur-xl scale-110' : 'blur-none scale-100'
            }`}
          />

          {/* Privacy Frosting Overlay */}
          {isBlurred && (
            <div className="absolute inset-0 bg-obsidian-950/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-obsidian-900/80 border border-rosegold-400/30 flex items-center justify-center text-rosegold-300 mb-2 shadow-lg">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs font-serif text-stone-200">Tap or Hover to Reveal</p>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">Dual-Key Protected</p>
            </div>
          )}

          {/* Quick Reveal Toggle Floating Button */}
          <button
            onClick={toggleLocalBlur}
            className="absolute top-3 right-3 p-2 rounded-full bg-obsidian-900/80 backdrop-blur-md border border-white/10 text-stone-300 hover:text-rosegold-300 transition-colors z-10"
            title={isBlurred ? 'Reveal photo' : 'Mask photo'}
          >
            {isBlurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Audio Memo Specific Block */}
      {memory.type === 'audio' && (
        <div className="p-4 pb-2 bg-gradient-to-b from-obsidian-850 to-obsidian-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-emeraldGlow flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emeraldGlow animate-pulse" />
              Voice Memo Decrypted
            </span>
            <button
              onClick={toggleLocalBlur}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
            >
              {isBlurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <AudioPlayer waveform={memory.audioWaveform} duration={memory.audioDuration} title={memory.title} />
        </div>
      )}

      {/* Secret Note Specific Preview */}
      {memory.type === 'note' && (
        <div className={`p-4 bg-gradient-to-br from-obsidian-850 via-obsidian-800 to-obsidian-850 relative ${
          isBlurred ? 'backdrop-blur-lg' : ''
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-rosegold-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Secret Sealed Letter
            </span>
            <button
              onClick={toggleLocalBlur}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
            >
              {isBlurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className={`relative transition-all duration-300 ${isBlurred ? 'filter blur-sm select-none' : ''}`}>
            <p className="font-serif italic text-stone-300 text-sm leading-relaxed line-clamp-3">
              "{memory.content}"
            </p>
          </div>

          {isBlurred && (
            <div className="absolute inset-0 bg-obsidian-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <Lock className="w-5 h-5 text-rosegold-400 mb-1" />
              <span className="text-xs font-serif text-stone-300">Tap to Read Secret</span>
            </div>
          )}
        </div>
      )}

      {/* Card Body & Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Tag and Category Pill */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-rosegold-300 font-mono">
              {getIcon()}
              <span className="capitalize">{memory.type}</span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{memory.date}</span>
            </div>
          </div>

          {/* Title */}
          <h4 className="font-serif text-lg text-stone-100 font-semibold tracking-wide group-hover:text-rosegold-300 transition-colors line-clamp-1">
            {memory.title}
          </h4>

          {/* Location */}
          {memory.location && (
            <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1 line-clamp-1">
              <MapPin className="w-3 h-3 text-rosegold-400/70" />
              <span>{memory.location}</span>
            </div>
          )}

          {/* Excerpt if photo */}
          {memory.type === 'photo' && memory.content && (
            <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
              {memory.content}
            </p>
          )}
        </div>

        {/* Bottom tags & Cryptographic Badge */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {memory.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-white/5 text-stone-400 text-[10px] font-sans"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="text-[10px] font-mono text-emeraldGlow/80 flex items-center gap-1 bg-emeraldGlow/5 px-2 py-0.5 rounded border border-emeraldGlow/20">
            <Unlock className="w-2.5 h-2.5" />
            <span>2/2 Decrypted</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
