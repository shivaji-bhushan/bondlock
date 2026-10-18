import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Memory } from '../../types/vault';
import { MemoryCard } from './MemoryCard';
import { Heart, Search } from 'lucide-react';

interface MemoryGridProps {
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  globalBlur: boolean;
}

export const MemoryGrid: React.FC<MemoryGridProps> = ({
  memories,
  onSelectMemory,
  globalBlur,
}) => {
  if (memories.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center p-6 rounded-2xl glass-panel-subtle">
        <div className="w-12 h-12 rounded-full bg-rosegold-400/10 flex items-center justify-center text-rosegold-400 mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h4 className="font-serif text-xl text-stone-200 font-medium">
          No encrypted memories found
        </h4>
        <p className="text-xs text-stone-400 max-w-xs mt-1">
          Try selecting another category or click "+ Add Precious Moment" to seal your first shared secret.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
      <AnimatePresence>
        {memories.map((mem) => (
          <MemoryCard
            key={mem.id}
            memory={mem}
            onSelect={onSelectMemory}
            globalBlur={globalBlur}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
