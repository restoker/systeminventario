import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/node-postgres';
// import postgres from 'postgres';
import { relations } from './relations';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

// const client = postgres(databaseUrl, { prepare: false, ssl: false });
// const db = drizzle(client);
const db = drizzle(databaseUrl, { relations });
// const db = drizzle(process.env.DATABASE_URL!, { schema, logger: true });

// if (!db) throw new Error('No hay ninguna base de datos conectada');
export default db;