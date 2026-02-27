import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string, fallback: string) => {
  try {
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://cfvfrfidmfegxhtljsxs.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdmZyZmlkbWZlZ3hodGxqc3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjI4ODMsImV4cCI6MjA4NzczODg4M30.62LkNjAkjnmoCknFYD0TeqSh3Xa13AuQX-cWjvDpA7w');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
