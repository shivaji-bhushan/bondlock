import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_STORAGE_KEY = 'bondlock_custom_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

// Default fallback demo credentials or environment variables
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || '';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey, connected: true };
      }
    }
  } catch (e) {
    console.error('Error reading saved Supabase config', e);
  }

  return {
    url: defaultUrl,
    anonKey: defaultKey,
    connected: Boolean(defaultUrl && defaultKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  try {
    localStorage.setItem(
      SUPABASE_STORAGE_KEY,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim(), connected: true })
    );
  } catch (e) {
    console.error('Error saving Supabase config', e);
  }
}

export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_STORAGE_KEY);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.error('Failed to create Supabase client', e);
      return null;
    }
  }

  return supabaseInstance;
}
