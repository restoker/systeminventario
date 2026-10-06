import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import postgres from 'postgres';
// import * as schema from "../server/schema.ts";//TODO: descomentar cuando se quiere agregar datos mediamnte el seed, ya que el tsconfig necesita ser corregido para poder agregar datos mediante el comando pnpm run seed
// import * as schema from "../server/schema";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const client = postgres(databaseUrl, { prepare: false, ssl: false });
const db = drizzle({ client, relations });
// const db = drizzle({ client, relations });
// const db = drizzle(process.env.DATABASE_URL!, { schema, logger: true });

// if (!db) throw new Error('No hay ninguna base de datos conectada');
export default db;