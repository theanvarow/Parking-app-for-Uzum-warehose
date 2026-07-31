import { createClient } from '@supabase/supabase-js';

// Reads Supabase Project URL and Anon Key from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
