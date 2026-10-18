export type MemoryType = 'photo' | 'video' | 'note' | 'audio';

export interface Partner {
  id: 'partner1' | 'partner2';
  name: string;
  avatar: string;
  role: string;
  biometricType: 'Face ID' | 'Touch ID';
  deviceInfo: string;
  keyShareId: string;
}

export interface Memory {
  id: string;
  type: MemoryType;
  title: string;
  date: string;
  location?: string;
  content?: string;
  mediaUrl?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  audioDuration?: string;
  audioWaveform?: number[];
  tags: string[];
  encryptedHash: string;
  cipherAlgorithm: string;
  shamirShares: [string, string]; // Share A and Share B digests
  isBlurred?: boolean;
  createdAt: number;
}

export interface CoupleProfile {
  partner1: Partner;
  partner2: Partner;
  anniversaryDate: string; // YYYY-MM-DD
  vaultName: string;
}

export interface SecuritySettings {
  antiScreenshotWatermark: boolean;
  autoLockMinutes: number;
  duressPinConfigured: boolean;
  biometricRequired: boolean;
  blurByDefault: boolean;
  soundEnabled: boolean;
}

export interface DualApprovalState {
  partner1Approved: boolean;
  partner2Approved: boolean;
  partner1ApprovedAt?: number;
  partner2ApprovedAt?: number;
  expiresInSeconds: number;
}
