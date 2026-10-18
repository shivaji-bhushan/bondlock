import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Upload, Image as ImageIcon, FileText, Mic, Sparkles, Check, Key, Shield, ArrowRight } from 'lucide-react';
import { Memory, MemoryType } from '../../types/vault';
import { generateEncryptionDigest, generateShamirSplit } from '../../utils/cryptoSim';
import { sound } from '../../utils/sound';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMemory: (memory: Memory) => void;
}

const photoPresets = [
  {
    name: 'Moonlit Beach',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Candlelight Dinner',
    url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Mountain Sunrise',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Rainy Cafe Stroll',
    url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=85',
  },
];

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onAddMemory,
}) => {
  const [type, setType] = useState<MemoryType>('photo');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState(photoPresets[0].url);
  const [tags, setTags] = useState('Secret, Forever');

  // Encryption simulation state
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionStep, setEncryptionStep] = useState(0);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEncryptAndSave = () => {
    if (!title.trim()) return;

    sound.playSoftClick();
    setIsEncrypting(true);
    setEncryptionStep(1);

    // Step 1: Ephemeral key generation
    setTimeout(() => {
      setEncryptionStep(2);
      sound.playBiometricScan();
    }, 500);

    // Step 2: Shamir polynomial split
    setTimeout(() => {
      setEncryptionStep(3);
    }, 1000);

    // Step 3: Payload encryption
    setTimeout(() => {
      setEncryptionStep(4);
      sound.playPartnerApproved();

      const split = generateShamirSplit();
      const digest = generateEncryptionDigest(title + content);

      const newMemory: Memory = {
        id: `mem-${Date.now()}`,
        type,
        title: title.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        location: location.trim() || undefined,
        content: content.trim() || undefined,
        mediaUrl: type === 'photo' ? mediaUrl : undefined,
        aspectRatio: 'landscape',
        audioDuration: type === 'audio' ? '01:45' : undefined,
        audioWaveform: type === 'audio' ? [25, 40, 70, 85, 60, 45, 80, 95, 60, 40, 75, 85, 50, 30] : undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        encryptedHash: digest.hash,
        cipherAlgorithm: 'AES-256-GCM + 2/2 SSS',
        shamirShares: [split.shareA.fingerprint, split.shareB.fingerprint],
        isBlurred: true,
        createdAt: Date.now(),
      };

      setTimeout(() => {
        setIsEncrypting(false);
        setEncryptionStep(0);
        onAddMemory(newMemory);
        onClose();
      }, 700);
    }, 1600);
  };

  const encryptionSteps = [
    { label: 'Initializing AES-256 Engine', detail: 'Generating cryptographically secure 256-bit symmetric cipher key' },
    { label: 'Shamir Secret Sharing Split', detail: 'Dividing master key into 2 polynomial shares: f(x) = ax + S' },
    { label: 'Encrypting Payload in Browser', detail: 'Applying authenticated GCM mode with ephemeral 96-bit IV' },
    { label: 'Vault Sealed Successfully', detail: 'Keys wiped from temporary memory; sealed into couple storage' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-obsidian-900 border border-rosegold-400/25 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rosegold-400/10 border border-rosegold-400/30 flex items-center justify-center text-rosegold-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-stone-100 font-semibold">
                  Add Precious Moment
                </h3>
                <p className="text-xs text-stone-400">
                  Client-side encrypted before saving to the couple locker
                </p>
              </div>
            </div>
            {!isEncrypting && (
              <button
                onClick={() => {
                  sound.playSoftClick();
                  onClose();
                }}
                className="p-2 rounded-full text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body Form or Encryption Progress View */}
          {isEncrypting ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              {/* Animated Glowing Ring */}
              <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-rosegold-400/20 border-t-rosegold-400 animate-spin" />
                <div className="w-16 h-16 rounded-full bg-obsidian-800 border border-rosegold-400/40 flex items-center justify-center text-rosegold-400 shadow-rosegold-glow">
                  <Shield className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <h4 className="font-serif text-xl text-rosegold-300 font-semibold mb-1">
                Encrypting with AES-256 before upload...
              </h4>
              <p className="text-xs text-stone-400 font-mono mb-6">
                Zero-Knowledge Proof: Zero plaintext transmitted
              </p>

              {/* Stepper Progress */}
              <div className="w-full max-w-md space-y-3 text-left">
                {encryptionSteps.map((s, idx) => {
                  const stepNum = idx + 1;
                  const isDone = encryptionStep > stepNum;
                  const isCurrent = encryptionStep === stepNum;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emeraldGlow/10 border-emeraldGlow/30 text-emeraldGlow'
                          : isCurrent
                            ? 'bg-rosegold-400/10 border-rosegold-400/40 text-rosegold-300 shadow-sm'
                            : 'bg-obsidian-850/50 border-white/5 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isDone
                              ? 'bg-emeraldGlow text-obsidian-950'
                              : isCurrent
                                ? 'bg-rosegold-400 text-obsidian-950 animate-pulse'
                                : 'bg-obsidian-800 text-stone-500'
                          }`}
                        >
                          {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : stepNum}
                        </div>
                        <span className="text-xs font-semibold">{s.label}</span>
                      </div>
                      <p className="text-[11px] font-mono text-stone-400 mt-1 pl-7">
                        {s.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Type Switcher */}
              <div className="flex rounded-xl bg-obsidian-800 p-1 border border-white/5">
                {[
                  { id: 'photo', label: 'Photo & Video', icon: ImageIcon },
                  { id: 'note', label: 'Secret Letter', icon: FileText },
                  { id: 'audio', label: 'Voice Memo', icon: Mic },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = type === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        sound.playSoftClick();
                        setType(item.id as MemoryType);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        isActive
                          ? 'bg-rosegold-400 text-obsidian-950 font-bold shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Memory Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Midnight Walk by the Shore"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 placeholder-stone-500 text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Florence, Italy"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 placeholder-stone-500 text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Photo Upload / Preset Selection */}
              {type === 'photo' && (
                <div>
                  <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                    Select Aesthetic Preset or Upload Custom Image
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {photoPresets.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          sound.playSoftClick();
                          setMediaUrl(p.url);
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                          mediaUrl === p.url ? 'border-rosegold-400 shadow-rosegold-subtle' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="relative mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-white/20 hover:border-rosegold-400/60 bg-obsidian-850 text-stone-400 hover:text-stone-200 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-rosegold-400" />
                      <span>Upload your own couple photo / file</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Note / Caption Content */}
              <div>
                <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  {type === 'note' ? 'Secret Love Letter *' : 'Intimate Caption'}
                </label>
                <textarea
                  rows={type === 'note' ? 4 : 2}
                  placeholder={type === 'note' ? 'Write words only the two of you should ever read...' : 'What did you feel in this moment?'}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 placeholder-stone-500 text-sm focus:outline-none transition-colors font-serif resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Anniversary, Travel, Secret"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-850 border border-white/10 focus:border-rosegold-400 text-stone-100 placeholder-stone-500 text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleEncryptAndSave}
                  disabled={!title.trim()}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                    title.trim()
                      ? 'bg-gradient-to-r from-rosegold-400 to-rosegold-500 text-obsidian-950 shadow-rosegold-glow hover:opacity-95'
                      : 'bg-obsidian-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Encrypt & Seal With Dual Key</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
