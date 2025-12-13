import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zpaoicnlynovnbtndrqj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYW9pY25seW5vdm5idG5kcnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzc1MjgsImV4cCI6MjA3NTc1MzUyOH0.KVxexaMaLiyDDACbyb0pa53_KeW1kt4YqnapTaVjNXA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);