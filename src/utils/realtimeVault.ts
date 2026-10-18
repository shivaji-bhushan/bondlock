import { getSupabaseClient } from './supabaseClient';
import { Memory } from '../types/vault';

export type VaultActionType =
  | 'HEARTBEAT'
  | 'PARTNER_JOINED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'VAULT_UNLOCKED'
  | 'PANIC_LOCK'
  | 'NEW_MEMORY';

export interface VaultMessage {
  type: VaultActionType;
  partnerId: 'partner1' | 'partner2';
  timestamp: number;
  payload?: any;
}

export type MessageHandler = (msg: VaultMessage) => void;

class RealtimeVaultManager {
  private roomCode: string = '';
  private currentRole: 'partner1' | 'partner2' = 'partner1';
  private handlers: Set<MessageHandler> = new Set();
  private localBroadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private isConnected: boolean = false;

  public initialize(roomCode: string, role: 'partner1' | 'partner2') {
    this.roomCode = roomCode;
    this.currentRole = role;

    // 1. Setup local BroadcastChannel (for multi-tab / same-network fallback)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        if (this.localBroadcastChannel) {
          this.localBroadcastChannel.close();
        }
        this.localBroadcastChannel = new BroadcastChannel(`bondlock_room_${roomCode}`);
        this.localBroadcastChannel.onmessage = (event) => {
          this.notifyHandlers(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // 2. Setup Supabase Realtime channel (for true internet cross-device sync)
    const supabase = getSupabaseClient();
    if (supabase) {
      if (this.supabaseChannel) {
        supabase.removeChannel(this.supabaseChannel);
      }

      this.supabaseChannel = supabase.channel(`vault_${roomCode}`, {
        config: {
          broadcast: { self: false },
        },
      });

      this.supabaseChannel
        .on('broadcast', { event: 'vault_sync' }, (payload: any) => {
          if (payload && payload.payload) {
            this.notifyHandlers(payload.payload);
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.broadcastMessage({
              type: 'PARTNER_JOINED',
              partnerId: this.currentRole,
              timestamp: Date.now(),
            });
          }
        });
    }

    this.isConnected = true;

    // Announce presence
    this.broadcastMessage({
      type: 'PARTNER_JOINED',
      partnerId: this.currentRole,
      timestamp: Date.now(),
    });
  }

  public getRole(): 'partner1' | 'partner2' {
    return this.currentRole;
  }

  public setRole(role: 'partner1' | 'partner2') {
    this.currentRole = role;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public broadcastMessage(msg: VaultMessage) {
    // 1. Send via local broadcast
    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage(msg);
    }

    // 2. Send via Supabase Realtime if subscribed
    if (this.supabaseChannel && this.isConnected) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'vault_sync',
        payload: msg,
      });
    }
  }

  public sendConsent(approved: boolean) {
    this.broadcastMessage({
      type: approved ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      partnerId: this.currentRole,
      timestamp: Date.now(),
    });
  }

  public sendPanicLock() {
    this.broadcastMessage({
      type: 'PANIC_LOCK',
      partnerId: this.currentRole,
      timestamp: Date.now(),
    });
  }

  public sendNewMemory(memory: Memory) {
    this.broadcastMessage({
      type: 'NEW_MEMORY',
      partnerId: this.currentRole,
      timestamp: Date.now(),
      payload: memory,
    });
  }

  private notifyHandlers(msg: VaultMessage) {
    this.handlers.forEach((handler) => {
      try {
        handler(msg);
      } catch (err) {
        console.error('Error in realtime handler', err);
      }
    });
  }

  public cleanup() {
    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.close();
      this.localBroadcastChannel = null;
    }
    const supabase = getSupabaseClient();
    if (supabase && this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
    this.isConnected = false;
  }
}

export const realtimeVault = new RealtimeVaultManager();
