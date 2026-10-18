import React from 'react';

interface ShamirGraphProps {
  partner1Name: string;
  partner2Name: string;
}

export const ShamirGraph: React.FC<ShamirGraphProps> = ({
  partner1Name,
  partner2Name,
}) => {
  return (
    <div className="w-full bg-obsidian-950/80 rounded-2xl p-4 border border-rosegold-400/20">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-mono text-rosegold-300 font-semibold">
          (k, n) = (2, 2) Polynomial Curve
        </span>
        <span className="font-mono text-emeraldGlow bg-emeraldGlow/10 px-2 py-0.5 rounded border border-emeraldGlow/25 text-[10px]">
          f(x) = ax + S mod p
        </span>
      </div>

      {/* SVG Polynomial Curve Visualizer */}
      <div className="relative aspect-[16/9] w-full bg-obsidian-900/60 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0A96D" />
              <stop offset="50%" stopColor="#F5D6B4" />
              <stop offset="100%" stopColor="#4ECCA3" />
            </linearGradient>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Axes */}
          <line x1="40" y1="170" x2="380" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="40" y1="170" x2="40" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="365" y="185" fill="#888" fontSize="10" fontFamily="monospace">x</text>
          <text x="25" y="30" fill="#888" fontSize="10" fontFamily="monospace">f(x)</text>

          {/* Hypothetical other lines when only 1 point is known (showing infinite ambiguity) */}
          <line x1="40" y1="60" x2="280" y2="150" stroke="rgba(224, 169, 109, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="40" y1="150" x2="280" y2="70" stroke="rgba(224, 169, 109, 0.15)" strokeWidth="1" strokeDasharray="3 3" />

          {/* The true shared secret line connecting (1, f(1)) and (2, f(2)) */}
          <line x1="40" y1="125" x2="340" y2="45" stroke="url(#curveGradient)" strokeWidth="2.5" />

          {/* Intercept Point (0, S) - Master Vault Key */}
          <circle cx="40" cy="125" r="5" fill="#FF4B72" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="50" y="128" fill="#FF4B72" fontSize="10" fontFamily="monospace" fontWeight="bold">
            S = f(0) [Master Key]
          </text>

          {/* Point 1: (1, f(1)) Partner 1 */}
          <line x1="150" y1="170" x2="150" y2="95" stroke="rgba(224, 169, 109, 0.3)" strokeDasharray="2 2" />
          <circle cx="150" cy="95" r="6" fill="#E0A96D" stroke="#0B0813" strokeWidth="2" />
          <text x="120" y="80" fill="#E0A96D" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
            (1, y₁) • {partner1Name}
          </text>

          {/* Point 2: (2, f(2)) Partner 2 */}
          <line x1="280" y1="170" x2="280" y2="60" stroke="rgba(78, 204, 163, 0.3)" strokeDasharray="2 2" />
          <circle cx="280" cy="60" r="6" fill="#4ECCA3" stroke="#0B0813" strokeWidth="2" />
          <text x="250" y="45" fill="#4ECCA3" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
            (2, y₂) • {partner2Name}
          </text>
        </svg>
      </div>

      <div className="mt-3 text-[11px] text-stone-400 leading-relaxed font-sans">
        <p>
          <strong className="text-stone-200">Information-Theoretic Security:</strong> A single point $(1, y_1)$ lies on infinitely many possible lines. Knowing one partner's share reveals precisely <span className="text-rosegold-300 font-semibold">0 bits</span> of the master decryption key $S$. Only when both points unite can the line's intercept $f(0)$ be computed.
        </p>
      </div>
    </div>
  );
};
