import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

interface WatermarkLayerProps {
  partner1Name: string;
  partner2Name: string;
  active: boolean;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({
  partner1Name,
  partner2Name,
  active,
}) => {
  const [timestamp, setTimestamp] = useState<string>('');
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Shoulder-surfing / screenshot guard on window blur / visibility change
  useEffect(() => {
    if (!active) return;
    const handleBlur = () => setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);
    const handleVisibility = () => {
      if (document.hidden) setIsWindowBlurred(true);
      else setIsWindowBlurred(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      {/* Dynamic Watermark Grid */}
      <div 
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden opacity-10 select-none"
        aria-hidden="true"
      >
        <div className="absolute -inset-[100%] flex flex-wrap gap-x-20 gap-y-16 -rotate-12 items-center justify-center font-mono text-[11px] text-rosegold-300 font-semibold tracking-widest uppercase">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="whitespace-nowrap flex items-center gap-2">
              <span>{partner1Name} & {partner2Name}</span>
              <span>•</span>
              <span>BONDLOCK 2/2 SSS</span>
              <span>•</span>
              <span>{timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Focus loss blackout privacy shield */}
      {isWindowBlurred && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none">
          <div className="w-16 h-16 rounded-full bg-rosegold-400/10 border border-rosegold-400/30 flex items-center justify-center text-rosegold-400 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl text-stone-100 font-semibold tracking-wide">
            Privacy Shield Activated
          </h3>
          <p className="text-stone-400 text-sm max-w-sm mt-2 font-sans">
            Screen protected against shoulder surfing and background capture. Click anywhere or return focus to resume.
          </p>
          <button
            onClick={() => setIsWindowBlurred(false)}
            className="mt-6 px-6 py-2 rounded-full bg-rosegold-400/20 border border-rosegold-400/40 text-rosegold-300 text-sm font-medium hover:bg-rosegold-400/30 transition-colors"
          >
            Resume Session
          </button>
        </div>
      )}
    </>
  );
};
