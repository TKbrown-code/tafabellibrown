import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { storageAvailable } from "./storage";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** null when Supabase env vars are missing → the app runs in demo mode with seed data. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, { auth: { persistSession: storageAvailable(), autoRefreshToken: true } })
    : null;

export const isDemo = !supabase;
