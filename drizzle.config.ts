import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
config({ path: '.env' });

export default defineConfig({
    out: './drizzle',
    schema: "./server/schema",
    dialect: "postgresql",
    // dbCredentials: {
    //     host: process.env.DB_HOST!,
    //     port: +process.env.DB_PORT!,
    //     user: process.env.DB_USER!,
    //     password: process.env.DB_PASSWORD!,
    //     database: process.env.DB_NAME!,
    //     ssl: false,
    // }
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    }
});