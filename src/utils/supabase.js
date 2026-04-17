import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dqzjujrwnfbtyjqxkady.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxemp1anJ3bmZidHlqcXhrYWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTEyOTMsImV4cCI6MjA5MTk2NzI5M30.QAImRf80ljBsENhWHM-S6_P4kiFmwxDlbn-n00UDp-4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
