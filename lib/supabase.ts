import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

// Public client (anon key) — for client-side storage access
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (service role key) — for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
