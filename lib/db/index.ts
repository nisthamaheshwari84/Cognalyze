import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

// Lazy singleton client
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    if (!connectionString) {
      // Return a safe mock or error if attempting DB operations in an unconfigured environment
      throw new Error(
        "DATABASE_URL or POSTGRES_URL is not configured. Please set the database connection string in .env.local."
      );
    }
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

export { schema };
