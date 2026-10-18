# 💍 BondLock — Couples' Zero-Knowledge Private Locker

> **Ultra-private digital vault for couples where stored precious moments cannot be unlocked by one person alone.**
> Both partners must grant access from their respective devices simultaneously to decrypt and view the vault (2-of-2 Shamir Secret Sharing scheme).

🌐 **Live Demo:** [https://bondlock.vercel.app](https://bondlock.vercel.app)

---

## ✨ Features

- **Dual-Approval Biometric Lock Screen**:
  - Interlocking halves of a glowing ring/key that merge with Framer Motion when both partners authorize.
  - Interactive capacitive radar scan simulations (Face ID & Touch ID).
  - 30-second security consent countdown window.
  - Procedural Web Audio API luxury harmonic unlock chords & rose-gold confetti burst.
  - Dual-Device Simulator mode for testing remote authorization across two physical phones.

- **Precious Moments Feed**:
  - Filter tabs: *Photos & Videos*, *Secret Notes*, *Audio Memos*, *Milestones*.
  - Privacy blur-to-reveal on hover or tap.
  - Interactive voice memo player with animated audio waveforms.
  - Mock client-side AES-256-GCM encryption stepper when sealing new moments.

- **Security & Trust Architecture**:
  - Mathematical visualizer for $(k, n) = (2, 2)$ Shamir Secret Sharing polynomial curve ($f(x) = ax + S \pmod p$).
  - Anti-Screenshot Protection: dynamic holographic watermark layer + shoulder-surfing window-blur privacy blackout.
  - Emergency **Freeze Vault** duress lockdown.
  - Printable 12-word split emergency paper recovery seed sheets for Partner A and Partner B.

- **Mobile-First UX Inspired by Intimate Luxury**:
  - Velvet mulberry background (`#120317`), neon magenta accents (`#FF2E93` ➔ `#A855F7`), and frosted glass cards.
  - 5-tab native mobile bottom navigation dock.
  - Toggle between **Mobile Phone Frame**, **3-Device Panorama Mode**, and **Fluid Desktop View**.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Confetti**: Canvas-Confetti
- **Audio**: Procedural Web Audio API (Zero external MP3 dependencies)
- **Deployment**: Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Shivaa1303x/bondlock.git

# Navigate to project directory
cd bondlock

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 🔒 Cryptographic Concept

BondLock relies on an information-theoretic $(k, n) = (2, 2)$ threshold scheme:
- A secret master key $S$ is encoded as the $y$-intercept $f(0) = S$ of a 1st-degree polynomial $f(x) = ax + S \pmod p$.
- Partner A holds $(1, f(1))$ and Partner B holds $(2, f(2))$.
- Knowing only 1 point leaves an infinite family of valid lines passing through it, mathematically revealing **0 bits of information** about $S$.
- Only when both points unite can the intercept $f(0)$ be computed via Lagrange interpolation.

---

## 📄 License

MIT © Shivaa1303x
