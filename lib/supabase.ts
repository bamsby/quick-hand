import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
}

// Simple in-memory storage for React Native (sufficient for MVP)
const inMemoryStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => {
    return inMemoryStorage.store[key] || null;
  },
  setItem: (key: string, value: string) => {
    inMemoryStorage.store[key] = value;
  },
  removeItem: (key: string) => {
    delete inMemoryStorage.store[key];
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: inMemoryStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    // Disable realtime to avoid Node.js polyfill issues in React Native
    params: {
      eventsPerSecond: 0,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

