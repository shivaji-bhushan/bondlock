import React, { useState, useEffect } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';
import { sound } from '../../utils/sound';

interface AudioPlayerProps {
  waveform?: number[];
  duration?: string;
  title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  waveform = [30, 45, 60, 40, 75, 90, 65, 80, 50, 40, 70, 85, 95, 60, 40, 55, 75, 90, 80, 60, 50, 40, 65, 80, 70, 45, 30],
  duration = '02:18',
  title,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSoftClick();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full bg-obsidian-900/90 rounded-2xl p-3 border border-rosegold-400/20">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-rosegold-400 text-obsidian-950 shadow-rosegold-glow'
              : 'bg-rosegold-400/20 text-rosegold-300 hover:bg-rosegold-400/30'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Waveform Visualization */}
        <div className="flex-1 flex items-center gap-1 h-9 px-1 overflow-hidden">
          {waveform.map((height, i) => {
            const barProgress = (i / waveform.length) * 100;
            const isPassed = barProgress <= currentProgress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-150"
                style={{
                  height: `${isPlaying ? Math.max(20, (height * (0.6 + Math.sin(Date.now() / 200 + i) * 0.4))) : height}%`,
                  backgroundColor: isPassed ? '#E0A96D' : 'rgba(224, 169, 109, 0.25)',
                }}
              />
            );
          })}
        </div>

        {/* Duration badge */}
        <div className="text-[11px] font-mono text-rosegold-300/80 whitespace-nowrap">
          {duration}
        </div>
      </div>
    </div>
  );
};
