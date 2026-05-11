import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use supabase-js directly — @supabase/ssr createBrowserClient hangs
// with the newer sb_publishable_ key format during auth initialization.
let _client: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  if (_client) return _client;
  _client = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
};
