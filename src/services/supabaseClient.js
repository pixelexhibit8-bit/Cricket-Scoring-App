import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gwgshbwxqhcwgkpaykin.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Z3NoYnd4cWhjd2drcGF5a2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzAyODIsImV4cCI6MjEwMTYwNjI4Mn0._vMBPD9dGvnXvckqWC-eGP-Fe-0aBgflX9hVrRV7_kU';

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const isSupabaseConfigured = () => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL !== 'https://your-supabase-project.supabase.co' &&
    SUPABASE_ANON_KEY !== 'your-anon-key'
  );
};

// Official Supabase JS client — supports WebSocket Realtime
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } },
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

// Backward-compatible alias for existing code
export const supabaseClient = {
  from: (table) => {
    if (!supabase) {
      return {
        select: async () => ({ data: [], error: null }),
        upsert: async () => ({ data: null, error: null }),
      };
    }
    return supabase.from(table);
  }
};
