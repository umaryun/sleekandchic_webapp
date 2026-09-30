import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Use { prepare: false } for Supabase Transaction Pooler (port 6543)
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
