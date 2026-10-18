import { getSupabaseClient } from './supabaseClient';
import { Memory, VaultUnlockState } from '../types/vault';

export type VaultActionType =
  | 'HEARTBEAT'
  | 'PARTNER_JOINED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'VAULT_UNLOCKED'
  | 'PANIC_LOCK'
  | 'NEW_MEMORY'
  | 'SYNC_PROFILE'
  | 'UNLOCK_REQUESTED'
  | 'UNLOCK_STATE_CHANGED'
  | 'PARTNER_LINKED';

export interface VaultMessage {
  type: VaultActionType;
  partnerId: 'partner1' | 'partner2';
  senderDeviceId: string;
  timestamp: number;
  payload?: any;
}

export type MessageHandler = (msg: VaultMessage) => void;

class RealtimeVaultManager {
  private roomCode: string = '';
  private currentRole: 'partner1' | 'partner2' = 'partner1';
  private deviceId: string = '';
  private handlers: Set<MessageHandler> = new Set();
  
  // Transports
  private ws: WebSocket | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;

  constructor() {
    // Generate persistent unique device ID for this browser
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('bondlock_device_uuid');
      if (!id) {
        id = `dev_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
        localStorage.setItem('bondlock_device_uuid', id);
      }
      this.deviceId = id;
    }
  }

  public initialize(roomCode: string, role: 'partner1' | 'partner2') {
    this.roomCode = roomCode.toUpperCase().trim();
    this.currentRole = role;

    this.cleanup();

    // 1. Setup global public internet WebSocket relay (works across different physical phones globally)
    this.connectGlobalWebSocket();

    // 2. Setup local BroadcastChannel (for multi-tab testing on same device)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.localBroadcastChannel = new BroadcastChannel(`bondlock_bc_${this.roomCode}`);
        this.localBroadcastChannel.onmessage = (event) => {
          if (event.data && event.data.senderDeviceId !== this.deviceId) {
            this.notifyHandlers(event.data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    // 3. Setup optional private Supabase Realtime channel if configured
    this.connectSupabase();

    // Start periodic heartbeat
    this.startHeartbeat();
  }

  private connectGlobalWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const topic = `bondlock-v2-${this.roomCode.toLowerCase()}`;
      const wsUrl = `wss://ntfy.sh/${topic}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Announce presence to other device
        this.broadcastMessage({
          type: 'PARTNER_JOINED',
          partnerId: this.currentRole,
          senderDeviceId: this.deviceId,
          timestamp: Date.now(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          // ntfy.sh wraps messages in an event object
          if (packet.event === 'message' && packet.message) {
            const vaultMsg: VaultMessage = JSON.parse(packet.message);
            // Ignore echoes from self
            if (vaultMsg.senderDeviceId !== this.deviceId) {
              this.notifyHandlers(vaultMsg);
            }
          }
        } catch {
          // Packet was not JSON, ignore
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect after 2 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connectGlobalWebSocket();
        }, 2500);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (err) {
      console.warn('WebSocket relay connection error:', err);
    }
  }

  private connectSupabase() {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        this.supabaseChannel = supabase.channel(`vault_${this.roomCode}`, {
          config: { broadcast: { self: false } },
        });

        this.supabaseChannel
          .on('broadcast', { event: 'vault_sync' }, (payload: any) => {
            if (payload?.payload && payload.payload.senderDeviceId !== this.deviceId) {
              this.notifyHandlers(payload.payload);
            }
          })
          .subscribe();
      } catch (e) {
        console.warn('Supabase subscription failed', e);
      }
    }
  }

  private startHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.broadcastMessage({
        type: 'HEARTBEAT',
        partnerId: this.currentRole,
        senderDeviceId: this.deviceId,
        timestamp: Date.now(),
      });
    }, 12000);
  }

  public getRole(): 'partner1' | 'partner2' {
    return this.currentRole;
  }

  public setRole(role: 'partner1' | 'partner2') {
    this.currentRole = role;
    this.broadcastMessage({
      type: 'PARTNER_JOINED',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
    });
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

  public async broadcastMessage(msg: VaultMessage) {
    // 1. Post to local BroadcastChannel
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage(msg);
      } catch (e) {
        // ignore
      }
    }

    // 2. Post to Global WebSocket Relay (ntfy.sh) via HTTPS POST
    try {
      const topic = `bondlock-v2-${this.roomCode.toLowerCase()}`;
      fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // 3. Post to Supabase if active
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'vault_sync',
          payload: msg,
        });
      } catch {
        // ignore
      }
    }
  }

  public sendConsent(approved: boolean) {
    this.broadcastMessage({
      type: approved ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
    });
  }

  public sendPanicLock() {
    this.broadcastMessage({
      type: 'PANIC_LOCK',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
    });
  }

  public sendNewMemory(memory: Memory) {
    this.broadcastMessage({
      type: 'NEW_MEMORY',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
      payload: memory,
    });
  }

  public sendSyncProfile(profile: any) {
    this.broadcastMessage({
      type: 'SYNC_PROFILE',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
      payload: profile,
    });
  }

  public sendUnlockRequest(state: VaultUnlockState) {
    this.broadcastMessage({
      type: 'UNLOCK_REQUESTED',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
      payload: { unlockState: state },
    });
  }

  public sendUnlockState(state: VaultUnlockState) {
    this.broadcastMessage({
      type: 'UNLOCK_STATE_CHANGED',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
      payload: { unlockState: state },
    });
  }

  public sendPartnerLinked(vaultId: string, inviteCode: string) {
    this.broadcastMessage({
      type: 'PARTNER_LINKED',
      partnerId: this.currentRole,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
      payload: { vaultId, inviteCode },
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
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.reconnectTimer);

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

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
