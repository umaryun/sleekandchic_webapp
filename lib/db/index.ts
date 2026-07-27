import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

// Use { prepare: false } for Supabase Transaction Pooler (port 6543)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
