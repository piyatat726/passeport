import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use supabase-js directly — @supabase/ssr createBrowserClient hangs
// with the newer sb_publishable_ key format during auth initialization.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, "public", any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createClient = (): SupabaseClient<any, "public", any> => {
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
