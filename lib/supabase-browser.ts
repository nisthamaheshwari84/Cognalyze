"use client";

import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseUrl =
  rawSupabaseUrl.startsWith("http://") || rawSupabaseUrl.startsWith("https://")
    ? rawSupabaseUrl
    : "https://placeholder.supabase.co";

const rawAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const supabaseAnonKey = rawAnonKey || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
