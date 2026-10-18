import React from 'react';
import { Home, Compass, Heart, MessageCircle, User, Shield } from 'lucide-react';
import { sound } from '../../utils/sound';

export type TabType = 'home' | 'explore' | 'lock' | 'notes' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isUnlocked: boolean;
  onPanicLock?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  isUnlocked,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'lock', label: isUnlocked ? 'Locker' : 'Unlock', icon: Heart, isCenter: true },
    { id: 'notes', label: 'Letters', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="w-full bg-[#16051C]/90 backdrop-blur-xl border-t border-white/10 px-4 py-2 select-none z-30">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playSoftClick();
                  onSelectTab(tab.id as TabType);
                }}
                className="relative -top-4 flex flex-col items-center group"
              >
                <div
                  className={`w-13 h-13 rounded-full flex items-center justify-center p-3 transition-all duration-300 ${
                    isActive
                      ? 'btn-neon-pink scale-110 shadow-pink-glow text-white'
                      : 'bg-gradient-to-tr from-[#3D0C45] to-[#E11D74] text-white/90 hover:scale-105 shadow-lg border border-white/20'
                  }`}
                >
                  <Icon className="w-6 h-6 fill-current" />
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    isActive ? 'text-[#FF4D9D] font-bold' : 'text-stone-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playSoftClick();
                onSelectTab(tab.id as TabType);
              }}
              className="flex flex-col items-center justify-center py-1 px-2 relative transition-all group"
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#FF4D9D] scale-110'
                    : 'text-stone-400 group-hover:text-stone-200'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] tracking-tight transition-colors ${
                  isActive ? 'text-[#FF4D9D] font-bold' : 'text-stone-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#FF4D9D] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
